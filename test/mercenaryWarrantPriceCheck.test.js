import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import { loadTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import {
  buildOfficialTradeQuery,
  createPriceCheckModel,
  sanitizePriceCheckModel
} from '../electron/modules/priceCheck/query.js'
import { PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { CHAOS_ERROR_CODES } from '../electron/modules/chaosRecipe/errors.js'
import { MERCENARY_WARRANT_FIXTURES } from './fixtures/mercenaryWarrants.js'

const catalogPath = path.resolve('electron/modules/priceCheck/catalog.json')
const catalogPromise = loadTradeCatalog(catalogPath)

test('三份佣兵凭证复制文本解析构建、等级和有序技能组并排除说明文字', () => {
  for (const fixture of MERCENARY_WARRANT_FIXTURES) {
    const item = parseItemInfo(fixture.text)
    assert.equal(item.category, '地图碎片')
    assert.equal(item.name, '佣兵凭证')
    assert.equal(item.mercenary.build, fixture.build)
    assert.equal(item.mercenary.level, 83)
    assert.equal(item.mercenary.skills.length, 6)
    assert.ok(item.mercenary.skills.some(({ supports }) => supports.length === 0))
    assert.deepEqual(item.modifiers, [])
    assert.equal(item.explicitMods.length, 0)
    assert.ok(item.mercenary.skills.every(({ name }) => !name.includes('右键点击') && !name.includes('个人地图装置')))
  }

  const ordinary = parseItemInfo(MERCENARY_WARRANT_FIXTURES[0].text)
  assert.deepEqual(ordinary.mercenary.skills[0].supports[0], {
    text: '武器元素伤害 (等阶：2)',
    name: '武器元素伤害',
    tier: 2
  })
  const fullWidth = parseItemInfo(MERCENARY_WARRANT_FIXTURES[0].text.replace('急冻 (等阶：2)', '急冻（等阶: 2）'))
  assert.deepEqual(fullWidth.mercenary.skills[0].supports[1], {
    text: '急冻（等阶: 2）',
    name: '急冻',
    tier: 2
  })
})

test('带价格尾标的佣兵凭证仍进入专用解析', () => {
  const text = MERCENARY_WARRANT_FIXTURES[0].text.replace(/^佣兵凭证$/m, '佣兵凭证 [1d]')
  const item = parseItemInfo(text)

  assert.equal(item.name, '佣兵凭证')
  assert.equal(item.mercenary.build, '连珠射手')
  assert.equal(item.mercenary.level, 83)
  assert.equal(item.mercenary.skills.length, 6)
  assert.deepEqual(item.explicitMods, [])
})

test('普通与恶名构建唯一映射官方身份且全部技能进入 mercenary 命名空间', async () => {
  const { catalog } = await catalogPromise
  for (const fixture of MERCENARY_WARRANT_FIXTURES) {
    const model = createPriceCheckModel(parseItemInfo(fixture.text), catalog)
    assert.equal(model.identity.type, fixture.officialType)
    assert.equal(model.identity.discriminator, 'mercenary_warrant')
    assert.equal(model.identity.displayName, `佣兵凭证（${fixture.build}）`)
    assert.equal(model.identity.category, 'map.fragment')
    assert.equal(model.item.mercenaryBuild, fixture.build)
    assert.equal(model.mercenarySkillGroups.length, 6)
    assert.ok(model.mercenarySkillGroups.every((group) => !group.enabled && group.skill.id.startsWith('mercenary.skill_')))
    assert.ok(model.mercenarySkillGroups.flatMap(({ supports }) => supports).every((support) => (
      !support.enabled && support.id.startsWith('mercenary.support_')
    )))
    assert.deepEqual(model.unknownStats, [])
  }
})

test('默认仅查询 BD，等级与技能组按选择严格序列化且同名辅助不跨组', async () => {
  const { catalog } = await catalogPromise
  const model = createPriceCheckModel(parseItemInfo(MERCENARY_WARRANT_FIXTURES[0].text), catalog)
  const level = model.properties.find(({ label }) => label === '佣兵等级')
  assert.deepEqual(level, {
    id: 'misc.itemLevel', label: '佣兵等级', value: 83, enabled: false, min: 83, max: undefined
  })

  const initial = buildOfficialTradeQuery(model)
  assert.deepEqual(initial.query.type, { discriminator: 'mercenary_warrant', option: 'EleBowRangerClones' })
  assert.equal(initial.query.filters.type_filters.filters.category.option, 'map.fragment')
  assert.equal(initial.query.filters.misc_filters?.filters.ilvl, undefined)
  assert.deepEqual(initial.query.stats, [{ type: 'and', filters: [] }])

  const iceShot = model.mercenarySkillGroups[0]
  const vaalIceShot = model.mercenarySkillGroups[2]
  iceShot.enabled = true
  iceShot.supports.find(({ name }) => name === '急冻').enabled = true
  vaalIceShot.enabled = true
  vaalIceShot.supports.find(({ name }) => name === '急冻').enabled = true
  level.enabled = true
  level.min = 80
  level.max = 84

  const selected = buildOfficialTradeQuery(model)
  assert.deepEqual(selected.query.filters.misc_filters.filters.ilvl, { min: 80, max: 84 })
  const groups = selected.query.stats.filter(({ type }) => type === 'mercenary')
  assert.equal(groups.length, 2)
  assert.deepEqual(groups.map(({ value }) => value), [{ min: 2 }, { min: 2 }])
  assert.equal(groups[0].filters[0].id, iceShot.skill.id)
  assert.equal(groups[1].filters[0].id, vaalIceShot.skill.id)
  assert.equal(groups[0].filters[1].id, iceShot.supports.find(({ name }) => name === '急冻').id)
  assert.equal(groups[1].filters[1].id, vaalIceShot.supports.find(({ name }) => name === '急冻').id)
})

test('trusted model 重建凭证身份和组关系，仅保留合法选择与等级范围', async () => {
  const { catalog } = await catalogPromise
  const trusted = createPriceCheckModel(parseItemInfo(MERCENARY_WARRANT_FIXTURES[0].text), catalog)
  const submitted = structuredClone(trusted)
  submitted.identity.type = '伪造底材'
  submitted.identity.discriminator = 'map'
  submitted.item.mercenaryBuild = '伪造构建'
  submitted.properties.find(({ label }) => label === '佣兵等级').min = 81
  submitted.mercenarySkillGroups[0].enabled = true
  submitted.mercenarySkillGroups[0].skill.id = trusted.mercenarySkillGroups[1].skill.id
  submitted.mercenarySkillGroups[0].supports[0].enabled = true
  submitted.mercenarySkillGroups[1].supports.push({
    ...structuredClone(submitted.mercenarySkillGroups[0].supports[1]),
    enabled: true
  })

  const clean = sanitizePriceCheckModel(submitted, catalog, trusted.facts, trusted.item.category, trusted)
  assert.equal(clean.identity.type, trusted.identity.type)
  assert.equal(clean.identity.discriminator, 'mercenary_warrant')
  assert.equal(clean.item.mercenaryBuild, '连珠射手')
  assert.equal(clean.mercenarySkillGroups[0].skill.id, trusted.mercenarySkillGroups[0].skill.id)
  assert.equal(clean.mercenarySkillGroups[0].enabled, true)
  assert.equal(clean.mercenarySkillGroups[0].supports[0].enabled, true)
  assert.equal(clean.mercenarySkillGroups[1].supports.some(({ enabled }) => enabled), false)
  assert.equal(clean.properties.find(({ label }) => label === '佣兵等级').min, 81)

  submitted.properties.find(({ label }) => label === '佣兵等级').min = -1
  submitted.properties.find(({ label }) => label === '佣兵等级').max = 101
  const invalidLevel = sanitizePriceCheckModel(submitted, catalog, trusted.facts, trusted.item.category, trusted)
  assert.equal(invalidLevel.properties.find(({ label }) => label === '佣兵等级').min, undefined)
  assert.equal(invalidLevel.properties.find(({ label }) => label === '佣兵等级').max, undefined)
})

test('未知 BD 构建返回可诊断错误', async () => {
  const { catalog } = await catalogPromise
  const item = parseItemInfo(MERCENARY_WARRANT_FIXTURES[0].text.replace('BD构建: 连珠射手', 'BD构建: 不存在的构建'))
  assert.throws(() => createPriceCheckModel(item, catalog), /没有佣兵构建“不存在的构建”/)
})

test('官方复杂度拒绝返回稳定提示且保留当前技能选择', async () => {
  const { catalog, status } = await catalogPromise
  let overlayState = null
  let searches = 0
  const overlay = {
    create(snapshot) { overlayState = structuredClone(snapshot) },
    update(snapshot) { overlayState = { ...overlayState, ...structuredClone(snapshot) } },
    getState() { return overlayState }
  }
  const service = new PriceCheckService({
    auth: { getStatus: () => ({ authenticated: true, accountName: 'me' }), registerCacheClearer() {} },
    client: {
      clearCache() {},
      async search() {
        searches += 1
        const error = new Error('官方查询失败')
        error.details = { status: 400, officialMessage: 'Query is too complex' }
        throw error
      },
      async fetch() { return { result: [] } }
    },
    catalog,
    catalogStatus: status,
    overlay
  })
  service.updateRuntime({ enabled: true })
  const model = createPriceCheckModel(parseItemInfo(MERCENARY_WARRANT_FIXTURES[0].text), catalog)
  model.mercenarySkillGroups[0].enabled = true

  await assert.rejects(
    service.check({ league: 'S30', model }),
    (error) => error.code === CHAOS_ERROR_CODES.QUERY_TOO_COMPLEX && /减少启用的技能组/.test(error.message)
  )
  assert.equal(searches, 1)
  assert.equal(overlayState.status, 'error')
  assert.equal(overlayState.error.code, CHAOS_ERROR_CODES.QUERY_TOO_COMPLEX)
  assert.equal(overlayState.model.mercenarySkillGroups[0].enabled, true)
})

test('普通物品的复杂度拒绝使用通用筛选提示', async () => {
  const { catalog, status } = await catalogPromise
  const service = new PriceCheckService({
    auth: { getStatus: () => ({ authenticated: true, accountName: 'me' }), registerCacheClearer() {} },
    client: {
      clearCache() {},
      async search() {
        const error = new Error('官方查询失败')
        error.details = { status: 400, officialMessage: 'Query is too complex' }
        throw error
      },
      async fetch() { return { result: [] } }
    },
    catalog,
    catalogStatus: status,
    overlay: { create() {}, update() {} }
  })
  service.updateRuntime({ enabled: true })
  const model = createPriceCheckModel({
    category: '腰带',
    rarity: '稀有',
    name: '皮革腰带',
    baseName: '皮革腰带',
    modifiers: []
  }, catalog)

  await assert.rejects(
    service.check({ league: 'S30', model }),
    (error) => error.code === CHAOS_ERROR_CODES.QUERY_TOO_COMPLEX &&
      /减少启用的筛选条件/.test(error.message) &&
      !/佣兵/.test(error.message)
  )
})
