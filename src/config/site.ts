export const siteConfig = {
  name: 'EST',
  description: 'Enterprise SaaS Template - A modern, production-ready SaaS application',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  ogImage: '/og.png',
  links: {
    github: 'https://github.com/your-username/est',
    docs: '/docs',
  },
  creator: 'Your Company',
  keywords: ['SaaS', 'Next.js', 'React', 'Supabase', 'TypeScript'],
} as const

export type SiteConfig = typeof siteConfig
