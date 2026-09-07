## 1. 数据模型与匹配

- [x] 1.1 `normalizeAffixGroup` 新增 `enabled` 字段（默认开启），旧预设自动迁移
- [x] 1.2 `hasEffectiveAffixGroups` 仅统计开启的组合，全关时启动校验拒绝运行
- [x] 1.3 `matchAffixes` 过滤 `enabled === false` 的组合（匹配结果与逐组诊断均不含停用组合）

## 2. UI 与测试

- [x] 2.1 ModuleTwo.vue 组合头部新增 `el-switch` 开关，`@change` 走现有 commit 持久化
- [x] 2.2 test/itemAffixGroups.test.js 新增用例：停用组合不参与匹配、诊断不含停用组、克隆继承开关、全关校验拒绝启动

## 3. 验证

- [x] 3.1 运行受影响的 node --test 测试文件与 openspec validate
