import  { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { Group } from 'three'
import './Loader.css'

function Logo({ url, startAnimation }: { url: string; startAnimation: boolean }) {
  const { scene } = useGLTF(url)

  // Refs to parts
  const swastikRef = useRef<Group>(null)
  const innerLeftRef = useRef<Group>(null)
  const innerRightRef = useRef<Group>(null)
  const outerLeftRef = useRef<Group>(null)
  const outerRightRef = useRef<Group>(null)

  const timeRef = useRef(0)

  useEffect(() => {
    // Grab named children from scene
    swastikRef.current = scene.getObjectByName('swastik') as Group
    innerLeftRef.current = scene.getObjectByName('Inner_Left') as Group
    innerRightRef.current = scene.getObjectByName('Inner_Right') as Group
    outerLeftRef.current = scene.getObjectByName('Outer_Left') as Group
    outerRightRef.current = scene.getObjectByName('Outer_Right') as Group
  }, [scene])

  useFrame((_, delta) => {
    timeRef.current += delta

    // Swastik rotation
    if (swastikRef.current) {
      const speed = Math.abs(Math.sin(timeRef.current * 2)) * 0.1
      swastikRef.current.rotation.x -= speed
    }

    // Animate translation only after loading is complete
    if (startAnimation) {
      const moveSpeed = 0.05

      if (innerRightRef.current) innerRightRef.current.position.z -= moveSpeed
      if (outerRightRef.current) outerRightRef.current.position.z -= moveSpeed

      if (innerLeftRef.current) innerLeftRef.current.position.z += moveSpeed
      if (outerLeftRef.current) outerLeftRef.current.position.z += moveSpeed
    }
  })

  return <primitive object={scene} />
}

function LogoLoader({ startAnimation, onLoaded, progress = 0 }: { startAnimation: boolean, onLoaded?: () => void, progress?: number }) {
  useEffect(() => {
    if (progress === 100 && startAnimation && onLoaded) {
      onLoaded();
    }
  }, [startAnimation, onLoaded, progress]);

  return (
    <div className='model'>
    <Canvas
      camera={{ position: [50, 0, 0], fov: 40 }}
      style={{ backgroundColor: '#0d1117' }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[30, 10, 0]} />
      <Logo url="/loader.glb" startAnimation={startAnimation} />
      <OrbitControls target={[0, 0, 0]} />
    </Canvas>
    <div className='Number'>{Math.floor(progress)}%</div>
    
    </div>
    
  )
}

export default LogoLoader;