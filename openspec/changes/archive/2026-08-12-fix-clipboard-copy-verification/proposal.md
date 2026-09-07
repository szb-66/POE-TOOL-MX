## Why

自动存仓与君锋拾取共用 `bag_auto_stash_template.py` 的剪贴板复制确认，商城配方取件使用 `chaos_recipe_pick_template.py` 的复制函数——两者与已修复的装备/地图模板存在同样的缺陷：复制成功判定只凭剪贴板序列号变化（或仅凭文本非空），游戏复制失败时剪贴板残留的旧物品文本会被当作当前复制结果，导致误判格子状态、误报背包满或误报拾取结果。

## What Changes

- `bag_auto_stash_template.py` 的 `_copy_item_text_once`：复制成功要求粘贴内容实际变化（非空且不等于复制前内容）；剪贴板残留旧文本不再判定为成功；剪贴板变空（空格）且序列号确实变化时保持快速空格判定。
- 行为影响：自动存仓扫描、取件确认、君锋拾取在复制失败时不再误判物品状态。
- 商城配方取件（`chaos_recipe_pick_template.py`）经核实每次复制前先清空剪贴板，不存在残留旧文本路径，无需修改。

## Capabilities

### New Capabilities

- 无

### Modified Capabilities

- `shared-item-transfer-safety`: 物品文本复制确认要求剪贴板内容实际变化，残留旧文本不得当作当前复制结果

## Impact

- `src/assets/scripts/bag_auto_stash_template.py`：`_copy_item_text_once`
- `src/assets/scripts/junfeng_highlight_pickup.py`：复用 `InputController`，无需直接修改
- 测试：`test/bagAutoStash.test.js`、`test/junfengHighlight.test.js`、`test/chaosRecipeAutomation.test.js` 定向回归
- 无新依赖；不改变空格扫描速度、存仓时序与取件确认次数
