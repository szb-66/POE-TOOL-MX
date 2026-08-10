import test from 'node:test'
import assert from 'node:assert/strict'

test('手动做装 IPC 会把 Vue Proxy 参数转换为可克隆的普通数据', async () => {
  const received = []
  globalThis.window = {
    electronAPI: {
      createManualCraftingSession(input) {
        received.push(input)
        return Promise.resolve({ session: null })
      },
      applyManualCraftingCurrency(session, actionId) {
        received.push(session, actionId)
        return Promise.resolve({ session: null })
      },
      searchCraftingAffixSuggestions(input) {
        received.push(input)
        return Promise.resolve({ items: [] })
      }
    }
  }

  try {
    const { electronApi } = await import(`../src/api/electron.js?ipc-proxy-regression=${Date.now()}`)
    const variant = new Proxy({ kind: 'normal', influences: [] }, {})
    const session = new Proxy({ baseId: 'base:convoking-wand', state: { prefixes: [], suffixes: [] } }, {})

    await electronApi.crafting.createManualSession({ baseId: 'base:convoking-wand', itemLevel: 86, variant })
    await electronApi.crafting.applyManualCurrency(session, 'currency:transmutation')
    await electronApi.crafting.searchAffixSuggestions({ query: '生命', limit: 50 })

    assert.doesNotThrow(() => structuredClone(received[0]))
    assert.doesNotThrow(() => structuredClone(received[1]))
    assert.doesNotThrow(() => structuredClone(received[3]))
    assert.deepEqual(received[0].variant, { kind: 'normal', influences: [] })
    assert.deepEqual(received[1], { baseId: 'base:convoking-wand', state: { prefixes: [], suffixes: [] } })
    assert.deepEqual(received[3], { query: '生命', limit: 50 })
  } finally {
    delete globalThis.window
  }
})

test('仓库取件 IPC 会把 Vue Proxy 运行配置转换为可克隆的普通数据', async () => {
  let received
  globalThis.window = {
    electronAPI: {
      updateStashPickupRuntime(runtime) {
        received = runtime
        return Promise.resolve({ success: true, data: { status: 'idle' } })
      }
    }
  }

  try {
    const { electronApi } = await import(`../src/api/electron.js?stash-pickup-ipc-proxy=${Date.now()}`)
    const fixedTiming = new Proxy({ patchVerifyMs: 550 }, {})
    const runtime = new Proxy({ enabled: true, fixedTiming }, {})

    await electronApi.stashPickup.updateRuntime(runtime)

    assert.doesNotThrow(() => structuredClone(received))
    assert.deepEqual(received, { enabled: true, fixedTiming: { patchVerifyMs: 550 } })
  } finally {
    delete globalThis.window
  }
})
