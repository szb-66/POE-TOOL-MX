import { load } from 'cheerio'
import { stableCraftingId } from './model.js'

const SUPPORTED_INFLUENCES = new Set(['shaper', 'elder', 'crusader', 'redeemer', 'hunter', 'warlord'])

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').replace(/—/g, '—').trim()
}

function htmlText(fragment) {
  return cleanText(load(`<div id="root">${fragment ?? ''}</div>`)('#root').text())
}

function numberRanges(text) {
  const normalized = cleanText(text).replace(/,/g, '')
  const ranges = []
  const rangePattern = /\(?(-?\d+(?:\.\d+)?)\s*[—-]\s*(-?\d+(?:\.\d+)?)\)?/g
  let match
  while ((match = rangePattern.exec(normalized))) {
    ranges.push({ min: Number(match[1]), max: Number(match[2]) })
  }
  if (ranges.length) return ranges
  const singles = normalized.match(/-?\d+(?:\.\d+)?/g) ?? []
  return singles.slice(0, 3).map((entry) => ({ min: Number(entry), max: Number(entry) }))
}

function inferTags(itemClass, category, details = '') {
  const source = `${itemClass} ${category}`.toLowerCase()
  const tags = new Set(['default'])
  const mappings = [
    ['ring', ['戒指', 'ring']], ['amulet', ['项链', 'amulet']], ['belt', ['腰带', 'belt']],
    ['claw', ['爪', 'claw']], ['dagger', ['匕首', 'dagger']], ['wand', ['法杖', 'wand']],
    ['sword', ['剑', 'sword']], ['axe', ['斧', 'axe']], ['mace', ['锤', 'mace']],
    ['bow', ['弓', 'bow']], ['staff', ['长杖', '战杖', 'staff']], ['quiver', ['箭袋', 'quiver']],
    ['shield', ['盾', 'shield']], ['gloves', ['手套', 'glove']], ['boots', ['鞋', 'boot']],
    ['body_armour', ['胸甲', 'body']], ['helmet', ['头盔', 'helmet']], ['jewel', ['珠宝', 'jewel']]
  ]
  mappings.forEach(([tag, needles]) => {
    if (needles.some((needle) => source.includes(needle))) tags.add(tag)
  })
  if ([...tags].some((tag) => ['claw', 'dagger', 'wand', 'sword', 'axe', 'mace', 'bow', 'staff'].includes(tag))) tags.add('weapon')
  if ([...tags].some((tag) => ['shield', 'gloves', 'boots', 'body_armour', 'helmet'].includes(tag))) tags.add('armour')
  const lowerDetails = `${itemClass} ${details}`.toLowerCase()
  const clusterSizes = [['large', 'large_cluster'], ['medium', 'medium_cluster'], ['small', 'small_cluster']]
  clusterSizes.forEach(([size, needle]) => { if (lowerDetails.includes(needle)) tags.add(`expansion_jewel_${size}`) })
  const abyssKinds = [['melee', 'murderous_eye'], ['ranged', 'searching_eye'], ['caster', 'hypnotic_eye'], ['summoner', 'ghastly_eye']]
  abyssKinds.forEach(([kind, needle]) => { if (lowerDetails.includes(needle)) tags.add(`abyss_jewel_${kind}`) })
  const armourParts = []
  if (/护甲/.test(details)) armourParts.push('str')
  if (/闪避值/.test(details)) armourParts.push('dex')
  if (/能量护盾/.test(details)) armourParts.push('int')
  if (armourParts.length) tags.add(`${armourParts.join('_')}_${tags.has('shield') ? 'shield' : 'armour'}`)
  return [...tags]
}

function allowedVariantsFor(itemClass) {
  const lower = itemClass.toLowerCase()
  if (lower.includes('cluster') || lower.includes('jewel') || itemClass.includes('珠宝')) {
    return ['normal', 'fractured', 'synthesized']
  }
  return ['normal', 'influenced', 'fractured', 'synthesized', 'eldritch']
}

function maxAffixesFor(itemClass) {
  const lower = itemClass.toLowerCase()
  return lower.includes('jewel') || itemClass.includes('珠宝')
    ? { prefix: 2, suffix: 2 }
    : { prefix: 3, suffix: 3 }
}

