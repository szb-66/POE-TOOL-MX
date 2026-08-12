import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createServer } from 'vite'
import { pythonPath } from './helpers/python.js'
import { CraftingDataRepository } from '../electron/modules/crafting/dataRepository.js'
import { CraftingService } from '../electron/modules/crafting/service.js'
import { matchEldritchImplicits } from '../electron/modules/item/matcher.js'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import {
  eldritchCurrencyType,
  normalizeEldritchModule
} from '../src/domains/items/eldritchConfig.js'
import { buildCraftingCurrencyPreflight } from '../src/utils/currencyPreflight.js'
import { validateCraftingConfig } from '../src/utils/validation.js'

const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8')
const builtinRoot = path.resolve('electron/assets/crafting-data')

test('古灵配置规范化来源、T1–T4 和多目标去重', () => {
  const normalized = normalizeEldritchModule({
    enabled: true,
    source: 'eater',
    tier: 9,
    targets: [
      { familyId: 'eater:a', displayName: '目标 A', effectPattern: '效果提高 #%' },
      { familyId: 'eater:a', displayName: '重复 A', effectPattern: '效果提高 #%' },
      { familyId: '', effectPattern: '无效' }
    ]
  })
  assert.equal(normalized.enabled, true)
  assert.equal(normalized.source, 'eater')
  assert.ok(normalized.targets.every((target) => target.source === 'eater'))
  assert.equal(normalized.tier, 1)
  assert.equal(normalized.targets.length, 1)
  assert.equal(normalized.targets[0].displayName, '重复 A')
})

test('八种模式和等级映射到唯一直接古灵通货并加入预检', () => {
  const expected = {
    exarch: ['lesser-eldritch-ember', 'greater-eldritch-ember', 'grand-eldritch-ember', 'exceptional-eldritch-ember'],
    eater: ['lesser-eldritch-ichor', 'greater-eldritch-ichor', 'grand-eldritch-ichor', 'exceptional-eldritch-ichor']
  }
  for (const sourceName of ['exarch', 'eater']) {
    for (let tier = 1; tier <= 4; tier += 1) {
      const moduleEldritch = { enabled: true, source: sourceName, tier, targets: [] }
      assert.equal(eldritchCurrencyType(moduleEldritch), expected[sourceName][tier - 1])
      assert.deepEqual(buildCraftingCurrencyPreflight({ moduleEldritch }), [expected[sourceName][tier - 1]])
    }
  }
})

test('古灵启动校验要求目标、互斥模块和所选通货坐标', () => {
  const base = {
    itemPosition: { x: 100, y: 100 },
    currencyPositions: { 'grand-eldritch-ichor': { x: 20, y: 30 } },
    preset: {
      moduleTwo: { enabled: false },
      moduleThree: { enabled: false },
      moduleEldritch: {
        enabled: true,
        source: 'eater',
        tier: 3,
        targets: [{ familyId: 'eater:a', displayName: '目标', effectPattern: '效果 #%' }]
      }
    }
  }
  assert.equal(validateCraftingConfig(base).isValid, true)
  assert.doesNotMatch(validateCraftingConfig(base).errors.join('\n'), /知识卷轴/)
  assert.match(validateCraftingConfig({ ...base, currencyPositions: {} }).errors.join('\n'), /上级古灵溶液/)
  assert.match(validateCraftingConfig({
    ...base,
    preset: { ...base.preset, moduleTwo: { enabled: true }, moduleEldritch: { ...base.preset.moduleEldritch, targets: [] } }
  }).errors.join('\n'), /不能与显式词缀|至少需要选择一个目标/)
})

test('古灵 matcher 只检查隐式、忽略数值并按任一目标完成', () => {
  const targets = [
    { familyId: 'exarch:a', displayName: '攻击速度', effectPattern: '攻击速度加快 #%'},
    { familyId: 'exarch:b', displayName: '火焰抗性', effectPattern: '火焰抗性提高 #%'}
  ]
  const explicitOnly = {
    implicitMods: ['最大生命提高 7%'],
    explicitMods: ['攻击速度加快 12%'],
    modifiers: [{ type: 'prefix', text: '攻击速度加快 12%' }]
  }
  assert.equal(matchEldritchImplicits(explicitOnly, targets).isMatch, false)
  const matched = matchEldritchImplicits({
    ...explicitOnly,
    implicitMods: ['攻击速度加快 17%'],
    modifiers: [{ type: 'implicit', text: '攻击速度加快 17%' }]
  }, targets)
  assert.equal(matched.isMatch, true)
  assert.equal(matched.matchedTargetName, '攻击速度')
  assert.equal(matched.matchedText, '攻击速度加快 17%')
})

