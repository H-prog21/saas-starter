import type { ActionResult } from '@/types'

/**
 * Base application error
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Authentication error - user is not logged in
 */
export class AuthenticationError extends AppError {
  constructor(message = 'You must be logged in to perform this action') {
    super(message, 'UNAUTHENTICATED', 401)
    this.name = 'AuthenticationError'
  }
}

/**
 * Authorization error - user doesn't have permission
 */
export class AuthorizationError extends AppError {
  constructor(message = 'You are not authorized to perform this action') {
    super(message, 'UNAUTHORIZED', 403)
    this.name = 'AuthorizationError'
  }
}

/**
 * Not found error - resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

/**
 * Validation error - input is invalid
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public errors: Record<string, string[]>
  ) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

/**
 * Conflict error - resource already exists
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 'CONFLICT', 409)
    this.name = 'ConflictError'
  }
}

/**
 * Rate limit error - too many requests
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again later.') {
    super(message, 'RATE_LIMITED', 429)
    this.name = 'RateLimitError'
  }
}

/**
 * Convert an error to an ActionResult
 */
export function handleActionError(error: unknown): ActionResult {
  // Known validation error
  if (error instanceof ValidationError) {
    return {
      success: false,
      errors: error.errors,
    }
  }

  // Known application error
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
    }
  }

  // Database constraint errors
  if (error instanceof Error) {
    // Unique constraint violation
    if (error.message.includes('unique constraint')) {
      return {
        success: false,
        error: 'A record with this value already exists',
      }
    }

    // Foreign key violation
    if (error.message.includes('foreign key constraint')) {
      return {
        success: false,
        error: 'Referenced record does not exist',
      }
    }
  }

  // Log unexpected errors
  console.error('Unexpected error:', error)

  // Generic error for unknown errors
  return {
    success: false,
    error: 'An unexpected error occurred. Please try again.',
  }
}

/**
 * Assert a condition and throw if false
 */
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new AppError(message, 'ASSERTION_FAILED')
  }
}

/**
 * Assert user is authenticated
 */
export function assertAuthenticated(
  user: { id: string } | null | undefined
): asserts user is { id: string } {
  if (!user) {
    throw new AuthenticationError()
  }
}
