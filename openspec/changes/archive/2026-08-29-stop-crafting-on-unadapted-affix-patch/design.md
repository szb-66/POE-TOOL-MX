# Design: 检测未适配词缀补丁时停止装备制作并提示

## Context

装备制作链路：Python 脚本复制物品文本 → `fileWatcher` 触发 `parseItemInfo`（`electron/modules/item/parser.js`）→ `matchAffixes`（`electron/modules/item/matcher.js`）→ 结果写回 `item_info_result.json` → Python 读取 `affixMatch` 决定循环继续/停止。词缀补丁更新导致词缀头措辞变化时，`parser.js` 的 `{...}` 头部分支识别不出任何结构化词缀，`affixMatch` 恒为 false，循环消耗通货直到 1000 次上限。

现有异常停止管道已经完备：模板内 `fail_item_runtime(reason, code)` 设置 `fatal_error_reason`、停止 `is_running`、播放错误音并输出 `crafting-runtime-stopped` EVENT；`electron/modules/ipc/python.js` 将其转发为主窗口错误状态，`OverlayView.vue` 将 reason 展示为浮层停止原因。本变更无需新增任何 UI。

## Goals / Non-Goals

**Goals:**

- 在消耗制作通货之前（启动后首次物品读取）检测未适配格式并停止。
- 提示文案可操作：说明词缀无法识别、已停止、建议更新软件或反馈适配。
- 检测逻辑收敛在解析器单点，脚本侧在共享读取入口单点拦截。

**Non-Goals:**

- 不改动地图洗练模板（`map_rolling_template.py`）：地图匹配用子串包含且有 `explicitMods` 文本回退，未适配时仍可能命中。
- 不尝试猜测或兼容未知的新补丁格式；适配新格式仍需更新解析器。
- 不新增独立的弹窗/通知 UI，完全复用既有停止提示。

## Decisions

### 1. 解析器双信号检测，输出单一标记 `affixFormatUnsupported`

`parseItemInfo` 循环中记录是否出现 `{...}` 结构化词缀头行（`sawAffixHeader`）。解析结束后：

- 信号 A：`sawAffixHeader && modifiers 为空 && detailedMods 为空` → 有词缀头但全部未识别，即补丁措辞未适配（现实场景：补丁更新保留 `{...}` 结构但改措辞，如"前缀属性"→"前缀词缀"的历史变化）。
- 信号 B：稀有度为魔法/稀有、非未鉴定，且 `modifiers`/`detailedMods`/`explicitMods` 全为空 → 任何词缀都没识别出来。

任一信号为真则 `itemInfo.affixFormatUnsupported = true`。选解析器单点而非匹配器/脚本判断：检测的是"文本格式"属性，与制作配置无关，且查价等其他消费方未来也可复用。

备选被否决方案：在匹配器里比较"目标词缀命中率恒为 0"——误报高（低概率词缀本来就难命中），且依赖制作配置。

### 2. 脚本侧在 `read_current_item`（模板共享读取入口）拦截，而非各调用点

`read_current_item` 是初始读取、制作循环、增幅补读、古灵循环的唯一读取路径，在其成功返回前检查标记，一处拦截覆盖全部调用方（根因位置而非症状位置）。门控条件用模板占位符内联：`({{ENABLE_AFFIX}} or {{ENABLE_ELDRITCH}})`。

检测到标记时：调用 `fail_item_runtime("检测到未适配的词缀补丁格式，无法识别词缀，已停止制作。请更新软件或反馈适配", "AFFIX_PATCH_UNSUPPORTED")`，随后返回 `{"error": ...}` 保持函数契约（调用方都按 `result.get("error")` 处理，初始读取路径的 `fail_item_preparation` 会包裹原因，关键文案仍完整可见）。

备选被否决方案：在 `craft_affixes` 循环体内检查——遗漏增幅补读与古灵路径，且初始读取（消耗通货前）依赖 `checkInitialItem` 开关。

### 3. 门控放行仅插槽制作

插槽、连接、颜色计数解析与词缀结构无关，普通物品无词缀属正常。仅插槽启用时门控表达式为 False，拦截为空操作。词缀匹配或古灵隐式任一启用即启用拦截——古灵隐式匹配同样依赖词缀头识别（焚界者/灭界者基底词缀头），未适配时同样永远无法命中。

### 4. 拦截时机与通货消耗

启动流程为：仓库页选择 → 通货预检 → `prepare_item_for_crafting`（首次读取，不耗制作通货）→ 制作循环。拦截在 `read_current_item` 内 → 首次读取即触发，零通货损失。`checkInitialItem=false` 的用户配置下首次读取仍发生（读取本身不耗通货），拦截同样生效，无通货损失。

## Risks / Trade-offs

- [罕见误报：受支持格式下词缀头被识别但正文全部被过滤，导致 modifiers 为空触发信号 A] → 信号 A 要求 modifiers 与 detailedMods 同时为空，受支持格式的前后缀词缀必有至少一条正文行存活；若未来出现，通过测试样例修正过滤规则而非放宽检测。
- [全新补丁若完全抛弃 `{...}` 结构且稀有度头也变化，信号 A/B 均可能不触发] → 接受：无法为未知格式设计可靠检测，此时行为与现状一致（跑满上限），文案与文档引导用户反馈。
- [结果 JSON 新增字段流入浮层] → `OverlayContent.vue` 按字段渲染，多余字段无副作用。

## Migration Plan

纯增量改动，无数据迁移。回滚即还原三个文件与测试。

## Open Questions

（无）
