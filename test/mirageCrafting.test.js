import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { MIRAGE_EQUIPMENT_CURRENCIES, MIRAGE_RULESET } from '../electron/modules/crafting/mirageRules.js'
import { createManualSession, inspectManualCurrencies } from '../electron/modules/crafting/manualCrafting.js'
import { normalizeCraftingDataset } from '../electron/modules/crafting/model.js'

const dataset = normalizeCraftingDataset(JSON.parse(await readFile('electron/assets/crafting-data/dataset.json', 'utf8')))

test('3.28 Mirage 装备通货公开真实作用且在缺少专属物品模型时安全禁用', () => {
  assert.deepEqual(MIRAGE_RULESET, { game: 'poe1', patch: '3.28', league: 'Mirage', locale: 'zh-CN' })
  assert.deepEqual(MIRAGE_EQUIPMENT_CURRENCIES.map((entry) => entry.id), [
    'currency:refracting-fog', 'currency:volatile-vaal-orb',
    'currency:coin-of-restoration', 'currency:coin-of-desecration'
  ])
  const base = dataset.bases.find((entry) => entry.name === '大型星团珠宝') ?? dataset.bases[0]
  const session = createManualSession(dataset, { baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 328 })
  const catalog = inspectManualCurrencies(dataset, session)
  for (const definition of MIRAGE_EQUIPMENT_CURRENCIES) {
    const item = catalog.find((entry) => entry.id === definition.id)
    assert.ok(item, `${definition.name} 未进入手动通货目录`)
    assert.equal(item.canApply, false)
    assert.equal(item.description, definition.effect)
    assert.equal(item.unavailableReason, definition.unsupportedReason)
    assert.match(item.unavailableReason, /当前模拟器|当前状态模型/)
  }
})
