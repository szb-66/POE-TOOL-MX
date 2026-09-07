import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createServer } from 'vite'
import { pythonPath } from './helpers/python.js'

const catalogCondition = (id, requiredLevel, minTier = 1) => ({
  id,
  kind: 'catalog',
  keyword: id,
  displayName: id,
  effectPattern: `${id} #`,
  minTier,
  tiers: [{ tier: 1, name: 'T1', requiredLevel, text: `${id} 1` }]
})

function config(craftingKind = 'general') {
  return {
    globalShortcuts: { end: 'F12' },
    currencyPositions: {},
    operationDelayMs: 100,
    itemPosition: { x: 100, y: 200 },
    actionPosition: { x: 300, y: 400 },
    craftingKind,
    preset: {
      checkInitialItem: true,
      moduleTwo: {
        enabled: true,
        mode: 'alteration',
        affixGroups: [
          { id: 'valuable', name: '值钱', enabled: true, requiredAffixes: [catalogCondition('生命', 84)], selectedAffixes: [], selectedCount: 1 },
          { id: 'second', name: '组合 2', enabled: true, requiredAffixes: [catalogCondition('速度', 82), '未知关键词'], selectedAffixes: [], selectedCount: 1 },
          { id: 'disabled', name: '停用', enabled: false, requiredAffixes: [catalogCondition('停用高阶', 100)], selectedAffixes: [], selectedCount: 1 },
          { id: 'unknown', name: '仅未知', enabled: true, requiredAffixes: ['自由关键词'], selectedAffixes: [], selectedCount: 1 }
        ]
      },
      moduleThree: { enabled: false },
      moduleEldritch: { enabled: false }
    },
    batchConfig: {
      enabled: true,
      targets: [{ id: 'one', x: 1, y: 2, position: { x: 100, y: 200 } }]
    },
    filePaths: {}
  }
}

test('普通制作停用词缀后不受旧组合物等限制，重新启用和专用制作仍拦截', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript } = await server.ssrLoadModule('/src/utils/python.js')
    for (const batchEnabled of [false, true]) {
      for (const module of ['moduleThree', 'moduleEldritch']) {
        const input = config()
        input.batchConfig.enabled = batchEnabled
        input.preset.moduleTwo.enabled = false
        input.preset[module].enabled = true
        for (const kind of ['general', 'essence', 'harvest']) {
          input.craftingKind = kind
          for (const enabled of [false, true]) {
            input.preset.moduleTwo.enabled = enabled
            const generated = generatePythonScript(input)
            const helperStart = generated.indexOf('def affix_item_level_issue(')
            const helperEnd = generated.indexOf('def batch_category_matches(', helperStart)
            const script = `import json
${generated.match(/^batch_config = .*$/m)[0]}
${generated.match(/^affix_item_level_requirements = .*$/m)[0]}
${generated.slice(helperStart, helperEnd)}
print(json.dumps(affix_item_level_issue({"level": 75})))`
            const result = spawnSync(pythonPath, ['-c', script], {
              encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' }
            })
            assert.equal(result.status, 0, result.stderr)
            const issue = JSON.parse(result.stdout.trim())
            const context = `${kind}/${module}/batch=${batchEnabled}/affix=${enabled}`
            if (kind === 'general' && !enabled) assert.equal(issue, null, context)
            else assert.match(issue, /物品等级 75 不足/, context)
          }
        }
      }
    }
  } finally { await server.close() }
})

test('词缀物等要求嵌入所有制作脚本并位于制作操作之前', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript } = await server.ssrLoadModule('/src/utils/python.js')
    for (const kind of ['general', 'essence', 'harvest']) {
      const generated = generatePythonScript(config(kind))
      assert.match(generated, /AFFIX_ITEM_LEVEL_INSUFFICIENT/)
      assert.match(generated, /值钱/)
      assert.match(generated, /组合 2/)
      assert.doesNotMatch(generated, /停用高阶|仅未知/)

      const prepareStart = generated.indexOf('def prepare_item_for_crafting(')
      const prepareGuard = generated.indexOf('validate_affix_item_level(result)', prepareStart)
      const identify = generated.indexOf('apply_currency("wisdom")', prepareStart)
      assert.ok(prepareGuard > prepareStart && identify > prepareGuard, `${kind} 应在鉴定前校验物等`)
    }

    const generated = generatePythonScript(config('general'))
    const batchStart = generated.indexOf('def preflight_batch_targets():')
    const batchGuard = generated.indexOf('validate_affix_item_level(_result, prefix)', batchStart)
    const batchSuccess = generated.indexOf('crafting-batch-preflight-item-succeeded', batchStart)
    const currencyPreflight = generated.indexOf('if not preflight_required_currencies():')
    assert.ok(batchGuard > batchStart && batchSuccess > batchGuard)
    assert.ok(currencyPreflight > generated.indexOf('if not preflight_batch_targets():'))
  } finally {
    await server.close()
  }
})

test('物等不足报告全部失败组合，边界物等正常通过且不产生制作操作', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript } = await server.ssrLoadModule('/src/utils/python.js')
    const generated = generatePythonScript(config())
    const batchConfig = generated.match(/^batch_config = .*$/m)?.[0]
    const requirements = generated.match(/^affix_item_level_requirements = .*$/m)?.[0]
    const helperStart = generated.indexOf('def affix_item_level_issue(')
    const helperEnd = generated.indexOf('def batch_category_matches(', helperStart)
    assert.ok(batchConfig && requirements && helperStart >= 0 && helperEnd > helperStart)
    const helpers = generated.slice(helperStart, helperEnd)
    const script = `
import json
${batchConfig}
${requirements}
failures = []
operations = []
def fail_item_runtime(reason, code):
    failures.append({"reason": reason, "code": code})
    return False
${helpers}
low = validate_affix_item_level({"level": 75})
boundary = validate_affix_item_level({"level": 84})
middle_issue = affix_item_level_issue({"level": 82})
unknown_level = validate_affix_item_level({})
print(json.dumps({"low": low, "boundary": boundary, "middleIssue": middle_issue, "unknownLevel": unknown_level, "failures": failures, "operations": operations}, ensure_ascii=False))
`
    const result = spawnSync(pythonPath, ['-c', script], {
      encoding: 'utf8',
      env: { ...process.env, PYTHONUTF8: '1' }
    })
    assert.equal(result.status, 0, result.stderr)
    const output = JSON.parse(result.stdout.trim())
    assert.equal(output.low, false)
    assert.equal(output.boundary, true)
    assert.equal(output.unknownLevel, true)
    assert.match(output.failures[0].reason, /物品等级 75 不足：值钱 需要 84、组合 2 需要 82，已停止制作/)
    assert.match(output.middleIssue, /值钱 需要 84/)
    assert.doesNotMatch(output.middleIssue, /组合 2 需要 82/)
    assert.equal(output.failures[0].code, 'AFFIX_ITEM_LEVEL_INSUFFICIENT')
    assert.deepEqual(output.operations, [])
  } finally {
    await server.close()
  }
})
