## Why

空类别错误地依赖全部浮窗识别成功，同一失败又从分类和采集目标重复输出，且无法关联具体浮窗。本变更承接已归档的 complete-sanctum-state-evaluation，落实用户确认的修复方案。

## What Changes

- 采集结束按已读取条目分类，空类别显示无；采集完整性独立保留。
- 失败关联具体入口、截图和阶段，合并同源重复错误，显示未匹配原文。
- 错误与截图统一名称和入口序号，兼容旧记录。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `sanctum-recognition`: 修正读取完成状态、空类别及缺口明细语义。

## Impact

共享效果聚合、状态浮窗解析、实时驱动和状态展示；内部兼容增加来源字段，无新依赖。开发版验证，不打包。
