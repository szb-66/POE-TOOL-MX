import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { electronApi } from '../src/api/electron.js'
import { useFeedbackRepliesStore } from '../src/stores/feedbackReplies.js'

function withStorage(t, initial = {}) {
  const values = new Map(Object.entries(initial))
  globalThis.localStorage = {
    getItem: key => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  }
  t.after(() => { delete globalThis.localStorage })
  return values
}

function withFeedbackApi(t, overrides) {
  const original = { ...electronApi.feedback }
  Object.assign(electronApi.feedback, overrides)
  t.after(() => Object.assign(electronApi.feedback, original))
}

function storageValue(values, key) {
  return JSON.parse(values.get(key))
}

test('活跃集合为空时不发起反馈列表查询', async t => {
  withStorage(t)
  let listCalls = 0
  withFeedbackApi(t, { list: async () => { listCalls += 1; return { success: true, items: [] } } })
  setActivePinia(createPinia())
  const store = useFeedbackRepliesStore()
  await store.startupCheck({ notify: () => assert.fail('不应触发通知') })
  assert.equal(listCalls, 0)
  assert.equal(store.unreadCount, 0)
})

test('启动检查以管理员消息数差值识别未读并只通知一次', async t => {
  const values = withStorage(t, {
    'feedback.seen': JSON.stringify({ 'fb-a': 1, 'fb-b': 1 }),
    'feedback.active': JSON.stringify(['fb-a', 'fb-b', 'fb-gone'])
  })
  const listItems = [
    { id: 'fb-a', feedbackId: 'FBA', title: '海图识别失败', adminReplyCount: 2, lastMessageAuthor: 'admin' },
    { id: 'fb-b', feedbackId: 'FBB', title: '追问入库问题', adminReplyCount: 1, lastMessageAuthor: 'user' },
    { id: 'fb-new', feedbackId: 'FBN', title: '新反馈', adminReplyCount: 0, lastMessageAuthor: 'user' }
  ]
  let listCalls = 0
  withFeedbackApi(t, {
    list: async () => { listCalls += 1; return { success: true, items: listItems } }
  })
  setActivePinia(createPinia())
  const store = useFeedbackRepliesStore()
  const notified = []
  await Promise.all([
    store.startupCheck({ notify: items => notified.push(items) }),
    store.startupCheck({ notify: () => assert.fail('并发调用不应重复执行') })
  ])
  assert.equal(listCalls, 1, 'promise 去重后只查询一次')
  assert.deepEqual(store.unread.map(item => item.id), ['fb-a'], '玩家追问(fb-b)与新反馈(fb-new)不算未读')
  assert.equal(notified.length, 1)
  assert.equal(notified[0][0].title, '海图识别失败')
  assert.deepEqual(storageValue(values, 'feedback.active'), ['fb-a', 'fb-b'], '有未读与等待答复的保持活跃，列表外的 fb-gone 移出')
})

test('管理员最后发言且已读的反馈在查询后沉寂，下次启动不再查询', async t => {
  const values = withStorage(t, {
    'feedback.seen': JSON.stringify({ 'fb-a': 3 }),
    'feedback.active': JSON.stringify(['fb-a'])
  })
  let listCalls = 0
  withFeedbackApi(t, {
    list: async () => {
      listCalls += 1
      return { success: true, items: [{ id: 'fb-a', title: '已答复', adminReplyCount: 3, lastMessageAuthor: 'admin' }] }
    }
  })
  setActivePinia(createPinia())
  const store = useFeedbackRepliesStore()
  await store.startupCheck({ notify: () => {} })
  assert.equal(listCalls, 1)
  assert.deepEqual(storageValue(values, 'feedback.active'), [], '已读沉寂后活跃集合清空')
  await store.startupCheck()
  assert.equal(listCalls, 1, '沉寂反馈零查询')
})

test('markSeen 更新已见值、清零未读并按需收缩活跃集合', async t => {
  const values = withStorage(t, {
    'feedback.seen': JSON.stringify({}),
    'feedback.active': JSON.stringify(['fb-a', 'fb-b'])
  })
  setActivePinia(createPinia())
  const store = useFeedbackRepliesStore()
  store.unread.push({ id: 'fb-a', title: 'A' }, { id: 'fb-b', title: 'B' })
  store.markSeen('fb-a', 3)
  assert.deepEqual(storageValue(values, 'feedback.seen'), { 'fb-a': 3 })
  assert.deepEqual(store.unread.map(item => item.id), ['fb-b'])
  assert.deepEqual(storageValue(values, 'feedback.active'), ['fb-a', 'fb-b'], '未知最后发言方时保守保留活跃')
  store.markSeen('fb-a', 3, 'admin')
  assert.deepEqual(storageValue(values, 'feedback.active'), ['fb-b'], '管理员最后发言且已读则移出活跃集合')
  store.markSeen('fb-b', 3, 'user')
  assert.deepEqual(storageValue(values, 'feedback.active'), ['fb-b'], '等待答复的反馈保持活跃')
})

