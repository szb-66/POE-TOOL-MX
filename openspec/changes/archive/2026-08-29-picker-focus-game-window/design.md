# picker-focus-game-window 设计

## Context

所有取点与框选最终汇聚于 `electron/modules/window/manager.js` 的 `pickScreenCoordinate()`（L796）与 `pickScreenRegion()`（L803），二者共享 `createScreenPickerSession()` 单例会话（`screenPickerSession`）。游戏窗口激活能力已存在：`electron/modules/priceCheck/clipboardCapture.js` 的 `restoreWindowsGameFocus(pythonPath)`（内嵌 Python：EnumWindows 匹配 → ShowWindow 还原 → BringWindowToTop → SetForegroundWindow → 轮询确认，返回 boolean，游戏未运行返回 false）。`pythonPath` 由 `pythonDetector.detectPythonPath()` 提供（main.js L556 现有用法）。puzzle 流程在 `electron/modules/puzzle/service.js` 的 `pickRegion()`（L256）/`pickInventoryTabPoint()`（L289）已各自实现 `minimize → sleep 500 → pick → finally restoreWindow`，其余入口无此逻辑。manager.js 持有模块级 `mainWindow` 变量（L44）。

## Goals / Non-Goals

**Goals:**

- 在两个 picker 入口函数内统一实现「最小化主窗口 → 激活游戏 → 选取 → 还原主窗口」，覆盖成功/取消/失败/异常全部路径。
- 框选截图发生在游戏置前之后。
- 删除 puzzle/service.js 中重复的最小化/还原逻辑。
- 激活失败时以 `screenPickerFailure` 结构返回明确错误，前端可提示。

**Non-Goals:**

- 不改动各业务模块自身的调用方式与 IPC 契约（前端入口不变）。
- 不新增游戏窗口激活实现（复用 `restoreWindowsGameFocus`）。
- 不改动 `game-foreground-runtime-policy` 等运行时检测策略。

## Decisions

1. **改造点选在 manager.js 两个入口函数内，而非 createScreenPickerSession 内。**
   `createScreenPickerSession` 是同步纯状态函数且被并发检查路径复用（`screenPickerSession` 已存在时直接返回现有 promise），把异步的「最小化+激活游戏」塞进去会破坏其同步语义和 BUSY 快速返回路径。在 `pickScreenCoordinate`/`pickScreenRegion` 外层包装，`finally` 中还原主窗口，天然覆盖所有结算路径（submit/cancel/窗口关闭/加载失败都 resolve/reject 同一个 promise）。

2. **复用 `restoreWindowsGameFocus()`，manager.js 直接 import。**
   返回 false 即「游戏未运行/激活失败」→ 构造 `screenPickerFailure(new Error('未找到游戏窗口，请先启动游戏'))`。无循环依赖（clipboardCapture.js 不依赖 window/manager）。若实施时发现循环依赖，退路是 main.js 注入回调；不预期需要。

3. **并发保护：prepare 期间新增 `pickerPreparing` 标志。**
   现有并发检查依赖 `screenPickerSession` 非空，但 prepare 是异步的（minimize + sleep + Python 激活，约 0.5–1s），期间 `screenPickerSession` 仍为空，第二个请求会重复执行 prepare。新增模块级布尔标志：prepare 前置检查并置位，prepare 结束或失败后清除；置位期间的新请求直接返回 BUSY 失败。

4. **最小化后沿用 sleep 500ms；游戏置前后不再额外等待。**
   500ms 沿用 puzzle 现有值，确保主窗口从屏幕上消失后再截图/取点。`restoreWindowsGameFocus` 的 Python 端已轮询确认游戏真正成为前台窗口才返回 true，返回后无需 JS 侧再等待。

5. **主窗口还原函数提升为 manager.js 共享导出 `restoreMainWindowToForeground()`。**
   puzzle/service.js 的本地 `restoreWindow()`（L95-100）逻辑相同，改为 import 共享版本并删除本地实现；puzzle 中其余仍使用它的调用点（分析结束等场景）一并切换，保持单一实现。

6. **非 win32 平台跳过激活。**
   `restoreWindowsGameFocus` 在非 win32 直接返回 false，若不处理会阻断开发环境。入口处判断 `process.platform !== 'win32'` 时跳过激活步骤，仍执行最小化/还原。

7. **失败通过现有结果结构传递。**
   `screenPickerFailure` 返回 `{success:false, canceled:false, error}` 结构（现有 IPC 契约，promise 正常 resolve），前端各调用点已有 `success === false` 检查路径；实施时逐点验证提示覆盖（SettingsView、CombatView、PuzzleView、StashTabSelectionSettings、chaosRecipe/junfeng/stashPickup/bag store），缺失处补 `ElMessage.error`。

## Risks / Trade-offs

- [每次选取多 0.5–1s 延迟（minimize sleep + Python 激活）] → 用户已确认统一最小化与中止提示，可接受；不做并行化（最小化必须先于截图）。
- [游戏以管理员权限运行时 SetForegroundWindow 可能失败] → `restoreWindowsGameFocus` 轮询确认失败即返回 false，走中止提示路径，提示语可补充权限说明。
- [pickerPreparing 标志在异常路径未清除] → 标志清除放在 prepare 的 finally 中；入口函数整体 try/finally 兜底。
- [pythonPath 检测失败] → `detectPythonPath()` 返回 null 时 `restoreWindowsGameFocus` 返回 false，同样走中止提示。

## Migration Plan

单次发布，无数据迁移。回滚即还原两个文件的改动，无持久化状态变化。

## Open Questions

（无）
