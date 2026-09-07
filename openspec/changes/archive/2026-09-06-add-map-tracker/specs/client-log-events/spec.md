## MODIFIED Requirements

### Requirement: 事件类型和字段必须使用白名单
系统 SHALL 只发布 `area-entered`、`character-level`、`player-death`、`kills-result`、`character-profile`、`map-mechanic` 和 `client-state` 结构化事件。区域事件 SHALL 仅包含日志时间、内部区域 ID、实例种子、区域等级和可确定的地图阶级；等级、死亡、击杀、角色与机制事件 SHALL 只包含对应的已验证字段，无法确认时 MUST NOT 猜测。每个事件 SHALL 包含会话内递增序号、日志时间和接收时间，MUST NOT 包含原始日志行。

#### Scenario: 解析区域生成行
- **WHEN** 新增完整日志行包含可验证的区域 ID、实例种子和区域等级
- **THEN** 系统发布一个只含白名单字段的 `area-entered` 事件

#### Scenario: 解析地图相关结果
- **WHEN** 新增日志行匹配已验证的死亡、击杀命令、角色资料或机制特征
- **THEN** 系统发布对应结构化事件且不保留日志原文

#### Scenario: 未识别日志行
- **WHEN** 新增日志行不匹配任何白名单事件
- **THEN** 系统忽略该行且不把原文传给渲染层、诊断或地图仓储

### Requirement: 最近事件在内存保留并可被受限业务订阅
系统 SHALL 在设置页系统区域展示监听配置、连接状态、错误和最近事件，并 SHALL 仅在内存保留最近 50 条结构化事件。地图跟踪服务 MAY 在主进程订阅这些结构化事件并持久化派生统计，但 MUST NOT 获得原始日志行。Client.txt 事件中心本身 MUST NOT 发送游戏输入；地图跟踪订阅者 MAY 在击杀增强已启用且前台门禁通过时，用地图开始和离开事件触发固定的 `/kills` 采样。

#### Scenario: 超过事件上限
- **WHEN** 当前会话发布第 51 条事件
- **THEN** 系统丢弃最早事件并只向页面提供最新 50 条

#### Scenario: 地图跟踪订阅
- **WHEN** 地图跟踪器已启用且事件中心发布白名单事件
- **THEN** 主进程可用该事件更新当前局
- **AND** 事件中心的最近事件列表仍在应用重启时清空
