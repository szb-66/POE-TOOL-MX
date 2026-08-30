# automation-operation-delay Specification

## Purpose
统一制作、地图洗练、背包、仓库取件和混沌配方取件的输入等待节奏，为用户提供鼠标移入后的悬停稳定毫秒配置，并明确旧配置迁移、输入边界、脚本执行语义以及内部安全等待与用户配置之间的边界。

## Requirements

### Requirement: 单一自动操作等待
系统 SHALL 为制作、地图洗练、背包入库、普通仓库取件、君锋取件、商城配方取件、海图自动放置、仓库页签选择和战斗辅助提供唯一的 `operationDelayMs` 用户配置，其值表示鼠标移入目标位置后、执行依赖悬停的操作前的真实悬停稳定毫秒数。

#### Scenario: 默认与边界
- **WHEN** 配置缺失、非有限或为负数
- **THEN** 系统使用默认值 40ms

#### Scenario: 用户自定义时间
- **WHEN** 用户输入任意非负有限毫秒数，包括 0ms 或超过旧上限的值
- **THEN** 系统原样保存并使用该值，不按最小值、最大值或步长裁剪

#### Scenario: 执行自动操作
- **WHEN** 任一受支持模块移动鼠标并准备执行复制、点击或滚动
- **THEN** 系统在鼠标移动后直接等待 `operationDelayMs`，不应用隐藏比例换算或额外下限

#### Scenario: 设置界面
- **WHEN** 用户查看自动化时序设置
- **THEN** 页面显示唯一的“自动操作等待”、对应的物理输入时序和四项固定结果等待字段
- **AND** 页面不显示自适应等待、自适应等待上限、模块独立延迟或延迟预设

#### Scenario: 内部安全等待
- **WHEN** 自动化需要组合键按下间隔、按键或按钮保持、释放稳定或结果确认
- **THEN** 系统默认使用组合键稳定 20ms、按键保持 15ms、鼠标点击保持 15ms、释放后稳定 10ms、剪贴板/空格确认 10ms、选仓后生效 10ms、存仓后生效 10ms 和画面变化验证 10ms
- **AND** 用户可以在固定时序配置中输入任意非负有限毫秒数，不施加业务范围裁剪

#### Scenario: 点击后等待
- **WHEN** 任一受支持模块完成一次点击
- **THEN** 系统使用释放稳定或对应的固定结果等待，不再次消耗 `operationDelayMs`

### Requirement: 完整自动化时序协议
系统 MUST 将 `operationDelayMs` 和 `fixedTiming` 作为不可拆分的全局自动化时序传递给每条受支持的游戏输入链路，并在 Python 边界使用对应的 `operation_delay_ms` 和 `fixed_timing`；协议 MUST NOT 包含自适应模式或统一自适应上限。

#### Scenario: 物理输入时序
- **WHEN** 自动化按下修饰键、普通按键或鼠标按钮，或者释放输入状态
- **THEN** 系统始终分别使用 `modifierSettleMs`、`keyHoldMs`、`buttonHoldMs` 和 `releaseSettleMs`
- **AND** 结果等待不得忽略或替换这些物理输入时序

#### Scenario: 固定结果等待
- **WHEN** 自动化等待剪贴板、画面、仓库页签或存仓结果
- **THEN** 系统分别完整等待 `clipboardConfirmMs`、`patchVerifyMs`、`stashTabSettleMs` 或 `stashSettleMs`
- **AND** 即使结果提前出现，系统也不在对应固定等待结束前继续下一项动作

#### Scenario: 自适应结果等待
- **WHEN** 旧设置或旧运行时载荷请求自适应结果等待
- **THEN** 系统忽略自适应模式与统一上限，并使用对应的固定结果等待
- **AND** 系统不通过轮询在固定等待结束前继续

#### Scenario: 没有可靠结果信号
- **WHEN** 某个动作不存在可可靠观测的完成信号
- **THEN** 系统使用该动作对应的固定结果等待字段
- **AND** 系统不得用裸数字等待替代用户配置

#### Scenario: 跨进程时序载荷
- **WHEN** 设置、导入配置或运行时消费者构造完整自动化时序
- **THEN** 载荷包含 `operationDelayMs` 和完整 `fixedTiming`
- **AND** 载荷不包含 `adaptiveTiming`、`adaptiveTimeoutMs`、`timing_mode` 或 `adaptive_timeout_ms`

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
系统 SHALL 将旧全局三字段或背包独立等待迁移为单一自动操作等待，使用持久化时序版本将旧默认值一次性迁移到当前默认值，并清除已废弃的自适应设置。

