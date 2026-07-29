import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { electronApi } from '@/api/electron'
import { usePresetStore } from '@/stores/preset'
import { useScriptStore } from '@/stores/script'
import { useBagStore } from '@/stores/bag'
import { useCombatStore } from '@/stores/combat'
import { useChaosRecipeStore } from '@/stores/chaosRecipe'
import { useStoryStore } from '@/stores/story'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import { useCraftingStore } from '@/domains/crafting/craftingStore'
import { validateCraftingConfig, validateMapRollingConfig } from '@/utils/validation'
import { buildBagRuntimeConfig, validateBagRuntimeConfig } from '@/utils/bagConfig'
import { validateCombatAssist } from '@/utils/combatConfig'
import { startCrafting, startMapRolling, stopCrafting } from '@/utils/scriptService'
import { setBagModuleEnabled, stopBagStash } from '@/utils/bagService'
import { startPotionAssist, stopPotionAssist } from '@/utils/combatService'
import {
  VENDOR_RECIPE_CATALOG,
  VENDOR_RECIPE_IDS
} from '../../../electron/modules/chaosRecipe/engine.js'
import {
  evaluateBagStatus,
  evaluateCombatStatus,
  evaluateCraftingStatus,
  evaluateItemsStatus,
  evaluateMapStatus,
  evaluateShopStatus,
  evaluateStoryStatus,
  summarizeModules
} from './dashboardStatus'

function itemModes(preset) {
  const modes = []
  if (preset?.moduleTwo?.enabled) modes.push('词缀')
  if (preset?.moduleThree?.enabled) modes.push('插槽')
  return modes
}

