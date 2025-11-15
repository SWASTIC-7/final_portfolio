import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Blog.css';

gsap.registerPlugin(ScrollTrigger);

const splitToChars = (text: string) =>
  text.split('').map((ch, i) => <span className="char" key={i}>{ch === ' ' ? '\u00A0' : ch}</span>);

const Blog = () => {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const meshRef = useRef<HTMLImageElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!sectionRef.current || !titleRef.current) return;

    const ctx = gsap.context(() => {
      const chars = gsap.utils.toArray<HTMLElement>('.char');

      // initial state
      gsap.set(chars, { y: 40, opacity: 0, rotationX: -50, transformOrigin: 'center center' });

      // entrance on scroll when section top reaches center of viewport
      gsap.to(chars, {
        y: 0,
        opacity: 1,
        rotationX: 0,
        duration: 0.8,
        ease: 'expo.out',
        stagger: 0.02,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top center',
          toggleActions: 'play none none reverse',
          markers: false,
          invalidateOnRefresh: true
        }
      });

      // gentle floating for the whole title after entrance
      gsap.to(titleRef.current, {
        y: -8,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 1.2
      });

      // mesh hover interaction
      if (meshRef.current) {
        meshRef.current.addEventListener('mouseenter', () => {
          gsap.to(meshRef.current, { scale: 1.06, duration: 0.4, ease: 'power2.out' });
        });
        meshRef.current.addEventListener('mouseleave', () => {
          gsap.to(meshRef.current, { scale: 1, duration: 0.5, ease: 'power2.out' });
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Cursor-interactive floating effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      
      setMousePos({ x, y });
    };

    const section = sectionRef.current;
    if (section) {
      section.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (section) {
        section.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  // Apply cursor-based movement to characters
  useEffect(() => {
    if (!titleRef.current) return;

    const chars = gsap.utils.toArray<HTMLElement>('.char');
    
    chars.forEach((char, index) => {
      const depth = (index % 3 + 1) * 0.5; // Varying depth for parallax
      
      gsap.to(char, {
        x: mousePos.x * 30 * depth,
        y: mousePos.y * 20 * depth,
        rotationY: mousePos.x * 10 * depth,
        rotationX: -mousePos.y * 10 * depth,
        duration: 0.8,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });

    // Move mesh with cursor
    if (meshRef.current) {
      gsap.to(meshRef.current, {
        x: mousePos.x * 50,
        y: mousePos.y * 30,
        rotationY: mousePos.x * 15,
        rotationX: -mousePos.y * 15,
        duration: 1,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    }
  }, [mousePos]);

  return (
    <div className='Blog' ref={sectionRef}>
      <h1 ref={titleRef} className="blog-heading">
        {splitToChars('READ OUT MY') }
        <br />
        <a href="https://swastic-7.github.io/sw4sy-Bl0gs/#/my-blogs">{splitToChars('BLOGS')}</a>
      </h1>

      <img ref={meshRef} src="/mesh.svg" alt="mesh" className="blog-mesh" />
    </div>
  );
};

export default Blog;