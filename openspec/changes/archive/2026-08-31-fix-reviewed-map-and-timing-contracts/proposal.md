## Why

当前未提交改动存在两个已确认的 P1：地图崇高石补满流程没有逐颗验证结果，可能连续误耗通货；已撤销的本机时序校准仍残留在主规范和运行时清单中，导致规范与实现冲突并使运行时校验失败。需要在继续提交这些改动前恢复自动化安全边界和 OpenSpec 一致性。

## What Changes

- 在每颗崇高石动作后验证物品仍为稀有、显式词缀计数位于 0 至 6 且相对动作前严格增加；任一条件不满足时立即异常停止，不再使用下一颗通货。
- 为未增加、稀有度变化、越界计数和正常逐颗补满补充回归覆盖。
- 正式从 `automation-operation-delay` 主规范移除已撤销的本机自动时序校准、推荐应用和会话撤销要求，保留九项高级固定时序设置。
- 从运行时清单移除已删除的 `timing_calibration_probe.py`，使源码、运行时发布校验与回退任务声明一致。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `automation-operation-delay`: 删除已经撤销且不再由产品提供的本机自动时序校准、推荐应用及会话撤销契约。

## Impact

- 地图自动洗练脚本：`src/assets/scripts/map_rolling_template.py`
- 地图崇高石回归测试：`test/mapExaltedFinishing.test.js`
- Python 运行时发布清单：`scripts/runtime/manifest.json`
- OpenSpec 主规范与本变更增量：`openspec/specs/automation-operation-delay/spec.md`
- 不新增依赖，不改变 IPC 或持久化格式，不执行打包或发布。
