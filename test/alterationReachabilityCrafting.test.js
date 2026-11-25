import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createServer } from 'vite'
import { normalizeAffixCondition } from '../src/domains/items/affixConfig.js'
import { evaluateAlterationPlan, matchAffixes } from '../electron/modules/item/matcher.js'
import { evaluateClipboardItem } from '../electron/modules/item/evaluateClipboardItem.js'
import { CraftingDataRepository } from '../electron/modules/crafting/dataRepository.js'
import { pythonPath } from './helpers/python.js'

function runPython(script) {
  const executed = spawnSync(pythonPath, ['-c', script], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
  })
  assert.equal(executed.status, 0, executed.stderr)
  return JSON.parse(executed.stdout.trim().split(/\r?\n/).at(-1))
}

function catalogCondition(effectPattern, { affixType = '', minTier = null, id = 'c' } = {}) {
  return {
    id,
    enabled: true,
    kind: 'catalog',
    keyword: effectPattern,
    displayName: effectPattern,
    effectPattern,
    affixType,
    minTier,
    tiers: []
  }
}

function keywordCondition(keyword, id = 'k') {
  return {
    id,
    enabled: true,
    kind: 'keyword',
    keyword,
    displayName: keyword,
    effectPattern: '',
    affixType: '',
    minTier: null,
    tiers: []
  }
}

function magicItem({ category = '功能药剂', modifiers = [] } = {}) {
  return {
    category,
    rarity: '魔法',
    modifiers,
    detailedMods: modifiers,
    explicitMods: modifiers.map((entry) => entry.text)
  }
}

test('normalizeAffixCondition 保留目录词缀前后缀并在关键词下清空', () => {
  const catalog = normalizeAffixCondition({
    kind: 'catalog',
    keyword: '最大生命',
    effectPattern: '+# 最大生命',
    affixType: 'prefix',
    minTier: 2
  })
  assert.equal(catalog.affixType, 'prefix')

  const invalidType = normalizeAffixCondition({
    kind: 'catalog',
    keyword: '最大生命',
    effectPattern: '+# 最大生命',
    affixType: 'unknown'
  })
  assert.equal(invalidType.affixType, '')

  const keyword = normalizeAffixCondition({
    kind: 'keyword',
    keyword: '最大生命',
    affixType: 'prefix'
  })
  assert.equal(keyword.affixType, '')
})

test('evaluateAlterationPlan 药剂出现低 T 同词缀占坑时跳过增幅', () => {
  const group = {
    id: 'g1',
    name: '药剂双T2',
    enabled: true,
    requiredAffixes: [
      catalogCondition('持续时间延长 #%', { affixType: 'prefix', minTier: 2, id: 'p1' }),
      catalogCondition('生效期间，护甲提高 #%', { affixType: 'suffix', minTier: 2, id: 's1' })
    ],
    selectedAffixes: [],
    selectedCount: 1
  }

  // 出现 T3 前缀占坑 -> 即使增幅也绝不可能达成 T1/T2 要求
  const t3Prefix = magicItem({
    category: '功能药剂',
    modifiers: [{ type: 'prefix', affixType: 'prefix', tier: 3, text: '持续时间延长 25%' }]
  })
  const planBlocked = evaluateAlterationPlan(t3Prefix, [group], {
    enableAugmentation: true,
    enableRegal: false
  })
  assert.equal(planBlocked.shouldAugment, false)
  assert.equal(planBlocked.shouldRegal, false)
  assert.match(planBlocked.skipAugmentReason, /低 T 级占用/)

  // 出现 T2 前缀 -> 剩余空后缀可出所需后缀，应该增幅
  const t2Prefix = magicItem({
    category: '功能药剂',
    modifiers: [{ type: 'prefix', affixType: 'prefix', tier: 2, text: '持续时间延长 35%' }]
  })
  const planHit = evaluateAlterationPlan(t2Prefix, [group], {
    enableAugmentation: true,
    enableRegal: false
  })
  assert.equal(planHit.shouldAugment, true)
  assert.equal(planHit.openAugSlot, 'suffix')

  // 出现无关垃圾前缀 -> 缺失 2 条但增幅最多加 1 条，跳过增幅
  const junkPrefix = magicItem({
    category: '功能药剂',
    modifiers: [{ type: 'prefix', affixType: 'prefix', tier: 1, text: '充能消耗降低 20%' }]
  })
  const planCount = evaluateAlterationPlan(junkPrefix, [group], {
    enableAugmentation: true,
    enableRegal: false
  })
  assert.equal(planCount.shouldAugment, false)
  assert.equal(planCount.shouldRegal, false)
})

