# Security Best Practices

This document covers security patterns, authentication, authorization, and data protection.

## Authentication with Supabase Auth

### How It Works

1. User submits credentials
2. Supabase Auth validates and returns JWT tokens
3. Tokens stored in HTTP-only cookies (via @supabase/ssr)
4. Middleware refreshes tokens on each request
5. Server Actions validate tokens before mutations

### Cookie-Based Session Flow

```
Browser                    Next.js Server             Supabase Auth
   │                            │                          │
   │  1. Login request          │                          │
   │ ────────────────────────►  │                          │
   │                            │  2. Validate credentials │
   │                            │ ────────────────────────►│
   │                            │                          │
   │                            │  3. Return JWT tokens    │
   │                            │ ◄────────────────────────│
   │                            │                          │
   │  4. Set HTTP-only cookies  │                          │
   │ ◄────────────────────────  │                          │
   │                            │                          │
   │  5. Subsequent requests    │                          │
   │ ────────────────────────►  │                          │
   │   (cookies auto-attached)  │                          │
   │                            │  6. Verify JWT           │
   │                            │ ────────────────────────►│
   │                            │                          │
```

### Server-Side Client Setup

```typescript
// src/lib/supabase/server.ts
import { createServerClient as createClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerClient() {
  const cookieStore = await cookies()

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server Component - cookies are read-only
          }
        },
      },
    }
  )
}
```

### Middleware Session Refresh

```typescript
// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Refresh session - this validates and refreshes the JWT
  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/register'
  )) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

### IMPORTANT: getUser() vs getSession()

```typescript
// ❌ NEVER use getSession() for auth checks - it doesn't validate JWT
const { data: { session } } = await supabase.auth.getSession()

// ✅ ALWAYS use getUser() - validates JWT signature with Supabase Auth
const { data: { user } } = await supabase.auth.getUser()
```

## Authorization Patterns

### Server Action Authorization

```typescript
// src/actions/contacts/update.ts
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { contacts } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function updateContact(id: string, formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Authentication check
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Authorization check - user owns this resource
  const existingContact = await db.query.contacts.findFirst({
    where: and(
      eq(contacts.id, id),
      eq(contacts.userId, user.id) // Critical: scope to user
    ),
  })

  if (!existingContact) {
    return { success: false, error: 'Contact not found' }
  }

  // 3. Proceed with update
  // ...
}
```

### Role-Based Access Control (RBAC)

```typescript
// src/db/schema/users.ts
import { pgTable, uuid, text, pgEnum } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'super_admin'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  role: userRoleEnum('role').notNull().default('user'),
  // ...
})
```

```typescript
// src/lib/auth.ts
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function getCurrentUser() {
  const supabase = await createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) return null

  const user = await db.query.users.findFirst({
    where: eq(users.id, authUser.id),
  })

  return user
}

export async function requireAdmin() {
  const user = await getCurrentUser()

  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    throw new Error('Admin access required')
  }

  return user
}
```

### Server Action with Role Check

```typescript
// src/actions/admin/delete-user.ts
'use server'

import { requireAdmin } from '@/lib/auth'

export async function deleteUser(userId: string) {
  // Only admins can delete users
  await requireAdmin()

  // Proceed with deletion
  // ...
}
```

## Row Level Security (RLS)

### Enable RLS

```sql
-- Always enable RLS on sensitive tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
```

### Standard Policies

```sql
-- Select: Users see only their data
CREATE POLICY "select_own_contacts" ON contacts
  FOR SELECT USING (auth.uid() = user_id);

-- Insert: Users can only insert for themselves
CREATE POLICY "insert_own_contacts" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update: Users can only update their own data
CREATE POLICY "update_own_contacts" ON contacts
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Delete: Users can only delete their own data
CREATE POLICY "delete_own_contacts" ON contacts
  FOR DELETE USING (auth.uid() = user_id);
```

### Team/Organization Access

```sql
-- Users can see contacts from their organization
CREATE POLICY "select_org_contacts" ON contacts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

### Service Role Bypass

