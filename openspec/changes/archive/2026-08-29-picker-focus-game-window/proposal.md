# picker-focus-game-window

## Why

取点和框选操作用于在游戏画面上标记坐标或截取模板，但发起时主窗口可能遮挡游戏、游戏窗口也可能不在前台，导致点选位置或截取的画面不是真实游戏内容。需要统一保证：选取开始前游戏已在前台，选取结束后应用主窗口恢复前台。

## What Changes

- 所有取点（point）与框选（region）入口在打开选取层之前统一执行：最小化应用主窗口 → 激活游戏窗口到前台；游戏窗口激活失败（未运行或找不到窗口）时中止本次选取并向用户提示「未找到游戏窗口，请先启动游戏」。
- 框选模式的屏幕截图改为在游戏激活之后捕获，保证截取内容为游戏画面。
- 选取结束（成功、取消、失败、异常）后统一还原并聚焦应用主窗口。
- puzzle（碎片仓库）流程中已有的「最小化 → 选取 → 还原」本地实现被统一逻辑替代并删除重复代码。
- 非 Windows 平台跳过游戏激活步骤，仅执行主窗口最小化/还原（兼容开发环境）。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `screen-coordinate-picker`: 新增「选取前游戏前台保障」要求——取点开始前最小化主窗口并激活游戏到前台，激活失败时中止并提示；新增「选取结束后还原主窗口」要求。
- `screen-region-template-picker`: 「干净屏幕截图」要求修订为在游戏激活之后捕获；新增选取前游戏前台保障与选取结束后还原主窗口要求。

## Impact

- `electron/modules/window/manager.js`：`pickScreenCoordinate()` / `pickScreenRegion()` 增加统一前置与后置逻辑；新增主窗口还原的共享导出。
- `electron/modules/puzzle/service.js`：删除 `pickRegion()` / `pickInventoryTabPoint()` 中重复的最小化/还原逻辑，改用共享导出。
- 复用 `electron/modules/priceCheck/clipboardCapture.js` 的 `restoreWindowsGameFocus()`（不新增激活实现）。
- 前端各取点/框选调用点的失败提示路径验证（缺失处补提示）。
