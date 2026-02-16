import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

/**
 * Database connection string
 */
const connectionString = process.env.DATABASE_URL!

/**
 * PostgreSQL client
 * - prepare: false is required for Supabase Transaction mode pooling
 */
const client = postgres(connectionString, {
  prepare: false,
})

/**
 * Drizzle ORM instance with schema
 * Use this for all database operations
 */
export const db = drizzle(client, { schema })

/**
 * Export schema for type inference
 */
export { schema }