```typescript
// For admin operations, webhooks - bypasses RLS
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Never expose to client!
)

// Use only in server-side code
export async function adminDeleteUser(userId: string) {
  // Bypasses RLS
  await supabaseAdmin.from('users').delete().eq('id', userId)
}
```

## Input Validation

### Always Validate on Server

```typescript
// src/actions/contacts/create.ts
'use server'

import { contactSchema } from '@/schemas/contacts'

export async function createContact(formData: FormData) {
  // Always validate server-side, even if client validated
  const rawData = Object.fromEntries(formData)
  const result = contactSchema.safeParse(rawData)

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    }
  }

  // Use validated data
  const validatedData = result.data
  // ...
}
```

### Sanitization

```typescript
// src/lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  })
}

export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}
```

## SQL Injection Prevention

Drizzle ORM uses parameterized queries by default:

```typescript
// ✅ Safe - Drizzle parameterizes values
await db.select().from(contacts).where(eq(contacts.email, userInput))

// ✅ Safe - Using sql template
import { sql } from 'drizzle-orm'
await db.execute(sql`SELECT * FROM contacts WHERE email = ${userInput}`)

// ❌ NEVER do this - raw string concatenation
await db.execute(`SELECT * FROM contacts WHERE email = '${userInput}'`)
```

## XSS Prevention

### React Auto-Escapes

```tsx
// ✅ Safe - React escapes by default
function UserName({ name }: { name: string }) {
  return <span>{name}</span> // Escaped automatically
}
```

### Dangerous Patterns to Avoid

```tsx
// ❌ DANGER - direct HTML injection
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ❌ DANGER - unsafe URLs
<a href={userProvidedUrl}>Link</a>

// ✅ Safe - validate URLs first
<a href={sanitizeUrl(userProvidedUrl) ?? '#'}>Link</a>
```

## CSRF Protection

Server Actions have built-in CSRF protection:

1. Action IDs are encrypted
2. Origin headers are validated
3. Actions only accept POST requests

No additional CSRF configuration needed for Server Actions.

## Security Headers

```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ]
  },
}
```

## Environment Variables

### Secret Management

```typescript
// src/lib/env.ts
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
})
```

### Never Expose Secrets

```typescript
// ❌ NEVER import server env on client
// This would expose secrets in browser bundle
import { env } from '@/lib/env'
console.log(env.SUPABASE_SERVICE_ROLE_KEY) // Exposed!

// ✅ Only access NEXT_PUBLIC_ vars on client
console.log(env.NEXT_PUBLIC_SUPABASE_URL) // Safe
```

## Rate Limiting

### Vercel Rate Limiting

Use Vercel's built-in rate limiting for API routes:

```typescript
// src/app/api/contact/route.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
})

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'

  const { success, limit, reset, remaining } = await ratelimit.limit(ip)

  if (!success) {
    return Response.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    )
  }

  // Process request...
}
```

## Audit Logging

```typescript
// src/db/schema/audit-logs.ts
import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  action: text('action').notNull(), // 'create', 'update', 'delete'
  tableName: text('table_name').notNull(),
  recordId: uuid('record_id').notNull(),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

```typescript
// src/lib/audit.ts
import { headers } from 'next/headers'
import { db } from '@/db'
import { auditLogs } from '@/db/schema'

export async function logAudit(params: {
  userId: string
  action: 'create' | 'update' | 'delete'
  tableName: string
  recordId: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
}) {
  const headersList = await headers()

  await db.insert(auditLogs).values({
    ...params,
    ipAddress: headersList.get('x-forwarded-for'),
    userAgent: headersList.get('user-agent'),
  })
}
```

## Security Checklist

### Authentication
- [ ] Using `getUser()` not `getSession()` for auth checks
- [ ] HTTP-only cookies for session tokens
- [ ] Session refresh in middleware
- [ ] Secure password requirements

### Authorization
- [ ] Auth check in every Server Action
- [ ] Resources scoped to user ID
- [ ] RLS enabled on all tables
- [ ] Role checks for admin actions

### Data Protection
- [ ] Server-side validation on all inputs
- [ ] Parameterized queries (Drizzle default)
- [ ] Secrets in environment variables only
- [ ] Service role key never exposed

### Infrastructure
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Audit logging implemented
