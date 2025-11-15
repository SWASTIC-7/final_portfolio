import {  useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Contact from '../components/contact/contact';
import About from '../components/about/About';
import Home from '../components/home/home';
import SwasyLine from '../components/swasylines/swasy_lines';
import Project_section from '../components/project_section/project_section';
import Blog from '../components/blog/blog';
import './Swastic.css'

gsap.registerPlugin(ScrollTrigger);

function Swastic() {

  const contactRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Handle scroll navigation from external pages
    if (location.state?.scrollTo) {
      setTimeout(() => {
        const sectionMap: Record<string, string> = {
          about: '.About',
          projects: '.manly',
          blog: '.Blog',
          contact: '.Contact'
        };
        
        const selector = sectionMap[location.state.scrollTo];
        if (selector) {
          const section = document.querySelector(selector);
          section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location]);

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
      <SwasyLine 
        middleImages={['/g1.png']} 
        repeatCount={15} 
      /> 
      <Project_section/>
       {/* <Project/> */}
    <Blog/>
      
      <div ref={contactRef}>
        <Contact />
      </div>
      
      
     </div>
    </>
  )
}

export default Swastic
