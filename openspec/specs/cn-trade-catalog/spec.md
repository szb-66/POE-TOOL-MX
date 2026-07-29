# cn-trade-catalog Specification

## Purpose

定义国服交易目录的版本元数据、结构校验、腾讯官方数据加载、内置目录安全降级、陈旧状态提示以及离线目录可重复生成和失败处理行为。

## Requirements

### Requirement: 使用版本化国服交易目录
系统 SHALL 随应用提供包含 schema 版本、游戏版本、locale、生成时间、物品和词缀映射的国服交易目录。

#### Scenario: 加载有效目录
- **WHEN** 目录结构有效且每个 ID 与 matcher 唯一
- **THEN** 系统加载目录并向查价页报告版本和记录数

#### Scenario: 目录损坏
- **WHEN** 目录缺少元数据、存在重复 ID 或记录结构无效
- **THEN** 系统禁用官方查询并返回可诊断的目录错误

#### Scenario: 获取腾讯官方词缀元数据
- **WHEN** 应用启动且腾讯官方 `/api/trade/data/stats` 返回有效目录
- **THEN** 系统使用官方中文 matcher 与 stat ID 构建运行时目录，并报告官方记录数量

#### Scenario: 官方词缀元数据不可用
- **WHEN** 官方目录请求失败或响应结构无效
- **THEN** 系统回退版本化内置目录并明确报告降级状态

### Requirement: 目录陈旧时安全降级
系统 SHALL 根据目录游戏版本与时间报告陈旧状态，并 MUST 禁止使用不能可靠映射的词缀。

#### Scenario: 陈旧目录中的已知名称
- **WHEN** 目录陈旧但固定物品名称仍能唯一匹配
- **THEN** 系统允许名称查询并展示陈旧警告

#### Scenario: 陈旧目录中的未知词缀
- **WHEN** 词缀不在活动目录中
- **THEN** 系统将其标为未识别且不构造近似 stat ID

### Requirement: 可重复生成与校验目录
系统 SHALL 提供从受支持 NDJSON 输入生成目录的脚本，并 SHALL 在重复映射、空 stat ID 或无效 matcher 时失败。

#### Scenario: 相同输入重复生成
- **WHEN** 使用相同输入与版本参数执行生成器
- **THEN** 除显式生成时间外目录内容和排序保持一致
