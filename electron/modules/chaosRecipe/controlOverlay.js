import { BrowserWindow, screen } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CHAOS_CONTROL_DIP_SIZE,
  DEFAULT_CHAOS_CONTROL_OFFSET,
  normalizeControlDipSize,
  normalizeControlOffset,
  placeControlInDip
} from './controlOverlayPosition.js'
import {
  CHAOS_GRID_LAYOUT_LABELS,
  missingCalibrationKeys
} from './layout.js'
import {
  buildVendorRecipeOptions,
  SINGLE_RECIPE_IDS,
  VENDOR_RECIPE_IDS
} from './engine.js'
import { createLoadAwarePublisher } from '../window/loadAwarePublisher.js'
import { normalizeAutomationTiming } from '../../../src/utils/operationDelay.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

const STASH_PICKUP_STOP_MESSAGES = {
  'game-not-foreground': '游戏不在前台，仓库取件已停止',
  'interface-lost': '仓库或背包界面丢失，仓库取件已停止',
  'transfer-unconfirmed': '无法确认物品已转移，已安全停止',
  'inventory-full': '背包空间不足，仓库取件已停止',
  'uncertain-cells': '存在无法确认的格子，仓库取件已停止'
}

function stashPickupStopMessage(automation = {}) {
  if (automation.reason === 'completed') return `仓库取件已完成：已取 ${automation.pickedItems || 0}`
  if (automation.reason === 'no-candidates') return '当前仓库页没有可取物品'
  if (automation.reason) return STASH_PICKUP_STOP_MESSAGES[automation.reason] || `仓库取件已停止：${automation.reason}`
  return '仓库自动取件已就绪'
}

export class ChaosRecipeControlOverlay {
  constructor({ getMainWindow, interfaceDetection, automationLock }) {
    this.getMainWindow = getMainWindow
    this.interfaceDetection = interfaceDetection
    this.automationLock = automationLock
    this.service = null
    this.stashPickup = null
    this.junfeng = null
    this.window = null
    this.statePublisher = createLoadAwarePublisher()
    this.contentSize = { ...CHAOS_CONTROL_DIP_SIZE }
    this.enabled = false
    this.runtime = {
      league: '',
      selectedTabIds: [],
      includeIdentified: false,
      activeRecipeId: 'chaos',
      selectedItemIds: [],
      selectedItemIdsByRecipe: {},
      targetSetCount: 1,
      calibration: { root: null, folder: null },
      templates: {},
      matchThreshold: 0.8,
      ...normalizeAutomationTiming(),
      controlOverlayOffset: { ...DEFAULT_CHAOS_CONTROL_OFFSET }
    }
    this.detection = interfaceDetection?.getState?.() || {}
    this.disposeDetection = interfaceDetection?.subscribe((state) => {
      this.detection = state
      this.sync()
    })
    this.disposeAutomationLock = automationLock?.subscribe(() => this.sync())
  }

  attachService(service) {
    this.service = service
    this.sync()
  }

  attachStashPickup(manager) {
    this.stashPickup = manager
    this.sync()
  }

  attachJunfeng(manager) {
    this.junfeng = manager
    this.sync()
  }

  setRuntime(runtime = {}) {
    this.enabled = Boolean(runtime.enabled)
    this.runtime = {
      ...this.runtime,
      ...structuredClone(runtime),
      selectedTabIds: Array.isArray(runtime.selectedTabIds) ? runtime.selectedTabIds.map(String) : this.runtime.selectedTabIds,
      controlOverlayOffset: normalizeControlOffset(runtime.controlOverlayOffset ?? this.runtime.controlOverlayOffset)
    }
    this.sync()
    return this.getState()
  }

