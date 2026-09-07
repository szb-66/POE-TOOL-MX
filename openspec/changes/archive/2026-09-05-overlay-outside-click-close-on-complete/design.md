## Context

制作浮窗（`electron/modules/window/manager.js` 的 `createOverlayWindow`）以 `focusable: false` 创建，`showInactive()` 显示，完成后渲染进程关闭鼠标穿透并显示"确认完成/重新开始"按钮。Electron 无法直接感知对窗口外部的点击。制作完成时游戏窗口必然是前台焦点窗口；首轮实现的失焦方案依赖浮窗抢焦点（`setFocusable(true)` + `focus()`），实测被 Windows 前台锁定策略拒绝——后台进程调用 `SetForegroundWindow` 不生效，浮窗从未真正获得焦点，点击外部不触发 `blur`，只有用户先点击浮窗拿到焦点后链路才生效，不满足需求。

## Goals / Non-Goals

**Goals:**
- 完成状态下点击浮窗外部（任意应用，含前台游戏）自动关闭浮窗，且不需要浮窗先获得焦点
- 布防生命周期与浮窗完成态严格绑定：重启、重新运行、关闭时全部解除
- 布防与点击判定逻辑可脱离 Electron 单测（依赖注入风格，同 `craftingOverlayLifecycle.js`）

**Non-Goals:**
- 失败/停止面板的点击外部关闭（保持手动关闭与重试入口）
- 超时自动关闭
- 其他浮窗（查价、混乱配方等）的同类行为
- 拦截或吞掉那次外部点击（点击照常作用于目标应用）

## Decisions

1. **Python 全局左键监听而非焦点/失焦**：完成时主进程 spawn 轻量 Python 进程（复用项目 `GetAsyncKeyState` 轮询模式，同 `item_inspection_input.py`），左键按下沿输出 JSON 事件。不抢焦点、不干扰游戏前台。失焦方案已被实测否定（见 Context）。
2. **点击位置判定在主进程**：Python 只报"左键点击"不带坐标；主进程收到事件后用 `screen.getCursorScreenPoint()`（DIP）对比浮窗 `getBounds()`，点击在浮窗 bounds 内忽略、在外关闭。规避物理像素与 DIP 的换算，拖动浮窗后实时取 bounds 无缓存问题。
3. **监听脚本专用最小化**：`src/assets/scripts/overlay_outside_click.py` 只做左键按下沿轮询（15ms，与项目现有轮询脚本一致），不掺热键/Shift 等物品体检逻辑；打包经 `extraResources` 单条目复制（项目惯例）。
4. **布防时机由渲染进程驱动**：`OverlayView.vue` watch `isCompleted` 通过 IPC 布防/解除。主进程无法可靠识别完成语义（散落在 stdout 解析逻辑中），渲染进程已有完整完成判定（`[完成]` 标记 + 地图模式特判）。
5. **解除时机三重覆盖**：watch `isCompleted` 变 false（`[开始]` 信号重置）；`handleRestart` 开头显式解除（重启期间 `isCompleted` 仍为 true，watch 不会触发）；`closeOverlayWindow` 内解除并终止监听进程。`restoreCompletedState`（重启失败）重新布防。Python 运行时路径与脚本路径由 `main.js` 启动时经 `configureOverlayOutsideClickCloser` 注入（同 `ItemInspectionInputWatcher` 惯例）。

## Risks / Trade-offs

- [监听进程轮询开销（15ms GetAsyncKeyState）] → 仅在完成态存在，用户点击后即解除终止；与项目现有常驻监听脚本同级
- [主进程异常退出残留监听进程] → 与项目其他常驻 Python 脚本同一风险面；正常退出路径经 `closeOverlayWindow` → `disarm` 终止
- [点击按下与事件上报间光标位置漂移] → 15ms 轮询粒度下实际点击位置偏差可忽略；浮窗边缘误判的后果仅是"多点一次"
- [完成瞬间不再有任何焦点切换] → 游戏全程保持前台，优于首轮失焦方案
