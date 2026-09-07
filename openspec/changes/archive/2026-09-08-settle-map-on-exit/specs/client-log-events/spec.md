## MODIFIED Requirements

### Requirement: 事件类型和字段必须使用白名单
系统 SHALL 只发布 `area-entered`、`character-level`、`player-death`、`kills-result`、`character-profile` 、`game-state` 和 `client-state` 结构化事件。区域事件 SHALL 仅包含日志时间、内部区域 ID、实例种子、区域等级、加载标记和可确定的地图阶级；等级、死亡、击杀与角色事件 SHALL 只包含对应的已验证字段，无法确认时 MUST NOT 猜测。每个事件 SHALL 包含会话内递增序号、日志时间和接收时间，MUST NOT 包含原始日志行。系统 MUST NOT 解析或发布赛季机制特征事件。

#### Scenario: 解析区域生成行
- **WHEN** 新增完整日志行包含可验证的区域 ID、实例种子和区域等级
- **THEN** 系统发布一个只含白名单字段的 `area-entered` 事件

#### Scenario: 解析地图相关结果
- **WHEN** 新增日志行匹配已验证的死亡、击杀命令或角色资料特征
- **THEN** 系统发布对应结构化事件且不保留日志原文

#### Scenario: 机制特征行不再产生事件
- **WHEN** 新增日志行匹配旧版本使用的机制对话特征
- **THEN** 系统忽略该行且不发布任何结构化事件

#### Scenario: 未识别日志行
- **WHEN** 新增日志行不匹配任何白名单事件
- **THEN** 系统忽略该行且不把原文传给渲染层或诊断系统

## ADDED Requirements

### Requirement: 游戏状态与监听状态独立
系统 SHALL 区分监听状态与 unknown、loading、in-game、disconnected 游戏状态。只有可信系统断线日志或已确认的游戏进程退出才能报告断开；日志不可读 SHALL 转为未知并阻止依赖在线状态的操作。

#### Scenario: 断线后网络重连
- **WHEN** 系统断线行后出现网络 Connected to 行
- **THEN** 游戏不得仅凭网络连接恢复，区域生成进入加载态，系统“你已进入”消息确认就绪；聊天中的断线文案不产生事件

#### Scenario: 无日志进程退出
- **WHEN** 曾确认的游戏进程消失而日志没有断线行
- **THEN** 系统发布断开事件；失焦与进程检测失败不得当作退出
