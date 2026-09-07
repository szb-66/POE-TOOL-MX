# Puzzle Region Empty Placeholder

## Why

海图模块的两张框选配置卡片（碎片仓库 6×10、海图区 3×3）在尚未框选或预览不可用时，预览区域仅显示一行小字（"等待截图" / "预览不可用，请重新框选"），视觉上空旷、提示性弱，用户难以一眼看出该区域尚未配置。

## What Changes

- 无截图预览时，预览区域改用 el-empty 空状态组件（含默认占位插画）展示，保留原有描述文案（未配置 → "等待截图"，已失效 → "预览不可用，请重新框选"）。
- 占位区域样式适配现有预览框（居中、字号缩小），其余交互与文案语义不变。

## Capabilities

### New Capabilities

- 无（纯展示层变化，不引入新行为能力）

### Modified Capabilities

- 无（screen-region-template-picker 的"保存选区截图预览"等行为要求不变；本次仅改变无预览时的渲染样式，不构成 spec 级行为变化）

本 change 为纯 UI 展示层变化，`skip_specs: true`。

## Impact

- `src/domains/puzzle/PuzzleView.vue`：`preview-shell` 无预览分支由 `<span>` 改为 `<el-empty>`，并新增 `.preview-empty` 样式。
- 无依赖、API 或数据结构变化。
