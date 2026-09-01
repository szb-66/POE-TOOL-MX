import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createPinia } from 'pinia'
import { createServer } from 'vite'
import {
  CURRENCY_POSITION_KEYS,
  createDefaultInventorySettings,
  createEmptyCurrencyPositions,
  createEmptyItemPosition
} from '../src/utils/environmentDefaults.js'
import { DEFAULT_GLOBAL_SHORTCUTS } from '../src/utils/shortcutConfig.js'
import { FIXED_TIMING, OPERATION_DELAY, OPERATION_TIMING_VERSION } from '../src/utils/operationDelay.js'
import { normalizeChaosRecipeSettings } from '../src/stores/chaosRecipe.js'
import { validateCraftingConfig, validateMapRollingConfig } from '../src/utils/validation.js'
import { createDefaultMapConfig } from '../src/utils/mapPresetMigration.js'

function installStorage(settings) {
  const values = new Map()
  if (settings !== undefined) values.set('settings', JSON.stringify(settings))
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  }
  return values
}

test('设备相关默认工厂统一返回零值并保留背包业务阈值', () => {
  const currencies = createEmptyCurrencyPositions()
  assert.equal(Object.keys(currencies).length, CURRENCY_POSITION_KEYS.length)
  assert.ok(Object.values(currencies).every(point => point.x === 0 && point.y === 0))
  assert.deepEqual(createEmptyItemPosition(), { x: 0, y: 0 })
  assert.deepEqual(createDefaultInventorySettings().startPos, { x: 0, y: 0 })
  assert.deepEqual(createDefaultInventorySettings().slotSize, { w: 0, h: 0 })
  assert.equal(typeof createDefaultInventorySettings().emptySlotThreshold, 'number')
})

test('商城浮窗空偏移保持未配置，已有用户偏移原样兼容', () => {
  assert.equal(normalizeChaosRecipeSettings({}).controlOverlayOffset, null)
  assert.equal(normalizeChaosRecipeSettings({ controlOverlayOffset: null }).controlOverlayOffset, null)
  assert.deepEqual(
    normalizeChaosRecipeSettings({ controlOverlayOffset: { x: 123, y: 456 } }).controlOverlayOffset,
    { x: 123, y: 456 }
  )
})

test('制作和地图在零坐标下预检失败且运行路径先校验后调用输入进程', () => {
  const crafting = validateCraftingConfig({
    itemPosition: createEmptyItemPosition(),
    currencyPositions: createEmptyCurrencyPositions(),
    preset: null
  })
  assert.equal(crafting.isValid, false)
  assert.match(crafting.errors.join('\n'), /物品位置未配置/)

  const map = validateMapRollingConfig({
    inventory: createDefaultInventorySettings(),
    currencyPositions: createEmptyCurrencyPositions(),
    mapConfig: createDefaultMapConfig()
  })
  assert.equal(map.isValid, false)
  assert.match(map.errors.join('\n'), /背包首格坐标未配置/)
  assert.match(map.errors.join('\n'), /背包单格宽高未配置/)

  const service = readFileSync(new URL('../src/utils/scriptService.js', import.meta.url), 'utf8')
  const itemStart = service.slice(service.indexOf('export async function startCrafting'), service.indexOf('export async function startMapRolling'))
  const mapStart = service.slice(service.indexOf('export async function startMapRolling'), service.indexOf('export async function stopCrafting'))
  assert.ok(itemStart.indexOf('validateCraftingConfig') < itemStart.indexOf('generatePythonScript'))
  assert.ok(mapStart.indexOf('validateMapRollingConfig') < mapStart.indexOf('generateMapRollingScript'))
})

test('批量制作公共校验保留背包网格并解除账号赛季依赖', () => {
  const point = { x: 100, y: 200 }
  const result = validateCraftingConfig({
    itemPosition: point,
    inventory: { startPos: point, slotSize: { w: 50, h: 50 } },
    authenticated: true,
    league: 'S30',
    batchSnapshot: { scanId: 'scan-1' },
    batchCandidateCount: 3,
    currencyPositions: { wisdom: point, transmutation: point, scouring: point, alteration: point },
    stashTabSelection: { enabled: false },
    preset: {
      batchCrafting: { enabled: true, categoryIds: ['flask'] },
      moduleTwo: {
        enabled: true,
        mode: 'alteration',
        affixGroups: [{ enabled: true, selectedAffixes: ['生命'] }]
      },
      moduleThree: { enabled: false },
      moduleEldritch: { enabled: false }
    }
  })

  assert.equal(result.isValid, true, result.errors.join('\n'))
  assert.doesNotMatch(result.errors.join('\n'), /国服账号登录|国服赛季|背包网格|本地背包扫描/)

  const service = readFileSync(new URL('../src/utils/scriptService.js', import.meta.url), 'utf8')
  const validationCall = service.slice(
    service.indexOf('const validation = validateCraftingConfig({'),
    service.indexOf('if (!validation.isValid)')
  )
  assert.match(validationCall, /inventory: settingsStore\.inventory/)
  assert.match(validationCall, /batchSnapshot: batchRecovery \? \{ scanId: batchRecovery\.scanId \} : batchStore\.snapshot/)
  assert.match(validationCall, /batchCandidateCount: batchRecovery[\s\S]*batchStore\.candidates\.length/)
  assert.doesNotMatch(validationCall, /authenticated:|accountStore|league:/)
})

