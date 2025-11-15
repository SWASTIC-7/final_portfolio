import { useEffect, useState } from 'react'
import Lenis from 'lenis'
import Swastic from './page/swastic'
import './App.css'
import Loader from './page/loader'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [startAnimation, setStartAnimation] = useState(false)

  useEffect(() => {
    // Simulate resource loading progress
    const checkResources = async () => {
      // Track image loading
      const imagesToLoad = [
        '/project/project1.png',
        '/project/project2.png',
        '/project/project3.png',
        '/project/project4.png',
        '/project/project5.png',
        '/project/project6.png',
        '/project/project7.png'
      ]

      let loadedCount = 0
      const totalResources = imagesToLoad.length + 1 // +1 for initial load

      // Initial progress
      setLoadingProgress(10)

      // Load images
      const imagePromises = imagesToLoad.map((src) => {
        return new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = () => {
            loadedCount++
            const progress = Math.floor((loadedCount / totalResources) * 90) + 10
            setLoadingProgress(progress)
            resolve()
          }
          img.onerror = () => {
            loadedCount++
            const progress = Math.floor((loadedCount / totalResources) * 90) + 10
            setLoadingProgress(progress)
            resolve()
          }
          img.src = src
        })
      })

      await Promise.all(imagePromises)

      // Complete loading
      setLoadingProgress(100)
      
      // Start exit animation after a brief pause
      setTimeout(() => {
        setStartAnimation(true)
      }, 500)

      // Hide loader after animation
      setTimeout(() => {
        setIsLoading(false)
      }, 2000)
    }

    checkResources()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      const lenis = new Lenis()

      function raf(time: number) {
        lenis.raf(time)
        requestAnimationFrame(raf)
      }

      requestAnimationFrame(raf)

      return () => {
        lenis.destroy()
      }
    }
  }, [isLoading])

  return (
    <>
      {isLoading ? (
        <Loader 
          startAnimation={startAnimation} 
          progress={loadingProgress}
        />
      ) : (
        <Swastic />
      )}
    </>
  )
}

export default App
