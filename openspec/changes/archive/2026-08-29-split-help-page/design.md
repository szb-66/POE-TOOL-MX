## Context

帮助中心现状：`src/views/Help.vue`（展示壳：搜索 + 分类导航 + 内容区）+ `src/domains/help/helpContent.js`（全部文案数据）。`helpContent.js` 目前仅被 Help.vue 消费；`/help` 路由经 `src/router/pageLoaders.js` 懒加载；侧边栏"帮助"入口在 `src/components/Layout/Sidebar.vue`；设置页分类白名单在 `src/router/settingsNavigation.js`。原主题卡片渲染（折叠条目 + paragraph/heading/list/callout 块）内联在 Help.vue 模板中，迁移时可直接复用其 markup 与样式。

## Goals / Non-Goals

**Goals:**
- 帮助内容零丢失地就近分配到 11 个一级页面与设置"关于"Tab。
- 一个共享抽屉组件 + 一个主题列表组件，页面接入成本为一行标签。
- 彻底移除帮助中心（路由、视图、菜单、搜索、深链及其配套导出），不保留死代码。

**Non-Goals:**
- 不做抽屉内局部搜索、主题收藏或展开状态持久化。
- 不改动帮助文案本身（文字原样搬运）。
- 不调整 MainLayout、路由过渡、预加载等其他布局机制。

## Decisions

1. **呈现形式：右下角固定"?"按钮 + `el-drawer`（用户已确认）**。备选的顶部折叠面板会把长文强加进页面信息层级，对话框则打断操作流；抽屉可展开大篇幅做装长文且随时关闭。
2. **组件落位 `src/domains/help/`**：`HelpTopicList.vue`（props `topics`，渲染可折叠主题卡与块内容，样式从 Help.vue 迁移）与 `PageHelpDrawer.vue`（props `topics`/`title`，内含固定定位按钮与 `el-drawer`，仅一个主题时默认展开首个）。帮助是独立 domain 目录，放这里符合现有按域组织，不放公共 `src/components/`。
3. **内容分配走数据层而非路由表**：各页面显式传入自己的主题数组（如 `:topics="[moduleTopicById('items')]"`），而非组件内按 `route.path` 反查。页面与内容的对应关系在模板中一目了然，也天然满足"工具站/模型训练页不接入即无入口"。
4. **快速开始转为 blocks**：首页抽屉将 `QUICK_START_STEPS` 四步拼成一个 `getting-started` 主题（paragraph + list + callout），复用同一块渲染器；原帮助页的 quick-cards 网格样式随帮助中心一并废弃（抽屉是线性阅读面，不需要四列卡片）。
5. **做装参考的归属**：14 条全部进模拟页抽屉（原分类完整迁移）；`crafting-price-check` 一条额外并入查价页抽屉——同一数据对象在两处引用，不复制文案。
6. **helpContent.js 瘦身**：删除 `HELP_CATEGORIES`、`HELP_TOPICS`、`findHelpTopic`、`searchHelpTopics`、`normalizeHelpQuery`、`topicText`、`blockText`（仅帮助中心使用，删除后 grep 无残留）；保留 `MODULE_TOPICS`、`FAQ_TOPICS`、`CRAFTING_TOPICS`、`GENERAL_TOPICS`、`QUICK_START_STEPS`；新增 `moduleTopicById(id)`。主题 `id`/`category` 字段保持稳定，防止遗漏引用。
7. **设置"关于"Tab**：`SettingsView.vue` 新增 `<el-tab-pane label="关于" name="about" />` 与对应 `v-show` 面板，内含版本卡片（包元数据版本 + GitHub 链接，样式迁移自 Help.vue 的 `.version-card`）+ `HelpTopicList` 渲染 `GENERAL_TOPICS` 的 3 个 about 主题；`settingsNavigation.js` 白名单加入 `about`，Tab 持久化与 `?tab=` 同步逻辑自动生效，无需额外改动。
8. **路由与菜单清理一次做完**：删除 `router/index.js` 的 `/help` 条目、`pageLoaders.js` 的加载器、`Sidebar.vue` 的菜单项（含 `warmRoute('/help')`）、整个 `src/views/Help.vue`，避免留下悬空引用导致构建失败。

## Risks / Trade-offs

- [抽屉一次性挂载 14 篇做装长文] → 纯静态文本节点，量级可控；主题默认收起控制视觉负担，不做虚拟滚动。
- [固定"?"按钮可能遮挡页面右下角元素] → 按钮固定于视口右下角并留足边距、适中层级；接入后逐页目检，冲突页面再单独调整。
- [移除全局搜索后可发现性下降] → 已知取舍（用户确认完全删除帮助页）；内容入口就在对应功能页内，路径反而更短。
- [深链 `?topic=` 消失] → 应用内无外部引用（仅 Help.vue 自身使用），无兼容负担。
- [设置新增 Tab 触碰既有 tab 持久化逻辑] → 白名单外零改动；持久化、恢复、`?tab=` 同步对 `about` 一视同仁，回归验证即可。

## Migration Plan

纯前端重组，无持久化数据迁移，单次提交完成。回滚 = revert 该提交（恢复 Help.vue 与路由即可，无数据残留）。验证顺序：`npm run build` 通过 → `npm test` → 开发版目检各页抽屉内容与设置"关于"Tab。
