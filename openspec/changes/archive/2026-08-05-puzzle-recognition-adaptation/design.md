## Context

现有海图识别器在 `puzzle_analyzer.py` 中写死绿色 HSV 阈值、暗线阈值、方向探针位置与置信度阈值；自动放置脚本 `puzzle_auto_place.py` 运行时重新识别来源，且渲染层同步库存时会覆盖用户修正。具体动机见 proposal.md。

## Goals / Non-Goals

**Goals:**
- 提供可持久化的三档识别强度，标准档与当前行为一致。
- 分析结果返回网格置信度与低置信提示，不修改用户框选区域。
- 自动放置使用当前方案选中的修正来源，并保留用户修正。

**Non-Goals:**
- 不实现自动网格校正或区域吸附。
- 不改变格子划分、求解算法与 3×3 海图协议。
- 不引入新的 Python 依赖。

## Decisions

- **识别强度配置集中在 Python**：`puzzle_analyzer.py` 定义 `STRENGTH_PRESETS`（`sensitive`/`standard`/`strict`），渲染层只保存并传递 `strength` 字符串，避免 JS 与 Python 两套参数漂移。`standard` 使用现有参数。
- **配置存储**：`puzzleSettings.recognition.strength` 新增字段，`normalizePuzzleSettings` 提供默认值 `standard`；旧配置缺字段时按标准档处理。分析请求与自动放置请求都携带该字段。
- **网格置信度只提示不修正**：分析器检测暗色网格线（形态学开运算提取长线，聚类成 7 竖 / 11 横线），与当前等分边界比较平均偏差；置信度 = `max(0, 1 - 平均偏差 / (0.08 * 单元格尺寸))`，检测失败返回 0.5（中）。低置信（<0.5）时加入警告，仍返回完整结果。
- **方向探针使用图标质心**：`largest_green_component` 已返回组件质心；`inventory_route_topology` 接收该质心作为方向探针中心，找不到组件时回退到现有固定位置，避免不同机型图标位置差异导致方位误判。
- **自动放置信任修正来源**：`startAutoPlacement` 请求新增 `sourceSlots`，脚本按目标顺序使用对应来源；未提供时沿用现有 `available_sources` 运行时选择。对 `corrected: true` 的来源，旋转确认失败后最多补两次右键再继续，最终仍以海图目标格验证为准。
- **同步库存保留修正**：`applyAnalysis` 合并结果时，已存在的 `corrected: true` 格子保留用户内容，未修正格子用新识别结果更新。
- **UI 入口放在海图页**：识别强度选择与网格对齐状态展示在海图页操作区/配置卡，因为这是该功能的即时调试入口，并持久化到 `puzzleSettings`。

## Risks / Trade-offs

- [网格线检测在部分机型可能失败] → 检测失败按中置信处理，不阻塞识别，也不改变现有结果。
- [敏感档可能引入误识别] → 误识别格子仍会标记待确认，用户可以切换回标准/严格档。
- [修正来源旋转重试可能在输入未生效时继续] → 最终海图落格验证仍然阻塞，失败时保留进度供续跑。

## Migration Plan

- `normalizePuzzleSettings` 读取旧配置时自动补 `recognition: { strength: 'standard' }`，无需手动迁移。
- 开发版验证通过后按仓库流程打包；本次实施不触发打包。
