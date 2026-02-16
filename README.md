# Enterprise SaaS Template

A modern, production-ready SaaS application template built with the **2025/2026 optimal stack**: Next.js 15.5, React 19, Tailwind v4, shadcn/ui, Drizzle ORM, and Supabase.

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js | 15.5.x |
| UI Library | React | 19.2.x |
| Styling | Tailwind CSS | 4.0.x |
| Components | shadcn/ui | Latest |
| Database | Supabase (PostgreSQL) | - |
| ORM | Drizzle | 0.38.x |
| State (Client) | Zustand | 5.0.x |
| State (Server) | TanStack Query | 5.66.x |
| Forms | React Hook Form + Zod | 7.60.x |
| Linting | Biome | 1.9.x |
| Testing | Vitest + Playwright | Latest |
| Package Manager | pnpm | 9.x |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase account (or local Supabase CLI)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd EST

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Start local Supabase (optional)
supabase start

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## Available Scripts

```bash
# Development
pnpm dev              # Start dev server with Turbopack
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run Biome linter
pnpm lint:fix         # Fix linting issues
pnpm format           # Format code with Biome
pnpm type-check       # Run TypeScript compiler

# Testing
pnpm test             # Run unit tests
pnpm test:ui          # Run tests with UI
pnpm test:coverage    # Run tests with coverage
pnpm test:e2e         # Run E2E tests
pnpm test:e2e:ui      # Run E2E tests with UI

# Database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio
pnpm db:seed          # Seed database
```

## Project Structure

```
src/
├── app/              # Next.js App Router
│   ├── (auth)/       # Authentication routes
│   ├── (dashboard)/  # Protected dashboard routes
│   └── api/          # Route Handlers (webhooks only)
├── actions/          # Server Actions
├── components/       # React components
│   ├── ui/           # shadcn/ui components
│   ├── forms/        # Form components
│   └── layouts/      # Layout components
├── config/           # Application configuration
├── db/               # Database layer (Drizzle)
│   ├── schema/       # Table schemas
│   └── queries/      # Query functions
├── hooks/            # Custom React hooks
├── lib/              # Utility libraries
├── providers/        # React context providers
├── schemas/          # Zod validation schemas
├── services/         # Business logic services
├── stores/           # Zustand stores
├── styles/           # Global styles
└── types/            # TypeScript types
```

## Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Database Guide](./docs/DATABASE.md)
- [API Patterns](./docs/API.md)
- [Frontend Guide](./docs/FRONTEND.md)
- [Testing Strategy](./docs/TESTING.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Security Best Practices](./docs/SECURITY.md)
- [Contributing Guidelines](./docs/CONTRIBUTING.md)

## Key Conventions

### Server Actions vs Route Handlers

- **Server Actions**: All UI mutations (forms, CRUD operations)
- **Route Handlers**: Webhooks and external API integrations only

### State Management

- **Zustand**: Client-side UI state (modals, filters, selections)
- **TanStack Query**: Server state (data fetching, caching, mutations)
- **Server Components**: Initial data fetching

### Data Flow

1. Server Components fetch initial data
2. TanStack Query handles client-side refetching
3. Server Actions process mutations
4. `revalidatePath` / `revalidateTag` for cache invalidation

## Environment Variables

See [.env.example](./.env.example) for required environment variables.

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL)

See [Deployment Guide](./docs/DEPLOYMENT.md) for detailed instructions.

## License

MIT
