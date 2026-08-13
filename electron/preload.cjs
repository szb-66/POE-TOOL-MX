const { contextBridge, ipcRenderer, webUtils } = require('electron')

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  reportStartupEvent: (event) => ipcRenderer.send('startup-report', event),
  executePython: (scriptPath, args) => {
    return ipcRenderer.invoke('execute-python', scriptPath, args)
  },
  saveFile: (filePath, content) => {
    return ipcRenderer.invoke('save-file', filePath, content)
  },
  readFile: (filePath) => {
    return ipcRenderer.invoke('read-file', filePath)
  },
  stopScript: () => {
    return ipcRenderer.invoke('stop-script')
  },
  getScriptStatus: () => {
    return ipcRenderer.invoke('get-script-status')
  },
  onScriptStatusChanged: (callback) => {
    const listener = (_event, status) => callback(status)
    ipcRenderer.on('script-status-changed', listener)
    return () => ipcRenderer.removeListener('script-status-changed', listener)
  },
  detectPythonPath: () => {
    return ipcRenderer.invoke('detect-python-path')
  },
  detectGameDpi: () => ipcRenderer.invoke('system-detect-game-dpi'),
  updateGameWindowTitles: (titles) => ipcRenderer.invoke('system-update-game-window-titles', titles),
  updateGameWindowProcessNames: (processNames) => ipcRenderer.invoke('system-update-game-window-process-names', processNames),
  getStartupHealth: () => ipcRenderer.invoke('system-get-startup-health'),
  getDiagnostics: (payload) => ipcRenderer.invoke('system-get-diagnostics', payload),
  exportDiagnostics: (payload) => ipcRenderer.invoke('system-export-diagnostics', payload),
  recordDiagnosticEvent: (event) => ipcRenderer.invoke('system-record-diagnostic-event', event),
  getApplicationUpdateState: () => ipcRenderer.invoke('update-get-state'),
  configureApplicationUpdate: (input) => ipcRenderer.invoke('update-configure', input),
  checkApplicationUpdate: () => ipcRenderer.invoke('update-check'),
  downloadApplicationUpdate: () => ipcRenderer.invoke('update-download'),
  restartAndInstallApplicationUpdate: () => ipcRenderer.invoke('update-restart-install'),
  onApplicationUpdateStateChanged: (callback) => {
    const listener = (_event, state) => callback(state)
    ipcRenderer.on('update-state-changed', listener)
    return () => ipcRenderer.removeListener('update-state-changed', listener)
  },
  startFileWatcher: (config) => {
    return ipcRenderer.invoke('start-file-watcher', config)
  },
  stopFileWatcher: () => {
    return ipcRenderer.invoke('stop-file-watcher')
  },
  getFilePaths: () => {
    return ipcRenderer.invoke('get-file-paths')
  },
  registerGlobalShortcut: (accelerator, callback) => {
    return ipcRenderer.invoke('register-global-shortcut', accelerator, callback)
  },
  unregisterGlobalShortcut: (accelerator) => {
    return ipcRenderer.invoke('unregister-global-shortcut', accelerator)
  },
  beginShortcutCapture: () => ipcRenderer.invoke('begin-shortcut-capture'),
  endShortcutCapture: () => ipcRenderer.invoke('end-shortcut-capture'),
  setShortcutScopeEnabled: (enabled) => {
    return ipcRenderer.invoke('shortcut-set-scope-enabled', enabled)
  },
  getShortcutScopeState: () => {
    return ipcRenderer.invoke('shortcut-get-scope-state')
  },
  onShortcutScopeChanged: (callback) => {
    const listener = (_event, state) => callback(state)
    ipcRenderer.on('shortcut-scope-changed', listener)
    return () => ipcRenderer.removeListener('shortcut-scope-changed', listener)
  },
  generateAndExecuteScript: (config) => {
    return ipcRenderer.invoke('generate-and-execute-script', config)
  },
  restartLastItemScript: () => ipcRenderer.invoke('restart-last-item-script'),
  pickStashTabRootRegion: () => ipcRenderer.invoke('stash-tabs-pick-root-region'),
  previewStashTabs: (config) => ipcRenderer.invoke('stash-tabs-preview', config),
  onShortcutTriggered: (callback) => {
    ipcRenderer.on('shortcut-triggered', (event, accelerator) => {
      callback(accelerator)
    })
  },
  initShortcutsFromSettings: (shortcuts) => {
    return ipcRenderer.invoke('init-shortcuts-from-settings', shortcuts)
  },
  onInitShortcuts: (callback) => {
    ipcRenderer.on('init-shortcuts', () => {
      callback()
    })
  },
  onPythonScriptOutput: (callback) => {
    ipcRenderer.on('python-script-output', (event, data) => {
      callback(data)
    })
  },
  onUpdateOverlay: (callback) => {
    ipcRenderer.on('update-overlay', (event, data) => {
      callback(data)
    })
  },
  onUpdateOverlaySettings: (callback) => {
    ipcRenderer.on('update-overlay-settings', (event, settings) => {
      callback(settings)
    })
  },
  onScriptStopped: (callback) => {
    ipcRenderer.on('script-stopped', (event, data) => {
      callback(data)
    })
  },
  selectOverlayBackground: () => ipcRenderer.invoke('select-overlay-background'),
  importOverlayBackground: (sourcePath) => ipcRenderer.invoke('import-overlay-background', sourcePath),
  getPathForFile: (file) => webUtils.getPathForFile(file),
  writeClipboardText: (text) => ipcRenderer.invoke('clipboard-write-text', text),
  updateOverlaySettings: (settings) => ipcRenderer.invoke('update-overlay-settings', settings),
  // 窗口控制
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  closeOverlayWindow: () => ipcRenderer.invoke('close-overlay-window'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('window-toggle-always-on-top'),
  isAlwaysOnTop: () => ipcRenderer.invoke('window-is-always-on-top'),
  setDevToolsVisible: (visible) => ipcRenderer.invoke('set-devtools-visible', visible),
  getDevToolsVisible: () => ipcRenderer.invoke('get-devtools-visible'),
  onDevToolsVisibilityChanged: (callback) => {
    const listener = (event, visible) => callback(visible)
    ipcRenderer.on('devtools-visibility-changed', listener)
    return () => ipcRenderer.removeListener('devtools-visibility-changed', listener)
  },
  pickScreenCoordinate: () => ipcRenderer.invoke('pick-screen-coordinate'),
  getScreenPickerContext: () => ipcRenderer.invoke('screen-picker-context'),
  submitScreenCoordinate: (point) => ipcRenderer.send('coordinate-picker-select', point),
  submitScreenRegion: (rectangle) => ipcRenderer.send('screen-picker-region-select', rectangle),
  cancelScreenCoordinatePicker: () => ipcRenderer.send('coordinate-picker-cancel'),
  pickPuzzleInventoryRegion: () => ipcRenderer.invoke('puzzle-pick-inventory-region'),
  pickPuzzleAtlasRegion: () => ipcRenderer.invoke('puzzle-pick-atlas-region'),
  pickPuzzleInventoryTabPoint: (page) => ipcRenderer.invoke('puzzle-pick-inventory-tab-point', page),
  clearPuzzleRegion: (type) => ipcRenderer.invoke('puzzle-clear-region', type),
  getPuzzleConfiguration: (request) => ipcRenderer.invoke('puzzle-configuration', request),
  analyzePuzzle: (request) => ipcRenderer.invoke('puzzle-analyze', request),
  probePuzzleBorderMods: (request) => ipcRenderer.invoke('puzzle-probe-border-mods', request),
  startPuzzleAutoPlacement: (request) => ipcRenderer.invoke('puzzle-auto-placement-start', request),
  stopPuzzleAutoPlacement: (reason) => ipcRenderer.invoke('puzzle-auto-placement-stop', reason),
  getPuzzleAutoPlacementStatus: () => ipcRenderer.invoke('puzzle-auto-placement-status'),
  completePuzzleChart: () => ipcRenderer.invoke('puzzle-complete-chart'),
  onPuzzleAnalysisUpdated: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('puzzle-analysis-updated', listener)
    return () => ipcRenderer.removeListener('puzzle-analysis-updated', listener)
  },
  onPuzzleAutoPlacementUpdated: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('puzzle-auto-placement-updated', listener)
    return () => ipcRenderer.removeListener('puzzle-auto-placement-updated', listener)
  },
  setIgnoreMouseEvents: (ignore, options) => ipcRenderer.send('set-ignore-mouse-events', ignore, options),
  moveCraftingOverlay: (drag) => ipcRenderer.send('crafting-overlay-move', drag),
  moveWindow: (x, y) => ipcRenderer.send('window-move', { x, y }),
  onWindowMaximized: (callback) => {
    ipcRenderer.on('window-maximized', (event, isMaximized) => {
      callback(isMaximized)
    })
  },
  // 调试覆盖层
  openDebugOverlay: () => ipcRenderer.invoke('open-debug-overlay'),
  closeDebugOverlay: () => ipcRenderer.invoke('close-debug-overlay'),
  updateDebugOverlay: (data) => ipcRenderer.invoke('update-debug-overlay', data),
  onUpdateDebugOverlay: (callback) => {
    ipcRenderer.on('update-debug-overlay', (event, data) => {
      callback(data)
    })
  },
  // 背包自动入库
  startBagDetection: (config) => ipcRenderer.invoke('start-bag-detection', config),
  stopBagDetection: () => ipcRenderer.invoke('stop-bag-detection'),
  startBagStash: () => ipcRenderer.invoke('start-bag-stash'),
  stopBagStash: () => ipcRenderer.invoke('stop-bag-stash'),
  updateBagOperationDelay: (operationDelayMs) => ipcRenderer.invoke('update-bag-operation-delay', operationDelayMs),
  updateAutomationTiming: (timing) => ipcRenderer.invoke('automation-timing-update', timing),
  updateBagEmptySlotThreshold: (emptySlotThreshold) => ipcRenderer.invoke('update-bag-empty-slot-threshold', emptySlotThreshold),
  updateBagPreferences: (preferences) => ipcRenderer.invoke('update-bag-preferences', preferences),
  updateBagRuntimeConfig: (config) => ipcRenderer.invoke('update-bag-runtime-config', config),
  uploadBagTemplate: (path, type) => ipcRenderer.invoke('upload-bag-template', path, type),
  captureBagTemplate: (type) => ipcRenderer.invoke('capture-bag-template', type),
  onBagDetectionMatch: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('bag-detection-match', listener)
    return () => ipcRenderer.removeListener('bag-detection-match', listener)
  },
  onBagStashProgress: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('bag-stash-progress', listener)
    return () => ipcRenderer.removeListener('bag-stash-progress', listener)
  },
  onBagStashCompleted: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('bag-stash-completed', listener)
    return () => ipcRenderer.removeListener('bag-stash-completed', listener)
  },
  onBagStashStopped: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('bag-stash-stopped', listener)
    return () => ipcRenderer.removeListener('bag-stash-stopped', listener)
  },
  onBagDetectionStopped: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('bag-detection-stopped', listener)
    return () => ipcRenderer.removeListener('bag-detection-stopped', listener)
  },
  getBagStashOverlayState: () => ipcRenderer.invoke('get-bag-stash-overlay-state'),
  onBagStashOverlayState: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('bag-stash-overlay-state', listener)
    return () => ipcRenderer.removeListener('bag-stash-overlay-state', listener)
  },
  moveBagStashOverlay: (drag) => ipcRenderer.send('bag-stash-overlay-move', drag),
  updateBagInterfaceConfig: (config) => ipcRenderer.invoke('update-bag-interface-config', config),
  // 国服账号与全局赛季
  getPoeCnAccountStatus: () => ipcRenderer.invoke('poe-cn-account-status'),
  restorePoeCnAccount: () => ipcRenderer.invoke('poe-cn-account-restore'),
  openPoeCnAccountWebLogin: () => ipcRenderer.invoke('poe-cn-account-open-web'),
  completePoeCnAccountWebLogin: () => ipcRenderer.invoke('poe-cn-account-complete-web'),
  setPoeCnAccountSessionToken: (token) => ipcRenderer.invoke('poe-cn-account-token', token),
  logoutPoeCnAccount: () => ipcRenderer.invoke('poe-cn-account-logout'),
  listPoeCnAccountLeagues: () => ipcRenderer.invoke('poe-cn-account-list-leagues'),
  setPoeCnAccountLeague: (league) => ipcRenderer.invoke('poe-cn-account-set-league', league),
  onPoeCnAccountStatusChanged: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('poe-cn-account-status-changed', listener)
    return () => ipcRenderer.removeListener('poe-cn-account-status-changed', listener)
  },
  // 国服混沌配方
  listChaosRecipeTabs: (league) => ipcRenderer.invoke('chaos-recipe-list-tabs', league),
  refreshChaosRecipe: (request) => ipcRenderer.invoke('chaos-recipe-refresh', request),
  getChaosRecipeSnapshot: () => ipcRenderer.invoke('chaos-recipe-get-snapshot'),
  pickChaosRecipeGridRegion: () => ipcRenderer.invoke('chaos-recipe-pick-grid-region'),
  openChaosRecipeOverlay: (request, calibration) => ipcRenderer.invoke('chaos-recipe-open-overlay', request, calibration),
  closeChaosRecipeOverlay: () => ipcRenderer.invoke('chaos-recipe-close-overlay'),
  getChaosRecipeOverlayState: () => ipcRenderer.invoke('chaos-recipe-overlay-state'),
  startChaosRecipeAutomation: (request) => ipcRenderer.invoke('chaos-recipe-automation-start', request),
  pauseChaosRecipeAutomation: () => ipcRenderer.invoke('chaos-recipe-automation-pause'),
  resumeChaosRecipeAutomation: () => ipcRenderer.invoke('chaos-recipe-automation-resume'),
  stopChaosRecipeAutomation: () => ipcRenderer.invoke('chaos-recipe-automation-stop'),
  getChaosRecipeAutomationStatus: () => ipcRenderer.invoke('chaos-recipe-automation-status'),
  updateChaosRecipeRuntime: (runtime) => ipcRenderer.invoke('chaos-recipe-runtime-update', runtime),
  getChaosRecipeControlState: () => ipcRenderer.invoke('chaos-recipe-control-state'),
  refreshChaosRecipeFromControl: () => ipcRenderer.invoke('chaos-recipe-control-refresh'),
  selectChaosRecipeFromControl: (recipeId) => ipcRenderer.invoke('chaos-recipe-control-select-recipe', recipeId),
  previewChaosRecipeFromControl: () => ipcRenderer.invoke('chaos-recipe-control-preview'),
  runChaosRecipeControlAction: () => ipcRenderer.invoke('chaos-recipe-control-action'),
  moveChaosRecipeControl: (drag) => ipcRenderer.send('chaos-recipe-control-move', drag),
  resizeChaosRecipeControl: (size) => ipcRenderer.send('chaos-recipe-control-resize', size),
  getInterfaceDetectionState: () => ipcRenderer.invoke('interface-detection-state'),
  updateInterfaceDetectionConfig: (runtime) => ipcRenderer.invoke('interface-detection-update-config', runtime),
  onChaosRecipeAutomationEvent: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('chaos-recipe-automation-event', listener)
    return () => ipcRenderer.removeListener('chaos-recipe-automation-event', listener)
  },
  onChaosRecipeOverlayState: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('chaos-recipe-overlay-state', listener)
    return () => ipcRenderer.removeListener('chaos-recipe-overlay-state', listener)
  },
  onChaosRecipeControlState: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('chaos-recipe-control-state', listener)
    return () => ipcRenderer.removeListener('chaos-recipe-control-state', listener)
  },
  onChaosRecipeControlOffset: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('chaos-recipe-control-offset', listener)
    return () => ipcRenderer.removeListener('chaos-recipe-control-offset', listener)
  },
  onChaosRecipeSnapshotUpdated: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('chaos-recipe-snapshot-updated', listener)
    return () => ipcRenderer.removeListener('chaos-recipe-snapshot-updated', listener)
  },
  onChaosRecipeControlRecipeSelected: (callback) => {
    const listener = (_event, recipeId) => callback(recipeId)
    ipcRenderer.on('chaos-recipe-control-recipe-selected', listener)
    return () => ipcRenderer.removeListener('chaos-recipe-control-recipe-selected', listener)
  },
  updateStashPickupRuntime: (runtime) => ipcRenderer.invoke('stash-pickup-runtime-update', runtime),
  previewStashPickup: () => ipcRenderer.invoke('stash-pickup-preview'),
  startStashPickup: () => ipcRenderer.invoke('stash-pickup-start'),
  stopStashPickup: () => ipcRenderer.invoke('stash-pickup-stop'),
  getStashPickupStatus: () => ipcRenderer.invoke('stash-pickup-status'),
  pickStashPickupGridRegion: () => ipcRenderer.invoke('stash-pickup-pick-grid-region'),
  onStashPickupEvent: (callback) => {
    const listener = (_event, message) => callback(message)
    ipcRenderer.on('stash-pickup-event', listener)
    return () => ipcRenderer.removeListener('stash-pickup-event', listener)
  },
  updateJunfengRuntime: (runtime) => ipcRenderer.invoke('junfeng-runtime-update', runtime),
  previewJunfeng: () => ipcRenderer.invoke('junfeng-preview'),
  startJunfeng: () => ipcRenderer.invoke('junfeng-start'),
  stopJunfeng: () => ipcRenderer.invoke('junfeng-stop'),
  getJunfengStatus: () => ipcRenderer.invoke('junfeng-status'),
  pickJunfengGridRegion: () => ipcRenderer.invoke('junfeng-pick-grid-region'),
  listJunfengCorrections: () => ipcRenderer.invoke('junfeng-corrections'),
  addJunfengCorrection: (value) => ipcRenderer.invoke('junfeng-add-correction', value),
  removeJunfengCorrection: (id) => ipcRenderer.invoke('junfeng-remove-correction', id),
  resetJunfengCorrections: () => ipcRenderer.invoke('junfeng-reset-corrections'),
  rebuildJunfengCorrections: () => ipcRenderer.invoke('junfeng-rebuild-corrections'),
  listHighlightCalibration: () => ipcRenderer.invoke('highlight-calibration-list'),
  saveHighlightCalibration: (value) => ipcRenderer.invoke('highlight-calibration-save', value),
  removeHighlightCalibration: (id) => ipcRenderer.invoke('highlight-calibration-remove', id),
  resetHighlightCalibration: () => ipcRenderer.invoke('highlight-calibration-reset'),
  pickJunfengTrainingRegion: () => ipcRenderer.invoke('junfeng-training-pick-region'),
  previewJunfengTraining: (value) => ipcRenderer.invoke('junfeng-training-preview', value),
  saveJunfengTrainingSession: (value) => ipcRenderer.invoke('junfeng-training-save-session', value),
  listJunfengTrainingSessions: () => ipcRenderer.invoke('junfeng-training-sessions'),
  getJunfengTrainingSession: (id) => ipcRenderer.invoke('junfeng-training-session', id),
  updateJunfengTrainingSession: (value) => ipcRenderer.invoke('junfeng-training-update-session', value),
  deleteJunfengTrainingSession: (id) => ipcRenderer.invoke('junfeng-training-delete-session', id),
  getJunfengTrainingStatus: () => ipcRenderer.invoke('junfeng-training-status'),
  trainJunfengModel: (value) => ipcRenderer.invoke('junfeng-training-start', value),
  evaluateJunfengModel: () => ipcRenderer.invoke('junfeng-training-evaluate'),
  onJunfengEvent: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('junfeng-highlight-event', listener)
    return () => ipcRenderer.removeListener('junfeng-highlight-event', listener)
  },
  onJunfengTrainingEvent: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('junfeng-training-event', listener)
    return () => ipcRenderer.removeListener('junfeng-training-event', listener)
  },
  // 国服官方挂单查价
  getPriceCheckStatus: () => ipcRenderer.invoke('price-check-status'),
  updatePriceCheckRuntime: (runtime) => ipcRenderer.invoke('price-check-runtime-update', runtime),
  updatePriceCheckSettings: (patch) => ipcRenderer.invoke('price-check-settings-update', patch),
  retryPriceCheckCatalog: () => ipcRenderer.invoke('price-check-catalog-retry'),
  capturePriceCheckItem: (request) => ipcRenderer.invoke('price-check-capture', request),
  rerunPriceCheck: (request) => ipcRenderer.invoke('price-check-rerun', request),
  loadMorePriceCheck: () => ipcRenderer.invoke('price-check-load-more'),
  loadPriceCheckDistribution: () => ipcRenderer.invoke('price-check-load-distribution'),
  resolvePriceCheckIdentity: (candidateKey) => ipcRenderer.invoke('price-check-resolve-identity', candidateKey),
  resolvePriceCheckStatCandidate: (unknownKey, candidateId) => ipcRenderer.invoke('price-check-resolve-stat-candidate', unknownKey, candidateId),
  getPriceCheckOverlayState: () => ipcRenderer.invoke('price-check-overlay-state'),
  closePriceCheckOverlay: () => ipcRenderer.invoke('price-check-overlay-close'),
  openPriceCheckOfficial: () => ipcRenderer.invoke('price-check-open-official'),
  onPriceCheckOverlayState: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('price-check-overlay-state', listener)
    return () => ipcRenderer.removeListener('price-check-overlay-state', listener)
  },
  onPriceCheckSettingsChanged: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('price-check-settings-changed', listener)
    return () => ipcRenderer.removeListener('price-check-settings-changed', listener)
  },
  onPriceCheckCatalogUpdated: (callback) => {
    const listener = () => callback()
    ipcRenderer.on('price-check-catalog-updated', listener)
    return () => ipcRenderer.removeListener('price-check-catalog-updated', listener)
  },
  // 战斗辅助
  startPotionAssist: (payload) => ipcRenderer.invoke('combat-start-potion', payload),
  stopPotionAssist: () => ipcRenderer.invoke('combat-stop-potion'),
  getPotionAssistStatus: () => ipcRenderer.invoke('combat-get-potion-status'),
  updatePotionAssistConfig: (config) => ipcRenderer.invoke('combat-update-potion-config', config),
  startLoopAssist: (payload) => ipcRenderer.invoke('combat-start-loop', payload),
  stopLoopAssist: () => ipcRenderer.invoke('combat-stop-loop'),
  getLoopAssistStatus: () => ipcRenderer.invoke('combat-get-loop-status'),
  updateLoopAssistConfig: (config) => ipcRenderer.invoke('combat-update-loop-config', config),
  sampleCombatPixel: (payload) => ipcRenderer.invoke('combat-sample-pixel', payload),
  executePortalAssist: (payload) => ipcRenderer.invoke('combat-execute-portal', payload),
  onCombatStatus: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('combat-status', listener)
    return () => ipcRenderer.removeListener('combat-status', listener)
  },
  openStoryOverlay: (snapshot, options) => ipcRenderer.invoke('open-story-overlay', snapshot, options),
  closeStoryOverlay: () => ipcRenderer.invoke('close-story-overlay'),
  updateStoryOverlay: (snapshot) => ipcRenderer.invoke('update-story-overlay', snapshot),
  getStoryOverlayState: () => ipcRenderer.invoke('get-story-overlay-state'),
  resizeStoryOverlay: (size) => ipcRenderer.invoke('resize-story-overlay', size),
  setStoryOverlayOpacity: (opacity) => ipcRenderer.invoke('set-story-overlay-opacity', opacity),
  updateStoryOverlayLayout: (layout) => ipcRenderer.invoke('update-story-overlay-layout', layout),
  moveStoryOverlay: (drag) => ipcRenderer.send('story-overlay-move', drag),
  onStoryOverlayState: (callback) => {
    const listener = (_event, snapshot) => callback(snapshot)
    ipcRenderer.on('story-overlay-state', listener)
    return () => ipcRenderer.removeListener('story-overlay-state', listener)
  },
  onStoryOverlayDividerRatio: (callback) => {
    const listener = (_event, ratio) => callback(ratio)
    ipcRenderer.on('story-overlay-divider-ratio', listener)
    return () => ipcRenderer.removeListener('story-overlay-divider-ratio', listener)
  },
  // POE1 做装规划器
  getCraftingStatus: () => ipcRenderer.invoke('crafting-get-status'),
  listCraftingCategories: () => ipcRenderer.invoke('crafting-list-categories'),
  searchCraftingBases: (input) => ipcRenderer.invoke('crafting-search-bases', input),
  searchCraftingModifiers: (input) => ipcRenderer.invoke('crafting-search-modifiers', input),
  searchCraftingModifierCatalog: (input) => ipcRenderer.invoke('crafting-search-modifier-catalog', input),
  searchCraftingAffixSuggestions: (input) => ipcRenderer.invoke('crafting-search-affix-suggestions', input),
  searchCraftingEldritchImplicitSuggestions: (input) => ipcRenderer.invoke('crafting-search-eldritch-implicit-suggestions', input),
  createManualCraftingSession: (input) => ipcRenderer.invoke('crafting-create-manual-session', input),
  applyManualCraftingCurrency: (session, actionId) => ipcRenderer.invoke('crafting-apply-manual-currency', session, actionId),
  listManualCraftingEssences: (session) => ipcRenderer.invoke('crafting-list-manual-essences', session),
  applyManualCraftingEssence: (session, essenceId) => ipcRenderer.invoke('crafting-apply-manual-essence', session, essenceId),
  listManualCraftingBenchCrafts: (session) => ipcRenderer.invoke('crafting-list-manual-bench-crafts', session),
  applyManualCraftingBenchCraft: (session, benchCraftId) => ipcRenderer.invoke('crafting-apply-manual-bench-craft', session, benchCraftId),
  listManualCraftingFossils: (session) => ipcRenderer.invoke('crafting-list-manual-fossils', session),
  applyManualCraftingFossils: (session, input) => ipcRenderer.invoke('crafting-apply-manual-fossils', session, input),
  listManualCraftingHarvestCrafts: (session) => ipcRenderer.invoke('crafting-list-manual-harvest-crafts', session),
  applyManualCraftingHarvestCraft: (session, craftId) => ipcRenderer.invoke('crafting-apply-manual-harvest-craft', session, craftId),
  listManualCraftingEldritchCrafts: (session) => ipcRenderer.invoke('crafting-list-manual-eldritch-crafts', session),
  applyManualCraftingEldritchCraft: (session, actionId) => ipcRenderer.invoke('crafting-apply-manual-eldritch-craft', session, actionId),
  listManualCraftingInfluenceCrafts: (session) => ipcRenderer.invoke('crafting-list-manual-influence-crafts', session),
  listAwakenerDonorCandidates: (session, input) => ipcRenderer.invoke('crafting-list-awakener-donor-candidates', session, input),
  configureAwakenerDonor: (session, input) => ipcRenderer.invoke('crafting-configure-awakener-donor', session, input),
  clearAwakenerDonor: (session) => ipcRenderer.invoke('crafting-clear-awakener-donor', session),
  applyManualCraftingInfluenceCraft: (session, actionId) => ipcRenderer.invoke('crafting-apply-manual-influence-craft', session, actionId),
  listManualCraftingVeiledCrafts: (session) => ipcRenderer.invoke('crafting-list-manual-veiled-crafts', session),
  applyManualCraftingVeiledCraft: (session, actionId) => ipcRenderer.invoke('crafting-apply-manual-veiled-craft', session, actionId),
  selectManualCraftingVeiledOption: (session, modifierId, tierId) => ipcRenderer.invoke('crafting-select-manual-veiled-option', session, modifierId, tierId),
  listManualCraftingBeastcrafts: (session, input) => ipcRenderer.invoke('crafting-list-manual-beastcrafts', session, input),
  applyManualCraftingBeastcraft: (session, recipeId, input) => ipcRenderer.invoke('crafting-apply-manual-beastcraft', session, recipeId, input),
  selectManualCraftingSplitResult: (session, itemId) => ipcRenderer.invoke('crafting-select-manual-split-result', session, itemId),
  previewManualCraftingCurrency: (session, actionId) => ipcRenderer.invoke('crafting-preview-manual-currency', session, actionId),
  undoManualCraftingAction: (session) => ipcRenderer.invoke('crafting-undo-manual-action', session),
  redoManualCraftingAction: (session) => ipcRenderer.invoke('crafting-redo-manual-action', session),
  resetManualCraftingSession: (session) => ipcRenderer.invoke('crafting-reset-manual-session', session),
  updateCraftingData: () => ipcRenderer.invoke('crafting-update-data'),
  cancelCraftingUpdate: () => ipcRenderer.invoke('crafting-cancel-update'),
  getCraftingPrices: () => ipcRenderer.invoke('crafting-get-prices'),
  refreshCraftingPrices: (force) => ipcRenderer.invoke('crafting-refresh-prices', force),
  setCraftingPriceOverride: (resourceId, value) => ipcRenderer.invoke('crafting-set-price-override', resourceId, value),
  removeCraftingPriceOverride: (resourceId) => ipcRenderer.invoke('crafting-remove-price-override', resourceId),
  startCraftingPlan: (request, options) => ipcRenderer.invoke('crafting-start-plan', request, options),
  cancelCraftingPlan: (taskId) => ipcRenderer.invoke('crafting-cancel-plan', taskId),
  onCraftingUpdateProgress: (callback) => {
    const listener = (_event, progress) => callback(progress)
    ipcRenderer.on('crafting-update-progress', listener)
    return () => ipcRenderer.removeListener('crafting-update-progress', listener)
  },
  onCraftingPlanEvent: (callback) => {
    const listener = (_event, message) => callback(message)
    ipcRenderer.on('crafting-plan-event', listener)
    return () => ipcRenderer.removeListener('crafting-plan-event', listener)
  }
})
