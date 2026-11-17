import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { createSSRApp, h } from 'vue'
import { createPinia } from 'pinia'
import { renderToString } from '@vue/server-renderer'
import { PriceCheckService } from '../electron/modules/priceCheck/service.js'

const catalog = JSON.parse(readFileSync(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url)))
const entries = JSON.parse(readFileSync(new URL('./fixtures/price-check-game-text-entries.json', import.meta.url)))
const itemText = (language) => ({
  cn: '物品类别: 头部\n稀有度: 传奇\n节庆之面\n--------\n闪避值: 80\n能量护盾: 18\n--------\n物品等级: 84\n--------\n未鉴定',
  tw: '物品種類: 頭部\n稀有度: 傳奇\n節慶之面\n--------\n閃避值: 80\n能量護盾: 18\n--------\n物品等級: 84\n--------\n未鑑定',
  en: 'Item Class: Helmets\nRarity: Unique\nFestival Mask\n--------\nEvasion Rating: 80\nEnergy Shield: 18\n--------\nItem Level: 84\n--------\nUnidentified'
})[language]

function fixture() {
  const searches = []
  const service = new PriceCheckService({ auth: { getStatus: () => ({ authenticated: true }) },
    client: { server: { id: 'international', label: '国际服' }, clearCache() {},
      search: async (league, query) => { searches.push(query); return { id: 'fixture', total: 0, result: [] } },
      fetch: async () => ({ result: [] }) },
    catalog, manualInputOnly: true, localizationProvider: () => entries })
  return { service, searches }
}

test('简繁英文未鉴定传奇的实际浮层显示随原文变化，官方身份与候选选择保持英文', async t => {
  const vite = await createServer({ configFile: false, plugins: [vue()],
    optimizeDeps: { noDiscovery: true, include: [] },
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  t.after(() => vite.close())
  const { default: Overlay } = await vite.ssrLoadModule('/src/domains/priceCheck/PriceCheckOverlayView.vue')
  for (const language of ['cn', 'tw', 'en']) {
    const { service, searches } = fixture()
    const first = await service.check({ league: 'Covens', text: itemText(language) })
    assert.equal(first.model.presentation.language, language)
    assert.equal(first.model.identityResolution.required, true)
    const app = createSSRApp(Overlay, {
      previewMode: true, previewState: { ...first, status: 'identity-required' }
    }).use(createPinia())
    for (const name of ['el-icon', 'el-select', 'el-option', 'el-input-number']) {
      app.component(name, { render() { return h('div', this.$slots.default?.()) } })
    }
    const html = await renderToString(app)
    const names = language === 'cn' ? ['节庆之面', '共鸣之面', '共鸣之面【仿品】', '能量护盾']
      : language === 'tw' ? ['節慶之面', '共鳴之面', '贗品．共鳴之面', '能量護盾']
        : ['Festival Mask', 'Leer Cast', 'Replica Leer Cast', 'Energy Shield', 'Helmets', 'Unique']
    for (const name of names) assert.ok(html.includes(name), `${language} missing ${name}`)
    if (language !== 'en') assert.doesNotMatch(html, /(?:>|alt=")\s*(?:Festival Mask|Replica Leer Cast|Leer Cast)\s*(?:<|")/)
    const candidate = first.model.identityResolution.candidates.find(c => c.name === 'Replica Leer Cast')
    const selected = await service.resolveIdentity(candidate.key)
    assert.equal(selected.model.identity.name, 'Replica Leer Cast')
    assert.equal(selected.model.presentation.texts['Replica Leer Cast'], names[2])
    const retry = await service.rerun({ model: selected.model })
    assert.equal(retry.model.presentation.language, language)
    assert.equal(retry.model.presentation.texts['Replica Leer Cast'], names[2])
    assert.equal(searches[0].query.name, 'Replica Leer Cast')
    assert.equal(searches[0].query.type, 'Festival Mask')
  }
})
