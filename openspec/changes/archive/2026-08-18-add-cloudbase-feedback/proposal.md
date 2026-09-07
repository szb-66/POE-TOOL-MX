## Why

当前应用只提供跳转到项目地址的问题反馈入口，用户遇到问题时需要离开应用、手动整理环境信息和附件，反馈成本高且容易遗漏关键诊断证据。需要在设置页提供一个与现有脱敏诊断能力联动的应用内入口，并通过流放助手专用 CloudBase 环境可靠保存反馈与附件。

## What Changes

- 在设置页新增“问题反馈”分类，提供类型、标题、详细描述、可选联系方式、附件和脱敏诊断开关。
- 在 Electron 主进程增加窄化反馈 IPC，通过 CloudBase 官方 Auth、PG Storage 和 PostgreSQL HTTP API完成匿名认证、附件上传、记录写入、进度通知和失败回滚。
- 复用上海区域流放助手专用体验环境`poe-tool-d7gbuduivbdb631bf`，创建`app_feedback`表和私有`feedback`存储桶，配置匿名登录、Publishable Key、GRANT与RLS最小权限。
- 将现有脱敏诊断快照扩展为可由用户明确勾选后随反馈上传，同时继续禁止后台自动上传。
- 对附件数量、类型、单文件大小、总大小和反馈字段执行渲染进程与主进程双重校验。

## Capabilities

### New Capabilities

- `in-app-feedback`: 定义应用内反馈表单、附件、可选诊断、提交状态、反馈编号与失败保留行为。
- `cloudbase-feedback-submission`: 定义匿名 CloudBase 身份、云端记录、附件权限、上传回滚和敏感信息边界。

### Modified Capabilities

- `settings-tab-navigation`: 将“问题反馈”加入设置页分类，并限定全局重置操作不在反馈分类显示。
- `sanitized-diagnostics`: 允许用户明确勾选后把脱敏诊断作为反馈附件上传，同时保持默认不收集和禁止自动上传。

## Impact

- 前端：设置页 Tab、独立反馈组件、表单与附件交互。
- Electron：preload API、IPC注册、CloudBase HTTP客户端、匿名令牌和设备标识持久化、诊断快照复用。
- 云端：现有流放助手专用 CloudBase PG体验环境、匿名认证、PostgreSQL表、PG Storage存储桶和RLS规则。
- 测试：反馈校验与服务单元测试、IPC契约、设置Tab契约、开发版真实云端冒烟验证。
- 无破坏性变更；不新增应用内反馈历史或管理端，不执行打包或发布。
