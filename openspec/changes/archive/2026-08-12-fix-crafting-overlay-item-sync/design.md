## Context

参见 [proposal.md](proposal.md) 的问题说明。装备与地图/海图共用剪贴板复制与文件解析通道：Python 发送 Ctrl+C 后轮询剪贴板判定复制成功，再把粘贴文本写入 `item_info.txt`，Electron 主进程解析后写回 `item_info_result.json`（含 `requestId`），Python 按 `requestId` 只接受当前请求的结果，浮窗通过结果文件监听获得同一份结果。

当前缺陷集中在复制成功判定与失败后的控制流：

1. `clipboard_changed`（两个模板相同实现）以「剪贴板序列号变化」为充分条件。Windows 上 `EmptyClipboard` 与任何程序写入剪贴板都会递增序列号，游戏复制失败时序列号仍可能变化，随后 `pyperclip.paste()` 读到旧文本。
2. `read_clipboard_to_file` 只校验粘贴文本非空，未校验与复制前内容不同，旧文本会被当作新物品写入解析请求。
3. 装备模板 `craft_affixes`（由 `src/utils/python.js` 生成）在读取失败或解析返回错误时 `continue`，下一轮循环直接再次 `apply_currency`；地图模板已有「只重试读取、不重复用通货」的 `read_current_rolling_target` 修复，装备模板缺失。

## Goals / Non-Goals

**Goals:**

- 复制成功必须有「内容实际变化」的可验证证据，杜绝旧剪贴板内容被当作当前物品解析。
- 装备制作在读取/解析失败时只重试一次复制读取，不重复应用通货；仍失败则带原因安全停止。
- 两个模板的剪贴板验证语义保持一致，装备失败重试语义与地图模板对齐。

**Non-Goals:**

- 不改变匹配条件、通货坐标、预检、前台门禁、停止快捷键与富豪石/崇高石行为。
- 不解决浮窗不显示破碎/工艺词缀的显示问题（用户确认非本次问题）。
- 不调整浮窗监听延迟与 IPC 链路。

## Decisions

### 1. 复制成功 = 序列号变化且内容实际变化

将 `clipboard_changed` 判定改为双条件：序列号变化仅是必要条件，粘贴内容还必须非空且不等于 `before_text` 才返回成功。`wait_for_clipboard_change` 保持轮询语义不变（直到双条件满足或超时）。`read_clipboard_to_file` 在复制后再次校验粘贴内容非空且不等于 `before_text`，否则返回 `False`，不写入请求文件。

备选方案是只比较内容、完全忽略序列号。序列号是 Windows 上检测复制动作最灵敏的信号，内容对比会等到数据就绪；两者都保留最稳妥，且内容检查对序列号 API 不可用的环境（已有回退分支）同样有效，因此不采用单一信号。

`stash_item`（地图模板）依赖 `send_copy_command` 的返回值判断物品是否已存走：物品存走后复制得到空剪贴板，双条件下判定不成功 → 超时返回失败 → `item_still_present` 为假 → 存仓成功语义保持不变。

### 2. 装备制作抽取只重试读取的当前物品读取流程

在 `craft_affixes`（`src/utils/python.js` 生成代码）中抽取 `read_current_item()`：复制 + 等待解析 + 校验，最多执行两次，第二次只重新复制读取（不应用通货）。首次失败打印原因后重试一次；仍失败设置致命停止原因、释放输入并返回失败，不再进入下一轮通货循环。`augment_single_affix_if_needed` 中增幅后的读取改为复用该函数，与地图模板 `read_current_rolling_target(attempts=2)` 语义一致。

备选方案是保留 `continue` 但增加重试计数器。该方案仍需区分「读取重试」与「通货循环」两条路径，控制流更复杂，且容易遗漏新增失败分支，因此采用独立函数。

## Risks / Trade-offs

- [内容对比对多行物品文本的字节差异敏感] → 对比使用原始剪贴板字符串；同一物品连续两次复制内容一致（不会误判成功），不同物品必然不同。
- [重试一次增加失败停止时间] → 复用现有等待窗口，最多一次额外等待；停止快捷键与前台门禁可随时中断。
- [`stash_item` 依赖剪贴板变空语义] → 双条件下空内容仍判定失败，语义不变；相关 `bagAutoStash`、`mapRuntimeTemplate` 测试用于回归确认。
- [地图模板共享改动引入回归] → 修改以最小方式同步两个模板的相同函数，运行全量 `npm test` 验证。

## Migration Plan

1. 先添加失败复现测试：旧剪贴板复制、序列号变内容未变、装备首次解析失败只重试读取。
2. 修改两个模板的 `clipboard_changed` 与 `read_clipboard_to_file` 验证逻辑。
3. 修改 `src/utils/python.js` 生成 `read_current_item` 并替换 `craft_affixes` 循环与增幅读取。
4. 运行定向测试（craftingParseSynchronization、adaptiveTiming、mapRuntimeTemplate、bagAutoStash、augmentationCrafting、chartRolling）与全量 `npm test`。
5. 回滚可整体撤销模板验证与生成逻辑改动；不迁移持久数据或用户预设。
