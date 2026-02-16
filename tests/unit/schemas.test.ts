import { describe, it, expect } from 'vitest'
import { contactSchema } from '@/schemas/contacts'
import { loginSchema, registerSchema } from '@/schemas/auth'

describe('contactSchema', () => {
  it('validates a valid contact', () => {
    const validContact = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    }

    const result = contactSchema.safeParse(validContact)
    expect(result.success).toBe(true)
  })

  it('requires firstName', () => {
    const result = contactSchema.safeParse({
      lastName: 'Doe',
      email: 'john@example.com',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.firstName).toBeDefined()
    }
  })

  it('requires lastName', () => {
    const result = contactSchema.safeParse({
      firstName: 'John',
      email: 'john@example.com',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.lastName).toBeDefined()
    }
  })

  it('validates email format', () => {
    const result = contactSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      email: 'not-an-email',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toContain('Invalid email address')
    }
  })

  it('validates phone format when provided', () => {
    const validWithPhone = contactSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
    })
    expect(validWithPhone.success).toBe(true)

    const invalidPhone = contactSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: 'not-a-phone',
    })
    expect(invalidPhone.success).toBe(false)
  })

  it('allows empty optional fields', () => {
    const result = contactSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '',
      title: '',
      notes: '',
    })

    expect(result.success).toBe(true)
  })

  it('validates contact type enum', () => {
    const validType = contactSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      type: 'customer',
    })
    expect(validType.success).toBe(true)

    const invalidType = contactSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      type: 'invalid-type',
    })
    expect(invalidType.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('validates valid login credentials', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    })

    expect(result.success).toBe(true)
  })

  it('requires email', () => {
    const result = loginSchema.safeParse({
      password: 'password123',
    })

    expect(result.success).toBe(false)
  })

  it('requires password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
    })

    expect(result.success).toBe(false)
  })

  it('validates email format', () => {
    const result = loginSchema.safeParse({
      email: 'invalid-email',
      password: 'password123',
    })

    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  it('validates valid registration', () => {
    const result = registerSchema.safeParse({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    })

    expect(result.success).toBe(true)
  })

  it('requires password confirmation to match', () => {
    const result = registerSchema.safeParse({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'Password123',
      confirmPassword: 'Different123',
    })

    expect(result.success).toBe(false)
  })

  it('enforces password complexity', () => {
    const weakPassword = registerSchema.safeParse({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'weak',
      confirmPassword: 'weak',
    })

    expect(weakPassword.success).toBe(false)

    const noUppercase = registerSchema.safeParse({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    })

    expect(noUppercase.success).toBe(false)
  })

  it('requires full name of at least 2 characters', () => {
    const result = registerSchema.safeParse({
      fullName: 'J',
      email: 'john@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    })

    expect(result.success).toBe(false)
  })
})
