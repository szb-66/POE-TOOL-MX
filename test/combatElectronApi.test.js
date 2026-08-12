import test from 'node:test'
import assert from 'node:assert/strict'

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
