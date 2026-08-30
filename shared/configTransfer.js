export const CONFIG_BUNDLE_KIND = 'poe-cn-helper/config-bundle'
export const CONFIG_BUNDLE_VERSION = 1
export const CONFIG_SECTION_SCHEMA_VERSION = 1
export const CONFIG_BUNDLE_MAX_BYTES = 5 * 1024 * 1024

export function sanitizeConfigFileName(value, fallback = '流放助手-配置.json') {
  const raw = String(value || '').trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
  const trimmed = raw.replace(/^[. ]+/g, '').replace(/[. ]+$/g, '').slice(0, 120)
  const base = trimmed || fallback
  return base.toLowerCase().endsWith('.json') ? base : `${base}.json`
}

export function createConfigFileName(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date)
  const valid = Number.isNaN(value.getTime()) ? new Date() : value
  const stamp = [
    valid.getFullYear(),
    String(valid.getMonth() + 1).padStart(2, '0'),
    String(valid.getDate()).padStart(2, '0'),
    '-',
    String(valid.getHours()).padStart(2, '0'),
    String(valid.getMinutes()).padStart(2, '0'),
    String(valid.getSeconds()).padStart(2, '0')
  ].join('')
  return `流放助手-配置-${stamp}.json`
}
