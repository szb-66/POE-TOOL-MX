import { onBeforeUnmount, onMounted, ref, shallowRef, toValue } from 'vue'
import { electronApi } from '../api/electron.js'
import { currentServer } from './serverContext.js'

const mappingFailure = state => state?.mappingState === 'unavailable'
  ? String(state.mappingWarning || '当前汉化资源已失效，请重新扫描后再生成兼容正则') : ''

export async function loadLocalizedCatalog(texts, { api = electronApi.localization, match } = {}) {
  const unique = [...new Set((texts || []).map(String).filter(Boolean))]
  if (!api?.catalog) return { revision: '', aliases: new Map() }
  const aliases = new Map()
  let revision
  for (let offset = 0; offset < unique.length; offset += 2000) {
    const response = await api.catalog({ texts: unique.slice(offset, offset + 2000), ...(match ? { match } : {}) })
    if (!response?.success) throw new Error(response?.error?.message || response?.error || '读取当前汉化词库失败')
    const next = response.data || {}
    const failure = mappingFailure(next)
    if (failure) throw new Error(failure)
    if (revision !== undefined && revision !== next.revision) throw new Error('读取期间汉化资源已更新，请重试')
    revision = next.revision || ''
    for (const item of next.aliases || []) {
      if (!item || typeof item.text !== 'string') continue
      aliases.set(item.text, { text: item.text, aliases: [...new Set((item.aliases || []).filter(value => typeof value === 'string' && value && value !== item.text))], displayText: item.displayText || item.text,
        ...(item.searchExpression ? { searchExpression: item.searchExpression } : {}),
        templates: (item.templates || []).filter(template => typeof template?.en === 'string').map(template => ({ en: template.en, aliases: (template.aliases || []).filter(value => typeof value === 'string' && value) })) })
    }
  }
  return { revision: revision || '', aliases }
}

export function catalogVariants(text, catalog) {
  return [...new Set([text, ...(catalog?.get(text)?.aliases || [])].filter(Boolean))]
}

export const catalogDisplayText = (text, catalog) => catalog?.get(text)?.displayText || text
export const catalogSearchText = (texts, catalog) => texts.flatMap(text => catalogVariants(text, catalog)).join(' ').toLocaleLowerCase('zh-CN')

// A resource change invalidates in-flight aliases; free-text user content is never rewritten.
export function useLocalizedCatalog(texts, options = {}) {
  const aliases = shallowRef(new Map())
  const revision = ref('')
  const loading = ref(false)
  const error = ref('')
  const api = options.api || electronApi.localization
  let sequence = 0
  let unsubscribe
  let resourceState
  let unavailable = ''
  async function reload() {
    if ((options.serverId || currentServer.id) !== 'international') return
    const request = ++sequence
    if (unavailable) {
      aliases.value = new Map()
      revision.value = ''
      loading.value = false
      error.value = unavailable
      return
    }
    loading.value = true
    error.value = ''
    aliases.value = new Map()
    try {
      const result = await loadLocalizedCatalog(toValue(texts), { ...options, api })
      if (request !== sequence) return
      aliases.value = result.aliases
      revision.value = result.revision
    } catch (reason) { if (request === sequence) { revision.value = ''; error.value = reason.message } }
    finally { if (request === sequence) loading.value = false }
  }
  onMounted(() => {
    void reload()
    unsubscribe = api?.onState?.(state => {
      const next = `${state.resourceVersion || ''}:${state.mappingState || ''}`
      const failure = mappingFailure(state)
      if (failure) {
        unavailable = failure
        resourceState = next
        void reload()
        return
      }
      unavailable = ''
      if (resourceState === next) return
      resourceState = next
      void reload()
    })
  })
  onBeforeUnmount(() => { sequence++; unsubscribe?.() })
  return { aliases, revision, loading, error, reload }
}
