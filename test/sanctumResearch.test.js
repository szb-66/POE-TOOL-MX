import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseSanctumResearch } from '../electron/modules/sanctum/research.js'

const text = readFileSync(new URL('./fixtures/sanctum/research.txt', import.meta.url), 'utf8')
test('国服研究文本保留数值、未解析效果和独立身份', () => {
  const result = parseSanctumResearch(text)
  assert.equal(result.status, 'parsed')
  assert.equal(result.name, '禁域宝库研究')
  assert.equal(result.areaLevel, 69)
  assert.deepEqual(result.resolve, { current: 300, maximum: 300 })
  assert.equal(result.coins, 150)
  assert.equal(result.inspiration, 0)
  assert.deepEqual(result.effects.map(item => item.rawText), ['金币磁铁', '金色烟雾', '巫毒人偶', '诅咒棱镜'])
  assert.ok(result.effects.every(item => item.status === 'unknown'))
  assert.equal(result.modifiers.length, 1)
  assert.equal(result.modifiers[0].source, 'research')
  assert.equal(result.modifiers[0].rawText, '宝箱有 4(3-4)% 的几率掉落双倍耀金币')
  assert.equal(result.runId, null)
  assert.equal(result.bindingStatus, 'unconfirmed')
})
test('重复、损坏和缺失状态不被当成零或有效值', () => {
  const result = parseSanctumResearch(text.replace('坚毅：300/300', '坚毅：400/300').replace('启迪：0', '启迪：?') + '\n耀金币：200')
  assert.equal(result.status, 'partial')
  assert.equal(result.coins, null)
  assert.equal(result.resolve, null)
  assert.equal(result.inspiration, null)
  assert.equal(parseSanctumResearch('物品类别: 圣物').status, 'unknown')
})
