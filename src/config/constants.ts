/**
 * Application-wide constants
 */

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// File upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

// Search
export const SEARCH_DEBOUNCE_MS = 300
export const MIN_SEARCH_LENGTH = 2

// Cache
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const

// Rate limiting
export const RATE_LIMITS = {
  AUTH: { requests: 10, window: 60 }, // 10 requests per minute
  API: { requests: 100, window: 60 }, // 100 requests per minute
  UPLOAD: { requests: 10, window: 60 }, // 10 uploads per minute
} as const

// Deal stages
export const DEAL_STAGES = [
  { id: 'lead', label: 'Lead', color: 'bg-slate-500' },
  { id: 'qualified', label: 'Qualified', color: 'bg-blue-500' },
  { id: 'proposal', label: 'Proposal', color: 'bg-yellow-500' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-500' },
  { id: 'closed_won', label: 'Closed Won', color: 'bg-green-500' },
  { id: 'closed_lost', label: 'Closed Lost', color: 'bg-red-500' },
] as const

export type DealStage = (typeof DEAL_STAGES)[number]['id']

// Contact types
export const CONTACT_TYPES = [
  { id: 'lead', label: 'Lead' },
  { id: 'customer', label: 'Customer' },
  { id: 'partner', label: 'Partner' },
  { id: 'vendor', label: 'Vendor' },
  { id: 'other', label: 'Other' },
] as const

export type ContactType = (typeof CONTACT_TYPES)[number]['id']
