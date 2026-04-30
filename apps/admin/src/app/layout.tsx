import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import '@repo/ui/tokens/tokens.css'
import '@repo/ui/tokens/globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.variable}>
        {children}
      </body>
    </html>
  )
}
