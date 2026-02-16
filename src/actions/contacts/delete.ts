'use server'

import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { contacts } from '@/db/schema'
import { handleActionError, AuthenticationError, NotFoundError } from '@/lib/errors'
import type { ActionResult } from '@/types'

export async function deleteContact(id: string): Promise<ActionResult> {
  try {
    // 1. Authentication
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError()
    }

    // 2. Database operation (with authorization check)
    const deleted = await db
      .delete(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.userId, user.id)))
      .returning()

    if (deleted.length === 0) {
      throw new NotFoundError('Contact')
    }

    // 3. Cache invalidation
    revalidatePath('/contacts')

    return {
      success: true,
      message: 'Contact deleted successfully',
    }
  } catch (error) {
    return handleActionError(error)
  }
}
