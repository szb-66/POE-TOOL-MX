## Why

模型训练标注网格目前只用较细的边框区分高亮、置灰和空格，在复杂物品截图上辨识度不足，容易造成误标。需要增加格内中心圆点，并允许标注人员按画面情况独立控制边框和圆点，提升复核准确性。

## What Changes

- 在每个训练标注网格单元中心显示与标签状态一致的彩色圆点。
- 将三类可视化统一为：高亮绿色、置灰白色、空格低透明度白色。
- 增加“显示网格颜色”和“显示中心圆点”两个独立 switch，实时控制对应标记。
- 保持格子点击切换标签、复核焦点和悬停反馈不受开关影响。

## Capabilities

### New Capabilities

- `training-grid-visualization`: 定义模型训练标注网格的状态颜色、中心圆点及独立显示控制。

### Modified Capabilities

无。

## Impact

- 影响模型训练开发页面 `src/domains/bag/HighlightModelTrainingView.vue`。
- 增加针对标注网格结构与样式契约的前端集成测试。
- 不影响训练数据格式、模型训练流程、Electron IPC 或正式版功能。
