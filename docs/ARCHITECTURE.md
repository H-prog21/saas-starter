# Architecture Overview

This document describes the system architecture, data flow patterns, and key design decisions for the EST SaaS application.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  React 19 + Next.js App Router                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Server    │  │   Client    │  │   Zustand   │  │  TanStack   │        │
│  │ Components  │  │ Components  │  │   Stores    │  │    Query    │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
└─────────┼────────────────┼────────────────┼────────────────┼────────────────┘
          │                │                │                │
          ▼                ▼                │                │
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NEXT.JS SERVER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │  Server Actions │    │ Route Handlers  │    │   Middleware    │         │
│  │  (Mutations)    │    │ (Webhooks Only) │    │ (Auth Session)  │         │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘         │
│           │                      │                      │                   │
│           ▼                      ▼                      ▼                   │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                     Drizzle ORM + Supabase Client               │       │
│  └─────────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SUPABASE                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  PostgreSQL │  │    Auth     │  │   Storage   │  │  Realtime   │        │
│  │  Database   │  │   (GoTrue)  │  │   (S3-like) │  │  (optional) │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Request Flow

### Page Load (Server Component)

```
Browser Request
      │
      ▼
┌─────────────┐
│ Middleware  │ ──► Refresh auth session via Supabase SSR
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Layout    │ ──► Check auth, redirect if needed
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Page     │ ──► Fetch data via Drizzle ORM
│  (Server)   │     No loading spinners, instant data
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Client    │ ──► Hydrate with initial data
│ Components  │     TanStack Query takes over
└─────────────┘
```

### Form Submission (Server Action)

```
User Submits Form
      │
      ▼
┌─────────────────┐
│ Client Component│ ──► React Hook Form validates client-side
│   (Form)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Server Action  │ ──► 1. Validate with Zod
│                 │     2. Check authentication
│                 │     3. Execute database operation
│                 │     4. Revalidate cache
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Return Result  │ ──► Success or error with field errors
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Client Updates  │ ──► UI reflects new state
│                 │     TanStack Query cache invalidated
└─────────────────┘
```

### External Webhook

```
External Service (Stripe, etc.)
      │
      ▼
┌─────────────────┐
│ Route Handler   │ ──► /api/webhooks/stripe
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verify Signature│ ──► Validate webhook authenticity
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Process Event   │ ──► Update database via Drizzle
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return 200 OK   │ ──► Acknowledge receipt
└─────────────────┘
```

## Component Architecture

### Server vs Client Components Decision Tree

```
                    ┌─────────────────────────┐
                    │   Does it need...?      │
                    └───────────┬─────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ Browser APIs? │     │ Event handlers│     │ React hooks?  │
│ (window, etc.)│     │ (onClick, etc)│     │ (useState,etc)│
└───────┬───────┘     └───────┬───────┘     └───────┬───────┘
        │                     │                     │
        ▼                     ▼                     ▼
       YES ─────────────────► YES ─────────────────► YES
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  'use client'       │
                    │  Client Component   │
                    └─────────────────────┘

                              │
                              NO (all three)
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Server Component   │
                    │  (default)          │
                    └─────────────────────┘
```

### Component Hierarchy

```
src/components/
│
├── ui/                    # shadcn/ui primitives
│   ├── button.tsx         # Base button component
│   ├── input.tsx          # Form input
│   ├── form.tsx           # Form wrapper with RHF
│   ├── dialog.tsx         # Modal dialogs
│   ├── dropdown-menu.tsx  # Dropdown menus
│   ├── select.tsx         # Select inputs
│   ├── table.tsx          # Data table base
│   ├── toast.tsx          # Toast notifications
│   └── ...                # Other Radix-based components
│
├── forms/                 # Feature-specific forms
│   ├── contact-form.tsx   # Contact CRUD form
│   ├── deal-form.tsx      # Deal pipeline form
│   └── settings-form.tsx  # User settings form
│
├── layouts/               # Structural components
│   ├── dashboard-layout.tsx
│   ├── sidebar.tsx
│   ├── header.tsx
│   └── footer.tsx
│
├── data-display/          # Data presentation
│   ├── data-table.tsx     # Generic data table
│   ├── contact-card.tsx   # Contact display card
│   └── stats-card.tsx     # Dashboard statistics
│
└── shared/                # Cross-cutting components
    ├── loading-spinner.tsx
    ├── error-boundary.tsx
    └── empty-state.tsx
```

