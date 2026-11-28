import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { hasMinimumHanFragment as _m1_hasMinimumHanFragment, shortestSafeExpression as _m1_shortestSafeExpression } from '../src/domains/regex/compactExpression.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { CONFIG_BUNDLE_KIND as _m2_CONFIG_BUNDLE_KIND, CONFIG_BUNDLE_MAX_BYTES as _m2_CONFIG_BUNDLE_MAX_BYTES, CONFIG_SECTION_DEFINITIONS as _m2_CONFIG_SECTION_DEFINITIONS, ConfigTransferError as _m2_ConfigTransferError, EMPTY_PRESET_GRID as _m2_EMPTY_PRESET_GRID, allocateImportedName as _m2_allocateImportedName, createConfigBundle as _m2_createConfigBundle, createImportedPreset as _m2_createImportedPreset, createPresetTransferRecord as _m2_createPresetTransferRecord, mergeToolSites as _m2_mergeToolSites, normalizeToolSiteUrl as _m2_normalizeToolSiteUrl, parseConfigBundle as _m2_parseConfigBundle, sanitizeTransferValue as _m2_sanitizeTransferValue, serializeConfigBundle as _m2_serializeConfigBundle, utf8ByteLength as _m2_utf8ByteLength } from '../src/domains/settings/configTransfer/core.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { mkdtemp as _m3_mkdtemp, mkdir as _m3_mkdir, readFile as _m3_readFile, readdir as _m3_readdir, rm as _m3_rm, writeFile as _m3_writeFile } from 'node:fs/promises'
import { tmpdir as _m3_tmpdir } from 'node:os'
import _m3_path from 'node:path'
import { fileURLToPath as _m3_fileURLToPath } from 'node:url'
import { openConfigTransferFile as _m3_openConfigTransferFile, saveConfigTransferFile as _m3_saveConfigTransferFile } from '../electron/modules/configTransfer/fileService.js'
import { CONFIG_BUNDLE_MAX_BYTES as _m3_CONFIG_BUNDLE_MAX_BYTES } from '../shared/configTransfer.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { SECTION_FIELD_WHITELISTS as _m4_SECTION_FIELD_WHITELISTS, normalizeExportSectionData as _m4_normalizeExportSectionData, normalizeSectionData as _m4_normalizeSectionData } from '../src/domains/settings/configTransfer/sections.js'
import { collectPresetIdentities as _m4_collectPresetIdentities, createPresetSectionData as _m4_createPresetSectionData, planPresetImport as _m4_planPresetImport } from '../src/domains/settings/configTransfer/presets.js'
import { ConfigTransferError as _m4_ConfigTransferError, EMPTY_PRESET_GRID as _m4_EMPTY_PRESET_GRID } from '../src/domains/settings/configTransfer/core.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { createConfigImportRunner as _m5_createConfigImportRunner, createImportPreview as _m5_createImportPreview } from '../src/domains/settings/configTransfer/transaction.js'
import { ConfigTransferError as _m5_ConfigTransferError } from '../src/domains/settings/configTransfer/core.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { readFileSync as _m6_readFileSync } from 'node:fs'
import { configurationIssueFromFailure as _m6_configurationIssueFromFailure, configurationIssuesFromFailure as _m6_configurationIssuesFromFailure } from '../src/domains/configurationGuide/configurationFailures.js'
import { sanitizeOverlayGuideRequest as _m6_sanitizeOverlayGuideRequest } from '../shared/configurationGuideRequest.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import { createPinia as _m7_createPinia, setActivePinia as _m7_setActivePinia } from 'pinia'
import { useConfigurationGuideStore as _m7_useConfigurationGuideStore } from '../src/domains/configurationGuide/configurationGuideStore.js'
import { createConfigurationCheck as _m7_createConfigurationCheck, createConfigurationIssue as _m7_createConfigurationIssue } from '../src/domains/configurationGuide/configurationIssues.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import { CONFIGURATION_ACTIONS as _m8_CONFIGURATION_ACTIONS, collectAllflameReceiverConfigurationIssues as _m8_collectAllflameReceiverConfigurationIssues, collectBagConfigurationIssues as _m8_collectBagConfigurationIssues, collectCombatConfigurationIssues as _m8_collectCombatConfigurationIssues, collectCraftingConfigurationIssues as _m8_collectCraftingConfigurationIssues, collectJunfengConfigurationIssues as _m8_collectJunfengConfigurationIssues, collectMapConfigurationIssues as _m8_collectMapConfigurationIssues, collectPriceCheckConfigurationIssues as _m8_collectPriceCheckConfigurationIssues, collectPuzzleConfigurationIssues as _m8_collectPuzzleConfigurationIssues, collectShopConfigurationIssues as _m8_collectShopConfigurationIssues, collectStashPickupConfigurationIssues as _m8_collectStashPickupConfigurationIssues, createConfigurationCheck as _m8_createConfigurationCheck, createConfigurationIssue as _m8_createConfigurationIssue, suspectedCurrencyIssue as _m8_suspectedCurrencyIssue } from '../src/domains/configurationGuide/configurationIssues.js'
import _m9_test from 'node:test'
import _m9_assert from 'node:assert/strict'
import { SHARED_PRESET_STORAGE_KEYS as _m9_SHARED_PRESET_STORAGE_KEYS, SHARED_SETTINGS_FIELDS as _m9_SHARED_SETTINGS_FIELDS, serverStorageKey as _m9_serverStorageKey } from '../shared/serverMode.js'
import { createServerStorage as _m9_createServerStorage } from '../src/utils/serverStorage.js'
import { CROSS_SERVER_MIGRATION_FLAG_KEY as _m9_CROSS_SERVER_MIGRATION_FLAG_KEY, STORY_CONTEXT_STORAGE_KEY as _m9_STORY_CONTEXT_STORAGE_KEY, migrateCrossServerPresets as _m9_migrateCrossServerPresets } from '../src/utils/crossServerPresetMigration.js'
import { MAP_BASE_STATS as _m9_MAP_BASE_STATS, INTERNATIONAL_MAP_BASE_STATS as _m9_INTERNATIONAL_MAP_BASE_STATS, cleanMigratedMapConfig as _m9_cleanMigratedMapConfig, createDefaultMapConfig as _m9_createDefaultMapConfig } from '../src/utils/mapPresetMigration.js'
import { resolveMapAffixTermForLanguage as _m9_resolveMapAffixTermForLanguage, translateMapAffixList as _m9_translateMapAffixList } from '../src/utils/crossServerMapAffix.js'
import { cleanMapRegexConfig as _m9_cleanMapRegexConfig, generateMapRegex as _m9_generateMapRegex, mapRegexCatalog as _m9_mapRegexCatalog, normalizeMapRegexAffixId as _m9_normalizeMapRegexAffixId } from '../src/domains/regex/mapRegex.js'
import { beastRegexOptions as _m9_beastRegexOptions, cleanBeastRegexConfig as _m9_cleanBeastRegexConfig, generateBeastRegex as _m9_generateBeastRegex, normalizeBeastRegexId as _m9_normalizeBeastRegexId } from '../src/domains/regex/beastRegex.js'
import { buildStorySnapshot as _m9_buildStorySnapshot, createEmptyStoryData as _m9_createEmptyStoryData, readStoryData as _m9_readStoryData, writeStoryData as _m9_writeStoryData } from '../src/utils/storyGuide.js'
import { resolveSkillForServer as _m9_resolveSkillForServer } from '../src/domains/story/skillCatalog.js'
import { matchAffixes as _m9_matchAffixes, matchEldritchImplicits as _m9_matchEldritchImplicits, matchMapRequirements as _m9_matchMapRequirements } from '../electron/modules/item/matcher.js'
import { loadCraftingCrossServerMap as _m9_loadCraftingCrossServerMap, translateAffixPattern as _m9_translateAffixPattern, translateEldritchTarget as _m9_translateEldritchTarget } from '../electron/modules/crafting/crossServerMap.js'
import { createConfigBundle as _m9_createConfigBundle } from '../src/domains/settings/configTransfer/core.js'
import { createConfigTransferService as _m9_createConfigTransferService } from '../src/domains/settings/configTransfer/service.js'
import { createDefaultItemPreset as _m9_createDefaultItemPreset } from '../src/utils/itemPreset.js'
import { createDefaultSpecializedPreset as _m9_createDefaultSpecializedPreset } from '../src/utils/specializedCraftingPreset.js'
import { createDefaultHeistConfig as _m9_createDefaultHeistConfig } from '../src/utils/mapPresetMigration.js'
import { createDefaultVendorPreset as _m9_createDefaultVendorPreset } from '../src/domains/regex/vendorConfig.js'
import { createDefaultMapRegexPreset as _m9_createDefaultMapRegexPreset } from '../src/domains/regex/mapRegex.js'
import { createDefaultBeastRegexPreset as _m9_createDefaultBeastRegexPreset } from '../src/domains/regex/beastRegex.js'
import { createDefaultCombatAssist as _m9_createDefaultCombatAssist } from '../shared/combatAssist.js'
import _m10_test from 'node:test'
import _m10_assert from 'node:assert/strict'
import { healthActionForItem as _m10_healthActionForItem } from '../src/domains/dashboard/healthActions.js'

// === Merged from combatElectronApi.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
function buildCombatPayload() {
  return {
    scriptContent: '# combat assist template',
    config: { potion: { scanIntervalMs: 100 }, loop: { items: [] }, portal: { openKey: 'Numpad1' } },
    automationTiming: {
      operationDelayMs: 50,
      adaptiveTiming: true,
      adaptiveTimeoutMs: 1000,
      fixedTiming: new Proxy({ keyHoldMs: 20, releaseSettleMs: 20 }, {})
    }
  }
}

test('战斗辅助启动 IPC 会把 Vue Proxy 载荷转换为可克隆的普通数据', async () => {
  const received = {}
  globalThis.window = {
    electronAPI: {
      startPotionAssist(payload) {
        received.potion = payload
        return Promise.resolve({ success: true, processId: 1 })
      },
      startLoopAssist(payload) {
        received.loop = payload
        return Promise.resolve({ success: true, processId: 2 })
      },
      executePortalAssist(payload) {
        received.portal = payload
        return Promise.resolve({ success: true })
      }
    }
  }

  try {
    const { electronApi } = await import(`../src/api/electron.js?combat-ipc-proxy=${Date.now()}`)
    const expected = buildCombatPayload()

    await electronApi.combat.startPotion(new Proxy({ ...expected }, {}))
    await electronApi.combat.startLoop(new Proxy({ ...expected }, {}))
    await electronApi.combat.executePortal(new Proxy({ ...expected }, {}))

    for (const entry of ['potion', 'loop', 'portal']) {
      assert.doesNotThrow(() => structuredClone(received[entry]))
      assert.deepEqual(received[entry], expected)
    }
  } finally {
    delete globalThis.window
  }
})
})()

