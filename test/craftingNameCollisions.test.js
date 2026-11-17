import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { LocalizationRuntime } from '../electron/modules/localization/runtime.js'

const entries = JSON.parse(readFileSync(new URL('./fixtures/crafting-name-collision-entries.json', import.meta.url)))
const runtime = () => new LocalizationRuntime({ serverId: 'international', entries: () => entries, revision: () => 'signed-fixture' })
const item = (name, affixes = []) => `Item Class: Daggers\nRarity: Magic\n${name}\n--------\nItem Level: 84\n--------\n${affixes.map(name => `{ ${name.startsWith('of ') ? 'Suffix' : 'Prefix'} Modifier "${name}" (Tier: 1) }\n+10 to maximum Life`).join('\n')}`

test('英文魔法词缀与其他底材同名时保留真实底材，不能全局取最长名称', () => {
  for (const [name, affixes] of [
    ["Warlord's Skean", ["Warlord's"]],
    ['Skean of Frostbite', ['of Frostbite']],
    ['Skean of Precision', ['of Precision']],
    ['Skean of Despair', ['of Despair']],
    ["Warlord's Skean of Frostbite", ["Warlord's", 'of Frostbite']]
  ]) {
    const parsed = runtime().parseItem(item(name, affixes), 'signed-fixture')
    assert.equal(parsed.baseName, 'Skean', name)
    assert.equal(parsed.displayName, name)
  }
})

test('独立多个英文底材保持歧义，不得以最长名称悄悄选错', () => {
  for (const name of ['Skean and Warlord', 'Skean and Precision', 'Skean of Frostbite']) {
    assert.throws(() => runtime().parseItem(item(name), 'signed-fixture'), error => error.code === 'LOCALIZATION_AMBIGUOUS', name)
  }
})

test('魔法物品有独立底材行时，不再从该行剥离同名词缀', () => {
  for (const [base, affix] of [['Cerulean Ring', 'Cerulean'], ['Honed Cleaver', 'Honed']]) {
    const source = item(`${affix} ${base}`, [affix]).replace(`${affix} ${base}\n--------`, `${affix} ${base}\n${base}\n--------`)
    assert.equal(runtime().parseItem(source, 'signed-fixture').baseName, base)
  }
})
