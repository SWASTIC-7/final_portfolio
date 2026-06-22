import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import './Cubes.css';

interface Gap {
  row: number;
  col: number;
}
interface Duration {
  enter: number;
  leave: number;
}

export interface CubesProps {
  gridSize?: number;
  cubeSize?: number;
  maxAngle?: number;
  radius?: number;
  easing?: gsap.EaseString;
  duration?: Duration;
  cellGap?: number | Gap;
  borderStyle?: string;
  faceColor?: string;
  shadow?: boolean | string;
  autoAnimate?: boolean;
  rippleOnClick?: boolean;
  rippleColor?: string;
  rippleSpeed?: number;
  textPattern?: number[][];
  highlightColor?: string;
  logoMapping?: Record<string, string>;
  logoLinks?: Record<string, string>;
}

// Cached, per-cube metadata so we never touch the DOM (querySelectorAll /
// getBoundingClientRect) inside the pointer/animation hot paths.
interface CubeMeta {
  el: HTMLDivElement;
  r: number;
  c: number;
  isText: boolean;
  baseX: number;
  baseY: number;
  faces: HTMLElement[];
}

const Cubes: React.FC<CubesProps> = ({
  gridSize = 10,
  maxAngle = 45,
  radius = 3,
  easing = 'power3.out',
  duration = { enter: 0.3, leave: 0.6 },
  cellGap,
  borderStyle = '1px solid #fff',
  faceColor = '#060010',
  shadow = false,
  autoAnimate = true,
  rippleOnClick = true,
  rippleColor = '#fff',
  rippleSpeed = 2,
  textPattern,
  highlightColor = '#5227FF',
  logoMapping = {},
  logoLinks = {}
}) => {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userActiveRef = useRef(false);
  const simPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const simTargetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const simRAFRef = useRef<number | null>(null);

  // Cached cube metadata + the set of cubes currently tilted away from base.
  const cubesRef = useRef<CubeMeta[]>([]);
  const activeRef = useRef<Set<CubeMeta>>(new Set());
  // Latest pointer coords waiting to be processed on the next animation frame.
  const pointerRef = useRef<{ x: number; y: number } | null>(null);

  const rows = textPattern ? textPattern.length : gridSize;
  const cols = textPattern ? textPattern[0].length : gridSize;

  const colGap =
    typeof cellGap === 'number'
      ? `${cellGap}px`
      : (cellGap as Gap)?.col !== undefined
        ? `${(cellGap as Gap).col}px`
        : '5%';
  const rowGap =
    typeof cellGap === 'number'
      ? `${cellGap}px`
      : (cellGap as Gap)?.row !== undefined
        ? `${(cellGap as Gap).row}px`
        : '5%';

  const enterDur = duration.enter;
  const leaveDur = duration.leave;

  // Build the cube metadata cache once the grid is in the DOM. Re-runs only when
  // the structural inputs (pattern / size / base angle) change — never per frame.
  const buildCache = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const meta: CubeMeta[] = [];
    scene.querySelectorAll<HTMLDivElement>('.cube').forEach(cube => {
      const r = +cube.dataset.row!;
      const c = +cube.dataset.col!;
      const isText = !!(
        textPattern &&
        r < textPattern.length &&
        c < textPattern[0].length &&
        textPattern[r][c] === 1
      );
      meta.push({
        el: cube,
        r,
        c,
        isText,
        baseX: isText ? -maxAngle : 0,
        baseY: isText ? maxAngle : 0,
        faces: Array.from(cube.querySelectorAll<HTMLElement>('.cube-face'))
      });
    });
    cubesRef.current = meta;
    activeRef.current = new Set();
  }, [textPattern, maxAngle]);

  useLayoutEffect(() => {
    buildCache();
  }, [buildCache]);

  // Tilt cubes toward (rowCenter, colCenter). Only cubes inside `radius` get a
  // tween, and only cubes that just left the radius get reset — so we touch
  // ~the affected neighbourhood per frame instead of all ~500 cubes.
  const tiltAt = useCallback(
    (rowCenter: number, colCenter: number) => {
      const cubes = cubesRef.current;
      if (!cubes.length) return;

      const next = new Set<CubeMeta>();
      for (let i = 0; i < cubes.length; i++) {
        const cm = cubes[i];
        const dist = Math.hypot(cm.r - rowCenter, cm.c - colCenter);
        if (dist <= radius) {
          next.add(cm);
          const pct = 1 - dist / radius;
          const angle = pct * maxAngle;
          gsap.to(cm.el, {
            duration: enterDur,
            ease: easing,
            overwrite: true,
            rotateX: cm.baseX + -angle * 0.5,
            rotateY: cm.baseY + angle * 0.5
          });
        }
      }

      // Reset cubes that were tilted last frame but are no longer in range.
      activeRef.current.forEach(cm => {
        if (!next.has(cm)) {
          gsap.to(cm.el, {
            duration: leaveDur,
            ease: 'power3.out',
            overwrite: true,
            rotateX: cm.baseX,
            rotateY: cm.baseY
          });
        }
      });
      activeRef.current = next;
    },
    [radius, maxAngle, enterDur, leaveDur, easing]
  );

  // rAF-coalesce pointer/touch input: many move events collapse into one tilt
  // per frame, and we read the scene rect once (not once per cube).
  const scheduleMove = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const p = pointerRef.current;
      const scene = sceneRef.current;
      if (!p || !scene) return;
      const rect = scene.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const col = Math.min(
        cols - 1,
        Math.max(0, Math.floor(((p.x - rect.left) / rect.width) * cols))
      );
      const row = Math.min(
        rows - 1,
        Math.max(0, Math.floor(((p.y - rect.top) / rect.height) * rows))
      );
      tiltAt(row, col);
    });
  }, [cols, rows, tiltAt]);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      userActiveRef.current = true;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      pointerRef.current = { x: e.clientX, y: e.clientY };
      scheduleMove();

      idleTimerRef.current = setTimeout(() => {
        userActiveRef.current = false;
      }, 3000);
    },
    [scheduleMove]
  );

  const resetAll = useCallback(() => {
    activeRef.current.forEach(cm => {
      gsap.to(cm.el, {
        duration: leaveDur,
        rotateX: cm.baseX,
        rotateY: cm.baseY,
        ease: 'power3.out',
        overwrite: true
      });
    });
    activeRef.current = new Set();
  }, [leaveDur]);

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      userActiveRef.current = true;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      const touch = e.touches[0];
      if (!touch) return;
      pointerRef.current = { x: touch.clientX, y: touch.clientY };
      scheduleMove();

      idleTimerRef.current = setTimeout(() => {
        userActiveRef.current = false;
      }, 3000);
    },
    [scheduleMove]
  );

  const onTouchStart = useCallback(() => {
    userActiveRef.current = true;
  }, []);

  const onTouchEnd = useCallback(() => {
    resetAll();
  }, [resetAll]);

  const onClick = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!rippleOnClick || !sceneRef.current) return;
      const cubes = cubesRef.current;
      if (!cubes.length) return;

      const clientX = (e as MouseEvent).clientX || ((e as TouchEvent).touches?.[0]?.clientX || 0);
      const clientY = (e as MouseEvent).clientY || ((e as TouchEvent).touches?.[0]?.clientY || 0);

      // Derive the hit cell from the scene rect (one read) instead of measuring
      // every cube.
      const rect = sceneRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const colHit = Math.min(
        cols - 1,
        Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * cols))
      );
      const rowHit = Math.min(
        rows - 1,
        Math.max(0, Math.floor(((clientY - rect.top) / rect.height) * rows))
      );

      const baseRingDelay = 0.15;
      const baseAnimDur = 0.3;
      const baseHold = 0.6;

      const spreadDelay = baseRingDelay / rippleSpeed;
      const animDuration = baseAnimDur / rippleSpeed;
      const holdTime = baseHold / rippleSpeed;

      const rings: Record<number, HTMLElement[]> = {};
      for (let i = 0; i < cubes.length; i++) {
        const cm = cubes[i];
        const dist = Math.hypot(cm.r - rowHit, cm.c - colHit);
        const ring = Math.round(dist);
        if (!rings[ring]) rings[ring] = [];
        // Push the cached faces directly — no per-cube DOM query.
        for (let f = 0; f < cm.faces.length; f++) rings[ring].push(cm.faces[f]);
      }

      Object.keys(rings)
        .map(Number)
        .sort((a, b) => a - b)
        .forEach(ring => {
          const delay = ring * spreadDelay;
          const faces = rings[ring];

          gsap.to(faces, {
            backgroundColor: rippleColor,
            duration: animDuration,
            delay,
            ease: 'power3.out'
          });
          gsap.to(faces, {
            backgroundColor: faceColor,
            duration: animDuration,
            delay: delay + animDuration + holdTime,
            ease: 'power3.out'
          });
        });
    },
    [rippleOnClick, cols, rows, faceColor, rippleColor, rippleSpeed]
  );

  useEffect(() => {
    if (!sceneRef.current) return;

    // Apply text pattern if provided
    if (textPattern && textPattern.length > 0) {
      sceneRef.current.querySelectorAll<HTMLDivElement>('.cube').forEach(cube => {
        const r = +cube.dataset.row!;
        const c = +cube.dataset.col!;

        if (r < textPattern.length && c < textPattern[0].length) {
          const cellValue = textPattern[r][c];

          // If cellValue is 1, rotate and apply highlight color
          if (cellValue === 1) {
            gsap.to(cube, {
              rotateX: -maxAngle,
              rotateY: maxAngle,
              duration: 0.8,
              ease: 'power3.out',
              delay: (r + c) * 0.02
            });

            // Apply highlight color to all faces
            const faces = cube.querySelectorAll<HTMLElement>('.cube-face');
            faces.forEach(face => {
              face.style.backgroundColor = highlightColor;
            });
          }
        }
      });
      return;
    }

    if (!autoAnimate) return;
    simPosRef.current = {
      x: Math.random() * gridSize,
      y: Math.random() * gridSize
    };
    simTargetRef.current = {
      x: Math.random() * gridSize,
      y: Math.random() * gridSize
    };
    const speed = 0.02;
    const loop = () => {
      if (!userActiveRef.current) {
        const pos = simPosRef.current;
        const tgt = simTargetRef.current;
        pos.x += (tgt.x - pos.x) * speed;
        pos.y += (tgt.y - pos.y) * speed;
        tiltAt(pos.y, pos.x);
        if (Math.hypot(pos.x - tgt.x, pos.y - tgt.y) < 0.1) {
          simTargetRef.current = {
            x: Math.random() * gridSize,
            y: Math.random() * gridSize
          };
        }
      }
      simRAFRef.current = requestAnimationFrame(loop);
    };
    simRAFRef.current = requestAnimationFrame(loop);
    return () => {
      if (simRAFRef.current != null) {
        cancelAnimationFrame(simRAFRef.current);
      }
    };
  }, [autoAnimate, gridSize, tiltAt, textPattern, maxAngle, highlightColor]);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerleave', resetAll);
    el.addEventListener('click', onClick);

    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerleave', resetAll);
      el.removeEventListener('click', onClick);

      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);

      rafRef.current != null && cancelAnimationFrame(rafRef.current);
      idleTimerRef.current && clearTimeout(idleTimerRef.current);
    };
  }, [onPointerMove, resetAll, onClick, onTouchMove, onTouchStart, onTouchEnd]);

  const cellsRows = Array.from({ length: rows });
  const cellsCols = Array.from({ length: cols });

  const sceneStyle: React.CSSProperties = {
    // Use fractional columns so cells stretch to fill the container width (100vw).
    // This makes the grid fill the full viewport width and the .cube aspect-ratio keeps them square.
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    columnGap: colGap,
    rowGap: rowGap
  };
  const wrapperStyle = {
    '--cube-face-border': borderStyle,
    '--cube-face-bg': faceColor,
    '--cube-face-shadow': shadow === true ? '0 0 6px rgba(0,0,0,.5)' : shadow || 'none',
    // Force wrapper to span full viewport width so cubes occupy 100vw.
    width: '100vw',
    maxWidth: '100vw',
    boxSizing: 'border-box'
   } as React.CSSProperties;

  return (
    <div className="default-animation" style={wrapperStyle}>
      <div ref={sceneRef} className="default-animation--scene" style={sceneStyle}>
        {cellsRows.map((_, r) =>
          cellsCols.map((__, c) => {
            const cellKey = `${r}-${c}`;
            const logoUrl = logoMapping[cellKey];
            const logoLink = logoLinks[cellKey];
            const shouldHide = textPattern && textPattern[r] && textPattern[r][c] === -1;

            if (shouldHide && !logoUrl) {
              return <div key={cellKey} style={{ visibility: 'hidden' }} />;
            }

            if (logoUrl) {
              return (
                <div key={cellKey} className="logo-container" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10%',
                }}>
                  <a
                    href={logoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img
                      src={logoUrl}
                      alt="social logo"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        cursor: 'pointer'
                      }}
                    />
                  </a>
                </div>
              );
            }

            return (
              <div key={cellKey} className="cube" data-row={r} data-col={c}>
                <div className="cube-face cube-face--top" />
                <div className="cube-face cube-face--bottom" />
                <div className="cube-face cube-face--left" />
                <div className="cube-face cube-face--right" />
                <div className="cube-face cube-face--front" />
                <div className="cube-face cube-face--back" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Cubes;
