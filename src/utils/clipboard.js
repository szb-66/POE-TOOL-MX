/**
 * Purpose: 解析剪切板中的物品信息（前端版本，用于浏览器环境）
 * Inputs: clipboardText (string) - 剪切板文本内容
 * Outputs: 解析后的物品信息对象，解析失败返回 null
 * Preconditions: clipboardText 必须是有效的游戏物品文本格式
 * Edge cases: 空文本返回 null；传奇物品特殊处理
 * Errors: 解析失败返回 null，不抛出异常
 */

export function parseItemInfo(clipboardText) {
  if (!clipboardText) {
    return null
  }

  const lines = clipboardText.split('\n').map(line => line.trim()).filter(line => line)
  
  const itemInfo = {
    category: '',           // 物品类别
    rarity: '',             // 稀有度
    name: '',               // 物品名称
    baseName: '',           // 基底名称
    quality: 0,             // 品质
    level: 0,               // 物品等级
    sockets: '',            // 插槽信息
    socketsCount: 0,        // 插槽数量
    socketsColors: {        // 插槽颜色统计
      red: 0,
      green: 0,
      blue: 0
    },
    links: 0,               // 最大连接数
    implicitMods: [],      // 固有词缀
    explicitMods: [],      // 显性词缀
    craftedMods: []         // 工艺词缀
  }

  let currentSection = ''
  let socketLine = ''
  let nameFound = false
  let baseNameFound = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // 物品类别
    if (line.startsWith('物品类别:')) {
      itemInfo.category = line.replace('物品类别:', '').trim()
    }
    // 稀有度
    else if (line.startsWith('稀 有 度:') || line.startsWith('稀有度:')) {
      const rarity = line.replace(/稀\s*有\s*度:/, '').trim()
      // 标准化稀有度：普通、魔法、稀有、传奇
      if (rarity === '普通' || rarity === 'Normal') {
        itemInfo.rarity = '普通'
      } else if (rarity === '魔法' || rarity === 'Magic') {
        itemInfo.rarity = '魔法'
      } else if (rarity === '稀有' || rarity === 'Rare') {
        itemInfo.rarity = '稀有'
      } else if (rarity === '传奇' || rarity === 'Unique') {
        itemInfo.rarity = '传奇'
      } else {
        itemInfo.rarity = rarity
      }
    }
    // 物品名称（在稀有度之后的第一行非空行，且不是分隔线，不是属性行）
    else if (itemInfo.rarity && !nameFound && line && 
             !line.includes('--------') && 
             !line.includes(':') &&
             !line.match(/^需求:|^等级:|^力量:|^敏捷:|^智慧:|^护甲:|^物理伤害:|^攻击暴击率:|^每秒攻击次数:|^品质:|^物品等级:|^插槽:/)) {
      itemInfo.name = line
      nameFound = true
    }
    // 基底名称（在物品名称下方，且不是分隔线，不是属性行）
    else if (nameFound && !baseNameFound && line && 
             !line.includes('--------') && 
             !line.includes(':') &&
             !line.match(/^需求:|^等级:|^力量:|^敏捷:|^智慧:|^护甲:|^物理伤害:|^攻击暴击率:|^每秒攻击次数:|^品质:|^物品等级:|^插槽:/)) {
      itemInfo.baseName = line
      baseNameFound = true
    }
    // 品质
    else if (line.includes('品质:')) {
      const qualityMatch = line.match(/品质:\s*\+?(\d+)%/)
      if (qualityMatch) {
        itemInfo.quality = parseInt(qualityMatch[1])
      }
    }
    // 物品等级
    else if (line.includes('物品等级:')) {
      const levelMatch = line.match(/物品等级:\s*(\d+)/)
      if (levelMatch) {
        itemInfo.level = parseInt(levelMatch[1])
      }
    }
    // 插槽信息
    else if (line.startsWith('插槽:')) {
      socketLine = line.replace('插槽:', '').trim()
      itemInfo.sockets = socketLine
      // 解析插槽数量和颜色
      parseSockets(socketLine, itemInfo)
    }
    // 固有词缀 (implicit)
    else if (line.includes('(implicit)')) {
      const mod = line.replace(/\s*\(implicit\)\s*$/, '').trim()
      if (mod) {
        itemInfo.implicitMods.push(mod)
      }
    }
    // 工艺词缀 (crafted)
    else if (line.includes('(crafted)')) {
      const mod = line.replace(/\s*\(crafted\)\s*$/, '').trim()
      if (mod) {
        itemInfo.craftedMods.push(mod)
      }
    }
    // 显性词缀（普通词缀，不包含特殊标记）
    else if (line && !line.includes('--------') && 
             !line.includes('(implicit)') && 
             !line.includes('(crafted)') &&
             !line.includes('(enchant)') &&
             !line.includes(':') &&
             line.length > 5) {
      // 排除一些明显不是词缀的行
      if (!line.match(/^需求:|^等级:|^力量:|^敏捷:|^智慧:|^护甲:|^物理伤害:|^攻击暴击率:|^每秒攻击次数:/)) {
        itemInfo.explicitMods.push(line)
      }
    }
  }

  return itemInfo
}

