let rendererDiagnosticContext = Object.freeze({ modules: [], rendererHealth: [] })

function compactEntry(item, statusKey) {
  if (!item || typeof item.id !== 'string' || typeof item[statusKey] !== 'string') return null
  return {
    id: item.id,
    [statusKey]: item[statusKey],
    ...(typeof item.reasonCode === 'string' && item.reasonCode ? { reasonCode: item.reasonCode } : {})
  }
}

export function setRendererDiagnosticContext({ modules = [], rendererHealth = [] } = {}) {
  rendererDiagnosticContext = Object.freeze({
    modules: Object.freeze(modules.map(item => compactEntry(item, 'state')).filter(Boolean)),
    rendererHealth: Object.freeze(rendererHealth.map(item => compactEntry(item, 'status')).filter(Boolean))
  })
}

export function getRendererDiagnosticContext() {
  return {
    modules: rendererDiagnosticContext.modules.map(item => ({ ...item })),
    rendererHealth: rendererDiagnosticContext.rendererHealth.map(item => ({ ...item }))
  }
}
