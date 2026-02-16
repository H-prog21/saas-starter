# The 2025/2026 optimal Next.js + Supabase SaaS stack

Building a Salesforce-style internal business application requires a carefully curated modern stack. **The winning combination is Next.js 15.5, React 19, Tailwind v4, shadcn/ui, Drizzle ORM, and Supabase—all deployed on Vercel.** This prescriptive guide eliminates decision paralysis with one opinionated choice per category, backed by production adoption data, npm trends, and community consensus as of January 2026.

## Core framework: Next.js 15.5 with React 19

**Use Next.js 15.5.x** (currently 15.5.11). The framework reached production stability in October 2024 and has since added Node.js middleware runtime stability and typed routes. React 19.2.x is the required minimum—it shipped stable December 5, 2024 with Server Components, Server Actions, and the new `useActionState` hook fully production-ready.

```bash
pnpm create next-app@latest --typescript --tailwind --eslint --app --src-dir
```

**Server Actions handle internal mutations; Route Handlers serve external APIs.** For your SaaS, use Server Actions for all form submissions, CRUD operations, and data mutations from the UI—they're type-safe, encrypted, and integrate seamlessly with React's pending states. Reserve Route Handlers (`app/api/`) exclusively for webhooks (Stripe, payment providers), third-party integrations, and any endpoint consumed by external services. Use `next dev --turbo` for **5x faster** development builds with Turbopack; production builds still use Webpack.

## Styling: Tailwind v4 with shadcn/ui

**Install Tailwind CSS v4.0.0**, released January 22, 2025. The Oxide engine (rewritten in Rust) delivers **full builds 5x faster and incremental builds 100x faster** than v3. Configuration moves from JavaScript to CSS:

```css
/* globals.css */
@import "tailwindcss";
@plugin "@tailwindcss/typography";
@plugin "@tailwindcss/forms" { strategy: "class"; }
@plugin "tailwindcss-animate";
```

**Use shadcn/ui** for components—it dominates with **105,000+ GitHub stars** and weekly adoption across Vercel templates. Run `npx shadcn@latest init` and select the Tailwind v4 configuration. shadcn wraps Radix UI primitives with pre-styled, copy-paste components you own completely. Pair with **Lucide React** (1,500+ icons, shadcn's default) and install supporting utilities: `class-variance-authority`, `clsx`, and `tailwind-merge`.

## Forms and validation: React Hook Form + Zod

**React Hook Form v7.60+** remains the standard with **7+ million weekly npm downloads**—shadcn's Form component is built directly on it. Combine with **Zod v3.25** for schema validation (the TypeScript ecosystem standard, recommended in Next.js Server Actions documentation):

```bash
pnpm add react-hook-form@7.60.0 @hookform/resolvers@5.1.1 zod@3.25.76
```

The pattern for Server Actions with validation:

```typescript
// actions/create-contact.ts
'use server'
import { contactSchema } from '@/lib/schemas'
import { revalidatePath } from 'next/cache'

export async function createContact(formData: FormData) {
  const result = contactSchema.safeParse(Object.fromEntries(formData))
  if (!result.success) return { errors: result.error.flatten().fieldErrors }
  
  await db.insert(contacts).values(result.data)
  revalidatePath('/contacts')
  return { success: true }
}
```

## State management: Zustand + TanStack Query

**Zustand v5.0.3** handles client state with a **~3KB bundle** and zero boilerplate—no Provider wrappers required. For server state (data fetching, caching, mutations), **TanStack Query v5.66+** provides industry-standard DevTools, optimistic updates, and cache invalidation. The modern pattern combines both with Server Components:

- **Server Components** fetch initial data (no loading spinners)
- **TanStack Query** handles client-side refetching, mutations, polling
- **Server Actions** process form submissions
- **Zustand** manages UI state (modals, selections, filters)

```bash
pnpm add zustand@5.0.3 @tanstack/react-query@5.66.0
```

## Database layer: Drizzle ORM with Supabase

**Use Drizzle ORM** instead of Prisma. For Supabase + Vercel deployments, Drizzle's advantages are decisive: **~7.4KB bundle** (vs Prisma's 80MB+ runtime), negligible serverless cold starts, and **14x lower latency** on complex joins. The SQL-first approach gives you full control while maintaining complete type safety:

```typescript
// lib/db.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const client = postgres(process.env.DATABASE_URL!, { prepare: false })
export const db = drizzle({ client })
```

**Supabase client packages**: Install `@supabase/supabase-js@2.90.1` and `@supabase/ssr@0.8.0`. The SSR package replaces all deprecated auth-helper packages and handles cookie-based sessions for App Router. Always use `supabase.auth.getClaims()` in server code—it validates JWT signatures, unlike `getSession()` which doesn't revalidate.

## File storage: Supabase Storage

**Use Supabase Storage** for PDF and Excel files. At **$0.021/GB/month** with egress included in your plan, it integrates natively with Row Level Security policies. The TUS protocol supports resumable uploads up to 500GB, and the built-in CDN (285 cities) handles delivery. Pattern for document uploads:

