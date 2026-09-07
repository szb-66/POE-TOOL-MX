## Context

当前 `PuzzleView.rotateSlot` 使用角度加 90 度实现右键旋转；`updateSlotOrientation` 每次都调用完整 `recompute()`。实测在部分无解库存组合下 `solvePuzzle` 会阻塞主线程 3.5–5.5 秒，导致右键明显卡顿。

## Goals / Non-Goals

**Goals:**
- 右键按逆时针旋转且立即响应。
- 待确认与已拼入海图来源格有清晰视觉区分。

**Non-Goals:**
- 不优化求解器本身的耗时（方向修正不触发求解即可消除本次卡顿）。
- 不改变自动放置脚本的旋转方向。

## Decisions

- **逆时针旋转**：`rotateSlot` 改为 `slot.orientation - step`，交给现有 `normalizePuzzleOrientation` 处理负角度和直线/十字对称性。
- **轻量来源刷新**：store 新增 `refreshSourceAssignments()`，仅对当前 `result.solutions[solutionIndex]` 调用 `assignSourceSlots` 并回写 `sourceSlots`；`updateSlotOrientation` 调用它而不是 `recompute()`。类型/占用修改仍调用 `recompute()`。
- **待确认样式**：`.inventory-slot.uncertain` 使用橙色虚线边框、比原底色再提亮且无饱和度的灰色背景和左下角“?”角标，避免与右上角已修正圆点、左上角来源序号、右下角方向角标冲突。
- **选中样式**：`.inventory-slot.selected` 保留原暗色背景，仅把边框改为主题蓝 `var(--el-color-primary)` 的 5px 描边；`.source-index` 使用同一主题蓝编号徽章。两种样式通过独立 class 叠加。
- **测试**：以源码断言为主，覆盖旋转方向、轻量刷新路径、样式规则；全量测试与构建回归。

## Risks / Trade-offs

- [视觉样式过重影响识别内容] → 保持碎片 glyph 居中，角标与徽章都放在边缘小尺寸区域。
- [仅刷新来源分配导致来源选择变化] → 这是期望行为：手动修正后该格置信度提升，可能优先成为方案来源。

## Migration Plan

- 无持久化结构变化，无需数据迁移。
- 开发版验证通过后按仓库流程打包；本次不打包。
