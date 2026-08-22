function normalizeCount(value) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : 0
}

export function normalizeJunfengProgress(currentIndex, candidateItems) {
  const totalItems = normalizeCount(candidateItems)
  return {
    processedItems: Math.min(normalizeCount(currentIndex), totalItems),
    candidateItems: totalItems
  }
}

export function formatJunfengButtonLabel(automation = {}) {
  if (automation.status !== 'running') return '取出高亮'
  const progress = normalizeJunfengProgress(automation.processedItems, automation.candidateItems)
  return `进行中（${progress.processedItems}/${progress.candidateItems}）`
}
