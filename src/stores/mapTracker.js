import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { electronApi } from '@/api/electron.js'
import { runWithConfigurationGuide } from '@/domains/configurationGuide/configurationGuideStore.js'
import { createConfigurationCheck, createConfigurationIssue } from '@/domains/configurationGuide/configurationIssues.js'
import { useFeatureModulesStore } from './featureModules.js'

const initial = () => ({ settings: { enabled: false, paused: false, enhancements: {}, overlay: {} }, activeRun: null, foreground: false, errors: [] })
const unwrap = (result) => { if (result?.success === false) throw new Error(result.error?.message || result.error || '地图跟踪操作失败'); return result?.data ?? result }

export const useMapTrackerStore = defineStore('mapTracker', () => {
  const snapshot = ref(initial()); const history = ref({ items: [], total: 0, page: 1, pageSize: 25, errors: [] })
  const clientStatus = ref({ enabled: false, state: 'stopped', logPath: '', error: '' }); const busy = ref(false); const error = ref('')
  let unsubscribe = null
  let unsubscribeClient = null
  const activeRun = computed(() => snapshot.value.activeRun)
  const enabled = computed(() => snapshot.value.settings.enabled)
  const paused = computed(() => snapshot.value.settings.paused)

  function apply(value) { if (value) snapshot.value = value }
  async function refresh() { try { apply(unwrap(await electronApi.mapTracker.getStatus())); error.value = '' } catch (reason) { error.value = reason.message } return snapshot.value }
  async function refreshClient() { clientStatus.value = unwrap(await electronApi.clientEvents.getStatus()); return clientStatus.value }
  function listen() {
    unsubscribe?.(); unsubscribeClient?.()
    unsubscribe = electronApi.mapTracker.onSnapshot(apply)
    unsubscribeClient = electronApi.clientEvents.onSnapshot(value => { clientStatus.value = value })
    return () => { unsubscribe?.(); unsubscribeClient?.(); unsubscribe = null; unsubscribeClient = null }
  }
  async function initialize() { listen(); await Promise.all([refresh(), refreshClient()]); return snapshot.value }
  function clientCheck() {
    const ready = clientStatus.value.enabled && clientStatus.value.logPath && ['started', 'resyncing'].includes(clientStatus.value.state)
    return createConfigurationCheck(ready ? [] : [createConfigurationIssue({ id: 'map-tracker.client-log', moduleId: 'map-tracker', actionId: 'enable', kind: 'selection', title: 'Client.txt 日志监听', message: clientStatus.value.error || '请自动检测或选择 Client.txt，并启用监听', editorId: 'map-tracker.client-log' })])
  }
  async function commitSettings(patch) { busy.value = true; try { apply(unwrap(await electronApi.mapTracker.updateSettings(patch))); error.value = ''; return snapshot.value } catch (reason) { error.value = reason.message; throw reason } finally { busy.value = false } }
  async function setEnabled(value, { configurationGuideBypass = false } = {}) {
    if (value && !useFeatureModulesStore().isEnabled('map-tracker')) throw new Error('地图跟踪功能尚未添加')
    if (value && !configurationGuideBypass) {
      busy.value = true
      try {
        await refreshClient()
        if (!clientCheck().ok) {
          try { unwrap(await electronApi.clientEvents.updateSettings({ enabled: true })) } catch (reason) { error.value = reason.message }
          await refreshClient()
        }
      } finally { busy.value = false }
      const check = clientCheck()
      if (!check.ok) return runWithConfigurationGuide({ moduleId: 'map-tracker', actionId: 'enable', title: '完成地图跟踪配置', actionLabel: '启用', collect: clientCheck, execute: async () => { await refreshClient(); if (!clientCheck().ok) return { success: false, error: 'Client.txt 尚未就绪' }; return setEnabled(true, { configurationGuideBypass: true }) } })
    }
    return commitSettings({ enabled: value === true, ...(value ? { paused: false } : {}) })
  }
  const setPaused = value => commitSettings({ paused: value === true })
  async function setEnhancement(key, value) {
    return commitSettings({ enhancements: { [key]: value === true } })
  }
  async function query(filters = {}) { history.value = unwrap(await electronApi.mapTracker.query(filters)); return history.value }
  return { snapshot, history, clientStatus, busy, error, activeRun, enabled, paused, initialize, listen, refresh, refreshClient, setEnabled, setPaused, setEnhancement, commitSettings, query }
})
