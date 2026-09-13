## Context

现有 Vue 导出页与 Electron IPC 已实现角色导出，新增生命周期服务与之独立。已有安装包含用户 BD，不能整目录覆盖。

## Goals / Non-Goals

支持本机 PoE 1 中文 PoB 管理；不提供后台自动更新、Windows 服务或 PoE 2 管理。

## Decisions

- 主进程保存空白默认路径和组件版本，前端仅通过受主窗口限制的 IPC 调用，避免渲染端控制任意下载源。
- 固定 GitHub 上游：Chuanhsing/PoeCharm main 提交归档及 PathOfBuildingCommunity/PathOfBuilding 最新稳定 Portable 资产。记录提交和 release tag，不猜测外部版本。
- 版本查询使用官方 main Atom 提交订阅及 releases/latest 重定向、expanded_assets 资产列表，不依赖匿名 REST API 配额。校验仓库、提交、发布标签和资产链接，保留发布页面提供的 SHA-256；页面结构异常时明确失败。
- 文件级事务使用目标目录内暂存、备份、原子写入的 journal；先备份完整写入集合并记录原文件是否存在，再写程序文件，避免大量文件时重复重写日志。成功后提交标记，失败及下次访问时逆序回滚，备份保留在管理目录供人工恢复。
- 保留已存在的 Builds、Settings.conf、Settings.xml、配置 ini 和自定义文件；缺失的默认配置和示例从归档补齐，不删除归档以外文件。拒绝符号链接、目录穿越和 Windows 别名路径。
- 原生进程按完整 executable path 检查，失败则阻止更新。使用 spawn 的 cwd 和无 shell 模式启动 PoeCharm，避免路径引用错误。
- 前端卡片在导出页顶部，目录编辑提交后检测，busy 时禁用目录及重复操作；进度通过事件推送，切页后再读取主进程状态。
- 手动路径通过回车或保存按钮提交；操作按钮使用前先提交输入路径，避免失焦保存与按钮点击竞争。ZIP 使用 yauzl 预检全部路径，流式 CRC 校验后流式解压，按实际处理/写入字节报告独立阶段进度。
- 操作使用 AbortController 和 operationId；stop IPC 不等待长操作返回，停止后保持互斥直至流关闭、暂存清理及必要回滚完成。写入之间检查取消，回滚不可取消，提交后不再接受取消。
- 状态携带递增 revision，前端忽略旧快照。状态观察者异常不传播至事务，业务错误包含阶段，通信拒绝后重新读取状态确认结果。日志只保存脱敏堆栈及阶段/操作标识。

## Risks / Trade-offs

- GitHub 限流及网络故障 → 超时、明确错误、暂存后提交，不破坏旧安装。
- Windows 文件锁及中断 → 写前日志和备份、恢复失败保留事务并禁止后续写入。
- 外部安装缺乏版本 → 显示版本未知，首次更新记录版本与备份。
- 备份占用空间 → 保留备份保障恢复，不自动清理用户文件。

## Migration Plan

新增本机配置无需迁移；使用 yauzl 的 RandomAccessReader 接口和原生 Readable 生命周期替代旧 fd-slicer 流，避免 Electron 中 EOF 被 destroyed 状态吞掉；移除不再使用的 extract-zip 直接依赖。现有导出行为和未提交工作保留。仅在开发版验证。

## 页面名称

侧栏和模块管理共用 featureCatalog 的“POB”名称，页面主标题同步为“POB”，保留现有 feature id、路由及导出功能。
