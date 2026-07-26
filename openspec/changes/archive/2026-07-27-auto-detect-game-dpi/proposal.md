## Why

现有“屏幕 DPI 缩放”只能手工填写，而且保存的值虽然传入脚本生成器，却没有成为脚本的实际 DPI 来源；做装与洗图模板各自读取系统 DPI，在多显示器不同缩放时无法可靠对应游戏所在屏幕。需要把游戏窗口 DPI 检测、设置优先级和脚本回退行为统一起来，让默认配置无需用户校准。

## What Changes

- 新增自动与手动 DPI 模式，默认自动识别《流放之路》窗口的 DPI。
- 应用启动和相关自动化运行前刷新自动 DPI，失败时依次回退到最近成功值和主显示器倍率，并向用户展示来源。
- 将有效 DPI 倍率注入做装与洗图脚本的 `pynput` 回退路径，保留 Windows API 物理像素主路径不缩放。
- 迁移旧 `dpiScale` 为自动模式的回退值和手动初值。

## Capabilities

### New Capabilities
- `game-display-dpi`: 检测游戏窗口 DPI、解析自动/手动设置优先级并提供可见的回退状态。

### Modified Capabilities

无。

## Impact

影响 Electron 主进程与 preload IPC、渲染端 Electron API、设置 Pinia store 和设置页面，以及做装/洗图脚本生成与模板。检测复用现有 Python 3 前置条件，只使用标准库 `ctypes`，不引入第三方依赖。
