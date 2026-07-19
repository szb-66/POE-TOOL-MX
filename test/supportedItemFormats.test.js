import test from 'node:test'
import assert from 'node:assert/strict'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import {
  ITEM_FORMAT_GUIDANCE,
  MAP_FORMAT_GUIDANCE,
  SUPPORTED_FORMAT_EXAMPLES
} from '../src/utils/supportedItemFormats.js'
import { toGlobalDipPoint } from '../electron/modules/window/coordinates.js'
import { validateCraftingConfig } from '../src/utils/validation.js'

const byId = Object.fromEntries(SUPPORTED_FORMAT_EXAMPLES.map(example => [example.id, example.text]))

test('物品普通复制样例可解析基础字段、插槽和显式词缀', () => {
  const item = parseItemInfo(byId['item-basic'])
  assert.equal(item.category, '胸甲')
  assert.equal(item.rarity, '稀有')
  assert.equal(item.level, 86)
  assert.equal(item.quality, 20)
  assert.equal(item.socketsCount, 4)
  assert.equal(item.links, 3)
  assert.ok(item.explicitMods.includes('+96 最大生命'))
})

test('物品详细复制样例可解析详细、隐式和工艺词缀', () => {
  const item = parseItemInfo(byId['item-detailed'])
  assert.equal(item.category, '护身符')
  assert.equal(item.detailedMods.length, 2)
  assert.equal(item.detailedMods[0].name, '健壮的')
  assert.equal(item.detailedMods[0].text, '+89 最大生命')
  assert.deepEqual(item.implicitMods, ['+16 全能力'])
  assert.deepEqual(item.craftedMods, ['+20% 全域暴击伤害加成'])
})

test('普通地图样例可解析阶级、基础属性和外延词缀', () => {
  const item = parseItemInfo(byId['map-normal'])
  assert.equal(item.category, '异界地图')
  assert.equal(item.mapTier, 16)
  assert.equal(item.itemQuantity, 82)
  assert.equal(item.itemRarity, 41)
  assert.equal(item.monsterPackSize, 25)
  assert.ok(item.explicitMods.some(mod => mod.includes('元素抗性上限')))
})

test('高级地图样例可解析替代阶级写法和专用基础属性', () => {
  const item = parseItemInfo(byId['map-t17'])
  assert.equal(item.category, '地图')
  assert.equal(item.mapTier, 17)
  assert.equal(item.moreMaps, 35)
  assert.equal(item.moreScarabs, 70)
  assert.equal(item.moreCurrency, 45)
})

test('页面说明引用全部受测样例', () => {
  assert.equal(ITEM_FORMAT_GUIDANCE.examples.length, 2)
  assert.equal(MAP_FORMAT_GUIDANCE.examples.length, 2)
  assert.equal(SUPPORTED_FORMAT_EXAMPLES.length, 4)
})

test('窗口内坐标可转换为包含负原点的全局 DIP 坐标', () => {
  assert.deepEqual(
    toGlobalDipPoint({ x: -1920, y: -200 }, { x: 120.4, y: 80.7 }),
    { x: -1800, y: -119 }
  )
})

test('制作配置允许 Windows 虚拟桌面的负坐标', () => {
  const result = validateCraftingConfig({
    itemPosition: { x: -320, y: 240 },
    preset: {}
  })

  assert.equal(result.errors.some(error => error.includes('坐标无效')), false)
})
