# 移除补丁兼容模式

## Why

词缀补丁格式已稳定，补丁兼容模式（关闭目录联想与 T 级/物等拦截、强制关键词匹配、豁免未适配格式拦截）失去了存在场景，反而让用户在打了词缀补丁的环境下误用预测填充，导致关键词匹配失败。移除后语义回归唯一路径：目录词缀按模板匹配、自定义词条按关键词匹配，未适配格式一律停止制作。

## What Changes

- **BREAKING** 移除制作页三个页签（通用词缀制作、精华、花园工艺）的"补丁兼容模式"复选框及其问号说明；预设数据中的 `patchCompatible` 字段不再读取（normalize 时静默丢弃，无需迁移）。
- 移除编辑器降级分支：`AffixGoalEditor` / `AffixConditionRow` 恢复为仅"目录联想输入框 + 最低 T 级选择"单一形态。
- 移除运行时豁免：`matcher.js` 删除 `keywordOnly` 参数链；`python.js` 删除 `{{PATCH_COMPAT}}` 占位符与物等要求清空分支；`crafting_template.py` 未适配格式拦截恢复为无条件生效。
- **BREAKING** 打了词缀补丁时若复制格式未被适配，制作将停止并提示（原补丁兼容模式下会放行）。
- 制作页帮助抽屉新增主题"打了词缀补丁可以用吗？"，说明预测下拉框仅为辅助填写、实际匹配以输入框文字为准，打了补丁应直接输入文字而不要用预测填充。
- 修复"启用词缀制作"复选框在启用后文字消失的问题（标签恒显）。
- 删除未归档的 `openspec/changes/add-patch-compat-mode/` 变更目录及其关联测试。

## Capabilities

### New Capabilities

（无——补丁兼容模式的能力 spec 从未同步进主 specs，无需新建或删除能力。）

### Modified Capabilities

- `unadapted-affix-patch-guard`: "检测到未适配格式时停止制作并提示"要求明确为无条件生效，MUST NOT 提供任何豁免开关或降级匹配通道。
- `contextual-module-help`: 制作页帮助主题集合新增"打了词缀补丁可以用吗？"静态主题，内容覆盖预测下拉框的辅助定位与直接输入文字的正确用法。

## Impact

- 前端：`src/domains/items/components/ModuleTwo.vue`（补丁复选框、启用复选框标签修复）、`SpecializedCraftingPanel.vue`、`AffixGoalEditor.vue`、`AffixConditionRow.vue`
- 数据：`src/domains/items/affixConfig.js`、`src/utils/specializedCraftingPreset.js`
- 运行时：`src/utils/python.js`、`src/assets/scripts/crafting_template.py`、`electron/modules/item/matcher.js`、`electron/modules/ipc/file.js`
- 帮助：`src/domains/help/moduleBeginnerHelp.js`
- 测试：`test/itemAffixGroups.test.js`、`test/affixItemLevelGuard.test.js`、`test/itemCraftingInitialPreparation.test.js`、`test/stashTabSelection.test.js`
- OpenSpec：删除 `openspec/changes/add-patch-compat-mode/`
- 兼容性：旧预设文件中残留的 `patchCompatible` 字段被 normalize 丢弃，其余配置不受影响；自定义关键词词条的匹配与物等行为前后完全一致（本就不参与物等拦截）。
