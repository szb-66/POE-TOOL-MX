import test from 'node:test'
import assert from 'node:assert/strict'
import { loadLocalizedCatalog, catalogSearchText, catalogDisplayText } from '../src/utils/localizedCatalog.js'
import { applySkillCatalogSelection, searchSkillCatalog, updateSkillFreeText } from '../src/domains/story/skillCatalog.js'
import { createDefaultVendorConfig } from '../src/domains/regex/vendorConfig.js'
import { generateVendorRegex } from '../src/domains/regex/vendorRegex.js'
import { createDefaultMapRegexConfig, generateMapRegex, mapRegexCatalog } from '../src/domains/regex/mapRegex.js'
import { beastRegexOptions, generateBeastRegex } from '../src/domains/regex/beastRegex.js'
import { localizedTemplateExpression } from '../src/domains/regex/localizedRegex.js'

const mapping = (text, aliases, extra = {}) => [text, { text, aliases, displayText: aliases[0] || text, ...extra }]
const expression = result => new RegExp(result.regex.slice(1, -1), 'imu')

test('汉化目录按2000项分批并保留完整模板；跨版本响应和失败不能混成活动词库', async () => {
  const requests = []
  const api = { catalog: async input => { requests.push(input); return { success: true, data: { revision: 'r1', aliases: input.texts.map(text => ({ text, aliases: [`汉化${text}`], displayText: `汉化${text}`, templates: [{ en: `${text} {0}`, aliases: [`汉化${text} {0}`] }] })) } } } }
  const texts = Array.from({ length: 2001 }, (_, index) => `Item ${index}`)
  const result = await loadLocalizedCatalog([...texts, texts[0]], { api, match: 'contains' })
  assert.deepEqual(requests.map(input => input.texts.length), [2000, 1])
  assert.ok(requests.every(input => input.match === 'contains'))
  assert.equal(result.aliases.size, 2001)
  assert.deepEqual(result.aliases.get('Item 0').templates, [{ en: 'Item 0 {0}', aliases: ['汉化Item 0 {0}'] }])
  assert.equal(catalogDisplayText('Item 0', result.aliases), '汉化Item 0')
  assert.match(catalogSearchText(['Item 0'], result.aliases), /汉化item 0/)
  let revision = 0
  await assert.rejects(loadLocalizedCatalog(texts, { api: { catalog: async () => ({ success: true, data: { revision: String(++revision), aliases: [] } }) } }), /已更新/)
  await assert.rejects(loadLocalizedCatalog(['Fireball'], { api: { catalog: async () => ({ success: false, error: { message: '资源失效' } }) } }), /资源失效/)
})

test('剧情技能简繁英文搜索指向同一国际服稳定ID，自定义文字仍保留', () => {
  const skills = [{ id: 'gem:fireball', name: 'Fireball', requiredLevel: 1, color: 'blue', kind: 'active' }]
  const aliases = new Map([mapping('Fireball', ['火球', '火球術'])])
  for (const query of ['FIREBALL', '火球', '火球術']) {
    const [selected] = searchSkillCatalog(skills, query, 30, aliases)
    assert.equal(selected.id, 'gem:fireball')
    assert.match(selected.value, /火球.*Fireball/)
    const skill = { id: 'user-skill', name: '' }
    applySkillCatalogSelection(skill, selected)
    assert.equal(skill.name, 'Fireball')
    assert.equal(skill.gemId, 'gem:fireball')
    updateSkillFreeText(skill, '我的火球方案')
    assert.equal(skill.name, '我的火球方案')
    assert.equal(skill.gemId, undefined)
  }
  assert.deepEqual(searchSkillCatalog(skills, '未知汉化', 30, aliases), [])
})

