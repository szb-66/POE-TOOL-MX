# 验证记录

## 行为测试

- 退出诊断、启动诊断、关闭控制、托盘、重启与更新：51 项通过。
- 检测诊断、公共标题时序、公共检测和背包：86 项通过。
- 检测测试通过真实 Python 子进程确认 `faulthandler.is_enabled()`，只终止测试自己创建的 child；检查 spawn、ready、exit、close 的会话、实例和 PID 关联。
- 覆盖日志写入抛错、错误输出裁剪与脱敏、配置重启、无消费者停止、应用清理及旧进程延迟结束。

## 开发版验证

执行 `npm run electron:dev -- --diagnostic-exit-after-interactive`，启动与退出均成功，未打包。
实际日志出现 `exit-request → exit-cleanup(started/succeeded) → exit-before-quit → exit-will-quit → exit-process/exit-quit(code=0)`，全程保留 `diagnostic_interactive` 首因以及同一 sessionId、pid。
实际检测进程还记录了 `config_restart` 的 stop-request、exit 和 close，没有误报异常。

额外的隐藏 Electron 窗口探针验证真实 `BrowserWindow.close()` 在同步 IPC 来源标记范围内发出 close 事件。首次探针顶层等待 ready 导致启动等待，修正脚本后断言通过；探针仍驻留的测试进程已按专用 PID 清理，临时脚本删除。这不是应用闪退的复现或修复证据。

## 完整检查

- 首次 `npm test`：2655 项，2650 通过、3 失败、2 跳过。本次新增的单实例诊断改变旧源码正则，已更新该断言；其余两项为同时变化中的 PoB 错误提示断言，本次未改 PoB 文件。独立复测单实例和 PoB 共 13 项通过。
- 第二次 `npm test`：2664 项，2661 通过、1 失败、2 跳过，耗时约 156 秒。本次相关测试全部通过；剩余失败为其他工作新增的 `test/pobExportCoverage.test.js` 第 41 行测试：`德瑞的恶念 / 丝绒手套` 返回“传奇身份存在歧义”，断言期望无错误。该模块、数据和测试未由本变更修改。全量检查已执行，但不能报告全量通过。
- `openspec validate diagnose-unexpected-application-exit --strict` 通过；变更文件的 `git diff --check` 通过。

## 使用与限制

日志仍在 `%APPDATA%/流放助手/logs/startup.log`，轮转文件为 `startup.prev.log`。按 sessionId 选取一次启动，用 firstSource、检测 instanceId、childPid、stopReason、code、signal 与 lastEventAt 对齐时序。
未知退出来源明确保留 unknown；Python 强制终止仍可能没有堆栈。尚未复现原始偶发退出，也未确认其根因；下一次现场据日志继续定位。本次未增加自动重启、修改退出偏好或自动操作策略。
