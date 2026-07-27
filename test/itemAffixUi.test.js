import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('物品词缀界面提供多组合、全库联想、自由关键词和最低 T 编辑', async () => {
  const [view, preload, api, fileIpc, runtime] = await Promise.all([
    readFile('src/domains/items/components/ModuleTwo.vue', 'utf8'),
    readFile('electron/preload.cjs', 'utf8'),
    readFile('src/api/electron.js', 'utf8'),
    readFile('electron/modules/ipc/file.js', 'utf8'),
    readFile('src/utils/python.js', 'utf8')
  ])

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
