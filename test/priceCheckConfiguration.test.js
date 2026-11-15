import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'
import { serverContext } from '../shared/serverMode.js'

test('查价启用与捕获的配置引导使用当前服务器账号和赛季', async (t) => {
  const previousStorage = globalThis.localStorage
  const storage = new Map()
  globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
  }
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  t.after(async () => { await server.close(); globalThis.localStorage = previousStorage })
  const { currentServer } = await server.ssrLoadModule('/src/utils/serverContext.js')
  const { usePriceCheckStore } = await server.ssrLoadModule('/src/stores/priceCheck.js')
  const { usePoeAccountStore } = await server.ssrLoadModule('/src/stores/poeAccount.js')
  const { useFeatureModulesStore } = await server.ssrLoadModule('/src/stores/featureModules.js')
  const { useConfigurationGuideStore } = await server.ssrLoadModule('/src/domains/configurationGuide/configurationGuideStore.js')
  const { configurationIssueFromFailure } = await server.ssrLoadModule('/src/domains/configurationGuide/configurationFailures.js')

  for (const id of ['international', 'cn']) {
    Object.assign(currentServer, serverContext(id))
    storage.clear()
    setActivePinia(createPinia())
    useFeatureModulesStore().enable('price-check')
    const priceCheck = usePriceCheckStore()
    const account = usePoeAccountStore()
    const guide = useConfigurationGuideStore()
    const label = currentServer.label

    for (const [failureCode, title] of [['SESSION_EXPIRED', `${label}账号`], ['LEAGUE_INVALID', `${label}赛季`]]) {
      const issue = configurationIssueFromFailure({ moduleId: 'price-check', actionId: 'capture', failureCode })
      assert.equal(issue.title, title)
      assert.equal(issue.message, `请重新配置${title}后手动重试`)
    }

    const result = await priceCheck.setEnabled(true)
    assert.equal(result.configurationRequired, true)
    assert.equal(priceCheck.settings.enabled, false)
    assert.deepEqual(guide.issues.map(issue => [issue.title, issue.message]), [
      [`${label}账号`, `请先完成${label}账号登录`],
      [`${label}赛季`, `请选择${label}赛季`]
    ])
    assert.deepEqual(guide.issues.map(issue => issue.editorId), ['account.poe-cn', 'account.league'])
    account.status = { authenticated: true, accountName: 'test-account' }
    guide.refresh()
    assert.deepEqual(guide.issues.map(issue => issue.title), [`${label}赛季`])
    account.settings.league = 'test-league'
    guide.refresh()
    assert.equal(guide.remainingCount, 0)
    guide.clear()

    priceCheck.settings.enabled = true
    account.settings.league = ''
    await priceCheck.checkHoveredItem()
    assert.equal(guide.request.actionId, 'capture')
    assert.deepEqual(guide.issues.map(issue => issue.title), [`${label}赛季`])
    guide.clear()
  }
})
