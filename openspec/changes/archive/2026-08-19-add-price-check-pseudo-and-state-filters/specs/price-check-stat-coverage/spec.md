## ADDED Requirements

### Requirement: 所有受支持官方 stat 类型具有一致来源身份
系统 SHALL 保留并展示官方交易目录中受支持的 `pseudo`、`explicit`、`implicit`、`enchant`、`fractured`、`crafted`、`veiled`、`scourge`、`imbued`、`delve`、`sanctum`、`mercenary`、`crucible` 和 `ultimatum` 类型，且 MUST 在解析、模型清理和查询提交过程中保持类型与 ID namespace 一致。

#### Scenario: 详细文本包含特殊来源
- **WHEN** 当前游戏详细复制文本明确标记任一受支持特殊来源
- **THEN** 系统使用同类型官方 ID、显示对应来源标签且不回退为 `explicit`

#### Scenario: 渲染进程伪造类型
- **WHEN** 渲染进程提交的类型与 stat ID namespace 不一致
- **THEN** 主进程从模型中移除该条件且不得发送官方请求

### Requirement: 综合覆盖可量化且可查询
系统 MUST 对固定综合规则集执行可重复覆盖审计，报告规则总数、可用目标、可用来源、缺失项和被安全省略项，并 SHALL 通过真实物品语料证明生成的综合条件可由腾讯国服官方市集接受。

#### Scenario: 综合规则覆盖审计
- **WHEN** 开发版对内置或刷新后的目录执行综合覆盖审计
- **THEN** 每个启用规则都具有唯一合法 `pseudo.*` 目标和至少一个合法来源，所有缺失均被显式报告

#### Scenario: 跨来源综合回归
- **WHEN** 回放包含单抗、双抗、全抗、属性、生命和法术伤害的详细物品文本
- **THEN** 系统生成预期合计值、保留贡献来源并把启用的 `pseudo.*` 条件写入官方查询 JSON

#### Scenario: 官方查询等价性
- **WHEN** 综合条件查询成功并生成官方 query ID
- **THEN** 打开的腾讯国服官方市集查询包含等价的综合 stat 过滤，不得只在本地浮窗显示