#### Scenario: 新字段已存在
- **WHEN** settings 已包含有效 operationDelayMs
- **THEN** 系统优先使用该值并忽略所有旧延迟字段，再按时序版本规则决定是否迁移旧默认值

#### Scenario: 旧默认值升级
- **WHEN** settings 缺少当前时序版本且迁移后的 operationDelayMs 为旧默认值 80ms
- **THEN** 系统使用新默认值 40ms、写入当前时序版本并保存迁移结果

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

#### Scenario: 读取旧自适应设置
- **WHEN** settings 或导入配置包含 `adaptiveTiming` 或 `adaptiveTimeoutMs`
- **THEN** 系统忽略这两个字段且始终保留规范化后的 `fixedTiming`

#### Scenario: 已有有效时序值
- **WHEN** settings 已包含有效的 `operationDelayMs` 或任一 `fixedTiming` 字段
- **THEN** 系统原样保留对应用户值，不因产品默认值变化而覆盖

#### Scenario: 缺失或无效固定时序值
- **WHEN** 任一 `fixedTiming` 字段缺失、非有限或为负数，或者用户执行恢复默认
- **THEN** 系统对该字段使用当前默认表中的对应值

#### Scenario: 保存迁移结果
- **WHEN** 系统保存或导出设置
- **THEN** 持久数据只包含 operationDelayMs、fixedTiming、当前 operationTimingVersion 和其他当前字段
- **AND** 不再包含 settings.delays、bagSettings.transferDelayMs、`adaptiveTiming` 或 `adaptiveTimeoutMs`

### Requirement: 操作延迟逐项用途说明
系统 SHALL 在设置页“操作延迟”区域为每一个当前可配置项的标签显示可聚焦的问号说明，并 MUST 让说明准确描述该项在自动化流程中的实际使用位置，而不是仅重复字段名称。

说明 MUST 覆盖以下全部项目及其用途：

- “自动操作等待”：所有游戏自动化把鼠标移动到目标后，到复制、点击或滚动等依赖悬停动作开始前的稳定等待；
- “组合键稳定”：Ctrl、Shift、Alt 等修饰键按下后，到配合的普通键或鼠标动作开始前的等待，应用于复制、批量存取等组合输入；
- “按键保持”：普通键按下到释放之间的保持时间，应用于复制、旋转及其他键盘输入；
- “鼠标点击保持”：鼠标按钮按下到释放之间的保持时间，应用于制作、存取、旋转和放置等左右键点击；
- “释放后稳定”：键盘键或鼠标按钮释放后，到下一次输入或结果处理前的稳定等待，应用于全部连续输入链路；
- “剪贴板/空格确认”：发送复制或触发目标格状态变化后，到读取剪贴板或确认空格状态前的等待，应用于物品读取、来源复核和格位确认；
- “选仓后生效等待”：选择或切换仓库页签后，到读取页签内容或继续点击前的等待，应用于仓库取件、商城配方和页签选择；
- “存仓后生效等待”：点击存仓后，到确认物品已转移或处理下一格前的等待，应用于背包入库及相关存仓流程；
- “画面变化验证等待”：执行会改变画面的动作后，到截图、OCR、验证变化或继续下一步前的等待，应用于制作、地图、海图和自动放置验证。

#### Scenario: 查看始终显示的设置项
- **WHEN** 用户打开设置页的“操作延迟”区域
- **THEN** “自动操作等待”、四个物理输入时序和四个固定结果等待的标签均显示问号入口
- **AND** 页面不显示“自适应等待”或“自适应等待上限”

#### Scenario: 查看固定结果等待
- **WHEN** 用户查看操作延迟设置
- **THEN** 页面始终显示四个固定结果等待项及各自的问号入口
- **AND** 每条说明区分剪贴板或空格、仓库页签、存仓结果和画面变化四种使用位置

#### Scenario: 查看自适应等待上限
- **WHEN** 旧配置曾包含自适应等待上限或用户查看当前时序设置
- **THEN** 页面不显示自适应等待上限及其问号入口
- **AND** 四项固定结果等待保持始终可见

#### Scenario: 键盘访问说明
- **WHEN** 用户使用键盘导航到任一问号入口
- **THEN** 问号可以获得焦点并展示与鼠标悬停相同的说明
- **AND** 入口具有能识别对应设置项的无障碍名称

#### Scenario: 问号位置
- **WHEN** 系统显示任一当前延迟字段
- **THEN** 问号入口紧邻该字段标题右侧显示，不以区域底部统一说明替代

#### Scenario: 时序行为保持不变
- **WHEN** 系统增加或展示任一问号说明
- **THEN** 所有保留时序字段的取值、默认值、持久化和运行时执行语义保持不变
