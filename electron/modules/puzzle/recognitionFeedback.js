const MAX_REASON_LENGTH = 80

export function sanitizeRecognitionFeedbackReason(value, fallback = '识别未成功完成') {
  const singleLine = String(value || fallback)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[A-Za-z]:\\[^\r\n]*/g, '本地文件')
    .replace(/\s{2,}/g, ' ')
    .trim()
  if (!singleLine) return fallback
  return singleLine.length > MAX_REASON_LENGTH ? `${singleLine.slice(0, MAX_REASON_LENGTH - 1)}…` : singleLine
}

export function recognitionFailureResult(error, canceled = false) {
  if (canceled || error?.code === 'EMERGENCY_STOPPED') {
    return { status: 'stopped', message: '本次识别已停止，未完成结果未保存' }
  }
  return {
    status: 'failure',
    message: sanitizeRecognitionFeedbackReason(error?.message || error)
  }
}

export function fragmentRecognitionResult(stats = {}, occupiedTotal = 0) {
  const matched = Math.max(0, Number(stats.matched || 0))
  const unveiled = Math.max(0, Number(stats.unveiled || 0))
  const unknown = Math.max(0, Number(stats.unknown || 0))
  const total = Math.max(Number(occupiedTotal || 0), Number(stats.attempted || 0), matched + unveiled + unknown)
  const recognized = matched + unveiled
  const partial = Boolean(stats.skipped) || unveiled > 0 || unknown > 0 || recognized < total
  return partial
    ? { status: 'partial', message: `已识别 ${recognized}/${total} 个词缀，词缀未知 ${unknown} 个` }
    : { status: 'success', message: `碎片识别完成，共 ${total} 个` }
}

export function borderRecognitionResult(stats = {}) {
  const matched = Math.max(0, Number(stats.matched || 0))
  const attempted = Math.max(0, Number(stats.attempted || 0))
  const unknown = Math.max(Number(stats.unknown || 0), attempted - matched)
  const partial = Boolean(stats.skipped) || matched < attempted
  return partial
    ? { status: 'partial', message: `已识别 ${matched}/${attempted} 段，未知 ${unknown} 段` }
    : { status: 'success', message: `边缘词缀识别完成，共 ${attempted} 段` }
}
