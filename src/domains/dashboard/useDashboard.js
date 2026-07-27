import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { electronApi } from '@/api/electron'
import { usePresetStore } from '@/stores/preset'
import { useScriptStore } from '@/stores/script'
import { useBagStore } from '@/stores/bag'
import { useCombatStore } from '@/stores/combat'
import { useStoryStore } from '@/stores/story'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import { useCraftingStore } from '@/domains/crafting/craftingStore'
import { validateCraftingConfig, validateMapRollingConfig } from '@/utils/validation'
import { buildBagRuntimeConfig, validateBagRuntimeConfig } from '@/utils/bagConfig'
import { validateCombatAssist } from '@/utils/combatConfig'
import { generateVendorRegex } from '@/domains/shop/vendorRegex'
import { startCrafting, startMapRolling, stopCrafting } from '@/utils/scriptService'
import { setBagModuleEnabled, stopBagStash } from '@/utils/bagService'
import { startPotionAssist, stopPotionAssist } from '@/utils/combatService'
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
  const shopResult = computed(() => generateVendorRegex(presetStore.currentShopPreset.vendor))

  const modules = computed(() => {
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
        presetName: presetStore.currentShopPreset?.name,
        ...shopResult.value
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
      return [{
        id: 'copy',
        label: '复制正则',
        type: 'primary',
        disabled: !shopResult.value.regex,
        run: async () => {
          await electronApi.clipboard.writeText(shopResult.value.regex)
          ElMessage.success('商城正则已复制')
        }
      }]
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
    openModule,
    openSettings
  }
}
