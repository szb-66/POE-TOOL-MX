// 仅消费物品属性行，不能把怪物词缀中的百分比当作抢劫属性。
const STAT_LABELS = {
  quantity: ['物品数量'],
  rarity: ['物品稀有度'],
  alertLevelReduction: ['警报等级衰减', '警戒值降低', '警戒等级降低', '警报等级降低', '警戒降低'],
  timeBeforeLockdown: ['封锁前的时间', '封锁前时间', '封锁时间', '封锁倒计时'],
  maximumAliveReinforcements: ['最大存活援军数量', '最大存活援军', '最大存活增援数量', '最大存活增援', '最大增援数量']
}

export function parseHeistMetadata(lines) {
  const headerEnd = lines.findIndex(line => /^-{3,}$/.test(line))
  const header = lines.slice(0, headerEnd < 0 ? lines.length : headerEnd)
  const category = header.find(line => /^物品类别[：:]/.test(line))?.replace(/^物品类别[：:]\s*/, '')
  if (!['契约', '蓝图'].includes(category)) return null
  const stats = Object.fromEntries(Object.keys(STAT_LABELS).map(key => [key, null]))
  const consumedIndexes = new Set()
  let isQuestItem = header.some(line => /^稀\s*有\s*度[：:]\s*任务/.test(line))
  let areaLevel = 0
  lines.forEach((line, index) => {
    const property = line.match(/^([^：:]+)[：:]\s*(.*)$/)
    if (property) {
      const key = Object.keys(STAT_LABELS).find(key => STAT_LABELS[key].includes(property[1]))
      if (key) {
        const value = property[2].match(/^([+-]?\d+(?:\.\d+)?)%(?:\s*\([^)]*\))?$/)
        stats[key] = value ? Number(value[1]) : null
        consumedIndexes.add(index)
      }
    }
    if (/^(?:#{1,6}\s*)?在黄金港跟 NPC 对话/.test(line)) consumedIndexes.add(index)
    if (/^(?:客户|委托人)[：:]/.test(line)) isQuestItem = true
    const area = line.match(/^区域等级[：:]\s*(\d+)$/)
    if (area) areaLevel = Number(area[1])
    if (/^(?:区域等级|赏金目标|劫盗目标|抢劫目标|发现的侧厅|发现逃亡路线|破解的奖励室|发现的逃生路线|发现的奖励房间|已揭露的侧厅|已揭露的逃生路线|已揭露的奖励房间|客户|委托人|目标价值)[：:]/.test(line) || /^需要\s/.test(line)) consumedIndexes.add(index)
  })
  return { category, heistStats: stats, isQuestItem, areaLevel, consumedIndexes }
}