export function useDashboard() {
  const router = useRouter()
  const presetStore = usePresetStore()
  const scriptStore = useScriptStore()
  const settingsStore = useSettingsStore()
  const bagStore = useBagStore()
  const combatStore = useCombatStore()
  const chaosRecipeStore = useChaosRecipeStore()
  const storyStore = useStoryStore()
  const craftingStore = useCraftingStore()
  const pending = reactive({})
  const refreshing = ref(false)
  const pythonHealth = ref({ status: 'pending', text: '正在检测 Python 环境' })
  const craftingStatus = ref(null)
  const craftingStatusError = ref('')

  const itemValidation = computed(() => validateCraftingConfig({
    itemPosition: settingsStore.itemPosition,
    currencyPositions: settingsStore.currencyPositions,
    preset: presetStore.currentItemPreset
  }))
  const mapValidation = computed(() => validateMapRollingConfig({
    inventory: settingsStore.inventory,
    currencyPositions: settingsStore.currencyPositions,
    mapConfig: presetStore.currentMapPreset?.map
  }))
  const bagValidationError = computed(() => validateBagRuntimeConfig(buildBagRuntimeConfig({
    moduleEnabled: bagStore.moduleEnabled,
    immediateStash: bagStore.immediateStash,
    showStashButtonOnlyWhenReady: bagStore.showStashButtonOnlyWhenReady,
    templates: bagStore.templates,
    matchThreshold: bagStore.matchThreshold,
    blacklist: bagStore.blacklist,
    inventoryLayout: bagStore.inventoryLayout
  }, settingsStore)))
  const combatValidation = computed(() => validateCombatAssist(settingsStore.combatAssist))
  const modules = computed(() => {
    const activeRecipeId = chaosRecipeStore.settings.activeRecipeId
    const activeRecipe = chaosRecipeStore.activeRecipe
    const activeRecipeDefinition = VENDOR_RECIPE_CATALOG[activeRecipeId] || {}
    const values = [
      evaluateItemsStatus({
        validation: itemValidation.value,
        scriptRunning: scriptStore.isRunning,
        scriptMode: scriptStore.mode,
        lastError: scriptStore.lastError,
        lastMode: scriptStore.lastMode,
        presetName: presetStore.currentItemPreset?.name,
        enabledModes: itemModes(presetStore.currentItemPreset)
      }),
      evaluateBagStatus({
        configError: bagValidationError.value,
        moduleEnabled: bagStore.moduleEnabled,
        isDetecting: bagStore.isDetecting,
        isMatched: bagStore.isMatched,
        isStashing: bagStore.isStashing,
        progress: bagStore.stashProgress,
        stashedSlots: bagStore.stashStats.stashedSlots,
        lastStopReason: bagStore.lastStopReason
      }),
      evaluateMapStatus({
        validation: mapValidation.value,
        scriptRunning: scriptStore.isRunning,
        scriptMode: scriptStore.mode,
        lastError: scriptStore.lastError,
        lastMode: scriptStore.lastMode,
        presetName: presetStore.currentMapPreset?.name,
        method: presetStore.currentMapPreset?.map?.method
      }),
      evaluateCombatStatus({
        validation: combatValidation.value,
        running: combatStore.running,
        focused: combatStore.focused,
        protectedMode: combatStore.protectedMode,
        lastError: combatStore.lastError,
        healthTriggers: combatStore.healthTriggers,
        manaTriggers: combatStore.manaTriggers
      }),
      evaluateStoryStatus({
        chapters: storyStore.chapters,
        currentChapter: storyStore.currentChapter,
        currentStep: storyStore.currentStep,
        overlayVisible: storyStore.overlayVisible
      }),
      evaluateShopStatus({
        authenticated: chaosRecipeStore.auth.authenticated,
        league: chaosRecipeStore.settings.league,
        selectedTabCount: chaosRecipeStore.settings.selectedTabIds.length,
        snapshot: chaosRecipeStore.snapshot,
        enabled: chaosRecipeStore.settings.enabled,
        automationStatus: chaosRecipeStore.automation.status,
        automationEvent: chaosRecipeStore.automation.event,
        automationError: chaosRecipeStore.automation.reason,
        error: chaosRecipeStore.error?.message,
        activeRecipeLabel: activeRecipeDefinition.label,
        activeRecipeKind: activeRecipe?.kind || activeRecipeDefinition.kind,
        fullSetCount: activeRecipe?.fullSetCount,
        candidateCount: activeRecipe?.candidateCount,
        rewardTotal: activeRecipe?.rewardTotal
      }),
      evaluateCraftingStatus({
        status: craftingStatus.value,
        updateError: craftingStatusError.value || craftingStore.updateError,
        session: craftingStore.session
      })
    ]

    return values.map(module => ({
      ...module,
      pending: Boolean(pending[module.id]),
      selector: module.id === 'shop'
        ? {
            label: '自动取件配方',
            value: activeRecipeId,
            disabled: chaosRecipeStore.busy || Boolean(pending.shop),
            options: VENDOR_RECIPE_IDS.map(id => ({
              value: id,
              label: VENDOR_RECIPE_CATALOG[id].label
            })),
            run: value => chaosRecipeStore.setActiveRecipe(value)
          }
        : null,
      actions: actionsFor(module)
    }))
  })

  const summary = computed(() => summarizeModules(modules.value))
  const healthItems = computed(() => {
    const shortcut = settingsStore.shortcutHealth
    const dpiStatus = settingsStore.dpiMode === 'manual'
      ? { status: 'ready', text: `手动倍率 ${settingsStore.dpiScale}` }
      : settingsStore.dpiDetectionStatus === 'success'
        ? { status: 'ready', text: `已识别游戏窗口 · ${settingsStore.dpiScale}` }
        : settingsStore.dpiDetectionStatus === 'detecting'
          ? { status: 'pending', text: '正在识别游戏窗口 DPI' }
          : { status: 'attention', text: settingsStore.dpiDetectionError || `使用回退倍率 ${settingsStore.dpiScale}` }
    const shortcutStatus = shortcut.status === 'ready'
      ? { status: 'ready', text: '全局快捷键已注册' }
      : shortcut.status === 'error'
        ? { status: 'error', text: shortcut.error || '全局快捷键注册失败' }
        : { status: 'pending', text: '全局快捷键等待初始化' }
    return [
      { id: 'python', label: 'Python', ...pythonHealth.value },
      { id: 'shortcuts', label: '快捷键', ...shortcutStatus },
      { id: 'dpi', label: '游戏窗口 / DPI', ...dpiStatus }
    ]
  })
  const healthHasIssues = computed(() => healthItems.value.some(item => item.status !== 'ready'))

  function sharedScriptOccupied(moduleId) {
    return scriptStore.isRunning && scriptStore.mode !== moduleId
  }

  function actionsFor(module) {
    if (module.id === 'items') {
      return scriptStore.isRunning && scriptStore.mode === 'items'
        ? [{ id: 'stop', label: '停止', type: 'danger', run: stopCrafting }]
        : [{ id: 'start', label: '启动', type: 'primary', disabled: module.issues.length > 0 || sharedScriptOccupied('items'), run: startCrafting }]
    }
    if (module.id === 'map') {
      return scriptStore.isRunning && scriptStore.mode === 'map'
        ? [{ id: 'stop', label: '停止', type: 'danger', run: stopCrafting }]
        : [{ id: 'start', label: '启动', type: 'primary', disabled: module.issues.length > 0 || sharedScriptOccupied('map'), run: startMapRolling }]
    }
    if (module.id === 'bag') {
      if (bagStore.isStashing) return [{ id: 'stop-stash', label: '停止入库', type: 'danger', run: stopBagStash }]
      return [{
        id: 'toggle',
        label: bagStore.moduleEnabled ? '关闭检测' : '启用检测',
        type: bagStore.moduleEnabled ? 'danger' : 'primary',
        disabled: !bagStore.moduleEnabled && module.issues.length > 0,
        run: () => setBagModuleEnabled(!bagStore.moduleEnabled)
      }]
    }
    if (module.id === 'combat') {
      return combatStore.running
        ? [{ id: 'stop', label: '停止', type: 'danger', run: stopPotionAssist }]
        : [{ id: 'start', label: '启动', type: 'primary', disabled: module.issues.length > 0, run: startPotionAssist }]
    }
    if (module.id === 'story') {
      return storyStore.overlayVisible
        ? [{ id: 'hide', label: '隐藏浮窗', type: 'default', run: storyStore.hideOverlay }]
        : [{
            id: 'show',
            label: '显示浮窗',
            type: 'primary',
            disabled: module.issues.length > 0,
            run: () => storyStore.showOverlay(settingsStore.storyOverlayWidth)
          }]
    }
    if (module.id === 'shop') {
      return [
        {
          id: 'refresh',
          label: '刷新仓库',
          type: 'default',
          disabled: chaosRecipeStore.busy ||
            !chaosRecipeStore.auth.authenticated ||
            !chaosRecipeStore.settings.league ||
            !chaosRecipeStore.settings.selectedTabIds.length,
          run: async () => {
            await chaosRecipeStore.refresh()
            ElMessage.success('商城配方已刷新')
          }
        },
        {
          id: 'toggle',
          label: chaosRecipeStore.settings.enabled ? '关闭控制' : '开启控制',
          type: chaosRecipeStore.settings.enabled ? 'danger' : 'primary',
          disabled: chaosRecipeStore.busy,
          run: async () => {
            const enabled = !chaosRecipeStore.settings.enabled
            await chaosRecipeStore.setEnabled(enabled)
            ElMessage.success(enabled ? '商城配方游戏内控制已开启' : '商城配方游戏内控制已关闭')
          }
        }
      ]
    }
    return []
  }

  async function runAction(module, action) {
    if (action.disabled || pending[module.id]) return
    pending[module.id] = true
    try {
      await action.run()
    } catch (error) {
      ElMessage.error(error?.message || '操作失败')
    } finally {
      pending[module.id] = false
    }
  }

  async function selectModuleOption(module, value) {
    const selector = module.selector
    if (!selector || selector.disabled || pending[module.id]) return
    try {
      await selector.run(value)
    } catch (error) {
      ElMessage.error(error?.message || '切换失败')
    }
  }

  async function refresh() {
    if (refreshing.value) return
    refreshing.value = true
    craftingStatusError.value = ''
    try {
      const [scriptResult, combatResult, pythonResult, craftingResult] = await Promise.allSettled([
        electronApi.script.getStatus(),
        electronApi.combat.getPotionStatus(),
        electronApi.script.detectPythonPath(),
        electronApi.crafting.getStatus()
      ])
      if (scriptResult.status === 'fulfilled') scriptStore.applyStatus(scriptResult.value)
      else scriptStore.applyStatus({ status: 'error', error: scriptResult.reason?.message || '脚本状态读取失败' })

      if (combatResult.status === 'fulfilled') {
        const combatStatus = combatResult.value
        combatStore.applyStatus({ ...combatStatus, event: combatStatus.running ? 'running' : 'stopped' })
      } else {
        combatStore.applyStatus({ running: false, event: 'error', error: combatResult.reason?.message || '战斗辅助状态读取失败' })
      }

      if (pythonResult.status === 'fulfilled' && pythonResult.value?.found) {
        pythonHealth.value = { status: 'ready', text: `可用 · ${pythonResult.value.path}` }
      } else {
        pythonHealth.value = {
          status: 'error',
          text: pythonResult.status === 'rejected'
            ? (pythonResult.reason?.message || 'Python 环境检查失败')
            : '未找到可用的 Python 3'
        }
      }

      if (craftingResult.status === 'fulfilled') craftingStatus.value = craftingResult.value
      else craftingStatusError.value = craftingResult.reason?.message || '做装数据状态读取失败'
      if (window.electronAPI) await settingsStore.refreshDpiScale()
    } catch (error) {
      craftingStatusError.value = error?.message || '状态刷新失败'
    } finally {
      refreshing.value = false
    }
  }

  const openModule = module => router.push(module.route)
  const openSettings = () => router.push('/settings')

  onMounted(refresh)

  return {
    modules,
    summary,
    healthItems,
    healthHasIssues,
    refreshing,
    refresh,
    runAction,
    selectModuleOption,
    openModule,
    openSettings
  }
}