// === Merged from compactExpression.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const hasMinimumHanFragment = _m1_hasMinimumHanFragment
  const shortestSafeExpression = _m1_shortestSafeExpression
test('安全短语优先选择原文最靠前的双字片段且禁止单字', () => {
  const expression = shortestSafeExpression({
    source: '甲乙丙丁', positives: ['甲乙丙丁'], negatives: ['丙丁其他'], fallbackExpression: '甲乙丙丁'
  })
  assert.equal(expression, '甲乙')
  assert.equal(hasMinimumHanFragment(expression), true)
  assert.equal(hasMinimumHanFragment('甲'), false)
})

test('包含关系使用安全行边界而不返回会误命中的完整子串', () => {
  const expression = shortestSafeExpression({
    source: '造成点燃', positives: ['造成点燃'], negatives: ['怪物造成点燃'], fallbackExpression: '造成点燃'
  })
  assert.equal(expression, '^造成')
})

test('多变体没有共同唯一连续片段时使用有序双片段', () => {
  const expression = shortestSafeExpression({
    source: '甲乙一丙丁',
    positives: ['甲乙一丙丁', '甲乙二丙丁'],
    negatives: ['甲乙其他', '其他丙丁'],
    fallbackExpression: '这是一个很长的完整表达式'
  })
  assert.equal(expression, '甲乙.*丙丁')
})

test('没有合法双字或双片段时回退经过验证的完整表达式', () => {
  const expression = shortestSafeExpression({
    source: '物品类别: 爪',
    positives: ['物品类别: 爪'],
    negatives: ['物品类别: 弓', '物品类别: 盾'],
    fallbackExpression: '物品类别: 爪'
  })
  assert.equal(expression, '物品类别: 爪')
})
})()

// === Merged from configTransferCore.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const CONFIG_BUNDLE_KIND = _m2_CONFIG_BUNDLE_KIND
  const CONFIG_BUNDLE_MAX_BYTES = _m2_CONFIG_BUNDLE_MAX_BYTES
  const CONFIG_SECTION_DEFINITIONS = _m2_CONFIG_SECTION_DEFINITIONS
  const ConfigTransferError = _m2_ConfigTransferError
  const EMPTY_PRESET_GRID = _m2_EMPTY_PRESET_GRID
  const allocateImportedName = _m2_allocateImportedName
  const createConfigBundle = _m2_createConfigBundle
  const createImportedPreset = _m2_createImportedPreset
  const createPresetTransferRecord = _m2_createPresetTransferRecord
  const mergeToolSites = _m2_mergeToolSites
  const normalizeToolSiteUrl = _m2_normalizeToolSiteUrl
  const parseConfigBundle = _m2_parseConfigBundle
  const sanitizeTransferValue = _m2_sanitizeTransferValue
  const serializeConfigBundle = _m2_serializeConfigBundle
  const utf8ByteLength = _m2_utf8ByteLength
const supportedIds = [
  'preset.item',
  'preset.essence',
  'preset.harvest',
  'preset.map',
  'preset.heist',
  'preset.story',
  'preset.storySkill',
  'preset.vendorRegex',
  'preset.mapRegex',
  'preset.beastRegex',
  'settings.combatAssist',
  'settings.toolSites'
]

test('configuration transfer exposes all twelve cross-server sections', () => {
  assert.deepEqual(CONFIG_SECTION_DEFINITIONS.map(section => section.id), supportedIds)
})

test('builds and parses a versioned bundle with all compatible sections selected by default', () => {
  const bundle = createConfigBundle({
    appVersion: '1.2.2',
    exportedAt: '2026-08-30T10:00:00.000Z',
    sections: {
      'preset.item': { data: { items: [{ recordKey: 'one', name: '做装', data: {} }] } },
      'settings.toolSites': { data: { sites: [] } }
    }
  })
  assert.equal(bundle.kind, CONFIG_BUNDLE_KIND)
  assert.equal(bundle.formatVersion, 2)
  assert.equal(bundle.sections['preset.item'].schemaVersion, 1)

  const parsed = parseConfigBundle(serializeConfigBundle(bundle))
  assert.deepEqual(parsed.compatibleSectionIds, ['preset.item', 'settings.toolSites'])
  assert.deepEqual(parsed.defaultSelectedSectionIds, ['preset.item', 'settings.toolSites'])
})

test('rejects empty, malformed, future and oversized bundles with stable error codes', () => {
  assert.throws(
    () => createConfigBundle({ sections: {} }),
    error => error instanceof ConfigTransferError && error.code === 'NO_SECTIONS_SELECTED'
  )
  assert.throws(() => parseConfigBundle('{'), error => error.code === 'INVALID_JSON')
  assert.throws(
    () => parseConfigBundle(JSON.stringify({ kind: CONFIG_BUNDLE_KIND, formatVersion: 3, sections: {} })),
    error => error.code === 'FUTURE_FORMAT_VERSION'
  )
  const oversized = '中'.repeat(Math.ceil(CONFIG_BUNDLE_MAX_BYTES / utf8ByteLength('中')) + 1)
  assert.throws(() => parseConfigBundle(oversized), error => error.code === 'FILE_TOO_LARGE')
})

test('old removed sections become unsupported while known future schemas stay isolated', () => {
  const parsed = parseConfigBundle(JSON.stringify({
    kind: CONFIG_BUNDLE_KIND,
    formatVersion: 1,
    appVersion: '1.2.2',
    exportedAt: '2026-08-30T10:00:00.000Z',
    sections: {
      'preset.item': { schemaVersion: 1, data: { items: [] } },
      'preset.map': { schemaVersion: 9, data: { items: [] } },
      'preset.chart': { schemaVersion: 1, data: { items: [] } },
      'settings.automation': { schemaVersion: 1, data: {} }
    }
  }))
  assert.equal(parsed.sections.find(section => section.id === 'preset.item').status, 'compatible')
  assert.equal(parsed.sections.find(section => section.id === 'preset.map').status, 'future')
  assert.equal(parsed.sections.find(section => section.id === 'preset.chart').status, 'unsupported')
  assert.equal(parsed.sections.find(section => section.id === 'settings.automation').status, 'unsupported')
  assert.deepEqual(parsed.defaultSelectedSectionIds, ['preset.item'])
})

test('removes credentials, absolute paths and unsafe object keys from exported values', () => {
  const value = sanitizeTransferValue({
    league: 'S30',
    cookie: 'private',
    sessionToken: 'private',
    backgroundPath: 'C:\\Users\\Someone\\secret.png',
    nested: { safe: true, path: '\\\\server\\share\\template.png', list: ['keep', '/home/player/private', 4] }
  })
  assert.deepEqual(value, { league: 'S30', nested: { safe: true, list: ['keep', 4] } })
})

test('strips map coordinates by default and requires explicit acceptance on import', () => {
  const source = {
    id: 'default',
    name: '地图方案',
    map: {
      method: 'chaos',
      grid: { startX: 100, startY: 200, offsetX: 52, offsetY: 52, rows: 5, cols: 12 }
    }
  }
  const shared = createPresetTransferRecord(source, { dataKey: 'map', recordKeyFactory: () => 'record-1' })
  assert.equal(shared.data.method, 'chaos')
  assert.equal('grid' in shared.data, false)
  assert.equal('deviceGrid' in shared, false)

  const withGrid = createPresetTransferRecord(source, {
    dataKey: 'map',
    includeDeviceGrid: true,
    recordKeyFactory: () => 'record-2'
  })
  const names = new Set(['地图方案', '地图方案（导入）'])
  const safeCopy = createImportedPreset(withGrid, {
    dataKey: 'map', existingNames: names, createId: () => 'new-map'
  })
  assert.deepEqual(safeCopy.map.grid, EMPTY_PRESET_GRID)
  const acceptedCopy = createImportedPreset(withGrid, {
    dataKey: 'map', existingNames: names, acceptDeviceGrid: true, createId: () => 'new-map-2'
  })
  assert.equal(acceptedCopy.map.grid.startX, 100)
})

test('allocates deterministic import suffixes for repeated imports', () => {
  const names = new Set(['方案', '方案（导入）', '方案（导入 2）'])
  assert.equal(allocateImportedName('方案', names), '方案（导入 3）')
  assert.equal(allocateImportedName('方案', names), '方案（导入 4）')
})

test('merges tool sites by safe normalized URL and keeps local conflicts', () => {
  const local = [{ id: 'local', name: '本地', url: 'https://example.com/path/', description: 'local', imageUrl: '' }]
  const result = mergeToolSites(local, [
    { name: '重复', url: 'https://example.com/path', description: 'imported' },
    { name: '新增', url: 'https://new.example.com/a/?token=secret&lang=zh#part', imageUrl: 'file:///secret.png' }
  ], () => 'new-id')
  assert.equal(result.conflicts, 1)
  assert.equal(result.added, 1)
  assert.equal(result.sites[0].name, '本地')
  assert.equal(result.sites[1].id, 'new-id')
  assert.equal(result.sites[1].url, 'https://new.example.com/a?lang=zh')
  assert.equal(result.sites[1].imageUrl, '')
  assert.equal(normalizeToolSiteUrl('javascript:alert(1)'), '')
})
})()

// === Merged from configTransferElectron.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const mkdtemp = _m3_mkdtemp
  const mkdir = _m3_mkdir
  const readFile = _m3_readFile
  const readdir = _m3_readdir
  const rm = _m3_rm
  const writeFile = _m3_writeFile
  const tmpdir = _m3_tmpdir
  const path = _m3_path
  const fileURLToPath = _m3_fileURLToPath
  const openConfigTransferFile = _m3_openConfigTransferFile
  const saveConfigTransferFile = _m3_saveConfigTransferFile
  const CONFIG_BUNDLE_MAX_BYTES = _m3_CONFIG_BUNDLE_MAX_BYTES
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function mainWindowContext() {
  const sender = {}
  const mainWindow = { isDestroyed: () => false, webContents: sender }
  return { event: { sender }, getMainWindow: () => mainWindow }
}

async function temporaryDirectory(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'poe-config-transfer-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  return directory
}

