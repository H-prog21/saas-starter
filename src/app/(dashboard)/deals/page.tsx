import type { Metadata } from 'next'
import { Plus, CircleDollarSign } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'

export const metadata: Metadata = {
  title: 'Deals',
  description: 'Manage your sales pipeline',
}

export default async function DealsPage() {
  // Placeholder - fetch deals from database
  const deals: unknown[] = []

  return (
    <div>
      <PageHeader
        title="Deals"
        description="Track your sales pipeline and opportunities"
      >
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Deal
        </Button>
      </PageHeader>

      {deals.length === 0 ? (
        <EmptyState
          icon={CircleDollarSign}
          title="No deals yet"
          description="Start tracking your sales opportunities and pipeline."
          action={{
            label: 'Add Deal',
            onClick: () => {},
          }}
        />
      ) : (
        <div>
          {/* Deal pipeline/kanban board will go here */}
        </div>
      )}
    </div>
  )
}
