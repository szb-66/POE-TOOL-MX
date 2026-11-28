import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import {
  createDefaultCombatAssist,
  evaluateCombatAreaGate,
  formatCombatAreaGateStatus,
  hasEnabledLoopItem,
  hasEnabledPotionResource,
  isCombatSafeZoneArea,
  migrateLegacyCombatAssist,
  normalizeCombatAssist,
  validateCombatAssist,
  validateLoopAssist,
  validatePotionAssist
} from '../shared/combatAssist.js'
import {
  collectCombatConfigurationIssues,
  CONFIGURATION_ACTIONS
} from '../src/domains/configurationGuide/configurationIssues.js'
import { evaluateCombatStatus } from '../src/domains/dashboard/dashboardStatus.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readSource = relativePath => fs.readFileSync(path.join(ROOT, relativePath), 'utf8')

test('默认配置启用安全区自动暂停且默认关闭生命/魔力，旧配置平滑迁移', () => {
  const defaults = createDefaultCombatAssist()
  assert.equal(defaults.autoPauseInSafeZone, true)
  assert.equal(defaults.potion.health.enabled, false)
  assert.equal(defaults.potion.mana.enabled, false)

  // 旧配置（无 autoPauseInSafeZone）：未配置坐标和按键的默认 true 药剂迁移为 false，已配置的保持 true
  const migrated = migrateLegacyCombatAssist({
    potion: {
      health: { enabled: true, point: { x: 0, y: 0 }, keys: [] },
      mana: { enabled: true, point: { x: 1800, y: 900 }, keys: ['2'] }
    },
    loop: { tickMs: 50, items: [{ id: 'a', key: '3', intervalMs: 3000, enabled: true }] }
  })
  assert.equal(migrated.autoPauseInSafeZone, true)
  assert.equal(migrated.potion.health.enabled, false)
  assert.equal(migrated.potion.mana.enabled, true)

  // 新配置（已包含 autoPauseInSafeZone）：保留用户显式开启的未配置药剂以便触发校验提示
  const explicitNew = migrateLegacyCombatAssist({
    autoPauseInSafeZone: false,
    potion: {
      health: { enabled: true, point: { x: 0, y: 0 }, keys: [] },
      mana: { enabled: false, point: { x: 0, y: 0 }, keys: [] }
    }
  })
  assert.equal(explicitNew.autoPauseInSafeZone, false)
  assert.equal(explicitNew.potion.health.enabled, true)
})

test('统一校验仅校验已开启子项且至少需开启一项', () => {
  const empty = createDefaultCombatAssist()
  assert.equal(validateCombatAssist(empty).isValid, false)
  assert.deepEqual(
    collectCombatConfigurationIssues({ actionId: CONFIGURATION_ACTIONS.start, config: empty }).issues.map(item => item.id),
    ['combat.items']
  )

  // 仅开启主动循环，血蓝未配置也能通过统一校验
  const loopOnly = normalizeCombatAssist({
    loop: { items: [{ id: '1', key: '2', intervalMs: 3000, enabled: true }] }
  })
  assert.equal(validateCombatAssist(loopOnly).isValid, true)
  assert.equal(collectCombatConfigurationIssues({ actionId: CONFIGURATION_ACTIONS.start, config: loopOnly }).ok, true)

  // 同时开启未配置的生命药剂与有效循环按键 -> 仅报生命药剂问题
  const mixedInvalid = normalizeCombatAssist({
    potion: { health: { enabled: true, point: { x: 0, y: 0 }, keys: [] } },
    loop: { items: [{ id: '1', key: '2', intervalMs: 3000, enabled: true }] }
  })
  assert.equal(validateCombatAssist(mixedInvalid).isValid, false)
  assert.deepEqual(
    collectCombatConfigurationIssues({ actionId: CONFIGURATION_ACTIONS.start, config: mixedInvalid }).issues.map(item => item.id),
    ['combat.potion.health.position', 'combat.potion.health.keys']
  )

  // 启用但未设按键的循环项被拦截
  const rawBlankLoop = {
    ...createDefaultCombatAssist(),
    loop: { tickMs: 50, items: [{ id: 'blank', key: '', intervalMs: 1000, enabled: true }] }
  }
  assert.equal(validateCombatAssist(rawBlankLoop).isValid, false)
  assert.deepEqual(
    collectCombatConfigurationIssues({ actionId: CONFIGURATION_ACTIONS.start, config: rawBlankLoop }).issues.map(item => item.id),
    ['combat.loop.items']
  )
})

