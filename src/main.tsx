import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// Get the base name from the environment for GitHub Pages
const basename = import.meta.env.PROD ? 
  (import.meta.env.BASE_URL !== '/' ? import.meta.env.BASE_URL : undefined) : 
  undefined;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)