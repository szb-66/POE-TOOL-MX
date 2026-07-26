# automation-operation-delay Specification

## Purpose
统一制作、地图洗练和背包自动操作的等待节奏，为用户提供一个与实际等待一致的毫秒配置，并明确旧配置迁移、输入边界、脚本执行语义以及内部安全等待与用户配置之间的边界。

## Requirements

### Requirement: 单一自动操作等待
系统 SHALL 为制作、地图洗练和背包提供唯一的 `operationDelayMs` 用户配置，其值表示真实毫秒数。

#### Scenario: 默认与边界
- **WHEN** 配置缺失、非有限、小于 20ms或大于 500ms
- **THEN** 系统分别使用 80ms、80ms、20ms或500ms

#### Scenario: 执行自动操作
- **WHEN** 任一受支持模块移动鼠标、发送点击或等待复制结果
- **THEN** 系统直接使用 operationDelayMs，不应用隐藏比例换算

#### Scenario: 设置界面
- **WHEN** 用户查看操作延迟设置
- **THEN** 页面只显示一个可输入真实毫秒值的“自动操作等待”，且不显示延迟预设或其他通用延迟字段

#### Scenario: 内部安全等待
- **WHEN** 自动化需要组合键按下间隔、检测轮询或秒级游戏业务等待
- **THEN** 系统可保留固定内部等待，但不得将其暴露为通用操作延迟配置

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