test('安全区判定采用黑名单制：城镇/藏身处/圣域大厅/加载/断线暂停，兽园与所有战斗区恢复，未知状态兜底放行', () => {
  // 安全区列表
  for (const areaId of [
    '1_1_town', '2_10_town', '2_11_endgame_town',
    'HideoutForest', 'HideoutLush', 'GuildHideout',
    'KalguuranSettlersLeague', 'HeistHub', 'HeistHubSolo',
    'DelveHub', 'HallsOfTheDead', 'LabyrinthAirlock', 'SanctumFoyer'
  ]) {
    assert.equal(isCombatSafeZoneArea(areaId), true, `应判定为安全区: ${areaId}`)
    const gate = evaluateCombatAreaGate({ enabled: true, clientState: 'started', gameState: 'in-game', areaId })
    assert.equal(gate.paused, true, areaId)
    assert.equal(gate.reason, 'safe-zone', areaId)
  }

  // 兽园与各类战斗区域均不暂停（黑名单制覆盖新赛季地图）
  for (const areaId of [
    'Menagerie', 'MapWorldsBeach', 'MapWorldsCrimsonTemple',
    'MavenHub', 'AbyssLeague', 'VaalSideArea', 'LabyrinthTrial',
    '1_1_2', '2_6_2', 'NewLeagueArena_01'
  ]) {
    assert.equal(isCombatSafeZoneArea(areaId), false, `应判定为战斗区: ${areaId}`)
    const gate = evaluateCombatAreaGate({ enabled: true, clientState: 'started', gameState: 'in-game', areaId })
    assert.equal(gate.paused, false, areaId)
    assert.equal(gate.reason, 'combat-area', areaId)
  }

  // 过图加载与断线暂停
  const loadingGate = evaluateCombatAreaGate({ enabled: true, clientState: 'started', gameState: 'loading', areaId: 'MapWorldsBeach' })
  assert.equal(loadingGate.paused, true)
  assert.equal(loadingGate.reason, 'loading')
  assert.equal(formatCombatAreaGateStatus(loadingGate), '过图加载中')

  const disconnectedGate = evaluateCombatAreaGate({ enabled: true, clientState: 'started', gameState: 'disconnected' })
  assert.equal(disconnectedGate.paused, true)
  assert.equal(disconnectedGate.reason, 'disconnected')
  assert.equal(formatCombatAreaGateStatus(disconnectedGate), '游戏已断开')

  // 日志未就绪或区域未知 -> 战斗优先兜底继续运行并提示
  const logUnavailable = evaluateCombatAreaGate({ enabled: true, clientState: 'waiting', gameState: 'unknown' })
  assert.equal(logUnavailable.paused, false)
  assert.equal(logUnavailable.reason, 'log-unavailable')
  assert.ok(logUnavailable.warning.includes('Client.txt'))

  const unknownArea = evaluateCombatAreaGate({ enabled: true, clientState: 'started', gameState: 'unknown', areaId: '' })
  assert.equal(unknownArea.paused, false)
  assert.equal(unknownArea.reason, 'area-unknown')
  assert.ok(unknownArea.warning.length > 0)

  // 关闭开关后一律不暂停
  const disabledGate = evaluateCombatAreaGate({ enabled: false, clientState: 'started', gameState: 'in-game', areaId: 'HideoutForest' })
  assert.equal(disabledGate.paused, false)
  assert.equal(disabledGate.reason, 'disabled')
})

