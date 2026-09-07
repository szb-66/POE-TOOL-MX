## Why

物品自动制作运行时，浮窗有时显示的是上一个物品的词缀，并可能因解析到旧剪贴板内容而误判「词缀匹配成功」提前停止——此时游戏内当前物品实际并未匹配目标词缀。根因是复制成功判定只看剪贴板序列号变化（游戏 `EmptyClipboard` 或其他程序写剪贴板也会递增序列号），复制失败时 `pyperclip.paste()` 读到旧文本被当作新物品解析；同时装备模板在解析失败后直接继续应用通货，物品被改变而浮窗仍停留在上一轮结果。

## What Changes

- 剪贴板复制成功判定从「序列号变化」改为「序列号变化且粘贴内容非空且与复制前不同」，装备与地图/海图模板统一生效。
- `read_clipboard_to_file` 在粘贴内容为空或等于复制前内容时返回失败，不再把旧剪贴板内容当作新物品写入解析请求。
- 装备制作（`craft_affixes`）在读取或解析失败时只重试一次复制与解析，重试不重复使用制作通货；仍失败则带可区分原因安全停止，不再继续应用通货。
- 浮窗始终显示与制作判断同一份最新解析结果，不再出现「浮窗匹配成功但游戏内物品不匹配」。

## Capabilities

### New Capabilities

- 无

### Modified Capabilities

- `crafting-result-synchronization`: 复制成功判定要求剪贴板内容实际变化；解析失败重试语义从地图/海图扩展到装备制作

## Impact

- `src/assets/scripts/crafting_template.py`：`clipboard_changed`、`wait_for_clipboard_change`、`read_clipboard_to_file`
- `src/assets/scripts/map_rolling_template.py`：相同的剪贴板验证逻辑（保持一致）
- `src/utils/python.js`：`craft_affixes` 生成逻辑，抽取只重试读取的当前物品读取流程
- 测试：`test/craftingParseSynchronization.test.js` 扩展装备模板用例；相关回归（adaptiveTiming、mapRuntimeTemplate、bagAutoStash、augmentationCrafting、chartRolling）
- 无新依赖；不改变通货预检、前台门禁、停止快捷键与富豪石/崇高石既有行为
