import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const POLICY_PATH = join(ROOT, 'scripts', 'seo-programmatic-policy.json')

const EXPECTED_TEMPLATE_IDS = [
  'genre-year',
  'genre-country',
  'genre-rating',
  'genre-mood',
  'genre-franchise',
  'actor-genre',
  'director-genre',
]

const WEAK_PAGE_ACTIONS = new Set(['skip_generation', 'noindex', 'internal_only'])

function fail(issues) {
  console.error(`SEO programmatic policy failed: ${issues.length} issue(s):`)
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function main() {
  const raw = readFileSync(POLICY_PATH, 'utf8')
  const policy = JSON.parse(raw)
  const issues = []

  if (!isObject(policy)) {
    fail(['policy root must be an object'])
  }

  const templates = Array.isArray(policy.templates) ? policy.templates : []
  const templateIdSet = new Set(templates.map((template) => template?.id).filter(Boolean))

  for (const id of EXPECTED_TEMPLATE_IDS) {
    if (!templateIdSet.has(id)) issues.push(`missing required template id: ${id}`)
  }
  for (const id of templateIdSet) {
    if (!EXPECTED_TEMPLATE_IDS.includes(id)) issues.push(`unexpected template id: ${id}`)
  }

  const seenPatterns = new Set()
  for (const template of templates) {
    if (!isObject(template)) {
      issues.push('template entries must be objects')
      continue
    }

    if (typeof template.id !== 'string' || template.id.length === 0) {
      issues.push('template is missing non-empty string "id"')
    }
    if (typeof template.urlPattern !== 'string' || !template.urlPattern.startsWith('/')) {
      issues.push(`template ${template.id ?? '<unknown>'} has invalid "urlPattern"`)
    } else if (seenPatterns.has(template.urlPattern)) {
      issues.push(`duplicate urlPattern: ${template.urlPattern}`)
    } else {
      seenPatterns.add(template.urlPattern)
    }
    if (template.requiresSearchDemand !== true) {
      issues.push(`template ${template.id ?? '<unknown>'} must require search demand`)
    }
  }

  const deny = policy.generationDenyRules
  if (!isObject(deny)) {
    issues.push('generationDenyRules must be an object')
  } else {
    const expectedDenyKeys = [
      'skipWhenInsufficientData',
      'skipNearDuplicateTemplates',
      'skipWithoutSearchDemand',
      'skipWithoutUniqueUserValue',
    ]
    for (const key of expectedDenyKeys) {
      if (deny[key] !== true) issues.push(`generationDenyRules.${key} must be true`)
    }
  }

  const gate = policy.qualityGate
  if (!isObject(gate)) {
    issues.push('qualityGate must be an object')
  } else {
    if (!Number.isInteger(gate.minCards) || gate.minCards < 12) {
      issues.push('qualityGate.minCards must be integer >= 12')
    }
    if (!Number.isInteger(gate.minUniqueCopyChars) || gate.minUniqueCopyChars < 180) {
      issues.push('qualityGate.minUniqueCopyChars must be integer >= 180')
    }
    if (
      typeof gate.minIntentScore !== 'number' ||
      gate.minIntentScore <= 0 ||
      gate.minIntentScore > 1
    ) {
      issues.push('qualityGate.minIntentScore must be number in (0, 1]')
    }
    if (
      typeof gate.maxNeighborContentSimilarity !== 'number' ||
      gate.maxNeighborContentSimilarity <= 0 ||
      gate.maxNeighborContentSimilarity >= 1
    ) {
      issues.push('qualityGate.maxNeighborContentSimilarity must be number in (0, 1)')
    }
    if (gate.requireDuplicateCheck !== true) {
      issues.push('qualityGate.requireDuplicateCheck must be true')
    }
  }

  const indexing = policy.indexingPolicy
  if (!isObject(indexing)) {
    issues.push('indexingPolicy must be an object')
  } else {
    const actions = Array.isArray(indexing.weakPageActions) ? indexing.weakPageActions : []
    if (actions.length === 0) issues.push('indexingPolicy.weakPageActions must not be empty')
    for (const action of actions) {
      if (!WEAK_PAGE_ACTIONS.has(action)) {
        issues.push(`indexingPolicy.weakPageActions has unsupported action: ${action}`)
      }
    }
    if (!WEAK_PAGE_ACTIONS.has(indexing.defaultWeakPageAction)) {
      issues.push('indexingPolicy.defaultWeakPageAction must be one of weakPageActions')
    } else if (!actions.includes(indexing.defaultWeakPageAction)) {
      issues.push('indexingPolicy.defaultWeakPageAction must exist in weakPageActions')
    }
    if (indexing.allowSitemapOnlyForStrongPages !== true) {
      issues.push('indexingPolicy.allowSitemapOnlyForStrongPages must be true')
    }
  }

  const calibration = policy.calibration
  if (!isObject(calibration)) {
    issues.push('calibration must be an object')
  } else {
    if (calibration.required !== true) issues.push('calibration.required must be true')
    if (!Number.isInteger(calibration.reviewCadenceDays) || calibration.reviewCadenceDays < 7) {
      issues.push('calibration.reviewCadenceDays must be integer >= 7')
    }
    if (!Number.isInteger(calibration.minEvaluatedPages) || calibration.minEvaluatedPages < 20) {
      issues.push('calibration.minEvaluatedPages must be integer >= 20')
    }

    const dataSources = Array.isArray(calibration.dataSources) ? calibration.dataSources : []
    const requiredSources = [
      'google_search_console',
      'bing_webmaster_tools',
      'indexation_logs',
      'content_similarity_reports',
    ]
    for (const source of requiredSources) {
      if (!dataSources.includes(source)) {
        issues.push(`calibration.dataSources missing source: ${source}`)
      }
    }

    const metrics = Array.isArray(calibration.successMetrics) ? calibration.successMetrics : []
    const requiredMetrics = [
      'indexation_rate',
      'impressions_growth',
      'ctr',
      'thin_or_duplicate_share',
    ]
    for (const metric of requiredMetrics) {
      if (!metrics.includes(metric)) {
        issues.push(`calibration.successMetrics missing metric: ${metric}`)
      }
    }

    if (!isIsoDate(calibration.lastCalibratedAt)) {
      issues.push('calibration.lastCalibratedAt must be ISO date YYYY-MM-DD')
    }
  }

  if (issues.length > 0) fail(issues)

  console.log(
    `SEO programmatic policy OK: templates=${templates.length}, minCards=${policy.qualityGate.minCards}, weakActions=${policy.indexingPolicy.weakPageActions.length}.`
  )
}

main()
