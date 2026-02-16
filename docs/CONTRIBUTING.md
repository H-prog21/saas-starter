# Contributing Guidelines

This document covers development setup, code conventions, and contribution workflow.

## Getting Started

### Prerequisites

- **Node.js** 20.x or later
- **pnpm** 9.x (`npm install -g pnpm`)
- **Supabase CLI** (`brew install supabase/tap/supabase`)
- **Git** with GPG signing (recommended)

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd EST

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Start local Supabase
supabase start

# Update .env.local with local Supabase credentials
# (printed by supabase start)

# Push database schema
pnpm db:push

# Seed development data
pnpm db:seed

# Start development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Local Supabase URLs

After `supabase start`:
- **API URL**: http://127.0.0.1:54321
- **Studio**: http://127.0.0.1:54323
- **Inbucket (email)**: http://127.0.0.1:54324

## Development Workflow

### Branch Naming

```
feature/add-contact-import
fix/login-redirect-issue
docs/update-api-documentation
refactor/simplify-auth-flow
chore/update-dependencies
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add contact import functionality
fix: resolve login redirect loop
docs: update API documentation
refactor: simplify authentication flow
chore: update dependencies
test: add unit tests for contact schema
style: fix formatting in dashboard
perf: optimize contacts query
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with meaningful commits
3. Run all checks locally:
   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   pnpm build
   ```
4. Push and create a Pull Request
5. Fill out the PR template
6. Request review from maintainers
7. Address feedback
8. Squash and merge when approved

## Code Style

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | kebab-case | `contact-form.tsx` |
| Utilities | kebab-case | `format-date.ts` |
| Types | kebab-case | `database.ts` |
| Schemas | kebab-case | `contacts.ts` |
| Actions | kebab-case | `create.ts` |

### Component Structure

```typescript
// 1. Imports (external → internal → types)
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { Contact } from '@/types/database'

// 2. Types/Interfaces
interface ContactCardProps {
  contact: Contact
  onEdit?: () => void
}

// 3. Component
export function ContactCard({ contact, onEdit }: ContactCardProps) {
  // Hooks first
  const [isExpanded, setIsExpanded] = useState(false)

  // Event handlers
  const handleToggle = () => {
    setIsExpanded((prev) => !prev)
  }

  // Render
  return (
    <div className="rounded-lg border p-4">
      {/* JSX */}
    </div>
  )
}
```

### TypeScript Guidelines

```typescript
// ✅ Prefer type over interface for object shapes
type Contact = {
  id: string
  firstName: string
  lastName: string
}

// ✅ Use interface for extendable contracts
interface Repository<T> {
  findById(id: string): Promise<T | null>
  findAll(): Promise<T[]>
}

// ✅ Infer types from Zod schemas
import { z } from 'zod'
const contactSchema = z.object({ ... })
type ContactInput = z.infer<typeof contactSchema>

// ✅ Infer types from Drizzle
import type { InferSelectModel } from 'drizzle-orm'
type Contact = InferSelectModel<typeof contacts>

// ❌ Avoid any
const data: any = fetchData() // Bad

// ✅ Use unknown and narrow
const data: unknown = fetchData()
if (isContact(data)) {
  // data is typed as Contact
}
```

### Import Organization

```typescript
// 1. React/Next.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. External libraries
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

// 3. Internal absolute imports (@/)
import { Button } from '@/components/ui/button'
import { createServerClient } from '@/lib/supabase/server'
import { contactSchema } from '@/schemas/contacts'

// 4. Relative imports
import { ContactCard } from './contact-card'

// 5. Types (always last, use `import type`)
import type { Contact } from '@/types/database'
```

### Tailwind Class Organization

Use `cn()` for conditional classes. Order classes logically:

