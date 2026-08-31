const ACTIONABLE_STATUSES = new Set(['attention', 'error'])

const HEALTH_ACTIONS = Object.freeze({
  shortcuts: Object.freeze({ type: 'settings', label: '配置快捷键', target: 'general' }),
  dpi: Object.freeze({ type: 'settings', label: '调整 DPI', target: 'system' }),
  python: Object.freeze({ type: 'help', label: '查看排障', target: 'faq-runtime' }),
  displays: Object.freeze({ type: 'help', label: '查看排障', target: 'faq-dpi' }),
  userData: Object.freeze({ type: 'help', label: '查看排障', target: 'faq-config-location' }),
  platform: Object.freeze({ type: 'help', label: '查看排障', target: 'faq-system-environment' }),
  administrator: Object.freeze({ type: 'help', label: '查看排障', target: 'faq-system-environment' }),
  network: Object.freeze({ type: 'help', label: '查看排障', target: 'faq-system-environment' })
})

export function healthActionForItem(item) {
  if (!ACTIONABLE_STATUSES.has(item?.status)) return null
  return HEALTH_ACTIONS[item?.id] || null
}
