import {
  BarChart3,
  Building2,
  CircleDollarSign,
  Home,
  Settings,
  Users,
} from 'lucide-react'

export const mainNavigation = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Contacts',
    href: '/contacts',
    icon: Users,
  },
  {
    title: 'Organizations',
    href: '/organizations',
    icon: Building2,
  },
  {
    title: 'Deals',
    href: '/deals',
    icon: CircleDollarSign,
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
] as const

export const secondaryNavigation = [
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
] as const

export type NavigationItem = (typeof mainNavigation)[number]
