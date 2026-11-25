import fs from 'node:fs'
import path from 'node:path'
import { getServer } from '../../../shared/serverMode.js'
import { generatePythonScript, generateMapRollingScript } from '../../../src/utils/pythonScriptGenerator.js'
import { normalizeBatchRecoveryCheckpoint } from '../crafting/batchRecovery.js'
import { itemFootprintRegistry } from '../items/footprintRegistry.js'

const templates = {
  items: new URL('../../../src/assets/scripts/crafting_template.py', import.meta.url),
  map: new URL('../../../src/assets/scripts/map_rolling_template.py', import.meta.url)
}
const templateCache = new Map()
const record = value => value && typeof value === 'object' && !Array.isArray(value)
const failure = message => Object.assign(new Error(message), { code: 'INVALID_SCRIPT_REQUEST' })

function readCachedTemplate(mode) {
  const url = templates[mode]
  const stat = fs.statSync(url)
  const cached = templateCache.get(mode)
  if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
    return cached.content
  }
  const content = fs.readFileSync(url, 'utf8')
  templateCache.set(mode, { mtimeMs: stat.mtimeMs, size: stat.size, content })
  return content
}

function validateAutoScanBatchConfig(batchConfig) {
  if (!record(batchConfig) || batchConfig.mode !== 'auto-scan') return null
  const categoryIds = [...new Set((Array.isArray(batchConfig.categoryIds) ? batchConfig.categoryIds : []).map(String).filter(Boolean))]
  if (!categoryIds.length) throw failure('自动扫包批量制作至少需要选择一个物品类别')
  const inventory = batchConfig.inventory
  const validGrid = [inventory?.startPos?.x, inventory?.startPos?.y, inventory?.slotSize?.w, inventory?.slotSize?.h]
    .every(value => Number.isFinite(Number(value)) && Number(value) > 0)
  if (!validGrid) throw failure('自动扫包批量制作需要完整的背包网格配置')
  return {
    enabled: true,
    mode: 'auto-scan',
    batchId: String(batchConfig.batchId || `auto-${Date.now()}`),
    categoryIds,
    inventory: {
      startPos: { x: Math.round(Number(inventory.startPos.x)), y: Math.round(Number(inventory.startPos.y)) },
      slotSize: { w: Math.round(Number(inventory.slotSize.w)), h: Math.round(Number(inventory.slotSize.h)) }
    },
    itemFootprints: itemFootprintRegistry.snapshot()
  }
}

// Complete validation and generation before the caller stops any existing task.
// Renderer script text, paths, language and communication files are never trusted.
export function prepareTrustedScriptRequest({ event, config, mainWindow, overlayWindow = null, filePaths, server = getServer(), localizationSnapshot = null }) {
  const authorized = [mainWindow, overlayWindow].some(window =>
    window && !window.isDestroyed() && window.webContents && !window.webContents.isDestroyed?.() && event?.sender === window.webContents)
  if (!authorized) {
    throw failure('仅主窗口或制作浮窗可启动制作或地图任务')
  }
  if (!record(config) || !['items', 'map'].includes(config.mode)) throw failure('无效的制作任务类型')
  if (!record(config.generationConfig) || !record(config.preset)) throw failure('缺少可信脚本生成参数，请重载助手后重试')
  if (config.mode === 'map' && !record(config.preset.map)) throw failure('缺少地图制作预设')
  if (config.mode === 'items' && config.craftingKind != null && !['general', 'essence', 'harvest'].includes(config.craftingKind)) throw failure('无效的物品制作类型')
  const selectedServer = getServer(server.id)
  const craftingKind = config.mode === 'items' ? config.craftingKind || 'general' : null
  const preset = structuredClone(config.preset)
  preset.localizationRevision = selectedServer.id === 'international' ? localizationSnapshot?.revision || '' : ''
  if (selectedServer.id === 'international' && config.mode === 'map' && (preset.map.targetKind === 'chart' || preset.map.activeKind === 'chart')) {
    throw failure('国际服本赛季不适配海图制作，已有预设保留')
  }
  const generationConfig = {
    ...structuredClone(config.generationConfig),
    filePaths: { ...filePaths }, serverId: selectedServer.id, language: selectedServer.language,
    localizationSnapshot: selectedServer.id === 'international' ? localizationSnapshot : null,
    preset, craftingKind: craftingKind || 'general',
    ...(config.mode === 'map' ? { mapConfig: preset.map } : {})
  }
  const autoScanBatch = config.mode === 'items' && generationConfig.batchConfig?.mode === 'auto-scan'
    ? validateAutoScanBatchConfig(generationConfig.batchConfig)
    : null
  if (autoScanBatch) {
    generationConfig.batchConfig = autoScanBatch
  } else {
    const hasBatch = generationConfig.batchConfig != null
    const hasCheckpoint = config.batchRecoveryContext != null
    if (hasBatch !== hasCheckpoint) throw failure('批量生成目标与恢复检查点必须同时提供')
    if (hasCheckpoint) {
      const checkpoint = normalizeBatchRecoveryCheckpoint({
        ...config.batchRecoveryContext, usageSessionId: config.usageSessionId,
        completedIds: config.batchRecoveryContext.completedIds || [],
        skippedIds: config.batchRecoveryContext.skippedIds || [],
        currentItemId: '', recoverable: false
      })
      if (config.mode !== 'items' || !checkpoint.valid || JSON.stringify(config.batchRecoveryContext) !== JSON.stringify(generationConfig.batchConfig)) {
        throw failure(checkpoint.error || '批量恢复检查点与生成目标不一致')
      }
    }
  }
  const template = readCachedTemplate(config.mode)
  const scriptContent = config.mode === 'items'
    ? generatePythonScript(generationConfig, template)
    : generateMapRollingScript(generationConfig, template)
  if (typeof scriptContent !== 'string' || !scriptContent.trim()) throw failure('制作脚本生成失败')
  return {
    mode: config.mode, craftingKind, preset, generationConfig, scriptContent,
    scriptPath: path.join(filePaths.tempDir, config.mode === 'items' ? 'crafting.py' : 'map_rolling.py'),
    requireStashTabOcr: Boolean(generationConfig.stashTabSelection?.enabled)
  }
}
