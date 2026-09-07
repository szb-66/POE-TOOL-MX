## 1. 主进程布防状态机

- [x] 1.1 新建 `electron/modules/window/overlayOutsideClickClose.js`：依赖注入的布防/解除布防工厂函数（arm 幂等、disarm 幂等、恢复 `setFocusable(false)`、blur 一次性触发关闭回调）
- [x] 1.2 `electron/modules/window/manager.js`：创建状态机实例；新增 `armOverlayOutsideClickClose` / `disarmOverlayOutsideClickClose` 导出；`closeOverlayWindow` 内调用解除清理
- [x] 1.3 新建 `test/overlayOutsideClickClose.test.js`：fake window 覆盖布防、幂等、解除恢复、blur 触发关闭、布防后解除不误关

## 2. IPC 与 preload

- [x] 2.1 `electron/modules/ipc/window.js`：注册 `arm-overlay-outside-click-close` / `disarm-overlay-outside-click-close` handler
- [x] 2.2 `electron/preload.cjs`：暴露 `armOverlayOutsideClickClose` / `disarmOverlayOutsideClickClose`

## 3. 渲染进程接线

- [x] 3.1 `src/domains/overlay/OverlayView.vue`：watch `isCompleted`——变 true 布防、变 false 解除；`handleRestart` 开头解除；`restoreCompletedState` 重新布防

## 4. 验证

- [x] 4.1 运行 `node --test test/overlayOutsideClickClose.test.js` 与受影响的浮窗相关测试
- [x] 4.2 运行 `npm test` 全量回归
- [x] 4.3 `npm run electron:dev` 手动验证：完成后点击外部关闭、点浮窗自身不关、重新开始不误关、重启失败恢复布防
- [x] 4.4 运行 `openspec validate --strict` 校验变更
