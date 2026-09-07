## MODIFIED Requirements

### Requirement: 单一自动操作等待
系统 SHALL 为制作、地图洗练、背包入库、普通仓库取件、君锋取件、商城配方取件、海图自动放置、仓库页签选择和战斗辅助提供唯一的 `operationDelayMs` 用户时序配置，其值表示鼠标移入目标位置后、执行依赖悬停的操作前的真实悬停稳定毫秒数。

#### Scenario: 默认与边界
- **WHEN** 配置缺失、非有限或为负数
- **THEN** 系统使用默认值 50ms

#### Scenario: 用户自定义时间
- **WHEN** 用户输入任意非负有限毫秒数，包括 0ms 或超过旧上限的值
- **THEN** 系统原样保存并使用该值，不按最小值、最大值或步长裁剪

#### Scenario: 执行自动操作
- **WHEN** 任一受支持模块移动鼠标并准备执行复制、点击或滚动
- **THEN** 系统在鼠标移动后直接等待一次 `operationDelayMs`
- **AND** 系统不应用隐藏比例换算、额外下限或同一动作的第二次用户延时

#### Scenario: 设置界面
- **WHEN** 用户查看自动化时序设置
- **THEN** 页面只显示“自动操作等待”毫秒输入、“自动检测”入口和恢复默认操作
- **AND** 页面不显示自适应开关、统一超时、物理输入时序、结果等待、模块独立延迟、高级折叠区或快稳预设

#### Scenario: 内部安全等待
- **WHEN** 自动化需要组合键按下间隔、按键或按钮保持、释放稳定、剪贴板响应或失败超时
- **THEN** 系统使用受测试约束的内部命名常量或有界轮询
- **AND** 这些内部值不作为用户配置，也不改变 `operationDelayMs` 的单次悬停语义

#### Scenario: 点击后等待
- **WHEN** 任一受支持模块完成一次点击
- **THEN** 系统等待可观察结果或内部安全边界，不再次消耗 `operationDelayMs`

### Requirement: 完整自动化时序协议
系统 MUST 将 `{ operationDelayMs }` 作为完整且不可扩展的用户自动化时序协议传递给每条受支持的游戏输入链路，并在 Python 边界只传递对应的 `operation_delay_ms`。

#### Scenario: 跨进程时序载荷
- **WHEN** 渲染端、主进程或自动化宿主同步时序设置
- **THEN** 载荷只包含有效的 `operationDelayMs` 或 `operation_delay_ms`
- **AND** 载荷不包含 `adaptiveTiming`、`adaptiveTimeoutMs`、`fixedTiming` 或其子字段

#### Scenario: 自适应结果等待
- **WHEN** 自动化等待剪贴板、画面、仓库页签、存仓或其他可可靠观测的结果
- **THEN** 系统使用内部轮询并在成功时立即继续
- **AND** 内部失败超时只作为有界停止条件，不作为成功路径的固定睡眠

#### Scenario: 固定结果等待
- **WHEN** 旧设置关闭自适应模式或包含固定结果等待字段
- **THEN** 系统忽略该模式和字段，仍由内部结果信号或命名安全边界负责等待
- **AND** 旧固定数值不进入运行时用户协议

#### Scenario: 没有可靠结果信号
- **WHEN** 某个动作不存在可可靠观测的完成信号
- **THEN** 系统使用该动作对应的内部命名安全边界
- **AND** 该边界不属于用户设置、持久化、导入导出或跨进程配置协议

#### Scenario: 物理输入时序
- **WHEN** 自动化按下或释放修饰键、普通按键或鼠标按钮
- **THEN** 系统使用受自动测试约束的内部命名常量控制保持与释放稳定
- **AND** 用户不能配置这些内部协议常量

### Requirement: 唯一时序来源与边界
系统 SHALL 只从全局设置读取 `operationDelayMs`，并 MUST 将物理输入协议、结果轮询、失败超时、业务节奏和系统生命周期计时保留为独立的内部责任。

