import { createDefaultCombatAssist, normalizeCombatAssist } from './combatAssist.js'

export const CROSS_SERVER_MIGRATION_FLAG_KEY = 'crossServerPresets:migrationVersion'
export const CROSS_SERVER_MIGRATION_VERSION = '1'
export const STORY_CONTEXT_STORAGE_KEY = 'storyGuide:context:v1'

const INTL_PREFIX = 'server:international:'

function readJson(storage, key) {
  try {
    const raw = storage?.getItem?.(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function stripIdentity(preset) {
  if (!preset || typeof preset !== 'object') return preset
  const { id: _id, name: _name, currentChapterId: _c, currentStepId: _s, viewedChapterId: _v, ...rest } = preset
  return rest
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function hasAnyAffixCondition(groups) {
  return Array.isArray(groups) && groups.some(group => (
    (Array.isArray(group?.requiredAffixes) && group.requiredAffixes.length > 0)
    || (Array.isArray(group?.selectedAffixes) && group.selectedAffixes.length > 0)
  ))
}

function isMapProfileBlank(profile) {
  if (!profile || typeof profile !== 'object') return true
  if (profile.method && profile.method !== 'alchemy') return false
  if (profile.binding?.enabled || profile.exalted?.enabled || profile.vaal?.enabled || profile.autoStash) return false
  const match = profile.match || {}
  if ((match.blacklist || []).some(Boolean) || (match.whitelist || []).some(Boolean)) return false
  const anyStat = [...Object.values(match.mandatoryStats || {}), ...Object.values(match.optionalStats || {})].some(s => s?.enabled)
  return !anyStat
}

function isPresetBlank(key, preset) {
  if (!preset || typeof preset !== 'object') return true
  if (key === 'itemPresets') {
    if (preset.batchCrafting?.enabled || (preset.batchCrafting?.categoryIds || []).length > 0) return false
    if (preset.moduleEldritch?.enabled || (preset.moduleEldritch?.targets || []).length > 0) return false
    if (preset.moduleThree?.enabled || preset.moduleThree?.socket?.enabled || preset.moduleThree?.link?.enabled || preset.moduleThree?.color?.enabled) return false
    const m2 = preset.moduleTwo || {}
    if (m2.mode && m2.mode !== 'alteration') return false
    if (m2.enableAugmentation || m2.enableRegal || m2.enableExalted || m2.enableBinding) return false
    return !hasAnyAffixCondition(m2.affixGroups)
  }
  if (key === 'essencePresets') {
    if (preset.essencePosition?.x || preset.essencePosition?.y) return false
    return !hasAnyAffixCondition(preset.affixGroups)
  }
  if (key === 'harvestPresets') {
    return !hasAnyAffixCondition(preset.affixGroups)
  }
  if (key === 'mapPresets') return isMapProfileBlank(preset.map)
  if (key === 'chartPresets') return isMapProfileBlank(preset.chart)
  if (key === 'heistPresets') return isMapProfileBlank(preset.heist)
  if (key === 'vendorRegexPresets') {
    return Object.values(preset.vendor || {}).every(group => !Array.isArray(group?.selectedIds) || group.selectedIds.length === 0)
  }
  if (key === 'mapRegexPresets') {
    const cfg = preset.mapRegex || {}
    const anyStat = Object.values(cfg.stats || {}).some(stat => stat?.enabled)
    const anyRarity = Array.isArray(cfg.rarity?.selectedIds) && cfg.rarity.selectedIds.length > 0
    const anyCorrupted = Boolean(cfg.corrupted?.enabled)
    const anyPrice = cfg.priceRange?.min != null || cfg.priceRange?.max != null || (cfg.priceRange?.currencies || []).length > 0
    const anyAffix = (cfg.includeAffixIds || []).length > 0 || (cfg.excludeAffixIds || []).length > 0
    return !anyStat && !anyRarity && !anyCorrupted && !anyPrice && !anyAffix
  }
  if (key === 'beastRegexPresets') {
    const cfg = preset.beastRegex || {}
    const anyPrice = cfg.priceRange?.min != null || cfg.priceRange?.max != null || (cfg.priceRange?.currencies || []).length > 0
    return !anyPrice && (cfg.includeIds || []).length === 0 && (cfg.excludeIds || []).length === 0
  }
  if (key === 'storyPresets') {
    return !Array.isArray(preset.chapters) || preset.chapters.length === 0
  }
  if (key === 'skillPresets') {
    return !Array.isArray(preset.chapterSkills) || preset.chapterSkills.every(slot => !slot?.skillGroups?.length)
  }
  return false
}

const PRESET_LIST_SPECS = Object.freeze([
  { key: 'itemPresets', currentKey: 'currentItemPresetId', defaultPrefix: 'item_intl', defaultName: '默认预设（国际服）' },
  { key: 'essencePresets', currentKey: 'currentEssencePresetId', defaultPrefix: 'essence_intl', defaultName: '默认预设（国际服）' },
  { key: 'harvestPresets', currentKey: 'currentHarvestPresetId', defaultPrefix: 'harvest_intl', defaultName: '默认预设（国际服）' },
  { key: 'mapPresets', currentKey: 'currentMapPresetId', defaultPrefix: 'map_intl', defaultName: '默认预设（国际服）' },
  { key: 'chartPresets', currentKey: 'currentChartPresetId', defaultPrefix: 'chart_intl', defaultName: '默认预设（国际服）' },
  { key: 'heistPresets', currentKey: 'currentHeistPresetId', defaultPrefix: 'heist_intl', defaultName: '默认预设（国际服）' },
  { key: 'vendorRegexPresets', currentKey: 'currentVendorRegexPresetId', defaultPrefix: 'vendor_regex_intl', defaultName: '默认预设（国际服）' },
  { key: 'mapRegexPresets', currentKey: 'currentMapRegexPresetId', defaultPrefix: 'map_regex_intl', defaultName: '默认预设（国际服）' },
  { key: 'beastRegexPresets', currentKey: 'currentBeastRegexPresetId', defaultPrefix: 'beast_regex_intl', defaultName: '默认预设（国际服）' }
])

function allocateUniqueId(baseId, usedIds) {
  let candidate = baseId
  let suffix = 2
  while (usedIds.has(candidate)) {
    candidate = `${baseId}_${suffix}`
    suffix += 1
  }
  usedIds.add(candidate)
  return candidate
}

function allocateUniqueName(baseName, usedNames, preferIntlSuffix = false) {
  const trimmed = String(baseName || '预设').trim() || '预设'
  let candidate = preferIntlSuffix && usedNames.has(trimmed) ? `${trimmed}（国际服）` : trimmed
  let suffix = 2
  while (usedNames.has(candidate)) {
    candidate = `${trimmed}（国际服 ${suffix}）`
    suffix += 1
  }
  usedNames.add(candidate)
  return candidate
}

function mergePresetLists(cnList, intlList, spec) {
  const hasCn = Array.isArray(cnList) && cnList.length > 0
  const hasIntl = Array.isArray(intlList) && intlList.length > 0
  if (!hasIntl) return { changed: false, merged: cnList, idRemap: new Map() }
  if (!hasCn) return { changed: true, merged: intlList, idRemap: new Map() }

  const merged = cnList.map(item => ({ ...item }))
  const usedIds = new Set(merged.map(item => item?.id).filter(Boolean))
  const usedNames = new Set(merged.map(item => item?.name).filter(Boolean))
  const existingSignatures = new Map(merged.map(item => [stableStringify(stripIdentity(item)), item.id]))
  const cnDefault = merged.find(item => item?.id === 'default') || merged[0]
  const cnDefaultSig = cnDefault ? stableStringify(stripIdentity(cnDefault)) : ''
  const idRemap = new Map()

  for (const intlPreset of intlList) {
    if (!intlPreset || typeof intlPreset !== 'object') continue
    const sig = stableStringify(stripIdentity(intlPreset))
    if (intlPreset.id === 'default') {
      if (isPresetBlank(spec.key, intlPreset) || sig === cnDefaultSig) {
        idRemap.set('default', 'default')
        continue
      }
      if (cnDefault && isPresetBlank(spec.key, cnDefault)) {
        const idx = merged.findIndex(item => item.id === 'default')
        if (idx >= 0) {
          merged[idx] = { ...intlPreset, id: 'default', name: cnDefault.name || intlPreset.name || '默认预设' }
          idRemap.set('default', 'default')
          existingSignatures.set(sig, 'default')
          continue
        }
      }
      const newId = allocateUniqueId(`${spec.defaultPrefix}_default`, usedIds)
      const newName = allocateUniqueName(spec.defaultName, usedNames)
      merged.push({ ...intlPreset, id: newId, name: newName })
      existingSignatures.set(sig, newId)
      idRemap.set('default', newId)
      continue
    }

    if (existingSignatures.has(sig)) {
      idRemap.set(intlPreset.id, existingSignatures.get(sig))
      continue
    }

    const newId = usedIds.has(intlPreset.id)
      ? allocateUniqueId(`${intlPreset.id}_intl`, usedIds)
      : (usedIds.add(intlPreset.id), intlPreset.id)
    const newName = allocateUniqueName(intlPreset.name, usedNames, true)
    merged.push({ ...intlPreset, id: newId, name: newName })
    existingSignatures.set(sig, newId)
    idRemap.set(intlPreset.id, newId)
  }

  return { changed: true, merged, idRemap }
}

function isCombatAssistConfigured(raw) {
  if (!raw || typeof raw !== 'object') return false
  return stableStringify(normalizeCombatAssist(raw)) !== stableStringify(createDefaultCombatAssist())
}

function extractStoryContext(rawStory, storyIdRemap = new Map(), skillIdRemap = new Map()) {
  if (!rawStory || typeof rawStory !== 'object') return null
  const presets = Array.isArray(rawStory.storyPresets) ? rawStory.storyPresets : []
  const progressByPresetId = {}
  for (const preset of presets) {
    if (!preset?.id) continue
    const targetId = storyIdRemap.get(preset.id) || preset.id
    if (preset.currentChapterId || preset.currentStepId || preset.viewedChapterId) {
      progressByPresetId[targetId] = {
        currentChapterId: preset.currentChapterId || null,
        currentStepId: preset.currentStepId || null,
        viewedChapterId: preset.viewedChapterId || null
      }
    }
  }
  return {
    currentStoryPresetId: storyIdRemap.get(rawStory.currentStoryPresetId) || rawStory.currentStoryPresetId || 'default',
    currentSkillPresetId: skillIdRemap.get(rawStory.currentSkillPresetId) || rawStory.currentSkillPresetId || 'default',
    progressByPresetId
  }
}

function migrateStoryData(storage) {
  const cnKey = 'storyGuide:v1'
  const intlKey = `${INTL_PREFIX}${cnKey}`
  const cnRaw = readJson(storage, cnKey)
  const intlRaw = readJson(storage, intlKey)
  if (!intlRaw) return false

  const cnStoryList = Array.isArray(cnRaw?.storyPresets) ? cnRaw.storyPresets : null
  const intlStoryList = Array.isArray(intlRaw?.storyPresets) ? intlRaw.storyPresets : null
  const cnSkillList = Array.isArray(cnRaw?.skillPresets) ? cnRaw.skillPresets : null
  const intlSkillList = Array.isArray(intlRaw?.skillPresets) ? intlRaw.skillPresets : null

  const storySpec = { key: 'storyPresets', defaultPrefix: 'story_intl', defaultName: '默认剧情（国际服）' }
  const skillSpec = { key: 'skillPresets', defaultPrefix: 'skill_intl', defaultName: '默认技能（国际服）' }

  const mergedStory = mergePresetLists(
    cnStoryList?.length ? cnStoryList : null,
    intlStoryList?.filter(p => p && (p.id !== 'default' || !isPresetBlank('storyPresets', p) || !cnStoryList?.length)) || null,
    storySpec
  )
  const mergedSkill = mergePresetLists(
    cnSkillList?.length ? cnSkillList : null,
    intlSkillList?.filter(p => p && (p.id !== 'default' || !isPresetBlank('skillPresets', p) || !cnSkillList?.length)) || null,
    skillSpec
  )

  const cnContext = extractStoryContext(cnRaw)
  const intlContext = extractStoryContext(intlRaw, mergedStory.idRemap, mergedSkill.idRemap)

  storage.setItem(cnKey, JSON.stringify({
    version: 2,
    storyPresets: mergedStory.merged || cnStoryList || intlStoryList || [],
    skillPresets: mergedSkill.merged || cnSkillList || intlSkillList || [],
    currentStoryPresetId: cnContext?.currentStoryPresetId || 'default',
    currentSkillPresetId: cnContext?.currentSkillPresetId || 'default'
  }))
  if (cnContext && !storage.getItem(STORY_CONTEXT_STORAGE_KEY)) {
    storage.setItem(STORY_CONTEXT_STORAGE_KEY, JSON.stringify(cnContext))
  }
  if (intlContext) {
    storage.setItem(`${INTL_PREFIX}${STORY_CONTEXT_STORAGE_KEY}`, JSON.stringify(intlContext))
  }
  storage.removeItem(intlKey)
  return true
}

function migrateCombatAssist(storage) {
  const intlSettingsKey = `${INTL_PREFIX}settings`
  const intlSettings = readJson(storage, intlSettingsKey)
  if (!intlSettings || !Object.hasOwn(intlSettings, 'combatAssist')) return false
  const cnSettings = readJson(storage, 'settings') || {}
  if (!isCombatAssistConfigured(cnSettings.combatAssist) && isCombatAssistConfigured(intlSettings.combatAssist)) {
    cnSettings.combatAssist = normalizeCombatAssist(intlSettings.combatAssist)
    storage.setItem('settings', JSON.stringify(cnSettings))
  }
  const { combatAssist: _removed, ...restIntl } = intlSettings
  storage.setItem(intlSettingsKey, JSON.stringify(restIntl))
  return true
}

const checkedStorages = new WeakSet()

export function migrateCrossServerPresets(storage) {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    return { migrated: false }
  }
  if (checkedStorages.has(storage)) return { migrated: false }
  try {
    if (storage.getItem(CROSS_SERVER_MIGRATION_FLAG_KEY) === CROSS_SERVER_MIGRATION_VERSION) {
      checkedStorages.add(storage)
      return { migrated: false }
    }
    const hasLegacyIntlData = PRESET_LIST_SPECS.some(spec => storage.getItem(`${INTL_PREFIX}${spec.key}`) != null)
      || storage.getItem(`${INTL_PREFIX}storyGuide:v1`) != null
      || Object.hasOwn(readJson(storage, `${INTL_PREFIX}settings`) || {}, 'combatAssist')

    if (!hasLegacyIntlData) {
      checkedStorages.add(storage)
      return { migrated: false }
    }

    let migratedCount = 0
    for (const spec of PRESET_LIST_SPECS) {
      const intlKey = `${INTL_PREFIX}${spec.key}`
      const intlList = readJson(storage, intlKey)
      if (!Array.isArray(intlList)) {
        if (storage.getItem(intlKey) != null) storage.removeItem(intlKey)
        continue
      }
      const cnList = readJson(storage, spec.key)
      const { changed, merged, idRemap } = mergePresetLists(cnList, intlList, spec)
      if (changed && Array.isArray(merged)) {
        storage.setItem(spec.key, JSON.stringify(merged))
        const intlCurrentKey = `${INTL_PREFIX}${spec.currentKey}`
        const currentIntlId = storage.getItem(intlCurrentKey)
        if (currentIntlId && idRemap.has(currentIntlId)) {
          storage.setItem(intlCurrentKey, idRemap.get(currentIntlId))
        }
        migratedCount += 1
      }
      storage.removeItem(intlKey)
    }

    if (migrateStoryData(storage)) migratedCount += 1
    if (migrateCombatAssist(storage)) migratedCount += 1

    storage.setItem(CROSS_SERVER_MIGRATION_FLAG_KEY, CROSS_SERVER_MIGRATION_VERSION)
    checkedStorages.add(storage)
    return { migrated: migratedCount > 0, migratedCount }
  } catch {
    return { migrated: false }
  }
}
