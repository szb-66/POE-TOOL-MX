## Context

背包检测与入库进程由主进程编排，但配置和页面状态保存在主渲染进程。现有通用浮窗已被做装和地图流程占用，直接复用会造成生命周期冲突；同时新按钮必须在点击时不让游戏失去前台，否则入库安全门禁会拒绝请求。

## Goals / Non-Goals

**Goals:**

- 在保持单会话自动入库兼容性的同时支持等待用户确认。
- 让主进程成为浮层运行状态的唯一真相来源。
- 提供可点击、可拖动、位置可恢复且不抢焦点的独立窗口。
- 彻底移除背包快捷键入口，保留统一手动 IPC。

**Non-Goals:**

- 不修改 Python 逐格扫描、黑名单和输入安全逻辑。
- 不为浮层增加独立总开关、尺寸或样式定制。
- 不复用或改造现有做装、地图及剧情浮窗。

## Decisions

- 在 `bagSettings` 增加 `immediateStash` 和 `showStashButtonOnlyWhenReady`，缺失时均归一化为 `true`。这既保存用户选择，也保证旧用户升级后行为不变。
- 将 `immediateStash` 写入检测运行配置。会话控制器仍维护 ready、foreground、locked 和 stashing，但仅在立即执行开启时返回自动启动信号。
- 由背包 IPC 模块根据检测和入库事件构造浮层快照，并调用窗口管理器创建、显示、隐藏或更新专用窗口。浮层渲染进程不读取自己的 Pinia/localStorage，避免多渲染进程状态漂移。
- 浮层使用小尺寸、`focusable: false` 的独立 BrowserWindow。窗口本身接收按钮和 CSS 拖动区域的鼠标事件，窗口外天然穿透，无需扩大透明点击区域。
- 条件显示模式的可见条件为 `ready && foreground` 或 `stashing`；常驻模式在检测模块运行期间显示。按钮仅在 ready、foreground 且非 stashing 时可点击。
- 点击按钮继续调用 `start-bag-stash`，由同一个 `beginManual` 门禁完成最终校验。主进程状态更新负责禁用按钮，防止重复点击竞争。
- 从快捷键默认 schema 删除 `stashStart`。现有合并函数只接受默认 schema 中的键，因此历史值会自然丢弃且不再注册。

## Risks / Trade-offs

- [检测事件和进程退出竞态造成浮层状态滞后] → 每个终止路径都先更新主进程状态，再关闭或刷新浮层，并继续保留 IPC 门禁作为最终保护。
- [透明置顶窗口抢走游戏焦点] → 使用 `focusable: false`、`showInactive()` 和专用小窗口，并增加集成测试约束。
- [保存的位置落到已移除显示器] → 恢复时校验位置是否仍与任一工作区相交，否则回退到主屏右侧。
- [旧快捷键仍留在 localStorage] → 不执行破坏性迁移；schema 归一化时忽略，保存设置后自然清理。

## Migration Plan

1. 新字段以 `true` 为默认值加载旧 `bagSettings`。
2. 新版本启动后不再注册 `stashStart`；其他快捷键保持原值。
3. 模块启动时依据新配置创建浮层，模块停止时销毁。
4. 回滚到旧版本时未知字段会被旧归一化逻辑忽略，不影响既有配置。

## Open Questions

无。
