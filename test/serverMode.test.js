import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { getServer, serverContext, serverStorageKey } from '../shared/serverMode.js'
import { ServerModeController } from '../electron/modules/app/serverMode.js'
import { serverChannelFailure, installServerIpcPolicy } from '../electron/modules/app/serverIpcPolicy.js'
import { createServerStorage } from '../src/utils/serverStorage.js'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import { normalizeItemTextLanguage } from '../shared/itemTextLanguage.js'
import { PoeCnTradeClient } from '../electron/modules/priceCheck/client.js'
import { PoeCnStashClient } from '../electron/modules/chaosRecipe/stashClient.js'
import { PoeCnAuthService } from '../electron/modules/chaosRecipe/auth.js'
import { isPoeCnAllowedUrl } from '../electron/modules/chaosRecipe/http.js'
import { probeServerCapabilities } from '../electron/modules/app/serverProbe.js'
import { createConfigBundle, parseConfigBundle } from '../src/domains/settings/configTransfer/core.js'

const memory = () => {
  const map = new Map()
  return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) }
}
const rootFor = t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'poe-server-mode-test-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  return root
}

test('默认国服，国际服独立描述，未知服务器拒绝', () => {
  assert.equal(getServer().partition, 'persist:poe-cn-auth')
  assert.equal(getServer('international').language, 'en')
  assert.throws(() => getServer('other'))
  const capabilities = serverContext('international').capabilities
  assert.ok(['account', 'price-check', 'recipe', 'pob-export'].every(key => capabilities[key].available && capabilities[key].gameInputAvailable === false))
  assert.equal(capabilities.items.available, true)
  assert.equal(capabilities.items.gameInputAvailable, false)
  assert.equal(capabilities.items.state, 'pending-client')
  assert.equal(capabilities.sanctum.available, false)
})

test('严格停止失败不写模式，成功后重启，运行中上下文不热切换', async t => {
  const root = rootFor(t)
  let restarted = false
  const failed = new ServerModeController({ userDataPath: root, cleanup: () => { throw Error('stop') }, restart: () => { restarted = true } })
  assert.equal((await failed.switchTo('international')).success, false)
  assert.equal(restarted, false)
  assert.equal(fs.existsSync(path.join(root, 'server-mode.json')), false)
  const controller = new ServerModeController({ userDataPath: root, cleanup: async () => {}, restart: () => { restarted = true } })
  assert.equal((await controller.switchTo('international')).success, true)
  assert.equal(restarted, true)
  assert.equal(controller.context.id, 'cn')
  const restored = new ServerModeController({ userDataPath: root })
  assert.equal(restored.context.id, 'international')
  assert.equal(restored.dataPath('calibration'), path.join(root, 'servers', 'international', 'calibration'))
})

test('重启失败回滚目标模式且拒绝并发切换', async t => {
  const root = rootFor(t)
  let release
  const controller = new ServerModeController({ userDataPath: root, cleanup: () => new Promise(resolve => { release = resolve }), restart: () => { throw Error('restart') } })
  const pending = controller.switchTo('international')
  assert.equal((await controller.switchTo('international')).success, false)
  await Promise.resolve()
  release()
  assert.equal((await pending).success, false)
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'server-mode.json'))).server, 'cn')
})

test('已有国服配置保留，国际服坐标与文字预设独立，快捷键和外观共享', () => {
  const storage = memory()
  const cn = createServerStorage(storage, 'cn')
  const international = createServerStorage(storage, 'international')
  cn.setItem('settings', JSON.stringify({ globalShortcuts: { end: 'F12' }, inventory: { startX: 99 }, overlaySettings: { opacity: 0.5 } }))
  cn.setItem('itemPresets', '中文预设')
  const initial = JSON.parse(international.getItem('settings'))
  assert.equal(initial.inventory, undefined)
  assert.equal(initial.globalShortcuts.end, 'F12')
  assert.equal(international.getItem('itemPresets'), null)
  international.setItem('settings', JSON.stringify({ ...initial, inventory: { startX: 200 }, globalShortcuts: { end: 'F11' } }))
  assert.equal(JSON.parse(cn.getItem('settings')).inventory.startX, 99)
  assert.equal(JSON.parse(cn.getItem('settings')).globalShortcuts.end, 'F11')
  assert.equal(JSON.parse(international.getItem('settings')).inventory.startX, 200)
  assert.equal(serverStorageKey('poeCnAccountSettings', 'cn'), 'poeCnAccountSettings')
})

test('国际服直接 IPC 和浮窗不能绕过门禁，切换时国服也拒绝新任务，停止始终可用', async () => {
  assert.equal(serverChannelFailure(serverContext(), 'execute-python'), null)
  for (const channel of ['execute-python', 'generate-and-execute-script', 'combat-start-potion', 'chaos-recipe-control-action', 'price-check-capture', 'faustus-start']) {
    assert.equal(serverChannelFailure(serverContext('international'), channel).code, 'SERVER_FEATURE_UNAVAILABLE')
  }
  assert.equal(serverChannelFailure(serverContext(), 'execute-python', true).code, 'SERVER_SWITCHING')
  assert.equal(serverChannelFailure(serverContext(), 'emergency-stop-all', true), null)
  for (const channel of ['price-check-text', 'price-check-load-more', 'pob-export-build', 'chaos-recipe-refresh']) assert.equal(serverChannelFailure(serverContext('international'), channel), null)
  assert.equal(serverChannelFailure(serverContext('international'), 'chaos-recipe-runtime-update', false, [{ enabled: false }]), null)
  for (const enabled of [true, 'true', 1]) assert.equal(serverChannelFailure(serverContext('international'), 'chaos-recipe-runtime-update', false, [{ enabled }]).code, 'SERVER_FEATURE_UNAVAILABLE')
  const handlers = new Map()
  const ipc = { handle: (channel, handler) => handlers.set(channel, handler), on() {} }
  installServerIpcPolicy(ipc, { context: serverContext('international') })
  let ran = false
  ipc.handle('execute-python', () => { ran = true })
  assert.equal((await handlers.get('execute-python')({})).success, false)
  assert.equal(ran, false)
})

