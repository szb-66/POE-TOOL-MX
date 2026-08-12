# automation-operation-delay Specification

## Purpose
统一制作、地图洗练、背包、仓库取件和混沌配方取件的输入等待节奏，为用户提供鼠标移入后的悬停稳定毫秒配置，并明确旧配置迁移、输入边界、脚本执行语义以及内部安全等待与用户配置之间的边界。

## Requirements

### Requirement: 单一自动操作等待
系统 SHALL 为制作、地图洗练、背包入库、普通仓库取件、君锋取件、商城配方取件、海图自动放置、仓库页签选择和战斗辅助提供唯一的 `operationDelayMs` 用户配置，其值表示鼠标移入目标位置后、执行依赖悬停的操作前的真实悬停稳定毫秒数。

#### Scenario: 默认与边界
- **WHEN** 配置缺失、非有限或为负数
- **THEN** 系统使用默认值 50ms

#### Scenario: 用户自定义时间
- **WHEN** 用户输入任意非负有限毫秒数，包括 0ms 或超过旧上限的值
- **THEN** 系统原样保存并使用该值，不按最小值、最大值或步长裁剪

#### Scenario: 执行自动操作
- **WHEN** 任一受支持模块移动鼠标并准备执行复制、点击或滚动
- **THEN** 系统在鼠标移动后直接等待 `operationDelayMs`，不应用隐藏比例换算或额外下限

#### Scenario: 设置界面
- **WHEN** 用户查看自动化时序设置
- **THEN** 页面显示唯一的“自动操作等待”、自适应模式以及对应的物理输入和结果等待字段
- **AND** 页面不显示模块独立延迟或延迟预设

#### Scenario: 内部安全等待
- **WHEN** 自动化需要组合键按下间隔、按键或按钮保持、释放稳定或剪贴板响应
- **THEN** 系统默认使用修饰键稳定 50ms、按键或按钮保持 20ms、释放稳定 20ms、剪贴板响应窗口 250ms
- **AND** 用户可以在固定时序配置中输入任意非负有限毫秒数，不施加业务范围裁剪

#### Scenario: 点击后等待
- **WHEN** 任一受支持模块完成一次点击
- **THEN** 系统使用释放稳定或对应的结果等待，不再次消耗 `operationDelayMs`

### Requirement: 完整自动化时序协议
系统 MUST 将 `operationDelayMs`、`adaptiveTiming`、`adaptiveTimeoutMs` 和 `fixedTiming` 作为不可拆分的全局自动化时序传递给每条受支持的游戏输入链路，并在 Python 边界使用对应的 `operation_delay_ms`、`timing_mode`、`adaptive_timeout_ms` 和 `fixed_timing`。

#### Scenario: 物理输入时序
- **WHEN** 自动化按下修饰键、普通按键或鼠标按钮，或者释放输入状态
- **THEN** 系统始终分别使用 `modifierSettleMs`、`keyHoldMs`、`buttonHoldMs` 和 `releaseSettleMs`
- **AND** 自适应模式不得忽略或替换这些物理输入时序

#### Scenario: 自适应结果等待
- **WHEN** 自适应模式开启且自动化等待剪贴板、画面、仓库页签或存仓结果
- **THEN** 系统轮询已有可观察结果并在成功时立即继续
- **AND** 未成功时最多等待 `adaptiveTimeoutMs`

#### Scenario: 固定结果等待
- **WHEN** 自适应模式关闭且自动化等待剪贴板、画面、仓库页签或存仓结果
- **THEN** 系统分别使用 `clipboardConfirmMs`、`patchVerifyMs`、`stashTabSettleMs` 或 `stashSettleMs`

#### Scenario: 没有可靠结果信号
- **WHEN** 某个动作不存在可可靠观测的完成信号
- **THEN** 系统使用该动作对应的固定结果等待字段
- **AND** 系统不得用裸数字等待替代用户配置

### Requirement: 唯一时序来源与边界
系统 SHALL 只从全局设置读取游戏输入时序，并 MUST 将业务节奏和系统生命周期时间保留为独立配置或内部常量。

#### Scenario: 旧模块独立延迟
- **WHEN** 持久化商城配方设置包含旧 `operationDelayMs`
- **THEN** 系统忽略该字段且不得用它覆盖全局自动化时序

#### Scenario: 非输入计时
- **WHEN** 系统执行战斗扫描与冷却、网络限流、进程启停、前台检测轮询、OCR 或剪贴板轮询、UI 防抖
- **THEN** 这些计时不受全局自动化时序控制
- **AND** 它们不得被复用为游戏动作完成等待

#### Scenario: 动作边界审计
- **WHEN** 受支持脚本在鼠标、键盘、滚动或游戏结果验证边界等待
- **THEN** 等待必须引用完整自动化时序中的对应字段
- **AND** 不得存在未命名的数字等待或隐藏最小值

### Requirement: 旧延迟配置迁移
系统 SHALL 将旧全局三字段或背包独立等待迁移为单一自动操作等待，并使用持久化时序版本将旧默认值一次性迁移到当前默认值。

#### Scenario: 新字段已存在
- **WHEN** settings 已包含有效 operationDelayMs
- **THEN** 系统优先使用该值并忽略所有旧延迟字段，再按时序版本规则决定是否迁移旧默认值

#### Scenario: 旧默认值升级
- **WHEN** settings 缺少当前时序版本且迁移后的 operationDelayMs 为旧默认值 80ms
- **THEN** 系统使用新默认值 50ms、写入当前时序版本并保存迁移结果

#### Scenario: 已迁移的 80ms 自定义值
- **WHEN** settings 已包含当前时序版本且 operationDelayMs 为 80ms
- **THEN** 系统保留 80ms，不重复迁移

#### Scenario: 其他自定义值
- **WHEN** settings 缺少当前时序版本且迁移后的 operationDelayMs 不是旧默认值 80ms
- **THEN** 系统保留该值并写入当前时序版本

#### Scenario: 背包独立等待存在
- **WHEN** 新字段缺失且 bagSettings 包含有效 transferDelayMs
- **THEN** 系统先使用 transferDelayMs 作为 operationDelayMs，再按时序版本规则决定是否迁移旧默认值

#### Scenario: 仅旧全局三字段存在
- **WHEN** 新字段和背包独立等待均缺失且 settings.delays 包含旧字段
- **THEN** 系统按旧隐藏倍率还原三个实际等待、取最大值并将结果提高到至少旧默认值 80ms，再按时序版本规则完成迁移

#### Scenario: 保存迁移结果
- **WHEN** 系统保存设置
- **THEN** 持久数据只包含 operationDelayMs、当前 operationTimingVersion 和其他当前字段，不再包含 settings.delays 或 bagSettings.transferDelayMs
