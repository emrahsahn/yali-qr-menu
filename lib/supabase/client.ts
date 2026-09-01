import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isMockMode = !supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your-supabase-url'

if (typeof window !== 'undefined' && isMockMode) {
  console.warn("Supabase credentials missing or default. App running in Mock Mode.")
}

export const supabase = isMockMode
  ? null
  : createBrowserClient(supabaseUrl!, supabaseAnonKey!)
