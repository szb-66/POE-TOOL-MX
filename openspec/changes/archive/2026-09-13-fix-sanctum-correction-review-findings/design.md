## Context

见 proposal.md。liveDriver 允许已确认的空栏，重算却要求非零图标。渲染端仅使用记忆 revision；repository 每次保存通过 readEffectMemory 克隆历史。

## Goals / Non-Goals

修复三个审查问题；不修改识别流程、历史路线或自动输入。

## Decisions

- 删除重算非零图标限制，保留覆盖和失败检查。
- 在记忆层比较 action、entryId、词库快照，实现规范化原文的幂等保存。保留 Review 全部来源提交语义，避免丢失本次覆盖。
- 历史统一限最近 100 次，加载时先截断后克隆；有效规则及其证据独立保留。比单纯前端过滤更能覆盖管理及迁移入口。
- getState 在 structuredClone 之前投影为 revision，持久化仍使用完整服务内部状态。
- 页面整栏 issue 不提供纠正，保留重读。

## Risks / Trade-offs

- 最早的规则历史会被裁剪 → 当前规则和目标已有证据保留，测试验证保存加载及当前规则不受影响。
- IPC 状态仅含 revision → 已确认两个消费者都只读取 revision，规则管理继续按需加载。
