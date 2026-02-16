# Database Guide

This document covers database design, Drizzle ORM conventions, and Supabase integration patterns.

## Overview

We use **Drizzle ORM** with **Supabase PostgreSQL** for these key advantages:
- ~7.4KB bundle size (vs Prisma's 80MB+ runtime)
- Negligible serverless cold starts
- 14x lower latency on complex joins
- Full SQL control with type safety
- Native PostgreSQL features support

## Connection Setup

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Disable prefetch for serverless (Supabase Transaction mode)
const client = postgres(connectionString, { prepare: false })

export const db = drizzle(client, { schema })
```

## Schema Design Conventions

### File Organization

```
src/db/schema/
├── index.ts          # Barrel export + relations
├── users.ts          # User profiles
├── contacts.ts       # Contact records
├── organizations.ts  # Organization records
├── deals.ts          # Deal/pipeline records
└── audit-logs.ts     # Audit trail
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Tables | snake_case, plural | `user_profiles` |
| Columns | snake_case | `created_at` |
| Primary Keys | `id` (UUID) | `id uuid primary key` |
| Foreign Keys | `{table}_id` | `user_id`, `organization_id` |
| Timestamps | `created_at`, `updated_at` | Standard audit fields |
| Indexes | `idx_{table}_{column}` | `idx_contacts_email` |

### Standard Schema Pattern

```typescript
// src/db/schema/contacts.ts
import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { organizations } from './organizations'

export const contacts = pgTable('contacts', {
  // Primary key
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign keys
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'set null' }),

  // Data fields
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  title: text('title'),
  notes: text('notes'),

  // Audit fields (always include)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // Indexes for common queries
  index('idx_contacts_user_id').on(table.userId),
  index('idx_contacts_organization_id').on(table.organizationId),
  index('idx_contacts_email').on(table.email),
])

// Relations (for query builder)
export const contactsRelations = relations(contacts, ({ one }) => ({
  user: one(users, {
    fields: [contacts.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [contacts.organizationId],
    references: [organizations.id],
  }),
}))
```

### Type Inference

```typescript
// src/types/database.ts
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import type { contacts, organizations, deals } from '@/db/schema'

// Select types (reading from DB)
export type Contact = InferSelectModel<typeof contacts>
export type Organization = InferSelectModel<typeof organizations>
export type Deal = InferSelectModel<typeof deals>

// Insert types (writing to DB)
export type NewContact = InferInsertModel<typeof contacts>
export type NewOrganization = InferInsertModel<typeof organizations>
export type NewDeal = InferInsertModel<typeof deals>
```

## Query Patterns

### Basic CRUD

```typescript
// src/db/queries/contacts.ts
import { eq, desc, and, ilike, sql } from 'drizzle-orm'
import { db } from '@/db'
import { contacts } from '@/db/schema'

// Select all for user
export async function getContactsByUser(userId: string) {
  return db.query.contacts.findMany({
    where: eq(contacts.userId, userId),
    orderBy: desc(contacts.createdAt),
  })
}

// Select one with relations
export async function getContactById(id: string, userId: string) {
  return db.query.contacts.findFirst({
    where: and(
      eq(contacts.id, id),
      eq(contacts.userId, userId)
    ),
    with: {
      organization: true,
    },
  })
}

// Insert
export async function createContact(data: NewContact) {
  const [contact] = await db.insert(contacts).values(data).returning()
  return contact
}

// Update
export async function updateContact(id: string, userId: string, data: Partial<NewContact>) {
  const [contact] = await db
    .update(contacts)
    .set({ ...data, updatedAt: new Date() })
    .where(and(
      eq(contacts.id, id),
      eq(contacts.userId, userId)
    ))
    .returning()
  return contact
}

// Delete
export async function deleteContact(id: string, userId: string) {
  await db.delete(contacts).where(and(
    eq(contacts.id, id),
    eq(contacts.userId, userId)
  ))
}
```

### Search with Pagination

```typescript
export async function searchContacts(
  userId: string,
  options: {
    search?: string
    page?: number
    limit?: number
    sortBy?: 'name' | 'email' | 'createdAt'
    sortOrder?: 'asc' | 'desc'
  }
) {
  const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options
  const offset = (page - 1) * limit

  const whereClause = search
    ? and(
        eq(contacts.userId, userId),
        or(
          ilike(contacts.firstName, `%${search}%`),
          ilike(contacts.lastName, `%${search}%`),
          ilike(contacts.email, `%${search}%`)
        )
      )
    : eq(contacts.userId, userId)

  const orderByClause = sortOrder === 'asc'
    ? asc(contacts[sortBy])
    : desc(contacts[sortBy])

  const [data, countResult] = await Promise.all([
    db.query.contacts.findMany({
      where: whereClause,
      orderBy: orderByClause,
      limit,
      offset,
      with: { organization: true },
    }),
    db.select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(whereClause),
  ])

  return {
    data,
    pagination: {
      page,
      limit,
      total: Number(countResult[0]?.count ?? 0),
      totalPages: Math.ceil(Number(countResult[0]?.count ?? 0) / limit),
    },
  }
}
```

### Transactions

```typescript
import { db } from '@/db'

export async function createOrganizationWithContact(
  orgData: NewOrganization,
  contactData: NewContact
) {
  return db.transaction(async (tx) => {
    const [organization] = await tx
      .insert(organizations)
      .values(orgData)
      .returning()

    const [contact] = await tx
      .insert(contacts)
      .values({ ...contactData, organizationId: organization.id })
      .returning()

    return { organization, contact }
  })
}
```

### Raw SQL (when needed)

```typescript
import { sql } from 'drizzle-orm'

// Complex aggregation
export async function getContactStats(userId: string) {
  const result = await db.execute(sql`
    SELECT
      COUNT(*) as total_contacts,
      COUNT(DISTINCT organization_id) as unique_organizations,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month
    FROM contacts
    WHERE user_id = ${userId}
  `)
  return result.rows[0]
}
```

## Migration Workflow

### Generate Migration

```bash
# After modifying schema files
pnpm db:generate
```

This creates a new migration in `drizzle/migrations/`.

### Apply Migration

```bash
# Push to database
pnpm db:migrate

# Or for development (direct push without migration file)
pnpm db:push
```

### Migration Best Practices

1. **Review generated SQL** before applying
2. **Test locally** with `supabase db reset`
3. **Never modify** applied migrations
4. **Use transactions** for data migrations

### Data Migration Example

```typescript
// drizzle/migrations/custom/add-full-name.ts
import { db } from '@/db'
import { contacts } from '@/db/schema'

export async function migrate() {
  // Populate new column from existing data
  await db.execute(sql`
    UPDATE contacts
    SET full_name = first_name || ' ' || last_name
    WHERE full_name IS NULL
  `)
}
```

## Supabase Row Level Security (RLS)

### Enable RLS

```sql
-- In Supabase SQL Editor or migration
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
```

### Policy Patterns

```sql
-- Users can only see their own contacts
CREATE POLICY "Users can view own contacts"
  ON contacts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own contacts
CREATE POLICY "Users can insert own contacts"
  ON contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own contacts
CREATE POLICY "Users can update own contacts"
  ON contacts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own contacts
CREATE POLICY "Users can delete own contacts"
  ON contacts FOR DELETE
  USING (auth.uid() = user_id);
```

### Service Role Bypass

When using the service role key (admin operations), RLS is bypassed. Use carefully:

```typescript
// Only for admin operations, webhooks, etc.
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

## Indexing Strategy

### When to Add Indexes

1. **Foreign keys** - Always index
2. **Frequent WHERE clauses** - Add index
3. **ORDER BY columns** - Consider index
4. **Unique constraints** - Automatic index

### Index Types

```typescript
// Standard B-tree (default)
index('idx_contacts_email').on(table.email)

// Composite index
index('idx_contacts_user_created').on(table.userId, table.createdAt)

// Unique index
uniqueIndex('idx_users_email').on(table.email)

// Partial index (PostgreSQL)
// Created via raw SQL in migration
```

### Monitoring Performance

```sql
-- Find slow queries
SELECT * FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Check index usage
SELECT
  relname as table,
  indexrelname as index,
  idx_scan as scans
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## Seeding

```typescript
// scripts/seed-data.ts
import { db } from '@/db'
import { users, contacts, organizations } from '@/db/schema'

async function seed() {
  console.log('🌱 Seeding database...')

  // Create test user (matches Supabase Auth user)
  const [user] = await db.insert(users).values({
    id: 'test-user-uuid',
    email: 'test@example.com',
    fullName: 'Test User',
  }).returning()

  // Create organizations
  const [org] = await db.insert(organizations).values({
    userId: user.id,
    name: 'Acme Corp',
    website: 'https://acme.com',
  }).returning()

  // Create contacts
  await db.insert(contacts).values([
    {
      userId: user.id,
      organizationId: org.id,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@acme.com',
    },
    {
      userId: user.id,
      organizationId: org.id,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@acme.com',
    },
  ])

  console.log('✅ Seeding complete!')
}

seed().catch(console.error)
```

Run with:

```bash
pnpm db:seed
```

## Common Pitfalls

### 1. N+1 Queries

```typescript
// ❌ Bad: N+1 queries
const contacts = await db.query.contacts.findMany()
for (const contact of contacts) {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, contact.organizationId)
  })
}

// ✅ Good: Use relations
const contacts = await db.query.contacts.findMany({
  with: { organization: true }
})
```

### 2. Missing Auth Checks

```typescript
// ❌ Bad: No user check
export async function getContact(id: string) {
  return db.query.contacts.findFirst({
    where: eq(contacts.id, id)
  })
}

// ✅ Good: Always filter by user
export async function getContact(id: string, userId: string) {
  return db.query.contacts.findFirst({
    where: and(
      eq(contacts.id, id),
      eq(contacts.userId, userId)
    )
  })
}
```

### 3. Connection Leaks

```typescript
// ✅ The postgres.js client handles connection pooling
// No manual connection management needed
const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, { schema })
```
