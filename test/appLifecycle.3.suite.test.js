import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { readFileSync as _m0_readFileSync } from 'node:fs'
import _m0_vm from 'node:vm'
import { serverContext as _m0_serverContext } from '../shared/serverMode.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { createPinia as _m1_createPinia, setActivePinia as _m1_setActivePinia } from 'pinia'
import { migratePoeCnAccountSettings as _m1_migratePoeCnAccountSettings, usePoeCnAccountStore as _m1_usePoeCnAccountStore } from '../src/stores/poeCnAccount.js'
import { normalizePriceCheckSettings as _m1_normalizePriceCheckSettings } from '../src/utils/priceCheckSettings.js'
import { electronApi as _m1_electronApi } from '../src/api/electron.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { existsSync as _m2_existsSync, readFileSync as _m2_readFileSync, readdirSync as _m2_readdirSync } from 'node:fs'
import _m2_path from 'node:path'
import { fileURLToPath as _m2_fileURLToPath } from 'node:url'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { readFileSync as _m3_readFileSync } from 'node:fs'
import { isSafeReleaseNotesUrl as _m3_isSafeReleaseNotesUrl, parseReleaseNotesMarkdown as _m3_parseReleaseNotesMarkdown } from '../src/utils/releaseNotesMarkdown.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { mkdtemp as _m4_mkdtemp, readFile as _m4_readFile, rm as _m4_rm, writeFile as _m4_writeFile } from 'node:fs/promises'
import _m4_os from 'node:os'
import _m4_path from 'node:path'
import { injectReleaseNotes as _m4_injectReleaseNotes, injectReleaseNotesText as _m4_injectReleaseNotesText } from '../scripts/release/injectReleaseNotes.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { mkdtemp as _m5_mkdtemp, readFile as _m5_readFile, rm as _m5_rm } from 'node:fs/promises'
import _m5_os from 'node:os'
import _m5_path from 'node:path'
import { fileURLToPath as _m5_fileURLToPath } from 'node:url'
import { configurePythonRuntime as _m5_configurePythonRuntime, detectPythonPath as _m5_detectPythonPath, detectPythonPathWithModules as _m5_detectPythonPathWithModules, resolvePythonRuntime as _m5_resolvePythonRuntime, resolvePythonRuntimeAsync as _m5_resolvePythonRuntimeAsync } from '../electron/modules/python/detector.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { readFile as _m6_readFile, mkdtemp as _m6_mkdtemp, mkdir as _m6_mkdir, writeFile as _m6_writeFile, rm as _m6_rm } from 'node:fs/promises'
import _m6_os from 'node:os'
import _m6_path from 'node:path'
import { createRequire as _m6_createRequire } from 'node:module'
import { copyRuntime as _m6_copyRuntime, inventory as _m6_inventory, assertRuntimeDistribution as _m6_assertRuntimeDistribution, assertNoFrontendPackages as _m6_assertNoFrontendPackages, assertApplicationDependencies as _m6_assertApplicationDependencies, frontendPackages as _m6_frontendPackages } from '../scripts/runtime/distribution.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import _m7_fs from 'node:fs'
import _m7_path from 'node:path'
import _m7_os from 'node:os'
import { FileWatcher as _m7_FileWatcher, fileWatcher as _m7_fileWatcher } from '../electron/modules/watcher/fileWatcher.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import _m8_fs from 'node:fs'
import _m8_os from 'node:os'
import _m8_path from 'node:path'
import { getServer as _m8_getServer, serverContext as _m8_serverContext, serverStorageKey as _m8_serverStorageKey } from '../shared/serverMode.js'
import { ServerModeController as _m8_ServerModeController } from '../electron/modules/app/serverMode.js'
import { serverChannelFailure as _m8_serverChannelFailure, installServerIpcPolicy as _m8_installServerIpcPolicy, serverShortcutAllowed as _m8_serverShortcutAllowed } from '../electron/modules/app/serverIpcPolicy.js'
import { createServerStorage as _m8_createServerStorage } from '../src/utils/serverStorage.js'
import { parseItemInfo as _m8_parseItemInfo } from '../electron/modules/item/parser.js'
import { normalizeItemTextLanguage as _m8_normalizeItemTextLanguage } from '../shared/itemTextLanguage.js'
import { PoeCnTradeClient as _m8_PoeCnTradeClient } from '../electron/modules/priceCheck/client.js'
import { PoeCnStashClient as _m8_PoeCnStashClient } from '../electron/modules/chaosRecipe/stashClient.js'
import { PoeCnAuthService as _m8_PoeCnAuthService } from '../electron/modules/chaosRecipe/auth.js'
import { isPoeCnAllowedUrl as _m8_isPoeCnAllowedUrl } from '../electron/modules/chaosRecipe/http.js'
import { createConfigBundle as _m8_createConfigBundle, parseConfigBundle as _m8_parseConfigBundle } from '../src/domains/settings/configTransfer/core.js'
import _m9_test from 'node:test'
import _m9_assert from 'node:assert/strict'
import { readFileSync as _m9_readFileSync } from 'node:fs'
import { spawnSync as _m9_spawnSync } from 'node:child_process'
import _m10_test from 'node:test'
import _m10_assert from 'node:assert/strict'
import { EventEmitter as _m10_EventEmitter } from 'node:events'
import { existsSync as _m10_existsSync, mkdtempSync as _m10_mkdtempSync, readFileSync as _m10_readFileSync, rmSync as _m10_rmSync } from 'node:fs'
import _m10_os from 'node:os'
import _m10_path from 'node:path'
import { createStartupLogger as _m10_createStartupLogger } from '../electron/modules/system/startupLog.js'
import { buildSafeModeArgs as _m10_buildSafeModeArgs, createCrashGuard as _m10_createCrashGuard, shouldRecoverStartupCrash as _m10_shouldRecoverStartupCrash } from '../electron/modules/system/crashGuard.js'
import _m11_test from 'node:test'
import _m11_assert from 'node:assert/strict'
import _m11_os from 'node:os'
import { createStartupHealth as _m11_createStartupHealth, evaluateAdministrator as _m11_evaluateAdministrator, evaluateDisplays as _m11_evaluateDisplays, evaluateGameDisplayMode as _m11_evaluateGameDisplayMode, evaluateNetworkInterfaces as _m11_evaluateNetworkInterfaces, evaluateWindowsSupport as _m11_evaluateWindowsSupport } from '../electron/modules/system/health.js'
import _m12_test from 'node:test'
import _m12_assert from 'node:assert/strict'
import { mkdtemp as _m12_mkdtemp, rm as _m12_rm } from 'node:fs/promises'
import _m12_path from 'node:path'
import _m12_os from 'node:os'
import { spawnSync as _m12_spawnSync } from 'node:child_process'
import { CraftingDataUpdater as _m12_CraftingDataUpdater } from '../electron/modules/crafting/updater.js'
import _m13_test from 'node:test'
import _m13_assert from 'node:assert/strict'
import { readFileSync as _m13_readFileSync } from 'node:fs'
import { runInNewContext as _m13_runInNewContext } from 'node:vm'

// === Merged from internationalAutomationStartup.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFileSync = _m0_readFileSync
  const vm = _m0_vm
  const serverContext = _m0_serverContext
const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

test('真实模块启动链路在国服与国际服均按保存配置恢复三类存取任务且不改持久开关', async () => {
  for (const serverId of ['international', 'cn']) {
    const disk = new Map([['bag', JSON.stringify({ moduleEnabled: true, allflameReceiverEnabled: true })], ['stash', JSON.stringify({ enabled: true })], ['junfeng', JSON.stringify({ enabled: true })]])
    const persisted = [...disk]
    let writes = 0
    let starts = 0
    const runtime = []
    const bagStore = { ...JSON.parse(disk.get('bag')), saveSettings: () => { writes++; disk.set('bag', JSON.stringify(bagStore)) } }
    const api = { events: new Proxy({}, { get: () => () => () => {} }) }
    const bagText = source('src/utils/bagService.js')
    const bagStart = bagText.indexOf('export async function initBagAutomation(')
    const bagDeclaration = bagText.slice(bagStart, bagText.indexOf('\nexport function disposeBagAutomation', bagStart)).replace('export ', '')
    const initBagAutomation = new Function('useBagStore', 'electronApi', 'startBagDetection', `let initialized = false; let disposers = []; ${bagDeclaration}; return initBagAutomation`)(
      () => bagStore, api, async () => { starts++ })
    const stores = {}
    for (const [id, file, syncName, saveName] of [
      ['stash', 'src/stores/stashPickup.js', 'syncRuntime', 'save'],
      ['junfeng', 'src/stores/junfeng.js', 'sync', 'persist']
    ]) {
      const text = source(file)
      const start = text.indexOf('async function initializeRuntime(')
      const declaration = text.slice(start, text.indexOf('\n  return {', start))
      const settings = { value: JSON.parse(disk.get(id)) }
      stores[id] = { settings, listen: () => () => {}, initializeRuntime: new Function('settings', syncName, saveName, 'loadCorrections', 'loadTrainingStatus', 'loadTrainingSessions',
        `${declaration}; return initializeRuntime`)(settings, async () => { runtime.push([id, settings.value.enabled]) }, () => { writes++; disk.set(id, JSON.stringify(settings.value)) }, async () => {}, async () => {}, async () => {}) }
    }
    const scope = {
      currentServer: serverContext(serverId), electronApi: api, initBagAutomation,
      useBagStore: () => bagStore, useStashPickupStore: () => stores.stash, useJunfengStore: () => stores.junfeng,
      useFeatureModulesStore: () => ({ enabledFeatures: [{ id: 'bag' }], isEnabled: () => true }),
      registerFeatureRuntimeAdapter: () => () => {}, setFeatureShortcutSynchronizer() {}, reportFeatureStartupEvent() {},
      ...Object.fromEntries(['useBatchCraftingStore', 'useChaosRecipeStore', 'useCombatStore', 'usePriceCheckStore', 'usePuzzleStore', 'useScriptStore', 'useStoryStore', 'useFaustusStore', 'useMapTrackerStore'].map(name => [name, () => ({})]))
    }
    const installText = source('src/features/installFeatureRuntime.js').replace(/^import\s+[\s\S]*?\sfrom\s+['"][^'"]+['"]\r?\n/gm, '').replace('export function installFeatureRuntime', 'function installFeatureRuntime')
    vm.runInNewContext(`${installText}\nglobalThis.install = installFeatureRuntime`, scope)
    const warnings = await scope.install({ router: {} }).initialize()
    assert.equal(warnings.length, 0, serverId)
    assert.equal(bagStore.moduleEnabled, true)
    assert.equal(bagStore.allflameReceiverEnabled, true)
    assert.equal(starts, 1)
    assert.deepEqual(runtime, [['stash', true], ['junfeng', true]])
    assert.equal(writes, 0)
    assert.deepEqual([...disk], persisted)
  }
})

