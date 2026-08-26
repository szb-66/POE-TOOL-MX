import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { watch } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { CRAFTING_CURRENCY_CATALOG, normalizeCurrencyUsage } from '../shared/craftingCurrencyCatalog.js'
import { CraftingCurrencyUsageLedger } from '../electron/modules/python/currencyUsageLedger.js'
import { pythonPath } from './helpers/python.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(dirname, '..')
const source = relativePath => readFile(path.join(projectRoot, relativePath), 'utf8')

function block(text, start, end) {
  const from = text.indexOf(start)
  const to = text.indexOf(end, from)
  assert.ok(from >= 0 && to > from, `找不到代码块: ${start} -> ${end}`)
  return text.slice(from, to)
}

function currencyNames(template) {
  const namesBlock = block(template, 'CURRENCY_NAMES = {', '}\n\n')
  return [...namesBlock.matchAll(/^\s*"([^"]+)":/gm)].map(match => match[1])
}

function runApplyCurrency(template, mode, failureStage = null) {
  const definitions = mode === 'items'
    ? `${block(template, 'CURRENCY_NAMES = {', 'def copied_item_header(')}\n${block(template, 'def apply_currency(', 'def move_mouse(')}`
    : `${block(template, 'CURRENCY_NAMES = {', 'def copied_item_header(')}\n${block(template, 'def apply_currency(', 'def send_copy_command(')}`
  const call = mode === 'items' ? 'apply_currency("alteration")' : 'apply_currency("alteration", 30, 40)'
  const script = `
import json
${definitions}
item_position = {"x": 30, "y": 40}
def release_shift_if_held(): pass
def right_click_currency(currency): return ${failureStage === 'right' ? 'False' : 'True'}
def move_mouse(x, y): return ${failureStage === 'move' ? 'False' : 'True'}
def click_mouse(button): return ${failureStage === 'click' ? 'False' : 'True'}
result = ${call}
print("RESULT " + json.dumps({"result": result}))
`
  const result = spawnSync(pythonPath, ['-c', script], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
  })
  assert.equal(result.status, 0, result.stderr)
  const lines = result.stdout.trim().split(/\r?\n/)
  return {
    result: JSON.parse(lines.find(line => line.startsWith('RESULT ')).slice(7)).result,
    events: lines.filter(line => line.startsWith('EVENT ')).map(line => JSON.parse(line.slice(6)))
  }
}