  computeState() {
    const auth = this.service?.getAuthStatus?.() || {}
    const snapshot = this.service?.snapshot
    const automation = this.service?.automation?.getStatus?.() || { status: 'idle' }
    const selected = this.runtime.selectedTabIds.length > 0
    const canRefresh = Boolean(auth.authenticated && this.runtime.league && selected)
    const missingCalibrations = missingCalibrationKeys(snapshot?.tabs, this.runtime.calibration)
    const calibrated = missingCalibrations.length === 0
    const activeRecipeId = this.runtime.activeRecipeId || 'chaos'
    const recipe = snapshot?.recipes?.[activeRecipeId] || (activeRecipeId === 'chaos' ? snapshot : null)
    const recipeLabel = recipe?.label || '混沌石'
    const isSingle = recipe?.kind === 'single'
    const groupedSelectedIds = this.runtime.selectedItemIdsByRecipe?.[activeRecipeId]
    const selectedIds = new Set((Array.isArray(groupedSelectedIds)
      ? groupedSelectedIds
      : this.runtime.selectedItemIds || []).map(String))
    const availableCount = isSingle
      ? (recipe?.candidates || []).filter((item) => selectedIds.has(String(item.id))).length
      : Math.max(0, Number(recipe?.fullSetCount) || 0)
    const fullSetCount = isSingle ? 0 : availableCount
    const missingCalibrationMessage = missingCalibrations.length
      ? `缺少${missingCalibrations.map((key) => CHAOS_GRID_LAYOUT_LABELS[key]).join('、')}校准`
      : ''
    const lock = this.automationLock?.getState?.() || { locked: false, owner: '' }
    const occupiedByOther = lock.locked && lock.owner !== '混沌配方取件'
    const running = automation.status === 'running'
    const paused = automation.status === 'paused'
    const previewActive = this.service?.overlay?.getState?.()?.status === 'preview'
    const automationActive = running || paused
    const canStartPreview = Boolean(availableCount && calibrated)
    const canPreview = Boolean(!automationActive && !occupiedByOther && (previewActive || canStartPreview))
    let actionLabel = '取出配方'
    if (running) actionLabel = '停止取件'
    else if (paused) actionLabel = '继续取件'
    let actionReason = ''
    if (!running && !paused) {
      if (occupiedByOther) actionReason = `${lock.owner}正在运行`
      else if (!canPreview) actionReason = !snapshot
        ? '请先刷新仓库'
          : !availableCount
            ? (isSingle ? `当前没有选中的${recipeLabel}物品` : `当前没有${recipeLabel}完整套装`)
          : missingCalibrationMessage
    }
    const refreshReason = canRefresh ? '' : (!auth.authenticated ? '国服账号未认证' : '请先选择赛季和仓库页')
    const previewReason = automationActive
      ? '自动取件期间由取件流程管理高亮'
      : occupiedByOther
        ? `${lock.owner}正在运行`
        : canPreview
          ? ''
          : !snapshot
            ? '请先刷新仓库'
            : !availableCount
              ? (isSingle ? `当前没有选中的${recipeLabel}物品` : `当前${recipeLabel}套装为 0`)
              : missingCalibrationMessage
    const refreshLabel = canRefresh ? '刷新仓库' : (!auth.authenticated ? '账号未认证' : '未选择仓库')
    const previewLabel = previewActive
      ? '取消高亮'
      : canPreview
        ? '预览高亮'
        : availableCount && !calibrated
          ? '需要校准'
          : snapshot
            ? (isSingle ? '暂无物品' : '暂无套装')
            : '先刷新仓库'
    if (!running && !paused && actionReason) {
      actionLabel = availableCount && !calibrated ? '需要校准' : (snapshot ? '无法取件' : '先刷新仓库')
    }
    const inventoryFull = paused && automation.code === 'INVENTORY_FULL'
    const canSelectRecipe = Boolean(snapshot && !automationActive && !previewActive && !occupiedByOther)
    const recipeSelectionReason = automationActive
      ? '取件进行中，不能切换配方'
      : previewActive
        ? '请先取消预览高亮'
        : occupiedByOther
          ? `${lock.owner}正在运行`
          : snapshot
            ? ''
            : '请先刷新仓库'
    const recipeOptions = buildVendorRecipeOptions(snapshot, this.runtime.selectedItemIdsByRecipe)
    const statusMessage = running
      ? `正在取件：${automation.completedItems || 0}/${automation.totalItems || 0}`
      : inventoryFull
        ? '背包空间不足，请清空背包后继续'
      : paused && automation.tabName
        ? `请切换到“${automation.tabName}”后继续`
        : refreshReason || (snapshot
            ? `${recipeLabel}${isSingle ? ` ${availableCount} 件` : ` ${availableCount} 套`} · ${previewReason || actionReason || '操作已就绪'}`
            : previewReason || actionReason)
    const stashPickupEnabled = Boolean(this.stashPickup?.runtime?.enabled)
    const stashPickupAutomation = this.stashPickup?.getStatus?.() || { status: 'idle' }
    const stashPickupRunning = stashPickupAutomation.status === 'running'
    const stashPickupOccupied = lock.locked && lock.owner !== '仓库自动取件'
    const canStashPickup = Boolean(stashPickupEnabled && this.detection.foreground &&
      (stashPickupRunning || (this.detection.ready && !stashPickupOccupied)))
    const junfengReady = Boolean(this.detection.junfengReady)
    const junfengEnabled = Boolean(this.junfeng?.runtime?.enabled)
    const junfengAutomation = this.junfeng?.getStatus?.() || { status: 'idle' }
    const junfengRunning = junfengAutomation.status === 'running'
    const rewardDetected = junfengRunning || (!stashPickupRunning && !running && !paused && Boolean(this.detection.rewardDetected))
    const junfengOccupied = lock.locked && lock.owner !== '君锋镇取出高亮'
    const junfengAvailability = this.junfeng?.getAvailability?.() || { ready: false, reason: '君锋镇模块未配置' }
    const canJunfeng = Boolean(junfengEnabled && this.detection.foreground &&
      (junfengRunning || (junfengReady && junfengAvailability.ready && !junfengOccupied)))
    const normalVisible = Boolean((this.enabled || stashPickupEnabled) &&
      (this.detection.ready || stashPickupRunning || running || paused))
    const junfengVisible = Boolean(junfengEnabled && rewardDetected)
    const junfengReason = junfengRunning
      ? ''
      : junfengOccupied
      ? `${lock.owner}正在运行`
      : !junfengReady
        ? '奖励与背包界面未就绪'
        : !junfengAvailability.ready
          ? junfengAvailability.reason
        : ''
    const junfengStatus = junfengRunning
      ? `正在取出高亮：已取 ${junfengAutomation.pickedItems || 0} · 剩余 ${junfengAutomation.remainingItems || 0}`
      : junfengAutomation.reason
        ? `君锋镇取件已停止：${junfengAutomation.reason}`
        : '君锋镇高亮取件已就绪'
    return {
      visible: Boolean((rewardDetected ? junfengVisible : normalVisible) && this.detection.foreground && this.detection.gameBounds),
      enabled: this.enabled || stashPickupEnabled || junfengEnabled,
      recipeEnabled: this.enabled,
      stashPickupEnabled,
      canStashPickup,
      stashPickupReason: stashPickupRunning ? '' : stashPickupOccupied ? `${lock.owner}正在运行` : !this.detection.ready ? '仓库与背包未就绪' : '',
      stashPickupLabel: stashPickupRunning ? '停止仓库取件' : '取出物品',
      stashPickupAutomation,
      rewardDetected,
      junfengEnabled,
      junfengReady,
      junfengRunning,
      canJunfeng,
      junfengReason,
      junfengButtonLabel: junfengRunning ? '停止取件' : '取出高亮',
      junfengAutomation,
      ready: Boolean(this.detection.ready),
      foreground: Boolean(this.detection.foreground),
      refreshing: false,
      activeRecipeId,
      recipeLabel,
      recipeOptions,
      canSelectRecipe,
      recipeSelectionReason,
      isSingle,
      availableCount,
      fullSetCount,
      canRefresh,
      refreshReason,
      refreshLabel,
      canPreview,
      previewReason,
      previewLabel,
      previewActive,
      canRun: Boolean((running || paused) || (canPreview && !occupiedByOther)),
      actionLabel,
      actionReason,
      statusMessage: rewardDetected
        ? junfengStatus
        : !this.enabled
        ? (stashPickupRunning
            ? `正在取出物品：已取 ${stashPickupAutomation.pickedItems || 0} · 剩余格 ${stashPickupAutomation.remainingCells || 0}`
            : stashPickupStopMessage(stashPickupAutomation))
        : statusMessage,
      automation,
      message: inventoryFull
        ? '背包空间不足，请清空背包后继续'
        : automation.status === 'paused' && automation.tabName
          ? `请切换到“${automation.tabName}”`
        : '',
      offset: normalizeControlOffset(this.runtime.controlOverlayOffset)
    }
  }

