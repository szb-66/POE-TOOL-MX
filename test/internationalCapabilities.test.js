import test from 'node:test'
import assert from 'node:assert/strict'
import { internationalVerificationFeatures, serverContext, INTERNATIONAL_AUTOMATION_FEATURES } from '../shared/serverMode.js'
import { serverChannelFailure, serverShortcutAllowed } from '../electron/modules/app/serverIpcPolicy.js'

test('国际服默认开放离线适配模块，旧验收参数不再决定可用性', () => {
  const args = ['--verify-international-features=items,map', '--verify-international-features=items']
  assert.deepEqual(internationalVerificationFeatures(args), [])
  assert.deepEqual(internationalVerificationFeatures(args, { isPackaged: false }), ['items', 'map'])
  assert.throws(() => internationalVerificationFeatures(['--verify-international-features=puzzle'], { isPackaged: false }))
  const context = serverContext('international')
  for (const id of INTERNATIONAL_AUTOMATION_FEATURES) {
    assert.equal(context.capabilities[id].available, true, id)
    assert.equal(context.capabilities[id].gameInputAvailable, true, id)
    assert.equal(context.capabilities[id].state, 'ready', id)
  }
  assert.deepEqual(serverContext('international', { verificationFeatures: ['items'] }), context)
  for (const id of ['puzzle', 'craft-planner']) assert.equal(context.capabilities[id].available, false)
})

test('具名业务 IPC 和快捷键开放，任意 Python 与做装模拟继续拒绝', () => {
  const context = serverContext('international')
  for (const mode of ['items', 'map']) assert.equal(serverChannelFailure(context, 'generate-and-execute-script', false, [{ mode }]), null)
  for (const config of [null, {}, { mode: 'other' }]) assert.equal(serverChannelFailure(context, 'generate-and-execute-script', false, [config]).code, 'SERVER_FEATURE_UNAVAILABLE')
  for (const channel of ['execute-python', 'crafting-create-manual-session', 'puzzle-analyze', 'unregistered-channel']) assert.equal(serverChannelFailure(context, channel).code, 'SERVER_FEATURE_UNAVAILABLE', channel)
  for (const channel of ['junfeng-start', 'combat-start-loop', 'chaos-recipe-control-action', 'chaos-recipe-pick-grid-region', 'chaos-recipe-runtime-update', 'chaos-recipe-control-state', 'price-check-capture', 'price-check-runtime-update', 'price-check-overlay-rendered', 'map-tracker:settings', 'map-tracker:overlay', 'client-events-settings-update', 'open-story-overlay', 'stash-pickup-start', 'faustus-start', 'sanctum:start', 'crafting-search-affix-suggestions']) assert.equal(serverChannelFailure(context, channel), null, channel)
  for (const key of ['itemStart', 'storyNext', 'mapStart', 'priceCheck']) {
    assert.equal(serverShortcutAllowed(context, key), true, key)
    assert.equal(serverChannelFailure(context, 'shortcut-triggered', false, [key]), null, key)
    assert.equal(serverShortcutAllowed(context, key, true), false, key)
  }
  assert.equal(serverShortcutAllowed(context, 'unknown'), false)
})

test('切服仍拒绝新任务，停止和关闭运行态始终可用', () => {
  const context = serverContext('international')
  assert.equal(serverShortcutAllowed(context, 'end', true), true)
  assert.equal(serverChannelFailure(context, 'shortcut-triggered', true, ['end']), null)
  for (const channel of ['stop-script', 'emergency-stop-all', 'price-check-overlay-close']) assert.equal(serverChannelFailure(context, channel, true), null)
  for (const channel of ['sanctum:stop', 'sanctum:cancelCalibrationCollection']) assert.equal(serverChannelFailure(context, channel, true), null)
  for (const channel of ['sanctum:setEnabled', 'sanctum:setModuleEnabled']) {
    assert.equal(serverChannelFailure(context, channel, true, [false]), null)
    assert.equal(serverChannelFailure(context, channel, true, [true]).code, 'SERVER_SWITCHING')
  }
  assert.equal(serverChannelFailure(context, 'map-tracker:overlay', true, ['hide']), null)
  assert.equal(serverChannelFailure(context, 'map-tracker:overlay', true, ['show']).code, 'SERVER_SWITCHING')
  for (const channel of ['map-tracker:settings', 'client-events-settings-update']) {
    assert.equal(serverChannelFailure(context, channel, true, [{ enabled: false }]), null)
    assert.equal(serverChannelFailure(context, channel, true, [{ enabled: false, logPath: 'another-file' }]).code, 'SERVER_SWITCHING')
  }
  for (const channel of ['stash-pickup-runtime-update', 'junfeng-runtime-update', 'price-check-runtime-update', 'chaos-recipe-runtime-update']) {
    assert.equal(serverChannelFailure(context, channel, true, [{ enabled: false }]), null)
    assert.equal(serverChannelFailure(context, channel, true, [{ enabled: true }]).code, 'SERVER_SWITCHING')
  }
  assert.equal(serverChannelFailure(context, 'generate-and-execute-script', true, [{ mode: 'items' }]).code, 'SERVER_SWITCHING')
})

test('国际服海图目标在实际预设和生成配置均拒绝，普通地图与契约保持开放', () => {
  for (const field of ['targetKind', 'activeKind']) for (const location of ['preset', 'generation']) {
    const config = { mode: 'map', preset: { map: {} }, generationConfig: { mapConfig: {} } }
    config[location === 'preset' ? 'preset' : 'generationConfig'][location === 'preset' ? 'map' : 'mapConfig'][field] = 'chart'
    assert.match(serverChannelFailure(serverContext('international'), 'generate-and-execute-script', false, [config]).message, /海图/)
    assert.equal(serverChannelFailure(serverContext('cn'), 'generate-and-execute-script', false, [config]), null)
  }
  for (const targetKind of ['atlas', 'heist']) assert.equal(serverChannelFailure(serverContext('international'), 'generate-and-execute-script', false, [{ mode: 'map', preset: { map: { targetKind } } }]), null)
})
