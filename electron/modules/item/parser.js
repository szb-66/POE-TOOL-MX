import { PRICE_CHECK_CLASSIC_INFLUENCES } from '../../../shared/priceCheckMetadata.js'

const CLASSIC_INFLUENCE_LABELS = Object.freeze(Object.fromEntries(
  PRICE_CHECK_CLASSIC_INFLUENCES.flatMap(({ key, aliases }) => aliases.map((alias) => [alias, key]))
))

const stripInjectedPriceTag = (value) => String(value || '')
  .replace(/\s*\[(?:\d+(?:\.\d+)?\s*[cd]\s*)+\]\s*$/i, '')
  .trim()

function parseMercenaryVoucher(lines) {
  const firstSeparator = lines.indexOf('--------')
  if (firstSeparator < 0) return null
  const header = lines.slice(0, firstSeparator)
  const category = header.find((line) => line.startsWith('物品类别:'))?.replace('物品类别:', '').trim()
  if (category !== '地图碎片' || !header.some((line) => stripInjectedPriceTag(line) === '佣兵凭证')) return null

  const sections = []
  let current = []
  for (let index = firstSeparator + 1; index <= lines.length; index += 1) {
    const text = lines[index]
    if (index === lines.length || text === '--------') {
      if (current.length) sections.push(current)
      current = []
    } else {
      current.push({ index, text })
    }
  }
  const buildAt = sections.findIndex((section) => section.some(({ text }) => /^BD构建[：:]/.test(text)))
  if (buildAt < 0) return null
  const buildLine = sections[buildAt].find(({ text }) => /^BD构建[：:]/.test(text))?.text || ''
  const levelLine = sections[buildAt].find(({ text }) => /^佣兵等级[：:]/.test(text))?.text || ''
  const build = buildLine.replace(/^BD构建[：:]\s*/, '').trim()
  const levelMatch = levelLine.match(/^佣兵等级[：:]\s*(\d+)$/)
  if (!build) return null

  const consumedIndexes = new Set()
  for (const section of sections.slice(Math.max(0, buildAt - 1))) {
    for (const { index } of section) consumedIndexes.add(index)
  }
  const skills = []
  for (const section of sections.slice(buildAt + 1)) {
    const texts = section.map(({ text }) => text)
    if (texts.some((text) => text.startsWith('右键点击此物品查看佣兵详情') || text.includes('个人地图装置'))) break
    const [name, ...supportLines] = texts
    if (!name) continue
    const supports = supportLines.map((text) => {
      const match = text.match(/^(.*?)\s*[（(]\s*等阶\s*[：:]?\s*(\d+)\s*[）)]$/)
      return {
        text,
        name: (match?.[1] || text).trim(),
        tier: match ? Number(match[2]) : null
      }
    })
    skills.push({ name, supports })
  }
  return {
    consumedIndexes,
    value: {
      build,
      level: levelMatch ? Number(levelMatch[1]) : 0,
      skills
    }
  }
}

/**
 * Purpose: 解析剪切板中的物品信息，提取物品属性、词缀、插槽等信息
 * Inputs: clipboardText (string) - 从游戏剪切板复制的物品文本
 * Outputs: itemInfo (object) - 解析后的物品信息对象，解析失败返回 null
 * Preconditions: clipboardText 必须是有效的游戏物品文本格式
 * Edge cases: 空文本返回 null；传奇物品特殊处理；未识别物品跳过词缀解析
 * Errors: 解析失败返回 null，不抛出异常
 */

