# cloudbase-feedback-submission Specification

## Purpose

为应用内反馈提供与桌面运行环境兼容的CloudBase匿名提交通道，在不分发管理凭据的前提下保存反馈和附件，并保证失败操作不会留下不一致数据。

## Requirements

### Requirement: 反馈使用稳定匿名身份提交
系统 SHALL 为当前安装生成并持久化随机设备标识，通过已启用的匿名登录换取用户访问令牌，并在应用运行期间复用有效令牌。

#### Scenario: 首次提交
- **WHEN** 当前安装尚无设备标识或匿名会话
- **THEN** 主进程生成并保存随机设备标识
- **AND** 使用Publishable Key和设备标识完成匿名登录

#### Scenario: 访问令牌失效
- **WHEN** CloudBase返回访问令牌失效或未授权
- **THEN** 主进程刷新令牌或重新执行匿名登录并仅重试一次原操作
- **AND** 不把令牌、Publishable Key或Authorization内容发送给渲染进程

### Requirement: 反馈数据按最小权限保存
系统 SHALL 将反馈保存到流放助手专用CloudBase环境的`public.app_feedback`表，并将附件保存到私有`feedback`存储桶中当前匿名用户和反馈编号对应的对象键。

#### Scenario: 创建反馈记录
- **WHEN** 已认证用户提交有效反馈
- **THEN** 云端记录包含反馈编号、内容、可选联系方式、附件元数据、提交者UID、`new`状态、应用与系统基础信息、服务端时间和schema版本
- **AND** PostgreSQL的GRANT与RLS仅允许已完成匿名登录的`anon`角色插入`submitter_uid = auth.uid()`且UID不是通用`anon`主体的记录，不能读取、更新或删除反馈记录

#### Scenario: 上传附件
- **WHEN** 已认证用户上传有效附件
- **THEN** 完整对象路径符合`feedback/{uid}/{feedbackId}/{uuid}-{safeName}`，其中`feedback`为存储桶名
- **AND** 客户端不能公开读取、列出或操作其他用户的对象；仅允许当前身份读取自身对象元数据以满足PG Storage删除前置校验

### Requirement: 云端提交保持原子可观察结果
系统 SHALL 先完成全部附件上传再创建反馈记录，并在任何后续阶段失败时清理本次已上传对象。

#### Scenario: 部分附件上传失败
- **WHEN** 一个或多个附件未成功上传
- **THEN** 系统不创建反馈记录
- **AND** 删除本次已经成功上传的对象

#### Scenario: 记录写入失败
- **WHEN** 全部附件上传成功但反馈记录创建失败
- **THEN** 系统删除本次全部已上传对象
- **AND** 向页面返回失败结果而不是反馈编号

#### Scenario: 回滚删除失败
- **WHEN** 主操作失败且一个或多个对象无法删除
- **THEN** 系统仍将提交标记为失败
- **AND** 记录不含本地路径或凭据的清理失败诊断，供开发者排查孤儿对象

### Requirement: 云端配置与凭据边界明确
系统 MUST 仅在主进程使用CloudBase完整EnvId、区域和Publishable Key，且 MUST NOT 在应用代码、配置、日志或IPC中存储或传播腾讯云管理密钥、管理API Key或用户访问令牌。

#### Scenario: 云端配置缺失
- **WHEN** EnvId、区域或Publishable Key缺失或无效
- **THEN** 反馈入口显示服务暂不可用并禁止提交
- **AND** 应用其他功能继续正常工作

#### Scenario: 记录错误
- **WHEN** CloudBase HTTP API返回错误
- **THEN** 主进程将错误映射为稳定错误码和安全中文提示
- **AND** 日志不包含Authorization、令牌、联系方式或完整本地路径
