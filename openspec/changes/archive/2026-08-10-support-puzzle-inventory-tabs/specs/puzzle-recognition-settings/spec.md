## MODIFIED Requirements

### Requirement: 海图识别强度设置
系统 SHALL 持久化海图识别强度设置，提供 `sensitive`、`standard`、`strict` 三档，默认 `standard`，并在所有仓库页识别与自动放置执行时使用同一档位参数。

#### Scenario: 切换识别强度
- **WHEN** 用户将识别强度从 `standard` 切换为 `sensitive` 或 `strict`
- **THEN** 系统持久化新档位，并使用新档位参数自动切换并重新识别两个仓库页

#### Scenario: 自动放置复用强度
- **WHEN** 用户启动自动放置且已选择非默认识别强度
- **THEN** 系统使用同一识别强度执行所有仓库页的来源与旋转校验以及海图落格验证

#### Scenario: 旧配置兼容
- **WHEN** 已保存的海图配置不包含识别强度字段
- **THEN** 系统按 `standard` 档位识别，不报错且不改变已有区域配置