test('reactivate 使反馈恢复启动检查资格且去重', async t => {
  const values = withStorage(t, {
    'feedback.seen': JSON.stringify({ 'fb-a': 2 }),
    'feedback.active': JSON.stringify([])
  })
  setActivePinia(createPinia())
  const store = useFeedbackRepliesStore()
  store.reactivate('fb-a')
  store.reactivate('fb-a')
  assert.deepEqual(storageValue(values, 'feedback.active'), ['fb-a'])
})

test('registerSubmitted 写入零已见值并加入活跃集合', async t => {
  const values = withStorage(t)
  setActivePinia(createPinia())
  const store = useFeedbackRepliesStore()
  store.registerSubmitted('fb-new')
  assert.deepEqual(storageValue(values, 'feedback.seen'), { 'fb-new': 0 })
  assert.deepEqual(storageValue(values, 'feedback.active'), ['fb-new'])
})

test('查询失败或服务不可用时静默跳过且不通知', async t => {
  withStorage(t, { 'feedback.active': JSON.stringify(['fb-a']) })
  withFeedbackApi(t, { list: async () => { throw new Error('network down') } })
  setActivePinia(createPinia())
  const failingStore = useFeedbackRepliesStore()
  await failingStore.startupCheck({ notify: () => assert.fail('失败不应通知') })
  withFeedbackApi(t, { list: async () => ({ success: false, items: [], error: '不可用' }) })
  const unavailableStore = useFeedbackRepliesStore()
  await unavailableStore.startupCheck({ notify: () => assert.fail('不可用不应通知') })
})

test('损坏的本地 JSON 按空状态处理且不抛错', async t => {
  const values = withStorage(t, { 'feedback.active': '{oops', 'feedback.seen': '###' })
  let listCalls = 0
  withFeedbackApi(t, { list: async () => { listCalls += 1; return { success: true, items: [] } } })
  setActivePinia(createPinia())
  const store = useFeedbackRepliesStore()
  await store.startupCheck({ notify: () => assert.fail('不应触发通知') })
  assert.equal(listCalls, 0, '活跃集合损坏时视为空，跳过查询')
  assert.doesNotThrow(() => store.markSeen('fb-a', 1, 'admin'))
  assert.doesNotThrow(() => store.reactivate('fb-a'))
  assert.deepEqual(storageValue(values, 'feedback.active'), ['fb-a'])
})

