import { z } from 'zod'
import { emailSchema, phoneSchema, urlSchema, uuidSchema } from './shared'

/**
 * Contact type enum values
 */
export const contactTypes = ['lead', 'customer', 'partner', 'vendor', 'other'] as const
export type ContactType = (typeof contactTypes)[number]

/**
 * Create contact schema
 */
export const contactSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters')
    .trim(),
  email: emailSchema,
  phone: phoneSchema,
  title: z
    .string()
    .max(100, 'Title must be less than 100 characters')
    .optional()
    .or(z.literal(''))
    .transform((val) => val || undefined),
  type: z.enum(contactTypes).optional().default('lead'),
  organizationId: uuidSchema.optional().or(z.literal('')).transform((val) => val || undefined),
  notes: z
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .or(z.literal(''))
    .transform((val) => val || undefined),
  linkedinUrl: urlSchema,
  twitterUrl: urlSchema,
})

export type ContactInput = z.infer<typeof contactSchema>

/**
 * Update contact schema (all fields optional)
 */
export const contactUpdateSchema = contactSchema.partial()

export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>

/**
 * Contact search/filter schema
 */
export const contactSearchSchema = z.object({
  search: z.string().max(100).optional(),
  type: z.enum(contactTypes).optional(),
  organizationId: uuidSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['firstName', 'lastName', 'email', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export type ContactSearchInput = z.infer<typeof contactSearchSchema>

/**
 * Contact import schema (for bulk import)
 */
export const contactImportRowSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  title: z.string().optional(),
  type: z.enum(contactTypes).optional(),
  notes: z.string().optional(),
})

export const contactImportSchema = z.array(contactImportRowSchema)

export type ContactImportRow = z.infer<typeof contactImportRowSchema>
