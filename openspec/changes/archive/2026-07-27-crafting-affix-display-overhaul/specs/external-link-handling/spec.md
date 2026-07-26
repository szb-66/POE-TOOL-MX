## ADDED Requirements

### Requirement: 外部网页使用默认浏览器
系统 MUST 将应用内所有绝对 HTTP 或 HTTPS 外链交由操作系统默认浏览器打开，并阻止 Electron 页面导航到该地址。

#### Scenario: 点击外部链接
- **WHEN** 用户点击应用内的 HTTP(S) 外部链接
- **THEN** 系统默认浏览器打开目标地址且应用页面保持不变

#### Scenario: 非网页协议
- **WHEN** 链接使用非 HTTP(S) 协议
- **THEN** 系统拒绝将其传给外部打开接口
