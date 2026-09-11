import { createHash } from 'node:crypto'
import { load } from 'cheerio'

export const SANCTUM_RELIC_PAGES = Object.freeze(['Relics', 'Censer_Relic', 'Processional_Relic',
  'Candlestick_Relic', 'Urn_Relic', 'Coffer_Relic', 'Tome_Relic', 'Papyrus_Relic'])
export const relicEntryDigest = entry => createHash('sha256').update(JSON.stringify({
  id: entry.id, name: entry.name, aliases: entry.aliases, width: entry.width, height: entry.height,
  baseIds: entry.baseIds, baseId: entry.baseId, descriptions: entry.descriptions, variants: entry.variants
})).digest('hex')

const plain = ($, element) => {
  const node = $(element).clone()
  node.find('br').replaceWith('\n')
  return node.text().replace(/\s+/g, ' ').trim()
}
const unknown = { applicability: 'unverified', reviewedPatch: null, ruleSupport: 'unreviewed' }

export function parseSanctumRelicSources(sources) {
  if (!SANCTUM_RELIC_PAGES.every(id => sources[id]?.html && sources[id]?.fetchedAt)) throw new Error('圣物来源快照不完整')
  const listing = load(sources.Relics.html)
  const baseListings = new Map()
  listing('[id="遗物物品"] .flex-grow-1 a.Relic').each((_, element) => {
    const name = listing(element).text().trim(), page = listing(element).attr('href')?.replace(/^\/cn\//, '')
    const metadata = decodeURIComponent(listing(element).attr('data-hover') || '').match(/SanctumRelic\dx\d/)?.[0]
    if (metadata) baseListings.set(page, { name, metadata })
  })
  const entries = [], modifiers = new Map()
  for (const page of SANCTUM_RELIC_PAGES.slice(1)) {
    const listed = baseListings.get(page)
    if (!listed) throw new Error(`底材不在当前遗物列表：${page}`)
    const $ = load(sources[page].html)
    const rows = $('table').first().find('tbody tr').map((_, row) => ({
      key: $(row).find('td').first().text().trim(), value: $(row).find('td').eq(1).text().trim()
    })).get()
    const metadata = rows.find(row => row.key === 'Type')?.value
    const shape = metadata?.match(/^Metadata\/Items\/Relics\/(SanctumRelic(\d)x(\d))$/)
    const names = rows.filter(row => row.key === 'BaseType').map(row => row.value)
    if (!shape || shape[1] !== listed.metadata || !names.includes(listed.name)) throw new Error(`底材元数据与列表不一致：${page}`)
    const baseId = `base:${shape[1]}`
    entries.push({ id: baseId, kind: 'base', name: listed.name, aliases: names.filter(name => name !== listed.name),
      width: Number(shape[2]), height: Number(shape[3]), descriptions: [], sourceId: page, ...unknown })
    const modRows = $('[id="圣物Mods"] tbody tr')
    if (!modRows.length) throw new Error(`缺少圣物词缀表：${page}`)
    modRows.each((_, row) => {
      const nodes = $(row).find('.explicitMod')
      if (nodes.length !== 1) throw new Error('圣物复合词缀需单独核对')
      const node = nodes.first(), copy = node.clone(), ranges = []
      copy.find('.mod-value').each((_, span) => {
        const numbers = $(span).text().match(/-?\d+(?:\.\d+)?/g)?.map(Number)
        if (!numbers?.length || numbers.length > 2) throw new Error('圣物词缀数值格式变化')
        ranges.push([Math.min(...numbers), Math.max(...numbers)])
        $(span).replaceWith('#')
      })
      const template = plain($, copy)
      // Fixed numeric modifiers are also scalar roll variants.
      const normalized = ranges.length ? template : template.replace(/\d+(?:\.\d+)?/g, value => { ranges.push([Number(value), Number(value)]); return '#' })
      const family = `modifier:${createHash('sha256').update(normalized).digest('hex').slice(0, 16)}`
      const value = modifiers.get(family) || { id: family, kind: 'modifier', name: normalized, aliases: [],
        baseIds: [], descriptions: [normalized], variants: [], sourceId: page, sourceIds: [], ...unknown }
      if (!value.baseIds.includes(baseId)) value.baseIds.push(baseId)
      if (!value.sourceIds.includes(page)) value.sourceIds.push(page)
      const variant = { baseId, ranges, rawText: plain($, node), level: Number($(row).find('td').eq(1).text()),
        generation: $(row).find('td').eq(2).text().trim() }
      if (!value.variants.some(existing => JSON.stringify(existing) === JSON.stringify(variant))) value.variants.push(variant)
      modifiers.set(family, value)
    })
  }
  entries.push(...modifiers.values())
  listing('[id="遗物传奇"] .flex-grow-1').each((_, element) => {
    const node = listing(element), name = node.find('.uniqueName').text().trim(), baseName = node.find('.uniqueTypeLine').text().trim()
    const base = entries.find(entry => entry.kind === 'base' && entry.name === baseName)
    const href = node.find('a.UniqueItem').attr('href')
    const descriptions = node.find('.explicitMod').map((_, mod) => plain(listing, mod)).get()
    if (!name || !base || !href || !descriptions.length) throw new Error('传奇圣物条目不完整')
    entries.push({ id: `unique:${href.replace(/^\/cn\//, '')}`, kind: 'unique', name, aliases: [], baseId: base.id,
      descriptions, sourceId: 'Relics', ...unknown })
  })
  if (!entries.some(entry => entry.kind === 'unique')) throw new Error('传奇圣物列表为空')
  return entries
}

export function applySanctumCatalogReviews(catalog, reviews) {
  return { ...catalog, entries: catalog.entries.map(entry => {
    const review = reviews.entries?.[entry.id]
    if (reviews.patch !== catalog.patch || !review || review.digest !== relicEntryDigest(entry)) return { ...entry,
      applicability: entry.applicability === 'current' ? 'unverified' : entry.applicability,
      reviewedPatch: null, ruleSupport: 'unreviewed', reviewEvidence: null }
    return { ...entry, applicability: 'current', reviewedPatch: reviews.patch, aliases: [...entry.aliases, ...(review.aliases || [])],
      ...(entry.kind === 'room' && ['fountain', 'merchant', 'pact', 'reward', 'treasure'].includes(review.roomType) ? { roomType: review.roomType } : {}),
      ruleSupport: review.ruleSupport, reviewEvidence: review.evidence }
  }) }
}
