export const FEATURE_MODULE_STORAGE_KEY = 'featureModules:v1'
export const FEATURE_MODULE_STORAGE_VERSION = 1
export const GLOBAL_SHORTCUT_KEYS = Object.freeze(['end'])

const feature = (definition) => Object.freeze({
  shortcutKeys: Object.freeze([]),
  relatedRoutes: Object.freeze([]),
  developmentOnly: false,
  ...definition
})

export const FEATURE_CATALOG = Object.freeze([
  feature({ id: 'items', label: '制作', route: '/items', icon: 'Box', shortcutKeys: Object.freeze(['itemStart']), relatedRoutes: Object.freeze(['/items']) }),
  feature({ id: 'bag', label: '存取', route: '/bag', icon: 'SuitcaseLine', relatedRoutes: Object.freeze(['/bag']) }),
  feature({ id: 'highlight-model-training', label: '模型训练', route: '/highlight-model-training', icon: 'DataAnalysis', developmentOnly: true, relatedRoutes: Object.freeze(['/highlight-model-training']) }),
  feature({ id: 'map', label: '地图', route: '/map', icon: 'MapLocation', shortcutKeys: Object.freeze(['mapStart']), relatedRoutes: Object.freeze(['/map']) }),
  feature({ id: 'combat', label: '战斗', route: '/combat', icon: 'FirstAidKit', shortcutKeys: Object.freeze(['portal']), relatedRoutes: Object.freeze(['/combat']) }),
  feature({ id: 'story', label: '剧情', route: '/story', icon: 'Notebook', shortcutKeys: Object.freeze(['storyPrevious', 'storyNext', 'storyTimerToggle']), relatedRoutes: Object.freeze(['/story']) }),
  feature({ id: 'regex', label: '正则', route: '/regex', icon: 'Operation', relatedRoutes: Object.freeze(['/regex']) }),
  feature({ id: 'recipe', label: '配方', route: '/recipe', icon: 'ShoppingBag', relatedRoutes: Object.freeze(['/recipe', '/shop']) }),
  feature({ id: 'craft-planner', label: '模拟', route: '/craft-planner', icon: 'SetUp', relatedRoutes: Object.freeze(['/craft-planner']) }),
  feature({ id: 'price-check', label: '查价', route: '/price-check', icon: 'Coin', shortcutKeys: Object.freeze(['priceCheck']), relatedRoutes: Object.freeze(['/price-check']) }),
  feature({ id: 'faustus', label: '浮士德', route: '/faustus', icon: 'PriceTag', relatedRoutes: Object.freeze(['/faustus']) }),
  feature({ id: 'puzzle', label: '海图', route: '/puzzle', icon: 'Guide', relatedRoutes: Object.freeze(['/puzzle']) }),
  feature({ id: 'tools', label: '工具站', route: '/tools', icon: 'Connection', relatedRoutes: Object.freeze(['/tools']) })
])

export function availableFeatureCatalog({ development = false } = {}) {
  return FEATURE_CATALOG.filter(item => development || !item.developmentOnly)
}

export function featureById(id, options) {
  return availableFeatureCatalog(options).find(item => item.id === id) || null
}

export function featureForRoute(path, options) {
  const normalized = String(path || '').split(/[?#]/, 1)[0]
  return availableFeatureCatalog(options).find(item => item.relatedRoutes.includes(normalized)) || null
}

export function shortcutFeatureId(key) {
  const normalized = String(key || '')
  return FEATURE_CATALOG.find(item => item.shortcutKeys.includes(normalized))?.id || null
}

export function filterFeatureShortcuts(shortcuts = {}, isEnabled = () => true) {
  return Object.fromEntries(Object.entries(shortcuts).filter(([key]) => {
    if (GLOBAL_SHORTCUT_KEYS.includes(key)) return true
    const featureId = shortcutFeatureId(key)
    return !featureId || isEnabled(featureId)
  }))
}
