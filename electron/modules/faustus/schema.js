import { createFaustusRunSnapshot } from '../../../src/utils/faustusConfig.js'

function assertOnlyKeys(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('浮士德请求必须是对象')
  const unknown = Object.keys(value).filter(key => !allowed.includes(key))
  if (unknown.length) throw new Error(`不支持的浮士德请求字段：${unknown.join('、')}`)
}

export function normalizeFaustusStartRequest(value) {
  assertOnlyKeys(value, ['config'])
  return { config: createFaustusRunSnapshot(value.config) }
}
