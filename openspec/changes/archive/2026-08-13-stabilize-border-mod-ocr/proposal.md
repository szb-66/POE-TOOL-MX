## Why

边缘词缀 OCR 当前以包含动态游戏背景和仓库碎片的整张 1200×480 画面判断浮窗稳定，背景动画或发光效果会使稳定判定超时，仓库等级文字还可能与目标词缀粘连，造成画面中词缀清晰可见但应用仍标记未知。现有失败结果没有向界面保留足够的原始 OCR 证据，导致复现后仍难以区分捕获、OCR 与目录匹配问题。

## What Changes

- 热点沿对应方向按海图区物理宽度或高度的 6% 外移，保持 825×828 标定区域约 50 像素的现有行为；保留现有 DPI 捕获尺寸和 RapidOCR 模型，在捕获画面中根据蓝紫色词缀文字定位目标 ROI，避免用整张动态画面判断稳定。
- 每个边缘在固定等待后抓取一帧：优先 OCR 目标文字 ROI，提取失败时回退一次整帧 OCR，结果直接交给现有目录匹配器；不再做整框或跨帧稳定性判定，超时与软失败语义不变。
- 同时保留原图 OCR 与目标文字分离 OCR，将按阅读顺序排列的分段文本合并后交给现有目录匹配器，避免白色仓库等级文字干扰。
- 未匹配边缘保留最有信息量的 `rawTexts`，在应用内悬停展示未知状态及 OCR 原文，便于直接定位实际运行时文本。
- 新增真实 150% DPI 截图、动态背景、文字分段、等级粘连和失败诊断回归测试。
- 不降低现有匹配阈值、不更换 OCR 模型、不新增依赖、不修改公开 IPC 返回结构；捕获窗由 800×320 偏下矩形调整为以鼠标为中心的 800×800 逻辑正方形，覆盖偏上的浮窗。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `chart-mod-recognition`: 边缘词缀采集改为固定等待后单帧采样,以目标文字 ROI 和共享目录匹配器为准,并在软失败时保留可诊断 OCR 原文。
- `chart-mod-catalog`: 支持将同一目标词缀被 OCR 拆分的文本按阅读顺序合并,同时保持现有目录阈值和歧义保护。
- `chart-mod-display`: 未匹配边缘悬停除"未知"外显示本次 OCR 原文,帮助定位运行时失败。

## Impact

- 主要影响 `src/assets/scripts/chart_mods_probe.py`、`src/utils/chartModMatcher.js`、`electron/modules/puzzle/service.js`、`src/domains/puzzle/PuzzleView.vue` 及对应 Python/Node/页面集成测试。
- 继续使用现有 Python `cv2`、NumPy、MSS 和 RapidOCR 依赖，不增加运行时或打包资源。
- `borderMods`、`rawTexts`、探测统计和 IPC 通道保持兼容；自动化前台校验、锁和停止机制保持不变。
- 验证仅在管理员权限开发版进行，不执行打包。
