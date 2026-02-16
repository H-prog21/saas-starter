'use server'

import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { contacts } from '@/db/schema'
import { contactUpdateSchema } from '@/schemas/contacts'
import { handleActionError, AuthenticationError, NotFoundError } from '@/lib/errors'
import type { ActionResult } from '@/types'

export async function updateContact(
  id: string,
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
    const validationResult = contactUpdateSchema.safeParse(rawData)

    if (!validationResult.success) {
      return {
        success: false,
        errors: validationResult.error.flatten().fieldErrors,
      }
    }

    // 3. Database operation (with authorization check)
    const [contact] = await db
      .update(contacts)
      .set({
        ...validationResult.data,
        updatedAt: new Date(),
      })
      .where(and(eq(contacts.id, id), eq(contacts.userId, user.id)))
      .returning()

    if (!contact) {
      throw new NotFoundError('Contact')
    }

    // 4. Cache invalidation
    revalidatePath('/contacts')
    revalidatePath(`/contacts/${id}`)

    return {
      success: true,
      data: contact,
      message: 'Contact updated successfully',
    }
  } catch (error) {
    return handleActionError(error)
  }
}
