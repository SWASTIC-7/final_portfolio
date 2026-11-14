/*
 * The opening sequence:
 *   boot   - wait for the typeface and the 3D module ("loading ...")
 *   type   - camera zoomed onto the sheet; the typewriter strikes the name letter by letter
 *   pull   - camera eases back to 1:1 while the machine drops away
 *   reveal - the rest of the page "spells" in; a static typewriter is drawn at the page foot
 *   final  - everything visible, no animation (skip, reduced motion, deep links, failures)
 *
 * The camera is a CSS translate+scale on the page wrapper, and the 3D renderer is driven with
 * the same numbers, so the DOM paper sits exactly in the machine's paper plane.
 */
import type { Typewriter } from './typewriter3d'

export type Phase = 'boot' | 'type' | 'pull' | 'reveal' | 'final'

export interface Overlay {
  pl: number
  pw: number
  ovTop: number
  ovH: number
  bailTop: number
}

export interface IntroElements {
  root: HTMLDivElement | null
  cam: HTMLDivElement | null
  paper: HTMLDivElement | null
  h1: HTMLHeadingElement | null
  back: HTMLCanvasElement | null
  front: HTMLCanvasElement | null
  footBack: HTMLCanvasElement | null
  footFront: HTMLCanvasElement | null
}

export interface IntroView {
  els: () => IntroElements
  setPhase: (p: Phase) => void
  setPrinted: (n: number) => void
  setOverlay: (o: Partial<Overlay>) => void
  setFootReady: (v: boolean) => void
}

type TW3DModule = typeof import('./typewriter3d')

