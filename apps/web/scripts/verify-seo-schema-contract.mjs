import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { walk } from './ts-ast-utils.mjs'

const APP = join(process.cwd(), 'src', 'app')
const LIB = join(process.cwd(), 'src', 'lib')
const COMPONENTS = join(process.cwd(), 'src', 'components')

const failed = []
let totalChecks = 0

function getFunctionDeclaration(sourceFile, name) {
  let out = null
  walk(sourceFile, (node) => {
    if (!ts.isFunctionDeclaration(node) || !node.name) return
    if (node.name.text === name) out = node
  })
  return out
}

function parseSourceFile(path, source) {
  const scriptKind = path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  return ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, scriptKind)
}

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text
  return ''
}

function hasCallExpression(sourceFile, calleeName) {
  let ok = false
  walk(sourceFile, (node) => {
    if (!ts.isCallExpression(node) || !ts.isIdentifier(node.expression)) return
    if (node.expression.text === calleeName) ok = true
  })
  return ok
}

function isJsonLdTypeAttribute(attr) {
  if (!ts.isJsxAttribute(attr)) return false
  if (attr.name.text !== 'type') return false
  if (!attr.initializer || !ts.isStringLiteral(attr.initializer)) return false
  return attr.initializer.text === 'application/ld+json'
}

function hasJsonLdScript(sourceFile) {
  let ok = false
  walk(sourceFile, (node) => {
    if (ts.isJsxSelfClosingElement(node)) {
      if (node.tagName.getText(sourceFile) !== 'script') return
      if (node.attributes.properties.some(isJsonLdTypeAttribute)) ok = true
      return
    }
    if (!ts.isJsxElement(node)) return
    const opening = node.openingElement
    if (opening.tagName.getText(sourceFile) !== 'script') return
    if (opening.attributes.properties.some(isJsonLdTypeAttribute)) ok = true
  })
  return ok
}

function hasJsxComponent(sourceFile, componentName) {
  let ok = false
  walk(sourceFile, (node) => {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(sourceFile) === componentName)
      ok = true
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(sourceFile) === componentName)
      ok = true
  })
  return ok
}

function objectHasProperty(obj, propName) {
  return obj.properties.some((p) => ts.isPropertyAssignment(p) && propertyName(p.name) === propName)
}

function hasTopLevelJsonLdEntityAnchors(sourceFile, functionName) {
  const fn = getFunctionDeclaration(sourceFile, functionName)
  if (!fn?.body) return false
  let hasId = false
  let hasSameAs = false
  walk(fn.body, (node) => {
    if (!ts.isReturnStatement(node) || !node.expression) return
    if (!ts.isObjectLiteralExpression(node.expression)) return
    for (const p of node.expression.properties) {
      if (!ts.isPropertyAssignment(p)) continue
      const n = propertyName(p.name)
      if (n === '@id') hasId = true
      if (n === 'sameAs') hasSameAs = true
    }
  })
  return hasId && hasSameAs
}

function hasTopLevelPersonJsonLdEntity(sourceFile, functionName) {
  const fn = getFunctionDeclaration(sourceFile, functionName)
  if (!fn?.body) return false
  let hasPerson = false
  let hasId = false
  let hasSameAs = false
  walk(fn.body, (node) => {
    if (!ts.isReturnStatement(node) || !node.expression) return
    if (!ts.isObjectLiteralExpression(node.expression)) return
    for (const p of node.expression.properties) {
      if (!ts.isPropertyAssignment(p)) continue
      const n = propertyName(p.name)
      if (n === '@type' && ts.isStringLiteral(p.initializer) && p.initializer.text === 'Person') {
        hasPerson = true
      }
      if (n === '@id') hasId = true
      if (n === 'sameAs') hasSameAs = true
    }
  })
  return hasPerson && hasId && hasSameAs
}

function hasVideoAboutMainEntity(sourceFile, videoFunctionName) {
  const fn = getFunctionDeclaration(sourceFile, videoFunctionName)
  if (!fn?.body) return false
  let ok = false
  walk(fn.body, (node) => {
    if (!ts.isPropertyAssignment(node)) return
    if (propertyName(node.name) !== 'about') return
    ok = true
  })
  return ok
}

