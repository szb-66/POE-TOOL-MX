## Why

制作页面只有组合物等汇总，无法在选择词缀阶级时直接看到等级需求。

## What Changes

- 阶级选择显示英文括号中的等级，不限阶级显示最低档阶级的等级。
- 自定义关键词的阶级选择为空并禁用，清除旧阶级数据。
- 保留组合汇总，调整选择列宽度。

## Capabilities

### New Capabilities

### Modified Capabilities

- `item-affix-goal-groups`: 增加阶级选择物等显示及自定义关键词空白规则。

## Impact

词缀条件组件、归一化及相关测试；不新增接口，不打包。
