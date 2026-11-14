import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { IntroController } from './intro'
import type { Overlay, Phase } from './intro'
import { makeSpeller } from './spell'
import CV from './CV'
import './portfolio.css'

const NAME = 'Swastic Keshari'

const INTRO_LINES = [
  'Undergrad at IIT Roorkee (B.Tech, class of 2027) and research',
  'assistant at P²-lab, working on *LLM inference* and *GPU kernels*.',
  'I love optimizing stuff to its *theoretical limits*. I have',
  'experience in *production agents*, inference and GPU kernel',
  'optimizations.',
]
const INTRO_PLAIN = INTRO_LINES.join(' ').replace(/\*/g, '')

const NAV = [
  { label: '[research]', href: '#research' },
  { label: '[experience]', href: '#experience' },
  { label: '[projects]', href: '#projects' },
  { label: '[writing]', href: '#writing' },
  { label: '[contact]', href: '#contact' },
]

// Reveal delays are fixed at module load, so they never change between renders.
const spell = makeSpeller(20261114)
const LINES = INTRO_LINES.map((t) => spell(t))
const LINKS = NAV.map((l) => ({ ...l, aria: l.label.replace(/[[\]]/g, ''), chars: spell(l.label)[0].chars }))

/** Section ids the page can be deep-linked to; a deep link skips the intro. */
const SECTION_IDS = ['research', 'publication', 'experience', 'projects', 'writing', 'achievements', 'teaching', 'skills', 'education', 'contact']

function Grain({ id }: { id: string }) {
  return (
    <svg aria-hidden="true" className="pg-grain">
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} stitchTiles="stitch" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.33  0 0 0 0 0.2  0 0 0 0.16 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  )
}

