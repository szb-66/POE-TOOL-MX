## Why

游戏断线日志被忽略，离开地图后仍需等下一张地图才能结算，造成时间和历史显示滞后。

## What Changes

- 分离日志监听与游戏连接状态，断线和进程退出立即结算并撤销旧命令。
- 离图立即落盘，同角色同实例再次进入复用记录；附属区域仍属于原地图。
- 去掉当前地图战利品展示，保留历史、统计、导出与回城入库归属。

## Capabilities

### New Capabilities

### Modified Capabilities

- `client-log-events`: 增加游戏状态事件与进程退出补充检测。
- `map-tracker`: 即时结算、实例合并、异步采样隔离及当前战利品展示调整。

## Impact

影响 ClientEvents、MapTracker 状态机、命令与采样、快照和设置/地图界面。无新增依赖，不打包。
