## Why

地图制作的类别白名单会跳过蠕动的邀请、咆哮的邀请等裂隙之石，无法使用现有洗练配置。

## What Changes

- 裂隙之石进入现有异界地图制作流程，共用预设与完整词缀联想。
- 邀请显示物品等级，排除任务物品，不新增页面说明或标签。
- 保留现有通货流程、属性缺失按零匹配及停止保护。

## Capabilities

### New Capabilities
- `breachstone-map-rolling`: 裂隙之石类别在地图制作中的识别、匹配及等级展示。

### Modified Capabilities
无。

## Impact

影响物品匹配器、地图 Python 模板及回归测试；不更改配置接口或预设结构。
