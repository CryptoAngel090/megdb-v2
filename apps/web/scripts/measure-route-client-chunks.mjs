import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import vm from 'node:vm'

function parseArgs() {
  const routeArg = process.argv.find((arg) => arg.startsWith('--route='))
  const outArg = process.argv.find((arg) => arg.startsWith('--out='))
  const route = routeArg ? routeArg.slice('--route='.length) : '/(detail)/movie/[id]/page'
  const out = outArg ? outArg.slice('--out='.length) : '.seo/route-chunks'
  return { route, out }
}

function loadRscManifest(route) {
  const serverRoutePath = route.startsWith('/') ? route.slice(1) : route
  const appServerRoot = resolve('.next', 'server', 'app')
  const candidates = []

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(abs)
      } else if (
        entry.name.endsWith('client-reference-manifest.js') &&
        abs.replace(/\\/g, '/').includes(serverRoutePath)
      ) {
        candidates.push(abs)
      }
    }
  }
  walk(appServerRoot)

  for (const manifestPath of candidates) {
    const code = readFileSync(manifestPath, 'utf8')
    const ctx = { globalThis: {} }
    vm.createContext(ctx)
    vm.runInContext(code, ctx)
    const routeManifest = ctx.globalThis.__RSC_MANIFEST?.[route]
    if (routeManifest) {
      return routeManifest
    }
  }

  throw new Error(`Missing client reference manifest for "${route}" in .next/server/app`)
}

function chunkSize(chunkPath) {
  const rel = chunkPath.replace('/_next/static/', '').replace(/^\/+/, '')
  const fullPath = resolve('.next', 'static', rel)
  try {
    return statSync(fullPath).size
  } catch {
    return 0
  }
}

function buildReport(routeManifest, route) {
  const chunkToFirstPartyModules = new Map()
  const allChunks = new Set()
  const clientModules = routeManifest.clientModules ?? {}

  for (const [moduleName, mod] of Object.entries(clientModules)) {
    const moduleChunks = mod?.chunks ?? []
    for (const chunk of moduleChunks) {
      allChunks.add(chunk)
      if (!moduleName.includes('/src/') && !moduleName.includes('/packages/ui/')) continue
      if (!chunkToFirstPartyModules.has(chunk)) {
        chunkToFirstPartyModules.set(chunk, new Set())
      }
      chunkToFirstPartyModules.get(chunk).add(moduleName)
    }
  }

  const chunkRows = Array.from(allChunks)
    .map((chunk) => ({
      chunk,
      bytes: chunkSize(chunk),
      firstPartyModules: Array.from(chunkToFirstPartyModules.get(chunk) ?? []),
    }))
    .sort((a, b) => b.bytes - a.bytes)

  const totalBytes = chunkRows.reduce((sum, row) => sum + row.bytes, 0)
  const sharedBytes = chunkRows
    .filter((row) => row.firstPartyModules.length === 0)
    .reduce((sum, row) => sum + row.bytes, 0)
  const firstPartyBytes = totalBytes - sharedBytes
  return {
    route,
    generatedAt: new Date().toISOString(),
    chunkCount: chunkRows.length,
    totalBytes,
    sharedBytes,
    firstPartyBytes,
    chunks: chunkRows,
  }
}

function main() {
  const { route, out } = parseArgs()
  const routeManifest = loadRscManifest(route)
  const report = buildReport(routeManifest, route)

  const outDir = resolve(out)
  mkdirSync(outDir, { recursive: true })
  const slug = route.replace(/[^\w[\]-]+/g, '_')
  const outPath = join(outDir, `${slug}.json`)
  writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8')

  console.log(`[route-chunks] route=${report.route}`)
  console.log(`[route-chunks] chunkCount=${report.chunkCount}`)
  console.log(`[route-chunks] totalBytes=${report.totalBytes}`)
  console.log(`[route-chunks] sharedBytes=${report.sharedBytes}`)
  console.log(`[route-chunks] firstPartyBytes=${report.firstPartyBytes}`)
  console.log(`[route-chunks] report=${outPath}`)
  for (const row of report.chunks.slice(0, 12)) {
    const marker = row.firstPartyModules.length ? 'first-party' : 'shared/runtime'
    console.log(`${String(row.bytes).padStart(8)}  ${row.chunk}  (${marker})`)
  }
}

main()
