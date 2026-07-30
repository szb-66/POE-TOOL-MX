# unidentified-unique-resolution Specification

## Purpose

定义未鉴定传奇在请求国服交易接口前，从官方与内置目录解析身份候选、处理唯一或多个候选到用户选择和官方拒绝时的完整安全保护行为。

## Requirements

### Requirement: 查询前解析未鉴定传奇身份
系统 MUST 使用官方国服物品目录按底材解析所有未鉴定传奇，并 MUST 在身份未解决时禁止发送官方搜索。

#### Scenario: 唯一候选
- **WHEN** 未鉴定传奇底材只对应一个去重后的传奇名称
- **THEN** 系统自动应用该名称和底材并保留未鉴定过滤后查询

#### Scenario: 多个候选
- **WHEN** 同一底材对应多个传奇名称
- **THEN** 浮窗显示候选并等待用户选择，选择前不得发送搜索

#### Scenario: 没有候选
- **WHEN** 官方与内置目录均找不到底材候选
- **THEN** 系统显示可诊断错误且不得把底材作为传奇名称提交

#### Scenario: 官方拒绝未知名称
- **WHEN** 未鉴定传奇查询仍返回 `Unknown item name`
- **THEN** 系统转入身份解析错误状态且不得自动重试相同请求
