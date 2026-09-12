## Why

暗场景禁域中状态栏第 1、2 个图标浮窗全部报"未找到效果浮窗"。已用用户提供的真实基线/悬停截图在离线回放中复现：暗场景里浮窗相对背景的绝对亮度差只有约 ±10–15 灰阶，现有三条定位路径（透明度边、深色轮廓、变暗轮廓补充）的绝对阈值同时失守，零候选直接失败。

## What Changes

- 状态栏浮窗定位的候选来源改为基线变暗掩码（baseline−gray 的差分信号），替代对全暗场景失效的 `gray<85` 深色轮廓主路径。
- 候选门槛由 `delta>28` 绝对差分改为矩形内变暗覆盖率门槛（实测浮窗内 0.69–0.77、外部噪声 0.04，分离度更高）。
- 面板边界校验（changed_panel_boundary）对半透明低对比边的边带判定放宽，保持完整边界结构要求，不回归既有"错误小候选/背景粘连"拒绝用例。
- 新增暗场景真实截图回归样本（两浮窗 × 四种宽度），并记录样本来源与回放边界说明。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `sanctum-recognition`: 状态栏效果浮窗在暗场景下必须仍能定位并读取；候选提取与门槛改为基线感知，错误裁剪拒绝语义保持。

## Impact

影响 `src/assets/scripts/sanctum_tooltip.py` 的 plain 定位分支及 `test/fixtures/sanctum/` 新样本；Node/Python 回放测试更新。无公共 API、schema、依赖或校准变更；房间（map）标题定位流程行为不变。与进行中的 fix-sanctum-resource-reward-calibration 变更互不重叠。
