# chart-recognition-restore-foreground — 设计

## Context

- 「自动识别两页」`analyze()` 已在 `publish()`（service.js:528）与 `finally`（service.js:934）调用 `restoreMainWindowToForeground()`（window/manager.js:667：restore + show + focus），用户确认该机制在游戏占用前台时可正常恢复主窗口。
- 「识别边缘词缀」`probeBorderMods()`（service.js:760-807）把游戏置前执行 OCR 后从不恢复主窗口，是唯一缺口。
- `restoreMainWindowToForeground` 已在 service.js:8 导入；词缀探测期间的进度推送（`sendProgress`，service.js:532-536）刻意不恢复主窗口，避免把游戏挤到后台，该设计保持不变。

## Goals / Non-Goals

**Goals:**

- 「识别边缘词缀」在成功、失败、紧急停止三种结束路径后恢复主窗口前台，与「自动识别两页」行为一致。

**Non-Goals:**

- 不增强抢焦点机制（如 `setAlwaysOnTop` 抢焦点技巧）——现有机制已验证有效。
- 不改动「自动识别两页」、海图自动放入、游戏内吐司展示逻辑。

## Decisions

- **复用 `restoreMainWindowToForeground()`，不新建工具函数**：rung 2——能力已存在，调用即可。
- **调用点放在 `probeBorderMods` 的 `finally`（与自动化锁释放并列）**：单点覆盖成功、异常、紧急停止三条路径；备选方案（在 try 成功段与 catch 各写一次）重复且易漏。`finally` 只在进入 `try`（即自动化已启动）后执行，早期校验 `fail()` 在 `try` 之前 return，天然满足"未发送键鼠输入不改变前台"。
- **不延迟到吐司关闭之后**：吐司 overlay 为 `alwaysOnTop`（recognitionFeedbackOverlay.js:66），主窗口回前台不会遮挡它，无需定时器。

## Risks / Trade-offs

- [若未来游戏以独占全屏运行导致 `focus()` 抢不过来] → 届时在 `restoreMainWindowToForeground()` 内增强（如临时 `setAlwaysOnTop`），本变更不预设。
- [`finally` 中恢复可能先于渲染层 ElMessage 展示] → 消息在主窗口内展示，恢复前台反而保证其可见，无冲突。
