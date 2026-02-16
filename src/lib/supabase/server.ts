import { createServerClient as createClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Create a Supabase client for use on the server
 * This client is used in Server Components, Server Actions, and Route Handlers
 *
 * IMPORTANT: Always use getUser() instead of getSession() for authentication checks
 * getUser() validates the JWT with Supabase Auth, while getSession() does not
 */
export async function createServerClient() {
  const cookieStore = await cookies()

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // The `setAll` method was called from a Server Component
            // This can be ignored if you have middleware refreshing user sessions
          }
        },
      },
    }
  )
}

/**
 * Create a Supabase admin client with service role key
 * This bypasses Row Level Security - use with caution!
 * Only use for admin operations, webhooks, or background jobs
 */
export function createServiceClient() {
  const { createClient } = require('@supabase/supabase-js')

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
