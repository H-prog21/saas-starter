/**
 * Database Schema Index
 *
 * This file exports all schema definitions and relations
 * Import from here for Drizzle ORM usage
 */

// Users
export { users, usersRelations, userRoleEnum } from './users'

// Contacts
export { contacts, contactsRelations, contactTypeEnum } from './contacts'

// Organizations
export { organizations, organizationsRelations } from './organizations'

// Deals
export { deals, dealsRelations, dealStageEnum } from './deals'
