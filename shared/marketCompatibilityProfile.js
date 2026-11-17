export const MARKET_STRUCTURE_ABI = 'poe1-market-json16-msvc-string32-v1'
export const MARKET_STRUCTURE_METHODS = ['lookup', 'searchBuilder', 'stringCtor', 'stringDtor', 'itemsReader', 'statsReader', 'filtersReader']
const fixedLabels = {
  stats: new Set(['pseudo', 'explicit', 'implicit', 'fractured', 'crafted', 'enchant', 'veiled', 'monster', 'crucible', 'necropolis', 'scourge']),
  items: new Set(['weapon', 'armour', 'accessory', 'gem', 'jewel', 'flask', 'map', 'currency', 'card'])
}

export function isFixedMarketLabel(rule) {
  return rule?.field === 'label' && fixedLabels[rule.section]?.has(rule.id) === true
}

export function validateMarketStructureProfile(profile) {
  if (profile?.schemaVersion !== 1 || profile.game !== 'poe1' || profile.validatedInGame !== true
    || profile.structureVersion !== 1 || profile.abi !== MARKET_STRUCTURE_ABI
    || !/^\d{1,20}$/.test(profile.buildId || '') || !/^[a-zA-Z0-9._-]{1,64}$/.test(profile.gameVersion || '')
    || !/^[a-f0-9]{64}$/.test(profile.sha256 || '')) throw new Error('市集兼容资料缺少已验收的结构基准')
  for (const name of MARKET_STRUCTURE_METHODS) {
    const method = profile[name]
    if (!method || !/^0x[0-9a-f]{1,8}$/i.test(method.rva || '') || !/^(?:[a-f0-9]{2}){64,128}$/i.test(method.prologue || '')
      || !Number.isSafeInteger(method.bodySize) || method.bodySize < method.prologue.length / 2 || method.bodySize > 8 * 1024 * 1024
      || !/^[a-f0-9]{64}$/.test(method.bodySha256 || '')) throw new Error(`市集兼容资料缺少 ${name} 完整函数指纹`)
  }
  return profile
}

export function validateMarketCatalogSource(catalog, profile) {
  if (catalog?.schemaVersion !== 1 || !Array.isArray(catalog.rules) || !catalog.rules.length || catalog.rules.length > 100000)
    throw new Error('市集翻译词库格式无效')
  if (catalog.game !== 'poe1' || catalog.sourceLocale !== 'fr' || catalog.buildId !== profile.buildId
    || catalog.gameVersion !== profile.gameVersion || catalog.executableSha256 !== profile.sha256)
    throw new Error('市集翻译词库与兼容基准来源不匹配，请更新完整词库')
  if (catalog.localizationReleaseId !== undefined && (typeof catalog.localizationReleaseId !== 'string'
    || !/^[a-zA-Z0-9._-]{1,120}$/.test(catalog.localizationReleaseId))) throw new Error('市集翻译词库资源版本标识无效')
  for (const rule of catalog.rules) {
    if (rule?.section !== 'stats' && rule?.section !== 'items') continue
    if (isFixedMarketLabel(rule) && rule.source === undefined) continue
    if (typeof rule.source !== 'string' || !rule.source.trim() || rule.source.includes('\0') || rule.source.length > 65536
      || (rule.section === 'stats' && (typeof rule.id !== 'string' || !rule.id || rule.id.includes('\0'))))
      throw new Error('市集动态词库缺少精确原文证据，请更新完整目录后重试')
  }
  return catalog
}
