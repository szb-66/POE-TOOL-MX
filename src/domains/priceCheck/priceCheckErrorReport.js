const SOURCE_LABELS = Object.freeze({
  capture: '自动查价（快捷键捕获）',
  manual: '手动粘贴查价',
  rerun: '重新查询或选择候选'
})

function text(value, fallback = '') {
  if (value == null) return fallback
  const normalized = String(value)
  return normalized || fallback
}

function jsonBlock(value) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function sourceLabel(value) {
  return SOURCE_LABELS[value] || '自动查价'
}

function itemHeadline(entry) {
  const parts = [entry.itemRarity, entry.itemCategory, entry.itemBaseType].filter(Boolean)
  return [entry.itemName, parts.length ? `（${parts.join(' · ')}）` : ''].filter(Boolean).join('')
}

export function formatPriceCheckErrorEntry(entry, index = 0) {
  const lines = []
  const repeat = Number(entry.repeatCount) > 1 ? ` · 重复 ${entry.repeatCount} 次` : ''
  lines.push(`## ${index + 1}. ${text(entry.timestamp, '未知时间')} · ${text(entry.stageLabel, '未知阶段')}${repeat}`)
  lines.push('')
  lines.push(`- 错误代码：${text(entry.code, 'PRICE_CHECK_FAILED')}`)
  lines.push(`- 错误信息：${text(entry.message, '查价失败')}`)
  if (entry.failureCode) lines.push(`- 失败码：${entry.failureCode}`)
  if (entry.configurationIssueId) lines.push(`- 配置项：${entry.configurationIssueId}`)
  lines.push(`- 联赛：${text(entry.league, '未设置')}`)
  lines.push(`- 来源：${sourceLabel(entry.source)}`)
  if (entry.catalog?.gameVersion || entry.catalog?.provider) {
    lines.push(`- 交易目录：${text(entry.catalog.provider, '未知')} · ${text(entry.catalog.gameVersion, '未知版本')}${entry.catalog.degraded ? '（内置降级）' : ''}${entry.catalog.stale ? '（可能过期）' : ''}`)
  }
  const headline = itemHeadline(entry)
  if (headline) lines.push(`- 物品：${headline}`)
  lines.push('')

  if (entry.options && Object.keys(entry.options).length) {
    lines.push('### 查询选项')
    lines.push('')
    lines.push('```json')
    lines.push(jsonBlock(entry.options))
    lines.push('```')
    lines.push('')
  }

  lines.push('### 物品完整文本')
  lines.push('')
  lines.push('~~~text')
  lines.push(entry.itemText || '（本次错误没有可用的物品原始文本）')
  lines.push('~~~')
  lines.push('')

  if (entry.item) {
    lines.push('### 解析后的物品')
    lines.push('')
    lines.push('```json')
    lines.push(jsonBlock(entry.item))
    lines.push('```')
    lines.push('')
  }

  if (entry.model) {
    lines.push('### 查价模型')
    lines.push('')
    lines.push('```json')
    lines.push(jsonBlock(entry.model))
    lines.push('```')
    lines.push('')
  }

  if (entry.query) {
    lines.push('### 官方查询')
    lines.push('')
    lines.push('```json')
    lines.push(jsonBlock(entry.query))
    lines.push('```')
    lines.push('')
  }

  if (entry.details && Object.keys(entry.details).length) {
    lines.push('### 错误详情')
    lines.push('')
    lines.push('```json')
    lines.push(jsonBlock(entry.details))
    lines.push('```')
    lines.push('')
  }

  if (entry.stack) {
    lines.push('### 调用栈')
    lines.push('')
    lines.push('~~~text')
    lines.push(entry.stack)
    lines.push('~~~')
    lines.push('')
  }

  return lines.join('\n')
}

export function selectPriceCheckErrorEntries(entries = [], selectedIds = null) {
  const list = Array.isArray(entries) ? entries : []
  if (selectedIds == null) return list
  const idSet = new Set(Array.from(selectedIds, id => String(id || '')).filter(Boolean))
  if (!idSet.size) return []
  return list.filter(entry => idSet.has(String(entry?.id || '')))
}

export function formatPriceCheckErrorLog(snapshot = {}, { selectedIds = null } = {}) {
  const entries = selectPriceCheckErrorEntries(snapshot.entries, selectedIds)
  const lines = [
    '# 流放助手 · 查价错误记录',
    '',
    '请根据以下报错、物品完整文本、解析结果和查价模型定位问题，并给出修复方案。',
    '',
    `- 应用版本：${text(snapshot.appVersion, '未知')}`,
    `- 服务器：${text(snapshot.server, '未知')}`,
    `- 记录开始：${text(snapshot.startedAt, '未知')}`,
    `- 导出时间：${new Date().toISOString()}`,
    `- 错误数量：${entries.length}`
  ]
  if (!entries.length) {
    lines.push('', '本次启动后还没有查价报错。')
    return lines.join('\n')
  }
  lines.push('', '---', '')
  lines.push(entries.map((entry, index) => formatPriceCheckErrorEntry(entry, index)).join('\n---\n\n'))
  return lines.join('\n')
}
