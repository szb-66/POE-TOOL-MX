# 检测退出证据持久化落盘 — 实施任务

## 1. 主进程

- [x] 1.1 `electron/main.js` 构造 `InterfaceDetectionCoordinator` 时传入 `logger: startupLog`
- [x] 1.2 `electron/modules/interfaceDetection/coordinator.js` 构造函数接收 `logger = console`；close 处理器在自发退出（`this.child === child`）时调用 `this.logger.record({ phase: 'interface-detection-exit', outcome: 'failed', reasonCode: 'exit_code_<code>', message: terminalReason + stderr 尾部 })`
- [x] 1.3 `detection-error` 事件处理器落盘 `interface-detection-error` 记录（含 failureCode 与原因）

## 2. 测试与验证

- [x] 2.1 `test/bagAutoStash.test.js` 新增断言：main.js 传入 `logger`；close 处理器以注入的 fake logger 调用 `record` 且包含退出码与 stderr；detection-error 落盘含 failureCode
- [x] 2.2 `node --test test/bagAutoStash.test.js` 通过；`npm test` 全量回归（1990 通过 0 失败 2 跳过）
- [x] 2.3 `openspec validate persist-detection-exit-evidence --strict` 通过

## 3. 根因取证与修复（实施后执行）

- [x] 3.1 证据落盘上线后结合 events.json 结构化 `exitCode` 定位根因：并非 Python 崩溃——独立直跑检测脚本 4 分钟无退出，而应用内每次启动 +3.5 秒即报"检测进程异常退出"（事件无 `exitCode` metadata；落盘无 close 记录）。真实根因是协调器启动竞态：bag 与 item-inspection 等消费者并发注册且 config 指纹不同，触发 `restart()` 杀掉在启动窗口内的子进程，而旧 `start()` 的 catch 无条件把 `describeDetectionExit` 作为失败原因发布到 UI；另有 `terminalReason` 粘滞把干净的 `code=0` 自退出伪装成失败（exitCode 0 的事件）
- [x] 3.2 针对性修复（均在协调器共享路径）：`start()` catch 增加 `this.child !== child` 守卫——启动期间被 restart/stop 接管时吞掉陈旧失败不再误报；close 处理器对 `code === 0` 一律按 `process-ended` 处理，不再被陈旧 terminalReason 污染。`node --test` 73 通过；`npm test` 全量 1997 通过 0 失败；应用实测重启后检测进程持续存活、无失败事件
