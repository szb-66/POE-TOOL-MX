# Proposal: 修复战斗辅助启动失败（IPC 载荷序列化）

## Why

战斗辅助的被动喝药、主动循环和一键回城自 `8ad3918`（统一自动化时序）后全部无法启动：启动请求携带的 `automationTiming.fixedTiming` 是 Pinia 的 Vue reactive Proxy，未序列化即经 contextBridge 传入主进程，Electron 结构化克隆抛 `DataCloneError`（"An object could not be cloned"）。首页卡片弹出该错误，战斗辅助详情页按钮静默失败。

## What Changes

- 在渲染进程 API 封装层（`src/api/electron.js` 的 `combat` 对象）对 `startPotion`、`startLoop`、`executePortal` 三个入口的载荷统一做 JSON 深拷贝序列化，使其与 `updatePotionConfig`/`updateLoopConfig` 及其他模块的既有做法一致。
- 不改变任何业务配置、协议字段或运行行为。

## Capabilities

### New Capabilities
<!-- 无新能力 -->

### Modified Capabilities
- `combat-assist`: 新增启动请求约束——战斗辅助启动（被动喝药、主动循环、一键回城）的 IPC 载荷必须为可克隆的纯数据，渲染响应式代理不得泄漏进 IPC，启动请求不得因载荷序列化失败而失败。

## Impact

- `src/api/electron.js`：`combat.startPotion`、`combat.startLoop`、`combat.executePortal` 三个封装方法（各 1 行改动）。
- 覆盖全部启动入口：战斗辅助详情页按钮、首页卡片、全局快捷键。
- 不涉及主进程、Python 脚本、配置存储或测试协议变更。
