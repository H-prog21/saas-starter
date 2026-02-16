# Testing Strategy

This document covers the testing philosophy, tools, and patterns for the application.

## Testing Stack

| Type | Tool | Purpose |
|------|------|---------|
| Unit | Vitest | Functions, hooks, utilities |
| Component | Testing Library | React components |
| Integration | Vitest + MSW | API interactions |
| E2E | Playwright | Full user flows |

## Test Organization

```
/
├── tests/                      # Unit and integration tests
│   ├── setup.ts                # Test setup and mocks
│   ├── utils/                  # Test utilities
│   │   └── test-utils.tsx      # Custom render, providers
│   ├── unit/                   # Pure function tests
│   │   ├── utils.test.ts
│   │   ├── schemas.test.ts
│   │   └── stores.test.ts
│   ├── components/             # Component tests
│   │   ├── button.test.tsx
│   │   └── contact-form.test.tsx
│   └── integration/            # Integration tests
│       └── contacts.test.ts
│
├── e2e/                        # Playwright E2E tests
│   ├── auth.spec.ts
│   ├── contacts.spec.ts
│   └── fixtures/
│       └── auth.ts
│
└── src/
    └── **/*.test.ts            # Co-located tests (optional)
```

## Test Setup

### Vitest Configuration

```typescript
// tests/setup.ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  }),
}))

// Reset all mocks between tests
afterEach(() => {
  vi.clearAllMocks()
})
```

### Test Utilities

```typescript
// tests/utils/test-utils.tsx
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement, ReactNode } from 'react'

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface WrapperProps {
  children: ReactNode
}

function AllProviders({ children }: WrapperProps) {
  const queryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export * from '@testing-library/react'
export { customRender as render }
```

## Unit Tests

### Testing Utilities

```typescript
// tests/unit/utils.test.ts
import { describe, it, expect } from 'vitest'
import { cn, formatDate, formatCurrency } from '@/lib/utils'

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
})

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2024-01-15')
    expect(formatDate(date)).toBe('Jan 15, 2024')
  })

  it('handles string dates', () => {
    expect(formatDate('2024-06-30')).toBe('Jun 30, 2024')
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
})
```

### Testing Zod Schemas

```typescript
// tests/unit/schemas.test.ts
import { describe, it, expect } from 'vitest'
import { contactSchema } from '@/schemas/contacts'

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
})
```

### Testing Zustand Stores

```typescript
// tests/unit/stores.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '@/stores/ui-store'

describe('useUIStore', () => {
  beforeEach(() => {
    // Reset store state
    useUIStore.setState({
      sidebarOpen: true,
      sidebarCollapsed: false,
      activeModal: null,
      modalData: null,
      commandOpen: false,
    })
  })

  it('toggles sidebar', () => {
    const { toggleSidebar } = useUIStore.getState()

    expect(useUIStore.getState().sidebarOpen).toBe(true)
    toggleSidebar()
    expect(useUIStore.getState().sidebarOpen).toBe(false)
    toggleSidebar()
    expect(useUIStore.getState().sidebarOpen).toBe(true)
  })

  it('opens and closes modals', () => {
    const { openModal, closeModal } = useUIStore.getState()

    openModal('create-contact', { defaultEmail: 'test@example.com' })

    expect(useUIStore.getState().activeModal).toBe('create-contact')
    expect(useUIStore.getState().modalData).toEqual({ defaultEmail: 'test@example.com' })

    closeModal()

    expect(useUIStore.getState().activeModal).toBeNull()
    expect(useUIStore.getState().modalData).toBeNull()
  })

  it('sets command palette state', () => {
    const { setCommandOpen } = useUIStore.getState()

    setCommandOpen(true)
    expect(useUIStore.getState().commandOpen).toBe(true)

    setCommandOpen(false)
    expect(useUIStore.getState().commandOpen).toBe(false)
  })
})
```

## Component Tests

### Testing UI Components

```typescript
// tests/components/button.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../utils/test-utils'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('renders different variants', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')

    rerender(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole('button')).toHaveClass('border')
  })

  it('renders as a child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )
    expect(screen.getByRole('link', { name: /link button/i })).toBeInTheDocument()
  })
})
```

### Testing Form Components

```typescript
// tests/components/contact-form.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../utils/test-utils'
import userEvent from '@testing-library/user-event'
import { ContactForm } from '@/components/forms/contact-form'

// Mock the server action
vi.mock('@/actions/contacts/create', () => ({
  createContact: vi.fn(),
}))

import { createContact } from '@/actions/contacts/create'

const mockOrganizations = [
  { id: '1', name: 'Acme Corp', userId: 'user-1', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Tech Inc', userId: 'user-1', createdAt: new Date(), updatedAt: new Date() },
]

describe('ContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all form fields', () => {
    render(<ContactForm organizations={mockOrganizations} />)

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/organization/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create contact/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup()
    render(<ContactForm organizations={mockOrganizations} />)

    await user.click(screen.getByRole('button', { name: /create contact/i }))

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup()
    render(<ContactForm organizations={mockOrganizations} />)

    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')
    await user.type(screen.getByLabelText(/email/i), 'invalid-email')
    await user.click(screen.getByRole('button', { name: /create contact/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument()
    })
  })

  it('resets form when reset button is clicked', async () => {
    const user = userEvent.setup()
    render(<ContactForm organizations={mockOrganizations} />)

    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')

    expect(screen.getByLabelText(/first name/i)).toHaveValue('John')

    await user.click(screen.getByRole('button', { name: /reset/i }))

    expect(screen.getByLabelText(/first name/i)).toHaveValue('')
  })
})
```