test('战斗辅助被动喝药与主动循环的开关状态在重启时保持，且模块暂停不清除保存状态', async () => {
  const storageMap = new Map()
  const serverStorage = {
    getItem: key => storageMap.has(key) ? storageMap.get(key) : null,
    setItem: (key, value) => storageMap.set(key, String(value)),
    removeItem: key => storageMap.delete(key)
  }
  const calls = { startPotion: 0, stopPotion: 0, startLoop: 0, stopLoop: 0 }
  let potionRunning = false
  let loopRunning = false
  const combatStore = {
    running: false,
    loopRunning: false,
    applyStatus(status = {}) {
      if (status.origin === 'loop') {
        if (typeof status.running === 'boolean') this.loopRunning = status.running
      } else if (typeof status.running === 'boolean') {
        this.running = status.running
      }
    }
  }
  const settingsStore = {
    operationDelayMs: 50,
    fixedTiming: {},
    combatAssist: {
      potion: {
        health: { enabled: true, point: { x: 100, y: 200 }, keys: ['1'] },
        mana: { enabled: false, point: { x: 0, y: 0 }, keys: [] }
      },
      loop: { tickMs: 50, items: [{ id: 'a', key: '2', intervalMs: 1000, enabled: true }] },
      portal: { openKey: '', clickPoint: { x: 0, y: 0 }, waitMs: 500 }
    }
  }
  const electronApi = {
    combat: {
      onStatus: () => () => {},
      getPotionStatus: async () => ({ running: potionRunning }),
      getLoopStatus: async () => ({ running: loopRunning }),
      startPotion: async () => { calls.startPotion++; potionRunning = true; return { success: true, processId: 101 } },
      stopPotion: async () => { calls.stopPotion++; potionRunning = false; return { success: true } },
      startLoop: async () => { calls.startLoop++; loopRunning = true; return { success: true, processId: 102 } },
      stopLoop: async () => { calls.stopLoop++; loopRunning = false; return { success: true } }
    }
  }
  const combatText = source('src/utils/combatService.js')
    .replace(/^import\s+[\s\S]*?\sfrom\s+['"][^'"]+['"]\r?\n/gm, '')
    .replace(/export\s+async\s+function\s+/g, 'async function ')
    .replace(/export\s+function\s+/g, 'function ')
  const scope = {
    ElMessage: { success() {}, warning() {}, error() {} },
    electronApi,
    useSettingsStore: () => settingsStore,
    useCombatStore: () => combatStore,
    validatePotionAssist: () => ({ isValid: true, errors: [] }),
    validateLoopAssist: () => ({ isValid: true, errors: [] }),
    reportDiagnosticFailure() {},
    reportDiagnosticRecovery() {},
    runWithConfigurationGuide: async () => false,
    canUseGameInput: () => true,
    serverStorage,
    collectCombatConfigurationIssues: () => ({ ok: true, issues: [] }),
    CONFIGURATION_ACTIONS: { potion: 'potion', loop: 'loop', portal: 'portal' },
    CONFIGURATION_MODULES: { combat: 'combat' },
    console
  }
  vm.runInNewContext(`${combatText}\nglobalThis.exports = { initCombatAssist, disposeCombatAssist, startPotionAssist, stopPotionAssist, startLoopAssist, stopLoopAssist }`, scope)
  const svc = scope.exports

  assert.equal(await svc.startPotionAssist(), true)
  assert.equal(await svc.startLoopAssist(), true)
  assert.deepEqual(JSON.parse(storageMap.get('combatAssistRuntime')), { potionRunning: true, loopRunning: true })

  // 模拟模块 suspend：停止运行但不清除保存状态
  assert.equal(await svc.stopPotionAssist({ persist: false, silent: true }), true)
  assert.equal(await svc.stopLoopAssist({ persist: false, silent: true }), true)
  assert.deepEqual(JSON.parse(storageMap.get('combatAssistRuntime')), { potionRunning: true, loopRunning: true })

  // 模拟应用重启：后端状态为 false，initCombatAssist 应自动恢复启动
  potionRunning = false
  loopRunning = false
  combatStore.running = false
  combatStore.loopRunning = false
  await svc.initCombatAssist()
  assert.equal(calls.startPotion, 2)
  assert.equal(calls.startLoop, 2)
  assert.equal(combatStore.running, true)
  assert.equal(combatStore.loopRunning, true)

  // 模拟用户手动停止：持久化为 false，重启后不再自动启动
  assert.equal(await svc.stopPotionAssist(), true)
  assert.equal(await svc.stopLoopAssist(), true)
  assert.deepEqual(JSON.parse(storageMap.get('combatAssistRuntime')), { potionRunning: false, loopRunning: false })
  potionRunning = false
  loopRunning = false
  combatStore.running = false
  combatStore.loopRunning = false
  await svc.initCombatAssist()
  assert.equal(calls.startPotion, 2)
  assert.equal(calls.startLoop, 2)
  assert.equal(combatStore.running, false)
  assert.equal(combatStore.loopRunning, false)
})

test('国际服启动监听背包状态但不恢复入库检测或写入持久配置', async () => {
  const text = source('src/utils/bagService.js')
  const start = text.indexOf('export async function initBagAutomation(')
  const declaration = text.slice(start, text.indexOf('\nexport function disposeBagAutomation', start)).replace('export ', '')
  let starts = 0, saves = 0
  const store = { moduleEnabled: true, allflameReceiverEnabled: true, saveSettings: () => saves++ }
  const api = { events: new Proxy({}, { get: () => () => () => {} }) }
  const init = new Function('useBagStore', 'electronApi', 'startBagDetection', `let initialized = false; let disposers = []; ${declaration}; return initBagAutomation`)(
    () => store, api, async () => { starts++ })
  await init({ restoreEnabled: false })
  assert.equal(store.moduleEnabled, false)
  assert.equal(store.allflameReceiverEnabled, false)
  assert.equal(starts, 0)
  assert.equal(saves, 0)
})

for (const [file, syncName, saveName] of [
  ['src/stores/stashPickup.js', 'syncRuntime', 'save'],
  ['src/stores/junfeng.js', 'sync', 'persist']
]) {
  test(`${file} 国际服首次初始化关闭运行态并保留磁盘启用配置`, async () => {
    const text = source(file)
    const start = text.indexOf('async function initializeRuntime(')
    const declaration = text.slice(start, text.indexOf('\n  return {', start))
    const settings = { value: { enabled: true } }
    let writes = 0, runtimeEnabled
    const init = new Function('settings', syncName, saveName, 'loadCorrections', 'loadTrainingStatus', 'loadTrainingSessions',
      `${declaration}; return initializeRuntime`)(settings, async () => { runtimeEnabled = settings.value.enabled }, () => writes++, async () => {}, async () => {}, async () => {})
    const result = await init({ restoreEnabled: false, preserveEnabledOnFailure: true })
    assert.equal(result.success, true)
    assert.equal(runtimeEnabled, false)
    assert.equal(writes, 0)
  })
}
})()

// === Merged from poeCnAccount.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const createPinia = _m1_createPinia
  const setActivePinia = _m1_setActivePinia
  const migratePoeCnAccountSettings = _m1_migratePoeCnAccountSettings
  const usePoeCnAccountStore = _m1_usePoeCnAccountStore
  const normalizePriceCheckSettings = _m1_normalizePriceCheckSettings
  const electronApi = _m1_electronApi
function storageFrom(values = {}) {
  const data = new Map(Object.entries(values))
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value))
  }
}

test('查价器升级后缺失 enabled 时统一默认关闭', () => {
  assert.equal(normalizePriceCheckSettings({ online: true }).enabled, false)
  assert.equal(normalizePriceCheckSettings({ enabled: true }).enabled, true)
})

test('立即查价对旧设置和非法值默认关闭并保留显式选择', () => {
  assert.equal(normalizePriceCheckSettings({}).queryImmediately, false)
  assert.equal(normalizePriceCheckSettings({ queryImmediately: 'true' }).queryImmediately, false)
  assert.equal(normalizePriceCheckSettings({ queryImmediately: true }).queryImmediately, true)
})

test('旧数值下浮设置被忽略且不会进入后续保存载荷', () => {
  for (const valueRange of ['down10', 'down20', 'unlimited']) {
    const normalized = normalizePriceCheckSettings({ enabled: true, valueRange })
    assert.equal('valueRange' in normalized, false)
  }
})

test('全局赛季迁移优先商城配方并删除旧模块字段', () => {
  const storage = storageFrom({
    chaosRecipeSettings: JSON.stringify({ league: '商城赛季', selectedTabIds: ['1'] }),
    priceCheckSettings: JSON.stringify({ league: '查价赛季', enabled: true })
  })
  const migrated = migratePoeCnAccountSettings(storage)
  assert.equal(migrated.league, '商城赛季')
  assert.equal(JSON.parse(storage.data.get('chaosRecipeSettings')).league, undefined)
  assert.equal(JSON.parse(storage.data.get('priceCheckSettings')).league, undefined)
  assert.equal(JSON.parse(storage.data.get('priceCheckSettings')).enabled, true)
})

test('自动登录状态广播只触发一次赛季加载', async () => {
  const storage = storageFrom()
  globalThis.localStorage = storage
  setActivePinia(createPinia())
  const original = {
    onStatusChanged: electronApi.poeCnAccount.onStatusChanged,
    listLeagues: electronApi.poeCnAccount.listLeagues
  }
  let statusListener
  let leagueCalls = 0
  electronApi.poeCnAccount.onStatusChanged = (listener) => {
    statusListener = listener
    return () => {}
  }
  electronApi.poeCnAccount.listLeagues = async () => {
    leagueCalls += 1
    return { success: true, data: [{ id: 'S29', name: 'S29' }] }
  }
  try {
    const store = usePoeCnAccountStore()
    store.listenStatus()
    statusListener({ authenticated: true, mode: 'web', accountName: '自动账号' })
    statusListener({ authenticated: true, mode: 'web', accountName: '自动账号' })
    await new Promise((resolve) => setTimeout(resolve, 0))
    assert.equal(store.status.accountName, '自动账号')
    assert.deepEqual(store.leagues, [{ id: 'S29', name: 'S29' }])
    assert.equal(leagueCalls, 1)
  } finally {
    electronApi.poeCnAccount.onStatusChanged = original.onStatusChanged
    electronApi.poeCnAccount.listLeagues = original.listLeagues
    delete globalThis.localStorage
  }
})
})()

// === Merged from releaseContract.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const existsSync = _m2_existsSync
  const readFileSync = _m2_readFileSync
  const readdirSync = _m2_readdirSync
  const path = _m2_path
  const fileURLToPath = _m2_fileURLToPath