#### Scenario: 旧模块独立延迟
- **WHEN** 持久化商城配方设置或其他模块设置包含旧的独立操作等待
- **THEN** 系统忽略该字段且不得用它覆盖全局 `operationDelayMs`

#### Scenario: 非输入计时
- **WHEN** 系统执行战斗扫描与冷却、网络限流、进程启停、前台检测轮询、OCR、剪贴板轮询或 UI 防抖
- **THEN** 这些计时不受 `operationDelayMs` 控制
- **AND** 它们不得被复用为鼠标悬停等待

#### Scenario: 动作边界审计
- **WHEN** 受支持脚本在鼠标移动后等待依赖悬停的动作
- **THEN** 等待引用 `operationDelayMs`
- **AND** 其他输入或结果边界引用语义明确、受测试约束的内部常量或结果信号，不存在未命名等待或隐藏用户延时下限

### Requirement: 旧延迟配置迁移
系统 SHALL 提升持久化时序版本，将旧设置与旧导入配置迁移为单一自动操作等待，并在下一次保存或导出时清除全部已删除的高级时序字段。

#### Scenario: 新字段已存在
- **WHEN** settings 已包含有效 `operationDelayMs`
- **THEN** 系统保留该值并忽略 `adaptiveTiming`、`adaptiveTimeoutMs`、`fixedTiming` 及其子字段
- **AND** 系统写入当前时序版本

#### Scenario: 旧默认值升级
- **WHEN** settings 缺少当前时序版本且迁移后的 `operationDelayMs` 为旧默认值 80ms
- **THEN** 系统使用新默认值 50ms、写入当前时序版本并保存迁移结果

#### Scenario: 已迁移的 80ms 自定义值
- **WHEN** settings 已包含当前时序版本且 `operationDelayMs` 为 80ms
- **THEN** 系统保留 80ms，不重复迁移

#### Scenario: 其他自定义值
- **WHEN** settings 缺少当前时序版本且迁移后的 `operationDelayMs` 不是旧默认值 80ms
- **THEN** 系统保留该值并写入当前时序版本

#### Scenario: 背包独立等待存在
- **WHEN** 新字段缺失且 bagSettings 包含有效 `transferDelayMs`
- **THEN** 系统先使用 `transferDelayMs` 作为 `operationDelayMs`，再按时序版本规则决定是否迁移旧默认值

#### Scenario: 仅旧全局三字段存在
- **WHEN** 新字段和背包独立等待均缺失且 settings.delays 包含旧字段
- **THEN** 系统按旧隐藏倍率还原三个实际等待、取最大值并将结果提高到至少旧默认值 80ms，再按时序版本规则完成迁移

#### Scenario: 导入旧配置
- **WHEN** 用户导入包含有效 `operationDelayMs` 以及任意已删除高级字段的旧配置
- **THEN** 系统只接收有效 `operationDelayMs`
- **AND** 已删除字段不进入当前内存设置或后续持久化与导出结果

#### Scenario: 保存迁移结果
- **WHEN** 系统保存或导出设置
- **THEN** 自动化时序数据只包含 `operationDelayMs`、当前时序版本和其他非时序当前字段
- **AND** 不包含 settings.delays、bagSettings.transferDelayMs、`adaptiveTiming`、`adaptiveTimeoutMs` 或 `fixedTiming`

### Requirement: 设置页本机时序校准
系统 SHALL 在自动化时序设置中提供由用户主动启动的本机自动检测，并 MUST 在产生任何游戏输入前展示准备引导和通过全部安全预检；检测只测量和推荐 `operationDelayMs`。

#### Scenario: 展示准备引导
- **WHEN** 用户打开本机自动检测
- **THEN** 系统以 12×5 背包示意图标出第一列从上到下五个目标格
- **AND** 系统明确要求背包已打开、五格分别放置不同的 1×1 物品、检测期间不要操作鼠标键盘
- **AND** 系统显示当前全局紧急停止快捷键

#### Scenario: 缺少背包网格
- **WHEN** 用户尚未配置有效的 12×5 背包网格
- **THEN** 系统禁止启动检测并引导用户先完成背包网格框选
- **AND** 系统不得产生鼠标或键盘输入

