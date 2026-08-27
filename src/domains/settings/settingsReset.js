function failedStopLabels(result) {
  return Array.isArray(result?.failed)
    ? result.failed.map(item => item?.label || item?.id).filter(Boolean)
    : []
}

export async function resetApplicationSettings({
  stopAutomations,
  resetStoredSettings,
  resetInterfaceDetection,
  resetControlOverlayOffset,
  syncPriceCheckShortcut,
  syncShortcuts
}) {
  const stopResult = await stopAutomations()
  const failedLabels = failedStopLabels(stopResult)
  if (!stopResult || stopResult.success === false || failedLabels.length) {
    const targets = failedLabels.length ? failedLabels.join('、') : '输入自动化'
    throw new Error(`无法安全重置：${targets}停止失败`)
  }

  await syncShortcuts()
  resetStoredSettings()
  resetInterfaceDetection()
  const operations = [
    ['control-overlay-offset', resetControlOverlayOffset],
    ['price-check-shortcut', syncPriceCheckShortcut]
  ]
  const results = await Promise.allSettled(operations.map(([, operation]) => operation()))
  const warnings = results.flatMap((result, index) => result.status === 'rejected'
    ? [{ id: operations[index][0], message: result.reason?.message || String(result.reason) }]
    : [])
  return { stopResult, warnings }
}