test('evaluateAlterationPlan 前后缀槽位判定与双前缀跳过无收益增幅直点富豪', () => {
  const twoPrefixesGroup = {
    id: 'g1',
    name: '双前缀',
    enabled: true,
    requiredAffixes: [
      catalogCondition('+# 最大生命', { affixType: 'prefix', minTier: 2, id: 'p1' }),
      catalogCondition('物理伤害提高 #%', { affixType: 'prefix', minTier: 2, id: 'p2' })
    ],
    selectedAffixes: [],
    selectedCount: 1
  }

  // 已有前缀 A，空位为后缀：增幅 0% 概率出前缀 B，直接跳过增幅走富豪
  const onePrefixHit = magicItem({
    category: '单手剑',
    modifiers: [{ type: 'prefix', affixType: 'prefix', tier: 1, text: '+90 最大生命' }]
  })
  const withRegal = evaluateAlterationPlan(onePrefixHit, [twoPrefixesGroup], {
    enableAugmentation: true,
    enableRegal: true
  })
  assert.equal(withRegal.shouldAugment, false)
  assert.equal(withRegal.shouldRegal, true)

  // 未开启富豪时：既不增幅也不富豪
  const withoutRegal = evaluateAlterationPlan(onePrefixHit, [twoPrefixesGroup], {
    enableAugmentation: true,
    enableRegal: false
  })
  assert.equal(withoutRegal.shouldAugment, false)
  assert.equal(withoutRegal.shouldRegal, false)

  // 已有无关前缀 X，空位为后缀，目标要两条前缀：增幅+富豪最多只能出 1 条前缀，跳过增幅和富豪
  const junkPrefix = magicItem({
    category: '单手剑',
    modifiers: [{ type: 'prefix', affixType: 'prefix', tier: 1, text: '+# 最大魔力'.replace('#', '40') }]
  })
  const impossibleTwoPrefix = evaluateAlterationPlan(junkPrefix, [twoPrefixesGroup], {
    enableAugmentation: true,
    enableRegal: true
  })
  assert.equal(impossibleTwoPrefix.shouldAugment, false)
  assert.equal(impossibleTwoPrefix.shouldRegal, false)

  // 已有无关后缀 Y，空位为前缀：增幅可出前缀 A、富豪可出前缀 B -> 应该先增幅
  const junkSuffix = magicItem({
    category: '单手剑',
    modifiers: [{ type: 'suffix', affixType: 'suffix', tier: 1, text: '+30% 火焰抗性' }]
  })
  const reachableViaAugAndRegal = evaluateAlterationPlan(junkSuffix, [twoPrefixesGroup], {
    enableAugmentation: true,
    enableRegal: true
  })
  assert.equal(reachableViaAugAndRegal.shouldAugment, true)
  assert.equal(reachableViaAugAndRegal.shouldRegal, false)
})

test('evaluateAlterationPlan 药剂自动忽略富豪且不将富豪纳入增幅前瞻', () => {
  const group = {
    id: 'g1',
    name: '药剂双词缀',
    enabled: true,
    requiredAffixes: [
      catalogCondition('持续时间延长 #%', { affixType: 'prefix', minTier: 2, id: 'p1' }),
      catalogCondition('生效期间，护甲提高 #%', { affixType: 'suffix', minTier: 2, id: 's1' })
    ],
    selectedAffixes: [],
    selectedCount: 1
  }

  // 垃圾前缀：非药剂在 增幅+富豪 下有 2 步预算会增幅，但药剂不能富豪所以只有 1 步预算 -> 必须跳过增幅
  const flaskJunkPrefix = magicItem({
    category: '功能药剂',
    modifiers: [{ type: 'prefix', affixType: 'prefix', tier: 1, text: '充能消耗降低 20%' }]
  })
  const flaskPlan = evaluateAlterationPlan(flaskJunkPrefix, [group], {
    enableAugmentation: true,
    enableRegal: true
  })
  assert.equal(flaskPlan.canUseRegalOnItem, false)
  assert.equal(flaskPlan.shouldAugment, false)
  assert.equal(flaskPlan.shouldRegal, false)

  // 药剂双词缀命中 1/2：即使勾选富豪也不触发富豪
  const flaskTwoMod = magicItem({
    category: '功能药剂',
    modifiers: [
      { type: 'prefix', affixType: 'prefix', tier: 1, text: '持续时间延长 35%' },
      { type: 'suffix', affixType: 'suffix', tier: 4, text: '生效期间，移动速度提高 5%' }
    ]
  })
  const flaskRegalPlan = evaluateAlterationPlan(flaskTwoMod, [group], {
    enableAugmentation: true,
    enableRegal: true
  })
  assert.equal(flaskRegalPlan.shouldRegal, false)
  assert.match(flaskRegalPlan.skipRegalReason, /药剂无法使用富豪石/)

  // 同样的双词缀放在戒指上：开启富豪则应触发富豪
  const ringTwoMod = magicItem({
    category: '戒指',
    modifiers: flaskTwoMod.modifiers
  })
  const ringRegalPlan = evaluateAlterationPlan(ringTwoMod, [group], {
    enableAugmentation: true,
    enableRegal: true
  })
  assert.equal(ringRegalPlan.canUseRegalOnItem, true)
  assert.equal(ringRegalPlan.shouldRegal, true)
})