```typescript
const { data, error } = await supabase.storage
  .from('documents')
  .upload(`${userId}/${filename}`, file, {
    upsert: false,
    contentType: file.type
  })
```

Cloudflare R2 becomes attractive only if egress exceeds 250GB/month—its free egress saves significant costs for public media.

## Developer tooling: TypeScript strict mode + Biome + Vitest

**TypeScript configuration** starts with Next.js defaults (`strict: true`) plus these additions for SaaS reliability:

```json
{
  "noUncheckedIndexedAccess": true,
  "noPropertyAccessFromIndexSignature": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitReturns": true
}
```

**For linting and formatting, use Biome** on new projects—it's **10-25x faster** than ESLint + Prettier combined, requires a single config file, and reached ~85% typescript-eslint rule coverage with v2.0. Run `pnpm add -D @biomejs/biome && npx @biomejs/biome init`. For existing projects with complex ESLint configs, ESLint 9's flat config (`eslint.config.js`) is the path forward—legacy `.eslintrc` is removed in ESLint 10 (January 2026).

**Vitest** handles unit testing (**10x faster** than Jest in watch mode with native ESM support). **Playwright** covers E2E testing with cross-browser support including Safari/WebKit and native parallelization—capabilities Cypress charges for.

```bash
pnpm add -D @biomejs/biome vitest @vitest/ui @testing-library/react @playwright/test
```

## Package manager: pnpm

**Use pnpm**—the professional standard for production Next.js projects. It enforces strict dependency resolution (preventing phantom dependencies), saves **70%+ disk space** via content-addressable storage, and provides excellent monorepo support. While Bun installs faster (8.6s vs 31.9s for a Next.js app), pnpm's maturity and ecosystem compatibility make it the safer choice for business applications.

```bash
npm install -g pnpm
pnpm create next-app@latest
```

## Supporting services and utilities

| Category | Choice | Version | Install |
|----------|--------|---------|---------|
| Email | Resend | Latest | `pnpm add resend` |
| PDF generation | @react-pdf/renderer | v4.1.0+ | `pnpm add @react-pdf/renderer` |
| Excel handling | xlsx (SheetJS) | v0.18.5 | `pnpm add xlsx` |
| Date handling | date-fns | v4.x | `pnpm add date-fns` |
| Env validation | @t3-oss/env-nextjs | v0.13.x | `pnpm add @t3-oss/env-nextjs` |
| Icons | Lucide React | Latest | `pnpm add lucide-react` |

**Resend** provides React Email integration for building transactional emails with JSX—created by former Vercel engineers and used for Next.js Conf communications. **@react-pdf/renderer** generates invoices and reports using familiar React components. **xlsx (SheetJS)** leads with 4.2M weekly downloads and 3x faster parsing than exceljs. **date-fns** remains the recommendation until Temporal API achieves full browser support (Chrome shipped January 2026, but Safari lags).

## Monorepo: Turborepo when needed

If your internal SaaS grows to shared packages (UI library, API clients, shared types), **use Turborepo** with pnpm workspaces. Vercel-native integration, minimal configuration (**20 lines vs hours of Nx setup**), and remote caching make it the right choice for Next.js projects. For most single-app SaaS projects under 100 users, a monorepo adds unnecessary complexity—start without one.

## AI-assisted development configuration

For Claude Code, Cursor, and Copilot optimization, create a `CLAUDE.md` file in your project root documenting architecture, conventions, and common commands. Use **all three tools complementarily**: Copilot for inline autocomplete, Cursor for multi-file refactoring, Claude Code for architecture decisions and complex debugging. TypeScript's strict configuration with good JSDoc comments significantly improves AI code suggestions.

## Complete dependency installation

```bash
# Core framework
pnpm add next@15.5.11 react@19.2.0 react-dom@19.2.0

# Styling
pnpm add tailwindcss@4.0.0 @tailwindcss/typography @tailwindcss/forms tailwindcss-animate
pnpm add lucide-react class-variance-authority clsx tailwind-merge

# Data & State
pnpm add @supabase/supabase-js@2.90.1 @supabase/ssr@0.8.0
pnpm add drizzle-orm postgres
pnpm add zustand@5.0.3 @tanstack/react-query@5.66.0

# Forms & Validation
pnpm add react-hook-form@7.60.0 @hookform/resolvers@5.1.1 zod@3.25.76

# Utilities
pnpm add resend @react-pdf/renderer xlsx date-fns @t3-oss/env-nextjs

# Dev dependencies
pnpm add -D typescript@5.7.0 @types/react @types/node
pnpm add -D @biomejs/biome vitest @vitest/ui @testing-library/react @playwright/test
pnpm add -D drizzle-kit
```

## Conclusion

This stack optimizes for **type safety, serverless performance, and AI-assisted development velocity**. The combination of Drizzle over Prisma, Biome over ESLint+Prettier, and Vitest over Jest represents the 2025/2026 shift toward Rust-based tooling and zero-runtime approaches. Every choice prioritizes Vercel edge compatibility, sub-second cold starts, and excellent TypeScript inference—critical for internal SaaS applications where developer productivity directly impacts business value. Start with `pnpm create next-app@latest`, initialize shadcn/ui, connect Supabase, and ship.