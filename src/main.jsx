import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { supabase } from './supabase.js'

// When user clicks magic link in email, Supabase puts the session
// in the URL hash (#access_token=...). We need to detect this,
// let Supabase process it, then strip the hash so the app loads cleanly.
const hash = window.location.hash
if (hash && hash.includes('access_token')) {
  supabase.auth.getSession().then(() => {
    // Clean the URL — remove the hash without reloading the page
    window.history.replaceState(null, '', window.location.pathname)
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)