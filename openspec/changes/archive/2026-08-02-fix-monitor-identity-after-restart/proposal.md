## Why

背包标题模板的启动校验把 Electron 显示器 `id` 当作跨系统重启稳定标识；Windows 在重启后重新分配该标识时，即使显示器、DPI、分辨率和采集坐标均未变化，也会错误阻止自动入库并要求重新框选。

## What Changes

- 将显示器 `id` 从唯一判定条件调整为优先匹配提示，并在 id 变化时通过物理分辨率、缩放比例和采集区域所在屏幕安全解析当前显示器。
- 保留对真实显示环境变化的阻止：无法唯一定位兼容显示器、DPI 或物理分辨率变化时仍要求重新框选。
- 增加重启后显示器 id 变化、id 交换、多显示器歧义和真实环境变化的回归测试。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `bag-auto-stash`: 采集环境兼容性校验允许显示器运行时 id 在重启后变化，同时继续严格校验可影响模板坐标的显示参数。

## Impact

- 影响 `src/utils/bagConfig.js` 中的采集环境校验。
- 影响 `electron/modules/ipc/bag.js` 提供给校验器的当前显示器快照。
- 更新 `test/screenRegionPicker.test.js` 与 `bag-auto-stash` 规格；不改变保存格式和现有用户配置。
