import type { ReactNode } from 'react'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'

export interface NavLink {
  href: string
  label: string
  icon: ReactNode
}

export const NAV_LINKS: NavLink[] = [
  {
    href: '/categories',
    label: 'Browse',
    icon: (
      <svg
        className={`${iconSlot.block} ${iconSlot.inline15}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
]