test('evaluateAlterationPlan 组间 OR、单词缀已达标、自定义关键词与旧预设目录回填前后缀', async () => {
  // 1. 单词缀已达标 -> 直接停止，不增幅不富豪
  const singleGoal = {
    id: 'g-single',
    name: '单前缀目标',
    enabled: true,
    requiredAffixes: [catalogCondition('+# 最大生命', { affixType: 'prefix', minTier: 2, id: 'p1' })],
    selectedAffixes: [],
    selectedCount: 1
  }
  const alreadyMatched = magicItem({
    category: '戒指',
    modifiers: [{ type: 'prefix', affixType: 'prefix', tier: 1, text: '+79 最大生命' }]
  })
  const stopPlan = evaluateAlterationPlan(alreadyMatched, [singleGoal], {
    enableAugmentation: true,
    enableRegal: true
  })
  assert.equal(stopPlan.nextAction, 'stop')
  assert.equal(stopPlan.shouldAugment, false)
  assert.equal(stopPlan.shouldRegal, false)

  // 2. 组间 OR：组 1 被 T3 占坑不可达，但组 2 仍可通过增幅达标 -> 应该增幅
  const group1Blocked = {
    id: 'g1',
    name: '组合1',
    enabled: true,
    requiredAffixes: [catalogCondition('持续时间延长 #%', { affixType: 'prefix', minTier: 2, id: 'p1' })],
    selectedAffixes: [],
    selectedCount: 1
  }
  const group2Open = {
    id: 'g2',
    name: '组合2',
    enabled: true,
    requiredAffixes: [catalogCondition('生效期间，护甲提高 #%', { affixType: 'suffix', minTier: 2, id: 's1' })],
    selectedAffixes: [],
    selectedCount: 1
  }
  const t3PrefixFlask = magicItem({
    category: '功能药剂',
    modifiers: [{ type: 'prefix', affixType: 'prefix', tier: 3, text: '持续时间延长 25%' }]
  })
  const orPlan = evaluateAlterationPlan(t3PrefixFlask, [group1Blocked, group2Open], {
    enableAugmentation: true,
    enableRegal: false
  })
  assert.equal(orPlan.shouldAugment, true)

  // 3. 自定义关键词：数量按独立词缀计，前后缀保守放行
  const twoKeywordsGroup = {
    id: 'gk2',
    name: '双关键词',
    enabled: true,
    requiredAffixes: [keywordCondition('最大生命', 'k1'), keywordCondition('火焰抗性', 'k2')],
    selectedAffixes: [],
    selectedCount: 1
  }
  const junkPrefixItem = magicItem({
    category: '戒指',
    modifiers: [{ type: 'prefix', affixType: 'prefix', tier: 1, text: '+30 最大魔力' }]
  })
  assert.equal(evaluateAlterationPlan(junkPrefixItem, [twoKeywordsGroup], {
    enableAugmentation: true,
    enableRegal: false
  }).shouldAugment, false)

  const oneKeywordGroup = {
    id: 'gk1',
    name: '单关键词',
    enabled: true,
    requiredAffixes: [keywordCondition('最大生命', 'k1')],
    selectedAffixes: [],
    selectedCount: 1
  }
  assert.equal(evaluateAlterationPlan(junkPrefixItem, [oneKeywordGroup], {
    enableAugmentation: true,
    enableRegal: false
  }).shouldAugment, true)

  // 4. 旧预设（未保存 affixType）通过内置目录自动解析前后缀
  const repo = new CraftingDataRepository()
  await repo.initialize()
  const legacyLife = catalogCondition('+# 最大生命', { affixType: '', minTier: 2, id: 'legacy' })
  assert.equal(repo.resolveCatalogAffixType(legacyLife), 'prefix')

  const evaluated = evaluateClipboardItem({
    clipboardText: [
      '物品类别: 戒指',
      '稀 有 度: 魔法',
      '测试戒指',
      '双玉戒指',
      '--------',
      '物品等级: 86',
      '--------',
      '{ 前缀属性 "微光之" (等阶：1) — 魔力 }',
      '+30 最大魔力'
    ].join('\n'),
    config: {
      moduleTwo: {
        enabled: true,
        mode: 'alteration',
        enableAugmentation: true,
        enableRegal: false,
        affixGroups: [{ id: 'g', name: '旧预设生命', enabled: true, requiredAffixes: [legacyLife], selectedAffixes: [], selectedCount: 1 }]
      }
    },
    crafting: { resolveCatalogAffixType: (cond) => repo.resolveCatalogAffixType(cond) }
  })
  assert.equal(evaluated.result.affixMatch, false)
  assert.equal(evaluated.result.alterationPlan.shouldAugment, false)
  assert.equal(evaluated.result.alterationPlan.openAugSlot, 'suffix')
})

