# Frontend Architecture Guide

This document covers React component patterns, state management, styling, and UI conventions.

## Component Organization

```
src/components/
├── ui/              # shadcn/ui primitives (auto-generated)
│   ├── button.tsx
│   ├── input.tsx
│   ├── form.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── select.tsx
│   ├── table.tsx
│   ├── toast.tsx
│   ├── tooltip.tsx
│   └── ...
│
├── forms/           # Feature-specific forms
│   ├── contact-form.tsx
│   ├── organization-form.tsx
│   ├── deal-form.tsx
│   └── settings-form.tsx
│
├── layouts/         # Structural components
│   ├── dashboard-layout.tsx
│   ├── sidebar.tsx
│   ├── header.tsx
│   ├── footer.tsx
│   └── mobile-nav.tsx
│
├── data-display/    # Data presentation
│   ├── data-table.tsx
│   ├── data-table-pagination.tsx
│   ├── data-table-toolbar.tsx
│   ├── contact-card.tsx
│   ├── stats-card.tsx
│   └── empty-state.tsx
│
└── shared/          # Cross-cutting utilities
    ├── loading-spinner.tsx
    ├── error-boundary.tsx
    ├── confirm-dialog.tsx
    └── page-header.tsx
```

## Server vs Client Components

### Decision Matrix

| Need | Component Type |
|------|---------------|
| Data fetching | Server |
| Meta tags / SEO | Server |
| Access backend resources | Server |
| Large dependencies | Server |
| Event handlers (onClick) | Client |
| React hooks (useState, useEffect) | Client |
| Browser APIs | Client |
| Interactivity | Client |

### Server Component Pattern

```typescript
// src/app/(dashboard)/contacts/page.tsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getContactsByUser } from '@/db/queries/contacts'
import { ContactsList } from './contacts-list'
import { ContactsTableSkeleton } from './contacts-skeleton'

export default async function ContactsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch data on server - no loading spinners
  const contacts = await getContactsByUser(user.id)

  return (
    <div className="container py-6">
      <h1 className="mb-6 text-2xl font-bold">Contacts</h1>
      <Suspense fallback={<ContactsTableSkeleton />}>
        <ContactsList initialContacts={contacts} />
      </Suspense>
    </div>
  )
}
```

### Client Component Pattern

```typescript
// src/app/(dashboard)/contacts/contacts-list.tsx
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DataTable } from '@/components/data-display/data-table'
import { columns } from './columns'
import type { Contact } from '@/types/database'

interface ContactsListProps {
  initialContacts: Contact[]
}

export function ContactsList({ initialContacts }: ContactsListProps) {
  const [search, setSearch] = useState('')

  // TanStack Query for client-side refetching
  const { data: contacts } = useQuery({
    queryKey: ['contacts', search],
    queryFn: () => fetchContacts(search),
    initialData: initialContacts,
    staleTime: 60 * 1000, // 1 minute
  })

  return (
    <DataTable
      columns={columns}
      data={contacts}
      searchValue={search}
      onSearchChange={setSearch}
    />
  )
}
```

## Forms with React Hook Form + Zod

### Form Component Structure

