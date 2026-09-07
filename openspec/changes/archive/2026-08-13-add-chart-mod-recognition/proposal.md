## Why

海图玩法目前只能识别碎片形状并计算拼图连通方案，无法感知碎片上的词缀与大海图边缘的边框词缀。后续要自动计算海图的最优收益，必须先具备词缀识别能力：碎片词缀通过游戏内复制读取，海图边缘词缀通过鼠标悬停浮窗 OCR 识别。

## What Changes

- 新增海图碎片词缀目录（150 条）与大海图边框词缀目录（65 条），数据取自 poedb 中文站，作为本地静态数据文件。
- 新增词缀文本匹配引擎：规范化游戏复制文本与 OCR 文本（全角转半角、数值范围与百分比占位化），支持多行打分匹配与模糊匹配。
- 新增 Python 探测脚本：
  - 复制模式：自动聚焦游戏、切换仓库页签、逐格移动鼠标并发送 Ctrl+C，读取剪贴板获取碎片词缀文本。
  - 边框模式：对大海图 12 段外边缘逐段将鼠标移动到段中点外侧 20px，等待浮窗出现后截图鼠标上方区域并 OCR。
- 改造海图"自动识别两页"流程：在现有截屏识别后，依次执行碎片词缀逐格复制读取与 12 段边缘词缀 OCR，聚合结果并发布阶段进度。
- 软件内展示：
  - 碎片仓库格子 hover 显示已识别的碎片词缀（未测绘碎片标记"未揭示"）。
  - 最优方案卡片的 12 个出口按钮 hover 显示已识别的边框词缀。
- 词缀识别失败容错：个别格子或边缘识别失败标记为未知，不阻断整体流程；未测绘碎片标记"未揭示"。

## Capabilities

### New Capabilities

- `chart-mod-catalog`: 海图碎片词缀与大海图边框词缀的中文目录数据，以及将游戏文本（剪贴板或 OCR）匹配到目录条目的规范化与匹配规则。
- `chart-mod-recognition`: 海图词缀的采集流程——碎片词缀复制读取、边缘词缀浮窗 OCR、与既有海图识别的编排、阶段进度与失败容错。
- `chart-mod-display`: 软件内词缀展示——碎片仓库格子 hover 显示碎片词缀，最优方案卡片 12 段边缘 hover 显示边框词缀。

### Modified Capabilities

<!-- 无现有能力的 requirement 变化；一键识别按钮的流程扩展属于新增的 chart-mod-recognition 能力。 -->

## Impact

- 新增数据文件：`src/data/chartModsData.js`（词缀目录）。
- 新增匹配工具：`src/utils/chartModMatcher.js`。
- 新增 Python 脚本：`src/assets/scripts/chart_mods_probe.py`（复制与边框 OCR 两种模式），依赖已捆绑的 cv2/mss/numpy/pynput/pyperclip/rapidocr。
- 修改 Electron 服务：`electron/modules/puzzle/service.js`（analyze 编排、边缘目标点计算、探测进程管理、进度事件）。
- 修改前端：`src/stores/puzzle.js`（slot.mods 与 edges 状态）、`src/domains/puzzle/PuzzleView.vue`（hover 展示与进度提示）。
- 新增测试：词缀目录完整性、匹配引擎、12 段边缘坐标计算、Python 脚本静态检查。
- 运行时约束：词缀探测占用自动化锁且要求游戏窗口可聚焦；识别总耗时约 1 分钟（60 格复制 + 12 边 OCR，按实际碎片数量浮动）。
