import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('shows login page', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('shows registration page', async ({ page }) => {
    await page.goto('/register')

    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible()
    await expect(page.getByLabel(/full name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/^password$/i)).toBeVisible()
    await expect(page.getByLabel(/confirm password/i)).toBeVisible()
  })

  test('shows validation errors for empty login form', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('button', { name: /sign in/i }).click()

    // Wait for validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible()
  })

  test('shows validation errors for invalid email', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByText(/invalid email/i)).toBeVisible()
  })

  test('navigates between login and register', async ({ page }) => {
    await page.goto('/login')

    // Click "Sign up" link
    await page.getByRole('link', { name: /sign up/i }).click()
    await expect(page).toHaveURL('/register')

    // Click "Sign in" link
    await page.getByRole('link', { name: /sign in/i }).click()
    await expect(page).toHaveURL('/login')
  })

  test('redirects unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/dashboard')

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })

  test('shows forgot password link', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('link', { name: /forgot your password/i })).toBeVisible()
  })
})

test.describe('Registration Validation', () => {
  test('validates password requirements', async ({ page }) => {
    await page.goto('/register')

    await page.getByLabel(/full name/i).fill('John Doe')
    await page.getByLabel(/email/i).fill('john@example.com')
    await page.getByLabel(/^password$/i).fill('weak')
    await page.getByLabel(/confirm password/i).fill('weak')

    await page.getByRole('button', { name: /create account/i }).click()

    await expect(page.getByText(/at least 8 characters/i)).toBeVisible()
  })

  test('validates password confirmation', async ({ page }) => {
    await page.goto('/register')

    await page.getByLabel(/full name/i).fill('John Doe')
    await page.getByLabel(/email/i).fill('john@example.com')
    await page.getByLabel(/^password$/i).fill('Password123')
    await page.getByLabel(/confirm password/i).fill('Different123')

    await page.getByRole('button', { name: /create account/i }).click()

    await expect(page.getByText(/passwords do not match/i)).toBeVisible()
  })
})
