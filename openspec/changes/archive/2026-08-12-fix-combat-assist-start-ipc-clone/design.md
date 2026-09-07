# Design: 战斗辅助启动载荷统一序列化

## Context

- `src/api/electron.js` 是渲染进程 IPC 封装层，已定义 `craftingIpcPayload`（`JSON.parse(JSON.stringify(value))`）用于把 Pinia/Vue 响应式数据转为纯数据跨 contextBridge 传递，绝大多数入口（含 `combat.updatePotionConfig`/`updateLoopConfig`）均已使用。
- `combat.startPotion`/`startLoop`/`executePortal` 三个入口直接透传载荷，其中 `automationTiming.fixedTiming` 是 Pinia `ref` 解包后的 reactive Proxy，Electron 结构化克隆抛 `DataCloneError`，导致三个战斗辅助启动功能全部失败。
- 修复必须与既有约定一致，且覆盖全部启动入口（详情页、首页卡片、全局快捷键都汇聚到这三个封装方法）。

## Goals / Non-Goals

**Goals:**
- 三个启动入口的载荷在跨进程前成为可克隆纯数据
- 零业务行为变化：配置字段、校验、主进程协议不变

**Non-Goals:**
- 不改主进程 `electron/modules/ipc/combat.js`
- 不改 Python 脚本、配置存储、测试协议
- 不引入新依赖或新工具函数

## Decisions

**在 API 封装层序列化，而非调用方。** 对 `combat.startPotion`、`combat.startLoop`、`combat.executePortal` 的 payload 套用既有 `craftingIpcPayload`：

```js
startPotion: (payload) => window.electronAPI.startPotionAssist?.(craftingIpcPayload(payload)),
startLoop: (payload) => window.electronAPI.startLoopAssist?.(craftingIpcPayload(payload)),
executePortal: (payload) => window.electronAPI.executePortalAssist?.(craftingIpcPayload(payload)),
```

理由：
- 与同对象 `updatePotionConfig`/`updateLoopConfig` 及全项目其他 API（bag、crafting、chaosRecipe、puzzle 等）完全一致，单一模式。
- 调用方（`combatService.js` 三处）已对 `config` 单独序列化但遗漏 `automationTiming`，在封装层序列化整个载荷可一劳永逸，杜绝未来新增字段再漏。
- 序列化在发送侧统一进行，`sampleCombatPixel`（仅 `point` 数字对象）与无参状态查询不受影响。

## Risks / Trade-offs

- `craftingIpcPayload` 在 `value` 为 `null`/非对象时原样返回；三个入口始终传对象，无空值风险。
- JSON 深拷贝会丢弃 `undefined`/函数字段——现有载荷均为纯配置数据，无此类字段，行为无变化。
