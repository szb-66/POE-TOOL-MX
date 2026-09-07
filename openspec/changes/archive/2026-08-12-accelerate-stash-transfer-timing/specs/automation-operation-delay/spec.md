## MODIFIED Requirements

### Requirement: 单一自动操作等待
系统 SHALL 为制作、地图洗练、背包、仓库取件和混沌配方取件提供唯一的 `operationDelayMs` 用户配置，其值表示鼠标移入目标位置后、执行依赖悬停的操作前的真实悬停稳定毫秒数。

#### Scenario: 默认与边界
- **WHEN** 配置缺失、非有限或为负数
- **THEN** 系统使用默认值 50ms

#### Scenario: 用户自定义时间
- **WHEN** 用户输入任意非负有限毫秒数，包括 0ms 或超过旧上限的值
- **THEN** 系统原样保存并使用该值，不按最小值、最大值或步长裁剪

#### Scenario: 执行自动操作
- **WHEN** 任一受支持模块移动鼠标并准备执行复制或点击
- **THEN** 系统在鼠标移动后直接等待 operationDelayMs 作为悬停稳定时间，不应用隐藏比例换算，也不设置额外下限

#### Scenario: 设置界面
- **WHEN** 用户查看操作延迟设置
- **THEN** 页面只显示一个可输入真实毫秒值且不设置最小值或最大值的“自动操作等待”，并注明该值控制鼠标移入后的悬停稳定时间，且不显示延迟预设或其他通用延迟字段

#### Scenario: 内部安全等待
- **WHEN** 自动化需要组合键按下间隔、按键或按钮保持、释放稳定或剪贴板响应
- **THEN** 系统默认使用修饰键稳定 50ms、按键或按钮保持 20ms、释放稳定 20ms、剪贴板响应窗口 250ms，并允许用户在固定时序配置中输入任意非负有限毫秒数，不施加业务范围裁剪

#### Scenario: 点击后等待
- **WHEN** 任一受支持模块完成一次点击
- **THEN** 系统只使用固定内部释放稳定等待，不再额外消耗 operationDelayMs

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
