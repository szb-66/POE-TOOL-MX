import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { createConfigurationCheck, createConfigurationIssue } from './configurationIssues.js'

function safeLabel(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function normalizeCheck(value, forcedIssues = []) {
  const issues = Array.isArray(value?.issues) ? value.issues : []
  return createConfigurationCheck(issues, { forcedIssues })
}

export const useConfigurationGuideStore = defineStore('configurationGuide', () => {
  const visible = ref(false)
  const busy = ref(false)
  const error = ref('')
  const request = ref(null)
  const issues = shallowRef([])
  const issueHistory = shallowRef([])
  const focusedIssueId = ref('')
  const resolvedForcedIds = new Set()
  let pending = null

  const issueIds = computed(() => new Set(issues.value.map(item => item.id)))
  const displayIssues = computed(() => issueHistory.value.map(item => ({
    ...item,
    completed: !issueIds.value.has(item.id)
  })))
  const totalCount = computed(() => issueHistory.value.length)
  const remainingCount = computed(() => issues.value.filter(item => item.blocking).length)
  const completedCount = computed(() => Math.max(0, totalCount.value - remainingCount.value))
  const canContinue = computed(() => visible.value && !busy.value && remainingCount.value === 0)
  const continueLabel = computed(() => request.value?.returnToSource
    ? '配置完成，返回浮窗'
    : `配置完成并${request.value?.actionLabel || '继续'}`)

  function remember(nextIssues) {
    const byId = new Map(issueHistory.value.map(item => [item.id, item]))
    for (const item of nextIssues) byId.set(item.id, item)
    issueHistory.value = [...byId.values()]
  }

  function forcedIssues() {
    return (pending?.forcedIssues || []).filter(item => !resolvedForcedIds.has(item.id))
  }

  function collectLatest() {
    if (!pending?.collect) return createConfigurationCheck([], { forcedIssues: forcedIssues() })
    return normalizeCheck(pending.collect(), forcedIssues())
  }

  function applyCheck(check) {
    issues.value = [...check.issues]
    remember(check.issues)
    if (!focusedIssueId.value || !issues.value.some(item => item.id === focusedIssueId.value)) {
      focusedIssueId.value = issues.value[0]?.id || ''
    }
    return check
  }

  function open(options = {}) {
    if (visible.value || busy.value) {
      return { success: false, configurationRequired: true, alreadyOpen: true, issues: [...issues.value] }
    }
    const forced = (options.forcedIssues || []).map(createConfigurationIssue)
    pending = {
      collect: typeof options.collect === 'function' ? options.collect : () => createConfigurationCheck([]),
      execute: typeof options.execute === 'function' ? options.execute : null,
      onComplete: typeof options.onComplete === 'function' ? options.onComplete : null,
      onCancel: typeof options.onCancel === 'function' ? options.onCancel : null,
      forcedIssues: forced
    }
    resolvedForcedIds.clear()
    issueHistory.value = []
    request.value = Object.freeze({
      moduleId: safeLabel(options.moduleId, 'automation'),
      actionId: safeLabel(options.actionId, 'start'),
      title: safeLabel(options.title, '完成自动化配置'),
      actionLabel: safeLabel(options.actionLabel, '继续'),
      returnToSource: Boolean(options.returnToSource),
      source: safeLabel(options.source, 'main')
    })
    focusedIssueId.value = safeLabel(options.focusIssueId, '')
    error.value = ''
    const check = applyCheck(collectLatest())
    if (check.ok && !forced.length && pending.execute) {
      const execute = pending.execute
      clear()
      return execute()
    }
    visible.value = true
    return { success: false, configurationRequired: true, issues: [...check.issues] }
  }

  function refresh() {
    if (!visible.value) return createConfigurationCheck([])
    error.value = ''
    return applyCheck(collectLatest())
  }

  function markIssueConfigured(id) {
    if (typeof id === 'string' && id) resolvedForcedIds.add(id)
    return refresh()
  }

  async function continueAction() {
    if (!visible.value || busy.value) return { success: false, ignored: true }
    const check = refresh()
    if (!check.ok) {
      error.value = `还有 ${check.issues.filter(item => item.blocking).length} 项配置未完成`
      return { success: false, configurationRequired: true, issues: [...check.issues] }
    }
    const current = pending
    if (!current) return { success: false, ignored: true }
    busy.value = true
    error.value = ''
    try {
      const result = current.execute ? await current.execute() : { success: true }
      if (result === false || result?.success === false) {
        error.value = result?.error?.message || result?.error || '使用最新配置继续失败'
        return result || { success: false }
      }
      await current.onComplete?.(result)
      resetSession()
      return result
    } catch (caught) {
      error.value = caught?.message || '使用最新配置继续失败'
      return { success: false, error: error.value }
    } finally {
      busy.value = false
    }
  }

  function resetSession() {
    visible.value = false
    error.value = ''
    request.value = null
    issues.value = []
    issueHistory.value = []
    focusedIssueId.value = ''
    resolvedForcedIds.clear()
    pending = null
  }

  function clear() {
    if (busy.value) return false
    resetSession()
    return true
  }

  async function cancel() {
    if (busy.value) return false
    const onCancel = pending?.onCancel
    resetSession()
    try {
      await onCancel?.()
    } catch {
      // 取消引导本身已经完成；恢复来源窗口失败不应重新保留待执行动作。
    }
    return true
  }

  function focusIssue(id) {
    if (issues.value.some(item => item.id === id)) focusedIssueId.value = id
  }

  return {
    visible,
    busy,
    error,
    request,
    issues,
    displayIssues,
    focusedIssueId,
    totalCount,
    completedCount,
    remainingCount,
    canContinue,
    continueLabel,
    open,
    refresh,
    markIssueConfigured,
    continueAction,
    cancel,
    clear,
    focusIssue
  }
})

export function runWithConfigurationGuide(options) {
  return useConfigurationGuideStore().open(options)
}
