import type { Metadata } from 'next'
import { Plus, Building2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'

export const metadata: Metadata = {
  title: 'Organizations',
  description: 'Manage your organizations',
}

export default async function OrganizationsPage() {
  // Placeholder - fetch organizations from database
  const organizations: unknown[] = []

  return (
    <div>
      <PageHeader
        title="Organizations"
        description="Manage companies and accounts"
      >
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Organization
        </Button>
      </PageHeader>

      {organizations.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations yet"
          description="Add your first organization to start tracking companies."
          action={{
            label: 'Add Organization',
            onClick: () => {},
          }}
        />
      ) : (
        <div>
          {/* Organization list will go here */}
        </div>
      )}
    </div>
  )
}
