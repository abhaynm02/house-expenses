import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('⚠️  Missing Supabase env vars. Copy .env.example to .env and fill in your values.')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    detectSessionInUrl: true,   // automatically reads #access_token from URL
    persistSession: true,       // keeps login across page refreshes
    autoRefreshToken: true,     // refreshes token before it expires
  }
})