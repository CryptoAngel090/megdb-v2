/**
 * Create a new App Router page with mandatory SEO scaffold.
 *
 * Usage:
 *   node ./scripts/create-seo-page.mjs --path "/my-page" --title "My Page" --description "..."
 *
 * Optional:
 *   --noindex true|false   (default false)
 *   --revalidate <seconds> (default 86400)
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

function getFlag(name) {
  const args = process.argv.slice(2)
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

function parsePath(raw) {
  if (!raw) throw new Error('Missing --path')
  const p = raw.trim()
  if (!p.startsWith('/')) throw new Error('--path must start with "/"')
  if (p === '/') throw new Error('Use root page manually; generator is for non-root pages.')
  if (p.includes('..')) throw new Error('Invalid path')
  return p.replace(/\/+$/, '')
}

function toComponentName(pathname) {
  const parts = pathname
    .split('/')
    .filter(Boolean)
    .map((s) => s.replace(/[^a-zA-Z0-9]/g, ' '))
    .join(' ')
  const words = parts
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
  return `${words.join('')}Page`
}

function esc(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function main() {
  const pathname = parsePath(getFlag('--path'))
  const title = (getFlag('--title') || '').trim()
  const description = (getFlag('--description') || '').trim()
  const noindexRaw = (getFlag('--noindex') || 'false').toLowerCase()
  const noindex = noindexRaw === 'true' || noindexRaw === '1' || noindexRaw === 'yes'
  const revalidateRaw = getFlag('--revalidate') || '86400'
  const revalidate = Number.parseInt(revalidateRaw, 10)

  if (!title) throw new Error('Missing --title')
  if (!description) throw new Error('Missing --description')
  if (!Number.isFinite(revalidate) || revalidate < 0) {
    throw new Error('--revalidate must be a non-negative integer')
  }

  const appDir = join(process.cwd(), 'src', 'app')
  const relDir = pathname.slice(1)
  const pageDir = join(appDir, relDir)
  const pageFile = join(pageDir, 'page.tsx')

  if (existsSync(pageFile)) {
    throw new Error(`Page already exists: ${pageFile}`)
  }

  mkdirSync(pageDir, { recursive: true })

  const componentName = toComponentName(pathname)
  const pageCode = `import type { Metadata } from 'next'
import { WebPageJsonLd } from '@/components/WebPageJsonLd/WebPageJsonLd'
import { discoverSocialMeta } from '@/lib/seoSocial'

export const revalidate = ${revalidate}

const title = '${esc(title)}'
const description = '${esc(description)}'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '${pathname}' },
  ${noindex ? 'robots: { index: false, follow: true },' : ''}
  ...discoverSocialMeta(title, description, '${pathname}'),
}

export default function ${componentName}() {
  return (
    <>
      <WebPageJsonLd pathname="${pathname}" title={title} description={description} />
      <main>
        <h1>{title}</h1>
      </main>
    </>
  )
}
`

  writeFileSync(pageFile, pageCode, 'utf8')
  console.log(`Created SEO-ready page: ${pageFile}`)
}

try {
  main()
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e))
  process.exit(1)
}
