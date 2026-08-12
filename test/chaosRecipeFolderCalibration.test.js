import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normalizeChaosRecipeSettings } from '../src/stores/chaosRecipe.js'
import { applyManualFolderState } from '../electron/modules/chaosRecipe/service.js'
import { stashCalibrationKey } from '../electron/modules/chaosRecipe/layout.js'

test('旧四键混沌配方校准迁移为文件夹内外两套区域', () => {
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
  const folderQuad = { left: 50, top: 60, right: 1250, bottom: 1260 }
  const settings = normalizeChaosRecipeSettings({ calibration: { normal, quad, folderQuad } })

  assert.deepEqual(settings.calibration.root, normal)
  assert.deepEqual(settings.calibration.folder, {
    ...folderQuad,
    displayId: '',
    scaleFactor: 1,
    capturedAt: ''
  })
  assert.deepEqual(Object.keys(settings.calibration), ['root', 'folder'])
  assert.equal(settings.activeRecipeId, 'chaos')
  assert.equal(normalizeChaosRecipeSettings({ activeRecipeId: 'fusing' }).activeRecipeId, 'fusing')
  assert.equal(normalizeChaosRecipeSettings({ activeRecipeId: 'unknown' }).activeRecipeId, 'chaos')
})

test('混沌配方忽略旧模块操作等待并只保留业务设置', () => {
  const settings = normalizeChaosRecipeSettings({ operationDelayMs: 120, operationTimingVersion: 2 })
  assert.equal('operationDelayMs' in settings, false)
  assert.equal('operationTimingVersion' in settings, false)
})

test('仓库文件夹归属按赛季和仓库页持久化，默认位于文件夹外', () => {
  const settings = normalizeChaosRecipeSettings({
    tabOverrides: {
      S29先祖再临: {
        'tab-1': { name: '当前临时页', inFolder: true, folderName: '配方文件夹' }
      },
      damaged: []
    }
  })

  assert.deepEqual(settings.tabFolderStates, {
    S29先祖再临: {
      'tab-1': true
    }
  })
  const apiMarkedFolder = { id: 'tab-2', name: '临时', inFolder: true, parent: 'folder-id' }
  assert.equal(applyManualFolderState(apiMarkedFolder).inFolder, false)
  assert.equal(stashCalibrationKey(applyManualFolderState(apiMarkedFolder)), 'root')
  assert.equal(stashCalibrationKey(applyManualFolderState(apiMarkedFolder, true)), 'folder')
})

test('混沌配方页面只提供文件夹内外两类校准和仓库标识', () => {
  const panel = readFileSync(
    new URL('../src/domains/shop/ChaosRecipePanel.vue', import.meta.url),
    'utf8'
  )
  const variables = readFileSync(
    new URL('../src/styles/variables.less', import.meta.url),
    'utf8'
  )

  for (const key of ['root', 'folder']) {
    assert.match(panel, new RegExp(`key: '${key}'`))
  }
  assert.doesNotMatch(panel, /key: '(?:normal|quad|folderNormal|folderQuad)'/)
  assert.match(panel, /普通与大型共用/)
  assert.match(panel, /tab\.inFolder/)
  assert.match(panel, />文件夹</)
  assert.match(panel, /开启表示位于文件夹内/)
  assert.match(panel, /tab\.type === 'quad' \? '大型' : '普通'/)
  assert.match(panel, /missingCalibrationLabels/)
  assert.match(panel, /旧接口无法判断仓库页是否在文件夹内/)
  assert.match(panel, /updateTabFolderState/)
  assert.match(panel, /class="tab-card"/)
  assert.match(panel, /tab-card\.active/)
  assert.match(panel, /tab-card:hover[^}]*background/)
  assert.doesNotMatch(panel, /tab-card\.active\s*\{[^}]*background/)
  assert.doesNotMatch(panel, /var\(--border-light\)/)
  assert.match(variables, /--border-lighter:/)
  assert.match(panel, /toggleTabSelection/)
  assert.doesNotMatch(panel, /tab-override-row/)
  assert.doesNotMatch(panel, /扫描当前游戏仓库页/)
  for (const text of ['商店配方状态', 'recipeCards', 'activeRecipeId', 'activeSelectedItemIds', '默认全选']) {
    assert.match(panel, new RegExp(text))
  }
})
