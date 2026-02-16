import type { Metadata } from 'next'
import { Users, Building2, CircleDollarSign, TrendingUp } from 'lucide-react'

import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Overview of your CRM data',
}

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // In a real app, fetch actual stats from the database
  const stats = [
    {
      title: 'Total Contacts',
      value: '0',
      icon: Users,
      description: 'Active contacts',
    },
    {
      title: 'Organizations',
      value: '0',
      icon: Building2,
      description: 'Companies tracked',
    },
    {
      title: 'Open Deals',
      value: '0',
      icon: CircleDollarSign,
      description: 'In pipeline',
    },
    {
      title: 'Revenue',
      value: '$0',
      icon: TrendingUp,
      description: 'This month',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome back${user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}`}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No recent activity to show.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No upcoming tasks.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