#### Scenario: 五格布局有效
- **WHEN** 检测以内部保守输入协议依次读取第一列五格
- **THEN** 系统只在五次复制都得到有效且互不相同的物品文本后进入测量阶段
- **AND** 物品文本只用于本次检测的内存比较，不得持久化、记录到日志或通过进度事件输出

#### Scenario: 五格布局无效
- **WHEN** 任一目标格无法复制到有效物品文本、两格得到相同物品文本或背包未打开
- **THEN** 系统以 `ITEM_LAYOUT_INVALID` 结束检测并保持原 `operationDelayMs`

#### Scenario: 安全的校准输入
- **WHEN** 自动检测正在执行
- **THEN** 系统只在五个目标格之间移动鼠标并发送 `Ctrl+C`
- **AND** 系统不得点击、拖动、转移物品、消耗通货或发送其他游戏操作

#### Scenario: 前台门禁和自动化互斥
- **WHEN** 另一项自动化正在运行、找不到游戏窗口、无法聚焦游戏或游戏失去前台
- **THEN** 系统分别以 `AUTOMATION_LOCKED`、`GAME_WINDOW_NOT_FOUND`、`GAME_FOCUS_FAILED` 或 `FOREGROUND_LOST` 停止
- **AND** 系统在停止前释放已按下的输入，在停止后释放自动化互斥且不修改设置

#### Scenario: 用户停止或全局紧急停止
- **WHEN** 用户停止检测或触发全局紧急停止
- **THEN** 系统幂等停止检测、释放输入并返回 `CANCELED`
- **AND** 系统保持原 `operationDelayMs`

#### Scenario: 剪贴板保护
- **WHEN** 检测开始并能够安全读取剪贴板
- **THEN** 系统保存当前可恢复的剪贴板内容并在成功、失败或中止后恢复
- **AND** 剪贴板不可用时系统以 `CLIPBOARD_UNAVAILABLE` 停止且不得产生后续输入

### Requirement: 稳定优先的时序推荐
系统 SHALL 根据本次游戏实测生成单一 `operationDelayMs` 建议，并 MUST 返回推荐值、样本数、耗时和置信度，不返回完整 `recommendedTiming`、`fixedTiming` 或已删除时序字段。

#### Scenario: 候选值通过和确认
- **WHEN** 系统搜索 `operationDelayMs` 的最低稳定值
- **THEN** 单个候选值必须先在五个不同物品上达到 5/5 正确复制
- **AND** 最终候选值必须在交替目标上连续达到 15/15 正确复制
- **AND** 搜索结果以 10ms 为粒度

#### Scenario: 直接实测字段的安全余量
- **WHEN** 系统得到稳定的 `operationDelayMs` 实测阈值
- **THEN** 推荐值为向上取整到 10ms 的 `max(实测值 × 1.25, 实测值 + 10ms)`
- **AND** 推荐结果只把 `operationDelayMs` 标记为实测字段

#### Scenario: 无副作用字段的保守推导
- **WHEN** 自动检测无法无副作用地实测物理输入、页签、存仓或画面等待
- **THEN** 系统不为这些内部时序生成、展示或返回用户建议
- **AND** 内部协议继续使用受测试约束的命名常量

#### Scenario: 画面信号不可用
- **WHEN** 系统无法取得可靠的物品提示画面稳定证据，但剪贴板实测有效
- **THEN** 系统继续以剪贴板正确性完成单一延时推荐
- **AND** 系统降低置信度并在结果中说明证据来源

#### Scenario: 保留自适应开关
- **WHEN** 旧设置包含 `adaptiveTiming`
- **THEN** 系统忽略该开关且自动检测不保留、推荐或修改它
- **AND** 可观察结果始终由程序内部轮询

#### Scenario: 无法得到稳定阈值
- **WHEN** 检测超过 180 秒、悬停候选超过 2000ms 或最终确认未达到 15/15
- **THEN** 系统以 `CALIBRATION_UNSTABLE` 结束且不得输出可应用的部分推荐

