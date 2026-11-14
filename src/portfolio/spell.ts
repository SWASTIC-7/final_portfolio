/** Seeded generator for the hero's "spelling" reveal delays. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export interface SpellChar {
  ch: string
  d: number
  red: boolean
}
export interface SpellWord {
  chars: SpellChar[]
  sp: string
}

/** Splits text into words of characters, each with its own reveal delay (150 to 2150 ms). */
export function makeSpeller(seed: number) {
  const rnd = rng(seed)
  return (text: string): SpellWord[] => {
    const out: SpellWord[] = []
    let cur: SpellChar[] = []
    let red = false
    for (const ch of text) {
      if (ch === '*') {
        red = !red
        continue
      }
      if (ch === ' ') {
        if (cur.length) {
          out.push({ chars: cur, sp: ' ' })
          cur = []
        }
        continue
      }
      cur.push({ ch, d: Math.round(150 + rnd() * 2000), red })
    }
    if (cur.length) out.push({ chars: cur, sp: '' })
    return out
  }
}
