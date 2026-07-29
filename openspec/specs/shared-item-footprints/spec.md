# shared-item-footprints Specification

## Purpose
TBD - created by archiving change optimize-bag-stash-footprints. Update Purpose after archive.
## Requirements
### Requirement: 共享可信物品占位
系统 SHALL 以规范化物品类别和基底身份共享宽高，并合并内置目录与仓库 API 物品尺寸。

#### Scenario: 仓库物品登记尺寸
- **WHEN** 自动取件归一化一个具有合法 `w/h` 和基底名称的仓库物品
- **THEN** 系统登记该物品身份的宽高供后续自动入库快照使用

#### Scenario: 冲突尺寸
- **WHEN** 同一规范化身份登记了不同宽高
- **THEN** 系统 MUST 将该身份标记为冲突且不得输出到自动入库快照

#### Scenario: 内置目录不可用
- **WHEN** 内置占位目录缺失、版本错误或内容无效
- **THEN** 系统 MUST 使用空内置目录继续运行并允许仓库 API 数据登记

### Requirement: 冻结自动入库占位快照
系统 MUST 在每轮自动入库启动时冻结当前可信占位映射，并且运行中不得请求远程尺寸数据。

#### Scenario: 入库启动
- **WHEN** 自动或手动入口启动一轮自动入库
- **THEN** Python 运行配置包含该时刻的可信 `inventory.itemFootprints` 快照

#### Scenario: 入库期间登记新尺寸
- **WHEN** 当前入库运行期间其他功能登记新的仓库物品尺寸
- **THEN** 新尺寸仅作用于后续轮次

