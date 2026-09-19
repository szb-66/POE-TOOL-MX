## Why

应用成功启动约 14 分钟后出现 GPU 子进程 crashed（exitCode=34），CrashGuard 仍调用启动失败提示并退出应用。根因是 GPU 故障分流没有使用已有的首次挂载完成状态。

## What Changes

- 首次挂载后的 GPU 退出只记录诊断，不触发启动恢复、失败弹窗或应用退出。
- 保留挂载前的恢复策略和所有非 GPU 处理，增加回归测试及开发版事件注入验证。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `startup-crash-diagnostics`: 明确首次挂载后 GPU 退出不属于启动失败，即使仍处于启动 30 秒内。

## Impact

影响 electron/modules/system/crashGuard.js 和启动诊断测试；无新接口、依赖或默认 GPU 设置变化。不追查底层 GPU 崩溃原因，不打包。
