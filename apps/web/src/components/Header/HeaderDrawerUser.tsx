'use client'

import Link from 'next/link'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import styles from './Header.module.css'

interface HeaderDrawerUserProps {
  isLoggedIn: boolean
  loggedInUser: { name: string; username: string } | null
  onCloseMenu: () => void
}

export function HeaderDrawerUser({ isLoggedIn, loggedInUser, onCloseMenu }: HeaderDrawerUserProps) {
  return (
    <div className={styles.drawerUser}>
      {isLoggedIn ? (
        <div className={styles.drawerUserRow}>
          <img
            src="https://i.pravatar.cc/80"
            alt="User profile avatar"
            className={styles.drawerAvatar}
          />
          <div>
            <div className={styles.drawerUserName}>
              {loggedInUser?.name ?? loggedInUser?.username ?? 'User'}
            </div>
            <div className={styles.drawerUserSub}>@{loggedInUser?.username}</div>
          </div>
        </div>
      ) : (
        <div className={styles.drawerAuthButtons}>
          <Link href="/register" className={styles.drawerRegisterBtn} onClick={onCloseMenu}>
            <svg
              className={`${iconSlot.block} ${iconSlot.inline18}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            Sign Up
          </Link>
          <Link href="/login" className={styles.drawerSignIn} onClick={onCloseMenu}>
            <svg
              className={`${iconSlot.block} ${iconSlot.inline18}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            Sign In
          </Link>
        </div>
      )}
    </div>
  )
}