```tsx
<div
  className={cn(
    // Layout
    'flex items-center justify-between',
    // Sizing
    'w-full h-12',
    // Spacing
    'px-4 py-2 gap-4',
    // Typography
    'text-sm font-medium',
    // Colors
    'bg-background text-foreground',
    // Borders
    'rounded-lg border border-border',
    // Effects
    'shadow-sm',
    // States
    'hover:bg-accent focus:ring-2',
    // Transitions
    'transition-colors duration-200',
    // Conditional
    isActive && 'bg-primary text-primary-foreground'
  )}
>
```

## Testing Guidelines

### What to Test

| Priority | What | How |
|----------|------|-----|
| High | Zod schemas | Unit tests |
| High | Utility functions | Unit tests |
| High | Server Actions | Integration tests |
| Medium | Form components | Component tests |
| Medium | Critical user flows | E2E tests |
| Low | UI components (shadcn) | Skip (tested upstream) |

### Test File Location

```
# Option 1: Co-located (preferred for component tests)
src/components/forms/contact-form.tsx
src/components/forms/contact-form.test.tsx

# Option 2: Separate directory (preferred for unit tests)
tests/unit/schemas.test.ts
tests/unit/utils.test.ts
```

### Running Tests

```bash
# Unit tests
pnpm test                    # Run once
pnpm test -- --watch        # Watch mode
pnpm test:coverage          # With coverage

# E2E tests
pnpm test:e2e               # All browsers
pnpm test:e2e:ui            # Interactive mode
```

## Database Changes

### Adding a New Table

1. Create schema file:
   ```typescript
   // src/db/schema/new-table.ts
   import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

   export const newTable = pgTable('new_table', {
     id: uuid('id').primaryKey().defaultRandom(),
     // ... columns
     createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
     updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
   })
   ```

2. Export from index:
   ```typescript
   // src/db/schema/index.ts
   export * from './new-table'
   ```

3. Generate migration:
   ```bash
   pnpm db:generate
   ```

4. Review migration file in `drizzle/migrations/`

5. Apply migration:
   ```bash
   pnpm db:push  # Development
   # or
   pnpm db:migrate  # Production
   ```

### Adding RLS Policies

Create a migration with SQL:

```sql
-- drizzle/migrations/xxxx_add_new_table_rls.sql
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own records"
  ON new_table FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records"
  ON new_table FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- etc.
```

## Adding New Features

### Checklist

- [ ] Database schema (if needed)
- [ ] Zod validation schema
- [ ] Server Action(s)
- [ ] UI components
- [ ] Unit tests for schema
- [ ] Component tests for forms
- [ ] E2E test for happy path
- [ ] Documentation updated

### Example: Adding a "Tags" Feature

1. **Schema** (`src/db/schema/tags.ts`)
2. **Validation** (`src/schemas/tags.ts`)
3. **Actions** (`src/actions/tags/create.ts`, `update.ts`, `delete.ts`)
4. **Queries** (`src/db/queries/tags.ts`)
5. **Components** (`src/components/forms/tag-form.tsx`)
6. **Page** (`src/app/(dashboard)/tags/page.tsx`)
7. **Tests** (`tests/unit/schemas/tags.test.ts`)

## Code Review Checklist

### For Reviewers

- [ ] Code follows project conventions
- [ ] TypeScript types are correct
- [ ] Server Actions include auth checks
- [ ] Database queries are scoped to user
- [ ] Validation is server-side
- [ ] No security vulnerabilities
- [ ] Tests are included
- [ ] Documentation is updated

### For Authors

Before requesting review:

- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` succeeds
- [ ] PR description is complete
- [ ] Commits are meaningful

## IDE Setup

### VS Code Extensions

Recommended extensions (`.vscode/extensions.json`):

```json
{
  "recommendations": [
    "biomejs.biome",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "dbaeumer.vscode-eslint"
  ]
}
```

### VS Code Settings

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

## Getting Help

- **Questions**: Open a Discussion on GitHub
- **Bugs**: Open an Issue with reproduction steps
- **Security**: Email security@yourcompany.com (do not open public issue)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
