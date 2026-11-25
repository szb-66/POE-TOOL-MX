import { serverStorage as localStorage } from '../utils/serverStorage.js'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { availableFeatureCatalog, featureForRoute } from '../features/featureCatalog.js'
import { currentServer } from '../utils/serverContext.js'
import {
  readFeatureModuleState,
  resetFeatureModuleState,
  saveFeatureModuleState
} from '../features/featureModuleRepository.js'

const development = Boolean(import.meta.env?.DEV)

export const useFeatureModulesStore = defineStore('featureModules', () => {
  const catalog = Object.freeze(availableFeatureCatalog({ development }))
  const initial = readFeatureModuleState(localStorage, { development })
  const disabledFeatureIds = ref([...initial.disabledFeatureIds])
  const disabledSet = computed(() => new Set(disabledFeatureIds.value))
  const supported = item => currentServer.capabilities[item.id]?.available !== false
  const enabledFeatures = computed(() => catalog.filter(item => supported(item) && !disabledSet.value.has(item.id)))
  const enabledNavigationFeatures = computed(() => enabledFeatures.value.filter(item => item.navigation && item.route))
  const disabledFeatures = computed(() => catalog.filter(item => supported(item) && disabledSet.value.has(item.id)))
  const unsupportedFeatures = computed(() => catalog.filter(item => !supported(item)).map(item => ({
    ...item,
    unavailableReason: currentServer.capabilities[item.id].reason
  })))

  function isSupported(id) {
    return catalog.some(item => item.id === id && supported(item))
  }

  function isEnabled(id) {
    return isSupported(id) && !disabledSet.value.has(id)
  }

  function commit(nextIds) {
    const normalized = [...new Set(nextIds)].filter(id => catalog.some(item => item.id === id))
    disabledFeatureIds.value = normalized
    saveFeatureModuleState({ version: 1, disabledFeatureIds: normalized }, localStorage, { development })
  }

  function disable(id) {
    if (!isSupported(id) || disabledSet.value.has(id)) return false
    commit([...disabledFeatureIds.value, id])
    return true
  }

  function enable(id) {
    if (!isSupported(id) || !disabledSet.value.has(id)) return false
    commit(disabledFeatureIds.value.filter(current => current !== id))
    return true
  }

  function reset() {
    disabledFeatureIds.value = []
    resetFeatureModuleState(localStorage)
  }

  function moduleForRoute(path) {
    return featureForRoute(path, { development })
  }

  return {
    catalog,
    disabledFeatureIds,
    enabledFeatures,
    enabledNavigationFeatures,
    disabledFeatures,
    unsupportedFeatures,
    isSupported,
    isEnabled,
    disable,
    enable,
    reset,
    moduleForRoute
  }
})
