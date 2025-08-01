import { Routes, Route } from 'react-router-dom'
import ChatInterface from './components/ChatInterface'

function App() {
  return (
    <Routes>
      <Route path="/" element={<ChatInterface />} />
      <Route path="*" element={<ChatInterface />} />
    </Routes>
  )
}

export default App