/**
 * 解析插槽信息
 * @param {string} socketText - 插槽文本，如 "R-R-R-R" 或 "R-B G"
 */
function parseSockets(socketText, itemInfo) {
  if (!socketText) return

  // 统计颜色
  const colors = socketText.split(/\s+/)
  let totalSockets = 0
  let maxLinks = 1

  colors.forEach(group => {
    const sockets = group.split('-')
    const groupLength = sockets.length
    totalSockets += groupLength
    
    // 计算最大连接数
    if (groupLength > maxLinks) {
      maxLinks = groupLength
    }

    // 统计颜色
    sockets.forEach(socket => {
      if (socket === 'R') itemInfo.socketsColors.red++
      else if (socket === 'G') itemInfo.socketsColors.green++
      else if (socket === 'B') itemInfo.socketsColors.blue++
    })
  })

  itemInfo.socketsCount = totalSockets
  itemInfo.links = maxLinks
}

/**
 * 检查物品是否匹配词缀要求
 * @param {Object} itemInfo - 物品信息
 * @param {Array} requiredAffixes - 必选词缀列表
 * @param {Array} selectedAffixes - 挑选词缀列表
 * @param {number} selectedCount - 需要匹配的挑选词缀数量
 * @returns {boolean} 是否匹配
 */
export function matchAffixes(itemInfo, requiredAffixes, selectedAffixes, selectedCount) {
  if (!itemInfo) return false

  const allMods = [
    ...itemInfo.implicitMods,
    ...itemInfo.explicitMods,
    ...itemInfo.craftedMods
  ]

  // 检查必选词缀
  if (requiredAffixes && requiredAffixes.length > 0) {
    const required = requiredAffixes.filter(affix => affix && affix.trim())
    if (required.length > 0) {
      const matchedRequired = required.filter(req => 
        allMods.some(mod => mod.includes(req))
      )
      if (matchedRequired.length !== required.length) {
        return false
      }
    }
  }

  // 检查挑选词缀
  if (selectedAffixes && selectedAffixes.length > 0 && selectedCount > 0) {
    const selected = selectedAffixes.filter(affix => affix && affix.trim())
    if (selected.length > 0) {
      const matchedSelected = selected.filter(sel => 
        allMods.some(mod => mod.includes(sel))
      )
      if (matchedSelected.length < selectedCount) {
        return false
      }
    }
  }

  return true
}

/**
 * 检查插槽是否匹配要求
 * @param {Object} itemInfo - 物品信息
 * @param {Object} socketConfig - 插槽配置
 * @param {Object} linkConfig - 连接配置
 * @param {Object} colorConfig - 颜色配置
 * @returns {boolean} 是否匹配
 */
export function matchSockets(itemInfo, socketConfig, linkConfig, colorConfig) {
  if (!itemInfo) return false

  // 检查插槽数量
  if (socketConfig && socketConfig.enabled) {
    if (itemInfo.socketsCount < socketConfig.count) {
      return false
    }
  }

  // 检查连接数
  if (linkConfig && linkConfig.enabled) {
    if (itemInfo.links < linkConfig.count) {
      return false
    }
  }

  // 检查颜色
  if (colorConfig && colorConfig.enabled) {
    if (itemInfo.socketsColors.red < colorConfig.red ||
        itemInfo.socketsColors.green < colorConfig.green ||
        itemInfo.socketsColors.blue < colorConfig.blue) {
      return false
    }
  }

  return true
}

