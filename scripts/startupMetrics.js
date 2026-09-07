export function median(values = []) {
  const sorted = values.filter(Number.isFinite).sort((left, right) => left - right)
  if (!sorted.length) return null
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export function summarizeStartupTrace(events = []) {
  const succeeded = phase => events.find(event => event.phase === phase && event.outcome === 'succeeded')?.elapsedMs ?? null
  const windowMs = succeeded('window-visible')
  const interactiveMs = succeeded('interactive')
  const failed = events.filter(event => event.outcome === 'failed')
  return {
    windowMs,
    interactiveMs,
    complete: windowMs !== null && interactiveMs !== null,
    failed,
    budget: { window: windowMs !== null && windowMs <= 10000, interactive: interactiveMs !== null && interactiveMs <= 15000 }
  }
}

export function summarizeStartupRuns(runs = [], baselineMs = 40600) {
  const viteMedianMs = median(runs.map(run => run.viteReadyMs))
  const electronLaunchMedianMs = median(runs.map(run => run.electronLaunchMs))
  const shellMedianMs = median(runs.map(run => run.shellMs))
  const dashboardMedianMs = median(runs.map(run => run.dashboardMs))
  const reduction = dashboardMedianMs == null ? null : 1 - (dashboardMedianMs / baselineMs)
  return {
    runs,
    viteMedianMs,
    electronLaunchMedianMs,
    shellMedianMs,
    dashboardMedianMs,
    reduction,
    budget: {
      shell: shellMedianMs != null && shellMedianMs <= 3000,
      dashboard: dashboardMedianMs != null && dashboardMedianMs <= 8000,
      reduction: reduction != null && reduction >= 0.7
    }
  }
}
