import test from 'node:test'
import assert from 'node:assert/strict'
import { submitFeedbackWithDiagnostics } from '../electron/modules/feedback/submission.js'

const captureId = 'abcdefab-cdef-4abc-8def-abcdefabcdef'

test('存在的会话用于构建快照且只在反馈成功后清理', async () => {
  const calls = []
  const result = await submitFeedbackWithDiagnostics({
    input: { includeDiagnostics: true, diagnosticCaptureId: captureId },
    feedback: {
      submit: async (_input, options) => {
        await options.buildDiagnostics(captureId)
        return { success: true, feedbackId: 'FB-1' }
      }
    },
    diagnostics: {
      resolveCapture: async value => ({ captureId: value, status: 'completed' }),
      cancelCapture: async input => { calls.push(['cancel', input]); return { success: true } }
    },
    buildDiagnostics: async payload => { calls.push(['build', payload]); return { schemaVersion: 3 } }
  })
  assert.equal(result.success, true)
  assert.deepEqual(calls, [
    ['build', { captureId }],
    ['cancel', { captureId }]
  ])
})

test('不存在的会话被拒绝且不会退化为普通快照', async () => {
  let built = false
  await assert.rejects(
    () => submitFeedbackWithDiagnostics({
      input: { includeDiagnostics: true, diagnosticCaptureId: captureId },
      feedback: { submit: async (_input, options) => options.buildDiagnostics(captureId) },
      diagnostics: { resolveCapture: async () => null },
      buildDiagnostics: async () => { built = true }
    }),
    error => error.code === 'FEEDBACK_DIAGNOSTIC_CAPTURE_NOT_FOUND'
  )
  assert.equal(built, false)
})

test('反馈失败保留诊断会话供重试', async () => {
  let canceled = false
  const result = await submitFeedbackWithDiagnostics({
    input: { includeDiagnostics: true, diagnosticCaptureId: captureId },
    feedback: { submit: async () => ({ success: false, errorCode: 'SAVE_FAILED' }) },
    diagnostics: { cancelCapture: async () => { canceled = true; return { success: true } } },
    buildDiagnostics: async () => ({ schemaVersion: 3 })
  })
  assert.equal(result.success, false)
  assert.equal(canceled, false)
})

test('反馈成功不因会话清理失败而丢失成功结果', async () => {
  const warnings = []
  const result = await submitFeedbackWithDiagnostics({
    input: { includeDiagnostics: true, diagnosticCaptureId: captureId },
    feedback: {
      submit: async (_input, options) => {
        await options.buildDiagnostics(captureId)
        return { success: true, feedbackId: 'FB-2' }
      }
    },
    diagnostics: {
      resolveCapture: async value => ({ captureId: value, status: 'completed' }),
      cancelCapture: async () => ({ success: false, errorCode: 'STORE_BUSY' })
    },
    buildDiagnostics: async () => ({ schemaVersion: 3 }),
    logger: { warn: (...args) => warnings.push(args) }
  })
  assert.equal(result.feedbackId, 'FB-2')
  assert.deepEqual(warnings[0][1], { reasonCode: 'STORE_BUSY' })
})

test('反馈成功后使用校验层规范化的会话标识清理', async () => {
  const upperCaptureId = captureId.toUpperCase()
  const cleaned = []
  const result = await submitFeedbackWithDiagnostics({
    input: { includeDiagnostics: true, diagnosticCaptureId: upperCaptureId },
    feedback: {
      submit: async (_input, options) => {
        await options.buildDiagnostics(captureId)
        return { success: true, feedbackId: 'FB-3' }
      }
    },
    diagnostics: {
      resolveCapture: async value => ({ captureId: value, status: 'completed' }),
      cancelCapture: async input => { cleaned.push(input); return { success: true } }
    },
    buildDiagnostics: async () => ({ schemaVersion: 3 })
  })

  assert.equal(result.success, true)
  assert.deepEqual(cleaned, [{ captureId }])
})
