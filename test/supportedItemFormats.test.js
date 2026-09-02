import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import { loadTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { createPriceCheckModel } from '../electron/modules/priceCheck/query.js'
import {
  ITEM_FORMAT_EXAMPLES,
  CHART_FORMAT_EXAMPLES,
  MAP_FORMAT_EXAMPLES,
  SUPPORTED_FORMAT_EXAMPLES
} from '../src/utils/supportedItemFormats.js'
import { toGlobalDipPoint } from '../electron/modules/window/coordinates.js'
import { validateCraftingConfig } from '../src/utils/validation.js'
import { validateShortcuts } from '../src/utils/shortcutValidator.js'
import { toElectronAccelerator } from '../src/utils/electronAccelerator.js'

const byId = Object.fromEntries(SUPPORTED_FORMAT_EXAMPLES.map(example => [example.id, example.text]))

test('制作和地图页面不再展示格式说明面板', () => {
  const itemsView = readFileSync(new URL('../src/domains/items/ItemsView.vue', import.meta.url), 'utf8')
  const mapView = readFileSync(new URL('../src/domains/map/MapView.vue', import.meta.url), 'utf8')
  const panelPath = new URL('../src/components/common/SupportedFormatPanel.vue', import.meta.url)

  assert.doesNotMatch(itemsView, /SupportedFormatPanel|ITEM_FORMAT_GUIDANCE/)
  assert.doesNotMatch(mapView, /SupportedFormatPanel|(?:MAP|CHART)_FORMAT_GUIDANCE/)
  assert.equal(existsSync(panelPath), false)
})

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
  assert.ok(item.explicitMods.some(mod => mod.includes('全部最大抗性')))
})

test('完整六字段地图样例可解析替代阶级写法和全部扩展基底', () => {
  const item = parseItemInfo(byId['map-t17'])
  assert.equal(item.category, '地图')
  assert.equal(item.mapTier, 17)
  assert.equal(item.moreMaps, 35)
  assert.equal(item.moreScarabs, 70)
  assert.equal(item.moreCurrency, 45)
})

test('集中样例集合覆盖物品、地图和航海海图', () => {
  assert.equal(ITEM_FORMAT_EXAMPLES.length, 7)
  assert.equal(MAP_FORMAT_EXAMPLES.length, 4)
  assert.equal(CHART_FORMAT_EXAMPLES.length, 3)
  assert.equal(SUPPORTED_FORMAT_EXAMPLES.length, 14)
})

test('航海海图样例解析身份、奖励数值和特殊状态', () => {
  const identified = parseItemInfo(byId['chart-identified'])
  assert.equal(identified.category, '海图')
  assert.equal(identified.name, '航海 跋涉')
  assert.equal(identified.baseName, '金沙海床海图')
  assert.equal(identified.areaName, '深渊平原')
  assert.equal(identified.areaLevel, 83)
  assert.equal(identified.itemRarity, 98)
  assert.equal(identified.deadmanSulphur, 30)
  assert.equal(identified.chartShape, '直线')
  assert.equal(identified.detailedMods[1].lines.length, 2)
  assert.equal(identified.explicitMods.some(mod => mod.includes('完成测绘')), false)
  assert.equal(identified.explicitMods.some(mod => mod.includes('瓦莱丽')), false)

  const unidentified = parseItemInfo(byId['chart-unidentified'])
  assert.equal(unidentified.name, '珊瑚密林海图')
  assert.equal(unidentified.baseName, '珊瑚密林海图')
  assert.equal(unidentified.areaName, '海底林地')
  assert.equal(unidentified.isUnidentified, true)
  assert.deepEqual(unidentified.explicitMods, [])

  const corrupted = parseItemInfo(byId['chart-corrupted'])
  assert.equal(corrupted.itemQuantity, 110)
  assert.equal(corrupted.monsterPackSize, 16)
  assert.equal(corrupted.deadmanSulphur, 30)
  assert.equal(corrupted.isCorrupted, true)
})

test('所有代表性格式样例均可被真实解析器识别', () => {
  for (const example of SUPPORTED_FORMAT_EXAMPLES) {
    const item = parseItemInfo(example.text)
    assert.ok(item, example.id)
    assert.ok(item.category, `${example.id} 缺少类别`)
    assert.ok(item.rarity, `${example.id} 缺少稀有度`)
  }
})

test('词缀补丁样例可解析破碎、前后缀与古灵固有词缀', () => {
  const item = parseItemInfo(byId['item-affix-patch'])
  assert.equal(item.category, '鞋子')
  assert.equal(item.isFractured, true)
  assert.deepEqual(item.influences, ['searing-exarch', 'eater-of-worlds'])
  assert.deepEqual(item.implicitMods, ['移动速度加快 7%', '你造成的点燃的伤害生效速度加快 7%'])

  const fractured = item.modifiers.find(mod => mod.type === 'fractured')
  assert.equal(fractured.affixType, 'prefix')
  assert.equal(fractured.name, '鼓舞的')
  assert.equal(fractured.tier, 1)
  assert.deepEqual(fractured.lines, ['该装备的护甲与能量护盾提高 99%'])

  const life = item.modifiers.find(mod => mod.name === '运动员的')
  assert.equal(life.type, 'prefix')
  assert.equal(life.tier, 1)
  assert.deepEqual(life.lines, ['+126 最大生命'])

  const chaos = item.modifiers.find(mod => mod.name === '巴曼斯之')
  assert.equal(chaos.type, 'suffix')
  assert.equal(chaos.tier, 1)
  assert.deepEqual(chaos.lines, ['+31% 混沌抗性'])

  assert.equal(item.explicitMods.some(mod => mod.includes('(115-129)') || mod.includes('(92-100)')), false)
  assert.equal(item.explicitMods.some(mod => mod.includes('近期内意指')), false)
  assert.equal(item.explicitMods.some(mod => mod.includes('他们会在短时间内')), false)
  assert.equal(item.explicitMods.length, 6)
  assert.equal(item.affixFormatUnsupported, false)
})

