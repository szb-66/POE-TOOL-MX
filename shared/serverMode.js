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
  puzzle: '海图', 'map-tracker': '地图跟踪', 'stash-pickup': '仓库取件', junfeng: '君锋镇'
})

export const INTERNATIONAL_AUTOMATION_FEATURES = Object.freeze(['items', 'map', 'bag', 'stash-pickup', 'junfeng', 'combat', 'story'])

// 仅主进程读取启动参数；打包版和渲染端传参均不能开放待验收的游戏输入。
export function internationalVerificationFeatures(args = [], { isPackaged = true } = {}) {
  if (isPackaged) return []
  const values = args.filter(arg => arg.startsWith('--verify-international-features='))
    .flatMap(arg => arg.slice('--verify-international-features='.length).split(','))
  if (values.some(id => !INTERNATIONAL_AUTOMATION_FEATURES.includes(id))) throw new Error('无效的国际服验收功能')
  return [...new Set(values)]
}

export function featureAvailability(serverId, feature, { verificationFeatures = [] } = {}) {
  requireServerId(serverId)
  if (!Object.hasOwn(SERVER_FEATURES, feature)) return { available: false, reason: '未知功能' }
  if (serverId === 'cn') return { available: true, gameInputAvailable: true, state: 'verified', reason: '' }
  const readOnlyReasons = {
    account: '支持独立网页登录和赛季选择',
    'price-check': '支持手动粘贴英文物品查价；游戏内捕获暂未开放',
    recipe: '支持仓库读取与配方计算；自动取件暂未开放',
    'pob-export': '支持读取官网角色并导出 PoB',
    regex: '支持英文商店、地图与野兽正则'
  }
  if (readOnlyReasons[feature]) return { available: true, gameInputAvailable: false, state: 'verified', reason: readOnlyReasons[feature] }
  if (INTERNATIONAL_AUTOMATION_FEATURES.includes(feature)) {
    const testing = verificationFeatures.includes(feature)
    return { available: true, gameInputAvailable: testing, state: testing ? 'verification' : 'pending-client', reason: testing
      ? '开发版验收模式：仅在手动启动后运行，尚未完成英文客户端实测'
      : '已实现英文适配，可配置；游戏操作待实测，请使用开发版验收参数' }
  }
  return { available: false, reason: `${SERVER_FEATURES[feature]}尚未完成国际服英文客户端实测，暂不可用` }
}

export function serverContext(id = 'cn', options = {}) {
  return { ...getServer(id), capabilities: Object.fromEntries(Object.keys(SERVER_FEATURES).map(key => [key, featureAvailability(id, key, options)])) }
}

// 仅显式列出的通用字段跨服共享，坐标、进程、DPI 和业务状态保持独立。
export const SHARED_SETTINGS_FIELDS = Object.freeze([
  'globalShortcuts', 'shortcutScopeEnabled', 'operationDelayMs', 'operationTimingVersion', 'fixedTiming',
  'debugMode', 'updateMode', 'updateSource', 'windowCloseBehavior', 'windowClosePromptSuppressed',
  'overlaySettings', 'backgroundHistory', 'storyOverlayWidth', 'storyOverlayLayoutVersion', 'storyOverlayOpacity'
])

export function serverStorageKey(key, serverId) {
  requireServerId(serverId)
  return serverId === 'cn' || /^(?:mainWindowTheme|themePreference|toolSiteDirectory|featureModules)/.test(key)
    ? key : `server:${serverId}:${key}`
}