function hasTopLevelAtIdInFunctionReturn(sourceFile, functionName) {
  const fn = getFunctionDeclaration(sourceFile, functionName)
  if (!fn?.body) return false
  let ok = false
  walk(fn.body, (node) => {
    if (!ts.isReturnStatement(node) || !node.expression) return
    if (!ts.isObjectLiteralExpression(node.expression)) return
    for (const p of node.expression.properties) {
      if (!ts.isPropertyAssignment(p)) continue
      if (propertyName(p.name) === '@id') ok = true
    }
  })
  return ok
}

function returnsBreadcrumbList(sourceFile, functionName) {
  const fn = getFunctionDeclaration(sourceFile, functionName)
  if (!fn?.body) return false
  let ok = false
  walk(fn.body, (node) => {
    if (!ts.isReturnStatement(node) || !node.expression) return
    if (!ts.isObjectLiteralExpression(node.expression)) return
    for (const p of node.expression.properties) {
      if (!ts.isPropertyAssignment(p)) continue
      if (propertyName(p.name) !== '@type') continue
      if (!ts.isStringLiteral(p.initializer)) continue
      if (p.initializer.text === 'BreadcrumbList') ok = true
    }
  })
  return ok
}

function structuredHubPairsCollectionAndBreadcrumb(sourceFile) {
  const fn = getFunctionDeclaration(sourceFile, 'buildCollectionPageStructuredData')
  if (!fn?.body) return false
  let c = false
  let b = false
  walk(fn.body, (node) => {
    if (!ts.isCallExpression(node) || !ts.isIdentifier(node.expression)) return
    if (node.expression.text === 'buildCollectionPageJsonLd') c = true
    if (node.expression.text === 'buildSiteHubBreadcrumbJsonLd') b = true
  })
  return c && b
}

function hasContainsSeasonInBuildJsonLdTv(sourceFile) {
  const fn = getFunctionDeclaration(sourceFile, 'buildJsonLdTv')
  if (!fn?.body) return false
  let ok = false
  walk(fn.body, (node) => {
    if (!ts.isPropertyAssignment(node)) return
    if (propertyName(node.name) !== 'containsSeason') return
    ok = true
  })
  return ok
}

function hasGuardedAggregateRating(sourceFile, functionName, paramName) {
  const fn = getFunctionDeclaration(sourceFile, functionName)
  if (!fn?.body) return false
  let ok = false
  walk(fn.body, (node) => {
    if (!ts.isPropertyAssignment(node) || propertyName(node.name) !== 'aggregateRating') return
    if (!ts.isConditionalExpression(node.initializer)) return
    const cond = node.initializer.condition.getText(sourceFile)
    const expectedGuard = `${paramName}.voteAverage > 0 && ${paramName}.voteCount > 0`
    if (!cond.includes(expectedGuard)) return
    const whenTrue = node.initializer.whenTrue
    if (!ts.isObjectLiteralExpression(whenTrue)) return
    if (!objectHasProperty(whenTrue, 'ratingCount')) return
    ok = true
  })
  return ok
}

function hasTrailerAndVideoWiring(
  sourceFile,
  detailFunctionName,
  jsonLdFunctionName,
  videoFunctionName
) {
  const detailFn = getFunctionDeclaration(sourceFile, detailFunctionName)
  const jsonLdFn = getFunctionDeclaration(sourceFile, jsonLdFunctionName)
  const videoFn = getFunctionDeclaration(sourceFile, videoFunctionName)
  if (!detailFn?.body || !jsonLdFn?.body || !videoFn?.body) return false

  let hasJsonLdTrailer = false
  walk(jsonLdFn.body, (node) => {
    if (!ts.isPropertyAssignment(node)) return
    if (propertyName(node.name) !== 'trailer') return
    hasJsonLdTrailer = true
  })

  let hasVideoObject = false
  walk(videoFn.body, (node) => {
    if (!ts.isPropertyAssignment(node)) return
    if (propertyName(node.name) !== '@type') return
    if (!ts.isStringLiteral(node.initializer)) return
    if (node.initializer.text === 'VideoObject') hasVideoObject = true
  })

  let usesVideoJsonLd = false
  walk(detailFn.body, (node) => {
    if (!ts.isCallExpression(node) || !ts.isIdentifier(node.expression)) return
    if (node.expression.text === videoFunctionName) usesVideoJsonLd = true
  })

  return hasJsonLdTrailer && hasVideoObject && usesVideoJsonLd
}

