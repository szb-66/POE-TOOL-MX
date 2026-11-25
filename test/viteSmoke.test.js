import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer, loadConfigFromFile } from 'vite'

const SMOKE_MODULES = [
  '/src/router/index.js',
  '/src/features/installFeatureRuntime.js',
  '/src/domains/priceCheck/PriceCheckView.vue',
  '/src/domains/priceCheck/PriceCheckOverlayView.vue',
  '/src/domains/items/ItemsView.vue',
  '/src/domains/items/components/ModuleOne.vue',
  '/src/domains/items/components/ModuleBatch.vue',
  '/src/domains/items/components/SpecializedCraftingPanel.vue',
  '/src/domains/items/components/AffixGoalEditor.vue',
  '/src/domains/map/MapView.vue',
  '/src/domains/map/components/MapFeasibilityNotice.vue',
  '/src/domains/settings/CoordinatePickerView.vue',
  '/src/domains/sanctum/SanctumView.vue',
  '/src/domains/sanctum/SanctumRoomRecognition.vue',
  '/src/domains/sanctum/SanctumOverlayView.vue',
  '/src/domains/sanctum/SanctumControlOverlayView.vue',
  '/src/domains/sanctum/SanctumLiveCalibration.vue',
  '/src/domains/sanctum/SanctumCalibration.vue',
  '/src/domains/sanctum/sanctumStore.js'
]

test('核心业务页面与路由可通过单一 Vite 开发服务器完成转换', async () => {
  const { config } = await loadConfigFromFile({ command: 'serve', mode: 'development' })
  const server = await createServer({
    ...config,
    configFile: false,
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, watch: null },
    appType: 'custom',
    logLevel: 'silent'
  })
  try {
    const results = await Promise.all(SMOKE_MODULES.map(async (url) => ({
      url,
      result: await server.transformRequest(url)
    })))
    for (const { url, result } of results) {
      assert.ok(result?.code, `Vite 转换失败：${url}`)
    }
  } finally {
    await server.close()
  }
})
