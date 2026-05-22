import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Detects whether Supabase env vars are real (not placeholder values)
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  // Support both old anon key format (eyJ...) and new publishable key format (sb_publishable_...)
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
  return (
    url.length > 0 &&
    !url.includes('placeholder') &&
    url.startsWith('https://') &&
    key.length > 10 &&
    !key.includes('placeholder')
  );
}

export async function createClient() {
  const cookieStore = await cookies()

  // Support both naming conventions: old anon key and new publishable key
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  }

  if (url.includes('placeholder') || key.includes('placeholder')) {
    throw new Error('Supabase is not configured. Please update .env.local with real project credentials from your Supabase dashboard.')
  }

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Silently ignore cookie mutations from Server Components —
            // the middleware will handle session refresh.
          }
        },
      },
    }
  )
}
