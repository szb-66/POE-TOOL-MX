## Context

物品制作和地图制作由两个业务函数生成不同 Python 脚本，但最终共享 renderer API、preload、`generate-and-execute-script` IPC、Python 检测器和进程状态。当前 IPC 在 `spawn()` 返回后立即报告成功，没有确认解释器及依赖兼容，也没有等待进程的 `spawn`/早期 `error` 结果；因此后台进程可能没有进入可执行状态，前端却已显示启动成功。修复需要跨 renderer 与 Electron 主进程，并保留既有脚本模板和配置格式。

## Goals / Non-Goals

**Goals:**

- 为物品制作和地图制作建立相同、可测试的启动成功判定。
- 在启动前选择包含 `pynput`、`pyperclip` 的 Python 解释器。
- 只在子进程成功创建后返回成功；同步清理所有失败路径。
- 用不依赖真实游戏窗口的测试复现和锁定启动协议。

**Non-Goals:**

- 不重写物品制作或地图匹配算法。
- 不改变坐标、预设和快捷键的数据格式。
- 不自动安装 Python 或第三方模块。

## Decisions

1. **在 Electron 主进程收紧启动协议。** IPC 将校验脚本内容和依赖兼容解释器，并等待子进程 `spawn` 成功或 `error` 失败后再响应。选择主进程作为修复点，是因为两个制作入口和未来其他调用方都经过这里；仅在页面增加延迟或状态轮询无法消除虚假成功。
2. **复用依赖感知的 Python 检测器。** 制作启动要求 `pynput` 与 `pyperclip`，与脚本顶部的实际导入保持一致。相比先启动再解析 stderr，这能在产生覆盖层和文件监听副作用前返回明确错误。
3. **抽取可注入、可单测的进程启动边界。** 将“写脚本—检测解释器—spawn—确认启动—清理失败”的关键逻辑放到不依赖真实 Electron 窗口的函数中，测试通过 fake child process 精确覆盖成功、同步抛错和异步 `error`。
4. **前端状态仍由真实 IPC 结果驱动。** `scriptService` 只有收到 `{ success: true, processId }` 才设置运行态，并对无效响应按失败处理，防止桥接缺失或异常响应造成假成功。

## Risks / Trade-offs

- [子进程在 `spawn` 后仍可能因脚本运行错误快速退出] → 启动握手只证明 OS 已创建进程；保留 stdout/stderr 与 close 通知，并测试前端不会在明确启动失败时进入运行态。
- [依赖探测增加一次进程调用] → 使用检测器已有缓存，后续启动不重复探测。
- [重构 IPC 可能影响停止和覆盖层] → 维持既有进程引用、输出转发和 close 清理语义，并运行全量测试与构建。

## Migration Plan

无需数据迁移。发布时替换 Electron 主进程代码和 renderer 脚本服务；若出现问题，可回退相关代码，不影响用户预设。

## Diagnosis

- 物品开始和地图开始均由 `initShortcuts()` 注册，并经 `dispatchShortcutAction()` 分发到各自业务函数；两个业务函数最终调用同一个 `generate-and-execute-script` IPC，因此页面和字段映射不是故障点。
- 两种真实生成脚本均无残留模板占位符，且可由当前 Python 成功编译，因此脚本生成语法不是故障点。
- 已证实的公共根因是 IPC 使用 `shell: true` 启动脚本，并在子进程发出 `spawn` 或 `error` 前立即返回成功；带空格路径或异步启动失败时，renderer 会进入虚假的运行态。该链路同时只检测“任意 Python”，会选择缺少制作依赖的解释器并在报告成功后立即退出。
- 修复通过依赖感知解释器选择、无 shell 参数化 spawn、启动事件握手、失败清理和 renderer PID 校验共同封闭这些失败路径。
