import { isCurrentSanctumEntry, SANCTUM_RULE_TEXT } from './catalog.js'

const normalized = text => text.normalize('NFC').replace(/\s+/g, '')
const escapePattern = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const ruleChannels = {
  '禁域地图上揭晓了#个额外的房间': ['revealRooms', 'preference'],
  '怪物掉落的遗物数量提高#%': ['relicQuantity', 'preference'],
  '完成一个房间后恢复#坚毅': ['recoveryOnRoom', 'recovery'],
  '当你消灭首领时，获得#坚毅': ['recoveryOnBoss', 'recovery'],
  '每次你使用喷泉时，获得#坚毅': ['recoveryOnFountain', 'recovery'],
  '坚毅恢复提高#%': ['recoveryIncrease', 'recoveryMultiplier'],
  '每个禁域开始时获得#层启迪': ['inspirationOnRun', 'inspiration'],
  '每个楼层开始时获得#层启迪': ['inspirationOnFloor', 'inspiration'],
  '当你获得痛苦时，获得#层启迪': ['inspirationOnAffliction', 'inspiration']
}

export function matchSanctumModifier(catalog, baseId, rawText, { itemLevel = null, corrupted = false, implicit = /\(implicit\)\s*$/.test(rawText) } = {}) {
  // Advanced-copy ranges are descriptive metadata, not a second rolled value.
  const text = normalized(rawText.replace(/\s*\(implicit\)\s*$/, '').replace(/(?<=\d)\(\d+(?:\.\d+)?[—–-]\d+(?:\.\d+)?\)/g, ''))
  const matches = []
  for (const entry of catalog.entries || []) {
    if (entry.kind !== 'modifier' || !entry.baseIds?.includes(baseId) || !isCurrentSanctumEntry(catalog, entry)) continue
    const template = normalized(entry.name)
    const pattern = new RegExp(`^${template.split('#').map(escapePattern).join('([+-]?\\d+(?:\\.\\d+)?)')}$`)
    const match = pattern.exec(text)
    if (!match) continue
    const values = match.slice(1).map(Number)
    const variants = entry.variants.filter(variant => variant.baseId === baseId && variant.ranges.length === values.length
      && variant.ranges.every(([min, max], index) => values[index] >= min && values[index] <= max)
      && (itemLevel === null || variant.level <= itemLevel)
      && (implicit ? corrupted && /腐化/.test(variant.generation) : !/腐化/.test(variant.generation)))
    if (!variants.length) continue
    const [rule, scoreChannel] = ruleChannels[template] || [null, 'preference']
    matches.push({ id: entry.id, name: entry.name, status: 'matched', rawText, values,
      value: values.length === 1 ? values[0] : null, rule, scoreChannel, implicit, sourceId: entry.sourceId })
  }
  if (matches.length !== 1) return { status: 'unknown', rawText, reason: matches.length ? 'AMBIGUOUS_MODIFIER' : 'UNMATCHED_MODIFIER' }
  return matches[0]
}

const ignoredLine = line => /^(?:物品等级|需求|等级|品质|物品类别|稀有度|Item Level|Requirements|Level|Quality)\s*[:：]/i.test(line)
  || /^(?:不可改变|已腐化|已污染|Corrupted|Mirrored|Unmodifiable|已复制)$/.test(line)
  || /^在每轮禁域开启时将此物品放置在遗物祭坛上/.test(line)

