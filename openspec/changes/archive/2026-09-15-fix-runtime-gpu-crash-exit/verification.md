# 验证记录

- 2026-09-15：`node --test test/startupDiagnostics.test.js test/exitDiagnostics.test.js`，29 项全部通过。
- `npm run electron:dev -- --inspect=127.0.0.1:9237 --diagnostic-startup-json` 启动开发版。先确认当前进程已有 renderer 成功日志，再通过主进程调试连接向 Electron app 注入 `child-process-gone`，参数为 `{ type: 'GPU', reason: 'crashed', exitCode: 34 }`。
- 注入后主窗口仍可见且未销毁，进程 PID 不变；点击“历史战绩”后查询到可见的历史战绩对话框。当前会话保留 `child_crashed`、`type=GPU` 和 `exitCode=34`，startup-failure 与 startup-recovery 数量均为 0。
- 开发验证仅模拟事件处理链，不是底层 GPU 崩溃复现。临时调试表达式初次因换行转义报 SyntaxError，改用原始模板字符串后成功，没有向项目添加调试代码。完成后通过 app.quit 关闭本次开发进程。
- `openspec validate fix-runtime-gpu-crash-exit --strict` 通过；`git diff --check` 通过（仅已有换行风格提示）。未打包。
- 首次 `npm test`：2702 项，2699 通过、2 跳过、1 失败。失败为浮士德 Python 测试在 60 秒超时后返回空退出状态；单独重跑 `node --test test/faustusAutomation.test.js` 在约 5.8 秒通过。该测试未引用本次修改的 CrashGuard，初步判断是全量并发与开发版同时运行造成的资源竞争；不修改其超时或断言。
- 关闭开发版后运行 `npm test -- --test-concurrency=4`：2702 项，2700 通过、2 跳过、0 失败，退出码 0（约 187 秒）。最终差异仅包含 GPU 分流、对应回归测试及本 OpenSpec 变更，无失败修复方案遗留代码，原有工作区改动保留。
