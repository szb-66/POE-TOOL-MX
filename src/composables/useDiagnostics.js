import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { electronApi } from '@/api/electron'
import { getRendererDiagnosticContext } from '@/utils/diagnosticContext'

export function useDiagnostics() {
  const diagnosticsExporting = ref(false)
  const diagnosticCapture = ref(null)
  const diagnosticCaptureLoading = ref(false)
  let captureTimeout = null

  const captureStatusText = computed(() => {
    if (!diagnosticCapture.value) return ''
    const labels = {
      active: '诊断会话正在记录。请复现问题后提交反馈，或结束并导出到本地。',
      completed: '诊断会话已结束，可以随反馈提交或导出到本地。',
      timed_out: '诊断会话已达到 15 分钟上限，可以使用已记录的证据。',
      interrupted: '检测到上次异常中断的诊断会话，可以使用已记录的证据。'
    }
    return labels[diagnosticCapture.value.status] || '诊断会话可以随反馈提交或导出到本地。'
  })

  function diagnosticPayload(captureId = null) {
    return {
      ...getRendererDiagnosticContext(),
      ...(captureId ? { captureId } : {})
    }
  }

  function scheduleCaptureRefresh(capture) {
    if (captureTimeout) clearTimeout(captureTimeout)
    captureTimeout = null
    if (capture?.status !== 'active' || !capture.expiresAt) return
    const delay = Math.max(0, Date.parse(capture.expiresAt) - Date.now()) + 100
    captureTimeout = setTimeout(loadDiagnosticCaptureStatus, delay)
  }

  async function loadDiagnosticCaptureStatus() {
    const result = await electronApi.system.getDiagnosticCaptureStatus()
    if (!result?.success) return false
    diagnosticCapture.value = result.activeCapture || result.lastCapture || null
    scheduleCaptureRefresh(diagnosticCapture.value)
    return true
  }

  async function startDiagnosticCapture(area, symptom) {
    diagnosticCaptureLoading.value = true
    try {
      const result = await electronApi.system.startDiagnosticCapture({ area, symptom })
      if (!result?.success) throw new Error('诊断会话启动失败')
      diagnosticCapture.value = result.capture
      scheduleCaptureRefresh(result.capture)
      ElMessage.success('诊断会话已开始，请复现问题后提交反馈')
      return true
    } catch (error) {
      ElMessage.error(error?.message || '诊断会话启动失败')
      return false
    } finally {
      diagnosticCaptureLoading.value = false
    }
  }

  async function finishDiagnosticCapture({ notify = true } = {}) {
    const capture = diagnosticCapture.value
    if (!capture || capture.status !== 'active') return { success: true, capture }
    diagnosticCaptureLoading.value = true
    try {
      const result = await electronApi.system.finishDiagnosticCapture({ captureId: capture.captureId })
      if (!result?.success) throw new Error('诊断会话结束失败')
      diagnosticCapture.value = result.capture
      scheduleCaptureRefresh(result.capture)
      if (notify) ElMessage.success('诊断会话已结束')
      return { success: true, capture: result.capture }
    } catch (error) {
      const message = error?.message || '诊断会话结束失败'
      if (notify) ElMessage.error(message)
      return { success: false, error: message, capture }
    } finally {
      diagnosticCaptureLoading.value = false
    }
  }

  async function exportDiagnostics(captureId = null) {
    if (typeof captureId !== 'string') captureId = null
    if (diagnosticsExporting.value) return false
    diagnosticsExporting.value = true
    try {
      const result = await electronApi.system.exportDiagnostics(diagnosticPayload(captureId))
      if (result?.canceled) return false
      if (!result?.success) throw new Error(result?.error || '诊断导出失败')
      ElMessage.success(`诊断已导出：${result.fileName}`)
      return true
    } catch (error) {
      ElMessage.error(error?.message || '诊断导出失败')
      return false
    } finally {
      diagnosticsExporting.value = false
    }
  }

  async function finishAndExportDiagnosticCapture() {
    const finished = await finishDiagnosticCapture({ notify: false })
    if (!finished.success || !finished.capture?.captureId) {
      if (!finished.success) ElMessage.error(finished.error)
      return false
    }
    return exportDiagnostics(finished.capture.captureId)
  }

  async function prepareDiagnosticCaptureForFeedback() {
    const finished = await finishDiagnosticCapture({ notify: false })
    if (!finished.success) return { success: false, error: finished.error, captureId: null }
    return { success: true, captureId: finished.capture?.captureId || null }
  }

  async function cancelDiagnosticCapture() {
    const captureId = diagnosticCapture.value?.captureId
    if (!captureId) return true
    const result = await electronApi.system.cancelDiagnosticCapture({ captureId })
    if (!result?.success) {
      ElMessage.error('诊断会话取消失败')
      return false
    }
    diagnosticCapture.value = null
    scheduleCaptureRefresh(null)
    ElMessage.success('诊断会话已取消')
    return true
  }

  function clearSubmittedDiagnosticCapture(captureId) {
    if (!captureId || diagnosticCapture.value?.captureId !== captureId) return
    diagnosticCapture.value = null
    scheduleCaptureRefresh(null)
  }

  onMounted(() => { void loadDiagnosticCaptureStatus() })
  onBeforeUnmount(() => {
    if (captureTimeout) clearTimeout(captureTimeout)
  })

  return {
    diagnosticsExporting,
    diagnosticCapture,
    diagnosticCaptureLoading,
    captureStatusText,
    loadDiagnosticCaptureStatus,
    startDiagnosticCapture,
    finishAndExportDiagnosticCapture,
    prepareDiagnosticCaptureForFeedback,
    exportDiagnostics,
    cancelDiagnosticCapture,
    clearSubmittedDiagnosticCapture
  }
}
