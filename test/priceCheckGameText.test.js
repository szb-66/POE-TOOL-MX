import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createLocalizationDictionary } from '../electron/modules/localization/text.js'
import { applyGameTextPresentation } from '../electron/modules/priceCheck/gameText.js'

const entries = JSON.parse(readFileSync(new URL('./fixtures/price-check-game-text-entries.json', import.meta.url), 'utf8'))
const catalog = { currencyLabels: { chaos: 'Chaos Orb', divine: 'Divine Orb', transmute: 'Orb of Transmutation' } }
const text = {
  cn: '物品类别: 头部\n稀 有 度: 传奇\n节庆之面\n--------\n闪避值: 80\n能量护盾: 18\n--------\n物品等级: 84\n--------\n未鉴定',
  tw: '物品種類: 頭部\n稀有度: 傳奇\n節慶之面\n--------\n閃避值: 80\n能量護盾: 18\n--------\n物品等級: 84\n--------\n未鑑定',
  en: 'Item Class: Helmets\nRarity: Unique\nFestival Mask\n--------\nEvasion Rating: 80\nEnergy Shield: 18\n--------\nItem Level: 84\n--------\nUnidentified'
}
function model() {
  return {
    item: { name: 'Festival Mask', baseType: 'Festival Mask', category: '头部', rarity: '传奇' },
    identity: { name: '', type: 'Festival Mask', categoryLabel: '头盔' },
    identityResolution: { required: true, baseType: 'Festival Mask', candidates: [
      { key: 'a', name: 'Leer Cast', baseType: 'Festival Mask' },
      { key: 'b', name: 'Replica Leer Cast', baseType: 'Festival Mask' }
    ] },
    properties: [{ id: 'misc.itemLevel', label: '物品等级', min: 84 }, { label: '闪避' }, { label: '能量护盾' }],
    stats: [{ text: '+10 to maximum Life', displayText: '+10 最大生命', tags: ['Life', '護甲'] }]
  }
}

test('未鉴定传奇的实际游戏名、底材和全部通货按简体/繁体原文分别显示', () => {
  const resolver = createLocalizationDictionary(entries)
  for (const language of ['cn', 'tw']) {
    const resolved = resolver.resolve(text[language])
    const value = model()
    const before = structuredClone(value)
    applyGameTextPresentation(value, { source: text[language], lineMappings: resolved.lineMappings, resolver, catalog })
    const map = value.presentation.texts
    assert.equal(value.presentation.language, language)
    assert.equal(map['Festival Mask'], language === 'cn' ? '节庆之面' : '節慶之面')
    assert.equal(map['Leer Cast'], language === 'cn' ? '共鸣之面' : '共鳴之面')
    assert.equal(map['Replica Leer Cast'], language === 'cn' ? '共鸣之面【仿品】' : '贗品．共鳴之面')
    assert.equal(map['Divine Orb'], language === 'cn' ? '神圣石' : '神聖石')
    assert.equal(map['Orb of Transmutation'], language === 'cn' ? '蜕变石' : '蛻變石')
    assert.equal(map['物品等级'], language === 'cn' ? '物品等级' : '物品等級')
    assert.equal(map['闪避'], language === 'cn' ? '闪避值' : '閃避值')
    assert.equal(map['头盔'], language === 'cn' ? '头部' : '頭部')
    delete value.presentation
    assert.deepEqual(value, before, '展示适配不改官方身份、候选、数值或标签')
  }
})

test('英文物品将内部中文稀有度/类别/属性恢复为游戏英文，中文详细标签不改变主体语言', () => {
  const resolver = createLocalizationDictionary(entries)
  const value = model()
  applyGameTextPresentation(value, { source: text.en + '\n{ Prefix Modifier "Healthy" — 生命 }\n+10 to maximum Life', resolver, catalog })
  assert.equal(value.presentation.language, 'en')
  assert.equal(value.presentation.texts['传奇'], 'Unique')
  assert.equal(value.presentation.texts['头盔'], 'Helmets')
  assert.equal(value.presentation.texts['物品等级'], 'Item Level')
  assert.equal(value.presentation.texts['闪避'], 'Evasion Rating')
  assert.equal(value.presentation.texts['Festival Mask'], 'Festival Mask')
  assert.equal(value.presentation.texts['混沌石'], 'Chaos Orb')
  assert.deepEqual(value.stats[0].tags, ['Life', '護甲'])
})

test('选定传奇再净化重查时沿用源语言，新增名称不被旧底材标题覆盖', () => {
  const resolver = createLocalizationDictionary(entries)
  const value = model()
  applyGameTextPresentation(value, { source: text.tw, lineMappings: resolver.resolve(text.tw).lineMappings, resolver, catalog })
  assert.equal(value.presentation.texts['闪避'], '閃避值')
  value.identity.name = 'Leer Cast'
  value.identityResolution.required = false
  applyGameTextPresentation(value, { resolver, catalog })
  assert.equal(value.presentation.language, 'tw')
  assert.equal(value.presentation.texts[value.identity.name], '共鳴之面')
  assert.equal(value.presentation.texts[value.identity.type], '節慶之面')
  assert.equal(value.presentation.texts['闪避'], '閃避值')
  applyGameTextPresentation(value, { resolver, catalog })
  assert.equal(value.presentation.texts['闪避'], '閃避值')
})

test('精确locale按语义表排除同名异译，缺词、坏hash和真正冲突不会猜译', () => {
  const row = (table, id, en, cn, tw) => ({ kind: 'dat', table, id, field: 'Name', en, cn, tw,
    sourceHash: createHash('sha256').update(en).digest('hex') })
  const wrong = { ...row('words', 'invalid', 'Absent Name', '错误译名', '錯誤譯名'), sourceHash: '0'.repeat(64) }
  const resolver = createLocalizationDictionary([...entries, wrong,
    row('achievementitems', 'different-chaos', 'Chaos Orb', '任务混沌', '任務混沌'),
    row('words', 'collision', 'Leer Cast', '别的译名', '別的譯名')])
  assert.equal(resolver.localize('Chaos Orb', { locale: 'tw', tables: ['baseitemtypes'] }), '混沌石')
  assert.equal(resolver.localize('Absent Name', { locale: 'cn', tables: ['words'] }), 'Absent Name')
  assert.equal(resolver.localize('Leer Cast', { locale: 'cn', tables: ['words'] }), 'Leer Cast')
  assert.equal(resolver.localize('Unknown Name', { locale: 'tw', tables: ['words'] }), 'Unknown Name')
  assert.equal(resolver.localize('Replica Leer Cast', { locale: 'tw', tables: ['words'] }), '贗品．共鳴之面')
})
