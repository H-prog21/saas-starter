import { eq, desc, and, or, ilike, sql, asc } from 'drizzle-orm'
import { db } from '@/db'
import { contacts } from '@/db/schema'
import type { NewContact } from '@/types/database'

/**
 * Get all contacts for a user
 */
export async function getContactsByUser(userId: string) {
  return db.query.contacts.findMany({
    where: eq(contacts.userId, userId),
    orderBy: desc(contacts.createdAt),
    with: {
      organization: true,
    },
  })
}

/**
 * Get a single contact by ID
 */
export async function getContactById(id: string, userId: string) {
  return db.query.contacts.findFirst({
    where: and(eq(contacts.id, id), eq(contacts.userId, userId)),
    with: {
      organization: true,
      deals: true,
    },
  })
}

/**
 * Search contacts with pagination
 */
export async function searchContacts(
  userId: string,
  options: {
    search?: string
    type?: string
    organizationId?: string
    page?: number
    limit?: number
    sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt'
    sortOrder?: 'asc' | 'desc'
  }
) {
  const {
    search,
    type,
    organizationId,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options

  const offset = (page - 1) * limit

  // Build where clause
  const conditions = [eq(contacts.userId, userId)]

  if (search) {
    conditions.push(
      or(
        ilike(contacts.firstName, `%${search}%`),
        ilike(contacts.lastName, `%${search}%`),
        ilike(contacts.email, `%${search}%`)
      )!
    )
  }

  if (type) {
    conditions.push(eq(contacts.type, type as 'lead' | 'customer' | 'partner' | 'vendor' | 'other'))
  }

  if (organizationId) {
    conditions.push(eq(contacts.organizationId, organizationId))
  }

  const whereClause = and(...conditions)

  // Build order clause
  const orderFn = sortOrder === 'asc' ? asc : desc
  const orderByColumn = contacts[sortBy]

  // Execute queries in parallel
  const [data, countResult] = await Promise.all([
    db.query.contacts.findMany({
      where: whereClause,
      orderBy: orderFn(orderByColumn),
      limit,
      offset,
      with: { organization: true },
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(whereClause),
  ])

  const total = Number(countResult[0]?.count ?? 0)

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  }
}

/**
 * Create a new contact
 */
export async function createContact(data: NewContact) {
  const [contact] = await db.insert(contacts).values(data).returning()
  return contact
}

/**
 * Update a contact
 */
export async function updateContact(
  id: string,
  userId: string,
  data: Partial<Omit<NewContact, 'id' | 'userId'>>
) {
  const [contact] = await db
    .update(contacts)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
    .returning()

  return contact
}

/**
 * Delete a contact
 */
export async function deleteContact(id: string, userId: string) {
  const result = await db
    .delete(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
    .returning()

  return result.length > 0
}

/**
 * Get contact count by user
 */
export async function getContactCount(userId: string) {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(contacts)
    .where(eq(contacts.userId, userId))

  return Number(result[0]?.count ?? 0)
}

/**
 * Get contacts by organization
 */
export async function getContactsByOrganization(organizationId: string, userId: string) {
  return db.query.contacts.findMany({
    where: and(eq(contacts.organizationId, organizationId), eq(contacts.userId, userId)),
    orderBy: asc(contacts.lastName),
  })
}
