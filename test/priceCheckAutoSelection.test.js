import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { applyInternationalPseudoRules, loadTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { auditAutoSelectRules } from '../electron/modules/priceCheck/autoSelect.js'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import {
  buildOfficialTradeQuery,
  createPriceCheckModel,
  sanitizePriceCheckModel
} from '../electron/modules/priceCheck/query.js'

const cnCatalogPath = path.resolve('electron/modules/priceCheck/catalog.json')
const intlCatalogPath = path.resolve('electron/modules/priceCheck/catalog.international.json')

const [{ catalog: cnCatalog }, { catalog: rawIntlCatalog }] = await Promise.all([
  loadTradeCatalog(cnCatalogPath),
  loadTradeCatalog(intlCatalogPath)
])
const intlCatalog = applyInternationalPseudoRules(structuredClone(rawIntlCatalog), cnCatalog)

test('声明式预选规则中的全部精确 ref 与 coreId 在国服与国际服目录中均真实存在', () => {
  const cnAudit = auditAutoSelectRules(cnCatalog)
  const intlAudit = auditAutoSelectRules(intlCatalog)
  assert.deepEqual(cnAudit.missingRefs, [])
  assert.deepEqual(cnAudit.missingCoreIds, [])
  assert.equal(cnAudit.valid, true)
  assert.deepEqual(intlAudit.missingRefs, [])
  assert.deepEqual(intlAudit.missingCoreIds, [])
  assert.equal(intlAudit.valid, true)
})

test('低价值 T1/T2 词缀不再自动预选，仅高价值白名单词缀被选中', () => {
  const text = [
    '物品类别: 手套',
    '稀 有 度: 稀有',
    '毁灭之握',
    '术士手套',
    '--------',
    '物品等级: 85',
    '--------',
    '{ 前缀属性 "反射的" (等阶：1) }',
    '反射 18 点物理伤害给近战攻击者',
    '{ 后缀属性 "闪耀之" (等阶：1) }',
    '照亮范围扩大 15%',
    '{ 后缀属性 "压制之" (等阶：1) }',
    '法术伤害压制率 +14%'
  ].join('\n')
  const model = createPriceCheckModel(parseItemInfo(text), cnCatalog, { initialSelection: 'auto' })
  const enabled = model.stats.filter((stat) => stat.enabled)
  assert.equal(enabled.length, 1)
  assert.match(enabled[0].text, /法术伤害压制率/)
  assert.equal(enabled[0].autoSelection?.enabled, true)
  const lightRadius = model.stats.find((stat) => stat.text.includes('照亮范围'))
  assert.equal(lightRadius.enabled, false)
  assert.equal(lightRadius.autoSelection?.enabled, false)
  assert.match(lightRadius.autoSelection?.reason || '', /普通 T1\/T2|低价值/)
})

test('普通稀有装备默认按大类查价，特色底材与普通/魔法/传奇保留具体底材', () => {
  const rareBoots = createPriceCheckModel({
    category: '鞋子', rarity: '稀有', name: '测试鞋', baseName: '术士长靴', level: 84
  }, cnCatalog, { initialSelection: 'auto' })
  assert.equal(rareBoots.identity.nameEnabled, false)
  const bootsQuery = buildOfficialTradeQuery(rareBoots).query
  assert.equal(bootsQuery.type, undefined)
  assert.equal(bootsQuery.filters.type_filters.filters.category.option, 'armour.boots')

  const stygian = createPriceCheckModel({
    category: '腰带', rarity: '稀有', name: '深渊腰带', baseName: '冥河腰带', level: 86
  }, cnCatalog, { initialSelection: 'auto' })
  assert.equal(stygian.identity.nameEnabled, true)
  assert.equal(buildOfficialTradeQuery(stygian).query.type, '冥河腰带')

  const normalCraftingBase = createPriceCheckModel({
    category: '胸甲', rarity: '普通', name: '瓦尔法衣', baseName: '瓦尔法衣', level: 86
  }, cnCatalog, { initialSelection: 'auto' })
  assert.equal(normalCraftingBase.identity.nameEnabled, true)
  assert.equal(normalCraftingBase.properties.find((p) => p.id === 'misc.itemLevel')?.enabled, true)
})

test('高物理 DPS 武器优先预选 pDPS 并吸收局部物理伤害词缀，同时保留额外箭矢', () => {
  const text = [
    '物品类别: 弓',
    '稀 有 度: 稀有',
    '碎骨之弓',
    '脊弓',
    '--------',
    '品质: +20%',
    '物理伤害: 280-560',
    '攻击暴击率: 8.50%',
    '每秒攻击次数: 1.65',
    '--------',
    '插槽: G-G-G-G-G-G',
    '--------',
    '物品等级: 86',
    '--------',
    '{ 前缀属性 "残暴的" (等阶：1) }',
    '物理伤害提高 175%',
    '{ 前缀属性 "无情的" (等阶：1) }',
    '该装备附加 40 - 80 基础物理伤害',
    '{ 后缀属性 "多箭之" (等阶：1) }',
    '弓类攻击发射 2 支额外箭矢'
  ].join('\n')
  const model = createPriceCheckModel(parseItemInfo(text), cnCatalog, { initialSelection: 'auto' })
  const pdps = model.properties.find((p) => p.id === 'weapon.pdps')
  const links = model.properties.find((p) => p.id === 'socket.links')
  assert.equal(pdps?.enabled, true)
  assert.equal(links?.enabled, true)

  const localPhys = model.stats.find((s) => s.text.includes('基础物理伤害'))
  const localPhysPct = model.stats.find((s) => s.text.includes('物理伤害提高'))
  const arrows = model.stats.find((s) => s.text.includes('额外箭矢'))
  assert.equal(localPhys?.enabled, false)
  assert.match(localPhys?.autoSelection?.reason || '', /物理 DPS/)
  assert.equal(localPhysPct?.enabled, false)
  assert.equal(arrows?.enabled, true)
})

test('高能量护盾胸甲预选总护盾并吸收局部护盾词缀，后缀法压正常保留', () => {
  const text = [
    '物品类别: 胸甲',
    '稀 有 度: 稀有',
    '星辰法衣',
    '瓦尔法衣',
    '--------',
    '能量护盾: 620',
    '--------',
    '物品等级: 86',
    '--------',
    '{ 前缀属性 "闪光的" (等阶：1) }',
    '+115 最大能量护盾',
    '{ 前缀属性 "不可摧毁的" (等阶：1) }',
    '该装备的能量护盾提高 105%',
    '{ 后缀属性 "压制之" (等阶：1) }',
    '法术伤害压制率 +21%'
  ].join('\n')
  const model = createPriceCheckModel(parseItemInfo(text), cnCatalog, { initialSelection: 'auto' })
  assert.equal(model.properties.find((p) => p.id === 'armour.energyShield')?.enabled, true)
  const localEs = model.stats.filter((s) => s.type === 'explicit' && s.text.includes('能量护盾'))
  assert.ok(localEs.length >= 1)
  assert.ok(localEs.every((s) => !s.enabled && /能量护盾/.test(s.autoSelection?.reason || '')))
  assert.equal(model.stats.find((s) => s.text.includes('法术伤害压制率'))?.enabled, true)
})

test('综合词缀按部位执行阈值过滤，且不吞掉高价值分裂词缀', () => {
  const lowRoll = createPriceCheckModel({
    category: '胸甲', rarity: '稀有', name: '测试', baseName: '龙鳞胸甲',
    modifiers: [
      { type: 'prefix', tier: 6, text: '+18 最大生命' },
      { type: 'suffix', tier: 6, text: '+14% 火焰抗性' }
    ]
  }, cnCatalog, { initialSelection: 'auto' })
  const lowLife = lowRoll.stats.find((s) => s.id === 'pseudo.pseudo_total_life')
  const lowEle = lowRoll.stats.find((s) => s.id === 'pseudo.pseudo_total_elemental_resistance')
  assert.equal(lowLife?.enabled, false)
  assert.equal(lowEle?.enabled, false)
  assert.match(lowLife?.autoSelection?.reason || '', /阈值/)

  const fracturedChaos = createPriceCheckModel({
    category: '戒指', rarity: '稀有', name: '测试', baseName: '紫晶戒指',
    modifiers: [
      { type: 'fractured', tier: 1, text: '+35% 混沌抗性' },
      { type: 'crafted', text: '+55 最大生命' }
    ]
  }, cnCatalog, { initialSelection: 'auto' })
  const fracStat = fracturedChaos.stats.find((s) => s.type === 'fractured')
  const pseudoChaos = fracturedChaos.stats.find((s) => s.id === 'pseudo.pseudo_total_chaos_resistance')
  const pseudoLife = fracturedChaos.stats.find((s) => s.id === 'pseudo.pseudo_total_life')
  assert.equal(fracStat?.enabled, true)
  assert.equal(pseudoChaos?.enabled, false)
  assert.equal(pseudoLife?.enabled, false) // 仅工艺来源构成不自动勾选
})

test('高配六词缀黄装触发优先级上限截断（最多 4 项普通高价值词缀）', () => {
  const model = createPriceCheckModel({
    category: '鞋子', rarity: '稀有', name: '极品鞋', baseName: '异色鞋', level: 86,
    modifiers: [
      { type: 'prefix', tier: 1, text: '移动速度提高 35%' },
      { type: 'prefix', tier: 1, text: '+95 最大生命' },
      { type: 'suffix', tier: 1, text: '法术伤害压制率 +14%' },
      { type: 'suffix', tier: 1, text: '+35% 混沌抗性' },
      { type: 'suffix', tier: 1, text: '+48% 火焰抗性' },
      { type: 'suffix', tier: 1, text: '+48% 冰霜抗性' },
      { type: 'suffix', tier: 1, text: '冷却回复速度加快 16%' }
    ]
  }, cnCatalog, { initialSelection: 'auto' })
  const enabled = model.stats.filter((s) => s.enabled)
  assert.equal(enabled.length, 4)
  const capped = model.stats.filter((s) => !s.enabled && /上限/.test(s.autoSelection?.reason || ''))
  assert.ok(capped.length >= 1)
})

test('传奇装备自动预选腐化基底、变体词缀（禁断/守望之眼/法师之血）并忽略普通词缀', () => {
  const doubleCorruptUnique = parseItemInfo([
    '物品类别: 胸甲',
    '稀 有 度: 传奇',
    '白袍测试',
    '简易之袍',
    '--------',
    '插槽: W-W-W-W-W-W',
    '--------',
    '物品等级: 80',
    '--------',
    '{ 基底属性 (腐化) }',
    '此物品上装备的效果区域技能石等级 +2',
    '--------',
    '已腐化'
  ].join('\n'))
  const uniqueModel = createPriceCheckModel(doubleCorruptUnique, cnCatalog, { initialSelection: 'auto' })
  assert.equal(uniqueModel.identity.nameEnabled, true)
  assert.equal(uniqueModel.stateFilters.corrupted, 'true')
  assert.equal(uniqueModel.properties.find((p) => p.id === 'socket.links')?.enabled, true)
  assert.equal(uniqueModel.stats.find((s) => s.type === 'implicit')?.enabled, true)

  const forbidden = createPriceCheckModel({
    category: '珠宝', rarity: '传奇', name: '禁断之火', baseName: '赤红珠宝',
    modifiers: [{ type: 'unique', text: '禁断之肉上有匹配的词缀则配置 暴徒' }]
  }, cnCatalog, { initialSelection: 'auto' })
  assert.equal(forbidden.stats[0]?.enabled, true)
  assert.match(forbidden.stats[0]?.autoSelection?.reason || '', /禁断/)

  const mageblood = createPriceCheckModel({
    category: '腰带', rarity: '传奇', name: 'Mageblood', baseName: 'Heavy Belt',
    modifiers: [
      { type: 'unique', text: '+45 to Dexterity' },
      { type: 'unique', text: 'Leftmost 4 Magic Utility Flask constantly applies its Flask Effect to you' }
    ]
  }, intlCatalog, { initialSelection: 'auto' })
  const dex = mageblood.stats.find((s) => s.text.includes('Dexterity'))
  const flasks = mageblood.stats.find((s) => s.text.includes('Magic Utility Flask'))
  assert.equal(dex?.enabled, false)
  assert.equal(flasks?.enabled, true)
})

test('星团珠宝预选附魔、大天赋、精确天赋数与 84+ 物等', () => {
  const clusterText = [
    '物品类别: 珠宝',
    '稀 有 度: 稀有',
    '测试星团',
    '大型星团珠宝',
    '--------',
    '物品等级: 84',
    '--------',
    '增加 8 个天赋技能 (enchant)',
    '其中 2 个增加的天赋为珠宝槽 (enchant)',
    '增加的小天赋获得：法杖攻击造成的击中和异常状态伤害提高 12% (enchant)',
    '--------',
    '其中 1 个增加的天赋为武艺精湛',
    '其中 1 个增加的天赋为棱光之心'
  ].join('\n')
  const model = createPriceCheckModel(parseItemInfo(clusterText), cnCatalog, { initialSelection: 'auto' })
  assert.equal(model.identity.nameEnabled, true)
  assert.equal(model.properties.find((p) => p.id === 'misc.itemLevel')?.enabled, true)
  const passiveCount = model.stats.find((s) => s.id === 'enchant.stat_3086156145')
  assert.equal(passiveCount?.enabled, true)
  assert.equal(passiveCount?.min, 8)
  assert.equal(passiveCount?.max, 8)
  const notables = model.stats.filter((s) => s.text.includes('其中 1 个增加的天赋为'))
  assert.equal(notables.length, 2)
  assert.ok(notables.every((s) => s.enabled))
})

test('普通珠宝、宝石、药剂、忆境基底与双王基底按品类差异化预选', () => {
  const jewel = createPriceCheckModel({
    category: '珠宝', rarity: '稀有', name: '测试珠宝', baseName: '赤红珠宝',
    modifiers: [
      { type: 'implicit', text: '腐化之血无法施加于你' },
      { type: 'explicit', text: '生命上限提高 7%' },
      { type: 'explicit', text: '+16% 全域暴击伤害加成' },
      { type: 'explicit', text: '照亮范围扩大 10%' }
    ]
  }, cnCatalog, { initialSelection: 'auto' })
  assert.equal(jewel.stats.find((s) => s.text.includes('腐化之血'))?.enabled, true)
  assert.equal(jewel.stats.find((s) => s.text.includes('生命上限提高'))?.enabled, true)
  assert.equal(jewel.stats.some((s) => s.enabled && /暴击伤害加成/.test(s.text)), true)
  assert.equal(jewel.stats.find((s) => s.text.includes('照亮范围'))?.enabled, false)

  const gem = createPriceCheckModel({
    category: '技能宝石', rarity: '宝石', name: '电弧', baseName: '电弧',
    gemLevel: 21, quality: 20, isCorrupted: true
  }, cnCatalog, { initialSelection: 'auto' })
  assert.equal(gem.properties.find((p) => p.id === 'misc.gemLevel')?.enabled, true)
  assert.equal(gem.properties.find((p) => p.id === 'misc.quality')?.enabled, true)
  assert.equal(gem.stateFilters.corrupted, 'true')

  const awakenedGem = createPriceCheckModel({
    category: '觉醒辅助宝石', rarity: '宝石', name: '多重打击(强辅)', baseName: '多重打击(强辅)',
    gemLevel: 5, quality: 20
  }, cnCatalog, { initialSelection: 'auto' })
  assert.equal(awakenedGem.properties.find((p) => p.id === 'misc.gemLevel')?.enabled, true)

  const eldritchGloves = createPriceCheckModel(parseItemInfo([
    '物品类别: 手套',
    '稀 有 度: 稀有',
    '测试手套',
    '术士手套',
    '--------',
    '物品等级: 85',
    '--------',
    '{ 焚界者基底词缀（次级） }',
    '非瓦尔打击技能以周围额外 1 名敌人为目标',
    '{ 灭界者基底词缀（次级） }',
    '照亮范围扩大 10%',
    '--------',
    '焚界者物品',
    '灭界者物品'
  ].join('\n')), cnCatalog, { initialSelection: 'auto' })
  assert.equal(eldritchGloves.stateFilters.searing, 'any')
  assert.equal(eldritchGloves.stateFilters.tangled, 'any')
  assert.equal(eldritchGloves.stats.find((s) => s.text.includes('非瓦尔打击技能'))?.enabled, true)
  assert.equal(eldritchGloves.stats.find((s) => s.text.includes('照亮范围'))?.enabled, false)
})

test('国服与国际服目录对同一装备产生一致预选，且 autoSelection 元数据不写入官方请求', () => {
  const cnModel = createPriceCheckModel({
    category: '手套', rarity: '稀有', name: '测试手套', baseName: '术士手套', level: 85,
    modifiers: [
      { type: 'prefix', tier: 1, text: '+85 最大生命' },
      { type: 'suffix', tier: 1, text: '法术伤害压制率 +14%' },
      { type: 'suffix', tier: 1, text: '照亮范围扩大 15%' }
    ]
  }, cnCatalog, { initialSelection: 'auto' })
  const intlModel = createPriceCheckModel({
    category: '手套', rarity: '稀有', name: 'Test Gloves', baseName: 'Sorcerer Gloves', level: 85,
    modifiers: [
      { type: 'prefix', tier: 1, text: '+85 to maximum Life' },
      { type: 'suffix', tier: 1, text: '+14% chance to Suppress Spell Damage' },
      { type: 'suffix', tier: 1, text: '15% increased Light Radius' }
    ]
  }, intlCatalog, { initialSelection: 'auto' })

  assert.equal(cnModel.identity.nameEnabled, false)
  assert.equal(intlModel.identity.nameEnabled, false)
  assert.deepEqual(
    cnModel.stats.filter((s) => s.enabled).map((s) => s.id).sort(),
    intlModel.stats.filter((s) => s.enabled).map((s) => s.id).sort()
  )

  const sanitized = sanitizePriceCheckModel(cnModel, cnCatalog, cnModel.facts, cnModel.item.category, cnModel)
  assert.ok(sanitized.stats.every((s) => s.autoSelection && typeof s.autoSelection.reason === 'string'))
  const queryJson = JSON.stringify(buildOfficialTradeQuery(sanitized))
  assert.equal(queryJson.includes('autoSelection'), false)
})

test('低物等单势力稀有装备默认放宽势力条件，高物等/白蓝/双势力保持默认启用', () => {
  const lowRare = createPriceCheckModel(parseItemInfo([
    '物品类别: 腰带', '稀 有 度: 稀有', '测试腰带', '皮革腰带',
    '--------', '物品等级: 75', '--------', '塑界之器'
  ].join('\n')), cnCatalog, { initialSelection: 'auto' })
  assert.equal(lowRare.stats.find((s) => s.id === 'pseudo.pseudo_has_shaper_influence')?.enabled, false)

  const highRare = createPriceCheckModel(parseItemInfo([
    '物品类别: 腰带', '稀 有 度: 稀有', '测试腰带', '皮革腰带',
    '--------', '物品等级: 85', '--------', '塑界之器'
  ].join('\n')), cnCatalog, { initialSelection: 'auto' })
  assert.equal(highRare.stats.find((s) => s.id === 'pseudo.pseudo_has_shaper_influence')?.enabled, true)

  const dualLow = createPriceCheckModel(parseItemInfo([
    '物品类别: 腰带', '稀 有 度: 稀有', '测试腰带', '皮革腰带',
    '--------', '物品等级: 75', '--------', '塑界之器', '裂界之器'
  ].join('\n')), cnCatalog, { initialSelection: 'auto' })
  assert.equal(dualLow.stats.find((s) => s.id === 'pseudo.pseudo_has_shaper_influence')?.enabled, true)
  assert.equal(dualLow.stats.find((s) => s.id === 'pseudo.pseudo_has_elder_influence')?.enabled, true)
})
