# Puzzle Region Empty Placeholder — Tasks

## 1. UI 改动

- [x] 1.1 将 `PuzzleView.vue` `preview-shell` 的无预览 `<span>` 分支替换为 `<el-empty>`（保留原描述文案、image-size=72、class="preview-empty"）
- [x] 1.2 新增 `.preview-empty` scoped 样式（收缩内边距、描述字号 12px，适配 preview-shell 深色网格居中布局）

## 2. 验证

- [x] 2.1 `npm run build` 编译通过
- [x] 2.2 运行 `test/puzzle*.test.js` 确认无回归（53/53 通过）
