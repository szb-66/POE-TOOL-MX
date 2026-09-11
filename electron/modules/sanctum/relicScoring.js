// Relative preference defaults only. These factors do not model drop rates,
// completion probability or expected profit; explicit user weights take priority.
export function sanctumRelicWeight(modifier, strategy) {
  if (['reveal','quantity'].includes(strategy.preset)) {
    const target = strategy.preset === 'reveal' ? '额外的房间' : '遗物数量'
    return modifier.name?.includes(target) ? 1 : 0
  }
  if (Object.hasOwn(strategy.relicWeights, modifier.id)) return strategy.relicWeights[modifier.id]
  const weights = strategy.weights
  if (modifier.scoreChannel === 'recovery') return weights.recovery
  if (modifier.scoreChannel === 'recoveryMultiplier') return weights.recovery * .1
  if (modifier.scoreChannel === 'inspiration') return weights.recovery * .5
  if (modifier.name?.includes('耀金币')) return weights.reward * .05
  if (modifier.name?.includes('遗物数量')) return weights.relic * .25
  if (/额外的房间|额外选择/.test(modifier.name || '')) return weights.options * 3
  return modifier.name ? weights.recovery * .25 : undefined
}
