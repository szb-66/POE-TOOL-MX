## MODIFIED Requirements

### Requirement: 使用版本化国服交易目录
系统 SHALL 随应用提供包含 schema 版本、游戏版本、locale、生成时间、物品名称、底材、传奇标记和词缀映射的国服交易目录。

#### Scenario: 加载有效目录
- **WHEN** 目录结构有效且每个 ID 与 matcher 唯一
- **THEN** 系统加载目录并向查价页报告版本和物品、词缀记录数

#### Scenario: 目录损坏
- **WHEN** 目录缺少元数据、存在重复 ID 或记录结构无效
- **THEN** 系统禁用依赖损坏数据的查询并返回可诊断的目录错误

#### Scenario: 获取腾讯官方交易元数据
- **WHEN** 应用启动且腾讯官方 `/api/trade/data/stats` 与 `/api/trade/data/items` 返回有效目录
- **THEN** 系统使用官方中文 matcher、stat ID、传奇名称和底材构建运行时目录并报告记录数量

#### Scenario: 官方交易元数据不可用
- **WHEN** 任一官方目录请求失败或响应结构无效
- **THEN** 系统回退版本化内置目录并明确报告降级状态
