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
  
  const itemInfo = {
    category: '',
    rarity: '',
    name: '',
    baseName: '',
    quality: 0,
    level: 0,
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
    mapTier: 0,
    moreMaps: 0,
    moreScarabs: 0,
    moreCurrency: 0,
    isCorrupted: false,
    isUnidentified: false,
    links: 0,
    implicitMods: [],
    explicitMods: [],
    craftedMods: [],
    detailedMods: [] // 详细词缀信息
  }

  let socketLine = ''
  
  // 物品解析状态标记
  let hasItemLevel = false;
  let seenItemLevel = false;
  let lastAffixHeader = null; // 记录上一个词缀头信息
  
  // 预扫描：检查是否存在物品等级行
  // 注意：这要求用户在游戏内开启"显示详细属性" (Alt)
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
    '已腐化',
    '裂界者物品',
    '塑界者物品',
    '圣战者物品',
    '救赎者物品',
    '狩猎者物品',
    '督军物品',
    '只能使用',
    '无法使用',
    '无法拥有',
    '地图阶级:', // 地图阶级不是词缀
    '物品数量:', // 地图属性（已专门解析，但保留在ignorePatterns中作为备用过滤）
    '物品稀有度:', // 地图属性（已专门解析，但保留在ignorePatterns中作为备用过滤）
    '怪物群大小:', // 地图属性（已专门解析，但保留在ignorePatterns中作为备用过滤）
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
    '回忆束丝:',
    '需求:',
    '等级:',
    '力量:',
    '敏捷:',
    '智慧:',
    '--------'
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // 详细词缀头信息解析 (Alt+Ctrl+C)
    // 示例: { 前缀属性 "韧炼的" (等阶：4) — 伤害, 物理, 攻击 }
    // 示例: { 基底属性 — 伤害, 召唤生物 }
    if (line.startsWith('{') && line.endsWith('}')) {
      if (line.includes('前缀属性') || line.includes('后缀属性')) {
        try {
          const type = line.includes('前缀属性') ? 'prefix' : 'suffix';
          const nameMatch = line.match(/"([^"]+)"/);
          const name = nameMatch ? nameMatch[1] : '';
          
          const tierMatch = line.match(/等阶：(\d+)/);
          const tier = tierMatch ? parseInt(tierMatch[1]) : 0;
          
          const tagsPart = line.split('—')[1];
          const tags = tagsPart ? tagsPart.replace('}', '').trim().split(',').map(t => t.trim()) : [];
          
          lastAffixHeader = {
            type,
            name,
            tier,
            tags,
            lineIndex: i
          };
        } catch (e) {
          // 解析词缀头信息失败
        }
      }
      // 所有的 {...} 行都跳过，避免被误识别为词缀
      continue;
    }

    if (line.startsWith('物品类别:')) {
      itemInfo.category = line.replace('物品类别:', '').trim()
    }
    else if (line.startsWith('稀 有 度:') || line.startsWith('稀有度:')) {
      itemInfo.rarity = line.replace(/稀\s*有\s*度:/, '').trim()
    }
    else if (!itemInfo.name && line && !line.includes('--------') && !line.includes(':')) {
      itemInfo.name = line
    }
    else if (itemInfo.name && !itemInfo.baseName && line && !line.includes('--------')) {
      itemInfo.baseName = line
    }
    else if (line.includes('品质:')) {
      const qualityMatch = line.match(/品质:\s*\+?(\d+)%/)
      if (qualityMatch) {
        itemInfo.quality = parseInt(qualityMatch[1])
      }
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
    else if (line.includes('地图阶级:')) {
      const match = line.match(/地图阶级:\s*(\d+)/)
      if (match) {
        itemInfo.mapTier = parseInt(match[1])
      }
    }
    else if (line === '已腐化' || line.includes('已腐化')) {
      itemInfo.isCorrupted = true
    }
    else if (line === '未鉴定' || line.includes('未鉴定')) {
      itemInfo.isUnidentified = true
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
       // 附魔词缀，暂时忽略或归类
       continue;
    }
    else if (line && line.length > 2) { // 稍微放宽长度限制，有些词缀可能很短
      
      // 检查是否包含在忽略列表中
      let shouldIgnore = false;
      for (const pattern of ignorePatterns) {
        if (line.includes(pattern)) {
          shouldIgnore = true;
          break;
        }
      }
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
        // 如果有上一个词缀头信息，说明这是详细词缀的文本行
        if (lastAffixHeader) {
          // 清理词缀文本，移除数值范围 (例如: 13(13-18) -> 13)
          // 匹配模式: 数字(数字-数字) -> 数字
          const cleanLine = line.replace(/(\d+)\(\d+-\d+\)/g, '$1').replace(/\(\d+-\d+\)/g, '');
          
          itemInfo.detailedMods.push({
            ...lastAffixHeader,
            text: cleanLine,
            originalText: line
          });
          
          itemInfo.explicitMods.push(cleanLine);
          lastAffixHeader = null; // 重置头信息
        } else {
          itemInfo.explicitMods.push(line)
        }
      }
    }
  }

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

