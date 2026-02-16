# API Design Patterns

This document covers Server Actions, Route Handlers, and API design patterns for the application.

## Core Principle

**Server Actions** handle all UI mutations. **Route Handlers** are reserved exclusively for:
- Webhooks (Stripe, payment providers)
- External API integrations
- Health checks

## Server Actions

### Why Server Actions?

1. **Type-safe**: Full TypeScript inference from form to action
2. **Encrypted**: Action IDs are encrypted, not exposed
3. **Progressive Enhancement**: Work without JavaScript
4. **Integrated**: Seamless with React's pending states
5. **Cacheable**: Automatic integration with `revalidatePath`

### Standard Action Pattern

```typescript
// src/actions/contacts/create.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { contacts } from '@/db/schema'
import { contactSchema } from '@/schemas/contacts'
import type { ActionResult } from '@/types'

export async function createContact(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // 1. Authentication
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: 'You must be logged in to perform this action',
    }
  }

  // 2. Validation
  const rawData = Object.fromEntries(formData)
  const validationResult = contactSchema.safeParse(rawData)

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    }
  }

  // 3. Database Operation
  try {
    const [contact] = await db
      .insert(contacts)
      .values({
        ...validationResult.data,
        userId: user.id,
      })
      .returning()

    // 4. Cache Invalidation
    revalidatePath('/contacts')

    return {
      success: true,
      data: contact,
    }
  } catch (error) {
    console.error('Failed to create contact:', error)
    return {
      success: false,
      error: 'Failed to create contact. Please try again.',
    }
  }
}
```

### Action Result Type

```typescript
// src/types/index.ts
export type ActionResult<T = unknown> =
  | { success: true; data?: T }
  | { success: false; error?: string; errors?: Record<string, string[]> }
```

### Update Action Pattern

```typescript
// src/actions/contacts/update.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { contacts } from '@/db/schema'
import { contactUpdateSchema } from '@/schemas/contacts'
import { eq, and } from 'drizzle-orm'
import type { ActionResult } from '@/types'

export async function updateContact(
  id: string,
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const rawData = Object.fromEntries(formData)
  const validationResult = contactUpdateSchema.safeParse(rawData)

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    }
  }

  try {
    const [updated] = await db
      .update(contacts)
      .set({
        ...validationResult.data,
        updatedAt: new Date(),
      })
      .where(and(
        eq(contacts.id, id),
        eq(contacts.userId, user.id) // Always scope to user
      ))
      .returning()

    if (!updated) {
      return { success: false, error: 'Contact not found' }
    }

    revalidatePath('/contacts')
    revalidatePath(`/contacts/${id}`)

    return { success: true, data: updated }
  } catch (error) {
    console.error('Failed to update contact:', error)
    return { success: false, error: 'Failed to update contact' }
  }
}
```

### Delete Action Pattern

```typescript
// src/actions/contacts/delete.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { contacts } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import type { ActionResult } from '@/types'

export async function deleteContact(id: string): Promise<ActionResult> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const deleted = await db
      .delete(contacts)
      .where(and(
        eq(contacts.id, id),
        eq(contacts.userId, user.id)
      ))
      .returning()

    if (deleted.length === 0) {
      return { success: false, error: 'Contact not found' }
    }

    revalidatePath('/contacts')

    return { success: true }
  } catch (error) {
    console.error('Failed to delete contact:', error)
    return { success: false, error: 'Failed to delete contact' }
  }
}
```

### Using Actions in Components

```typescript
// src/components/forms/contact-form.tsx
'use client'

import { useActionState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createContact } from '@/actions/contacts/create'
import { contactSchema, type ContactInput } from '@/schemas/contacts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(createContact, null)

  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
  })

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage>
                {state?.errors?.firstName?.[0]}
              </FormMessage>
            </FormItem>
          )}
        />

        {/* More fields... */}

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Contact'}
        </Button>
      </form>
    </Form>
  )
}
```

### Binding Parameters to Actions

