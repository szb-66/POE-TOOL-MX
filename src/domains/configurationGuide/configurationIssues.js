import { buildCraftingCurrencyPreflight, buildMapCurrencyPreflight } from '../../utils/currencyPreflight.js'
import { CURRENCY_NAMES } from '../../utils/constants.js'
import { hasEffectiveAffixGroups } from '../items/affixConfig.js'
import { hasEffectiveEldritchTargets, normalizeEldritchModule } from '../items/eldritchConfig.js'
import { validateStashTabSelection } from '../../utils/stashTabSelection.js'
import { normalizePuzzleRegionMetadata, validatePuzzleTabPoint } from '../../utils/puzzleConfig.js'

export const CONFIGURATION_MODULES = Object.freeze({
  items: 'items',
  map: 'map',
  bag: 'bag',
  stashPickup: 'stash-pickup',
  junfeng: 'junfeng',
  combat: 'combat',
  shop: 'shop',
  priceCheck: 'price-check',
  puzzle: 'puzzle'
})

export const CONFIGURATION_ACTIONS = Object.freeze({
  start: 'start',
  enable: 'enable',
  potion: 'potion',
  loop: 'loop',
  portal: 'portal',
  capture: 'capture',
  analyze: 'analyze',
  border: 'border',
  autoPlace: 'auto-place'
})

const ISSUE_STATES = new Set(['missing', 'invalid', 'suspect'])
const ISSUE_KINDS = new Set(['coordinate', 'region', 'template', 'key', 'account', 'selection', 'preset'])

function text(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback
}

function safeId(value) {
  const normalized = text(value)
  return /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(normalized) ? normalized : ''
}

export function createConfigurationIssue(value = {}) {
  const id = safeId(value.id)
  const moduleId = safeId(value.moduleId)
  const actionId = safeId(value.actionId)
  const editorId = safeId(value.editorId)
  if (!id || !moduleId || !actionId || !editorId) {
    throw new TypeError('配置问题缺少合法的 id、moduleId、actionId 或 editorId')
  }
  return Object.freeze({
    id,
    moduleId,
    actionId,
    kind: ISSUE_KINDS.has(value.kind) ? value.kind : 'selection',
    title: text(value.title, '需要完成配置'),
    message: text(value.message, '请完成此项配置后继续'),
    editorId,
    state: ISSUE_STATES.has(value.state) ? value.state : 'missing',
    blocking: value.blocking !== false
  })
}

export function createConfigurationCheck(issues = [], { forcedIssues = [] } = {}) {
  const unique = new Map()
  for (const candidate of [...issues, ...forcedIssues]) {
    if (!candidate) continue
    const issue = createConfigurationIssue(candidate)
    const previous = unique.get(issue.id)
    unique.set(issue.id, previous
      ? createConfigurationIssue({ ...previous, ...issue, state: issue.state === 'suspect' ? 'suspect' : previous.state })
      : issue)
  }
  const normalized = [...unique.values()]
  const blocking = normalized.filter(issue => issue.blocking)
  return Object.freeze({
    ok: blocking.length === 0,
    isValid: blocking.length === 0,
    issues: Object.freeze(normalized),
    errors: Object.freeze(blocking.map(issue => issue.message))
  })
}

export function isConfiguredPoint(point) {
  const x = Number(point?.x)
  const y = Number(point?.y)
  return Number.isFinite(x) && Number.isFinite(y) && (x !== 0 || y !== 0)
}

export function isConfiguredGrid(inventory) {
  return isConfiguredPoint(inventory?.startPos) &&
    Number.isFinite(Number(inventory?.slotSize?.w)) && Number(inventory.slotSize.w) > 0 &&
    Number.isFinite(Number(inventory?.slotSize?.h)) && Number(inventory.slotSize.h) > 0
}

function isRegion(region) {
  return Number(region?.right) > Number(region?.left) && Number(region?.bottom) > Number(region?.top)
}

