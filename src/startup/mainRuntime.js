import { ElMessage } from 'element-plus'
import { electronApi } from '../api/electron'
import { useSettingsStore } from '../domains/settings/settingsStore'
import { initShortcuts } from '../utils/scriptService'
import { initCombatAssist } from '../utils/combatService'
import { disposeBagAutomation, initBagAutomation } from '../utils/bagService'
import { useChaosRecipeStore } from '../stores/chaosRecipe'
import { usePriceCheckStore } from '../stores/priceCheck'
import { usePoeCnAccountStore } from '../stores/poeCnAccount'
import { useStashPickupStore } from '../stores/stashPickup'
import { useJunfengStore } from '../stores/junfeng'
import { usePuzzleStore } from '../stores/puzzle'
import { markMainRuntimeSettled, resetMainRuntimeReadiness } from './readiness'

let initializationPromise = null
let activeDisposers = []

function addDisposer(candidate) {
  if (typeof candidate === 'function') activeDisposers.push(candidate)
  return candidate
}

function disposeActiveRuntime() {
  const disposers = activeDisposers.splice(0).reverse()
  for (const dispose of disposers) {
    try { dispose() } catch {}
  }
  disposeBagAutomation()
  initializationPromise = null
  resetMainRuntimeReadiness()
}

async function settleSubsystem(name, operation, warnings) {
  try {
    await operation()
  } catch (error) {
    warnings.push({ name, error: String(error?.message || error) })
  }
}

async function startMainRuntime({ router }) {
  const warnings = []
  const settingsStore = useSettingsStore()

  const refreshGameWindowOnFocus = () => {
    if (settingsStore.dpiMode === 'auto') void settingsStore.refreshDpiScale()
  }
  window.addEventListener('focus', refreshGameWindowOnFocus)
  addDisposer(() => window.removeEventListener('focus', refreshGameWindowOnFocus))

  // 先接收生命周期事件，再查询当前状态，避免同步期间漏掉进程事件。
  const accountStore = usePoeCnAccountStore()
  addDisposer(accountStore.listenStatus())
  const chaosStore = useChaosRecipeStore()
  addDisposer(chaosStore.listenAutomation())
  const stashPickupStore = useStashPickupStore()
  addDisposer(stashPickupStore.listen())
  const junfengStore = useJunfengStore()
  addDisposer(junfengStore.listen())
  const priceCheckStore = usePriceCheckStore()
  addDisposer(priceCheckStore.listenOverlay())
  addDisposer(usePuzzleStore().listen(() => { void router.push('/puzzle') }))
  addDisposer(electronApi.window.onDevToolsVisibilityChanged?.((visible) => {
    settingsStore.updateDebugMode(visible)
  }))

  void electronApi.update.configure({ mode: settingsStore.updateMode, source: settingsStore.updateSource }).catch(() => {})

  const titleSync = await settingsStore.syncGameWindowTitles()
  if (!titleSync.success) {
    warnings.push({ name: 'game-window-titles', error: titleSync.error })
    ElMessage.warning(`游戏窗口名称同步失败：${titleSync.error}`)
  }
  const processNameSync = await settingsStore.syncGameWindowProcessNames()
  if (!processNameSync.success) {
    warnings.push({ name: 'game-window-processes', error: processNameSync.error })
    ElMessage.warning(`游戏客户端进程名同步失败：${processNameSync.error}`)
  }

  await Promise.all([
    settleSubsystem('dpi', () => settingsStore.refreshDpiScale(), warnings),
    settleSubsystem('shortcuts', () => initShortcuts(), warnings),
    settleSubsystem('combat', () => initCombatAssist(), warnings),
    settleSubsystem('bag', () => initBagAutomation(), warnings),
    settleSubsystem('chaos-recipe', () => chaosStore.initializeRuntime(), warnings),
    settleSubsystem('stash-pickup', () => stashPickupStore.initializeRuntime(), warnings),
    settleSubsystem('junfeng', () => junfengStore.initializeRuntime(), warnings),
    settleSubsystem('price-check', async () => {
      try { await priceCheckStore.syncRuntime() } catch { await priceCheckStore.refreshStatus() }
    }, warnings),
    settleSubsystem('devtools', () => electronApi.window.setDevToolsVisible(settingsStore.debugMode), warnings)
  ])

  markMainRuntimeSettled(warnings)
  return { warnings, dispose: disposeActiveRuntime }
}

export function initializeMainRuntime(options) {
  if (!initializationPromise) {
    initializationPromise = startMainRuntime(options).catch((error) => {
      disposeActiveRuntime()
      markMainRuntimeSettled([{ name: 'main-runtime', error: String(error?.message || error) }])
      throw error
    })
  }
  return initializationPromise
}

export function disposeMainRuntime() {
  disposeActiveRuntime()
}
