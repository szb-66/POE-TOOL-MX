import { load } from 'cheerio'
import { stableCraftingId } from './model.js'
import { inferCatalystDisplayTags } from './catalystRules.js'

const SUPPORTED_INFLUENCES = new Set(['shaper', 'elder', 'crusader', 'redeemer', 'hunter', 'warlord'])
const SUPPORTED_SPECIAL_SOURCES = new Set(['essence', 'delve', 'incursion', 'veiled'])

const ESSENCE_RULES = {
  Whispering: { tier: 1, minimumItemLevel: 1, randomModifierLevelCap: 35, canReforgeRare: false },
  Muttering: { tier: 2, minimumItemLevel: 8, randomModifierLevelCap: 45, canReforgeRare: false },
  Weeping: { tier: 3, minimumItemLevel: 20, randomModifierLevelCap: 60, canReforgeRare: false },
  Wailing: { tier: 4, minimumItemLevel: 33, randomModifierLevelCap: 75, canReforgeRare: false },
  Screaming: { tier: 5, minimumItemLevel: 46, randomModifierLevelCap: null, canReforgeRare: true },
  Shrieking: { tier: 6, minimumItemLevel: 59, randomModifierLevelCap: null, canReforgeRare: true },
  Deafening: { tier: 7, minimumItemLevel: 65, randomModifierLevelCap: null, canReforgeRare: true }
}

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').replace(/—/g, '—').trim()
}

function htmlText(fragment) {
  const $ = load(`<div id="root">${fragment ?? ''}</div>`)
  $('#root br').replaceWith('\n')
  return $('#root').text().split('\n').map(cleanText).filter(Boolean).join('\n')
}

export function parseEssenceSource(fragment) {
  const $ = load(`<div id="root">${fragment ?? ''}</div>`)
  const anchor = $('#root a[href]').first()
  const sourceItemId = cleanText(anchor.attr('href')).split('/').filter(Boolean).at(-1) || ''
  const sourceItemName = cleanText(anchor.text())
  if (!sourceItemId || !sourceItemName || !/(?:^|_)Essence_of_/i.test(sourceItemId)) return null
  const prefix = sourceItemId.startsWith('Essence_of_') ? 'Essence' : sourceItemId.split('_Essence_of_')[0]
  const rule = ESSENCE_RULES[prefix] ?? (/^Essence$/i.test(prefix)
    ? { tier: 8, minimumItemLevel: 1, randomModifierLevelCap: null, canReforgeRare: true }
    : null)
  return rule ? { id: sourceItemId, name: sourceItemName, ...rule } : null
}

