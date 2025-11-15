import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import './navbar.css';

interface NavbarProps {
  activeSection?: string;
  onNavigate?: (section: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeSection = 'HOME', onNavigate }) => {
  const navItems = ['[HOME]', '[PROJECTS]', '[BLOGS]', '[CONTACT]'];
  const navRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const targetPos = useRef({ x: 50, y: 50 });
  const animationFrame = useRef<number>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (item: string) => {
    if (onNavigate) {
      onNavigate(item);
    } else {
      // Default navigation behavior
      switch (item) {
        case '[HOME]':
          if (location.pathname === '/') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            navigate('/');
          }
          break;
        case '[PROJECTS]':
          if (location.pathname === '/') {
            const projectSection = document.querySelector('.manly');
            if (projectSection) {
              projectSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          } else {
            navigate('/projects');
          }
          break;
        case '[BLOGS]':
          if (location.pathname === '/') {
            const blogSection = document.querySelector('.Blog');
            if (blogSection) {
              blogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          } else {
            navigate('/blog');
          }
          break;
        case '[CONTACT]':
          if (location.pathname === '/') {
            const contactSection = document.querySelector('.Contact');
            if (contactSection) {
              contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          } else {
            navigate('/', { state: { scrollTo: 'contact' } });
          }
          break;
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (navRef.current) {
        const rect = navRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        targetPos.current = { x, y };
      }
    };

    const animate = () => {
      setMousePos((prev) => {
        const newX = prev.x + (targetPos.current.x - prev.x) * 0.15;
        const newY = prev.y + (targetPos.current.y - prev.y) * 0.15;
        return { x: newX, y: newY };
      });
      animationFrame.current = requestAnimationFrame(animate);
    };

    const nav = navRef.current;
    if (nav) {
      nav.addEventListener('mousemove', handleMouseMove);
      animationFrame.current = requestAnimationFrame(animate);

      return () => {
        nav.removeEventListener('mousemove', handleMouseMove);
        if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current);
        }
      };
    }
  }, []);

  return (
    <nav className="glassy-navbar" ref={navRef}>
      <div
        className="navbar-border-glow"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.6) 20%, rgba(255, 255, 255, 0.2) 40%, transparent 60%)`,
        }}
      ></div>
      <div className="navbar-container">
        {navItems.map((item) => (
          <button
            key={item}
            className={`nav-item ${activeSection === item ? 'active' : ''}`}
            onClick={() => handleClick(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
