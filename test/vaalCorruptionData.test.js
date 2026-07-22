import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { normalizeCraftingDataset } from '../electron/modules/crafting/model.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const dataset = normalizeCraftingDataset(JSON.parse(readFileSync(path.join(dirname, '..', 'electron', 'assets', 'crafting-data', 'dataset.json'), 'utf8')))

test('3.28 真实快照包含受支持装备的瓦尔腐化隐式且排除专属对象', () => {
  assert.equal(dataset.corruptedImplicitFamilies.length, 168)
  assert.equal(dataset.corruptedImplicitFamilies.reduce((sum, family) => sum + family.tiers.length, 0), 205)
  const classes = new Set(dataset.corruptedImplicitFamilies.flatMap((family) => family.itemClasses))
  for (const itemClass of ['Ring', 'Amulet', 'Belt', 'Wand', 'Bow', 'Quiver', 'Helmet', 'Gloves', 'Boots', 'BodyArmour', 'Shield']) assert.ok(classes.has(itemClass), `缺少 ${itemClass}`)
  for (const unsupported of ['Jewel', 'AbyssJewel', 'Map', 'FishingRod']) assert.equal(classes.has(unsupported), false)
})

test('腐化隐式阶级保存等级、文本、数值、类别权重和稳定引用', () => {
  for (const family of dataset.corruptedImplicitFamilies) {
    assert.ok(family.id && family.effectKey && family.itemClasses.length && family.tiers.length)
    for (const tier of family.tiers) {
      assert.ok(tier.id && tier.requiredLevel >= 1 && tier.text)
      assert.ok(family.itemClasses.some((itemClass) => tier.weights[itemClass] > 0))
      assert.ok(Array.isArray(tier.values) && Array.isArray(tier.displayTags))
    }
  }
})
