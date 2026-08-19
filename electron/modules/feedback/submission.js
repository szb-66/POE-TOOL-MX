import { FeedbackValidationError } from './validation.js'

export async function submitFeedbackWithDiagnostics({
  feedback,
  input,
  buildDiagnostics,
  diagnostics,
  onProgress = () => {},
  logger = console
}) {
  let validatedCaptureId = null
  const result = await feedback.submit(input, {
    buildDiagnostics: async captureId => {
      if (captureId) {
        validatedCaptureId = captureId
        const capture = await diagnostics?.resolveCapture?.(captureId)
        if (!capture) {
          throw new FeedbackValidationError('FEEDBACK_DIAGNOSTIC_CAPTURE_NOT_FOUND', '诊断会话不存在或已失效，请重新开始诊断')
        }
      }
      return buildDiagnostics?.(captureId ? { captureId } : {})
    },
    onProgress
  })
  if (result?.success && validatedCaptureId) {
    const cleanup = await diagnostics?.cancelCapture?.({ captureId: validatedCaptureId })
    if (!cleanup?.success) {
      logger.warn?.('feedback diagnostic capture cleanup failed', {
        reasonCode: cleanup?.errorCode || 'DIAGNOSTIC_CAPTURE_CLEANUP_FAILED'
      })
    }
  }
  return result
}
