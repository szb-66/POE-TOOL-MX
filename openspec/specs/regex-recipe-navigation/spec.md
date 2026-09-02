# regex-recipe-navigation Specification

## Purpose

将文本正则工具和商城配方自动取件拆分为清晰的一级入口，同时为历史商城入口提供兼容跳转并保持应用导航、首页和帮助入口一致。

## Requirements

### Requirement: 正则与配方一级页面
系统 SHALL 提供 `/regex` 正则页和 `/recipe` 配方页；正则页 MUST 包含商城与地图两个顶层标签且默认显示商城，配方页 MUST 直接显示商城配方内容而不保留原商城顶层标签。

#### Scenario: 从侧栏打开两个页面
- **WHEN** 用户依次点击“正则”和“配方”
- **THEN** 系统分别显示正则工作台和商城配方工作台

### Requirement: 历史商城路由兼容
系统 SHALL 将旧 `/shop` 路由替换跳转到 `/recipe`，并 SHALL 将首页、帮助和状态入口更新到新页面。

#### Scenario: 打开旧商城地址
- **WHEN** 用户或历史链接导航到 `/shop`
- **THEN** 系统替换进入 `/recipe` 且不显示空白或重复页面

### Requirement: 统一导航与线性图标
系统 SHALL 在原商城位置按“正则、配方”的顺序显示两个入口，并 MUST 使用与现有侧栏一致的线性图标、预加载和焦点交互。

#### Scenario: 查看侧栏顺序
- **WHEN** 主布局显示侧栏
- **THEN** “剧情”之后依次显示“正则”和“配方”，随后保持原有页面顺序