function issue(moduleId, actionId, id, kind, title, message, editorId, state = 'missing') {
  return createConfigurationIssue({ id, moduleId, actionId, kind, title, message, editorId, state })
}

function currencyIssue(moduleId, actionId, currency, state = 'missing') {
  const label = CURRENCY_NAMES[currency] || currency
  return issue(
    moduleId,
    actionId,
    `currency.${currency}`,
    'coordinate',
    `${label}坐标`,
    state === 'suspect' ? `请重新抓取${label}坐标后再重试` : `未配置 ${label} (${currency}) 的坐标`,
    `currency.${currency}`,
    state
  )
}

function inventoryGridIssue(moduleId, actionId, inventory) {
  const startMissing = !isConfiguredPoint(inventory?.startPos)
  const slotMissing = !Number.isFinite(Number(inventory?.slotSize?.w)) || Number(inventory.slotSize.w) <= 0 ||
    !Number.isFinite(Number(inventory?.slotSize?.h)) || Number(inventory.slotSize.h) <= 0
  const message = startMissing && slotMissing
    ? '背包首格坐标未配置；背包单格宽高未配置，请完整框选 12×5 背包网格'
    : startMissing
      ? '背包首格坐标未配置，请先在设置中填写'
      : '背包单格宽高未配置，请先在设置中填写'
  return issue(moduleId, actionId, 'inventory.grid', 'region', '背包网格', message, 'inventory.grid')
}

function templateIssues(moduleId, actionId, templates = {}, definitions = []) {
  const issues = []
  for (const definition of definitions) {
    const configured = Boolean(text(templates?.[definition.template]))
    const regionValid = isRegion(templates?.[definition.region])
    if (!configured || !regionValid) {
      issues.push(issue(
        moduleId,
        actionId,
        `template.${definition.id}`,
        'template',
        definition.label,
        !configured ? `请框选${definition.label}` : `${definition.label}的识别区域无效，请重新框选`,
        `template.${definition.id}`,
        configured ? 'invalid' : 'missing'
      ))
    }
  }
  return issues
}

function stashSelectionIssues(moduleId, actionId, stashTabSelection) {
  const validation = validateStashTabSelection(stashTabSelection)
  if (validation.valid) return []
  return [issue(
    moduleId,
    actionId,
    'stash-tab.currency',
    'region',
    '通货仓库页自动选择',
    validation.error,
    'stash-tab.currency',
    validation.config.rootRegion ? 'invalid' : 'missing'
  )]
}