const source = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8')
const projectRoot = fileURLToPath(new URL('..', import.meta.url))

function javascriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return javascriptFiles(entryPath)
    return entry.isFile() && /\.(?:c?js|mjs)$/.test(entry.name) ? [entryPath] : []
  })
}

function packagedByRule(relativePath, rules) {
  const normalized = relativePath.replaceAll('\\', '/')
  return rules.some(rule => {
    const normalizedRule = rule.replaceAll('\\', '/')
    if (normalizedRule.startsWith('!')) return false
    if (normalizedRule.endsWith('/**/*')) return normalized.startsWith(normalizedRule.slice(0, -4))
    return normalized === normalizedRule
  })
}

test('发布资产名称、版本标签与校验文件形成稳定契约', () => {
  const packageConfig = JSON.parse(source('../package.json'))
  assert.equal(packageConfig.build.artifactName, 'PoE-CN-Helper-${version}-win-${arch}-setup.${ext}')
  assert.deepEqual(packageConfig.build.win.publish, {
    provider: 'generic',
    url: 'https://cnb.cool/Auto-Tool-MX/POE-TOOL-MX/-/releases/latest/download'
  })
  assert.equal(packageConfig.scripts['release:check'], 'node scripts/release/checkVersion.js')
  assert.equal(packageConfig.scripts['release:checksum'], 'node scripts/release/checksum.js')
  assert.equal(packageConfig.scripts['release:notes'], 'node scripts/release/injectReleaseNotes.js')
  assert.match(packageConfig.scripts['release:win'], /electron-builder[\s\S]*npm run release:notes[\s\S]*npm run release:smoke/)
  assert.equal(packageConfig.scripts['release:smoke'], 'node scripts/release/smokePackage.js')
  assert.match(source('../scripts/release/checkVersion.js'), /tag !== expectedTag/)
  assert.match(source('../scripts/release/checksum.js'), /SHA256SUMS\.txt/)
  assert.match(source('../scripts/release/smokePackage.js'), /runtime-ok/)
})

test('Windows CI 与标签发布固定 Action 提交并使用最小化权限', () => {
  const ci = source('../.github/workflows/windows-ci.yml')
  const release = source('../.github/workflows/release.yml')
  assert.match(ci, /permissions:\s*\n\s*contents: read/)
  assert.match(ci, /npm run runtime:prepare/)
  assert.match(ci, /npm run release:smoke/)
  assert.match(release, /tags:\s*\n\s*- "v\*"/)
  assert.match(release, /actions\/checkout@[a-f0-9]{40}[\s\S]*?fetch-depth:\s*0/)
  assert.match(release, /contents: write/)
  assert.match(release, /id-token: write/)
  assert.match(release, /attestations: write/)
  assert.match(release, /SHA256SUMS\.txt/)
  assert.match(release, /latest\.yml/)
  assert.match(release, /\.blockmap/)
  assert.match(release, /latest\.yml version does not match package version/)
  assert.match(release, /npm run release:notes/)
  assert.match(release, /latest\.yml does not contain non-empty release notes/)
  assert.match(release, /THIRD_PARTY_NOTICES\.md/)
  assert.match(release, /\$notesFile = "docs\/release-notes\/v\$version\.md"/)
  assert.match(release, /--notes-file", \$notesFile/)
  assert.match(release, /actions\/attest-build-provenance@[a-f0-9]{40}/)
  assert.doesNotMatch(`${ci}\n${release}`, /uses:\s+\S+@(v\d+|main|master)\s*$/m)
})

test('发布元数据脚本要求版本化说明并写入单一 latest.yml', () => {
  const script = source('../scripts/release/injectReleaseNotes.js')
  assert.match(script, /docs', 'release-notes'/)
  assert.match(script, /dist-electron', 'latest\.yml'/)
  assert.match(script, /releaseNotes: \|-/)
  assert.match(script, /发布说明为空/)
})

test('GitHub 正式发布后才同步 CNB 标签且凭据不进入远程地址', () => {
  const release = source('../.github/workflows/release.yml')
  const credentialIndex = release.indexOf('- name: Check CNB mirror credentials')
  const publishIndex = release.indexOf('- name: Publish GitHub Release')
  const syncIndex = release.indexOf('- name: Sync release tag to CNB')
  const branchPushIndex = release.indexOf('HEAD:refs/heads/${{ github.event.repository.default_branch }}', syncIndex)
  const tagPushIndex = release.indexOf('refs/tags/${{ github.ref_name }}:refs/tags/${{ github.ref_name }}', syncIndex)

  assert.ok(credentialIndex >= 0 && publishIndex > credentialIndex && syncIndex > publishIndex)
  assert.ok(branchPushIndex > syncIndex && tagPushIndex > branchPushIndex)
  assert.match(release, /CNB_TOKEN:\s*\$\{\{ secrets\.CNB_TOKEN \}\}/)
  assert.match(release, /https:\/\/cnb\.cool\/Auto-Tool-MX\/POE-TOOL-MX/)
  assert.match(release, /push --force \$remote "refs\/tags\//)
  assert.doesNotMatch(release, /push --force \$remote "HEAD:refs\/heads\//)
  assert.doesNotMatch(release, /https:\/\/cnb:[^@\s]+@cnb\.cool/)
})

test('CNB 标签流水线只镜像并验证完整发布内容', () => {
  const pipeline = source('../.cnb.yml')
  const requiredAssets = [
    'PoE-CN-Helper-${version}-win-x64-setup.exe',
    '"$installer.blockmap"',
    'latest.yml',
    'SHA256SUMS.txt',
    'THIRD_PARTY_NOTICES.md'
  ]
  for (const asset of requiredAssets) {
    const escapedAsset = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    assert.match(pipeline, new RegExp(escapedAsset))
  }

  const createIndex = pipeline.indexOf('name: Create CNB Release')
  const uploadIndex = pipeline.indexOf('name: Upload CNB Release assets')
  const latestIndex = pipeline.indexOf('name: Mark CNB Release as latest')
  const notesIndex = pipeline.indexOf('notes="docs/release-notes/${tag}.md"')
  assert.ok(createIndex >= 0 && uploadIndex > createIndex && latestIndex > uploadIndex)
  assert.ok(notesIndex >= 0 && notesIndex < createIndex)
  assert.match(pipeline, /sha256sum --check --strict SHA256SUMS\.txt/)
  assert.match(pipeline, /test -s "\$notes"/)
  assert.match(pipeline, /cp "\$notes" CNB_RELEASE_NOTES\.md/)
  assert.equal((pipeline.match(/descriptionFromFile:\s*CNB_RELEASE_NOTES\.md/g) || []).length, 2)
  assert.doesNotMatch(pipeline, /description:\s*"GitHub Release 国内同步镜像"/)
  assert.match(pipeline, /overlying:\s*true/)
  assert.match(pipeline, /latest:\s*true/)
  assert.doesNotMatch(pipeline, /electron-builder|npm run build|CNB_TOKEN/)
})

test('正式包包含 Electron 主进程引用的源码模块依赖闭包', () => {
  const packageConfig = JSON.parse(source('../package.json'))
  const srcRoot = path.join(projectRoot, 'src')
  const queue = javascriptFiles(path.join(projectRoot, 'electron'))
  const visited = new Set()
  const missing = new Set()

  while (queue.length) {
    const filePath = queue.pop()
    if (visited.has(filePath)) continue
    visited.add(filePath)
    const contents = readFileSync(filePath, 'utf8')
    const imports = contents.matchAll(/(?:from\s+|import\s*\()\s*['"]([^'"]+)['"]/g)
    for (const [, specifier] of imports) {
      if (!specifier.startsWith('.')) continue
      const dependency = path.resolve(path.dirname(filePath), specifier)
      if (!existsSync(dependency)) continue
      if (dependency.startsWith(`${srcRoot}${path.sep}`)) {
        const relativePath = path.relative(projectRoot, dependency)
        if (!packagedByRule(relativePath, packageConfig.build.files)) missing.add(relativePath)
      }
      if (/\.(?:c?js|mjs)$/.test(dependency)) queue.push(dependency)
    }
  }

  assert.deepEqual([...missing].sort(), [])
})
})()

// === Merged from releaseNotesMarkdown.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const readFileSync = _m3_readFileSync
  const isSafeReleaseNotesUrl = _m3_isSafeReleaseNotesUrl
  const parseReleaseNotesMarkdown = _m3_parseReleaseNotesMarkdown
function inlineText(nodes = []) {
  return nodes.map(node => node.value || '').join('')
}

test('发布说明解析常用块级与行内 Markdown', () => {
  const blocks = parseReleaseNotesMarkdown([
    '# 版本标题',
    '',
    '包含 **粗体**、*斜体*、`code` 和 [文档](https://example.com/docs)。',
    '',
    '- 第一项',
    '- 第二项',
    '',
    '3. 第三项',
    '4. 第四项'
  ].join('\n'))

  assert.equal(blocks[0].type, 'heading')
  assert.equal(blocks[0].level, 1)
  assert.equal(inlineText(blocks[0].children), '版本标题')
  assert.deepEqual(blocks[1].children.map(node => node.type), [
    'text', 'strong', 'text', 'emphasis', 'text', 'code', 'text', 'link', 'text'
  ])
  assert.equal(blocks[1].children[7].href, 'https://example.com/docs')
  assert.deepEqual(blocks[2], {
    type: 'list',
    ordered: false,
    items: [
      [{ type: 'text', value: '第一项' }],
      [{ type: 'text', value: '第二项' }]
    ]
  })
  assert.equal(blocks[3].type, 'list')
  assert.equal(blocks[3].ordered, true)
  assert.equal(blocks[3].start, 3)
  assert.equal(blocks[3].items.length, 2)
})

test('实际 1.2.2 发布说明保留标题和列表层级', () => {
  const releaseNotes = readFileSync(new URL('../docs/release-notes/v1.2.2.md', import.meta.url), 'utf8')
  const blocks = parseReleaseNotesMarkdown(releaseNotes)
  assert.equal(blocks[0].type, 'heading')
  assert.equal(blocks[0].level, 1)
  assert.ok(blocks.filter(block => block.type === 'heading' && block.level === 2).length >= 5)
  assert.ok(blocks.filter(block => block.type === 'list').length >= 5)
  assert.match(JSON.stringify(blocks), /反馈与通知/)
  assert.match(JSON.stringify(blocks), /稳定性/)
})

test('畸形与不支持语法保留可读原文', () => {
  const source = '###没有空格\n未闭合 **粗体\n> 引用保留\n```js'
  const blocks = parseReleaseNotesMarkdown(source)
  assert.equal(blocks.length, 1)
  assert.equal(blocks[0].type, 'paragraph')
  assert.equal(inlineText(blocks[0].children), source)
})

test('原始 HTML 和危险链接只能降级为文字', () => {
  const source = '<img src=x onerror="alert(1)"> [安全](https://example.com) [脚本](javascript:evil) [文件](file:///tmp/a) [数据](data:text/html,x)'
  const blocks = parseReleaseNotesMarkdown(source)
  const nodes = blocks[0].children
  assert.equal(nodes.filter(node => node.type === 'link').length, 1)
  assert.equal(nodes.find(node => node.type === 'link').href, 'https://example.com')
  assert.match(inlineText(nodes), /<img src=x onerror="alert\(1\)">/)
  assert.match(inlineText(nodes), /脚本/)
  assert.equal(JSON.stringify(blocks).includes('innerHTML'), false)
})

test('发布说明链接仅允许 HTTP(S) 绝对地址', () => {
  assert.equal(isSafeReleaseNotesUrl('https://example.com/a'), true)
  assert.equal(isSafeReleaseNotesUrl('http://example.com'), true)
  assert.equal(isSafeReleaseNotesUrl('javascript:alert(1)'), false)
  assert.equal(isSafeReleaseNotesUrl('data:text/html,x'), false)
  assert.equal(isSafeReleaseNotesUrl('file:///tmp/a'), false)
  assert.equal(isSafeReleaseNotesUrl('/relative'), false)
  assert.equal(isSafeReleaseNotesUrl('not a url'), false)
})
})()

// === Merged from releaseNotesMetadata.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const mkdtemp = _m4_mkdtemp
  const readFile = _m4_readFile
  const rm = _m4_rm
  const writeFile = _m4_writeFile
  const os = _m4_os
  const path = _m4_path
  const injectReleaseNotes = _m4_injectReleaseNotes
  const injectReleaseNotesText = _m4_injectReleaseNotesText
const METADATA = `version: 1.0.6
files:
  - url: app.exe
    sha512: abc
releaseDate: '2026-08-22T00:00:00.000Z'
`

test('发布说明以 YAML 多行纯文本注入且可幂等替换', () => {
  const notes = '# 更新\n\n- 修复: A\n- 保留 # 和 "引号"'
  const first = injectReleaseNotesText(METADATA, notes, '1.0.6')
  assert.match(first, /releaseNotes: \|-\n  # 更新\n  \n  - 修复: A\n  - 保留 # 和 "引号"/)
  const second = injectReleaseNotesText(first, '新内容', '1.0.6')
  assert.equal((second.match(/^releaseNotes:/gm) || []).length, 1)
  assert.match(second, /releaseNotes: \|-\n  新内容/)
  assert.doesNotMatch(second, /保留 #/)
})
test('发布说明为空或元数据版本不匹配时拒绝', () => {
  assert.throws(() => injectReleaseNotesText(METADATA, '  \n', '1.0.6'), /发布说明为空/)
  assert.throws(() => injectReleaseNotesText(METADATA, '内容', '1.0.7'), /版本不匹配/)
})

test('发布说明文件缺失时不改写 latest.yml', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-release-notes-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const metadataPath = path.join(root, 'latest.yml')
  await writeFile(metadataPath, METADATA, 'utf8')
  await assert.rejects(injectReleaseNotes({ metadataPath, notesPath: path.join(root, 'missing.md'), expectedVersion: '1.0.6' }), /ENOENT/)
  assert.equal(await readFile(metadataPath, 'utf8'), METADATA)
})

test('文件注入成功后 latest.yml 包含非空说明', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-release-notes-success-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const metadataPath = path.join(root, 'latest.yml')
  const notesPath = path.join(root, 'v1.0.6.md')
  await writeFile(metadataPath, METADATA, 'utf8')
  await writeFile(notesPath, '修复启动问题\n', 'utf8')
  await injectReleaseNotes({ metadataPath, notesPath, expectedVersion: '1.0.6' })
  assert.match(await readFile(metadataPath, 'utf8'), /releaseNotes: \|-\n  修复启动问题/)
})
})()

