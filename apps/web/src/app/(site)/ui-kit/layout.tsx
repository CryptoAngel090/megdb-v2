/**
 * /ui-kit layout — injects JetBrains Mono so the design-system showcase
 * can render the mono font token correctly.
 *
 * This keeps the heavy monospace font off the critical path for all other
 * routes (saves ~15–30 KB of font download on every non-ui-kit page).
 */
import { JetBrains_Mono } from 'next/font/google'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export default function UiKitLayout({ children }: { children: React.ReactNode }) {
  return <div className={jetbrainsMono.variable}>{children}</div>
}
