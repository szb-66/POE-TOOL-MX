## Why

今日刷图不再需要经验统计，移除界面及后台采样可简化数据链路。

## What Changes

- 删除今日经验、历史经验列、等级收益系数及采样计算代码。
- **BREAKING** 删除经验快照、配置和 CSV 字段；读取含经验字段的历史记录时跳过整条记录。
- 保留计时、地图身份、死亡、传送门和独立入库。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `map-tracker`: 全面移除经验功能，首页改为三个统计指标。

## Impact

影响刷图 Vue 页面、Electron 服务与仓库、共享统计、角色查询辅助、测试及地图规范；不新增依赖。
