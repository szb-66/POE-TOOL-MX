## 1. 主进程快照广播（已完成）

- [x] 1.1 在 main.js 混沌配方自动取件的 onStatusChange 挂接点，completed/stopped 事件时向主窗口发送 chaos-recipe-snapshot-updated，携带 chaosRecipeService.snapshot
- [x] 1.2 确认主窗口 store 现有 onSnapshotUpdated 处理链（snapshot 更新、resetSingleSelections、syncRuntime 回推浮窗）覆盖单件勾选对齐

## 2. 浮窗失败原因保留（已完成）

- [x] 2.1 ChaosRecipeControlOverlayView.vue 中 applyState 不覆盖 actionReason/recipeSelectionReason 失败原因
- [x] 2.2 selectControlRecipe/run 失败路径设置的原因在最终 applyState 后仍保持可见

## 3. 取件后数量不再回旧

- [x] 3.1 src/stores/chaosRecipe.js 的 listenAutomation 移除 completed 后 setTimeout 自动网络 refresh，取件后数量更新只依赖快照广播

## 4. 切换配方勾选即时对齐

- [x] 4.1 controlOverlay.js 的 selectRecipe 切换单件配方时基于 service.snapshot 最新候选重算勾选并同步写入 runtime.selectedItemIdsByRecipe

## 5. 浮窗取件时序接入全局设置

- [x] 5.1 src/stores/chaosRecipe.js 的 runtimePayload 增加 operationDelayMs/adaptiveTiming/adaptiveTimeoutMs/fixedTiming（从 settingsStore 读取，与 stashPickup 对齐）

## 6. 测试与验证

- [x] 6.1 新增行为测试：取件 completed 事件后不再调用 electronApi.chaosRecipe.refresh
- [x] 6.2 新增行为测试：runtimePayload 携带全局时序四字段
- [x] 6.3 新增源码断言：selectRecipe 切换单件配方时基于快照候选重算勾选并同步 selectedItemIdsByRecipe
- [x] 6.4 运行受影响的 node --test 测试文件并确认全绿
- [x] 6.5 运行 npm test 全量回归并确认 openspec validate --strict 通过

## 7. 消除取件后运行时迟到覆盖竞态

- [x] 7.1 src/stores/chaosRecipe.js 的 onSnapshotUpdated 移除 syncRuntime 回推，只更新 snapshot 与 resetSingleSelections
- [x] 7.2 更新取件广播测试：断言快照与单件勾选重置仍生效且 updateRuntime 不再被调用，并补源码断言防回归
- [x] 7.3 运行受影响的 node --test 测试文件并确认全绿
- [x] 7.4 运行 npm test 全量回归并确认 openspec validate --strict 通过
