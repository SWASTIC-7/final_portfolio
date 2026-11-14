import { Fragment } from 'react'
import type { ReactNode } from 'react'

/** FNV-1a, so each word's reveal delay is stable across renders and builds. */
function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/**
 * Typed text for the CV blocks. Every word becomes a span that fades in at one of twelve
 * staggered delays when its `.rv` block scrolls into view; `*like this*` marks a key phrase
 * in ribbon red.
 */
export function T({ children }: { children: string }) {
  let wi = 0
  const words = (seg: string): ReactNode[] =>
    seg.split(/(\s+)/).map((tok, ti) => {
      if (!tok) return null
      if (/^\s+$/.test(tok)) return ' '
      const d = hash(tok + ':' + wi++) % 12
      return (
        <span key={ti} className={`w d${d}`}>
          {tok}
        </span>
      )
    })
  return (
    <>
      {children.split('*').map((seg, si) =>
        si % 2 ? (
          <span key={si} className="cv-key">
            {words(seg)}
          </span>
        ) : (
          <Fragment key={si}>{words(seg)}</Fragment>
        ),
      )}
    </>
  )
}
