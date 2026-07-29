export const DASHBOARD_STATES = Object.freeze({
  ERROR: 'error',
  RUNNING: 'running',
  ATTENTION: 'attention',
  READY: 'ready'
})

export const ITEM_CRAFTING_MODE_OPTIONS = Object.freeze([
  { value: 'alteration', label: '改造石模式' },
  { value: 'chaos', label: '混沌石模式' },
  { value: 'alchemy', label: '点金石模式' }
])

export const MAP_ROLLING_METHOD_OPTIONS = Object.freeze([
  { value: 'alchemy', label: '点金石' },
  { value: 'chaos', label: '混沌石' }
])

export const RECOVERY_MODE_OPTIONS = Object.freeze([
  { value: 'duration', label: '持续回复' },
  { value: 'instant', label: '立即回复' }
])

const cleanIssues = (issues = []) => issues.map(item => String(item || '').trim()).filter(Boolean)

export function createModuleStatus({
  id,
  title,
  route,
  description,
  error = '',
  running = false,
  issues = [],
  readyText = '已就绪',
  runningText = '运行中',
  metrics = []
}) {
  const normalizedIssues = cleanIssues(issues)
  const normalizedError = String(error || '').trim()
  const state = normalizedError
    ? DASHBOARD_STATES.ERROR
    : running
      ? DASHBOARD_STATES.RUNNING
      : normalizedIssues.length
        ? DASHBOARD_STATES.ATTENTION
        : DASHBOARD_STATES.READY

  return {
    id,
    title,
    route,
    description,
    state,
    statusText: normalizedError || (running ? runningText : normalizedIssues[0] || readyText),
    issues: normalizedIssues,
    metrics
  }
}

export function evaluateItemsStatus(input = {}) {
  const occupied = input.scriptRunning && input.scriptMode !== 'items'
  return createModuleStatus({
    id: 'items',
    title: '物品制作',
    route: '/items',
    description: '按当前预设自动完成词缀与插槽制作。',
    error: input.lastError && input.lastMode === 'items' ? input.lastError : '',
    running: input.scriptRunning && input.scriptMode === 'items',
    issues: input.validation?.errors,
    readyText: occupied
      ? (input.scriptMode === 'map' ? '共享脚本正被地图模块占用' : '共享脚本正在运行')
      : '配置完整，可启动',
    runningText: '物品制作脚本运行中',
    metrics: []
  })
}

export function evaluateMapStatus(input = {}) {
  const occupied = input.scriptRunning && input.scriptMode !== 'map'
  return createModuleStatus({
    id: 'map',
    title: '地图洗练',
    route: '/map',
    description: '依据地图预设自动洗练并筛选结果。',
    error: input.lastError && input.lastMode === 'map' ? input.lastError : '',
    running: input.scriptRunning && input.scriptMode === 'map',
    issues: input.validation?.errors,
    readyText: occupied
      ? (input.scriptMode === 'items' ? '共享脚本正被物品模块占用' : '共享脚本正在运行')
      : '配置完整，可启动',
    runningText: '地图洗练脚本运行中',
    metrics: []
  })
}

export function evaluateBagStatus(input = {}) {
  const benignReasons = new Set(['', 'user-stopped', 'process-ended'])
  const runtimeError = input.moduleEnabled && !input.isDetecting && !benignReasons.has(input.lastStopReason)
    ? input.lastStopReason
    : ''
  const runningText = input.isStashing
    ? `自动入库中 · ${Math.round(Number(input.progress) || 0)}%`
    : input.isMatched
      ? '仓库与背包已就绪'
      : '正在检测仓库与背包'

  return createModuleStatus({
    id: 'bag',
    title: '背包入库',
    route: '/bag',
    description: '检测仓库与背包界面并安全执行自动入库。',
    error: runtimeError,
    running: input.moduleEnabled && (input.isDetecting || input.isStashing),
    issues: input.configError ? [input.configError] : [],
    readyText: '配置完整，模块已关闭',
    runningText,
    metrics: [
      { label: '模块', value: input.moduleEnabled ? '已启用' : '已关闭' },
      { label: '最近入库', value: `${Number(input.stashedSlots) || 0} 格` }
    ]
  })
}

export function evaluateCombatStatus(input = {}) {
  const runningText = input.protectedMode
    ? '运行中 · 频率保护'
    : input.focused
      ? '运行中 · 游戏窗口前台'
      : '运行中 · 等待游戏窗口'
  return createModuleStatus({
    id: 'combat',
    title: '战斗辅助',
    route: '/combat',
    description: '监测生命与魔力并在安全条件下触发药剂。',
    error: input.lastError,
    running: input.running,
    issues: input.validation?.errors,
    readyText: '配置完整，可启动',
    runningText,
    metrics: [
      { label: '生命触发', value: Number(input.healthTriggers) || 0 },
      { label: '魔力触发', value: Number(input.manaTriggers) || 0 }
    ]
  })
}

