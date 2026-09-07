## Context

设置页当前由单个Vue组件维护五个会话级Tab，Electron使用`contextIsolation`和窄化preload API。页面CSP未开放CloudBase连接，生产页面还会运行在`file://`来源；CloudBase官方Web路径要求安全来源，因此不能把Web SDK直接放进渲染进程。现有主进程已经能够生成schema v3脱敏诊断快照，但当前只支持主动保存到本地文件。

## Goals / Non-Goals

**Goals:**

- 让开发版和未来打包版共用同一条CloudBase提交链路。
- 将云端身份、令牌、文件读取与HTTP细节限制在Electron主进程。
- 对用户输入、附件和诊断执行双边界校验，并在失败时回滚本次上传。
- 保持反馈模块与本地设置Store解耦，不让“重置设置”影响反馈草稿。

**Non-Goals:**

- 不建设应用内反馈历史、回复、状态同步或管理端。
- 不使用传统NoSQL、云函数、云托管或静态托管。
- 不执行安装包构建、生产发布或自动迁移旧数据。

## Decisions

### 1. 主进程调用CloudBase官方HTTP API

使用Node内置`fetch`从主进程调用匿名认证、PG Storage和PostgreSQL官方HTTP API，渲染进程只调用`feedback.pickAttachments`、`feedback.submit`和`feedback.onProgress`。这避免`file://`安全来源不确定性、CSP放宽和令牌进入页面。备选的Web SDK直连开发成本较低，但不能证明打包来源兼容，因此不采用；Node管理SDK需要高权限凭据，不得随桌面应用分发。

### 2. 复用流放助手专用PG体验环境

复用`ap-shanghai`区域、别名`poe-tool`、EnvId为`poe-tool-d7gbuduivbdb631bf`的流放助手专用体验环境。业务数据使用`public.app_feedback`表，附件使用私有PG Storage桶`feedback`。Publishable Key允许随桌面应用分发，但只由主进程读取；腾讯云Secret和管理API Key不进入仓库或应用。环境配置提供环境变量覆盖，缺失时反馈模块安全禁用。该环境不是永久免费的，费用与到期风险通过控制台告警和运维检查管理。

### 3. 匿名身份与安装级设备标识

在`userData`下保存随机UUID设备标识，不保存硬件标识。主进程用Publishable Key和`x-device-id`执行匿名登录，内存缓存AccessToken并在401时刷新或重新登录一次。令牌不写日志、不经IPC发送，也不持久化；同一设备ID使重启后的匿名UID保持稳定。

### 4. 附件选择与校验

附件通过主进程原生文件对话框选择，返回渲染层的摘要包含选择令牌、文件名、大小和类型，不暴露完整路径。主进程内部保存本次选择映射，并在提交前重新`stat`和读取，校验数量、扩展名、大小及选择后变化。诊断由主进程复用现有快照构建器直接生成内存JSON，不经过临时文件。

### 5. 上传后写记录并补偿回滚

主进程为本次提交生成`FB-YYYYMMDD-<随机段>`编号，在私有`feedback`桶内按`{uid}/{feedbackId}/{uuid}-{safeName}`逐个获取签名上传信息并PUT文件，全部完成后才通过PostgreSQL HTTP API向`public.app_feedback`插入记录。任何失败都会调用PG Storage删除接口清理本次已上传对象；清理失败只记录安全原因码，不改变主提交失败结果。

### 6. 数据与权限模型

反馈表采用snake_case物理列：`feedback_id`、`category`、`title`、`description`、可选`contact`、`attachments jsonb`、`diagnostics_included`、`submitter_uid DEFAULT auth.uid()`、`status DEFAULT 'new'`、`app_version`、`platform`、`arch`、`locale`、`created_at DEFAULT now()`和`schema_version DEFAULT 1`。CloudBase匿名登录JWT映射到`anon`数据库角色，因此仅向`anon`授予INSERT；RLS的INSERT policy要求`submitter_uid = auth.uid()`且`auth.uid() <> 'anon'`，以排除只有Publishable Key而未完成匿名登录的通用主体。不授予SELECT/UPDATE/DELETE。`storage.objects`使用相同身份约束，允许当前身份在`feedback`桶自己的UID前缀内INSERT、DELETE及删除接口所需的SELECT；禁止公开访问、UPDATE和跨用户读取或目录遍历。

### 7. UI设计规格

- Purpose Statement：在不离开应用的情况下提交结构化问题和必要证据，同时清楚告知隐私边界与上传状态。
- Aesthetic Direction：Industrial/utilitarian，延续现有工具型设置页。
- Color Palette：复用项目`--el-color-primary`、`--el-color-warning`、`--text-primary`、`--text-secondary`、`--border-base`和背景变量；这是现有设计系统对通用UI技能配色限制的窄化覆盖。
- Typography：复用项目已批准的中文字体栈与Element Plus排版，不新增远程字体；这是桌面应用一致性约束。
- Layout Strategy：宽屏使用左侧约三分之二表单、右侧约三分之一附件与隐私说明的非对称双栏，窄屏按表单、附件、提交顺序折叠为单栏。

## Risks / Trade-offs

- [匿名入口可能被滥用并消耗体验版资源点] → 使用专用环境、严格PG与存储RLS、附件白名单和容量限制，并配置资源用量与费用告警。
- [CloudBase权限规则传播有延迟] → 资源配置后轮询查询并在开发版执行真实写入验证，不把首次权限错误立即归因于代码。
- [预签名上传成功但补偿删除失败] → 记录匿名UID、反馈编号和安全原因码以便管理端清理，不记录本地路径或令牌。
- [原生选择摘要在文件变化后过期] → 提交前重新校验文件身份、大小、扩展名与可读性，拒绝变化项。
- [真实云环境不可用会阻断端到端验收] → UI与服务使用模拟HTTP完成自动测试，并明确报告真实环境未验证项；不伪造成功。

## Migration Plan

1. 绑定并复查现有上海环境`poe-tool-d7gbuduivbdb631bf`，确认PostgreSQL和PG Storage能力可用。
2. 开启匿名登录、确保Publishable Key，通过版本化迁移创建`public.app_feedback`表，并创建`feedback`桶、GRANT/RLS及告警。
3. 将生成的完整EnvId、区域和Publishable Key写入主进程反馈配置，保留环境变量覆盖。
4. 实施主进程服务、IPC与设置页反馈组件，先以模拟HTTP完成自动测试。
5. 在开发版执行真实文本、附件、诊断、断网和回滚验证，再查询CloudBase PG记录与存储对象核对结果。
6. 回滚时先禁用反馈入口和匿名权限，再清理测试记录；不删除环境或生产数据，除非得到单独确认。
