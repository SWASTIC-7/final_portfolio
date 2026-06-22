import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Group, PointLight, Vector2, Vector3 } from 'three';
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
  const mouseVec = useRef(new Vector2());
  const pointer = useRef({ x: 0, y: 0 });
  // The recomputed light target, and a flag set only when the mouse actually moves.
  const target = useRef(new Vector3());
  const hasTarget = useRef(false);
  const dirty = useRef(false);

  useFrame(() => {
    const light = lightRef.current;
    if (!light) return;

    // Only raycast when the cursor moved — not on every frame. The previous code
    // raycast the whole scene 60x/sec even while idle/scrolling, which pinned a
    // CPU core and dragged the entire page down.
    if (dirty.current) {
      dirty.current = false;
      const x = (pointer.current.x / window.innerWidth) * 2 - 1;
      const y = -(pointer.current.y / window.innerHeight) * 2 + 1;
      mouseVec.current.set(x, y);
      raycaster.setFromCamera(mouseVec.current, camera);

      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        target.current.copy(intersects[0].point);
        if (intersects[0].face) {
          target.current.add(intersects[0].face.normal.clone().multiplyScalar(2));
        }
      } else {
        const dir = raycaster.ray.direction.clone();
        target.current.copy(camera.position).add(dir.multiplyScalar(20));
      }
      hasTarget.current = true;
    }

    // Smoothly ease the light toward its target each frame (cheap, no raycast).
    if (hasTarget.current) {
      light.position.lerp(target.current, 0.15);
    }
  });

  // Track the cursor via a ref + dirty flag — no React state, so moving the mouse
  // no longer re-renders the whole Canvas subtree.
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
      dirty.current = true;
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
