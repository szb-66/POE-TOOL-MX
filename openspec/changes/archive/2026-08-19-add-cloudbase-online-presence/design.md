## Context

现有反馈功能已在 Electron 主进程中使用稳定随机设备标识完成 CloudBase 匿名登录，并通过内存会话访问 CloudBase PostgreSQL HTTP API。该身份和现有专用 PG 环境可以复用，但在线统计必须保持独立领域边界，不能把心跳塞进反馈提交业务或向 renderer 暴露令牌。应用已有跨开发版/正式版的单实例锁和统一关闭清理流程，适合作为心跳服务的生命周期边界。

## Goals / Non-Goals

**Goals:**

- 用服务端时间和稳定匿名 UID 得到可查询、可区分开发版与正式版的当前在线数。
- 把网络流量、数据库权限和持久化字段压到实现当前在线所需的最小范围。
- 让心跳在启动、运行和关闭过程中始终与核心功能故障隔离。

**Non-Goals:**

- 不建设用户分析、事件遥测、在线趋势历史或管理后台页面。
- 不展示在线人数，不增加 renderer IPC、用户设置或退出时离线请求。
- 不采集游戏账号、角色、模块运行状态、硬件指纹或用户行为。

## Decisions

### 1. 使用一行一安装的 PG 在线状态而非心跳事件表

新增 `public.app_presence`，以 `installation_uid text` 为主键，包含 `first_seen_at`、`last_seen_at`、`app_version`、`platform`、`arch`、`runtime_mode` 和固定 `schema_version`。每次上报执行 upsert，时间由数据库设置；`last_seen_at` 建索引供在线窗口查询。这样数据库规模与安装数相关，而不是与心跳次数相关，也不会形成活动轨迹。

备选的逐次心跳事件表能够分析趋势，但会快速消耗体验环境资源并超出当前在线需求，因此不采用。

### 2. 使用官方 PG REST 插入只写视图，由数据库内部 Upsert

CloudBase 官方关系型数据库 HTTP OpenAPI定义了表/视图 INSERT，但未定义数据库 RPC。主进程向 `POST /v1/rdb/rest/app_presence_heartbeat` 发送请求并使用 `Prefer: return=minimal`；请求体只包含 `app_version`、`platform`、`arch` 和 `runtime_mode`，视图本身不暴露 UID 或时间列。

`public.app_presence_heartbeat` 是只写视图：撤销 PUBLIC、`anon`、`authenticated` 的全部权限后，仅向 `anon` 授予 INSERT，不授予 SELECT/UPDATE/DELETE。它的 `INSTEAD OF INSERT` 触发器调用固定 `search_path` 的 `SECURITY DEFINER` 函数，函数负责：

- 从 `auth.uid()` 获取身份并拒绝空值或通用 `anon` 主体；
- 验证四个允许字段的长度与运行模式；
- 以认证 UID为主键在 `public.app_presence` 内部执行 upsert；
- 新记录使用服务端时间设置首次/最后在线，已有记录保留首次在线并只刷新最后在线及允许的运行元数据；
- 强制 `schema_version = 1`。

基础表 `app_presence` 对 `anon`、`authenticated` 撤销全部权限并保持 RLS 无客户端策略；汇总视图同样不可由桌面身份读取。触发器函数撤销 PUBLIC和桌面角色的直接 EXECUTE，仅能随已授权的视图 INSERT 触发。

先后排除的方案：数据库 RPC缺少官方原始 HTTP 路径；直接对基础表执行 REST Upsert 在冲突更新时需要 SELECT权限，真实开发环境返回 `DATABASE_42501`。向基础表开放 SELECT会违反不可读要求，因此采用官方 REST INSERT + 只写视图触发器，在不放宽读取权限的前提下完成数据库内部 upsert。

### 3. 汇总视图区分开发与正式运行模式

