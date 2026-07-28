import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normalizeChaosRecipeSettings } from '../src/stores/chaosRecipe.js'

test('旧混沌配方校准仅迁移为根目录校准', () => {
  const normal = {
    left: 10,
    top: 20,
    right: 1210,
    bottom: 1220,
    displayId: 'display-1',
    scaleFactor: 1.5,
    capturedAt: '2026-07-28T00:00:00.000Z'
  }
  const quad = { left: 30, top: 40, right: 2430, bottom: 2440 }
  const settings = normalizeChaosRecipeSettings({ calibration: { normal, quad } })

  assert.deepEqual(settings.calibration.normal, normal)
  assert.deepEqual(settings.calibration.quad, {
    ...quad,
    displayId: '',
    scaleFactor: 1,
    capturedAt: ''
  })
  assert.equal(settings.calibration.folderNormal, null)
  assert.equal(settings.calibration.folderQuad, null)
})

test('混沌配方页面提供四类校准和文件夹仓库标识', () => {
  const panel = readFileSync(
    new URL('../src/domains/shop/ChaosRecipePanel.vue', import.meta.url),
    'utf8'
  )

  for (const key of ['normal', 'quad', 'folderNormal', 'folderQuad']) {
    assert.match(panel, new RegExp(`key: '${key}'`))
  }
  assert.match(panel, /tab\.inFolder/)
  assert.match(panel, /missingCalibrationLabels/)
})
