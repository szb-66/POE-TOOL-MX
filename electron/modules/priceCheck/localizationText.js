import { createHash } from 'node:crypto'
import { ChaosRecipeError } from '../chaosRecipe/errors.js'

const cjk = /[\u3400-\u9fff]/u
const compact = value => String(value || '').replace(/\s+/g, ' ').trim()
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const placeholders = /\{(\d+)(?::([^}]+))?\}|#/g
const numeric = '([+-]?\\d+(?:\\.\\d+)?(?:\\([+-]?\\d+(?:\\.\\d+)?-[+-]?\\d+(?:\\.\\d+)?\\))?)'
const patternKey = value => compact(value).replace(placeholders, '#')
  .replace(/[+-]?\d+(?:\.\d+)?(?:\([+-]?\d+(?:\.\d+)?-[+-]?\d+(?:\.\d+)?\))?/g, '#').replace(/[+-]#/g, '#')

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
  '物品数量': 'Item Quantity', '物品數量': 'Item Quantity', '物品稀有度': 'Item Rarity', '群怪数量': 'Monster Pack Size',
  '怪群大小': 'Monster Pack Size', '怪物群大小': 'Monster Pack Size'
}))
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
const states = new Map(Object.entries({ 已腐化: 'Corrupted', 已汙染: 'Corrupted', 已污染: 'Corrupted', 未鉴定: 'Unidentified', 未鑑定: 'Unidentified', 已复制: 'Mirrored', 已複製: 'Mirrored', 已分裂: 'Split', 不可改变: 'Unmodifiable', 無法改變: 'Unmodifiable' }))

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
    const value = match[index + 1]
    const previous = values.get(tokens[index].key)
    if (previous != null && previous !== value) return null
    values.set(tokens[index].key, value)
  }
  return values
}

function normalizeHeader(line) {
  if (!line.startsWith('{') || !line.endsWith('}')) return null
  const quoted = []
  let text = line.replace(/"[^"]*"/g, value => { quoted.push(value); return `__NAME${quoted.length - 1}__` })
  text = text.replace(/前[缀綴](?:[属屬]性|[词詞][缀綴])?/g, 'Prefix Modifier')
    .replace(/[后後][缀綴](?:[属屬]性|[词詞][缀綴])?/g, 'Suffix Modifier')
    .replace(/(?:[隐隱]式|固定)(?:[属屬]性|[词詞][缀綴])?/g, 'Implicit Modifier')
    .replace(/基底(?:[属屬]性|[词詞][缀綴])/g, 'Base Modifier')
    .replace(/(?:[传傳]奇)(?:[属屬]性|[词詞][缀綴])/g, 'Unique Modifier')
    .replace(/(?:工[艺藝]|大[师師][级級])(?:[属屬]性|[词詞][缀綴])?/g, 'Crafted')
    .replace(/附魔(?:[属屬]性|[词詞][缀綴])?/g, 'Enchant')
    .replace(/(?:破碎|破裂|分裂)的?/g, 'Fractured')
    .replace(/(?:等[阶階]|等[级級])[：:]/g, 'Tier:')
  if (!/\b(?:Prefix|Suffix|Implicit|Base|Unique|Crafted|Enchant|Fractured)\b/.test(text)) {
    throw failure('LOCALIZATION_HEADER_UNRESOLVED', '详细词缀类型无法识别，已阻止查询', [line])
  }
  return text.replace(/__NAME(\d+)__/g, (_, index) => quoted[Number(index)])
}