新增管理端只读视图，按 `last_seen_at >= now() - interval '3 minutes'` 汇总 `runtime_mode` 和 `app_version`。正式在线量只统计 `packaged`，真实 CloudBase 开发验证写入 `development`，避免验证数据污染正式统计。视图本身不授予桌面角色 SELECT。

### 4. 主进程独立心跳服务

新增独立 presence 服务，依赖窄接口形式的匿名认证会话和 `fetch`，不依赖反馈表、附件或 renderer。服务提供 `start()`、`stop()` 和单轮 `report()`：

- `start()` 立即异步调度首轮，随后使用 60 秒计时器；计时器 `unref()`，不阻止 Node 退出。
- `report()` 使用 in-flight promise 合并重叠调用，构造版本、平台、架构及 `app.isPackaged` 映射的运行模式，并调用文档化的只写视图 INSERT。
- 共用现有认证客户端的会话缓存；401 时使会话失效、重新认证并只重试一次。
- 其他失败在服务边界被吞并，不弹窗、不走 renderer IPC，也不写包含令牌的日志。
- `stop()` 清除计时器，不发送退出请求；云端 3 分钟窗口自然清除崩溃、强退和休眠实例。

心跳在取得跨进程锁、创建 CloudBase 身份依赖及注册主服务后启动，但不被 `await`，因此窗口展示不等待网络。统一资源清理调用 `stop()`，避免开发热重启残留计时器。

### 5. 配置保持显式且不引入管理凭据

在现有 CloudBase 客户端配置中加入只写心跳视图名或建立同环境的窄配置对象，继续使用完整 EnvId、区域和 Publishable Key。实现不得新增 API Key、SecretId、SecretKey、service-role token 或持久化访问令牌。配置无效时服务不启动请求。

## Risks / Trade-offs

- [网络抖动或系统休眠会使实际运行实例暂时不在线] → 使用三倍心跳周期的 3 分钟判定窗口；恢复后下一轮心跳自动重新计入。
- [强制心跳带来持续请求和资源点消耗] → 每安装每分钟一次、单请求门禁、一行 upsert，不存事件历史；开发和正式量分开观察。
- [复用反馈匿名身份造成命名耦合] → presence 仅依赖 `getSession`/`invalidate` 契约，不调用反馈业务服务；暂不做高冲突的认证模块重构。
- [安全定义触发器函数可能扩大权限] → 函数只接受视图的四个字段、固定 `search_path`、显式校验 `auth.uid()`，撤销直接 EXECUTE；真实匿名会话验证仅可 INSERT且不可读取任何在线对象。
- [两次早期 migration 均不是最终访问路径] → 保留不可变远端历史，最终收口 migration 删除旧基础表触发器/策略、撤销基础表写权限并创建只写视图；客户端仅保留最终 INSERT 路径。
- [现有工作区正在修改反馈和主进程代码] → 实现时逐段合并，不覆盖未提交改动；若出现多次失败，删除废弃尝试并保留单一心跳路径。

## Migration Plan

1. 只读确认目标 EnvId 的 PostgreSQL 后端、匿名登录和现有 migration 历史。
2. 初始 migration 创建基础表、索引、汇总视图和 RPC；第一次纠正 migration 删除 RPC并尝试基础表 Upsert，真实测试确认冲突更新需要 SELECT而不可采用。
3. 追加最终收口 migration，撤销基础表直写、删除旧触发器/策略，创建只写心跳视图和数据库内部 upsert 触发器；执行 plan/apply并查询实际对象与权限。
4. 使用真实开发版匿名会话验证视图 INSERT、基础表/视图读取拒绝、通用主体拒绝以及管理端服务端时间与汇总读回。
5. 接入主进程心跳服务并完成开发版测试；不执行安装包构建。
6. 回滚时先停止客户端心跳接入并撤销 `anon` 对心跳视图的 INSERT，再按 migration 回滚在线统计对象；不删除现有反馈资源。
