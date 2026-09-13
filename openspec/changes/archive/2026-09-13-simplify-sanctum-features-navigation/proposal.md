## Why

精简圣所操作面，完整移除奖励账本、圣物管理与旧版自定义策略，使路线策略和识别校准直接可达。

## What Changes

- 顶层页签调整为楼层规划、路线策略、识别校准。
- **BREAKING** 删除账本与圣物管理的界面、专属采集、校准、IPC、持久化及计算链路。
- **BREAKING** 删除旧版策略及算法，旧配置重置为揭图收益；旧路线失效，保留兼容识别结果。
- 保留房间奖励、资源和效果识别、实战策略、截图收集及停止保护。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `sanctum-planning`: 页签、策略、计算输入及保存路线兼容。
- `sanctum-recognition`: 删除账本读取与圣物校准，保留资源和房间奖励识别。
- `sanctum-relic-management`: 移除全部管理能力。

## Impact

Vue 圣所页面、主进程服务与驱动、preload/IPC、共享状态与规则、存储迁移和回归测试。保留现有截图校准修改，仅开发版验证，不打包。
