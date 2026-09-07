## 1. Store 完成逻辑

- [x] 1.1 在 `src/stores/puzzle.js` 新增 `completeCurrentChart()`：executing 或无当前方案时返回结构化错误；将 `currentSolution.sourceSlots` 的九格按页/行/列用 `emptySlots(page)[index]` 置空
- [x] 1.2 该 action 中清空 `requiredExits` 与 `forbiddenExits`、本地 `execution` 置 idle、`solutionIndex = 0`，随后调用 `recompute()`
- [x] 1.3 调用 `electronApi.puzzle.completeChart?.()` 同步主进程执行状态，用 try/catch 包裹且失败不阻塞本地结果
- [x] 1.4 在 store 返回值中导出 `completeCurrentChart`

## 2. 主进程状态重置与 IPC 贯通

- [x] 2.1 在 `electron/modules/puzzle/service.js` 新增 `resetExecution()`：执行状态置 idle、`publishExecution({ event: 'reset' })`、防御性关闭遮罩并释放自动化锁
- [x] 2.2 在 `electron/modules/ipc/puzzle.js` 注册 `puzzle-complete-chart` 通道调用 `service.resetExecution()`
- [x] 2.3 在 `electron/preload.cjs` 暴露 `completePuzzleChart`
- [x] 2.4 在 `src/api/electron.js` 的 puzzle 段新增 `completeChart`（Electron 实现与浏览器兜底 stub）

## 3. 页面按钮

- [x] 3.1 在 `src/domains/puzzle/PuzzleView.vue` 标题操作区「自动放入」旁新增「当前海图已完成」按钮，`:disabled="executing || analyzing || !currentSolution"`，点击无确认弹窗直接调用 store action
- [x] 3.2 成功后 `ElMessage.success` 提示已扣除 9 块并附剩余可用数量；守卫失败时用返回错误提示

## 4. 测试与验证

- [x] 4.1 在 `test/puzzleIntegration.test.js` 新增用例：断言 store 扣除来源格、清空出口约束、重置执行状态与重算，断言页面按钮无确认弹窗，断言 IPC/preload/API 贯通
- [x] 4.2 运行 `node --test test/puzzleIntegration.test.js` 与 `npm test`
- [x] 4.3 运行 `openspec validate --strict` 校验本变更，Vite 开发转换验证页面可编译
