# external-link-handling Specification

## Purpose

定义 Electron 应用内绝对 HTTP 与 HTTPS 外部链接的安全打开方式、页面导航拦截边界及非网页协议拒绝规则，确保外链始终由操作系统默认浏览器处理。
## Requirements
### Requirement: 外部网页使用默认浏览器
系统 MUST 将应用内所有真正的绝对 HTTP 或 HTTPS 外链交由操作系统默认浏览器打开，并阻止 Electron 页面导航到该地址；与当前应用文档相同且仅 hash 路由不同的地址 MUST 保留在 Electron 应用内。

#### Scenario: 点击外部链接
- **WHEN** 用户点击指向其他文档的 HTTP(S) 外部链接
- **THEN** 系统默认浏览器打开目标地址且应用页面保持不变

#### Scenario: 切换应用内 tab
- **WHEN** 用户切换到由当前应用文档的 hash 路由表示的 tab，且 Electron 提供相对或绝对形式的导航地址
- **THEN** 系统在当前 Electron 窗口完成路由切换且不调用系统浏览器

#### Scenario: 非网页协议
- **WHEN** 链接使用非 HTTP(S) 协议
- **THEN** 系统拒绝将其传给外部打开接口

