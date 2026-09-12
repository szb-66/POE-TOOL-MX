## Context

见 proposal.md。解析结果按类别合并会失去单浮窗来源，原始目标仍保存 OCR 与证据。服务保存 floor 并通过 currentEffects 评估路线。

## Goals / Non-Goals

**Goals:** 在来源级保存解析及修正，支持可追溯的效果纠正和即时重算。

**Non-Goals:** 不修改截图裁剪，不允许任意计算规则输入，不修改奖励纠正流程。

## Decisions

- 精确楼层上下文过滤发生于效果匹配前；效果精确身份优先，原始 texts 不变。
- 目标保存 effectGroup 与独立 correction（entryIds、逐未知项处理、版本、时间）；旧目标由原文重新解析。用户可将未知项映射至词条或排除，未处理项保留。
- 新增只读 getEffectReview(binding) 返回原始结果、当前修正与词库选项；correctEffectTarget(binding, correction) 提交修改，binding 含 observationKey、runId、floorId、targetId、evidenceId、correctionRevision。主进程校验当前位置、采集状态、证据和修订版本，再按词库生成效果。
- 从全部目标重新合并效果，保留房间来源增量；同步 liveDriver 账本、floor、currentEffects，重新计算并持久化。
- 弹窗由页面统一持有，问题列表与状态卡片发出来源选择；复用 SanctumRecognitionImage，截图缺失仍明确反馈。取消仅丢弃本地草稿。
- 新证据自动没有旧 correction；失败通过既有 previousCapture 保留历史修正，历史不可编辑。

## Risks / Trade-offs

- 错误人工输入 → 仅允许词库 ID，明确展示描述与人工标记，未支持规则继续未知。
- 旧目标缺少定位状态 → 从既有失败信息保守推断，不把采集失败转为完整。
- 多窗口或旧弹窗 → 位置、证据与修订版本联合校验。

## Migration Plan

新增可选字段，无存储版本迁移；旧记录可查看，重新采集后获得当前证据。
