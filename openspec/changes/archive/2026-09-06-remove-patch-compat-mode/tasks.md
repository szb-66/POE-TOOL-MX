## 1. OpenSpec 清理

- [x] 1.1 删除未归档变更目录 `openspec/changes/add-patch-compat-mode/`

## 2. UI 层移除

- [x] 2.1 `src/domains/items/components/ModuleTwo.vue`：删除"补丁兼容模式"复选框与问号 tooltip（含 `QuestionFilled` import）、`AffixGoalEditor` 的 `:patch-compatible` 传参；同时删除"启用词缀制作"标签上的 `<span v-if="!form.enabled">` 使文字恒显
- [x] 2.2 `src/domains/items/components/SpecializedCraftingPanel.vue`：删除 `.patch-compat-row` 区块、`updatePatchCompatible` 函数、`QuestionFilled` import、`:patch-compatible` 传参及 `.patch-compat-row` / `.patch-help` 样式
- [x] 2.3 `src/domains/items/components/AffixGoalEditor.vue`：删除 `patchCompatible` prop、物等标签的 `v-if="!patchCompatible"`、行级 `:patch-compatible` 传参、`:deep(.affix-condition-row.is-patch)` 样式
- [x] 2.4 `src/domains/items/components/AffixConditionRow.vue`：删除 `patchCompatible` prop、`is-patch` class、补丁模式纯文本输入分支，恢复为无条件 autocomplete + T 级选择

## 3. 数据层移除

- [x] 3.1 `src/domains/items/affixConfig.js`：`normalizeModuleTwo` 删除 `patchCompatible` 字段
- [x] 3.2 `src/utils/specializedCraftingPreset.js`：`normalizeSpecializedPreset` 与 `specializedPresetToExecutionPreset` 删除 `patchCompatible`

## 4. 运行时移除

- [x] 4.1 `src/utils/python.js`：删除 `patchCompatEnabled` 分支使物等要求无条件计算；删除 `'{{PATCH_COMPAT}}'` 占位符映射
- [x] 4.2 `src/assets/scripts/crafting_template.py`：未适配格式拦截条件删除 `and not {{PATCH_COMPAT}}`
- [x] 4.3 `electron/modules/item/matcher.js`：`conditionValue` / `matchCondition` / `matchAffixes` 删除 `keywordOnly` 参数链
- [x] 4.4 `electron/modules/ipc/file.js`：删除 `keywordOnly` 计算与传参

## 5. 测试更新

- [x] 5.1 `test/itemAffixGroups.test.js`：删除"补丁兼容模式随模块与专业预设持久化且默认关闭"与"补丁兼容模式开启时目录词缀按关键词命中并忽略 T 级"两个测试，并清理因此不再使用的 import
- [x] 5.2 `test/affixItemLevelGuard.test.js`：删除"补丁兼容模式清空物等要求并放行未适配格式拦截"测试
- [x] 5.3 `test/itemCraftingInitialPreparation.test.js`：`substitute` 删除 `patchCompat` 参数与 `{{PATCH_COMPAT}}` 替换，删除 `patchPassthrough` 断言
- [x] 5.4 `test/stashTabSelection.test.js`：占位符映射删除 `PATCH_COMPAT: 'False'`

## 6. 帮助内容

- [x] 6.1 `src/domains/help/moduleBeginnerHelp.js`：items 模块新增 `details('items', 'affix-patch', '打了词缀补丁可以用吗？', ...)` 主题，正文包含：可以用；词缀预测下拉框为辅助填写功能，实际匹配以输入框内的文字为准，没有预测选项不影响匹配，文字对得上就行；warning callout：有词缀补丁不要用预测填充，直接输入文字就行，不然会出现匹配不到关键词的情况

## 7. 验证

- [x] 7.1 `grep -r "patchCompatible|PATCH_COMPAT|keywordOnly" src electron test` 零残留
- [x] 7.2 运行 `node --test test/itemAffixGroups.test.js test/affixItemLevelGuard.test.js test/itemCraftingInitialPreparation.test.js test/stashTabSelection.test.js test/helpContent.test.js`
- [x] 7.3 运行 `npm test` 全量通过
- [x] 7.4 `openspec validate remove-patch-compat-mode --strict` 通过
