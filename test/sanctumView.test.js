import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer, loadConfigFromFile } from 'vite'
import { availableFeatureCatalog, featureForRoute } from '../src/features/featureCatalog.js'

test('圣所页面及运行时通过 Vite 开发转换，正式导航不提前开放', async () => {
  assert.equal(availableFeatureCatalog().some(feature => feature.id === 'sanctum'), false)
  assert.equal(featureForRoute('/sanctum', { development: true }).id, 'sanctum')
  const { config } = await loadConfigFromFile({ command: 'serve', mode: 'development' })
  const server = await createServer({ ...config, configFile: false, optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    assert.ok((await server.transformRequest('/src/domains/sanctum/SanctumRoomRecognition.vue'))?.code)
    for (const name of ['SanctumRecognitionImage', 'SanctumMapGraph', 'SanctumMapLegend', 'SanctumSettings', 'SanctumRelics', 'SanctumRoomDetails', 'SanctumAltarGrid', 'SanctumRunObservation', 'SanctumView']) {
      assert.ok((await server.transformRequest(`/src/domains/sanctum/${name}.vue`))?.code)
      assert.ok((await server.transformRequest(`/src/domains/sanctum/${name}.vue?vue&type=style&index=0&scoped=true&lang.less`))?.code)
    }
    for (const url of ['/src/domains/sanctum/SanctumRunObservation.vue', '/src/domains/settings/CoordinatePickerView.vue', '/src/domains/sanctum/SanctumView.vue', '/src/domains/sanctum/SanctumRelicCalibration.vue', '/src/domains/sanctum/SanctumLiveCalibration.vue', '/src/domains/sanctum/SanctumOverlayView.vue', '/src/domains/sanctum/SanctumControlOverlayView.vue', '/src/domains/sanctum/SanctumCalibration.vue', '/src/domains/sanctum/sanctumStore.js',
      '/src/features/installFeatureRuntime.js', '/src/router/index.js']) {
      const result = await server.transformRequest(url)
      assert.ok(result?.code, url)
    }
  } finally { await server.close() }
})