test('config transfer file open handles cancel, validates size and returns no absolute path', async (t) => {
  const directory = await temporaryDirectory(t)
  const filePath = path.join(directory, 'share.json')
  await writeFile(filePath, '{"ok":true}', 'utf8')
  const context = mainWindowContext()

  const canceled = await openConfigTransferFile({
    ...context,
    showOpenDialog: async () => ({ canceled: true, filePaths: [] })
  })
  assert.deepEqual(canceled, { success: true, canceled: true, fileName: '', content: '' })

  const opened = await openConfigTransferFile({
    ...context,
    showOpenDialog: async () => ({ canceled: false, filePaths: [filePath] })
  })
  assert.equal(opened.success, true)
  assert.equal(opened.fileName, 'share.json')
  assert.equal(opened.content, '{"ok":true}')
  assert.equal(JSON.stringify(opened).includes(directory), false)

  const oversizedPath = path.join(directory, 'oversized.json')
  await writeFile(oversizedPath, Buffer.alloc(CONFIG_BUNDLE_MAX_BYTES + 1))
  const oversized = await openConfigTransferFile({
    ...context,
    showOpenDialog: async () => ({ canceled: false, filePaths: [oversizedPath] })
  })
  assert.equal(oversized.errorCode, 'CONFIG_FILE_TOO_LARGE')
  assert.equal('content' in oversized, false)

  const invalidUtf8Path = path.join(directory, 'invalid-utf8.json')
  await writeFile(invalidUtf8Path, Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xc3, 0x28, 0x22, 0x7d]))
  const invalidUtf8 = await openConfigTransferFile({
    ...context,
    showOpenDialog: async () => ({ canceled: false, filePaths: [invalidUtf8Path] })
  })
  assert.equal(invalidUtf8.errorCode, 'CONFIG_FILE_ENCODING_INVALID')
  assert.equal('content' in invalidUtf8, false)
})

test('config transfer file access rejects non-main senders before opening a dialog', async () => {
  let dialogOpened = false
  const result = await openConfigTransferFile({
    event: { sender: {} },
    getMainWindow: () => ({ isDestroyed: () => false, webContents: {} }),
    showOpenDialog: async () => { dialogOpened = true; return { canceled: true } }
  })
  assert.equal(result.errorCode, 'CONFIG_TRANSFER_FORBIDDEN')
  assert.equal(dialogOpened, false)
})

test('config transfer save uses a temporary sibling and reports only basename', async (t) => {
  const directory = await temporaryDirectory(t)
  const target = path.join(directory, 'backup.json')
  const context = mainWindowContext()
  const result = await saveConfigTransferFile({
    ...context,
    payload: { content: '{"kind":"test"}\n', suggestedName: '..\\private.json' },
    showSaveDialog: async (_owner, options) => {
      assert.equal(options.defaultPath.includes('..'), false)
      assert.equal(options.defaultPath.includes('\\'), false)
      return { canceled: false, filePath: target }
    }
  })
  assert.deepEqual(result, { success: true, canceled: false, fileName: 'backup.json' })
  assert.equal(await readFile(target, 'utf8'), '{"kind":"test"}\n')
  assert.deepEqual((await readdir(directory)).filter(name => name.endsWith('.tmp')), [])
})

test('config transfer save cleans temporary files when atomic replacement fails', async (t) => {
  const directory = await temporaryDirectory(t)
  const targetDirectory = path.join(directory, 'target.json')
  await mkdir(targetDirectory)
  const context = mainWindowContext()
  const result = await saveConfigTransferFile({
    ...context,
    payload: { content: '{}', suggestedName: 'target.json' },
    showSaveDialog: async () => ({ canceled: false, filePath: targetDirectory })
  })
  assert.equal(result.errorCode, 'CONFIG_SAVE_FAILED')
  assert.deepEqual((await readdir(directory)).filter(name => name.endsWith('.tmp')), [])
})

test('preload, renderer facade and ipc registry expose only dedicated config transfer channels', async () => {
  const [preload, rendererApi, ipcIndex, handler] = await Promise.all([
    readFile(path.join(repositoryRoot, 'electron/preload.cjs'), 'utf8'),
    readFile(path.join(repositoryRoot, 'src/api/electron.js'), 'utf8'),
    readFile(path.join(repositoryRoot, 'electron/modules/ipc/index.js'), 'utf8'),
    readFile(path.join(repositoryRoot, 'electron/modules/ipc/configTransfer.js'), 'utf8')
  ])
  assert.match(preload, /config-transfer:open/)
  assert.match(preload, /config-transfer:save/)
  assert.match(rendererApi, /configTransfer:\s*\{/)
  assert.match(ipcIndex, /registerConfigTransferHandlers/)
  assert.match(handler, /openConfigTransferFile/)
  assert.match(handler, /saveConfigTransferFile/)
  assert.doesNotMatch(preload, /replaceCraftingPriceOverrides/)
  assert.doesNotMatch(rendererApi, /replacePriceOverrides/)
})
})()

// === Merged from configTransferSections.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const SECTION_FIELD_WHITELISTS = _m4_SECTION_FIELD_WHITELISTS
  const normalizeExportSectionData = _m4_normalizeExportSectionData
  const normalizeSectionData = _m4_normalizeSectionData
  const collectPresetIdentities = _m4_collectPresetIdentities
  const createPresetSectionData = _m4_createPresetSectionData
  const planPresetImport = _m4_planPresetImport
  const ConfigTransferError = _m4_ConfigTransferError
  const EMPTY_PRESET_GRID = _m4_EMPTY_PRESET_GRID
const supportedIds = [
  'preset.item', 'preset.essence', 'preset.harvest', 'preset.map', 'preset.heist',
  'preset.story', 'preset.storySkill',
  'preset.vendorRegex', 'preset.mapRegex', 'preset.beastRegex',
  'settings.combatAssist', 'settings.toolSites'
]

test('section normalizers expose all twelve field allowlists and reject removed ids', () => {
  assert.deepEqual(Object.keys(SECTION_FIELD_WHITELISTS), supportedIds)
  for (const sectionId of ['preset.chart', 'preset.shop', 'settings.general', 'device.shortcuts']) {
    assert.throws(
      () => normalizeSectionData(sectionId, {}),
      error => error instanceof ConfigTransferError && error.code === 'UNKNOWN_SECTION'
    )
  }
})

test('tool sites keep only safe normalized fields', () => {
  const normalized = normalizeExportSectionData('settings.toolSites', {
    sites: [{
      id: 'source-id',
      name: '编年史',
      url: 'https://example.com/path/?token=secret&lang=zh',
      description: '说明',
      imageUrl: 'file:///private/icon.png',
      cookie: 'private'
    }],
    unrelated: true
  })
  assert.deepEqual(normalized, {
    sites: [{
      name: '编年史',
      url: 'https://example.com/path?lang=zh',
      description: '说明',
      imageUrl: ''
    }]
  })
})

test('story preset import allocates new top-level and nested identities without changing source', () => {
  const source = {
    id: 'default', name: '通关路线',
    chapters: [{ id: 'chapter-old', name: '第一章', steps: [{ id: 'step-old', text: '进城' }] }],
    currentChapterId: 'chapter-old', currentStepId: 'step-old', viewedChapterId: 'chapter-old'
  }
  const data = createPresetSectionData('preset.story', [source], { recordKeyFactory: () => 'story-record' })
  const plan = planPresetImport('preset.story', data, [{ id: 'local', name: '通关路线' }])
  assert.equal(plan.imported[0].name, '通关路线（导入）')
  const importedIds = collectPresetIdentities(plan.imported[0])
  assert.equal(importedIds.includes('default'), false)
  assert.equal(importedIds.includes('chapter-old'), false)
  assert.equal(importedIds.includes('step-old'), false)
  assert.equal(new Set(importedIds).size, importedIds.length)
  assert.equal(source.chapters[0].id, 'chapter-old')
})

test('skill preset import regenerates group and skill identities', () => {
  const source = {
    id: 'default', name: '升级技能',
    chapterSkills: [{ skillGroups: [{ id: 'group-old', name: '主技能', skills: [{ id: 'skill-old', name: '火球', color: 'red' }] }] }]
  }
  const data = createPresetSectionData('preset.storySkill', [source], { recordKeyFactory: () => 'skill-record' })
  const ids = collectPresetIdentities(planPresetImport('preset.storySkill', data, []).imported[0])
  assert.equal(ids.includes('group-old'), false)
  assert.equal(ids.includes('skill-old'), false)
})

test('map coordinates require export inclusion and import acceptance independently', () => {
  const source = [{
    id: 'map-one', name: '通用地图',
    map: { method: 'alchemy', grid: { startX: 10, startY: 20, offsetX: 30, offsetY: 31, rows: 5, cols: 12 } }
  }]
  const stripped = createPresetSectionData('preset.map', source, { recordKeyFactory: () => 'map-record' })
  assert.equal(Object.hasOwn(stripped.items[0], 'deviceGrid'), false)
  assert.deepEqual(planPresetImport('preset.map', stripped, []).imported[0].map.grid, EMPTY_PRESET_GRID)

  const included = createPresetSectionData('preset.map', source, { includeDeviceGrid: true, recordKeyFactory: () => 'map-record' })
  assert.deepEqual(planPresetImport('preset.map', included, [], { acceptDeviceGrid: false }).imported[0].map.grid, EMPTY_PRESET_GRID)
  assert.equal(planPresetImport('preset.map', included, [], { acceptDeviceGrid: true }).imported[0].map.grid.startX, 10)
})

test('repeated item preset import advances suffixes and never overwrites', () => {
  const data = createPresetSectionData('preset.item', [{
    id: 'one', name: '做装', checkInitialItem: true, moduleTwo: {}, moduleThree: {}, moduleEldritch: {}
  }], { recordKeyFactory: () => 'item-record' })
  const first = planPresetImport('preset.item', data, [{ id: 'local', name: '做装' }])
  const second = planPresetImport('preset.item', data, [{ id: 'local', name: '做装' }, first.imported[0]])
  assert.equal(first.imported[0].name, '做装（导入）')
  assert.equal(second.imported[0].name, '做装（导入 2）')
  assert.notEqual(first.imported[0].id, second.imported[0].id)
})