export function collectCraftingConfigurationIssues(context = {}) {
  const moduleId = CONFIGURATION_MODULES.items
  const actionId = CONFIGURATION_ACTIONS.start
  const issues = []
  const preset = context.preset

  const batchEnabled = Boolean(preset?.batchCrafting?.enabled)
  if (!batchEnabled && !isConfiguredPoint(context.itemPosition)) {
    issues.push(issue(moduleId, actionId, 'item.position', 'coordinate', '制作物品位置', '物品位置未配置，请先在设置中抓取物品坐标', 'item.position'))
  }
  if (!preset) {
    issues.push(issue(moduleId, actionId, 'preset.items', 'preset', '物品制作预设', '未选择预设配置', 'preset.items'))
    return createConfigurationCheck(issues, context)
  }
  if (batchEnabled) {
    if (!isConfiguredGrid(context.inventory)) issues.push(inventoryGridIssue(moduleId, actionId, context.inventory))
    if (!context.batchSnapshot?.scanId) {
      issues.push(issue(moduleId, actionId, 'preset.items.batch-scan', 'preset', '本地背包扫描', '请先打开角色背包和通货页面，然后在批量制作模块扫描背包', 'preset.items.batch-scan', 'missing'))
    }
    if (!preset.batchCrafting.categoryIds?.length) {
      issues.push(issue(moduleId, actionId, 'preset.items.batch-categories', 'preset', '批量物品类别', '请至少选择一个背包批量制作类别', 'preset.items.batch-categories', 'missing'))
    } else if (context.batchSnapshot?.scanId && !Number(context.batchCandidateCount || 0)) {
      issues.push(issue(moduleId, actionId, 'preset.items.batch-candidates', 'preset', '批量制作候选', '当前扫描没有所选类别的可制作物品，请调整类别或重新扫描', 'preset.items.batch-categories', 'missing'))
    }
  }

  const affixEnabled = Boolean(preset.moduleTwo?.enabled)
  const socketEnabled = Boolean(preset.moduleThree?.enabled)
  const eldritchEnabled = Boolean(preset.moduleEldritch?.enabled)
  if (!affixEnabled && !socketEnabled && !eldritchEnabled) {
    issues.push(issue(moduleId, actionId, 'preset.items.modules', 'preset', '制作模块', '请至少启用一个制作模块 (词缀、古灵隐式或插槽)', 'preset.items', 'invalid'))
  }
  if (eldritchEnabled && (affixEnabled || socketEnabled)) {
    issues.push(issue(moduleId, actionId, 'preset.items.modules', 'preset', '制作模块', '古灵隐式制作不能与显式词缀或插槽制作同时启用', 'preset.items', 'invalid'))
  }
  if (affixEnabled && !hasEffectiveAffixGroups(preset.moduleTwo)) {
    issues.push(issue(moduleId, actionId, 'preset.items.targets', 'preset', '词缀制作目标', '词缀制作至少需要配置一个有效的达标组合', 'preset.items', 'invalid'))
  }
  if (eldritchEnabled && !hasEffectiveEldritchTargets(normalizeEldritchModule(preset.moduleEldritch))) {
    issues.push(issue(moduleId, actionId, 'preset.items.targets', 'preset', '古灵隐式目标', '古灵隐式制作至少需要选择一个目标词缀', 'preset.items', 'invalid'))
  }

  for (const currency of buildCraftingCurrencyPreflight(preset)) {
    if (!isConfiguredPoint(context.currencyPositions?.[currency])) issues.push(currencyIssue(moduleId, actionId, currency))
  }
  issues.push(...stashSelectionIssues(moduleId, actionId, context.stashTabSelection))
  return createConfigurationCheck(issues, context)
}

export function collectSpecializedCraftingConfigurationIssues(context = {}) {
  const moduleId = CONFIGURATION_MODULES.items
  const actionId = CONFIGURATION_ACTIONS.start
  const issues = []
  const kind = context.kind === 'harvest' ? 'harvest' : 'essence'
  const label = kind === 'essence' ? '精华制作' : '花园工艺'
  if (!isConfiguredPoint(context.itemPosition)) {
    issues.push(issue(moduleId, actionId, `${kind}.item-position`, 'coordinate', `${label}物品位置`, `请先抓取${label}的被制作物品位置`, `${kind}.item-position`))
  }
  if (!isConfiguredPoint(context.actionPosition)) {
    issues.push(issue(moduleId, actionId, `${kind}.action-position`, 'coordinate', kind === 'essence' ? '目标精华位置' : '工艺按钮位置', kind === 'essence' ? '请先抓取目标使用精华的位置' : '请先抓取花园工艺按钮位置', `${kind}.action-position`))
  }
  if (!context.preset) {
    issues.push(issue(moduleId, actionId, `preset.${kind}`, 'preset', `${label}预设`, `请选择有效的${label}预设`, `preset.${kind}`))
  } else if (!hasEffectiveAffixGroups({ enabled: true, affixGroups: context.preset.affixGroups })) {
    issues.push(issue(moduleId, actionId, `preset.${kind}.targets`, 'preset', `${label}词缀目标`, '请至少配置一个有效的达标组合', `preset.${kind}`, 'invalid'))
  }
  return createConfigurationCheck(issues, context)
}

