// Electron 国际服检查：仅输出脱敏计数；--update-catalog 显式更新国际服专属目录。
import { app, session } from 'electron'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { resolveUserDataPath } from '../electron/modules/storage/userDataPath.js'
import { ServerModeController } from '../electron/modules/app/serverMode.js'
import { PoeAccountAuthService } from '../electron/modules/chaosRecipe/auth.js'
import { PoeStashClient } from '../electron/modules/chaosRecipe/stashClient.js'
import { PoeTradeClient } from '../electron/modules/priceCheck/client.js'
import { PobExportService } from '../electron/modules/pobExport/service.js'
import { ChaosRecipeService } from '../electron/modules/chaosRecipe/service.js'
import { loadTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { generateServerTradeCatalog, writeServerTradeCatalog } from './generateServerTradeCatalog.js'

app.setPath('userData', resolveUserDataPath(app.getPath('appData')))
const controller = new ServerModeController({ userDataPath: app.getPath('userData') })
const args = process.argv.slice(2)
const requestedLeague = args.includes('--league') ? args[args.indexOf('--league') + 1] : ''
const updateCatalog = args.includes('--update-catalog')
const report = { server: controller.mode, league: requestedLeague, checks: [] }
const deadline = setTimeout(() => {
  report.checks.push({ id: 'runtime', ok: false, code: 'CHECK_TIMEOUT' })
  console.log(JSON.stringify(report))
  app.exit(2)
}, 180000)
const check = async (id, operation) => {
  try { const counts = await operation(); report.checks.push({ id, ok: true, ...counts }); return true }
  catch (error) { report.checks.push({ id, ok: false, code: error?.code || 'CHECK_FAILED', ...(error?.details?.status ? { status: error.details.status } : {}), ...(error?.details?.retryAfter ? { retryAfter: error.details.retryAfter } : {}) }); return false }
}
const unverified = (id, code) => report.checks.push({ id, ok: null, state: 'not-verified', code })

async function run() {
  // 不允许脚本以国服模式运行，也不以永久区替代目标新赛季。
  if (controller.mode !== 'international') throw Object.assign(new Error(), { code: 'INTERNATIONAL_MODE_REQUIRED' })
  if (!requestedLeague || requestedLeague.startsWith('--')) throw Object.assign(new Error(), { code: 'EXPLICIT_LEAGUE_REQUIRED' })
  if (!app.requestSingleInstanceLock()) throw Object.assign(new Error(), { code: 'APP_ALREADY_RUNNING' })
  await app.whenReady()
  const active = session.fromPartition(controller.server.partition)
  const auth = new PoeAccountAuthService({ session: active, server: controller.server })
  const stash = new PoeStashClient({ session: active, server: controller.server, getAuthStatus: () => auth.getStatus() })
  const trade = new PoeTradeClient({ session: active, server: controller.server })
  const pob = new PobExportService({ session: active, server: controller.server, auth })
  const loggedIn = await check('account', async () => { await auth.validate(); return {} })
  if (!loggedIn) return
  const leagueAvailable = await check('leagues', async () => {
    const accountLeagues = await stash.listLeagues()
    const tradeLeagues = await trade.request('/api/trade/data/leagues')
    assert.ok(Array.isArray(tradeLeagues?.result))
    const selected = tradeLeagues.result.find(entry => entry.id === requestedLeague)
    assert.ok(selected, '目标赛季未出现在官方交易列表')
    assert.ok(accountLeagues.some(entry => entry.id === selected.id), '目标赛季未出现在官方账号赛季列表')
    return { accountCount: accountLeagues.length, tradeCount: tradeLeagues.result.length, targetPresent: true }
  })
  if (!leagueAvailable) return
  const league = requestedLeague
  {
    let catalogBundle
    await check('catalog-snapshot', async () => {
      const { catalog: baseCatalog } = await loadTradeCatalog()
      catalogBundle = await generateServerTradeCatalog({ server: 'international', gameVersion: 'live', baseCatalog,
        fetchImpl: async (url, options) => {
          const response = await active.fetch(url, { ...options, cache: 'no-store' })
          const payload = await response.clone().json()
          assert.ok(response.ok && Array.isArray(payload?.result) && payload.result.length)
          report.checks.push({ id: `trade-${new URL(url).pathname.split('/').at(-1)}`, ok: true,
            groups: payload.result.length, count: payload.result.reduce((sum, group) => sum + (group.entries?.length || 0), 0) })
          return response
        } })
      if (updateCatalog) {
        await writeServerTradeCatalog(controller.dataPath('trade-catalog.international.json'), catalogBundle.catalog)
        await writeServerTradeCatalog(fileURLToPath(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url)), catalogBundle.catalog)
      }
      return { updated: updateCatalog, items: catalogBundle.catalog.items.length, stats: catalogBundle.catalog.stats.length,
        currencies: Object.keys(catalogBundle.catalog.currencyLabels).length, generatedAt: catalogBundle.catalog.generatedAt }
    })
    if (catalogBundle) await check('price-service-text', async () => {
      let officialOriginAndLeagueCorrect = false
      const service = new PriceCheckService({ auth, client: trade, catalog: catalogBundle.catalog, catalogStatus: catalogBundle.status, manualInputOnly: true,
        // 只验证链接生成，不调用系统浏览器。
        shell: { openExternal: async value => {
          const url = new URL(value)
          officialOriginAndLeagueCorrect = url.origin === controller.server.origin && url.pathname.startsWith(`/trade/search/${encodeURIComponent(league)}/`)
        } } })
      let sampleBase = 'Coral Ring'
      const querySample = () => service.check({ text: `Item Class: Rings\nRarity: Normal\n${sampleBase}\n--------\nItem Level: 80`, league, options: { status: 'any' } })
      let result = await querySample()
      if (result.result?.queryId && result.result.total < 11) {
        // 新赛季指定底材可能暂无挂单，从同赛季公开戒指挂单选择实际存在的底材。
        await delay(2500)
        const search = await trade.search(league, { query: { status: { option: 'any' }, stats: [{ type: 'and', filters: [] }],
          filters: { type_filters: { filters: { category: { option: 'accessory.ring' }, rarity: { option: 'nonunique' } } } } }, sort: { price: 'asc' } })
        const ids = Array.isArray(search.result) ? search.result : Object.keys(search.result || {})
        report.checks.push({ id: 'price-broad-sample', ok: true, total: Number(search.total) || 0 })
        const fetched = await trade.fetch(search.id, ids.slice(0, 10))
        const frequencies = new Map()
        for (const entry of fetched.result) {
          const base = entry?.item?.baseType || entry?.item?.typeLine
          if (base) frequencies.set(base, (frequencies.get(base) || 0) + 1)
        }
        const base = [...frequencies].sort((a, b) => b[1] - a[1])[0]?.[0]
        if (base) {
          sampleBase = base
          await delay(2500)
          result = await querySample()
        }
      }
      report.checks.push({ id: 'price-response', ok: true, hasQuery: Boolean(result.result?.queryId),
        total: result.result?.total ?? 0, fetched: result.rawEntries?.length || 0, listingCount: result.result?.listings?.length || 0 })
      assert.ok(result.result?.queryId && result.result.total > 0 && result.rawEntries.length > 0)
      assert.equal(result.model.identity.type, sampleBase)
      await service.openOfficial()
      assert.ok(officialOriginAndLeagueCorrect)
      const summary = { total: result.result.total, listingCount: result.result.listings.length,
        fetched: result.rawEntries.length, whisperCount: result.result.listings.filter(entry => entry.whisper).length,
        officialOriginAndLeagueCorrect }
      if (result.remainingResultIds.length) await check('price-pagination', async () => {
        const next = await service.loadMore()
        assert.ok(next.rawEntries.length > result.rawEntries.length)
        return { fetched: next.rawEntries.length, listingCount: next.result.listings.length,
          whisperCount: next.result.listings.filter(entry => entry.whisper).length }
      })
      else unverified('price-pagination', 'INSUFFICIENT_LISTINGS')
      return summary
    })
  }
  let characters = []
  const characterListRead = await check('characters', async () => {
    characters = (await pob.listCharacters({ source: 'self' })).filter(entry => entry.league === league)
    return { targetLeagueCount: characters.length }
  })
  if (characterListRead && !characters.length) unverified('stash', 'NO_TARGET_LEAGUE_CHARACTER')
  else await check('stash', async () => {
    const tabs = await stash.listTabs(league)
    const supported = tabs.filter(tab => tab.supported)
    if (!supported.length) return { state: 'not-verified', ok: null, code: 'NO_SUPPORTED_TARGET_LEAGUE_TAB', tabs: tabs.length }
    let snapshot
    let inspectedTabs = 0
    for (const tab of supported) {
      if (inspectedTabs) await delay(1500)
      snapshot = await stash.fetchTab(league, tab)
      inspectedTabs++
      if (snapshot.items?.length) break
    }
    const recipes = new ChaosRecipeService({ auth, stashClient: stash, automation: { reset() {} }, overlay: null })
    const calculated = recipes.setSnapshot({ league, results: [snapshot], availableTabs: tabs, includeIdentified: false })
    assert.equal(calculated.league, league)
    assert.ok(Object.keys(calculated.recipes).length > 0)
    return { tabs: tabs.length, supported: supported.length, inspectedTabs,
      items: snapshot.items?.length || 0, recipeTypes: Object.keys(calculated.recipes).length,
      ...(snapshot.items?.length ? {} : { state: 'not-verified', ok: null, code: 'EMPTY_TARGET_LEAGUE_TAB' }) }
  })
  const character = [...characters].sort((a, b) => b.level - a.level)[0]
  if (!character) {
    unverified('character-payload', 'NO_TARGET_LEAGUE_CHARACTER')
    unverified('pob-export', 'NO_TARGET_LEAGUE_CHARACTER')
    return
  }
  if (character) {
    await check('character-payload', async () => {
      const account = auth.getStatus().accountName
      const items = await pob.fetch('get-items', account, character.name, pob.generation)
      const passive = await pob.fetch('get-passive-skills', account, character.name, pob.generation)
      assert.equal(items.character?.league, league)
      assert.ok(Array.isArray(items.items) && Array.isArray(passive.hashes))
      return { items: items.items.length, nodes: passive.hashes.length }
    })
    await check('pob-export', async () => {
      const result = await pob.exportBuild({ source: 'self', character: character.name, league: character.league })
      assert.ok(result.code?.length)
      return { codeGenerated: true, warningCount: result.warnings.length, compatibility: result.compatibility,
        warningKinds: [...new Set(result.warnings.map(warning => /untranslated/.test(warning) ? 'TRANSLATION' : /星团/.test(warning) ? 'CLUSTER' : /词缀类别/.test(warning) ? 'MOD_CATEGORY' : 'OTHER'))] }
    })
  }
}

run().catch(error => report.checks.push({ id: 'runtime', ok: false, code: error?.code || 'RUNTIME_FAILED' })).finally(async () => {
  clearTimeout(deadline)
  await mkdir('.cache', { recursive: true })
  await writeFile(path.resolve('.cache/server-readonly-report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report))
  app.exit(report.checks.some(entry => entry.ok === false) ? 1 : 0)
})
