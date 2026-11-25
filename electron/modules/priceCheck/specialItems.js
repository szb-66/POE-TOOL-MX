import { resolveCatalogStat } from './catalog.js'
import { resolvePriceCheckCategory } from '../../../shared/priceCheckMetadata.js'

export const SPECIAL_DISCRIMINATORS = ['alt_x', 'alt_y', 'alt_z', 'blighted', 'uberblighted', 'scrying_orb']
export const isLogbookStat = (stat) => /^pseudo\.pseudo_logbook_(?:area|faction)_/.test(stat.id)

export function resolveSpecialItemIdentity(item, catalog) {
  const category = resolvePriceCheckCategory(item.category)?.category
  const catalogCategory = category?.startsWith('gem.') ? 'gem' : category
  const allowed = catalogCategory === 'gem' ? ['alt_x', 'alt_y', 'alt_z']
    : catalogCategory === 'map' ? ['blighted', 'uberblighted']
      : catalogCategory === 'currency' ? ['scrying_orb'] : []
  if (!allowed.length) return null

  const displayNames = new Set([item.baseName, item.name].filter(Boolean))
  let displayName = item.baseName || item.name
  if (catalogCategory === 'map' && item.blightType) {
    displayName = `${item.blightType === 'uberblighted' ? '菌潮灭绝' : '菌潮'}地图（${item.areaName || '未知'}）`
    displayNames.add(displayName)
    displayNames.add(`${item.blightType === 'uberblighted' ? 'Blight-ravaged' : 'Blighted'} Map (${item.areaName || 'Unknown'})`)
  }
  const candidates = (catalog.items || []).filter((entry) => entry.category === catalogCategory &&
    allowed.includes(entry.discriminator) && (!item.blightType || entry.discriminator === item.blightType) &&
    displayNames.has(entry.text))
  if (!candidates.length && !item.blightType &&
    !(catalogCategory === 'gem' && (item.gemVariant || /^特拉特斯之/.test(displayName)))) return null
  const unique = [...new Map(candidates.map((entry) => [`${entry.baseType}\0${entry.discriminator}`, entry])).values()]
  if (unique.length !== 1) throw new Error(`无法唯一识别特殊物品“${displayName}”，已阻止按普通版本误查`)
  return { type: unique[0].baseType, discriminator: unique[0].discriminator, displayName: unique[0].text }
}

export function addLogbookStats(model, regions, catalog, enabled) {
  const seen = new Set()
  const english = catalog?.locale === 'en'
  for (const region of regions || []) {
    for (const [kind, enKind, text] of [['区域', 'Area', region.area], ['派系', 'Faction', region.faction]]) {
      const label = `有日志${kind}：${text}`
      const lookup = english ? `Has Logbook ${enKind}: ${text}` : label
      const resolution = resolveCatalogStat(catalog, lookup, 'pseudo')
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