## State Management Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        Application State                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    SERVER STATE                           │  │
│  │  (Data from database, owned by server)                    │  │
│  │                                                           │  │
│  │  ┌─────────────────┐    ┌─────────────────┐              │  │
│  │  │ Server Component│    │  TanStack Query │              │  │
│  │  │ (Initial Fetch) │───►│  (Client Cache) │              │  │
│  │  └─────────────────┘    └─────────────────┘              │  │
│  │           │                      │                        │  │
│  │           │    Server Actions    │                        │  │
│  │           └──────────────────────┘                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    CLIENT STATE                           │  │
│  │  (UI state, not persisted)                                │  │
│  │                                                           │  │
│  │  ┌─────────────────┐                                      │  │
│  │  │     Zustand     │                                      │  │
│  │  │  ┌───────────┐  │                                      │  │
│  │  │  │ UI Store  │  │ ◄─── Modals, Sidebars, Toasts       │  │
│  │  │  ├───────────┤  │                                      │  │
│  │  │  │Filter Stor│  │ ◄─── Search, Filters, Sorting       │  │
│  │  │  └───────────┘  │                                      │  │
│  │  └─────────────────┘                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      URL STATE                            │  │
│  │  (Shareable, bookmarkable)                                │  │
│  │                                                           │  │
│  │  ┌─────────────────┐                                      │  │
│  │  │ Search Params   │ ◄─── Pagination, Active Tab, etc.   │  │
│  │  └─────────────────┘                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Caching Strategy

### Next.js Caching Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Request Lifecycle                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Request Memoization (same request, same render)         │
│     └─► Automatic deduplication of fetch calls              │
│                                                              │
│  2. Data Cache (persistent, cross-request)                  │
│     └─► revalidatePath() / revalidateTag() to invalidate    │
│                                                              │
│  3. Full Route Cache (static pages)                         │
│     └─► Not used for authenticated routes                   │
│                                                              │
│  4. Router Cache (client-side, 30s-5min)                    │
│     └─► Prefetched routes cached in browser                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Cache Invalidation Patterns

```typescript
// After mutation in Server Action
revalidatePath('/contacts')           // Invalidate specific path
revalidatePath('/contacts/[id]')      // Invalidate dynamic path
revalidateTag('contacts')             // Invalidate by tag

// In data fetching
const contacts = await db.query.contacts.findMany({
  // Drizzle doesn't use fetch cache, always fresh
})

// With fetch (external APIs)
fetch(url, { next: { tags: ['contacts'] } })
```

## Error Handling Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Error Hierarchy                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  global-error.tsx (root)                                    │
│  └─► Catches errors in root layout                          │
│      Shows full-page error UI                               │
│                                                              │
│  error.tsx (per route segment)                              │
│  └─► Catches errors in page/layout                          │
│      Shows route-specific error UI                          │
│      Offers retry functionality                             │
│                                                              │
│  <ErrorBoundary> (component level)                          │
│  └─► Catches errors in specific components                  │
│      Graceful degradation                                   │
│                                                              │
│  try/catch (action level)                                   │
│  └─► Catches errors in Server Actions                       │
│      Returns structured error response                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Security Architecture

See [SECURITY.md](./SECURITY.md) for detailed security patterns.

```
┌─────────────────────────────────────────────────────────────┐
│                     Security Layers                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Network Layer                                           │
│     └─► HTTPS enforced, security headers                    │
│                                                              │
│  2. Authentication Layer (Supabase Auth)                    │
│     └─► JWT tokens, session management                      │
│                                                              │
│  3. Authorization Layer                                      │
│     └─► Middleware route protection                         │
│     └─► Server Action auth checks                           │
│     └─► RLS policies in database                            │
│                                                              │
│  4. Validation Layer                                         │
│     └─► Zod schemas on all inputs                           │
│     └─► Server-side validation always                       │
│                                                              │
│  5. Database Layer                                           │
│     └─► Row Level Security (RLS)                            │
│     └─► Prepared statements (SQL injection prevention)      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │  Edge Runtime   │    │ Node.js Runtime │                 │
│  │  (Middleware)   │    │ (Server Actions)│                 │
│  └─────────────────┘    └─────────────────┘                 │
│                                                              │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │  Static Assets  │    │    Serverless   │                 │
│  │  (CDN Cached)   │    │    Functions    │                 │
│  └─────────────────┘    └─────────────────┘                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Supabase                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Database   │  │    Auth     │  │   Storage   │         │
│  │ (Postgres)  │  │  (GoTrue)   │  │   (S3)      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Performance Considerations

1. **Server Components First**: Minimize client JavaScript
2. **Streaming**: Use Suspense for progressive loading
3. **Image Optimization**: Use Next.js Image component
4. **Database**: Indexed queries, connection pooling
5. **Caching**: Aggressive cache with precise invalidation
6. **Bundle Size**: Drizzle (~7KB) vs Prisma (~80MB)
