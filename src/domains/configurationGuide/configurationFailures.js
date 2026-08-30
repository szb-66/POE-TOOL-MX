import { CRAFTING_CURRENCY_BY_KEY } from '../../../shared/craftingCurrencyCatalog.js'
import { createConfigurationIssue } from './configurationIssues.js'

const TEMPORARY_FAILURE_CODES = new Set([
  'GAME_NOT_FOREGROUND',
  'GAME_WINDOW_NOT_FOUND',
  'GAME_FOCUS_FAILED',
  'NETWORK_UNAVAILABLE',
  'NETWORK_ERROR',
  'RATE_LIMITED',
  'CLIPBOARD_UNAVAILABLE',
  'CLIPBOARD_COPY_FAILED',
  'SERVICE_BUSY',
  'AUTOMATION_LOCKED',
  'ANALYSIS_BUSY',
  'PUZZLE_BUSY',
  'SOURCE_NOT_FOUND',
  'USER_STOPPED',
  'PROCESS_EXITED'
])

const ISSUE_DEFINITIONS = Object.freeze({
  'item.position': ['coordinate', '制作物品位置', 'item.position'],
  'inventory.grid': ['region', '背包网格', 'inventory.grid'],
  'template.stash-title': ['template', '仓库标题模板', 'template.stash-title'],
  'template.inventory-title': ['template', '背包标题模板', 'template.inventory-title'],
  'template.junfeng-reward-title': ['template', '君锋镇奖励标题模板', 'template.junfeng-reward-title'],
  'stash-grid.any': ['region', '仓库网格校准', 'stash-grid.any'],
  'stash-grid.root': ['region', '文件夹外仓库网格', 'stash-grid.root'],
  'stash-grid.folder': ['region', '文件夹内仓库网格', 'stash-grid.folder'],
  'junfeng.grid': ['region', '君锋镇奖励网格', 'junfeng.grid'],
  'account.poe-cn': ['account', '国服账号', 'account.poe-cn'],
  'account.league': ['selection', '国服赛季', 'account.league'],
  'shop.stash-tabs': ['selection', '仓库页', 'shop.stash-tabs'],
  'combat.potion.resources': ['selection', '药剂检测项目', 'combat.potion'],
  'combat.potion.health.position': ['coordinate', '生命药剂检测坐标', 'combat.potion.health.position'],
  'combat.potion.health.keys': ['key', '生命药剂按键序列', 'combat.potion.health.keys'],
  'combat.potion.mana.position': ['coordinate', '魔力药剂检测坐标', 'combat.potion.mana.position'],
  'combat.potion.mana.keys': ['key', '魔力药剂按键序列', 'combat.potion.mana.keys'],
  'combat.loop.items': ['key', '循环按键', 'combat.loop'],
  'combat.portal.key': ['key', '回城按键', 'combat.portal.key'],
  'combat.portal.position': ['coordinate', '回城点击位置', 'combat.portal.position'],
  'puzzle.inventory-region': ['region', '碎片仓库区域', 'puzzle.inventory-region'],
  'puzzle.atlas-region': ['region', '海图区', 'puzzle.atlas-region']
})

const DEFAULT_ISSUE_BY_FAILURE = Object.freeze({
  UNAUTHENTICATED: 'account.poe-cn',
  SESSION_EXPIRED: 'account.poe-cn',
  AUTHENTICATION_EXPIRED: 'account.poe-cn',
  AUTHENTICATION_INVALID: 'account.poe-cn',
  LEAGUE_REQUIRED: 'account.league',
  LEAGUE_INVALID: 'account.league',
  CALIBRATION_REQUIRED: 'stash-grid.any',
  UNSUPPORTED_TAB: 'shop.stash-tabs',
  STASH_TAB_INVALID: 'shop.stash-tabs',
  TARGET_MISMATCH: 'puzzle.atlas-region',
  FINAL_VERIFICATION_FAILED: 'puzzle.atlas-region',
  REGION_GEOMETRY_CHANGED: 'puzzle.inventory-region',
  REGION_INVALID: 'puzzle.inventory-region',
  TEMPLATE_MATCH_FAILED: 'template.inventory-title'
})

