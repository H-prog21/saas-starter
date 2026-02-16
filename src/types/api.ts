/**
 * Server Action result type
 * All Server Actions should return this type
 */
export type ActionResult<T = unknown> =
  | {
      success: true
      data?: T
      message?: string
    }
  | {
      success: false
      error?: string
      errors?: Record<string, string[]>
    }

/**
 * Pagination parameters
 */
export type PaginationParams = {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Paginated response
 */
export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

/**
 * Search parameters
 */
export type SearchParams = {
  search?: string
  filters?: Record<string, string | string[]>
} & PaginationParams
