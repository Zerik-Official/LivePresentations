import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import './lib/prism'
import { registerElementDefinitions } from '@/features/editor/elements/registry/register'
import App from './App.tsx'

registerElementDefinitions()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
