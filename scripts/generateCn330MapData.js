import { readFile, writeFile, rename } from 'node:fs/promises'
import { load } from 'cheerio'
import internationalMapData from '../src/data/internationalMapData.js'
import { ATLAS_MAP_AFFIX_SUGGESTIONS as LEGACY_ATLAS } from '../src/data/mapAffixSuggestionsData.js'
import { HEIST_AFFIX_SUGGESTIONS as LEGACY_HEIST } from '../src/data/heistAffixSuggestionsData.js'

const PAGES = [
  ['atlas', 'Maps_low_tier', 5],
  ['atlas', 'Maps_mid_tier', 5],
  ['atlas', 'Maps_top_tier', 5],
  ['atlas', 'Maps_uber_tier', 5],
  ['heist', 'Contracts', 22],
  ['heist', 'Blueprints', 22]
]

const REWARD_EN = /^(?:\+?\(?[\d. —–-]+\)?%\s+)?(?:increased (?:Atlas Drops in this Area|Rarity of Items found in this Area|Pack size)|more (?:Maps|Threads|Currency) found in Area)$/i
const REWARD_CN = /^(?:区域内的异界图鉴掉落提高|该区域物品掉落数量提高|该地图的物品稀有度提高|怪物群规模扩大|区域内找到的(?:地图|通货|丝线|圣甲虫)(?:数量)?总增)/
const VARIABLE_NUMBER = /[+-]?\(?[+-]?\d+(?:[\u2014-][+-]?\d+)?\)?%?/g
const EDGE_PUNCTUATION = /^[\s+()\uff08\uff09,%\u2014\-\uff0c\u3002:：]+|[\s+()\uff08\uff09,%\u2014\-\uff0c\u3002:：]+$/g

const shapeEn = value => value
  .replace(/\(-([\d.]+)[—–-]-([\d.]+)\)/g, '-($1—$2)')
  .replace(/\(?\d+(?:\.\d+)?(?:\s*[—–-]\s*\d+(?:\.\d+)?)?\)?/g, '#')

const shapeCn = value => String(value || '').replace(VARIABLE_NUMBER, '#').replace(/\s+/g, ' ').trim()

function stableCnSegment(pattern) {
  return pattern
    .split('#')
    .map(part => part.replace(EDGE_PUNCTUATION, '').trim())
    .filter(part => part.length >= 2 && !/\d/.test(part))
    .sort((left, right) => right.length - left.length || left.localeCompare(right, 'zh-CN'))[0] || ''
}

function linesOf(html, isCn, domain) {
  const q = load(html || '')
  q('.secondary,.badge').remove()
  q('br').replaceWith('\n')
  return q.root().text()
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter(line => domain !== 5 || !(isCn ? REWARD_CN : REWARD_EN).test(line))
}

function parseMods(html, domain, isCn) {
  const raw = html.match(/new ModsView\((\{[^\n]+\})\)/)?.[1]
  if (!raw) throw new Error('页面缺少 ModsView 数据')
  const data = JSON.parse(raw)
  if (data.opt?.ModDomainsID !== domain || !Array.isArray(data.normal)) {
    throw new Error(`词缀域不匹配：期望 ${domain}，实际 ${data.opt?.ModDomainsID}`)
  }
  return data.normal
    .filter(mod => Number(mod.DropChance) > 0 && ['1', '2'].includes(String(mod.ModGenerationTypeID)))
    .map(mod => ({
      key: `${(mod.ModFamilyList || []).join(',')}|${mod.ModGenerationTypeID}|${mod.Level}|${mod.DropChance}`,
      affixType: String(mod.ModGenerationTypeID) === '1' ? 'prefix' : 'suffix',
      lines: linesOf(mod.str, isCn, domain),
      tags: (mod.mod_no || []).map(tag => load(tag).root().text().trim()).filter(Boolean)
    }))
}

async function fetchHtml(url) {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': 'ExileHelper/1.0 personal-data-refresh' },
        signal: AbortSignal.timeout(30000)
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.text()
    } catch (error) {
      if (attempt === 5) throw error
      await new Promise(resolve => setTimeout(resolve, attempt * 1500))
    }
  }
}

