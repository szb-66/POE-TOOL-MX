## Why

v1.9.1 的两个 Windows 工作流均在分发清单检查失败：校验要求 RapidOCR 的 `.gitkeep`，但打包器默认排除此占位文件。

## What Changes

- 对齐运行时清单与打包器默认排除规则，保留必要文件缺失与冗余检查。
- 增加覆盖占位文件的回归测试，恢复 v1.9.1 发布。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

无。仅修正发布工具的清单计算，现有运行时完整性要求不变，使用 skip_specs。

## Impact

scripts/runtime/distribution.js、分发过滤测试、GitHub v1.9.1 发布与 CNB 镜像。
