import React from 'react';
import './navbar.css';

interface NavbarProps {
  activeSection?: string;
  onNavigate?: (section: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeSection = 'HOME', onNavigate }) => {
  const navItems = ['HOME', 'ABOUT', 'BLOGS', 'CONTACT'];

  const handleClick = (item: string) => {
    if (onNavigate) {
      onNavigate(item);
    }
  };

  return (
    <nav className="glassy-navbar">
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