test('仪表盘战斗辅助状态正确展示安全区暂停、过图加载与断线状态', () => {
  assert.equal(evaluateCombatStatus({
    validation: { errors: [] },
    running: true,
    focused: true,
    loopRunning: true,
    loopFocused: true,
    areaGate: { paused: true, reason: 'safe-zone', areaName: '苍翠藏身处' }
  }).statusText, '被动喝药 + 主动循环 · 安全区暂停（苍翠藏身处）')

  assert.equal(evaluateCombatStatus({
    validation: { errors: [] },
    loopRunning: true,
    loopFocused: true,
    areaGate: { paused: true, reason: 'loading', areaName: '' }
  }).statusText, '主动循环 · 过图加载中')

  assert.equal(evaluateCombatStatus({
    validation: { errors: [] },
    running: true,
    focused: false,
    areaGate: { paused: true, reason: 'disconnected', areaName: '' }
  }).statusText, '被动喝药 · 游戏已断开')
})

test('combatService 统一启停按子项开关启停并支持运行中热切换与全部关闭自动停止', async () => {
  const storageMap = new Map()
  const serverStorage = {
    getItem: key => storageMap.has(key) ? storageMap.get(key) : null,
    setItem: (key, value) => storageMap.set(key, String(value)),
    removeItem: key => storageMap.delete(key)
  }
  const calls = { startPotion: 0, stopPotion: 0, startLoop: 0, stopLoop: 0 }
  const messages = []
  let potionRunning = false
  let loopRunning = false
  const combatStore = {
    running: false,
    loopRunning: false,
    lastError: '',
    loopLastError: '',
    areaGate: { paused: false, reason: 'disabled', areaName: '', areaId: '', warning: '' },
    applyStatus(status = {}) {
      if (status.areaGate) this.areaGate = status.areaGate
      if (status.event === 'area-gate') return
      if (status.origin === 'loop') {
        if (typeof status.running === 'boolean') this.loopRunning = status.running
        if (status.event === 'error') this.loopLastError = status.error || ''
      } else {
        if (typeof status.running === 'boolean') this.running = status.running
        if (status.event === 'error') this.lastError = status.error || ''
      }
    }
  }
  const settingsStore = {
    operationDelayMs: 40,
    fixedTiming: {},
    combatAssist: normalizeCombatAssist({
      autoPauseInSafeZone: true,
      potion: {
        health: { enabled: false, point: { x: 120, y: 900 }, keys: ['1'] },
        mana: { enabled: false, point: { x: 0, y: 0 }, keys: [] }
      },
      loop: { tickMs: 50, items: [{ id: 'a', key: '2', intervalMs: 3000, enabled: true }] }
    })
  }
  const electronApi = {
    combat: {
      onStatus: () => () => {},
      getPotionStatus: async () => ({ running: potionRunning }),
      getLoopStatus: async () => ({ running: loopRunning }),
      updatePotionConfig: async () => ({ success: true }),
      startPotion: async () => { calls.startPotion++; potionRunning = true; return { success: true, processId: 201 } },
      stopPotion: async () => { calls.stopPotion++; potionRunning = false; return { success: true } },
      startLoop: async () => { calls.startLoop++; loopRunning = true; return { success: true, processId: 202 } },
      stopLoop: async () => { calls.stopLoop++; loopRunning = false; return { success: true } }
    }
  }
  const combatText = readSource('src/utils/combatService.js')
    .replace(/^import\s+[\s\S]*?\sfrom\s+['"][^'"]+['"]\r?\n/gm, '')
    .replace(/export\s+async\s+function\s+/g, 'async function ')
    .replace(/export\s+function\s+/g, 'function ')
  const scope = {
    ElMessage: {
      success: text => messages.push(['success', text]),
      warning: text => messages.push(['warning', text]),
      error: text => messages.push(['error', text]),
      info: text => messages.push(['info', text])
    },
    electronApi,
    useSettingsStore: () => settingsStore,
    useCombatStore: () => combatStore,
    hasEnabledLoopItem,
    hasEnabledPotionResource,
    validateCombatAssist,
    validatePotionAssist,
    validateLoopAssist,
    reportDiagnosticFailure() {},
    reportDiagnosticRecovery() {},
    runWithConfigurationGuide: async () => false,
    canUseGameInput: () => true,
    serverStorage,
    collectCombatConfigurationIssues: ({ actionId, config }) => collectCombatConfigurationIssues({ actionId, config }),
    CONFIGURATION_ACTIONS,
    CONFIGURATION_MODULES: { combat: 'combat' },
    console
  }
  vm.runInNewContext(`${combatText}\nglobalThis.exports = { initCombatAssist, startCombatAssist, stopCombatAssist, syncRunningCombatAssist }`, scope)
  const svc = scope.exports

  // 1. 仅开启循环时统一启动 -> 只拉起 loop，不拉起 potion
  assert.equal(await svc.startCombatAssist(), true)
  assert.equal(calls.startPotion, 0)
  assert.equal(calls.startLoop, 1)
  assert.equal(combatStore.running, false)
  assert.equal(combatStore.loopRunning, true)
  assert.deepEqual(JSON.parse(storageMap.get('combatAssistRuntime')), { potionRunning: false, loopRunning: true })

  // 2. 运行中热打开已配置的生命药剂 -> 自动拉起 potion
  settingsStore.combatAssist.potion.health.enabled = true
  const hotStart = await svc.syncRunningCombatAssist()
  assert.deepEqual({ ...hotStart }, { ok: true, stopped: false })
  assert.equal(calls.startPotion, 1)
  assert.equal(combatStore.running, true)
  assert.equal(combatStore.loopRunning, true)

  // 3. 运行中热关闭循环项 -> 自动停止 loop，保留 potion
  settingsStore.combatAssist.loop.items[0].enabled = false
  const hotStopLoop = await svc.syncRunningCombatAssist()
  assert.deepEqual({ ...hotStopLoop }, { ok: true, stopped: false })
  assert.equal(combatStore.running, true)
  assert.equal(combatStore.loopRunning, false)

  // 4. 运行中关闭最后一项（生命药剂） -> 自动停止整个战斗辅助
  settingsStore.combatAssist.potion.health.enabled = false
  const autoStop = await svc.syncRunningCombatAssist()
  assert.deepEqual({ ...autoStop }, { ok: true, stopped: true })
  assert.equal(combatStore.running, false)
  assert.equal(combatStore.loopRunning, false)
  assert.deepEqual(JSON.parse(storageMap.get('combatAssistRuntime')), { potionRunning: false, loopRunning: false })
  assert.ok(messages.some(([level, text]) => level === 'info' && text.includes('自动停止')))
})

