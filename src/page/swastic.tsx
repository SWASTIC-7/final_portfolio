import {  useEffect, useRef, useState } from 'react';
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSoundPrompt, setShowSoundPrompt] = useState(true);
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

  useEffect(() => {
    // Setup audio but don't autoplay (will wait for user interaction)
    if (!audioRef.current) return;
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const handleEnableSound = () => {
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setShowSoundPrompt(false);
        })
        .catch((error) => {
          console.error('Audio play failed:', error);
          setShowSoundPrompt(false); // Hide prompt even if play fails
        });
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.error('Audio play failed:', error);
      });
    }
  };

  return (
    <>
      <div className='wrapper'>
        <audio ref={audioRef} src="/audio.mp3" preload="auto" />
        
        {/* Sound enable prompt overlay */}
        {showSoundPrompt && (
          <div className="sound-prompt-overlay" onClick={handleEnableSound}>
            <div className="sound-prompt-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
              <p>Click anywhere to enable sound</p>
            </div>
          </div>
        )}
        
        {/* Floating music control button */}
        <button className="music-control" onClick={toggleAudio}>
          {isPlaying ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
            </svg>
          )}
        </button>

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
