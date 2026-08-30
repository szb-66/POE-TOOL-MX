import test from 'node:test'
import assert from 'node:assert/strict'
import {
  borderRecognitionResult,
  fragmentRecognitionResult,
  recognitionFailureResult,
  sanitizeRecognitionFeedbackReason
} from '../electron/modules/puzzle/recognitionFeedback.js'

test('碎片识别结果按完整、未揭示、未知和跳过统计分级', () => {
  assert.deepEqual(
    fragmentRecognitionResult({ attempted: 5, matched: 5, unveiled: 0, unknown: 0, skipped: false }, 5),
    { status: 'success', message: '碎片识别完成，共 5 个' }
  )
  assert.deepEqual(
    fragmentRecognitionResult({ attempted: 5, matched: 3, unveiled: 1, unknown: 1, skipped: false }, 5),
    { status: 'partial', message: '已识别 4/5 个词缀，词缀未知 1 个' }
  )
  assert.equal(fragmentRecognitionResult({ attempted: 5, matched: 5, skipped: true }, 5).status, 'partial')
})

test('边缘识别以 attempted 和 matched 判定完整或部分成功', () => {
  assert.deepEqual(
    borderRecognitionResult({ attempted: 12, matched: 12, unknown: 0, skipped: false }),
    { status: 'success', message: '边缘词缀识别完成，共 12 段' }
  )
  assert.deepEqual(
    borderRecognitionResult({ attempted: 12, matched: 9, unknown: 3, skipped: false }),
    { status: 'partial', message: '已识别 9/12 段，未知 3 段' }
  )
})

test('失败原因单行脱敏截断，紧急停止使用独立中性文案', () => {
  const sanitized = sanitizeRecognitionFeedbackReason(`读取失败\nC:\\Users\\Example\\secret.txt ${'x'.repeat(120)}`)
  assert.doesNotMatch(sanitized, /Users|secret\.txt|\n/)
  assert.ok(sanitized.length <= 80)
  assert.deepEqual(
    recognitionFailureResult({ code: 'EMERGENCY_STOPPED', message: 'ignored' }),
    { status: 'stopped', message: '本次识别已停止，未完成结果未保存' }
  )
  assert.equal(recognitionFailureResult({ code: 'PROCESS_EXITED', message: '子进程退出' }).status, 'failure')
})
