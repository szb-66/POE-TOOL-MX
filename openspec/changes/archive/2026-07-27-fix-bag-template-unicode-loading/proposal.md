## Why

背包标题模板保存在包含中文等非 ASCII 字符的 Windows 路径时，Electron 侧校验能够通过，但 Python/OpenCV 侧可能无法读取图片，导致开启背包功能时报“仓库或背包标题模板无法加载”。需要让检测器对应用数据目录和模板文件名中的 Unicode 字符保持兼容。

## What Changes

- 使用 Windows Unicode 路径安全的方式读取仓库与背包标题模板。
- 保持模板灰度解码、空图片拒绝和双模板完整性校验行为不变。
- 增加包含中文目录和文件名的回归测试，防止重新引入路径兼容问题。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `bag-auto-stash`: 标题模板加载必须支持包含 Unicode 字符的有效本地文件路径。

## Impact

- 影响 `src/assets/scripts/bag_auto_stash_template.py` 的模板图片加载实现。
- 影响 `test/bagAutoStash.test.js` 的 Python 检测器回归覆盖。
- 不改变前端配置格式、IPC API 或依赖列表。
