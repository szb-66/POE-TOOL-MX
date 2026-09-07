## Why
没有活动或最近结算地图时，自动入库成功事件被跳过，今日入库不更新。用户要求统计所有自动入库，同时保留地图追踪及入库采集开关。

## What Changes
- 独立按月保存自动入库事件，按堆叠数量统计今日及近期数据，完成通知等待统计落盘。
- **BREAKING** 取消地图归属和地图战绩入库字段；清除旧入库数据，不迁移，保留其他地图数据。
- 保留采集开关，取消统计专用模板校准；自动化安全预检保持。

## Capabilities
### New Capabilities
- `auto-stash-statistics`: 独立入库事件、幂等保存、统计与旧数据清理。
### Modified Capabilities
- `map-tracker`: 入库统计取消活动地图前提及地图归属。

## Impact
地图仓储、服务、自动入库 IPC、统计汇总、设置及完成提示；无新依赖，无独立导出功能。本变更取代 settle-map-on-exit 与 streamline-map-tracking 中入库关联地图的规则。
