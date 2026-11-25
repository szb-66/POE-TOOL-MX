export function formatAutoSelectionReason(autoSelection) {
  if (!autoSelection?.reason) return ''
  return `${autoSelection.enabled ? '自动预选' : '未自动预选'}：${autoSelection.reason}`
}

export function formatPropertyTooltip(property, translate = (value) => value) {
  const title = translate(property?.label || '')
  const reason = formatAutoSelectionReason(property?.autoSelection)
  return reason ? `${title}\n${reason}` : title
}

export function formatStatTooltip(stat, translate = (value) => value) {
  const sourceLines = (stat?.sources || [])
    .map((source) => source.displayText || translate(source.text))
    .filter(Boolean)
  const reason = formatAutoSelectionReason(stat?.autoSelection)
  return [...sourceLines, ...(reason ? [reason] : [])].join('\n')
}

export function restoreAutoSelectionForStats(stats = []) {
  for (const stat of stats) {
    if (!stat) continue
    if (stat.autoSelection && typeof stat.autoSelection.enabled === 'boolean') {
      stat.enabled = stat.autoSelection.enabled
    } else {
      stat.enabled = false
    }
  }
}

export function clearSelectionForStats(stats = []) {
  for (const stat of stats) {
    if (stat) stat.enabled = false
  }
}