// === Merged from runtimeDistribution.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const mkdtemp = _m5_mkdtemp
  const readFile = _m5_readFile
  const rm = _m5_rm
  const os = _m5_os
  const path = _m5_path
  const fileURLToPath = _m5_fileURLToPath
  const configurePythonRuntime = _m5_configurePythonRuntime
  const detectPythonPath = _m5_detectPythonPath
  const detectPythonPathWithModules = _m5_detectPythonPathWithModules
  const resolvePythonRuntime = _m5_resolvePythonRuntime
  const resolvePythonRuntimeAsync = _m5_resolvePythonRuntimeAsync
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const generatedRoot = path.join(projectRoot, '.runtime')

test('开发环境优先使用已准备且满足模块要求的内置运行时', () => {
  configurePythonRuntime({ isPackaged: false, resourcesPath: '', env: {} })
  const runtime = resolvePythonRuntime(['cv2', 'mss', 'numpy', 'pynput', 'pyperclip', 'rapidocr', 'onnxruntime'])
  assert.equal(runtime.ready, true)
  assert.equal(runtime.source, 'prepared')
  assert.equal(runtime.version, '3.13.14')
  assert.match(runtime.path, /[\\/]\.runtime[\\/]python-runtime[\\/]python\.exe$/)
  assert.equal(detectPythonPath(), runtime.path)
  assert.equal(detectPythonPathWithModules(['numpy']), runtime.path)
})

test('异步运行时探测复用并发任务并返回相同缓存结果', async () => {
  configurePythonRuntime({ isPackaged: false, resourcesPath: '', env: {} })
  const first = resolvePythonRuntimeAsync(['sys', 'json'])
  const second = resolvePythonRuntimeAsync(['json', 'sys'])
  assert.strictEqual(first, second)
  const runtime = await first
  assert.equal(runtime.ready, true)
  assert.strictEqual(await resolvePythonRuntimeAsync(['sys', 'json']), runtime)
})

test('正式版只使用 resourcesPath 下的 bundled 运行时', () => {
  configurePythonRuntime({ isPackaged: true, resourcesPath: generatedRoot, env: { POE_PYTHON_RUNTIME: 'C:\\other\\python.exe' } })
  const runtime = resolvePythonRuntime(['sys', 'json'])
  assert.equal(runtime.ready, true)
  assert.equal(runtime.source, 'bundled')
  assert.equal(runtime.path, path.join(generatedRoot, 'python-runtime', 'python.exe'))
})

test('正式版内置运行时缺失时返回结构化错误且不回退系统 Python', async () => {
  const emptyRoot = await mkdtemp(path.join(os.tmpdir(), 'poe-runtime-missing-'))
  try {
    configurePythonRuntime({ isPackaged: true, resourcesPath: emptyRoot, env: { POE_PYTHON_RUNTIME: 'python' } })
    const runtime = resolvePythonRuntime(['sys'])
    assert.deepEqual({
      ready: runtime.ready,
      found: runtime.found,
      source: runtime.source,
      path: runtime.path
    }, {
      ready: false,
      found: false,
      source: 'bundled',
      path: null
    })
    assert.match(runtime.error, /内置 Python 运行时缺失或损坏/)
  } finally {
    await rm(emptyRoot, { recursive: true, force: true })
  }
})

test('打包配置固定携带 x64 运行时并由 beforePack 强制验证', async () => {
  const packageConfig = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'))
  assert.equal(packageConfig.devDependencies.electron, '43.0.0')
  assert.equal(packageConfig.devDependencies['electron-builder'], '26.15.3')
  assert.equal(packageConfig.build.beforePack, 'scripts/runtime/beforePack.cjs')
  assert.ok(packageConfig.build.extraResources.some((entry) => (
    entry.from === '.runtime/python-runtime' && entry.to === 'python-runtime'
  )))
  assert.ok(packageConfig.build.extraResources.some((entry) => (
    entry.from === 'src/assets/scripts/stash_tab_selector.py' && entry.to === 'stash_tab_selector.py'
  )))
  assert.deepEqual(packageConfig.build.win.target, [{ target: 'nsis', arch: ['x64'] }])
  assert.equal(packageConfig.build.win.requestedExecutionLevel, 'asInvoker')
})
})()

// === Merged from runtimeDistributionFilter.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const readFile = _m6_readFile
  const mkdtemp = _m6_mkdtemp
  const mkdir = _m6_mkdir
  const writeFile = _m6_writeFile
  const rm = _m6_rm
  const os = _m6_os
  const path = _m6_path
  const createRequire = _m6_createRequire
  const copyRuntime = _m6_copyRuntime
  const inventory = _m6_inventory
  const assertRuntimeDistribution = _m6_assertRuntimeDistribution
  const assertNoFrontendPackages = _m6_assertNoFrontendPackages
  const assertApplicationDependencies = _m6_assertApplicationDependencies
  const frontendPackages = _m6_frontendPackages
const config = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const { FileMatcher, copyFiles } = createRequire(import.meta.url)('app-builder-lib/out/fileMatcher.js')

