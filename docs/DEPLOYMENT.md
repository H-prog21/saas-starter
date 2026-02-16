# Deployment Guide

This document covers deploying the application to Vercel with Supabase as the backend.

## Overview

The recommended deployment stack:
- **Hosting**: Vercel (optimized for Next.js)
- **Database**: Supabase (managed PostgreSQL)
- **CDN**: Vercel Edge Network + Supabase Storage CDN
- **CI/CD**: GitHub Actions → Vercel

## Prerequisites

1. GitHub repository with the codebase
2. Vercel account (free tier available)
3. Supabase project (free tier available)

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down:
   - Project URL
   - Anon (public) key
   - Service role key (keep secret!)
   - Database connection string

### 2. Configure Database

```bash
# Run migrations against Supabase
DATABASE_URL="your-supabase-connection-string" pnpm db:push
```

### 3. Configure Authentication

In Supabase Dashboard → Authentication → Providers:

1. Enable Email provider
2. Configure site URL: `https://your-domain.vercel.app`
3. Add redirect URLs:
   - `https://your-domain.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)

### 4. Enable Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Example policies (customize for your needs)
CREATE POLICY "Users can view own data"
  ON contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
  ON contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
  ON contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data"
  ON contacts FOR DELETE
  USING (auth.uid() = user_id);
```

### 5. Configure Storage (if needed)

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Storage policies
CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Vercel Setup

### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the correct framework preset (Next.js)

### 2. Configure Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Email (Resend)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@your-domain.com

# Stripe (if using)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Important**: Set variables for all environments (Production, Preview, Development)

### 3. Configure Build Settings

In Project Settings → General:

- Framework Preset: Next.js
- Build Command: `pnpm build`
- Output Directory: `.next`
- Install Command: `pnpm install`

### 4. Domain Configuration

1. Go to Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Enable automatic HTTPS

## CI/CD with GitHub Actions

### Main CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm test:coverage

      - uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium

      - run: pnpm test:e2e --project=chromium
        env:
          CI: true

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm build

        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

### Preview Deployment

Vercel automatically creates preview deployments for pull requests. No additional configuration needed.

### Production Deployment

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment:
      name: production
      url: ${{ steps.deploy.outputs.url }}

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        id: deploy
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Database Migrations in Production

### Option 1: Manual Migration

```bash
# Set production DATABASE_URL
export DATABASE_URL="your-production-connection-string"

# Run migrations
pnpm db:migrate
```

### Option 2: CI/CD Migration

Add to your deployment workflow:

```yaml
- name: Run Migrations
  run: pnpm db:migrate
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Option 3: Supabase CLI

```bash
# Link to production project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Monitoring and Observability

### Vercel Analytics

Enable in Vercel Dashboard → Project → Analytics

### Error Tracking (Sentry)

```bash
pnpm add @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
})
```

### Supabase Monitoring

- Dashboard → Reports → Database health
- Dashboard → Logs → API, Auth, Database logs
- Enable log shipping to external services if needed

## Performance Optimization

### Vercel Edge Config

For feature flags and dynamic configuration:

```typescript
import { get } from '@vercel/edge-config'

export async function getFeatureFlag(key: string) {
  return await get(key)
}
```

### Image Optimization

Next.js Image component is automatically optimized on Vercel.

### Caching Headers

```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 's-maxage=60, stale-while-revalidate=300' },
        ],
      },
    ]
  },
}
```

## Production Checklist

### Before Launch

- [ ] All environment variables set in Vercel
- [ ] Database migrations applied
- [ ] RLS policies enabled and tested
- [ ] Custom domain configured with SSL
- [ ] Email provider verified (Resend)
- [ ] Stripe webhooks configured (if using)
- [ ] Error tracking enabled (Sentry)
- [ ] Analytics enabled

### Security

- [ ] Service role key only on server
- [ ] CORS configured correctly
- [ ] Rate limiting enabled (Vercel/Supabase)
- [ ] Security headers configured
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (Drizzle handles this)

### Performance

- [ ] Images optimized
- [ ] Bundle size analyzed
- [ ] Core Web Vitals passing
- [ ] Database indexes created
- [ ] Caching configured

### Monitoring

- [ ] Uptime monitoring configured
- [ ] Error alerts configured
- [ ] Database alerts configured
- [ ] Log retention configured

## Rollback Procedure

### Vercel Rollback

1. Go to Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"

### Database Rollback

```bash
# Generate rollback migration
pnpm drizzle-kit generate --name rollback_feature_x

# Or restore from Supabase backup
# Dashboard → Database → Backups → Restore
```

## Scaling Considerations

### Supabase

- **Database**: Scale compute in Dashboard → Database → Settings
- **Storage**: Automatic scaling
- **Auth**: Rate limits configurable

### Vercel

- **Serverless**: Automatic scaling
- **Edge**: Automatic global distribution
- **Bandwidth**: Monitor usage, upgrade plan if needed

## Cost Optimization

### Supabase Free Tier Limits

- 500MB database
- 1GB file storage
- 2GB bandwidth
- 50,000 monthly active users

### Vercel Free Tier Limits

- 100GB bandwidth
- Serverless function execution time
- 6,000 minutes build time

### Tips

1. Use ISR/SSG where possible
2. Optimize images
3. Cache aggressively
4. Monitor database queries
5. Use connection pooling
