import { readonly, ref } from 'vue'

export function createRouteTransitionController({
  showDelayMs = 80,
  minimumVisibleMs = 160,
  now = () => Date.now(),
  setTimer = (callback, delay) => setTimeout(callback, delay),
  clearTimer = (timer) => clearTimeout(timer)
} = {}) {
  const pending = ref(false)
  const visible = ref(false)
  let sequence = 0
  let visibleSince = 0
  let showTimer = null
  let hideTimer = null

  function clearShowTimer() {
    if (showTimer === null) return
    clearTimer(showTimer)
    showTimer = null
  }

  function clearHideTimer() {
    if (hideTimer === null) return
    clearTimer(hideTimer)
    hideTimer = null
  }

  function start() {
    const token = ++sequence
    pending.value = true
    clearShowTimer()
    clearHideTimer()

    if (!visible.value) {
      showTimer = setTimer(() => {
        showTimer = null
        if (token !== sequence || !pending.value) return
        visibleSince = now()
        visible.value = true
      }, showDelayMs)
    }

    return token
  }

  function finish(token) {
    if (token !== sequence) return false

    pending.value = false
    clearShowTimer()
    if (!visible.value) return true

    const remaining = Math.max(0, minimumVisibleMs - (now() - visibleSince))
    hideTimer = setTimer(() => {
      hideTimer = null
      if (token !== sequence || pending.value) return
      visible.value = false
    }, remaining)
    return true
  }

  function reset(token = sequence) {
    if (token !== sequence) return false
    clearShowTimer()
    clearHideTimer()
    pending.value = false
    visible.value = false
    return true
  }

  return {
    pending: readonly(pending),
    visible: readonly(visible),
    start,
    finish,
    reset
  }
}

export const routeTransition = createRouteTransitionController()
