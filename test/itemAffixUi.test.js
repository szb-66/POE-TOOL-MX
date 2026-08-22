import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createPinia, setActivePinia } from 'pinia'
import { createServer } from 'vite'

test('物品词缀界面提供多组合、全库联想、自由关键词和最低 T 编辑', async () => {
  const [moduleTwo, conditionRow, preload, api, fileIpc, runtime] = await Promise.all([
    readFile('src/domains/items/components/ModuleTwo.vue', 'utf8'),
    readFile('src/domains/items/components/AffixConditionRow.vue', 'utf8'),
    readFile('electron/preload.cjs', 'utf8'),
    readFile('src/api/electron.js', 'utf8'),
    readFile('electron/modules/ipc/file.js', 'utf8'),
    readFile('src/utils/python.js', 'utf8')
  ])

  const view = `${moduleTwo}\n${conditionRow}`
  for (const text of [
    'form.affixGroups',
    '新增达标组合',
    'duplicateGroup',
    'removeGroup',
    '必选词缀',
    '挑选词缀',
    'fetchSuggestions',
    'searchAffixSuggestions',
    'affix-suggestion-popper',
    'affix-tier-popper',
    'overflow-y: auto',
    'el-autocomplete-suggestion li:hover',
    'el-select-dropdown__item:hover',
    '不限 T',
    '最低 T'
  ]) assert.match(view, new RegExp(text))
  assert.match(preload, /searchCraftingAffixSuggestions/)
  assert.match(api, /searchAffixSuggestions/)
  assert.match(fileIpc, /matchedGroupName/)
  assert.match(fileIpc, /affixGroupResults/)
  assert.match(runtime, /命中组合/)
})

test('词缀 T 级选择器不在渲染函数外调用插槽', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
    ssr: { noExternal: ['element-plus'] }
  })
  try {
    const [{ default: ModuleTwo }, { usePresetStore }, { ID_INJECTION_KEY }, { ZINDEX_INJECTION_KEY }] = await Promise.all([
      server.ssrLoadModule('/src/domains/items/components/ModuleTwo.vue'),
      server.ssrLoadModule('/src/stores/preset.js'),
      server.ssrLoadModule('/node_modules/element-plus/es/hooks/use-id/index.mjs'),
      server.ssrLoadModule('/node_modules/element-plus/es/hooks/use-z-index/index.mjs')
    ])
    const pinia = createPinia()
    setActivePinia(pinia)
    const presetStore = usePresetStore()
    presetStore.currentItemPreset.moduleTwo.affixGroups[0].selectedAffixes.push({
      id: 'condition_slot_regression',
      kind: 'keyword',
      keyword: '生命',
      displayName: '生命',
      effectPattern: '',
      source: '',
      sourceLabel: '',
      profileId: '',
      applicableLabel: '',
      minTier: 1,
      tiers: [{ tier: 1, name: 'T1' }]
    })

    const warnings = []
    const app = createSSRApp(ModuleTwo)
    app.use(pinia)
    app.provide(ID_INJECTION_KEY, { prefix: 1024, current: 0 })
    app.provide(ZINDEX_INJECTION_KEY, { current: 0 })
    app.config.warnHandler = (message) => warnings.push(message)

    await renderToString(app)

    assert.equal(warnings.some((message) => message.includes('invoked outside of the render function')), false, warnings.join('\n'))
  } finally {
    await server.close()
  }
})
