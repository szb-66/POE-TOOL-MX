## Context

五个 Python 模板脚本各自内联输入控制逻辑：制作与地图通过 `{{DELAY_*}}` 注入等待值，背包、仓库取件与混沌配方取件通过 config JSON 传入 `operation_delay_ms`/`operationDelayMs`。现有 Ctrl+点击与 Ctrl+C 的组合键间隔是 0–50ms 的写死值，与用户配置无关；根因与动机见 proposal.md。

## Goals / Non-Goals

**Goals:**

- 统一五个脚本的 Ctrl+点击、Ctrl+C 与鼠标移动时序语义。
- `operationDelayMs` 仅作为悬停稳定等待，严格等于设置值，不设隐藏下限。
- 内部固定时序常量在各脚本一致，并由测试强制保证。

**Non-Goals:**

- 不改战斗辅助、海图自动放置、仓库页选择器的既有等待模型。
- 不改 `operationDelayMs` 字段名、范围、迁移逻辑、IPC 或打包清单。
- 不新增共享 Python 模块，避免 `runtime manifest` 与 `extraResources` 变更。

## Decisions

1. **常量内联而非共享模块**：五个脚本是独立分发的模板，共享模块需要同步修改 `scripts/runtime/manifest.json`、`electron-builder` 的 `extraResources` 以及临时目录复制逻辑；内联常量并新增测试断言五处一致，成本和回归面最小。
2. **固定内部常量取值**：`MODIFIER_SETTLE_SECONDS = 0.05`（地图存仓已用 50ms 验证可行）、`KEY_HOLD_SECONDS = 0.02`、`BUTTON_HOLD_SECONDS = 0.02`、`RELEASE_SETTLE_SECONDS = 0.02`、`CLIPBOARD_RESPONSE_MIN_SECONDS = 0.25`。
3. **标准 Ctrl+点击序列**：Ctrl down → 等 50ms → 左键 down → 等 20ms → 左键 up → 等 20ms（Ctrl 仍按住）→ Ctrl up → 等 20ms。Ctrl 覆盖左键按下与释放全程，避免左键被当作普通点击拾起物品。
4. **标准 Ctrl+C 序列**：Ctrl down → 等 50ms → C down → 等 20ms → C up → 等 20ms → Ctrl up → 在 ≥250ms 窗口内等待剪贴板变化；制作/地图的单次读取同样以 `max(0.25s, clipboard_read_delay / 1000.0)` 兜底。
5. **鼠标移动**：移动到位后 `sleep(operationDelayMs)` 是唯一悬停等待，严格按设置值；`click_mouse` 改为显式 press→hold→release 加固定 20ms 释放等待，不再消耗用户延迟。
6. **业务等待保留**：地图存仓 0.2s、仓库页选择 `max(0.25, mouse_click_delay * 2)`、仓库取件与海图放置的截图验证等待保持现状。
7. **清理旧常量**：删除被替换的 `INPUT_EVENT_DELAY_SECONDS` 与 `action_delay`，避免无用代码残留。

## Risks / Trade-offs

- [固定 50ms 在极端卡顿下仍可能不足以让游戏采样到 Ctrl] → 背包复制有两次重试、仓库取件有图像变化验证兜底；用户可通过提高 `operationDelayMs` 间接降低整体卡顿概率。
- [严格按设置值导致 20ms 悬停对低配机器不稳] → 用户已确认不设隐藏下限；默认 80ms 不变，且悬停只影响复制/点击前的等待。
- [五处脚本回归面大] → 新增 `test/inputTiming.test.js` 断言常量一致与“Ctrl 最后释放”顺序，并运行完整 `npm test`。
