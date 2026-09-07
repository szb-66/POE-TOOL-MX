## 1. 主进程编排改造（electron/modules/window/manager.js）

- [x] 1.1 新增 `waitMinimized`：监听主窗口 `minimize` 事件（300ms 兜底），删除固定 `wait(500)` 及不再使用的 `wait` 常量
- [x] 1.2 `preparePickerSession`：最小化确认与 Python 激活游戏 `Promise.all` 并行，保留 GAME_NOT_FOUND 失败路径与非 Windows 跳过激活
- [x] 1.3 会话对象增加 `revealed`/`readyWindows`；`ready-to-show` 回调改为登记就绪窗口并调用 `revealPickerWindows`，仅在 `revealed` 为真时显示
- [x] 1.4 合并 `pickScreenCoordinate`/`pickScreenRegion` 为 `runScreenPicker`：先建会话并隐藏加载框选窗口，准备与截图完成后回填 `screenshots` 并 reveal；失败路径经 `settleScreenPicker` 统一单次结算
- [x] 1.5 确认无遗留无用代码（旧的双份编排、未用常量）

## 2. 构建配置

- [x] 2.1 `vite.config.js` 的 `server.warmup.clientFiles` 增加 `./src/domains/settings/CoordinatePickerView.vue`

## 3. 验证

- [x] 3.1 `node --test test/screenRegionPicker.test.js` 通过（含源码模式断言：`session.screenshots.clear()`、did-fail-load/closed→settle 等）
- [x] 3.2 全量 `npm test` 通过，无回归
- [ ] 3.3 `npm run electron:dev` 手动实测：仓库标题模板框选、坐标取点弹出速度明显改善；游戏未启动时提示「未找到游戏窗口」且不出现框选层；Esc 取消后主窗口正常还原
