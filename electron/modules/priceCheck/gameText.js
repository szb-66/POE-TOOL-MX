const cjk = /[\u3400-\u9fff]/u
const compact = value => String(value || '').replace(/\s+/g, ' ').trim()
const equal = (left, right) => compact(left).replace(/\s/g, '') === compact(right).replace(/\s/g, '')
const itemTables = ['baseitemtypes', 'words']
const structureTables = ['clientstrings', 'itemclasses']

// Clipboard terms also cover computed filters that have no literal source line.
const terms = [
  ['Rarity', '稀有度', '稀有度'], ['Item Class', '物品类别', '物品種類'],
  ['Normal', '普通', '普通'], ['Magic', '魔法', '魔法'], ['Rare', '稀有', '稀有'], ['Unique', '传奇', '傳奇'],
  ['Currency', '通货', '通貨'], ['Gem', '宝石', '寶石'], ['Divination Card', '命运卡', '命運卡'],
  ['Quality', '品质', '品質'], ['Item Level', '物品等级', '物品等級'], ['Gem Level', '宝石等级', '寶石等級'],
  ['Map Tier', '地图阶级', '地圖階級'], ['Area Level', '区域等级', '區域等級'],
  ['Armour', '护甲', '護甲'], ['Evasion Rating', '闪避', '閃避值'], ['Energy Shield', '能量护盾', '能量護盾'],
  ['Ward', '结界', '保護'], ['Chance to Block', '格挡', '格擋率'],
  ['Critical Strike Chance', '暴击率', '暴擊率'], ['Attacks per Second', '攻击速度', '每秒攻擊次數'],
  ['Physical DPS', '物理 DPS', '物理 DPS'], ['Elemental DPS', '元素 DPS', '元素 DPS'], ['Total DPS', '总 DPS', '總 DPS'],
  ['Base Defence Percentile', '虚化', '虛化'], ['Linked Sockets', '连接数', '連結數'],
  ['Item Quantity', '物品数量', '物品數量'], ['Item Rarity', '物品稀有度', '物品稀有度'],
  ['Monster Pack Size', '怪群', '怪物群大小', 'ItemDisplayMapPackSizeIncrease'], ['Memory Strands', '回忆束丝', '記憶絲縷', 'ZanaInfluencedItem'],
  ["Dead Man's Sulphur", '亡者硫磺', '亡者硫磺'], ['Chart Shape', '海图形状', '海圖形狀'],
  ['More Maps', '更多地图', '更多地圖'], ['More Scarabs', '更多圣甲虫', '更多聖甲蟲'], ['More Currency', '更多通货', '更多通貨'],
  ['Identified', '已鉴定', '已鑑定'], ['Unidentified', '未鉴定', '未鑑定'],
  ['Corrupted', '腐化', '已汙染', 'ItemPopupCorrupted'], ['Mirrored', '复制', '已複製', 'ItemPopupMirrored'],
  ['Fractured Item', '分裂之物', '破裂之物', 'ItemPopupFracturedItem'],
  ['Split', '分裂', '分化', 'ItemPopupSplit'], ['Foulborn', '秽生', '穢生'],
  ['Synthesised Item', '忆境', '追憶之物', 'ItemPopupSynthesisedItem'],
  ['Searing Exarch Item', '焚界者', '卓烙總督物品', 'ItemPopupSearingExarchItem'], ['Eater of Worlds Item', '灭界者', '吞噬天地物品', 'ItemPopupEaterofWorldsItem'],
  ['Crafted', '工艺', '工藝'], ['Veiled', '影匿', '隱匿', 'UnifiedCraftingCategoryVeiled'], ['Implicit', '基底', '固定'],
  ['Explicit', '外延', '隨機'], ['Pseudo', '综合', '綜合'], ['Enchantment', '附魔', '附魔'],
  ['Scourge', '异度天灾', '災魘'], ['Imbued', '灌注', '已注能', 'ItemPopupImbued'],
  ['Delve', '地心', '掘獄'], ['Sanctum', '禁域', '禁忌聖域'], ['Mercenary', '佣兵', '傭兵'],
  ['Crucible', '古神熔炉', '古神熔炉', false], ['Ultimatum', '致命贪婪', '最後通牒'],
  ['Shaper Item', '有塑界者影响效果', '塑者之物', 'ItemPopupShaperItem'], ['Elder Item', '有裂界者影响效果', '尊師之物', 'ItemPopupElderItem'],
  ['Crusader Item', '有圣战者影响效果', '聖戰軍王物品', 'ItemPopupCrusaderItem'], ['Redeemer Item', '有救赎者影响效果', '救贖者物品', 'ItemPopupRedeemerItem'],
  ['Hunter Item', '有狩猎者影响效果', '狩獵者物品', 'ItemPopupHunterItem'], ['Warlord Item', '有督军影响效果', '總督軍物品', 'ItemPopupWarlordItem'],
  ['Chaos Orb', '混沌石', '混沌石'], ['Divine Orb', '神圣石', '神聖石'],
  ['Mercenary Level', '佣兵等级', '傭兵等級'], ['Legacy', '遗产', '遺產'], ['Tier', '等阶', '階層']
]

