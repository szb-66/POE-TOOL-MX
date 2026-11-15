import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { loadTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import vm from 'node:vm'

test('手动模式可查询和分页，但直接调用游戏捕获仍在服务层拒绝', async () => {
  const { catalog } = await loadTradeCatalog()
  let captured = false
  const client = { clearCache() {}, search: async () => ({ id: 'fixture', total: 0, result: [] }), fetch: async () => ({ result: [] }) }
  const service = new PriceCheckService({ auth: { getStatus: () => ({ authenticated: true }) }, client, catalog, manualInputOnly: true, captureClipboard: async () => { captured = true; return '' } })
  // 使用已有目录中的中文普通物品验证共用业务，英文目录匹配在 serverTradeCatalog 测试覆盖。
  const result = await service.check({ league: 'Standard', text: '物品类别: 戒指\n稀有度: 普通\n珊瑚戒指\n--------\n物品等级: 80' })
  assert.equal(result.result.total, 0)
  await assert.rejects(service.captureAndCheck({}), error => error.code === 'SERVER_FEATURE_UNAVAILABLE')
  assert.equal(captured, false)
})

test('国际服手动页面复用固定 API，模板没有游戏捕获或自动输入入口', async () => {
  const source = await readFile(new URL('../src/domains/priceCheck/ManualPriceCheckPanel.vue', import.meta.url), 'utf8')
  assert.match(source, /priceCheck.checkText/)
  assert.match(source, /priceCheck.loadMore/)
  assert.match(source, /clipboard.writeText/)
  assert.doesNotMatch(source, /captureAndCheck|capturePriceCheckItem|executePython|sendCopy/)
})

test('切换账号或赛季后丢弃手动查询迟到结果，不覆盖新查询的忙碌状态和结果', async () => {
  const source = await readFile(new URL('../src/domains/priceCheck/ManualPriceCheckPanel.vue', import.meta.url), 'utf8')
  const script = source.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
  const pending = []
  const watchers = []
  const api = { priceCheck: { checkText: () => new Promise(resolve => pending.push(resolve)), closeOverlay: async () => ({ success: true }) } }
  const context = vm.createContext({ ref: value => ({ value }), watch: (_source, callback) => watchers.push(callback), onMounted() {}, onBeforeUnmount() {},
    usePoeAccountStore: () => ({ status: { authenticated: true }, settings: { league: 'Standard' } }), electronApi: api, ElMessage: {} })
  vm.runInContext(`${script}\nglobalThis.ui = { search, result, busy }`, context)
  const first = context.ui.search()
  watchers[0]()
  const second = context.ui.search()
  pending[0]({ success: true, data: { marker: 'old-account' } })
  await first
  assert.equal(context.ui.busy.value, true)
  assert.equal(context.ui.result.value, null)
  pending[1]({ success: true, data: { marker: 'current-account' } })
  await second
  assert.equal(context.ui.result.value.marker, 'current-account')
  assert.equal(context.ui.busy.value, false)
})

test('国际服刷新成功使旧查询失效，失败保留已有目录和结果', async () => {
  const { catalog, status } = await loadTradeCatalog()
  const client = { server: { id: 'international' }, clearCache() {} }
  let fail = false
  const service = new PriceCheckService({ auth: {}, client, catalog, catalogStatus: status,
    catalogRefresher: async () => { if (fail) throw Error('offline'); return { catalog: structuredClone(catalog), status } } })
  const oldResult = { result: { queryId: 'old' } }
  service.latest = oldResult
  service.controller = new AbortController()
  const controller = service.controller
  await service.refreshCatalog()
  assert.equal(service.latest, null)
  assert.equal(controller.signal.aborted, true)
  service.latest = oldResult
  const currentCatalog = service.catalog
  fail = true
  await assert.rejects(service.refreshCatalog(), /offline/)
  assert.equal(service.catalog, currentCatalog)
  assert.equal(service.latest, oldResult)
  assert.equal(service.catalogStatus.loading, false)
})

test('国际服分页遇到赛季切换时不污染新查询，失败后仍可重试同一页', async () => {
  let resolveFetch
  let rejectFetch
  const client = { clearCache() {}, fetch: () => new Promise((resolve, reject) => { resolveFetch = resolve; rejectFetch = reject }) }
  const service = new PriceCheckService({ auth: { getStatus: () => ({}) }, client, catalog: { currencyLabels: {} }, manualInputOnly: true })
  const first = { result: { queryId: 'old' }, rawEntries: [], remainingResultIds: ['a', 'b'] }
  service.latest = first
  const pending = service.loadMore()
  service.clear()
  const next = { result: { queryId: 'new' }, rawEntries: [], remainingResultIds: ['c'] }
  service.latest = next
  resolveFetch({ result: [{ id: 'old-result' }] })
  await assert.rejects(pending, error => error.name === 'AbortError')
  assert.equal(service.latest, next)
  assert.deepEqual(next.rawEntries, [])
  const retry = service.loadMore()
  rejectFetch(Error('rate limited'))
  await assert.rejects(retry, /rate limited/)
  assert.deepEqual(next.remainingResultIds, ['c'])
})

test('手动页面目录替换后清除旧结果并丢弃迟到查询，刷新失败同步降级状态', async () => {
  const source = await readFile(new URL('../src/domains/priceCheck/ManualPriceCheckPanel.vue', import.meta.url), 'utf8')
  const script = source.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
  let completeQuery
  const updated = { generatedAt: 'new', loading: false, warning: '' }
  let current = updated
  const api = { priceCheck: {
    checkText: () => new Promise(resolve => { completeQuery = resolve }),
    retryCatalog: async () => ({ success: false, error: { message: 'offline' } }),
    getStatus: async () => ({ success: true, data: { catalog: current } })
  } }
  const context = vm.createContext({ ref: value => ({ value }), watch() {}, onMounted() {}, onBeforeUnmount() {},
    usePoeAccountStore: () => ({ settings: { league: 'Covens' } }), electronApi: api, ElMessage: {} })
  vm.runInContext(`${script}\nglobalThis.ui = { search, refreshCatalog, readStatus, catalog, result, busy, error }`, context)
  const ui = context.ui
  ui.catalog.value = { generatedAt: 'old' }
  ui.result.value = { marker: 'old' }
  const query = ui.search()
  await ui.readStatus()
  assert.equal(ui.result.value, null)
  assert.equal(ui.busy.value, false)
  completeQuery({ success: true, data: { marker: 'late' } })
  await query
  assert.equal(ui.result.value, null)
  ui.result.value = { marker: 'usable' }
  current = { ...updated, degraded: true, warning: '继续使用当前目录' }
  await ui.refreshCatalog()
  assert.equal(ui.result.value.marker, 'usable')
  assert.equal(ui.catalog.value.warning, '继续使用当前目录')
  assert.equal(ui.error.value, 'offline')
})

test('较早的状态响应不能覆盖刷新后的目录或取消新查询', async () => {
  const source = await readFile(new URL('../src/domains/priceCheck/ManualPriceCheckPanel.vue', import.meta.url), 'utf8')
  const script = source.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
  let completeStatus
  let completeQuery
  const api = { priceCheck: {
    getStatus: () => new Promise(resolve => { completeStatus = resolve }),
    retryCatalog: async () => ({ success: true, data: { generatedAt: 'new' } }),
    checkText: () => new Promise(resolve => { completeQuery = resolve })
  } }
  const context = vm.createContext({ ref: value => ({ value }), watch() {}, onMounted() {}, onBeforeUnmount() {},
    usePoeAccountStore: () => ({ settings: { league: 'Covens' } }), electronApi: api, ElMessage: {} })
  vm.runInContext(`${script}\nglobalThis.ui = { search, readStatus, refreshCatalog, catalog, result, busy }`, context)
  const ui = context.ui
  ui.catalog.value = { generatedAt: 'old' }
  const oldStatus = ui.readStatus()
  await ui.refreshCatalog()
  const query = ui.search()
  completeStatus({ success: true, data: { catalog: { generatedAt: 'old' } } })
  await oldStatus
  assert.equal(ui.catalog.value.generatedAt, 'new')
  assert.equal(ui.busy.value, true)
  completeQuery({ success: true, data: { marker: 'current-query' } })
  await query
  assert.equal(ui.result.value.marker, 'current-query')
})

async function identityPage(api) {
  const source = await readFile(new URL('../src/domains/priceCheck/ManualPriceCheckPanel.vue', import.meta.url), 'utf8')
  const script = source.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
  const watchers = []
  const disposers = []
  const account = { status: { authenticated: true, accountName: 'fixture-account' }, settings: { league: 'Standard' } }
  const context = vm.createContext({ ref: value => ({ value }), watch: (_source, callback) => watchers.push(callback), onMounted() {}, onBeforeUnmount: callback => disposers.push(callback),
    usePoeAccountStore: () => account, electronApi: api, ElMessage: {} })
  vm.runInContext(`${script}\nglobalThis.ui = { search, resolveIdentity, applyCatalog, text, catalog, result, busy, error }`, context)
  return { source, ui: context.ui, invalidate: () => watchers[0](), dispose: () => disposers[0]() }
}

test('手动页面选择未鉴定皮革腰带候选后查询该名称，并显示真实服务归一化的挂单', async () => {
  const catalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
  const queries = []
  const client = { server: { id: 'international' }, clearCache() {},
    search: async (league, query) => { queries.push({ league, query }); return { id: 'fixture-query', total: 1, result: ['listing'] } },
    fetch: async () => ({ result: [{ id: 'listing', listing: { account: { name: 'seller', online: { league: 'Standard' } }, price: { amount: 10, currency: 'chaos' }, whisper: 'fixture whisper' }, item: { name: 'Headhunter', typeLine: 'Leather Belt' } }] }) }
  const service = new PriceCheckService({ auth: { getStatus: () => ({ authenticated: true }) }, client, catalog, manualInputOnly: true })
  const ok = operation => Promise.resolve(operation).then(data => ({ success: true, data }))
  const api = { priceCheck: { checkText: input => ok(service.check(input)), resolveIdentity: key => ok(service.resolveIdentity(key)),
    rerun: input => ok(service.rerun(input)), closeOverlay: async () => ({ success: true }) } }
  const { source, ui } = await identityPage(api)
  assert.match(source, /v-for="candidate in result\.model\.identityResolution\.candidates"/)
  assert.match(source, /@click="resolveIdentity\(candidate\.key\)"/)
  ui.text.value = 'Item Class: Belts\nRarity: Unique\nLeather Belt\n--------\nItem Level: 80\n--------\nUnidentified'
  await ui.search()
  assert.equal(queries.length, 0)
  assert.equal(ui.result.value.model.identityResolution.required, true)
  assert.ok(ui.result.value.model.identityResolution.candidates.length > 1)
  const candidate = ui.result.value.model.identityResolution.candidates.find(entry => entry.name === 'Headhunter')
  await ui.resolveIdentity(candidate.key)
  assert.equal(queries.length, 1)
  assert.equal(queries[0].league, 'Standard')
  assert.equal(queries[0].query.query.name, 'Headhunter')
  assert.equal(queries[0].query.query.type, 'Leather Belt')
  assert.equal(ui.result.value.result.queryId, 'fixture-query')
  assert.equal(ui.result.value.result.listings[0].amount, 10)
  assert.equal(ui.result.value.result.listings[0].whisper, 'fixture whisper')
})

for (const failureStage of ['search', 'fetch', 'deferred-search']) {
  test(`名称选择在 ${failureStage} 失败后保留模型，可直接再次选择并查询`, async () => {
    const catalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
    let failed = false
    let selections = 0
    let parses = 0
    const queries = []
    const client = { server: { id: 'international' }, clearCache() {},
      search: async (_league, query) => {
        queries.push(query)
        if (!failed && failureStage !== 'fetch') { failed = true; throw Object.assign(Error('暂时限流'), { code: 'RATE_LIMITED' }) }
        return { id: 'retry-query', total: 1, result: ['listing'] }
      },
      fetch: async () => {
        if (!failed) { failed = true; throw Object.assign(Error('暂时断网'), { code: 'NETWORK_ERROR' }) }
        return { result: [] }
      }
    }
    const service = new PriceCheckService({ auth: { getStatus: () => ({ authenticated: true }) }, client, catalog, manualInputOnly: true })
    const respond = async action => {
      try { return { success: true, data: await action() } }
      catch (error) { return { success: false, error: { code: error.code, message: error.message } } }
    }
    const api = { priceCheck: {
      checkText: input => { parses++; return respond(() => service.check({ ...input, queryImmediately: failureStage !== 'deferred-search' })) },
      resolveIdentity: key => { selections++; return respond(() => service.resolveIdentity(key)) },
      rerun: input => respond(() => service.rerun(input))
    } }
    const { ui } = await identityPage(api)
    ui.text.value = 'Item Class: Belts\nRarity: Unique\nLeather Belt\n--------\nItem Level: 80\n--------\nUnidentified'
    await ui.search()
    const candidate = ui.result.value.model.identityResolution.candidates.find(entry => entry.name === 'Headhunter')
    await ui.resolveIdentity(candidate.key)
    assert.match(ui.error.value, /暂时/)
    assert.equal(ui.busy.value, false)
    assert.equal(service.latest?.model.identity.name, 'Headhunter')
    assert.equal(service.latest.result, null)
    await ui.resolveIdentity(candidate.key)
    assert.equal(selections, 2)
    assert.equal(parses, 1, '重试无需重新粘贴或重新解析物品')
    assert.equal(queries.length, 2)
    assert.ok(queries.every(query => query.query.name === 'Headhunter' && query.query.type === 'Leather Belt'))
    assert.equal(ui.error.value, '')
    assert.equal(ui.result.value.result.queryId, 'retry-query')
  })
}

test('旧查询迟到失败或已取消时不得恢复旧的可重试模型', async () => {
  for (const change of ['clear', 'new-query', 'close']) {
    const { catalog } = await loadTradeCatalog()
    let rejectSearch
    let searches = 0
    const service = new PriceCheckService({ auth: { getStatus: () => ({ authenticated: true }) }, manualInputOnly: true, catalog,
      client: { clearCache() {}, search: () => ++searches === 1 ? new Promise((_resolve, reject) => { rejectSearch = reject }) : Promise.resolve({ id: 'current', total: 0, result: [] }) } })
    const request = { league: 'Standard', text: '物品类别: 戒指\n稀有度: 普通\n珊瑚戒指\n--------\n物品等级: 80' }
    const old = service.check(request)
    if (change === 'clear') service.clear()
    else if (change === 'new-query') await service.check({ ...request, league: 'NewLeague' })
    else service.closeOverlay()
    const current = service.latest
    rejectSearch(Object.assign(Error('迟到的断网错误'), { code: 'NETWORK_ERROR' }))
    await assert.rejects(old, /断网/)
    assert.equal(service.latest, current, change)
  }
})

test('延迟查询模式选择名称后继续执行查询，重复点击不重复请求', async () => {
  let finishSelection
  let selections = 0
  const reruns = []
  const api = { priceCheck: {
    resolveIdentity: () => { selections++; return new Promise(resolve => { finishSelection = resolve }) },
    rerun: async request => { reruns.push(request); return { success: true, data: { result: { queryId: 'resolved' } } } }
  } }
  const { ui } = await identityPage(api)
  ui.result.value = { model: { identityResolution: { required: true } } }
  const first = ui.resolveIdentity('selected')
  await ui.resolveIdentity('selected')
  assert.equal(selections, 1)
  assert.equal(ui.busy.value, true)
  finishSelection({ success: true, data: { league: 'Standard', options: { initialSelection: 'none' }, model: { identityResolution: { required: false } }, result: null } })
  await first
  assert.equal(reruns.length, 1)
  assert.equal(reruns[0].league, 'Standard')
  assert.equal(reruns[0].options.initialSelection, 'none')
  assert.equal(ui.result.value.result.queryId, 'resolved')
  assert.equal(ui.busy.value, false)
})

test('名称选择迟到时不覆盖新状态，也不会为旧文本或目录继续发起查询', async () => {
  for (const change of ['input', 'catalog', 'unmount']) {
    let finishSelection
    let reruns = 0
    const api = { priceCheck: { resolveIdentity: () => new Promise(resolve => { finishSelection = resolve }),
      rerun: async () => { reruns++; return { success: true, data: {} } }, closeOverlay: async () => ({ success: true }) } }
    const { ui, invalidate, dispose } = await identityPage(api)
    ui.catalog.value = { generatedAt: 'old' }
    ui.result.value = { model: { identityResolution: { required: true } } }
    const pending = ui.resolveIdentity('selected')
    if (change === 'input') invalidate()
    else if (change === 'catalog') ui.applyCatalog({ generatedAt: 'new' })
    else dispose()
    const current = { marker: 'current' }
    ui.result.value = current
    finishSelection({ success: true, data: { model: { identityResolution: { required: false } }, result: null } })
    await pending
    assert.equal(ui.result.value, current, change)
    assert.equal(reruns, 0, change)
  }
})

test('切赛季后发起新查询，迟到的名称选择挂单不覆盖结果或清除忙碌状态', async () => {
  let finishSelection
  let finishQuery
  const api = { priceCheck: { resolveIdentity: () => new Promise(resolve => { finishSelection = resolve }),
    checkText: () => new Promise(resolve => { finishQuery = resolve }), closeOverlay: async () => ({ success: true }) } }
  const { ui, invalidate } = await identityPage(api)
  ui.result.value = { model: { identityResolution: { required: true } } }
  const selection = ui.resolveIdentity('selected')
  invalidate()
  const query = ui.search()
  finishSelection({ success: true, data: { result: { queryId: 'old-league' } } })
  await selection
  assert.equal(ui.result.value, null)
  assert.equal(ui.busy.value, true)
  finishQuery({ success: true, data: { result: { queryId: 'new-league' } } })
  await query
  assert.equal(ui.result.value.result.queryId, 'new-league')
  assert.equal(ui.busy.value, false)
})
