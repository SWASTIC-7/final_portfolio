import { useEffect, useRef } from 'react'
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './About.css'
import Man from './man'
import Radar from './radar';

gsap.registerPlugin(ScrollTrigger);

function About() {
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const line3Ref = useRef<HTMLSpanElement>(null);
  const catchyLine1Ref = useRef<HTMLSpanElement>(null);
  const catchyLine2Ref = useRef<HTMLSpanElement>(null);
  const catchyLine3Ref = useRef<HTMLSpanElement>(null);
  const stripsContainerRef = useRef<HTMLDivElement>(null);
  const manRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lines = [line1Ref.current, line2Ref.current, line3Ref.current];
    const catchyLines = [catchyLine1Ref.current, catchyLine2Ref.current, catchyLine3Ref.current];
    
    // Create strips
    const numStrips = 20;
    const strips: HTMLDivElement[] = [];
    
    if (stripsContainerRef.current) {
      for (let i = 0; i < numStrips; i++) {
        const strip = document.createElement('div');
        strip.className = 'strip';
        strip.style.cssText = `
          position: absolute;
          top: ${(i / numStrips) * 100}%;
          left: 0;
          width: 100%;
          height: ${100 / numStrips}%;
          background-color: #000;
          z-index: 100;
        `;
        stripsContainerRef.current.appendChild(strip);
        strips.push(strip);
      }
    }
    
    // Set initial state for both sets of lines
    gsap.set([...lines, ...catchyLines], { 
      opacity: 0, 
      y: 50,
      rotationX: -45,
      transformOrigin: "center center"
    });

    // Set initial state for strips
    gsap.set(strips, { x: 0 });

    // Create a timeline for smooth sequential animation
    const tl = gsap.timeline({ 
      defaults: { ease: "power3.out" },
      paused: true
    });
    
    // Build the animation timeline
    tl.to(strips, {
      x: '100%',
      duration: 1.2,
      stagger: {
        each: 0.05,
        from: 'random'
      },
      ease: "power4.inOut"
    })
    .to(lines, {
      opacity: 1,
      y: 0,
      rotationX: 0,
      duration: 1.2,
      stagger: 0.3,
    }, "-=0.8")
    .to(lines, {
      textShadow: "0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.1)",
      duration: 0.8,
      stagger: 0.2,
    }, "-=0.6")
    .to(catchyLines, {
      opacity: 1,
      y: 0,
      rotationX: 0,
      duration: 1.2,
      stagger: 0.3,
    }, "-=0.3")
    .to(catchyLines, {
      textShadow: "0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.1)",
      duration: 0.8,
      stagger: 0.2,
    }, "-=0.6");

    // Create ScrollTrigger that plays the timeline
    ScrollTrigger.create({
      trigger: aboutRef.current,
      start: 'top bottom',
      once: true,
      onEnter: () => tl.play()
    });

    // Pin the About section for a while to let animations play
    ScrollTrigger.create({
      trigger: aboutRef.current,
      start: 'top top',
      end: '+=150%',
      pin: true,
      scrub: false,
    });

    // Cleanup
    return () => {
      tl.kill();
      strips.forEach(strip => strip.remove());
    };
  }, []);

  useEffect(() => {
    // Set initial state for radar and man
    gsap.set(radarRef.current, {
      opacity: 0,
      scale: 0.5
    });

    gsap.set(manRef.current, { x: 0 });

    // Scroll-triggered animation for man
    gsap.to(manRef.current, {
      x: 300,
      scrollTrigger: {
        trigger: aboutRef.current,
        start: 'top 20%',
        end: 'bottom top',
        scrub: 1,
      }
    });

    // Scroll-triggered animation for radar
    gsap.to(radarRef.current, {
      opacity: 1,
      scale: 1,
      scrollTrigger: {
        trigger: aboutRef.current,
        start: 'top 20%',
        end: '50% center',
        scrub: 1,
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div className='About' ref={aboutRef} style={{ position: 'relative', overflow: 'hidden' }}>
        <div ref={stripsContainerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }}></div>
       
        <div className="man-container" ref={manRef}>
          <div ref={radarRef}>
            <Radar/>
          </div>
          <Man/>
        </div>

        <div className='About_decription'>
          <h3>
            <span ref={line1Ref} style={{ display: 'inline-block' }}>Every Light counts</span><br/>
            <span ref={line2Ref} style={{ display: 'inline-block' }}>when you build</span><br/>
            <span ref={line3Ref} style={{ display: 'inline-block' }}>in the dark...</span>
          </h3>
        </div>

        <div className='catchy_line'>
          <p>
            <span ref={catchyLine1Ref} style={{ display: 'inline-block' }}>Call me:</span><br/>
            <span ref={catchyLine2Ref} style={{ display: 'inline-block' }}>If I respond, I'm in the light.</span><br/>
            <span ref={catchyLine3Ref} style={{ display: 'inline-block' }}>If not, I'm somewhere darker.</span>
          </p>
        </div>
    </div>
  )
}

export default About