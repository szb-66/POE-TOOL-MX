# feedback-reply-notification 提案

## Why

当前玩家提交反馈后，只有主动进入 设置 → 问题反馈 → 我的反馈 才能发现管理员是否已回复；多数玩家不会主动回访，管理员的答复长期沉睡，反馈闭环断裂。本变更让应用在启动时主动检查未读回复，通过通知和小红点把玩家引向答复。

## What Changes

- 新增渲染进程 store `feedbackReplies`：维护本地“活跃反馈集合”与“已见回复数”，启动时按需查询一次反馈列表，识别管理员新回复。
- 启动查询有门槛：本地活跃集合为空（从未提交过反馈，或全部反馈已读完沉寂）时完全跳过，不发网络请求。
- 发现未读回复时：
  - 弹出 ElNotification 右上角通知（含反馈标题），点击跳转 `/settings?tab=feedback`；
  - 侧边栏“设置”菜单项亮起小红点，存在未读期间持续显示。
- 玩家在“我的反馈”中打开对应会话即写入已见标记，红点与未读数响应式清零。
- 玩家发送回复成功后，该反馈重新进入活跃集合，恢复启动检查资格。
- 不新增主进程 IPC、不改动云端数据结构、不引入定时轮询（遵守现有 feedback-conversations 约束，仅启动时单次检查）。

## Capabilities

### New Capabilities

- `feedback-reply-notification`: 启动时检查当前安装反馈的未读管理员回复，并通过通知弹窗与侧边栏红点提示；由本地活跃集合与已见标记驱动，沉寂反馈零查询。

### Modified Capabilities

（无——`feedback-conversations` 的既有 requirement 不变；启动检查是其列表能力之上的新消费行为。）

## Impact

- **新增**：`src/stores/feedbackReplies.js`（Pinia store）。
- **修改**：
  - `src/startup/mainRuntime.js`（启动时调用一次 `startupCheck()`）；
  - `src/components/Layout/Sidebar.vue`（设置项小红点）；
  - `src/domains/settings/FeedbackSettings.vue`（打开会话写已见标记、回复成功重新激活）；
  - `src/api/electron.js` 如需（复用现有 `feedback.list`，预计无改动）。
- **零改动**：`electron/` 主进程、云端表结构与 API、依赖清单。
- **数据**：localStorage 新增 2 个 key（`feedback.seen`、`feedback.active`），无敏感信息。
