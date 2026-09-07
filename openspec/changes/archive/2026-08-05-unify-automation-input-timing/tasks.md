## 1. 统一内部时序常量

- [x] 1.1 在 `bag_auto_stash_template.py` 定义五个内部常量，删除 `INPUT_EVENT_DELAY_SECONDS` 与 `action_delay`
- [x] 1.2 在 `stash_pickup_template.py` 定义五个内部常量，替换 `INPUT_EVENT_DELAY_SECONDS`
- [x] 1.3 在 `chaos_recipe_pick_template.py` 定义五个内部常量并接入 `InputController`
- [x] 1.4 在 `map_rolling_template.py` 定义五个内部常量
- [x] 1.5 在 `crafting_template.py` 定义五个内部常量

## 2. 标准输入时序实现

- [x] 2.1 背包 `_send_copy` 与 `ctrl_click` 改用标准 Ctrl+C / Ctrl+点击序列，剪贴板窗口 ≥250ms
- [x] 2.2 仓库取件 `ctrl_click` 改用标准 Ctrl+点击序列
- [x] 2.3 混沌配方取件 `copy_item` 与 `ctrl_click` 改用标准序列，剪贴板窗口 ≥250ms
- [x] 2.4 地图洗练 `send_copy_command` 与 `stash_item` 改用标准序列并保留 0.2s 存仓等待
- [x] 2.5 制作 `send_copy_command` 改用标准序列，`click_mouse` 改为 press→hold→release + 固定释放等待
- [x] 2.6 地图洗练 `click_mouse` 同步改为 press→hold→release + 固定释放等待

## 3. 设置提示与清理

- [x] 3.1 更新 SettingsView 中“自动操作等待”的提示文案，说明其控制悬停稳定
- [x] 3.2 复查五个脚本，删除被替换的旧常量与无用代码

## 4. 测试

- [x] 4.1 更新 `test/bagAutoStash.test.js`（延迟语义断言 + 假时钟时序测试）
- [x] 4.2 更新 `test/operationDelay.test.js`（悬停为主、剪贴板 250ms、点击固定内部等待）
- [x] 4.3 更新 `test/stashPickup.test.js` 与 `test/chaosRecipeAutomation.test.js`
- [x] 4.4 新增 `test/inputTiming.test.js` 断言五脚本常量一致与 Ctrl 释放顺序

## 5. 验证

- [x] 5.1 运行 `npm test` 全部通过
- [x] 5.2 在开发版生成并运行相关脚本的冒烟检查（Python 导入与函数级测试）
