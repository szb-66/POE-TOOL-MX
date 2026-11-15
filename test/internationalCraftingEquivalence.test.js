import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { matchAffixes } from '../electron/modules/item/matcher.js'
import { ItemFootprintRegistry, loadServerFootprintCatalog } from '../electron/modules/items/footprintRegistry.js'

const entry = (en, cn, kind = 'dat') => ({ kind, table: kind === 'dat' ? 'baseitemtypes' : 'stat', id: en, field: 'Text', en, cn, tw: cn, sourceHash: createHash('sha256').update(en).digest('hex') })
const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => [entry('Coral Ring', '珊瑚戒指'), entry('{0:+d} to maximum Life', '{0:+d} 最大生命', 'stat')], revision: () => 'r1' })
const item = (body, header = '{ Prefix Modifier "Healthy" (Tier: 1) }') => `Item Class: Rings\nRarity: Rare\nDoom Circle\nCoral Ring\n--------\nItem Level: 84\n--------\n${header}\n${body}`
const matches = value => matchAffixes(value, [{ requiredAffixes: [{ kind: 'catalog', effectPattern: '+# to maximum Life', minTier: 1 }], selectedAffixes: [] }]).isMatch

test('中英混合详细数值的连字符和全角括号不影响实际数值、Tier及制作目录条件', () => {
  for (const dash of ['-', '–', '—']) for (const [open, close] of [['(', ')'], ['（', '）']]) for (const effect of ['to maximum Life', '最大生命']) {
    const text = item(`+89${open}80${dash}99${close} ${effect}`)
    const parsed = runtime.parseItem(text, 'r1')
    assert.equal(parsed.modifiers[0].text, '+89 to maximum Life', text)
    assert.equal(parsed.modifiers[0].tier, 1)
    assert.equal(parsed.originalText, text)
    assert.equal(matches(parsed), true, text)
  }
})

test('英文、汉化与混合文本的未知或冲突详细头都停止，不可绕过结构校验', () => {
  for (const effect of ['to maximum Life', '最大生命']) for (const header of ['{ UnknownOrigin Prefix Modifier "Healthy" (Tier: 1) }', '{ Prefix Modifier "Healthy" (Tier: 1, Tier: 2) }']) {
    assert.throws(() => runtime.parseItem(item(`+89 ${effect}`, header), 'r1'), error => error.code === 'LOCALIZATION_HEADER_UNRESOLVED')
  }
})

test('无汉化启动沿真实国际服已知物品目录下发精华身份，不需要候选词库', () => {
  const registry = new ItemFootprintRegistry(loadServerFootprintCatalog({ serverId: 'international' }))
  const names = Object.keys(registry.snapshot().items).map(key => key.split('\u001f')[1]).filter(Boolean)
  const snapshot = new LocalizationRuntime({ serverId: 'international', baseNames: () => names }).snapshot()
  assert.equal(snapshot.revision, '')
  assert.ok(snapshot.canonicalEssenceNames.some(name => name.toLowerCase() === 'deafening essence of greed'))
  assert.ok(snapshot.canonicalEssenceNames.length > 50)
  assert.deepEqual(snapshot.essenceNames, [])
  assert.equal(snapshot.canonicalEssenceNames.some(name => name.includes('DefinitelyNotAnEssence')), false)
})
