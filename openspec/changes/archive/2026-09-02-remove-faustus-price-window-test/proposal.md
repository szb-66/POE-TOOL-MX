## Why

价格窗口识别测试原本用于验证开发阶段的 OCR 与输入链路，但现在被前端和主进程强制作为每次改价的前置步骤。正式改价已经逐件执行同等的价格窗口识别和安全校验，该测试不能提供额外保证，且锁定物品会使其失败并阻断整批启动。

## What Changes

- **BREAKING** 移除“价格窗口识别测试”按钮、识别结果和开始前强制门禁。
- **BREAKING** 移除价格窗口测试的 renderer API、preload 方法、IPC 通道和主进程一次性测试流程。
- **BREAKING** 移除 Python 自动化脚本的 `price-window-test` 模式及其事件。
- 完成有效价格配置和市集网格校准后即可启动改价。
- 保留正式运行的逐件价格识别、锁定物品跳过、页面/网格预检和全局安全终止。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `faustus-market-repricing`: 移除价格窗口识别测试能力及启动前必须完成该测试的要求。

## Impact

- 涉及浮士德 Vue/Pinia 页面状态、Electron API/preload/IPC/schema、主进程 manager 和 Python 运行模式。
- 删除公开 IPC `faustus-price-window-test`、preload `testFaustusPriceWindow`、renderer `faustus.testPriceWindow` 以及 Python `price-window-test` 模式。
- 不改变已持久化配置，不需要数据迁移或新依赖。