```typescript
// For update actions that need an ID
'use client'

import { useActionState } from 'react'
import { updateContact } from '@/actions/contacts/update'

export function EditContactForm({ contactId }: { contactId: string }) {
  // Bind the ID to the action
  const updateWithId = updateContact.bind(null, contactId)
  const [state, formAction, isPending] = useActionState(updateWithId, null)

  return (
    <form action={formAction}>
      {/* Form fields */}
    </form>
  )
}
```

## Route Handlers (Webhooks Only)

### Webhook Pattern

```typescript
// src/app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/db'
import { subscriptions } from '@/db/schema'
import { eq } from 'drizzle-orm'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCanceled(subscription)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  await db
    .update(subscriptions)
    .set({
      status: subscription.status,
      priceId: subscription.items.data[0]?.price.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId))
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  await db
    .update(subscriptions)
    .set({
      status: 'canceled',
      canceledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId))
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Send notification email, update UI state, etc.
  console.log('Payment failed for customer:', invoice.customer)
}
```

### Health Check Endpoint

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { sql } from 'drizzle-orm'

export const runtime = 'edge' // Fast health checks

export async function GET() {
  try {
    // Check database connection
    await db.execute(sql`SELECT 1`)

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
```

## Validation with Zod

### Schema Definition

```typescript
// src/schemas/contacts.ts
import { z } from 'zod'

export const contactSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  title: z
    .string()
    .max(100, 'Title must be less than 100 characters')
    .optional(),
  organizationId: z.string().uuid().optional(),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
})

export const contactUpdateSchema = contactSchema.partial()

export type ContactInput = z.infer<typeof contactSchema>
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>
```

### Reusable Schema Parts

```typescript
// src/schemas/shared.ts
import { z } from 'zod'

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .toLowerCase()

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
  .optional()
  .or(z.literal(''))

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const searchSchema = z.object({
  search: z.string().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})
```

## Error Handling

### Custom Error Classes

```typescript
// src/lib/errors.ts
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

export class AuthenticationError extends AppError {
  constructor(message = 'You must be logged in') {
    super(message, 'UNAUTHENTICATED', 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'You are not authorized to perform this action') {
    super(message, 'UNAUTHORIZED', 403)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public errors: Record<string, string[]>
  ) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}
```

### Error Response Helper

```typescript
// src/lib/errors.ts
import type { ActionResult } from '@/types'

export function handleActionError(error: unknown): ActionResult {
  if (error instanceof ValidationError) {
    return {
      success: false,
      errors: error.errors,
    }
  }

  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
    }
  }

  console.error('Unexpected error:', error)
  return {
    success: false,
    error: 'An unexpected error occurred. Please try again.',
  }
}
```

## API Organization

```
src/
├── actions/
│   ├── index.ts              # Barrel export
│   ├── auth/
│   │   ├── login.ts
│   │   ├── register.ts
│   │   ├── logout.ts
│   │   └── index.ts
│   ├── contacts/
│   │   ├── create.ts
│   │   ├── update.ts
│   │   ├── delete.ts
│   │   └── index.ts
│   └── organizations/
│       ├── create.ts
│       ├── update.ts
│       ├── delete.ts
│       └── index.ts
│
├── app/api/
│   ├── webhooks/
│   │   └── stripe/
│   │       └── route.ts
│   └── health/
│       └── route.ts
│
└── schemas/
    ├── index.ts
    ├── shared.ts
    ├── auth.ts
    ├── contacts.ts
    └── organizations.ts
```

## Best Practices Summary

| Aspect | Practice |
|--------|----------|
| **Mutations** | Always use Server Actions |
| **Validation** | Server-side Zod validation required |
| **Auth** | Check `getUser()` in every action |
| **Scope** | Always filter by `userId` |
| **Errors** | Return structured `ActionResult` |
| **Cache** | Call `revalidatePath` after mutations |
| **Webhooks** | Verify signatures before processing |
| **Types** | Infer from Zod schemas |
