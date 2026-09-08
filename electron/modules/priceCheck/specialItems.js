import { resolveCatalogStat } from './catalog.js'

export const SPECIAL_DISCRIMINATORS = ['alt_x', 'alt_y', 'alt_z', 'blighted', 'uberblighted']
export const isLogbookStat = (stat) => /^pseudo\.pseudo_logbook_(?:area|faction)_/.test(stat.id)

export function resolveSpecialItemIdentity(item, catalog) {
  let candidates
  let displayName
  if (item.blightType) {
    displayName = `${item.blightType === 'uberblighted' ? '菌潮灭绝' : '菌潮'}地图（${item.areaName || '未知'}）`
    candidates = (catalog.items || []).filter((entry) => entry.discriminator === item.blightType && entry.text === displayName)
  } else if (item.category?.includes('宝石')) {
    displayName = item.name
    candidates = (catalog.items || []).filter((entry) => entry.category === 'gem' &&
      /^alt_[xyz]$/.test(entry.discriminator) && entry.text === displayName)
    if (!candidates.length && !item.gemVariant && !/^特拉特斯之/.test(displayName)) return null
  } else return null
  const unique = [...new Map(candidates.map((entry) => [`${entry.baseType}\0${entry.discriminator}`, entry])).values()]
  if (unique.length !== 1) throw new Error(`无法唯一识别特殊物品“${displayName}”，已阻止按普通版本误查`)
  return { type: unique[0].baseType, discriminator: unique[0].discriminator, displayName }
}

export function addLogbookStats(model, regions, catalog, enabled) {
  const seen = new Set()
  for (const region of regions || []) {
    for (const [kind, text] of [['区域', region.area], ['派系', region.faction]]) {
      const label = `有日志${kind}：${text}`
      const resolution = resolveCatalogStat(catalog, label, 'pseudo')
      const match = resolution.match
      if (!match || !isLogbookStat(match)) {
        if (seen.has(label)) continue
        seen.add(label)
        model.unknownStats.push({ key: `logbook:${label}`, type: 'pseudo', text: label,
          reason: '官方交易目录无法唯一映射该日志区域或派系', candidates: [] })
        continue
      }
      if (seen.has(match.id)) continue
      seen.add(match.id)
      model.stats.push({ key: match.id, id: match.id, type: 'pseudo', text: kind === '区域' ? text : label,
        label, enabled, values: [], valueMultiplier: 1, sources: [], refs: match.refs || [] })
    }
  }
}
