# automation-operation-delay Specification

## Purpose
统一制作、地图洗练、背包、仓库取件和混沌配方取件的输入等待节奏，为用户提供鼠标移入后的悬停稳定毫秒配置，并明确旧配置迁移、输入边界、脚本执行语义以及内部安全等待与用户配置之间的边界。

## Requirements

### Requirement: 单一自动操作等待
系统 SHALL 为制作、地图洗练、背包、仓库取件和混沌配方取件提供唯一的 `operationDelayMs` 用户配置，其值表示鼠标移入目标位置后、执行依赖悬停的操作前的真实悬停稳定毫秒数。

#### Scenario: 默认与边界
- **WHEN** 配置缺失、非有限、小于 20ms或大于 500ms
- **THEN** 系统分别使用 80ms、80ms、20ms或500ms

#### Scenario: 执行自动操作
- **WHEN** 任一受支持模块移动鼠标并准备执行复制或点击
- **THEN** 系统在鼠标移动后直接等待 operationDelayMs 作为悬停稳定时间，不应用隐藏比例换算，也不设置额外下限

#### Scenario: 设置界面
- **WHEN** 用户查看操作延迟设置
- **THEN** 页面只显示一个可输入真实毫秒值的“自动操作等待”，并注明该值控制鼠标移入后的悬停稳定时间，且不显示延迟预设或其他通用延迟字段

#### Scenario: 内部安全等待
- **WHEN** 自动化需要组合键按下间隔、按键或按钮保持、释放稳定或剪贴板响应
- **THEN** 系统使用固定内部等待：修饰键按下后稳定至少 50ms、按键或按钮保持至少 20ms、释放后稳定至少 20ms、剪贴板响应窗口至少 250ms，且不得暴露为通用操作延迟配置

#### Scenario: 点击后等待
- **WHEN** 任一受支持模块完成一次点击
- **THEN** 系统只使用固定内部释放稳定等待，不再额外消耗 operationDelayMs

### Requirement: 旧延迟配置迁移
系统 SHALL 将旧全局三字段或背包独立等待迁移为单一自动操作等待，并在保存时删除旧格式。

#### Scenario: 新字段已存在
- **WHEN** settings 已包含有效 operationDelayMs
- **THEN** 系统优先使用该值并忽略所有旧延迟字段

#### Scenario: 背包独立等待存在
- **WHEN** 新字段缺失且 bagSettings 包含有效 transferDelayMs
- **THEN** 系统使用 transferDelayMs 作为 operationDelayMs

#### Scenario: 仅旧全局三字段存在
- **WHEN** 新字段和背包独立等待均缺失且 settings.delays 包含旧字段
- **THEN** 系统按旧隐藏倍率还原三个实际等待、取最大值并将结果提高到至少 80ms

#### Scenario: 保存迁移结果
- **WHEN** 系统保存设置
- **THEN** 持久数据只包含 operationDelayMs，不再包含 settings.delays 或 bagSettings.transferDelayMs
