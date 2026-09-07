## Context

海图玩法位于 `puzzle` 域:6×10 碎片仓库截屏识别(`puzzle_analyzer.py`)、3×3 海图区、双页页签标定、九宫格求解与自动放入(`puzzle_auto_place.py`)。已有可复用资产:

- 剪贴板哨兵复制链路:`electron/modules/priceCheck/clipboardCapture.js`(sentinel + Ctrl+C + 轮询变化 + 恢复旧内容)。
- OCR 与浮窗等待:`stash_tab_selector.py` 的 `create_rapidocr_engine`、`frame_signature/same_frame` 帧变化检测、`annotate_matches` 模糊匹配。
- 窗口与自动化安全:`puzzle_analyzer.py` 的 `focus_game_window`、`is_game_foreground`、`window_matches_game`、页签点击;`puzzle/service.js` 的自动化锁、overlay hide/show、EVENT 流式进度。
- 运行时已捆绑 `cv2/mss/numpy/pynput/pyperclip/rapidocr/onnxruntime`,无新依赖。

## Goals / Non-Goals

**Goals:**

- 词缀目录数据一次性到位(150 碎片 + 65 边框),匹配引擎可脱离游戏用 node --test 验证。
- 探测脚本单进程跑完全部格子/边缘,避免逐格 spawn 的进程开销。
- 一键识别按钮流程向后兼容:词缀采集失败不破坏形状识别结果。
- 12 段外边缘目标点由海图区元数据纯函数计算,可单测。

**Non-Goals:**

- 本次不做海图最优收益计算(词缀数据为其铺垫)。
- 不做内边缘词缀(仅 12 段外边缘)。
- 不做词缀目录在线更新。

## Decisions

1. **词缀目录为静态 ES 模块 `src/data/chartModsData.js`**,手工转录本次 poedb 抓取内容。
   备选:运行时抓取 poedb 生成脚本——依赖网络、页面结构不稳定,放弃。

2. **匹配引擎放 JS(`src/utils/chartModMatcher.js`)**,供 Electron 主进程与 node --test 共用。
   规范化:全角括号/连字符转半角、删除空白、数值范围 `(x—y)` 与 `x%` 占位化;碎片匹配按首行取候选集、剩余行精确匹配打分定档;边框匹配按相似度阈值模糊匹配。
   备选:Python 内匹配——目录数据需双份维护、单测生态差,放弃。

3. **探测脚本新建单文件 `src/assets/scripts/chart_mods_probe.py`,双 mode(`copy`/`border`)**,按现有惯例复制窗口/前台/emit/fail 公共函数,不 import 其他脚本避免耦合。
   备选:扩展 `puzzle_analyzer.py`——职责混杂、回归风险高,放弃。

4. **剪贴板在 Python 内自管**:copy mode 保存旧剪贴板→写入哨兵→逐格移动鼠标+Ctrl+C→轮询剪贴板变化→逐格输出文本→结束恢复,一次进程完成两页全部格子。
   备选:Electron 侧逐格读剪贴板——每格多次 IPC 往返,60+ 格太慢,放弃。

5. **边缘目标点在 JS 侧计算**并随配置传入脚本:段中点向外偏移 20px(上边缘上移、下边缘下移、左边缘左移、右边缘右移),clamp 到屏幕内。浮窗等待用帧签名变化检测(沿用 `same_frame` 模式)带超时;截图区域为鼠标上方矩形(默认约 480×320,配置参数化),OCR 文本回传 JS 匹配目录。
   备选:整屏截图 OCR——慢且噪声多,放弃。

6. **编排进 `analyze()`**:形状识别(现有)→ 碎片词缀复制 → 边缘词缀 OCR,三个阶段共用自动化锁与 overlay hide/show,阶段进度经现有 `puzzle-analysis-updated` 通道发布;词缀结果(fragmentMods/borderMods)随 analyze 响应返回。store 与 UI 增量消费,不破坏现有响应结构。
   备选:独立按钮与 IPC——用户明确要求改造一键识别按钮,放弃。

7. **失败容错**:每格/每边独立成败,失败标记未知;某阶段整体失败时保留形状识别结果并提示词缀采集失败。未测绘检测:剪贴板含「航行词缀将在完成测绘后揭示」时标记未揭示。

## Risks / Trade-offs

- [浮窗出现延迟与位置因用户环境而异] → 等待时间与 OCR 区域尺寸参数化,失败标记未知,可再次识别重试。
- [识别总耗时约 1 分钟,期间鼠标被占用] → 阶段进度提示 + 自动化锁互斥 + 保留停止机制。
- [词缀目录与游戏版本数据漂移] → 匹配失败仅标记未知,不阻断流程;目录随版本更新。
- [复制会覆盖用户剪贴板内容] → 哨兵机制前后保存/恢复剪贴板。
- [词缀采集移动鼠标可能与用户操作冲突] → 预检游戏前台、采集前隐藏遮罩、采集期间界面禁用相关操作。

## Migration Plan

无数据迁移。行为变化:自动识别按钮流程变长并增加阶段进度提示,失败语义从整体失败细化为部分未知;形状识别结果始终保留。纯增量改动,无需回滚策略。

## Open Questions

- 浮窗出现延迟与 OCR 区域尺寸的实机标定:实现后联调阶段调整配置参数即可,不改变规格与任务分解。
