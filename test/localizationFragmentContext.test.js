import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { createLocalizationDictionary } from '../electron/modules/localization/text.js'

const entries = JSON.parse(readFileSync(new URL('./fixtures/crafting-duration-fragments.json', import.meta.url)))
const runtime = () => new LocalizationRuntime({ serverId: 'international', entries: () => entries, revision: () => 'fixture' })
const item = (body, itemClass = 'Utility Flasks', base = 'Diamond Flask') => `Item Class: ${itemClass}\nRarity: Rare\nFixture Name\n${base}\n--------\nItem Level: 84\n--------\n{ Prefix Modifier "Fixture" (Tier: 1) }\n${body}`

test('药剂繁体持续时间不匹配地图多行词缀的孤立片段，保留真实范围', () => {
  for (const [word, english] of [['增加', 'increased'], ['減少', 'reduced']]) for (const number of ['10', '10(9-11)']) {
    const body = `${word} ${number}% 持續時間`
    const parsed = runtime().parseItem(item(body), 'fixture')
    assert.deepEqual(parsed.explicitMods, [`10% ${english} Duration`])
    assert.equal(parsed.modifiers[0].displayText, body)
  }
})

test('完整或中英混合的地图多行上下文仍能解析，未知上下文仍拒绝', () => {
  const entry = entries.find(entry => entry.id === 'map_ultimatum_survival_encounter_time_+%' && entry.field === 'variant:0')
  const en = entry.en.replaceAll('\\n', '\n').replaceAll('{0}', '10')
  const tw = entry.tw.replaceAll('\\n', '\n').replaceAll('{0}', '10')
  for (const body of [tw, [en.split('\n')[0], tw.split('\n')[1]].join('\n'), [tw.split('\n')[0], en.split('\n')[1]].join('\n')]) {
    const parsed = runtime().parseItem(item(body, 'Maps', 'Fortress Map'), 'fixture')
    assert.equal(parsed.modifiers[0].text, en)
  }
  assert.equal(createLocalizationDictionary(entries).toEnglish('增加 10% 持續時間'), '10% increased Duration')
  assert.throws(() => runtime().parseItem(item(`未知主语\n${tw.split('\n')[1]}`), 'fixture'), error => error.code === 'LOCALIZATION_UNRESOLVED')
})
