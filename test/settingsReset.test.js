import test from 'node:test'
import assert from 'node:assert/strict'
import { resetApplicationSettings } from '../src/domains/settings/settingsReset.js'

test('停止任一输入自动化失败时不清空用户设置', async () => {
  const calls = []
  await assert.rejects(
    resetApplicationSettings({
      stopAutomations: async () => ({
        success: false,
        stopped: [{ id: 'potion', label: '自动喝药' }],
        failed: [{ id: 'combat-loop', label: '主动循环', error: '停止超时' }]
      }),
      resetStoredSettings: () => calls.push('settings'),
      resetInterfaceDetection: () => calls.push('interface'),
      resetControlOverlayOffset: async () => calls.push('offset'),
      syncPriceCheckShortcut: async () => calls.push('price-check-shortcut'),
      syncShortcuts: async () => calls.push('shortcuts')
    }),
    /无法安全重置：主动循环停止失败/
  )
  assert.deepEqual(calls, [])
})

test('浮窗偏移同步失败不会跳过快捷键重注册和已完成的本地重置', async () => {
  const calls = []
  const result = await resetApplicationSettings({
    stopAutomations: async () => ({ success: true, stopped: [], failed: [] }),
    resetStoredSettings: () => calls.push('settings'),
    resetInterfaceDetection: () => calls.push('interface'),
    resetControlOverlayOffset: async () => {
      calls.push('offset')
      throw new Error('浮窗不可用')
    },
    syncPriceCheckShortcut: async () => calls.push('price-check-shortcut'),
    syncShortcuts: async () => calls.push('shortcuts')
  })

  assert.deepEqual(calls, ['shortcuts', 'settings', 'interface', 'offset', 'price-check-shortcut'])
  assert.deepEqual(result.warnings, [{ id: 'control-overlay-offset', message: '浮窗不可用' }])
})

test('快捷键重注册失败时保留本地设置避免形成分叉状态', async () => {
  const calls = []
  await assert.rejects(resetApplicationSettings({
    stopAutomations: async () => ({ success: true, stopped: [], failed: [] }),
    resetStoredSettings: () => calls.push('settings'),
    resetInterfaceDetection: () => calls.push('interface'),
    resetControlOverlayOffset: async () => calls.push('offset'),
    syncPriceCheckShortcut: async () => calls.push('price-check-shortcut'),
    syncShortcuts: async () => {
      calls.push('shortcuts')
      throw new Error('Alt+3 注册失败')
    }
  }), /Alt\+3 注册失败/)
  assert.deepEqual(calls, ['shortcuts'])
})

test('本地重置会等待模块恢复并把警告返回页面', async () => {
  const calls = []
  const result = await resetApplicationSettings({
    stopAutomations: async () => ({ success: true, stopped: [], failed: [] }),
    resetStoredSettings: async () => {
      calls.push('settings:start')
      await Promise.resolve()
      calls.push('settings:end')
      return { warnings: [{ id: 'feature:bag', message: '存取后台恢复失败' }] }
    },
    resetInterfaceDetection: () => calls.push('interface'),
    resetControlOverlayOffset: async () => calls.push('offset'),
    syncPriceCheckShortcut: async () => calls.push('price-check-shortcut'),
    syncShortcuts: async () => calls.push('shortcuts')
  })

  assert.deepEqual(calls.slice(0, 4), ['shortcuts', 'settings:start', 'settings:end', 'interface'])
  assert.deepEqual(result.warnings, [{ id: 'feature:bag', message: '存取后台恢复失败' }])
})
