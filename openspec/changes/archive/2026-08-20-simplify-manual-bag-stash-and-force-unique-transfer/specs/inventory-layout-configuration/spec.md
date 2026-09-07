## MODIFIED Requirements

### Requirement: 布局配置兼容与校验
系统 MUST 为旧配置补齐默认布局，并只持久化合法、去重后的格子坐标；已有合法额外列数 MUST 保持不变。

#### Scenario: 加载旧配置
- **WHEN** `bagSettings` 不包含 `inventoryLayout`
- **THEN** 系统默认关闭额外背包、将列数设为 6 且不排除任何格子

#### Scenario: 加载无效布局
- **WHEN** 额外列数缺失、不是有限数字或无法解析，或行号、列号、排除项格式无效
- **THEN** 系统将额外列数设为 6，并忽略非法或重复的排除项

#### Scenario: 加载越界列数
- **WHEN** 额外列数是小于 1 或大于 6 的有限数字
- **THEN** 系统将列数限制到 1 至 6，并忽略非法或重复的排除项

#### Scenario: 保留合法旧列数
- **WHEN** 已持久化的额外列数是 1 至 6 的合法整数
- **THEN** 系统保持该列数不变