export function parseItemInfo(clipboardText) {
  if (!clipboardText) {
    return null
  }

  const lines = clipboardText.split('\n').map(line => line.trim()).filter(line => line)
  const mercenaryVoucher = parseMercenaryVoucher(lines)
  
  const itemInfo = {
    category: '',
    rarity: '',
    name: '',
    baseName: '',
    quality: 0,
    level: 0,
    gemLevel: 0,
    sockets: '',
    socketsCount: 0,
    socketsColors: {
      red: 0,
      green: 0,
      blue: 0
    },
    itemQuantity: 0,
    itemRarity: 0,
    monsterPackSize: 0,
    areaLevel: 0,
    areaName: '',
    deadmanSulphur: 0,
    chartShape: '',
    mapTier: 0,
    armour: 0,
    evasion: 0,
    energyShield: 0,
    baseDefencePercentile: 0,
    ward: 0,
    block: 0,
    physicalDamage: null,
    elementalDamages: [],
    criticalStrikeChance: 0,
    attacksPerSecond: 0,
    moreMaps: 0,
    moreScarabs: 0,
    moreCurrency: 0,
    memoryLevel: null,
    mercenary: mercenaryVoucher?.value || null,
    isCorrupted: false,
    isUnidentified: false,
    isMirrored: false,
    isSplit: false,
    isFractured: false,
    isMutated: false,
    links: 0,
    implicitMods: [],
    explicitMods: [],
    craftedMods: [],
    detailedMods: [],
    modifiers: [],
    influences: [],
    isUnmodifiable: false,
    isLegendary: false
  }

  let socketLine = ''
  const isMapCategory = (category) => category === '异界地图' || category === '地图'
  const extractMapTier = (text) => {
    if (!text) return 0

    const tierPatterns = [
      /地图阶级:\s*(\d+)/,
      /地图[（(]\s*(\d+)\s*阶[）)]/
    ]

    for (const pattern of tierPatterns) {
      const match = text.match(pattern)
      if (match) {
        return parseInt(match[1])
      }
    }

    return 0
  }
  
  // 物品解析状态标记
  let hasItemLevel = false;
  let seenItemLevel = false;
  let activeModifier = null;
  let identityHeaderOpen = true;

  const cleanModifierLine = (text) => text
    .replace(/(-?\d+(?:\.\d+)?)\((-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)\)/g, '$1')
    .replace(/\((-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)\)/g, '')
    .trim()

  const flushModifier = () => {
    if (!activeModifier || activeModifier.lines.length === 0) {
      activeModifier = null
      return
    }
    const modifier = {
      type: activeModifier.type,
      affixType: activeModifier.affixType || null,
      name: activeModifier.name,
      tier: activeModifier.tier,
      tags: activeModifier.tags,
      lines: [...activeModifier.lines],
      text: activeModifier.lines.join('\n'),
      originalLines: [...activeModifier.originalLines]
    }
    itemInfo.modifiers.push(modifier)
    if (modifier.type === 'prefix' || modifier.type === 'suffix') {
      itemInfo.detailedMods.push(modifier)
      itemInfo.explicitMods.push(...modifier.lines)
    } else if (modifier.type === 'base' || modifier.type === 'implicit') {
      itemInfo.implicitMods.push(...modifier.lines)
    } else if (modifier.type === 'crafted') {
      itemInfo.craftedMods.push(...modifier.lines)
    }
    activeModifier = null
  }
  
  // 当前游戏 Ctrl+C 已直接提供详细属性；仍通过物品等级划定装备词缀区域。
  for (const line of lines) {
    if (line.includes('物品等级:')) {
      hasItemLevel = true;
      break;
    }
  }

  // 需要被过滤的常见描述性文本（出现在底部）
  const ignorePatterns = [
    '点击右键',
    '在私人地图装置',
    '放入一个物品',
    '出售获得通货',
    '将此物品带给瓦莱丽',
    '奖励:',
    '掉落的地图有几率转换为',
    '产生的区域不受你的异界天赋树影响',
    '只能被使用一次',
    '不可改变',
    '已腐化',
    '秽生',
    'Foulborn',
    ...Object.keys(CLASSIC_INFLUENCE_LABELS),
    '焚界者物品',
    '灭界者物品',
    '只能使用',
    '无法使用',
    '无法拥有',
    '地图阶级:', // 地图阶级不是词缀
    '物品数量:', // 地图属性（已专门解析，但保留在ignorePatterns中作为备用过滤）
    '物品稀有度:', // 地图属性（已专门解析，但保留在ignorePatterns中作为备用过滤）
    '怪物群大小:', // 地图属性（已专门解析，但保留在ignorePatterns中作为备用过滤）
    '区域等级:',
    '亡者硫磺:',
    '更多地图:', // T17地图属性（已专门解析，但保留在ignorePatterns中作为备用过滤，防止解析失败时被误处理）
    '更多圣甲虫:', // T17地图属性（已专门解析，但保留在ignorePatterns中作为备用过滤）
    '更多通货:', // T17地图属性（已专门解析，但保留在ignorePatterns中作为备用过滤）
    '怪物等级:', // 地图属性
    '品质:',
    '护甲:',
    '闪避值:',
    '能量护盾:',
    '结界:',
    '格挡几率:',
    '攻击暴击率:',
    '每秒攻击次数:',
    '武器范围:',
    '物理伤害:',
    '元素伤害:',
    '火焰伤害:',
    '冰霜伤害:',
    '闪电伤害:',
    '混沌伤害:',
    '回忆束丝',
    '需求:',
    '等级:',
    '力量:',
    '敏捷:',
    '智慧:',
    '--------'
  ];
  const isClusterJewel = () => /^(?:大型|中型|小型)星团珠宝$/.test(itemInfo.baseName || itemInfo.name)
  const isClusterJewelDescriptionLine = (text) => isClusterJewel() &&
    /^放入天赋树上配置好的.+珠宝槽。增加的天赋跟珠宝范围无关。可以右键点击从插槽中移除。$/.test(text)
  const isIgnoredTextLine = (text) => ignorePatterns.some(pattern => text.includes(pattern)) ||
    isClusterJewelDescriptionLine(text)
  const isExplanationLine = (text) => /^[（(].*[）)]$/.test(text)
  const influenceLabels = {
    ...CLASSIC_INFLUENCE_LABELS,
    '忆境物品': 'synthesised',
    '焚界者物品': 'searing-exarch',
    '灭界者物品': 'eater-of-worlds'
  }
  const parseNumber = (value) => Number(String(value || '').replace(/[+,％%]/g, ''))
  const parseRange = (line) => {
    const match = line.match(/(-?\d+(?:\.\d+)?)\s*[-–—]\s*(-?\d+(?:\.\d+)?)/)
    return match ? { min: Number(match[1]), max: Number(match[2]) } : null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (mercenaryVoucher?.consumedIndexes.has(i)) continue

    const chartShapeMatch = line.match(/^海图形状[：:]\s*(.+)$/)
    if (chartShapeMatch) {
      flushModifier()
      itemInfo.chartShape = chartShapeMatch[1].trim()
      continue
    }
    
    // 详细词缀头信息解析 (Ctrl+C)
    // 示例: { 前缀属性 "韧炼的" (等阶：4) — 伤害, 物理, 攻击 }
    // 示例: { 基底属性 — 伤害, 召唤生物 }
    if (line.startsWith('{') && line.endsWith('}')) {
      flushModifier()
      const affixType = /前缀属性|Prefix Modifier/i.test(line)
        ? 'prefix'
        : (/后缀属性|Suffix Modifier/i.test(line) ? 'suffix' : null)
      const headerModifierName = line.match(/"([^"]*)"/)?.[1] || ''
      const semanticHeader = line.replace(/"[^"]*"/g, '""')
      if (/秽生|\bFoulborn\b/i.test(semanticHeader)) itemInfo.isMutated = true
      // 当前游戏的详细复制会输出类似“破碎的 后缀属性”。语义来源必须先于
      // 前/后缀位置判断，否则破碎词缀会被错误归为 explicit。
      const semanticType = [
        [/(?:破碎|破裂|分裂)(?:的)?|\bFractured\b/i, 'fractured'],
        [/大师级|工艺属性|\b(?:Master Crafted|Crafted)\b/i, 'crafted'],
        [/附魔属性|\bEnchant(?:ment)?\b/i, 'enchant'],
        [/焚界者基底词缀|灭界者基底词缀|\b(?:Searing Exarch|Eater of Worlds) Implicit Modifier\b/i, 'implicit'],
        [/隐式属性|\bImplicit\b/i, 'implicit'],
        [/基底(?:属性|词缀)|\bBase Modifier\b/i, 'base'],
        [/传奇属性|\bUnique Modifier\b/i, 'unique'],
        [/影匿|解密|隐匿属性|\bVeiled\b/i, 'veiled'],
        [/灌注|\bImbued\b/i, 'imbued'],
        [/异度天灾|灾魇属性|\bScourge\b/i, 'scourge'],
        [/佣兵|雇佣兵|\bMercenary\b/i, 'mercenary'],
        [/地心|\bDelve\b/i, 'delve'],
        [/致命贪婪|\bUltimatum\b/i, 'ultimatum'],
        [/禁域|\bSanctum\b/i, 'sanctum'],
        [/古神熔炉|\bCrucible\b/i, 'crucible']
      ].find(([pattern]) => pattern.test(semanticHeader))?.[1] ||
        (/影匿|\bof .*Veil\b/i.test(headerModifierName) ? 'veiled' : null)
      const type = semanticType || affixType
      if (type) {
        try {
          const nameMatch = line.match(/"([^"]+)"/);
          const name = nameMatch ? nameMatch[1] : '';
          
          const tierMatch = line.match(/(?:等阶|等级)[：:]\s*(\d+)|\bTier:\s*(\d+)/i);
          const tier = tierMatch ? parseInt(tierMatch[1] || tierMatch[2]) : 0;
          
          const tagsPart = line.split('—')[1];
          const tags = tagsPart ? tagsPart.replace('}', '').trim().split(',').map(t => t.trim()) : [];
          
          activeModifier = {
            type,
            affixType,
            name,
            tier,
            tags,
            lineIndex: i,
            lines: [],
            originalLines: []
          };
        } catch (e) {
          // 解析词缀头信息失败
        }
      }
      // 所有的 {...} 行都跳过，避免被误识别为词缀
      continue;
    }

    if (activeModifier) {
      if (line === '--------') {
        flushModifier()
        continue
      }
      if (isExplanationLine(line)) continue
      const boundary = isIgnoredTextLine(line) || line === '未鉴定' || line.includes('已腐化') ||
        /^(?:秽生(?:物品)?|Foulborn(?: Item)?)$/i.test(line) ||
        line.includes('(implicit)') || line.includes('(fractured)') || line.includes('(crafted)') || line.includes('(enchant)') || influenceLabels[line]
      if (!boundary) {
        activeModifier.originalLines.push(line)
        activeModifier.lines.push(cleanModifierLine(line))
        continue
      }
      flushModifier()
    }

    if (line === '--------') {
      if (itemInfo.name) identityHeaderOpen = false
      continue
    }

    const scalarProperties = [
      [/^护甲:\s*\+?([\d.]+)/, 'armour'],
      [/^闪避(?:值)?:\s*\+?([\d.]+)/, 'evasion'],
      [/^能量护盾:\s*\+?([\d.]+)/, 'energyShield'],
      [/^虚化:\s*\+?([\d.]+)%?/, 'baseDefencePercentile'],
      [/^结界:\s*\+?([\d.]+)/, 'ward'],
      [/^格挡(?:几率)?:\s*\+?([\d.]+)%?/, 'block'],
      [/^(?:攻击)?暴击率:\s*\+?([\d.]+)%?/, 'criticalStrikeChance'],
      [/^每秒攻击次数:\s*\+?([\d.]+)/, 'attacksPerSecond']
    ]
    const scalar = scalarProperties.find(([pattern]) => pattern.test(line))
    if (scalar) {
      itemInfo[scalar[1]] = parseNumber(line.match(scalar[0])[1])
      continue
    }
    if (/^物理伤害:/.test(line)) {
      itemInfo.physicalDamage = parseRange(line)
      continue
    }
    if (/^(?:元素|(?:火焰|冰霜|闪电|混沌)(?:[，,]\s*(?:火焰|冰霜|闪电|混沌))*)伤害:/.test(line)) {
      const ranges = [...line.matchAll(/(-?\d+(?:\.\d+)?)\s*[-–—]\s*(-?\d+(?:\.\d+)?)/g)]
      itemInfo.elementalDamages.push(...ranges.map((match) => ({ min: Number(match[1]), max: Number(match[2]) })))
      continue
    }

    if (line.startsWith('物品类别:')) {
      itemInfo.category = line.replace('物品类别:', '').trim()
    }
    else if (line.startsWith('稀 有 度:') || line.startsWith('稀有度:')) {
      itemInfo.rarity = line.replace(/稀\s*有\s*度:/, '').trim()
    }
    else if (line === '已腐化' || line.includes('已腐化')) {
      itemInfo.isCorrupted = true
    }
    else if (line === '不可改变') {
      itemInfo.isUnmodifiable = true
    }
    else if (line === '未鉴定' || line.includes('未鉴定')) {
      itemInfo.isUnidentified = true
    }
    else if (line === '已复制' || line.includes('镜像复制')) {
      itemInfo.isMirrored = true
    }
    else if (line === '已分裂' || line.includes('分裂物品')) {
      itemInfo.isSplit = true
    }
    else if (line === '分裂之物' || line === '破碎之物' || line === '破裂物品' || line === 'Fractured Item') {
      itemInfo.isFractured = true
    }
    else if (/^回忆束丝[：:]\s*\d+$/.test(line)) {
      itemInfo.memoryLevel = Number(line.match(/\d+$/)[0])
    }
    else if (/^(?:秽生(?:物品)?|Foulborn(?: Item)?)$/i.test(line)) {
      itemInfo.isMutated = true
    }
    else if (influenceLabels[line]) {
      if (!itemInfo.influences.includes(influenceLabels[line])) itemInfo.influences.push(influenceLabels[line])
    }
    else if (isMapCategory(itemInfo.category) && extractMapTier(line) > 0) {
      itemInfo.mapTier = extractMapTier(line)
      itemInfo.baseName = '地图'
      continue
    }
    else if (identityHeaderOpen && itemInfo.category === '海图' && line.endsWith('海图') && !line.includes(':')) {
      itemInfo.baseName = line
      if (!itemInfo.name) itemInfo.name = line
    }
    else if (identityHeaderOpen && !itemInfo.name && line && !line.includes(':') && !isIgnoredTextLine(line)) {
      itemInfo.name = stripInjectedPriceTag(line)
    }
    else if (identityHeaderOpen && itemInfo.name && !itemInfo.baseName && line && !isIgnoredTextLine(line)) {
      itemInfo.baseName = line
    }
    else if (line.includes('品质:')) {
      const qualityMatch = line.match(/品质:\s*\+?(\d+)%/)
      if (qualityMatch) {
        itemInfo.quality = parseInt(qualityMatch[1])
      }
    }
    else if (itemInfo.category.includes('宝石') && line.startsWith('等级:')) {
      const gemLevelMatch = line.match(/等级:\s*(\d+)/)
      if (gemLevelMatch) {
        itemInfo.gemLevel = parseInt(gemLevelMatch[1])
      }
    }
    else if (line.includes('区域等级:')) {
      const areaLevelMatch = line.match(/区域等级:\s*(\d+)/)
      if (areaLevelMatch) itemInfo.areaLevel = parseInt(areaLevelMatch[1])
    }
    else if (line.includes('物品等级:')) {
      const levelMatch = line.match(/物品等级:\s*(\d+)/)
      if (levelMatch) {
        itemInfo.level = parseInt(levelMatch[1])
      }
      seenItemLevel = true;
      continue; // 物品等级行本身不是词缀
    }
    else if (line.startsWith('插槽:')) {
      socketLine = line.replace('插槽:', '').trim()
      itemInfo.sockets = socketLine
      parseSockets(socketLine, itemInfo)
    }
    else if (line.includes('物品数量:')) {
      const match = line.match(/物品数量:\s*\+?(\d+)%/)
      if (match) {
        itemInfo.itemQuantity = parseInt(match[1])
      }
    }
    else if (line.includes('物品稀有度:')) {
      const match = line.match(/物品稀有度:\s*\+?(\d+)%/)
      if (match) {
        itemInfo.itemRarity = parseInt(match[1])
      }
    }
    else if (line.includes('怪物群大小:')) {
      const match = line.match(/怪物群大小:\s*\+?(\d+)%/)
      if (match) {
        itemInfo.monsterPackSize = parseInt(match[1])
      }
    }
    else if (line.includes('亡者硫磺:')) {
      const match = line.match(/亡者硫磺:\s*\+?(\d+)%/)
      if (match) itemInfo.deadmanSulphur = parseInt(match[1])
    }
    else if (line.includes('更多地图:')) {
      const match = line.match(/更多地图:\s*\+?(\d+)%/)
      if (match) {
        itemInfo.moreMaps = parseInt(match[1])
      }
      continue // 解析后跳过，避免被其他逻辑处理
    }
    else if (line.includes('更多圣甲虫:')) {
      const match = line.match(/更多圣甲虫:\s*\+?(\d+)%/)
      if (match) {
        itemInfo.moreScarabs = parseInt(match[1])
      }
      continue // 解析后跳过，避免被其他逻辑处理
    }
    else if (line.includes('更多通货:')) {
      const match = line.match(/更多通货:\s*\+?(\d+)%/)
      if (match) {
        itemInfo.moreCurrency = parseInt(match[1])
      }
      continue // 解析后跳过，避免被其他逻辑处理
    }
    else if (extractMapTier(line) > 0) {
      itemInfo.mapTier = extractMapTier(line)
    }
    else if (line.includes('(implicit)')) {
      const mod = line.replace(/\s*\(implicit\)\s*$/, '').trim()
      if (mod) {
        itemInfo.implicitMods.push(mod)
      }
    }
    else if (line.includes('(crafted)')) {
      const mod = line.replace(/\s*\(crafted\)\s*$/, '').trim()
      if (mod) {
        itemInfo.craftedMods.push(mod)
      }
    }
    else if (line.includes('(enchant)')) {
      const original = line.replace(/\s*\(enchant\)\s*$/i, '').trim()
      if (original && !isExplanationLine(original)) {
        const text = cleanModifierLine(original)
        itemInfo.modifiers.push({
          type: 'enchant',
          affixType: null,
          name: '',
          tier: 0,
          tags: [],
          lines: [text],
          text,
          originalLines: [original]
        })
      }
      continue
    }
    else if (itemInfo.category === '海图' && !seenItemLevel && !itemInfo.areaName && line && !line.includes(':')) {
      itemInfo.areaName = line
    }
    else if (line.includes('(fractured)')) {
      const mod = line.replace(/\s*\(fractured\)\s*$/, '').trim()
      if (mod) {
        itemInfo.modifiers.push({
          type: 'fractured',
          affixType: null,
          name: '',
          tier: 0,
          tags: [],
          lines: [cleanModifierLine(mod)],
          text: cleanModifierLine(mod),
          originalLines: [mod]
        })
      }
    }
    else if (line && line.length > 2) { // 稍微放宽长度限制，有些词缀可能很短
      
      // 检查是否包含在忽略列表中
      let shouldIgnore = false;
      shouldIgnore = isIgnoredTextLine(line)
      if (shouldIgnore) continue;

      // 如果检测到有物品等级行，则严格执行：显式词缀必须出现在物品等级之后
      // 这可以有效过滤掉药剂的基础属性（通常在物品等级之前）
      // 以及地图的固有属性（也在物品等级之前）
      // 注意：隐式词缀(implicit)已经通过上面的分支处理了，这里只处理没标记的行
      if (hasItemLevel && !seenItemLevel) {
        continue;
      }
      
      // 额外的正则过滤（作为最后一道防线）
      if (!line.match(/^需求:|^等级:|^力量:|^敏捷:|^智慧:|^护甲:|^物理伤害:|^攻击暴击率:|^每秒攻击次数:/)) {
        if (!isExplanationLine(line)) {
          itemInfo.explicitMods.push(line)
        }
      }
    }
  }

  flushModifier()
  itemInfo.isFractured ||= itemInfo.modifiers.some((modifier) => modifier.type === 'fractured')
  const average = (range) => range ? (Number(range.min) + Number(range.max)) / 2 : 0
  itemInfo.physicalDps = itemInfo.attacksPerSecond
    ? Math.round(average(itemInfo.physicalDamage) * itemInfo.attacksPerSecond * 100) / 100
    : 0
  itemInfo.elementalDps = itemInfo.attacksPerSecond
    ? Math.round(itemInfo.elementalDamages.reduce((sum, range) => sum + average(range), 0) * itemInfo.attacksPerSecond * 100) / 100
    : 0
  itemInfo.totalDps = Math.round((itemInfo.physicalDps + itemInfo.elementalDps) * 100) / 100
  itemInfo.isLegendary = itemInfo.rarity.replace(/\s/g, '') === '传奇'

  return itemInfo
}

export function parseSockets(socketText, itemInfo) {
  if (!socketText) return

  const colors = socketText.split(/\s+/)
  let totalSockets = 0
  let maxLinks = 1

  colors.forEach(group => {
    const sockets = group.split('-')
    const groupLength = sockets.length
    totalSockets += groupLength
    
    if (groupLength > maxLinks) {
      maxLinks = groupLength
    }

    sockets.forEach(socket => {
      if (socket === 'R') itemInfo.socketsColors.red++
      else if (socket === 'G') itemInfo.socketsColors.green++
      else if (socket === 'B') itemInfo.socketsColors.blue++
    })
  })

  itemInfo.socketsCount = totalSockets
  itemInfo.links = maxLinks
}

