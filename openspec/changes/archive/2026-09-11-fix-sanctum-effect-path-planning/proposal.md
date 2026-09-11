# 修复圣所效果未正确参与路径计算

## Why

当前效果已传入圣所路线推荐（`service.js` 的 `recalculate`/`acceptSanctumFloor` 均传入 `[...currentEffects, ...equipped]`），但两套策略存在推演缺口：默认实战策略（reveal/quantity）的房间知识表用起点效果一次性构建，路径中途获得的隐藏/免疫类效果不影响后续房间的可见性与禁选判定；旧版自定义策略只传播 `entry` 触发效果，`completion` 触发的房间效果（如完成后失去坚毅）在推演中完全不生效。两套策略行为不一致，用户无法确信识别到的效果改变了推荐结果。

## What Changes

- `practicalPlanner.js`：房间知识（`knownRoom`）与合法判定（`legal`）从静态起点效果表改为按路径累积效果逐节点计算，对齐旧版 `planner.js` 的逐节点语义；后继过滤、`reach`、`pendingRouteTargets` 及尾部启发传入当前路径效果
- `planner.js`（旧版）：本房间评分仍用 `entry` 效果，向后传播的效果集合并入本房间 `completion` 触发效果（对齐 `practicalPlanner.js` 语义）
- 补充测试：中途获得隐藏效果改变后续房间评估；completion 效果在旧版策略传播到下一房评分

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `sanctum-planning`：效果沿路径传播语义——路径中途获得的已确认效果 SHALL 影响后续房间的知识隐藏、禁选/免疫判定与风险收益评估；`completion` 触发效果在旧版自定义策略中同样参与推演

## Impact

- 代码：`electron/modules/sanctum/practicalPlanner.js`、`electron/modules/sanctum/planner.js`
- 测试：`test/sanctumPractical.test.js`、`test/sanctumPlanner.test.js`
- 行为变化：仅推荐计算的内部推演更准确，输入输出结构不变；已传效果的调用链（`service.js`、`state.js`、`previewLoadout`）无需改动
