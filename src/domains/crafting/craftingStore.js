import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { electronApi } from '../../api/electron.js'

export const useCraftingStore = defineStore('crafting-simulator', () => {
  const status = ref(null)
  const categories = ref([])
  const bases = ref([])
  const baseTotal = ref(0)
  const catalog = ref({ groups: [], sourceCoverage: {}, totalFamilies: 0 })
  const session = ref(null)
  const currencies = ref([])
  const essences = ref({ items: [], unresolvedCount: 0 })
  const benchCrafts = ref({ items: [], unresolvedCount: 0 })
  const fossils = ref({ items: [], resonators: [], supportedCount: 0 })
  const harvest = ref({ items: [], categories: [], total: 0, executableCount: 0 })
  const eldritch = ref({ items: [], total: 0, executableCount: 0, dominance: { source: null, affixType: null, label: '无支配' } })
  const influence = ref({ items: [], total: 0, executableCount: 0, donor: null, influenceLabels: {} })
  const veiled = ref({ items: [], total: 0, executableCount: 0, pending: null, options: [], canUnveil: false, unveilUnavailableReason: '' })
  const beastcraft = ref({ items: [], total: 0, executableCount: 0, beastLevel: 83, pendingSplitResults: [], imprint: null, foreseeing: false })
  const awakenerDonorOptions = ref({ bases: [], influences: [], candidates: [] })
  const lastEvent = ref(null)
  const updateProgress = ref(null)
  const updateError = ref('')
  const updating = ref(false)
  const applying = ref(false)
  let stopUpdateEvents = null

  const currentState = computed(() => session.value?.state ?? null)
  const canUndo = computed(() => Boolean(session.value?.history?.length))
  const canRedo = computed(() => Boolean(session.value?.future?.length))

  async function initialize() {
    stopUpdateEvents?.()
    stopUpdateEvents = electronApi.crafting.onUpdateProgress((progress) => { updateProgress.value = progress })
    const [nextStatus, nextCategories] = await Promise.all([
      electronApi.crafting.getStatus(), electronApi.crafting.listCategories()
    ])
    status.value = nextStatus
    categories.value = nextCategories
  }

  async function searchBases(input) {
    const result = await electronApi.crafting.searchBases(input)
    bases.value = result.items
    baseTotal.value = result.total
    return result
  }

  async function loadCatalog(input) {
    if (!input.baseId) { catalog.value = { groups: [], sourceCoverage: {}, totalFamilies: 0 }; return catalog.value }
    catalog.value = await electronApi.crafting.searchModifierCatalog(input)
    return catalog.value
  }

  async function createSession(input) {
    const result = await electronApi.crafting.createManualSession(input)
    session.value = result.session
    currencies.value = result.currencies
    essences.value = result.essences
    benchCrafts.value = result.benchCrafts
    fossils.value = result.fossils
    harvest.value = result.harvest
    eldritch.value = result.eldritch
    influence.value = result.influence
    veiled.value = result.veiled
    beastcraft.value = result.beastcraft
    lastEvent.value = { summary: `已创建 ${result.session.base.displayName || result.session.base.name}` }
    await loadCatalog({ baseId: result.session.baseId, itemLevel: result.session.itemLevel })
    return result
  }

  async function applyCurrency(actionId) {
    if (!session.value || applying.value) return
    applying.value = true
    try {
      const result = await electronApi.crafting.applyManualCurrency(session.value, actionId)
      session.value = result.session
      currencies.value = result.currencies
      essences.value = result.essences
      benchCrafts.value = result.benchCrafts
      fossils.value = result.fossils
      harvest.value = result.harvest
      eldritch.value = result.eldritch
      influence.value = result.influence
      veiled.value = result.veiled
      beastcraft.value = result.beastcraft
      lastEvent.value = result.event
      return result
    } finally { applying.value = false }
  }

  async function applyEssence(essenceId) {
    if (!session.value || applying.value) return
    applying.value = true
    try {
      const result = await electronApi.crafting.applyManualEssence(session.value, essenceId)
      session.value = result.session
      currencies.value = result.currencies
      essences.value = result.essences
      benchCrafts.value = result.benchCrafts
      fossils.value = result.fossils
      harvest.value = result.harvest
      eldritch.value = result.eldritch
      influence.value = result.influence
      veiled.value = result.veiled
      beastcraft.value = result.beastcraft
      lastEvent.value = result.event
      return result
    } finally { applying.value = false }
  }

  async function applyBenchCraft(benchCraftId) {
    if (!session.value || applying.value) return
    applying.value = true
    try {
      const result = await electronApi.crafting.applyManualBenchCraft(session.value, benchCraftId)
      session.value = result.session
      currencies.value = result.currencies
      essences.value = result.essences
      benchCrafts.value = result.benchCrafts
      fossils.value = result.fossils
      harvest.value = result.harvest
      eldritch.value = result.eldritch
      influence.value = result.influence
      veiled.value = result.veiled
      beastcraft.value = result.beastcraft
      lastEvent.value = result.event
      return result
    } finally { applying.value = false }
  }

  async function applyFossils(input) {
    if (!session.value || applying.value) return
    applying.value = true
    try {
      const result = await electronApi.crafting.applyManualFossils(session.value, input)
      session.value = result.session
      currencies.value = result.currencies
      essences.value = result.essences
      benchCrafts.value = result.benchCrafts
      fossils.value = result.fossils
      harvest.value = result.harvest
      eldritch.value = result.eldritch
      influence.value = result.influence
      veiled.value = result.veiled
      beastcraft.value = result.beastcraft
      lastEvent.value = result.event
      return result
    } finally { applying.value = false }
  }

  async function applyHarvestCraft(craftId) {
    if (!session.value || applying.value) return
    applying.value = true
    try {
      const result = await electronApi.crafting.applyManualHarvestCraft(session.value, craftId)
      session.value = result.session
      currencies.value = result.currencies
      essences.value = result.essences
      benchCrafts.value = result.benchCrafts
      fossils.value = result.fossils
      harvest.value = result.harvest
      eldritch.value = result.eldritch
      influence.value = result.influence
      veiled.value = result.veiled
      beastcraft.value = result.beastcraft
      lastEvent.value = result.event
      return result
    } finally { applying.value = false }
  }

  async function applyEldritchCraft(actionId) {
    if (!session.value || applying.value) return
    applying.value = true
    try {
      const result = await electronApi.crafting.applyManualEldritchCraft(session.value, actionId)
      session.value = result.session
      currencies.value = result.currencies
      essences.value = result.essences
      benchCrafts.value = result.benchCrafts
      fossils.value = result.fossils
      harvest.value = result.harvest
      eldritch.value = result.eldritch
      influence.value = result.influence
      veiled.value = result.veiled
      beastcraft.value = result.beastcraft
      lastEvent.value = result.event
      return result
    } finally { applying.value = false }
  }

  async function loadAwakenerDonorOptions(input = {}) {
    if (!session.value) return awakenerDonorOptions.value
    awakenerDonorOptions.value = await electronApi.crafting.listAwakenerDonorCandidates(session.value, input)
    return awakenerDonorOptions.value
  }

  async function configureAwakenerDonor(input) {
    if (!session.value || applying.value) return
    applying.value = true
    try { return await applySessionResult(electronApi.crafting.configureAwakenerDonor(session.value, input)) }
    finally { applying.value = false }
  }

  async function clearAwakenerDonor() {
    if (!session.value || applying.value) return
    applying.value = true
    try { return await applySessionResult(electronApi.crafting.clearAwakenerDonor(session.value)) }
    finally { applying.value = false }
  }

  async function applyInfluenceCraft(actionId) {
    if (!session.value || applying.value) return
    applying.value = true
    try { return await applySessionResult(electronApi.crafting.applyManualInfluenceCraft(session.value, actionId)) }
    finally { applying.value = false }
  }

  async function applyVeiledCraft(actionId) {
    if (!session.value || applying.value) return
    applying.value = true
    try { return await applySessionResult(electronApi.crafting.applyManualVeiledCraft(session.value, actionId)) }
    finally { applying.value = false }
  }

  async function selectVeiledOption(modifierId, tierId) {
    if (!session.value || applying.value) return
    applying.value = true
    try { return await applySessionResult(electronApi.crafting.selectManualVeiledOption(session.value, modifierId, tierId)) }
    finally { applying.value = false }
  }

  async function loadBeastcrafts(beastLevel = beastcraft.value.beastLevel) {
    if (!session.value) return beastcraft.value
    beastcraft.value = await electronApi.crafting.listManualBeastcrafts(session.value, { beastLevel })
    return beastcraft.value
  }

  async function applyBeastcraft(recipeId, beastLevel = beastcraft.value.beastLevel) {
    if (!session.value || applying.value) return
    applying.value = true
    try { return await applySessionResult(electronApi.crafting.applyManualBeastcraft(session.value, recipeId, { beastLevel })) }
    finally { applying.value = false }
  }

  async function selectSplitResult(itemId) {
    if (!session.value || applying.value) return
    applying.value = true
    try { return await applySessionResult(electronApi.crafting.selectManualSplitResult(session.value, itemId)) }
    finally { applying.value = false }
  }

  async function undo() { return applySessionResult(electronApi.crafting.undoManualAction(session.value)) }
  async function redo() { return applySessionResult(electronApi.crafting.redoManualAction(session.value)) }
  async function reset() { return applySessionResult(electronApi.crafting.resetManualSession(session.value)) }

  async function applySessionResult(promise) {
    if (!session.value) return
    const result = await promise
    session.value = result.session
    currencies.value = result.currencies
    essences.value = result.essences
    benchCrafts.value = result.benchCrafts
    fossils.value = result.fossils
    harvest.value = result.harvest
    eldritch.value = result.eldritch
    influence.value = result.influence
    veiled.value = result.veiled
    beastcraft.value = result.beastcraft
    lastEvent.value = result.event ?? null
    return result
  }

  async function updateData() {
    updating.value = true
    updateError.value = ''
    updateProgress.value = { phase: 'start', completed: 0, total: 1 }
    try {
      await electronApi.crafting.updateData()
      status.value = await electronApi.crafting.getStatus()
      if (session.value) {
        await loadCatalog({ baseId: session.value.baseId, itemLevel: session.value.itemLevel })
        essences.value = await electronApi.crafting.listManualEssences(session.value)
        benchCrafts.value = await electronApi.crafting.listManualBenchCrafts(session.value)
        fossils.value = await electronApi.crafting.listManualFossils(session.value)
        harvest.value = await electronApi.crafting.listManualHarvestCrafts(session.value)
        eldritch.value = await electronApi.crafting.listManualEldritchCrafts(session.value)
        influence.value = await electronApi.crafting.listManualInfluenceCrafts(session.value)
        veiled.value = await electronApi.crafting.listManualVeiledCrafts(session.value)
        beastcraft.value = await electronApi.crafting.listManualBeastcrafts(session.value, { beastLevel: beastcraft.value.beastLevel })
      }
    } catch (error) {
      updateError.value = error?.message || '更新失败'
      throw error
    } finally { updating.value = false }
  }

  async function cancelUpdate() { await electronApi.crafting.cancelUpdate() }
  function dispose() { stopUpdateEvents?.() }

  return {
    status, categories, bases, baseTotal, catalog, session, currencies, essences, benchCrafts, fossils, harvest, eldritch, influence, veiled, beastcraft, awakenerDonorOptions, lastEvent,
    updateProgress, updateError, updating, applying, currentState, canUndo, canRedo,
    initialize, searchBases, loadCatalog, createSession, applyCurrency, applyEssence, applyBenchCraft, applyFossils, applyHarvestCraft, applyEldritchCraft,
    loadAwakenerDonorOptions, configureAwakenerDonor, clearAwakenerDonor, applyInfluenceCraft, applyVeiledCraft, selectVeiledOption, loadBeastcrafts, applyBeastcraft, selectSplitResult, undo, redo, reset,
    updateData, cancelUpdate, dispose
  }
})
