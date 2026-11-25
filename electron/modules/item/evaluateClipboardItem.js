import { parseItemInfo } from './parser.js'
import { buildCraftingAffixPayload } from './craftingAffixPayload.js'
import { evaluateAlterationPlan, matchAffixes, matchEldritchImplicits, matchSockets, matchMapRequirements } from './matcher.js'
import { attachParseRequestId } from '../watcher/fileWatcher.js'
import { itemFootprintRegistry } from '../items/footprintRegistry.js'

export const isMapCategory = (category) => category === '异界地图' || category === '地图'
export const isRollingCategory = (category) => isMapCategory(category) || ['海图', '契约', '蓝图'].includes(category)
export const activeMapConfig = (map = {}) => {
  if (['chart', 'atlas', 'heist'].includes(map.targetKind)) return map
  return map.activeKind === 'chart'
    ? { ...(map.chart || {}), targetKind: 'chart' }
    : { ...map, targetKind: 'atlas' }
}
export const rollingTarget = (config) => activeMapConfig(config?.map || {}).targetKind

export function evaluateClipboardItem({
  clipboardText,
  config = null,
  requestId = null,
  localizationRuntime = null,
  crafting = null,
  mapStats = null
} = {}) {
  try {
    const itemInfo = localizationRuntime
      ? localizationRuntime.parseItem(clipboardText, config?.localizationRevision)
      : parseItemInfo(clipboardText)

    if (!itemInfo) {
      return {
        result: attachParseRequestId({ error: '无法解析物品信息' }, requestId),
        notifyOverlay: false
      }
    }

    const isLegendary = itemInfo.rarity === '传奇'
    const isCorrupted = itemInfo.isCorrupted

    // 腐化的传奇物品仍然禁止制作
    if (isLegendary && isCorrupted) {
      return {
        result: attachParseRequestId({
          rarity: itemInfo.rarity,
          isLegendary: true,
          isCorrupted: true,
          error: '腐化的传奇物品无法制作'
        }, requestId),
        notifyOverlay: false
      }
    }

    let affixMatchResult = {
      isMatch: false,
      requiredAllMatched: false,
      matchedSelectedCount: 0,
      matchedModTexts: [],
      matchedGroupId: null,
      matchedGroupName: '',
      groupResults: []
    }
    let alterationPlan = null
    if (config && config.moduleTwo && config.moduleTwo.enabled) {
      affixMatchResult = Array.isArray(config.moduleTwo.affixGroups)
        ? matchAffixes(itemInfo, config.moduleTwo.affixGroups)
        : matchAffixes(
            itemInfo,
            config.moduleTwo.requiredAffixes || [],
            config.moduleTwo.selectedAffixes || [],
            config.moduleTwo.selectedCount || 1
          )
      if ((config.moduleTwo.mode || 'alteration') === 'alteration') {
        const resolveAffixType = (condition) => crafting?.resolveCatalogAffixType?.(condition) ?? null
        alterationPlan = Array.isArray(config.moduleTwo.affixGroups)
          ? evaluateAlterationPlan(itemInfo, config.moduleTwo.affixGroups, {
              enableAugmentation: Boolean(config.moduleTwo.enableAugmentation),
              enableRegal: Boolean(config.moduleTwo.enableRegal),
              resolveAffixType,
              matchResult: affixMatchResult
            })
          : evaluateAlterationPlan(itemInfo, config.moduleTwo.requiredAffixes || [], {
              selectedAffixes: config.moduleTwo.selectedAffixes || [],
              selectedCount: config.moduleTwo.selectedCount || 1,
              enableAugmentation: Boolean(config.moduleTwo.enableAugmentation),
              enableRegal: Boolean(config.moduleTwo.enableRegal),
              resolveAffixType,
              matchResult: affixMatchResult
            })
      }
    }

    let socketMatch = false
    if (config && config.moduleThree && config.moduleThree.enabled) {
      socketMatch = matchSockets(
        itemInfo,
        config.moduleThree.socket,
        config.moduleThree.link,
        config.moduleThree.color
      )
    }

    let mapMatchResult = { isMatch: false }
    if (config && config.map && isRollingCategory(itemInfo.category)) {
      mapMatchResult = matchMapRequirements(itemInfo, activeMapConfig(config.map))
    }

    const eldritchMatchResult = config?.moduleEldritch?.enabled
      ? matchEldritchImplicits(itemInfo, config.moduleEldritch.targets, {
          naturalBaseImplicitTexts: crafting?.naturalBaseImplicitTexts?.(itemInfo.baseName) ?? []
        })
      : { isMatch: false, matchedTargetName: '', matchedText: '' }

    const result = {
      originalText: itemInfo.originalText,
      modTextAliases: itemInfo.modTextAliases,
      itemTextLanguage: itemInfo.itemTextLanguage,
      category: itemInfo.category,
      rarity: itemInfo.rarity,
      name: itemInfo.name,
      baseName: itemInfo.baseName,
      footprint: itemFootprintRegistry.resolve(itemInfo.category, itemInfo.baseName || itemInfo.name),
      level: itemInfo.level,
      ...(Number.isSafeInteger(itemInfo.itemTier) && itemInfo.itemTier > 0 ? { itemTier: itemInfo.itemTier } : {}),
      quality: itemInfo.quality,
      socketsCount: itemInfo.socketsCount,
      links: itemInfo.links,
      socketsColors: itemInfo.socketsColors,
      heistStats: itemInfo.heistStats,
      isQuestItem: itemInfo.isQuestItem,
      isLegendary,
      itemQuantity: itemInfo.itemQuantity,
      itemRarity: itemInfo.itemRarity,
      monsterPackSize: itemInfo.monsterPackSize,
      areaLevel: itemInfo.areaLevel || 0,
      areaName: itemInfo.areaName || '',
      deadmanSulphur: itemInfo.deadmanSulphur || 0,
      mapTier: itemInfo.mapTier,
      moreMaps: itemInfo.moreMaps || 0,
      moreScarabs: itemInfo.moreScarabs || 0,
      moreThreads: itemInfo.moreThreads || 0,
      atlasDrops: itemInfo.atlasDrops || 0,
      moreCurrency: itemInfo.moreCurrency || 0,
      isCorrupted,
      isMirrored: itemInfo.isMirrored,
      isUnmodifiable: itemInfo.isUnmodifiable,
      influences: itemInfo.influences,
      isUnidentified: itemInfo.isUnidentified || false,
      affixFormatUnsupported: itemInfo.affixFormatUnsupported || false,
      affixMatch: affixMatchResult.isMatch,
      requiredAllMatched: affixMatchResult.requiredAllMatched,
      matchedSelectedCount: affixMatchResult.matchedSelectedCount,
      matchedModTexts: affixMatchResult.matchedModTexts,
      matchedGroupId: affixMatchResult.matchedGroupId,
      matchedGroupName: affixMatchResult.matchedGroupName,
      affixGroupResults: affixMatchResult.groupResults,
      ...(alterationPlan ? { alterationPlan } : {}),
      eldritchImplicitMatch: eldritchMatchResult.isMatch,
      matchedEldritchTargetName: eldritchMatchResult.matchedTargetName,
      matchedEldritchText: eldritchMatchResult.matchedText,
      mapMatch: mapMatchResult.isMatch,
      ...buildCraftingAffixPayload(itemInfo),
      socketMatch,
      rollingTarget: rollingTarget(config),
      mapStats: isRollingCategory(itemInfo.category) ? {
        processedCount: mapStats?.processedCount ?? 0,
        qualifiedCount: mapStats?.qualifiedCount ?? 0,
        blacklistStats: { ...(mapStats?.blacklistStats || {}) },
        whitelistStats: { ...(mapStats?.whitelistStats || {}) }
      } : null
    }
    return {
      result: attachParseRequestId(result, requestId),
      notifyOverlay: true
    }
  } catch (error) {
    return {
      result: attachParseRequestId({
        error: error.message,
        ...(error.code ? { errorCode: error.code } : {})
      }, requestId),
      notifyOverlay: false
    }
  }
}
