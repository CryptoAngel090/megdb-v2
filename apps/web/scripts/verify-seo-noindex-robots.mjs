import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { extractRobotsDisallowLiterals, parseRobotsSource } from './robots-disallow-utils.mjs'

const ROOT = process.cwd()
const APP = join(ROOT, 'src', 'app')
const POLICY = JSON.parse(readFileSync(join(ROOT, 'scripts', 'seo-route-policy.json'), 'utf8'))

const ROBOTS_FILE = join(APP, 'robots.ts')
const robotsSrc = readFileSync(ROBOTS_FILE, 'utf8')
const robotsAst = parseRobotsSource(ROBOTS_FILE, robotsSrc)
const disallowSet = extractRobotsDisallowLiterals(robotsAst)
const missingDisallow = POLICY.robotsDisallow.filter((route) => !disallowSet.has(route))

const NOINDEX_ROUTES = POLICY.noindexRoutes.map((routePath) => {
  const pathParts = routePath.split('/').filter(Boolean)
  const canonicalHint = routePath.includes('[id]')
    ? routePath.replace(/\[.+?\]/g, '').replace(/\/$/, '/')
    : routePath
  return {
    pathParts,
    defaultFile: join(APP, ...pathParts, 'page.tsx'),
    canonicalHint,
    isDynamic: routePath.includes('[id]'),
  }
})

function resolveRouteFile(pathParts) {
  const defaultFile = join(APP, ...pathParts, 'page.tsx')
  if (existsSync(defaultFile)) return defaultFile

  // Support App Router route groups: app/(group)/.../page.tsx
  const appEntries = readdirSync(APP, { withFileTypes: true }).filter((entry) =>
    entry.isDirectory()
  )
  for (const entry of appEntries) {
    if (!entry.name.startsWith('(') || !entry.name.endsWith(')')) continue
    const groupedFile = join(APP, entry.name, ...pathParts, 'page.tsx')
    if (existsSync(groupedFile)) return groupedFile
  }

  return null
}

function parseTs(path, source) {
  const kind = path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  return ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, kind)
}

function walk(node, visit) {
  visit(node)
  node.forEachChild((child) => walk(child, visit))
}

function propName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text
  return ''
}

function isIdentifierNamed(node, name) {
  return ts.isIdentifier(node) && node.text === name
}

function isNoindexRobotsObject(node) {
  const target =
    ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) ? node.expression : node
  if (!ts.isObjectLiteralExpression(target)) return false
  const indexProp = target.properties.find(
    (p) =>
      ts.isPropertyAssignment(p) &&
      isIdentifierNamed(p.name, 'index') &&
      p.initializer.kind === ts.SyntaxKind.FalseKeyword
  )
  const followProp = target.properties.find(
    (p) =>
      ts.isPropertyAssignment(p) &&
      isIdentifierNamed(p.name, 'follow') &&
      p.initializer.kind === ts.SyntaxKind.TrueKeyword
  )
  return Boolean(indexProp && followProp)
}

function hasNoindexRobotsContract(ast) {
  let hasRobotsConst = false
  let hasInlineRobots = false
  walk(ast, (node) => {
    if (ts.isVariableDeclaration(node) && isIdentifierNamed(node.name, 'robots')) {
      if (node.initializer && isNoindexRobotsObject(node.initializer)) hasRobotsConst = true
    }
    if (!ts.isPropertyAssignment(node) || !isIdentifierNamed(node.name, 'robots')) return
    if (isNoindexRobotsObject(node.initializer)) hasInlineRobots = true
  })
  return hasRobotsConst || hasInlineRobots
}

function getAlternatesCanonicalInitializers(sourceFile) {
  const out = []
  walk(sourceFile, (node) => {
    if (!ts.isPropertyAssignment(node) || propName(node.name) !== 'alternates') return
    if (!ts.isObjectLiteralExpression(node.initializer)) return
    for (const p of node.initializer.properties) {
      if (ts.isPropertyAssignment(p) && propName(p.name) === 'canonical') {
        out.push(p.initializer)
      }
    }
  })
  return out
}

