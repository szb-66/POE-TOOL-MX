## Why

核实审查发现纠正重算误判空栏，重复保存导致历史及广播增长，整栏失败存在不可用按钮。

## What Changes

- 保持已确认覆盖的空状态栏完整性。
- 规则保存幂等，历史最多保留最近 100 次变更，状态广播仅携带记忆版本。
- 无目标证据的整栏失败只提供重读入口。

## Capabilities

### New Capabilities

### Modified Capabilities

- `sanctum-recognition`: 纠正重算完整性、有限历史和可操作入口。

## Impact

影响效果纠正、记忆、服务状态投影及圣所页面；保留现有规则存储和按需读取接口，只在开发环境验证。