export function collectMapConfigurationIssues(context = {}) {
  const moduleId = CONFIGURATION_MODULES.map
  const actionId = CONFIGURATION_ACTIONS.start
  const issues = []
  const mapConfig = context.mapConfig
  if (!mapConfig || !['alchemy', 'chaos'].includes(mapConfig.method || 'alchemy')) {
    issues.push(issue(moduleId, actionId, 'preset.map', 'preset', '地图或海图预设', '请选择有效的洗练方式', 'preset.map', 'invalid'))
    return createConfigurationCheck(issues, context)
  }
  if (!isConfiguredGrid(context.inventory)) {
    issues.push(inventoryGridIssue(moduleId, actionId, context.inventory))
  }
  for (const currency of buildMapCurrencyPreflight(mapConfig)) {
    if (!isConfiguredPoint(context.currencyPositions?.[currency])) issues.push(currencyIssue(moduleId, actionId, currency))
  }
  issues.push(...stashSelectionIssues(moduleId, actionId, context.stashTabSelection))
  return createConfigurationCheck(issues, context)
}

export function collectBagConfigurationIssues(context = {}) {
  const moduleId = CONFIGURATION_MODULES.bag
  const actionId = context.actionId || CONFIGURATION_ACTIONS.enable
  const issues = templateIssues(moduleId, actionId, context.templates, [
    { id: 'stash-title', label: '仓库标题模板', template: 'stashTitle', region: 'stashRegion' },
    { id: 'inventory-title', label: '背包标题模板', template: 'inventoryTitle', region: 'inventoryRegion' }
  ])
  if (!isConfiguredGrid(context.inventory)) {
    issues.push(inventoryGridIssue(moduleId, actionId, context.inventory))
  }
  return createConfigurationCheck(issues, context)
}

export function collectAllflameReceiverConfigurationIssues(context = {}) {
  const moduleId = CONFIGURATION_MODULES.bag
  const actionId = context.actionId || CONFIGURATION_ACTIONS.enable
  const issues = templateIssues(moduleId, actionId, context.templates, [
    { id: 'allflame-receiver-title', label: '永火接收舱标题模板', template: 'allflameReceiverTitle', region: 'allflameReceiverRegion' },
    { id: 'inventory-title', label: '背包标题模板', template: 'inventoryTitle', region: 'inventoryRegion' }
  ])
  if (!isConfiguredGrid(context.inventory)) {
    issues.push(inventoryGridIssue(moduleId, actionId, context.inventory))
  }
  return createConfigurationCheck(issues, context)
}

export function collectStashPickupConfigurationIssues(context = {}) {
  const moduleId = CONFIGURATION_MODULES.stashPickup
  const actionId = context.actionId || CONFIGURATION_ACTIONS.enable
  const issues = templateIssues(moduleId, actionId, context.templates, [
    { id: 'stash-title', label: '仓库标题模板', template: 'stashTitle', region: 'stashRegion' },
    { id: 'inventory-title', label: '背包标题模板', template: 'inventoryTitle', region: 'inventoryRegion' }
  ])
  if (!context.calibration?.root && !context.calibration?.folder) {
    issues.push(issue(moduleId, actionId, 'stash-grid.any', 'region', '仓库网格校准', '请至少框选文件夹外或文件夹内仓库网格', 'stash-grid.any'))
  }
  return createConfigurationCheck(issues, context)
}

export function collectJunfengConfigurationIssues(context = {}) {
  const moduleId = CONFIGURATION_MODULES.junfeng
  const actionId = context.actionId || CONFIGURATION_ACTIONS.enable
  const issues = templateIssues(moduleId, actionId, context.templates, [
    { id: 'inventory-title', label: '背包标题模板', template: 'inventoryTitle', region: 'inventoryRegion' },
    { id: 'junfeng-reward-title', label: '君锋镇奖励标题模板', template: 'junfengRewardTitle', region: 'junfengRewardRegion' }
  ])
  if (!context.gridRegion) {
    issues.push(issue(moduleId, actionId, 'junfeng.grid', 'region', '君锋镇奖励网格', '请完整框选 12×11 奖励区域', 'junfeng.grid'))
  }
  return createConfigurationCheck(issues, context)
}

