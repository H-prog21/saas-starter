'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { registerSchema } from '@/schemas/auth'
import type { ActionResult } from '@/types'

export async function register(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // Validate input
  const rawData = Object.fromEntries(formData)
  const validationResult = registerSchema.safeParse(rawData)

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    }
  }

  const { email, password, fullName } = validationResult.data

  // Create user in Supabase Auth
  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    // Handle specific errors
    if (error.message.includes('already registered')) {
      return {
        success: false,
        errors: { email: ['An account with this email already exists'] },
      }
    }

    return {
      success: false,
      error: 'Failed to create account. Please try again.',
    }
  }

  if (!data.user) {
    return {
      success: false,
      error: 'Failed to create account. Please try again.',
    }
  }

  // Create user profile in database
  try {
    await db.insert(users).values({
      id: data.user.id,
      email: data.user.email!,
      fullName,
    })
  } catch (dbError) {
    console.error('Failed to create user profile:', dbError)
    // User was created in Auth but profile failed
    // They can still log in and we can create profile later
  }

  // Redirect to dashboard
  redirect('/dashboard')
}
