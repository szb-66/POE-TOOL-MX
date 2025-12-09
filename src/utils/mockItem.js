/**
 * Purpose: 生成随机物品数据，用于开发和测试
 * Inputs: 无
 * Outputs: 随机生成的物品对象
 * Preconditions: 无
 * Edge cases: 无
 * Errors: 无
 */

export function generateRandomItem() {
  const rarities = ['普通', '魔法', '稀有', '传奇'];
  const bases = ['执政官之冠', '灵主之环', '瓦尔法衣', '巨人胫甲', '术士手套'];
  const rarity = rarities[Math.floor(Math.random() * rarities.length)];
  
  const item = {
    name: rarity === '传奇' ? '猎首' : '精良的物品',
    baseName: bases[Math.floor(Math.random() * bases.length)],
    rarity: rarity,
    level: 80 + Math.floor(Math.random() * 6),
    quality: 20,
    socketsCount: 6,
    links: 6,
    socketsColors: { red: 2, green: 2, blue: 2 },
    explicitMods: [],
    detailedMods: [],
    affixMatch: Math.random() > 0.5,
    socketMatch: Math.random() > 0.5,
    iteration: Math.floor(Math.random() * 100)
  };

  if (rarity !== '普通') {
    const prefixes = ['生命', '法术伤害', '魔力', '护甲%'];
    const suffixes = ['火焰抗性', '冰霜抗性', '闪电抗性', '暴击率'];
    
    // Add some random mods
    const modCount = rarity === '魔法' ? 2 : (rarity === '稀有' ? 6 : 4);
    
    for (let i = 0; i < modCount / 2; i++) {
        const p = prefixes[Math.floor(Math.random() * prefixes.length)];
        item.detailedMods.push({
            type: 'prefix',
            tier: Math.floor(Math.random() * 8) + 1,
            text: `${p} +${Math.floor(Math.random() * 100)}`,
            tags: []
        });
    }
    for (let i = 0; i < modCount / 2; i++) {
        const s = suffixes[Math.floor(Math.random() * suffixes.length)];
        item.detailedMods.push({
            type: 'suffix',
            tier: Math.floor(Math.random() * 8) + 1,
            text: `${s} +${Math.floor(Math.random() * 50)}%`,
            tags: []
        });
    }
  }

  return item
}




