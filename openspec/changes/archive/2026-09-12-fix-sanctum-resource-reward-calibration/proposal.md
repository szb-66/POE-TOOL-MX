## Why

实际资源分布在不同位置，金币只有数字，单一大框和带标签解析无法可靠读取。奖励是无标题悬浮内容，固定标题与范围绕过了已有可用的状态栏采集。

## What Changes

- 三个独立资源选区，同帧裁剪并按资源类型解析。
- 奖励读取复用状态栏悬停采集，主动读取强制刷新。
- **BREAKING** 校准升级 v5，淘汰旧资源大框和奖励标题、范围，资源需重新校准。
- 更新界面、文档及回归测试。

## Capabilities

### New Capabilities

### Modified Capabilities
- `sanctum-recognition`: 分区资源识别及无标题奖励悬停读取。

## Impact

影响 Vue 校准与读取入口、共享校准模型、Electron 读取编排及 Python 同帧裁剪。保留 readRunPanel(kind) 业务接口，无新增依赖。
