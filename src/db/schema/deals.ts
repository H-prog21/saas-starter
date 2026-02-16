import { pgTable, uuid, text, timestamp, index, integer, pgEnum, date } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { contacts } from './contacts'
import { organizations } from './organizations'

/**
 * Deal stage enum
 */
export const dealStageEnum = pgEnum('deal_stage', [
  'lead',
  'qualified',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
])

/**
 * Deals table
 * Stores sales pipeline/deal information
 */
export const deals = pgTable(
  'deals',
  {
    // Primary key
    id: uuid('id').primaryKey().defaultRandom(),

    // Owner
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Related entities
    contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
    organizationId: uuid('organization_id').references(() => organizations.id, {
      onDelete: 'set null',
    }),

    // Deal info
    title: text('title').notNull(),
    description: text('description'),
    value: integer('value'), // In cents
    currency: text('currency').default('USD'),

    // Pipeline
    stage: dealStageEnum('stage').notNull().default('lead'),
    probability: integer('probability').default(0), // 0-100

    // Dates
    expectedCloseDate: date('expected_close_date'),
    actualCloseDate: date('actual_close_date'),

    // Notes
    notes: text('notes'),

    // Audit fields
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_deals_user_id').on(table.userId),
    index('idx_deals_contact_id').on(table.contactId),
    index('idx_deals_organization_id').on(table.organizationId),
    index('idx_deals_stage').on(table.stage),
    index('idx_deals_expected_close_date').on(table.expectedCloseDate),
  ]
)

/**
 * Deal relations
 */
export const dealsRelations = relations(deals, ({ one }) => ({
  user: one(users, {
    fields: [deals.userId],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [deals.contactId],
    references: [contacts.id],
  }),
  organization: one(organizations, {
    fields: [deals.organizationId],
    references: [organizations.id],
  }),
}))
