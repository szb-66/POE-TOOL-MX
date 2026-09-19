## Context

见 proposal.md。现有服务共享并发探测，但固定 interval 会让慢查询完成后很快再次执行；异常统一转 null。

## Goals / Non-Goals

容纳 4.1 秒正常查询并提供可诊断错误。保持新鲜会话核验，不更换 PowerShell、不新增配置、不绕过自动化预检。

## Decisions

- 会话和 PID 查询共用 10000ms 超时和 JSON 执行器；失败抛 ProcessProbeError，携带 code、elapsedMs、exitCode、signal，禁止记录原始命令输出。
- 服务把失败收敛为原有不可用状态，同时保存本代查询错误用于手动提示；旧代结果不能修改诊断或状态。
- 注入现有 startupLog，按查询种类限流同类错误 60 秒；恢复记录一次。日志异常不得干扰探测。
- 用完成后 setTimeout(1000) 替代 interval，按 generation 防止停止后复活。保持请求复用以及手动等待旧请求后另开新查询。

## Risks / Trade-offs

- 真失败等待最长增至 10 秒 → 明确超时提示，保留取消检查和状态代际隔离。
- 查询慢的系统原因未知 → 保留耗时与错误码用于后续诊断，不作推断。

## Migration Plan

无需迁移；相关测试和全量测试后使用开发版验证，不打包。可回退本变更，保留无关改动。