test('详细中文装备中的多行基底隐式按完整效果精确匹配', () => {
  const item = parseItemInfo(`物品类别: 头部
稀 有 度: 稀有
余烬之冠
梦魇战盔
--------
物品等级: 86
--------
{ 基底属性 — 攻击, 速度 }
攻击击中时有 17% 的几率获得猛攻
攻击速度加快 9%
--------
{ 后缀属性 "炽烈之" (等阶：2) — 攻击, 速度 }
攻击击中时有 17% 的几率获得猛攻
攻击速度加快 9%`)
  const target = {
    familyId: 'exarch:multiline',
    displayName: '猛攻与攻击速度',
    effectPattern: '攻击击中时有 #% 的几率获得猛攻\n攻击速度加快 #%'
  }
  const matched = matchEldritchImplicits(item, [target])
  assert.equal(item.category, '头部')
  assert.equal(matched.isMatch, true)
  assert.equal(matched.matchedTargetName, '猛攻与攻击速度')
  assert.equal(matched.matchedText, '攻击击中时有 17% 的几率获得猛攻\n攻击速度加快 9%')
})

test('天然基底隐式与古灵目标重叠时不误判，真实古灵副本仍可命中', async () => {
  const repository = new CraftingDataRepository({ builtinRoot })
  await repository.initialize()
  const cases = [
    ['飞羽便鞋', '移动速度加快 10%', '移动速度加快 #%'],
    ['逃亡之靴', '+15% 混沌抗性', '+#% 混沌抗性'],
    ['星芒战铠', '+10% 所有元素抗性', '+#% 所有元素抗性'],
    ['黄金战甲', '+20% 所有元素抗性', '+#% 所有元素抗性']
  ]
  for (const [baseName, rolledText, effectPattern] of cases) {
    const base = repository.getDataset().bases.find((entry) => entry.name === baseName)
    const target = [{ familyId: `target:${baseName}`, source: 'exarch', displayName: '目标', effectPattern }]
    const naturalBaseImplicitTexts = CraftingService.prototype.naturalBaseImplicitTexts.call({ repository }, baseName)
    assert.deepEqual(naturalBaseImplicitTexts, base.implicitModifiers.map((implicit) => implicit.text))
    const options = { naturalBaseImplicitTexts }
    assert.equal(matchEldritchImplicits({ implicitMods: [rolledText] }, target, options).isMatch, false, baseName)
    assert.equal(matchEldritchImplicits({ implicitMods: [rolledText, rolledText] }, target, options).isMatch, true, baseName)
  }
})

test('真实古灵目录按来源和 T1–T4 正权重返回稳定目标', async () => {
  const repository = new CraftingDataRepository({ builtinRoot })
  await repository.initialize()
  const exarch = repository.searchEldritchImplicitSuggestions({ source: 'exarch', tier: 3, query: '', limit: 100 })
  const eater = repository.searchEldritchImplicitSuggestions({ source: 'eater', tier: 3, query: '', limit: 100 })
  assert.ok(exarch.total > 0 && eater.total > 0)
  assert.ok(exarch.items.every((item) => item.source === 'exarch' && item.tier === 3 && item.familyId && item.effectPattern && item.applicableLabel))
  assert.ok(eater.items.every((item) => item.source === 'eater' && item.tier === 3))
  assert.equal(exarch.items.some((left) => eater.items.some((right) => left.familyId === right.familyId)), false)
})

