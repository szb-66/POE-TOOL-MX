export function createBagOverlaySnapshot({
  moduleEnabled = false,
  normalEnabled = moduleEnabled,
  allflameReceiverEnabled = false,
  ready = false,
  stashReady = ready,
  allflameReceiverReady = false,
  foreground = false,
  stashing = false
} = {}) {
  const available = Boolean(ready && foreground)
  const visible = Boolean(moduleEnabled && (available || stashing))
  let disabledReason = ''
  if (stashing) disabledReason = '入库正在执行'
  else if (!ready) disabledReason = '等待入库目标与背包同时打开'
  else if (!foreground) disabledReason = '游戏窗口不在前台'

  return {
    visible,
    normalEnabled: Boolean(normalEnabled),
    allflameReceiverEnabled: Boolean(allflameReceiverEnabled),
    stashReady: Boolean(stashReady),
    allflameReceiverReady: Boolean(allflameReceiverReady),
    ready: Boolean(ready),
    foreground: Boolean(foreground),
    stashing: Boolean(stashing),
    disabled: Boolean(stashing || !available),
    disabledReason,
    label: stashing ? '入库中' : '自动入库'
  }
}
