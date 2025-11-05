import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ✅ Create the client with session persistence enabled
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,      // keeps the refresh token saved in localStorage
    autoRefreshToken: true,    // automatically refreshes tokens before expiry
    detectSessionInUrl: true,  // handles OAuth redirects & URL-based sessions
  },
})
