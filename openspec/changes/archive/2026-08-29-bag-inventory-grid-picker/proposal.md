# 变更提案：背包设置改为拖拽网格框选定位

## Why

设置页"自动操作"中的背包定位目前要求用户手填"首格位置"坐标和"单格宽高"，再由系统按 12×5 网格推算整个背包。这对普通用户门槛过高：既要理解"首格中心"概念，又要手动量取格子间距。而海图区/碎片仓库已有成熟的"拖拽框选 + 实时等分网格"定位体验，背包应直接复用同一交互。

## What Changes

- 设置页背包设置新增"框选背包网格"入口：打开跨显示器区域选区层，拖动矩形内实时显示 12 列 × 5 行等分网格，并提示"贴近背包网格外边框，包含全部 60 格"。
- 确认选区后由选区矩形自动换算并保存现有配置：
  - `slotSize = { w: round((right-left)/12), h: round((bottom-top)/5) }`
  - `startPos = 首格中心 (left + w/2, top + h/2)`
  - 走现有 `handleInventoryChange` → `updateBagRuntimeConfig` 保存链路。
- **BREAKING（设置页交互）**：移除背包设置中的"首格位置"点击取点按钮与手动输入框、"单格宽高"手动输入框；背包网格只允许通过框选配置，配置后以只读形式展示当前值（未配置时提示"尚未框选"）。通货坐标与物品位置的取点不受影响。
- 额外背包（负列）推导公式不变，框选范围仅覆盖原生 12×5。
- 选区层新增渲染端可用的通用区域选取 IPC（现有 `pickScreenRegion` 仅主进程模块可调用）。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `screen-region-template-picker`：新增"背包网格区域选取"要求——为背包提供带 12×5 实时等分网格的区域框选体验，确认后换算首格中心与单格宽高并回填设置。
- `screen-coordinate-picker`：修改"设置点位点击选取"要求——背包首格不再提供点击取点入口与手工输入，改为区域框选；通货坐标与物品位置保持原有取点与手工输入能力。

## Impact

- **Electron 主进程**：`electron/modules/ipc/window.js` 注册通用 `screen-picker-region` IPC（透传 `purpose`/`minimumSize`）；`electron/preload.cjs` 暴露 `pickScreenRegion`。
- **渲染层**：`src/api/electron.js` 增加封装；`src/domains/settings/CoordinatePickerView.vue` 增加 `bag-inventory` purpose 的 12×5 网格覆盖与提示文案；`src/domains/settings/SettingsView.vue` 重构背包设置区块。
- **配置结构零改动**：`inventory.startPos` / `inventory.slotSize` 语义不变（首格中心 + 单格宽高），下游背包自动入库、地图制作、混沌配方脚本及 `inventory-grid-coordinate` 公式不受影响。
- **测试**：`test/settingsTabs.test.js` 需更新（原断言首格位置/单格宽高说明标签）；新增换算函数单元测试。
