import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { electronApi } from '../../api/electron.js'

export const useCraftingStore = defineStore('crafting-planner', () => {
  const status = ref(null)
  const categories = ref([])
  const bases = ref([])
  const baseTotal = ref(0)
  const modifiers = ref([])
  const modifierTotal = ref(0)
  const prices = ref({ records: [], overrides: {}, health: 'unavailable' })
  const updateProgress = ref(null)
  const updateError = ref('')
  const updating = ref(false)
  const planning = ref(false)
  const planPhase = ref('idle')
  const planProgress = ref(null)
  const plans = ref([])
  const unpriced = ref([])
  const planError = ref('')
  const taskId = ref(null)
  let stopUpdateEvents = null
  let stopPlanEvents = null

  const missingPrices = computed(() => prices.value.records?.filter((record) => !record.valid) ?? [])

  async function initialize() {
    stopUpdateEvents?.()
    stopPlanEvents?.()
    stopUpdateEvents = electronApi.crafting.onUpdateProgress((progress) => { updateProgress.value = progress })
    stopPlanEvents = electronApi.crafting.onPlanEvent(handlePlanEvent)
    const [nextStatus, nextCategories, nextPrices] = await Promise.all([
      electronApi.crafting.getStatus(), electronApi.crafting.listCategories(), electronApi.crafting.getPrices()
    ])
    status.value = nextStatus
    categories.value = nextCategories
    prices.value = nextPrices
  }

  async function searchBases(input) {
    const result = await electronApi.crafting.searchBases(input)
    bases.value = result.items
    baseTotal.value = result.total
    return result
  }

  async function searchModifiers(input) {
    if (!input.baseId) { modifiers.value = []; modifierTotal.value = 0; return }
    const result = await electronApi.crafting.searchModifiers(input)
    modifiers.value = result.items
    modifierTotal.value = result.total
    return result
  }

  async function updateData() {
    updating.value = true
    updateError.value = ''
    updateProgress.value = { phase: 'start', completed: 0, total: 1 }
    try {
      await electronApi.crafting.updateData()
      status.value = await electronApi.crafting.getStatus()
    } catch (error) {
      updateError.value = error?.message || '更新失败'
      throw error
    } finally {
      updating.value = false
    }
  }

  async function cancelUpdate() { await electronApi.crafting.cancelUpdate() }

  async function refreshPrices(force = true) {
    prices.value = await electronApi.crafting.refreshPrices(force)
    return prices.value
  }

  async function setPriceOverride(resourceId, value) {
    await electronApi.crafting.setPriceOverride(resourceId, Number(value))
    prices.value = await electronApi.crafting.getPrices()
  }

  async function removePriceOverride(resourceId) {
    await electronApi.crafting.removePriceOverride(resourceId)
    prices.value = await electronApi.crafting.getPrices()
  }

  function handlePlanEvent(message) {
    if (!taskId.value && planning.value) taskId.value = message.taskId
    if (message.taskId !== taskId.value) return
    if (message.type === 'progress') {
      planPhase.value = message.progress?.phase || planPhase.value
      planProgress.value = message.progress || message
    } else if (message.type === 'result') {
      planPhase.value = message.result?.phase || planPhase.value
      plans.value = message.result?.plans || []
      unpriced.value = message.result?.unpriced || []
      planError.value = message.result?.valid === false ? (message.result.errors || []).map((entry) => entry.message || entry).join('；') : ''
    } else if (message.type === 'complete') {
      planning.value = false
      planPhase.value = 'complete'
    } else if (message.type === 'error') {
      planning.value = false
      planError.value = message.error || '计算失败'
      planPhase.value = 'error'
    } else if (message.type === 'cancelled') {
      planning.value = false
      planPhase.value = 'cancelled'
    }
  }

  async function startPlan(request, options = {}) {
    await cancelPlan()
    planning.value = true
    plans.value = []
    unpriced.value = []
    planError.value = ''
    planProgress.value = null
    planPhase.value = 'starting'
    const result = await electronApi.crafting.startPlan(request, options)
    taskId.value = result.taskId
  }

  async function cancelPlan() {
    if (taskId.value) await electronApi.crafting.cancelPlan(taskId.value)
    taskId.value = null
    planning.value = false
  }

  function dispose() {
    stopUpdateEvents?.()
    stopPlanEvents?.()
    cancelPlan()
  }

  return {
    status, categories, bases, baseTotal, modifiers, modifierTotal, prices, missingPrices,
    updateProgress, updateError, updating, planning, planPhase, planProgress, plans, unpriced, planError,
    initialize, searchBases, searchModifiers, updateData, cancelUpdate, refreshPrices,
    setPriceOverride, removePriceOverride, startPlan, cancelPlan, dispose
  }
})
