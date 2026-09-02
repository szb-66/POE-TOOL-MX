import test from 'node:test'
import assert from 'node:assert/strict'
import { hasMinimumHanFragment, shortestSafeExpression } from '../src/domains/regex/compactExpression.js'

test('安全短语优先选择原文最靠前的双字片段且禁止单字', () => {
  const expression = shortestSafeExpression({
    source: '甲乙丙丁', positives: ['甲乙丙丁'], negatives: ['丙丁其他'], fallbackExpression: '甲乙丙丁'
  })
  assert.equal(expression, '甲乙')
  assert.equal(hasMinimumHanFragment(expression), true)
  assert.equal(hasMinimumHanFragment('甲'), false)
})

test('包含关系使用安全行边界而不返回会误命中的完整子串', () => {
  const expression = shortestSafeExpression({
    source: '造成点燃', positives: ['造成点燃'], negatives: ['怪物造成点燃'], fallbackExpression: '造成点燃'
  })
  assert.equal(expression, '^造成')
})

test('多变体没有共同唯一连续片段时使用有序双片段', () => {
  const expression = shortestSafeExpression({
    source: '甲乙一丙丁',
    positives: ['甲乙一丙丁', '甲乙二丙丁'],
    negatives: ['甲乙其他', '其他丙丁'],
    fallbackExpression: '这是一个很长的完整表达式'
  })
  assert.equal(expression, '甲乙.*丙丁')
})

test('没有合法双字或双片段时回退经过验证的完整表达式', () => {
  const expression = shortestSafeExpression({
    source: '物品类别: 爪',
    positives: ['物品类别: 爪'],
    negatives: ['物品类别: 弓', '物品类别: 盾'],
    fallbackExpression: '物品类别: 爪'
  })
  assert.equal(expression, '物品类别: 爪')
})