test('分发清单匹配打包器实际复制：忽略占位文件但检测模型缺失', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-builder-filter-'))
  const source = path.join(root, 'source')
  const destination = path.join(root, 'copy')
  const model = 'Lib/site-packages/rapidocr/models/model.onnx'
  const placeholders = ['.gitkeep', 'Lib/site-packages/rapidocr/models/.gitkeep', 'Lib/.DS_Store']
  try {
    for (const name of [model, 'python313.dll', ...placeholders]) {
      await mkdir(path.dirname(path.join(source, name)), { recursive: true })
      await writeFile(path.join(source, name), 'fixture')
    }
    const resource = config.build.extraResources.find(entry => entry.to === 'python-runtime')
    await copyFiles([new FileMatcher(source, destination, value => value, resource.filter)], null, false)
    assert.deepEqual((await inventory(destination)).map(entry => entry.path).sort(), [model, 'python313.dll'].sort())
    await assertRuntimeDistribution(source, destination, config)
    await rm(path.join(destination, model))
    await assert.rejects(assertRuntimeDistribution(source, destination, config), /model.onnx/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('分发副本排除测试和缓存，保留运行模块、元数据、许可证与模型，源文件不变', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-filter-'))
  const source = path.join(root, 'source')
  const destination = path.join(root, 'copy')
  const retained = ['python.exe', 'LICENSE.txt', 'python313.dll', 'Lib/site-packages/numpy/testing/__init__.py',
    'Lib/site-packages/numpy/_core/_multiarray_umath.pyd', 'Lib/site-packages/numpy.libs/blas.dll',
    'Lib/site-packages/numpy-2.5.1.dist-info/METADATA', 'Lib/site-packages/numpy-2.5.1.dist-info/licenses/LICENSE.txt',
    'Lib/site-packages/rapidocr/models/model.onnx', 'Lib/site-packages/rapidocr/config.yaml',
    'Lib/site-packages/certifi/cacert.pem', 'Lib/site-packages/another/tests/required.py']
  const excluded = ['__pycache__/file.pyc', 'orphan.pyc', 'orphan.pyo',
    'Lib/site-packages/numpy/_core/tests/test_math.py', 'Lib/site-packages/numpy/tests/test_import.py',
    'Lib/site-packages/shapely/tests/test_geometry.py', 'Lib/site-packages/colorama/tests/test_colour.py',
    'Lib/site-packages/certifi/tests/test_cert.py']
  try {
    for (const name of [...retained, ...excluded]) {
      await mkdir(path.dirname(path.join(source, name)), { recursive: true })
      await writeFile(path.join(source, name), 'fixture')
    }
    const before = await inventory(source)
    await copyRuntime(source, destination, config)
    assert.deepEqual((await inventory(destination)).map(file => file.path).sort(), retained.sort())
    assert.deepEqual(await inventory(source), before)
    await assertRuntimeDistribution(source, destination, config)
    await writeFile(path.join(destination, 'orphan.pyc'), 'bad')
    await assert.rejects(assertRuntimeDistribution(source, destination, config), /orphan.pyc/)
    await rm(path.join(destination, 'orphan.pyc'))
    await rm(path.join(destination, 'python313.dll'))
    await assert.rejects(assertRuntimeDistribution(source, destination, config), /python313.dll/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('生产闭包不含渲染端包，发布检查也拒绝嵌套与 scoped 依赖', async () => {
  const lock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'))
  assertNoFrontendPackages(Object.entries(lock.packages).filter(([name, info]) => name && !info.dev).map(([name]) => name))
  for (const name of frontendPackages) {
    assert.ok(config.devDependencies[name])
    assert.equal(config.dependencies[name], undefined)
    assert.throws(() => assertNoFrontendPackages([`/node_modules/parent/node_modules/${name}/package.json`]), /前端依赖/)
  }
  assertNoFrontendPackages(['/dist/assets/vue.js', '/node_modules/vue-like/package.json'])
  const runtimePaths = Object.keys(config.dependencies).map(name => `/node_modules/${name}/package.json`)
  assertApplicationDependencies(runtimePaths, config)
  assert.throws(() => assertApplicationDependencies(runtimePaths.filter(entry => !entry.includes('/yauzl/')), config), /缺少主进程依赖: yauzl/)
  for (const name of ['cheerio', 'cn-poe-utils', 'electron-updater', 'yauzl']) {
    assert.ok(config.dependencies[name])
    assert.ok(import.meta.resolve(name))
  }
})
})()

// === Merged from serverAutomationFiles.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const fs = _m7_fs
  const path = _m7_path
  const os = _m7_os
  const FileWatcher = _m7_FileWatcher
  const fileWatcher = _m7_fileWatcher
test('国际服脚本与通信文件单独保存，国服默认路径兼容', t => {
  assert.equal(fileWatcher.getFilePaths().tempDir, path.join(os.tmpdir(), 'exile-helper'))
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'international-automation-files-'))
  const watcher = new FileWatcher(path.join(root, 'cn'))
  t.after(() => {
    watcher.stopFileWatcher()
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()))
    fs.rmSync(root, { recursive: true, force: true })
  })
  const original = watcher.getFilePaths()
  fs.writeFileSync(original.itemInfoFile, 'cn-content')
  watcher.configureDirectory(path.join(root, 'servers/international/automation'))
  const international = watcher.getFilePaths()
  assert.notEqual(international.itemInfoFile, original.itemInfoFile)
  watcher.startFileWatcher({ mode: 'items' })
  assert.throws(() => watcher.configureDirectory(path.join(root, 'other')), /必须停止/)
  assert.equal(fs.readFileSync(original.itemInfoFile, 'utf8'), 'cn-content')
  assert.equal(JSON.parse(fs.readFileSync(international.itemInfoFile, 'utf8')).clipboard, '')
})
})()

// === Merged from serverMode.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const fs = _m8_fs
  const os = _m8_os
  const path = _m8_path
  const getServer = _m8_getServer
  const serverContext = _m8_serverContext
  const serverStorageKey = _m8_serverStorageKey
  const ServerModeController = _m8_ServerModeController
  const serverChannelFailure = _m8_serverChannelFailure
  const installServerIpcPolicy = _m8_installServerIpcPolicy
  const serverShortcutAllowed = _m8_serverShortcutAllowed
  const createServerStorage = _m8_createServerStorage
  const parseItemInfo = _m8_parseItemInfo
  const normalizeItemTextLanguage = _m8_normalizeItemTextLanguage
  const PoeCnTradeClient = _m8_PoeCnTradeClient
  const PoeCnStashClient = _m8_PoeCnStashClient
  const PoeCnAuthService = _m8_PoeCnAuthService
  const isPoeCnAllowedUrl = _m8_isPoeCnAllowedUrl
  const createConfigBundle = _m8_createConfigBundle
  const parseConfigBundle = _m8_parseConfigBundle
const memory = () => {
  const map = new Map()
  return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) }
}
const rootFor = t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'poe-server-mode-test-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  return root
}

test('默认国服，国际服独立描述，未知服务器拒绝', () => {
  assert.equal(getServer().partition, 'persist:poe-cn-auth')
  assert.equal(getServer('international').language, 'en')
  assert.throws(() => getServer('other'))
  const capabilities = serverContext('international').capabilities
  assert.ok(['account', 'pob-export'].every(key => capabilities[key].available && capabilities[key].gameInputAvailable === false))
  assert.equal(capabilities.items.available, true)
  assert.equal(capabilities.items.gameInputAvailable, true)
  assert.equal(capabilities.items.state, 'ready')
  assert.equal(capabilities.sanctum.available, true)
})

test('严格停止失败不写模式，成功后重启，运行中上下文不热切换', async t => {
  const root = rootFor(t)
  let restarted = false
  const failed = new ServerModeController({ userDataPath: root, cleanup: () => { throw Error('stop') }, restart: () => { restarted = true } })
  assert.equal((await failed.switchTo('international')).success, false)
  assert.equal(restarted, false)
  assert.equal(fs.existsSync(path.join(root, 'server-mode.json')), false)
  const controller = new ServerModeController({ userDataPath: root, cleanup: async () => {}, restart: () => { restarted = true } })
  assert.equal((await controller.switchTo('international')).success, true)
  assert.equal(restarted, true)
  assert.equal(controller.context.id, 'cn')
  const restored = new ServerModeController({ userDataPath: root })
  assert.equal(restored.context.id, 'international')
  assert.equal(restored.dataPath('calibration'), path.join(root, 'servers', 'international', 'calibration'))
})

test('重启失败回滚目标模式且拒绝并发切换', async t => {
  const root = rootFor(t)
  let release
  const controller = new ServerModeController({ userDataPath: root, cleanup: () => new Promise(resolve => { release = resolve }), restart: () => { throw Error('restart') } })
  const pending = controller.switchTo('international')
  assert.equal((await controller.switchTo('international')).success, false)
  await Promise.resolve()
  release()
  assert.equal((await pending).success, false)
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'server-mode.json'))).server, 'cn')
})

test('停止超时期间保持门禁，迟到停止完成后可继续使用当前服或重新切换', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const root = rootFor(t)
  const file = path.join(root, 'server-mode.json')
  fs.writeFileSync(file, JSON.stringify({ server: 'cn' }))
  const stopped = Promise.withResolvers()
  let stopCalls = 0
  let prepareCalls = 0
  let restartCalls = 0
  const controller = new ServerModeController({
    userDataPath: root,
    cleanup: () => {
      stopCalls += 1
      return stopped.promise
    },
    prepareCleanup: () => { prepareCalls += 1 },
    restart: () => { restartCalls += 1 }
  })
  const pending = controller.switchTo('international')
  t.mock.timers.tick(15_000)
  assert.equal((await pending).success, false)
  assert.equal(serverChannelFailure(controller.context, 'combat-start-loop', controller.switching).code, 'SERVER_SWITCHING')
  assert.equal(serverChannelFailure(controller.context, 'emergency-stop-all', controller.switching), null)
  assert.equal(serverShortcutAllowed(controller.context, 'itemStart', controller.switching), false)
  assert.equal((await controller.switchTo('international')).success, false)
  assert.equal(stopCalls, 1)

  stopped.resolve()
  await new Promise(setImmediate)
  assert.equal(controller.switching, false)
  assert.equal(prepareCalls, 0)
  assert.equal(restartCalls, 0)
  assert.equal(JSON.parse(fs.readFileSync(file)).server, 'cn')
  assert.equal(serverChannelFailure(controller.context, 'combat-start-loop', controller.switching), null)
  assert.equal((await controller.switchTo('international')).success, true)
  assert.equal(stopCalls, 2)
  assert.equal(prepareCalls, 1)
  assert.equal(restartCalls, 1)
  assert.equal(JSON.parse(fs.readFileSync(file)).server, 'international')
})

test('关闭资源超时后保留旧服并继续封锁业务，完成后仅允许显式重试', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const root = rootFor(t)
  const file = path.join(root, 'server-mode.json')
  fs.writeFileSync(file, JSON.stringify({ server: 'cn' }))
  const finalizing = Promise.withResolvers()
  const finalized = Promise.withResolvers()
  let finalizeCalls = 0
  let restartCalls = 0
  const controller = new ServerModeController({
    userDataPath: root,
    cleanup: () => {},
    finalizeCleanup: () => {
      finalizeCalls += 1
      finalizing.resolve()
      return finalized.promise
    },
    restart: () => { restartCalls += 1 }
  })
  const pending = controller.switchTo('international')
  await finalizing.promise
  t.mock.timers.tick(15_000)
  assert.equal((await pending).success, false)
  assert.equal((await controller.switchTo('international')).success, false)
  assert.equal(controller.switching, true)

  finalized.resolve()
  await new Promise(setImmediate)
  assert.equal(controller.switching, true)
  assert.equal(controller.restartRequired, true)
  assert.equal(serverChannelFailure(controller.context, 'window-close', controller.switching), null)
  assert.equal(serverChannelFailure(controller.context, 'combat-start-loop', controller.switching).code, 'SERVER_SWITCHING')
  assert.equal(restartCalls, 0)
  assert.equal(JSON.parse(fs.readFileSync(file)).server, 'cn')
  assert.equal((await controller.switchTo('international')).success, true)
  assert.equal(finalizeCalls, 1)
  assert.equal(restartCalls, 1)
  assert.equal(JSON.parse(fs.readFileSync(file)).server, 'international')
})

