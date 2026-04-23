import type { Metadata } from 'next'
import { RegisterForm } from '@/components/RegisterForm/RegisterForm'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Sign Up — MegDB',
  description: 'Create your MegDB account to track movies, rate films, and build your watchlist.',
}

export default function RegisterPage() {
  return (
    <div className={styles.page}>
      <RegisterForm />
    </div>
  )
}
