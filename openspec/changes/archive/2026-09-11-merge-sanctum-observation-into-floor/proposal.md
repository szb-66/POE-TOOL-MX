## Why

圣所页面的「实际状态」与「楼层规划」共享同一份状态数据：实际状态里确认的资源、奖励账本和效果扫描会直接驱动主进程重新计算推荐路线。把两者拆成两个页签，用户每确认一次状态就要切页签核对路线变化，操作割裂；两者本就互为因果，适合放在同一页签内一起查看和操作。

## What Changes

- 移除「实际状态」独立页签，将 `SanctumRunObservation` 卡片内嵌到「楼层规划」页签中（地图与推荐路线布局之后、通栏展示）
- 页面从四个页签变为三个页签：楼层规划、圣物管理、设置
- 不改动 `SanctumRunObservation` 组件本身、Pinia store、IPC 与主进程状态合成——数据流保持现状

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `sanctum-planning`: 「圣所页面与浮窗」要求中的页签结构从"楼层规划、实际状态、圣物管理、设置四个页签"改为"楼层规划、圣物管理、设置三个页签，实际状态展示与校正内嵌于楼层规划页签"

## Impact

- `src/domains/sanctum/SanctumView.vue`：删除「实际状态」tab-pane，把 `SanctumRunObservation` 组件移入「楼层规划」pane
- 无 store、IPC、主进程改动；`SanctumRunObservation.vue` 原样复用
- `openspec/specs/sanctum-planning/spec.md` 的页签要求随 delta 同步更新
