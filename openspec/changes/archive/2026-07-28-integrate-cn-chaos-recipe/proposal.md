## Why

当前“商城”模块只能生成国服商店搜索正则，无法读取玩家仓库并判断混沌石商店配方是否完整。国服站点保留了仓库相关接口，但认证与国际服不同，需要在现有 Electron 架构中提供国服专用认证、仓库归一化、配方计算和安全取件能力。

## What Changes

- 在商城页面增加“混沌配方”标签，保留现有商店正则功能。
- 支持国服网页登录与手动 `POESESSID` 两种本地认证方式。
- 支持国服新版及旧版仓库接口、限流处理、普通/大型仓库页筛选。
- 计算未鉴定或可选已鉴定的混沌石配方套装、缺件和取件顺序。
- 增加仓库高亮浮窗、网格校准和分标签页自动取件流程。
- **BREAKING**：项目分发许可证由 MIT 调整为 GPL-3.0-or-later，并加入上游归属说明。

## Capabilities

### New Capabilities

- `cn-chaos-recipe-auth`: 国服账号会话、网页登录、手动令牌与安全注销。
- `cn-chaos-recipe-stash`: 国服赛季/仓库读取、响应归一化、缓存和限流。
- `cn-chaos-recipe-engine`: 混沌配方物品分类、套装计算、缺件统计和取件计划。
- `cn-chaos-recipe-overlay`: 商城页交互、追踪浮窗、仓库高亮、校准和自动取件。

### Modified Capabilities

- `screen-region-template-picker`: 支持为普通与大型仓库网格保存校准区域。
- `captured-key-input`: 支持混沌配方自动取件的开始、暂停/继续和紧急停止快捷键。

## Impact

- 影响商城 Vue 页面、Electron 主进程服务、IPC/preload 接口、窗口管理和 Python 自动化脚本。
- 新增国服网络访问与持久化 Electron Session，但不会保存明文会话令牌到应用设置或日志。
- 新增配方引擎、国服接口适配、浮窗路由及相应 Node 测试。
- 打包产物增加自动取件 Python 资源和 GPL-3.0 许可证/上游声明。
