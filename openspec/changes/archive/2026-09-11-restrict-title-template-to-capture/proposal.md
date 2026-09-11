## Why

标题模板需要统一通过屏幕框选采集，避免继续导入缺少采集环境信息的图片。旧上传模板继续兼容，搜索区域仍可微调。

## What Changes

- 四类标题模板在设置、背包及配置引导中仅提供框选和重新框选。
- **BREAKING** 删除模板上传的 renderer API、preload 接口和主进程 IPC。
- 保留旧模板、预览、区域编辑及采集后的热重载；缺少元数据时使用中性提示。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `bag-auto-stash`: 标题模板禁止上传，保留框选、区域编辑及旧配置兼容。

## Impact

影响公共模板组件、Electron 上传链路及配置提示，不改变匹配算法、配置格式或依赖。只在开发版验证，不打包。
