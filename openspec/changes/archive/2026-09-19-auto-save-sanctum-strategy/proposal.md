## Why

圣所路线策略目前只更新组件草稿，必须点击保存才能生效，切换页面可能丢失修改。用户希望修改后自动保存。

## What Changes

- 所有策略编辑自动保存，移除手动保存按钮。
- store 管理草稿与串行保存队列，合并保存期间的新修改，避免旧响应覆盖编辑。
- 显示保存状态，失败保留草稿并支持重试。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `sanctum-planning`: 路线策略自动保存及失败恢复。

## Impact

涉及圣所策略组件、Pinia store 和相关测试；复用 saveStrategy IPC、配置格式及停止采集和重新计算行为，无新增依赖。