export function modifierEffectKey(fragment) {
  return htmlText(fragment)
    .replace(/\(?[+\-]?\d+(?:\.\d+)?\s*[—-]\s*[+\-]?\d+(?:\.\d+)?\)?/g, '#')
    .replace(/[+\-]?\d+(?:\.\d+)?/g, '#')
    .replace(/#+/g, '#')
    .trim()
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

const WEAPON_CLASSES = new Set(['Claw', 'Dagger', 'RuneDagger', 'Wand', 'OneHandSword', 'ThrustingOneHandSword', 'OneHandAxe', 'OneHandMace', 'Sceptre', 'Bow', 'Staff', 'Warstaff', 'TwoHandSword', 'TwoHandAxe', 'TwoHandMace'])
const ARMOUR_CLASSES = new Set(['Shield', 'Gloves', 'Boots', 'BodyArmour', 'Helmet'])
const SIX_SOCKET_CLASSES = new Set(['Bow', 'Staff', 'Warstaff', 'TwoHandSword', 'TwoHandAxe', 'TwoHandMace', 'BodyArmour'])
const FOUR_SOCKET_CLASSES = new Set(['Gloves', 'Boots', 'Helmet'])
const THREE_SOCKET_CLASSES = new Set(['Claw', 'Dagger', 'RuneDagger', 'Wand', 'OneHandSword', 'ThrustingOneHandSword', 'OneHandAxe', 'OneHandMace', 'Sceptre', 'Shield'])

export function baseEquipmentRules(itemClass, sourceId = '') {
  const qualityType = WEAPON_CLASSES.has(itemClass) ? 'weapon' : ARMOUR_CLASSES.has(itemClass) ? 'armour' : 'none'
  const socketLimit = sourceId === 'Unset_Ring' ? 1 : SIX_SOCKET_CLASSES.has(itemClass) ? 6 : FOUR_SOCKET_CLASSES.has(itemClass) ? 4 : THREE_SOCKET_CLASSES.has(itemClass) ? 3 : 0
  return { qualityType, socketLimit }
}

export function parseBaseRequirements(text = '') {
  const source = cleanText(text)
  const level = Number(source.match(/等级\s*(\d+)/)?.[1] ?? 1)
  const before = (label) => Number(source.match(new RegExp(`(\\d+)\\s*${label}`))?.[1] ?? 0)
  return { level, strength: before('力量'), dexterity: before('敏捷'), intelligence: before('智慧') }
}

function baseValueRecord(sourceId, node, index, kind = 'property') {
  const sourceText = cleanText(node.text())
  const label = cleanText(sourceText.split(':')[0] || (kind === 'implicit' ? '固有词缀' : sourceText))
  let text = sourceText
  let values = numberRanges(sourceText)
  if (kind === 'property' && /伤害/.test(label)) {
    const endpoints = [...sourceText.matchAll(/(-?\d+(?:\.\d+)?)\s*[—-]\s*(-?\d+(?:\.\d+)?)/g)]
    if (endpoints.length) {
      values = endpoints.flatMap((match) => [{ min: Number(match[1]), max: Number(match[1]) }, { min: Number(match[2]), max: Number(match[2]) }])
      text = sourceText.replace(/-?\d+(?:\.\d+)?\s*[—-]\s*-?\d+(?:\.\d+)?/g, '#—#')
    }
  }
  return {
    id: stableCraftingId(kind === 'implicit' ? 'base-implicit' : 'base-stat', `${sourceId}:${index}:${sourceText}`),
    label,
    kind,
    text,
    values,
    displayTags: kind === 'implicit' ? inferCatalystDisplayTags(sourceText) : []
  }
}

function parseStructuredBases($, category) {
  return $('[data-crafting-base]').map((_, element) => {
    const node = $(element)
    const sourceId = node.attr('data-source-id') || node.attr('data-crafting-base')
    const itemClass = node.attr('data-item-class') || category
    const requirements = {
      level: Number(node.attr('data-level') || 1),
      strength: Number(node.attr('data-strength') || 0),
      dexterity: Number(node.attr('data-dexterity') || 0),
      intelligence: Number(node.attr('data-intelligence') || 0)
    }
    const rules = baseEquipmentRules(itemClass, sourceId)
    return {
      id: stableCraftingId('base', sourceId),
      sourceId,
      name: cleanText(node.find('[data-name]').first().text() || node.attr('data-name')),
      category,
      itemClass,
      imageId: stableCraftingId('image', node.find('img').attr('src') || sourceId),
      imageUrl: node.find('img').attr('src') || '',
      requiredLevel: requirements.level,
      requirements,
      qualityType: node.attr('data-quality-type') || rules.qualityType,
      socketLimit: Number(node.attr('data-socket-limit') ?? rules.socketLimit),
      baseStats: node.find('[data-base-stat]').map((index, child) => baseValueRecord(sourceId, $(child), index)).get(),
      implicitModifiers: node.find('[data-base-implicit]').map((index, child) => baseValueRecord(sourceId, $(child), index, 'implicit')).get(),
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
      const requirements = parseBaseRequirements($(column).find('.requirements').first().text())
      const rules = baseEquipmentRules(itemClass, sourceId)
      results.push({
        id: stableCraftingId('base', sourceId),
        sourceId,
        name,
        category,
        itemClass,
        imageId: stableCraftingId('image', imageUrl || sourceId),
        imageUrl,
        requiredLevel: requirements.level,
        requirements,
        qualityType: rules.qualityType,
        socketLimit: rules.socketLimit,
        baseStats: $(column).find('.property').map((index, child) => baseValueRecord(sourceId, $(child), index)).get(),
        implicitModifiers: $(column).find('.implicitMod').map((index, child) => baseValueRecord(sourceId, $(child), index, 'implicit')).get(),
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

const PROFILE_BY_ITEM_CLASS = {
  Claw: 'Claws', Dagger: 'Daggers', RuneDagger: 'Rune_Daggers', Wand: 'Wands', OneHandSword: 'One_Hand_Swords',
  ThrustingOneHandSword: 'Thrusting_One_Hand_Swords', OneHandAxe: 'One_Hand_Axes', OneHandMace: 'One_Hand_Maces', Sceptre: 'Sceptres',
  Bow: 'Bows', Staff: 'Staves', Warstaff: 'Warstaves', TwoHandSword: 'Two_Hand_Swords', TwoHandAxe: 'Two_Hand_Axes',
  TwoHandMace: 'Two_Hand_Maces', Quiver: 'Quivers', Amulet: 'Amulets', Ring: 'Rings', Belt: 'Belts'
}

const CATEGORY_LABEL_BY_ITEM_CLASS = {
  Claw: '爪', Dagger: '匕首', RuneDagger: '符文匕首', Wand: '法杖', OneHandSword: '单手剑', ThrustingOneHandSword: '细剑',
  OneHandAxe: '单手斧', OneHandMace: '单手锤', Sceptre: '短杖', Bow: '弓', Staff: '长杖', Warstaff: '战杖', TwoHandSword: '双手剑',
  TwoHandAxe: '双手斧', TwoHandMace: '双手锤', Quiver: '箭袋', Shield: '盾牌', Gloves: '手套', Boots: '鞋子', BodyArmour: '胸甲',
  Helmet: '头盔', Amulet: '项链', Ring: '戒指', Belt: '腰带', Jewel: '珠宝', AbyssJewel: '深渊珠宝'
}

export function finalizePoedbBases(entries, specialProfiles = []) {
  const specialBySource = new Map(specialProfiles.flatMap((profile) => profile.sourceIds.map((sourceId) => [sourceId, profile])))
  const filtered = entries.filter((base) => !/^(Royale_|Test|Metadata)/i.test(base.sourceId) && !/(Placeholder|Test)/i.test(base.name))
  for (const base of filtered) {
    const special = specialBySource.get(base.sourceId)
    if (base.itemClass === 'Sceptre' && !base.tags.includes('sceptre')) base.tags.push('sceptre')
    const armourStem = { Gloves: 'Gloves', Boots: 'Boots', BodyArmour: 'Body_Armours', Helmet: 'Helmets', Shield: 'Shields' }[base.itemClass]
    const armourTag = base.tags.find((tag) => /^(?:str|dex|int)(?:_(?:str|dex|int))*_(?:armour|shield)$/.test(tag))
    const armourVariant = armourTag?.replace(/_(?:armour|shield)$/, '')
    const jewelProfile = [
      ['expansion_jewel_large', 'Large_Cluster_Jewel'], ['expansion_jewel_medium', 'Medium_Cluster_Jewel'], ['expansion_jewel_small', 'Small_Cluster_Jewel'],
      ['abyss_jewel_melee', 'Murderous_Eye_Jewel'], ['abyss_jewel_ranged', 'Searching_Eye_Jewel'], ['abyss_jewel_caster', 'Hypnotic_Eye_Jewel'], ['abyss_jewel_summoner', 'Ghastly_Eye_Jewel']
    ].find(([tag]) => base.tags.includes(tag))?.[1]
    base.modifierProfileId = special?.page || jewelProfile || (armourStem && armourVariant ? `${armourStem}_${armourVariant}` : PROFILE_BY_ITEM_CLASS[base.itemClass] || base.itemClass)
    const armourVariantLabels = {
      str: '力量', dex: '敏捷', int: '智慧', str_dex: '力量敏捷', str_int: '力量智慧',
      dex_int: '敏捷智慧', str_dex_int: '力量敏捷智慧'
    }
    const normalPath = [base.category, CATEGORY_LABEL_BY_ITEM_CLASS[base.itemClass] || base.itemClass]
    if (armourVariant && armourVariantLabels[armourVariant]) normalPath.push(armourVariantLabels[armourVariant])
    base.categoryPath = special?.categoryPath || normalPath
    if (special) base.category = '特殊'
  }
  const collisions = new Map()
  filtered.forEach((base) => collisions.set(base.name, (collisions.get(base.name) ?? 0) + 1))
  filtered.forEach((base) => { base.displayName = collisions.get(base.name) > 1 ? `${base.name}（需求等级 ${base.requiredLevel}）` : base.name })
  return [...new Map(filtered.map((base) => [base.id, base])).values()]
}

function displayTagsFromModRecord(record) {
  return [...new Map((record.mod_no ?? []).map((badge) => {
    const $ = load(badge)
    const id = $('[data-tag]').attr('data-tag')
    const label = cleanText($('[data-tag]').text())
    return id ? [id, { id, label: label || id }] : null
  }).filter(Boolean)).values()]
}

function parseStructuredModifiers($, profileId = 'structured') {
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
        displayTags: cleanText(tierNode.attr('data-tags')).split(' ').filter(Boolean).map((id) => ({ id, label: id })),
        values: numberRanges(text)
      }
    }).get()
    return {
      id: stableCraftingId('modifier', `${profileId}:${sourceId}`),
      goalId: stableCraftingId('goal', `${profileId}:${node.attr('data-affix') || 'prefix'}:${groupId}:${sourceId}`),
      sourceId,
      effectKey: sourceId,
      modifierProfileId: profileId,
      groupId,
      name: cleanText(node.find('[data-name]').first().text() || node.attr('data-name')),
      affixType: node.attr('data-affix') || 'prefix',
      source: node.attr('data-source') || 'natural',
      tags: cleanText(node.attr('data-tags')).split(' ').filter(Boolean),
      displayTags: cleanText(node.attr('data-tags')).split(' ').filter(Boolean).map((id) => ({ id, label: id })),
      spawnTags: cleanText(node.attr('data-spawn-tags')).split(' ').filter(Boolean),
      requiredTags: cleanText(node.attr('data-required-tags')).split(' ').filter(Boolean),
      itemClasses: cleanText(node.attr('data-item-classes')).split(' ').filter(Boolean),
      influences: cleanText(node.attr('data-influences')).split(' ').filter(Boolean),
      tiers
    }
  }).get()
}

export function parsePoedbModifiers(html, { profileId = '' } = {}) {
  const $ = load(html)
  const structured = parseStructuredModifiers($, profileId || 'structured')
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
  const resolvedProfileId = profileId || cleanText(payload.opt?.BaseItemName || payload.baseitem?.href || itemClassCode)
  const flaskReferenceProfile = /_Flasks$/.test(resolvedProfileId)
  const itemClassScope = [itemClassCode, baseItemName, ...requiredTags].filter(Boolean).join(':')
  const groups = new Map()
  for (const [sourceKey, sourceRecords] of Object.entries(payload)) {
    if (flaskReferenceProfile && sourceKey !== 'normal') continue
    const records = Array.isArray(sourceRecords)
      ? sourceRecords
      : sourceRecords && typeof sourceRecords === 'object' && (SUPPORTED_INFLUENCES.has(sourceKey) || SUPPORTED_SPECIAL_SOURCES.has(sourceKey))
        ? Object.values(sourceRecords)
        : []
    if (!records.length) continue
    const influence = SUPPORTED_INFLUENCES.has(sourceKey) ? sourceKey : null
    const source = sourceKey === 'master' ? 'crafted' : sourceKey === 'fractured' ? 'fractured' : SUPPORTED_SPECIAL_SOURCES.has(sourceKey) ? sourceKey : 'natural'
    if (!['normal', 'master', 'fractured'].includes(sourceKey) && !influence && !SUPPORTED_SPECIAL_SOURCES.has(sourceKey)) continue
    records.forEach((record) => {
      const generation = Number(record.ModGenerationTypeID)
      if (![1, 2].includes(generation)) return
      const family = record.ModFamilyList?.[0]
      if (!family || !record.str) return
      // 同一个 ModFamily 在不同物品类别上可能拥有完全不同的阶级、范围和权重，
      // 因此类别编码必须进入稳定 ID，不能只按 family 全局去重。
      const effectKey = modifierEffectKey(record.str)
      const key = `${itemClassScope}:${sourceKey}:${generation}:${family}:${effectKey}`
      if (!groups.has(key)) {
        groups.set(key, {
          sourceId: key,
          effectKey,
          modifierProfileId: resolvedProfileId,
          targetScope: influence || (SUPPORTED_SPECIAL_SOURCES.has(sourceKey) ? sourceKey : 'base'),
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
      goalId: stableCraftingId('goal', `${group.modifierProfileId}:${group.targetScope}:${group.affixType}:${group.groupId}:${group.effectKey}`),
      sourceId: group.sourceId,
      effectKey: group.effectKey,
      modifierProfileId: group.modifierProfileId,
      groupId: group.groupId,
      name: name || cleanText(sorted[0].Name) || group.groupId,
      affixType: group.affixType,
      source: group.source,
      tags: [...group.tags],
      displayTags: [...new Map(group.records.flatMap(displayTagsFromModRecord).map((tag) => [tag.id, tag])).values()],
      spawnTags: [...group.spawnTags],
      requiredTags: group.requiredTags,
      itemClasses: [itemClassCode],
      influences: group.influences,
      tiers: sorted.map((record, index) => {
        const text = htmlText(record.str)
        const sourceItem = group.source === 'essence' ? parseEssenceSource(record.Name) : null
        return {
          id: stableCraftingId('tier', `${group.sourceId}:${record.Level}:${record.Name}:${record.str}:${index}`),
          tier: index + 1,
          name: sourceItem ? `T${sourceItem.tier} ${sourceItem.name}` : `T${index + 1} ${htmlText(record.Name)}`.trim(),
          requiredLevel: Number(record.Level) || 1,
          weight: Math.max(0, Number(record.DropChance) || 0),
          text,
          displayTags: displayTagsFromModRecord(record),
          hover: cleanText(record.hover),
          values: numberRanges(text),
          ...(sourceItem ? { sourceItem } : {})
        }
      })
    }
  })
}

function parseCost(text) {
  const normalized = cleanText(text)
  const parts = normalized.split(/[;；]/).map(cleanText).filter(Boolean)
  return parts.flatMap((part) => {
    const amountFirst = part.match(/^([\d,.]+)\s*x\s*(.+)$/i)
    const resourceFirst = part.match(/^(.+?)\s*x\s*([\d,.]+)$/i)
    const amount = Number((amountFirst?.[1] || resourceFirst?.[2] || '').replace(/,/g, ''))
    const resourceName = cleanText(amountFirst?.[2] || resourceFirst?.[1])
    if (!(amount > 0) || !resourceName) return []
    return [{ resourceId: stableCraftingId('resource', resourceName), resourceName, amount }]
  })
}

function harvestResourceId(href, name) {
  const source = String(href || name).split('/').at(-1).replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()
  return `resource:harvest:${source || stableCraftingId('item', name).slice(5)}`
}

function parseHarvestCostCell($, cell) {
  const costs = $(cell).find('a.item_currency').map((_, element) => {
    const resourceName = cleanText($(element).text())
    let amountText = ''
    let cursor = element.nextSibling
    while (cursor && !(cursor.type === 'tag' && cursor.name === 'a')) {
      amountText += $(cursor).text()
      cursor = cursor.nextSibling
    }
    const amount = Number((amountText.match(/x\s*([\d,.]+)/i)?.[1] ?? '').replace(/,/g, ''))
    if (!(amount > 0) || !resourceName) return null
    return { resourceId: harvestResourceId($(element).attr('href'), resourceName), resourceName, amount }
  }).get().filter(Boolean)
  return costs.length ? costs : parseCost(cleanText($(cell).text()))
}

const HARVEST_TAG_NAMES = [
  ['召唤生物', 'minion'], ['闪电', 'lightning'], ['冰霜', 'cold'], ['火焰', 'fire'],
  ['物理', 'physical'], ['生命', 'life'], ['防御', 'defences'], ['混沌', 'chaos'],
  ['攻击', 'attack'], ['施法', 'caster'], ['速度', 'speed'], ['暴击', 'critical'],
  ['元素', 'elemental'], ['属性', 'attribute'], ['魔力', 'mana'], ['掉落', 'drop']
]

function harvestTagFromText(text) {
  return HARVEST_TAG_NAMES
    .map(([label, tag]) => ({ label, tag, index: text.indexOf(label) }))
    .filter((entry) => entry.index >= 0)
    .sort((left, right) => left.index - right.index || right.label.length - left.label.length)[0]?.tag ?? null
}

function inferHarvestParams(name, effectKind) {
  const text = cleanText(name)
  if (['reforge_tag', 'remove_add_tag'].includes(effectKind)) return { tag: harvestTagFromText(text) }
  if (['convert_resistance', 'convert_damage'].includes(effectKind)) {
    const elements = [...text.matchAll(/(火焰|冰霜|闪电)/g)].map((match) => harvestTagFromText(match[1]))
    return { fromTag: elements[0] ?? null, toTag: elements[1] ?? null }
  }
  if (effectKind === 'quality_enchant') {
    const itemScope = /近战武器/.test(text) ? 'melee_weapon' : /武器/.test(text) ? 'weapon' : 'body_armour'
    return { itemScope, qualityEffect: text }
  }
  return {}
}

export function mergeModifierGoals(modifiers, crafts = []) {
  const craftByHover = new Map(crafts.filter((craft) => craft.params?.hover).map((craft) => [craft.params.hover, craft]))
  const grouped = new Map()
  for (const modifier of modifiers) {
    const key = `${modifier.goalId || stableCraftingId('goal', `${modifier.modifierProfileId}:${modifier.affixType}:${modifier.groupId}:${modifier.effectKey}`)}`
    const current = grouped.get(key) ?? {
      ...modifier,
      id: key,
      goalId: key,
      source: 'natural',
      tiers: [],
      craftedOptions: [],
      tags: [],
      displayTags: []
    }
    current.tags = [...new Set([...current.tags, ...(modifier.tags ?? [])])]
    current.displayTags = [...new Map([...current.displayTags, ...(modifier.displayTags ?? [])].map((tag) => [tag.id, tag])).values()]
    if (modifier.source === 'crafted') {
      for (const tier of modifier.tiers) {
        const craft = craftByHover.get(tier.hover)
        if (!craft) continue
        current.craftedOptions.push({
          ...tier,
          optionId: tier.id,
          craftId: craft.id,
          itemClasses: craft.itemClasses,
          cost: craft.cost,
          unlock: craft.params?.unlock || ''
        })
      }
    } else {
      current.tiers.push(...modifier.tiers)
      current.influences = modifier.influences
      current.source = modifier.source
    }
    grouped.set(key, current)
  }
  return [...grouped.values()].map((goal) => {
    goal.tiers.sort((a, b) => b.requiredLevel - a.requiredLevel || b.values[0]?.min - a.values[0]?.min)
    goal.tiers = goal.tiers.map((tier, index) => {
      const displayTier = tier.sourceItem?.tier ?? index + 1
      return { ...tier, tier: displayTier, name: `T${displayTier} ${String(tier.name).replace(/^T\d+\s*/, '')}`.trim() }
    })
    goal.craftedOptions.sort((a, b) => (b.values[0]?.min ?? 0) - (a.values[0]?.min ?? 0))
    if (!goal.tiers.length && goal.craftedOptions.length) {
      goal.source = 'crafted'
      goal.tiers = goal.craftedOptions.map((option, index) => ({ ...option, id: `goal-tier:${option.id}`, tier: index + 1, name: `T${index + 1}` }))
    }
    return goal
  }).filter((goal) => goal.tiers.length)
}

function modifierEffectSummary(value) {
  return cleanText(value)
    .replace(/[+\-]?#(?:\s*[—–~-]\s*[+\-]?#)?%?/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^该装备附加\s*/, '附加')
    .trim()
}

export function familySummary(entries) {
  const labels = [...new Set(entries.map((entry) => modifierEffectSummary(entry.name)).filter(Boolean))]
  if (labels.length <= 1) return labels[0] || entries[0]?.groupId || '词缀'
  const suffix = labels.every((label) => label.endsWith('伤害提高')) ? '伤害提高' : ''
  const shortened = suffix ? labels.map((label) => label.slice(0, -suffix.length)) : labels
  return `${shortened.join(' / ')}${suffix}`
}

export function groupModifierFamilies(goals) {
  const families = new Map()
  for (const goal of goals) {
    const influenceScope = [...(goal.influences ?? [])].sort().join(',') || 'base'
    const sourceScope = goal.source === 'natural' ? influenceScope : goal.source
    const key = `${goal.modifierProfileId}:${sourceScope}:${goal.affixType}:${goal.groupId}`
    const current = families.get(key) ?? {
      id: stableCraftingId('family', key),
      modifierProfileId: goal.modifierProfileId,
      groupId: goal.groupId,
      affixType: goal.affixType,
      source: goal.source,
      influences: [...(goal.influences ?? [])],
      name: '',
      entries: []
    }
    current.entries.push(goal)
    families.set(key, current)
  }
  return [...families.values()].map((family) => ({
    ...family,
    name: familySummary(family.entries),
    entries: family.entries.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  }))
}

export function inferCraftEffectKind(name, provider) {
  const text = cleanText(name)
  if (provider === 'harvest' && /随机插槽颜色.*白色|插槽.*白色/.test(text)) return 'white_socket'
  if (/前缀无法被变更|锁前/.test(text)) return 'lock_prefixes'
  if (/后缀无法被变更|锁后/.test(text)) return 'lock_suffixes'
  if (/无法骰出攻击/.test(text)) return 'cannot_roll_attack'
  if (/无法骰出法术|无法骰出施法/.test(text)) return 'cannot_roll_caster'
  if (/多个工艺|多大师/.test(text)) return 'multimod'
  if (/大概率.*不会.*相同/.test(text)) return 'reforge_less_likely'
  if (/大概率.*相同/.test(text)) return 'reforge_more_likely'
  if (/添加.*去掉|添加.*移除|移除.*添加/.test(text)) return 'remove_add_tag'
  if (/抗性.*变为/.test(text)) return 'convert_resistance'
  if (/伤害.*变为/.test(text)) return 'convert_damage'
  if (provider === 'harvest' && /随机化.*(?:受影响|势力).*影响类型/.test(text)) return 'randomize_influence'
  if (provider === 'harvest' && /合成.*(?:合成基底|追忆固定词缀)/.test(text)) return 'synthesize_item'
  if (provider === 'harvest' && /附魔.*(?:护甲|武器)/.test(text)) return 'quality_enchant'
  if (provider === 'harvest' && /辅助宝石.*(?:转变|转换)|腐化技能石.*费斯特/.test(text)) return 'gem_transform'
  if (provider === 'harvest' && /一堆|一叠|一张.*命运卡|献祭.*命运卡|碎片|催化剂|圣油|精华/.test(text)) return 'inventory_transform'
  if (provider === 'harvest' && /腐化的地图/.test(text)) return 'map_transform'
  if (/受影响.*包括一个.*影响|势力.*重铸/.test(text)) return 'reforge_influence'
  if (provider === 'harvest' && /重铸/.test(text) && /(?:其中包括|包含).*(?:词缀|属性)/.test(text)) return 'reforge_tag'
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

  const rows = $('table').first().find('tr').map((_, element) => {
    const cells = $(element).find('td')
    if (cells.length < 2) return null
    const name = cleanText(cells.first().text())
    const costText = cleanText(cells.eq(1).text())
    if (!name) return null
    if (provider === 'bench' && !cells.first().find('.explicitMod').length) return null
    const effectKind = inferCraftEffectKind(name, provider)
    if (provider !== 'harvest' && effectKind === 'unsupported') return null
    const sourceId = provider === 'harvest' ? name : `${name}:${costText}`
    const cost = provider === 'harvest' ? parseHarvestCostCell($, cells.eq(1)) : parseCost(costText)
    return {
      id: stableCraftingId('craft', `${provider}:${sourceId}`),
      provider,
      name,
      effectKind,
      itemClasses: cleanText(cells.eq(2).text()).split('·').map(cleanText).filter(Boolean),
      cost,
      params: {
        ...(provider === 'harvest' ? inferHarvestParams(name, effectKind) : {}),
        hover: cleanText(cells.first().find('[data-hover]').first().attr('data-hover')),
        unlock: cleanText(cells.eq(3).text())
      }
    }
  }).get().filter(Boolean)
  return [...new Map(rows.map((craft) => [craft.id, craft])).values()]
}

const ELDRITCH_ITEM_CLASSES = Object.freeze({
  helmet: 'Helmet', gloves: 'Gloves', boots: 'Boots', body_armour: 'BodyArmour'
})

function eldritchWeights(cell) {
  const weights = {}
  const source = cell.html() || ''
  for (const match of source.matchAll(/<i[^>]*>\s*([^<]+?)\s*<\/i>\s*([\d.]+)/gi)) {
    const itemClass = ELDRITCH_ITEM_CLASSES[cleanText(match[1])]
    const weight = Number(match[2])
    // Zero-weight rows are not directly spawnable, but are still required for
    // Orb of Conflict tier transitions (many current T1 rows have weight 0).
    if (itemClass && Number.isFinite(weight) && weight >= 0) weights[itemClass] = weight
  }
  return weights
}

function eldritchTier(cell) {
  const match = (cell.html() || '').match(/no_tier_(\d)_eldritch_implicit/i)
  return match ? 7 - Number(match[1]) : 0
}

function eldritchEffectKey(text) {
  let key = modifierEffectKey(text)
  // Four current T6 effects express 100% chance by dropping the chance phrase.
  // Canonicalise them to their T1-T5 structure without altering displayed text.
  if (!key.includes('几率')) {
    key = key
      .replace('攻击击中造成瘫痪', '攻击击中时有 #% 的几率造成瘫痪')
      .replace('在法术击中时使敌人缓速', '有 #% 的几率在法术击中时使敌人缓速')
      .replace('击中时恐惧敌人', '击中时有 #% 的几率恐惧敌人')
      .replace('击中威吓敌人', '击中有 #% 的几率威吓敌人')
  }
  return key
}

/** Parse the two current POEDB Eldritch implicit tables into source/family/six-tier records. */
export function parsePoedbEldritchImplicits(html) {
  const $ = load(html)
  const tables = $('table').filter((_, table) => $(table).find('tbody tr').length >= 6).slice(0, 2)
  const groups = new Map()
  tables.each((tableIndex, table) => {
    const node = $(table)
    const declared = cleanText(node.attr('data-eldritch-source')).toLowerCase()
    const source = ['exarch', 'eater'].includes(declared) ? declared : tableIndex === 0 ? 'exarch' : 'eater'
    node.find('tbody tr').each((_, row) => {
      const cells = $(row).find('td')
      if (cells.length < 3) return
      const tier = eldritchTier(cells.eq(2))
      const weights = eldritchWeights(cells.eq(2))
      const itemClasses = Object.keys(weights).sort()
      const text = htmlText(cells.eq(1).find('.implicitMod').first().html() || cells.eq(1).html())
      if (tier < 1 || tier > 6 || !itemClasses.length || !text) return
      const effectKey = eldritchEffectKey(text)
      const key = `${source}:${effectKey}:${itemClasses.join(',')}`
      const displayTags = cells.eq(1).find('[data-tag]').map((__, badge) => ({
        id: cleanText($(badge).attr('data-tag')),
        label: cleanText($(badge).text()) || cleanText($(badge).attr('data-tag'))
      })).get().filter((tag) => tag.id)
      if (!groups.has(key)) groups.set(key, {
        id: stableCraftingId('eldritch-family', key), source, effectKey,
        name: effectKey.replaceAll('#', '').replace(/\s+/g, ' ').trim() || text,
        itemClasses, tags: [], displayTags: [], tiers: []
      })
      const group = groups.get(key)
      group.tags = [...new Set([...group.tags, ...displayTags.map((tag) => tag.id)])]
      group.displayTags = [...new Map([...group.displayTags, ...displayTags].map((tag) => [tag.id, tag])).values()]
      group.tiers.push({
        id: stableCraftingId('eldritch-tier', `${key}:${tier}:${text}`), tier,
        name: `T${tier}`, requiredLevel: Math.max(1, Number(cleanText(cells.eq(0).text())) || 1),
        text, values: numberRanges(text), displayTags, weights
      })
    })
  })
  return [...groups.values()].map((family) => ({
    ...family,
    tiers: [...new Map(family.tiers.sort((a, b) => a.tier - b.tier).map((tier) => [tier.tier, tier])).values()]
  })).filter((family) => family.tiers.some((tier) => Object.values(tier.weights).some((weight) => weight > 0)))
    .sort((a, b) => a.source.localeCompare(b.source) || a.itemClasses.join().localeCompare(b.itemClasses.join()) || a.name.localeCompare(b.name, 'zh-CN'))
}

const VAAL_ITEM_CLASSES = Object.freeze({
  Claws: 'Claw', Daggers: 'Dagger', Rune_Daggers: 'RuneDagger', Wands: 'Wand',
  One_Hand_Swords: 'OneHandSword', Thrusting_One_Hand_Swords: 'ThrustingOneHandSword',
  One_Hand_Axes: 'OneHandAxe', One_Hand_Maces: 'OneHandMace', Sceptres: 'Sceptre',
  Bows: 'Bow', Staves: 'Staff', Warstaves: 'Warstaff', Two_Hand_Swords: 'TwoHandSword',
  Two_Hand_Axes: 'TwoHandAxe', Two_Hand_Maces: 'TwoHandMace', Quivers: 'Quiver',
  Shields: 'Shield', Gloves: 'Gloves', Boots: 'Boots', Body_Armours: 'BodyArmour',
  Helmets: 'Helmet', Amulets: 'Amulet', Rings: 'Ring', Belts: 'Belt'
})

function vaalWeights($, cell) {
  const weights = {}
  let hasUnsupportedClass = false
  cell.find('a.ItemClasses').each((_, link) => {
    const profile = cleanText($(link).attr('href'))
    const itemClass = VAAL_ITEM_CLASSES[profile]
    if (!itemClass) { hasUnsupportedClass = true; return }
    const match = String(link.nextSibling?.data || '').match(/\(([\d.]+)\)/)
    const weight = Number(match?.[1])
    if (Number.isFinite(weight) && weight > 0) weights[itemClass] = weight
  })
  return hasUnsupportedClass ? null : weights
}

/** Parse current POEDB Vaal Orb corrupted implicit rows for supported non-jewel equipment. */
export function parsePoedbCorruptedImplicits(html) {
  const $ = load(html)
  const groups = new Map()
  $('#瓦尔宝珠已腐化固定 table tbody tr').each((_, row) => {
    const cells = $(row).find('td')
    if (cells.length < 3) return
    const weights = vaalWeights($, cells.eq(2))
    if (!weights || !Object.keys(weights).length) return
    const text = htmlText(cells.eq(1).html())
    const requiredLevel = Math.max(1, Number(cleanText(cells.eq(0).text())) || 1)
    if (!text) return
    const effectKey = modifierEffectKey(text)
    const itemClasses = Object.keys(weights).sort()
    const key = `${effectKey}:${itemClasses.join(',')}`
    if (!groups.has(key)) groups.set(key, {
      id: stableCraftingId('corrupted-implicit-family', key), source: 'vaal', effectKey,
      name: effectKey.replaceAll('#', '').replace(/\s+/g, ' ').trim() || text,
      itemClasses, tags: [], displayTags: [], tiers: []
    })
    const displayTags = inferCatalystDisplayTags(text)
    const group = groups.get(key)
    group.tags = [...new Set([...group.tags, ...displayTags.map((tag) => tag.id)])]
    group.displayTags = [...new Map([...group.displayTags, ...displayTags].map((tag) => [tag.id, tag])).values()]
    group.tiers.push({ requiredLevel, text, values: numberRanges(text), displayTags, weights })
  })
  return [...groups.values()].map((family) => ({
    ...family,
    tiers: family.tiers.sort((a, b) => b.requiredLevel - a.requiredLevel || a.text.localeCompare(b.text, 'zh-CN')).map((tier, index) => ({
      ...tier, tier: index + 1, name: `T${index + 1}`,
      id: stableCraftingId('corrupted-implicit-tier', `${family.id}:${tier.requiredLevel}:${tier.text}`)
    }))
  })).filter((family) => family.tiers.some((tier) => Object.values(tier.weights).some((weight) => weight > 0)))
    .sort((a, b) => a.itemClasses.join().localeCompare(b.itemClasses.join()) || a.name.localeCompare(b.name, 'zh-CN'))
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
