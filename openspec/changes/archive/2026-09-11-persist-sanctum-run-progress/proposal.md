## Why

圣所可从中断房间继续，但应用重启会丢失内存中的推荐路线，并将保存的位置和资源隐藏为待确认，迫使用户重新采集。

## What Changes

- 保存最近一轮地图、状态、配套推荐路线及悬浮定位信息，启动后直接查看。
- 页面显示保存时间；游戏地图和显示环境匹配时恢复悬浮标记。
- 保留手动采集更新、重置清空、旧存档兼容和保存失败提示，不恢复自动操作或实时证据。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `sanctum-planning`: 保存与恢复配套路线及进度显示。
- `sanctum-recognition`: 重启恢复快照与悬浮定位，保持实时身份边界。

## Impact

涉及圣所 repository、service、Vue 页面及共享展示函数，沿用现有 IPC 和原子 JSON 存储，无新增依赖。
