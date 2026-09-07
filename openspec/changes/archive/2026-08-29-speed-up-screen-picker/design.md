## Context

框选/取点由 `electron/modules/window/manager.js` 编排，原流程完全串行：

1. `preparePickerSession()`：`mainWindow.minimize()` 后固定 `await wait(500)`
2. Windows 上用 Python 脚本把游戏窗口激活到前台（进程冷启动 + 内部轮询，约 300~800ms，规格 `screen-region-template-picker` 要求，不可省略）
3. region 模式：`desktopCapturer.getSources` 按最大显示器物理分辨率捕获（数百 ms）
4. 之后才 `new BrowserWindow` 并加载完整前端应用（`#/coordinate-picker`），等 `ready-to-show` 才显示

框选层是透明遮罩窗口，渲染进程只读取 `getScreenPickerContext`（mode/purpose/scaleFactor/minimumSize），不依赖截图数据；截图仅在提交时用于裁剪模板。这是并行化的关键前提。

## Goals / Non-Goals

**Goals:**

- 缩短从发起到框选层可见的等待，目标约 0.5~1 秒
- 保持 `screen-region-template-picker` 规格的全部行为契约：最小化→激活游戏→捕获截图→显示框选层的顺序、互斥会话单次结算、取消/失败路径、焦点还原
- 保持 `test/screenRegionPicker.test.js` 的源码模式断言与坐标换算测试通过

**Non-Goals:**

- 不做常驻预热窗口池（长期内存占用、需处理显示器热插拔，复杂度不成比例）
- 不降低截图分辨率或改用其他截屏 API（规格要求干净截图精确裁剪）
- 不改用原生模块替代 Python 激活前台脚本
- 不为生产构建做独立轻量 picker 入口（若 dev 模式实测仍慢再议）

## Decisions

- **窗口加载与准备/截图并行，显示仍门控在截图之后**：`runScreenPicker` 先创建互斥会话并创建框选窗口（`show: false`），窗口立即开始加载；准备与截图完成后才置 `revealed` 并对已 `ready-to-show` 的窗口调用 `show()`。理由：窗口加载（数百 ms~1s+）从关键路径完全消失，且「不显示框选层」的契约不变——隐藏加载不等于显示。备选的常驻窗口池被否决：收益与并行化重叠，代价是长期内存和生命周期管理。
- **会话先建、截图后填**：`screenshots` Map 随会话创建，`captureDisplays` 完成后回填。用户能交互的前提是窗口已显示，而显示必然晚于截图回填，因此不存在提交时截图缺失的竞态。失败路径由 `settleScreenPicker` 统一关闭从未显示的窗口并返回错误，结果对象与原实现一致。
- **`wait(500)` 改为事件驱动**：`waitMinimized` 监听主窗口 `minimize` 事件，300ms 兜底上限；与 Python 激活游戏 `Promise.all` 并行。理由：激活脚本本身耗时（进程冷启动 ≥100ms）远超最小化动画，截图又必然晚于激活完成，最小化动画不会进入截图。附带修复非 Windows 平台也白等 500ms 的问题。
- **两个导出函数合并为 `runScreenPicker(mode, options)`**：原来 `pickScreenCoordinate`/`pickScreenRegion` 是近乎复制的编排代码，合并后约 30 行；`displays` 只取一次，避免两次 `getAllDisplays()` 在显示器热插拔时取到不同集合。
- **dev 模式 Vite warmup 预热 `CoordinatePickerView.vue`**：一行配置，降低开发版首次框选的按需转换延迟；不影响生产构建。

## Risks / Trade-offs

- [激活游戏失败时白加载一次窗口] → 窗口从未显示即被 settle 关闭，用户无感知；成本仅为数百 ms 的一次性 CPU，且该路径本就要求立即中止。
- [`ready-to-show` 与 `revealed` 的时序竞态] → 两个方向都已覆盖：ready 先到则暂存 `readyWindows`，reveal 时补显示；reveal 先到则 `ready-to-show` 回调直接显示。会话已 settle 时 `revealPickerWindows` 直接返回。
- [`minimize` 事件未触发（极端窗口管理器行为）] → `waitMinimized` 300ms 兜底，最坏情况等同原实现的短版本，不会挂起。
- [加载失败（`did-fail-load`）与准备失败同时发生] → `settleScreenPicker` 以 `settled` 标志保证单次结算，先到者生效，与既有契约一致。

## Migration Plan

单文件主进程改动 + 一行 vite 配置，无数据迁移。回滚即还原两个文件的本次 diff。验证：`node --test test/screenRegionPicker.test.js`，再全量 `npm test`，最后开发版手动实测框选与取点。
