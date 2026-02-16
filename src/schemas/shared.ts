import { z } from 'zod'

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .toLowerCase()
  .trim()

/**
 * Phone number validation schema
 * Accepts international format
 */
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional()
  .or(z.literal(''))
  .transform((val) => val || undefined)

/**
 * URL validation schema
 */
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .optional()
  .or(z.literal(''))
  .transform((val) => val || undefined)

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('Invalid ID format')

/**
 * Pagination parameters schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

/**
 * Search parameters schema
 */
export const searchParamsSchema = paginationSchema.extend({
  search: z.string().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

/**
 * Date range schema
 */
export const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
})

/**
 * Currency amount schema (in cents)
 */
export const currencySchema = z.coerce
  .number()
  .int()
  .min(0, 'Amount must be positive')
  .optional()

/**
 * Percentage schema (0-100)
 */
export const percentageSchema = z.coerce
  .number()
  .int()
  .min(0, 'Must be at least 0')
  .max(100, 'Must be at most 100')
  .optional()
