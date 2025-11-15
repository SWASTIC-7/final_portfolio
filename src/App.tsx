import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import Swastic from './page/swastic'
import Project from './components/project/project'
import Blog from './components/blog/blog'
import './App.css'
import Loader from './page/loader'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [startAnimation, setStartAnimation] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const location = useLocation()

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isSmallScreen = window.innerWidth <= 768
      setIsMobile(isMobileDevice || isSmallScreen)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    const checkResources = async () => {
      const imagesToLoad = [
        '/project/project1.png',
        '/project/project2.png',
        '/project/project3.png',
        '/project/project4.png',
        '/project/project5.png',
        '/project/project6.png',
        '/project/project7.png',
        '/g1.png',
        '/g2.png',
        '/g3.png',
        '/style_man.svg',
        '/mesh2.svg'
      ]

      const modelsToLoad = [
        '/try.glb'
      ]

      const totalResources = imagesToLoad.length + modelsToLoad.length
      let loadedCount = 0

      const updateProgress = () => {
        loadedCount++
        const progress = Math.floor((loadedCount / totalResources) * 90)
        setLoadingProgress(progress)
      }

      // Initial progress
      setLoadingProgress(5)

      // Load images
      const imagePromises = imagesToLoad.map((src) => {
        return new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = () => {
            updateProgress()
            resolve()
          }
          img.onerror = () => {
            updateProgress()
            resolve()
          }
          img.src = src
        })
      })

      // Load 3D models
      const modelPromises = modelsToLoad.map((src) => {
        return new Promise<void>((resolve) => {
          fetch(src)
            .then(() => {
              updateProgress()
              resolve()
            })
            .catch(() => {
              updateProgress()
              resolve()
            })
        })
      })

      await Promise.all([...imagePromises, ...modelPromises])

      // Wait for fonts to load
      if (document.fonts) {
        await document.fonts.ready
      }

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
      {isMobile ? (
        <div className="mobile-overlay">
          <div className="mobile-content">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
            <h1>Desktop Experience Required</h1>
            <p>This portfolio is optimized for desktop viewing.</p>
            <p>Please visit on a laptop or desktop computer for the best experience.</p>
            <div className="device-icon">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <Loader 
          startAnimation={startAnimation} 
          progress={loadingProgress}
        />
      ) : (
        <Routes>
          <Route path="/" element={<Swastic />} />
          <Route path="/projects" element={<Project />} />
          <Route path="/blog" element={<Blog />} />
        </Routes>
      )}
    </>
  )
}

export default App
