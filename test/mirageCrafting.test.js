import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { CURRENT_EQUIPMENT_CURRENCIES, CURRENT_RULESET } from '../electron/modules/crafting/seasonalRules.js'
import { createManualSession, inspectManualCurrencies } from '../electron/modules/crafting/manualCrafting.js'
import { normalizeCraftingDataset } from '../electron/modules/crafting/model.js'

const dataset = normalizeCraftingDataset(JSON.parse(await readFile('electron/assets/crafting-data/dataset.json', 'utf8')))

test('S30 装备通货公开真实作用且在缺少专属物品模型时安全禁用', () => {
  assert.equal(CURRENT_RULESET.patch, '3.29')
  assert.equal(CURRENT_RULESET.season, 'S30')
  assert.deepEqual(CURRENT_EQUIPMENT_CURRENCIES.map((entry) => entry.id), [
    'currency:volatile-vaal-orb', 'currency:scrying-orb',
    'currency:enshrouding-crystal', 'currency:allflame-ducat'
  ])
  const base = dataset.bases.find((entry) => entry.name === '大型星团珠宝') ?? dataset.bases[0]
  const session = createManualSession(dataset, { baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 328 })
  const catalog = inspectManualCurrencies(dataset, session)
  for (const definition of CURRENT_EQUIPMENT_CURRENCIES) {
    const item = catalog.find((entry) => entry.id === definition.id)
    assert.ok(item, `${definition.name} 未进入手动通货目录`)
    assert.equal(item.canApply, false)
    assert.equal(item.description, definition.effect)
    assert.equal(item.unavailableReason, definition.unsupportedReason)
    assert.match(item.unavailableReason, /当前模拟器|当前.*状态模型/)
  }
})
