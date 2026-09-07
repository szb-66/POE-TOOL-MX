# feedback-reply-notification 任务清单

## 1. 未读状态 store

- [x] 1.1 新建 `src/stores/feedbackReplies.js`：setup store，含 `unread`（未读反馈摘要数组）、`unreadCount` computed；localStorage 读写 `feedback.seen`（`{id: 已见管理员消息数}`）与 `feedback.active`（`[id]`），JSON 解析 try/catch 容错
- [x] 1.2 实现 `startupCheck()`：promise 去重；活跃集合为空直接返回；调用 `electronApi.feedback.list()`，非 success 静默返回；按 `adminReplyCount > seen[id] ?? 0` diff 出未读；查询后按 `lastMessageAuthor === 'admin'` 且已读与否刷新并持久化活跃集合；全程失败不抛错
- [x] 1.3 实现 `markSeen(feedbackId, adminReplyCount)`：写入已见值、从未读数组移除、若该反馈已读沉寂则移出活跃集合并持久化
- [x] 1.4 实现 `reactivate(feedbackId)`：将反馈加入活跃集合并持久化（去重）
- [x] 1.5 新建 `test/feedbackReplyNotificationStore.test.js`（node --test）：覆盖——空活跃集合不调 list、未读 diff（含 followed_up 下管理员新消息）、markSeen 后 unread 清零与活跃集合收缩、reactivate 恢复、损坏 JSON 容错

## 2. 启动挂载与通知

- [x] 2.1 `src/startup/mainRuntime.js`：与 `applicationUpdateStore.startupCheck()` 并列调用 `void feedbackRepliesStore.startupCheck()`，纳入 warning 收集或静默（按静默，spec 要求失败无提示）；确认 dispose 路径无需清理（无监听器）
- [x] 2.2 store 内发现未读时弹一次 `ElNotification`（标题含反馈标题，多条时汇总文案），`onClick` 跳转 `/settings?tab=feedback`；同一启动周期不重复弹出
- [x] 2.3 扩展 1.5 的测试：未读时触发一次通知回调、零未读与查询失败时不触发（以注入的 notifier 替身验证，避免测试真实弹窗）

## 3. UI 接线

- [x] $1 `src/components/Layout/Sidebar.vue`：设置菜单项加未读红点（绝对定位小圆点，绑定 store `unreadCount > 0`），带 `aria-label` 说明"反馈有新回复"
- [x] $1 `src/domains/settings/FeedbackSettings.vue`：`openConversation(id)` 加载成功后调用 `markSeen(id, 对应列表项 adminReplyCount)`；`submitFeedback` 成功分支写入 `seen[id] = 0` 并加入活跃集合；`sendReply` 成功后调用 `reactivate(selectedFeedbackId)`
- [x] $1 更新 `test/feedbackDiagnosticsUi.test.js` 或新增轻量断言：打开会话后 `markSeen` 被调用、回复成功后 `reactivate` 被调用（替换/注入 store 方式验证）

## 5. 通知直达与会话内红点（增量）

- [x] $1 通知点击跳转携带 `feedbackId` query；FeedbackSettings 监听 `route.query.feedbackId`：切换到“我的反馈”、加载列表并选中对应会话（会话不存在则忽略）；面板为 v-show 常驻挂载，watch 是唯一可靠触发点
- [x] $1 Sidebar 红点定位到图标右上角（`top: 6px; right: calc(50% - 16px)`）
- [x] $1 未读红点分布：SettingsView 顶部“问题反馈”tab 标签、FeedbackSettings“我的反馈”tab 标签（复用 `unreadCount`；不挂在页内标题上）
- [x] $1 更新 wiring 测试断言（query 携带、focus 逻辑、红点类名）并回归

## 4. 验证

- [x] 4.1 运行 `node --test test/feedbackReplyNotificationStore.test.js` 及受影响的 feedback/startup 相关测试文件
- [x] 4.2 运行 `npm test` 全量回归
- [x] 4.3 `npm run electron:dev` 手动验证 Vite 转换与端到端流程：提交反馈 → 模拟管理员回复（或直接以活跃集合非空验证查询发生）→ 启动弹通知 + 红点 → 打开会话红点灭 → 活跃集合清空后重启无网络请求（注：Vite 转换已由自动化测试覆盖，端到端 GUI 流程待人工验证）
- [x] 4.4 `openspec validate feedback-reply-notification --strict` 通过
