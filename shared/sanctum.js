import { SANCTUM_EXTENDED_RULES } from './sanctumRules.js'

export const SANCTUM_SCHEMA_VERSION = 1
export const SANCTUM_PRESETS = Object.freeze({
  reveal: { label: '揭图收益' },
  quantity: { label: '圣物数量速刷' },
  survival: { label: '旧版自定义：稳定通关', reward: 1, recovery: 4, risk: 8, relic: 1, options: 2 },
  currency: { label: '旧版自定义：货币收益', reward: 5, recovery: 1, risk: 3, relic: 1, options: 1 },
  relic: { label: '旧版自定义：圣物产出', reward: 1, recovery: 2, risk: 4, relic: 6, options: 2 }
})

export function createSanctumStrategy(preset = 'reveal') {
  const selected = Object.hasOwn(SANCTUM_PRESETS, preset) ? preset : 'reveal'
  return {
    preset: selected, weights: { ...SANCTUM_PRESETS[selected] },
    currencyWeights: ['reveal','quantity'].includes(selected) ? {} : { '神圣石': 100, '混沌石': 1, '崇高石': 5 },
    targetPriority: { '卡兰德的魔镜': 3, '神圣石': 2 },
    toleratedAfflictions: [], layoutPreference: { exit: 2, guards: 1, arena: 0, trap: -1 },
    timing: { immediate: 1, floor: .9, run: .75 },
    bannedAfflictions: [], afflictionWeights: {},
    roomWeights: {}, relicWeights: {}
  }
}

export function validateSanctumStrategy(input) {
  if (!input || !Object.hasOwn(SANCTUM_PRESETS, input.preset)) throw new Error('无效的圣所策略')
  const result = createSanctumStrategy(input.preset)
  for (const key of ['weights', 'currencyWeights', 'timing', 'afflictionWeights', 'roomWeights', 'relicWeights', 'targetPriority', 'layoutPreference']) {
    const source = input[key] ?? result[key]
    if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('策略权重必须为对象')
    if (Object.keys(source).length > 1000) throw new Error('策略条目过多')
    result[key] = {}
    for (const [name, value] of Object.entries(source)) {
      if (name === 'label' && key === 'weights') continue
      if (['__proto__', 'constructor', 'prototype'].includes(name) || name.length > 160 || !Number.isFinite(value)
        || Math.abs(value) > 1e6 || (key === 'timing' && (value < 0 || value > 1))) throw new Error('策略权重无效')
      result[key][name] = value
    }
  }
  if (!Array.isArray(input.bannedAfflictions) || input.bannedAfflictions.length > 500
    || input.bannedAfflictions.some(item => typeof item !== 'string' || item.length > 160)) throw new Error('禁选痛苦格式无效')
  result.bannedAfflictions = [...new Set(input.bannedAfflictions)]
  result.toleratedAfflictions = validateStringList(input.toleratedAfflictions || [])
  return result
}

function validateStringList(value) {
  if (!Array.isArray(value) || value.length > 500 || value.some(x => typeof x !== 'string' || x.length > 160)) throw new Error('容忍痛苦格式无效')
  return [...new Set(value)]
}

export function emptySanctumState() {
  return {
    schemaVersion: SANCTUM_SCHEMA_VERSION, enabled: false, running: false, status: 'idle', reason: '',
    floor: null, history: [], marks: { targets: [], avoid: [] }, currentEffects: [], controlOverlayBounds: null,
    inventory: [], altar: { confirmed: false, items: [], width: 5, height: 4, unlocked: [] },
    strategy: createSanctumStrategy(), calibration: {}, liveCalibration: null, relicCalibrations: {}, recommendation: null,
    runObservation: null, rewardLedger: null, decisions: [],
    loadouts: null, solving: false, progress: null,
    loadoutPreferences: { fixed: [], excluded: [], selectedUniques: [], targetAreaLevel: null }
  }
}

export function applySanctumEffects(effects = []) {
  const relicMultiplier = Math.max(0,1 + (effects.some(e=>e.status !== 'unknown' && e.rule === 'relicEffectIncrease') ? .3 : 0)
    - (effects.some(e=>e.status !== 'unknown' && e.rule === 'relicEffectReduction') ? .5 : 0))
  const result = { cannotRecover: false, cannotGainInspiration: false, cannotGainBoons: false,
    roomsHidden: false, recoveryMultiplier: 1, recoveryOnRoom: 0, recoveryOnBoss: 0, recoveryOnFountain: 0, unknown: [] }
  for (const original of effects) {
    const effect = original?.source === 'relic' && !original.unique && Number.isFinite(original.value)
      ? {...original,value:original.value * relicMultiplier} : original
    if (!effect || effect.status === 'unknown') { result.unknown.push(effect?.rawText || '未知效果'); continue }
    switch (effect.rule) {
      case 'cannotRecover': result.cannotRecover = true; break
      case 'cannotGainInspiration': result.cannotGainInspiration = true; break
      case 'cannotGainBoons': result.cannotGainBoons = true; break
      case 'roomsHidden': result.roomsHidden = true; break
      case 'rewardsHidden': case 'afflictionsHidden': case 'typesHidden':
      case 'randomDestination': case 'minorAfflictionImmune': case 'convertNextAffliction': case 'convertNextBoon':
      case 'lethalTraps': case 'dangerousTraps': case 'dangerousMonsters': result[effect.rule] = true; break
      case 'relicEffectReduction': result.relicEffectReduction = true; break
      case 'relicEffectIncrease': case 'fullMapRevealed': case 'preventResolveLoss': result[effect.rule]=true; break
      case 'recoveryReduced': result.recoveryMultiplier -= .5; break
      case 'visionReduced': result.visionColumns = (result.visionColumns ?? 2) - 1; break
      case 'visionIncreased': result.visionColumns = (result.visionColumns ?? 2) + 1; break
      case 'revealRooms': result.extraRevealedRooms = (result.extraRevealedRooms || 0) + (Number(effect.value) || 0); break
      case 'relicQuantity': case 'inspirationOnAffliction': case 'inspirationOnFloor': case 'inspirationOnRun':
      case 'duplicateOffers': break
      case 'endsOnResolveLoss': case 'randomAfflictionEachRoom': result[effect.rule]=true; break
      case 'resolveLossCountdown': case 'completionResolveLossPercent': break
      case 'recoveryIncrease': result.recoveryMultiplier += (Number(effect.value) || 0) / 100; break
      case 'recoveryOnRoom': result.recoveryOnRoom += Number(effect.value) || 0; break
      case 'recoveryOnBoss': result.recoveryOnBoss += Number(effect.value) || 0; break
      case 'recoveryOnFountain': result.recoveryOnFountain += Number(effect.value) || 0; break
      case 'scored': break
      default:
        if (SANCTUM_EXTENDED_RULES[effect.rule]) { result[effect.rule] = true; break }
        result.unknown.push(effect.rawText || effect.id || '未支持效果')
    }
  }
  result.recoveryMultiplier = Math.max(0, result.recoveryMultiplier)
  return result
}