  createWindow() {
    if (this.window && !this.window.isDestroyed()) return this.window
    this.window = new BrowserWindow({
      width: this.contentSize.width,
      height: this.contentSize.height,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      resizable: false,
      movable: false,
      show: false,
      hasShadow: false,
      webPreferences: {
        preload: path.resolve(moduleDir, '../../preload.cjs'),
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false
      }
    })
    this.window.setAlwaysOnTop(true, 'screen-saver')
    this.window.on('closed', () => { this.window = null })
    const devServerUrl = process.env.VITE_DEV_SERVER_URL
    if (process.env.NODE_ENV === 'development' && devServerUrl) {
      void this.window.loadURL(`${devServerUrl}#/chaos-recipe-control-overlay`)
    } else {
      void this.window.loadFile(path.resolve(moduleDir, '../../../dist/index.html'), {
        hash: '/chaos-recipe-control-overlay'
      })
    }
    return this.window
  }

  sync() {
    const state = this.computeState()
    if (!state.enabled) {
      this.close()
      return state
    }
    const window = this.createWindow()
    const placement = placeControlInDip(
      this.detection.gameBounds,
      this.runtime.controlOverlayOffset,
      process.platform === 'win32'
        ? {
            screenToDipPoint: (point) => screen.screenToDipPoint(point),
            dipToScreenPoint: (point) => screen.dipToScreenPoint(point)
          }
        : null,
      this.contentSize
    )
    if (placement) {
      this.runtime.controlOverlayOffset = placement.offset
      window.setBounds(placement)
    }
    this.statePublisher.publish(window.webContents, () => {
      if (!window.isDestroyed()) window.webContents.send('chaos-recipe-control-state', {
        ...state,
        offset: this.runtime.controlOverlayOffset
      })
    })
    if (state.visible && placement) window.showInactive()
    else window.hide()
    return state
  }