test('精华与花园预设独立导入，精华保留目标坐标而花园只保留词缀', () => {
  const essenceData = createPresetSectionData('preset.essence', [{
    id: 'essence-one', name: '精华生命', essencePosition: { x: 120, y: 240 }, affixGroups: [{
      id: 'life', name: '生命', enabled: true, requiredAffixes: ['最大生命'], selectedAffixes: [], selectedCount: 1
    }]
  }], { recordKeyFactory: () => 'essence-record' })
  const essence = planPresetImport('preset.essence', essenceData, []).imported[0]
  assert.deepEqual(essence.essencePosition, { x: 120, y: 240 })
  assert.equal(essence.affixGroups[0].requiredAffixes[0].keyword, '最大生命')

  const harvestData = createPresetSectionData('preset.harvest', [{
    id: 'harvest-one', name: '花园生命', essencePosition: { x: 999, y: 999 }, affixGroups: [{
      id: 'life', name: '生命', enabled: true, requiredAffixes: ['最大生命'], selectedAffixes: [], selectedCount: 1
    }]
  }], { recordKeyFactory: () => 'harvest-record' })
  const harvest = planPresetImport('preset.harvest', harvestData, []).imported[0]
  assert.equal(Object.hasOwn(harvest, 'essencePosition'), false)
  assert.equal(harvest.affixGroups[0].requiredAffixes[0].keyword, '最大生命')
})
})()

// === Merged from configTransferTransaction.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const createConfigImportRunner = _m5_createConfigImportRunner
  const createImportPreview = _m5_createImportPreview
  const ConfigTransferError = _m5_ConfigTransferError
function parsedBundle(sectionIds = ['preset.item']) {
  return {
    bundle: {
      appVersion: '1.2.2', exportedAt: '2026-08-30T10:00:00.000Z', formatVersion: 1,
      sections: Object.fromEntries(sectionIds.map(id => [id, { schemaVersion: 1, data: { value: id } }]))
    },
    compatibleSectionIds: sectionIds,
    defaultSelectedSectionIds: sectionIds
  }
}

function descriptor(id, events, state, failures = {}) {
  return {
    planImport(data) {
      events.push(`${id}:plan`)
      return { candidate: data, summary: { added: 1 }, warnings: failures.warning ? ['地图坐标警告'] : [] }
    },
    validate() {
      events.push(`${id}:validate`)
      if (failures.validate) throw new Error('validate failed')
    },
    snapshot() {
      events.push(`${id}:snapshot`)
      return { value: state.value }
    },
    async persist(plan) {
      events.push(`${id}:persist`)
      state.value = plan.candidate.value
      if (failures.blocker) await failures.blocker
      if (failures.persist) throw new Error('persist failed')
    },
    rollback(snapshot) {
      events.push(`${id}:rollback`)
      if (failures.rollback) throw new Error('rollback failed')
      state.value = snapshot.value
    }
  }
}

test('import preview is side-effect free and reports only selected supported content', () => {
  const events = []
  const state = { value: 'local' }
  const descriptors = new Map([
    ['preset.item', descriptor('preset.item', events, state)],
    ['settings.toolSites', descriptor('settings.toolSites', events, state)]
  ])
  const preview = createImportPreview({
    parsed: parsedBundle(['preset.item', 'settings.toolSites']), descriptors,
    sectionOptions: { selectedSectionIds: ['settings.toolSites'] }
  })
  assert.equal(state.value, 'local')
  assert.deepEqual(events, ['settings.toolSites:plan'])
  assert.deepEqual(preview.selectedSectionIds, ['settings.toolSites'])
  assert.equal(Object.hasOwn(preview, 'requiresAutomationStop'), false)
})

test('successful transaction validates, snapshots and persists without runtime stages', async () => {
  const events = []
  const state = { value: 'local' }
  const descriptors = new Map([['preset.item', descriptor('preset.item', events, state)]])
  const preview = createImportPreview({ parsed: parsedBundle(), descriptors })
  const result = await createConfigImportRunner().execute(preview)
  assert.equal(result.success, true)
  assert.equal(state.value, 'preset.item')
  assert.deepEqual(events, ['preset.item:plan', 'preset.item:validate', 'preset.item:snapshot', 'preset.item:persist'])
  assert.deepEqual(result.sections[0], { id: 'preset.item', added: 1, skipped: 0, conflicts: 0 })
})

test('prevalidation failure performs zero writes', async () => {
  const events = []
  const state = { value: 'local' }
  const descriptors = new Map([['preset.item', descriptor('preset.item', events, state, { validate: true })]])
  const preview = createImportPreview({ parsed: parsedBundle(), descriptors })
  await assert.rejects(() => createConfigImportRunner().execute(preview), error => {
    assert.equal(error instanceof ConfigTransferError, true)
    assert.equal(error.code, 'IMPORT_PREVALIDATION_FAILED')
    return true
  })
  assert.equal(state.value, 'local')
  assert.equal(events.includes('preset.item:persist'), false)
})

test('persistence failure rolls back every touched section in reverse order', async () => {
  const events = []
  const stateA = { value: 'local-a' }
  const stateB = { value: 'local-b' }
  const descriptors = new Map([
    ['preset.item', descriptor('preset.item', events, stateA)],
    ['settings.toolSites', descriptor('settings.toolSites', events, stateB, { persist: true })]
  ])
  const preview = createImportPreview({ parsed: parsedBundle(['preset.item', 'settings.toolSites']), descriptors })
  await assert.rejects(() => createConfigImportRunner().execute(preview), error => error.code === 'IMPORT_PERSIST_FAILED')
  assert.equal(stateA.value, 'local-a')
  assert.equal(stateB.value, 'local-b')
  assert.deepEqual(events.slice(-2), ['settings.toolSites:rollback', 'preset.item:rollback'])
})

test('incomplete persistent rollback is reported explicitly without input side effects', async () => {
  const events = []
  const state = { value: 'local' }
  const descriptors = new Map([['preset.item', descriptor('preset.item', events, state, { persist: true, rollback: true })]])
  const preview = createImportPreview({ parsed: parsedBundle(), descriptors })
  await assert.rejects(() => createConfigImportRunner().execute(preview), error => {
    assert.equal(error.code, 'IMPORT_ROLLBACK_INCOMPLETE')
    assert.equal(error.details.causeCode, 'IMPORT_PERSIST_FAILED')
    assert.equal(error.details.rollbackErrors.length, 1)
    return true
  })
  assert.equal(events.some(event => event.includes('force-disable')), false)
})

test('global storage snapshot restores after a partial persistence failure', async () => {
  const events = []
  const state = { value: 'local' }
  let restored = false
  const descriptors = new Map([['preset.item', descriptor('preset.item', events, state, { persist: true })]])
  const preview = createImportPreview({ parsed: parsedBundle(), descriptors })
  const runner = createConfigImportRunner({
    stateController: {
      snapshot: () => ({ local: true }),
      rollback: snapshot => { restored = snapshot.local }
    }
  })
  await assert.rejects(() => runner.execute(preview), error => error.code === 'IMPORT_PERSIST_FAILED')
  assert.equal(restored, true)
})

test('concurrent submissions are rejected by the transaction gate', async () => {
  let release
  const blocker = new Promise(resolve => { release = resolve })
  const state = { value: 'local' }
  const events = []
  const descriptors = new Map([['preset.item', descriptor('preset.item', events, state, { blocker })]])
  const preview = createImportPreview({ parsed: parsedBundle(), descriptors })
  const runner = createConfigImportRunner()
  const first = runner.execute(preview)
  await Promise.resolve()
  await Promise.resolve()
  await assert.rejects(() => runner.execute(preview), error => error.code === 'IMPORT_BUSY')
  release()
  await first
})
})()

// === Merged from configurationFailures.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const readFileSync = _m6_readFileSync
  const configurationIssueFromFailure = _m6_configurationIssueFromFailure
  const sanitizeOverlayGuideRequest = _m6_sanitizeOverlayGuideRequest
test('通货缺失与类型不匹配映射到稳定的 suspect 配置项', () => {
  for (const failureCode of ['CONFIGURATION_MISSING', 'CURRENCY_NOT_FOUND', 'CURRENCY_TYPE_MISMATCH']) {
    const issue = configurationIssueFromFailure({
      moduleId: 'items',
      actionId: 'start',
      failureCode,
      configurationIssueId: 'currency.alteration',
      message: '请重新定位改造石'
    })
    assert.equal(issue.id, 'currency.alteration')
    assert.equal(issue.editorId, 'currency.alteration')
    assert.equal(issue.state, 'suspect')
  }
})

test('区域与模板的结构化错误可纠正，临时环境错误不会触发引导', () => {
  assert.equal(configurationIssueFromFailure({
    moduleId: 'puzzle',
    actionId: 'auto-place',
    failureCode: 'TARGET_MISMATCH'
  }).id, 'puzzle.atlas-region')
  assert.equal(configurationIssueFromFailure({
    moduleId: 'bag',
    actionId: 'start',
    failureCode: 'TEMPLATE_MATCH_FAILED',
    configurationIssueId: 'template.stash-title'
  }).id, 'template.stash-title')
  for (const failureCode of ['GAME_NOT_FOREGROUND', 'NETWORK_UNAVAILABLE', 'CLIPBOARD_UNAVAILABLE', 'SERVICE_BUSY', 'SOURCE_NOT_FOUND']) {
    assert.equal(configurationIssueFromFailure({ moduleId: 'puzzle', actionId: 'analyze', failureCode }), null)
  }
})

test('结构化失败问题必须属于当前模块与操作', () => {
  assert.equal(configurationIssueFromFailure({
    moduleId: 'bag',
    actionId: 'enable',
    failureCode: 'CURRENCY_NOT_FOUND',
    configurationIssueId: 'currency.alteration'
  }), null)
  assert.equal(configurationIssueFromFailure({
    moduleId: 'combat',
    actionId: 'portal',
    failureCode: 'DISPLAY_ENVIRONMENT_CHANGED',
    configurationIssueId: 'combat.potion.health.position'
  }), null)
  assert.equal(configurationIssueFromFailure({
    moduleId: 'story',
    actionId: 'start',
    failureCode: 'REGION_INVALID',
    configurationIssueId: 'puzzle.inventory-region'
  }), null)
})

test('账号、赛季与仓库校准的稳定错误码可直接定位配置', () => {
  assert.equal(configurationIssueFromFailure({ moduleId: 'price-check', actionId: 'capture', failureCode: 'UNAUTHENTICATED' })?.id, 'account.poe-cn')
  assert.equal(configurationIssueFromFailure({ moduleId: 'shop', actionId: 'start', failureCode: 'LEAGUE_REQUIRED' })?.id, 'account.league')
  assert.equal(configurationIssueFromFailure({ moduleId: 'shop', actionId: 'start', failureCode: 'CALIBRATION_REQUIRED' })?.id, 'stash-grid.any')
  assert.equal(configurationIssueFromFailure({ moduleId: 'shop', actionId: 'start', failureCode: 'UNSUPPORTED_TAB' })?.id, 'shop.stash-tabs')
})

