import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createLocalizationDictionary } from '../electron/modules/localization/text.js'
import { statVariantApplies } from '../electron/modules/localization/statVariants.js'
import { LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { matchMapRequirements } from '../electron/modules/item/matcher.js'
import { mapStatVariants } from './fixtures/internationalMapStatVariants.js'
import { pythonPath } from './helpers/python.js'

const dictionary = createLocalizationDictionary(mapStatVariants)
const map = mod => `Item Class: Maps\nRarity: Rare\nDoom Domain\nFortress Map\n--------\nMap Tier: 17\nAtlas Drops: +140%\n--------\nItem Level: 84\n--------\n{ Prefix Modifier "Fixture" (Tier: 1) }\n${mod}`
const blacklist = term => ({ targetKind: 'atlas', match: { blacklist: [term] } })

test('真实地图同stat单复数按条件和variant顺序选择，不再把合法汉化词缀当歧义', () => {
  for (const number of [1, 2, 0, -2]) {
    const suffix = number === 1 ? '' : 's'
    for (const input of [`每个稀有怪物额外具有 ${number} 个词缀`, `每個稀有怪物有 ${number} 個額外詞綴`]) {
      assert.equal(dictionary.toEnglish(input, { strict: true }), `Rare Monsters each have ${number} additional Modifier${suffix}`)
    }
    assert.equal(dictionary.toEnglish(`怪物击中时施加 ${number} 缓速藤蔓`, { strict: true }), `Monsters inflict ${number} Grasping Vine${suffix} on Hit`)
  }
  // Input order cannot replace the game's recorded variant order.
  assert.equal(createLocalizationDictionary([...mapStatVariants].reverse()).toEnglish('每个稀有怪物额外具有 1 个词缀'), 'Rare Monsters each have 1 additional Modifier')
})

test('具体数量别名执行相同条件，抽象别名仅在相同可信单复数模板族内兼容', () => {
  assert.ok(dictionary.aliasesFor('Rare Monsters each have 1 additional Modifier').includes('每个稀有怪物额外具有 1 个词缀'))
  assert.ok(dictionary.aliasesFor('Rare Monsters each have 1 additional Modifier').includes('Rare Monsters each have # additional Modifiers'))
  assert.ok(dictionary.aliasesFor('Rare Monsters each have # additional Modifiers').includes('每个稀有怪物额外具有 # 个词缀'))
  assert.deepEqual(dictionary.aliasesFor('Rare Monsters each have 1 additional Modifiers'), ['Rare Monsters each have 1 additional Modifiers'])
  assert.deepEqual(dictionary.aliasesFor('Rare Monsters each have 2 additional Modifier'), ['Rare Monsters each have 2 additional Modifier'])
  assert.equal(dictionary.aliasesFor('20% increased Attack Speed').some(alias => alias.includes('reduced Attack Speed')), false)
})

test('反伤和数量1/2黑名单在真实JS解析及未修改Python alias循环中一致，固定数字不串', () => {
  const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => mapStatVariants, revision: () => 'fixture' })
  const items = [1, 2].map(number => runtime.parseItem(map(`每个稀有怪物额外具有 ${number} 个词缀`), 'fixture'))
  const reflection = runtime.parseItem(map('怪物会反射 18% 物理伤害'), 'fixture')
  for (const item of items) assert.equal(matchMapRequirements(item, blacklist('Rare Monsters each have # additional Modifiers')).reason, 'blacklist')
  assert.equal(matchMapRequirements(items[0], blacklist('Rare Monsters each have 2 additional Modifiers')).isMatch, true)
  assert.equal(matchMapRequirements(items[1], blacklist('Rare Monsters each have 1 additional Modifier')).isMatch, true)
  assert.equal(matchMapRequirements(items[0], blacklist('Rare Monsters each have 1 additional Modifier')).reason, 'blacklist')
  assert.equal(matchMapRequirements(reflection, blacklist('Monsters reflect #% of Physical Damage')).reason, 'blacklist')
  const template = readFileSync(new URL('../src/assets/scripts/map_rolling_template.py', import.meta.url), 'utf8')
  const helpers = template.slice(template.indexOf('def map_term_matches('), template.indexOf('def check_map_requirements('))
  const script = `import json,sys\n${helpers}\nitems=json.load(sys.stdin)\nmap_config={'match':{'blacklist':['Rare Monsters each have # additional Modifiers'],'whitelist':[]}}\nresults=[check_map_mods(item) for item in items]\nmap_config['match']['blacklist']=['Rare Monsters each have 2 additional Modifiers']\nresults.append(check_map_mods(items[0]))\nprint(json.dumps(results))`
  const result = spawnSync(pythonPath, ['-c', script], { input: JSON.stringify(items), encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', PYTHONDONTWRITEBYTECODE: '1' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout.trim()), [false, false, true])
})

test('正负数handler、区间、!0和详细范围严格约束已适用模板', () => {
  assert.equal(dictionary.toEnglish('攻击速度加快 20%'), '20% increased Attack Speed')
  assert.equal(dictionary.toEnglish('攻击速度减慢 20%'), '20% reduced Attack Speed')
  for (const input of ['攻击速度加快 0%', '攻击速度加快 -20%', '攻击速度减慢 0%', '攻击速度减慢 -20%']) {
    assert.throws(() => dictionary.toEnglish(input, { strict: true }), /未匹配/)
  }
  assert.equal(dictionary.toEnglish('攻击速度加快 90（80—99）%'), '90(80—99)% increased Attack Speed')
  assert.throws(() => dictionary.toEnglish('攻击速度加快 79（80—99）%', { strict: true }), /未匹配/)
  const range = structuredClone(mapStatVariants[0])
  range.stats.variants = [{ condition: '2|5', handlers: '', placeholders: ['{0}'] }]
  for (const number of [2, 5]) assert.equal(statVariantApplies(range, new Map([['0', String(number)]])), true)
  for (const number of [-2, 0, 1, 6]) assert.equal(statVariantApplies(range, new Map([['0', String(number)]])), false)
  range.stats.variants[0].condition = '!0'
  assert.equal(statVariantApplies(range, new Map([['0', '0']])), false)
  assert.equal(statVariantApplies(range, new Map([['0', '-2']])), true)
})

test('不把不同stat、不同handler或未支持元数据的真实歧义伪装成单复数同义', () => {
  const different = structuredClone(mapStatVariants[1])
  different.id = 'different-source-stat'
  different.en = 'Other Monsters have {0} additional Modifiers'
  different.sourceHash = undefined
  assert.throws(() => createLocalizationDictionary([...mapStatVariants, different]).toEnglish('每个稀有怪物额外具有 2 个词缀'), error => error.code === 'LOCALIZATION_AMBIGUOUS')
  const unknown = structuredClone(mapStatVariants.slice(0, 2))
  for (const entry of unknown) entry.stats.variants.forEach(variant => { variant.handlers = 'unrecognised_handler 1' })
  assert.throws(() => createLocalizationDictionary(unknown).toEnglish('每个稀有怪物额外具有 2 个词缀'), error => error.code === 'LOCALIZATION_AMBIGUOUS')
})
