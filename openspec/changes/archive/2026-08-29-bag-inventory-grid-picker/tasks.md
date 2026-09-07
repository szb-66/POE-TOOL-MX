# 任务清单：背包设置改为拖拽网格框选定位

## 1. 通用区域选取 IPC

- [x] 1.1 `electron/modules/ipc/window.js` 注册 `screen-picker-region` handler，透传 options 调用 `window.pickScreenRegion(options)`
- [x] 1.2 `electron/preload.cjs` 暴露 `pickScreenRegion: (options) => ipcRenderer.invoke('screen-picker-region', options)`
- [x] 1.3 `src/api/electron.js` 增加 `window.pickScreenRegion` 封装与浏览器环境回退（canceled 结果）

## 2. 选区层背包网格支持

- [x] 2.1 `src/domains/settings/CoordinatePickerView.vue` 网格映射加入 `bag-inventory: { columns: 12, rows: 5 }`（列数/行数取自 `INVENTORY_LAYOUT` 或与本文件风格一致的映射表）
- [x] 2.2 选区层标题与提示增加背包档位：标题"框选完整的 12×5 背包"，提示"贴近背包网格外边框，从左上角拖到右下角，包含全部 60 格"

## 3. 换算函数与设置页改造

- [x] 3.1 `src/utils/inventorySettings.js` 新增纯函数 `deriveInventoryGridFromRegion(region)`：从 `bagConfig.js` 导入 `INVENTORY_LAYOUT`，按设计换算 `startPos`（首格中心）与 `slotSize`，单格宽高 ≤0 时返回 null
- [x] 3.2 `src/domains/settings/SettingsView.vue` 背包设置区块：移除"首格位置"取点按钮与输入框、"单格宽高"输入框及 `handlePickCoordinate('inventory')` 分支，新增"框选背包网格"按钮（purpose `bag-inventory`、`minimumSize { width: 240, height: 100 }`）
- [x] 3.3 框选成功后调用换算函数回填 `inventory.value` 并复用 `handleInventoryChange` 保存；换算无效或调用失败时 `ElMessage` 提示且不修改现有配置
- [x] 3.4 以只读形式展示当前 `startPos`/`slotSize`，未配置时显示"尚未框选"；清理不再使用的样式与导入

## 4. 测试与验证

- [x] 4.1 新增/扩展 node --test 单测：`deriveInventoryGridFromRegion` 正常换算、反向拖动规范化矩形（left<right/top<bottom）、单格宽高 ≤0 返回 null
- [x] 4.2 更新 `test/settingsTabs.test.js`：移除首格位置/单格宽高说明标签断言，断言框选入口与"尚未框选"只读展示存在
- [x] 4.3 运行受影响测试文件与 `npm test`；`npm run dev` 验证 SettingsView 与 CoordinatePickerView 的 Vite 转换
- [x] 4.4 `openspec validate bag-inventory-grid-picker --strict` 通过