function buildCnCatalog(kind, pairedRecords, legacyCatalog) {
  const legacyByVariant = new Map()
  const legacyValues = legacyCatalog.map(entry => entry.value)
  for (const entry of legacyCatalog) {
    for (const variant of entry.variants || [entry.example]) {
      legacyByVariant.set(shapeCn(variant), entry.value)
    }
  }

  const byCanonical = new Map()
  for (const record of pairedRecords) {
    const entry = byCanonical.get(record.canonicalId) || {
      canonicalId: record.canonicalId,
      types: new Set(),
      tags: new Set(),
      variants: new Set()
    }
    entry.types.add(record.affixType)
    for (const tag of record.tags) entry.tags.add(tag)
    entry.variants.add(record.cnLine)
    byCanonical.set(record.canonicalId, entry)
  }

  // Group by CN pattern in case multiple canonical IDs share identical CN shape? Keep canonicalId unique!
  const entries = []
  const usedValues = new Set()

  const rawEntries = [...byCanonical.values()].map(group => {
    const variants = [...group.variants].sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true }))
    const example = variants[variants.length - 1]
    const pattern = shapeCn(example)
    const affixType = group.types.size === 1 ? [...group.types][0] : 'mixed'
    const tags = [...group.tags].sort((a, b) => a.localeCompare(b, 'zh-CN'))
    const legacyExact = legacyByVariant.get(pattern)
    const legacyMatch = legacyExact && variants.every(v => v.includes(legacyExact))
      ? legacyExact
      : legacyValues.find(v => !/\d/.test(v) && variants.every(line => line.includes(v)) && variants.some(line => shapeCn(line).includes(v)))
    const candidateValue = legacyMatch || stableCnSegment(pattern)
    return { canonicalId: group.canonicalId, pattern, value: candidateValue, example, affixType, tags, variants }
  })

  // Resolve any duplicate candidate values deterministically by picking a longer/unique stable segment
  const counts = new Map()
  for (const entry of rawEntries) counts.set(entry.value, (counts.get(entry.value) || 0) + 1)

  for (const entry of rawEntries) {
    let value = entry.value
    if ((counts.get(value) || 0) > 1 || usedValues.has(value) || !entry.variants.every(v => v.includes(value))) {
      // Find all non-digit segments of pattern sorted by length desc
      const segments = entry.pattern
        .split('#')
        .map(part => part.replace(EDGE_PUNCTUATION, '').trim())
        .filter(part => part.length >= 2 && !/\d/.test(part) && entry.variants.every(v => v.includes(part)))
        .sort((a, b) => b.length - a.length || a.localeCompare(b, 'zh-CN'))
      const picked = segments.find(seg => !usedValues.has(seg))
      if (picked) {
        value = picked
      } else if (!/\d/.test(entry.example) && !usedValues.has(entry.example)) {
        value = entry.example
      }
    }
    if (!value || /\d/.test(value) || !entry.variants.every(v => v.includes(value))) {
      throw new Error(`${kind} 词缀无法提取稳定中文子串: ${entry.canonicalId} -> ${entry.example}`)
    }
    if (usedValues.has(value)) {
      // Merge canonical aliases if two English patterns genuinely map to the same CN text
      const existing = entries.find(e => e.value === value)
      if (existing) {
        existing.canonicalIds = [...new Set([...(existing.canonicalIds || [existing.canonicalId]), entry.canonicalId])]
        existing.variants = [...new Set([...existing.variants, ...entry.variants])].sort((a, b) => a.localeCompare(b, 'zh-CN'))
        existing.tags = [...new Set([...existing.tags, ...entry.tags])].sort((a, b) => a.localeCompare(b, 'zh-CN'))
        if (existing.affixType !== entry.affixType) existing.affixType = 'mixed'
        continue
      }
    }
    usedValues.add(value)
    entries.push({
      canonicalId: entry.canonicalId,
      value,
      example: entry.example,
      affixType: entry.affixType,
      tags: entry.tags,
      variants: entry.variants
    })
  }

  return entries.sort((a, b) => a.value.localeCompare(b.value, 'zh-CN'))
}

