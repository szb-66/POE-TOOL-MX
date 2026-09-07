# Puzzle Region Empty Placeholder — Design

## Context

见 proposal.md。改动仅涉及 `src/domains/puzzle/PuzzleView.vue` 的 `preview-shell` 无预览分支（`:56`）。该组件使用 Element Plus 全局组件（项目多处已直接使用 `<el-empty>`，无需显式 import）。预览外壳 `.preview-shell` 为 grid + place-items:center 布局，min-height 236px。

## Goals / Non-Goals

**Goals:**
- 无截图预览时显示 el-empty 默认占位插画，替代纯文字
- 保留原描述文案与语义（未配置 vs 已失效）

**Non-Goals:**
- 不改变框选流程、状态机或任何数据行为
- 不做自定义插画（用户已选定 el-empty 默认插画）

## Decisions

1. **用 `<el-empty>` 而非手写 SVG/PNG**：项目多处已有 el-empty 先例（BagView、CraftPlannerView、InterfaceDetectionSettings 等），风格统一、零新增资源。备选：自绘网格插画（更贴题但用户已否决）、现有 PNG（语义不贴切）。
2. **`image-size` 固定 72**：与 InterfaceDetectionSettings 的 48、StoryView 的 64-72 区间一致，适配 236px 高的 shell。
3. **样式覆盖最小化**：仅设 `--el-empty-description-margin` 区域字号与 padding，复用 shell 的居中布局，不新增外层结构。

## Risks / Trade-offs

- el-empty 默认有较大内边距，在深色 shell 中可能显得偏大 → 通过 `.preview-empty` 收缩 padding 与描述字号（12px）验证视觉效果。
- 无自动化 UI 测试覆盖 → 属纯展示改动，`npm run build` 验证编译，现有 puzzle 逻辑测试确认无回归。
