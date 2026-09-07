## Context

主窗口使用 Vue Router 的 hash history。生产环境入口是 `file:///.../index.html#/route`，开发环境入口是 `http://localhost:3000/#/route`。Electron 的 `will-navigate` 和 `setWindowOpenHandler` 可能提供完整 URL；当前策略仅按协议判断，因而会把开发环境的应用内完整 URL 误认为外链。

## Goals / Non-Goals

**Goals:**

- 以当前 WebContents 的应用文档 URL 为基准，可靠区分内部 hash 路由与外部网页。
- 保留 HTTP(S) 外链交给默认浏览器、非网页协议不外开的安全边界。
- 同时覆盖 `will-navigate` 与新窗口请求。

**Non-Goals:**

- 不修改 Vue Router 或侧边栏交互。
- 不允许普通同源页面路径跳转；只有当前应用文档的 hash 导航属于内部导航。
- 不改变国服登录窗口的独立导航策略。

## Decisions

1. 比较候选 URL 与 `contents.getURL()` 去除 hash 后的 `protocol`、`host`、`pathname` 和 `search`。这些字段完全相同则视为当前应用文档，只改变 hash 时允许 Electron/Vue Router 自行处理。
   - 未采用“同源即内部”，因为同源下其他路径仍可能离开应用入口。
   - 未采用 localhost 白名单，因为端口可配置，且生产环境使用 `file:`。
2. 将 URL 分类逻辑集中在外链策略模块中，并让两个 Electron 导航钩子共享，避免分支判定漂移。
3. 新窗口请求统一返回 `deny`，但只有真正外链才调用 `openExternal`；普通导航仅放行当前应用文档，真正外链在阻止应用导航后外开，无法识别或非网页协议采取阻止导航且不外开的安全默认值。

## Risks / Trade-offs

- [当前 URL 为空或不可解析] → 不能证明是内部导航时采取安全默认值：不外开、拒绝新窗口；普通当前页导航不强制拦截。
- [应用未来从 hash history 改为 history 路由] → 当前“同文档”规则不会自动放行不同 pathname，需要届时显式更新边界。
- [重复安装监听器] → 策略仍只在主窗口加载完成时安装一次，并通过测试固定行为。