test('反馈页在打开会话、提交成功、回复成功时接入未读状态 store', () => {
  const feedback = readFileSync(new URL('../src/domains/settings/FeedbackSettings.vue', import.meta.url), 'utf8')
  assert.match(feedback, /useFeedbackRepliesStore\(\)/)
  assert.match(feedback, /await loadConversation\(id\)[\s\S]*?markSeen\(id, listItem\?\.adminReplyCount, listItem\?\.lastMessageAuthor\)/)
  assert.match(feedback, /successId\.value = result\.feedbackId[\s\S]*?registerSubmitted\(result\.id\)/)
  assert.match(feedback, /reactivate\(selectedFeedbackId\.value\)/)
  const sidebar = readFileSync(new URL('../src/components/Layout/Sidebar.vue', import.meta.url), 'utf8')
  assert.match(sidebar, /feedback-reply-dot/)
  assert.match(sidebar, /feedbackRepliesStore\.unreadCount > 0/)
  assert.match(sidebar, /top: 6px;\s*\n\s*right: calc\(50% - 16px\)/)
  const mainRuntime = readFileSync(new URL('../src/startup/mainRuntime.js', import.meta.url), 'utf8')
  assert.match(mainRuntime, /useFeedbackRepliesStore\(\)\.startupCheck\(\{/)
  assert.match(mainRuntime, /ElNotification\(/)
  assert.match(mainRuntime, /query: \{ tab: 'feedback', feedbackId: items\[0\]\.id \}/)
})

test('通知点击可直达我的反馈并选中对应会话，未读红点分布在设置与反馈 tab 上', () => {
  const feedback = readFileSync(new URL('../src/domains/settings/FeedbackSettings.vue', import.meta.url), 'utf8')
  assert.match(feedback, /watch\(\(\) => route\.query\.feedbackId, \(id\) => \{ void focusFeedbackFromQuery\(id\) \}, \{ immediate: true \}\)/)
  assert.match(feedback, /activeView\.value = 'mine'[\s\S]*?await openConversation\(targetId\)/)
  assert.match(feedback, /mine-tab-label/)
  assert.match(feedback, /feedbackRepliesStore\.unreadCount > 0/)
  assert.match(feedback, /<h3 id="feedback-title">问题反馈<\/h3>/, '内部标题不挂红点')
  assert.match(feedback, /const pendingId = String\(route\.query\.feedbackId \|\| ''\)/, '列表就绪后兜底重试选中')
  const settingsView = readFileSync(new URL('../src/domains/settings/SettingsView.vue', import.meta.url), 'utf8')
  assert.match(settingsView, /feedback-tab-label/)
  assert.match(settingsView, /feedbackRepliesStore\.unreadCount > 0/)
  assert.match(settingsView, /feedback-unread-dot/)
})

async function withViteServer(t) {
  const { createServer } = await import('vite')
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
    ssr: { noExternal: ['element-plus'] }
  })
  t.after(() => server.close())
  return server
}

test('改动的 Vue 页面可被 Vite 正常转换', async t => {
  const server = await withViteServer(t)
  const [sidebar, feedbackSettings, settingsView] = await Promise.all([
    server.ssrLoadModule('/src/components/Layout/Sidebar.vue'),
    server.ssrLoadModule('/src/domains/settings/FeedbackSettings.vue'),
    server.ssrLoadModule('/src/domains/settings/SettingsView.vue')
  ])
  assert.ok(sidebar.default, 'Sidebar 转换失败')
  assert.ok(feedbackSettings.default, 'FeedbackSettings 转换失败')
  assert.ok(settingsView.default, 'SettingsView 转换失败')
})

test('挂载即携带 feedbackId query 时自动选中对应反馈（通知直达链路）', async t => {
  const server = await withViteServer(t)
  // ssrLoadModule 的模块实例与 node 直载实例不同，mock 必须打在 Vite 实例上。
  const { electronApi: viteApi } = await server.ssrLoadModule('/src/api/electron.js')
  const original = { ...viteApi.feedback }
  t.after(() => Object.assign(viteApi.feedback, original))
  let listCalls = 0
  const conversationCalls = []
  Object.assign(viteApi.feedback, {
    list: async () => {
      listCalls += 1
      return {
        success: true,
        items: [{ id: 'fb-9', feedbackId: 'FB9', title: '海图问题', adminReplyCount: 2, lastMessageAuthor: 'admin', replyState: 'replied' }]
      }
    },
    conversation: async id => {
      conversationCalls.push(String(id))
      return {
        success: true,
        conversation: {
          feedback: { id: 'fb-9', feedbackId: 'FB9', title: '海图问题', body: '描述', createdAt: '2026-01-01T00:00:00Z', attachments: [] },
          messages: [{ id: 'm1', authorRole: 'admin', body: '已修复', clientMessageId: 'cm1', createdAt: '2026-01-02T00:00:00Z', attachments: [] }]
        }
      }
    },
    onProgress: () => () => {},
    onReplyProgress: () => () => {},
    getPuzzleEvidenceSummary: async () => ({ success: true, evidence: null })
  })

  const [{ createSSRApp, h }, { createPinia, setActivePinia }, { createRouter, createMemoryHistory, RouterView }, { renderToString }] = await Promise.all([
    import('vue'),
    import('pinia'),
    import('vue-router'),
    import('@vue/server-renderer')
  ])
  const { default: FeedbackSettings } = await server.ssrLoadModule('/src/domains/settings/FeedbackSettings.vue')
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/settings', component: FeedbackSettings }]
  })
  await router.push('/settings?tab=feedback&feedbackId=fb-9')
  await router.isReady()
  const app = createSSRApp({ render: () => h(RouterView) })
  app.use(pinia)
  app.use(router)
  await renderToString(app)
  await new Promise(resolve => setTimeout(resolve, 50))
  assert.ok(listCalls >= 1, '应加载反馈列表')
  assert.deepEqual(conversationCalls, ['fb-9'], '应自动打开 query 指向的反馈会话')
})

test('无 feedbackId query 时挂载不自动打开会话', async t => {
  const server = await withViteServer(t)
  const { electronApi: viteApi } = await server.ssrLoadModule('/src/api/electron.js')
  const original = { ...viteApi.feedback }
  t.after(() => Object.assign(viteApi.feedback, original))
  const conversationCalls = []
  Object.assign(viteApi.feedback, {
    list: async () => ({ success: true, items: [] }),
    conversation: async id => { conversationCalls.push(String(id)); return { success: true, conversation: {} } },
    onProgress: () => () => {},
    onReplyProgress: () => () => {},
    getPuzzleEvidenceSummary: async () => ({ success: true, evidence: null })
  })
  const [{ createSSRApp, h }, { createPinia, setActivePinia }, { createRouter, createMemoryHistory, RouterView }, { renderToString }] = await Promise.all([
    import('vue'),
    import('pinia'),
    import('vue-router'),
    import('@vue/server-renderer')
  ])
  const { default: FeedbackSettings } = await server.ssrLoadModule('/src/domains/settings/FeedbackSettings.vue')
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/settings', component: FeedbackSettings }]
  })
  await router.push('/settings?tab=feedback')
  await router.isReady()
  const app = createSSRApp({ render: () => h(RouterView) })
  app.use(pinia)
  app.use(router)
  await renderToString(app)
  await new Promise(resolve => setTimeout(resolve, 50))
  assert.deepEqual(conversationCalls, [])
})
