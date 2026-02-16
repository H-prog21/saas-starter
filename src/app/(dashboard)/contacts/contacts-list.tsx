'use client'

import { formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Contact } from '@/types/database'

interface ContactsListProps {
  contacts: Contact[]
}

export function ContactsList({ contacts }: ContactsListProps) {
  return (
    <div className="rounded-lg border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Phone</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id} className="border-b last:border-0">
              <td className="px-4 py-3 text-sm font-medium">
                {contact.firstName} {contact.lastName}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {contact.email}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {contact.phone || '-'}
              </td>
              <td className="px-4 py-3 text-sm">
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs">
                  {contact.type || 'lead'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {formatDate(contact.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
