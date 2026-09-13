## Why

逐项框选使新手需要理解十一项校准参数。通过两张游戏截图自动收集并核对元素，降低配置负担。

## What Changes

- 一个校准页面提供两组截图与示例按钮，按钮不限制识别范围。
- 整图自动定位、多图累积核对、重复元素显式替换及部分保存。
- 原手动校准折叠为高级选项；示例大图按需打开。

## Capabilities

### New Capabilities
- `sanctum-calibration-collection`: 整图候选分析、草稿累积与原子保存。

### Modified Capabilities
- `sanctum-recognition`: 合并地图与状态栏校准页面。

## Impact

Vue 校准页面、Electron 校准编辑器与 IPC、本地 Python 图像分析；复用当前存储格式与本地依赖。
