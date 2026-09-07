# feedback-reply-notification 设计

## Context

反馈的云端数据与查询能力已齐备（见 proposal.md — Why）：`FeedbackService.listConversations()`（electron/modules/feedback/service.js:319）一次调用即返回每条反馈的 `adminReplyCount`、`lastMessageAuthor`、`replyState`，且渲染进程 IPC `electronApi.feedback.list()`（src/api/electron.js:367）已暴露。全链路无需主进程或云端改动。

现有约束：
- `feedback-conversations` spec 明确“不启动定时轮询”——本设计仅做启动时单次检查，符合该约束。
- 反馈按安装级匿名身份隔离，列表天然只含本安装的反馈，本地已见标记可安全以反馈 `id` 为主键。
- 渲染进程已有启动编排点 `startMainRuntime`（src/startup/mainRuntime.js:42），其中 `applicationUpdateStore.startupCheck()` 是“启动检查一次、promise 去重”的现成范式。
- localStorage 持久化先例：settingsStore（src/domains/settings/settingsStore.js:396）。

## Goals / Non-Goals

**Goals:**
- 管理员回复在玩家下次启动应用时即可达（弹窗 + 红点），形成反馈闭环。
- 查询次数最小化：活跃集合为空时零请求；有活跃反馈时每次启动至多一次。
- 未读状态与红点全部响应式，读后即清。

**Non-Goals:**
- 不做会话内定时轮询、窗口聚焦刷新、推送通知或系统托盘提示。
- 不给云端增加已读回执字段或反馈关闭/完结状态。
- 不做首页横幅（用户已明确否决横幅方案）。
- 不处理“反馈沉寂（已读移出活跃集合）之后管理员又主动追加消息”的找回——玩家手动进入“我的反馈”仍可见（用户已接受此取舍）。

## Decisions

### D1：活跃集合（active set）而非时间戳节流
- **选择**：本地持久化 `active: [反馈id]`，集合非空才在启动时查询。
- **原因**：查询资格与业务状态（是否在等答复/有未读）一致；时间戳节流会出现“读完还天天查”或“漏掉答复”的两难，且需额外节流参数。活跃集合同时天然覆盖“从未提交过反馈”的门槛（空集合），无需单独的提交历史记录。
- **备选（否决）**：24h 节流时间戳——用户明确质疑“读完了为什么还要查”；无门槛常查——浪费请求。

### D2：未读判定用 `adminReplyCount` 差值而非 `replyState`
- **选择**：本地存 `seen: { [反馈id]: 已见管理员消息数 }`，`item.adminReplyCount > seen[id] ?? 0` 即未读。
- **原因**：`replyState === 'replied'` 只反映“最后发言方”，玩家追问后（followed_up）管理员的新回复会被 `replyState` 归类掩盖；计数差值不受消息顺序影响，且写入时机自然（打开会话时写入当前计数）。
- **备选（否决）**：`lastMessageAt > seenAt` 时间戳——一条已见值即可推导，时间戳反而需要为每条反馈记时间。

### D3：通知用 ElNotification，红点用 Sidebar 条件渲染
- **选择**：`ElNotification`（右上角、含反馈标题、`onClick` 跳 `/settings?tab=feedback`）；Sidebar 设置项内绝对定位一个小圆点，绑定 store 的 `unreadCount > 0`。
- **原因**：均在 Element Plus 现有能力内，不新增依赖；应用启动后 ElNotification 可用（mainRuntime 在 UI 挂载后运行，`showInstalledUpdate` 弹窗同机制先例）。多条未读只弹一次汇总通知，避免轰炸。
- **备选（否决）**：首页横幅——用户否决；ElMessage——自动消失、不可点击跳转，达不到入口作用。