test('固定目录覆盖物品和地图模板的全部通货且图标完整', async () => {
  const [itemTemplate, mapTemplate, iconModule] = await Promise.all([
    source('src/assets/scripts/crafting_template.py'),
    source('src/assets/scripts/map_rolling_template.py'),
    source('src/domains/overlay/craftingCurrencyIcons.js')
  ])
  const catalogKeys = CRAFTING_CURRENCY_CATALOG.map(currency => currency.key)
  assert.deepEqual(new Set(currencyNames(itemTemplate)), new Set(catalogKeys))
  assert.ok(currencyNames(mapTemplate).every(key => catalogKeys.includes(key)))
  assert.equal(new Set(catalogKeys).size, catalogKeys.length)
  assert.equal(new Set(CRAFTING_CURRENCY_CATALOG.map(currency => currency.name)).size, catalogKeys.length)

  for (const currency of CRAFTING_CURRENCY_CATALOG) {
    const icon = await readFile(path.join(projectRoot, 'src', 'assets', 'images', 'crafting-currency', currency.iconFile))
    assert.deepEqual([...icon.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
    assert.match(iconModule, new RegExp(`['"]?${currency.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]?`))
  }
})

for (const [label, file, mode] of [
  ['物品', 'src/assets/scripts/crafting_template.py', 'items'],
  ['地图/海图', 'src/assets/scripts/map_rolling_template.py', 'map']
]) {
  test(`${label}只在目标点击成功后记一次通货`, async () => {
    const template = await source(file)
    for (const stage of ['right', 'move', 'click']) {
      const failed = runApplyCurrency(template, mode, stage)
      assert.equal(failed.result, false)
      assert.deepEqual(failed.events, [])
    }
    const succeeded = runApplyCurrency(template, mode)
    assert.equal(succeeded.result, true)
    assert.deepEqual(succeeded.events, [{
      event: 'crafting-currency-used', mode, currency: 'alteration', amount: 1
    }])
  })
}

test('孔连颜色在左键成功后计数，点击后解析失败与三次补读不会重计', async () => {
  const generator = await source('src/utils/python.js')
  for (const [functionName, currency] of [
    ['craft_socket_count', 'jewellers'],
    ['craft_links', 'fusing'],
    ['craft_colors', 'chromic']
  ]) {
    const start = generator.indexOf(`def ${functionName}(`)
    const end = functionName === 'craft_socket_count'
      ? generator.indexOf('def craft_links(', start)
      : functionName === 'craft_links'
        ? generator.indexOf('def craft_colors(', start)
        : generator.indexOf('\n`', start)
    assert.ok(start >= 0 && end > start)
    const body = generator.slice(start, end)
    assert.match(body, new RegExp(`if not left_click_item\\(\\):[\\s\\S]*record_currency_usage\\("${currency}"\\)[\\s\\S]*read_current_item`))
    assert.equal((body.match(/record_currency_usage\(/g) || []).length, 1)
  }
  const itemTemplate = await source('src/assets/scripts/crafting_template.py')
  const readBlock = block(itemTemplate, 'def read_current_item(', 'def prepare_item_for_crafting(')
  assert.doesNotMatch(readBlock, /record_currency_usage/)
  assert.match(block(itemTemplate, 'def apply_currency(', 'def move_mouse('), /record_currency_usage\(currency_type\)[\s\S]*return True/)
})

test('主进程账本校验事件并按逻辑会话续算或清零', () => {
  let nextId = 0
  const ledger = new CraftingCurrencyUsageLedger({ createId: () => `generated-${++nextId}` })
  assert.deepEqual(ledger.begin({ mode: 'items', usageSessionId: 'items-1' }), {
    usageSessionId: 'items-1', currencyUsage: {}
  })
  assert.deepEqual(ledger.record({ event: 'crafting-currency-used', mode: 'items', currency: 'chaos', amount: 1 }, {
    usageSessionId: 'items-1', mode: 'items'
  }).currencyUsage, { chaos: 1 })
  assert.equal(ledger.record({ event: 'crafting-currency-used', mode: 'items', currency: 'unknown', amount: 1 }, {
    usageSessionId: 'items-1', mode: 'items'
  }), null)
  assert.equal(ledger.record({ event: 'crafting-currency-used', mode: 'items', currency: 'chaos', amount: 2 }, {
    usageSessionId: 'items-1', mode: 'items'
  }), null)
  assert.equal(ledger.record({ event: 'crafting-currency-used', mode: 'items', currency: 'chaos', amount: 1 }, {
    usageSessionId: 'other-process', mode: 'items'
  }), null)

  assert.deepEqual(ledger.begin({ mode: 'items', usageSessionId: 'items-1', continueCurrencyUsage: true }).currencyUsage, { chaos: 1 })
  assert.deepEqual(ledger.begin({ mode: 'items', usageSessionId: 'items-2' }), {
    usageSessionId: 'items-2', currencyUsage: {}
  })
  assert.deepEqual(ledger.begin({ mode: 'map', usageSessionId: 'items-2', continueCurrencyUsage: true }), {
    usageSessionId: 'generated-1', currencyUsage: {}
  })
  assert.deepEqual(normalizeCurrencyUsage({ chaos: 3, unknown: 9, vaal: -1, wisdom: 1.5 }), { chaos: 3 })
})

test('浮窗实时与终态快照都携带账本，旧跳数通道已移除', async () => {
  const [ipc, view, content, generator, fileIpc, itemView, restart] = await Promise.all([
    source('electron/modules/ipc/python.js'),
    source('src/domains/overlay/OverlayView.vue'),
    source('src/domains/overlay/components/OverlayContent.vue'),
    source('src/utils/python.js'),
    source('electron/modules/ipc/file.js'),
    source('src/domains/items/ItemsView.vue'),
    source('src/utils/craftingRestart.js')
  ])
  assert.match(ipc, /crafting-currency-used[\s\S]*send\('update-overlay', updatedUsage\)/)
  assert.ok((ipc.match(/\.\.\.currencyUsageLedger\.snapshot\(\)/g) || []).length >= 4)
  assert.match(view, /applyCurrencyUsageSnapshot\(data\)/)
  assert.match(view, /usageSessionId: usageSessionId\.value/)
  assert.match(restart, /usageSessionId, continueCurrencyUsage: true/)
  assert.match(content, />本次消耗</)
  assert.match(content, /本次未消耗通货/)
  assert.match(content, /aria-label="`\$\{entry\.name\} \$\{entry\.amount\} 次`"/)
  for (const text of [view, content, generator, fileIpc, itemView]) {
    assert.doesNotMatch(text, /已循环次数|scriptIteration|iteration-fixed|currentIteration|existingData\.iteration/)
  }
  assert.doesNotMatch(view, /\[进度\][\s\S]*match/)
  assert.doesNotMatch(generator, /current_result\[['"]iteration['"]\]/)
})

test('旧 iteration 快速覆盖回放只能观察到最终快照', async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'poe-iteration-replay-'))
  const resultFile = path.join(tempRoot, 'result.json')
  await writeFile(resultFile, '{}', 'utf8')
  const observed = []
  let lastContent = ''
  const timers = new Set()
  const watcher = watch(resultFile, { persistent: false }, () => {
    const timer = setTimeout(async () => {
      timers.delete(timer)
      const content = await readFile(resultFile, 'utf8')
      if (content === lastContent) return
      lastContent = content
      observed.push(JSON.parse(content).iteration)
    }, 20)
    timers.add(timer)
  })
  try {
    for (let iteration = 1; iteration <= 20; iteration += 1) {
      await writeFile(resultFile, JSON.stringify({ iteration }), 'utf8')
    }
    await new Promise(resolve => setTimeout(resolve, 120))
    assert.deepEqual(observed, [20])
  } finally {
    watcher.close()
    for (const timer of timers) clearTimeout(timer)
    await rm(tempRoot, { recursive: true, force: true })
  }
})