let libPromise: Promise<TW3DModule | null> | null = null
function loadLib(): Promise<TW3DModule | null> {
  if (!libPromise) {
    libPromise = import('./typewriter3d').catch(() => {
      libPromise = null
      return null
    })
  }
  return libPromise
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

const BOOT_TIMEOUT_MS = 12000

/** Phones get the plain page: no intro and no footer machine (and three.js is never fetched).
 *  Keep in step with the 760px breakpoint in portfolio.css. */
const NARROW_QUERY = '(max-width: 760px)'
function isNarrow() {
  return window.matchMedia?.(NARROW_QUERY).matches ?? false
}

export class IntroController {
  readonly name = 'Swastic Keshari'

  private view: IntroView
  private timers: number[] = []
  private raf: number | null = null
  private running = false
  private ph: Phase = 'boot'
  private i = 0
  private gl: Typewriter | null = null
  private glOff = 0
  private bctx: CanvasRenderingContext2D | null = null
  private fctx: CanvasRenderingContext2D | null = null
  private io: IntersectionObserver | null = null
  private footT = 0
  private destroyed = false

  // Measured layout (CSS px, relative to the camera wrapper).
  private pts: { x: number; y: number }[] | null = null
  private W = 1440
  private H = 900
  private dpr = 1
  private pl = 0
  private pt = 0
  private pw = 0
  private ox = 0
  private oy = 0
  private k0 = 1
  private Sy = 540

  // Carriage travel (cx) and paper feed (fy) tweens; typebar strike time.
  private cxFrom = 0
  private cxTo = 0
  private cxT0 = -1e9
  private cxDur = 140
  private fyFrom = 0
  private fyTo = 0
  private fyT0 = -1e9
  private strikeT0 = -1e9

  // Pull-back start pose.
  private last = { tx: 0, ty: 0, k: 1 }
  private pullT0 = 0

  constructor(view: IntroView) {
    this.view = view
    this.onResize = this.onResize.bind(this)
  }

  start(opts: { skipIntro: boolean }) {
    window.addEventListener('resize', this.onResize)
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || opts.skipIntro || isNarrow() || !webglAvailable()) {
      this.toFinal()
      return
    }
    this.boot()
  }

  destroy() {
    this.destroyed = true
    this.clearAll()
    this.stopLoop()
    clearTimeout(this.footT)
    window.removeEventListener('resize', this.onResize)
    this.io?.disconnect()
    this.io = null
    if (this.gl) {
      try {
        this.gl.dispose()
      } catch {
        /* context already gone */
      }
      this.gl = null
    }
  }

  skip() {
    this.toFinal()
  }

  get phase() {
    return this.ph
  }

  // ---- plumbing -------------------------------------------------------------

  private later(fn: () => void, ms: number) {
    const id = window.setTimeout(fn, ms)
    this.timers.push(id)
    return id
  }

  private clearAll() {
    this.timers.forEach((id) => clearTimeout(id))
    this.timers = []
  }

  private stopLoop() {
    this.running = false
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = null
  }

  private startLoop() {
    this.running = true
    const tick = (now: number) => {
      if (!this.running) return
      try {
        this.frame(now)
      } catch {
        this.toFinal()
        return
      }
      if (this.running) this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  private setCam(tx: number | null, ty = 0, k = 1) {
    const cam = this.view.els().cam
    if (!cam) return
    cam.style.transform = tx == null ? '' : `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${k.toFixed(5)})`
  }

  private setPhase(p: Phase) {
    this.ph = p
    this.view.setPhase(p)
  }

  private onResize() {
    if (this.ph === 'type' && this.measure() && this.gl) {
      this.gl.resize(this.W, this.H, this.dpr)
      this.sizeCanvases()
      this.syncOverlays()
    }
    if (this.ph === 'reveal' || this.ph === 'final') {
      clearTimeout(this.footT)
      this.footT = window.setTimeout(() => this.renderFooter(), 250)
    }
  }

  // ---- phases ---------------------------------------------------------------

  private toFinal() {
    this.clearAll()
    this.stopLoop()
    this.setCam(null)
    this.hideIntroCanvases()
    this.view.setPrinted(this.name.length)
    this.setPhase('final')
    this.renderFooter()
    window.setTimeout(() => {
      if (this.destroyed) return
      this.watchBlocks()
      this.scrollToHash()
    }, 80)
  }

  private scrollToHash() {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (!id) return
    document.getElementById(id)?.scrollIntoView({ block: 'start' })
  }

  private boot() {
    this.clearAll()
    this.stopLoop()
    this.setCam(null)
    try {
      window.scrollTo(0, 0)
    } catch {
      /* ignore */
    }
    this.i = 0
    this.pts = null
    this.strikeT0 = -1e9
    this.cxFrom = this.cxTo = 0
    this.cxT0 = -1e9
    this.view.setPrinted(0)
    this.setPhase('boot')
    // The canvas textures draw text in Special Elite, so the face must be ready first.
    const fonts = document.fonts
      ? Promise.all([document.fonts.load('64px "Special Elite"').catch(() => null), document.fonts.ready])
      : Promise.resolve()
    Promise.all([fonts, loadLib()]).then(([, lib]) => {
      if (this.destroyed || this.ph !== 'boot') return
      if (!lib) {
        this.toFinal()
        return
      }
      this.later(() => this.go(lib), 60)
    })
    this.later(() => {
      if (this.ph === 'boot') this.toFinal()
    }, BOOT_TIMEOUT_MS)
  }

  private offsetIn(el: HTMLElement, rootEl: HTMLElement) {
    let x = 0
    let y = 0
    let n: HTMLElement | null = el
    let guard = 0
    while (n && n !== rootEl && guard < 40) {
      x += n.offsetLeft
      y += n.offsetTop
      n = n.offsetParent as HTMLElement | null
      guard++
    }
    return { x, y }
  }

  private measure() {
    const { root, cam, h1, paper } = this.view.els()
    if (!root || !cam || !h1 || !paper) return false
    const cells = h1.querySelectorAll<HTMLElement>('[data-cell]')
    if (!cells.length) return false
    const pts: { x: number; y: number }[] = []
    cells.forEach((cell) => {
      const o = this.offsetIn(cell, cam)
      pts.push({ x: o.x + cell.offsetWidth / 2, y: o.y + cell.offsetHeight / 2 })
    })
    const po = this.offsetIn(paper, cam)
    const W = root.clientWidth || 1440
    const H = root.clientHeight || 900
    const fs = parseFloat(window.getComputedStyle(h1).fontSize) || 100
    this.pts = pts
    this.W = W
    this.H = H
    this.dpr = Math.min(1.5, window.devicePixelRatio || 1)
    this.pl = po.x
    this.pt = po.y
    this.pw = paper.offsetWidth
    this.ox = pts[0].x
    this.oy = pts[0].y
    // Zoom so a typed letter is ~8% of the viewport height.
    this.k0 = Math.max(0.4, Math.min(2.4, (0.08 * H) / fs))
    // The strike point sits 60% of the way down the screen.
    this.Sy = 0.6 * H
    return true
  }

  private sizeCanvases() {
    const { back, front } = this.view.els()
    if (!back || !front) return
    const w = Math.round(this.W * this.dpr)
    const h = Math.round(this.H * this.dpr)
    ;[back, front].forEach((c) => {
      if (c.width !== w || c.height !== h) {
        c.width = w
        c.height = h
      }
    })
    this.bctx = back.getContext('2d')
    this.fctx = front.getContext('2d')
  }

  private syncOverlays() {
    this.view.setOverlay({
      pl: Math.round(this.pl),
      pw: Math.round(this.pw),
      ovTop: Math.round(this.pt),
      ovH: Math.round(this.oy + 150 - this.pt),
      bailTop: Math.round(this.oy + 62),
    })
  }

  private go(lib: TW3DModule) {
    if (this.ph !== 'boot') return
    const { back, front } = this.view.els()
    if (!this.measure() || !back || !front) {
      this.toFinal()
      return
    }
    try {
      if (!this.gl) {
        this.glOff = this.pl + this.pw / 2 - this.ox
        this.gl = lib.createTypewriter({ W: this.W, H: this.H, dpr: this.dpr, pw: this.pw, paperOffsetX: this.glOff })
      } else this.gl.resize(this.W, this.H, this.dpr)
      this.sizeCanvases()
    } catch {
      this.toFinal()
      return
    }
    this.ph = 'type'
    this.cxFrom = this.cxTo = 0
    this.cxT0 = -1e9
    this.cxDur = 140
    this.fyFrom = this.fyTo = 0
    this.fyT0 = -1e9
    ;[back, front].forEach((c) => {
      c.style.transform = 'none'
      c.style.opacity = '1'
    })
    try {
      this.frame(performance.now())
    } catch {
      this.toFinal()
      return
    }
    this.syncOverlays()
    this.setPhase('type')
    this.startLoop()
    this.later(() => this.hit(), 700)
  }

  // ---- easing ---------------------------------------------------------------

  private ease3(u: number) {
    return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2
  }
  private easeOutBack(u: number, s = 1.5) {
    const c3 = s + 1
    return 1 + c3 * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2)
  }
  private smooth(e0: number, e1: number, x: number) {
    const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)
  }
  private cxAt(now: number) {
    const dur = this.cxDur || 140
    const u = Math.max(0, Math.min(1, (now - this.cxT0) / dur))
    // Short hops overshoot like a carriage escapement; a carriage return eases.
    const e = dur > 200 ? this.ease3(u) : this.easeOutBack(u, 1.4)
    return this.cxFrom + (this.cxTo - this.cxFrom) * e
  }
  private fyAt(now: number) {
    const u = Math.max(0, Math.min(1, (now - this.fyT0) / 400))
    return this.fyFrom + (this.fyTo - this.fyFrom) * this.ease3(u)
  }

  // ---- per frame ------------------------------------------------------------

  private frame(now: number) {
    if (!this.gl || !this.pts) return
    const { back, front } = this.view.els()
    if (!back || !front || !this.bctx || !this.fctx) return
    const W = this.W
    const H = this.H
    const k0 = this.k0
    if (this.ph === 'pull') {
      const t = now - this.pullT0
      const du = Math.max(0, Math.min(1, t / 780))
      const de = du * du * du
      const pe = this.ease3(Math.max(0, Math.min(1, (t - 260) / 1640)))
      this.setCam(this.last.tx * (1 - pe), this.last.ty * (1 - pe), this.last.k + (1 - this.last.k) * pe)
      const drop = `translateY(${(de * H).toFixed(1)}px)`
      const op = String(1 - this.smooth(0.5, 1, du))
      back.style.transform = front.style.transform = drop
      back.style.opacity = front.style.opacity = op
      if (t >= 1900) this.endPull()
      return
    }
    const cx = this.cxAt(now)
    const fy = this.fyAt(now)
    const rot = fy / 70
    const st = now - this.strikeT0
    const aR = this.gl.restA
    const aS = this.gl.strikeA
    let a: number | null = null
    let lift = 0
    if (st >= 0 && st < 380) {
      if (st < 95) {
        const u1 = st / 95
        a = aR + (aS - aR) * u1 * u1
      } else if (st < 122) a = aS
      else {
        const u2 = Math.min(1, (st - 122) / 240)
        a = aS + (aR - aS) * this.easeOutBack(u2, 1.1)
      }
      lift = st < 70 ? Math.sin(((st / 70) * Math.PI) / 2) : st < 150 ? 1 : Math.max(0, 1 - (st - 150) / 150)
    }
    const k = k0
    const Cr = 0
    const Cu = (this.Sy - H / 2) / k0
    const tx = W / 2 + k * (cx - this.ox - Cr)
    const ty = H / 2 + k * (-this.oy - fy + Cu)
    this.last = { tx, ty, k }
    this.setCam(tx, ty, k)
    this.gl.setFrame({ k, Cr, Cu, cx: cx + (this.pl + this.pw / 2 - this.ox) - this.glOff, rot, a, lift })
    this.gl.render(this.bctx, this.fctx)
  }

  /** Parks the intro canvases. The transform reset matters: the pull drops them a full
   *  viewport, and a translated element still extends the page's scrollable area. */
  private hideIntroCanvases() {
    const { back, front } = this.view.els()
    ;[back, front].forEach((c) => {
      if (!c) return
      c.style.opacity = '0'
      c.style.transform = 'none'
    })
  }

  private endPull() {
    this.stopLoop()
    this.setCam(null)
    this.hideIntroCanvases()
    this.setPhase('reveal')
    this.renderFooter()
    window.setTimeout(() => {
      if (!this.destroyed) this.watchBlocks()
    }, 80)
  }

  private cellIndex(i: number) {
    let c = -1
    for (let k = 0; k <= i; k++) if (this.name[k] !== ' ') c++
    return c
  }

  private hit() {
    const s = this.name
    const i = this.i
    if (i >= s.length) {
      this.end()
      return
    }
    if (s[i] === ' ') {
      this.i = i + 1
      this.view.setPrinted(this.i)
      this.later(() => this.hit(), 300)
      return
    }
    const cell = this.cellIndex(i)
    this.strikeT0 = performance.now()
    this.later(() => {
      this.view.setPrinted(i + 1)
      this.i = i + 1
      this.later(() => {
        let extra = 0
        if (this.pts && cell + 1 < this.pts.length) {
          const now = performance.now()
          const cur = this.pts[cell]
          const nx = this.pts[cell + 1]
          // On narrow screens the surname wraps: carriage return plus a line feed.
          const newLine = Math.abs(nx.y - cur.y) > 20
          this.cxFrom = this.cxAt(now)
          this.cxTo = -(nx.x - this.ox)
          this.cxT0 = now
          this.cxDur = newLine ? 560 : 140
          if (newLine) {
            this.fyFrom = this.fyAt(now)
            this.fyTo = nx.y - this.oy
            this.fyT0 = now + 80
            this.view.setOverlay({ bailTop: Math.round(nx.y + 62), ovH: Math.round(nx.y + 150 - this.pt) })
            extra = 560
          }
        }
        this.later(() => this.hit(), 150 + Math.random() * 120 + extra)
      }, 130)
    }, 95)
  }

  private end() {
    this.later(() => {
      this.pullT0 = performance.now()
      this.ph = 'pull'
      this.view.setPhase('pull')
    }, 900)
  }

  // ---- after the intro --------------------------------------------------------

  private watchBlocks() {
    const cam = this.view.els().cam
    if (!cam) return
    const els = cam.querySelectorAll<HTMLElement>('.rv')
    this.io?.disconnect()
    this.io = null
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.setAttribute('data-in', '1'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.setAttribute('data-in', '1')
            io.unobserve(en.target)
          }
        })
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.05 },
    )
    els.forEach((el) => {
      if (!el.hasAttribute('data-in')) io.observe(el)
    })
    this.io = io
  }

  /** Draws the machine, at rest, at the foot of the page with the sheet running into it. */
  private renderFooter() {
    if (isNarrow() || !webglAvailable()) return
    loadLib().then((lib) => {
      if (this.destroyed || !lib || (this.ph !== 'reveal' && this.ph !== 'final')) return
      const { cam, paper, footBack, footFront } = this.view.els()
      if (!cam || !paper || !footBack || !footFront) return
      try {
        const W = cam.clientWidth || 1440
        const Hs = 760
        const dpr = Math.min(1.5, window.devicePixelRatio || 1)
        if (!this.gl) {
          this.glOff = 0
          this.gl = lib.createTypewriter({ W, H: Hs, dpr, pw: paper.offsetWidth, paperOffsetX: 0 })
        }
        this.gl.resize(W, Hs, dpr)
        ;[footBack, footFront].forEach((c) => {
          c.width = Math.round(W * dpr)
          c.height = Math.round(Hs * dpr)
        })
        this.gl.setFrame({ k: 1, Cr: 0, Cu: 170 - Hs / 2, cx: -(this.glOff || 0), rot: 0.6, a: null, lift: 0 })
        const b = footBack.getContext('2d')
        const f = footFront.getContext('2d')
        if (!b || !f) return
        this.gl.render(b, f)
        this.view.setFootReady(true)
      } catch {
        /* the footer machine is decoration; the page stands without it */
      }
    })
  }
}
