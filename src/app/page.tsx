import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { siteConfig } from '@/config/site'

const features = [
  'Built with Next.js 15.5 and React 19',
  'Supabase for authentication and database',
  'Drizzle ORM for type-safe queries',
  'Tailwind CSS v4 with shadcn/ui',
  'Server Actions for mutations',
  'Full TypeScript support',
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <span className="text-xl font-bold">{siteConfig.name}</span>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container py-24 text-center md:py-32">
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
            Modern SaaS Template
            <br />
            <span className="text-muted-foreground">Built for Developers</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            {siteConfig.description}. Start building your next project with the
            2025/2026 optimal stack.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/register">
                Start Building
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={siteConfig.links.github} target="_blank">
                View on GitHub
              </Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/50 py-24">
          <div className="container">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Everything you need to build fast
            </h2>
            <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 rounded-lg border bg-background p-4"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>
            Built with the{' '}
            <Link
              href="/docs/GUIDELINES.md"
              className="underline underline-offset-4 hover:text-foreground"
            >
              2025/2026 optimal stack
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
