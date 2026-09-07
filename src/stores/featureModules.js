import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { availableFeatureCatalog, featureForRoute } from '../features/featureCatalog.js'
import {
  readFeatureModuleState,
  resetFeatureModuleState,
  saveFeatureModuleState
} from '../features/featureModuleRepository.js'

const development = Boolean(import.meta.env?.DEV)

export const useFeatureModulesStore = defineStore('featureModules', () => {
  const catalog = Object.freeze(availableFeatureCatalog({ development }))
  const initial = readFeatureModuleState(globalThis.localStorage, { development })
  const disabledFeatureIds = ref([...initial.disabledFeatureIds])
  const disabledSet = computed(() => new Set(disabledFeatureIds.value))
  const enabledFeatures = computed(() => catalog.filter(item => !disabledSet.value.has(item.id)))
  const enabledNavigationFeatures = computed(() => enabledFeatures.value.filter(item => item.navigation && item.route))
  const disabledFeatures = computed(() => catalog.filter(item => disabledSet.value.has(item.id)))

  function isEnabled(id) {
    return catalog.some(item => item.id === id) && !disabledSet.value.has(id)
  }

  function commit(nextIds) {
    const normalized = [...new Set(nextIds)].filter(id => catalog.some(item => item.id === id))
    disabledFeatureIds.value = normalized
    saveFeatureModuleState({ version: 1, disabledFeatureIds: normalized }, globalThis.localStorage, { development })
  }

  function disable(id) {
    if (!catalog.some(item => item.id === id) || disabledSet.value.has(id)) return false
    commit([...disabledFeatureIds.value, id])
    return true
  }

  function enable(id) {
    if (!disabledSet.value.has(id)) return false
    commit(disabledFeatureIds.value.filter(current => current !== id))
    return true
  }

  function reset() {
    disabledFeatureIds.value = []
    resetFeatureModuleState(globalThis.localStorage)
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
    isEnabled,
    disable,
    enable,
    reset,
    moduleForRoute
  }
})
