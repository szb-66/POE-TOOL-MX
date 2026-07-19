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
import { validateShortcuts } from '../src/utils/shortcutValidator.js'
import { toElectronAccelerator } from '../src/utils/electronAccelerator.js'

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

test('完整六字段地图样例可解析替代阶级写法和全部扩展基底', () => {
  const item = parseItemInfo(byId['map-t17'])
  assert.equal(item.category, '地图')
  assert.equal(item.mapTier, 17)
  assert.equal(item.moreMaps, 35)
  assert.equal(item.moreScarabs, 70)
  assert.equal(item.moreCurrency, 45)
})

test('页面说明引用全部受测样例', () => {
  assert.equal(ITEM_FORMAT_GUIDANCE.examples.length, 6)
  assert.equal(MAP_FORMAT_GUIDANCE.examples.length, 4)
  assert.equal(SUPPORTED_FORMAT_EXAMPLES.length, 10)
})

test('所有格式指导示例均可被真实解析器识别', () => {
  for (const example of SUPPORTED_FORMAT_EXAMPLES) {
    const item = parseItemInfo(example.text)
    assert.ok(item, example.id)
    assert.ok(item.category, `${example.id} 缺少类别`)
    assert.ok(item.rarity, `${example.id} 缺少稀有度`)
  }
})

test('魔法物品区分基底属性和后缀', () => {
  const item = parseItemInfo(byId['item-magic-implicit'])
  assert.equal(item.rarity, '魔法')
  assert.deepEqual(item.implicitMods, ['+25% 火焰抗性'])
  assert.equal(item.modifiers.find(mod => mod.type === 'suffix').name, '火山之')
})

test('多行势力词缀归为同一记录且括号说明不进入匹配文本', () => {
  const item = parseItemInfo(byId['item-multiline-influence'])
  assert.deepEqual(item.influences, ['shaper'])
  assert.equal(item.modifiers[0].lines.length, 2)
  assert.match(item.modifiers[0].text, /增大范围[\s\S]*效果区域扩大 9%/)
  assert.equal(item.explicitMods.some(mod => mod.includes('冰霜元素异常状态指')), false)
})

test('传奇、未鉴定、腐化和不可改变状态可解析', () => {
  assert.equal(parseItemInfo(byId['item-unique']).isLegendary, true)
  const unidentified = parseItemInfo(byId['item-unidentified'])
  assert.equal(unidentified.isUnidentified, true)
  assert.deepEqual(unidentified.influences, ['shaper'])
  assert.equal(parseItemInfo(byId['map-corrupted']).isCorrupted, true)
  assert.equal(parseItemInfo(byId['map-unmodifiable']).isUnmodifiable, true)
})

test('详细格式中的固定说明和使用描述不会成为可匹配词缀', () => {
  const item = parseItemInfo(byId['map-unmodifiable'])
  assert.equal(item.explicitMods.some(mod => mod.includes('私人地图装置')), false)
  assert.equal(item.explicitMods.some(mod => mod.includes('出售获得通货')), false)
  assert.equal(item.explicitMods.some(mod => mod.startsWith('奖励:')), false)
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

test('快捷键校验覆盖战斗辅助键、格式和大小写冲突', () => {
  assert.equal(validateShortcuts({ itemStart: 'Alt+1', potionStart: 'Numpad7', portal: 'Numpad2' }).isValid, true)
  assert.equal(validateShortcuts({ itemStart: 'Alt+1', potionStart: 'alt+1' }).isValid, false)
  assert.equal(validateShortcuts({ potionStart: 'Numpad7', portal: 'num7' }).isValid, false)
  assert.equal(validateShortcuts({ portal: 'not a shortcut' }).isValid, false)
})

test('用户可读的小键盘键名会转换为 Electron accelerator', () => {
  assert.equal(toElectronAccelerator('Numpad7'), 'num7')
  assert.equal(toElectronAccelerator('Ctrl+Numpad2'), 'Ctrl+num2')
  assert.equal(toElectronAccelerator('Alt+1'), 'Alt+1')
})
