export class PobExportError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.code = code
    this.details = details
  }
}

export function serializePobError(error) {
  if (error instanceof PobExportError) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return { code: 'EXPORT_FAILED', message: 'PoB 导出失败，请重试', details: {} }
}
