import { useEffect } from 'react'
import Lenis from 'lenis'
import Swastic from './page/swastic'
import './App.css'

function App() {
  useEffect(() => {
    const lenis = new Lenis()

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <>
     <Swastic />
    </>
  )
}

export default App
