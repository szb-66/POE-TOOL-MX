## Context

现有 target.effectGroup 保存原始解析，correction 保存单次整组词条及未知项处理。仓库将 floor 持久化但重读会替换 target。见 proposal.md。

## Goals / Non-Goals

**Goals:** 来源精确记忆、规则可编辑、当前重算、历史不改写。

**Non-Goals:** 不训练 OCR 模型，不模糊套用，不自动推断无原文的新增效果。

## Decisions

- 在 sanctum 存储中新增独立 effectCorrectionMemory，包含迁移标记、库修订、规则列表和版本变更记录。每条规则保存原文、动作、目标词条快照、版本和时间；重置本轮保留该字段。
- 匹配键仅对全半角字符区域做 NFKC，并移除空白，其他兼容字符（如圈号数字）保持原样；按连续完整 OCR 片段精确匹配，较长匹配优先，不跨奖励行，不在生成的替换文字上递归应用规则。效果增减和排序不影响其他片段的规则。
- 记忆处理原始效果文字，再沿用既有解析器；目标保存原始 effectGroup 与应用规则快照、处理后的 group，截图原文不变。永久规则变更从原文重做，保留无关的仅本次修正。
- getEffectReview 提供原文来源及对应处理；correctEffectTarget 新增 sourceEdits、addedEntryIds、remember 和 memoryRevision，仍兼容旧 entryIds/resolutions。替换及删除绑定来源，新增词条没有来源时仅本次。
- 已读来源也可编辑；固定规则管理弹窗通过 getEffectCorrectionRules、updateEffectCorrectionRule、deleteEffectCorrectionRule 管理。规则更新检查库和规则版本，核对窗口提交检查库版本。
- 永久规则变更同时更新当前有效 floor、driver 账本和路线。仅本次源覆盖优先；已保存的历史 floor 与路线不重算。规则修改在采集中禁用，避免一轮混用规则版本。
- 旧迁移仅导入原始 unknown 对应的明确 replace/ignore，按照记录时间处理同原文冲突；迁移标记确保删除后不复活。旧整组增删保留旧单次结果。
- 词条 ID、名称、描述、kind、tier 快照不再一致时规则停用；仍可在管理中重新选择并保存。
- 规则及版本记录保存核对时的来源绑定和原始 OCR；证据存储按这些绑定保留独立浮窗截图，避免重读或重置清除长期规则的来源。管理弹窗可按需查看原始来源，无法取图时明确报错。

## Risks / Trade-offs

- 错标长期传播 → 规则来源、版本可查，随时改删，删除恢复原文普通识别。
- 数字误套用 → 保留全部数字、标点，仅统一全半角和空白。
- 历史重算污染 → 服务仅在当前 identityConfirmed 且位置绑定一致时重算，不改历史记录。
- 旧来源不充分 → 不猜测，界面保留历史核对与管理入口。

## Migration Plan

可选顶层字段，不改变存储版本；一次性迁移可确证的旧处理，当前运行不触发游戏输入。
