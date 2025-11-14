// Radar.tsx
import React from "react";
import "./Radar.css";

const Radar: React.FC = () => {
  return (
    <div className="radar-container">
      <div className="radar">
        <div className="wave"></div>
        <div className="wave"></div>
        <div className="wave"></div>
        <div className="wave"></div>

        {/* Sweeping line */}
        <div className="sweep"></div>

        {/* Red detection dots */}
        <div className="dots" style={{ top: '30%', left: '45%' }}></div>
        <div className="dots" style={{ top: '60%', left: '70%' }}></div>
        <div className="dots" style={{ top: '40%', left: '25%' }}></div>
        <div className="dots" style={{ top: '75%', left: '50%' }}></div>
        <div className="dots" style={{ top: '20%', left: '65%' }}></div>
      </div>
    </div>
  );
};

export default Radar;
// End of Radar.tsx