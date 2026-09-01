import test from 'node:test'
import assert from 'node:assert/strict'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import { buildCraftingAffixPayload } from '../electron/modules/item/craftingAffixPayload.js'
import {
  craftingModifierAffixType,
  craftingModifierTierLabel,
  craftingPanelModifiers
} from '../src/domains/overlay/craftingPanelModifiers.js'

test('制造面板同时显示破碎词缀和可变词缀', () => {
  const parsed = parseItemInfo([
    '物品类别: 珠宝',
    '稀 有 度: 魔法',
    '劈砍的威胁之赤红珠宝',
    '赤红珠宝',
    '--------',
    '物品等级: 83',
    '--------',
    '{ 破碎的 ▲ 前缀词缀 "劈砍的" (等阶：1)— 攻击, 速度 }',
    '斧类攻击的攻击速度加快 6%',
    '{ ▽ 后缀词缀 "威胁之" (等阶：1)— 暴击 }',
    '全域暴击率提高 10%'
  ].join('\n'))
  const itemInfo = { ...parsed, ...buildCraftingAffixPayload(parsed) }

  const displayed = craftingPanelModifiers(itemInfo)

  assert.deepEqual(displayed.map((modifier) => modifier.type), ['fractured', 'suffix'])
  assert.equal(displayed[0].text, '斧类攻击的攻击速度加快 6%')
  assert.equal(craftingModifierAffixType(displayed[0]), 'prefix')
  assert.equal(craftingModifierTierLabel(displayed[0]), 'P1')
})

test('旧数据没有完整 modifiers 时继续显示 detailedMods', () => {
  const detailedMods = [{ type: 'prefix', tier: 2, text: '+70 最大生命' }]
  assert.deepEqual(craftingPanelModifiers({ detailedMods }), detailedMods)
})
