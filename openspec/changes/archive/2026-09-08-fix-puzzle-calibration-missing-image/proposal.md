## Why

词缀应在自动识别阶段取得，形状失败不得影响词缀解析和保存。

## What Changes

- 移除菜单与校准后补读接口。
- 自动识别中针对词缀未知候选重试一次，独立保留形状与词缀解析结果。
- 保留真实原图约束，不从共享预览恢复。

## Capabilities

### New Capabilities

### Modified Capabilities

- `puzzle-local-calibration`: 自动识别完成词缀采集，校准仅保留词缀。

## Impact

海图服务、store、IPC 与校准界面；删除失败方案代码和测试。