## E2E Tests with Playwright

### Auth Fixture

```typescript
// e2e/fixtures/auth.ts
import { test as base, expect, type Page } from '@playwright/test'

interface AuthFixtures {
  authenticatedPage: Page
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login
    await page.goto('/login')

    // Fill in credentials
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')
    await expect(page).toHaveURL('/dashboard')

    await use(page)
  },
})

export { expect }
```

### Auth Flow Tests

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('shows login page', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })

  test('shows validation errors for empty form', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByText(/email is required/i)).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Email').fill('wrong@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByText(/invalid credentials/i)).toBeVisible()
  })

  test('redirects unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL('/login')
  })

  test('allows sign out', async ({ page }) => {
    // First, sign in
    await page.goto('/login')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()

    await page.waitForURL('/dashboard')

    // Then sign out
    await page.getByRole('button', { name: /user menu/i }).click()
    await page.getByRole('menuitem', { name: /sign out/i }).click()

    await expect(page).toHaveURL('/login')
  })
})
```

### Contacts CRUD Tests

```typescript
// e2e/contacts.spec.ts
import { test, expect } from './fixtures/auth'

test.describe('Contacts', () => {
  test('displays contacts list', async ({ authenticatedPage: page }) => {
    await page.goto('/contacts')

    await expect(page.getByRole('heading', { name: /contacts/i })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('creates a new contact', async ({ authenticatedPage: page }) => {
    await page.goto('/contacts')

    // Open create dialog
    await page.getByRole('button', { name: /add contact/i }).click()

    // Fill form
    await page.getByLabel('First Name').fill('John')
    await page.getByLabel('Last Name').fill('Doe')
    await page.getByLabel('Email').fill('john.doe@example.com')

    // Submit
    await page.getByRole('button', { name: /create contact/i }).click()

    // Verify success
    await expect(page.getByText(/contact created/i)).toBeVisible()
    await expect(page.getByRole('cell', { name: /john doe/i })).toBeVisible()
  })

  test('edits an existing contact', async ({ authenticatedPage: page }) => {
    await page.goto('/contacts')

    // Click edit on first row
    await page.getByRole('row').first().getByRole('button', { name: /edit/i }).click()

    // Modify data
    await page.getByLabel('First Name').clear()
    await page.getByLabel('First Name').fill('Jane')

    // Save
    await page.getByRole('button', { name: /save/i }).click()

    // Verify
    await expect(page.getByText(/contact updated/i)).toBeVisible()
  })

  test('deletes a contact', async ({ authenticatedPage: page }) => {
    await page.goto('/contacts')

    // Get initial count
    const initialRows = await page.getByRole('row').count()

    // Click delete
    await page.getByRole('row').first().getByRole('button', { name: /delete/i }).click()

    // Confirm deletion
    await page.getByRole('button', { name: /confirm/i }).click()

    // Verify
    await expect(page.getByText(/contact deleted/i)).toBeVisible()
    await expect(page.getByRole('row')).toHaveCount(initialRows - 1)
  })

  test('searches contacts', async ({ authenticatedPage: page }) => {
    await page.goto('/contacts')

    await page.getByPlaceholder(/search/i).fill('john')

    // Wait for results
    await page.waitForTimeout(500) // Debounce

    // Verify filtered results
    const rows = page.getByRole('row')
    for (const row of await rows.all()) {
      await expect(row).toContainText(/john/i)
    }
  })
})
```

## Running Tests

```bash
# Unit tests
pnpm test                    # Run once
pnpm test:ui                 # With UI
pnpm test:coverage           # With coverage

# Watch mode
pnpm test -- --watch

# Run specific file
pnpm test tests/unit/utils.test.ts

# E2E tests
pnpm test:e2e                # Run all
pnpm test:e2e:ui             # With UI
pnpm test:e2e -- --project=chromium  # Specific browser

# Debug E2E
pnpm test:e2e -- --debug
```

## Coverage Requirements

Minimum coverage thresholds (configured in `vitest.config.ts`):

| Metric | Threshold |
|--------|-----------|
| Statements | 70% |
| Branches | 70% |
| Functions | 70% |
| Lines | 70% |

## Best Practices

1. **Test behavior, not implementation**
2. **Use meaningful test descriptions**
3. **Keep tests isolated** - no shared state
4. **Mock external dependencies**
5. **Test edge cases and error states**
6. **Use realistic test data**
7. **Run tests before committing**