test('应用资源关闭失败后拒绝切换与业务请求，保留退出入口及原服务器', async t => {
  const root = rootFor(t)
  const file = path.join(root, 'server-mode.json')
  const controller = new ServerModeController({
    userDataPath: root,
    cleanup: () => {},
    finalizeCleanup: () => { throw new Error('teardown') },
    restart: () => assert.fail('资源关闭失败时不应重启')
  })
  assert.match((await controller.switchTo('international')).error, /退出并重新打开/)
  assert.match((await controller.switchTo('international')).error, /退出并重新打开/)
  assert.equal(controller.switching, true)
  assert.equal(controller.context.id, 'cn')
  assert.equal(fs.existsSync(file), false)
  assert.equal(serverChannelFailure(controller.context, 'window-close', controller.switching), null)
})

test('已有国服配置保留，五大模块预设与战斗配置共享，坐标与当前选中预设独立', () => {
  const storage = memory()
  const cn = createServerStorage(storage, 'cn')
  const international = createServerStorage(storage, 'international')
  cn.setItem('settings', JSON.stringify({ globalShortcuts: { end: 'F12' }, inventory: { startX: 99 }, overlaySettings: { opacity: 0.5 }, combatAssist: { portal: { openKey: 'F4', clickPoint: { x: 960, y: 540 }, waitMs: 500 } } }))
  cn.setItem('itemPresets', '共享预设')
  cn.setItem('currentItemPresetId', 'cn-preset')
  const initial = JSON.parse(international.getItem('settings'))
  assert.equal(initial.inventory, undefined)
  assert.equal(initial.globalShortcuts.end, 'F12')
  assert.equal(initial.combatAssist.portal.openKey, 'F4')
  assert.equal(international.getItem('itemPresets'), '共享预设')
  assert.equal(international.getItem('currentItemPresetId'), null)
  international.setItem('settings', JSON.stringify({ ...initial, inventory: { startX: 200 }, globalShortcuts: { end: 'F11' } }))
  assert.equal(JSON.parse(cn.getItem('settings')).inventory.startX, 99)
  assert.equal(JSON.parse(cn.getItem('settings')).globalShortcuts.end, 'F11')
  assert.equal(JSON.parse(international.getItem('settings')).inventory.startX, 200)
  assert.equal(serverStorageKey('poeCnAccountSettings', 'cn'), 'poeCnAccountSettings')
})

test('国际服直接 IPC 和浮窗不能绕过门禁，切换时国服也拒绝新任务，停止始终可用', async () => {
  assert.equal(serverChannelFailure(serverContext(), 'execute-python'), null)
  for (const channel of ['execute-python', 'generate-and-execute-script', 'crafting-create-manual-session', 'puzzle-analyze']) {
    assert.equal(serverChannelFailure(serverContext('international'), channel).code, 'SERVER_FEATURE_UNAVAILABLE')
  }
  assert.equal(serverChannelFailure(serverContext(), 'execute-python', true).code, 'SERVER_SWITCHING')
  assert.equal(serverChannelFailure(serverContext(), 'emergency-stop-all', true), null)
  for (const channel of ['price-check-text', 'price-check-load-more', 'pob-export-build', 'chaos-recipe-refresh']) assert.equal(serverChannelFailure(serverContext('international'), channel), null)
  assert.equal(serverChannelFailure(serverContext('international'), 'chaos-recipe-runtime-update', false, [{ enabled: false }]), null)
  for (const enabled of [true, 'true', 1]) assert.equal(serverChannelFailure(serverContext('international'), 'chaos-recipe-runtime-update', false, [{ enabled }]), null)
  const handlers = new Map()
  const ipc = { handle: (channel, handler) => handlers.set(channel, handler), on() {} }
  installServerIpcPolicy(ipc, { context: serverContext('international') })
  let ran = false
  ipc.handle('execute-python', () => { ran = true })
  assert.equal((await handlers.get('execute-python')({})).success, false)
  assert.equal(ran, false)
})

test('英文物品只归一化结构字段，保留英文身份与词缀，并与中文属性等价', () => {
  const english = 'Item Class: Body Armours\nRarity: Rare\nDoom Shell\nAstral Plate\n--------\nQuality: +20%\nArmour: 1200\n--------\nItem Level: 86\n--------\n+100 to maximum Life\nCorrupted'
  const chinese = normalizeItemTextLanguage(english)
  assert.ok(chinese.includes('+100 to maximum Life'))
  const parsed = parseItemInfo(english)
  assert.equal(parsed.category, '胸甲')
  assert.equal(parsed.rarity, '稀有')
  assert.equal(parsed.name, 'Doom Shell')
  assert.equal(parsed.baseName, 'Astral Plate')
  assert.equal(parsed.quality, 20)
  assert.equal(parsed.armour, 1200)
  assert.equal(parsed.level, 86)
  assert.equal(parsed.isCorrupted, true)
  assert.equal(parsed.itemTextLanguage, 'en')
  assert.deepEqual({ ...parsed, itemTextLanguage: 'zh-CN' }, parseItemInfo(chinese))
  assert.ok(parsed.explicitMods.includes('+100 to maximum Life'))
})

test('英文高级词缀保留类型、等阶与原文', () => {
  const item = parseItemInfo('Item Class: Rings\nRarity: Rare\nDoom Circle\nCoral Ring\n--------\nItem Level: 86\n--------\n{ Prefix Modifier "Healthy" (Tier: 1) — Life }\n+79 to maximum Life')
  assert.equal(item.category, '戒指')
  assert.ok(item.modifiers.some(mod => mod.affixType === 'prefix' && mod.tier === 1 && mod.text.includes('+79')))
})

test('账号、仓库和交易请求只指向所选服；登录白名单不放行国服或任意地址', async () => {
  const urls = []
  const session = { fetch: async url => { urls.push(url); return new Response(JSON.stringify({ name: 'fixture', result: [], leagues: [{ id: 'Standard' }] })) } }
  const server = getServer('international')
  const auth = new PoeCnAuthService({ session, server })
  await auth.validate()
  const stash = new PoeCnStashClient({ session, server, getAuthStatus: () => ({ authenticated: true }) })
  await stash.listLeagues()
  await new PoeCnTradeClient({ session, server }).getStats()
  assert.ok(urls.every(url => new URL(url).origin === server.origin))
  assert.equal(isPoeCnAllowedUrl('https://www.pathofexile.com/login', server), true)
  assert.equal(isPoeCnAllowedUrl('https://poe.game.qq.com/login', server), false)
  assert.equal(isPoeCnAllowedUrl('https://www.pathofexile.com.evil.test/', server), false)
})

test('国际服拒绝访问、登录 HTML 和限流有明确状态且不重试', async () => {
  for (const [status, body, code] of [[403, '<html>blocked</html>', 'ACCESS_DENIED'], [200, '<title>Log in - Path of Exile</title>', 'SESSION_EXPIRED'], [429, '{}', 'RATE_LIMITED']]) {
    let calls = 0
    const client = new PoeCnTradeClient({ server: getServer('international'), session: { fetch: async () => { calls++; return new Response(body, { status, headers: { 'retry-after': '10' } }) } } })
    await assert.rejects(client.getStats(), error => error.code === code)
    assert.equal(calls, 1)
  }
})

test('配置包记录服务器，旧配置按国服兼容且凭据被剔除', () => {
  const bundle = createConfigBundle({ server: 'international', sections: { 'settings.toolSites': { data: { sites: [], cookie: 'fixture-secret' } } } })
  assert.equal(bundle.server, 'international')
  assert.equal(JSON.stringify(bundle).includes('fixture-secret'), false)
  delete bundle.server
  assert.throws(() => parseConfigBundle(JSON.stringify(bundle)), /服务器标识/)
  bundle.formatVersion = 1
  assert.equal(parseConfigBundle(JSON.stringify(bundle)).bundle.server ?? 'cn', 'cn')
})
})()

// === Merged from startupBootstrap.test.js ===
await (async () => {
  const test = _m9_test
  const assert = _m9_assert
  const readFileSync = _m9_readFileSync
  const spawnSync = _m9_spawnSync
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const entry = html.match(/<script type="module" src="([^"]+)"/)[1]

for (const failure of [false, true]) {
  test(failure ? '入口模块加载失败时保留兜底原因并上报诊断' : '界面模块尚未就绪时，页面入口仍可完成以显示启动占位', () => {
    const mainSource = failure
      ? 'throw new Error("main import failed")'
      : 'globalThis.mainStarted = true; await new Promise(() => {})'
    const code = `
      import assert from 'node:assert/strict'
      import { registerHooks } from 'node:module'
      const reports = []
      globalThis.window = { electronAPI: { reportStartupEvent: event => reports.push(event) } }
      registerHooks({ load(url, context, next) {
        if (url.endsWith('/src/main.js')) return { format: 'module', source: ${JSON.stringify(mainSource)}, shortCircuit: true }
        return next(url, context)
      } })
      await import(${JSON.stringify(`..${entry}`)})
      await new Promise(setImmediate)
      ${failure ? `
        assert.match(window.__bootstrapError, /main import failed/)
        assert.equal(reports[0].type, 'renderer-bootstrap-failed')
        assert.match(reports[0].message, /main import failed/)
      ` : `
        assert.equal(globalThis.mainStarted, true)
        assert.deepEqual(reports, [])
      `}
    `
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], {
      cwd: new URL('.', import.meta.url), encoding: 'utf8', windowsHide: true, timeout: 5000
    })
    assert.equal(result.status, 0, result.stderr || result.error?.message)
  })
}
})()