test('界面、IPC、设置和脚本接入古灵自动制作与安全外链', () => {
  const items = source('../src/domains/items/ItemsView.vue')
  const moduleOne = source('../src/domains/items/components/ModuleOne.vue')
  const moduleEldritch = source('../src/domains/items/components/ModuleEldritch.vue')
  const settings = source('../src/domains/settings/settingsStore.js')
  const generator = source('../src/utils/python.js')
  const template = source('../src/assets/scripts/crafting_template.py')
  const preload = source('../electron/preload.cjs')
  const rendererApi = source('../src/api/electron.js')
  const ipc = source('../electron/modules/ipc/crafting.js')
  const fileIpc = source('../electron/modules/ipc/file.js')

  assert.match(items, /ModuleEldritch/)
  assert.match(moduleEldritch, /multiple[\s\S]*remote[\s\S]*searchEldritchImplicitSuggestions/)
  assert.match(moduleOne, /href="https:\/\/poedb\.tw\/cn\/Modifiers"/)
  assert.match(moduleOne, /target="_blank"/)
  assert.match(moduleOne, /rel="noopener noreferrer"/)
  for (const key of [
    'lesser-eldritch-ember', 'greater-eldritch-ember', 'grand-eldritch-ember', 'exceptional-eldritch-ember',
    'lesser-eldritch-ichor', 'greater-eldritch-ichor', 'grand-eldritch-ichor', 'exceptional-eldritch-ichor'
  ]) assert.match(settings, new RegExp(key))
  assert.match(generator, /generateEldritchCraftingLogic/)
  assert.match(generator, /eldritchImplicitMatch/)
  assert.match(template, /ENABLE_ELDRITCH/)
  assert.match(template, /ELDRITCH_CRAFTING_FUNC/)
  assert.match(preload, /searchCraftingEldritchImplicitSuggestions/)
  assert.match(rendererApi, /searchEldritchImplicitSuggestions/)
  assert.match(ipc, /crafting-search-eldritch-implicit-suggestions/)
  assert.match(fileIpc, /getMainWindow/)
  assert.match(fileIpc, /mainWindow\.webContents\.send\('update-overlay'/)
  assert.match(fileIpc, /naturalBaseImplicitTexts/)
})

test('生成的古灵流程初始命中与非法底材零消耗，重骰命中只使用一次通货', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript } = await server.ssrLoadModule('/src/utils/python.js')
    const config = {
      globalShortcuts: { end: 'Alt+3' },
      currencyPositions: { 'grand-eldritch-ember': { x: 10, y: 20 } },
      operationDelayMs: 50,
      adaptiveTiming: true,
      fixedTiming: {},
      itemPosition: { x: 30, y: 40 },
      preset: {
        checkInitialItem: true,
        moduleTwo: { enabled: false },
        moduleThree: { enabled: false },
        moduleEldritch: {
          enabled: true,
          source: 'exarch',
          tier: 3,
          targets: [{ familyId: 'exarch:a', displayName: '目标', effectPattern: '攻击速度加快 #%'}]
        }
      },
      filePaths: { itemInfoFile: 'item.txt', itemInfoResultFile: 'result.json' },
      stashTabSelection: { enabled: false }
    }
    const script = generatePythonScript(config)
    assert.equal(script.includes('{{'), false)
    assert.match(script, /eldritch_enabled = True[\s\S]*prepare_item_for_crafting\(identify_unidentified=not eldritch_enabled\)/)
    const start = script.indexOf('def fail_eldritch_crafting(')
    const end = script.indexOf('def craft_sockets(', start)
    assert.ok(start >= 0 && end > start)
    const block = script.slice(start, end)
    const harness = `
import json, os, time
${block}
item_position = {"x": 1, "y": 2}
item_info_result_file = os.devnull
def move_mouse(x, y): return True
def read_clipboard_to_file(allow_unchanged_text=False): return True
def release_all_keys(): pass
def play_error_sound(): pass

def run(results):
    global is_running, fatal_error_reason, result_queue, apply_count
    is_running = True
    fatal_error_reason = None
    result_queue = list(results)
    apply_count = 0
    def wait(): return result_queue.pop(0)
    def apply(currency):
        global apply_count
        apply_count += 1
        return currency == "grand-eldritch-ember"
    globals()["wait_for_parse_result"] = wait
    globals()["apply_currency"] = apply
    initial_result = result_queue.pop(0)
    success = craft_eldritch_implicits(initial_result)
    return {"success": bool(success), "applyCount": apply_count, "fatal": fatal_error_reason}

valid = {"category":"头部", "isLegendary":False, "isCorrupted":False, "influences":[]}
print(json.dumps({
  "initial": run([{**valid, "eldritchImplicitMatch":True, "matchedEldritchTargetName":"目标"}]),
  "invalid": run([{"category":"戒指", "isLegendary":False, "isCorrupted":False, "influences":[]}]),
  "rolled": run([{**valid, "eldritchImplicitMatch":False}, {**valid, "eldritchImplicitMatch":True, "matchedEldritchTargetName":"目标"}])
}, ensure_ascii=False))
`
    const executed = spawnSync(pythonPath, ['-c', harness], {
      encoding: 'utf8',
      env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
    })
    assert.equal(executed.status, 0, executed.stderr)
    const result = JSON.parse(executed.stdout.trim().split(/\r?\n/).at(-1))
    assert.deepEqual(result.initial, { success: true, applyCount: 0, fatal: null })
    assert.equal(result.invalid.success, false)
    assert.equal(result.invalid.applyCount, 0)
    assert.match(result.invalid.fatal, /只能用于头盔/)
    assert.deepEqual(result.rolled, { success: true, applyCount: 1, fatal: null })

    const unprotectedScript = generatePythonScript({
      ...config,
      preset: { ...config.preset, checkInitialItem: false }
    })
    const unprotectedStart = unprotectedScript.indexOf('def fail_eldritch_crafting(')
    const unprotectedEnd = unprotectedScript.indexOf('def craft_sockets(', unprotectedStart)
    const unprotected = spawnSync(pythonPath, ['-c', `
import json, os, time
${unprotectedScript.slice(unprotectedStart, unprotectedEnd)}
is_running = True
fatal_error_reason = None
item_info_result_file = os.devnull
apply_count = 0
def release_all_keys(): pass
def play_error_sound(): pass
def apply_currency(currency):
    global apply_count
    apply_count += 1
    return True
def read_clipboard_to_file(allow_unchanged_text=False): return True
def wait_for_parse_result():
    return {"category":"头部", "isLegendary":False, "isCorrupted":False, "influences":[], "eldritchImplicitMatch":True}
time.sleep = lambda _seconds: None
initial = {"category":"头部", "isLegendary":False, "isCorrupted":False, "influences":[], "eldritchImplicitMatch":True}
success = craft_eldritch_implicits(initial)
print(json.dumps({"success": bool(success), "applyCount": apply_count}, ensure_ascii=False))
`], {
      encoding: 'utf8',
      env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
    })
    assert.equal(unprotected.status, 0, unprotected.stderr)
    assert.deepEqual(JSON.parse(unprotected.stdout.trim().split(/\r?\n/).at(-1)), { success: true, applyCount: 1 })
  } finally {
    await server.close()
  }
})
