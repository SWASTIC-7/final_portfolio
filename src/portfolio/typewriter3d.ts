/*
 * Vintage typewriter, built procedurally with three.js.
 *
 * Ported from the design canvas, which shipped it against three.js r149. World units are
 * page pixels: the DOM page is laid into the scene's paper plane, which is kept perpendicular
 * to the camera, so a 2D translate + scale on the page lines up with the 3D render exactly.
 *
 * The scene renders twice per frame into an offscreen WebGL canvas: the BACK layer (body,
 * platen, carriage) is copied to a canvas behind the page, the FRONT layer (deck, keys,
 * typebar, paper bail) to a canvas in front of it. That is what lets the DOM sheet of paper
 * sit *inside* the machine.
 *
 * r149 -> r181 changes applied here:
 *  - texture.encoding / renderer.outputEncoding  -> texture.colorSpace / outputColorSpace
 *  - legacy lighting was removed in r165; under physically based light units, directional and
 *    hemisphere intensities are multiplied by PI to keep the r149 look (LEGACY_LIGHT_SCALE).
 */
import {
  ACESFilmicToneMapping,
  BackSide,
  BoxGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  RepeatWrapping,
  RingGeometry,
  Scene,
  Shape,
  ShadowMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import type { BufferGeometry, Material, Texture } from 'three'

const DEG = Math.PI / 180
const TILT = 18 * DEG
const BACK = 1
const FRONT = 2
const LEGACY_LIGHT_SCALE = Math.PI

export interface TypewriterOptions {
  W: number
  H: number
  dpr: number
  /** Width of the DOM sheet of paper, in CSS px. */
  pw: number
  /** Horizontal offset from the paper's centre to the first typed character. */
  paperOffsetX: number
}

export interface TypewriterFrame {
  /** Page-to-screen zoom. */
  k: number
  /** Camera target offsets along the paper's right / up axes. */
  Cr: number
  Cu: number
  /** Carriage travel. */
  cx: number
  /** Platen rotation. */
  rot: number
  /** Typebar angle; null = at rest. */
  a: number | null
  /** Ribbon vibrator lift, 0..1. */
  lift: number
}

export interface Typewriter {
  setFrame(f: TypewriterFrame): void
  render(back: CanvasRenderingContext2D, front: CanvasRenderingContext2D): void
  resize(w: number, h: number, dpr?: number): void
  dispose(): void
  restA: number
  strikeA: number
}

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

interface Textures {
  enamel: CanvasTexture
  grime: CanvasTexture
  deck: CanvasTexture
  cover: CanvasTexture
  scale: CanvasTexture
  rule: CanvasTexture
  keys: Record<string, CanvasTexture>
}

function srgb(t: CanvasTexture) {
  t.colorSpace = SRGBColorSpace
  return t
}

function makeTextures(doc: Document): Textures {
  const canvas = (w: number, h: number) => {
    const c = doc.createElement('canvas')
    c.width = w
    c.height = h
    return c
  }
  const ctx2d = (c: HTMLCanvasElement) => c.getContext('2d') as CanvasRenderingContext2D
  // A soft radial blot, wrapped around the tile edges so repeating textures stay seamless.
  const blot = (ctx: CanvasRenderingContext2D, S: number, x: number, y: number, rad: number, rgb: string, a: number) => {
    for (let ox = -1; ox <= 1; ox++)
      for (let oy = -1; oy <= 1; oy++) {
        const px = x + ox * S
        const py = y + oy * S
        if (px + rad < 0 || px - rad > S || py + rad < 0 || py - rad > S) continue
        const g = ctx.createRadialGradient(px, py, 0, px, py, rad)
        g.addColorStop(0, 'rgba(' + rgb + ',' + a.toFixed(3) + ')')
        g.addColorStop(1, 'rgba(' + rgb + ',0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(px, py, rad, 0, 6.2832)
        ctx.fill()
      }
  }

  // Worn black enamel.
  const ec = canvas(1024, 1024)
  const e = ctx2d(ec)
  const r1 = rng(11)
  e.fillStyle = '#15120f'
  e.fillRect(0, 0, 1024, 1024)
  for (let i = 0; i < 46; i++) blot(e, 1024, r1() * 1024, r1() * 1024, 60 + r1() * 160, r1() < 0.5 ? '40,33,26' : '6,5,4', 0.1 + r1() * 0.14)
  for (let c0 = 0; c0 < 16; c0++) {
    const cx = r1() * 1024
    const cy = r1() * 1024
    const n = 5 + Math.floor(r1() * 12)
    const spread = 20 + r1() * 70
    for (let j = 0; j < n; j++) {
      const an = r1() * 6.2832
      const d = r1() * spread
      blot(e, 1024, cx + Math.cos(an) * d, cy + Math.sin(an) * d, 4 + r1() * 20, r1() < 0.8 ? '66,40,22' : '88,56,30', 0.12 + r1() * 0.26)
    }
  }
  for (let k = 0; k < 1800; k++) {
    e.fillStyle = 'rgba(150,138,118,' + (0.03 + r1() * 0.08).toFixed(3) + ')'
    e.fillRect(r1() * 1024, r1() * 1024, 0.8 + r1() * 1.4, 0.8 + r1() * 1.4)
  }
  for (let q = 0; q < 70; q++) {
    const sx = r1() * 1024
    const sy = r1() * 1024
    const len = 12 + r1() * 80
    const ang = r1() * 6.2832
    e.strokeStyle = 'rgba(156,144,122,' + (0.06 + r1() * 0.13).toFixed(3) + ')'
    e.lineWidth = 0.5 + r1() * 0.9
    e.beginPath()
    e.moveTo(sx, sy)
    e.lineTo(sx + Math.cos(ang) * len, sy + Math.sin(ang) * len)
    e.stroke()
  }
  const enamel = srgb(new CanvasTexture(ec))
  enamel.wrapS = enamel.wrapT = RepeatWrapping

  // Grime: a linear (non-colour) map used for roughness and bump.
  const gc = canvas(512, 512)
  const g2 = ctx2d(gc)
  const r5 = rng(23)
  g2.fillStyle = '#d6d6d6'
  g2.fillRect(0, 0, 512, 512)
  for (let m = 0; m < 70; m++) blot(g2, 512, r5() * 512, r5() * 512, 14 + r5() * 70, r5() < 0.5 ? '255,255,255' : '110,110,110', 0.12 + r5() * 0.22)
  for (let m2 = 0; m2 < 1800; m2++) {
    const v = r5() < 0.5 ? 255 : 90
    g2.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (0.05 + r5() * 0.2).toFixed(3) + ')'
    g2.fillRect(r5() * 512, r5() * 512, 1 + r5() * 2, 1 + r5() * 2)
  }
  const grime = new CanvasTexture(gc)
  grime.wrapS = grime.wrapT = RepeatWrapping

  const rr = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }

  // Deck decal: gold pinstripes, rust spots, chipped paint.
  const DW = 2048
  const DH = 836
  const dc = canvas(DW, DH)
  const d2 = ctx2d(dc)
  const r2 = rng(19)
  for (let w0 = 0; w0 < 300; w0++) {
    const edge = r2() < 0.82
    let x: number
    let y: number
    if (edge) {
      if (r2() < 0.5) {
        x = r2() < 0.5 ? r2() * 70 : DW - r2() * 70
        y = r2() * DH
      } else {
        x = r2() * DW
        y = r2() < 0.5 ? r2() * 46 : DH - r2() * 46
      }
    } else {
      x = r2() * DW
      y = r2() * DH
    }
    blot(d2, 99999, x, y, 4 + r2() * 20, r2() < 0.75 ? '80,52,30' : '112,98,80', 0.07 + r2() * 0.2)
  }
  d2.strokeStyle = 'rgba(198,156,84,0.78)'
  d2.lineWidth = 3
  rr(d2, 70, 62, DW - 140, DH - 124, 48)
  d2.stroke()
  d2.strokeStyle = 'rgba(198,156,84,0.48)'
  d2.lineWidth = 1.5
  rr(d2, 88, 80, DW - 176, DH - 160, 38)
  d2.stroke()
  d2.globalCompositeOperation = 'destination-out'
  for (let er = 0; er < 150; er++) {
    d2.fillStyle = 'rgba(0,0,0,' + (0.35 + r2() * 0.65).toFixed(3) + ')'
    d2.beginPath()
    d2.arc(r2() * DW, r2() * DH, 2 + r2() * 13, 0, 6.2832)
    d2.fill()
  }
  d2.globalCompositeOperation = 'source-over'
  const deck = srgb(new CanvasTexture(dc))

  // Spool cover decal.
  const cc = canvas(512, 512)
  const c2 = ctx2d(cc)
  const r3 = rng(31)
  c2.save()
  c2.beginPath()
  c2.arc(256, 256, 254, 0, 6.2832)
  c2.clip()
  for (let cv = 0; cv < 120; cv++) {
    const an2 = r3() * 6.2832
    const rd = r3() < 0.75 ? 205 + r3() * 50 : r3() * 205
    blot(c2, 99999, 256 + Math.cos(an2) * rd, 256 + Math.sin(an2) * rd, 4 + r3() * 18, r3() < 0.8 ? '84,54,30' : '118,104,84', 0.09 + r3() * 0.24)
  }
  for (let arc = 0; arc < 26; arc++) {
    c2.strokeStyle = 'rgba(170,158,136,' + (0.05 + r3() * 0.1).toFixed(3) + ')'
    c2.lineWidth = 0.6 + r3()
    const a0 = r3() * 6.2832
    c2.beginPath()
    c2.arc(256, 256, 40 + r3() * 200, a0, a0 + 0.2 + r3() * 0.9)
    c2.stroke()
  }
  c2.restore()
  const cover = srgb(new CanvasTexture(cc))

  // Brass segment scale, with numerals.
  const sc = canvas(1024, 1024)
  const s = ctx2d(sc)
  const r4 = rng(5)
  const bg = s.createLinearGradient(0, 0, 1024, 1024)
  bg.addColorStop(0, '#5E4829')
  bg.addColorStop(0.3, '#B4966A')
  bg.addColorStop(0.55, '#7A603C')
  bg.addColorStop(0.8, '#C6AE84')
  bg.addColorStop(1, '#5A452A')
  s.fillStyle = bg
  s.fillRect(0, 0, 1024, 1024)
  for (let t = 0; t < 2200; t++) {
    s.fillStyle = 'rgba(46,30,14,' + (0.06 + r4() * 0.18).toFixed(3) + ')'
    s.fillRect(r4() * 1024, r4() * 1024, 1 + r4() * 3, 1 + r4() * 3)
  }
  s.fillStyle = '#231809'
  s.textAlign = 'center'
  s.textBaseline = 'middle'
  s.font = '50px "Special Elite", "Courier New", monospace'
  const chars = '2 0 0 1 2 3 4 5 6 7 8 9 0 0'.split(' ')
  const RR = 0.85 * 512
  for (let kk = 0; kk < chars.length; kk++) {
    const th = Math.PI + Math.PI * 0.06 + ((kk + 0.5) / chars.length) * Math.PI * 0.88
    const tx = RR * Math.cos(th)
    const ty = RR * Math.sin(th)
    s.save()
    s.translate(512 + tx, 512 - ty)
    s.rotate(Math.atan2(-tx / RR, -ty / RR))
    s.fillText(chars[kk], 0, 0)
    s.restore()
  }
  s.strokeStyle = 'rgba(35,24,9,0.75)'
  s.lineWidth = 2
  for (let tk = 0; tk <= 40; tk++) {
    const tt = Math.PI + Math.PI * 0.04 + (tk / 40) * Math.PI * 0.92
    const len2 = tk % 5 === 0 ? 22 : 12
    s.beginPath()
    s.moveTo(512 + 0.99 * 512 * Math.cos(tt), 512 - 0.99 * 512 * Math.sin(tt))
    s.lineTo(512 + (0.99 * 512 - len2) * Math.cos(tt), 512 - (0.99 * 512 - len2) * Math.sin(tt))
    s.stroke()
  }
  const scale = srgb(new CanvasTexture(sc))

  // Paper-bail ruler.
  const rc = canvas(2048, 32)
  const rl = ctx2d(rc)
  const r6 = rng(41)
  const rg = rl.createLinearGradient(0, 0, 0, 32)
  rg.addColorStop(0, '#CFC6B4')
  rg.addColorStop(0.5, '#A39A88')
  rg.addColorStop(1, '#BDB4A2')
  rl.fillStyle = rg
  rl.fillRect(0, 0, 2048, 32)
  for (let sp = 0; sp < 500; sp++) {
    rl.fillStyle = 'rgba(60,44,26,' + (0.05 + r6() * 0.15).toFixed(3) + ')'
    rl.fillRect(r6() * 2048, r6() * 32, 1 + r6() * 3, 1 + r6() * 2)
  }
  rl.fillStyle = '#231a10'
  rl.font = '13px "Special Elite", "Courier New", monospace'
  rl.textAlign = 'center'
  rl.textBaseline = 'top'
  for (let tm = 0; tm <= 170; tm++) {
    const xx = 4 + tm * 12
    const hh = tm % 10 === 0 ? 14 : tm % 5 === 0 ? 10 : 6
    rl.fillRect(xx, 32 - hh, 1.5, hh)
    if (tm % 10 === 0) rl.fillText(String(tm / 2), xx, 2)
  }
  const rule = srgb(new CanvasTexture(rc))

  // Key tops.
  const keys: Record<string, CanvasTexture> = {}
  const r7 = rng(77)
  'QWERTYUIOPASDFGHJKL'.split('').forEach((ch) => {
    const kc = canvas(128, 128)
    const kx = ctx2d(kc)
    const kg = kx.createRadialGradient(56, 50, 4, 64, 64, 70)
    kg.addColorStop(0, '#E4D8B8')
    kg.addColorStop(0.7, '#CDBD96')
    kg.addColorStop(1, '#A8956C')
    kx.fillStyle = kg
    kx.fillRect(0, 0, 128, 128)
    for (let sp2 = 0; sp2 < 26; sp2++) {
      kx.fillStyle = 'rgba(96,66,34,' + (0.04 + r7() * 0.12).toFixed(3) + ')'
      kx.beginPath()
      kx.arc(r7() * 128, r7() * 128, 1 + r7() * 5, 0, 6.2832)
      kx.fill()
    }
    kx.fillStyle = '#120E0A'
    kx.textAlign = 'center'
    kx.textBaseline = 'middle'
    kx.font = 'bold 84px "Special Elite", "Courier New", monospace'
    kx.fillText(ch, 64, 70)
    kx.fillText(ch, 65, 70)
    keys[ch] = srgb(new CanvasTexture(kc))
  })
  return { enamel, grime, deck, cover, scale, rule, keys }
}

function buildScene(opts: TypewriterOptions, tex: Textures) {
  const V = Vector3
  const R = new V(1, 0, 0)
  const U = new V(0, Math.cos(TILT), -Math.sin(TILT))
  const N = new V(0, Math.sin(TILT), Math.cos(TILT))
  const scene = new Scene()

  const mat = {
    enamel: new MeshPhysicalMaterial({ color: 0xffffff, map: tex.enamel, roughness: 0.5, roughnessMap: tex.grime, bumpMap: tex.grime, bumpScale: 0.9, metalness: 0.12, clearcoat: 0.4, clearcoatRoughness: 0.42 }),
    chrome: new MeshStandardMaterial({ color: 0xcfc6b3, metalness: 1, roughness: 0.34, roughnessMap: tex.grime }),
    steel: new MeshStandardMaterial({ color: 0x9d9486, metalness: 0.95, roughness: 0.42, roughnessMap: tex.grime }),
    dark: new MeshStandardMaterial({ color: 0x2a231c, metalness: 0.75, roughness: 0.55, roughnessMap: tex.grime }),
    rubber: new MeshStandardMaterial({ color: 0x0c0b0a, metalness: 0, roughness: 0.78 }),
    bakelite: new MeshPhysicalMaterial({ color: 0x0d0b09, metalness: 0, roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.35 }),
    brass: new MeshStandardMaterial({ color: 0x9a763f, metalness: 1, roughness: 0.42, roughnessMap: tex.grime }),
    basket: new MeshStandardMaterial({ color: 0x050404, metalness: 0.2, roughness: 0.92 }),
    felt: new MeshStandardMaterial({ color: 0x24100c, metalness: 0, roughness: 1 }),
    ribbonBlack: new MeshStandardMaterial({ color: 0x0f0d0c, metalness: 0, roughness: 0.95 }),
    ribbonRed: new MeshStandardMaterial({ color: 0x4a120d, metalness: 0, roughness: 0.92 }),
    shadow: new ShadowMaterial({ opacity: 0.26 }),
    deckDecal: new MeshStandardMaterial({ map: tex.deck, transparent: true, roughness: 0.6, metalness: 0.1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    coverDecal: new MeshStandardMaterial({ map: tex.cover, transparent: true, roughness: 0.6, metalness: 0.1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    scale: new MeshStandardMaterial({ map: tex.scale, metalness: 0.85, roughness: 0.45 }),
    rule: new MeshStandardMaterial({ map: tex.rule, metalness: 0.9, roughness: 0.4 }),
  }

  const mesh = (geo: BufferGeometry, m: Material, layer: number, parent: Object3D, cast?: boolean, receive?: boolean) => {
    const o = new Mesh(geo, m)
    o.layers.set(layer)
    o.castShadow = cast !== false
    o.receiveShadow = receive !== false
    parent.add(o)
    return o
  }
  const cylX = (r: number, len: number, seg?: number) => {
    const gq = new CylinderGeometry(r, r, len, seg || 48)
    gq.rotateZ(Math.PI / 2)
    return gq
  }
  const scaleUV = <G extends BufferGeometry>(geo: G, f: number) => {
    const uv = geo.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * f, uv.getY(i) * f)
    return geo
  }

  const ground = mesh(new PlaneGeometry(26000, 26000), mat.shadow, BACK, scene, false, true)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -582

  const bodyPart = (prof: number[][], layer: number) => {
    const shape = new Shape()
    shape.moveTo(-prof[0][0], prof[0][1])
    for (let i = 1; i < prof.length; i++) shape.lineTo(-prof[i][0], prof[i][1])
    shape.closePath()
    const depth = 1700 - 44
    const geo = new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 22, bevelSize: 22, bevelSegments: 6, curveSegments: 4 })
    geo.rotateY(Math.PI / 2)
    geo.translate(-depth / 2, 0, 0)
    scaleUV(geo, 1 / 620)
    return mesh(geo, mat.enamel, layer, scene)
  }
  const yCut = -112 - (242 / 840) * 160
  bodyPart([[-300, -560], [-300, -170], [-190, -112], [-30, yCut], [-30, -560]], BACK)
  bodyPart([[-30, yCut], [650, -354], [700, -372], [730, -560], [-30, -560]], FRONT)

  const LIFT = 22
  const deckF = new Group()
  deckF.position.set(0, -112, -190)
  deckF.rotation.x = Math.atan2(242, 840)
  scene.add(deckF)
  scene.updateMatrixWorld(true)

  const decal = mesh(new PlaneGeometry(1690, 690), mat.deckDecal, FRONT, deckF, false, true)
  decal.rotation.x = -Math.PI / 2
  decal.position.set(0, LIFT + 0.6, 529)

  const cupProfile = [[0, 60], [50, 60], [55, 56], [150, 53], [176, 47], [189, 33], [191, 8], [198, 3], [198, 0]].map((p) => new Vector2(p[0], p[1]))
  ;[-600, 600].forEach((x) => {
    const tower = mesh(new CylinderGeometry(206, 212, 22, 72), mat.enamel, FRONT, deckF)
    tower.position.set(x, LIFT + 11, 345)
    const cup = mesh(new LatheGeometry(cupProfile, 80), mat.enamel, FRONT, deckF)
    cup.position.set(x, LIFT + 22, 345)
    const top = mesh(new CircleGeometry(150, 72), mat.coverDecal, FRONT, deckF, false, true)
    top.rotation.x = -Math.PI / 2
    top.position.set(x, LIFT + 22 + 56.4, 345)
    ;[118, 84].forEach((rr0) => {
      const grv = mesh(new TorusGeometry(rr0, 1.8, 8, 72), mat.dark, FRONT, deckF, false)
      grv.rotation.x = Math.PI / 2
      grv.position.set(x, LIFT + 22 + 55, 345)
    })
    const rimT = mesh(new TorusGeometry(190, 3.5, 10, 80), mat.steel, FRONT, deckF)
    rimT.rotation.x = Math.PI / 2
    rimT.position.set(x, LIFT + 22 + 36, 345)
    const nut = mesh(new CylinderGeometry(27, 27, 14, 6), mat.chrome, FRONT, deckF)
    nut.position.set(x, LIFT + 22 + 67, 345)
    nut.rotation.y = x < 0 ? 0.3 : 0.9
    const stud = mesh(new CylinderGeometry(11, 11, 26, 20), mat.steel, FRONT, deckF)
    stud.position.set(x, LIFT + 22 + 73, 345)
    const post = mesh(new CylinderGeometry(7, 7, 70, 16), mat.chrome, FRONT, deckF)
    post.position.set(x * 0.62, LIFT + 35, 200)
    const postCap = mesh(new SphereGeometry(10, 16, 12), mat.chrome, FRONT, deckF)
    postCap.position.set(x * 0.62, LIFT + 72, 200)
    const lv = mesh(new CylinderGeometry(5, 5, 60, 12), mat.chrome, FRONT, deckF)
    lv.position.set(x * 0.52, LIFT + 26, 560)
    lv.rotation.z = x < 0 ? 0.5 : -0.5
    const lvk = mesh(new SphereGeometry(12, 16, 12), mat.bakelite, FRONT, deckF)
    lvk.position.set(x * 0.52 + (x < 0 ? -15 : 15), LIFT + 54, 560)
  })

  ;[[-790, 215], [790, 215], [-790, 820], [790, 820]].forEach((p) => {
    const sc = mesh(new CylinderGeometry(11, 11, 5, 24), mat.chrome, FRONT, deckF)
    sc.position.set(p[0], LIFT + 2.5, p[1])
    const sl = mesh(new BoxGeometry(18, 2, 3), mat.dark, FRONT, deckF, false)
    sl.position.set(p[0], LIFT + 5.2, p[1])
    sl.rotation.y = (p[0] * p[1]) % 3
  })

  const keyStemG = new CylinderGeometry(5, 5, 36, 10)
  const keyCupG = new CylinderGeometry(34, 30, 11, 44)
  const keyTopG = new CircleGeometry(29.5, 44)
  const keyRingG = new TorusGeometry(31.5, 3.6, 10, 44)
  const keyDefs = [
    { row: 'QWERTYUIOP', z: 690, off: 0 },
    { row: 'ASDFGHJKL', z: 792, off: 24 },
  ]
  keyDefs.forEach((kd) => {
    kd.row.split('').forEach((ch, i) => {
      const kx = (i - (kd.row.length - 1) / 2) * 88 + kd.off
      const kz = kd.z
      const ky = LIFT
      const stem = mesh(keyStemG, mat.dark, FRONT, deckF)
      stem.position.set(kx, ky + 18, kz)
      const cupK = mesh(keyCupG, mat.chrome, FRONT, deckF)
      cupK.position.set(kx, ky + 40, kz)
      const topM = new MeshPhysicalMaterial({ map: tex.keys[ch] ?? null, color: 0xffffff, roughness: 0.45, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.12, envMapIntensity: 0.6 })
      const topK = mesh(keyTopG, topM, FRONT, deckF, false, true)
      topK.rotation.x = -Math.PI / 2
      topK.position.set(kx, ky + 45.8, kz)
      const ringK = mesh(keyRingG, mat.chrome, FRONT, deckF)
      ringK.rotation.x = Math.PI / 2
      ringK.position.set(kx, ky + 46, kz)
    })
  })

  // Typebar basket.
  const BC = 170
  const basket = mesh(new CircleGeometry(410, 72, Math.PI, Math.PI), mat.basket, FRONT, deckF, false, true)
  basket.rotation.x = -Math.PI / 2
  basket.position.set(0, LIFT + 0.8, BC)
  const felt = mesh(new RingGeometry(332, 366, 72, 1, Math.PI, Math.PI), mat.felt, FRONT, deckF, false, true)
  felt.rotation.x = -Math.PI / 2
  felt.position.set(0, LIFT + 3, BC)
  const seg = mesh(new TorusGeometry(134, 11, 14, 64, Math.PI), mat.steel, FRONT, deckF)
  seg.rotation.x = Math.PI / 2
  seg.position.set(0, LIFT + 12, BC)
  const scaleRing = mesh(new RingGeometry(86, 122, 72, 1, Math.PI, Math.PI), mat.scale, FRONT, deckF)
  scaleRing.rotation.x = -Math.PI / 2
  scaleRing.position.set(0, LIFT + 6, BC)
  const rimRing = mesh(new TorusGeometry(414, 9, 12, 72, Math.PI), mat.enamel, FRONT, deckF)
  rimRing.rotation.x = Math.PI / 2
  rimRing.position.set(0, LIFT + 3, BC)

  const barLen = 210
  const angles: number[] = []
  for (let a = 14; a <= 166.01; a += 4.75) {
    if (Math.abs(a - 90) > 2.5) angles.push(a)
  }
  const barsIM = new InstancedMesh(new BoxGeometry(6, 10, barLen), mat.steel, angles.length)
  const slugIM = new InstancedMesh(new BoxGeometry(17, 15, 26), mat.chrome, angles.length)
  ;[barsIM, slugIM].forEach((im) => {
    im.layers.set(FRONT)
    im.castShadow = true
    im.receiveShadow = true
    deckF.add(im)
  })
  const dummy = new Object3D()
  angles.forEach((deg, idx) => {
    const phi = deg * DEG
    const dx = Math.cos(phi)
    const dz = Math.sin(phi)
    const yaw = Math.atan2(dx, dz)
    dummy.position.set(dx * (130 + barLen / 2), LIFT + 12, BC + dz * (130 + barLen / 2))
    dummy.rotation.set(0, yaw, 0)
    dummy.updateMatrix()
    barsIM.setMatrixAt(idx, dummy.matrix)
    dummy.position.set(dx * (130 + barLen + 10), LIFT + 13, BC + dz * (130 + barLen + 10))
    dummy.updateMatrix()
    slugIM.setMatrixAt(idx, dummy.matrix)
  })

  // The one typebar that actually swings up to strike the paper at the world origin.
  const ez = new V(0, -242, 840).normalize()
  const ey = new V(0, 840, 242).normalize()
  const Pv = new V(0, -112, -190).addScaledVector(ez, BC + 130).addScaledVector(ey, LIFT + 12)
  const toO = new V().sub(Pv)
  const Lb = toO.length()
  const psiS = Math.atan2(toO.y, toO.z)
  const psiR = Math.atan2(ez.y, ez.z)
  const arm = new Group()
  arm.position.copy(Pv)
  scene.add(arm)
  const armBar = mesh(new BoxGeometry(6, 12, Lb), mat.steel, FRONT, arm)
  armBar.position.z = Lb / 2
  const slugG = new Group()
  slugG.position.z = Lb
  arm.add(slugG)
  slugG.rotation.x = -TILT + psiS
  const slugMesh = mesh(new BoxGeometry(26, 30, 16), mat.chrome, FRONT, slugG)
  slugMesh.position.z = 8
  const restA = -psiR
  const strikeA = -psiS
  arm.rotation.x = restA

  // Ribbon vibrator and card holder, in the paper's tilted frame.
  const paperF = new Group()
  paperF.rotation.x = -TILT
  scene.add(paperF)
  const vib = new Group()
  paperF.add(vib)
  ;[-17, 17].forEach((x) => {
    const pr = mesh(new BoxGeometry(9, 64, 10), mat.brass, FRONT, vib)
    pr.position.set(x, -68, 30)
  })
  const base = mesh(new BoxGeometry(74, 34, 16), mat.brass, FRONT, vib)
  base.position.set(0, -114, 30)
  const gScrew = mesh(new CylinderGeometry(5, 5, 4, 20), mat.chrome, FRONT, vib)
  gScrew.rotation.x = Math.PI / 2
  gScrew.position.set(0, -112, 40)
  const rb = mesh(new BoxGeometry(470, 9, 2.5), mat.ribbonBlack, FRONT, vib)
  rb.position.set(0, -68, 15)
  const rr3 = mesh(new BoxGeometry(470, 9, 2.5), mat.ribbonRed, FRONT, vib)
  rr3.position.set(0, -77, 15)
  ;[-1, 1].forEach((sgn) => {
    const fk = mesh(new BoxGeometry(8, 30, 10), mat.chrome, FRONT, vib)
    fk.position.set(sgn * 236, -72, 17)
  })
  const bracket = mesh(new BoxGeometry(30, 130, 14), mat.dark, FRONT, paperF)
  bracket.position.set(0, -190, 20)
  ;[-1, 1].forEach((sgn) => {
    const sh = new Shape()
    sh.moveTo(sgn * 30, -26)
    sh.lineTo(sgn * 30, -138)
    sh.lineTo(sgn * 112, -138)
    sh.lineTo(sgn * 52, -40)
    sh.closePath()
    const hg = new ExtrudeGeometry(sh, { depth: 5, bevelEnabled: true, bevelThickness: 1.5, bevelSize: 1.5, bevelSegments: 2 })
    const holder = mesh(hg, mat.dark, FRONT, paperF)
    holder.position.z = 20
    const hs = mesh(new CylinderGeometry(5, 5, 3, 16), mat.chrome, FRONT, paperF)
    hs.rotation.x = Math.PI / 2
    hs.position.set(sgn * 62, -118, 28)
  })

  scene.updateMatrixWorld(true)
  const ribbonRun = (A: Vector3, B: Vector3) => {
    const dir = new V().subVectors(B, A)
    const len = dir.length()
    dir.normalize()
    const zAxis = new V().crossVectors(dir, U).normalize()
    const yAxis = new V().crossVectors(zAxis, dir).normalize()
    const m4 = new Matrix4().makeBasis(dir, yAxis, zAxis)
    const grp = new Group()
    grp.quaternion.setFromRotationMatrix(m4)
    grp.position.copy(A).addScaledVector(dir, len / 2)
    scene.add(grp)
    const b1 = mesh(new BoxGeometry(len, 9, 2), mat.ribbonBlack, FRONT, grp)
    b1.position.y = 4.5
    const b2 = mesh(new BoxGeometry(len, 9, 2), mat.ribbonRed, FRONT, grp)
    b2.position.y = -4.5
  }
  ;[-1, 1].forEach((sgn) => {
    const A = paperF.localToWorld(new V(sgn * 236, -72.5, 16))
    const B = deckF.localToWorld(new V(sgn * 372, LIFT + 52, 205))
    const C2 = deckF.localToWorld(new V(sgn * 440, LIFT + 50, 262))
    ribbonRun(A, B)
    ribbonRun(B, C2)
  })

  // Carriage: platen, knobs, side plates, rail, return lever, paper bail.
  const pw = opts.pw || 1240
  const platenLen = pw + 160
  const carriage = new Group()
  scene.add(carriage)
  const carInner = new Group()
  carInner.position.x = opts.paperOffsetX || 0
  carriage.add(carInner)
  const Pc = new V().addScaledVector(N, -70)
  const platenG = new Group()
  platenG.position.copy(Pc)
  carInner.add(platenG)
  mesh(cylX(70, platenLen, 80), mat.rubber, BACK, platenG)
  ;[-1, 1].forEach((sgn) => {
    const fl = mesh(cylX(74, 10, 56), mat.steel, BACK, platenG)
    fl.position.x = sgn * (platenLen / 2 + 5)
    const kg = new CylinderGeometry(84, 84, 92, 120, 1)
    const pos = kg.attributes.position
    for (let vi = 0; vi < pos.count; vi++) {
      const vx = pos.getX(vi)
      const vz = pos.getZ(vi)
      const rad = Math.sqrt(vx * vx + vz * vz)
      if (rad > 1) {
        const ang2 = Math.atan2(vz, vx)
        const f = (rad - 3.2 * (0.5 + 0.5 * Math.cos(ang2 * 40))) / rad
        pos.setX(vi, vx * f)
        pos.setZ(vi, vz * f)
      }
    }
    kg.computeVertexNormals()
    kg.rotateZ(Math.PI / 2)
    const knob = mesh(kg, mat.bakelite, BACK, platenG)
    knob.position.x = sgn * (platenLen / 2 + 44 + 46)
    const cap = mesh(cylX(58, 8, 48), mat.chrome, BACK, platenG)
    cap.position.x = sgn * (platenLen / 2 + 44 + 92 + 4)
    const capc = mesh(cylX(16, 6, 24), mat.dark, BACK, platenG)
    capc.position.x = sgn * (platenLen / 2 + 44 + 92 + 10)
    const plate = mesh(scaleUV(new BoxGeometry(26, 240, 300), 0.5), mat.enamel, BACK, carInner)
    plate.position.set(sgn * (platenLen / 2 + 24), -40, -80)
    const ps = mesh(cylX(9, 4, 20), mat.chrome, BACK, carInner)
    ps.position.set(sgn * (platenLen / 2 + 39), 14, -30)
    const ps2 = mesh(cylX(9, 4, 20), mat.chrome, BACK, carInner)
    ps2.position.set(sgn * (platenLen / 2 + 39), -120, -150)
  })
  const gearG = new CylinderGeometry(62, 62, 12, 96, 1)
  const gp = gearG.attributes.position
  for (let gi = 0; gi < gp.count; gi++) {
    const gx = gp.getX(gi)
    const gz = gp.getZ(gi)
    const gr = Math.sqrt(gx * gx + gz * gz)
    if (gr > 1) {
      const ga = Math.atan2(gz, gx)
      const gf = (gr - 7 * (0.5 + 0.5 * Math.sign(Math.cos(ga * 24)))) / gr
      gp.setX(gi, gx * gf)
      gp.setZ(gi, gz * gf)
    }
  }
  gearG.computeVertexNormals()
  gearG.rotateZ(Math.PI / 2)
  const gear = mesh(gearG, mat.steel, BACK, platenG)
  gear.position.x = -(platenLen / 2 + 16)
  const rail = mesh(cylX(15, platenLen + 170, 32), mat.chrome, BACK, carInner)
  rail.position.set(0, 46, -244)
  const lowBar = mesh(new BoxGeometry(platenLen + 70, 28, 34), mat.dark, BACK, carInner)
  lowBar.position.set(0, -120, -150)
  const px = -(platenLen / 2 + 24)
  const curve = new CatmullRomCurve3([new V(px, 60, -40), new V(px - 30, 170, -20), new V(px - 120, 250, 40), new V(px - 220, 262, 120), new V(px - 280, 250, 190)])
  mesh(new TubeGeometry(curve, 40, 8, 12, false), mat.chrome, BACK, carInner)
  const paddle = mesh(new SphereGeometry(20, 24, 16), mat.chrome, BACK, carInner)
  paddle.scale.set(1.5, 0.45, 1.9)
  paddle.position.set(px - 292, 248, 205)
  paddle.rotation.y = 0.5
  const rl2 = mesh(new CylinderGeometry(6, 6, 130, 14), mat.chrome, BACK, carInner)
  rl2.position.set(-px + 6, 120, -60)
  rl2.rotation.z = -0.35
  const rk2 = mesh(new SphereGeometry(14, 16, 12), mat.bakelite, BACK, carInner)
  rk2.position.set(-px + 28, 180, -60)

  const bailF = new Group()
  bailF.rotation.x = -TILT
  carInner.add(bailF)
  const rod = mesh(cylX(5.5, platenLen - 40, 24), mat.chrome, FRONT, bailF)
  rod.position.set(0, -58, 12)
  ;[-0.27, 0.27].forEach((fx) => {
    const rl = mesh(cylX(18, 86, 36), mat.rubber, FRONT, bailF)
    rl.position.set(fx * pw, -58, 12)
    ;[-1, 1].forEach((e2) => {
      const cl = mesh(cylX(11, 6, 20), mat.steel, FRONT, bailF)
      cl.position.set(fx * pw + e2 * 47, -58, 12)
    })
  })
  ;[-1, 1].forEach((sgn) => {
    const armB = mesh(new BoxGeometry(10, 14, 70), mat.chrome, FRONT, bailF)
    armB.position.set(sgn * (platenLen / 2 - 24), -58, -22)
  })
  const ruleM = mesh(new BoxGeometry(platenLen - 120, 20, 3), mat.rule, FRONT, bailF)
  ruleM.position.set(0, -92, 7)

  return { scene, R, U, N, carriage, platen: platenG, arm, vib, restA, strikeA }
}

export function createTypewriter(opts: TypewriterOptions): Typewriter {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true })
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.08
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap
  renderer.shadowMap.autoUpdate = false

  const tex = makeTextures(document)
  const aniso = renderer.capabilities.getMaxAnisotropy()
  ;[tex.enamel, tex.deck, tex.scale, tex.rule].forEach((t) => (t.anisotropy = aniso))
  const built = buildScene(opts, tex)
  const scene = built.scene

  // A small, warm studio for reflections.
  const envScene = new Scene()
  envScene.add(new Mesh(new BoxGeometry(100, 100, 100), new MeshBasicMaterial({ color: 0x2a1d14, side: BackSide })))
  const panel = (w: number, h: number, hex: number, k: number, x: number, y: number, z: number) => {
    const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(k), side: DoubleSide }))
    m.position.set(x, y, z)
    m.lookAt(0, 0, 0)
    envScene.add(m)
  }
  panel(46, 24, 0xfff0dc, 7, -18, 45, 22)
  panel(18, 34, 0xffd9b0, 3, 46, 12, 12)
  panel(70, 5, 0xffffff, 2.2, 0, 14, -48)
  panel(30, 14, 0xffe2c0, 1.2, 0, -40, 30)
  const pmrem = new PMREMGenerator(renderer)
  const envRT = pmrem.fromScene(envScene, 0.035)
  scene.environment = envRT.texture
  pmrem.dispose()
  envScene.traverse((o) => {
    const m = o as Mesh
    if (m.geometry) m.geometry.dispose()
    if (m.material) (m.material as Material).dispose()
  })

  const hemi = new HemisphereLight(0xffe6c4, 0x2a170c, 0.5 * LEGACY_LIGHT_SCALE)
  const key = new DirectionalLight(0xffd6a4, 2.2 * LEGACY_LIGHT_SCALE)
  key.position.set(-1200, 2100, 1500)
  key.target.position.set(0, -250, 150)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  const scam = key.shadow.camera
  scam.left = -1700
  scam.right = 1700
  scam.top = 1700
  scam.bottom = -1700
  scam.near = 200
  scam.far = 7000
  scam.updateProjectionMatrix()
  key.shadow.bias = -0.0005
  key.shadow.normalBias = 2
  scam.layers.enableAll()
  const rim = new DirectionalLight(0xffc48a, 0.7 * LEGACY_LIGHT_SCALE)
  rim.position.set(1100, 700, -1600)
  ;[hemi, key, rim].forEach((l) => {
    l.layers.enableAll()
    scene.add(l)
  })
  scene.add(key.target)

  const camera = new PerspectiveCamera(22, (opts.W || 1440) / (opts.H || 900), 40, 30000)
  let W = opts.W
  let H = opts.H
  let dpr = opts.dpr || 1
  const resize = (w: number, h: number, d?: number) => {
    W = w
    H = h
    dpr = d || dpr
    renderer.setPixelRatio(dpr)
    renderer.setSize(W, H, false)
    camera.aspect = W / H
    camera.updateProjectionMatrix()
  }
  resize(W, H, dpr)

  const C = new Vector3()
  const setFrame = (f: TypewriterFrame) => {
    // Distance at which one world unit (one page pixel) is k screen pixels.
    const foc = H / 2 / Math.tan((camera.fov * DEG) / 2)
    const D = foc / f.k
    C.set(0, 0, 0).addScaledVector(built.R, f.Cr).addScaledVector(built.U, f.Cu)
    camera.position.copy(C).addScaledVector(built.N, D)
    camera.up.copy(built.U)
    camera.lookAt(C)
    camera.updateMatrixWorld()
    built.carriage.position.x = f.cx || 0
    built.platen.rotation.x = f.rot || 0
    built.arm.rotation.x = f.a == null ? built.restA : f.a
    built.vib.position.y = (f.lift || 0) * 16
  }
  const render = (backCtx: CanvasRenderingContext2D, frontCtx: CanvasRenderingContext2D) => {
    renderer.shadowMap.needsUpdate = true
    const cw = renderer.domElement.width
    const ch = renderer.domElement.height
    camera.layers.set(BACK)
    renderer.render(scene, camera)
    backCtx.clearRect(0, 0, cw, ch)
    backCtx.drawImage(renderer.domElement, 0, 0)
    camera.layers.set(FRONT)
    renderer.render(scene, camera)
    frontCtx.clearRect(0, 0, cw, ch)
    frontCtx.drawImage(renderer.domElement, 0, 0)
  }
  const dispose = () => {
    scene.traverse((o) => {
      const m = o as Mesh
      if (m.geometry) m.geometry.dispose()
      if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x.dispose())
    })
    const all: Texture[] = [tex.enamel, tex.grime, tex.deck, tex.cover, tex.scale, tex.rule, ...Object.values(tex.keys)]
    all.forEach((t) => t.dispose())
    envRT.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
  }
  return { setFrame, render, resize, dispose, restA: built.restA, strikeA: built.strikeA }
}
