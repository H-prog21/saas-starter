import { pgTable, uuid, text, timestamp, index, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { organizations } from './organizations'

/**
 * Contact type enum
 */
export const contactTypeEnum = pgEnum('contact_type', [
  'lead',
  'customer',
  'partner',
  'vendor',
  'other',
])

/**
 * Contacts table
 * Stores contact information for CRM functionality
 */
export const contacts = pgTable(
  'contacts',
  {
    // Primary key
    id: uuid('id').primaryKey().defaultRandom(),

    // Owner
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Organization (optional)
    organizationId: uuid('organization_id').references(() => organizations.id, {
      onDelete: 'set null',
    }),

    // Contact info
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    title: text('title'),
    type: contactTypeEnum('type').default('lead'),

    // Additional info
    notes: text('notes'),
    linkedinUrl: text('linkedin_url'),
    twitterUrl: text('twitter_url'),

    // Audit fields
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_contacts_user_id').on(table.userId),
    index('idx_contacts_organization_id').on(table.organizationId),
    index('idx_contacts_email').on(table.email),
    index('idx_contacts_type').on(table.type),
    index('idx_contacts_created_at').on(table.createdAt),
  ]
)

/**
 * Contact relations
 */
export const contactsRelations = relations(contacts, ({ one, many }) => ({
  user: one(users, {
    fields: [contacts.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [contacts.organizationId],
    references: [organizations.id],
  }),
  deals: many(deals),
}))

// Forward declaration for relations
import { deals } from './deals'
