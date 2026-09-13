import { requestPoeCnJson } from '../chaosRecipe/http.js'
import { PobExportError } from './errors.js'
import { convertInWorker } from './workerClient.js'

const ORIGIN = 'https://poe.game.qq.com'
const text = (value) => typeof value === 'string' ? value.trim() : ''
function required(value, label) {
  const result = text(value)
  if (!result || result.length > 200 || /[\x00-\x1f]/.test(result)) {
    throw new PobExportError('INVALID_REQUEST', `请填写有效的${label}`)
  }
  return result
}

export class PobExportService {
  constructor({ session, auth, request = requestPoeCnJson, convert = convertInWorker }) {
    Object.assign(this, { session, auth, request, convert })
    this.generation = 0
    auth.subscribe?.(() => { this.generation++ })
  }

  identity(input) {
    if (input?.source === 'other') return required(input.forumId, '论坛 ID')
    if (input?.source !== 'self') throw new PobExportError('INVALID_REQUEST', '请选择导出账号类型')
    const status = this.auth.getStatus()
    if (!status.authenticated || !status.accountName) throw new PobExportError('UNAUTHENTICATED', '请先在设置中登录国服账号')
    return status.accountName
  }

  assertCurrent(generation) {
    if (generation !== this.generation) throw new PobExportError('STALE_REQUEST', '账号状态已变化，请重新加载角色')
  }

  async fetch(endpoint, accountName, character, generation) {
    this.assertCurrent(generation)
    const body = new URLSearchParams({ accountName, realm: 'pc', ...(character ? { character } : {}) }).toString()
    try {
      const data = await this.request(this.session, `${ORIGIN}/character-window/${endpoint}`, {
        method: 'POST', body, signal: AbortSignal.timeout(30000),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      this.assertCurrent(generation)
      if (data?.error) {
        const code = data.error.code
        if (code === 6 || /private|hidden|forbidden|隐私|隐藏/i.test(data.error.message || '')) {
          throw new PobExportError('PRIVATE_PROFILE', '该账号不存在或角色资料未公开，请检查论坛 ID 和官网隐私设置')
        }
        throw new PobExportError('API_INCOMPATIBLE', '官网无法提供角色数据，请刷新角色列表后重试')
      }
      return data
    } catch (error) {
      this.assertCurrent(generation)
      if (error instanceof PobExportError) throw error
      if (error.code === 'SESSION_EXPIRED') {
        await this.auth.expire?.()
        throw new PobExportError('SESSION_EXPIRED', '国服登录已过期，请重新登录')
      }
      if (error.code === 'RATE_LIMITED') {
        const retryAfter = Number(error.details?.retryAfter) || 60
        throw new PobExportError('RATE_LIMITED', `官网请求过于频繁，请在 ${retryAfter} 秒后重试`, { retryAfter })
      }
      if (error.details?.status === 403) throw new PobExportError('PRIVATE_PROFILE', '该账号不存在或角色资料未公开，请检查论坛 ID 和官网隐私设置')
      if (error.details?.status === 404) throw new PobExportError('CHARACTER_NOT_FOUND', '未找到账号或角色，请重新加载角色列表')
      throw new PobExportError('NETWORK_ERROR', '无法获取国服角色数据，请检查网络后重试')
    }
  }

  async characters(accountName, generation) {
    const data = await this.fetch('get-characters', accountName, null, generation)
    if (!Array.isArray(data)) throw new PobExportError('API_INCOMPATIBLE', '官网角色列表格式无法识别')
    return data.filter(c => !c.realm || c.realm === 'pc').map(c => {
      if (!text(c.name) || !text(c.league) || !Number.isInteger(c.level) || c.level < 1 || c.level > 100) {
        throw new PobExportError('API_INCOMPATIBLE', '官网角色列表信息不完整')
      }
      return { name: c.name, league: c.league, level: c.level, class: text(c.class) }
    })
  }

  async listCharacters(input) {
    const generation = this.generation
    return this.characters(this.identity(input), generation)
  }

  async exportBuild(input) {
    const generation = this.generation
    const accountName = this.identity(input)
    const name = required(input.character, '角色名')
    const league = required(input.league, '赛季')
    const characters = await this.characters(accountName, generation)
    const character = characters.find(c => c.name === name && c.league === league)
    if (!character) throw new PobExportError('CHARACTER_NOT_FOUND', '角色不存在或赛季已变化，请重新加载角色列表')
    const items = await this.fetch('get-items', accountName, name, generation)
    const passiveSkills = await this.fetch('get-passive-skills', accountName, name, generation)
    if (items?.character?.name !== name || items?.character?.league !== league) {
      throw new PobExportError('CHARACTER_MISMATCH', '官网返回的角色与选择不一致，请重新加载')
    }
    const result = await this.convert({ items, passiveSkills })
    this.assertCurrent(generation)
    return { ...result, character: { ...character, level: items.character.level }, generatedAt: new Date().toISOString() }
  }
}
