import type { Metadata } from 'next'
import { Plus, Users } from 'lucide-react'

import { createServerClient } from '@/lib/supabase/server'
import { getContactsByUser } from '@/db/queries/contacts'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { ContactsList } from './contacts-list'

export const metadata: Metadata = {
  title: 'Contacts',
  description: 'Manage your contacts',
}

export default async function ContactsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const contacts = await getContactsByUser(user.id)

  return (
    <div>
      <PageHeader title="Contacts" description="Manage your contacts and leads">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </PageHeader>

      {contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Get started by adding your first contact to the CRM."
          action={{
            label: 'Add Contact',
            onClick: () => {},
          }}
        />
      ) : (
        <ContactsList contacts={contacts} />
      )}
    </div>
  )
}
