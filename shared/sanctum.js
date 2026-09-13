import { SANCTUM_EXTENDED_RULES } from './sanctumRules.js'

export const SANCTUM_SCHEMA_VERSION = 1
export const SANCTUM_PRESETS = Object.freeze({
  reveal: { label: '揭图收益' },
  quantity: { label: '圣物数量速刷' }
})

export function createSanctumStrategy(preset = 'reveal') {
  const selected = Object.hasOwn(SANCTUM_PRESETS, preset) ? preset : 'reveal'
  return {
    preset: selected,
    targetPriority: { '卡兰德的魔镜': 3, '神圣石': 2 },
    toleratedAfflictions: [], layoutPreference: { exit: 2, guards: 1, arena: 0, trap: -1, miniboss: 0 },
    bannedAfflictions: []
  }
}

export function validateSanctumStrategy(input) {
  if (!input || !Object.hasOwn(SANCTUM_PRESETS, input.preset)) throw new Error('无效的圣所策略')
  const result = createSanctumStrategy(input.preset)
  for (const key of ['targetPriority', 'layoutPreference']) {
    const source = input[key] ?? result[key]
    if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('策略权重必须为对象')
    if (Object.keys(source).length > 1000) throw new Error('策略条目过多')
    result[key] = {}
    for (const [name, value] of Object.entries(source)) {
      if (['__proto__', 'constructor', 'prototype'].includes(name) || name.length > 160 || !Number.isFinite(value)
        || Math.abs(value) > 1e6) throw new Error('策略权重无效')
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
    strategy: createSanctumStrategy(), calibration: {}, liveCalibration: null, recommendation: null,
    runObservation: null, decisions: [],
    progress: null
  }
}

export function applySanctumEffects(effects = []) {
  const result = { cannotRecover: false, cannotGainInspiration: false, cannotGainBoons: false,
    roomsHidden: false, recoveryMultiplier: 1, recoveryOnRoom: 0, recoveryOnBoss: 0, recoveryOnFountain: 0, unknown: [] }
  for (const effect of effects) {
    if (effect?.source === 'relic') continue
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
        break
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