// === Merged from startupDiagnostics.test.js ===
await (async () => {
  const test = _m10_test
  const assert = _m10_assert
  const EventEmitter = _m10_EventEmitter
  const existsSync = _m10_existsSync
  const mkdtempSync = _m10_mkdtempSync
  const readFileSync = _m10_readFileSync
  const rmSync = _m10_rmSync
  const os = _m10_os
  const path = _m10_path
  const createStartupLogger = _m10_createStartupLogger
  const buildSafeModeArgs = _m10_buildSafeModeArgs
  const createCrashGuard = _m10_createCrashGuard
  const shouldRecoverStartupCrash = _m10_shouldRecoverStartupCrash
function withTempDirectory(run) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'poe-startup-diagnostics-'))
  try {
    return run(directory)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

test('启动日志写入结构化事件并脱敏路径与凭据', () => withTempDirectory((directory) => {
  const logger = createStartupLogger({
    userDataPath: directory,
    homeDirectory: 'C:\\Users\\Alice',
    now: () => new Date('2026-08-08T01:02:03.000Z')
  })

  assert.equal(logger.record({
    phase: 'renderer',
    outcome: 'failed',
    reasonCode: 'renderer_bootstrap_failed',
    message: 'C:\\Users\\Alice\\app token=secret-value Cookie=session-secret'
  }), true)

  const event = JSON.parse(readFileSync(logger.filePath, 'utf8').trim())
  assert.deepEqual({
    timestamp: event.timestamp,
    phase: event.phase,
    outcome: event.outcome,
    reasonCode: event.reasonCode
  }, {
    timestamp: '2026-08-08T01:02:03.000Z',
    phase: 'renderer',
    outcome: 'failed',
    reasonCode: 'renderer_bootstrap_failed'
  })
  assert.doesNotMatch(event.message, /Alice|secret-value|session-secret/)
  assert.match(event.message, /redacted|local-path|USERPROFILE/i)
}))

test('启动日志超过限制时只保留当前和上一份日志', () => withTempDirectory((directory) => {
  const logger = createStartupLogger({ userDataPath: directory, maxBytes: 180 })
  logger.record({ phase: 'boot', outcome: 'started', message: 'a'.repeat(160) })
  logger.record({ phase: 'ready', outcome: 'started', message: 'second' })

  assert.equal(existsSync(logger.previousPath), true)
  assert.match(readFileSync(logger.previousPath, 'utf8'), /"phase":"boot"/)
  assert.match(readFileSync(logger.filePath, 'utf8'), /"phase":"ready"/)
  assert.equal(existsSync(path.join(logger.directory, 'startup.2.log')), false)
}))

test('启动日志目录不可写时静默降级并返回 false', () => {
  const fileSystem = {
    mkdirSync() { throw new Error('denied') }
  }
  const logger = createStartupLogger({ userDataPath: 'X:\\blocked', fileSystem })
  assert.equal(logger.record({ phase: 'boot', outcome: 'failed' }), false)
})

test('恢复策略只允许早期渲染器和 GPU 崩溃且安全模式不重复恢复', () => {
  const base = { startedAt: 1000, now: 2000, graceMs: 30000, safeMode: false }
  assert.equal(shouldRecoverStartupCrash({ ...base, source: 'renderer', details: { reason: 'crashed' } }), true)
  assert.equal(shouldRecoverStartupCrash({ ...base, source: 'renderer', details: { reason: 'abnormal-exit' } }), true)
  assert.equal(shouldRecoverStartupCrash({ ...base, source: 'child', details: { type: 'GPU', reason: 'crashed' } }), true)
  for (const reason of ['oom', 'launch-failed', 'integrity-failure', 'killed', 'clean-exit']) {
    assert.equal(shouldRecoverStartupCrash({ ...base, source: 'renderer', details: { reason } }), false)
  }
  assert.equal(shouldRecoverStartupCrash({ ...base, source: 'child', details: { type: 'Network Service', reason: 'crashed' } }), false)
  assert.equal(shouldRecoverStartupCrash({ ...base, source: 'renderer', details: { reason: 'crashed' }, safeMode: true }), false)
  assert.equal(shouldRecoverStartupCrash({ ...base, source: 'renderer', details: { reason: 'crashed' }, now: 40001 }), false)
})

test('安全模式参数保留原参数并去重', () => {
  assert.deepEqual(
    buildSafeModeArgs(['electron/main.js', '--flag', '--disable-gpu']),
    ['electron/main.js', '--flag', '--disable-gpu', '--startup-safe-mode']
  )
})

test('崩溃保护对可恢复故障只请求一次重启', () => {
  const records = []
  const app = {
    relaunchCalls: [], exitCalls: [], listeners: new Map(),
    on(name, listener) { this.listeners.set(name, listener) },
    removeListener(name) { this.listeners.delete(name) },
    relaunch(options) { this.relaunchCalls.push(options) },
    exit(code) { this.exitCalls.push(code) }
  }
  const processObject = {
    argv: ['app.exe'], listeners: new Map(),
    on(name, listener) { this.listeners.set(name, listener) },
    removeListener(name) { this.listeners.delete(name) }
  }
  const guard = createCrashGuard({
    app,
    processObject,
    log: { record: event => records.push(event) },
    startedAt: 1000,
    now: () => 2000
  })
  guard.install()

  assert.equal(guard.handleRendererGone({ reason: 'crashed', exitCode: 9 }), true)
  assert.equal(guard.handleRendererGone({ reason: 'crashed', exitCode: 9 }), false)
  assert.equal(app.relaunchCalls.length, 1)
  assert.deepEqual(app.relaunchCalls[0].args, ['--disable-gpu', '--startup-safe-mode'])
  assert.deepEqual(app.exitCalls, [0])
  assert.equal(records.some(event => event.reasonCode === 'renderer_crashed'), true)
})

test('主进程未捕获异常同步记录后受控退出而不是继续运行', () => {
  const records = []
  const app = {
    exitCalls: [], listeners: new Map(),
    on(name, listener) { this.listeners.set(name, listener) },
    removeListener(name) { this.listeners.delete(name) },
    exit(code) { this.exitCalls.push(code) }
  }
  const processObject = {
    argv: ['app.exe'], listeners: new Map(),
    on(name, listener) { this.listeners.set(name, listener) },
    removeListener(name) { this.listeners.delete(name) }
  }
  const guard = createCrashGuard({ app, processObject, log: { record: event => records.push(event) } })
  guard.install()
  processObject.listeners.get('uncaughtException')(new Error('fatal startup error'))

  assert.deepEqual(app.exitCalls, [1])
  assert.equal(records.at(-1).reasonCode, 'uncaught_exception')
  guard.dispose()
})

test('非 GPU Chromium 子进程退出只记录而不终止应用', () => {
  const records = []
  const failures = []
  const app = {
    relaunchCalls: [], exitCalls: [],
    relaunch(value) { this.relaunchCalls.push(value) },
    exit(value) { this.exitCalls.push(value) }
  }
  const guard = createCrashGuard({
    app,
    log: { record: event => records.push(event) },
    onUnrecoverable: failure => failures.push(failure),
    startedAt: 1000,
    now: () => 2000
  })

  assert.equal(guard.handleChildProcessGone({ type: 'Network Service', reason: 'crashed', exitCode: 1 }), false)
  assert.equal(records.at(-1).reasonCode, 'child_crashed')
  assert.deepEqual(failures, [])
  assert.deepEqual(app.exitCalls, [])
  assert.deepEqual(app.relaunchCalls, [])
})

function observedWindow() {
  const window = new EventEmitter()
  window.webContents = new EventEmitter()
  return window
}

function gpuCrashHarness({ now = 2000, safeMode = false, shuttingDown = false } = {}) {
  const records = [], failures = [], exits = [], relaunches = []
  const app = new EventEmitter()
  app.exit = code => exits.push(code)
  app.relaunch = options => relaunches.push(options)
  const processObject = new EventEmitter()
  processObject.argv = ['app.exe']
  const guard = createCrashGuard({
    app, processObject, startedAt: 1000, now: () => now, safeMode,
    log: { record: event => records.push(event) },
    onUnrecoverable: failure => failures.push(failure),
    isShuttingDown: () => shuttingDown
  })
  guard.install()
  const emit = (reason = 'crashed', type = 'GPU') => app.emit('child-process-gone', {}, { type, reason, exitCode: 34 })
  return { guard, emit, records, failures, exits, relaunches }
}

for (const now of [2000, 31000, 31001, 841000]) {
  for (const safeMode of [false, true]) {
    test(`首次挂载后 GPU 重复故障只记录：elapsed=${now - 1000} safeMode=${safeMode}`, () => {
      const h = gpuCrashHarness({ now, safeMode })
      try {
        h.guard.markStartupComplete()
        h.emit()
        h.emit('abnormal-exit', 'gpu')
        assert.deepEqual(h.records.map(event => [event.phase, event.reasonCode, event.message]), [
          ['chromium-child-process', 'child_crashed', 'reason=crashed type=GPU exitCode=34'],
          ['chromium-child-process', 'child_abnormal_exit', 'reason=abnormal-exit type=gpu exitCode=34']
        ])
        assert.deepEqual(h.failures, [])
        assert.deepEqual(h.exits, [])
        assert.deepEqual(h.relaunches, [])
        assert.equal(h.guard.recoveryRequested, false)
      } finally { h.guard.dispose() }
    })
  }
}

test('首次挂载前 GPU 故障仍只恢复一次', () => {
  const h = gpuCrashHarness()
  try {
    h.emit()
    h.emit()
    assert.deepEqual(h.relaunches, [{ args: ['--disable-gpu', '--startup-safe-mode'] }])
    assert.deepEqual(h.exits, [0])
    assert.equal(h.failures.length, 1)
    assert.equal(h.failures[0].reasonCode, 'child_crashed')
  } finally { h.guard.dispose() }
})

for (const options of [{ safeMode: true }, { now: 31001 }]) {
  test(`首次挂载前不能恢复的 GPU 故障仍提示失败：${JSON.stringify(options)}`, () => {
    const h = gpuCrashHarness(options)
    try {
      h.emit()
      assert.equal(h.failures.length, 1)
      assert.equal(h.failures[0].reasonCode, 'child_crashed')
      assert.deepEqual(h.relaunches, [])
    } finally { h.guard.dispose() }
  })
}

for (const shuttingDown of [false, true]) {
  test(`GPU 正常退出或应用关闭保持静默：shuttingDown=${shuttingDown}`, () => {
    const h = gpuCrashHarness({ shuttingDown })
    try {
      h.emit(shuttingDown ? 'crashed' : 'clean-exit')
      h.guard.markStartupComplete()
      h.emit(shuttingDown ? 'crashed' : 'clean-exit')
      assert.deepEqual(h.records, [])
      assert.deepEqual(h.failures, [])
      assert.deepEqual(h.exits, [])
      assert.deepEqual(h.relaunches, [])
    } finally { h.guard.dispose() }
  })
}

test('页面加载失败只在首次挂载前对真实主框架错误执行致命诊断', () => {
  const failures = []
  const records = []
  const guard = createCrashGuard({
    log: { record: event => records.push(event) },
    onUnrecoverable: failure => failures.push(failure)
  })
  const window = observedWindow()
  guard.observeWindow(window)

  window.webContents.emit('did-fail-load', {}, -3, 'ERR_ABORTED', 'http://localhost:5173', true)
  assert.equal(failures.length, 0)
  assert.equal(records.at(-1).reasonCode, 'page_load_failed')

  window.webContents.emit('did-fail-load', {}, -102, 'ERR_CONNECTION_REFUSED', 'http://localhost:5173', false)
  assert.equal(failures.length, 0)

  window.webContents.emit('did-fail-load', {}, -102, 'ERR_CONNECTION_REFUSED', 'http://localhost:5173', true)
  assert.equal(failures.length, 1)
  assert.equal(failures[0].reasonCode, 'page_load_failed')
})

test('首次挂载完成后的主框架加载失败只记录且允许恢复', () => {
  const failures = []
  const records = []
  const guard = createCrashGuard({
    log: { record: event => records.push(event) },
    onUnrecoverable: failure => failures.push(failure)
  })
  const window = observedWindow()
  guard.observeWindow(window)
  guard.markStartupComplete()

  window.webContents.emit('did-fail-load', {}, -102, 'ERR_CONNECTION_REFUSED', 'http://localhost:5173', true)
  assert.equal(guard.startupComplete, true)
  assert.equal(failures.length, 0)
  assert.equal(records.at(-1).reasonCode, 'page_load_failed')
})
})()

