export const SERVER_IDS = Object.freeze(['cn', 'international'])

export function requireServerId(value = 'cn') {
  if (!SERVER_IDS.includes(value)) throw new Error('无效的服务器模式')
  return value
}

const definitions = {
  cn: { id: 'cn', label: '国服', language: 'zh-CN', origin: 'https://poe.game.qq.com', partition: 'persist:poe-cn-auth', provider: 'poe-cn', windowTitles: Object.freeze(['流放之路', 'Path of Exile']) },
  international: { id: 'international', label: '国际服', language: 'en', origin: 'https://www.pathofexile.com', partition: 'persist:poe-international-auth', provider: 'poe-international', windowTitles: Object.freeze(['Path of Exile']) }
}
export const SERVERS = Object.freeze(Object.fromEntries(Object.entries(definitions).map(([id, value]) => [id, Object.freeze(value)])))
export const getServer = (id = 'cn') => SERVERS[requireServerId(id)]

export const SERVER_FEATURES = Object.freeze({
  account: '账号与赛季', 'price-check': '官方挂单查价', recipe: '仓库配方', 'pob-export': '角色导出',
  items: '物品制作', map: '地图制作', bag: '背包仓库', combat: '战斗辅助', story: '剧情辅助',
  regex: '搜索正则', 'craft-planner': '做装模拟', sanctum: '圣所', faustus: '浮士德市集',
  puzzle: '过期赛季', 'map-tracker': '地图跟踪', 'stash-pickup': '仓库取件', junfeng: '君锋镇'
})

export const INTERNATIONAL_AUTOMATION_FEATURES = Object.freeze(['items', 'map', 'bag', 'stash-pickup', 'junfeng', 'combat', 'story', 'price-check', 'recipe', 'map-tracker', 'sanctum', 'faustus'])

// 保留旧开发参数兼容；正式能力不再由验收参数决定。
export function internationalVerificationFeatures(args = [], { isPackaged = true } = {}) {
  if (isPackaged) return []
  const values = args.filter(arg => arg.startsWith('--verify-international-features='))
    .flatMap(arg => arg.slice('--verify-international-features='.length).split(','))
  if (values.some(id => !INTERNATIONAL_AUTOMATION_FEATURES.includes(id))) throw new Error('无效的国际服验收功能')
  return [...new Set(values)]
}

export function featureAvailability(serverId, feature) {
  requireServerId(serverId)
  if (!Object.hasOwn(SERVER_FEATURES, feature)) return { available: false, reason: '未知功能' }
  if (serverId === 'cn') return { available: true, gameInputAvailable: true, state: 'verified', reason: '' }
  const readOnlyReasons = {
    account: '支持独立网页登录和赛季选择',
    'pob-export': '支持读取官网角色并导出 PoB',
    regex: '支持英文原版与当前受管汉化的商店、地图及野兽正则'
  }
  if (readOnlyReasons[feature]) return { available: true, gameInputAvailable: false, state: 'ready', reason: readOnlyReasons[feature] }
  if (INTERNATIONAL_AUTOMATION_FEATURES.includes(feature)) {
    return { available: true, gameInputAvailable: true, state: 'ready', reason: '已开放，完成离线适配与验证；未进行游戏内实测' }
  }
  return { available: false, gameInputAvailable: false, state: 'unsupported', reason: feature === 'puzzle' ? '国际服不适配过期赛季功能（含海图与永火接收舱），已有预设保留' : '国际服暂不开放做装模拟，制作词缀联想仍可使用' }
}

export function serverContext(id = 'cn', options = {}) {
  return { ...getServer(id), capabilities: Object.fromEntries(Object.keys(SERVER_FEATURES).map(key => [key, featureAvailability(id, key, options)])) }
}

// 显式列出的通用设置及战斗配置（含坐标）跨服共享，其余坐标、进程、DPI 和业务状态保持独立。
export const SHARED_SETTINGS_FIELDS = Object.freeze([
  'globalShortcuts', 'shortcutScopeEnabled', 'operationDelayMs', 'operationTimingVersion', 'fixedTiming',
  'debugMode', 'updateMode', 'updateSource', 'windowCloseBehavior', 'windowClosePromptSuppressed',
  'overlaySettings', 'backgroundHistory', 'storyOverlayWidth', 'storyOverlayLayoutVersion', 'storyOverlayOpacity',
  'combatAssist'
])

// 五大模块（制作物品、地图制作、剧情、正则）的预设库本体跨服共享；当前选中预设 ID 与剧情进度仍按服独立。
export const SHARED_PRESET_STORAGE_KEYS = Object.freeze([
  'itemPresets',
  'essencePresets',
  'harvestPresets',
  'mapPresets',
  'chartPresets',
  'heistPresets',
  'storyGuide:v1',
  'vendorRegexPresets',
  'mapRegexPresets',
  'beastRegexPresets'
])

const SHARED_PRESET_KEY_SET = new Set(SHARED_PRESET_STORAGE_KEYS)

export function serverStorageKey(key, serverId) {
  requireServerId(serverId)
  return serverId === 'cn'
    || SHARED_PRESET_KEY_SET.has(key)
    || /^(?:mainWindowTheme|themePreference|toolSiteDirectory|featureModules)/.test(key)
    ? key : `server:${serverId}:${key}`
}
