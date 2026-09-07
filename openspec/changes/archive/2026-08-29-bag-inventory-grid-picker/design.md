# 设计：背包设置改为拖拽网格框选定位

## Context

海图区/碎片仓库已具备完整链路：主进程 `pickScreenRegion(options)` 捕获干净屏幕 → 打开跨显示器透明选区层 → `CoordinatePickerView.vue` 按 `context.purpose` 在拖动矩形内渲染实时等分网格并显示提示 → 确认后 `submitScreenPickerRegion` 完成 DIP→物理像素换算、最小尺寸校验与截图裁剪，返回 `selectedRegion` 等元数据。目前 `pickScreenRegion` 只能由主进程各 IPC 模块调用（puzzle 传 `purpose`/`minimumSize`，其余不传），渲染端没有通用入口。

背包配置结构 `inventory.startPos`（首格中心物理像素）+ `inventory.slotSize`（单格宽高）由 `SettingsView.handleInventoryChange` → `updateBagRuntimeConfig` 保存（含校验与 settingsStore/localStorage 持久化），下游背包自动入库、地图制作按 `inventory-grid-coordinate` 统一公式消费。

## Goals / Non-Goals

**Goals:**

- 背包定位获得与海图区一致的"拖拽框选 + 实时 12×5 等分网格"体验
- 选区确认后自动换算并回填 `startPos`/`slotSize`，配置结构与下游公式零改动
- 移除首格/单格宽高手工输入（用户已确认），配置状态以只读展示
- 渲染端获得可复用的通用区域选取 IPC

**Non-Goals:**

- 额外背包（负列）不纳入框选，继续由现有负列公式从原生首格推导
- 不做 puzzle 式选区截图预览与网格置信度分析（设置页无需，重新框选成本极低）
- 不改 `bagConfig` 校验规则与自动化脚本

## Decisions

1. **复用 `pickScreenRegion` + 新 purpose `bag-inventory`，不新建选区组件**。`CoordinatePickerView` 的网格映射（现硬编码 puzzle-atlas/puzzle-inventory）改为查表扩展一项 `{ columns: 12, rows: 5 }`，标题与提示文案各加一档。替代方案（独立背包选区窗口）会复制选区会话生命周期管理，违背互斥单会话约束。

2. **在 `electron/modules/ipc/window.js` 注册通用 `screen-picker-region` IPC 透传 options**，preload 与 `src/api/electron.js` 各加一行封装。替代方案（模仿 junfeng/chaosRecipe 在 bag IPC 模块再包一层）会让每个调用方重复样板；window.js 已有 `screen-picker-context`/point 通道先例，模式一致。该通道只影响选区层 UI 提示与最小尺寸校验，不产生键鼠输入、不写文件。

3. **换算用纯函数 `deriveInventoryGridFromRegion(region)` 放入 `src/utils/inventorySettings.js`**。为避免 bagConfig ↔ inventorySettings 循环引用，`INVENTORY_LAYOUT`（nativeColumns: 12, rows: 5）常量移入 `inventorySettings.js` 并由 `bagConfig.js` 再导出，`BagView.vue` 等现有导入路径不变。计算：`slotSize = { w: Math.round((right-left)/12), h: Math.round((bottom-top)/5) }`，`startPos = { x: left + Math.round(w/2), y: top + Math.round(h/2) }`。放 util 而非内联组件：与该文件现有职责一致且可被 node --test 直接覆盖。

4. **保存链路复用 `handleInventoryChange`**：框选成功后写 `inventory.value` 再调用现有函数，自动获得 `updateBagRuntimeConfig` 的校验（背包模块启用时）与持久化；新增派生函数返回无效值时直接以 `ElMessage.error` 提示重新框选。

5. **移除设置页首格取点按钮与全部手工输入**（含 `handlePickCoordinate('inventory')` 分支），区块改为"框选背包网格"按钮 + 只读展示当前 `startPos`/`slotSize`（未配置时显示"尚未框选"）。通货坐标、物品位置及"连续空格判空"保持不变。

6. **背包框选 `minimumSize` 取 `{ width: 240, height: 100 }`**（约单格 ≥20×20 物理像素），沿用现有"选区过小拒绝确认"机制，无需新增校验路径。

## Risks / Trade-offs

- [框选偏差无法手工微调] → 只读展示换算结果让用户立即核对；重新框选成本仅数秒；此为用户明确接受的取舍
- [取整带来 ±1~2px 漂移] → 游戏单格约 80~100 物理像素，点击容差远大于漂移；偏差明显时用户可重新框选
- [通用 region IPC 扩大渲染端可发起的选取范围] → 仅打开选区层（与现有 `capture-bag-template` 等入口同级），无自动化输入与文件写入，风险不高于现状
- [12/5 网格数与 `INVENTORY_LAYOUT` 漂移] → 换算与网格覆盖统一从该常量取值，单点维护