function parseStructuredBases($, category) {
  return $('[data-crafting-base]').map((_, element) => {
    const node = $(element)
    const sourceId = node.attr('data-source-id') || node.attr('data-crafting-base')
    const itemClass = node.attr('data-item-class') || category
    return {
      id: stableCraftingId('base', sourceId),
      sourceId,
      name: cleanText(node.find('[data-name]').first().text() || node.attr('data-name')),
      category,
      itemClass,
      imageId: stableCraftingId('image', node.find('img').attr('src') || sourceId),
      imageUrl: node.find('img').attr('src') || '',
      requiredLevel: Number(node.attr('data-level') || 1),
      tags: cleanText(node.attr('data-tags')).split(' ').filter(Boolean),
      maxAffixes: maxAffixesFor(itemClass),
      allowedVariants: allowedVariantsFor(itemClass)
    }
  }).get()
}

export function parsePoedbBases(html, { category = '装备' } = {}) {
  const $ = load(html)
  const structured = parseStructuredBases($, category)
  if (structured.length) return structured

  const cards = $('.card').filter((_, element) => /物品\s*\/\s*\d+/.test(cleanText($(element).find('.card-header').first().text())))
  const results = []
  cards.each((_, card) => {
    $(card).find('.col').each((__, column) => {
      const imageAnchor = $(column).find('a.whiteitem:has(img)').first()
      if (!imageAnchor.length) return
      const sourceId = cleanText(imageAnchor.attr('href')).replace(/^\/cn\//, '')
      const nameAnchor = $(column).find('a.whiteitem').filter((___, anchor) => !$(anchor).find('img').length).first()
      const name = cleanText(nameAnchor.text())
      if (!sourceId || !name) return
      const classNames = String(imageAnchor.attr('class') || '').split(/\s+/).filter((entry) => entry && entry !== 'whiteitem')
      const itemClass = classNames[0] || category
      const imageUrl = imageAnchor.find('img').attr('src') || ''
      const level = Number($(column).find('.requirements .colourDefault').first().text()) || 1
      results.push({
        id: stableCraftingId('base', sourceId),
        sourceId,
        name,
        category,
        itemClass,
        imageId: stableCraftingId('image', imageUrl || sourceId),
        imageUrl,
        requiredLevel: level,
        tags: inferTags(`${itemClass} ${sourceId} ${name}`, category, cleanText($(column).text())),
        maxAffixes: maxAffixesFor(itemClass),
        allowedVariants: allowedVariantsFor(itemClass)
      })
    })
  })
  return [...new Map(results.map((base) => [base.id, base])).values()]
}

export function extractModsViewPayload(html) {
  const marker = 'new ModsView('
  const start = html.indexOf(marker)
  if (start < 0) return null
  let cursor = start + marker.length
  const jsonStart = cursor
  let depth = 0
  let inString = false
  let escaped = false
  for (; cursor < html.length; cursor += 1) {
    const char = html[cursor]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') {
      inString = true
      continue
    }
    if (char === '{' || char === '[') depth += 1
    if (char === '}' || char === ']') depth -= 1
    if (depth === 0 && char === ')') break
  }
  if (cursor >= html.length) throw new Error('ModsView JSON 未闭合')
  return JSON.parse(html.slice(jsonStart, cursor))
}

function tagsFromModRecord(record) {
  const tags = new Set(record.fossil_no ?? [])
  for (const badge of record.mod_no ?? []) {
    const $ = load(badge)
    const tag = $('[data-tag]').attr('data-tag')
    if (tag) tags.add(tag)
  }
  return [...tags]
}

function parseStructuredModifiers($) {
  return $('[data-modifier]').map((_, element) => {
    const node = $(element)
    const sourceId = node.attr('data-source-id') || node.attr('data-modifier')
    const groupId = node.attr('data-group') || sourceId
    const tiers = node.find('[data-tier]').map((index, tierElement) => {
      const tierNode = $(tierElement)
      const text = cleanText(tierNode.text())
      return {
        id: stableCraftingId('tier', `${sourceId}:${tierNode.attr('data-tier')}`),
        tier: Number(tierNode.attr('data-tier') || index + 1),
        name: tierNode.attr('data-name') || `T${index + 1}`,
        requiredLevel: Number(tierNode.attr('data-level') || 1),
        weight: Number(tierNode.attr('data-weight') || 0),
        text,
        values: numberRanges(text)
      }
    }).get()
    return {
      id: stableCraftingId('modifier', sourceId),
      sourceId,
      groupId,
      name: cleanText(node.find('[data-name]').first().text() || node.attr('data-name')),
      affixType: node.attr('data-affix') || 'prefix',
      source: node.attr('data-source') || 'natural',
      tags: cleanText(node.attr('data-tags')).split(' ').filter(Boolean),
      spawnTags: cleanText(node.attr('data-spawn-tags')).split(' ').filter(Boolean),
      requiredTags: cleanText(node.attr('data-required-tags')).split(' ').filter(Boolean),
      itemClasses: cleanText(node.attr('data-item-classes')).split(' ').filter(Boolean),
      influences: cleanText(node.attr('data-influences')).split(' ').filter(Boolean),
      tiers
    }
  }).get()
}