  getState() {
    return this.computeState()
  }

  selectRecipe(recipeId) {
    const nextRecipeId = String(recipeId || '')
    if (!VENDOR_RECIPE_IDS.includes(nextRecipeId)) throw new Error('不支持的商城配方')
    const state = this.computeState()
    if (!state.canSelectRecipe) throw new Error(state.recipeSelectionReason || '当前不能切换配方')
    this.runtime.activeRecipeId = nextRecipeId
    const selectedItemIds = SINGLE_RECIPE_IDS.includes(nextRecipeId)
      ? (this.service?.snapshot?.recipes?.[nextRecipeId]?.candidates || []).map((item) => String(item.id))
      : []
    this.runtime.selectedItemIds = [...selectedItemIds]
    this.runtime.selectedItemIdsByRecipe = {
      ...this.runtime.selectedItemIdsByRecipe,
      [nextRecipeId]: selectedItemIds
    }
    return this.sync()
  }

  resizeToContent(size) {
    const next = normalizeControlDipSize(size)
    if (next.width === this.contentSize.width && next.height === this.contentSize.height) return next
    this.contentSize = next
    this.sync()
    return next
  }

  moveToDip(x, y) {
    if (!this.window || this.window.isDestroyed() || !this.detection.gameBounds) return null
    const physical = process.platform === 'win32'
      ? screen.dipToScreenPoint({ x: Math.round(x), y: Math.round(y) })
      : { x: Math.round(x), y: Math.round(y) }
    this.runtime.controlOverlayOffset = normalizeControlOffset({
      x: physical.x - this.detection.gameBounds.left,
      y: physical.y - this.detection.gameBounds.top
    })
    this.sync()
    const mainWindow = this.getMainWindow?.()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('chaos-recipe-control-offset', this.runtime.controlOverlayOffset)
    }
    return this.runtime.controlOverlayOffset
  }

  close() {
    this.statePublisher.dispose()
    if (this.window && !this.window.isDestroyed()) this.window.close()
    this.window = null
  }

  cleanup() {
    this.disposeDetection?.()
    this.disposeAutomationLock?.()
    this.close()
  }
}
