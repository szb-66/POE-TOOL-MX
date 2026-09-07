## Context

设置 store 当前只保存一个 `dpiScale` 数值；脚本服务将其传给生成器，但模板仍自行读取系统 DPI。项目其他屏幕工具和 Python 自动化已经统一使用 Windows 物理像素与 Per-Monitor DPI Awareness，因此 DPI 倍率只应服务于无法调用 `SetCursorPos` 时的 `pynput` 兼容回退。

## Goals / Non-Goals

**Goals:**

- 自动获取游戏窗口实际 DPI，同时保留持久化手动覆盖。
- 对检测失败给出稳定、可解释且不阻断自动化的回退。
- 消除设置值与脚本自检并存的双重 DPI 来源。

**Non-Goals:**

- 不改变 Electron 页面或窗口的视觉缩放。
- 不持续监听游戏窗口移动，也不改变物理坐标数据格式。
- 不为非 Windows 平台实现外部窗口枚举。

## Decisions

1. 主进程启动一个不占用现有脚本进程槽的短生命周期 Python 子进程，使用标准库 `ctypes` 枚举可见顶层窗口。标题包含“流放之路”或“Path of Exile”的窗口进入候选；匹配的前台窗口优先，否则取面积最大的非最小化窗口。通过 `GetDpiForWindow` 获取 DPI。相比引入原生 Node 扩展，此方案不新增二进制依赖，并复用应用已有 Python 前置条件。
2. IPC 返回游戏检测结果及 Electron 主显示器倍率。渲染端 store 负责模式和回退优先级：手动值；本次检测值；上次成功值；主显示器值。这样持久化和用户提示由单一状态模型控制。
3. 新设置字段为 `dpiMode`、`manualDpiScale`、`lastDetectedDpiScale`；`dpiScale` 改为只读有效值。旧 `dpiScale` 同时初始化后两者，但迁移后模式为自动。
4. 应用挂载后异步刷新；做装与洗图生成脚本前再次刷新。失败只提示并继续。
5. 生成器把有效倍率写入模板常量。`SetCursorPos` 主路径直接接收物理像素；只有现有 `pynput` 回退路径进行倍率换算。

## Risks / Trade-offs

- [Python 不存在或 Windows API 不可用] → 返回结构化失败，使用历史值或主屏倍率，不阻塞应用。
- [标题匹配到多个窗口] → 前台优先，否则按可见面积选择，并在结果中返回标题供界面显示。
- [游戏运行中移到其他屏幕] → 每次相关自动化启动前重检；不承担持续监听成本。
- [旧值可能是用户主动设置] → 保留为手动初值和自动失败回退，但按产品决定默认启用自动模式。

## Migration Plan

首次读取新版设置时，如果缺少 `dpiMode`，使用旧 `dpiScale` 初始化 `manualDpiScale` 与 `lastDetectedDpiScale`，并将模式设为自动；下一次保存写入新版字段。回滚旧版本时仍保留兼容的有效 `dpiScale` 字段。

## Open Questions

无。
