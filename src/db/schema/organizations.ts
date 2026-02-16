import { pgTable, uuid, text, timestamp, index, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { contacts } from './contacts'
import { deals } from './deals'

/**
 * Organizations table
 * Stores company/organization information
 */
export const organizations = pgTable(
  'organizations',
  {
    // Primary key
    id: uuid('id').primaryKey().defaultRandom(),

    // Owner
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Organization info
    name: text('name').notNull(),
    website: text('website'),
    industry: text('industry'),
    description: text('description'),

    // Location
    address: text('address'),
    city: text('city'),
    state: text('state'),
    country: text('country'),
    postalCode: text('postal_code'),

    // Size and revenue
    employeeCount: integer('employee_count'),
    annualRevenue: integer('annual_revenue'),

    // Social
    linkedinUrl: text('linkedin_url'),
    logoUrl: text('logo_url'),

    // Audit fields
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_organizations_user_id').on(table.userId),
    index('idx_organizations_name').on(table.name),
    index('idx_organizations_industry').on(table.industry),
  ]
)

/**
 * Organization relations
 */
export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  user: one(users, {
    fields: [organizations.userId],
    references: [users.id],
  }),
  contacts: many(contacts),
  deals: many(deals),
}))
