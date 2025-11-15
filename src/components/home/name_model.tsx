import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Group, PointLight,Vector2 } from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface LogoProps {
  url: string;
}

function Logo({ url }: LogoProps) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<Group>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  // Preserve original rotation from GLTF
  React.useEffect(() => {
    if (groupRef.current && scene) {
      groupRef.current.rotation.copy(scene.rotation);
      groupRef.current.position.copy(scene.position);
      groupRef.current.scale.copy(scene.scale);

      // Find and animate the left and right models
      const innerLeft = scene.getObjectByName('Inner_Left');
      const innerRight = scene.getObjectByName('Inner_Right');
      const outerLeft = scene.getObjectByName('Outer_Left');
      const outerRight = scene.getObjectByName('Outer_Right');

      // Store original positions
      // const originalPositions = {
      //   innerLeft: innerLeft ? { ...innerLeft.position } : null,
      //   innerRight: innerRight ? { ...innerRight.position } : null,
      //   outerLeft: outerLeft ? { ...outerLeft.position } : null,
      //   outerRight: outerRight ? { ...outerRight.position } : null,
      // };

      // Create scroll trigger animation
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.Home',
          start: 'top top',
          end: '70% top',
          scrub: 2,
          markers: false,
        }
      });

      // Store the ScrollTrigger instance
      if (tl.scrollTrigger) {
        scrollTriggerRef.current = tl.scrollTrigger;
      }

      // Animate left models to move left (negative Z for depth)
      if (innerLeft) {
        tl.to(innerLeft.position, {
          z: '+=400',
          ease: 'power2.inOut'
        }, 0);
      }
      if (outerLeft) {
        tl.to(outerLeft.position, {
          z: '+=400',
          ease: 'power2.inOut'
        }, 0);
      }

      // Animate right models to move right (positive Z for depth)
      if (innerRight) {
        tl.to(innerRight.position, {
          z: '-=400',
          ease: 'power2.inOut'
        }, 0);
      }
      if (outerRight) {
        tl.to(outerRight.position, {
          z: '-=400',
          ease: 'power2.inOut'
        }, 0);
      }
    }

    return () => {
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
      }
    };
  }, [scene]);

  return <primitive ref={groupRef} object={scene} />;
}

function CursorLight() {
  const lightRef = useRef<PointLight | null>(null);
  const { camera, raycaster, scene } = useThree();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mouseVec = useRef(new Vector2());

  useFrame(() => {
    if (lightRef.current) {
      // Normalize mouse coordinates
      const x = (mousePos.x / window.innerWidth) * 2 - 1;
      const y = -(mousePos.y / window.innerHeight) * 2 + 1;
      
      // Update Vector2 and set raycaster from camera through mouse position
      mouseVec.current.set(x, y);
      raycaster.setFromCamera(mouseVec.current, camera);
      
      // Get intersection point or position along ray
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      if (intersects.length > 0) {
        // If we hit something, place light at intersection
        lightRef.current.position.copy(intersects[0].point);
        // Move light slightly away from surface (guard face)
        if (intersects[0].face) {
          lightRef.current.position.add(intersects[0].face.normal.clone().multiplyScalar(2));
        }
      } else {
        // If no intersection, place light along the ray
        const dir = raycaster.ray.direction.clone();
        const distance = 20;
        lightRef.current.position.copy(camera.position.clone().add(dir.multiplyScalar(distance)));
      }
    }
  });

  // Track mouse position
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <pointLight 
      ref={lightRef} 
      intensity={100} 
      color="#ffffff" 
      distance={15}
      decay={2}
      castShadow 
    />
  );
}

interface SwasticModelProps {
  modelUrl?: string;
  backgroundColor?: string;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
}

function SwasticModel({ 
  modelUrl = '/try.glb',
  backgroundColor = '#000000ff',
  cameraPosition = [50, 0, 0],
  cameraFov = 40
}: SwasticModelProps) {
  return (
    <div className='Name_model'>
    <Canvas
      camera={{ position: cameraPosition, fov: cameraFov }}
      style={{ backgroundColor, width: '100vw', height: '100vh' }}
      shadows
    >
      <ambientLight intensity={1} />
      <directionalLight position={[30, 10, 0]} intensity={0.2} />
      <directionalLight position={[-30, -10, 0]} intensity={0.1} />
      <CursorLight />
      <Logo url={modelUrl} />
      <OrbitControls 
        target={[0, 0, 0]} 
        enableDamping 
        dampingFactor={0.1}
        enableZoom={false}
        enablePan={false}
      />
    </Canvas>
    <img src='/mesh2.svg'></img>
    </div>
  );
}

export default SwasticModel;
