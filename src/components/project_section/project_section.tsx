import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './project_section.css';

gsap.registerPlugin(ScrollTrigger);

const splitToChars = (text: string) =>
  text.split('').map((ch, i) => (
    <span className="char-project" key={i} style={{ display: 'inline-block' }}>
      {ch === ' ' ? '\u00A0' : ch}
    </span>
  ));

export const Project_section = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleNavigate = () => {
    navigate('/projects');
  };

  useEffect(() => {
    if (!sectionRef.current || !headingRef.current || !imageRef.current || !haloRef.current) return;

    const ctx = gsap.context(() => {
      // Set initial states
      gsap.set(headingRef.current, {
        x: -200,
        opacity: 1
      });

      gsap.set(haloRef.current, {
        scale: 0,
        opacity: 0
      });

      // Create a single ScrollTrigger that controls the pin duration
      const mainTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=3000',
          scrub: 1,
          pin: true,
          anticipatePin: 1
        }
      });

      // Text translation
      mainTimeline.to(headingRef.current, {
        x: 1300,
        duration: 1,
        ease: 'none'
      }, 0);

      // Halo appears after text moves
      mainTimeline.to(haloRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.3,
        ease: 'back.out(1.7)'
      }, 0.5);

      // Continuous animations (start after scrolling completes)
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=3000',
        onLeave: () => {
          // Pulsing halo
          gsap.to(haloRef.current, {
            scale: 1.1,
            opacity: 0.8,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
          });

          // Rotate halo
          gsap.to(haloRef.current, {
            rotation: 360,
            duration: 20,
            repeat: -1,
            ease: 'none'
          });
        }
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Track mouse position for button border gradient
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!buttonRef.current) return;
      
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setMousePos({ x, y });
    };

    const button = buttonRef.current;
    if (button) {
      button.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (button) {
        button.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  return (
    <div className="manly" ref={sectionRef}>
      <h1 ref={headingRef} className="project-heading">
        {splitToChars('CHECKOUT MY PROJECTS')}
      </h1>
      
      <div className="image-container">
        <div className="halo-effect" ref={haloRef}>
          <div className="halo-line halo-line-1"></div>
          <div className="halo-line halo-line-2"></div>
          <div className="halo-line halo-line-3"></div>
          <div className="halo-line halo-line-4"></div>
          <div className="halo-line halo-line-5"></div>
          <div className="halo-line halo-line-6"></div>
        </div>
        <img ref={imageRef} src="/style_man.svg" alt="style man" className="project-image" />
      </div>

      <button 
        ref={buttonRef} 
        className="projects-button"
        onClick={handleNavigate}
        style={{
          '--mouse-x': `${mousePos.x}px`,
          '--mouse-y': `${mousePos.y}px`,
          opacity: 1,
          transform: 'scale(1)'
        } as React.CSSProperties}
      >
        <div className="button-border-gradient"></div>
        <div className="button-inner">
          <span className="button-text">[VIEW PROJECTS]</span>
          <svg className="button-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
        <div className="button-shine"></div>
      </button>
    </div>
  );
};

export default Project_section;