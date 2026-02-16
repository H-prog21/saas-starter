import { pgTable, uuid, text, timestamp, pgEnum, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/**
 * User role enum
 */
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'super_admin'])

/**
 * Users table
 * Stores user profile information
 * The id matches the Supabase Auth user id
 */
export const users = pgTable(
  'users',
  {
    // Primary key - matches Supabase Auth user id
    id: uuid('id').primaryKey(),

    // Profile fields
    email: text('email').notNull().unique(),
    fullName: text('full_name'),
    avatarUrl: text('avatar_url'),

    // Role for RBAC
    role: userRoleEnum('role').notNull().default('user'),

    // Audit fields
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_users_email').on(table.email),
  ]
)

/**
 * User relations
 */
export const usersRelations = relations(users, ({ many }) => ({
  contacts: many(contacts),
  organizations: many(organizations),
  deals: many(deals),
}))

// Forward declarations for relations (imported in index.ts)
import { contacts } from './contacts'
import { organizations } from './organizations'
import { deals } from './deals'
