import { electronApi } from '@/api/electron.js'
import { useBagStore } from '@/stores/bag.js'
import { useBatchCraftingStore } from '@/stores/batchCrafting.js'
import { useChaosRecipeStore } from '@/stores/chaosRecipe.js'
import { useCombatStore } from '@/stores/combat.js'
import { useFeatureModulesStore } from '@/stores/featureModules.js'
import { useJunfengStore } from '@/stores/junfeng.js'
import { usePriceCheckStore } from '@/stores/priceCheck.js'
import { usePuzzleStore } from '@/stores/puzzle.js'
import { useScriptStore } from '@/stores/script.js'
import { useStashPickupStore } from '@/stores/stashPickup.js'
import { useStoryStore } from '@/stores/story.js'
import { useFaustusStore } from '@/domains/faustus/faustusStore.js'
import { useMapTrackerStore } from '@/stores/mapTracker.js'
import { disposeBagAutomation, initBagAutomation } from '@/utils/bagService.js'
import { disposeCombatAssist, initCombatAssist, stopLoopAssist, stopPotionAssist } from '@/utils/combatService.js'
import { updateShortcuts } from '@/utils/scriptService.js'
import { registerFeatureRuntimeAdapter, setFeatureShortcutSynchronizer } from './featureRuntime.js'

const successful = result => result !== false && result?.success !== false

