import { createHash } from 'node:crypto'
import { ChaosRecipeError } from '../chaosRecipe/errors.js'
import { ATLAS_MAP_CLASS_ALIASES, canonicalAtlasMapClass } from '../../../shared/mapItemClasses.js'
import { createItemStructureResolver } from './itemStructure.js'
import { sameStatPluralFamily, statNumber, statVariantApplies } from './statVariants.js'
import { stripFixedValueAnnotation } from '../../../shared/itemModifierText.js'
import { createUniqueNameResolver } from './uniqueName.js'
import { createSupportGemResolver } from './supportGem.js'

const cjk = /[\u3400-\u9fff]/u
const compact = value => String(value || '').replace(/\s+/g, ' ').trim()
const normalizeIdentity = value => compact(value).normalize('NFKC').toLocaleLowerCase('en-US')
const displayText = value => String(value || '').replace(/\\r\\n|\\n/g, '\n').replace(/\\r/g, '\n')
  .replace(/\[([^\]|]+)\|([^\]]*)\]/g, '$2').replace(/\[([^\]]+)\]/g, '$1')
  .replace(/<[^<>]+>\{([^{}]*)\}/g, '$1')
const visibleText = value => displayText(value).split(/\r?\n/).map(compact).join('\n').trim()
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const placeholders = /\{(\d+)(?::([^}]+))?\}|#/g
const numeric = '([+-]?\\d+(?:\\.\\d+)?(?:[（(][+-]?\\d+(?:\\.\\d+)?[-–—][+-]?\\d+(?:\\.\\d+)?[）)])?)'
const patternKey = value => compact(value).replace(placeholders, '#')
  .replace(/[+-]?\d+(?:\.\d+)?(?:[（(][+-]?\d+(?:\.\d+)?[-–—][+-]?\d+(?:\.\d+)?[）)])?/g, '#').replace(/[+-]#/g, '#')
const abstractTemplate = value => compact(value).replace(placeholders, '#').replace(/[+-]#/g, '#')
const itemRarityStats = new Set(['base_item_found_rarity_+%', 'item_found_rarity_+%', 'map_implicit_item_drop_rarity_+%'])

// These are clipboard structure tokens, not item identities or translated stat names.
const labels = new Map(Object.entries({
  '物品类别': 'Item Class', '物品種類': 'Item Class', '物品种类': 'Item Class', '物品類別': 'Item Class',
  '稀有度': 'Rarity', '品质': 'Quality', '品質': 'Quality', '物品等级': 'Item Level', '物品等級': 'Item Level',
  '需求': 'Requirements', '需求條件': 'Requirements', '等级': 'Level', '等級': 'Level',
  '力量': 'Str', '敏捷': 'Dex', '智慧': 'Int', '护甲': 'Armour', '護甲': 'Armour',
  '闪避值': 'Evasion Rating', '閃避值': 'Evasion Rating', '能量护盾': 'Energy Shield', '能量護盾': 'Energy Shield',
  '结界': 'Ward', '結界': 'Ward', '插槽': 'Sockets', '物理伤害': 'Physical Damage', '物理傷害': 'Physical Damage',
  '元素伤害': 'Elemental Damage', '元素傷害': 'Elemental Damage', '混沌伤害': 'Chaos Damage', '混沌傷害': 'Chaos Damage',
  '攻击暴击率': 'Critical Strike Chance', '攻擊暴擊率': 'Critical Strike Chance', '暴擊率': 'Critical Strike Chance',
  '每秒攻击次数': 'Attacks per Second', '每秒攻擊次數': 'Attacks per Second',
  '格挡几率': 'Chance to Block', '格擋率': 'Chance to Block', '堆叠数量': 'Stack Size', '堆疊數量': 'Stack Size',
  '地图阶级': 'Map Tier', '地圖階級': 'Map Tier', '区域等级': 'Area Level', '區域等級': 'Area Level',
  '怪物等级': 'Monster Level', '怪物等級': 'Monster Level',
  '物品数量': 'Item Quantity', '物品數量': 'Item Quantity', '物品稀有度': 'Item Rarity', '群怪数量': 'Monster Pack Size',
  '怪群大小': 'Monster Pack Size', '怪物群大小': 'Monster Pack Size'
}))
for (const [canonical, aliases] of Object.entries({
  'Item Tier': ['物品阶级', '物品階級'],
  'Atlas Drops': ['异界掉落', '異界掉落'], 'More Threads': ['更多丝线', '更多絲線'],
  'More Maps': ['更多地图', '更多地圖'], 'More Scarabs': ['更多圣甲虫', '更多聖甲蟲'],
  'More Currency': ['更多通货', '更多通貨'],
  'Alert Level Reduction': ['警报等级衰减', '警報等級衰減', '警戒等级降低', '警戒等級降低'],
  'Time before Lockdown': ['封锁前的时间', '封鎖前的時間'],
  'Maximum Alive Reinforcements': ['最大存活援军', '最大存活援軍'],
  'Heist Target': ['抢劫目标', '搶劫目標'], 'Client': ['客户', '客戶'], 'Target Value': ['目标价值', '目標價值'],
  'Wings Revealed': ['已揭露的侧厅', '已揭露的側廳'],
  'Escape Routes Revealed': ['已揭露的逃生路线', '已揭露的逃生路線'],
  'Reward Rooms Revealed': ['已揭露的奖励房间', '已揭露的獎勵房間'],
  'Weapon Range': ['武器范围', '武器範圍', '武器距離']
})) for (const alias of aliases) labels.set(alias, canonical)
const rarities = new Map(Object.entries({ 普通: 'Normal', 魔法: 'Magic', 稀有: 'Rare', 传奇: 'Unique', 傳奇: 'Unique', 通货: 'Currency', 通貨: 'Currency', 宝石: 'Gem', 寶石: 'Gem', 命运卡: 'Divination Card', 命運卡: 'Divination Card', 任务: 'Quest', 任務: 'Quest' }))
const categories = new Map(Object.entries({
  戒指: 'Rings', 护身符: 'Amulets', 護身符: 'Amulets', 項鍊: 'Amulets', 项链: 'Amulets', 腰带: 'Belts', 腰帶: 'Belts',
  头部: 'Helmets', 頭部: 'Helmets', 头盔: 'Helmets', 頭盔: 'Helmets', 胸甲: 'Body Armours', 手套: 'Gloves', 鞋子: 'Boots', 鞋: 'Boots',
  盾牌: 'Shields', 箭袋: 'Quivers', 珠宝: 'Jewels', 珠寶: 'Jewels', 深渊珠宝: 'Abyss Jewels', 深淵珠寶: 'Abyss Jewels',
  爪: 'Claws', 匕首: 'Daggers', 符文匕首: 'Rune Daggers', 法杖: 'Wands', 权杖: 'Sceptres', 權杖: 'Sceptres',
  单手剑: 'One Hand Swords', 單手劍: 'One Hand Swords', 单手斧: 'One Hand Axes', 單手斧: 'One Hand Axes',
  单手锤: 'One Hand Maces', 單手錘: 'One Hand Maces', 双手剑: 'Two Hand Swords', 雙手劍: 'Two Hand Swords',
  双手斧: 'Two Hand Axes', 雙手斧: 'Two Hand Axes', 双手锤: 'Two Hand Maces', 雙手錘: 'Two Hand Maces',
  弓: 'Bows', 长杖: 'Staves', 長杖: 'Staves', 战杖: 'Warstaves', 戰杖: 'Warstaves',
  异界地图: 'Maps', 異界地圖: 'Maps', 地图: 'Maps', 地圖: 'Maps', 地图碎片: 'Map Fragments', 地圖碎片: 'Map Fragments',
  通货: 'Stackable Currency', 通貨: 'Stackable Currency', 可堆疊通貨: 'Stackable Currency', 可堆叠通货: 'Stackable Currency',
  技能宝石: 'Skill Gems', 技能寶石: 'Skill Gems', 辅助宝石: 'Support Gems', 輔助寶石: 'Support Gems',
  命运卡: 'Divination Cards', 命運卡: 'Divination Cards', 生命药剂: 'Life Flasks', 生命藥劑: 'Life Flasks',
  魔力药剂: 'Mana Flasks', 魔力藥劑: 'Mana Flasks', 混合药剂: 'Hybrid Flasks', 混合藥劑: 'Hybrid Flasks',
  功能药剂: 'Utility Flasks', 功能藥劑: 'Utility Flasks', 裂隙之石: 'Breachstones', 远征日志: 'Expedition Logbooks', 探險日誌: 'Expedition Logbooks'
}))
const states = new Map(Object.entries({ 改造: 'Transfigured', 已腐化: 'Corrupted', 已汙染: 'Corrupted', 已污染: 'Corrupted', 未鉴定: 'Unidentified', 未鑑定: 'Unidentified', 已复制: 'Mirrored', 已複製: 'Mirrored', 已分裂: 'Split', 不可改变: 'Unmodifiable', 無法改變: 'Unmodifiable' }))
for (const [canonical, aliases] of Object.entries({
  Contracts: ['契约', '契約'], Blueprints: ['蓝图', '藍圖'],
  'Cluster Jewels': ['星团珠宝', '星團珠寶'], 'Warstaves': ['战杖', '戰杖']
})) for (const alias of aliases) categories.set(alias, canonical)
for (const [alias, canonical] of Object.entries(ATLAS_MAP_CLASS_ALIASES)) categories.set(alias, canonical)
for (const [canonical, aliases] of Object.entries({
  'Synthesised Item': ['忆境物品', '憶境物品'], 'Shaper Item': ['塑界者物品'],
  'Elder Item': ['裂界者物品'], 'Crusader Item': ['圣战者物品', '聖戰者物品'],
  'Redeemer Item': ['救赎者物品', '救贖者物品'], 'Hunter Item': ['狩猎者物品', '狩獵者物品'],
  'Warlord Item': ['督军物品', '督軍物品'], 'Searing Exarch Item': ['焚界者物品'],
  'Eater of Worlds Item': ['灭界者物品', '滅界者物品']
})) for (const alias of aliases) states.set(alias, canonical)

function failure(code, message, lines = []) {
  return new ChaosRecipeError(code, message, { lines: lines.slice(0, 8).map(line => String(line).slice(0, 300)) })
}

function template(value) {
  const text = compact(value)
  const parts = []
  const tokens = []
  let cursor = 0
  let sequential = 0
  for (const match of text.matchAll(placeholders)) {
    parts.push(escape(text.slice(cursor, match.index)))
    parts.push(numeric)
    tokens.push({ key: match[0] === '#' ? sequential++ : Number(match[1]), format: match[2] || '' })
    cursor = match.index + match[0].length
  }
  parts.push(escape(text.slice(cursor)))
  if (!tokens.length || /[{}]/.test(text.replace(placeholders, ''))) return null
  return { expression: new RegExp(`^${parts.join('')}$`, 'u'), tokens, text }
}

function render(text, values) {
  let sequential = 0
  return text.replace(placeholders, (token, key, format) => {
    const value = values.get(token === '#' ? sequential++ : Number(key))
    if (value == null) throw failure('LOCALIZATION_TEMPLATE_INCOMPATIBLE', '翻译模板的参数无法对应，请更新汉化资源')
    return format?.includes('+') && !/^[+-]/.test(value) ? `+${value}` : value
  })
}

function numberValues(match, tokens) {
  const values = new Map()
  for (let index = 0; index < tokens.length; index++) {
    const value = match[index + 1].replaceAll('（', '(').replaceAll('）', ')')
    if (statNumber(value) === null) return null
    const previous = values.get(tokens[index].key)
    if (previous != null && previous !== value) return null
    values.set(tokens[index].key, value)
  }
  return values
}

function normalizeHeader(line) {
  if (!line.startsWith('{') || !line.endsWith('}')) return null
  const quoted = []
  const protectedLine = line.replace(/"(?:\\.|[^"\\])*"/g, value => { quoted.push(value); return `__NAME${quoted.length - 1}__` })
  const [structure, ...tags] = protectedLine.split('—')
  // These are the stable ModDescriptionLine / EldritchCurrencyTier display fields;
  // quoted modifier names and descriptive tags are not structural metadata.
  let text = structure.replace(/[（]/g, '(').replace(/[）]/g, ')').replace(/：/g, ':').replace(/，/g, ',')
    .replace(/焚界者基底(?:词缀|詞綴)|灼烙總督固定詞綴/g, 'Searing Exarch Implicit Modifier')
    .replace(/灭界者基底(?:词缀|詞綴)|吞噬天地固定詞綴/g, 'Eater of Worlds Implicit Modifier')
    .replace(/腐化基底(?:属性|词缀)|已汙染固定詞綴/g, 'Corruption Implicit Modifier')
    .replace(/退化基底词缀|殘存固定詞綴/g, 'Vestigial Implicit Modifier')
    .replace(/秽生传奇词缀/g, 'Foulborn Unique Modifier')
    .replace(/附魔基底属性|附魔固定詞綴/g, 'Enchantment Modifier')
    .replace(/已大師工藝|大[师師][级級]|工[艺藝](?:[属屬]性|[词詞][缀綴])?/g, 'Master Crafted')
    .replace(/已破裂|(?:破碎|破裂|分裂)的?/g, 'Fractured')
    .replace(/前[缀綴](?:[属屬]性|[词詞][缀綴])?/g, 'Prefix Modifier')
    .replace(/[后後][缀綴](?:[属屬]性|[词詞][缀綴])?/g, 'Suffix Modifier')
    .replace(/(?:[隐隱]式|固定)(?:[属屬]性|[词詞][缀綴])?/g, 'Implicit Modifier')
    .replace(/基底(?:[属屬]性|[词詞][缀綴])/g, 'Implicit Modifier')
    .replace(/(?:[传傳]奇)(?:[属屬]性|[词詞][缀綴])/g, 'Unique Modifier')
    .replace(/附魔(?:[属屬]性|[词詞][缀綴])?/g, 'Enchant')
    .replace(/(?:等[阶階]|位[阶階]|階級|階層)\s*:/g, 'Tier:')
    .replace(/等[级級]\s*:/g, 'Lvl:')
  const grades = new Map([
    ['Lesser', 'Lesser'], ['次级', 'Lesser'], ['低階', 'Lesser'],
    ['Greater', 'Greater'], ['高级', 'Greater'], ['高階', 'Greater'],
    ['Grand', 'Grand'], ['顶级', 'Grand'], ['宏偉', 'Grand'],
    ['Exceptional', 'Exceptional'], ['卓越', 'Exceptional'],
    ['Exquisite', 'Exquisite'], ['精美的', 'Exquisite'], ['精緻', 'Exquisite'],
    ['Perfect', 'Perfect'], ['完美的', 'Perfect'], ['完美', 'Perfect']
  ])
  text = text.replace(/\(([^()]*)\)/g, (match, value) => grades.has(value.trim()) ? `(${grades.get(value.trim())})` : match)
    .replace(/\s*\(/g, ' (')
  if (!/\b(?:Prefix|Suffix|Implicit|Base|Unique|Crafted|Enchant(?:ment)?|Fractured)\b/.test(text)) {
    throw failure('LOCALIZATION_HEADER_UNRESOLVED', '详细词缀类型无法识别，已阻止查询', [line])
  }
  const sources = [...text.matchAll(/\b(?:Searing Exarch|Eater of Worlds)\b/g)]
  const affixes = [...text.matchAll(/\b(?:Prefix|Suffix) Modifier\b/g)]
  if (sources.length > 1 || affixes.length > 1 || [...text.matchAll(/\bTier\s*:/g)].length > 1) {
    throw failure('LOCALIZATION_HEADER_UNRESOLVED', '详细词缀头的来源或阶级有歧义，已停止解析', [line])
  }
  const remaining = text.replace(/__NAME\d+__/g, '')
    .replace(/\((?:(?:Tier|Rank|Lvl):\s*\d+(?:,\s*(?:Tier|Rank|Lvl):\s*\d+)*|Lesser|Greater|Grand|Exceptional|Exquisite|Perfect)\)/g, '')
    .replace(/\b(?:Searing Exarch|Eater of Worlds|Master Crafted|Fractured|Crafted|Foulborn|Corruption|Corrupted|Vestigial|Scourge|Veiled|Imbued|Mercenary|Delve|Ultimatum|Sanctum|Crucible|Prefix|Suffix|Implicit|Base|Unique|Enchant(?:ment)?|Modifier)\b/g, '')
    .replace(/[{}\s▲▽]/g, '')
  if (remaining) throw failure('LOCALIZATION_HEADER_UNRESOLVED', '详细词缀头包含未识别的结构信息，已停止解析', [line])
  return [text, ...tags].join('—').replace(/__NAME(\d+)__/g, (_, index) => quoted[Number(index)])
}

/** Translate only exact aliases and verified numeric templates, never fuzzy-match item identity. */
export function createLocalizationDictionary(entries = []) {
  const aliases = new Map()
  const bases = new Map()
  const patterns = new Map()
  const english = new Map()
  const englishPatterns = new Map()
  const tradeMatcherCache = new WeakMap()
  const validated = entries.filter(entry => entry?.table && entry.id && entry.field && ['dat', 'stat'].includes(entry.kind) &&
    (!entry.sourceHash || entry.sourceHash === createHash('sha256').update(String(entry.en)).digest('hex')))
  const modifierNames = new Set(validated.filter(entry => entry.kind === 'dat' && entry.field === 'Name' &&
    /(?:^|[/\\])mods(?:\.datc?64)?$/i.test(entry.table))
    .flatMap(entry => [entry.en, entry.cn, entry.tw]).filter(Boolean).map(value => compact(displayText(value))))
  const structure = createItemStructureResolver(validated,{visibleText,translate:value=>translate(value),failure})
  const uniqueName = createUniqueNameResolver(validated)
  const supportGem = createSupportGemResolver(validated)
  const displayed = validated.flatMap(entry => {
    const normalized = { ...entry, en: visibleText(entry.en), cn: visibleText(entry.cn), tw: visibleText(entry.tw) }
    const sourceLines = normalized.en.split('\n')
    if (sourceLines.length === 1) return [normalized]
    // A line alias is safe only when its numbered parameters remain on the same line.
    const keys = text => [...String(text).matchAll(placeholders)].map(match => match[1] ?? '#').sort().join(',')
    const lines = sourceLines.map((en, index) => ({ ...entry, en, fragmentOf: normalized, fragmentIndex: index,
      ...Object.fromEntries(['cn', 'tw'].map(locale => {
        const values = normalized[locale].split('\n')
        return [locale, values.length === sourceLines.length && keys(values[index]) === keys(en) ? values[index] : '']
      }))
    }))
    return [normalized, ...lines]
  })
  const usageDescriptions = new Set(validated.filter(entry => entry.kind === 'dat' && entry.table.toLowerCase() === 'clientstrings' &&
    /^ItemDescription/.test(entry.id) && !['ItemDescriptionGemQualityStatDivider', 'ItemDescriptionIncursionAccessibleRooms', 'ItemDescriptionIncursionInaccessibleRooms'].includes(entry.id))
    .flatMap(entry => [entry.en, entry.cn, entry.tw]).filter(Boolean).map(value => compact(displayText(value))))
  const statGroups = new Map()
  const abstractRows = new Map()
  for (const entry of displayed) {
    const group = `${entry.table}\0${entry.id}`
    if (!statGroups.has(group)) statGroups.set(group, [])
    statGroups.get(group).push(entry)
    const shape = abstractTemplate(entry.en)
    if (!abstractRows.has(shape)) abstractRows.set(shape, [])
    abstractRows.get(shape).push(entry)
  }
  for (const entry of displayed) {
    const en = entry.en
    if (!en || en.length > 8192) continue
    const target = template(en)
    const values = [en, entry.cn, entry.tw].filter(Boolean)
    const englishKey = compact(en)
    if (!english.has(englishKey)) english.set(englishKey, new Set())
    for (const value of values) english.get(englishKey).add(value)
    if (target) {
      const key = patternKey(en)
      if (!englishPatterns.has(key)) englishPatterns.set(key, [])
      englishPatterns.get(key).push({ ...target, values, entry })
    }
    if (!target && entry.kind === 'dat' && entry.field === 'Name' && /(?:^|[/\\])baseitemtypes(?:\.[a-z0-9]+)?$/i.test(entry.table)) {
      for (const value of values.map(compact)) {
        if (!bases.has(value)) bases.set(value, new Set())
        bases.get(value).add(en)
      }
    }
    for (const value of [entry.tw, entry.cn]) {
      const alias = compact(value)
      if (!alias || alias === en || alias.length > 8192 || !cjk.test(alias)) continue
      const localized = template(alias)
      if (target || localized) {
        if (!target || !localized) continue
        const keys = values => [...new Set(values.map(({ key }) => key))].sort().join(',')
        if (keys(target.tokens) !== keys(localized.tokens)) continue
        const key = patternKey(alias)
        if (!patterns.has(key)) patterns.set(key, new Map())
        const identity = `${alias}\0${en}`
        const current = patterns.get(key).get(identity)
        if (current) current.entries.push(entry)
        else patterns.get(key).set(identity, { ...localized, en, entries: [entry] })
      } else {
        if (!aliases.has(alias)) aliases.set(alias, new Map())
        if (!aliases.get(alias).has(en)) aliases.get(alias).set(en, [])
        aliases.get(alias).get(en).push(entry)
      }
    }
  }
  const baseMatchers = [...bases].map(([alias, values]) => ({ needle: normalizeIdentity(alias), values }))
  function resolveMagicBaseName(value, headers = [], extraBases = []) {
    let name = normalizeIdentity(value)
    const word = value => /[\p{Script=Latin}\p{N}_]/u.test(value || '')
    const affixes = headers.map(line => line.trim())
      .filter(line => line.startsWith('{') && /\b(?:Prefix|Suffix) Modifier\b/.test(line))
      .map(line => line.match(/"([^"]+)"/)?.[1]).filter(value => modifierNames.has(compact(value)))
      .map(normalizeIdentity).sort((a, b) => b.length - a.length)
    while (affixes.length) {
      const index = affixes.findIndex(affix =>
        (name.startsWith(affix) && (!word(affix.at(-1)) || !word(name[affix.length]))) ||
        (name.endsWith(affix) && (!word(affix[0]) || !word(name[name.length - affix.length - 1]))))
      if (index < 0) break
      const [affix] = affixes.splice(index, 1)
      const atStart = name.startsWith(affix) && (!word(affix.at(-1)) || !word(name[affix.length]))
      name = (atStart ? name.slice(affix.length) : name.slice(0, -affix.length)).trim()
    }
    const matches = []
    const matchers = [...baseMatchers, ...extraBases.filter(Boolean).map(base => ({ needle: normalizeIdentity(base), values: new Set([base]) }))]
    for (const { needle, values } of matchers) {
      if (!needle) continue
      for (let start = name.indexOf(needle); start >= 0; start = name.indexOf(needle, start + 1)) {
        const end = start + needle.length
        if ((word(needle[0]) && word(name[start - 1])) || (word(needle.at(-1)) && word(name[end]))) continue
        matches.push({ start, end, values })
      }
    }
    const maximal = matches.filter(match => !matches.some(other => other.start <= match.start && other.end >= match.end && other.end - other.start > match.end - match.start))
    const candidates = new Map()
    for (const candidate of maximal.flatMap(({ values }) => [...values])) {
      const key = normalizeIdentity(candidate)
      if (!candidates.has(key)) candidates.set(key, candidate)
    }
    if (candidates.size > 1) throw failure('LOCALIZATION_AMBIGUOUS', '魔法物品名称含多个底材候选，已停止解析', [value])
    return candidates.values().next().value || value
  }
  function fragmentApplies(entry, context) {
    if (!entry.fragmentOf) return true
    if (!context) return false
    const parent = entry.fragmentOf
    const count = parent.en.split('\n').length
    const start = context.index - entry.fragmentIndex
    if (start < 0 || start + count > context.lines.length) return false
    const alternatives = [parent.en, parent.cn, parent.tw].map(value => value.split('\n')).filter(lines => lines.length === count)
    const captured = new Map()
    for (let offset = 0; offset < count; offset++) {
      const raw = compact(displayText(context.lines[start + offset]))
        .replace(/\s*[（(](?:implicit|crafted|enchant|fractured|固定|隐式|隱式|工艺|工藝|附魔|破碎|破裂)[）)]$/i, '')
      let matched = false
      for (const lines of alternatives) {
        const pattern = template(lines[offset])
        const match = pattern && raw.match(pattern.expression)
        const values = match && numberValues(match, pattern.tokens)
        if (!(pattern ? values : raw === compact(lines[offset]))) continue
        if (values && [...values].some(([key, value]) => captured.has(key) && statNumber(captured.get(key)) !== statNumber(value))) continue
        if (values) for (const [key, value] of values) captured.set(key, value)
        matched = true
        break
      }
      if (!matched) return false
    }
    return statVariantApplies(parent, captured) !== false
  }
  function translate(value, tables = null, identities = null, selectCandidate = null, allowEntry = () => true, context = null) {
    const text = compact(displayText(value))
    const applicable = entry => fragmentApplies(entry, context) && allowEntry(entry) && (!tables || tables.includes(String(entry.table).replace(/^.*[/\\]/, '').replace(/\.[^.]+$/, '').toLowerCase())) && statVariantApplies(entry) !== false
    const contextual = new Set()
    let candidates = new Set()
    for (const [en, entries] of aliases.get(text) || []) {
      const matching = entries.filter(applicable)
      if (matching.length) candidates.add(en)
      if (matching.some(entry => entry.fragmentOf)) contextual.add(en)
    }
    for (const pattern of patterns.get(patternKey(text))?.values() || []) {
      const match = text.match(pattern.expression)
      if (!match) continue
      const values = numberValues(match, pattern.tokens)
      const matching = values && pattern.entries.filter(entry => applicable(entry) && statVariantApplies(entry, values) !== false)
      if (matching?.length) candidates.add(render(pattern.en, values))
      if (matching?.some(entry => entry.fragmentOf)) contextual.add(render(pattern.en, values))
    }
    if (contextual.size) candidates = contextual
    if (candidates.size > 1 && identities) {
      const known = [...candidates].filter(candidate => identities.has(candidate))
      if (known.length === 1) return known[0]
    }
    if (candidates.size > 1 && selectCandidate) {
      const selected = selectCandidate([...candidates])
      if (candidates.has(selected)) return selected
    }
    if (candidates.size > 1) throw failure('LOCALIZATION_AMBIGUOUS', `翻译文本存在多个国际服候选，已阻止查询：${text.slice(0, 100)}`, [text])
    return candidates.values().next().value || text
  }
  function tradeStatText(value, catalog = null, type = 'explicit') {
    // Keep the signed value when the official filter exposes only the opposite wording.
    if (catalog && !tradeMatcherCache.has(catalog)) tradeMatcherCache.set(catalog, new Map())
    return value.split('\n').map(line => {
      if (line.startsWith('{')) type = /Fractured/.test(line) ? 'fractured' : /Crafted/.test(line) ? 'crafted' : /Enchant/.test(line) ? 'enchant' : /Implicit|Base|Corruption/.test(line) ? 'implicit' : 'explicit'
      const suffix = line.match(/\s*\((implicit|crafted|enchant|fractured)\)$/i)
      const body = suffix ? line.slice(0, suffix.index) : line
      const lineType = suffix?.[1]?.toLowerCase() || type
      const cached = catalog && tradeMatcherCache.get(catalog)
      if (cached && !cached.has(lineType)) cached.set(lineType, new Set((catalog.stats || []).filter(entry => entry.ids?.[lineType]).flatMap(entry => entry.matchers || []).map(abstractTemplate)))
      const matchers = cached && cached.get(lineType)
      const candidates = new Set()
      for (const pattern of englishPatterns.get(patternKey(compact(body))) || []) {
        const entry = pattern.entry
        const variant = entry.stats?.variants?.[Number(String(entry.field).split(':')[1])]
        if (entry.kind !== 'stat' || !entry.sourceHash || (matchers && matchers.has(abstractTemplate(entry.en)))) continue
        const match = compact(body).match(pattern.expression)
        const values = match && numberValues(match, pattern.tokens)
        if (!values || statVariantApplies(entry, values) !== true) continue
        if (matchers) for (const sibling of statGroups.get(`${entry.table}\0${entry.id}`) || []) {
          if (sibling.sourceHash && sameStatPluralFamily(entry, sibling) && matchers.has(abstractTemplate(sibling.en))) candidates.add(render(sibling.en, values))
        }
        const negated = /^negate 1(?: reminderstring \S+)?$/.test(variant?.handlers || '')
        if (entry.stats?.ids?.length !== 1 ||
            (!negated && (!matchers || !/^(?:reminderstring \S+)?$/.test(variant?.handlers || ''))) ||
            pattern.tokens.length !== 1 || pattern.tokens[0].key !== 0) continue
        for (const positive of statGroups.get(`${entry.table}\0${entry.id}`) || []) {
          if (positive.kind !== 'stat' || !positive.sourceHash || positive.stats?.ids?.length !== 1 || positive.stats.ids[0] !== entry.stats.ids[0]) continue
          const own = positive.stats?.variants?.[Number(String(positive.field).split(':')[1])]
          const target = template(positive.en)
          const opposite = negated ? /^(?:reminderstring \S+)?$/ : /^negate 1(?: reminderstring \S+)?$/
          if (!own || !opposite.test(own.handlers || '') ||
              (matchers && !matchers.has(abstractTemplate(positive.en))) ||
              !target || target.tokens.length !== 1 || target.tokens[0].key !== 0) continue
          candidates.add(render(positive.en, new Map([[0, String(-statNumber(values.get(0)))]])))
        }
      }
      return candidates.size === 1 ? candidates.values().next().value + (suffix?.[0] || '') : line
    }).join('\n')
  }
  function computeAliasesFor(value) {
    const text = compact(displayText(value))
    const result = new Set([visibleText(value)])
    if (structure.isCanonical(text)) return [...new Set([...result,...structure.aliasesFor(text),...[...labels].filter(([,canonical])=>canonical===text).map(([alias])=>alias)])]
    const field = text.match(/^([^:]+):\s*(.*)$/)
    if (field) {
      const labelAliases = [...aliasesFor(field[1]), ...[...labels].filter(([, en]) => en === field[1]).map(([alias]) => alias)]
      const values = field[1] === 'Rarity' ? rarities : field[1] === 'Item Class' ? categories : null
      const valueAliases = values ? [...aliasesFor(field[2]), ...[...values].filter(([, en]) => en === field[2]).map(([alias]) => alias)] : [field[2]]
      for (const label of labelAliases) for (const value of valueAliases) result.add(label + ':' + (value ? ' ' + value : ''))
    }
    for (const [alias, en] of states) if (en === text) result.add(alias)
    const abstract = abstractTemplate
    for (const alias of english.get(text) || []) result.add(alias)
    for (const pattern of englishPatterns.get(patternKey(text)) || []) {
      if (abstract(text) === abstract(pattern.text)) {
        for (const alias of pattern.values) result.add(abstract(alias))
        continue
      }
      const match = text.match(pattern.expression)
      if (!match) continue
      const values = numberValues(match, pattern.tokens)
      if (values && statVariantApplies(pattern.entry, values) !== false) {
        for (const alias of pattern.values) {
          try { result.add(render(alias, values)) } catch { /* incompatible alias */ }
        }
        for (const sibling of statGroups.get(`${pattern.entry.table}\0${pattern.entry.id}`) || []) if (sameStatPluralFamily(pattern.entry, sibling)) result.add(abstract(sibling.en))
      }
    }
    return [...result].filter(alias => {
      if (!cjk.test(alias) || field || states.get(alias) === text) return true
      if (alias.includes('#') || /\{\d/.test(alias)) {
        const candidates = new Set([...(patterns.get(patternKey(alias))?.values() || [])]
          .filter(pattern => abstract(pattern.text) === abstract(alias)).map(pattern => abstract(pattern.en)))
        const target = abstract(text)
        const family = abstractRows.get(target) || []
        return candidates.has(target) && [...candidates].every(candidate => candidate === target || (abstractRows.get(candidate) || []).some(entry => family.some(other => sameStatPluralFamily(entry, other))))
      }
      try { return compact(translate(alias)) === text } catch { return false }
    })
  }
  const aliasCache = new Map()
  function aliasesFor(value) {
    const key = visibleText(value)
    if (!aliasCache.has(key)) {
      const result = Object.freeze(computeAliasesFor(key))
      if (aliasCache.size >= 10000) aliasCache.delete(aliasCache.keys().next().value)
      aliasCache.set(key, result)
    }
    return [...aliasCache.get(key)]
  }
  return {
    resolveMagicBaseName,
    toEnglish(value, { strict = false } = {}) {
      const translated = translate(value)
      if (strict && cjk.test(translated)) throw failure('LOCALIZATION_UNRESOLVED', '文本未匹配当前汉化资源', [value])
      return translated
    },
    aliasesFor,
    searchTemplates() {
      return displayed.filter(entry => entry.kind === 'stat').map(entry => ({ en: entry.en, aliases: [entry.cn, entry.tw].filter(Boolean) }))
    },
    searchEquipmentNotes() {
      return displayed.filter(entry => entry.kind === 'dat' && /^(?:remindertext|baseitemtypes|words)(?:\.datc?64)?$/i.test(entry.table))
        .map(entry => ({ en: entry.en, aliases: [entry.cn, entry.tw].filter(Boolean) }))
    },
    templatesFor(fragment) {
      const needle = compact(fragment).toLocaleLowerCase('en-US')
      return [...english.keys()].filter(text => text.toLocaleLowerCase('en-US').includes(needle))
        .map(en => ({ en, aliases: aliasesFor(en) }))
    },
    localize(value, { locale, tables, ids } = {}) {
      if (!locale) return aliasesFor(value).find(alias => cjk.test(alias)) || String(value || '')
      if (locale === 'en') return String(value || '')
      if (!['cn', 'tw'].includes(locale)) return String(value || '')
      const text = compact(displayText(value))
      const allowed = entry => (!ids?.length || ids.includes(entry.id)) && (!tables?.length || tables.some(table =>
        new RegExp(`(?:^|[/\\\\])${escape(table)}(?:\\.datc?64)?$`, 'i').test(entry.table)))
      const candidates = new Set()
      const add = (entry, values = null, abstract = false) => {
        if (!allowed(entry) || !entry[locale] || entry[locale] === entry.en) return
        let localized
        try { localized = abstract ? abstractTemplate(entry[locale]) : values ? render(entry[locale], values) : entry[locale] }
        catch { return }
        if (localized) candidates.add(localized)
      }
      for (const entry of abstractRows.get(abstractTemplate(text)) || []) {
        if (compact(entry.en) === text) add(entry)
        else if (text.includes('#')) add(entry, null, true)
      }
      for (const pattern of englishPatterns.get(patternKey(text)) || []) {
        const match = text.match(pattern.expression)
        if (!match || !allowed(pattern.entry)) continue
        const values = numberValues(match, pattern.tokens)
        if (values && statVariantApplies(pattern.entry, values) !== false) add(pattern.entry, values)
      }
      return candidates.size === 1 ? candidates.values().next().value : String(value || '')
    },
    resolve(source, { normalizeStatSigns = false, catalog = null, resolveStatAmbiguity = null } = {}) {
      const original = String(source || '')
      let statType = 'explicit'
      const projected = original.split(/\r?\n/)
      if (catalog) {
        let start = 0
        for (let index = 0; index <= projected.length; index++) {
          if (index < projected.length && !/^-{3,}$/.test(projected[index].trim())) continue
          if (start > 0 && usageDescriptions.has(compact(projected.slice(start, index).join('\n')))) projected.fill('', start, index)
          start = index + 1
        }
      }
      const canonical = value => normalizeStatSigns ? tradeStatText(stripFixedValueAnnotation(value), catalog, statType) : value
      const localized=cjk.test(original)
      const heistMetadata=original.split(/\r?\n/).some(line=>{
        const field=line.match(/^([^:：]+)[:：]\s*(.*)$/)
        return field && (labels.get(field[1].replace(/\s+/g,'')) || field[1])==='Item Class'
          && ['Contracts','Blueprints'].includes(categories.get(field[2]) || translate(field[2], ['itemclasses']))
      })
      if (!localized) {
        for (const line of original.split(/\r?\n/).map(value => value.trim())) {
          if (line.startsWith('{') && !normalizeHeader(line)) throw failure('LOCALIZATION_HEADER_UNRESOLVED', '详细词缀头不完整，已停止解析', [line])
        }
        if (!heistMetadata) {
          const lineMappings = original.split(/\r?\n/).map((line, index) => {
            const metadata = projected[index].trim()
            if (metadata.startsWith('{')) statType = /Fractured/.test(metadata) ? 'fractured' : /Crafted/.test(metadata) ? 'crafted' : /Enchant/.test(metadata) ? 'enchant' : /Implicit|Base|Corruption/.test(metadata) ? 'implicit' : 'explicit'
            return { original: line, canonical: canonical(projected[index]) }
          })
          return { text: lineMappings.map(line => line.canonical).join('\n'), localized: false,
            ...(normalizeStatSigns ? { lineMappings } : {}) }
        }
      }
      const input = projected
      const headerEnd = input.findIndex(line => /^-{3,}$/.test(line.trim()))
      const propertiesEnd = input.findIndex((line, index) => index > headerEnd && /^-{3,}$/.test(line.trim()))
      const classField = input.slice(0, headerEnd).map(line => line.match(/^([^:：]+)[:：]\s*(.*)$/))
        .find(field => field && (labels.get(field[1].replace(/\s+/g, '')) || field[1]) === 'Item Class')
      const itemClass = classField && (categories.get(classField[2]) || translate(classField[2], ['itemclasses']))
      const gem = ['Skill Gems', 'Active Skill Gems', 'Support Gems'].includes(itemClass)
      const flask = ['Life Flasks', 'Mana Flasks', 'Hybrid Flasks', 'Utility Flasks'].includes(itemClass)
      const tincture = itemClass === 'Tinctures'
      const identities = catalog && new Set((catalog.items || []).flatMap(entry => [entry.name, entry.baseType, entry.type, entry.text]).filter(Boolean))
      for (let index = 0; index < headerEnd; index++) {
        const field = input[index].match(/^([^:：]+)[:：]/)
        if (!field || ![...labels.values()].includes(labels.get(field[1].trim()) || field[1].trim())) input[index] = input[index].replace(/\[[^\[\]]*\]/g, '').trim()
      }
      const knownLabels = new Set([...labels.values(),...structure.canonicalFields])
      const originalLines = [...input]
      for (let index = headerEnd + 1; index < input.length; index++) input[index] = stripFixedValueAnnotation(input[index])
      const rarityField = input.slice(0, headerEnd).map(line => line.match(/^([^:：]+)[:：]\s*(.*)$/))
        .find(field => field && (labels.get(field[1].replace(/\s+/g, '')) || field[1]) === 'Rarity')
      const unique = rarityField && (rarities.get(rarityField[2]) || rarityField[2]) === 'Unique'
      const rarityValue = rarityField && (rarities.get(rarityField[2]) || rarityField[2])
      const identityIndexes = input.map((line,index) => ({line,index})).filter(({line,index}) => index < headerEnd && line.trim() &&
        !knownLabels.has(labels.get(line.match(/^([^:：]+)[:：]/)?.[1]?.replace(/\s+/g, '')) || line.match(/^([^:：]+)[:：]/)?.[1])).map(({index}) => index)
      const uniqueNameIndex = unique ? input.findIndex((line, index) => index < headerEnd && line.trim() &&
        !knownLabels.has(labels.get(line.match(/^([^:：]+)[:：]/)?.[1]?.replace(/\s+/g, '')) || line.match(/^([^:：]+)[:：]/)?.[1])) : -1
      const chooseStat = candidates => resolveStatAmbiguity?.(candidates, { type: statType })
      // Equipment and map implicit rarity have identical Chinese text but distinct game stats.
      const statScope = type => entry => type !== 'implicit' || !itemClass || !itemRarityStats.has(entry.id) ||
        (entry.id === 'map_implicit_item_drop_rarity_+%') === (itemClass === 'Maps')
      const translateLine = (raw, index) => {
        let line = raw.trim()
        const marked = line.replace(/^##\s+/, '')
        if (gem && (states.has(marked) || [...states.values()].includes(marked) || /^(?:Transfigured|改造)$/.test(marked))) line = marked
        if (identityIndexes.includes(index)) {
          if (['Rare', 'Magic'].includes(rarityValue) && identityIndexes.length > 1 && index === identityIndexes[0]) return line
          const tieredMap = itemClass === 'Maps' && line.match(/^(?:地图|地圖)[（(]\s*(\d+)\s*(?:阶|階)[）)]$/u)
          if (tieredMap) return `Map (Tier ${tieredMap[1]})`
          const namedUnique = unique && identityIndexes.length > 1 && index === uniqueNameIndex
          const tables = namedUnique ? ['words'] : gem ? ['baseitemtypes', 'activeskills', 'gemeffects'] : ['baseitemtypes', 'monstervarieties']
          const uniqueBase = namedUnique && catalog && translate(input[identityIndexes.at(-1)], ['baseitemtypes'], identities)
          const scopedIdentities = uniqueBase ? new Set(catalog.items.filter(entry => entry.baseType === uniqueBase).map(entry => entry.name).filter(Boolean)) : identities
          const resolved = translate(line, tables, scopedIdentities)
          const combination = gem && resolved === line && line.match(/^(.+)\s[（(](.+)[）)]$/u)
          if (combination) {
            const name = `${translate(combination[1], tables, identities)} (${translate(combination[2], tables, identities)})`
            if (catalog?.items?.some(entry => entry.category === 'gem' && entry.text === name)) return name
          }
          return namedUnique && resolved === line ? uniqueName(line, value => translate(value, ['words'], scopedIdentities)) || resolved : resolved
        }
        // Gem descriptions and granted skill effects are not trade stat filters.
        if (gem && index > headerEnd && !/^-{3,}$/.test(line) && !states.has(line) && ![...states.values()].includes(line) &&
            !/^(?:##\s*)?(?:Level|Quality|Requirements|等级|等級|品质|品質|需求|需求條件)\s*[:：]/.test(line) && !/^(?:Transfigured|改造)$/.test(line)) return ''
        // The repeated class in the properties block is metadata, not an item identity.
        if (itemClass && index > headerEnd && index < propertiesEnd && categories.get(line) === itemClass) return itemClass
        if ((flask || tincture) && index > headerEnd && index < propertiesEnd) {
          const metadata = structure.resolveLine(line, { family: tincture ? 'tincture' : 'flask' })
          if (metadata) return metadata
        }
        const annotatedLabel = line.match(/^##\s+([^:：]+)[:：]/u)
        if (annotatedLabel && (labels.has(annotatedLabel[1].replace(/\s+/g,'')) || structure.label(annotatedLabel[1]))) line = line.replace(/^##\s+/, '')
        const structured=heistMetadata ? structure.resolveLine(line) : null
        if (structured) return structured
        const suffixAliases = { '固定': 'implicit', '隐式': 'implicit', '隱式': 'implicit', '工艺': 'crafted', '工藝': 'crafted', '附魔': 'enchant', '破碎': 'fractured', '破裂': 'fractured', '增幅': 'augmented', '未满足': 'unmet', '未滿足': 'unmet' }
        const suffix = line.match(/\s*([（(](implicit|crafted|enchant|fractured|augmented|unmet|固定|隐式|隱式|工艺|工藝|附魔|破碎|破裂|增幅|未满足|未滿足)[）)])$/i)
        const body = suffix ? line.slice(0, suffix.index) : line
        const tail = suffix ? ` (${suffixAliases[suffix[2]] || suffix[2]})` : ''
        const label = body.match(/^([^:：]+)[:：]\s*(.*)$/u)
        if (label) {
          const staticName=labels.get(label[1].replace(/\s+/g, ''))
          const structureName=structure.label(label[1])
          const name = staticName || structureName || translate(label[1])
          if (structure.isCanonical(name) && !staticName && !structureName) throw failure('LOCALIZATION_UNRESOLVED','物品结构标签未匹配当前有效ClientStrings',[line])
          const range = name === 'Weapon Range' && label[2].match(/^(\d+(?:\.\d+)?)\s*米$/u)
          const value = name === 'Rarity' ? rarities.get(label[2]) || label[2]
            : name === 'Item Class' ? canonicalAtlasMapClass(label[2]) || categories.get(label[2]) || translate(label[2], ['itemclasses'])
              : range ? `${range[1]} ${Number(range[1]) === 1 ? 'metre' : 'metres'}` : translate(label[2])
          if (knownLabels.has(name) || ['Rarity', 'Item Class'].includes(name)) return `${name}: ${value}${tail}`
        }
        const header = normalizeHeader(line)
        if (header) {
          statType = /Fractured/.test(header) ? 'fractured' : /Crafted/.test(header) ? 'crafted' : /Enchant/.test(header) ? 'enchant' : /Implicit|Base|Corruption/.test(header) ? 'implicit' : 'explicit'
          return header
        }
        const suffixType = suffix && (suffixAliases[suffix[2]] || suffix[2].toLowerCase())
        const lineType = ['implicit', 'crafted', 'enchant', 'fractured'].includes(suffixType) ? suffixType : statType
        const translated = states.get(body) || supportGem.resolve(body, { catalog, type: lineType }) ||
          translate(body, null, null, index > headerEnd ? candidates => resolveStatAmbiguity?.(candidates, { type: lineType }) : null, statScope(lineType), { lines: input, index })
        return (index === uniqueNameIndex && translated === body ? uniqueName(body, translate) || translated : translated) + tail
      }
      const translated = []
      const lineMappings = []
      const boundary = value => !value.trim() || /^-{3,}$|^\{.*\}$|^[^:：]+[:：]/.test(value.trim())
      for (let index = 0; index < input.length; index++) {
        let end = index + 1
        if (!gem && index > headerEnd && !boundary(input[index])) while (end < input.length && end - index < 32 && !boundary(input[end])) end++
        let consumed = false
        for (let stop = end; stop > index + 1; stop--) {
          const block = input.slice(index, stop).join('\n')
          if (!cjk.test(block)) continue
          const result = canonical(translate(block, null, null, chooseStat, statScope(statType), { lines: input, index }))
          if (result !== compact(block)) {
            translated.push(...result.split('\n'))
            lineMappings.push({ original: originalLines.slice(index, stop).join('\n'), canonical: result })
            index = stop - 1
            consumed = true
            break
          }
        }
        if (!consumed) {
          const resolved = canonical(translateLine(input[index], index))
          translated.push(resolved)
          lineMappings.push({ original: originalLines[index], canonical: resolved })
        }
      }
      const separator = translated.findIndex(line => /^-{3,}$/.test(line))
      const rarity = translated.find(line => /^Rarity:/.test(line))?.slice(7).trim()
      const nameIndexes = translated.map((line, index) => ({ line, index }))
        .filter(({ line, index }) => index < separator && line && !knownLabels.has(line.match(/^([^:]+):/)?.[1]))
      let magicBaseName = null
      if (rarity === 'Magic' && nameIndexes.length === 1 && cjk.test(nameIndexes[0].line)) {
        const resolved = resolveMagicBaseName(nameIndexes[0].line, translated)
        if (resolved !== nameIndexes[0].line) {
          translated[nameIndexes[0].index] = resolved
          magicBaseName = resolved
        }
      }
      const randomName = ['Rare', 'Magic'].includes(rarity) && nameIndexes.length > 1 ? nameIndexes[0].index : -1
      const unresolved = translated.filter((line, index) => cjk.test(line) && index !== randomName && !(line.startsWith('{') && line.endsWith('}')))
      if (unresolved.length) throw failure('LOCALIZATION_UNRESOLVED', `有 ${unresolved.length} 行中文未匹配当前汉化资源，已阻止省略条件查询：${unresolved[0].slice(0, 120)}`, unresolved)
      return { text: translated.join('\n'), localized, lineMappings, ...(magicBaseName ? { magicBaseName } : {}) }
    }
  }
}

export const createLocalizationTextResolver = createLocalizationDictionary

export function localizationStructureAliases(dictionary = null) {
  const aliases = new Map([...labels, ...rarities, ...categories, ...states])
  if (dictionary) for (const canonical of new Set(aliases.values())) {
    for (const alias of dictionary.aliasesFor(canonical)) aliases.set(alias, canonical)
  }
  return Object.fromEntries(aliases)
}
