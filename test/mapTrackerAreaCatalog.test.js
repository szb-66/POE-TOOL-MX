import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyArea } from '../electron/modules/mapTracker/areaCatalog.js'

test('地图目录优先使用中文名并安全分类未知地图', () => {
  assert.deepEqual(classifyArea('MapWorldsCemetery'), {
    version: 1, areaId: 'MapWorldsCemetery', areaName: '晨曦墓地', type: 'map', supported: true
  })
  assert.equal(classifyArea('MapWorldsSomeNewMap').areaName, 'Some New Map')
  assert.equal(classifyArea('MapWorldsSomeNewMap').type, 'map')
  assert.equal(classifyArea('UnrelatedArea').supported, false)
})
