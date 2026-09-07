// Cumulative experience can decrease after a death. Preserve that loss in every view.
export function experienceDelta(first, latest) {
  if (!Number.isSafeInteger(first) || first < 0 || !Number.isSafeInteger(latest) || latest < 0) return null
  return latest - first
}

export function runExperienceDelta(run) {
  if (Number.isSafeInteger(run?.experienceGain)) return run.experienceGain
  return run?.experienceSampleCount >= 2 ? experienceDelta(run.experienceStart, run.experienceEnd) : null
}

export function runExperiencePerHour(run) {
  const delta = runExperienceDelta(run)
  const elapsed = Date.parse(run?.experienceLastSampleAt) - Date.parse(run?.experienceFirstSampleAt)
  return delta == null || !Number.isFinite(elapsed) || elapsed <= 0 ? null : Math.round(delta * 3600000 / elapsed)
}

export function experienceTrend(observation) {
  const points = (observation?.points || []).filter(point => Number.isFinite(Date.parse(point?.at)) && experienceDelta(observation.first, point.experience) !== null)
  if (points.length < 2) return { points: [], line: '', zeroY: 100 }
  const values = points.map(point => experienceDelta(observation.first, point.experience))
  const minimum = Math.min(0, ...values)
  const maximum = Math.max(0, ...values)
  const span = Math.max(1, maximum - minimum)
  const y = value => 100 - (value - minimum) / span * 90
  const start = Date.parse(points[0].at)
  const elapsed = Math.max(1, Date.parse(points.at(-1).at) - start)
  return { points, zeroY: y(0), line: points.map((point, index) => `${(Date.parse(point.at) - start) / elapsed * 600},${y(values[index])}`).join(' ') }
}
