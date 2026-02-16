import { describe, it, expect } from 'vitest'
import { cn, formatDate, formatCurrency, truncate, getInitials, capitalize } from '@/lib/utils'

describe('cn (class names)', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', true && 'included', false && 'excluded')).toBe('base included')
  })

  it('merges Tailwind classes correctly', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles undefined and null values', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })

  it('handles arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })
})

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2024-01-15')
    expect(formatDate(date)).toBe('Jan 15, 2024')
  })

  it('handles string dates', () => {
    expect(formatDate('2024-06-30')).toBe('Jun 30, 2024')
  })

  it('accepts custom options', () => {
    const date = new Date('2024-01-15')
    expect(formatDate(date, { month: 'long', day: 'numeric' })).toBe('January 15')
  })
})

describe('formatCurrency', () => {
  it('formats USD by default', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('formats other currencies', () => {
    expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56')
  })

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('handles negative numbers', () => {
    expect(formatCurrency(-100)).toBe('-$100.00')
  })
})

describe('truncate', () => {
  it('truncates long strings', () => {
    expect(truncate('Hello, this is a long string', 10)).toBe('Hello, thi...')
  })

  it('does not truncate short strings', () => {
    expect(truncate('Hello', 10)).toBe('Hello')
  })

  it('handles exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello')
  })
})

describe('getInitials', () => {
  it('gets initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('handles single name', () => {
    expect(getInitials('John')).toBe('J')
  })

  it('limits to 2 characters', () => {
    expect(getInitials('John Michael Doe')).toBe('JM')
  })

  it('handles lowercase names', () => {
    expect(getInitials('john doe')).toBe('JD')
  })
})

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello')
  })

  it('handles empty string', () => {
    expect(capitalize('')).toBe('')
  })

  it('handles already capitalized', () => {
    expect(capitalize('Hello')).toBe('Hello')
  })
})