test('Python 战斗脚本在 paused_by_area=True 时完全暂停触发，切回 False 后立即恢复', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'combat-area-pause-'))
  const configPath = path.join(tempDir, 'loop_config.json')
  try {
    const pythonCheck = `
import importlib.util, json, threading, time
spec = importlib.util.spec_from_file_location("combat_assist", r"${path.join(ROOT, 'src/assets/scripts/combat_assist_template.py')}")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

sent = []
events = []
mod.signal.signal = lambda *a, **k: None
mod.is_game_foreground = lambda: True
mod.send_sequence = lambda keys, **kwargs: (sent.extend(keys), len(keys))[1]
mod.emit = lambda event, **payload: events.append((event, payload))

cfg_path = r"${configPath}"
cfg = {
    "paused_by_area": True,
    "loop": {"tickMs": 15, "items": [{"id": "flask1", "key": "2", "intervalMs": 200, "enabled": True}]}
}
with open(cfg_path, "w", encoding="utf-8") as f:
    json.dump(cfg, f)

t = threading.Thread(target=mod.run_loop, args=(cfg, cfg_path), daemon=True)
t.start()
time.sleep(0.12)
assert sent == [], f"安全区暂停期间不应发键: {sent}"

cfg["paused_by_area"] = False
with open(cfg_path, "w", encoding="utf-8") as f:
    json.dump(cfg, f)
time.sleep(0.12)
mod.stop_running()
t.join(timeout=2)

assert len(sent) >= 1 and sent[0] == "2", f"切回战斗区后应立即恢复发键: {sent}"
pause_events = [p["paused"] for e, p in events if e == "area_pause"]
assert pause_events[:2] == [True, False], f"应按顺序上报暂停与恢复事件: {pause_events}"

# 同时验证 run_potion 在 paused_by_area=True 时不读像素也不发键，False 后立即触发
potion_sent = []
pixel_reads = []
mod.read_pixel = lambda pt: (pixel_reads.append(pt), {"r": 10, "g": 10, "b": 10})[1]
mod.send_sequence = lambda keys, **kwargs: (potion_sent.extend(keys), len(keys))[1]
potion_cfg_path = cfg_path + ".potion.json"
potion_cfg = {
    "paused_by_area": True,
    "potion": {
        "scanIntervalMs": 15,
        "maxTriggersPerSecond": 5,
        "protectionCooldownMs": 1000,
        "health": {"enabled": True, "point": {"x": 100, "y": 200}, "threshold": 60, "keys": ["1"], "recoveryMode": "duration", "recoveryCooldownMs": 200, "instantIntervalMs": 100},
        "mana": {"enabled": False}
    }
}
with open(potion_cfg_path, "w", encoding="utf-8") as f:
    json.dump(potion_cfg, f)

t2 = threading.Thread(target=mod.run_potion, args=(potion_cfg, potion_cfg_path), daemon=True)
t2.start()
time.sleep(0.1)
assert pixel_reads == [] and potion_sent == [], f"安全区暂停期间不应采样或喝药: {pixel_reads}, {potion_sent}"

potion_cfg["paused_by_area"] = False
with open(potion_cfg_path, "w", encoding="utf-8") as f:
    json.dump(potion_cfg, f)
time.sleep(0.1)
mod.stop_running()
t2.join(timeout=2)
assert len(pixel_reads) >= 1 and potion_sent[:1] == ["1"], f"切回战斗区后应立即采样并喝药: {pixel_reads}, {potion_sent}"
print("OK")
`
    const output = execFileSync('python', ['-c', pythonCheck], { encoding: 'utf8', timeout: 10000 })
    assert.equal(output.trim(), 'OK')
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
})