test('英文物品只归一化结构字段，保留英文身份与词缀，并与中文属性等价', () => {
  const english = 'Item Class: Body Armours\nRarity: Rare\nDoom Shell\nAstral Plate\n--------\nQuality: +20%\nArmour: 1200\n--------\nItem Level: 86\n--------\n+100 to maximum Life\nCorrupted'
  const chinese = normalizeItemTextLanguage(english)
  assert.ok(chinese.includes('+100 to maximum Life'))
  const parsed = parseItemInfo(english)
  assert.equal(parsed.category, '胸甲')
  assert.equal(parsed.rarity, '稀有')
  assert.equal(parsed.name, 'Doom Shell')
  assert.equal(parsed.baseName, 'Astral Plate')
  assert.equal(parsed.quality, 20)
  assert.equal(parsed.armour, 1200)
  assert.equal(parsed.level, 86)
  assert.equal(parsed.isCorrupted, true)
  assert.equal(parsed.itemTextLanguage, 'en')
  assert.deepEqual({ ...parsed, itemTextLanguage: 'zh-CN' }, parseItemInfo(chinese))
  assert.ok(parsed.explicitMods.includes('+100 to maximum Life'))
})

test('英文高级词缀保留类型、等阶与原文', () => {
  const item = parseItemInfo('Item Class: Rings\nRarity: Rare\nDoom Circle\nCoral Ring\n--------\nItem Level: 86\n--------\n{ Prefix Modifier "Healthy" (Tier: 1) — Life }\n+79 to maximum Life')
  assert.equal(item.category, '戒指')
  assert.ok(item.modifiers.some(mod => mod.affixType === 'prefix' && mod.tier === 1 && mod.text.includes('+79')))
})

test('账号、仓库和交易请求只指向所选服；登录白名单不放行国服或任意地址', async () => {
  const urls = []
  const session = { fetch: async url => { urls.push(url); return new Response(JSON.stringify({ name: 'fixture', result: [], leagues: [{ id: 'Standard' }] })) } }
  const server = getServer('international')
  const auth = new PoeCnAuthService({ session, server })
  await auth.validate()
  const stash = new PoeCnStashClient({ session, server, getAuthStatus: () => ({ authenticated: true }) })
  await stash.listLeagues()
  await new PoeCnTradeClient({ session, server }).getStats()
  assert.ok(urls.every(url => new URL(url).origin === server.origin))
  assert.equal(isPoeCnAllowedUrl('https://www.pathofexile.com/login', server), true)
  assert.equal(isPoeCnAllowedUrl('https://poe.game.qq.com/login', server), false)
  assert.equal(isPoeCnAllowedUrl('https://www.pathofexile.com.evil.test/', server), false)
})

test('国际服拒绝访问、登录 HTML 和限流有明确状态且不重试', async () => {
  for (const [status, body, code] of [[403, '<html>blocked</html>', 'ACCESS_DENIED'], [200, '<title>Log in - Path of Exile</title>', 'SESSION_EXPIRED'], [429, '{}', 'RATE_LIMITED']]) {
    let calls = 0
    const client = new PoeCnTradeClient({ server: getServer('international'), session: { fetch: async () => { calls++; return new Response(body, { status, headers: { 'retry-after': '10' } }) } } })
    await assert.rejects(client.getStats(), error => error.code === code)
    assert.equal(calls, 1)
  }
})

test('逐接口验证报告不包含账号、响应正文或异常信息，也不把认证成功当作仓库成功', async () => {
  const report = await probeServerCapabilities({
    auth: { validate: async () => ({ accountName: 'private-fixture' }) },
    stash: { listLeagues: async () => [{ id: 'Standard' }], listTabs: async () => { throw Object.assign(Error('private-fixture'), { code: 'ACCESS_DENIED', details: { status: 403 } }) } },
    trade: { getStats: async () => ({}), search: async () => ({}) }, characters: async () => []
  })
  assert.equal(report.find(entry => entry.capability === 'stash').state, 'ACCESS_DENIED')
  assert.equal(JSON.stringify(report).includes('private-fixture'), false)
})

test('配置包记录服务器，旧配置按国服兼容且凭据被剔除', () => {
  const bundle = createConfigBundle({ server: 'international', sections: { 'settings.toolSites': { data: { sites: [], cookie: 'fixture-secret' } } } })
  assert.equal(bundle.server, 'international')
  assert.equal(JSON.stringify(bundle).includes('fixture-secret'), false)
  delete bundle.server
  assert.throws(() => parseConfigBundle(JSON.stringify(bundle)), /服务器标识/)
  bundle.formatVersion = 1
  assert.equal(parseConfigBundle(JSON.stringify(bundle)).bundle.server ?? 'cn', 'cn')
})
