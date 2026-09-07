# Design

## Context

补丁兼容模式由未归档变更 `openspec/changes/add-patch-compat-mode/` 引入，贯穿五层：三个页签的复选框 UI、预设字段（`moduleTwo.patchCompatible` 与精华/花园工艺预设的 `patchCompatible`）、Python 脚本占位符 `{{PATCH_COMPAT}}`、主进程匹配器 `keywordOnly` 参数链、以及未适配格式拦截的豁免分支。该能力的 spec 从未同步进 `openspec/specs/`（主 spec `unadapted-affix-patch-guard` 保持无条件拦截），因此移除不涉及主 specs 回滚，只需删除未归档变更目录。

## Goals / Non-Goals

**Goals:**

- 删除补丁兼容模式的全部代码路径，`patchCompatible` / `PATCH_COMPAT` / `keywordOnly` 零残留
- 未适配格式拦截恢复无条件生效
- 制作页帮助新增词缀补丁 FAQ 主题（用户指定文案）
- 修复"启用词缀制作"复选框启用后标签消失

**Non-Goals:**

- 不做预设数据迁移：残留字段靠 normalize 丢弃
- 不改动词缀匹配的既有语义：目录词缀模板匹配 + 最低 T 级，自定义词条关键词包含匹配，均保持现状

## Decisions

1. **normalize 静默丢弃而非迁移**：`normalizeModuleTwo` / `normalizeSpecializedPreset` 删掉 `patchCompatible` 字段后，旧配置中的该键自然被忽略。单机配置、字段无派生数据，迁移脚本不值得。
2. **matcher 删除 `keywordOnly` 参数而非保留默认 false**：参数链只有补丁兼容一个调用方，保留死参数会误导后续维护。`conditionValue` / `matchCondition` / `matchAffixes` 签名一并还原。
3. **拦截条件直接删 `and not {{PATCH_COMPAT}}`**：`crafting_template.py:1467` 恢复为 `({{ENABLE_AFFIX}} or {{ENABLE_ELDRITCH}}) and result.get("affixFormatUnsupported")`，与 `unadapted-affix-patch-guard` 主 spec 一致。
4. **启用复选框标签恒显**：根因是 `<span v-if="!form.enabled">`，删除 `v-if` 即修复；不做动画或占位方案。
5. **帮助主题放 `moduleBeginnerHelp.js` 的 items 模块**：制作页抽屉主题来自 `MODULE_BEGINNER_TOPICS.items`，新增一个 `details('items', 'affix-patch', ...)` 条目即可，正文采用用户指定文案，末句提醒放 warning callout。

## Risks / Trade-offs

- [打了词缀补丁且格式未适配的用户升级后制作直接停止] → 帮助主题明确说明直接输入文字可用；停止提示文案本身已引导更新或反馈适配
- [曾开启补丁兼容的预设中有目录词条被用户当关键词用] → 目录词条保留 `keyword` 文本，模板匹配失败时用户可改输自定义文字；不自动转换词条类型
