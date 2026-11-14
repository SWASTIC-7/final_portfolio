import { Navigate, Route, Routes } from 'react-router-dom'
import Portfolio from './portfolio/Portfolio'

// The site is a single typed sheet. Old routes land on the matching section
// (a deep link skips the intro and scrolls straight there).
function App() {
  return (
    <Routes>
      <Route path="/" element={<Portfolio />} />
      <Route path="/projects" element={<Navigate to="/#projects" replace />} />
      <Route path="/blog" element={<Navigate to="/#writing" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
