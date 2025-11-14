import React, { useEffect, useRef, useState } from 'react';
import './AnimatedBackground.css';

interface Blob {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
}

interface AnimatedBackgroundProps {
  backgroundColor?: string;
  blobColor?: string;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ backgroundColor = '#8b4513', blobColor = '#FF6B6B' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobs = useRef<Blob[]>([]);
  const mousePosition = useRef({ x: -9999, y: -9999 }); // Initialize off-screen
  const [currentColor, setCurrentColor] = useState(backgroundColor);
  const [targetColor, setTargetColor] = useState(backgroundColor);
  const [transitionProgress, setTransitionProgress] = useState(1);
  const animationRef = useRef<number | null>(null);
  const blobAnimationRef = useRef<number | null>(null);
  const previousColorRef = useRef(backgroundColor);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (backgroundColor !== previousColorRef.current) {
      setTargetColor(backgroundColor);
      setTransitionProgress(0);
      previousColorRef.current = backgroundColor;
    }
  }, [backgroundColor]);

  // Animate color transition
  useEffect(() => {
    if (transitionProgress < 1) {
      const animate = () => {
        setTransitionProgress(prev => {
          const newProgress = Math.min(prev + 0.02, 1); // Smooth transition
          if (newProgress === 1) {
            setCurrentColor(targetColor);
          }
          return newProgress;
        });
        
        if (transitionProgress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [transitionProgress, targetColor]);

  // Initialize blobs only once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isInitialized.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize blobs only once
    blobs.current = Array.from({ length: 15 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 200 + 100,
      speedX: (Math.random() - 0.5) * 1.5,
      speedY: (Math.random() - 0.5) * 1.5,
      color: blobColor,
    }));

    isInitialized.current = true;

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Separate blob animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isInitialized.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePosition.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animateBlobs = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      blobs.current.forEach((blob) => {
        // Update position
        blob.x += blob.speedX;
        blob.y += blob.speedY;

        // Mouse interaction (repel)
        const dx = mousePosition.current.x - blob.x;
        const dy = mousePosition.current.y - blob.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (mousePosition.current.x > -1000 && distance < 350) {
          const angle = Math.atan2(dy, dx);
          const force = Math.pow((350 - distance) / 350, 3);
          blob.x -= Math.cos(angle) * force * 12;
          blob.y -= Math.sin(angle) * force * 12;
        }

        // Bounce off walls
        if (blob.x < 0 || blob.x > canvas.width) {
          blob.speedX *= -1;
        }
        if (blob.y < 0 || blob.y > canvas.height) {
          blob.speedY *= -1;
        }

        // Update blob color based on prop
        blob.color = blobColor;

        // Draw blob with manual color
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.size, 0, Math.PI * 2);
        ctx.fillStyle = blob.color;
        ctx.fill();
      });

      blobAnimationRef.current = requestAnimationFrame(animateBlobs);
    };

    animateBlobs();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (blobAnimationRef.current) {
        cancelAnimationFrame(blobAnimationRef.current);
      }
    };
  }, [blobColor]); // Re-run when blobColor changes

  return (
    
    <div className="background-container">
      <div 
        className="background-gradient"
        style={{
          background: `linear-gradient(to bottom right, ${currentColor}20, ${currentColor}10)`,
          transition: 'background 0.1s ease-out'
        }}
      />
      <canvas ref={canvasRef} className="background-canvas" />
      <div className="blur-layer" />
    </div>
  );
};

export default AnimatedBackground;