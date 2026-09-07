## Why

最优方案周围的出口目前承担必选/禁止约束交互，却不能修正会直接影响收益排序的边缘词缀识别结果。用户需要在识别错误或未识别时直接编辑对应边缘词缀，并让修正结果立即进入当前方案计算。

## What Changes

- **BREAKING** 移除十二个外周出口的左键必选、右键禁止、统一清空和出口约束求解能力。
- 将十二个出口改为边缘词缀编辑入口，左键打开可搜索固定目录的单选弹窗，右键不改变状态。
- 支持确认固定目录词缀或清空单段词缀，立即持久化并重新计算收益方案。
- 手工结果在页面重建和碎片识别后保留，成功的新边缘 OCR 仍整体覆盖全部手工结果。
- 在自动放入、识别或断点续跑期间禁止编辑边缘词缀。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `nine-grid-puzzle-solver`: 移除必选/禁止出口硬约束及三态出口控制，保留无约束的连通、出口与收益最优求解。
- `chart-mod-recognition`: 增加十二段边缘词缀的目录内手工修改、清空、持久化及识别覆盖行为。
- `puzzle-chart-completion`: 移除完成当前海图时清空出口约束的流程依赖。
- `atlas-auto-placement`: 移除出口约束导致无解的反馈分支，禁止执行期间修改边缘词缀。

## Impact

- 影响海图 Vue 页面、Pinia store、九宫格求解器、帮助内容和对应测试。
- `solvePuzzle` 不再接收或处理 `requiredExits`、`forbiddenExits` 输入。
- 不新增 Electron IPC、后端接口或依赖，现有边缘 OCR 服务保持不变。
