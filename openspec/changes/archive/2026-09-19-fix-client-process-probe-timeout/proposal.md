## Why

用户正常进程查询耗时 4118 毫秒，超过现有 3 秒限制，被误判为探测不可用；原始失败原因被吞掉。

## What Changes

- 会话与独立 PID 查询超时统一为 10 秒，分类传递失败原因。
- 手动核验显示具体中文原因，后台失败不确认退出。
- 复用现有诊断日志，重复失败限流并记录恢复。
- 后台查询完成后等待 1 秒再轮询，防止慢查询紧密连续执行。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `client-log-events`: 慢进程探测、错误诊断及轮询生命周期。

## Impact

影响进程查询、ClientEventsService、主进程日志注入及相关测试；无新增依赖，不改变成功返回格式。仅开发版验证，不打包。