test('新安装、已有保存值和重置设置遵循兼容策略', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { useSettingsStore } = await server.ssrLoadModule('/src/domains/settings/settingsStore.js')

    installStorage()
    const fresh = useSettingsStore(createPinia())
    assert.deepEqual(fresh.globalShortcuts, DEFAULT_GLOBAL_SHORTCUTS)
    assert.deepEqual(fresh.itemPosition, { x: 0, y: 0 })
    assert.deepEqual(fresh.inventory.startPos, { x: 0, y: 0 })
    assert.deepEqual(fresh.inventory.slotSize, { w: 0, h: 0 })
    assert.equal(fresh.operationDelayMs, OPERATION_DELAY.default)
    assert.equal(fresh.batchScanConfirmationSuppressed, false)
    assert.deepEqual(fresh.fixedTiming, FIXED_TIMING.defaults)
    assert.equal('adaptiveTiming' in fresh, false)
    assert.equal('adaptiveTimeoutMs' in fresh, false)

    const saved = {
      globalShortcuts: { ...DEFAULT_GLOBAL_SHORTCUTS, itemStart: 'F6', priceCheck: 'F8' },
      currencyPositions: { chaos: { x: 321, y: 654 } },
      inventory: { startPos: { x: 101, y: 202 }, slotSize: { w: 33, h: 44 } },
      itemPosition: { x: 777, y: 888 },
      operationTimingVersion: 2,
      operationDelayMs: 73,
      adaptiveTiming: true,
      adaptiveTimeoutMs: 999,
      fixedTiming: { modifierSettleMs: 34, keyHoldMs: 12 },
      batchScanConfirmationSuppressed: true,
      combatAssist: {
        potion: {
          health: { point: { x: 11, y: 22 }, keys: ['1'] },
          mana: { point: { x: 33, y: 44 }, keys: ['2'] }
        },
        portal: { openKey: 'Numpad1', clickPoint: { x: 55, y: 66 } }
      }
    }
    const savedStorage = installStorage(saved)
    const existing = useSettingsStore(createPinia())
    assert.equal(existing.globalShortcuts.itemStart, 'F6')
    assert.equal(existing.globalShortcuts.priceCheck, 'F8')
    assert.deepEqual(existing.currencyPositions.chaos, { x: 321, y: 654 })
    assert.deepEqual(existing.inventory.startPos, { x: 101, y: 202 })
    assert.deepEqual(existing.inventory.slotSize, { w: 33, h: 44 })
    assert.deepEqual(existing.itemPosition, { x: 777, y: 888 })
    assert.deepEqual(existing.combatAssist.potion.health.point, { x: 11, y: 22 })
    assert.equal(existing.combatAssist.portal.openKey, 'Numpad1')
    assert.equal(existing.operationDelayMs, 73)
    assert.equal(existing.batchScanConfirmationSuppressed, true)
    existing.updateBatchScanConfirmationSuppressed(false)
    assert.equal(JSON.parse(savedStorage.get('settings')).batchScanConfirmationSuppressed, false)
    existing.updateBatchScanConfirmationSuppressed(true)
    assert.deepEqual(existing.fixedTiming, {
      ...FIXED_TIMING.defaults,
      modifierSettleMs: 34,
      keyHoldMs: 12
    })
    assert.equal('adaptiveTiming' in existing, false)
    assert.equal('adaptiveTimeoutMs' in existing, false)
    const migrated = JSON.parse(savedStorage.get('settings'))
    assert.equal(migrated.operationTimingVersion, OPERATION_TIMING_VERSION)
    assert.equal('adaptiveTiming' in migrated, false)
    assert.equal('adaptiveTimeoutMs' in migrated, false)

    existing.resetSettings()
    assert.deepEqual(existing.globalShortcuts, DEFAULT_GLOBAL_SHORTCUTS)
    assert.deepEqual(existing.itemPosition, { x: 0, y: 0 })
    assert.deepEqual(existing.inventory.startPos, { x: 0, y: 0 })
    assert.deepEqual(existing.inventory.slotSize, { w: 0, h: 0 })
    assert.deepEqual(existing.combatAssist.potion.health.keys, [])
    assert.equal(existing.combatAssist.portal.openKey, '')
    assert.equal(existing.operationDelayMs, OPERATION_DELAY.default)
    assert.equal(existing.batchScanConfirmationSuppressed, false)
    assert.deepEqual(existing.fixedTiming, FIXED_TIMING.defaults)
    assert.equal('adaptiveTiming' in existing, false)
    assert.equal('adaptiveTimeoutMs' in existing, false)
  } finally {
    await server.close()
  }
})
