# picker-focus-game-window 任务

## 1. manager.js 统一前置/后置逻辑

- [x] 1.1 新增共享导出 `restoreMainWindowToForeground()`（restore if minimized + show + focus），并新增 `preparePickerSession()`：`mainWindow.minimize()` → sleep 500ms → win32 下调用 `restoreWindowsGameFocus(detectPythonPath())`，失败返回错误「未找到游戏窗口，请先启动游戏」
- [x] 1.2 新增 `pickerPreparing` 并发保护标志：prepare 前置检查并置位、finally 清除，置位期间新请求返回 BUSY 失败
- [x] 1.3 改造 `pickScreenCoordinate()`：prepare 成功后创建会话并打开取点层，`finally` 调用 `restoreMainWindowToForeground()`；prepare 失败返回 `screenPickerFailure`
- [x] 1.4 改造 `pickScreenRegion()`：prepare 成功后再 `captureDisplays()` 并创建会话，`finally` 调用 `restoreMainWindowToForeground()`；prepare 失败返回 `screenPickerFailure` 且不截图

## 2. puzzle/service.js 去重

- [x] 2.1 `pickRegion()` / `pickInventoryTabPoint()` 删除本地 `minimize + sleep + finally restoreWindow`，直接调用 `this.window.pickScreenRegion()` / `pickScreenCoordinate()`
- [x] 2.2 删除本地 `restoreWindow()`，文件内其余调用点（分析结束等场景）改用 manager.js 的 `restoreMainWindowToForeground()`

## 3. 前端失败提示验证

- [x] 3.1 检查各取点/框选调用点（SettingsView、CombatView、PuzzleView、StashTabSelectionSettings、chaosRecipe/junfeng/stashPickup/bag store）对 `{success:false, error}` 的处理，缺失提示处补 `ElMessage.error`

## 4. 验证

- [x] 4.1 运行受影响的 node --test 测试文件，再运行 npm test 确认无回归
- [ ] 4.2 开发版手动验证：游戏运行时取点（设置页/战斗页）→ 主窗口最小化、游戏置前后选取层显示 → 完成后主窗口还原前台
- [ ] 4.3 开发版手动验证：框选（仓库标签/混沌食谱/军峰/取件/puzzle）同样验证，且截图内容为游戏画面
- [ ] 4.4 手动验证：游戏未运行时发起取点/框选 → 中止并提示「未找到游戏窗口，请先启动游戏」，主窗口还原；Esc 取消路径同样还原主窗口
- [x] 4.5 运行 `openspec validate --strict` 校验变更
