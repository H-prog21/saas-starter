'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { contacts } from '@/db/schema'
import { contactSchema } from '@/schemas/contacts'
import { handleActionError, AuthenticationError } from '@/lib/errors'
import type { ActionResult } from '@/types'

export async function createContact(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // 1. Authentication
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError()
    }

    // 2. Validation
    const rawData = Object.fromEntries(formData)
    const validationResult = contactSchema.safeParse(rawData)

    if (!validationResult.success) {
      return {
        success: false,
        errors: validationResult.error.flatten().fieldErrors,
      }
    }

    // 3. Database operation
    const [contact] = await db
      .insert(contacts)
      .values({
        ...validationResult.data,
        userId: user.id,
      })
      .returning()

    // 4. Cache invalidation
    revalidatePath('/contacts')

    return {
      success: true,
      data: contact,
      message: 'Contact created successfully',
    }
  } catch (error) {
    return handleActionError(error)
  }
}
