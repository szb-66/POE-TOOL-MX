## 1. 数据层与共享组件

- [x] 1.1 瘦身 `src/domains/help/helpContent.js`：删除 `HELP_CATEGORIES`、`HELP_TOPICS`、`findHelpTopic`、`searchHelpTopics`、`normalizeHelpQuery`、`topicText`、`blockText`；保留 `MODULE_TOPICS`、`FAQ_TOPICS`、`CRAFTING_TOPICS`、`GENERAL_TOPICS`、`QUICK_START_STEPS`；新增 `moduleTopicById(id)`
- [x] 1.2 新建 `src/domains/help/HelpTopicList.vue`：props 接收主题数组，渲染可折叠主题卡与 paragraph/heading/list/callout 块，样式与结构迁移自 Help.vue 的 `.topic-list`/`.topic-card`/`.topic-body`
- [x] 1.3 新建 `src/domains/help/PageHelpDrawer.vue`：右下角固定"?"圆形按钮 + `el-drawer`（内嵌 HelpTopicList），props 为 `topics` 与可选 `title`；仅一个主题时默认展开该主题

## 2. 一级页面接入帮助抽屉

- [x] 2.1 首页 `DashboardRouteView.vue` 接入 `PageHelpDrawer`，主题为首页模块帮助 + 由 `QUICK_START_STEPS` 拼装的快速开始主题（paragraph + list + callout）
- [x] 2.2 制作 `/items`、存取 `/bag`、地图 `/map`、战斗 `/combat`、剧情 `/story`、商城 `/shop`、海图 `/puzzle` 七个页面接入 `PageHelpDrawer`，各传对应 `moduleTopicById(id)`
- [x] 2.3 模拟 `/craft-planner` 接入抽屉：模块主题 + `CRAFTING_TOPICS` 全部 14 条
- [x] 2.4 查价 `/price-check` 接入抽屉：模块主题 + `crafting-price-check` 做装专题
- [x] 2.5 设置 `/settings` 接入抽屉：设置模块主题 + `FAQ_TOPICS` 全部 8 条
- [x] 2.6 目检确认工具站、模型训练页（DEV）与全部 `noLayout` 浮窗路由无帮助入口

## 3. 设置"关于"Tab

- [x] 3.1 `SettingsView.vue` 新增 `<el-tab-pane label="关于" name="about" />` 与对应面板：版本卡片（包元数据版本 + GitHub 链接，样式迁移自 Help.vue `.version-card`）+ HelpTopicList 渲染 3 个 about 主题
- [x] 3.2 `src/router/settingsNavigation.js` 分类白名单加入 `about`，验证 `?tab=about` 与 Tab 持久化/恢复行为正常

## 4. 移除帮助中心

- [x] 4.1 删除 `src/router/index.js` 的 `/help` 路由、`src/router/pageLoaders.js` 的 `/help` 加载器、`src/components/Layout/Sidebar.vue` 的帮助菜单项（含 `warmRoute('/help')`）
- [x] 4.2 删除 `src/views/Help.vue`，并 grep 确认无 `Help.vue`、`/help`、`HELP_TOPICS`、`HELP_CATEGORIES`、`findHelpTopic` 等残留引用

## 5. 验证

- [x] 5.1 `npm run build` 构建通过；`npm test` 全量通过
- [x] 5.2 开发版目检：11 个页面抽屉内容与原帮助中心一致（快速开始、做装参考 14 条、常见问题 8 条、查价专题）；设置"关于"Tab 版本与链接正确；侧边栏无帮助入口；抽屉开关不触发任何脚本或配置变更
- [x] 5.3 运行 `openspec validate split-help-page --strict` 通过