test('Python 脚本按 alterationPlan 跳过无望增幅、差一条赌富豪并处理普通与单破碎回退', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript } = await server.ssrLoadModule('/src/utils/python.js')
    const generate = ({ enableAugmentation = true, enableRegal = true, checkInitialItem = true } = {}) => generatePythonScript({
      globalShortcuts: { end: 'Alt+3' },
      currencyPositions: {
        wisdom: { x: 1, y: 1 },
        alteration: { x: 2, y: 2 },
        augmentation: { x: 3, y: 3 },
        regal: { x: 6, y: 6 },
        transmutation: { x: 4, y: 4 },
        scouring: { x: 5, y: 5 }
      },
      operationDelayMs: 50,
      fixedTiming: {},
      itemPosition: { x: 30, y: 40 },
      preset: {
        checkInitialItem,
        moduleTwo: {
          enabled: true,
          mode: 'alteration',
          enableAugmentation,
          enableRegal,
          affixGroups: [{ id: 'goal', name: '目标', requiredAffixes: ['生命'], selectedAffixes: [], selectedCount: 1 }]
        },
        moduleThree: { enabled: false },
        moduleEldritch: { enabled: false }
      },
      filePaths: { itemInfoFile: 'item.txt', itemInfoResultFile: 'result.json' },
      stashTabSelection: { enabled: false }
    })

    const runScenario = (generated, initial, queue) => {
      const helperStart = generated.indexOf('def fail_item_runtime(')
      const helperEnd = generated.indexOf('def fail_item_preparation(', helperStart)
      const logicStart = generated.indexOf('def has_fractured_affix(')
      const logicEnd = generated.indexOf('def craft_eldritch_implicits(', logicStart)
      assert.ok(helperStart >= 0 && helperEnd > helperStart && logicStart >= 0 && logicEnd > logicStart)
      return runPython(`
import json, time
${generated.slice(helperStart, helperEnd)}
${generated.slice(logicStart, logicEnd)}
is_running = True
applied = []
fatal = []
queue = json.loads(r'''${JSON.stringify(queue)}''')
def fail_item_runtime(reason, code="ITEM_READ_FAILED"):
    fatal.append({"reason": reason, "code": code})
    globals()["is_running"] = False
    return False
def apply_currency(currency):
    applied.append(currency)
    return True
def read_current_item(*_args, **_kwargs):
    return queue.pop(0) if queue else {"error": "queue_empty"}
time.sleep = lambda _seconds: None
success = craft_affixes(json.loads(r'''${JSON.stringify(initial)}'''))
print(json.dumps({"success": bool(success), "applied": applied, "fatal": fatal, "remaining": len(queue)}, ensure_ascii=False))
`)
    }

    // 场景 1：药剂 T3 占坑跳过增幅 -> 直接下一轮改造 -> 命中后不点增幅也不点富豪
    const s1 = runScenario(generate({ enableAugmentation: true, enableRegal: true }), {
      rarity: '魔法',
      affixMatch: false,
      modifiers: [{ type: 'prefix', tier: 3, text: '持续时间延长 25%' }],
      alterationPlan: { shouldAugment: false, shouldRegal: false, skipAugmentReason: '低 T 占坑' }
    }, [{
      rarity: '魔法',
      affixMatch: true,
      matchedGroupName: '药剂双T2',
      modifiers: [
        { type: 'prefix', tier: 1, text: '持续时间延长 35%' },
        { type: 'suffix', tier: 1, text: '生效期间，护甲提高 55%' }
      ],
      alterationPlan: { shouldAugment: false, shouldRegal: false }
    }])
    assert.deepEqual(s1, { success: true, applied: ['alteration'], fatal: [], remaining: 0 })

    // 场景 2：双前缀缺前缀（空后缀）跳过增幅直点富豪 -> 富豪未命中变稀有 -> 重铸 -> 蜕变 -> 蜕变直接达标（不再浪费改造）
    const s2 = runScenario(generate({ enableAugmentation: true, enableRegal: true }), {
      rarity: '魔法',
      affixMatch: false,
      modifiers: [{ type: 'prefix', tier: 1, text: '+90 最大生命' }],
      alterationPlan: { shouldAugment: false, shouldRegal: true, skipAugmentReason: '空后缀跳过增幅直点富豪' }
    }, [
      // 富豪未命中变为稀有
      {
        rarity: '稀有',
        affixMatch: false,
        modifiers: [
          { type: 'prefix', tier: 1, text: '+90 最大生命' },
          { type: 'suffix', tier: 5, text: '+10% 冰霜抗性' }
        ]
      },
      // 重铸后变为普通
      { rarity: '普通', affixMatch: false, modifiers: [] },
      // 蜕变后变为魔法且直接达标
      {
        rarity: '魔法',
        affixMatch: true,
        matchedGroupName: '目标',
        modifiers: [{ type: 'prefix', tier: 1, text: '+90 最大生命' }],
        alterationPlan: { shouldAugment: false, shouldRegal: false }
      }
    ])
    assert.deepEqual(s2, { success: true, applied: ['regal', 'scouring', 'transmutation'], fatal: [], remaining: 0 })

    // 场景 3：单破碎物品 增幅 -> 富豪未命中变稀有 -> 重铸直接变回单破碎魔法（不蜕变）-> 增幅 -> 富豪命中
    const s3 = runScenario(generate({ enableAugmentation: true, enableRegal: true }), {
      rarity: '魔法',
      affixMatch: false,
      modifiers: [{ type: 'fractured', affixType: 'prefix', tier: 1, text: '+90 最大生命' }],
      alterationPlan: { shouldAugment: true, shouldRegal: false }
    }, [
      // 增幅后双词缀差 1 条，触发富豪
      {
        rarity: '魔法',
        affixMatch: false,
        modifiers: [
          { type: 'fractured', affixType: 'prefix', tier: 1, text: '+90 最大生命' },
          { type: 'suffix', affixType: 'suffix', tier: 1, text: '+45% 火焰抗性' }
        ],
        alterationPlan: { shouldAugment: false, shouldRegal: true }
      },
      // 富豪未命中变稀有（单破碎）
      {
        rarity: '稀有',
        affixMatch: false,
        modifiers: [
          { type: 'fractured', affixType: 'prefix', tier: 1, text: '+90 最大生命' },
          { type: 'suffix', affixType: 'suffix', tier: 1, text: '+45% 火焰抗性' },
          { type: 'suffix', affixType: 'suffix', tier: 6, text: '+6% 闪电抗性' }
        ]
      },
      // 重铸直接变回单破碎魔法，立即进入增幅判断
      {
        rarity: '魔法',
        affixMatch: false,
        modifiers: [{ type: 'fractured', affixType: 'prefix', tier: 1, text: '+90 最大生命' }],
        alterationPlan: { shouldAugment: true, shouldRegal: false }
      },
      // 增幅后差 1 条 -> 触发富豪
      {
        rarity: '魔法',
        affixMatch: false,
        modifiers: [
          { type: 'fractured', affixType: 'prefix', tier: 1, text: '+90 最大生命' },
          { type: 'suffix', affixType: 'suffix', tier: 1, text: '+45% 冰霜抗性' }
        ],
        alterationPlan: { shouldAugment: false, shouldRegal: true }
      },
      // 富豪命中！
      {
        rarity: '稀有',
        affixMatch: true,
        matchedGroupName: '目标',
        modifiers: [
          { type: 'fractured', affixType: 'prefix', tier: 1, text: '+90 最大生命' },
          { type: 'suffix', affixType: 'suffix', tier: 1, text: '+45% 冰霜抗性' },
          { type: 'prefix', affixType: 'prefix', tier: 1, text: '+120% 物理伤害' }
        ]
      }
    ])
    assert.deepEqual(s3, {
      success: true,
      applied: ['augmentation', 'regal', 'scouring', 'augmentation', 'regal'],
      fatal: [],
      remaining: 0
    })
  } finally {
    await server.close()
  }
})