function hasHomeGraphWebPage(sourceFile) {
  const fn = getFunctionDeclaration(sourceFile, 'buildHomeStructuredData')
  if (!fn?.body) return false
  let ok = false
  walk(fn.body, (node) => {
    if (!ts.isReturnStatement(node) || !node.expression) return
    if (!ts.isObjectLiteralExpression(node.expression)) return
    const graphProp = node.expression.properties.find(
      (p) => ts.isPropertyAssignment(p) && propertyName(p.name) === '@graph'
    )
    if (!graphProp || !ts.isPropertyAssignment(graphProp)) return
    if (!ts.isArrayLiteralExpression(graphProp.initializer)) return
    const hasWebPage = graphProp.initializer.elements.some(
      (el) => ts.isIdentifier(el) && el.text === 'webPage'
    )
    if (hasWebPage) ok = true
  })
  return ok
}

function recordCheck(condition, label, file, missing) {
  totalChecks += 1
  if (condition) return
  failed.push({ label, file, missing: [missing] })
}

const homeFile = join(APP, 'page.tsx')
const homeAst = parseSourceFile(homeFile, readFileSync(homeFile, 'utf8'))
recordCheck(
  hasCallExpression(homeAst, 'buildHomeStructuredData') && hasJsonLdScript(homeAst),
  'home schema graph wiring',
  homeFile,
  'buildHomeStructuredData call + JSON-LD script'
)

const jsonLdSiteFile = join(LIB, 'jsonLdSite.ts')
const jsonLdSiteAst = parseSourceFile(jsonLdSiteFile, readFileSync(jsonLdSiteFile, 'utf8'))
recordCheck(
  hasHomeGraphWebPage(jsonLdSiteAst),
  'home graph includes WebPage',
  jsonLdSiteFile,
  "buildHomeStructuredData returns @graph containing 'webPage'"
)
recordCheck(
  hasTopLevelAtIdInFunctionReturn(jsonLdSiteAst, 'buildWebPageJsonLd'),
  'static WebPage JSON-LD @id',
  jsonLdSiteFile,
  'buildWebPageJsonLd return includes top-level @id'
)
recordCheck(
  hasTopLevelAtIdInFunctionReturn(jsonLdSiteAst, 'buildCollectionPageJsonLd'),
  'CollectionPage JSON-LD @id',
  jsonLdSiteFile,
  'buildCollectionPageJsonLd return includes top-level @id'
)
recordCheck(
  returnsBreadcrumbList(jsonLdSiteAst, 'buildSiteHubBreadcrumbJsonLd'),
  'hub BreadcrumbList builder',
  jsonLdSiteFile,
  'buildSiteHubBreadcrumbJsonLd returns @type BreadcrumbList'
)
recordCheck(
  structuredHubPairsCollectionAndBreadcrumb(jsonLdSiteAst),
  'hub structured data pairs collection + breadcrumb',
  jsonLdSiteFile,
  'buildCollectionPageStructuredData calls buildCollectionPageJsonLd + buildSiteHubBreadcrumbJsonLd'
)

const webPageJsonLdFile = join(COMPONENTS, 'WebPageJsonLd', 'WebPageJsonLd.tsx')
const webPageJsonLdAst = parseSourceFile(webPageJsonLdFile, readFileSync(webPageJsonLdFile, 'utf8'))
recordCheck(
  hasCallExpression(webPageJsonLdAst, 'buildSiteHubBreadcrumbJsonLd'),
  'WebPageJsonLd emits hub breadcrumb',
  webPageJsonLdFile,
  'WebPageJsonLd calls buildSiteHubBreadcrumbJsonLd for BreadcrumbList script'
)

