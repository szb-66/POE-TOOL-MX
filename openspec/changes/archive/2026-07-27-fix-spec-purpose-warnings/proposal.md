## Why

全仓严格校验目前因 33 个历史主规格的 Purpose 过短而失败，导致 `openspec validate --all --strict` 无法作为可靠的仓库质量门禁。需要为这些规格补充准确、可读且满足长度要求的用途说明，同时保持既有需求与场景语义不变。

## What Changes

- 盘点严格校验报告的全部 Purpose 过短警告，并逐项定位对应主规格。
- 根据每份规格现有 Requirements 编写不少于校验阈值的准确 Purpose，避免通用占位文本。
- 只修改 Purpose 元数据，不改变既有 Requirement、Scenario 或能力行为。
- 以全仓 `openspec validate --all --strict` 零警告、零错误作为完成门禁。

## Capabilities

### New Capabilities

- `spec-documentation-quality`: 定义主规格 Purpose 必须准确、充分并通过全仓严格校验的仓库文档质量契约；该能力不改变产品运行时行为。

### Modified Capabilities

无。本变更不修改任何现有产品能力的行为需求。

## Impact

- 影响范围限定为 `openspec/specs/*/spec.md` 中校验失败的 Purpose 段落，以及本变更自身的规划工件。
- 不影响运行时代码、API、依赖、数据格式或用户可见功能。
- 严格校验将恢复为全仓可通过的文档质量门禁。