const ACTIONS_BY_MODULE = Object.freeze({
  items: new Set(['start']),
  map: new Set(['start']),
  bag: new Set(['enable', 'start']),
  'stash-pickup': new Set(['enable', 'start', 'capture']),
  junfeng: new Set(['enable', 'start', 'capture']),
  combat: new Set(['potion', 'loop', 'portal']),
  shop: new Set(['enable', 'start']),
  'price-check': new Set(['enable', 'capture']),
  puzzle: new Set(['analyze', 'border', 'auto-place'])
})

function issueBelongsToAction(moduleId, actionId, issueId) {
  if (!ACTIONS_BY_MODULE[moduleId]?.has(actionId)) return false
  if (moduleId === 'items') {
    return issueId === 'item.position' || issueId.startsWith('currency.') || issueId.startsWith('preset.items') || issueId === 'stash-tab.currency'
  }
  if (moduleId === 'map') {
    return issueId === 'inventory.grid' || issueId.startsWith('currency.') || issueId === 'preset.map' || issueId === 'stash-tab.currency'
  }
  if (moduleId === 'bag') return ['template.stash-title', 'template.inventory-title', 'inventory.grid'].includes(issueId)
  if (moduleId === 'stash-pickup') {
    return ['template.stash-title', 'template.inventory-title', 'stash-grid.any', 'stash-grid.root', 'stash-grid.folder'].includes(issueId)
  }
  if (moduleId === 'junfeng') return ['template.inventory-title', 'template.junfeng-reward-title', 'junfeng.grid'].includes(issueId)
  if (moduleId === 'combat') return issueId.startsWith(`combat.${actionId === 'potion' ? 'potion' : actionId}.`)
  if (moduleId === 'shop') {
    return ['account.poe-cn', 'account.league', 'template.stash-title', 'template.inventory-title', 'shop.stash-tabs', 'stash-grid.any', 'stash-grid.root', 'stash-grid.folder'].includes(issueId)
  }
  if (moduleId === 'price-check') return ['account.poe-cn', 'account.league'].includes(issueId)
  if (moduleId === 'puzzle') {
    if (actionId === 'border') return issueId === 'puzzle.atlas-region'
    if (actionId === 'analyze') return issueId === 'puzzle.inventory-region' || /^puzzle\.tab\.(1|2)$/.test(issueId)
    return issueId === 'puzzle.inventory-region' || issueId === 'puzzle.atlas-region' || /^puzzle\.tab\.(1|2)$/.test(issueId)
  }
  return false
}

function currencyDefinition(issueId) {
  if (!issueId.startsWith('currency.')) return null
  const key = issueId.slice('currency.'.length)
  const currency = CRAFTING_CURRENCY_BY_KEY.get(key)
  return currency ? ['coordinate', `${currency.name}坐标`, issueId] : null
}

function puzzleTabDefinition(issueId) {
  const match = /^puzzle\.tab\.(1|2)$/.exec(issueId)
  return match ? ['coordinate', `第 ${match[1]} 页仓库页签`, issueId] : null
}

export function configurationIssueFromFailure({
  moduleId,
  actionId,
  failureCode,
  configurationIssueId,
  message
} = {}) {
  const code = String(failureCode || '').trim().toUpperCase()
  if (!code || TEMPORARY_FAILURE_CODES.has(code)) return null
  const issueId = String(configurationIssueId || DEFAULT_ISSUE_BY_FAILURE[code] || '')
  if (!issueBelongsToAction(String(moduleId || ''), String(actionId || ''), issueId)) return null
  const definition = ISSUE_DEFINITIONS[issueId] || currencyDefinition(issueId) || puzzleTabDefinition(issueId)
  if (!definition) return null
  const [kind, title, editorId] = definition
  return createConfigurationIssue({
    id: issueId,
    moduleId,
    actionId,
    kind,
    title,
    message: String(message || `请重新配置${title}后手动重试`),
    editorId,
    state: 'suspect',
    blocking: true
  })
}

export function isCorrectableConfigurationFailure(failure) {
  try {
    return Boolean(configurationIssueFromFailure(failure))
  } catch {
    return false
  }
}