function sourcePairs(lineMappings) {
  return lineMappings.flatMap(({ canonical, original }) => {
    const pair = [[compact(canonical), compact(original)]]
    const source = compact(original).match(/^([^:：]+)[:：]\s*(.*)$/)
    const target = compact(canonical).match(/^([^:]+):\s*(.*)$/)
    if (source && target) pair.push([target[1], source[1]], [target[2], source[2]])
    return pair
  }).filter(([canonical, original]) => canonical && original)
}

function inferLanguage(source, pairs, resolver, previous) {
  if (!source) return ['cn', 'tw', 'en'].includes(previous) ? previous : 'en'
  if (!cjk.test(source)) return 'en'
  const score = { cn: 0, tw: 0 }
  for (const [canonical, original] of pairs) {
    if (!cjk.test(original)) continue
    const cn = resolver.localize(canonical, { locale: 'cn', tables: [...itemTables, ...structureTables] })
    const tw = resolver.localize(canonical, { locale: 'tw', tables: [...itemTables, ...structureTables] })
    if (equal(cn, tw)) continue
    if (equal(cn, original)) score.cn++
    if (equal(tw, original)) score.tw++
  }
  if (score.cn !== score.tw) return score.cn > score.tw ? 'cn' : 'tw'
  const header = source.split(/\r?\n-{3,}/, 1)[0]
  if (/^(?:Item Class|Rarity)\s*:/m.test(header) && !pairs.some(([canonical, original]) =>
    !/[:：]/.test(canonical) && cjk.test(original) && !equal(canonical, original) &&
    [...itemTables].some(table => resolver.localize(canonical, { locale: 'cn', tables: [table] }) === original ||
      resolver.localize(canonical, { locale: 'tw', tables: [table] }) === original))) return 'en'
  return /物品種類|物品類別|物品等級|未鑑定|已汙染/.test(source) ? 'tw' : 'cn'
}

export function applyGameTextPresentation(model, { source = '', lineMappings = [], resolver, catalog, texts: extraTexts = [] } = {}) {
  if (!model || !resolver) return model
  if (source && !lineMappings.length) lineMappings = String(source).split(/\r?\n/).map(line => ({ canonical: line, original: line }))
  const pairs = sourcePairs(lineMappings)
  const language = inferLanguage(String(source || ''), pairs, resolver, model.presentation?.language)
  const texts = { ...(source ? {} : model.presentation?.texts || {}) }
  const raw = new Map(pairs)
  const translate = (text, tables, ids) => {
    if (!text) return text
    return resolver.localize(String(text), { locale: language, ...(tables ? { tables } : {}), ...(ids ? { ids } : {}) })
  }
  const remember = (text, tables) => {
    if (!text || typeof text !== 'string') return
    texts[text] = raw.get(text) || (!source && texts[text]) || translate(text, tables)
  }
  for (const [en, cn, tw, id] of terms) {
    const original = raw.get(en) || (!source && texts[en])
    const localized = id === false ? en : translate(en, ['baseitemtypes', ...structureTables], id ? [id] : undefined)
    const display = original || (localized !== en ? localized : language === 'en' ? en : language === 'tw' ? tw : cn)
    for (const key of [en, cn, tw]) texts[key] = display
  }
  texts.Fractured = texts['Fractured Item']
  for (const [canonical, original] of pairs) texts[canonical] = original
  for (const text of [model.item?.name, model.item?.baseType, model.identity?.name, model.identity?.type, model.identity?.displayName]) remember(text, itemTables)
  for (const text of [model.item?.category, model.item?.rarity, model.identity?.categoryLabel]) {
    if (text && !Object.hasOwn(texts, text)) remember(text, structureTables)
  }
  // The parser uses Chinese structural values internally even for English items.
  for (const { canonical, original } of lineMappings) {
    const field = compact(canonical).match(/^(Item Class|Rarity):\s*(.*)$/)
    const sourceField = compact(original).match(/^[^:：]+[:：]\s*(.*)$/)
    if (!field || !sourceField) continue
    const keys = field[1] === 'Item Class' ? [model.item?.category, model.identity?.categoryLabel] : [model.item?.rarity]
    for (const key of keys.filter(Boolean)) texts[key] = sourceField[1]
  }
  const resolution = model.identityResolution
  remember(resolution?.baseType, ['baseitemtypes'])
  for (const candidate of resolution?.candidates || []) {
    remember(candidate.name, ['words'])
    remember(candidate.baseType, ['baseitemtypes'])
  }
  for (const property of [...(model.properties || []), ...(model.information || [])]) {
    if (!Object.hasOwn(texts, property.label)) remember(property.label)
    remember(property.displayValue)
    for (const option of property.options || []) remember(option.label)
  }
  for (const stat of [...(model.stats || []), ...(model.unknownStats || [])]) {
    remember(stat.text)
    if (stat.displayText) texts[stat.text] = stat.displayText
    remember(stat.label)
    for (const source of stat.sources || []) {
      remember(source.text)
      if (source.displayText) texts[source.text] = source.displayText
      remember(source.name)
    }
    for (const candidate of stat.candidates || []) remember(candidate.label)
  }
  for (const group of model.mercenarySkillGroups || []) {
    for (const text of [group.skill?.text, group.skill?.name]) remember(text)
    for (const support of group.supports || []) for (const text of [support.name, support.text]) remember(text)
  }
  for (const text of [...Object.values(catalog?.currencyLabels || {}), ...extraTexts]) remember(text, itemTables)
  model.presentation = { language, texts }
  return model
}
