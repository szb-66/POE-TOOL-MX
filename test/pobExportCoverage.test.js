import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { inflateSync, gunzipSync } from 'node:zlib'
import { load } from 'cheerio'
import { convertBuild } from '../electron/modules/pobExport/converter.js'
import { resolveItemIdentity } from '../electron/modules/pobExport/integrity.js'
import { pobIdentities } from '../electron/modules/pobExport/compatibility.js'
import { DATA } from 'cn-poe-utils/data/poe'
import { TranslatorFactory } from 'cn-poe-utils/translator/zh2en'
import { buildFixture } from './fixtures/pobExport.js'
import { guardStatTemplates } from '../electron/modules/pobExport/templateSafety.js'

const basic = new TranslatorFactory().getBasicTranslator()
const xml = result => load(inflateSync(Buffer.from(result.code, 'base64url')).toString(), { xml: true })
const slots = { amulets: 'Amulet', belts: 'Belt', bodyArmours: 'BodyArmour', boots: 'Boots', flasks: 'Flask', gloves: 'Gloves', helmets: 'Helm', jewels: null, quivers: 'Offhand', rings: 'Ring', shields: 'Offhand', tinctures: 'Flask', weapons: 'Weapon' }

test('官网最大等级标记不阻止导出，外观描述不作为战斗词缀', () => {
  for (const value of ['20(最大)', '20（最大）', '20 (最大)', '20 (Max)', '20', '21(最高等级)', '4(最高等级)', '20（最高等级）']) {
    const f = buildFixture()
    f.items.items[0].socketedItems[0].properties[0].values[0][0] = value
    f.items.items[0].cosmeticMods = ['仅改变外观的描述']
    const result = convertBuild(f)
    const $ = xml(result)
    assert.equal($('Gem').first().attr('level'), String(parseInt(value)), value)
    assert.ok(!$('Item').first().text().includes('仅改变外观'))
    assert.deepEqual(result.warnings, [])
  }
  for (const value of ['', '20oops', '0', '(最大)', '20(21)', '20(最高等级)坏数据']) {
    const f = buildFixture()
    f.items.items[0].socketedItems[0].properties[0].values[0][0] = value
    assert.throws(() => convertBuild(f), e => e.details.warnings.some(w => w.includes('技能等级')))
  }
})

test('永恒珠宝换行变化保留种子、征服者和完整效果', () => {
  const guarded = guardStatTemplates(new TranslatorFactory().getBasicTranslator())
  const templates = DATA.stats.filter(x => x.zh.includes('\n') && /Passives in radius are Conquered/.test(x.en))
  assert.ok(templates.length >= 10)
  for (const template of templates) {
    const source = template.zh.replaceAll('{0}', '1573')
    const expected = template.en.replaceAll('{0}', '1573')
    for (const separator of [' ', '\n', '\r\n']) {
      const input = source.replace(/\s*\n\s*/g, separator)
      assert.equal(guarded.transMod(input), expected, input)
    }
  }
  const f = buildFixture()
  f.passiveSkills.items[0].explicitMods = ['以夏巴夸亚的名义用 1573 名祭品之血浸染\n范围内的天赋被瓦尔抑制']
  const result = convertBuild(f)
  assert.match(xml(result)('Item').last().text(), /Bathed in the blood of 1573 sacrificed in the name of Xibaqua\nPassives in radius are Conquered by the Vaal/)
  assert.deepEqual(result.warnings, [])
})

test('词缀参数拒绝空值，保留不同数值与正负号', () => {
  const guarded = guardStatTemplates(new TranslatorFactory().getBasicTranslator())
  const template = { zh: '测试 {0} 到 {1} 点伤害', en: 'Adds {0} to {1} Damage' }
  assert.equal(guarded.doTransMod(template, '测试 -17 到 +29 点伤害'), 'Adds -17 to +29 Damage')
  assert.equal(guarded.doTransMod(template, '测试  到 29 点伤害'), undefined)
  assert.equal(guarded.doTransMod(template, '测试 非数字 到 29 点伤害'), undefined)
})

test('弹幕辅助不会被误导入为弹幕主动技能', () => {
  const f = buildFixture()
  Object.assign(f.items.items[0].socketedItems[0], { baseType: '弹幕（辅）', typeLine: '弹幕（辅）' })
  assert.equal(xml(convertBuild(f))('Gem').first().attr('nameSpec'), 'Barrage Support')
})

