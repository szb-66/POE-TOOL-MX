import test from 'node:test'
import assert from 'node:assert/strict'
import { internationalVerificationFeatures, serverContext, INTERNATIONAL_AUTOMATION_FEATURES } from '../shared/serverMode.js'
import { serverChannelFailure, serverShortcutAllowed } from '../electron/modules/app/serverIpcPolicy.js'

test('待实测模块可配置；验收参数仅开发版生效且按功能开放', () => {
  const args = ['--verify-international-features=items,map', '--verify-international-features=items']
  assert.deepEqual(internationalVerificationFeatures(args), [])
  assert.deepEqual(internationalVerificationFeatures(args, { isPackaged: false }), ['items', 'map'])
  assert.throws(() => internationalVerificationFeatures(['--verify-international-features=faustus'], { isPackaged: false }))
  const defaults = serverContext('international')
  for (const id of INTERNATIONAL_AUTOMATION_FEATURES) {
    assert.equal(defaults.capabilities[id].available, true)
    assert.equal(defaults.capabilities[id].gameInputAvailable, false)
  }
  const context = serverContext('international', { verificationFeatures: ['items', 'story', 'stash-pickup'] })
  assert.equal(serverChannelFailure(context, 'generate-and-execute-script', false, [{ mode: 'items' }]), null)
  assert.equal(serverChannelFailure(context, 'generate-and-execute-script', false, [{ mode: 'map' }]).code, 'SERVER_FEATURE_UNAVAILABLE')
  for (const config of [null, {}, { mode: 'other' }]) assert.equal(serverChannelFailure(context, 'generate-and-execute-script', false, [config]).code, 'SERVER_FEATURE_UNAVAILABLE')
  assert.equal(serverChannelFailure(context, 'execute-python').code, 'SERVER_FEATURE_UNAVAILABLE')
  assert.equal(serverChannelFailure(context, 'open-story-overlay'), null)
  assert.equal(serverChannelFailure(context, 'stash-pickup-start'), null)
  for (const channel of ['junfeng-start', 'combat-start-loop', 'chaos-recipe-control-action', 'faustus-start', 'crafting-create-manual-session']) {
    assert.equal(serverChannelFailure(context, channel).code, 'SERVER_FEATURE_UNAVAILABLE')
  }
  assert.equal(serverShortcutAllowed(context, 'itemStart'), true)
  assert.equal(serverShortcutAllowed(context, 'storyNext'), true)
  assert.equal(serverShortcutAllowed(context, 'mapStart'), false)
  assert.equal(serverShortcutAllowed(context, 'priceCheck'), false)
  assert.equal(serverShortcutAllowed(context, 'itemStart', true), false)
  assert.equal(serverShortcutAllowed(context, 'end', true), true)
  assert.equal(serverChannelFailure(context, 'shortcut-triggered', true, ['end']), null)
  assert.equal(serverChannelFailure(context, 'shortcut-triggered', false, ['itemStart']), null)
  assert.equal(serverChannelFailure(context, 'shortcut-triggered', false, ['mapStart']).code, 'SERVER_FEATURE_UNAVAILABLE')
  assert.equal(serverChannelFailure(context, 'generate-and-execute-script', true, [{ mode: 'items' }]).code, 'SERVER_SWITCHING')
  assert.equal(serverChannelFailure(context, 'stop-script', true), null)
  for (const channel of ['stash-pickup-runtime-update', 'junfeng-runtime-update', 'price-check-runtime-update']) {
    assert.equal(serverChannelFailure(defaults, channel, true, [{ enabled: false }]), null)
    for (const enabled of [true, 'false', 0, undefined]) assert.equal(serverChannelFailure(defaults, channel, false, [{ enabled }]).code, 'SERVER_FEATURE_UNAVAILABLE')
  }
  assert.equal(serverChannelFailure(defaults, 'open-debug-overlay'), null)
})
