function startupErrorMessage(value) {
  if (value == null || value === '') return ''
  if (value instanceof Error) return value.stack || value.message
  if (value?.reason instanceof Error) return value.reason.stack || value.reason.message
  return String(value?.message || value?.reason || value)
}

export function reportStartupEvent(type, value = '') {
  try {
    window.electronAPI?.reportStartupEvent?.({
      type,
      message: startupErrorMessage(value).slice(0, 1024)
    })
  } catch {
    // 启动诊断不可反向阻断页面挂载。
  }
}
