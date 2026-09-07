import { h } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import ReleaseNotesContent from '../components/common/ReleaseNotesContent.vue'
import { electronApi } from '../api/electron'
import { useSettingsStore } from '../domains/settings/settingsStore'
import { initShortcuts } from '../utils/scriptService'
import { usePoeCnAccountStore } from '../stores/poeCnAccount'
import { useApplicationUpdateStore } from '../stores/applicationUpdate'
import { useFeedbackRepliesStore } from '../stores/feedbackReplies'
import { markMainRuntimeSettled, resetMainRuntimeReadiness } from './readiness'
import { installFeatureRuntime } from '../features/installFeatureRuntime'

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
  let closeChoiceOpen = false

  addDisposer(electronApi.window.onCloseChoiceRequested(async () => {
    if (closeChoiceOpen) return
    closeChoiceOpen = true
    let rememberChoice = false
    const content = h('div', { class: 'window-close-choice' }, [
      h('p', '请选择关闭主窗口后的操作。'),
      h('p', { style: 'color: var(--el-text-color-secondary);' }, '以后可以在“设置 → 系统 → 系统设置”中修改。'),
      h('label', { style: 'display: inline-flex; align-items: center; gap: 8px; cursor: pointer;' }, [
        h('input', {
          type: 'checkbox',
          onChange: event => { rememberChoice = event.target.checked === true }
        }),
        h('span', '不再提示')
      ])
    ])

    const resolveChoice = async (behavior) => {
      if (rememberChoice) settingsStore.rememberWindowCloseChoice(behavior)
      const result = await electronApi.window.resolveCloseChoice({ behavior, remember: rememberChoice })
      if (!result?.success) throw new Error(result?.error || '关闭选择处理失败')
    }

    try {
      await ElMessageBox.confirm(content, '关闭流放助手', {
        confirmButtonText: '最小化到托盘',
        cancelButtonText: '直接退出',
        distinguishCancelAndClose: true,
        closeOnClickModal: false,
        type: 'info'
      })
      await resolveChoice('tray')
    } catch (action) {
      try {
        if (action === 'cancel') {
          await resolveChoice('exit')
        } else {
          await electronApi.window.cancelCloseChoice()
          if (action instanceof Error) ElMessage.error(action.message)
        }
      } catch (error) {
        await electronApi.window.cancelCloseChoice().catch(() => {})
        ElMessage.error(error?.message || '关闭选择处理失败')
      }
    } finally {
      closeChoiceOpen = false
    }
  }))

  const refreshGameWindowOnFocus = () => {
    if (settingsStore.dpiMode === 'auto') void settingsStore.refreshDpiScale()
  }
  window.addEventListener('focus', refreshGameWindowOnFocus)
  addDisposer(() => window.removeEventListener('focus', refreshGameWindowOnFocus))

  // 先接收生命周期事件，再查询当前状态，避免同步期间漏掉进程事件。
  const accountStore = usePoeCnAccountStore()
  addDisposer(accountStore.listenStatus())
  await settleSubsystem('account', () => accountStore.restore(), warnings)
  const featureRuntime = installFeatureRuntime({ router })
  addDisposer(() => featureRuntime.dispose())
  addDisposer(electronApi.window.onDevToolsVisibilityChanged?.((visible) => {
    settingsStore.updateDebugMode(visible)
  }))

  let updateConfigured = false
  try {
    await electronApi.update.configure({ mode: settingsStore.updateMode, source: settingsStore.updateSource })
    updateConfigured = true
  } catch (error) {
    warnings.push({ name: 'application-update-configure', error: String(error?.message || error) })
  }
  const applicationUpdateStore = useApplicationUpdateStore()
  try {
    addDisposer(await applicationUpdateStore.initialize())
    if (updateConfigured) void applicationUpdateStore.startupCheck()
    void applicationUpdateStore.showInstalledUpdate(({ targetVersion, releaseNotes }) => ElMessageBox.alert(
      h(ReleaseNotesContent, { source: releaseNotes }),
      `已更新至 v${targetVersion}`,
      {
        confirmButtonText: '我知道了',
        dangerouslyUseHTMLString: false,
        customClass: 'installed-update-dialog'
      }
    ).catch(action => {
      if (action !== 'close' && action !== 'cancel') throw action
    })).catch(() => {})
  } catch (error) {
    warnings.push({ name: 'application-update-state', error: String(error?.message || error) })
  }

  // 反馈未读回复启动检查：静默运行，失败不打扰用户（spec 要求）。
  void useFeedbackRepliesStore().startupCheck({
    notify: items => {
      const message = items.length === 1
        ? `反馈「${items[0].title}」有新回复，点击查看`
        : `${items.length} 条反馈有新回复，点击查看`
      const notification = ElNotification({
        title: '反馈新回复',
        message,
        type: 'info',
        onClick: () => {
          notification.close()
          router.push({ path: '/settings', query: { tab: 'feedback', feedbackId: items[0].id } })
        }
      })
    }
  })

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
    (async () => {
      // 快捷键可触发后台操作，必须在持久化功能配置恢复完成后注册。
      await settleSubsystem('feature-modules', async () => { warnings.push(...await featureRuntime.initialize()) }, warnings)
      await settleSubsystem('shortcuts', () => initShortcuts(), warnings)
    })(),
    settleSubsystem('devtools', () => electronApi.window.setDevToolsVisible(settingsStore.debugMode), warnings),
    settleSubsystem('window-close', () => electronApi.window.setCloseBehavior({
      behavior: settingsStore.windowCloseBehavior,
      promptSuppressed: settingsStore.windowClosePromptSuppressed
    }), warnings)
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