function canonicalExprMatchesHint(sourceFile, expr, hint, isDynamic) {
  const text = expr.getText(sourceFile)
  if (text.includes(hint)) return true
  if (ts.isStringLiteral(expr)) {
    if (expr.text === hint) return true
    if (hint === '/search' && expr.text.startsWith('/search')) return true
    return false
  }
  if (isDynamic && hint.endsWith('/') && text.includes(hint)) return true
  if (ts.isIdentifier(expr)) {
    const fn = findEnclosingFunctionLike(expr)
    if (fn) {
      const fnText = fn.getText(sourceFile)
      if (fnText.includes(hint)) return true
      if (hint === '/search' && (fnText.includes("'/search'") || fnText.includes('`/search')))
        return true
    }
    const fileText = sourceFile.getText()
    if (fileText.includes(`'${hint}'`) || fileText.includes(`"${hint}"`)) return true
    if (hint === '/search' && (fileText.includes("'/search?") || fileText.includes('`/search?')))
      return true
    if (isDynamic && hint.endsWith('/') && fileText.includes(hint)) return true
  }
  return false
}

function findEnclosingFunctionLike(node) {
  let current = node.parent
  while (current) {
    if (
      ts.isFunctionDeclaration(current) ||
      ts.isFunctionExpression(current) ||
      ts.isArrowFunction(current)
    ) {
      return current
    }
    current = current.parent
  }
  return null
}

function hasDiscoverPageAlternatesForHint(sourceFile, hint, isDynamic) {
  let ok = false
  walk(sourceFile, (node) => {
    if (!ts.isPropertyAssignment(node) || propName(node.name) !== 'alternates') return
    if (!ts.isCallExpression(node.initializer)) return
    if (!ts.isIdentifier(node.initializer.expression)) return
    if (node.initializer.expression.text !== 'discoverPageAlternates') return
    const arg = node.initializer.arguments[0]
    if (!arg) return
    if (canonicalExprMatchesHint(sourceFile, arg, hint, isDynamic)) ok = true
  })
  return ok
}

function hasCanonicalContractForHint(sourceFile, hint, isDynamic) {
  const inits = getAlternatesCanonicalInitializers(sourceFile)
  if (inits.some((expr) => canonicalExprMatchesHint(sourceFile, expr, hint, isDynamic))) return true
  return hasDiscoverPageAlternatesForHint(sourceFile, hint, isDynamic)
}

function bindParents(node) {
  node.forEachChild((child) => {
    child.parent = node
    bindParents(child)
  })
}

const routeIssues = []
for (const route of NOINDEX_ROUTES) {
  const routeFile = resolveRouteFile(route.pathParts)
  if (!routeFile) {
    routeIssues.push(`${route.defaultFile} (missing file)`)
    continue
  }
  const src = readFileSync(routeFile, 'utf8')
  const ast = parseTs(routeFile, src)
  bindParents(ast)
  if (!hasNoindexRobotsContract(ast)) {
    routeIssues.push(`${routeFile} (missing noindex robots)`)
  }
  if (!hasCanonicalContractForHint(ast, route.canonicalHint, route.isDynamic)) {
    routeIssues.push(`${routeFile} (missing alternates canonical for hint: ${route.canonicalHint})`)
  }
}

if (missingDisallow.length > 0 || routeIssues.length > 0) {
  if (missingDisallow.length > 0) {
    console.error(
      `SEO noindex/robots check failed: missing disallow entries (${missingDisallow.length}):`
    )
    for (const entry of missingDisallow) console.error(`- ${entry}`)
  }
  if (routeIssues.length > 0) {
    console.error(
      `SEO noindex/robots check failed: route invariants failed (${routeIssues.length}):`
    )
    for (const issue of routeIssues) console.error(`- ${issue}`)
  }
  process.exit(1)
}

console.log(
  `SEO noindex/robots OK: ${POLICY.robotsDisallow.length} disallow rules + noindex route invariants checked.`
)
