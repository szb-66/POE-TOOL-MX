/**
 * Purpose: 无菜单栏时的刷新快捷键判定与动作分发
 * Inputs: before-input-event 的 input 对象
 * Outputs: 'reload' | 'force-reload' | null
 * Preconditions: 无（纯函数）
 * Edge cases: 按键抬起、修饰键组合重复触发时返回 null
 * Errors: 无
 */

export function getReloadAction(input) {
  if (input.type !== 'keyDown') return null
  const key = String(input.key || '').toLowerCase()
  if (key === 'f5') return 'reload'
  if ((input.control || input.meta) && key === 'r') {
    return input.shift ? 'force-reload' : 'reload'
  }
  return null
}

export function dispatchReloadAction(action, { reload, requestForceRefresh }) {
  if (action === 'force-reload') {
    void requestForceRefresh()
    return true
  }
  if (action === 'reload') {
    reload()
    return true
  }
  return false
}