```typescript
// src/components/forms/contact-form.tsx
'use client'

import { useActionState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createContact } from '@/actions/contacts/create'
import { contactSchema, type ContactInput } from '@/schemas/contacts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { Organization } from '@/types/database'

interface ContactFormProps {
  organizations: Organization[]
  onSuccess?: () => void
}

export function ContactForm({ organizations, onSuccess }: ContactFormProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createContact, null)

  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      title: '',
      organizationId: undefined,
      notes: '',
    },
  })

  // Handle server response
  useEffect(() => {
    if (state?.success) {
      toast.success('Contact created successfully')
      form.reset()
      onSuccess?.()
      router.refresh()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, form, onSuccess, router])

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage>
                  {state?.errors?.firstName?.[0]}
                </FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage>
                  {state?.errors?.lastName?.[0]}
                </FormMessage>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage>
                {state?.errors?.email?.[0]}
              </FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (optional)</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="+1234567890" {...field} />
              </FormControl>
              <FormDescription>
                Include country code for international numbers
              </FormDescription>
              <FormMessage>
                {state?.errors?.phone?.[0]}
              </FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="organizationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization (optional)</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes about this contact..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage>
                {state?.errors?.notes?.[0]}
              </FormMessage>
            </FormItem>
          )}
        />

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating...' : 'Create Contact'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isPending}
          >
            Reset
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

## State Management

### Zustand for UI State

```typescript
// src/stores/ui-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // Sidebar
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  // Modals
  activeModal: string | null
  modalData: Record<string, unknown> | null
  openModal: (id: string, data?: Record<string, unknown>) => void
  closeModal: () => void

  // Command palette
  commandOpen: boolean
  setCommandOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarOpen: true,
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Modals
      activeModal: null,
      modalData: null,
      openModal: (id, data) => set({ activeModal: id, modalData: data ?? null }),
      closeModal: () => set({ activeModal: null, modalData: null }),

      // Command palette
      commandOpen: false,
      setCommandOpen: (open) => set({ commandOpen: open }),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)
```

### Filter/Search Store

```typescript
// src/stores/filter-store.ts
import { create } from 'zustand'

interface FilterState {
  search: string
  setSearch: (search: string) => void

  sortBy: string
  sortOrder: 'asc' | 'desc'
  setSort: (sortBy: string, sortOrder?: 'asc' | 'desc') => void

  filters: Record<string, string[]>
  setFilter: (key: string, values: string[]) => void
  clearFilters: () => void
}

export const useFilterStore = create<FilterState>((set) => ({
  search: '',
  setSearch: (search) => set({ search }),

  sortBy: 'createdAt',
  sortOrder: 'desc',
  setSort: (sortBy, sortOrder) => set((s) => ({
    sortBy,
    sortOrder: sortOrder ?? s.sortOrder,
  })),

  filters: {},
  setFilter: (key, values) => set((s) => ({
    filters: { ...s.filters, [key]: values },
  })),
  clearFilters: () => set({ filters: {}, search: '' }),
}))
```

### TanStack Query for Server State

```typescript
// src/providers/query-provider.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### Custom Query Hook

```typescript
// src/hooks/use-contacts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteContact } from '@/actions/contacts/delete'
import type { Contact } from '@/types/database'

async function fetchContacts(search?: string): Promise<Contact[]> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)

  const response = await fetch(`/api/contacts?${params}`)
  if (!response.ok) throw new Error('Failed to fetch contacts')
  return response.json()
}

export function useContacts(search?: string) {
  return useQuery({
    queryKey: ['contacts', search],
    queryFn: () => fetchContacts(search),
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteContact,
    onMutate: async (contactId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['contacts'] })

      // Snapshot current data
      const previousContacts = queryClient.getQueryData(['contacts'])

      // Optimistically remove
      queryClient.setQueryData(['contacts'], (old: Contact[] | undefined) =>
        old?.filter((c) => c.id !== contactId)
      )

      return { previousContacts }
    },
    onError: (_err, _contactId, context) => {
      // Rollback on error
      queryClient.setQueryData(['contacts'], context?.previousContacts)
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}
```

## Styling with Tailwind v4

### Global Styles

