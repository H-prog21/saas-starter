# CLAUDE.md - AI Assistant Context

This file provides context for AI assistants (Claude Code, Cursor, GitHub Copilot) working on this codebase.

## Project Overview

EST is a modern SaaS application built with the 2025/2026 optimal stack. It follows strict conventions for type safety, performance, and developer experience.

## Tech Stack

- **Framework**: Next.js 15.5 with App Router, React 19
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Database**: Supabase (PostgreSQL) with Drizzle ORM
- **State**: Zustand (client), TanStack Query (server)
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest (unit), Playwright (E2E)
- **Linting**: Biome (not ESLint)

## Key Commands

```bash
pnpm dev              # Start dev server (Turbopack)
pnpm lint:fix         # Fix linting issues
pnpm type-check       # TypeScript check
pnpm test             # Run unit tests
pnpm test:e2e         # Run E2E tests
pnpm db:push          # Push schema changes
pnpm db:studio        # Open database UI
```

## Architecture Decisions

### Server Actions vs Route Handlers

```
Server Actions (src/actions/*)
├── ALL form submissions
├── ALL CRUD operations from UI
└── ALL data mutations

Route Handlers (src/app/api/*)
├── Webhooks (Stripe, etc.)
└── External API integrations ONLY
```

### State Management Pattern

```
Server Components → Initial data fetch (no spinners)
TanStack Query   → Client refetching, mutations, caching
Zustand          → UI state only (modals, filters, selections)
```

### Component Organization

```
src/components/
├── ui/           # shadcn/ui primitives (Button, Input, etc.)
├── forms/        # Form components with validation
├── layouts/      # Page layouts, navigation
├── data-display/ # Tables, cards, lists
└── shared/       # Reusable across features
```

## Code Conventions

### File Naming
- All files: `kebab-case.ts` or `kebab-case.tsx`
- Components: PascalCase export, kebab-case file
- Example: `contact-form.tsx` exports `ContactForm`

### Imports
- Use `@/` path alias for all imports
- Organize: external → internal → relative → types

### TypeScript
- Strict mode enabled with additional flags
- Prefer `type` over `interface` for object shapes
- Use Zod schemas as source of truth for types

### Server Actions Pattern

```typescript
// src/actions/contacts/create.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { contactSchema } from '@/schemas/contacts'
import { ActionResult } from '@/types'

export async function createContact(formData: FormData): Promise<ActionResult> {
  const supabase = await createServerClient()

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Validate input
  const result = contactSchema.safeParse(Object.fromEntries(formData))
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors }
  }

  // 3. Database operation
  try {
    await db.insert(contacts).values({ ...result.data, userId: user.id })
  } catch (error) {
    return { success: false, error: 'Failed to create contact' }
  }

  // 4. Revalidate cache
  revalidatePath('/contacts')
  return { success: true }
}
```

### Form Component Pattern

```typescript
// src/components/forms/contact-form.tsx
'use client'

import { useActionState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createContact } from '@/actions/contacts/create'
import { contactSchema, type ContactInput } from '@/schemas/contacts'

export function ContactForm() {
  const [state, action, isPending] = useActionState(createContact, null)

  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '' }
  })

  return (
    <form action={action}>
      {/* Form fields with shadcn/ui components */}
    </form>
  )
}
```

### Database Query Pattern

```typescript
// src/db/queries/contacts.ts
import { eq, desc } from 'drizzle-orm'
import { db } from '@/db'
import { contacts } from '@/db/schema'

export async function getContactsByUser(userId: string) {
  return db.query.contacts.findMany({
    where: eq(contacts.userId, userId),
    orderBy: desc(contacts.createdAt),
  })
}
```

## Do's and Don'ts

### DO
- Use Server Actions for all mutations
- Use Zod schemas for validation
- Use `revalidatePath` after mutations
- Use `@/` imports everywhere
- Add proper error handling
- Use shadcn/ui components

### DON'T
- Create Route Handlers for UI operations
- Use `getSession()` - use `getClaims()` instead
- Skip validation on server
- Use `any` type
- Create new components when shadcn/ui has one
- Put business logic in components

## Common Patterns

### Protected Page

```typescript
// src/app/(dashboard)/contacts/page.tsx
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getContactsByUser } from '@/db/queries/contacts'

export default async function ContactsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const contacts = await getContactsByUser(user.id)

  return <ContactsList contacts={contacts} />
}
```

### Zustand Store

```typescript
// src/stores/ui-store.ts
import { create } from 'zustand'

type UIStore = {
  sidebarOpen: boolean
  toggleSidebar: () => void
  modalOpen: string | null
  openModal: (id: string) => void
  closeModal: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  modalOpen: null,
  openModal: (id) => set({ modalOpen: id }),
  closeModal: () => set({ modalOpen: null }),
}))
```

## Database Schema Location

All schemas in `src/db/schema/`:
- `users.ts` - User profiles
- `contacts.ts` - Contact records
- `organizations.ts` - Organization records
- `deals.ts` - Deal/pipeline records
- `index.ts` - Barrel export with relations

## Testing Files

- Unit tests: `tests/**/*.test.ts`
- E2E tests: `e2e/**/*.spec.ts`
- Component tests: co-located or in `tests/`

## Environment

- Node.js 20+
- pnpm 9+
- Supabase CLI for local development