// === Merged from startupHealth.test.js ===
await (async () => {
  const test = _m11_test
  const assert = _m11_assert
  const os = _m11_os
  const createStartupHealth = _m11_createStartupHealth
  const evaluateAdministrator = _m11_evaluateAdministrator
  const evaluateDisplays = _m11_evaluateDisplays
  const evaluateGameDisplayMode = _m11_evaluateGameDisplayMode
  const evaluateNetworkInterfaces = _m11_evaluateNetworkInterfaces
  const evaluateWindowsSupport = _m11_evaluateWindowsSupport
test('启动健康检查接受 Windows 10/11 x64 并拒绝其他架构', () => {
  assert.equal(evaluateWindowsSupport({ platform: 'win32', arch: 'x64', release: '10.0.19045' }).status, 'ready')
  assert.equal(evaluateWindowsSupport({ platform: 'win32', arch: 'arm64', release: '10.0.26100' }).status, 'error')
  assert.equal(evaluateWindowsSupport({ platform: 'linux', arch: 'x64', release: '6.1' }).status, 'error')
})

test('显示器健康检查保留多屏、负坐标和缩放信息', () => {
  const result = evaluateDisplays([
    { bounds: { x: -1920, y: 0, width: 1920, height: 1080 }, scaleFactor: 1.25 },
    { bounds: { x: 0, y: 0, width: 2560, height: 1440 }, scaleFactor: 2 }
  ])
  assert.equal(result.status, 'ready')
  assert.equal(result.count, 2)
  assert.equal(result.hasNegativeCoordinates, true)
  assert.deepEqual(result.scaleFactors, [1.25, 2])
})

test('网络与管理员检查只返回状态，不泄露接口地址', () => {
  const network = evaluateNetworkInterfaces({
    Ethernet: [{ address: '192.0.2.25', family: 'IPv4', internal: false }]
  })
  assert.equal(network.status, 'ready')
  assert.equal(network.activeCount, 1)
  assert.doesNotMatch(JSON.stringify(network), /192\.0\.2\.25/)
  assert.equal(evaluateAdministrator(false).status, 'ready')
})

test('统一启动健康检查覆盖系统、目录、权限、显示、网络、运行时和游戏窗口', async () => {
  const result = await createStartupHealth({
    userDataPath: os.tmpdir(),
    platform: 'win32',
    arch: 'x64',
    release: '10.0.26100',
    administrator: true,
    displays: [{ bounds: { x: 0, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 }],
    networkInterfaces: { Ethernet: [{ family: 'IPv4', internal: false }] },
    runtime: { ready: true, source: 'bundled', version: '3.13.14' },
    gameDpi: { found: true, dpi: 144, scaleFactor: 1.5, displayMode: 'fullscreen', displayModeSupported: true }
  })
  assert.deepEqual(result.items.map((entry) => entry.id), [
    'platform', 'userData', 'administrator', 'displays', 'network', 'runtime', 'game', 'gameDisplayMode'
  ])
  assert.ok(result.items.every((entry) => entry.status === 'ready'))
})

test('游戏显示模式健康项区分支持模式、独占全屏、最小化与未检测到', () => {
  assert.equal(evaluateGameDisplayMode({ found: true, displayMode: 'windowed', displayModeSupported: true }).status, 'ready')
  assert.equal(evaluateGameDisplayMode({ found: true, displayMode: 'fullscreen', displayModeSupported: true }).status, 'ready')
  assert.equal(evaluateGameDisplayMode({ found: true, displayMode: 'borderless', displayModeSupported: true }).status, 'ready')
  const exclusive = evaluateGameDisplayMode({ found: true, displayMode: 'exclusive', displayModeSupported: false })
  assert.equal(exclusive.status, 'attention')
  assert.match(exclusive.text, /无边框全屏|窗口模式/)
  assert.equal(evaluateGameDisplayMode({ found: true, displayMode: 'unknown', displayModeSupported: false }).status, 'attention')
  assert.equal(evaluateGameDisplayMode({ found: false, error: '未找到匹配的游戏窗口' }).status, 'attention')
})
})()

// === Merged from startupLazyParsing.test.js ===
await (async () => {
  const test = _m12_test
  const assert = _m12_assert
  const mkdtemp = _m12_mkdtemp
  const rm = _m12_rm
  const path = _m12_path
  const os = _m12_os
  const spawnSync = _m12_spawnSync
  const CraftingDataUpdater = _m12_CraftingDataUpdater
test('运行时服务和本地快照不加载 Cheerio 网页解析依赖', () => {
  const code = `
    import { registerHooks } from 'node:module';
    registerHooks({ resolve(specifier, context, next) {
      if (specifier === 'cheerio') throw new Error('unexpected startup parser');
      return next(specifier, context);
    }});
    await import('./electron/modules/crafting/service.js');
    const { UniqueItemImageRepository } = await import('./electron/modules/priceCheck/uniqueItemSnapshot.js');
    await new UniqueItemImageRepository().load();
  `
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], { cwd: new URL('..', import.meta.url), encoding: 'utf8', windowsHide: true })
  assert.equal(result.status, 0, result.stderr)
})

test('做装解析器加载中取消，不请求网络且释放更新占用，失败后可重试', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-lazy-parser-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  let release; let requests = 0
  const updater = new CraftingDataUpdater({ repository: {}, storageRoot: root, loadParser: () => new Promise(resolve => { release = resolve }), fetchImpl: () => { requests++; throw new Error('unexpected request') } })
  assert.equal(release, undefined)
  const pending = updater.update()
  await assert.rejects(updater.update(), /已有数据更新/)
  updater.cancel()
  release({})
  await assert.rejects(pending, /数据更新已取消/)
  assert.equal(requests, 0)
  assert.equal(updater.controller, null)
  updater.loadParser = async () => { throw new Error('parser unavailable') }
  await assert.rejects(updater.update(), /parser unavailable/)
  assert.equal(updater.controller, null)
})
})()

// === Merged from startupLoadingState.test.js ===
await (async () => {
  const test = _m13_test
  const assert = _m13_assert
  const readFileSync = _m13_readFileSync
  const runInNewContext = _m13_runInNewContext
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const managerSource = readFileSync(
  new URL('../electron/modules/window/manager.js', import.meta.url),
  'utf8'
)

test('主窗口启动加载块位于 #app 内且包含加载动画', () => {
  const appContainer = indexHtml.match(
    /<div id="app">([\s\S]*?)<\/div>\s*<script>/
  )

  assert.ok(appContainer, '#app 容器应存在且后接加载脚本')
  assert.match(appContainer[1], /id="app-loading"/)
  assert.match(appContainer[1], /loading-spinner/)
  assert.match(appContainer[1], /正在加载…/)
})

test('加载块样式与主窗口背景色一致，避免白屏', () => {
  assert.match(indexHtml, /#app-loading[\s\S]*?background:\s*var\(--app-bg, var\(--startup-bg\)\)/)
  assert.match(indexHtml, /loading-spinner[\s\S]*?border-top-color:\s*var\(--startup-brand\)/)
  assert.match(managerSource, /show: false/); assert.match(managerSource, /openingWindow\.once\('ready-to-show'/)
})

test('覆盖层路由不显示主窗口加载块', () => {
  assert.ok(indexHtml.includes("dataset.startupWindow === 'standalone'"))
  assert.match(indexHtml, /document\.getElementById\('app-loading'\)\?\.remove\(\)/)
})

function startupPage(hash, { bridgeAvailable = true } = {}) {
  const dataset = {}
  const frames = []
  const loadingText = { textContent: '正在加载…' }
  let removed = false
  let notifications = 0
  const loading = {
    querySelector: () => loadingText,
    remove() { removed = true }
  }
  const window = {
    matchMedia: () => ({ matches: false }),
    ...(bridgeAvailable ? { electronAPI: { notifyPriceCheckOverlayLoadingReady: () => { notifications += 1 } } } : {})
  }
  const context = {
    window,
    localStorage: { getItem: () => 'light' },
    location: { hash },
    document: {
      documentElement: { dataset },
      getElementById: id => id === 'app-loading' && !removed ? loading : null
    },
    requestAnimationFrame: callback => frames.push(callback),
    setTimeout() {}
  }
  const scripts = [...indexHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1])
  runInNewContext(scripts.join('\n'), context)
  return {
    dataset, loadingText, loading, frames,
    get removed() { return removed },
    get notifications() { return notifications },
    renderFrame() { for (const callback of frames.splice(0)) callback() }
  }
}

test('查价独立浮窗保留专用启动占位，其他独立窗口继续移除', () => {
  const priceCheck = startupPage('#/price-check-overlay?source=shortcut')
  assert.equal(priceCheck.dataset.startupWindow, 'standalone')
  assert.equal(priceCheck.removed, false)
  assert.equal(priceCheck.loadingText.textContent, '正在启动查价器…')
  for (const hash of ['#/overlay', '#/coordinate-picker', '#/story-overlay']) {
    const page = startupPage(hash)
    assert.equal(page.removed, true, hash)
    assert.equal(page.frames.length, 0, hash)
  }
  const main = startupPage('#/settings?tab=general')
  assert.equal(main.removed, false)
  assert.equal(main.loadingText.textContent, '正在加载…')
  assert.equal(main.frames.length, 0)
})

test('查价静态占位经过首帧后通知主进程，Vue接管后不发送过期回执', () => {
  const page = startupPage('#/price-check-overlay')
  assert.equal(page.notifications, 0)
  page.renderFrame()
  assert.equal(page.notifications, 0)
  page.renderFrame()
  assert.equal(page.notifications, 1)
  page.renderFrame()
  assert.equal(page.notifications, 1)

  const mounted = startupPage('#/price-check-overlay')
  mounted.renderFrame()
  mounted.loading.remove()
  mounted.renderFrame()
  assert.equal(mounted.notifications, 0)

  const browser = startupPage('#/price-check-overlay', { bridgeAvailable: false })
  browser.renderFrame()
  assert.doesNotThrow(() => browser.renderFrame())
})

test('查价静态占位固定使用业务浮窗深色，不跟随主窗口浅色偏好', () => {
  assert.match(indexHtml, /html\[data-startup-price-check="true"\] #app-loading\s*\{[^}]*background:\s*#0E1013;[^}]*color:\s*#AEB4BD;/)
  assert.match(indexHtml, /html\[data-startup-window="standalone"\]:not\(\[data-startup-price-check="true"\]\) #app-loading\s*\{\s*display:\s*none;/)
})
})()