test('截图中的腐母之叛、珠光项链、刺客印记输出真实英文身份', () => {
  const f = buildFixture()
  f.items.items.push({ id: 'fixture-amulet', frameType: 3, name: '腐母之叛', baseType: '珠光项链', typeLine: '珠光项链', ilvl: 85, inventoryId: 'Amulet', implicitMods: ['+10% 所有元素抗性'], explicitMods: ['+25 全属性'] })
  Object.assign(f.items.items[0].socketedItems[0], { baseType: '刺客印记', typeLine: '刺客印记' })
  const result = convertBuild(f)
  const $ = xml(result)
  assert.match($('Item').eq(1).text(), /Rotmother's Mutiny\nPearlescent Amulet/)
  assert.equal($('Gem').first().attr('nameSpec'), "Assassin's Mark")
  assert.equal($('Item').length, 3)
  assert.deepEqual(result.warnings, [])
})

test('全部国服角色物品目录都有映射或具体的上游限制与排除原因', () => {
  const report = JSON.parse(readFileSync(new URL('../scripts/data/pob-export/coverage.json', import.meta.url)))
  const details = JSON.parse(gunzipSync(readFileSync(new URL('../scripts/data/pob-export/coverage-details.json.gz', import.meta.url))))
  const entries = details.filter(x => x.category === 'cnItems')
  assert.ok(entries.length > 3300)
  assert.deepEqual(entries.filter(x => ['missing', 'conflict'].includes(x.status)), [])
  assert.deepEqual(entries.filter(x => x.status === 'unsupported').map(x => x.zh), ['赏金猎人饰品', '血肉嫁接'])
  assert.equal(report.categories.grafts.covered, 16)
  for (const [category, counts] of Object.entries(report.categories)) {
    assert.equal(counts.total, counts.covered + counts.added + counts.missing + counts.conflict + counts.unsupported, category)
  }
  assert.ok(report.sources.every(x => /^[a-f0-9]{64}$/.test(x.sha256)))
  assert.equal(report.details.entries, details.length)
})

test('旧赛季嫁接栏位与闪回传奇稀有度保留，未支持的血肉嫁接明确失败', () => {
  const f = buildFixture()
  f.items.items.push({ id: 'fixture-graft', frameType: 2, name: '随机名称', baseType: '风暴的艾许之嫁接', typeLine: '风暴的艾许之嫁接', ilvl: 85, inventoryId: 'BrequelGrafts', explicitMods: ['+20 最大生命'] })
  f.items.items.push({ id: 'fixture-relic', frameType: 9, name: '腐母之叛', baseType: '珠光项链', typeLine: '珠光项链', ilvl: 85, inventoryId: 'Amulet' })
  const $ = xml(convertBuild(f))
  assert.equal($('Slot[name="Graft 1"]').attr('itemId'), '2')
  assert.match($('Item').eq(1).text(), /Storming Eshgraft/)
  assert.match($('Item').eq(2).text(), /Rarity: RELIC\nRotmother's Mutiny/)
  f.items.items[1].baseType = '血肉嫁接'
  assert.throws(() => convertBuild(f), e => e.details.warnings.some(w => w.includes('血肉嫁接')))
})

test('天赋引用重名不能静默选取错误身份', () => {
  const f = buildFixture()
  f.items.items[0].enchantMods = ['配置 英勇']
  const result = convertBuild(f)
  assert.match(xml(result)('Item').first().text(), /配置 英勇/)
  assert.ok(result.warnings.some(w => w.includes('可能影响 PoB 计算')))
})

test('全量底材与传奇关联可解析，不把未知传奇降级为稀有装备', () => {
  let count = 0
  for (const [category, inventoryId] of Object.entries(slots)) {
    for (const base of DATA[category]) {
      for (const unique of base.uniques || []) {
        if (unique.matchMods) continue // Tested with concrete modifiers below.
        const result = resolveItemIdentity({ frameType: 3, baseType: base.zh, name: unique.zh, inventoryId }, basic)
        assert.equal(result.error, undefined, `${category}: ${unique.zh} / ${base.zh}`)
        assert.equal(result.name, unique.en)
        assert.equal(result.baseType, base.en.replace('Maelström Staff', 'Maelstrom Staff'))
        count++
      }
    }
  }
  assert.ok(count > 1400)
})

test('全部 PoB 宝石身份存在可用中文映射，变异技能归入正确类别', () => {
  const mapped = new Set()
  for (const key of ['gemSkills', 'hybridSkills', 'transfiguredSkills']) {
    for (const skill of DATA[key]) {
      const actual = basic.transSkill(skill.zh)
      if (actual) mapped.add(pobIdentities.gemNameMap[actual] ?? actual)
    }
  }
  assert.deepEqual(pobIdentities.gemNames.filter(name => !mapped.has(name)), [])
  assert.ok(DATA.transfiguredSkills.some(x => x.en === 'Absolution of Inspiring'))
  assert.ok(DATA.indexableSupports.some(x => x.en === 'Crystalfall'))
})

test('一次列全装备、传奇、技能、等级与珠宝的问题，不返回部分导入码', () => {
  const f = buildFixture()
  f.items.items[0].baseType = '未知武器底材'
  Object.assign(f.items.items[0].socketedItems[0], { baseType: '未知技能', typeLine: '未知技能', properties: [] })
  Object.assign(f.passiveSkills.items[0], { frameType: 3, name: '未知传奇珠宝' })
  assert.throws(() => convertBuild(f), error => {
    for (const label of ['未知武器底材', '未知技能', '技能等级', '未知传奇珠宝']) assert.ok(error.details.warnings.some(w => w.includes(label)), label)
    assert.equal(error.details.warnings.length, new Set(error.details.warnings).size)
    assert.equal(error.code, 'CONVERSION_FAILED')
    return true
  })
})

test('未知传奇不能伪装成 Item，随机稀有名称仍正常导出', () => {
  const f = buildFixture()
  Object.assign(f.items.items[0], { frameType: 3, name: '不存在的传奇' })
  assert.throws(() => convertBuild(f), e => e.details.warnings.some(w => w.includes('未识别传奇身份')))
  f.items.items[0].frameType = 2
  assert.match(xml(convertBuild(f))('Item').first().text(), /Rarity: RARE\nItem\nDriftwood Wand/)
  f.items.items[0].name = ''
  assert.match(xml(convertBuild(f))('Item').first().text(), /Rarity: RARE\nItem\nDriftwood Wand/)
})

test('同名圣杖按特征词缀消歧，缺少或冲突特征不能猜测', () => {
  for (const [mod, name] of [
    ['+5% 闪电抗性上限', 'Agnerod South'],
    ['Adds 14 to 123 Lightning Damage to Spells', 'Agnerod West'],
    ['100% increased Lightning Ailment Duration on Enemies', 'Agnerod East'],
    ['15% chance to Shock', 'Agnerod North']
  ]) {
    const result = resolveItemIdentity({ frameType: 3, name: '雷霆圣杖', baseType: '帝国长杖', inventoryId: 'Weapon', explicitMods: [mod] }, basic)
    assert.equal(result.name, name)
  }
  const ambiguous = { frameType: 3, name: '雷霆圣杖', baseType: '帝国长杖', inventoryId: 'Weapon' }
  assert.ok(resolveItemIdentity(ambiguous, basic).error)
  assert.ok(resolveItemIdentity({ ...ambiguous, explicitMods: ['+5% 闪电抗性上限', '15% chance to Shock'] }, basic).error)
})

test('嵌套深渊珠宝和旧词缀不丢失，不产生空技能组', () => {
  const f = buildFixture()
  const weapon = f.items.items[0]
  weapon.sockets.unshift({ group: 5, sColour: 'A' })
  weapon.socketedItems.forEach(g => g.socket++)
  weapon.socketedItems.unshift({ id: 'fixture-abyss', frameType: 2, name: '随机珠宝', baseType: '凶残之凝珠宝', typeLine: '凶残之凝珠宝', abyssJewel: true, socket: 0, ilvl: 80, utilityMods: [{ description: '+10 最大魔力' }], scourgeMods: ['+20 最大生命'] })
  weapon.scourgeMods = ['+30 最大生命']
  weapon.futureMods = ['未知未来词缀']
  const result = convertBuild(f)
  const $ = xml(result)
  assert.equal($('Item').length, 3)
  assert.equal($('Gem').length, 3)
  assert.ok($('Skill').toArray().every(group => $(group).find('Gem').length > 0))
  assert.match($('Item').eq(1).text(), /Murderous Eye Jewel/)
  assert.match($('Item').eq(1).text(), /\+10 to maximum Mana/)
  assert.match($('Item').eq(1).text(), /\+20 to maximum Life/)
  assert.match($('Item').first().text(), /未知未来词缀/)
  assert.match($('Item').first().text(), /Has 1 Abyssal Sockets/)
  assert.ok(result.warnings.some(w => w.includes('可能影响 PoB 计算')))
})

test('新版职业、专精和天赋覆盖完整，缺失星团节点不能静默成功', () => {
  const f = buildFixture()
  f.passiveSkills.ascendancy = 2
  f.passiveSkills.character = 0
  const $ = xml(convertBuild(f))
  assert.equal($('Build').attr('ascendClassName'), pobIdentities.classes[0].ascendancies[1].name)
  assert.equal($('Spec').attr('masteryEffects'), '{11455,1}')
  f.passiveSkills.hashes_ex = [12345]
  assert.throws(() => convertBuild(f), e => e.details.warnings.some(w => w.includes('天赋节点缺失')))
})
