# Design

## Context

所有浮窗都设置了 `alwaysOnTop: true`，但 Electron 默认级别为 `floating`（最低档）。已正常工作的浮窗（背包/仓库、配方控制、地图追踪、拼图、加载反馈、框选）都额外调用了 `setAlwaysOnTop(true, 'screen-saver')`；出现问题的 8 处浮窗恰好缺少这一行。主窗口有用户可选的"常驻置顶"（同为 `floating` 级），两个同级窗口按焦点排序，解释了"浮窗在主窗口下面"的现象。

游戏显示模式检测复用现有游戏窗口探测链路：`system-get-startup-health` → `detectGameDpi`（Python 探针 `WINDOWS_DPI_PROBE`，EnumWindows + 进程名/标题白名单）→ `createStartupHealth` 健康项 → 首页泛化渲染（`status: 'ready'` 即绿点）。

## Goals / Non-Goals

**Goals:**
- 8 处浮窗与正常浮窗置顶行为一致（screen-saver 级）
- 游戏窗口探针输出显示模式判定所需字段，检测结果附带分类
- 系统环境面板新增"游戏显示模式"项，仅受支持模式为绿色

**Non-Goals:**
- 不处理真独占全屏下的置顶穿透（screen-saver 无法压过真独占全屏，属系统限制，通过健康项引导用户切换显示模式）
- 不改动浮窗透明、穿透、拖动、坐标行为
- 不改动 DPI 检测、候选选择、回退与迁移逻辑
- 前端不新增组件或样式（健康项泛化渲染）

## Decisions

1. **逐处加一行 `setAlwaysOnTop(true, 'screen-saver')`，不抽公共 helper。** 代码库既有模式就是创建后内联调用（manager.js:389 等），8 处各一行 diff 最小；抽 helper 反而要跨 6 个文件引入依赖。
2. **显示模式信号选型：窗口样式 + 矩形覆盖率 + `SHQueryUserNotificationState`。**
   - `GetWindowLongW(hwnd, GWL_STYLE)` 判 `WS_CAPTION (0x00C00000)`：有标题栏即窗口模式；
   - 窗口矩形面积 ≥ 所在显示器矩形面积 95%（`MonitorFromWindow` + `GetMonitorInfoW`）判铺满；
   - `SHQueryUserNotificationState` 返回 `QUNS_RUNNING_D3D_FULL_SCREEN(3)` 是 Windows 官方的 D3D 独占全屏信号（Win8+ 在 SHCore.dll，更早在 shell32，ctypes 双路径尝试，失败返回 -1）。
   - 备选的 DXGI swapchain 查询无法跨进程枚举，纯 ctypes 实现成本不成比例，放弃。
3. **探针字段附加到每个候选窗口对象上**（`style`、`windowRect`、`monitorRect`、`notificationState`），保持 `EnumWindows` 输出为扁平列表，`detectGameDpi` 的 JSON 解析路径不变；notificationState 逐候选冗余一个整数值，代价可忽略。
4. **分类为导出纯函数 `classifyGameDisplayMode(candidate)`**，便于 node --test 直接覆盖 5 种场景，不依赖窗口环境。
5. **健康项复用 `detectDpi` 缓存结果**：displayMode 字段搭载在 `detectGameDpi` 返回值上，`collectEnvironment` 不新增探测调用；`evaluateGameDisplayMode(gameDpi)` 复用现有 `gameDpi` 参数。
6. **全链路登记新健康项 id**：`HEALTH_OPERATIONS`（system.js）、`healthReasonCode`（`unsupported_display_mode`）、`HEALTH_IDS`（diagnostics.js 白名单，漏掉会导致诊断快照静默丢弃该项）。
7. **`// ponytail:` 注释标注独占全屏判定上限**：QUNS 信号仅前台可靠，后台铺满窗口按无边框处理——只漏报不误报；如后续需要精确检测，升级路径为前台窗口轮询时的 QUNS 复查。

## Risks / Trade-offs

- [真独占全屏下 screen-saver 级仍被遮挡] → 健康项黄色提示切换无边框全屏/窗口模式；PoE 默认无边框，实际占比极小
- [探针新增 Win32 调用在个别系统失败] → 所有新调用 try/except 降级为字段缺省，分类回退"窗口模式"或"未知"，不影响 DPI 主流程
- [QUNS 信号在非前台误报独占] → 规则要求前台 + 铺满 + 信号三者同时成立才判独占，单信号不触发
- [最小化窗口矩形为 -32000 偏移] → 最小化候选直接短路为"无法判断"，不参与铺满判定

## Migration Plan

无数据迁移。8 处置顶为幂等调用，随下次启动生效；探针字段为新增输出，旧解析方（`detectGameDpi` 自身）同步更新。回滚即还原相关文件。