export default function Portfolio() {
  const [phase, setPhase] = useState<Phase>('boot')
  const [printed, setPrinted] = useState(0)
  const [ov, setOv] = useState<Overlay>({ pl: 0, pw: 0, ovTop: 0, ovH: 0, bailTop: 0 })
  const [footReady, setFootReady] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const camRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const h1Ref = useRef<HTMLHeadingElement>(null)
  const backRef = useRef<HTMLCanvasElement>(null)
  const frontRef = useRef<HTMLCanvasElement>(null)
  const footBackRef = useRef<HTMLCanvasElement>(null)
  const footFrontRef = useRef<HTMLCanvasElement>(null)
  const ctlRef = useRef<IntroController | null>(null)

  useEffect(() => {
    const ctl = new IntroController({
      els: () => ({
        root: rootRef.current,
        cam: camRef.current,
        paper: paperRef.current,
        h1: h1Ref.current,
        back: backRef.current,
        front: frontRef.current,
        footBack: footBackRef.current,
        footFront: footFrontRef.current,
      }),
      setPhase,
      setPrinted,
      setOverlay: (o) => setOv((prev) => ({ ...prev, ...o })),
      setFootReady,
    })
    ctlRef.current = ctl
    const hash = decodeURIComponent(window.location.hash.slice(1))
    ctl.start({ skipIntro: SECTION_IDS.includes(hash) })
    return () => {
      ctl.destroy()
      ctlRef.current = null
    }
  }, [])

  const skip = useCallback(() => ctlRef.current?.skip(), [])

  const intro = phase === 'boot' || phase === 'type'
  const outro = phase === 'pull' || phase === 'reveal' || phase === 'final'
  const settled = outro && phase !== 'pull'
  const spellCls = phase === 'reveal' ? 'spell' : phase === 'final' ? '' : 'unspelled'
  const blockCls = phase === 'reveal' ? 'spell-block' : phase === 'final' ? '' : 'unspelled'
  const glVis = phase === 'type' || phase === 'pull' ? 'visible' : 'hidden'
  const litOp = phase === 'type' ? 1 : 0

  const rootStyle: CSSProperties = settled
    ? { height: 'auto', minHeight: '100vh', overflow: 'visible' }
    : { height: 'min(100vh, 1000px)', minHeight: 0, overflow: 'hidden' }
  const camStyle: CSSProperties = {
    position: settled ? 'relative' : 'absolute',
    height: settled ? 'auto' : '100%',
    paddingBottom: settled ? 390 : 0,
    opacity: phase === 'boot' ? 0 : 1,
  }
  const footVis = settled && footReady ? 'visible' : 'hidden'

  // j indexes into NAME (spaces included) so it lines up with the controller's `printed` count.
  let j = 0
  const nameWords = NAME.split(' ').map((w, wi) => (
    <span key={wi} aria-hidden="true" className="hero-word">
      {w.split('').map((ch, k) => {
        const on = outro || j < printed
        // Slight per-letter wobble and ink density, like real type.
        const style: CSSProperties = {
          opacity: on ? Number((0.8 + ((j * 37) % 19) / 100).toFixed(2)) : 0,
          transform: `translateY(${((((j * 13) % 5) - 2) * 0.7).toFixed(1)}px) rotate(${((((j * 7) % 5) - 2) * 0.45).toFixed(2)}deg)`,
        }
        j++
        if (k === w.length - 1) j++ // the space after the word
        return (
          <span key={k} data-cell="1" className={`ch${on ? ' ink-in' : ''}`} style={style}>
            {ch}
          </span>
        )
      })}
    </span>
  ))

  return (
    <div ref={rootRef} className="tw" style={rootStyle}>
      <canvas ref={backRef} aria-hidden="true" className="tw-gl back" style={{ visibility: glVis }} />

      <div ref={camRef} className="pg-cam" style={camStyle}>
        <canvas ref={footBackRef} aria-hidden="true" className="foot-gl back" style={{ visibility: footVis }} />
        <div className="pg-wrap">
          <div ref={paperRef} className="pg-paper">
            <div aria-hidden="true" className="pg-strip" />

            <main className="cv pg-inner">
              <nav aria-label="Primary" className="hero-nav">
                {LINKS.map((k) => (
                  <a key={k.href} className="tw-link" href={k.href} aria-label={k.aria}>
                    <span className="tw-ul">
                      {k.chars.map((c, i) => (
                        <span key={i} className={`ch ${spellCls}`} style={{ animationDelay: `${c.d}ms`, color: c.red ? 'var(--red)' : undefined }}>
                          {c.ch}
                        </span>
                      ))}
                    </span>
                  </a>
                ))}
              </nav>

              <h1 ref={h1Ref} aria-label={NAME} className="hero-name">
                {nameWords}
              </h1>
              <p className={`hero-tag ${blockCls}`}>love building things from Scratch, then Optimizing them.</p>

              <p className="sr-only">{INTRO_PLAIN}</p>
              <div aria-hidden="true" className="pg-lines">
                {LINES.map((words, li) => (
                  <p key={li}>
                    {words.map((w, wi) => (
                      <span key={wi}>
                        <span className="wd">
                          {w.chars.map((c, ci) => (
                            <span key={ci} className={`ch ${spellCls}${c.red ? ' red' : ''}`} style={{ animationDelay: `${c.d}ms` }}>
                              {c.ch}
                            </span>
                          ))}
                        </span>
                        {/* a space after each line too, so the lines can run together on phones */}
                        {w.sp || ' '}
                      </span>
                    ))}
                  </p>
                ))}
              </div>

              <CV />
            </main>

            <div aria-hidden="true" className="pg-strip r" />
            <div aria-hidden="true" className="pg-footshade" />
            <div aria-hidden="true" className="pg-footbail" />
            <Grain id="grainPaper" />
          </div>
        </div>

        <div aria-hidden="true" className="lit" style={{ left: ov.pl, width: ov.pw, top: ov.ovTop, height: ov.ovH, opacity: litOp }} />
        <div aria-hidden="true" className="lit-bail" style={{ left: ov.pl, width: ov.pw, top: ov.bailTop, opacity: litOp }} />
        <canvas ref={footFrontRef} aria-hidden="true" className="foot-gl front" style={{ visibility: footVis }} />
      </div>

      <canvas ref={frontRef} aria-hidden="true" className="tw-gl front" style={{ visibility: glVis }} />

      <div aria-hidden="true" className="vignette" style={{ opacity: litOp }} />

      <p aria-hidden="true" className="boot" style={{ visibility: phase === 'boot' ? 'visible' : 'hidden' }}>
        loading <span className="boot-dots">...</span>
      </p>

      <div className="intro-ctl" style={{ opacity: intro ? 1 : 0, visibility: intro ? 'visible' : 'hidden' }}>
        <button type="button" className="tw-btn tw-btn-dark" onClick={skip}>
          [ skip intro ]
        </button>
      </div>
    </div>
  )
}
