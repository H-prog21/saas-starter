#!/bin/bash

# Database Reset Script
# WARNING: This will delete all data in the database

set -e

echo "⚠️  WARNING: This will reset your database and delete all data!"
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "🗑️  Resetting database..."

# If using Supabase CLI locally
if command -v supabase &> /dev/null; then
    echo "Using Supabase CLI..."
    supabase db reset
else
    echo "Using Drizzle..."
    # Drop and recreate using Drizzle
    pnpm db:push --force
fi

echo ""
echo "🌱 Running seed..."
pnpm db:seed

echo ""
echo "✅ Database reset complete!"
