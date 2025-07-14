import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { resetService } from './services/resetService'

// Importar el resetService para que esté disponible globalmente
console.log('🔧 Reset service cargado - Usa resetApp(), limpiarVentas(), diagnosticarApp() en la consola');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
