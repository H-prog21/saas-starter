import { z } from 'zod'
import { uuidSchema, currencySchema, percentageSchema } from './shared'

/**
 * Deal stage enum values
 */
export const dealStages = [
  'lead',
  'qualified',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
] as const

export type DealStage = (typeof dealStages)[number]

/**
 * Create deal schema
 */
export const dealSchema = z.object({
  title: z
    .string()
    .min(1, 'Deal title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .or(z.literal(''))
    .transform((val) => val || undefined),
  value: currencySchema,
  currency: z.string().length(3, 'Currency must be a 3-letter code').default('USD'),
  stage: z.enum(dealStages).default('lead'),
  probability: percentageSchema,
  contactId: uuidSchema.optional().or(z.literal('')).transform((val) => val || undefined),
  organizationId: uuidSchema.optional().or(z.literal('')).transform((val) => val || undefined),
  expectedCloseDate: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => val || undefined),
  notes: z
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .or(z.literal(''))
    .transform((val) => val || undefined),
})

export type DealInput = z.infer<typeof dealSchema>

/**
 * Update deal schema
 */
export const dealUpdateSchema = dealSchema.partial()

export type DealUpdateInput = z.infer<typeof dealUpdateSchema>

/**
 * Deal search schema
 */
export const dealSearchSchema = z.object({
  search: z.string().max(100).optional(),
  stage: z.enum(dealStages).optional(),
  contactId: uuidSchema.optional(),
  organizationId: uuidSchema.optional(),
  minValue: z.coerce.number().int().min(0).optional(),
  maxValue: z.coerce.number().int().min(0).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(['title', 'value', 'stage', 'expectedCloseDate', 'createdAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export type DealSearchInput = z.infer<typeof dealSearchSchema>

/**
 * Move deal to stage schema
 */
export const moveDealSchema = z.object({
  dealId: uuidSchema,
  stage: z.enum(dealStages),
})

export type MoveDealInput = z.infer<typeof moveDealSchema>
