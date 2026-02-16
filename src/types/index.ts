/**
 * Type Definitions Index
 *
 * Central export for all application types
 */

// Re-export database types
export type {
  User,
  NewUser,
  Contact,
  NewContact,
  Organization,
  NewOrganization,
  Deal,
  NewDeal,
} from './database'

// Re-export API types
export type { ActionResult, PaginationParams, PaginatedResponse } from './api'