test('多项模板同时失效时一次性解析全部待重新配置项并在续检时自动追加剩余项', async () => {
  const issues = _m6_configurationIssuesFromFailure({
    moduleId: 'bag',
    actionId: 'start',
    failureCode: 'TEMPLATE_INVALID',
    configurationIssueId: 'template.stash-title',
    configurationIssues: [
      { failureCode: 'TEMPLATE_INVALID', configurationIssueId: 'template.stash-title', message: '仓库标题的显示环境已变化' },
      { failureCode: 'TEMPLATE_INVALID', configurationIssueId: 'template.inventory-title', message: '背包标题的显示环境已变化' }
    ]
  })
  assert.deepEqual(issues.map(item => item.id), ['template.stash-title', 'template.inventory-title'])

  _m7_setActivePinia(_m7_createPinia())
  const guide = _m7_useConfigurationGuideStore()
  let attempt = 0
  guide.open({
    moduleId: 'bag',
    actionId: 'start',
    title: '重新配置背包安全入库',
    focusIssueId: 'template.stash-title',
    forcedIssues: [issues[0]],
    collect: () => _m7_createConfigurationCheck([]),
    execute: async () => {
      attempt += 1
      if (attempt === 1) {
        return {
          success: false,
          error: '背包标题的显示环境已变化',
          failureCode: 'TEMPLATE_INVALID',
          configurationIssueId: 'template.inventory-title'
        }
      }
      return { success: true }
    }
  })
  guide.markIssueConfigured('template.stash-title')
  const firstContinue = await guide.continueAction()
  assert.equal(firstContinue.configurationRequired, true)
  assert.equal(guide.visible, true)
  assert.deepEqual(guide.issues.map(item => item.id), ['template.inventory-title'])

  guide.markIssueConfigured('template.inventory-title')
  const secondContinue = await guide.continueAction()
  assert.equal(secondContinue.success, true)
  assert.equal(guide.visible, false)
})

test('浮窗 GuideRequest 仅接受白名单模块、动作和已知问题 ID，额外字段被移除', () => {
  assert.deepEqual(sanitizeOverlayGuideRequest({
    moduleId: 'items',
    actionId: 'start',
    focusIssueId: 'currency.chaos',
    coordinate: { x: 1, y: 2 },
    credential: 'secret',
    route: '/settings'
  }), {
    moduleId: 'items',
    actionId: 'start',
    focusIssueId: 'currency.chaos'
  })
  assert.equal(sanitizeOverlayGuideRequest({ moduleId: 'story', actionId: 'start', focusIssueId: 'currency.chaos' }), null)
  assert.equal(sanitizeOverlayGuideRequest({ moduleId: 'items', actionId: 'open-route', focusIssueId: 'currency.chaos' }), null)
  assert.equal(sanitizeOverlayGuideRequest({ moduleId: 'items', actionId: 'start', focusIssueId: 'currency.unknown' }), null)
})

test('主进程同时校验浮窗与主窗口发送方，不接受任意渲染进程调用', () => {
  const source = readFileSync(new URL('../electron/modules/ipc/configurationGuide.js', import.meta.url), 'utf8')
  assert.match(source, /overlay\.webContents !== event\.sender/)
  assert.match(source, /main\.webContents !== event\.sender/)
  assert.match(source, /sanitizeOverlayGuideRequest/)
  assert.doesNotMatch(source, /credential|coordinate|route/)
})
})()

// === Merged from configurationGuideStore.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const createPinia = _m7_createPinia
  const setActivePinia = _m7_setActivePinia
  const useConfigurationGuideStore = _m7_useConfigurationGuideStore
  const createConfigurationCheck = _m7_createConfigurationCheck
  const createConfigurationIssue = _m7_createConfigurationIssue
const missing = () => createConfigurationIssue({
  id: 'currency.wisdom', moduleId: 'items', actionId: 'start', kind: 'coordinate',
  title: '知识卷轴坐标', message: '未配置', editorId: 'currency.wisdom'
})

function setup() {
  setActivePinia(createPinia())
  return useConfigurationGuideStore()
}

test('没有配置问题时立即执行且不显示引导', async () => {
  const store = setup()
  let executions = 0
  const result = await store.open({
    moduleId: 'items', actionId: 'start',
    collect: () => createConfigurationCheck([]),
    execute: async () => { executions += 1; return { success: true } }
  })
  assert.equal(result.success, true)
  assert.equal(executions, 1)
  assert.equal(store.visible, false)
})

test('缺项先打开引导，补齐后显式继续只执行一次', async () => {
  const store = setup()
  let configured = false
  let executions = 0
  const opened = store.open({
    moduleId: 'items', actionId: 'start', actionLabel: '开始',
    collect: () => createConfigurationCheck(configured ? [] : [missing()]),
    execute: async () => { executions += 1; return { success: true } }
  })
  assert.equal(opened.configurationRequired, true)
  assert.equal(store.visible, true)
  assert.equal(executions, 0)
  configured = true
  store.refresh()
  assert.equal(store.remainingCount, 0)
  await Promise.all([store.continueAction(), store.continueAction()])
  assert.equal(executions, 1)
  assert.equal(store.visible, false)
})

test('关闭引导清除待执行动作且不会产生副作用', async () => {
  const store = setup()
  let executions = 0
  store.open({
    moduleId: 'items', actionId: 'start',
    collect: () => createConfigurationCheck([missing()]),
    execute: async () => { executions += 1 }
  })
  assert.equal(store.clear(), true)
  assert.deepEqual(await store.continueAction(), { success: false, ignored: true })
  assert.equal(executions, 0)
})

test('运行纠错的 suspect 项在明确保存前持续阻塞且完成后不自动执行', async () => {
  const store = setup()
  let completions = 0
  store.open({
    moduleId: 'items', actionId: 'start', returnToSource: true,
    collect: () => createConfigurationCheck([]),
    forcedIssues: [{ ...missing(), state: 'suspect' }],
    onComplete: () => { completions += 1 }
  })
  assert.equal(store.remainingCount, 1)
  store.markIssueConfigured('currency.wisdom')
  assert.equal(store.remainingCount, 0)
  await store.continueAction()
  assert.equal(completions, 1)
  assert.equal(store.visible, false)
})

test('取消来源于浮窗的引导会清除待执行动作并只恢复来源窗口', async () => {
  const store = setup()
  let executed = 0
  let canceled = 0
  store.open({
    moduleId: 'items',
    actionId: 'start',
    collect: () => createConfigurationCheck([missing()]),
    execute: () => { executed += 1 },
    onCancel: () => { canceled += 1 }
  })
  await store.cancel()
  assert.equal(store.visible, false)
  assert.equal(executed, 0)
  assert.equal(canceled, 1)
})
})()

// === Merged from configurationIssues.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const CONFIGURATION_ACTIONS = _m8_CONFIGURATION_ACTIONS
  const collectAllflameReceiverConfigurationIssues = _m8_collectAllflameReceiverConfigurationIssues
  const collectBagConfigurationIssues = _m8_collectBagConfigurationIssues
  const collectCombatConfigurationIssues = _m8_collectCombatConfigurationIssues
  const collectCraftingConfigurationIssues = _m8_collectCraftingConfigurationIssues
  const collectJunfengConfigurationIssues = _m8_collectJunfengConfigurationIssues
  const collectMapConfigurationIssues = _m8_collectMapConfigurationIssues
  const collectPriceCheckConfigurationIssues = _m8_collectPriceCheckConfigurationIssues
  const collectPuzzleConfigurationIssues = _m8_collectPuzzleConfigurationIssues
  const collectShopConfigurationIssues = _m8_collectShopConfigurationIssues
  const collectStashPickupConfigurationIssues = _m8_collectStashPickupConfigurationIssues
  const createConfigurationCheck = _m8_createConfigurationCheck
  const createConfigurationIssue = _m8_createConfigurationIssue
  const suspectedCurrencyIssue = _m8_suspectedCurrencyIssue
const point = { x: 100, y: 200 }
const region = { left: 10, top: 10, right: 110, bottom: 110 }
const grid = { startPos: point, slotSize: { w: 40, h: 40 } }
const templates = {
  stashTitle: 'stash.png', inventoryTitle: 'inventory.png', junfengRewardTitle: 'reward.png', allflameReceiverTitle: 'receiver.png',
  stashRegion: region, inventoryRegion: region, junfengRewardRegion: region, allflameReceiverRegion: region
}

function ids(result) { return result.issues.map(issue => issue.id) }

test('配置问题只保留白名单字段并去重，强制 suspect 覆盖同一问题', () => {
  const base = createConfigurationIssue({
    id: 'currency.wisdom', moduleId: 'items', actionId: 'start', kind: 'coordinate',
    title: '知识卷轴坐标', message: '缺失', editorId: 'currency.wisdom', password: 'secret'
  })
  assert.equal(Object.hasOwn(base, 'password'), false)
  const result = createConfigurationCheck([base], {
    forcedIssues: [suspectedCurrencyIssue('items', 'start', 'wisdom')]
  })
  assert.equal(result.issues.length, 1)
  assert.equal(result.issues[0].state, 'suspect')
  assert.deepEqual(result.errors, ['请重新抓取知识卷轴坐标后再重试'])
})

test('改造制作使用完整 preflight 清单而不是旧的部分坐标校验', () => {
  const result = collectCraftingConfigurationIssues({
    itemPosition: point,
    currencyPositions: {},
    stashTabSelection: { enabled: false },
    preset: {
      moduleTwo: {
        enabled: true, mode: 'alteration', enableAugmentation: true, enableRegal: true,
        affixGroups: [{ enabled: true, selectedAffixes: ['生命'] }]
      },
      moduleThree: { enabled: false },
      moduleEldritch: { enabled: false }
    }
  })
  assert.deepEqual(ids(result).filter(id => id.startsWith('currency.')), [
    'currency.wisdom', 'currency.transmutation', 'currency.scouring',
    'currency.alteration', 'currency.augmentation', 'currency.regal'
  ])
})