```css
/* src/styles/globals.css */
@import "tailwindcss";

/* Tailwind v4 plugins */
@plugin "@tailwindcss/typography";
@plugin "@tailwindcss/forms" { strategy: "class"; }
@plugin "tailwindcss-animate";

/* CSS Variables for theming */
@theme {
  --color-background: hsl(0 0% 100%);
  --color-foreground: hsl(240 10% 3.9%);
  --color-card: hsl(0 0% 100%);
  --color-card-foreground: hsl(240 10% 3.9%);
  --color-popover: hsl(0 0% 100%);
  --color-popover-foreground: hsl(240 10% 3.9%);
  --color-primary: hsl(240 5.9% 10%);
  --color-primary-foreground: hsl(0 0% 98%);
  --color-secondary: hsl(240 4.8% 95.9%);
  --color-secondary-foreground: hsl(240 5.9% 10%);
  --color-muted: hsl(240 4.8% 95.9%);
  --color-muted-foreground: hsl(240 3.8% 46.1%);
  --color-accent: hsl(240 4.8% 95.9%);
  --color-accent-foreground: hsl(240 5.9% 10%);
  --color-destructive: hsl(0 84.2% 60.2%);
  --color-destructive-foreground: hsl(0 0% 98%);
  --color-border: hsl(240 5.9% 90%);
  --color-input: hsl(240 5.9% 90%);
  --color-ring: hsl(240 5.9% 10%);
  --radius: 0.5rem;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  @theme {
    --color-background: hsl(240 10% 3.9%);
    --color-foreground: hsl(0 0% 98%);
    --color-card: hsl(240 10% 3.9%);
    --color-card-foreground: hsl(0 0% 98%);
    --color-popover: hsl(240 10% 3.9%);
    --color-popover-foreground: hsl(0 0% 98%);
    --color-primary: hsl(0 0% 98%);
    --color-primary-foreground: hsl(240 5.9% 10%);
    --color-secondary: hsl(240 3.7% 15.9%);
    --color-secondary-foreground: hsl(0 0% 98%);
    --color-muted: hsl(240 3.7% 15.9%);
    --color-muted-foreground: hsl(240 5% 64.9%);
    --color-accent: hsl(240 3.7% 15.9%);
    --color-accent-foreground: hsl(0 0% 98%);
    --color-destructive: hsl(0 62.8% 30.6%);
    --color-destructive-foreground: hsl(0 0% 98%);
    --color-border: hsl(240 3.7% 15.9%);
    --color-input: hsl(240 3.7% 15.9%);
    --color-ring: hsl(240 4.9% 83.9%);
  }
}

/* Base styles */
* {
  @apply border-border;
}

body {
  @apply bg-background text-foreground;
  font-feature-settings: "rlig" 1, "calt" 1;
}
```

### Utility Functions

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}
```

## Loading States

### Page Loading

```typescript
// src/app/(dashboard)/contacts/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function ContactsLoading() {
  return (
    <div className="container py-6">
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  )
}
```

### Component Skeleton

```typescript
// src/components/data-display/data-table-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton'

export function DataTableSkeleton() {
  return (
    <div className="rounded-md border">
      <div className="border-b p-4">
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-3">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Error Handling

### Error Boundary

```typescript
// src/app/(dashboard)/contacts/error.tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ContactsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Contacts error:', error)
  }, [error])

  return (
    <div className="container flex flex-col items-center justify-center py-12">
      <h2 className="mb-4 text-2xl font-bold">Something went wrong</h2>
      <p className="mb-6 text-muted-foreground">
        We couldn't load your contacts. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
```

### Empty State

```typescript
// src/components/shared/empty-state.tsx
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileQuestion className="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
```

## Accessibility Guidelines

1. **Semantic HTML**: Use proper heading hierarchy (h1 → h2 → h3)
2. **ARIA Labels**: Add `aria-label` to icon-only buttons
3. **Focus Management**: Ensure keyboard navigation works
4. **Color Contrast**: Maintain WCAG 2.1 AA compliance
5. **Screen Readers**: Test with VoiceOver/NVDA
6. **Reduced Motion**: Respect `prefers-reduced-motion`

```typescript
// Example: Accessible icon button
<Button variant="ghost" size="icon" aria-label="Delete contact">
  <Trash2 className="h-4 w-4" />
</Button>

// Example: Skip link
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4"
>
  Skip to main content
</a>
```
