# 检测进程退出证据留存 — 实施任务

## 1. 检测脚本（Python）

- [x] 1.1 在 `src/assets/scripts/bag_auto_stash_template.py` 的 stdio 重配置之后、依赖导入（cv2/mss）之前启用 `faulthandler.enable()`
- [x] 1.2 `run_detection` 循环的 `except Exception` 分支在 `emit("detection-error")` 前向 stderr 输出 `traceback.format_exc()`
- [x] 1.3 `main()` 兜底 `except Exception` 同样向 stderr 输出完整 traceback

## 2. Electron 主进程

- [x] 2.1 协调器 close 处理器：自发退出（`this.child === child`）时 `console.error` 记录退出码与 stderr 尾部，发布状态新增结构化 `exitCode: code` 字段（`stop()` 等其余路径的重置状态同步清空该字段）
- [x] 2.2 `electron/modules/ipc/bag.js` 订阅回调将 `state.exitCode` 附加到 `bag-detection-stopped` 事件载荷

## 3. 渲染端诊断链路

- [x] 3.1 `src/stores/bag.js` 的 `setStopReason`：当 `failure.exitCode` 为有限数值时，以 `metadata.exitCode` 调用 `reportDiagnosticFailure`；无退出码的路径保持现状

## 4. 测试与验证

- [x] 4.1 `test/bagAutoStash.test.js` 新增断言：脚本包含 `faulthandler.enable()` 与循环/main 的 `traceback.format_exc()` stderr 输出；协调器 close 处理器记录退出码并发布 `exitCode`；`bag-detection-stopped` 载荷含 `exitCode`；`setStopReason` 组装 `metadata.exitCode`
- [x] 4.2 运行 `node --test test/bagAutoStash.test.js test/sharedInterfaceDetection.test.js` 通过
- [x] 4.3 运行 `npm test` 全量回归（仅存量失败 `test/stashTabSelection.test.js:185`，源于工作区中未提交的 crafting 模板改动，与本次无关）
- [x] 4.4 `openspec validate detection-exit-evidence --strict` 通过
