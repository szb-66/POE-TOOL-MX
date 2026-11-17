import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createLocalizationDictionary } from '../electron/modules/localization/text.js'
import { createFaustusRuntimeLanguage } from '../electron/modules/faustus/runtimeLanguage.js'
import { getServer } from '../shared/serverMode.js'
import { pythonPath } from './helpers/python.js'
import { readFileSync } from 'node:fs'

// Verbatim BaseItemTypes names from the signed 3.30.0b resource export.
const entries = [
  { table: 'baseitemtypes', id: 'Metadata/Items/Weapons/OneHandWeapons/Daggers/Dagger7', field: 'Name', kind: 'dat', en: 'Skean', tw: '雙刃匕', sourceHash: '6f1665a673e3c12cb76a568f8a6eea483bc2b1ca128f9ba5b8e0b8ac8d099951' },
  { table: 'baseitemtypes', id: 'Metadata/Items/Weapons/OneHandWeapons/Daggers/Dagger21', field: 'Name', kind: 'dat', en: 'Imperial Skean', tw: '帝國雙刃匕', sourceHash: '4370cc0cbc4dedc56afbac71d3cd4c5ef055d7bd239260991b63137eda319b27' }
]
const text = name => `Item Class: Daggers\nRarity: Magic\n${name}\n--------\nItem Level: 84`
const cases = [
  ['強壯的帝國雙刃匕之雷霆', 'Imperial Skean'],
  ['強壯的雙刃匕之雷霆', 'Skean'],
  ['強壯的Imperial Skean of the Rainbow', 'Imperial Skean'],
  ['強壯的IMPERIAL SKEAN of the Rainbow', 'Imperial Skean'],
  ['強壯的Imperial\tSkean of the Rainbow', 'Imperial Skean'],
  ['強壯的SKEAN of the Rainbow', 'Skean'],
  ['強壯的帝國雙刃匕與雙刃匕', null],
  ['強壯的Imperial Skean and Skean', null],
  ['強壯的Imperial Skeanling', null],
  ['強壯的superskean', null],
  ['強壯的Skean_extra', null]
]

test('仅剥离有效详细头中位于魔法名称外缘的完整词缀，保留真实底材歧义', () => {
  const entries = JSON.parse(readFileSync(new URL('./fixtures/crafting-hydra-flask-entries.json', import.meta.url)))
  const dictionary = createLocalizationDictionary(entries)
  const item = (name, modifier) => `物品类别: 功能药剂\n稀有度: 魔法\n${name}\n--------\n物品等级: 84\n--------\n{ 后缀属性 "${modifier}" (等阶：1) }`
  for (const [name, modifier] of [
    ['九头蛇之宝钻药剂', '九头蛇之'],
    ['宝钻药剂九头蛇之', '九头蛇之'],
    ['海星之寶鑽藥劑', '海星之'],
    ['of the Starfish宝钻药剂', 'of the Starfish']
  ]) assert.equal(dictionary.resolve(item(name, modifier)).text.split('\n')[2], 'Diamond Flask', name)
  for (const [name, modifier] of [
    ['九头蛇之宝钻药剂与九头蛇', '九头蛇之'],
    ['九头蛇之宝钻药剂', '未知名称'],
    ['九头蛇之宝钻药剂', '九头蛇'],
    ['宝钻药剂九头蛇之额外文字', '九头蛇之']
  ]) assert.throws(() => dictionary.resolve(item(name, modifier)), error => error.code === 'LOCALIZATION_AMBIGUOUS', name)
  const untrusted = createLocalizationDictionary(entries.map(entry => entry.table === 'mods' ? { ...entry, sourceHash: '0'.repeat(64) } : entry))
  assert.throws(() => untrusted.resolve(item('九头蛇之宝钻药剂', '九头蛇之')), error => error.code === 'LOCALIZATION_AMBIGUOUS')
})

test('魔法底材取嵌套名称的唯一最长完整匹配，真实多个底材或词中子串拒绝', () => {
  const dictionary = createLocalizationDictionary(entries)
  for (const [name, expected] of cases) {
    if (expected) assert.equal(dictionary.resolve(text(name)).text.split('\n')[2], expected, name)
    else assert.throws(() => dictionary.resolve(text(name)), error => /^LOCALIZATION_(?:AMBIGUOUS|UNRESOLVED)$/.test(error.code), name)
  }
  const ambiguous = createLocalizationDictionary([...entries, { ...entries[1], id: 'synthetic-ambiguous-base', en: 'Different Dagger', sourceHash: undefined }])
  assert.throws(() => ambiguous.resolve(text('強壯的帝國雙刃匕之雷霆')), error => error.code === 'LOCALIZATION_AMBIGUOUS')
})

test('浮士德用相同规则识别英文或受管中文嵌套魔法底材，歧义不返回占位', () => {
  const profile = createFaustusRuntimeLanguage({ server: getServer('international'), entries, revision: 'fixture', footprints: { items: {} } })
  const ambiguous = createFaustusRuntimeLanguage({ server: getServer('international'), entries: [...entries, { ...entries[1], id: 'synthetic-ambiguous-base', en: 'Different Dagger', sourceHash: undefined }], revision: 'fixture', footprints: { items: {} } })
  const testCases = [...cases,
    ['Shimmering Imperial Skean of the Rainbow', 'Imperial Skean'],
    ['Shimmering Skean of the Rainbow', 'Skean'],
    ['Shimmering IMPERIAL SKEAN of the Rainbow', 'Imperial Skean'],
    ['Imperial Skean and Skean', null], ['Imperial Skeanling', null]
  ]
  const script = String.raw`import importlib.util,json,sys
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('faustus','src/assets/scripts/faustus_market_repricing.py')
f=importlib.util.module_from_spec(spec);spec.loader.exec_module(f)
data=json.load(sys.stdin)
def parsed(name,aliases):return f.parse_item_header('Item Class: Daggers\nRarity: Magic\n'+name+'\n--------\nItem Level: 84',aliases)
out=[parsed(name,data['aliases'])['baseName'] for name,_ in data['cases']]
assert parsed('強壯的帝國雙刃匕之雷霆',data['ambiguous'])['baseName']==''
assert parsed('SKEAN',{'Skean':'skean','skean':'different dagger'})['baseName']==''
print(json.dumps(out))`
  const result = spawnSync(pythonPath, ['-c', script], { input: JSON.stringify({ aliases: profile.itemBaseAliases, ambiguous: ambiguous.itemBaseAliases, cases: testCases }), encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', PYTHONDONTWRITEBYTECODE: '1' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout.trim()), testCases.map(([, expected]) => expected?.toLowerCase() || ''))
})
