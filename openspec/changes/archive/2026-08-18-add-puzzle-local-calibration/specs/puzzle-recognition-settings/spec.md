## ADDED Requirements

### Requirement: 固定基础识别
系统 SHALL 使用原 `standard` 参数作为固定的海图碎片基础识别，不再向用户提供识别强度档位；本机校准未命中时，普通识别和自动放入 MUST 使用同一固定参数。

#### Scenario: 无本机素材命中
- **WHEN** 当前仓库图块没有明确匹配的本机校准素材
- **THEN** 系统使用固定基础参数识别且不要求用户选择档位

#### Scenario: 旧配置兼容
- **WHEN** 已保存海图配置包含旧 `recognition.strength` 字段
- **THEN** 系统静默忽略该字段并保留既有区域、页签、库存、词缀和方案数据

## REMOVED Requirements

### Requirement: 海图识别强度设置
**Reason**: 全局档位不能适配不同用户环境，且已由固定基础识别与本机素材校准替代。

**Migration**: 旧档位字段静默忽略，原 `standard` 参数成为固定基础参数。
