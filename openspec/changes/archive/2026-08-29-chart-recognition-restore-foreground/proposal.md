# chart-recognition-restore-foreground

## Why

「自动识别两页」与「识别边缘词缀」都会把游戏窗口置前并执行键鼠自动化；目前只有「自动识别两页」在完成后会调用 `restoreMainWindowToForeground()` 恢复应用主窗口，「识别边缘词缀」结束后应用仍留在后台，用户必须手动切换窗口，两条流程行为不一致。

## What Changes

- 在独立边缘词缀识别流程 `probeBorderMods`（`electron/modules/puzzle/service.js`）的执行体 `finally` 中补调已有的 `restoreMainWindowToForeground()`，使成功、失败、紧急停止三条结束路径均恢复主窗口前台。
- 早期校验类失败（海图区未配置、自动化锁被占用等，未发送任何键鼠输入、未聚焦游戏）不改变前台状态，与「自动识别两页」现有行为保持一致。
- 「自动识别两页」已有恢复逻辑（`publish()` 与 `analyze()` finally），本变更不修改；不增强抢焦点机制（现有机制经用户确认有效）；不改动海图自动放入流程。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `chart-mod-recognition`: 新增 Requirement「识别完成后返回应用前台」，规定两条识别流程结束后主窗口 SHALL 恢复前台，并区分真正执行过键鼠自动化的结束路径与校验类提前失败路径。

## Impact

- 代码：仅 `electron/modules/puzzle/service.js` 的 `probeBorderMods`（`finally` 块新增一行调用；`restoreMainWindowToForeground` 已在该文件第 8 行导入）。
- 测试：`test/puzzleIntegration.test.js` 补充 `probeBorderMods` 结束后恢复主窗口的断言。
- 无 API、依赖或数据结构变更；游戏内识别结果吐司为 `alwaysOnTop`，主窗口回前台后仍可见，不受影响。
