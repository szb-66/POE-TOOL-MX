import { load } from 'cheerio'
import { createHash } from 'node:crypto'
import { SEASON_BASELINE } from '../../shared/seasonBaseline.js'

export const SANCTUM_CATALOG_URL = 'https://poedb.tw/cn/Sanctum_league'

export function parseSanctumCatalogHtml(html, { fetchedAt, url = SANCTUM_CATALOG_URL } = {}) {
  if (url !== SANCTUM_CATALOG_URL || !Number.isFinite(Date.parse(fetchedAt))) throw new Error('圣所目录来源或采集时间无效')
  const $ = load(html), entries = []
  for (const [section, kind] of [['恩赐', 'boon'], ['Affliction', 'affliction'], ['Rooms', 'room']]) {
    $(`[id="${section}"] .flex-grow-1`).each((index, element) => {
      const node = $(element)
      const name = node.contents().filter((_, child) => child.type === 'text').first().text().trim()
      if (!name) return
      const descriptions = node.find('.explicitMod').map((_, child) => $(child).text().trim()).get()
      const icon = node.parent().find('img').first().attr('alt')
      const label = node.children('div').not('.explicitMod').first().text().trim()
      const tier = /^(主要|次要)(恩赐|痛苦)$/.test(label) ? (label.startsWith('主要') ? 'major' : 'minor') : null
      entries.push({ id: `${kind}:${icon || index}`, kind, name, aliases: [], descriptions,
        ...(['boon','affliction'].includes(kind) ? {tier} : {}),
        sourceId: 'poedb-sanctum', applicability: 'unverified', reviewedPatch: null, ruleSupport: 'unreviewed' })
    })
  }
  $('#Rewards tbody tr').each((index, element) => {
    const node = $(element).find('td').first()
    const name = node.find('a').first().text().trim() || node.text().trim()
    if (name) entries.push({ id: `reward:${index}`, kind: 'reward', name, aliases: [], descriptions: [node.text().trim()],
      sourceId: 'poedb-sanctum', applicability: 'unverified', reviewedPatch: null, ruleSupport: 'unreviewed' })
  })
  $('#Floors .flex-grow-1').each((index, element) => {
    const name = $(element).contents().filter((_, child) => child.type === 'text').first().text().trim()
    const links = $('[id="圣地地区"] a[href]')
    const href = links.filter((_, link) => $(link).text().trim() === name).first().attr('href')
    // Only names pointing to the exact same source area may be aliases. Similar
    // Chinese names alone are insufficient to establish a shared floor identity.
    const aliases = href ? [...new Set(links.filter((_, link) => $(link).attr('href') === href).map((_, link) => $(link).text().trim()).get())].filter(alias => alias !== name) : []
    entries.push({ id: `floor:${index}`, kind: 'floor', name, aliases, descriptions: [], sourceId: 'poedb-sanctum',
      applicability: 'unverified', reviewedPatch: null, ruleSupport: 'unreviewed' })
  })
  if (!['boon', 'affliction', 'room', 'reward'].every(kind => entries.some(entry => entry.kind === kind))) throw new Error('圣所目录页面结构不完整；保留旧目录')
  // Common room categories repeat once per floor in the source table. They
  // describe one category, not distinct ambiguous entries. Shared effect icons
  // also contain real variants; retain those with content-specific IDs so name
  // matching remains ambiguous instead of silently picking a variant.
  const groups = new Map()
  for (const entry of entries) {
    if (!groups.has(entry.id)) groups.set(entry.id, new Map())
    groups.get(entry.id).set(JSON.stringify(entry), entry)
  }
  const unique = [...groups.values()].flatMap(group => [...group.entries()].map(([content, entry]) => group.size === 1 ? entry
    : { ...entry, id: `${entry.id}:${createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(entry).filter(([key]) => key !== 'tier')))).digest('hex').slice(0, 16)}` }))
  return { schemaVersion: 1, game: 'poe1', patch: SEASON_BASELINE.patch, generatedAt: fetchedAt,
    sources: [{ id: 'poedb-sanctum', url, fetchedAt, channel: 'official', sha256: createHash('sha256').update(html).digest('hex') }],
    entries: unique, notes: ['正式站数据表与社区历史说明分开；本快照尚未逐项核对适用赛季，不作为当前规则证据。'] }
}
