import { z } from 'zod'
import { urlSchema, uuidSchema, currencySchema } from './shared'

/**
 * Create organization schema
 */
export const organizationSchema = z.object({
  name: z
    .string()
    .min(1, 'Organization name is required')
    .max(200, 'Name must be less than 200 characters')
    .trim(),
  website: urlSchema,
  industry: z
    .string()
    .max(100, 'Industry must be less than 100 characters')
    .optional()
    .or(z.literal(''))
    .transform((val) => val || undefined),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .or(z.literal(''))
    .transform((val) => val || undefined),
  address: z
    .string()
    .max(200, 'Address must be less than 200 characters')
    .optional()
    .or(z.literal(''))
    .transform((val) => val || undefined),
  city: z
    .string()
    .max(100, 'City must be less than 100 characters')
    .optional()
    .or(z.literal(''))
    .transform((val) => val || undefined),
  state: z
    .string()
    .max(100, 'State must be less than 100 characters')
    .optional()
    .or(z.literal(''))
    .transform((val) => val || undefined),
  country: z
    .string()
    .max(100, 'Country must be less than 100 characters')
    .optional()
    .or(z.literal(''))
    .transform((val) => val || undefined),
  postalCode: z
    .string()
    .max(20, 'Postal code must be less than 20 characters')
    .optional()
    .or(z.literal(''))
    .transform((val) => val || undefined),
  employeeCount: z.coerce
    .number()
    .int()
    .min(0, 'Employee count must be positive')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
  annualRevenue: currencySchema,
  linkedinUrl: urlSchema,
  logoUrl: urlSchema,
})

export type OrganizationInput = z.infer<typeof organizationSchema>

/**
 * Update organization schema
 */
export const organizationUpdateSchema = organizationSchema.partial()

export type OrganizationUpdateInput = z.infer<typeof organizationUpdateSchema>

/**
 * Organization search schema
 */
export const organizationSearchSchema = z.object({
  search: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'industry', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export type OrganizationSearchInput = z.infer<typeof organizationSearchSchema>
