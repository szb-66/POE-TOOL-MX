## Why

当前应用没有可用于判断“正在运行流放助手的安装实例数”的云端数据，维护者无法在 CloudBase 后台查看当前在线规模。需要增加一个最小化、与业务功能隔离的匿名在线心跳，让开发版和正式版在线量可区分统计，同时保证上报故障不影响应用启动或使用。

## What Changes

- 应用取得单实例锁并完成主进程服务初始化后，使用现有 CloudBase 匿名安装身份立即上报在线心跳，之后每 60 秒上报一次。
- 在 CloudBase PostgreSQL 中保存每个匿名安装的首次/最后在线时间及最小运行环境字段，并按最近 3 分钟心跳汇总当前在线量。
- 区分 `development` 与 `packaged` 运行模式，开发验证数据不计入正式版在线量。
- 通过官方 PostgreSQL REST 插入只写心跳视图，由数据库安全触发器在内部 Upsert 在线表；桌面客户端不能读取或枚举在线记录。
- 在线统计强制后台启用，不新增人数展示、设置开关、renderer IPC 或用户操作入口。
- 心跳认证、网络或 CloudBase 故障静默降级，仅等待下一周期重试，不阻塞或中断其他功能。

## Capabilities

### New Capabilities

- `cloudbase-online-presence`: 定义匿名安装在线心跳、当前在线判定、最小数据范围、权限边界和故障隔离。

### Modified Capabilities

无。

## Impact

- Electron 主进程：新增在线心跳服务并接入应用启动和关闭生命周期，复用现有 CloudBase 匿名认证会话。
- CloudBase：新增 PostgreSQL migration、在线记录表、只写心跳视图、安全触发器、索引与后台汇总视图。
- 网络契约：主进程使用 CloudBase 官方 PG REST向只写视图 INSERT；不新增渲染进程或公开应用接口。
- 验证：新增心跳单元测试、数据库权限测试和可选真实开发环境闭环测试；默认不执行打包。