### D4：store 形态与挂载点
- **选择**：新建 `src/stores/feedbackReplies.js`（setup store，对齐 `applicationUpdate.js` 风格）：
  - state：`unread`（未读反馈摘要数组，驱动红点与通知）、`checked`（本次启动是否已查）；
  - actions：`startupCheck()`（读 localStorage → 空集合直接返回 → `electronApi.feedback.list()` → diff 出未读 → 弹一次通知（由调用方或 store 内完成，见 D5）→ 刷新 active 集合持久化）、`markSeen(feedbackId, adminReplyCount)`、`reactivate(feedbackId)`；
  - `startupCheckPromise` 去重，失败静默。
- 挂载点：`mainRuntime.js` 中 `void feedbackRepliesStore.startupCheck()`，与 `applicationUpdateStore.startupCheck()` 并列（fire-and-forget，不阻塞 `markMainRuntimeSettled`）。
- **备选（否决）**：塞进 `useDashboard`/DashboardView——通知与红点属于全局状态，Dashboard 只是宿主之一，放页面级 composable 会让 Sidebar 拿不到状态。

### D5：通知触发位置
- **选择**：`startupCheck()` 内在发现未读时直接调用 `ElNotification`，回调里 `router.push('/settings?tab=feedback')`。
- **原因**：mainRuntime 已 import ElMessage/ElMessageBox（mainRuntime.js:1），弹出 UI 在启动编排层是既有做法；不引回调和事件，最短路径。
- **备选（否决）**：DashboardView 挂载时读 store 弹通知——用户直接进设置页时也会路过 Dashboard，时机冗余；且红点场景下 Dashboard 不一定被访问。

### D6：已见标记写入时机
- **选择**：`openConversation(id)` 成功加载会话后调用 `markSeen`。`listConversations` 的列表项已含 `adminReplyCount`，FeedbackSettings 现有 `conversationItems` 可直接传值，无需为拿计数再发会话请求。
- **备选（否决）**：进入“我的反馈”标签即全部标记已读——粒度太粗，玩家可能只扫了一眼列表没读内容。

### D7：重新激活
- **选择**：`sendReply()` 成功回调里调用 `reactivate(selectedFeedbackId)`。
- **原因**：回复成功意味着玩家在等答复，反馈理应恢复检查资格；本地即可完成，无需等下次查询刷新。

### D8：本地存储键与结构
- **选择**：两个 key，值均为纯 JSON：
  - `feedback.seen`: `{ [反馈id]: 已见管理员消息数 }`；提交成功后即写入 `{id: 0}`（在现有 `submitFeedback` 成功分支加一行），使新反馈天然进入活跃集合。
  - `feedback.active`: `[反馈id...]`。
- 读写都做 try/catch 包裹（JSON 损坏时按空值处理），对齐 settingsStore 的容错习惯。
- **备选（否决）**：合并为单 key——语义不同（计数 vs 资格），合并后读写粒度纠缠；主进程 config 持久化——为此开 IPC 得不偿失。

## Risks / Trade-offs

- [管理员在反馈沉寂后主动追加消息不会被发现] → 用户已接受；玩家进入“我的反馈”仍可见列表标签与手动刷新。`// ponytail: 无兜底，若运营上出现该场景再考虑 7 天兜底查询`。
- [localStorage 被清空 → 活跃集合丢失，沉寂前的未读不再提醒] → 与“从未提交过”表现一致（spec 已定义）；玩家手动查看路径完好。
- [启动时多一次网络请求（仅活跃用户）] → 两个 GET，量级与现有 update.startupCheck 相当；空集合用户零请求。
- [ElNotification 在启动后立即弹出可能与其他启动提示（如更新弹窗）叠加] → 通知位于右上角、自动关闭，与 ElMessageBox 居中弹窗不冲突；多条未读只弹一次。
- [管理员消息数与本地已见值在并发读写下的错乱] → 单进程渲染端、启动单次检查 + 用户操作串行触发，无并发写入路径。

## Migration Plan

纯增量渲染进程功能，无数据迁移。回滚 = 移除 mainRuntime 挂载行即可（store 与 UI 不再被触发，遗留 localStorage key 无害）。