test('背包批量制作支持免扫描按类别直跑，不要求账号角色或赛季', () => {
  const base = {
    inventory: grid,
    currencyPositions: { wisdom: point, transmutation: point, scouring: point, alteration: point },
    stashTabSelection: { enabled: false },
    preset: {
      batchCrafting: { enabled: true, categoryIds: ['ring'] },
      moduleTwo: { enabled: true, mode: 'alteration', affixGroups: [{ enabled: true, selectedAffixes: ['生命'] }] },
      moduleThree: { enabled: false }, moduleEldritch: { enabled: false }
    }
  }
  assert.equal(collectCraftingConfigurationIssues(base).ok, true)
  const emptySnapshotCandidates = collectCraftingConfigurationIssues({
    ...base,
    batchSnapshot: { scanId: 'scan-1' },
    batchSnapshotConsumed: false,
    batchCandidateCount: 0
  })
  assert.deepEqual(ids(emptySnapshotCandidates).slice(0, 1), ['preset.items.batch-candidates'])
  const ready = collectCraftingConfigurationIssues({
    ...base,
    authenticated: false,
    league: '',
    batchSnapshot: { scanId: 'scan-1' },
    batchCandidateCount: 1
  })
  assert.equal(ready.ok, true)
  assert.doesNotMatch(ready.errors.join(' '), /账号|角色|赛季/)

  const missingCategory = collectCraftingConfigurationIssues({
    ...base,
    batchSnapshot: { scanId: 'scan-1' },
    preset: { ...base.preset, batchCrafting: { enabled: true, categoryIds: [] } }
  })
  const categoryIssue = missingCategory.issues.find(issue => issue.id === 'preset.items.batch-categories')
  assert.equal(categoryIssue.editorId, 'preset.items.batch-categories')
})

test('地图问题包含背包网格、完整通货和已启用仓库选择', () => {
  const result = collectMapConfigurationIssues({
    mapConfig: { method: 'chaos', vaal: { enabled: true } },
    inventory: { startPos: { x: 0, y: 0 }, slotSize: { w: 0, h: 0 } },
    currencyPositions: {},
    stashTabSelection: { enabled: true, rootRegion: null }
  })
  assert.deepEqual(ids(result), [
    'inventory.grid', 'currency.wisdom', 'currency.scouring', 'currency.alchemy',
    'currency.chaos', 'currency.vaal', 'stash-tab.currency'
  ])
})

test('背包、仓库拾取与君锋按各自真实配置列出问题', () => {
  assert.deepEqual(ids(collectBagConfigurationIssues({ templates: {}, inventory: {} })), [
    'template.stash-title', 'template.inventory-title', 'inventory.grid'
  ])
  assert.deepEqual(ids(collectAllflameReceiverConfigurationIssues({ templates: {}, inventory: {} })), [
    'template.allflame-receiver-title', 'template.inventory-title', 'inventory.grid'
  ])
  assert.equal(collectAllflameReceiverConfigurationIssues({ templates, inventory: grid }).ok, true)
  assert.deepEqual(ids(collectStashPickupConfigurationIssues({ templates, calibration: {} })), ['stash-grid.any'])
  assert.deepEqual(ids(collectJunfengConfigurationIssues({ templates, gridRegion: null })), ['junfeng.grid'])
  assert.equal(collectBagConfigurationIssues({ templates, inventory: grid }).ok, true)
})

test('战斗 collector 按当前动作区分坐标、按键与选择项', () => {
  const config = {
    potion: {
      health: { enabled: true, point: { x: 0, y: 0 }, keys: [] },
      mana: { enabled: false, point, keys: ['2'] }
    },
    loop: { items: [] },
    portal: { openKey: '', clickPoint: { x: 0, y: 0 } }
  }
  assert.deepEqual(ids(collectCombatConfigurationIssues({ actionId: CONFIGURATION_ACTIONS.potion, config })), [
    'combat.potion.health.position', 'combat.potion.health.keys'
  ])
  assert.deepEqual(ids(collectCombatConfigurationIssues({ actionId: CONFIGURATION_ACTIONS.loop, config })), ['combat.loop.items'])
  assert.deepEqual(ids(collectCombatConfigurationIssues({ actionId: CONFIGURATION_ACTIONS.portal, config })), [
    'combat.portal.key', 'combat.portal.position'
  ])
})

test('商店要求账号赛季仓库页模板与选中页校准，查价不要求快捷键', () => {
  const shop = collectShopConfigurationIssues({ authenticated: false, league: '', selectedTabs: [], templates: {} })
  assert.deepEqual(ids(shop), [
    'account.poe-cn', 'account.league', 'template.stash-title',
    'template.inventory-title', 'shop.stash-tabs'
  ])
  const calibrated = collectShopConfigurationIssues({
    authenticated: true, league: 'S1', selectedTabs: [{ id: '1' }], missingCalibrations: ['folder'], templates
  })
  assert.deepEqual(ids(calibrated), ['stash-grid.folder'])
  assert.equal(collectPriceCheckConfigurationIssues({ authenticated: true, league: 'S1', shortcut: '' }).ok, true)
})

test('拼图只把当前动作需要的区域和页签当作配置问题', () => {
  const metadata = {
    displayId: '1', scaleFactor: 1,
    displayPhysicalBounds: { x: 0, y: 0, width: 1920, height: 1080 },
    selectedRegion: { left: 100, top: 200, right: 700, bottom: 1000 }
  }
  assert.deepEqual(ids(collectPuzzleConfigurationIssues({ actionId: CONFIGURATION_ACTIONS.analyze })), ['puzzle.inventory-region'])
  assert.deepEqual(ids(collectPuzzleConfigurationIssues({ actionId: CONFIGURATION_ACTIONS.border })), ['puzzle.atlas-region'])
  const auto = collectPuzzleConfigurationIssues({
    actionId: CONFIGURATION_ACTIONS.autoPlace,
    inventoryRegionMetadata: metadata,
    atlasRegionMetadata: { ...metadata, selectedRegion: { left: 800, top: 300, right: 1100, bottom: 600 } },
    sourcePages: [1, 2], inventoryTabPoints: {}
  })
  assert.deepEqual(ids(auto), ['puzzle.tab.1', 'puzzle.tab.2'])
})
})()

// === Merged from crossServerPresets.test.js ===
await (async () => {
  const test = _m9_test
  const assert = _m9_assert
  const SHARED_PRESET_STORAGE_KEYS = _m9_SHARED_PRESET_STORAGE_KEYS
  const SHARED_SETTINGS_FIELDS = _m9_SHARED_SETTINGS_FIELDS
  const serverStorageKey = _m9_serverStorageKey
  const createServerStorage = _m9_createServerStorage
  const CROSS_SERVER_MIGRATION_FLAG_KEY = _m9_CROSS_SERVER_MIGRATION_FLAG_KEY
  const STORY_CONTEXT_STORAGE_KEY = _m9_STORY_CONTEXT_STORAGE_KEY
  const migrateCrossServerPresets = _m9_migrateCrossServerPresets
  const MAP_BASE_STATS = _m9_MAP_BASE_STATS
  const INTERNATIONAL_MAP_BASE_STATS = _m9_INTERNATIONAL_MAP_BASE_STATS
  const cleanMigratedMapConfig = _m9_cleanMigratedMapConfig
  const createDefaultMapConfig = _m9_createDefaultMapConfig
  const resolveMapAffixTermForLanguage = _m9_resolveMapAffixTermForLanguage
  const translateMapAffixList = _m9_translateMapAffixList
  const cleanMapRegexConfig = _m9_cleanMapRegexConfig
  const generateMapRegex = _m9_generateMapRegex
  const mapRegexCatalog = _m9_mapRegexCatalog
  const normalizeMapRegexAffixId = _m9_normalizeMapRegexAffixId
  const beastRegexOptions = _m9_beastRegexOptions
  const cleanBeastRegexConfig = _m9_cleanBeastRegexConfig
  const generateBeastRegex = _m9_generateBeastRegex
  const normalizeBeastRegexId = _m9_normalizeBeastRegexId
  const buildStorySnapshot = _m9_buildStorySnapshot
  const createEmptyStoryData = _m9_createEmptyStoryData
  const readStoryData = _m9_readStoryData
  const writeStoryData = _m9_writeStoryData
  const resolveSkillForServer = _m9_resolveSkillForServer
  const matchAffixes = _m9_matchAffixes
  const matchEldritchImplicits = _m9_matchEldritchImplicits
  const matchMapRequirements = _m9_matchMapRequirements
  const loadCraftingCrossServerMap = _m9_loadCraftingCrossServerMap
  const translateAffixPattern = _m9_translateAffixPattern
  const translateEldritchTarget = _m9_translateEldritchTarget
  const createConfigBundle = _m9_createConfigBundle
  const createConfigTransferService = _m9_createConfigTransferService
  const createDefaultItemPreset = _m9_createDefaultItemPreset
  const createDefaultSpecializedPreset = _m9_createDefaultSpecializedPreset
  const createDefaultHeistConfig = _m9_createDefaultHeistConfig
  const createDefaultVendorPreset = _m9_createDefaultVendorPreset
  const createDefaultMapRegexPreset = _m9_createDefaultMapRegexPreset
  const createDefaultBeastRegexPreset = _m9_createDefaultBeastRegexPreset
  const createDefaultCombatAssist = _m9_createDefaultCombatAssist
function createMemoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial))
  return {
    getItem: key => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)) },
    removeItem: key => { map.delete(key) },
    _raw: map
  }
}

test('五大模块预设本体与战斗辅助配置跨服共享，当前选中ID与非战斗坐标保持独立', () => {
  assert.ok(SHARED_SETTINGS_FIELDS.includes('combatAssist'))
  for (const key of SHARED_PRESET_STORAGE_KEYS) {
    assert.equal(serverStorageKey(key, 'international'), key, `${key} 应跨服共享`)
  }
  for (const perServerKey of [
    'currentItemPresetId', 'currentMapPresetId', 'currentHeistPresetId',
    'currentVendorRegexPresetId', 'currentMapRegexPresetId', 'currentBeastRegexPresetId',
    'itemCraftingKind', 'mapRollingKind', STORY_CONTEXT_STORAGE_KEY
  ]) {
    assert.equal(serverStorageKey(perServerKey, 'international'), `server:international:${perServerKey}`)
  }

  const raw = createMemoryStorage()
  const cn = createServerStorage(raw, 'cn')
  const intl = createServerStorage(raw, 'international')

  cn.setItem('itemPresets', JSON.stringify([{ id: 'p1', name: '做装预设A' }]))
  cn.setItem('currentItemPresetId', 'p1')
  intl.setItem('currentItemPresetId', 'default')
  assert.deepEqual(JSON.parse(intl.getItem('itemPresets')), [{ id: 'p1', name: '做装预设A' }])
  assert.equal(cn.getItem('currentItemPresetId'), 'p1')
  assert.equal(intl.getItem('currentItemPresetId'), 'default')

  cn.setItem('settings', JSON.stringify({
    inventory: { startPos: { x: 100, y: 200 } },
    combatAssist: {
      ...createDefaultCombatAssist(),
      portal: { openKey: 'F4', clickPoint: { x: 960, y: 540 }, waitMs: 450 }
    }
  }))
  const intlSettings = JSON.parse(intl.getItem('settings'))
  assert.equal(intlSettings.inventory, undefined)
  assert.equal(intlSettings.combatAssist.portal.openKey, 'F4')
  assert.deepEqual(intlSettings.combatAssist.portal.clickPoint, { x: 960, y: 540 })

  intl.setItem('settings', JSON.stringify({
    ...intlSettings,
    inventory: { startPos: { x: 300, y: 400 } },
    combatAssist: {
      ...intlSettings.combatAssist,
      portal: { openKey: 'F5', clickPoint: { x: 950, y: 530 }, waitMs: 400 }
    }
  }))
  const cnAfter = JSON.parse(cn.getItem('settings'))
  assert.deepEqual(cnAfter.inventory.startPos, { x: 100, y: 200 })
  assert.equal(cnAfter.combatAssist.portal.openKey, 'F5')
  assert.deepEqual(cnAfter.combatAssist.portal.clickPoint, { x: 950, y: 530 })
})

