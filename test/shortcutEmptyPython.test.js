import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'

test('制作与地图脚本生成拒绝空紧急停止且不再隐式回退', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript, generateMapRollingScript } = await server.ssrLoadModule('/src/utils/python.js')
    assert.throws(() => generatePythonScript({
      globalShortcuts: { end: ' ' },
      currencyPositions: {},
      itemPosition: {},
      preset: {
        moduleTwo: { enabled: false },
        moduleThree: { enabled: false },
        moduleEldritch: { enabled: false }
      },
      filePaths: { itemInfoFile: 'item.txt', itemInfoResultFile: 'result.json' }
    }), /全局紧急停止快捷键不能为空/)
    assert.throws(() => generateMapRollingScript({
      globalShortcuts: { end: '' },
      currencyPositions: {},
      inventory: {},
      mapConfig: {}
    }), /全局紧急停止快捷键不能为空/)
  } finally {
    await server.close()
  }
})
