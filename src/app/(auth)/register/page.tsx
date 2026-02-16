import type { Metadata } from 'next'
import Link from 'next/link'

import { RegisterForm } from './register-form'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create a new account',
}

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Get started with your free account
        </p>
      </div>

      <RegisterForm />

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link href="/login" className="font-medium hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  )
}