test('老用户双服数据一次性幂等迁移：合并自定义与已改动的默认预设、拆分剧情进度、合并战斗配置', () => {
  const cnItemDefault = createDefaultItemPreset('default', '默认预设')
  cnItemDefault.moduleThree.enabled = true
  cnItemDefault.moduleThree.link = { enabled: true, count: 6 }

  const intlItemDefault = createDefaultItemPreset('default', '默认预设')
  intlItemDefault.moduleThree.enabled = true
  intlItemDefault.moduleThree.socket = { enabled: true, count: 6 }

  const cnCustom = createDefaultItemPreset('custom_1', '洗爪子')
  cnCustom.moduleTwo.mode = 'chaos'
  const intlCustomSameName = createDefaultItemPreset('custom_1', '洗爪子')
  intlCustomSameName.moduleTwo.mode = 'alchemy'

  const cnStory = {
    version: 2,
    storyPresets: [{
      id: 'default', name: '默认剧情',
      chapters: [{ id: 'ch1', name: '第一章', steps: [{ id: 's1', text: '步骤1' }, { id: 's2', text: '步骤2' }] }],
      currentChapterId: 'ch1', currentStepId: 's2', viewedChapterId: 'ch1'
    }],
    skillPresets: [{ id: 'default', name: '默认技能', chapterSkills: [] }],
    currentStoryPresetId: 'default',
    currentSkillPresetId: 'default'
  }
  const intlStory = {
    version: 2,
    storyPresets: [{
      id: 'default', name: '默认剧情',
      chapters: [{ id: 'ch1', name: '第一章', steps: [{ id: 's1', text: '步骤1' }, { id: 's2', text: '步骤2' }] }],
      currentChapterId: 'ch1', currentStepId: 's1', viewedChapterId: 'ch1'
    }, {
      id: 'intl_story_1', name: '国际服速通',
      chapters: [{ id: 'ic1', name: 'Act 1', steps: [{ id: 'is1', text: 'Run' }] }],
      currentChapterId: 'ic1', currentStepId: 'is1', viewedChapterId: 'ic1'
    }],
    skillPresets: [{ id: 'default', name: '默认技能', chapterSkills: [] }],
    currentStoryPresetId: 'intl_story_1',
    currentSkillPresetId: 'default'
  }

  const raw = createMemoryStorage({
    itemPresets: JSON.stringify([cnItemDefault, cnCustom]),
    currentItemPresetId: 'custom_1',
    'server:international:itemPresets': JSON.stringify([intlItemDefault, intlCustomSameName]),
    'server:international:currentItemPresetId': 'default',
    'storyGuide:v1': JSON.stringify(cnStory),
    'server:international:storyGuide:v1': JSON.stringify(intlStory),
    settings: JSON.stringify({}),
    'server:international:settings': JSON.stringify({
      combatAssist: {
        ...createDefaultCombatAssist(),
        portal: { openKey: 'F6', clickPoint: { x: 800, y: 450 }, waitMs: 300 }
      }
    })
  })

  const firstRun = migrateCrossServerPresets(raw)
  assert.equal(firstRun.migrated, true)
  assert.equal(raw.getItem(CROSS_SERVER_MIGRATION_FLAG_KEY), '1')
  assert.equal(raw.getItem('server:international:itemPresets'), null)
  assert.equal(raw.getItem('server:international:storyGuide:v1'), null)

  const mergedItems = JSON.parse(raw.getItem('itemPresets'))
  assert.equal(mergedItems.length, 4)
  assert.ok(mergedItems.some(p => p.name === '默认预设（国际服）'))
  assert.ok(mergedItems.some(p => p.name === '洗爪子（国际服）'))
  const intlDefaultEntry = mergedItems.find(p => p.name === '默认预设（国际服）')
  assert.equal(raw.getItem('server:international:currentItemPresetId'), intlDefaultEntry.id)

  const cnStorage = createServerStorage(raw, 'cn')
  const intlStorage = createServerStorage(raw, 'international')
  const loadedCnStory = readStoryData(cnStorage)
  const loadedIntlStory = readStoryData(intlStorage)
  assert.equal(loadedCnStory.storyPresets.length, 2)
  assert.equal(loadedIntlStory.storyPresets.length, 2)
  assert.equal(loadedCnStory.currentStoryPresetId, 'default')
  assert.equal(loadedCnStory.storyPresets[0].currentStepId, 's2')
  assert.equal(loadedIntlStory.currentStoryPresetId, 'intl_story_1')

  // 国服未配置战斗辅助时自动继承国际服配置
  assert.equal(JSON.parse(cnStorage.getItem('settings')).combatAssist.portal.openKey, 'F6')
  assert.equal(Object.hasOwn(JSON.parse(raw.getItem('server:international:settings')), 'combatAssist'), false)

  // 幂等性：再次迁移不重复新增
  const secondRun = migrateCrossServerPresets(raw)
  assert.equal(secondRun.migrated, false)
  assert.equal(JSON.parse(raw.getItem('itemPresets')).length, 4)
})

test('地图制作统一 3.30 基底口径，清理旧数量/圣甲虫，词缀跨服双向映射并保留自由词缀', () => {
  assert.deepEqual(Object.values(MAP_BASE_STATS), Object.values(INTERNATIONAL_MAP_BASE_STATS))
  assert.equal(Object.values(MAP_BASE_STATS).includes('quantity'), false)
  assert.equal(Object.values(MAP_BASE_STATS).includes('moreScarabs'), false)
  assert.ok(Object.values(MAP_BASE_STATS).includes('atlasDrops'))
  assert.ok(Object.values(MAP_BASE_STATS).includes('moreThreads'))

  const cleaned = cleanMigratedMapConfig({
    match: {
      mandatoryStats: {
        quantity: { enabled: true, value: 80 },
        moreScarabs: { enabled: true, value: 100 },
        atlasDrops: { enabled: true, value: 60 },
        moreThreads: { enabled: true, value: 50 }
      },
      blacklist: ['稀有怪物有无常之核', '我的手写自定义关键词'],
      whitelist: []
    }
  })
  assert.equal(cleaned.match.mandatoryStats.quantity, undefined)
  assert.equal(cleaned.match.mandatoryStats.moreScarabs, undefined)
  assert.equal(cleaned.match.mandatoryStats.atlasDrops.value, 60)
  assert.equal(cleaned.match.mandatoryStats.moreThreads.value, 50)

  const enBlacklist = translateMapAffixList(cleaned.match.blacklist, 'atlas', 'en')
  assert.equal(enBlacklist[0], 'Rare Monsters have Volatile Cores')
  assert.equal(enBlacklist[1], '我的手写自定义关键词')
  assert.equal(resolveMapAffixTermForLanguage('Rare Monsters have Volatile Cores', 'atlas', 'zh-CN'), '稀有怪物有无常之核')

  // 跨服运行时直接匹配：国服中文黑名单可命中英文地图词缀，反之亦然
  assert.equal(
    matchMapRequirements(
      { category: '异界地图', explicitMods: ['Rare Monsters have Volatile Cores'] },
      { targetKind: 'atlas', match: { blacklist: ['稀有怪物有无常之核'], whitelist: [] } }
    ).reason,
    'blacklist'
  )
  assert.equal(
    matchMapRequirements(
      { category: '异界地图', explicitMods: ['稀有怪物有无常之核'] },
      { targetKind: 'atlas', match: { blacklist: ['Rare Monsters have Volatile Cores'], whitelist: [] } }
    ).reason,
    'blacklist'
  )
})

test('地图正则与野兽正则统一规范 ID，兼容老国服 ID 迁移且切服不丢失非本服条目', () => {
  const cnMapCatalog = mapRegexCatalog('zh-CN')
  const enMapCatalog = mapRegexCatalog('en')
  assert.deepEqual(cnMapCatalog.stats.map(s => s.id), enMapCatalog.stats.map(s => s.id))
  assert.equal(cnMapCatalog.stats.some(s => s.id === 'quantity' || s.id === 'scarabs'), false)

  const canonicalVolatileId = normalizeMapRegexAffixId('稀有怪物有无常之核')
  assert.match(canonicalVolatileId, /^atlas:/)
  assert.ok(enMapCatalog.affixes.some(a => a.id === canonicalVolatileId))

  const cleanedMapRegex = cleanMapRegexConfig({
    stats: { quantity: { enabled: true, value: 80 }, atlasDrops: { enabled: true, value: 70 } },
    excludeAffixIds: ['稀有怪物有无常之核', 'invalid-junk-id']
  }, 'en')
  assert.equal(cleanedMapRegex.stats.quantity, undefined)
  assert.equal(cleanedMapRegex.stats.atlasDrops.value, 70)
  assert.deepEqual(cleanedMapRegex.excludeAffixIds, [canonicalVolatileId])

  const cnMapRegex = generateMapRegex(cleanedMapRegex, 'zh-CN')
  const enMapRegex = generateMapRegex(cleanedMapRegex, 'en')
  assert.ok(cnMapRegex.regex.length > 0)
  assert.ok(enMapRegex.regex.length > 0)

  // 野兽正则：51 只传奇红兽共享 PoEDB 规范 ID，旧中文名自动迁移；国服独有普通兽在国际服无损保留且不污染正则
  assert.equal(normalizeBeastRegexId('大地巨虎'), 'Farric_Tiger_Alpha')
  const cleanedBeast = cleanBeastRegexConfig({ includeIds: ['大地巨虎', '灰色瘟疫'] }, 'en')
  assert.deepEqual(cleanedBeast.includeIds, ['Farric_Tiger_Alpha', '灰色瘟疫'])
  assert.ok(beastRegexOptions('zh-CN').some(b => b.id === 'Farric_Tiger_Alpha' && b.name === '大地巨虎'))
  assert.ok(beastRegexOptions('en').some(b => b.id === 'Farric_Tiger_Alpha' && b.name === 'Farric Tiger Alpha'))
  const enBeastRegex = generateBeastRegex(cleanedBeast, 'en')
  assert.equal(enBeastRegex.includeCount, 1)
  assert.equal(enBeastRegex.regex.includes('undefined'), false)
})

