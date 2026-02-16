#!/bin/bash

# EST Project Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up EST development environment..."

# Check for required tools
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is required but not installed."
        exit 1
    fi
    echo "✅ $1 is installed"
}

echo ""
echo "📋 Checking required tools..."
check_command node
check_command pnpm
check_command git

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20 or higher is required (found v$NODE_VERSION)"
    exit 1
fi
echo "✅ Node.js version is compatible"

echo ""
echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "📄 Setting up environment variables..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "✅ Created .env.local from .env.example"
    echo "⚠️  Please update .env.local with your actual values"
else
    echo "⚠️  .env.local already exists, skipping"
fi

echo ""
echo "🔧 Setting up Git hooks..."
pnpm prepare

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Update .env.local with your Supabase credentials"
echo "   2. Run 'supabase start' for local development (optional)"
echo "   3. Run 'pnpm db:push' to push the database schema"
echo "   4. Run 'pnpm dev' to start the development server"
echo ""
