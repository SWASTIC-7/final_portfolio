import React, { useCallback, useEffect, useRef } from 'react';
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

const Cubes: React.FC<CubesProps> = ({
  gridSize = 10,
  cubeSize,
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

  const tiltAt = useCallback(
    (rowCenter: number, colCenter: number) => {
      if (!sceneRef.current) return;
      sceneRef.current.querySelectorAll<HTMLDivElement>('.cube').forEach(cube => {
        const r = +cube.dataset.row!;
        const c = +cube.dataset.col!;
        const dist = Math.hypot(r - rowCenter, c - colCenter);
        
        // Check if this cube is part of the text pattern
        const isTextCube = textPattern && r < textPattern.length && c < textPattern[0].length && textPattern[r][c] === 1;
        const baseRotateX = isTextCube ? -maxAngle : 0;
        const baseRotateY = isTextCube ? maxAngle : 0;
        
        if (dist <= radius) {
          const pct = 1 - dist / radius;
          const angle = pct * maxAngle;
          gsap.to(cube, {
            duration: enterDur,
            ease: easing,
            overwrite: true,
            rotateX: baseRotateX + (-angle * 0.5),
            rotateY: baseRotateY + (angle * 0.5)
          });
        } else {
          gsap.to(cube, {
            duration: leaveDur,
            ease: 'power3.out',
            overwrite: true,
            rotateX: baseRotateX,
            rotateY: baseRotateY
          });
        }
      });
    },
    [radius, maxAngle, enterDur, leaveDur, easing, textPattern]
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      userActiveRef.current = true;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      if (!sceneRef.current) return;
      
      // Get the actual position within the grid
      const cubes = sceneRef.current.querySelectorAll<HTMLDivElement>('.cube');
      if (cubes.length === 0) return;
      
      let closestCube: HTMLDivElement | null = null;
      let minDist = Infinity;
      
      cubes.forEach(cube => {
        const rect = cube.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
        
        if (dist < minDist) {
          minDist = dist;
          closestCube = cube;
        }
      });
      
      if (closestCube) {
        const rowCenter = +((closestCube as HTMLDivElement).dataset.row || '0');
        const colCenter = +((closestCube as HTMLDivElement).dataset.col || '0');
        
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => tiltAt(rowCenter, colCenter));
      }

      idleTimerRef.current = setTimeout(() => {
        userActiveRef.current = false;
      }, 3000);
    },
    [gridSize, tiltAt, textPattern]
  );

  const resetAll = useCallback(() => {
    if (!sceneRef.current) return;
    sceneRef.current.querySelectorAll<HTMLDivElement>('.cube').forEach(cube => {
      const r = +cube.dataset.row!;
      const c = +cube.dataset.col!;
      const isTextCube = textPattern && r < textPattern.length && c < textPattern[0].length && textPattern[r][c] === 1;
      
      gsap.to(cube, {
        duration: leaveDur,
        rotateX: isTextCube ? -maxAngle : 0,
        rotateY: isTextCube ? maxAngle : 0,
        ease: 'power3.out'
      });
    });
  }, [leaveDur, textPattern, maxAngle]);

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      userActiveRef.current = true;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      if (!sceneRef.current) return;
      
      const touch = e.touches[0];
      const cubes = sceneRef.current.querySelectorAll<HTMLDivElement>('.cube');
      if (cubes.length === 0) return;
      
      let closestCube: HTMLDivElement | null = null;
      let minDist = Infinity;
      
      cubes.forEach(cube => {
        const rect = cube.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.hypot(touch.clientX - centerX, touch.clientY - centerY);
        
        if (dist < minDist) {
          minDist = dist;
          closestCube = cube;
        }
      });
      
      if (closestCube) {
        const rowCenter = +((closestCube as HTMLDivElement).dataset.row || '0');
        const colCenter = +((closestCube as HTMLDivElement).dataset.col || '0');
        
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => tiltAt(rowCenter, colCenter));
      }

      idleTimerRef.current = setTimeout(() => {
        userActiveRef.current = false;
      }, 3000);
    },
    [gridSize, tiltAt, textPattern]
  );

  const onTouchStart = useCallback(() => {
    userActiveRef.current = true;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!sceneRef.current) return;
    resetAll();
  }, [resetAll]);

  const onClick = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!rippleOnClick || !sceneRef.current) return;
      
      const clientX = (e as MouseEvent).clientX || ((e as TouchEvent).touches?.[0]?.clientX || 0);
      const clientY = (e as MouseEvent).clientY || ((e as TouchEvent).touches?.[0]?.clientY || 0);

      // Find the closest cube to the click position
      const cubes = sceneRef.current.querySelectorAll<HTMLDivElement>('.cube');
      let closestCube: HTMLDivElement | null = null;
      let minDist = Infinity;
      
      cubes.forEach((cube: HTMLDivElement) => {
        const rect = cube.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.hypot(clientX - centerX, clientY - centerY);
        
        if (dist < minDist) {
          minDist = dist;
          closestCube = cube;
        }
      });
      
      if (!closestCube) return;
      
      const colHit = +((closestCube as HTMLDivElement).dataset.col || '0');
      const rowHit = +((closestCube as HTMLDivElement).dataset.row || '0');

      const baseRingDelay = 0.15;
      const baseAnimDur = 0.3;
      const baseHold = 0.6;

      const spreadDelay = baseRingDelay / rippleSpeed;
      const animDuration = baseAnimDur / rippleSpeed;
      const holdTime = baseHold / rippleSpeed;

      const rings: Record<number, HTMLDivElement[]> = {};
      sceneRef.current.querySelectorAll<HTMLDivElement>('.cube').forEach((cube: HTMLDivElement) => {
        const r = +(cube.dataset.row || '0');
        const c = +(cube.dataset.col || '0');
        const dist = Math.hypot(r - rowHit, c - colHit);
        const ring = Math.round(dist);
        if (!rings[ring]) rings[ring] = [];
        rings[ring].push(cube);
      });

      Object.keys(rings)
        .map(Number)
        .sort((a, b) => a - b)
        .forEach(ring => {
          const delay = ring * spreadDelay;
          const faces = rings[ring].flatMap((cube: HTMLDivElement) => 
            Array.from(cube.querySelectorAll<HTMLElement>('.cube-face'))
          );

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
    [rippleOnClick, gridSize, faceColor, rippleColor, rippleSpeed, textPattern]
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

  const rows = textPattern ? textPattern.length : gridSize;
  const cols = textPattern ? textPattern[0].length : gridSize;
  const cellsRows = Array.from({ length: rows });
  const cellsCols = Array.from({ length: cols });
  
  const sceneStyle: React.CSSProperties = {
    gridTemplateColumns: cubeSize ? `repeat(${cols}, ${cubeSize}px)` : `repeat(${cols}, 1fr)`,
    gridTemplateRows: cubeSize ? `repeat(${rows}, ${cubeSize}px)` : `repeat(${rows}, 1fr)`,
    columnGap: colGap,
    rowGap: rowGap
  };
  const wrapperStyle = {
    '--cube-face-border': borderStyle,
    '--cube-face-bg': faceColor,
    '--cube-face-shadow': shadow === true ? '0 0 6px rgba(0,0,0,.5)' : shadow || 'none',
    ...(cubeSize
      ? {
          width: `${cols * cubeSize}px`,
          height: `${rows * cubeSize}px`
        }
      : {})
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
