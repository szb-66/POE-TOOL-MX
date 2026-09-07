# 组合启停开关

## Why

用户配置多个达标组合后，常需要临时停用某组合（如已不再需要的方案、或想保留备用），目前只能删除后重建或整体停用词缀制作。缺少"暂时不生效"的轻量手段，组合越积越多时管理成本高。

## What Changes

- 每个达标组合新增 `enabled` 开关，默认开启（旧数据迁移后默认为开启）
- 关闭的组合保留其名称与词缀条件，但不参与词缀匹配判断
- 全部组合均关闭时，启动词缀制作校验拒绝运行并提示至少开启一个有效组合

## Capabilities

### New Capabilities

- `affix-goal-group-toggle`: 达标组合启停开关，覆盖组合级启用状态的数据模型、持久化、匹配参与与启动校验语义

### Modified Capabilities

- `item-affix-goal-groups`: "多组达标条件采用组间 OR" 需求增加组合级启停语义，仅开启的组合参与达标判断

## Impact

- `src/domains/items/affixConfig.js`：组合数据模型新增 `enabled` 字段；`hasEffectiveAffixGroups` 仅统计开启的组合
- `electron/modules/item/matcher.js`：`matchAffixes` 跳过关闭的组合
- `src/domains/items/components/ModuleTwo.vue`：组合头部新增开关控件
- `src/utils/validation.js`：全关时校验行为经由 `hasEffectiveAffixGroups` 自动生效
- 测试：`test/itemAffixGroups.test.js` 新增开关相关用例
- 存储格式：预设 JSON 组合对象新增可选字段 `enabled`，向后兼容
