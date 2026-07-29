import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeStashContents,
  normalizeStashTabs,
  resolveRecipeItemClass
} from '../electron/modules/chaosRecipe/normalizer.js'

function iconFor(path) {
  const encoded = Buffer.from(`[25,14,{"f":"2DItems/${path}","w":1,"h":1,"scale":1}]`)
    .toString('base64')
    .replace(/=+$/, '')
  return `https://poecdn.game.qq.com/gen/image/${encoded}/hash/item.png`
}

test('从国服 CDN 图标识别配方装备类别', () => {
  assert.equal(resolveRecipeItemClass({ icon: iconFor('Armours/Helmets/HelmetStr1') }), 'helmet')
  assert.equal(resolveRecipeItemClass({ icon: iconFor('Weapons/TwoHandWeapons/TwoHandSword1') }), 'twoHandWeapon')
  assert.equal(resolveRecipeItemClass({ icon: iconFor('Armours/Shields/ShieldStr1') }), 'oneHandWeapon')
  assert.equal(resolveRecipeItemClass({ icon: iconFor('Quivers/Quiver1') }), null)
})

test('归一化新版和旧版仓库标签并排除特殊仓库', () => {
  const modern = normalizeStashTabs({
    stashes: [
      { id: 'a', name: '普通', type: 'PremiumStash' },
      { id: 'b', name: '大型', type: 'QuadStash' },
      { id: 'c', name: '通货', type: 'CurrencyStash' }
    ]
  })
  assert.deepEqual(modern.map((tab) => [tab.type, tab.columns, tab.supported]), [
    ['normal', 12, true],
    ['quad', 24, true],
    ['normal', 12, false]
  ])
  assert.equal(normalizeStashTabs({ tabs: [{ n: '旧仓库', type: 'NormalStash', index: 3 }] })[0].name, '旧仓库')
  assert.equal(normalizeStashTabs({ tabs: [{ n: '旧仓库', type: 'NormalStash', i: 17 }] })[0].index, 17)
})

test('归一化仓库物品保留配方和坐标字段', () => {
  const result = normalizeStashContents({
    items: [{
      id: 'item-1',
      x: 4,
      y: 5,
      w: 2,
      h: 3,
      ilvl: 71,
      frameType: 2,
      identified: false,
      typeLine: '测试胸甲',
      icon: iconFor('Armours/BodyArmours/BodyStr1')
    }]
  }, { id: 'tab-1', index: 2, name: '配方', type: 'NormalStash' })
  assert.deepEqual(result.items[0], {
    id: 'item-1',
    tabId: 'tab-1',
    tabIndex: 2,
    tabName: '配方',
    tabType: 'normal',
    inFolder: false,
    x: 4,
    y: 5,
    width: 2,
    height: 3,
    itemLevel: 71,
    frameType: 2,
    rarity: 'rare',
    identified: false,
    itemClass: 'bodyArmour',
    name: '',
    baseType: '测试胸甲',
    typeLine: '测试胸甲',
    icon: result.items[0].icon,
    sockets: [],
    influences: []
  })
})

test('归一化仓库物品保留插槽组和全部 truthy 势力键', () => {
  const result = normalizeStashContents({
    items: [{
      id: 'socketed-influenced',
      x: 0,
      y: 0,
      ilvl: 83,
      frameType: 2,
      typeLine: '测试胸甲',
      icon: iconFor('Armours/BodyArmours/BodyStr1'),
      sockets: [
        { group: 0, attr: 'S', sColour: 'R' },
        { group: 0, attr: 'D', sColour: 'G' },
        { group: 1, attr: 'I', sColour: 'B' },
        null,
        { group: 'bad', attr: 'S', sColour: 'R' }
      ],
      influences: { shaper: true, elder: false, crusader: 1, searing: true }
    }]
  }, { id: 'tab-1', index: 0, name: '配方页', type: 'NormalStash' })

  assert.deepEqual(result.items[0].sockets, [
    { group: 0, attr: 'S', sColour: 'R' },
    { group: 0, attr: 'D', sColour: 'G' },
    { group: 1, attr: 'I', sColour: 'B' }
  ])
  assert.deepEqual(result.items[0].influences, ['crusader', 'searing', 'shaper'])
})

test('国服详情响应中的嵌套物品数组仍可被识别', () => {
  const result = normalizeStashContents({
    data: {
      stash: {
        entries: [{
          id: 'nested-item',
          x: 1,
          y: 2,
          ilvl: 68,
          frameType: 2,
          typeLine: '测试头盔',
          icon: iconFor('Armours/Helmets/HelmetStr1')
        }]
      }
    }
  }, { id: 'tab-1', index: 0, name: '配方页', type: 'NormalStash' })

  assert.equal(result.items.length, 1)
  assert.equal(result.items[0].itemClass, 'helmet')
  assert.equal(result.diagnostics.normalizedItemCount, 1)
  assert.ok(result.diagnostics.itemArrayPaths.includes('data.stash.entries'))
})

test('未识别装备诊断只保留 CDN 分类目录', () => {
  const result = normalizeStashContents({
    items: [{
      id: 'unknown-item',
      x: 0,
      y: 0,
      ilvl: 70,
      frameType: 2,
      typeLine: '不进入诊断输出的物品名',
      icon: iconFor('Quivers/Quiver1')
    }]
  }, { id: 'tab-1', index: 0, name: '配方页', type: 'NormalStash' })

  assert.deepEqual(result.diagnostics.unrecognizedRareLevel60Hints, { Quivers: 1 })
  assert.equal(JSON.stringify(result.diagnostics).includes('不进入诊断输出的物品名'), false)
})

test('新版子仓库响应从父页包装的目标 children 中读取物品', () => {
  const result = normalizeStashContents({
    stash: {
      id: 'parent-id',
      children: [
        { id: 'other-id', items: [] },
        {
          id: 'child-id',
          items: [{
            id: 'child-item',
            x: 3,
            y: 4,
            ilvl: 69,
            frameType: 2,
            typeLine: '测试戒指',
            icon: iconFor('Accessories/Rings/Ring1')
          }]
        }
      ]
    }
  }, {
    id: 'child-id',
    parent: 'parent-id',
    index: 2,
    name: '2',
    type: 'NormalStash'
  })

  assert.equal(result.items.length, 1)
  assert.equal(result.items[0].itemClass, 'ring')
  assert.equal(result.tab.inFolder, true)
  assert.equal(result.items[0].inFolder, true)
  assert.equal(result.diagnostics.selectedItemArrayPath, 'stash.children.<selected>.items')
})

test('新版 parent 与旧版 folder 均归一化为文件夹仓库', () => {
  const tabs = normalizeStashTabs({
    tabs: [
      { id: 'root', type: 'NormalStash' },
      { id: 'modern-child', type: 'QuadStash', parent: 'folder-id' },
      { id: 'legacy-child', type: 'NormalStash', folder: '配方文件夹' }
    ]
  })

  assert.deepEqual(tabs.map((tab) => [tab.id, tab.inFolder]), [
    ['root', false],
    ['modern-child', true],
    ['legacy-child', true]
  ])
})
