## Why

帮助中心把全部模块的使用指南集中在一个独立页面，用户在某个功能页遇到问题时必须离开当前页面、跳转到 `/help` 再自行查找对应章节，路径长且割裂。模块的帮助内容应当就近展示在对应的一级页面里；"关于"属于应用元信息，归属设置页更合理。

## What Changes

- **BREAKING** 删除集中式帮助中心：移除 `/help` 路由、`src/views/Help.vue`、侧边栏"帮助"菜单入口，以及帮助中心的分类导航、全文搜索和 `?topic=` 深链接。
- 新增就地模块帮助：在每个一级页面提供右下角"?"圆形按钮，点击打开右侧抽屉展示本模块帮助（用途、使用前提、基础步骤、风险提示），抽屉内主题可折叠，仅一个主题时默认展开。
- 原帮助内容按就近原则重新分配，内容不丢失：
  - 首页 `/`：首页模块帮助 + 快速开始（四步）；
  - 制作/存取/地图/战斗/剧情/商城/模拟/查价/海图/设置：各自模块指南；
  - 模拟 `/craft-planner`：追加全部做装参考专题；查价 `/price-check`：追加"国服官方挂单查价"做装专题；
  - 设置 `/settings`：追加常见问题（8 条）专题。
- 设置页新增"关于"Tab（第 7 个分类，`name="about"`）：版本卡片（包元数据版本 + GitHub 项目链接）+ 版本项目、数据来源、隐私联系方式 3 个主题。
- 清理 `src/domains/help/helpContent.js` 中仅服务帮助中心的导出（分类定义、聚合主题表、搜索函数、深链查找）。
- 工具站 `/tools` 与开发版模型训练页无对应模块主题，不提供帮助抽屉。

## Capabilities

### New Capabilities

- `contextual-module-help`: 一级页面的就地帮助能力——"?"入口按钮、右侧抽屉、模块主题内容分配映射（含快速开始/做装参考/常见问题的归属页）、主题折叠展示与默认展开规则、无主布局浮窗不提供该能力。

### Modified Capabilities

- `help-center`: 移除集中式帮助中心的全部需求（分层信息架构、模块覆盖、全文搜索、深链接、做装参考集中保留、关于分类）；内容由 `contextual-module-help` 与设置"关于"Tab 承接。
- `settings-tab-navigation`: 设置分类从六个扩展为七个，新增"关于"分类；跨页面入口的目标分类白名单加入 `about`。
- `primary-page-layout`: 侧栏区段调整——移除"帮助"入口，视觉区段由"首页、业务模块、工具站、设置与帮助"四段改为"首页、业务模块、工具站、设置"。

## Impact

- 删除：`src/views/Help.vue`；`src/router/index.js` 的 `/help` 路由；`src/router/pageLoaders.js` 的 `/help` 加载器；`src/components/Layout/Sidebar.vue` 的帮助菜单项。
- 新增：`src/domains/help/HelpTopicList.vue`（主题折叠列表 + 块渲染）、`src/domains/help/PageHelpDrawer.vue`（"?"按钮 + 抽屉）。
- 修改：`src/domains/help/helpContent.js`（删除中心化导出、新增按 ID 取模块主题的辅助函数）；11 个一级页面接入 `PageHelpDrawer`；`src/domains/settings/SettingsView.vue` 新增"关于"Tab；`src/router/settingsNavigation.js` 分类白名单加入 `about`。
- 无后端、Electron 主进程、Python 脚本或数据契约变更；纯前端路由/组件重组。
