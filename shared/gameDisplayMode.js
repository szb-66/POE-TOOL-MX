export const DISPLAY_MODE_LABELS = {
  windowed: '窗口模式',
  fullscreen: '全屏（无边框）',
  borderless: '无边框窗口',
  exclusive: '独占全屏'
}

export function describeGameDisplayMode(mode) {
  if (!mode) return null
  if (mode === 'exclusive') {
    return { status: 'attention', text: '独占全屏 · 浮窗可能被游戏遮挡，建议在游戏中改为无边框全屏或窗口模式' }
  }
  if (mode === 'unknown') {
    return { status: 'attention', text: '游戏窗口已最小化，还原游戏窗口后可重新检测显示模式' }
  }
  return { status: 'ready', text: `${DISPLAY_MODE_LABELS[mode] || mode} · 浮窗可正常显示` }
}
