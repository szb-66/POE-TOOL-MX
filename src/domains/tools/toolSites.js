export const TOOL_SITES_STORAGE_KEY = 'toolSiteDirectory'
export const TOOL_SITES_STORAGE_VERSION = 1

export const DEFAULT_TOOL_SITES = Object.freeze([
  { id: 'poe-cn-official', name: '流放之路国服官网', url: 'https://poe.qq.com/', description: '国服新闻、赛季资讯与游戏下载。', imageUrl: '' },
  { id: 'poe-cn-trade', name: '国服交易市集', url: 'https://poe.game.qq.com/trade', description: '搜索国服玩家公开出售的物品。', imageUrl: '' },
  { id: 'poe-global-official', name: 'Path of Exile 官网', url: 'https://www.pathofexile.com/', description: '国际服新闻、论坛与账号服务。', imageUrl: '' },
  { id: 'poe-global-trade', name: '国际服交易站', url: 'https://www.pathofexile.com/trade', description: '搜索国际服玩家公开出售的物品。', imageUrl: '' },
  { id: 'poedb', name: 'PoEDB 流亡编年史', url: 'https://poedb.tw/cn/', description: '查询物品、词缀、技能与赛季机制资料。', imageUrl: '' },
  { id: 'poe-wiki', name: 'PoE Wiki', url: 'https://www.poewiki.net/wiki/Path_of_Exile_Wiki', description: '社区维护的流放之路百科。', imageUrl: '' },
  { id: 'craft-of-exile', name: 'Craft of Exile', url: 'https://www.craftofexile.com/', description: '模拟装备制作并查询词缀权重。', imageUrl: '' },
  { id: 'poe-ninja', name: 'poe.ninja', url: 'https://poe.ninja/', description: '查看市场价格、热门构筑与角色数据。', imageUrl: '' },
  { id: 'filterblade', name: 'FilterBlade', url: 'https://www.filterblade.xyz/', description: '创建和定制 NeverSink 物品过滤器。', imageUrl: '' },
  { id: 'path-of-building', name: 'Path of Building', url: 'https://pathofbuilding.community/', description: '下载社区版角色构筑规划工具。', imageUrl: '' }
].map(site => Object.freeze(site)))

function cloneSites(sites) {
  return sites.map(site => ({ ...site }))
}

export function normalizeWebUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return ''
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    return url.toString()
  } catch {
    return ''
  }
}

export function validateToolSite(input = {}, sites = [], editingId = '') {
  const name = typeof input.name === 'string' ? input.name.trim() : ''
  const url = normalizeWebUrl(input.url)
  const rawImageUrl = typeof input.imageUrl === 'string' ? input.imageUrl.trim() : ''
  const imageUrl = rawImageUrl ? normalizeWebUrl(rawImageUrl) : ''
  const description = typeof input.description === 'string' ? input.description.trim() : ''
  const errors = {}

  if (!name) errors.name = '请输入站点名称'
  if (!url) errors.url = '请输入有效的 HTTP 或 HTTPS 地址'
  if (rawImageUrl && !imageUrl) errors.imageUrl = '图片地址仅支持 HTTP 或 HTTPS'
  if (url && sites.some(site => site.id !== editingId && normalizeWebUrl(site.url) === url)) {
    errors.url = '该站点地址已存在'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: { id: editingId || input.id || '', name, url, description, imageUrl }
  }
}

function parseStoredSites(value) {
  if (!value || value.version !== TOOL_SITES_STORAGE_VERSION || !Array.isArray(value.sites)) return null

  const ids = new Set()
  const urls = new Set()
  const sites = []
  for (const source of value.sites) {
    if (!source || typeof source.id !== 'string') return null
    const id = source.id.trim()
    if (!id || ids.has(id)) return null
    if (typeof source.description !== 'string' || typeof source.imageUrl !== 'string') return null
    const result = validateToolSite(source)
    if (!result.valid || urls.has(result.value.url)) return null
    ids.add(id)
    urls.add(result.value.url)
    sites.push({ ...result.value, id })
  }
  return sites
}

export function saveToolSites(sites, storage = globalThis.localStorage) {
  try {
    storage?.setItem(TOOL_SITES_STORAGE_KEY, JSON.stringify({
      version: TOOL_SITES_STORAGE_VERSION,
      sites
    }))
    return Boolean(storage)
  } catch {
    return false
  }
}

export function loadToolSites(storage = globalThis.localStorage) {
  let stored = null
  try {
    const raw = storage?.getItem(TOOL_SITES_STORAGE_KEY)
    if (raw != null) stored = parseStoredSites(JSON.parse(raw))
  } catch {
    stored = null
  }

  if (stored) return stored
  const defaults = cloneSites(DEFAULT_TOOL_SITES)
  saveToolSites(defaults, storage)
  return defaults
}

export function createToolSiteId() {
  if (globalThis.crypto?.randomUUID) return `tool-site-${globalThis.crypto.randomUUID()}`
  return `tool-site-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function addToolSite(sites, input, idFactory = createToolSiteId) {
  const validation = validateToolSite(input, sites)
  if (!validation.valid) return { success: false, errors: validation.errors, sites }
  const site = { ...validation.value, id: idFactory() }
  return { success: true, site, sites: [...sites, site], errors: {} }
}

export function updateToolSite(sites, id, input) {
  if (!sites.some(site => site.id === id)) {
    return { success: false, errors: { form: '未找到要编辑的站点' }, sites }
  }
  const validation = validateToolSite(input, sites, id)
  if (!validation.valid) return { success: false, errors: validation.errors, sites }
  const site = { ...validation.value, id }
  return {
    success: true,
    site,
    sites: sites.map(current => current.id === id ? site : current),
    errors: {}
  }
}

export function deleteToolSite(sites, id) {
  return sites.filter(site => site.id !== id)
}

export function moveToolSite(sites, fromIndex, toIndex) {
  if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex) ||
      fromIndex < 0 || toIndex < 0 || fromIndex >= sites.length || toIndex >= sites.length ||
      fromIndex === toIndex) return [...sites]
  const next = [...sites]
  const [site] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, site)
  return next
}

export function toolSiteImageCandidates(site = {}) {
  const candidates = []
  const customImage = normalizeWebUrl(site.imageUrl)
  if (customImage) candidates.push(customImage)
  const siteUrl = normalizeWebUrl(site.url)
  if (siteUrl) {
    const favicon = new URL('/favicon.ico', new URL(siteUrl).origin).toString()
    if (!candidates.includes(favicon)) candidates.push(favicon)
  }
  return candidates
}
