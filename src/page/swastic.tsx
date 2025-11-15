import {  useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Contact from '../components/contact/contact';
import About from '../components/about/About';
import Home from '../components/home/home';
import SwasyLine from '../components/swasylines/swasy_lines';
import './Swastic.css'

gsap.registerPlugin(ScrollTrigger);

function Swastic() {

  const contactRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    if (contactRef.current) {
      scrollTriggerRef.current = ScrollTrigger.create({
        trigger: contactRef.current,
        start: 'bottom bottom',
        onEnter: () => {
          
        },
        once: true
      });
    }

    return () => {
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
      }
    };
  }, []);

  return (
    <>
      <div className='wrapper'>
      <Home />
      <SwasyLine 
  middleImages={['/g1.png']} 
  repeatCount={15} 
/>
      <About />
      <div ref={contactRef}>
        <Contact />
      </div>
      {/* {showProject && <Project />} */}
     </div>
    </>
  )
}

export default Swastic