test('商店正则使用受管完整模板和数字实例，不丢失指定数值，也不串到不同效果', () => {
  const aliases = new Map([
    mapping('maximum Life', [], { templates: [{ en: '+{0} to maximum Life', aliases: ['+{0} 最大生命', '+{0} 最大生命值'] }] }),
    mapping('30% increased Movement Speed', ['移动速度提高 30%', '增加 30% 移動速度'])
  ])
  const config = createDefaultVendorConfig()
  config.common.selectedIds = ['max_life']
  const life = expression(generateVendorRegex(config, 'en', aliases))
  for (const text of ['+89 to maximum Life', '+89 最大生命', '+89 最大生命值']) assert.equal(life.test(text), true, text)
  assert.equal(life.test('+89 最大魔力'), false)
  config.common.selectedIds = []
  config.movement.selectedIds = ['movement_30']
  const movement = expression(generateVendorRegex(config, 'en', aliases))
  for (const text of ['30% increased Movement Speed', '移动速度提高 30%', '增加 30% 移動速度']) assert.equal(movement.test(text), true, text)
  for (const text of ['130% increased Movement Speed', '移动速度提高 20%', '增加 20% 移動速度']) assert.equal(movement.test(text), false, text)
})

test('地图中文数值属性保留阈值和数字边界，词缀模板支持简繁及英文', () => {
  const config = createDefaultMapRegexConfig('en')
  config.stats.atlasDrops = { enabled: true, value: 80 }
  const aliases = new Map([mapping('Atlas Drops:', ['异界掉落:', '異界掉落:'])])
  const numeric = expression(generateMapRegex(config, 'en', aliases))
  for (const label of ['Atlas Drops', '异界掉落', '異界掉落']) {
    assert.equal(numeric.test(`${label}: +80%`), true)
    assert.equal(numeric.test(`${label}: +79%`), false)
    assert.equal(numeric.test(`${label}: -80%`), false)
    assert.equal(numeric.test(`${label}:\n+80%`), false)
  }
  config.stats.atlasDrops.enabled = false
  const affix = mapRegexCatalog('en').affixes.find(item => /reflecting # Physical Damage/.test(item.value))
  config.includeAffixIds = [affix.id]
  aliases.set(...mapping(affix.value, ['稀有怪物拥有物理荆棘，反射 {0} 物理伤害', '稀有怪物擁有物理荊棘，反射 {0} 物理傷害']))
  const regex = expression(generateMapRegex(config, 'en', aliases))
  assert.equal(regex.test(affix.example), true)
  assert.equal(regex.test('稀有怪物拥有物理荆棘，反射 400 物理伤害'), true)
  assert.equal(regex.test('稀有怪物擁有物理荊棘，反射 600 物理傷害'), true)
  assert.equal(regex.test('稀有怪物擁有物理荊棘，反射 600 火焰傷害'), false)
})

test('野兽用当前国际服稳定ID与汉化名称，不误取相似名称；缺映射与超长不会截断复制', () => {
  const beast = beastRegexOptions('en')[0]
  const aliases = new Map([mapping(beast.name, ['测试红兽', '測試紅獸'])])
  const result = generateBeastRegex({ includeIds: [beast.id] }, 'en', aliases)
  for (const name of [beast.name, '测试红兽', '測試紅獸']) assert.equal(expression(result).test(name), true)
  assert.equal(expression(result).test('测试蓝兽'), false)
  const missing = generateBeastRegex({ includeIds: [beast.id] }, 'en', new Map())
  assert.equal(missing.regex, '')
  assert.match(missing.warnings.join(' '), /缺少.*完整映射/)
  aliases.set(...mapping(beast.name, ['长'.repeat(300)]))
  const tooLong = generateBeastRegex({ includeIds: [beast.id] }, 'en', aliases)
  assert.equal(tooLong.regex, '')
  assert.match(tooLong.warnings.join(' '), /未截断/)
  const literal = new RegExp(localizedTemplateExpression('获得 {0} 生命 (区域)'), 'u')
  assert.equal(literal.test('获得 25 生命 (区域)'), true)
  assert.equal(literal.test('获得 25 生命 X区域Y'), false)
})
