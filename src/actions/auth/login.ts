'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { loginSchema } from '@/schemas/auth'
import type { ActionResult } from '@/types'

export async function login(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // Validate input
  const rawData = Object.fromEntries(formData)
  const validationResult = loginSchema.safeParse(rawData)

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validationResult.data

  // Sign in with Supabase
  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      success: false,
      error: 'Invalid email or password',
    }
  }

  // Get redirect URL from form data
  const redirectTo = (formData.get('redirectTo') as string) || '/dashboard'

  // Redirect to dashboard
  redirect(redirectTo)
}