test('未适配的词缀补丁格式被标记，受支持格式不误报', () => {
  const item = parseItemInfo(`物品类别: 鞋子
稀 有 度: 稀有
咒缚 足迹
圣骑士长靴
--------
物品等级: 84
--------
{ 上级前缀 "鼓舞的" (T1)— 生命 }
+126(115-129) 最大生命`)
  assert.equal(item.affixFormatUnsupported, true)

  const zeroMods = parseItemInfo(`物品类别: 戒指
稀 有 度: 魔法
火山之红玉戒指
--------
物品等级: 72
--------`)
  assert.equal(zeroMods.affixFormatUnsupported, true)

  const normal = parseItemInfo(`物品类别: 胸甲
稀 有 度: 普通
星芒战铠
--------
物品等级: 86
--------`)
  assert.equal(normal.affixFormatUnsupported, false)
  assert.equal(parseItemInfo(byId['item-basic']).affixFormatUnsupported, false)
  assert.equal(parseItemInfo(byId['item-unidentified']).affixFormatUnsupported, false)
  assert.equal(parseItemInfo(byId['map-normal']).affixFormatUnsupported, false)
})

test('简改词缀 v1 的 ▲/▽ 标记解析后与官方措辞结果一致', () => {
  let pendingMark = ''
  const withMarkers = byId['item-affix-patch'].split('\n').map((line) => {
    if (line.startsWith('{')) {
      pendingMark = /前缀词缀/.test(line) ? '▲' : (/后缀词缀/.test(line) ? '▽' : '')
      return line
    }
    if (line === '--------') {
      pendingMark = ''
      return line
    }
    if (pendingMark && line && !/^[（(]/.test(line)) {
      const marked = `${pendingMark} ${line}`
      pendingMark = ''
      return marked
    }
    return line
  }).join('\n')

  const signature = (mods) => mods.map(({ originalLines, ...rest }) => rest)
  const base = parseItemInfo(byId['item-affix-patch'])
  const marked = parseItemInfo(withMarkers)
  assert.deepEqual(signature(marked.modifiers), signature(base.modifiers))
  assert.deepEqual(marked.explicitMods, base.explicitMods)
  assert.deepEqual(marked.implicitMods, base.implicitMods)
})

test('功能补丁的行首标记与尾部注释剥除且改写文案保留原文', async () => {
  const { catalog } = await loadTradeCatalog(path.resolve('electron/modules/priceCheck/catalog.json'))
  const text = `物品类别: 鞋子
稀 有 度: 稀有
咒缚 足迹
圣骑士长靴
--------
物品等级: 84
--------
{ 破碎的 ▲ 前缀词缀 "鼓舞的" (等阶：1)— 防御, 护甲, 能量护盾 }
▲ 此装备增加 99(92-100)% 护甲与能量护盾 [④/③双缀][①单(★100)]
{ ▲ 前缀词缀 "运动员的" (等阶：1)— 生命 }
▲ +126(115-129) 最大生命 [①手|鞋|链]
{ ▽ 后缀词缀 "巴曼斯之" (等阶：1)— 混沌, 抗性 }
▽ +31(31-35)% 混沌抗性 [①](★35%)`
  const item = parseItemInfo(text)
  const fractured = item.modifiers.find(mod => mod.type === 'fractured')
  assert.equal(fractured.affixType, 'prefix')
  assert.deepEqual(fractured.lines, ['此装备增加 99% 护甲与能量护盾'])
  assert.deepEqual(item.modifiers.find(mod => mod.name === '运动员的').lines, ['+126 最大生命'])
  assert.deepEqual(item.modifiers.find(mod => mod.name === '巴曼斯之').lines, ['+31% 混沌抗性'])
  assert.equal(item.explicitMods.some(mod => mod.includes('★') || mod.includes('[①')), false)

  const model = createPriceCheckModel(item, catalog, { initialSelection: 'none' })
  const rewritten = model.unknownStats.find(stat => stat.text.includes('此装备增加'))
  assert.ok(rewritten, '改写文案应进入未映射词缀')
  assert.equal(rewritten.text, '此装备增加 99% 护甲与能量护盾')
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

test('快捷键校验覆盖受支持功能、格式和大小写冲突', () => {
  assert.equal(validateShortcuts({ itemStart: 'Alt+1', storyPrevious: 'Numpad7', portal: 'Numpad2' }).isValid, true)
  assert.equal(validateShortcuts({ itemStart: 'Alt+1', storyPrevious: 'alt+1' }).isValid, false)
  assert.equal(validateShortcuts({ storyPrevious: 'Numpad7', portal: 'num7' }).isValid, false)
  assert.equal(validateShortcuts({ portal: 'not a shortcut' }).isValid, false)
})

test('用户可读的小键盘键名会转换为 Electron accelerator', () => {
  assert.equal(toElectronAccelerator('Numpad7'), 'num7')
  assert.equal(toElectronAccelerator('Ctrl+Numpad2'), 'Ctrl+num2')
  assert.equal(toElectronAccelerator('Alt+1'), 'Alt+1')
})
