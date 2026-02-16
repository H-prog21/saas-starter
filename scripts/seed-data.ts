/**
 * Database Seed Script
 *
 * This script populates the database with sample data for development.
 * Run with: pnpm db:seed
 */

import { db } from '../src/db'
import { users, contacts, organizations, deals } from '../src/db/schema'

async function seed() {
  console.log('🌱 Seeding database...')

  try {
    // Note: In development with Supabase, you'll need to create a user
    // through the Auth UI first, then use that ID here.
    //
    // For testing purposes, you can use a placeholder UUID.
    // Replace this with an actual user ID from Supabase Auth.

    const testUserId = '00000000-0000-0000-0000-000000000001'

    // Check if test user exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, testUserId),
    })

    if (!existingUser) {
      console.log('⚠️  Test user not found. Creating placeholder...')
      console.log('   Note: Create a real user via Supabase Auth for full functionality.')

      await db.insert(users).values({
        id: testUserId,
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'user',
      })
    }

    // Create sample organizations
    console.log('📦 Creating organizations...')
    const [acmeCorp, techInc, globalLtd] = await db
      .insert(organizations)
      .values([
        {
          userId: testUserId,
          name: 'Acme Corporation',
          website: 'https://acme.example.com',
          industry: 'Technology',
          employeeCount: 500,
          city: 'San Francisco',
          country: 'USA',
        },
        {
          userId: testUserId,
          name: 'Tech Innovations Inc',
          website: 'https://techinnovations.example.com',
          industry: 'Software',
          employeeCount: 150,
          city: 'New York',
          country: 'USA',
        },
        {
          userId: testUserId,
          name: 'Global Solutions Ltd',
          website: 'https://globalsolutions.example.com',
          industry: 'Consulting',
          employeeCount: 1000,
          city: 'London',
          country: 'UK',
        },
      ])
      .returning()

    console.log(`✅ Created ${3} organizations`)

    // Create sample contacts
    console.log('👥 Creating contacts...')
    const contactsData = [
      {
        userId: testUserId,
        organizationId: acmeCorp.id,
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@acme.example.com',
        phone: '+14155551234',
        title: 'CEO',
        type: 'customer' as const,
      },
      {
        userId: testUserId,
        organizationId: acmeCorp.id,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@acme.example.com',
        phone: '+14155551235',
        title: 'CTO',
        type: 'customer' as const,
      },
      {
        userId: testUserId,
        organizationId: techInc.id,
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@techinnovations.example.com',
        title: 'VP Engineering',
        type: 'lead' as const,
      },
      {
        userId: testUserId,
        organizationId: globalLtd.id,
        firstName: 'Alice',
        lastName: 'Williams',
        email: 'alice.williams@globalsolutions.example.com',
        title: 'Director of Sales',
        type: 'partner' as const,
      },
      {
        userId: testUserId,
        firstName: 'Charlie',
        lastName: 'Brown',
        email: 'charlie.brown@example.com',
        type: 'lead' as const,
        notes: 'Met at conference. Interested in our product.',
      },
    ]

    const createdContacts = await db.insert(contacts).values(contactsData).returning()
    console.log(`✅ Created ${createdContacts.length} contacts`)

    // Create sample deals
    console.log('💰 Creating deals...')
    const dealsData = [
      {
        userId: testUserId,
        organizationId: acmeCorp.id,
        contactId: createdContacts[0]!.id,
        title: 'Enterprise License - Acme Corp',
        value: 5000000, // $50,000 in cents
        stage: 'negotiation' as const,
        probability: 75,
        expectedCloseDate: '2024-03-31',
      },
      {
        userId: testUserId,
        organizationId: techInc.id,
        contactId: createdContacts[2]!.id,
        title: 'Tech Innovations Pilot',
        value: 1500000, // $15,000 in cents
        stage: 'proposal' as const,
        probability: 50,
        expectedCloseDate: '2024-04-15',
      },
      {
        userId: testUserId,
        organizationId: globalLtd.id,
        contactId: createdContacts[3]!.id,
        title: 'Global Solutions Partnership',
        value: 10000000, // $100,000 in cents
        stage: 'qualified' as const,
        probability: 25,
        expectedCloseDate: '2024-06-30',
      },
    ]

    const createdDeals = await db.insert(deals).values(dealsData).returning()
    console.log(`✅ Created ${createdDeals.length} deals`)

    console.log('')
    console.log('✅ Seeding complete!')
    console.log('')
    console.log('📊 Summary:')
    console.log(`   - Users: 1`)
    console.log(`   - Organizations: 3`)
    console.log(`   - Contacts: ${createdContacts.length}`)
    console.log(`   - Deals: ${createdDeals.length}`)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }

  process.exit(0)
}

seed()
