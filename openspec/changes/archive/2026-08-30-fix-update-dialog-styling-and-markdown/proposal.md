## Why

1.2.2 升级后弹窗由启动时动态模块触发，但构建产物未在弹窗出现前加载 Element Plus MessageBox 样式，导致布局退化为顶部全宽普通内容块。同一份 Markdown 发布说明目前在三个更新入口均按纯文本显示，用户无法直观识别标题、列表和重点。

## What Changes

- 在主渲染入口显式加载 MessageBox 样式，保证首次启动弹窗不依赖其他页面偶然带入的样式资源。
- 新增受限 Markdown 解析与复用展示组件，支持标题、段落、有序/无序列表、粗体、斜体、行内代码和 HTTP(S) 链接。
- 用 Vue 节点渲染而非 HTML 注入；原始 HTML、危险协议链接和无效语法按可读文字降级。
- 升级后首次启动弹窗、标题栏下载前确认弹窗和设置页发布说明统一使用该组件。
- 保留当前更新 IPC、元数据、持久化、确认门禁和安装行为。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `application-update`: 更新说明从纯文本显示改为禁用原始 HTML 的安全 Markdown 展示，并保证升级后弹窗样式在首次显示前就绪。

## Impact

- 影响渲染入口样式引入、应用更新弹窗、设置页更新区域及共享更新说明 UI。
- 新增内部解析函数和 Vue 组件，不新增第三方 Markdown 依赖。
- 不改变 Electron IPC、`releaseNotes` 字符串形状、`latest.yml` 格式或安装包升级契约。
