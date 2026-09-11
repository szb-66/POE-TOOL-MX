# 设计：效果沿路径传播

## Context

两套规划器已接收起点效果并参与评分，但推演语义不一致（详见 proposal）：

- `practicalPlanner.js:73` 用起点效果一次性构建 `facts` 知识表，全路径共享；`legal()` 的禁选判定同样只读静态表。路径中途获得的 `roomsHidden`/`rewardsHidden`/`afflictionsHidden`/`typesHidden` 及免疫/转换类效果不影响后续房间。
- `planner.js:91`（旧版自定义策略）进入房间时只把 `trigger==='entry'` 效果并入传播集，`completion` 效果被丢弃；而 `applySanctumEffects` 及实战策略均支持完成类规则（`resolveLossCountdown`、`completionResolveLossPercent`、`endsOnResolveLoss`）。

旧版 `planner.js:85` 已具备正确的逐节点动态知识计算范式（`knownRoom(rooms.get(id), floor, applySanctumEffects(inheritedEffects))`），可直接对齐。

## Goals / Non-Goals

**Goals:**
- 实战策略：房间知识与合法判定改为按路径累积效果逐节点计算
- 旧版策略：completion 效果在本房间评分后并入向后传播集
- 两套策略传播语义一致；测试断言效果实际改变推荐结果

**Non-Goals:**
- `visionColumns`/`extraRevealedRooms`/`fullMapRevealed` 对可选范围的影响（spec 刻意边界，主 spec 已声明"不把额外房间换算成列"）
- 状态栏当前效果的识别链路（`liveDriver`、`effectRecognition`）——已验证链路完整
- 调用方签名变化（`service.js`、`state.js`、`previewLoadout` 不动）

## Decisions

1. **删除静态 `facts`，循环内按 `before` 效果计算 `knownRoom`**（实战策略）
   进入房间前的效果状态（`state.effects`，行 94 已算 `before = applySanctumEffects(state.effects)`）决定该房间哪些字段可见——效果在获得前不改变后续房间认知，语义与旧版一致。替代方案（增量缓存每条路径的知识表）复杂度不值当：`knownRoom` 每节点 8 字段遍历，`maxPaths` 封顶 100k，可接受。
   注意：`legal(id, fx = active)` 增加默认参数即可保持既有调用点行为；后继过滤（行 164-165）、`reach`、`pendingRouteTargets`、行 177 尾部启发显式传当前路径效果。起点行 74 的 `legal` 闭包仍可用于 `reach` 默认场景。

2. **旧版传播集拆分：评分用 entry，转发用 entry + completion**（旧版策略）
   本房间 `scoreRoom` 仍用 `effective`（仅 entry 效果，完成类效果不应作用于未完成的房间自身）；`stack.push` 携带的效果改为 `[...activeEffects, ...completion]`。与 `practicalPlanner.js:161` 语义对齐。hidden 知识下 `room.effects` 已被删除（行 87），无需额外过滤。

3. **测试先行验证"效果改变结果"**
   实战策略用例：中途房间带已确认 `afflictionsHidden`（entry 触发）→ 断言其后房间的痛苦不计入风险/禁选（missing 提示"被效果隐藏"）；同图去掉该效果 → 推荐结果不同。旧版用例：房间带 completion 触发的 `resolveLossCountdown` 类效果 → 断言下一房推演出现对应坚毅损失/风险标记。

## Risks / Trade-offs

- [逐节点 `knownRoom` 增加 CPU 开销] → `maxPaths` 已封顶搜索规模；旧版策略本就逐节点计算，无回归风险
- [隐藏效果使推荐路线的收益普遍下降，现有测试可能依赖旧行为] → 先跑全量 sanctum 测试定位受影响断言，逐个按新语义修正而非放宽
- [`legal` 签名变更遗漏调用点] → 默认参数兜底为起点效果，行为仅对显式传参的调用点变化；全库 grep `legal(` 核对

## Migration Plan

纯内部推演修正，无数据迁移、无 API 变更。回滚即还原两个文件。
