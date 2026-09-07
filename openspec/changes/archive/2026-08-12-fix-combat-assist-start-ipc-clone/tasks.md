# Tasks

## 1. IPC 载荷序列化修复

- [x] 1.1 在 `src/api/electron.js` 的 `combat.startPotion` 入口用 `craftingIpcPayload` 包装载荷
- [x] 1.2 在 `src/api/electron.js` 的 `combat.startLoop` 入口用 `craftingIpcPayload` 包装载荷
- [x] 1.3 在 `src/api/electron.js` 的 `combat.executePortal` 入口用 `craftingIpcPayload` 包装载荷

## 2. 回归测试

- [x] 2.1 新增战斗辅助启动 IPC 测试：以 Proxy 载荷（含 Proxy `fixedTiming`）调用三个入口，断言收到的参数 `structuredClone` 不抛错且值与传入一致
- [x] 2.2 运行受影响测试文件并通过（`node --test test/combatElectronApi.test.js` 及战斗辅助相关测试）
- [x] 2.3 运行 `npm test` 全量通过
