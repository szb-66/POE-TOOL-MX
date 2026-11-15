import test from 'node:test'
import assert from 'node:assert/strict'
import { inflateSync } from 'node:zlib'
import { load } from 'cheerio'
import { DATA as POB_DATA } from 'cn-poe-utils/data/pob'
import snapshot from '../electron/assets/pob-export/international.json' with { type: 'json' }
import { internationalPobContext, resolveInternationalItemIdentity } from '../electron/modules/pobExport/internationalCompatibility.js'
import { convertBuild } from '../electron/modules/pobExport/converter.js'
import { checkTranslatedGem } from '../electron/modules/pobExport/integrity.js'
import { buildFixture } from './fixtures/pobExport.js'

const xml = result => load(inflateSync(Buffer.from(result.code.replace(/-/g, '+').replace(/_/g, '/'), 'base64')).toString('utf8'), { xml: true })
function englishFixture() {
  const fixture = buildFixture()
  fixture.language = 'en'
  const weapon = fixture.items.items[0]
  Object.assign(weapon, { baseType: 'Driftwood Wand', typeLine: 'Driftwood Wand', explicitMods: ['+10 to maximum Mana'] })
  for (const [index, gem] of weapon.socketedItems.entries()) {
    gem.baseType = gem.typeLine = ['Arcane Link', 'Added Lightning Damage Support', 'Fireball of Radiation'][index]
    gem.properties = gem.properties.map(prop => ({ ...prop, name: prop.name === '等级' ? 'Level' : 'Quality' }))
  }
  Object.assign(fixture.passiveSkills.items[0], { baseType: 'Cobalt Jewel', typeLine: 'Cobalt Jewel', explicitMods: ['+10 to maximum Mana'] })
  return fixture
}

test('国际服PoB使用固定官方3.30来源，普通和无情树独立于国服', () => {
  assert.equal(snapshot.server, 'international')
  assert.equal(snapshot.locale, 'en')
  assert.equal(snapshot.gameVersion, '3.30.0')
  assert.equal(snapshot.commit, 'f5ca0aeeeeba62d7d2c93b1fbd0704c74d54e7ea')
  assert.ok(snapshot.sources.length > 40)
  for (const source of snapshot.sources) {
    assert.ok(source.url.startsWith(`https://raw.githubusercontent.com/PathOfBuildingCommunity/PathOfBuilding/${snapshot.commit}/src/`))
    assert.match(source.sha256, /^[a-f0-9]{64}$/)
  }
  const before = structuredClone(POB_DATA.tree)
  const fixture = englishFixture()
  assert.equal(xml(convertBuild(fixture))('Spec').attr('treeVersion'), '3_30')
  fixture.items.character.league = 'Ruthless Test League'
  assert.equal(xml(convertBuild(fixture))('Spec').attr('treeVersion'), '3_30_ruthless')
  assert.deepEqual(POB_DATA.tree, before)
  assert.equal(xml(convertBuild(buildFixture()))('Spec').attr('treeVersion'), '3_29')
})

test('独立快照所有技能和新增3.30技能有真实PoB身份，升华和珠宝插槽使用当前树', () => {
  const fixture = englishFixture()
  const context = internationalPobContext(fixture.items)
  for (const gem of snapshot.gems) {
    const baseType = gem.id.includes('/SupportGem') && !gem.en.endsWith(' Support') ? `${gem.en} Support` : gem.en
    const issues = []
    checkTranslatedGem({ baseType }, issues, context)
    assert.deepEqual(issues, [], baseType)
  }
  fixture.passiveSkills.character = 0
  fixture.passiveSkills.ascendancy = 3
  const $ = xml(convertBuild(fixture))
  assert.equal($('Build').attr('className'), 'Scion')
  assert.equal($('Build').attr('ascendClassName'), 'Luminary')
  assert.equal($('Gem').first().attr('nameSpec'), 'Arcane Link')
  assert.equal($('Gem').eq(2).attr('nameSpec'), 'Fireball of Radiation')
  assert.equal(Number($('Sockets Socket').first().attr('nodeId')), snapshot.jewelSlots[0])
})

test('国际服未知关键身份或天赋节点失败，保留未知词缀且失败后恢复国服运行上下文', () => {
  const before = structuredClone(POB_DATA.tree)
  const fixture = englishFixture()
  fixture.passiveSkills.hashes.push(99999999)
  assert.throws(() => convertBuild(fixture), error => error.details.warnings.some(w => w.includes('99999999')))
  assert.deepEqual(POB_DATA.tree, before)
  fixture.passiveSkills.hashes.pop()
  fixture.items.items[0].baseType = 'Unknown Current Wand'
  assert.throws(() => convertBuild(fixture), error => error.details.warnings.some(w => w.includes('Unknown Current Wand')))
  fixture.items.items[0].baseType = 'Driftwood Wand'
  fixture.items.items[0].explicitMods.push('Unrecognised future modifier <keep>')
  assert.match(xml(convertBuild(fixture))('Item').first().text(), /Unrecognised future modifier <keep>/)
  assert.deepEqual(POB_DATA.tree, before)
  assert.ok(resolveInternationalItemIdentity({ baseType: 'Driftwood Wand', name: 'Fake Unique', inventoryId: 'Weapon', frameType: 3 }).error)
  assert.ok(resolveInternationalItemIdentity({ baseType: 'Driftwood Wand', inventoryId: 'Helm', frameType: 0 }).error)
})