#### Scenario: 精简结果展示
- **WHEN** 自动检测成功
- **THEN** 结果页只显示 `operationDelayMs` 的原值到推荐值、样本数、耗时和置信度
- **AND** 不显示物理输入、剪贴板、页签、存仓、画面或统一超时的推荐行

### Requirement: 原子应用和会话撤销
系统 MUST 通过单一自动化时序协议原子应用推荐的 `operationDelayMs`，并 SHALL 提供只存在于当前会话的一次撤销。

#### Scenario: 成功应用建议
- **WHEN** 自动检测成功且新的 `operationDelayMs` 同步到所有运行时消费者
- **THEN** 系统一次性持久化推荐值并展示原值、推荐值、样本、耗时和置信度
- **AND** 已经启动的离散自动化仍遵循其既有配置快照语义

#### Scenario: 应用失败回滚
- **WHEN** 任一运行时消费者拒绝新的 `operationDelayMs`
- **THEN** 系统回滚所有消费者并保持检测前的持久化设置
- **AND** 系统不得提供基于未应用建议的撤销状态

#### Scenario: 撤销本次校准
- **WHEN** 用户在当前会话内点击“撤销本次检测”
- **THEN** 系统通过同一原子更新入口恢复检测前的 `operationDelayMs`
- **AND** 恢复成功后清除撤销快照

#### Scenario: 撤销失效边界
- **WHEN** 用户手动修改 `operationDelayMs`、再次成功启动检测、重置设置或重新启动应用
- **THEN** 系统清除旧的撤销快照
- **AND** 系统不得持久化检测前快照或检测历史

#### Scenario: 结构化进度和结果
- **WHEN** 渲染端订阅自动检测进度或接收最终结果
- **THEN** 系统提供检测标识、阶段、完成数、总数、单一推荐延时、证据、样本数、耗时和置信度
- **AND** 进度和结果不得包含物品原文或已删除的高级时序结构

### Requirement: 操作延迟逐项用途说明
系统 SHALL 在设置页“自动操作等待”标签显示可聚焦的问号说明，并 MUST 准确说明该值用于鼠标移入目标位置后、复制、点击或滚动等依赖悬停动作前的稳定等待。

#### Scenario: 查看唯一设置项
- **WHEN** 用户打开设置页的自动化时序区域
- **THEN** “自动操作等待”标签显示问号入口
- **AND** 说明不要求用户理解或配置物理输入、剪贴板、页签、存仓、画面或失败超时

#### Scenario: 查看始终显示的设置项
- **WHEN** 用户打开设置页的自动化时序区域
- **THEN** 始终显示的时序输入只有“自动操作等待”及其问号入口
- **AND** 自动检测和恢复默认不增加其他毫秒输入

#### Scenario: 查看自适应等待上限
- **WHEN** 旧配置曾包含自适应等待上限或用户查看当前时序设置
- **THEN** 页面不显示自适应等待上限及其说明入口
- **AND** 内部失败超时不作为用户可见配置

#### Scenario: 查看固定结果等待
- **WHEN** 旧配置曾包含固定结果等待或用户查看当前时序设置
- **THEN** 页面不显示剪贴板、仓库页签、存仓或画面固定等待及其说明入口
- **AND** 这些结果等待由程序内部负责

#### Scenario: 键盘访问说明
- **WHEN** 用户使用键盘导航到问号入口
- **THEN** 问号可以获得焦点并展示与鼠标悬停相同的说明
- **AND** 入口具有能识别“自动操作等待”的无障碍名称

#### Scenario: 内部时序不作为用户选项
- **WHEN** 系统展示自动操作等待说明、自动检测结果或恢复默认操作
- **THEN** 页面不通过折叠区、预设、说明表或其他入口重新暴露已删除的内部时序

#### Scenario: 时序行为保持不变
- **WHEN** 系统展示唯一问号说明
- **THEN** `operationDelayMs` 的取值、默认值、持久化和运行时单次悬停语义保持不变
- **AND** 说明展示不改变内部结果确认和输入安全行为
