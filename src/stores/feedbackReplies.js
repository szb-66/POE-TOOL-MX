import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { electronApi } from '../api/electron.js'

const SEEN_KEY = 'feedback.seen'
const ACTIVE_KEY = 'feedback.active'

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ponytail: 存储不可用时放弃持久化，功能退化为每次启动按当前内存态运行 */ }
}

function replyCount(value) {
  const count = Number(value)
  return Number.isFinite(count) && count > 0 ? count : 0
}

export const useFeedbackRepliesStore = defineStore('feedbackReplies', () => {
  const unread = ref([])
  let startupCheckPromise = null

  const unreadCount = computed(() => unread.value.length)

  function loadSeen() {
    const value = readJson(SEEN_KEY, {})
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  }

  function loadActive() {
    const value = readJson(ACTIVE_KEY, [])
    return Array.isArray(value) ? value.map(String) : []
  }

  function persistActive(ids) { writeJson(ACTIVE_KEY, [...ids]) }

  function markSeen(feedbackId, adminReplyCount, lastMessageAuthor = '') {
    const id = String(feedbackId || '')
    if (!id) return
    const seen = loadSeen()
    seen[id] = replyCount(adminReplyCount)
    writeJson(SEEN_KEY, seen)
    unread.value = unread.value.filter(item => item.id !== id)
    // 仅当管理员最后发言（已无等待中的答复）才移出活跃集合；信息不足时保守保留。
    if (lastMessageAuthor === 'admin') {
      persistActive(loadActive().filter(activeId => activeId !== id))
    }
  }

  function reactivate(feedbackId) {
    const id = String(feedbackId || '')
    if (!id) return
    const active = loadActive()
    if (!active.includes(id)) {
      active.push(id)
      persistActive(active)
    }
  }

  function registerSubmitted(feedbackId) {
    const id = String(feedbackId || '')
    if (!id) return
    const seen = loadSeen()
    seen[id] = 0
    writeJson(SEEN_KEY, seen)
    reactivate(id)
  }

  async function runStartupCheck({ notify } = {}) {
    const active = loadActive()
    if (!active.length) return
    let result
    try {
      result = await electronApi.feedback.list()
    } catch {
      return
    }
    if (!result?.success) return
    const activeSet = new Set(active)
    const seen = loadSeen()
    const items = Array.isArray(result.items) ? result.items : []
    const found = []
    const nextActive = []
    for (const item of items) {
      const id = String(item?.id ?? '')
      if (!id || !activeSet.has(id)) continue
      const count = replyCount(item.adminReplyCount)
      const seenCount = replyCount(seen[id])
      if (count > seenCount) found.push({ id, feedbackId: item.feedbackId, title: item.title })
      // 等待答复（用户最后发言）或存在未读时保持活跃；管理员最后发言且已读则沉寂移出。
      if (item.lastMessageAuthor === 'admin' && count <= seenCount) continue
      nextActive.push(id)
    }
    persistActive(nextActive)
    unread.value = found
    if (found.length && typeof notify === 'function') notify(found)
  }

  function startupCheck({ notify } = {}) {
    if (startupCheckPromise) return startupCheckPromise
    startupCheckPromise = runStartupCheck({ notify }).catch(() => {}).finally(() => { startupCheckPromise = null })
    return startupCheckPromise
  }

  return {
    unread,
    unreadCount,
    startupCheck,
    markSeen,
    reactivate,
    registerSubmitted
  }
})