export function collectCombatConfigurationIssues(context = {}) {
  const moduleId = CONFIGURATION_MODULES.combat
  const actionId = context.actionId || CONFIGURATION_ACTIONS.potion
  const config = context.config || {}
  const issues = []
  if (actionId === CONFIGURATION_ACTIONS.potion) {
    const resources = [['health', '生命药剂'], ['mana', '魔力药剂']]
    const enabled = resources.filter(([key]) => config.potion?.[key]?.enabled)
    if (!enabled.length) {
      issues.push(issue(moduleId, actionId, 'combat.potion.resources', 'selection', '药剂检测项目', '请至少启用生命或魔力检测', 'combat.potion'))
    }
    for (const [key, label] of enabled) {
      if (!isConfiguredPoint(config.potion?.[key]?.point)) {
        issues.push(issue(moduleId, actionId, `combat.potion.${key}.position`, 'coordinate', `${label}检测坐标`, `请抓取${label}检测坐标`, `combat.potion.${key}.position`))
      }
      if (!Array.isArray(config.potion?.[key]?.keys) || config.potion[key].keys.length === 0) {
        issues.push(issue(moduleId, actionId, `combat.potion.${key}.keys`, 'key', `${label}按键序列`, `请配置${label}使用的按键序列`, `combat.potion.${key}.keys`))
      }
    }
  } else if (actionId === CONFIGURATION_ACTIONS.loop) {
    const enabled = (config.loop?.items || []).filter(item => item.enabled && text(item.key))
    if (!enabled.length) issues.push(issue(moduleId, actionId, 'combat.loop.items', 'key', '循环按键', '请至少添加一个启用的循环按键', 'combat.loop'))
  } else if (actionId === CONFIGURATION_ACTIONS.portal) {
    if (!text(config.portal?.openKey)) issues.push(issue(moduleId, actionId, 'combat.portal.key', 'key', '回城按键', '请配置打开回城卷轴的按键', 'combat.portal.key'))
    if (!isConfiguredPoint(config.portal?.clickPoint)) issues.push(issue(moduleId, actionId, 'combat.portal.position', 'coordinate', '回城点击位置', '请抓取回城确认点击位置', 'combat.portal.position'))
  }
  return createConfigurationCheck(issues, context)
}

function accountIssues(moduleId, actionId, context) {
  const issues = []
  if (!context.authenticated) issues.push(issue(moduleId, actionId, 'account.poe-cn', 'account', '国服账号', '请先完成国服账号登录', 'account.poe-cn'))
  if (!text(context.league)) issues.push(issue(moduleId, actionId, 'account.league', 'selection', '国服赛季', '请选择国服赛季', 'account.league'))
  return issues
}

export function collectShopConfigurationIssues(context = {}) {
  const moduleId = CONFIGURATION_MODULES.shop
  const actionId = context.actionId || CONFIGURATION_ACTIONS.enable
  const issues = accountIssues(moduleId, actionId, context)
  issues.push(...templateIssues(moduleId, actionId, context.templates, [
    { id: 'stash-title', label: '仓库标题模板', template: 'stashTitle', region: 'stashRegion' },
    { id: 'inventory-title', label: '背包标题模板', template: 'inventoryTitle', region: 'inventoryRegion' }
  ]))
  if (!Array.isArray(context.selectedTabs) || context.selectedTabs.length === 0) {
    issues.push(issue(moduleId, actionId, 'shop.stash-tabs', 'selection', '仓库页', '请至少选择一个受支持的仓库页', 'shop.stash-tabs'))
  } else {
    for (const key of context.missingCalibrations || []) {
      if (!['root', 'folder'].includes(key)) continue
      const label = key === 'folder' ? '文件夹内仓库网格' : '文件夹外仓库网格'
      issues.push(issue(moduleId, actionId, `stash-grid.${key}`, 'region', label, `请框选${label}`, `stash-grid.${key}`))
    }
  }
  return createConfigurationCheck(issues, context)
}

