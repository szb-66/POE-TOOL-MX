const COMMON = /^(?:server-mode:|window-|app-|application-update|update-|feedback:|config-transfer:|configuration-guide:|loading-feedback:|startup-|diagnostic|system-|get-system|detect-python|game-window|game-dpi|pob-launcher:|clipboard-write-text|automation-timing-update|interface-detection-(?:state|update-config)$)/
const ACCOUNT = /^(?:poe-account-|poe-cn-account-)/
const SHORTCUT_SETTINGS = /^(?:register-global-shortcut|unregister-global-shortcut|init-shortcuts-from-settings|shortcut-set-scope-enabled|shortcut-get-scope-state|begin-shortcut-capture|end-shortcut-capture)$/
const STOP = /(?:^emergency-stop-all$|^stop-|-(?:stop|close|cancel)(?:-|$)|^close-)/
const READ_ONLY_CHANNELS = new Set([
  'pob-export-list-characters', 'pob-export-build',
  'chaos-recipe-list-tabs', 'chaos-recipe-refresh', 'chaos-recipe-get-snapshot', 'chaos-recipe-automation-status',
  'price-check-status', 'price-check-text', 'price-check-catalog-retry', 'price-check-settings-update',
  'price-check-rerun', 'price-check-load-more', 'price-check-load-distribution', 'price-check-resolve-identity',
  'price-check-resolve-stat-candidate', 'price-check-open-official', 'price-check-overlay-state',
  'crafting-get-status', 'crafting-list-categories', 'crafting-search-bases', 'crafting-search-modifiers',
  'crafting-search-modifier-catalog', 'crafting-search-affix-suggestions', 'crafting-search-eldritch-implicit-suggestions',
  'get-file-paths', 'get-script-status', 'get-bag-stash-overlay-state',
  'combat-get-potion-status', 'combat-get-loop-status', 'combat-sample-pixel',
  'combat-update-potion-config', 'combat-update-loop-config',
  'stash-pickup-status', 'junfeng-status', 'junfeng-corrections', 'highlight-calibration-list',
  'junfeng-training-status', 'junfeng-training-sessions', 'junfeng-training-session',
  'client-events-status', 'client-events-select-log', 'get-story-overlay-state', 'get-story-overlay-divider-ratio',
  'pick-screen-coordinate', 'screen-picker-region', 'screen-picker-context', 'coordinate-picker-select',
  'screen-picker-region-select', 'coordinate-picker-cancel', 'capture-bag-template',
  'select-overlay-background', 'import-overlay-background', 'set-devtools-visible', 'get-devtools-visible', 'open-debug-overlay'
])

const SHORTCUT_FEATURES = Object.freeze({ itemStart: 'items', mapStart: 'map', portal: 'combat', storyPrevious: 'story', storyNext: 'story', storyTimerToggle: 'story' })
export function serverShortcutAllowed(context, key, switching = false) {
  if (key === 'end') return true
  if (switching) return false
  if (context.id === 'cn') return true
  return context.capabilities?.[SHORTCUT_FEATURES[key]]?.gameInputAvailable === true
}

function channelFeature(channel, args) {
  if (channel === 'generate-and-execute-script') return { items: 'items', map: 'map' }[args[0]?.mode]
  if (/^(?:start-bag-|bag-stash-overlay-)/.test(channel)) return 'bag'
  if (/^(?:batch-crafting-|crafting-batch-|crafting-overlay-)/.test(channel)) return 'items'
  if (/^stash-pickup-/.test(channel)) return 'stash-pickup'
  if (/^(?:junfeng-|highlight-calibration-)/.test(channel)) return 'junfeng'
  if (/^combat-/.test(channel)) return 'combat'
  if (channel.includes('story-overlay')) return 'story'
  return null
}

export function serverChannelFailure(context, channel, switching = false, args = []) {
  if (channel.startsWith('localization:')) {
    if (switching) return { code: 'SERVER_SWITCHING', message: '正在切换服务器，暂不接受汉化操作' }
    return context.id === 'international' ? null : { code: 'SERVER_FEATURE_UNAVAILABLE', message: '游戏汉化仅适用于国际服 Steam 客户端' }
  }
  if (STOP.test(channel)) return null
  if (channel === 'shortcut-triggered' && args[0] === 'end') return null
  if (['chaos-recipe-runtime-update', 'price-check-runtime-update', 'stash-pickup-runtime-update', 'junfeng-runtime-update'].includes(channel) && args[0]?.enabled === false) return null
  if (switching && !channel.startsWith('server-mode:')) return { code: 'SERVER_SWITCHING', message: '正在切换服务器，暂不接受新任务' }
  if (context.id === 'cn' || COMMON.test(channel) || ACCOUNT.test(channel) || SHORTCUT_SETTINGS.test(channel)) return null
  if (READ_ONLY_CHANNELS.has(channel)) return null
  if (channel === 'shortcut-triggered' && serverShortcutAllowed(context, args[0], switching)) return null
  const feature = channelFeature(channel, args)
  if (feature && context.capabilities?.[feature]?.gameInputAvailable === true) return null
  const active = id => context.capabilities?.[id]?.gameInputAvailable === true
  if (['arm-overlay-outside-click-close', 'disarm-overlay-outside-click-close'].includes(channel) && (active('items') || active('map'))) return null
  if (['stash-tabs-pick-root-region', 'stash-tabs-preview'].includes(channel) && ['items', 'map', 'bag', 'stash-pickup'].some(active)) return null
  return { code: 'SERVER_FEATURE_UNAVAILABLE', message: feature
    ? '此操作尚未完成英文客户端实测，请使用对应功能的开发版验收参数'
    : '此功能尚未完成国际服英文客户端验证，暂不可用' }
}

// 在注册业务 IPC 之前统一安装门禁，涵盖主页面、浮窗和直接 IPC 调用。
export function installServerIpcPolicy(ipcMain, controller) {
  const handle = ipcMain.handle.bind(ipcMain)
  ipcMain.handle = (channel, listener) => handle(channel, (event, ...args) => {
    const error = serverChannelFailure(controller.context, channel, controller.switching, args)
    return error ? { success: false, error } : listener(event, ...args)
  })
  const on = ipcMain.on.bind(ipcMain)
  ipcMain.on = (channel, listener) => on(channel, (event, ...args) => {
    if (!serverChannelFailure(controller.context, channel, controller.switching, args)) return listener(event, ...args)
  })
}
