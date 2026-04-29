import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { extractRobotsDisallowLiterals, parseRobotsSource } from './robots-disallow-utils.mjs'
import {
  policyTokenToRoute,
  routeToPageFile,
  routeToRobotsDisallow,
} from './seo-consistency-core.mjs'

const ROOT = process.cwd()
const APP_DIR = join(ROOT, 'src', 'app')
const policy = JSON.parse(readFileSync(join(ROOT, 'scripts', 'seo-route-policy.json'), 'utf8'))
const ROBOTS_PATH = join(APP_DIR, 'robots.ts')
const robotsSrc = readFileSync(ROBOTS_PATH, 'utf8')
const robotsDisallowSet = extractRobotsDisallowLiterals(parseRobotsSource(ROBOTS_PATH, robotsSrc))

const requiredRoutes = policy.requiredSitemapStaticRoutes.map(policyTokenToRoute).filter(Boolean)
const forbiddenRoutes = policy.forbiddenSitemapStaticRoutes.map(policyTokenToRoute).filter(Boolean)
const noindexRoutes = policy.noindexRoutes

const issues = []

function parseSourceFile(path, source) {
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

function isNoindexRobotsObject(node) {
  const target =
    ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) ? node.expression : node
  if (!ts.isObjectLiteralExpression(target)) return false
  const hasIndexFalse = target.properties.some(
    (p) =>
      ts.isPropertyAssignment(p) &&
      propName(p.name) === 'index' &&
      p.initializer.kind === ts.SyntaxKind.FalseKeyword
  )
  const hasFollowTrue = target.properties.some(
    (p) =>
      ts.isPropertyAssignment(p) &&
      propName(p.name) === 'follow' &&
      p.initializer.kind === ts.SyntaxKind.TrueKeyword
  )
  return hasIndexFalse && hasFollowTrue
}

function hasNoindexRobotsContract(ast) {
  let hasRobotsConst = false
  let hasInlineRobots = false
  walk(ast, (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'robots'
    ) {
      if (node.initializer && isNoindexRobotsObject(node.initializer)) hasRobotsConst = true
    }
    if (!ts.isPropertyAssignment(node) || propName(node.name) !== 'robots') return
    if (isNoindexRobotsObject(node.initializer)) hasInlineRobots = true
  })
  return hasRobotsConst || hasInlineRobots
}

function hasCanonicalAlternates(sourceFile) {
  let ok = false
  walk(sourceFile, (node) => {
    if (!ts.isPropertyAssignment(node) || propName(node.name) !== 'alternates') return
    if (ts.isObjectLiteralExpression(node.initializer)) {
      const hasCanonical = node.initializer.properties.some(
        (p) => ts.isPropertyAssignment(p) && propName(p.name) === 'canonical'
      )
      if (hasCanonical) ok = true
      return
    }
    if (ts.isCallExpression(node.initializer) && ts.isIdentifier(node.initializer.expression)) {
      if (node.initializer.expression.text === 'discoverPageAlternates') ok = true
    }
  })
  return ok
}

function hasExportConstMetadata(sourceFile) {
  let ok = false
  walk(sourceFile, (node) => {
    if (!ts.isVariableStatement(node)) return
    const isExported = (node.modifiers || []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    if (!isExported) return
    for (const d of node.declarationList.declarations) {
      if (ts.isIdentifier(d.name) && d.name.text === 'metadata') ok = true
    }
  })
  return ok
}

const forbiddenSet = new Set(forbiddenRoutes)
for (const route of requiredRoutes) {
  if (forbiddenSet.has(route)) {
    issues.push(`route appears in both required and forbidden sitemap sets: ${route}`)
  }
}

for (const route of noindexRoutes) {
  const disallow = routeToRobotsDisallow(route)
  if (!robotsDisallowSet.has(disallow)) {
    issues.push(
      `noindex route missing corresponding robots disallow prefix: ${route} -> ${disallow}`
    )
  }
}

for (const route of noindexRoutes) {
  if (route.includes('[')) continue
  const pageFile = routeToPageFile(APP_DIR, route)
  if (!pageFile || !existsSync(pageFile)) {
    issues.push(`noindex route file missing: ${route}`)
    continue
  }
  const src = readFileSync(pageFile, 'utf8')
  const ast = parseSourceFile(pageFile, src)
  if (!hasNoindexRobotsContract(ast)) {
    issues.push(`noindex route missing robots noindex contract: ${route}`)
  }
  if (!hasCanonicalAlternates(ast)) {
    issues.push(`noindex route missing canonical alternates: ${route}`)
  }
}

for (const route of requiredRoutes) {
  if (route === '/') continue
  if (route.includes('[')) continue
  if (noindexRoutes.includes(route)) continue
  const pageFile = routeToPageFile(APP_DIR, route)
  if (!pageFile || !existsSync(pageFile)) continue
  const src = readFileSync(pageFile, 'utf8')
  const ast = parseSourceFile(pageFile, src)
  const isStaticMetadataPage = hasExportConstMetadata(ast)
  if (!isStaticMetadataPage) continue
  if (hasNoindexRobotsContract(ast)) {
    issues.push(`indexable required route is marked noindex: ${route}`)
  }
}

if (issues.length > 0) {
  console.error(`SEO consistency contract failed: ${issues.length} issue(s):`)
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log(
  `SEO consistency OK: required=${requiredRoutes.length}, forbidden=${forbiddenRoutes.length}, noindex=${noindexRoutes.length}.`
)