export function installFeatureRuntime({ router }) {
  const featureStore = useFeatureModulesStore()
  const scriptStore = useScriptStore()
  const batchStore = useBatchCraftingStore()
  const bagStore = useBagStore()
  const stashStore = useStashPickupStore()
  const junfengStore = useJunfengStore()
  const combatStore = useCombatStore()
  const storyStore = useStoryStore()
  const chaosStore = useChaosRecipeStore()
  const priceStore = usePriceCheckStore()
  const puzzleStore = usePuzzleStore()
  const faustusStore = useFaustusStore()
  const mapTrackerStore = useMapTrackerStore()
  const featureDisposers = new Map()
  const adapterDisposers = []
  const junfengConsumers = new Set()
  let junfengListenerDispose = null

  function featureEnabled(id) { return featureStore.isEnabled(id) }
  function setFeatureDisposer(id, disposers) {
    disposeFeature(id)
    const list = (Array.isArray(disposers) ? disposers : [disposers]).filter(item => typeof item === 'function')
    featureDisposers.set(id, () => list.reverse().forEach(dispose => { try { dispose() } catch {} }))
  }
  function disposeFeature(id) {
    featureDisposers.get(id)?.()
    featureDisposers.delete(id)
  }
  function useJunfengListener(id) {
    junfengConsumers.add(id)
    if (!junfengListenerDispose) junfengListenerDispose = junfengStore.listen()
  }
  function releaseJunfengListener(id) {
    junfengConsumers.delete(id)
    if (!junfengConsumers.size) {
      junfengListenerDispose?.()
      junfengListenerDispose = null
    }
  }
  async function stopScriptMode(mode) {
    if (!scriptStore.isRunning || scriptStore.mode !== mode) return { success: true }
    const result = await electronApi.script.stop()
    if (!successful(result)) return result
    await electronApi.file.watcher.stop()
    scriptStore.reset()
    return { success: true }
  }
  async function collectResults(actions) {
    const settled = await Promise.allSettled(actions.map(action => action()))
    const errors = settled.flatMap(result => {
      if (result.status === 'rejected') return [result.reason?.message || String(result.reason)]
      return successful(result.value) ? [] : [result.value?.error || '停止操作失败']
    })
    return errors.length ? { success: false, error: errors.join('；') } : { success: true }
  }

  async function attachItems() {
    if (featureDisposers.has('items')) return { success: true }
    setFeatureDisposer('items', [
      batchStore.listen(),
      electronApi.batchCrafting.onScanRequested(() => {
        if (featureEnabled('items')) void router.push('/items')
      })
    ])
    return { success: true }
  }
  async function attachBag() {
    if (!featureDisposers.has('bag')) {
      setFeatureDisposer('bag', stashStore.listen())
      useJunfengListener('bag')
      await initBagAutomation()
    }
    const results = await Promise.all([
      stashStore.initializeRuntime({ preserveEnabledOnFailure: true }),
      junfengStore.initializeRuntime({ preserveEnabledOnFailure: true })
    ])
    const failure = results.find(result => !successful(result))
    return failure || { success: true }
  }
  async function attachCombat() { await initCombatAssist(); return { success: true } }
  async function attachRecipe() {
    if (!featureDisposers.has('recipe')) setFeatureDisposer('recipe', chaosStore.listenAutomation())
    return chaosStore.initializeRuntime({ preserveEnabledOnFailure: true })
  }
  async function attachPriceCheck() {
    if (!featureDisposers.has('price-check')) setFeatureDisposer('price-check', priceStore.listenOverlay())
    try { await priceStore.syncRuntime({ enabled: priceStore.settings.enabled }); return { success: true } }
    catch (error) { try { await priceStore.refreshStatus() } catch {}; return { success: false, error: error.message } }
  }
  async function attachPuzzle() {
    if (!featureDisposers.has('puzzle')) {
      setFeatureDisposer('puzzle', puzzleStore.listen(() => {
        if (featureEnabled('puzzle')) void router.push('/puzzle')
      }))
    }
    return { success: true }
  }
  async function attachFaustus() { return { success: true } }
  async function attachMapTracker() { if (!featureDisposers.has('map-tracker')) setFeatureDisposer('map-tracker', mapTrackerStore.listen()); await mapTrackerStore.refresh(); return { success: true } }
  async function attachTraining() {
    useJunfengListener('highlight-model-training')
    const results = await Promise.allSettled([junfengStore.loadTrainingStatus(), junfengStore.loadTrainingSessions()])
    const failure = results.find(result => result.status === 'rejected')
    return failure ? { success: false, error: failure.reason?.message || '模型训练状态恢复失败' } : { success: true }
  }

  const adapters = {
    items: {
      isBusy: () => (scriptStore.isRunning && scriptStore.mode === 'items') || batchStore.busy,
      suspend: async () => { const result = await collectResults([() => stopScriptMode('items'), () => batchStore.stopScan(), () => electronApi.window.closeOverlay()]); if (result.success) disposeFeature('items'); return result },
      resume: attachItems
    },
    map: { isBusy: () => scriptStore.isRunning && scriptStore.mode === 'map', suspend: () => collectResults([() => stopScriptMode('map'), () => electronApi.window.closeOverlay()]), resume: async () => ({ success: true }) },
    'map-tracker': { isBusy: () => Boolean(mapTrackerStore.activeRun), suspend: async () => { const result = await collectResults([() => mapTrackerStore.setPaused(true), () => mapTrackerStore.setEnabled(false), () => electronApi.mapTracker.controlOverlay('hide')]); if (result.success) disposeFeature('map-tracker'); return result }, resume: attachMapTracker },
    bag: {
      isBusy: () => bagStore.isStashing || stashStore.running || junfengStore.running,
      suspend: async () => {
        const result = await collectResults([
          () => electronApi.bag.stopStash(), () => electronApi.bag.stopDetection(),
          () => stashStore.stop(), () => junfengStore.stop(),
          () => stashStore.syncRuntime({ enabled: false }), () => junfengStore.sync({ enabled: false })
        ])
        if (result.success) { disposeBagAutomation(); disposeFeature('bag'); releaseJunfengListener('bag') }
        return result
      },
      resume: attachBag
    },
    combat: {
      isBusy: () => combatStore.running || combatStore.loopRunning,
      suspend: async () => { const result = await collectResults([stopPotionAssist, stopLoopAssist, () => electronApi.combat.stopPortal()]); if (result.success) disposeCombatAssist(); return result },
      resume: attachCombat
    },
    story: { isBusy: () => false, suspend: () => storyStore.hideOverlay(), resume: async () => ({ success: true }) },
    recipe: {
      isBusy: () => ['running', 'paused'].includes(chaosStore.automation.status),
      suspend: async () => { const result = await collectResults([() => electronApi.chaosRecipe.stopAutomation(), () => electronApi.chaosRecipe.closeOverlay(), () => chaosStore.syncRuntime({ enabled: false })]); if (result.success) disposeFeature('recipe'); return result },
      resume: attachRecipe
    },
    'price-check': {
      isBusy: () => false,
      suspend: async () => { const result = await collectResults([() => priceStore.syncRuntime({ enabled: false }), () => electronApi.priceCheck.closeOverlay()]); if (result.success) { priceStore.clearResults(); disposeFeature('price-check') } return result },
      resume: attachPriceCheck
    },
    faustus: { isBusy: () => faustusStore.running, suspend: async () => { if (faustusStore.running) await faustusStore.stop(); faustusStore.disconnect(); return { success: true } }, resume: attachFaustus },
    puzzle: { isBusy: () => puzzleStore.executing || puzzleStore.analyzing || puzzleStore.probingBorder, suspend: async () => { const result = await electronApi.puzzle.stopAll('module-disabled'); if (successful(result)) disposeFeature('puzzle'); return result }, resume: attachPuzzle },
    'highlight-model-training': { isBusy: () => junfengStore.trainingBusy || junfengStore.trainingStatus.status === 'running', suspend: async () => { const result = await electronApi.junfeng.stopTraining?.(); if (successful(result)) releaseJunfengListener('highlight-model-training'); return result }, resume: attachTraining }
  }

  for (const [id, adapter] of Object.entries(adapters)) adapterDisposers.push(registerFeatureRuntimeAdapter(id, adapter))
  setFeatureShortcutSynchronizer(() => updateShortcuts())

  async function initialize() {
    const warnings = []
    for (const feature of featureStore.enabledFeatures) {
      const adapter = adapters[feature.id]
      if (!adapter?.resume) continue
      try {
        const result = await adapter.resume()
        if (!successful(result)) warnings.push({ name: feature.id, error: result?.error || '模块恢复失败' })
      } catch (error) { warnings.push({ name: feature.id, error: error?.message || String(error) }) }
    }
    return warnings
  }

  function dispose() {
    for (const id of [...featureDisposers.keys()]) disposeFeature(id)
    disposeBagAutomation()
    disposeCombatAssist()
    junfengListenerDispose?.()
    junfengListenerDispose = null
    adapterDisposers.splice(0).forEach(remove => remove())
    setFeatureShortcutSynchronizer(null)
  }

  return { initialize, dispose }
}
