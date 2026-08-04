import { writeFile } from 'node:fs/promises'
import { diagnosticFileName, safeExportResult } from './diagnostics.js'

export async function exportDiagnosticsFile({ showSaveDialog, buildSnapshot, writeText = writeFile }) {
  const result = await showSaveDialog({
    title: '导出脱敏诊断',
    defaultPath: diagnosticFileName(),
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })
  if (result?.canceled || !result?.filePath) return { success: false, canceled: true }
  try {
    const snapshot = await buildSnapshot()
    await writeText(result.filePath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
    return safeExportResult(result.filePath)
  } catch {
    return {
      success: false,
      canceled: false,
      error: '诊断文件写入失败，请更换保存位置后重试',
      errorCode: 'DIAGNOSTIC_EXPORT_WRITE_FAILED'
    }
  }
}
