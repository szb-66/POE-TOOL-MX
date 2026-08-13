export function fragmentModTooltipLines(mods) {
  if (mods?.status === 'unveiled') return ['词缀：未揭示']
  if (mods?.status === 'matched' && mods.mod) {
    const affix = mods.mod.affixType === 'suffix'
      ? '后缀'
      : mods.mod.affixType === 'prefix' ? '前缀' : '传奇'
    return [
      `${affix}词缀 · 等级 ${mods.mod.tier}`,
      ...(Array.isArray(mods.mod.lines) ? mods.mod.lines : [])
    ]
  }
  const rawLines = typeof mods?.rawText === 'string'
    ? mods.rawText.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
    : []
  return ['词缀：未知', ...rawLines]
}

export function formatBorderProbeFeedback(response) {
  const attempted = Number(response?.borderProbe?.attempted || 0)
  const matched = Number(response?.borderProbe?.matched || 0)
  const unknownIds = Object.entries(response?.borderMods || {})
    .filter(([, value]) => value?.status !== 'matched')
    .map(([id]) => id)
  const suffix = unknownIds.length ? `，未识别 ${unknownIds.join('、')}` : ''
  return {
    partial: unknownIds.length > 0,
    text: `边缘词缀已识别 ${matched}/${attempted}${suffix}`
  }
}
