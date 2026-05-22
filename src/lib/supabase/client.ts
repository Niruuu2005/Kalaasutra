import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Support both old anon key format (eyJ...) and new publishable key format (sb_publishable_...)
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables for client.')
  }

  return createBrowserClient(url, key)
}
