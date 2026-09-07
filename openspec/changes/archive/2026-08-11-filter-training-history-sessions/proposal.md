## Why

历史标注会话会同时积累多个素材来源和数据用途，当前列表只能浏览全部会话，查找特定训练集、验证集或来源时需要逐行辨认，复核效率较低。

## What Changes

- 在历史标注会话区域新增来源筛选，可查看全部来源或单一素材来源的会话。
- 新增用途筛选，可查看全部用途或单一训练分区的会话。
- 两个筛选条件组合生效，并展示当前筛选结果数量和无匹配结果提示。
- 筛选仅影响历史列表展示，不改变训练、最终测试统计或持久化数据。

## Capabilities

### New Capabilities
- `training-session-history-filtering`: 定义开发版模型训练工作台按素材来源和数据用途筛选历史标注会话的交互行为。

### Modified Capabilities
- 无。

## Impact

- 影响 `src/domains/bag/HighlightModelTrainingView.vue` 的本地筛选状态、历史表格数据源和空状态展示。
- 不修改 Electron IPC、训练仓库格式、训练脚本或运行时模型行为。
- 增加对应界面契约测试。
