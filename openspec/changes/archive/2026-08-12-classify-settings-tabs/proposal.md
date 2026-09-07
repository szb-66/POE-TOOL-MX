## Why

设置页将账号、自动操作、界面识别、覆盖层和系统更新等十一个区块纵向连续排列，用户需要长距离滚动才能找到目标设置。按任务分类为 Tab 可以缩短单次浏览路径，同时保留现有设置的保存和即时生效行为。

## What Changes

- 将设置页改为“通用、自动操作、界面识别、覆盖层、系统”五个横向 Tab。
- 将现有设置区块按使用任务归入对应 Tab，全局重置按钮继续位于 Tab 外。
- 在本次应用运行期间记住最后打开的 Tab，并在切换分类时将设置内容滚动到顶部。
- 保持所有 Tab 内容挂载，避免切换分类中断正在进行的页面交互或状态监听。

## Capabilities

### New Capabilities

- `settings-tab-navigation`: 设置页分类导航、会话级选中状态和切换行为。

### Modified Capabilities

无。

## Impact

- 主要影响 `src/domains/settings/SettingsView.vue` 的模板、少量页面状态和样式。
- 新增设置页结构测试，不修改 Pinia 持久化格式、Electron IPC、设置处理函数或第三方依赖。
