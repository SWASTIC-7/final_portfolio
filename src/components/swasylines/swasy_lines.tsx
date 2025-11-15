import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './swasy_lines.css';

gsap.registerPlugin(ScrollTrigger);

interface SwasyLineProps {
  middleImages?: string[];
  repeatCount?: number;
}

function SwasyLine({ 
  middleImages = ['/g1.png', '/g1.png', '/g1.png', '/g1.png', '/g1.png'],
  repeatCount = 3
}: SwasyLineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    const images = imagesRef.current.filter(Boolean) as HTMLImageElement[];
    
    if (images.length === 0 || !containerRef.current) return;

    // Pin the container during animation
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'center center',
      end: '+=100%',
      pin: true,
      scrub: false,
    });

    // Animate all images
    images.forEach((img) => {
      const isMiddle = img.classList.contains('middle-image');

      gsap.fromTo(
        img,
        { x: 0, rotation: 0 },
        {
          x: 300,
          rotation: isMiddle ? 360 : 0,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'center center',
            end: '+=100%',
            scrub: 1,
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [middleImages, repeatCount]);

  return (
    <div className="swasy_line" ref={containerRef}>
      <div className="swasy_line__container">
        {Array.from({ length: repeatCount }).map((_, groupIndex) => (
          <React.Fragment key={groupIndex}>
            <div className="swasy_line__image-wrapper">
              <img 
                ref={(el) => { imagesRef.current[groupIndex * (middleImages.length + 2)] = el; }}
                src="/g2.png" 
                alt="g2" 
                className="swasy_line__image g2-image" 
              />
            </div>

            {middleImages.map((src, index) => (
              <div
                key={`middle-${groupIndex}-${index}`}
                className="swasy_line__image-wrapper"
              >
                <img 
                  ref={(el) => { imagesRef.current[groupIndex * (middleImages.length + 2) + index + 1] = el; }}
                  src={src} 
                  alt={`decoration-${index}`} 
                  className="swasy_line__image middle-image" 
                />
              </div>
            ))}

            <div className="swasy_line__image-wrapper">
              <img 
                ref={(el) => { imagesRef.current[groupIndex * (middleImages.length + 2) + middleImages.length + 1] = el; }}
                src="/g3.png" 
                alt="g3" 
                className="swasy_line__image g3-image" 
              />
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default SwasyLine;