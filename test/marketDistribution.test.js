import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { verifyMarketRuntime } from '../scripts/runtime/marketDistribution.js'
import { marketRuntimeFixture, successfulMarketRun } from './fixtures/marketRuntime.js'

test('市集分发检查拒绝缺件、篡改、未实测版本与错误自检协议', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'poe-market-dist-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  assert.throws(() => verifyMarketRuntime(root), /分发不完整/)
  const { runtime } = marketRuntimeFixture(root)
  assert.equal(verifyMarketRuntime(root, { run: successfulMarketRun }).ready, true)
  fs.writeFileSync(path.join(runtime, 'MarketLocalizationHook.dll'), 'tampered')
  assert.throws(() => verifyMarketRuntime(root, { run: successfulMarketRun }), /指纹不一致/)
  fs.writeFileSync(path.join(runtime, 'MarketLocalizationHook.dll'), '')
  assert.throws(() => verifyMarketRuntime(root, { run: () => ({ status: 1 }) }), /原生自检失败/)
  assert.throws(() => verifyMarketRuntime(root, { run: (file, args, options) => args[0] === '--market-host' ? { status: 0, stdout: '{}' } : successfulMarketRun(file, args, options) }), /控制进程自检失败/)
  assert.throws(() => verifyMarketRuntime(root, { run: (file, args, options) => {
    const result = successfulMarketRun(file, args, options)
    if (args[0] === '--market-host') { const message = JSON.parse(result.stdout); delete message.data.pipeSecurityCases; result.stdout = JSON.stringify(message) }
    return result
  } }), /控制进程自检失败/)
  assert.throws(() => verifyMarketRuntime(root, { run: (file, args, options) => {
    const result = successfulMarketRun(file, args, options)
    if (args[0] === '--market-host') { const message = JSON.parse(result.stdout); delete message.data.validatedRules; result.stdout = JSON.stringify(message) }
    return result
  } }), /控制进程自检失败/)
  const metadata = JSON.parse(fs.readFileSync(path.join(runtime, 'market-dependencies.json'), 'utf8'))
  assert.throws(() => verifyMarketRuntime(root, { run: (file, args, options) => {
    const result = successfulMarketRun(file, args, options)
    if (args[0] === '--market-host') { const message = JSON.parse(result.stdout); delete message.data.resumeCases; result.stdout = JSON.stringify(message) }
    return result
  } }), /控制进程自检失败/)
  metadata.minhookCommit = 'unknown'
  fs.writeFileSync(path.join(runtime, 'market-dependencies.json'), JSON.stringify(metadata))
  assert.throws(() => verifyMarketRuntime(root, { run: successfulMarketRun }), /指纹不一致/)
})