const aboutFile = join(APP, 'about', 'page.tsx')
const aboutAst = parseSourceFile(aboutFile, readFileSync(aboutFile, 'utf8'))
recordCheck(
  hasCallExpression(aboutAst, 'buildAboutOrganizationStructuredData') &&
    hasJsxComponent(aboutAst, 'WebPageJsonLd'),
  'about page org + webpage schema',
  aboutFile,
  'buildAboutOrganizationStructuredData call + <WebPageJsonLd /> usage'
)

for (const route of ['movies', 'series', 'cartoons', 'tvshows', 'categories']) {
  const file = join(APP, route, 'page.tsx')
  const ast = parseSourceFile(file, readFileSync(file, 'utf8'))
  recordCheck(
    hasCallExpression(ast, 'buildCollectionPageStructuredData') && hasJsonLdScript(ast),
    `${route} collection + breadcrumb schema`,
    file,
    'buildCollectionPageStructuredData + JSON-LD scripts'
  )
}

const movieFile = join(APP, 'movie', '[id]', 'page.tsx')
const movieAst = parseSourceFile(movieFile, readFileSync(movieFile, 'utf8'))
recordCheck(
  getFunctionDeclaration(movieAst, 'buildJsonLdMovie') != null &&
    getFunctionDeclaration(movieAst, 'buildBreadcrumb') != null &&
    getFunctionDeclaration(movieAst, 'buildFaqJsonLd') != null &&
    hasJsonLdScript(movieAst),
  'movie detail schema set',
  movieFile,
  'buildJsonLdMovie/buildBreadcrumb/buildFaqJsonLd + JSON-LD scripts'
)
recordCheck(
  hasGuardedAggregateRating(movieAst, 'buildJsonLdMovie', 'movie'),
  'movie detail aggregateRating guard',
  movieFile,
  'guarded aggregateRating with voteAverage && voteCount and ratingCount (TMDB votes, no reviewCount)'
)
recordCheck(
  hasTrailerAndVideoWiring(movieAst, 'MoviePage', 'buildJsonLdMovie', 'buildVideoJsonLd'),
  'movie trailer/video schema wiring',
  movieFile,
  'trailer link in JSON-LD + VideoObject generation + usage in detail page'
)
recordCheck(
  hasTopLevelJsonLdEntityAnchors(movieAst, 'buildJsonLdMovie'),
  'movie JSON-LD @id + sameAs',
  movieFile,
  'top-level @id and sameAs on buildJsonLdMovie return object'
)
recordCheck(
  hasVideoAboutMainEntity(movieAst, 'buildVideoJsonLd'),
  'movie VideoObject about main entity',
  movieFile,
  'buildVideoJsonLd sets about pointing at main work @id'
)

const trailerFile = join(APP, 'trailer', '[id]', 'page.tsx')
const trailerSrc = readFileSync(trailerFile, 'utf8')
const trailerAst = parseSourceFile(trailerFile, trailerSrc)
recordCheck(
  hasJsonLdScript(trailerAst) &&
    trailerSrc.includes('jsonLdMainEntityId') &&
    trailerSrc.includes('about') &&
    (() => {
      let ok = false
      walk(trailerAst, (node) => {
        if (!ts.isPropertyAssignment(node)) return
        if (propertyName(node.name) !== '@type') return
        if (!ts.isStringLiteral(node.initializer)) return
        if (node.initializer.text === 'VideoObject') ok = true
      })
      return ok
    })(),
  'trailer video schema',
  trailerFile,
  'VideoObject JSON-LD + about main movie @id + script injection'
)