/** Translate only exact aliases and verified numeric templates, never fuzzy-match item identity. */
export function createLocalizationTextResolver(entries = []) {
  const aliases = new Map()
  const bases = new Map()
  const patterns = new Map()
  for (const entry of entries) {
    if (!entry || !entry.table || !entry.id || !entry.field || !['dat', 'stat'].includes(entry.kind)) continue
    const en = compact(entry.en)
    if (!en || en.length > 8192) continue
    if (entry.sourceHash && entry.sourceHash !== createHash('sha256').update(String(entry.en)).digest('hex')) continue
    const target = template(en)
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
        patterns.get(key).set(`${alias}\0${en}`, { ...localized, en })
      } else {
        if (!aliases.has(alias)) aliases.set(alias, new Set())
        aliases.get(alias).add(en)
        if (entry.kind === 'dat' && /(?:^|[/\\])?baseitemtypes(?:\.[a-z0-9]+)?$/i.test(entry.table)) {
          if (!bases.has(alias)) bases.set(alias, new Set())
          bases.get(alias).add(en)
        }
      }
    }
  }
  function translate(value) {
    const text = compact(value)
    const candidates = new Set(aliases.get(text) || [])
    for (const pattern of patterns.get(patternKey(text))?.values() || []) {
      const match = text.match(pattern.expression)
      if (!match) continue
      const values = numberValues(match, pattern.tokens)
      if (values) candidates.add(render(pattern.en, values))
    }
    if (candidates.size > 1) throw failure('LOCALIZATION_AMBIGUOUS', `翻译文本存在多个国际服候选，已阻止查询：${text.slice(0, 100)}`, [text])
    return candidates.values().next().value || text
  }
  return {
    resolve(source) {
      const original = String(source || '')
      if (!cjk.test(original)) return { text: original, localized: false }
      const input = original.split(/\r?\n/)
      const translated = input.map(raw => {
        const line = raw.trim()
        const label = line.match(/^([^:：]+)[:：]\s*(.*)$/u)
        if (label) {
          const name = labels.get(label[1].replace(/\s+/g, '')) || label[1]
          const value = name === 'Rarity' ? rarities.get(label[2]) || label[2]
            : name === 'Item Class' ? categories.get(label[2]) || translate(label[2]) : translate(label[2])
          if (labels.has(label[1].replace(/\s+/g, '')) || ['Rarity', 'Item Class'].includes(name)) return `${name}: ${value}`
        }
        const header = normalizeHeader(line)
        if (header) return header
        const suffix = line.match(/\s+(\((?:implicit|crafted|enchant|fractured|augmented|unmet)\))$/i)
        const body = suffix ? line.slice(0, suffix.index) : line
        return (states.get(body) || translate(body)) + (suffix ? ` ${suffix[1]}` : '')
      })
      const separator = translated.findIndex(line => /^-{3,}$/.test(line))
      const rarity = translated.find(line => /^Rarity:/.test(line))?.slice(7).trim()
      const nameIndexes = translated.map((line, index) => ({ line, index }))
        .filter(({ line, index }) => index < separator && line && !line.includes(':'))
      if (rarity === 'Magic' && nameIndexes.length === 1 && cjk.test(nameIndexes[0].line)) {
        // Magic names embed affix names around a base. Resolve only literal stable base aliases.
        const matches = [...bases].filter(([alias]) => nameIndexes[0].line.includes(alias))
        const candidates = new Set(matches.flatMap(([, values]) => [...values]))
        if (candidates.size > 1) throw failure('LOCALIZATION_AMBIGUOUS', '魔法物品名称含多个底材候选，已阻止查询', [nameIndexes[0].line])
        if (candidates.size === 1) translated[nameIndexes[0].index] = candidates.values().next().value
      }
      const randomName = ['Rare', 'Magic'].includes(rarity) && nameIndexes.length > 1 ? nameIndexes[0].index : -1
      const unresolved = translated.filter((line, index) => cjk.test(line) && index !== randomName && !(line.startsWith('{') && line.endsWith('}')))
      if (unresolved.length) throw failure('LOCALIZATION_UNRESOLVED', `有 ${unresolved.length} 行中文未匹配当前汉化资源，已阻止省略条件查询：${unresolved[0].slice(0, 120)}`, unresolved)
      return { text: translated.join('\n'), localized: true }
    }
  }
}