async function main() {
  const paired = { atlas: [], heist: [] }
  const sourceCounts = { atlas: [], heist: [] }

  for (const [kind, page, domain] of PAGES) {
    const [cnHtml, usHtml] = await Promise.all([
      fetchHtml(`https://poedb.tw/cn/${page}`),
      fetchHtml(`https://poedb.tw/us/${page}`)
    ])
    const cnMods = parseMods(cnHtml, domain, true)
    const usMods = parseMods(usHtml, domain, false)
    sourceCounts[kind].push({ url: `https://poedb.tw/cn/${page}`, mods: cnMods.length })

    const enByTemplate = new Map(internationalMapData[kind].map(entry => [entry.pattern, entry.id]))
    const cnByKey = new Map()
    const usByKey = new Map()
    for (const mod of cnMods) {
      if (!cnByKey.has(mod.key)) cnByKey.set(mod.key, [])
      cnByKey.get(mod.key).push(mod)
    }
    for (const mod of usMods) {
      if (!usByKey.has(mod.key)) usByKey.set(mod.key, [])
      usByKey.get(mod.key).push(mod)
    }

    for (const [key, usList] of usByKey) {
      const cnList = cnByKey.get(key) || []
      if (usList.length !== cnList.length) continue
      for (let i = 0; i < usList.length; i += 1) {
        if (usList[i].lines.length !== cnList[i].lines.length) continue
        for (let j = 0; j < usList[i].lines.length; j += 1) {
          const canonicalId = enByTemplate.get(shapeEn(usList[i].lines[j]))
          if (!canonicalId) continue
          paired[kind].push({
            canonicalId,
            affixType: cnList[i].affixType,
            tags: cnList[i].tags,
            cnLine: cnList[i].lines[j]
          })
        }
      }
    }
  }

  const atlasEntries = buildCnCatalog('atlas', paired.atlas, LEGACY_ATLAS)
  const heistEntries = buildCnCatalog('heist', paired.heist, LEGACY_HEIST)

  const mappedAtlasIds = new Set(atlasEntries.flatMap(e => e.canonicalIds || [e.canonicalId]))
  const mappedHeistIds = new Set(heistEntries.flatMap(e => e.canonicalIds || [e.canonicalId]))
  console.log(`Atlas mapped: ${mappedAtlasIds.size}/${internationalMapData.atlas.length}, CN entries: ${atlasEntries.length}`)
  console.log(`Heist mapped: ${mappedHeistIds.size}/${internationalMapData.heist.length}, CN entries: ${heistEntries.length}`)
  if (mappedAtlasIds.size !== internationalMapData.atlas.length) {
    throw new Error(`Atlas 映射不完整：${mappedAtlasIds.size}/${internationalMapData.atlas.length}`)
  }
  if (mappedHeistIds.size !== internationalMapData.heist.length) {
    throw new Error(`Heist 映射不完整：${mappedHeistIds.size}/${internationalMapData.heist.length}`)
  }

  const snapshotDate = new Date().toISOString().slice(0, 10)

  // Write mapAffixSuggestionsData.js
  const atlasCode = `// POE1 3.30.0 异界地图可洗显式词缀离线快照（由 scripts/generateCn330MapData.js 生成）。
// 来源为 POEDB 简体中文低、中、高阶及 Uber 异界地图词缀页，并附带与国际服 3.30.0 对齐的 canonicalId。

export const ATLAS_MAP_AFFIX_CATALOG_META = Object.freeze({
  game: 'poe1',
  gameVersion: '3.30.0',
  locale: 'zh-CN',
  snapshotDate: '${snapshotDate}',
  source: 'POEDB 国服简体中文地图词缀快照',
  sourceUrl: 'https://poedb.tw/cn/Maps_uber_tier',
  sourceUrls: Object.freeze([
    'https://poedb.tw/cn/Maps_low_tier',
    'https://poedb.tw/cn/Maps_mid_tier',
    'https://poedb.tw/cn/Maps_top_tier',
    'https://poedb.tw/cn/Maps_uber_tier'
  ])
})

const candidate = (value, example, affixType, tags, variants = [example], canonicalId = '', canonicalIds = null) => Object.freeze({
  ...(canonicalId ? { canonicalId } : {}),
  ...(canonicalIds ? { canonicalIds: Object.freeze(canonicalIds) } : {}),
  value,
  example,
  affixType,
  tags: Object.freeze(tags),
  variants: Object.freeze(variants)
})

export const ATLAS_MAP_AFFIX_SUGGESTIONS = Object.freeze([
${atlasEntries.map(e => `  candidate(${JSON.stringify(e.value)}, ${JSON.stringify(e.example)}, ${JSON.stringify(e.affixType)}, ${JSON.stringify(e.tags)}, ${JSON.stringify(e.variants)}, ${JSON.stringify(e.canonicalId)}${e.canonicalIds ? `, ${JSON.stringify(e.canonicalIds)}` : ''})`).join(',\n')}
])
`
  const atlasTarget = new URL('../src/data/mapAffixSuggestionsData.js', import.meta.url)
  await writeFile(new URL(`${atlasTarget.href}.next`), atlasCode)
  await rename(new URL(`${atlasTarget.href}.next`), atlasTarget)

  // Write heistAffixSuggestionsData.js
  const heistMeta = {
    game: 'poe1',
    gameVersion: '3.30.0',
    locale: 'zh-CN',
    snapshotDate,
    source: 'POEDB 简体中文契约蓝图普通词缀快照',
    sourceUrls: ['https://poedb.tw/cn/Contracts', 'https://poedb.tw/cn/Blueprints'],
    sourceCounts: sourceCounts.heist
  }
  const heistCode = `// 由 scripts/generateCn330MapData.js 生成。请运行该脚本更新快照。
export const HEIST_AFFIX_CATALOG_META = Object.freeze(${JSON.stringify(heistMeta, null, 2)})

export const HEIST_AFFIX_SUGGESTIONS = Object.freeze(${JSON.stringify(heistEntries, null, 2)}.map(entry => Object.freeze({
  ...entry, tags: Object.freeze(entry.tags), variants: Object.freeze(entry.variants)${heistEntries.some(e => e.canonicalIds) ? ', ...(entry.canonicalIds ? { canonicalIds: Object.freeze(entry.canonicalIds) } : {})' : ''}
})))
`
  const heistTarget = new URL('../src/data/heistAffixSuggestionsData.js', import.meta.url)
  await writeFile(new URL(`${heistTarget.href}.next`), heistCode)
  await rename(new URL(`${heistTarget.href}.next`), heistTarget)

  // Write shared/crossServerMapAffixData.js for Electron main + renderer
  const packShared = (cnList, enList) => {
    const enById = new Map(enList.map(e => [e.id, e]))
    const rows = []
    for (const cn of cnList) {
      const ids = cn.canonicalIds?.length ? cn.canonicalIds : (cn.canonicalId ? [cn.canonicalId] : [])
      for (const id of ids) {
        const en = enById.get(id)
        if (!en) continue
        rows.push({
          id,
          cn: cn.value,
          cnExample: cn.example,
          cnVariants: cn.variants || [cn.example],
          en: en.value,
          enPattern: en.pattern,
          enVariants: en.variants || [en.example]
        })
      }
    }
    return rows
  }
  const sharedMapData = {
    atlas: packShared(atlasEntries, internationalMapData.atlas),
    heist: packShared(heistEntries, internationalMapData.heist)
  }
  const sharedTarget = new URL('../shared/crossServerMapAffixData.js', import.meta.url)
  await writeFile(new URL(`${sharedTarget.href}.next`), `// Generated by scripts/generateCn330MapData.js; shared by Electron main and renderer.\nexport default ${JSON.stringify(sharedMapData, null, 2)}\n`)
  await rename(new URL(`${sharedTarget.href}.next`), sharedTarget)

  // Generate 3.30.0 CN beastData.js with BEAST_CANONICAL_MAP
  const cnCatalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.json', import.meta.url), 'utf8'))
  const cnBeastNames = [...new Set(cnCatalog.items.filter(item => item.category === 'monster').map(item => item.name || item.baseType).filter(Boolean))]
  const bestiaryHtml = await fetchHtml('https://poedb.tw/cn/Bestiary_league')
  const $ = load(bestiaryHtml)
  const bySlug = new Map()
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const slug = decodeURIComponent(href.split('/').at(-1) || '')
    const txt = $(el).text().trim()
    if (slug && txt && !bySlug.has(slug)) bySlug.set(slug, txt)
  })
  const canonicalEntries = internationalMapData.beasts.map(beast => {
    const cnName = bySlug.get(beast.id)
    if (!cnName) throw new Error(`缺少野兽中文映射：${beast.id}`)
    return { id: beast.id, enName: beast.name, cnName }
  })
  for (const entry of canonicalEntries) {
    if (!cnBeastNames.includes(entry.cnName)) cnBeastNames.push(entry.cnName)
  }
  const beastCode = `// 来源：国服官方交易物品目录本地快照（catalog.json，3.30.0）与 POEDB 传奇魔物跨服映射。
// monster 类均为可交易的封印野兽，包括普通兽及旧版可流通野兽；不能仅按四大家族前缀筛选。
export const BEAST_NAMES = Object.freeze(${JSON.stringify(cnBeastNames, null, 2)})

// 国际服 3.30.0 传奇红兽/首领 ID（PoEDB slug）与国服中文名称的一一对应表。
export const BEAST_CROSS_SERVER_ENTRIES = Object.freeze(${JSON.stringify(canonicalEntries, null, 2)}.map(entry => Object.freeze(entry)))
`
  const beastTarget = new URL('../src/domains/regex/beastData.js', import.meta.url)
  await writeFile(new URL(`${beastTarget.href}.next`), beastCode)
  await rename(new URL(`${beastTarget.href}.next`), beastTarget)
  console.log(`Beasts generated: ${cnBeastNames.length} CN names, ${canonicalEntries.length} cross-server mappings`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