const tvFile = join(LIB, 'tvSeriesDetailRoute.tsx')
const tvSrc = readFileSync(tvFile, 'utf8')
const tvAst = parseSourceFile(tvFile, tvSrc)
recordCheck(
  hasGuardedAggregateRating(tvAst, 'buildJsonLdTv', 'show'),
  'tv/series detail aggregateRating guard',
  tvFile,
  'guarded aggregateRating with voteAverage && voteCount and ratingCount (TMDB votes, no reviewCount)'
)
recordCheck(
  hasTrailerAndVideoWiring(tvAst, 'TvSeriesDetailPageApp', 'buildJsonLdTv', 'buildVideoJsonLd'),
  'tv/series trailer/video schema wiring',
  tvFile,
  'trailer link in JSON-LD + VideoObject generation + usage in detail page'
)
recordCheck(
  hasTopLevelJsonLdEntityAnchors(tvAst, 'buildJsonLdTv'),
  'tv JSON-LD @id + sameAs',
  tvFile,
  'top-level @id and sameAs on buildJsonLdTv return object'
)
recordCheck(
  hasVideoAboutMainEntity(tvAst, 'buildVideoJsonLd'),
  'tv VideoObject about main entity',
  tvFile,
  'buildVideoJsonLd sets about pointing at main work @id'
)
recordCheck(
  hasContainsSeasonInBuildJsonLdTv(tvAst),
  'tv series JSON-LD containsSeason (TVSeason)',
  tvFile,
  'buildJsonLdTv includes containsSeason when tvSeasonSummaries exist'
)

const cartoonFile = join(LIB, 'cartoonDetailRoute.tsx')
const cartoonSrc = readFileSync(cartoonFile, 'utf8')
const cartoonAst = parseSourceFile(cartoonFile, cartoonSrc)
recordCheck(
  hasGuardedAggregateRating(cartoonAst, 'buildJsonLdCartoon', 'movie'),
  'cartoon detail aggregateRating guard',
  cartoonFile,
  'guarded aggregateRating with voteAverage && voteCount and ratingCount (TMDB votes, no reviewCount)'
)
recordCheck(
  hasTrailerAndVideoWiring(
    cartoonAst,
    'CartoonDetailPageApp',
    'buildJsonLdCartoon',
    'buildVideoJsonLd'
  ),
  'cartoon trailer/video schema wiring',
  cartoonFile,
  'trailer link in JSON-LD + VideoObject generation + usage in detail page'
)
recordCheck(
  hasTopLevelJsonLdEntityAnchors(cartoonAst, 'buildJsonLdCartoon'),
  'cartoon JSON-LD @id + sameAs',
  cartoonFile,
  'top-level @id and sameAs on buildJsonLdCartoon return object'
)
recordCheck(
  hasVideoAboutMainEntity(cartoonAst, 'buildVideoJsonLd'),
  'cartoon VideoObject about main entity',
  cartoonFile,
  'buildVideoJsonLd sets about pointing at main work @id'
)

const personJsonLdFile = join(LIB, 'jsonLdPerson.ts')
const personJsonLdAst = parseSourceFile(personJsonLdFile, readFileSync(personJsonLdFile, 'utf8'))
recordCheck(
  hasTopLevelPersonJsonLdEntity(personJsonLdAst, 'buildJsonLdPerson'),
  'person detail JSON-LD Person entity',
  personJsonLdFile,
  'buildJsonLdPerson returns @type Person with top-level @id and sameAs'
)

const personPageFile = join(APP, 'person', '[id]', 'page.tsx')
const personPageAst = parseSourceFile(personPageFile, readFileSync(personPageFile, 'utf8'))
recordCheck(
  hasCallExpression(personPageAst, 'buildJsonLdPerson') &&
    hasJsxComponent(personPageAst, 'WebPageJsonLd') &&
    hasJsonLdScript(personPageAst),
  'person page Person + WebPage JSON-LD wiring',
  personPageFile,
  'buildJsonLdPerson + WebPageJsonLd (WebPage + breadcrumb) + ld+json scripts'
)

if (failed.length > 0) {
  console.error(`SEO schema contract failed: ${failed.length} check(s) failed.`)
  for (const f of failed) {
    console.error(`- ${f.label}`)
    console.error(`  file: ${f.file}`)
    for (const needle of f.missing) console.error(`  missing: ${needle}`)
  }
  process.exit(1)
}

console.log(`SEO schema contract OK: ${totalChecks} checks passed.`)