test('剧情技能宝石跨服自动映射且双服阅读进度各自独立', () => {
  const cnSkill = { id: 'sk1', name: '刺客印记', color: 'blue', gemId: 'gem:77922994df622b4b', requiredLevel: 16, kind: 'active' }
  const resolvedEn = resolveSkillForServer(cnSkill, 'international')
  assert.equal(resolvedEn.name, "Assassin's Mark")
  assert.equal(resolvedEn.gemSlug, 'Assassins_Mark')
  const resolvedBackCn = resolveSkillForServer(resolvedEn, 'cn')
  assert.equal(resolvedBackCn.name, '刺客印记')

  const freeTextSkill = { id: 'sk2', name: '自定义技能备注', color: 'red' }
  assert.equal(resolveSkillForServer(freeTextSkill, 'international').displayName, '自定义技能备注')

  const snapshotEn = buildStorySnapshot(
    [{ id: 'c1', name: 'Act 1', steps: [{ id: 's1', text: 'Go' }] }],
    's1',
    [{ id: 'g1', name: '主技能', skills: [cnSkill, freeTextSkill] }],
    { serverId: 'international' }
  )
  assert.equal(snapshotEn.chapter.skillGroups[0].skills[0].name, "Assassin's Mark")
  assert.equal(snapshotEn.chapter.skillGroups[0].skills[1].name, '自定义技能备注')

  // 双服共用剧情预设库，但当前进度独立
  const raw = createMemoryStorage()
  const cnStorage = createServerStorage(raw, 'cn')
  const intlStorage = createServerStorage(raw, 'international')
  const base = createEmptyStoryData()
  base.storyPresets[0].chapters = [{ id: 'c1', name: '第一章', steps: [{ id: 's1', text: '第一步' }, { id: 's2', text: '第二步' }] }]
  base.storyPresets[0].currentChapterId = 'c1'
  base.storyPresets[0].currentStepId = 's2'
  writeStoryData(base, cnStorage)

  const intlLoaded = readStoryData(intlStorage)
  assert.equal(intlLoaded.storyPresets[0].chapters.length, 1)
  intlLoaded.storyPresets[0].currentStepId = 's1'
  writeStoryData(intlLoaded, intlStorage)

  assert.equal(readStoryData(cnStorage).storyPresets[0].currentStepId, 's2')
  assert.equal(readStoryData(intlStorage).storyPresets[0].currentStepId, 's1')
})

test('做装目录词缀与古灵隐式 3.30 双服映射和跨服匹配正常工作', () => {
  const map = loadCraftingCrossServerMap()
  assert.ok(map.cnToEn.size >= 900)
  assert.equal(map.eldritchByCanonicalKey.size, 669)

  const enLifePattern = translateAffixPattern('+# 最大生命', 'en')
  assert.equal(enLifePattern, '+# to maximum Life')
  assert.equal(translateAffixPattern('+# to maximum Life', 'zh-CN'), '+# 最大生命')

  // 国服目录词缀条件可直接匹配国际服英文物品文本
  const matchedOnEn = matchAffixes(
    { modifiers: [{ name: 'Healthy', text: '+95 to maximum Life', tier: 1 }] },
    [{ id: 'g1', name: '组合1', requiredAffixes: [{ kind: 'catalog', keyword: '+# 最大生命', effectPattern: '+# 最大生命', minTier: 2 }], selectedAffixes: [] }]
  )
  assert.equal(matchedOnEn.isMatch, true)

  // 古灵隐式 669 家族跨服映射与匹配
  const sampleEldritch = [...map.eldritchByCanonicalKey.values()][0]
  const translatedToEn = translateEldritchTarget({ familyId: sampleEldritch.cnFamilyId, source: sampleEldritch.source, effectPattern: sampleEldritch.cnPattern }, 'en')
  assert.equal(translatedToEn.familyId, sampleEldritch.enFamilyId)
  assert.equal(translatedToEn.effectPattern, sampleEldritch.enPattern)
  const sampleEnText = sampleEldritch.enPattern.replaceAll('#', '10')
  const eldMatch = matchEldritchImplicits(
    { implicitMods: [sampleEnText] },
    [{ familyId: sampleEldritch.cnFamilyId, source: sampleEldritch.source, effectPattern: sampleEldritch.cnPattern }]
  )
  assert.equal(eldMatch.isMatch, true)
})

test('配置导入导出放开跨服限制并支持契约蓝图、三大正则与战斗辅助配置', async () => {
  const storage = createMemoryStorage()
  const presetStore = {
    itemPresets: [createDefaultItemPreset()],
    currentItemPresetId: 'default',
    essencePresets: [createDefaultSpecializedPreset('essence')],
    currentEssencePresetId: 'default',
    harvestPresets: [createDefaultSpecializedPreset('harvest')],
    currentHarvestPresetId: 'default',
    mapPresets: [{ id: 'default', name: '默认预设', map: createDefaultMapConfig() }],
    currentMapPresetId: 'default',
    heistPresets: [{ id: 'default', name: '默认预设', heist: createDefaultHeistConfig() }],
    currentHeistPresetId: 'default',
    savePresets() {}
  }
  const storyStore = {
    storyPresets: createEmptyStoryData().storyPresets,
    currentStoryPresetId: 'default',
    skillPresets: createEmptyStoryData().skillPresets,
    currentSkillPresetId: 'default',
    save() {}
  }
  const regexPresetStore = {
    vendorPresets: [createDefaultVendorPreset()],
    currentVendorPresetId: 'default',
    mapRegexPresets: [createDefaultMapRegexPreset()],
    currentMapRegexPresetId: 'default',
    beastRegexPresets: [createDefaultBeastRegexPreset()],
    currentBeastRegexPresetId: 'default',
    save() {}
  }
  const settingsStore = {
    combatAssist: createDefaultCombatAssist(),
    async updateCombatAssist(next) {
      this.combatAssist = next
      return { success: true, config: next }
    }
  }

  const internationalBundle = createConfigBundle({
    appVersion: '1.9.3',
    server: 'international',
    sections: {
      'preset.map': {
        data: {
          items: [{
            recordKey: 'map:1',
            name: '国际服异界图',
            data: {
              ...createDefaultMapConfig(),
              match: {
                ...createDefaultMapConfig().match,
                blacklist: ['Rare Monsters have Volatile Cores']
              }
            }
          }]
        }
      },
      'preset.heist': {
        data: {
          items: [{ recordKey: 'heist:1', name: '国际服蓝图', data: createDefaultHeistConfig() }]
        }
      },
      'preset.vendorRegex': {
        data: { items: [{ recordKey: 'v:1', name: '开荒商店', data: createDefaultVendorPreset().vendor }] }
      },
      'preset.mapRegex': {
        data: { items: [{ recordKey: 'm:1', name: '刷图正则', data: createDefaultMapRegexPreset().mapRegex }] }
      },
      'preset.beastRegex': {
        data: { items: [{ recordKey: 'b:1', name: '红兽正则', data: { ...createDefaultBeastRegexPreset().beastRegex, includeIds: ['Farric_Tiger_Alpha'] } }] }
      },
      'settings.combatAssist': {
        data: {
          combatAssist: {
            ...createDefaultCombatAssist(),
            portal: { openKey: 'F7', clickPoint: { x: 960, y: 540 }, waitMs: 350 }
          }
        }
      }
    }
  })

  const service = createConfigTransferService({
    appVersion: '1.9.3',
    context: {
      presetStore,
      storyStore,
      regexPresetStore,
      settingsStore,
      storage,
      electronApi: {
        configTransfer: {
          async open() { return { canceled: false, fileName: 'intl.json', content: JSON.stringify(internationalBundle) } },
          async save() { return { canceled: false, fileName: 'out.json' } }
        }
      }
    }
  })

  const opened = await service.openImportFile()
  assert.equal(opened.parsed.sections.every(section => section.selectable), true, '跨服导入应全部放行')
  const preview = service.previewImport(opened)
  const result = await service.executeImport(preview)
  assert.equal(result.success, true)
  assert.equal(presetStore.mapPresets.length, 2)
  assert.equal(presetStore.mapPresets[1].map.match.blacklist[0], '稀有怪物有无常之核')
  assert.equal(presetStore.heistPresets.length, 2)
  assert.equal(regexPresetStore.vendorPresets.length, 2)
  assert.equal(regexPresetStore.mapRegexPresets.length, 2)
  assert.equal(regexPresetStore.beastRegexPresets.length, 2)
  assert.equal(settingsStore.combatAssist.portal.openKey, 'F7')
})
})()

// === Merged from dashboardHealthActions.test.js ===
await (async () => {
  const test = _m10_test
  const assert = _m10_assert
  const healthActionForItem = _m10_healthActionForItem
test('可配置健康项映射到各自设置分类', () => {
  assert.deepEqual(healthActionForItem({ id: 'shortcuts', status: 'error' }), {
    type: 'settings', label: '配置快捷键', target: 'general'
  })
  assert.deepEqual(healthActionForItem({ id: 'dpi', status: 'attention' }), {
    type: 'settings', label: '调整 DPI', target: 'system'
  })
})

test('环境健康项映射到针对性排障主题', () => {
  const expected = {
    python: 'faq-runtime',
    displays: 'faq-dpi',
    userData: 'faq-config-location',
    platform: 'faq-system-environment',
    administrator: 'faq-system-environment',
    network: 'faq-system-environment'
  }
  for (const [id, target] of Object.entries(expected)) {
    assert.deepEqual(healthActionForItem({ id, status: 'error' }), {
      type: 'help', label: '查看排障', target
    })
  }
})

test('正常、检测中和未知健康项不生成操作', () => {
  assert.equal(healthActionForItem({ id: 'shortcuts', status: 'ready' }), null)
  assert.equal(healthActionForItem({ id: 'dpi', status: 'pending' }), null)
  assert.equal(healthActionForItem({ id: 'unknown', status: 'error' }), null)
  assert.equal(healthActionForItem(), null)
})

test('多个异常健康项分别保留自己的操作目标', () => {
  const actions = [
    { id: 'python', status: 'error' },
    { id: 'shortcuts', status: 'attention' },
    { id: 'dpi', status: 'error' }
  ].map(healthActionForItem)
  assert.deepEqual(actions.map(action => action?.target), ['faq-runtime', 'general', 'system'])
})
})()
