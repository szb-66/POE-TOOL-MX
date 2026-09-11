## Why

圣所全画面标题匹配阻塞共享背包检测，本机五模板离线计时约 749ms/轮。周期广播还使旧浮窗重复显隐，可能导致游戏光标闪烁，需实机验证。

## What Changes

- 圣所公共标题限定框选位置附近匹配，坏模板隔离并提示重新框选。
- 公共检测按消费者仅启用圣所地图标题，串行重载并等待旧进程退出。
- 背包、混沌浮窗仅在实际显隐变化时操作窗口，保留检测心跳和过期保护。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `shared-game-interface-detection`: 按需局部匹配与消费者切换隔离。
- `overlay-drag-consistency`: 周期状态同步不得重复显隐。

## Impact

公共检测协调器、Python 标题匹配、背包与混沌窗口及相关测试。不改外部 IPC、模板存储格式及输入保护，不打包。
