import { CRAFTING_CURRENCY_CATALOG } from './craftingCurrencyCatalog.js'

const MODULES = new Set(['items', 'map'])
const ACTIONS = new Set(['start'])
const ISSUE_IDS = new Set(CRAFTING_CURRENCY_CATALOG.map(entry => `currency.${entry.key}`))

export function sanitizeOverlayGuideRequest(request = {}) {
  const moduleId = String(request?.moduleId || '')
  const actionId = String(request?.actionId || '')
  const focusIssueId = String(request?.focusIssueId || '')
  if (!MODULES.has(moduleId) || !ACTIONS.has(actionId) || !ISSUE_IDS.has(focusIssueId)) return null
  return Object.freeze({ moduleId, actionId, focusIssueId })
}
