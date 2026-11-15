import test from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import { parseItemInfo as parseFrontendItem } from '../src/utils/clipboard.js'
import { parseBagItemHeader } from '../src/utils/bagConfig.js'
import { normalizeItemTextLanguage } from '../shared/itemTextLanguage.js'
import { runPython } from './helpers/python.js'

const equipment = tierLine => `Item Class: Rings
Rarity: Rare
Storm Ring
Iron Ring
--------
Item Level:85
${tierLine}
--------
+60 to maximum Life
25% increased Rarity of Items found`

test('显式Item Tier作为独立可选数值，物品等级和真实词缀保持原值', () => {
  const text = equipment('Item Tier:5')
  assert.match(normalizeItemTextLanguage(text), /^物品阶级: 5$/m)
  for (const parse of [parseItemInfo, parseFrontendItem]) {
    const parsed = parse(text)
    assert.equal(parsed.itemTier, 5)
    assert.equal(parsed.level, 85)
    assert.deepEqual(parsed.explicitMods, ['+60 to maximum Life', '25% increased Rarity of Items found'])
    assert.equal(parse(normalizeItemTextLanguage(text)).itemTier, 5)
  }
  assert.equal(parseBagItemHeader(text).itemTier, 5)
  assert.equal(parseBagItemHeader(normalizeItemTextLanguage(text)).itemTier, 5)
})

test('词缀Tier与稀有度或名称后缀不推断为物品Item Tier', () => {
  const text = equipment('').replace('+60 to maximum Life', '{ Prefix Modifier "Athlete\'s" (Tier: 1) — Life }\n+60 to maximum Life')
  const detailed = parseItemInfo(text)
  assert.equal('itemTier' in detailed, false)
  assert.equal(detailed.modifiers[0].tier, 1)
  const withItemTier = parseItemInfo(text.replace('Item Level:85', 'Item Level:85\nItem Tier:5'))
  assert.equal(withItemTier.itemTier, 5)
  assert.equal(withItemTier.modifiers[0].tier, 1)
  for (const parse of [parseItemInfo, parseFrontendItem, parseBagItemHeader]) {
    assert.equal('itemTier' in parse(equipment('').replace('Storm Ring', 'Storm Ring of Tier 5')), false)
  }
  assert.equal('itemTier' in parseItemInfo('Item Class: Maps\nRarity: Rare\nStorm Map\nBeach Map\n--------\nMap Tier: 5\nItem Level:85'), false)
})

test('无效或未见格式的Item Tier不记录数值也不进入主解析器词缀', () => {
  for (const value of ['unknown', '0', '-1', '1.5', '9007199254740992', '5 (new format)']) {
    const text = equipment(`Item Tier:${value}`)
    for (const parse of [parseItemInfo, parseFrontendItem, parseBagItemHeader]) assert.equal('itemTier' in parse(text), false)
    assert.deepEqual(parseItemInfo(text).explicitMods, ['+60 to maximum Life', '25% increased Rarity of Items found'])
  }
})

test('背包Python仅解析相同显式结构行，未给出时不增加字段', () => {
  const script = fileURLToPath(new URL('../src/assets/scripts/bag_auto_stash_template.py', import.meta.url))
  const texts = [equipment('Item Tier:5'), normalizeItemTextLanguage(equipment('Item Tier:5')), equipment(''), equipment('{ Prefix Modifier "Tiered" (Tier: 2) }'), equipment('Item Tier:1.5')]
  const result = runPython(`
import ast, json, re
tree = ast.parse(open(${JSON.stringify(script)}, encoding="utf-8").read())
functions = [node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == "parse_item_header"]
scope = {"re": re}
exec(compile(ast.Module(body=functions, type_ignores=[]), "item-tier", "exec"), scope)
texts = json.loads(${JSON.stringify(JSON.stringify(texts))})
print(json.dumps([scope["parse_item_header"](text) for text in texts]))
`)
  assert.equal(result[0].itemTier, 5)
  assert.equal(result[1].itemTier, 5)
  assert.equal(result[0].itemLevel, 85)
  assert.ok(result.slice(2).every(item => !Object.hasOwn(item, 'itemTier')))
})
