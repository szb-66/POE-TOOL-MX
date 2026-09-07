## Why

Electron 主窗口的外链策略把所有绝对 HTTP(S) 地址都交给系统浏览器，而开发环境中的应用内 hash 路由也会以完整 HTTP(S) 地址出现在导航事件中，导致切换侧边 tab 时偶发打开浏览器。需要以当前应用文档为边界区分内部 hash 导航与真正外链。

## What Changes

- 将与当前应用文档同源、同路径且仅 hash 不同的导航识别为应用内导航。
- 仅将真正的外部 HTTP(S) 地址交给系统默认浏览器。
- 补充绝对形式应用内 hash URL 的回归测试，同时保留相对 hash 与外部链接覆盖。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `external-link-handling`: 明确同一应用文档的 hash 路由不得作为外链打开。

## Impact

- `electron/modules/window/externalLinks.js` 的 URL 分类与事件处理。
- 主窗口外链策略的单元测试。
- 不改变渲染端路由、IPC 或依赖。