export function evaluateStoryStatus(input = {}) {
  const validSteps = (input.chapters || []).flatMap(chapter =>
    (chapter.steps || []).filter(step => String(step.text || '').trim())
  )
  const issues = []
  if (!validSteps.length) issues.push('请至少配置一个非空剧情步骤')
  if (validSteps.length && !String(input.currentStep?.text || '').trim()) issues.push('请选择一个非空剧情步骤作为当前步骤')

  return createModuleStatus({
    id: 'story',
    title: '剧情指引',
    route: '/story',
    description: '通过可置顶浮窗展示当前、上一步和下一步剧情。',
    running: input.overlayVisible,
    issues,
    readyText: '剧情流程已就绪，浮窗未显示',
    runningText: '剧情浮窗显示中',
    metrics: [
      { label: '当前章节', value: input.currentChapter?.name || '未选择' },
      { label: '有效步骤', value: validSteps.length }
    ]
  })
}

export function evaluateShopStatus(input = {}) {
  const issues = []
  if (!input.authenticated) issues.push('请先在商城页登录国服账号')
  if (!input.league) issues.push('请选择国服赛季')
  if (!Number(input.selectedTabCount)) issues.push('请至少选择一个仓库页')
  if (!input.snapshot) issues.push('尚未刷新商城配方仓库数据')

  const automationRunning = ['running', 'paused'].includes(input.automationStatus)
  const running = Boolean(input.enabled || automationRunning)
  const error = input.error || (input.automationEvent === 'error' ? input.automationError : '')
  const runningText = input.automationStatus === 'running'
    ? `自动取件中 · ${input.activeRecipeLabel || '当前配方'}`
    : input.automationStatus === 'paused'
      ? `自动取件已暂停 · ${input.activeRecipeLabel || '当前配方'}`
      : '游戏内商城配方控制已开启'
  const available = !input.snapshot
    ? '待刷新'
    : input.activeRecipeKind === 'set'
      ? `${Number(input.fullSetCount) || 0} 套`
      : `${Number(input.candidateCount) || 0} 件`

  return createModuleStatus({
    id: 'shop',
    title: '商城配方',
    route: '/shop',
    description: '计算七种商城配方并控制游戏内自动取件。',
    error,
    running,
    issues,
    readyText: '商城配方仓库数据已加载',
    runningText,
    metrics: [
      { label: '可取数量', value: available },
      { label: '预计奖励', value: input.snapshot ? (Number(input.rewardTotal) || 0) : '待刷新' }
    ]
  })
}

export function evaluatePriceCheckStatus(input = {}) {
  const issues = []
  if (!input.authenticated) issues.push('请在设置页登录国服账号')
  if (!input.league) issues.push('请在设置页选择全局赛季')
  if (!input.catalog) issues.push('交易目录尚未加载')
  else if (input.catalog.degraded) issues.push('官方交易目录不可用，当前使用内置目录')

  return createModuleStatus({
    id: 'priceCheck',
    title: '国服查价',
    route: '/price-check',
    description: '在游戏内按 Ctrl+D 查询腾讯官方市集挂单。',
    error: input.error,
    running: Boolean(input.enabled && !issues.length),
    issues,
    readyText: input.enabled ? '查价器等待物品' : '查价器已关闭',
    runningText: input.latest ? '查价器已启用 · 最近查询完成' : '查价器已启用',
    metrics: [
      { label: '账号', value: input.authenticated ? (input.accountName || '已登录') : '未登录' },
      { label: '全局赛季', value: input.league || '未设置' },
      { label: '交易目录', value: !input.catalog ? '未加载' : input.catalog.degraded ? '内置降级' : '官方可用' },
      { label: '最近查询', value: input.latest?.updatedAt ? new Date(input.latest.updatedAt).toLocaleTimeString() : '暂无' }
    ]
  })
}

export function evaluateCraftingStatus(input = {}) {
  const manifest = input.status?.manifest
  const issues = []
  if (!input.status) issues.push('做装数据状态尚未加载')
  else if (!manifest && !input.status.source) issues.push('未找到可用的做装数据目录')

  return createModuleStatus({
    id: 'crafting',
    title: '手动做装',
    route: '/craft-planner',
    description: '使用离线 POE1 数据模拟通货与各类工艺。',
    error: input.updateError,
    running: false,
    issues,
    readyText: input.session ? '存在进行中的做装会话' : '做装数据可用',
    metrics: [
      { label: '数据版本', value: manifest?.patch || input.status?.patch || '未知' },
      { label: '制作会话', value: input.session ? '可继续' : '未开始' }
    ]
  })
}

export function summarizeModules(modules = []) {
  return modules.reduce((summary, module) => {
    if (module?.state in summary) summary[module.state] += 1
    return summary
  }, { error: 0, running: 0, attention: 0, ready: 0 })
}
