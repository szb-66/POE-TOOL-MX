import { load } from 'cheerio'
import { stableCraftingId } from './model.js'

const SUPPORTED_INFLUENCES = new Set(['shaper', 'elder', 'crusader', 'redeemer', 'hunter', 'warlord'])

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').replace(/—/g, '—').trim()
}

function htmlText(fragment) {
  const $ = load(`<div id="root">${fragment ?? ''}</div>`)
  $('#root br').replaceWith('\n')
  return $('#root').text().split('\n').map(cleanText).filter(Boolean).join('\n')
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
  const itemClassScope = [itemClassCode, baseItemName, ...requiredTags].filter(Boolean).join(':')
  const groups = new Map()
  for (const [sourceKey, records] of Object.entries(payload)) {
    if (!Array.isArray(records)) continue
    const influence = SUPPORTED_INFLUENCES.has(sourceKey) ? sourceKey : null
    const source = sourceKey === 'master' ? 'crafted' : sourceKey === 'fractured' ? 'fractured' : 'natural'
    if (!['normal', 'master', 'fractured'].includes(sourceKey) && !influence) continue
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
          targetScope: influence || 'base',
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
        return {
          id: stableCraftingId('tier', `${group.sourceId}:${record.Level}:${record.Name}:${record.str}:${index}`),
          tier: index + 1,
          name: `T${index + 1} ${cleanText(record.Name)}`.trim(),
          requiredLevel: Number(record.Level) || 1,
          weight: Math.max(0, Number(record.DropChance) || 0),
          text,
          displayTags: displayTagsFromModRecord(record),
          hover: cleanText(record.hover),
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
    goal.tiers = goal.tiers.map((tier, index) => ({ ...tier, tier: index + 1, name: `T${index + 1} ${String(tier.name).replace(/^T\d+\s*/, '')}`.trim() }))
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
    const sourceScope = goal.source === 'crafted' ? 'crafted' : goal.source === 'fractured' ? 'fractured' : influenceScope
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

  const rows = $('table').first().find('tr').map((_, element) => {
    const cells = $(element).find('td')
    if (cells.length < 2) return null
    const name = cleanText(cells.first().text())
    const costText = cleanText(cells.eq(1).text())
    if (!name || /词缀|描述/.test(name)) return null
    if (provider === 'bench' && !cells.first().find('.explicitMod').length) return null
    const effectKind = inferCraftEffectKind(name, provider)
    if (effectKind === 'unsupported') return null
    const sourceId = `${name}:${costText}`
    return {
      id: stableCraftingId('craft', `${provider}:${sourceId}`),
      provider,
      name,
      effectKind,
      itemClasses: cleanText(cells.eq(2).text()).split('·').map(cleanText).filter(Boolean),
      cost: parseCost(costText),
      params: {
        hover: cleanText(cells.first().find('[data-hover]').first().attr('data-hover')),
        unlock: cleanText(cells.eq(3).text())
      }
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
