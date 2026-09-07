## MODIFIED Requirements

### Requirement: 版本化的中文离线数据
系统 SHALL 随应用内置 S30 国服正式服的简体中文 Vendor 数据，记录 locale、S30 / POE1 3.29 游戏版本、更新时间和校验来源，并 MUST 以当前客户端物品文本验证所有表达式。运行时 MUST NOT 依赖网络获取这些选项。

#### Scenario: 应用离线启动
- **WHEN** 设备没有网络连接且用户打开商城模块
- **THEN** 系统仍展示全部经过 S30 中文文本验证的内置筛选项并可生成正则

