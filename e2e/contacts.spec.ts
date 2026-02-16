import { test, expect } from '@playwright/test'

// Note: These tests require authentication
// In a real app, you'd use fixtures to handle auth state

test.describe('Contacts Page', () => {
  // Skip these tests until auth is set up
  test.skip('displays contacts page for authenticated users', async ({ page }) => {
    // This test would require authentication setup
    await page.goto('/contacts')

    await expect(page.getByRole('heading', { name: /contacts/i })).toBeVisible()
  })

  test.skip('shows empty state when no contacts', async ({ page }) => {
    await page.goto('/contacts')

    await expect(page.getByText(/no contacts yet/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /add contact/i })).toBeVisible()
  })

  test.skip('opens create contact dialog', async ({ page }) => {
    await page.goto('/contacts')

    await page.getByRole('button', { name: /add contact/i }).click()

    await expect(page.getByLabel(/first name/i)).toBeVisible()
    await expect(page.getByLabel(/last name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })
})

test.describe('Contact Form Validation', () => {
  test.skip('shows validation errors for required fields', async ({ page }) => {
    await page.goto('/contacts')

    await page.getByRole('button', { name: /add contact/i }).click()
    await page.getByRole('button', { name: /create contact/i }).click()

    await expect(page.getByText(/first name is required/i)).toBeVisible()
    await expect(page.getByText(/last name is required/i)).toBeVisible()
    await expect(page.getByText(/email is required/i)).toBeVisible()
  })

  test.skip('validates email format', async ({ page }) => {
    await page.goto('/contacts')

    await page.getByRole('button', { name: /add contact/i }).click()
    await page.getByLabel(/first name/i).fill('John')
    await page.getByLabel(/last name/i).fill('Doe')
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByRole('button', { name: /create contact/i }).click()

    await expect(page.getByText(/invalid email/i)).toBeVisible()
  })
})
