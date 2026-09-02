import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createPinia, setActivePinia } from 'pinia'
import { createServer } from 'vite'

function readFunctionBody(source, functionName) {
  const match = source.match(new RegExp(`function ${functionName}\\([^)]*\\) \\{([\\s\\S]*?)\\n\\}`))
  assert.ok(match, `缺少函数 ${functionName}`)
  return match[1]
}

test('物品词缀界面提供多组合、全库联想、自由关键词和最低 T 编辑', async () => {
  const [moduleTwo, goalEditor, conditionRow, preload, api, fileIpc, runtime] = await Promise.all([
    readFile('src/domains/items/components/ModuleTwo.vue', 'utf8'),
    readFile('src/domains/items/components/AffixGoalEditor.vue', 'utf8'),
    readFile('src/domains/items/components/AffixConditionRow.vue', 'utf8'),
    readFile('electron/preload.cjs', 'utf8'),
    readFile('src/api/electron.js', 'utf8'),
    readFile('electron/modules/ipc/file.js', 'utf8'),
    readFile('src/utils/python.js', 'utf8')
  ])

  const view = `${moduleTwo}\n${goalEditor}\n${conditionRow}`
  for (const text of [
    'form.affixGroups',
    '新增达标组合',
    'duplicateGroup',
    'removeGroup',
    'collapsedGroupIds',
    'toggleGroupCollapse',
    'isGroupCollapsed',
    'aria-label',
    'aria-expanded',
    'aria-controls',
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
  assert.match(goalEditor, /v-if="!isGroupCollapsed\(group\.id\)"/)
  const headerGroups = goalEditor.match(/<div class="group-title">([\s\S]*?)<\/div>\s*<div class="group-actions">([\s\S]*?)<\/div>\s*<\/header>/)
  assert.ok(headerGroups, '组合标题栏应包含左右两个操作区')
  assert.match(headerGroups[1], /duplicateGroup\(groupIndex\)/)
  assert.match(headerGroups[1], /removeGroup\(groupIndex\)/)
  assert.doesNotMatch(headerGroups[1], /toggleGroupCollapse/)
  assert.match(headerGroups[2], /toggleGroupCollapse\(group\.id\)/)
  assert.doesNotMatch(headerGroups[2], /duplicateGroup|removeGroup/)
  assert.match(goalEditor, /\.group-title :deep\(\.el-button \+ \.el-button\) \{\s*margin-left: 0;/)
  assert.match(preload, /searchCraftingAffixSuggestions/)
  assert.match(api, /searchAffixSuggestions/)
  assert.match(fileIpc, /matchedGroupName/)
  assert.match(fileIpc, /affixGroupResults/)
  assert.match(runtime, /命中组合/)
})

test('达标组合折叠保持为独立界面状态', async () => {
  const source = await readFile('src/domains/items/components/AffixGoalEditor.vue', 'utf8')
  const toggleBody = readFunctionBody(source, 'toggleGroupCollapse')
  const forgetBody = readFunctionBody(source, 'forgetGroupCollapse')
  const addBody = readFunctionBody(source, 'addGroup')
  const duplicateBody = readFunctionBody(source, 'duplicateGroup')
  const removeBody = readFunctionBody(source, 'removeGroup')

  assert.match(toggleBody, /new Set\(collapsedGroupIds\.value\)/)
  assert.doesNotMatch(toggleBody, /\bform\b|commit\(|updateCurrentItemPreset/)
  assert.doesNotMatch(forgetBody, /\bform\b|commit\(|updateCurrentItemPreset/)
  assert.doesNotMatch(addBody, /collapsedGroupIds|toggleGroupCollapse/)
  assert.doesNotMatch(duplicateBody, /collapsedGroupIds|toggleGroupCollapse/)
  assert.match(removeBody, /forgetGroupCollapse\(removedGroup\?\.id\)/)
  assert.match(removeBody, /commit\(\)/)
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

    const html = await renderToString(app)

    assert.equal(warnings.some((message) => message.includes('invoked outside of the render function')), false, warnings.join('\n'))
    assert.match(html, /aria-expanded="true"/)
    assert.match(html, /收起(?:<!--.*?-->)*<\/span>/)
    assert.match(html, /class="affix-columns"/)
    assert.match(html, /必选词缀/)
  } finally {
    await server.close()
  }
})
