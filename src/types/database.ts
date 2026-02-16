import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import type { users, contacts, organizations, deals } from '@/db/schema'

/**
 * User types
 */
export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

/**
 * Contact types
 */
export type Contact = InferSelectModel<typeof contacts>
export type NewContact = InferInsertModel<typeof contacts>

/**
 * Contact with relations
 */
export type ContactWithRelations = Contact & {
  organization?: Organization | null
  deals?: Deal[]
}

/**
 * Organization types
 */
export type Organization = InferSelectModel<typeof organizations>
export type NewOrganization = InferInsertModel<typeof organizations>

/**
 * Organization with relations
 */
export type OrganizationWithRelations = Organization & {
  contacts?: Contact[]
  deals?: Deal[]
}

/**
 * Deal types
 */
export type Deal = InferSelectModel<typeof deals>
export type NewDeal = InferInsertModel<typeof deals>

/**
 * Deal with relations
 */
export type DealWithRelations = Deal & {
  contact?: Contact | null
  organization?: Organization | null
}