test('Python 战斗脚本在按住 Alt/Ctrl/Win 时暂缓被动喝药与主动循环且不报错，按住 Shift 不受拦截', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'combat-modifier-guard-'))
  const loopPath = path.join(tempDir, 'loop.json')
  const potionPath = path.join(tempDir, 'potion.json')
  try {
    const pythonCheck = `
import importlib.util, json, threading, time
spec = importlib.util.spec_from_file_location("combat_assist", r"${path.join(ROOT, 'src/assets/scripts/combat_assist_template.py')}")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

# 1. is_blocking_modifier_pressed 精确拦截 Alt/Ctrl/Win，放行 Shift
assert mod.is_blocking_modifier_pressed(lambda vk: 0x8000 if vk == 0x12 else 0) is True   # Alt
assert mod.is_blocking_modifier_pressed(lambda vk: 0x8000 if vk == 0xA4 else 0) is True   # Left Alt
assert mod.is_blocking_modifier_pressed(lambda vk: 0x8000 if vk == 0x11 else 0) is True   # Ctrl
assert mod.is_blocking_modifier_pressed(lambda vk: 0x8000 if vk == 0x5B else 0) is True   # Left Win
assert mod.is_blocking_modifier_pressed(lambda vk: 0x8000 if vk == 0x10 else 0) is False  # Shift 不拦截

# 2. send_sequence 发送中途按下 Alt 时立即中止且标记 abort_state['reason'] == 'modifier'
pressed = []
state = {"alt": False}
def fake_keybd(vk, scan, flags, extra):
    if flags == 0:
        pressed.append(vk)
        state["alt"] = True  # 发送第 1 个键后模拟按下 Alt
abort_state = {}
count = mod.send_sequence(["1", "2", "3"], foreground_check=lambda: True, key_event_sender=fake_keybd, modifier_check=lambda: state["alt"], abort_state=abort_state)
assert count == 1 and len(pressed) == 1, f"中途按 Alt 应停止后续按键: count={count}, pressed={pressed}"
assert abort_state.get("reason") == "modifier", f"应标记 modifier 中止: {abort_state}"

# 3. run_loop 按住 Alt 期间完全暂停且不报错误退出，松开 Alt 后立即恢复
mod.signal.signal = lambda *a, **k: None
mod.is_game_foreground = lambda: True
alt_held = {"value": True}
mod.is_blocking_modifier_pressed = lambda reader=None: alt_held["value"]
loop_sent = []
loop_errors = []
mod.emit = lambda event, **payload: loop_errors.append(payload) if event == "error" else None
orig_send = mod.send_sequence
mod.send_sequence = lambda keys, **kwargs: (loop_sent.extend(keys), len(keys))[1]

loop_cfg = {"paused_by_area": False, "loop": {"tickMs": 15, "items": [{"id": "a", "key": "d", "intervalMs": 100, "enabled": True}]}}
with open(r"${loopPath}", "w", encoding="utf-8") as f:
    json.dump(loop_cfg, f)

t = threading.Thread(target=mod.run_loop, args=(loop_cfg, r"${loopPath}"), daemon=True)
t.start()
time.sleep(0.1)
assert loop_sent == [] and loop_errors == [], f"按住 Alt 期间循环不应发键或报错: {loop_sent}, {loop_errors}"

alt_held["value"] = False
time.sleep(0.1)
mod.stop_running()
t.join(timeout=2)
assert len(loop_sent) >= 1 and loop_sent[0] == "d", f"松开 Alt 后循环应恢复发键: {loop_sent}"
assert loop_errors == [], f"不应触发任何错误: {loop_errors}"

# 4. run_potion 按住 Alt 期间不触发喝药也不报错，松开 Alt 后立即恢复喝药
alt_held["value"] = True
potion_sent = []
potion_errors = []
mod.emit = lambda event, **payload: potion_errors.append(payload) if event == "error" else None
mod.read_pixel = lambda pt: {"r": 10, "g": 10, "b": 10}
mod.send_sequence = lambda keys, **kwargs: (potion_sent.extend(keys), len(keys))[1]

potion_cfg = {
    "paused_by_area": False,
    "potion": {
        "scanIntervalMs": 15,
        "maxTriggersPerSecond": 5,
        "protectionCooldownMs": 1000,
        "health": {"enabled": True, "point": {"x": 100, "y": 200}, "threshold": 60, "keys": ["1"], "recoveryMode": "duration", "recoveryCooldownMs": 200, "instantIntervalMs": 100},
        "mana": {"enabled": False}
    }
}
with open(r"${potionPath}", "w", encoding="utf-8") as f:
    json.dump(potion_cfg, f)

t2 = threading.Thread(target=mod.run_potion, args=(potion_cfg, r"${potionPath}"), daemon=True)
t2.start()
time.sleep(0.1)
assert potion_sent == [] and potion_errors == [], f"按住 Alt 期间被动喝药不应发键或报错: {potion_sent}, {potion_errors}"

alt_held["value"] = False
time.sleep(0.1)
mod.stop_running()
t2.join(timeout=2)
assert len(potion_sent) >= 1 and potion_sent[0] == "1", f"松开 Alt 后被动喝药应立即触发: {potion_sent}"
assert potion_errors == [], f"不应触发任何错误: {potion_errors}"
print("OK")
`
    const output = execFileSync('python', ['-c', pythonCheck], { encoding: 'utf8', timeout: 10000 })
    assert.equal(output.trim(), 'OK')
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
})

test('CombatView 与 useDashboard 已整合为单一启停按钮并包含安全区保护开关', () => {
  const combatView = readSource('src/domains/combat/CombatView.vue')
  assert.match(combatView, /v-model="config\.autoPauseInSafeZone"/)
  assert.match(combatView, /进入安全区自动暂停/)
  assert.match(combatView, /@click="startCombatAssist"/)
  assert.match(combatView, /@click="stopCombatAssist"/)
  assert.doesNotMatch(combatView, /startPotionAssist|startLoopAssist/)

  const dashboard = readSource('src/domains/dashboard/useDashboard.js')
  assert.match(dashboard, /startCombatAssist/)
  assert.match(dashboard, /stopCombatAssist/)
  assert.doesNotMatch(dashboard, /启动被动|启动循环|停止被动|停止循环/)
})