export function collectPriceCheckConfigurationIssues(context = {}) {
  const moduleId = CONFIGURATION_MODULES.priceCheck
  const actionId = context.actionId || CONFIGURATION_ACTIONS.enable
  return createConfigurationCheck(accountIssues(moduleId, actionId, context), context)
}

export function collectPuzzleConfigurationIssues(context = {}) {
  const moduleId = CONFIGURATION_MODULES.puzzle
  const actionId = context.actionId || CONFIGURATION_ACTIONS.analyze
  const issues = []
  const inventory = normalizePuzzleRegionMetadata(context.inventoryRegionMetadata)
  const atlas = normalizePuzzleRegionMetadata(context.atlasRegionMetadata)
  if ([CONFIGURATION_ACTIONS.analyze, CONFIGURATION_ACTIONS.autoPlace].includes(actionId) && !inventory) {
    issues.push(issue(moduleId, actionId, 'puzzle.inventory-region', 'region', '碎片仓库区域', '请完整框选 6×10 碎片仓库区域', 'puzzle.inventory-region'))
  }
  if ([CONFIGURATION_ACTIONS.border, CONFIGURATION_ACTIONS.autoPlace].includes(actionId) && !atlas) {
    issues.push(issue(moduleId, actionId, 'puzzle.atlas-region', 'region', '海图区', '请完整框选 3×3 海图区', 'puzzle.atlas-region'))
  }
  if ([CONFIGURATION_ACTIONS.analyze, CONFIGURATION_ACTIONS.autoPlace].includes(actionId) && inventory) {
    const pages = [...new Set((context.sourcePages || []).map(Number).filter(page => [1, 2].includes(page)))]
    for (const page of pages) {
      const otherPage = page === 1 ? 2 : 1
      const validation = validatePuzzleTabPoint(context.inventoryTabPoints?.[page], inventory, page, context.inventoryTabPoints?.[otherPage])
      if (!validation.valid) {
        issues.push(issue(moduleId, actionId, `puzzle.tab.${page}`, 'coordinate', `第 ${page} 页仓库页签`, validation.message, `puzzle.tab.${page}`, 'invalid'))
      }
    }
  }
  return createConfigurationCheck(issues, context)
}

export function collectConfigurationIssues(moduleId, actionId, context = {}) {
  const scoped = { ...context, actionId }
  if (moduleId === CONFIGURATION_MODULES.items) return collectCraftingConfigurationIssues(scoped)
  if (moduleId === CONFIGURATION_MODULES.map) return collectMapConfigurationIssues(scoped)
  if (moduleId === CONFIGURATION_MODULES.bag) return collectBagConfigurationIssues(scoped)
  if (moduleId === CONFIGURATION_MODULES.stashPickup) return collectStashPickupConfigurationIssues(scoped)
  if (moduleId === CONFIGURATION_MODULES.junfeng) return collectJunfengConfigurationIssues(scoped)
  if (moduleId === CONFIGURATION_MODULES.combat) return collectCombatConfigurationIssues(scoped)
  if (moduleId === CONFIGURATION_MODULES.shop) return collectShopConfigurationIssues(scoped)
  if (moduleId === CONFIGURATION_MODULES.priceCheck) return collectPriceCheckConfigurationIssues(scoped)
  if (moduleId === CONFIGURATION_MODULES.puzzle) return collectPuzzleConfigurationIssues(scoped)
  return createConfigurationCheck([])
}

export function suspectedCurrencyIssue(moduleId, actionId, currency) {
  return currencyIssue(moduleId, actionId, currency, 'suspect')
}