export function parseSanctumRelic(rawText, catalog) {
  if (typeof rawText !== 'string' || rawText.length > 100000) throw new Error('圣物文本无效或过长')
  const unknown = reason => ({ status: 'unknown', reason, rawText, modifiers: [], effects: [] })
  const lines = rawText.replace(/\r/g, '').split('\n').map(line => line.trim()).filter(Boolean)
  const itemClass = lines.find(line => /^(物品类别|Item Class)\s*[:：]/i.test(line))?.split(/[:：]/).slice(1).join(':').trim()
  if (!['遗物', '圣物', 'Relics', 'Relic'].includes(itemClass)) return unknown('NOT_SANCTUM_RELIC')
  const rarityIndex = lines.findIndex(line => /^(稀\s*有\s*度|Rarity)\s*[:：]/i.test(line))
  if (rarityIndex < 0) return unknown('RARITY_MISSING')
  const rarity = lines[rarityIndex].split(/[:：]/).at(-1).trim()
  const unique = ['传奇', 'Unique'].includes(rarity)
  if (!unique && !['魔法', '普通', 'Magic', 'Normal'].includes(rarity)) return unknown('RARITY_UNSUPPORTED')
  const endHeader = lines.findIndex((line, index) => index > rarityIndex && /^-{3,}$/.test(line))
  if (endHeader < 0) return unknown('HEADER_INCOMPLETE')
  const header = lines.slice(rarityIndex + 1, endHeader)
  const baseMatches = (catalog.entries || []).filter(entry => entry.kind === 'base' && isCurrentSanctumEntry(catalog, entry)
    && header.some(line => [entry.name, ...entry.aliases].some(name => normalized(line).includes(normalized(name)))))
  if (baseMatches.length !== 1) return unknown(baseMatches.length ? 'AMBIGUOUS_BASE' : 'BASE_UNCONFIRMED')
  const base = baseMatches[0]
  let definition = null
  if (unique) {
    const matches = catalog.entries.filter(entry => entry.kind === 'unique' && entry.baseId === base.id && isCurrentSanctumEntry(catalog, entry)
      && header.some(line => [entry.name, ...entry.aliases].some(name => normalized(line) === normalized(name))))
    if (matches.length !== 1) return unknown('UNIQUE_UNCONFIRMED')
    definition = matches[0]
  }
  const levelText = lines.find(line => /^(物品等级|Item Level)\s*[:：]/i.test(line))?.split(/[:：]/).at(-1).trim()
  const itemLevel = /^\d+$/.test(levelText || '') ? Number(levelText) : null
  const corrupted = lines.some(line => /^(已腐化|已污染|Corrupted)$/.test(line))
  const effects = [], modifiers = [], gaps = [], observedUnique = new Set()
  // Only blocks after the header can contain affixes. Metadata and flavor blocks
  // don't establish a rule; advanced-copy brace blocks preserve unknown affixes.
  const blocks = lines.slice(endHeader + 1).join('\n').split(/\n?-{3,}\n?/)
  for (const block of blocks) {
    const blockLines = block.split('\n').filter(Boolean)
    const advanced = blockLines.some(line => /^\{.*\}$/.test(line))
    const candidates = blockLines.filter(line => !/^\{.*\}$/.test(line) && !ignoredLine(line))
    let implicit = false
    const origins = new Map()
    for (const line of blockLines) {
      if (/^\{.*\}$/.test(line)) implicit = /腐化基底|瓦尔基底|隐式|Corrupted Implicit|Implicit Modifier/i.test(line)
      else origins.set(line, implicit || /\(implicit\)\s*$/.test(line))
    }
    const parsed = candidates.map(line => matchSanctumModifier(catalog, base.id, line, { itemLevel, corrupted, implicit: origins.get(line) }))
    const hasKnown = parsed.some(modifier => modifier.status === 'matched')
      || candidates.some(line => definition?.descriptions.some(text => normalized(text) === normalized(line)))
    if (!advanced && !hasKnown) continue
    for (let index = 0; index < candidates.length; index++) {
      const line = candidates[index]
      const uniqueText = definition?.descriptions.find(text => normalized(text) === normalized(line))
      if (uniqueText) {
        if (observedUnique.has(uniqueText)) { gaps.push(`重复传奇词缀：${line}`); continue }
        observedUnique.add(uniqueText)
        const rule = SANCTUM_RULE_TEXT[uniqueText]
        const minimum = uniqueText.match(/^无法与等级低于 (\d+) 的禁域典籍一起使用$/)
        if (rule) effects.push({ rule, status: 'matched', rawText: line })
        else if (!minimum && uniqueText !== '对禁域使用时摧毁该物品') effects.push({ rule: null, status: 'unknown', rawText: line })
      } else {
        const modifier = parsed[index]
        modifiers.push(modifier)
        if (modifier.status === 'matched') effects.push({ rule: modifier.rule, value: modifier.value, status: modifier.rule ? 'matched' : 'unknown', rawText: line })
        else effects.push({ rule: null, status: 'unknown', rawText: line })
      }
    }
  }
  for (const description of definition?.descriptions || []) if (!observedUnique.has(description)) gaps.push(`传奇词缀缺失或变化：${description}`)
  if (!unique && !modifiers.length) gaps.push('尚未读取到圣物词缀')
  const duplicates = modifiers.filter((modifier, index) => modifier.status === 'matched' && modifiers.slice(0, index).some(other => other.id === modifier.id && other.implicit === modifier.implicit))
  if (duplicates.length) gaps.push('同一词缀重复，需重新复制')
  effects.push(...gaps.map(rawText => ({ rawText, status: 'unknown', rule: null })))
  const minAreaLevel = Math.max(0, ...(definition?.descriptions || []).map(text => Number(text.match(/^无法与等级低于 (\d+) 的禁域典籍一起使用$/)?.[1]) || 0))
  return { status: gaps.length ? 'unknown' : 'matched', reason: gaps.join('；'), rawText, name: definition?.name || header.join(' '),
    baseId: base.id, baseName: base.name, width: base.width, height: base.height, itemLevel, corrupted, unique,
    uniqueId: definition?.id || null, minAreaLevel, modifiers, effects, scoringComplete: !effects.some(effect => effect.status === 'unknown') }
}
