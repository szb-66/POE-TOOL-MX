## 1. 主进程实现

- [x] 1.1 在 `electron/modules/puzzle/service.js` 的 `probeBorderMods()` `finally` 块（自动化锁释放处，约 804-806 行）补调 `restoreMainWindowToForeground()`

## 2. 测试

- [x] 2.1 在 `test/puzzleIntegration.test.js` 补充断言：`probeBorderMods` 成功结束后调用主窗口恢复（restore + show + focus）
- [x] 2.2 补充断言：失败/紧急停止路径同样恢复；早期校验失败（海图区未配置）不触发恢复

## 3. 验证

- [x] 3.1 运行 `node --test test/puzzleIntegration.test.js`，再运行 `npm test`
- [x] 3.2 运行 `openspec validate --strict` 校验本变更