export function parsePoedbModifiers(html) {
  const $ = load(html)
  const structured = parseStructuredModifiers($)
  if (structured.length) return structured
  const payload = extractModsViewPayload(html)
  if (!payload) return []
  const itemClassCode = cleanText(payload.opt?.ItemClassesCode || payload.baseitem?.cn || payload.baseitem?.href || 'unknown')
  const baseItemName = cleanText(payload.opt?.BaseItemName || payload.baseitem?.Code)
  const requiredTags = cleanText(payload.opt?.tags).split(/\s+/).filter((tag) => tag && tag !== 'default')
  const baseScopeTags = [
    ['large cluster jewel', 'expansion_jewel_large'], ['medium cluster jewel', 'expansion_jewel_medium'], ['small cluster jewel', 'expansion_jewel_small'],
    ['murderous eye jewel', 'abyss_jewel_melee'], ['searching eye jewel', 'abyss_jewel_ranged'],
    ['hypnotic eye jewel', 'abyss_jewel_caster'], ['ghastly eye jewel', 'abyss_jewel_summoner']
  ]
  baseScopeTags.forEach(([needle, tag]) => { if (baseItemName.toLowerCase() === needle) requiredTags.push(tag) })
  const itemClassScope = [itemClassCode, baseItemName, ...requiredTags].filter(Boolean).join(':')
  const groups = new Map()
  for (const [sourceKey, records] of Object.entries(payload)) {
    if (!Array.isArray(records)) continue
    const influence = SUPPORTED_INFLUENCES.has(sourceKey) ? sourceKey : null
    const source = sourceKey === 'crafted' ? 'crafted' : sourceKey === 'fractured' ? 'fractured' : 'natural'
    if (!['normal', 'crafted', 'fractured'].includes(sourceKey) && !influence) continue
    records.forEach((record) => {
      const generation = Number(record.ModGenerationTypeID)
      if (![1, 2].includes(generation)) return
      const family = record.ModFamilyList?.[0]
      if (!family || !record.str) return
      // 同一个 ModFamily 在不同物品类别上可能拥有完全不同的阶级、范围和权重，
      // 因此类别编码必须进入稳定 ID，不能只按 family 全局去重。
      const key = `${itemClassScope}:${sourceKey}:${generation}:${family}`
      if (!groups.has(key)) {
        groups.set(key, {
          sourceId: key,
          groupId: family,
          affixType: generation === 1 ? 'prefix' : 'suffix',
          source,
          tags: new Set(),
          spawnTags: new Set(),
          requiredTags,
          influences: influence ? [influence] : [],
          records: []
        })
      }
      const group = groups.get(key)
      tagsFromModRecord(record).forEach((tag) => group.tags.add(tag))
      ;(record.spawn_no ?? []).forEach((tag) => group.spawnTags.add(tag))
      group.records.push(record)
    })
  }

  return [...groups.values()].map((group) => {
    const sorted = group.records.sort((a, b) => Number(b.Level) - Number(a.Level))
    const bestText = htmlText(sorted[0].str)
    const name = bestText.replace(/[+\-]?[\d().—%]+/g, '#').replace(/#+/g, '#').trim()
    return {
      id: stableCraftingId('modifier', group.sourceId),
      sourceId: group.sourceId,
      groupId: group.groupId,
      name: name || cleanText(sorted[0].Name) || group.groupId,
      affixType: group.affixType,
      source: group.source,
      tags: [...group.tags],
      spawnTags: [...group.spawnTags],
      requiredTags: group.requiredTags,
      itemClasses: [itemClassCode],
      influences: group.influences,
      tiers: sorted.map((record, index) => {
        const text = htmlText(record.str)
        return {
          id: stableCraftingId('tier', `${group.sourceId}:${record.Level}:${record.Name}:${record.str}:${index}`),
          tier: index + 1,
          name: `T${index + 1} ${cleanText(record.Name)}`.trim(),
          requiredLevel: Number(record.Level) || 1,
          weight: Math.max(0, Number(record.DropChance) || 0),
          text,
          values: numberRanges(text)
        }
      })
    }
  })
}

function parseCost(text) {
  const normalized = cleanText(text)
  const matches = [...normalized.matchAll(/(?:([\d,.]+)\s*x|x\s*([\d,.]+))\s*([^·,，;；]+)/gi)]
  return matches.map((match) => {
    const amount = Number((match[1] || match[2]).replace(/,/g, ''))
    const resourceName = cleanText(match[3]).split(/\s+/).slice(0, 4).join(' ')
    return {
      resourceId: stableCraftingId('resource', resourceName),
      resourceName,
      amount
    }
  }).filter((entry) => entry.amount > 0 && entry.resourceName)
}

export function inferCraftEffectKind(name, provider) {
  const text = cleanText(name)
  if (/前缀无法被变更|锁前/.test(text)) return 'lock_prefixes'
  if (/后缀无法被变更|锁后/.test(text)) return 'lock_suffixes'
  if (/无法骰出攻击/.test(text)) return 'cannot_roll_attack'
  if (/无法骰出法术|无法骰出施法/.test(text)) return 'cannot_roll_caster'
  if (/多个工艺|多大师/.test(text)) return 'multimod'
  if (/添加.*去掉|移除.*添加/.test(text)) return 'remove_add_tag'
  if (/抗性.*变为|伤害.*变为/.test(text)) return 'convert_tag'
  if (/大概率.*相同/.test(text)) return 'reforge_more_likely'
  if (/大概率.*不会.*相同/.test(text)) return 'reforge_less_likely'
  if (/受影响.*包括一个.*影响|势力.*重铸/.test(text)) return 'reforge_influence'
  if (/重铸/.test(text) && provider === 'harvest') return 'reforge_tag'
  if (provider === 'bench') return 'add_crafted_modifier'
  return 'unsupported'
}

export function parsePoedbCrafts(html, { provider }) {
  const $ = load(html)
  const structured = $('[data-craft]').map((_, element) => {
    const node = $(element)
    const sourceId = node.attr('data-source-id') || node.attr('data-craft')
    const name = cleanText(node.find('[data-name]').text() || node.attr('data-name'))
    return {
      id: stableCraftingId('craft', `${provider}:${sourceId}`),
      provider,
      name,
      effectKind: node.attr('data-effect') || inferCraftEffectKind(name, provider),
      itemClasses: cleanText(node.attr('data-item-classes')).split(' ').filter(Boolean),
      cost: parseCost(node.find('[data-cost]').text() || node.attr('data-cost')),
      params: { tag: node.attr('data-tag') || null }
    }
  }).get()
  if (structured.length) return structured

  const rows = $('table tr').map((_, element) => {
    const cells = $(element).find('td')
    if (cells.length < 2) return null
    const name = cleanText(cells.first().text())
    const costText = cleanText(cells.eq(1).text())
    if (!name || /词缀|描述/.test(name)) return null
    const effectKind = inferCraftEffectKind(name, provider)
    if (effectKind === 'unsupported') return null
    const sourceId = `${name}:${costText}`
    return {
      id: stableCraftingId('craft', `${provider}:${sourceId}`),
      provider,
      name,
      effectKind,
      itemClasses: [],
      cost: parseCost(costText),
      params: {}
    }
  }).get().filter(Boolean)
  return [...new Map(rows.map((craft) => [craft.id, craft])).values()]
}

const CORE_CURRENCY = [
  ['transmutation', '蜕变石', 'upgrade_normal_to_magic'],
  ['alteration', '改造石', 'reforge_magic'],
  ['augmentation', '增幅石', 'add_magic_modifier'],
  ['regal', '富豪石', 'upgrade_magic_to_rare'],
  ['alchemy', '点金石', 'upgrade_normal_to_rare'],
  ['chaos', '混沌石', 'reforge_rare'],
  ['scouring', '重铸石', 'remove_modifiers'],
  ['exalted', '崇高石', 'add_rare_modifier'],
  ['annulment', '无效石', 'remove_random_modifier'],
  ['divine', '神圣石', 'reroll_values']
]

export function createCoreCurrencyCrafts() {
  return CORE_CURRENCY.map(([key, name, effectKind]) => ({
    id: `craft:currency:${key}`,
    provider: 'currency',
    name,
    effectKind,
    itemClasses: [],
    cost: [{ resourceId: `currency:${key}`, resourceName: name, amount: 1 }],
    params: {}
  }))
}
