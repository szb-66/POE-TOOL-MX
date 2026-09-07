## MODIFIED Requirements

### Requirement: 反馈数据按最小权限保存
系统 SHALL 将反馈保存到流放助手专用CloudBase环境的`public.app_feedback`表，将后续消息保存到`public.app_feedback_messages`表，并将附件保存到私有`feedback`存储桶中当前匿名用户和反馈编号对应的对象键。

#### Scenario: 创建反馈记录
- **WHEN** 已认证用户提交有效反馈
- **THEN** 云端记录包含反馈编号、内容、可选联系方式、附件元数据、提交者UID、`new`状态、应用与系统基础信息、服务端时间和schema版本
- **AND** PostgreSQL的GRANT与RLS仅允许已完成匿名登录且UID不是通用`anon`主体的角色插入`submitter_uid = auth.uid()`的记录

#### Scenario: 读取自己的反馈与消息
- **WHEN** 已认证匿名身份读取反馈历史或会话
- **THEN** PostgreSQL只返回`submitter_uid = auth.uid()`的反馈安全字段和对应消息
- **AND** 不授予反馈状态、提交者UID、管理字段、其他身份数据或消息修改删除权限

#### Scenario: 追加自己的用户消息
- **WHEN** 已认证匿名身份向自己拥有的反馈追加合法消息
- **THEN** PostgreSQL只允许写入发送方为`user`、提交者为`auth.uid()`且满足消息数量和频率限制的记录
- **AND** 用户不能写入`admin`消息、改变反馈状态或覆盖已有消息

#### Scenario: 上传附件
- **WHEN** 已认证用户上传原始反馈或后续消息的有效附件
- **THEN** 对象路径绑定当前UID、反馈编号和可验证的附件作用域
- **AND** 客户端不能公开读取、列出或操作其他用户的对象；当前身份只能访问属于自己反馈的附件

