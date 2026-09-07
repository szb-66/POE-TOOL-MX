## 1. 高亮浮窗状态生命周期（overlay.js）

- [x] 1.1 `closed` 回调同步清空 `this.snapshot`，消除幽灵预览状态
- [x] 1.2 复用窗口前检查 `webContents.isCrashed()`，崩溃时销毁并走新建路径
- [x] 1.3 在创建、关闭、渲染进程崩溃节点输出 `[商城配方高亮]` 结构化诊断日志（不含账号、凭据、完整用户路径）

## 2. 预览创建失败可见（ipc/chaosRecipe.js）

- [x] 2.1 `chaos-recipe-control-preview` 检查 `overlay.create()` 返回值，为 false 时抛 `INVALID_REQUEST` 错误："无法定位仓库区域，请重新校准"

## 3. 启动失败关闭高亮（automation.js）

- [x] 3.1 `start()` 的 catch 中补 `this.overlay.close()`，与 `fail()` 语义一致

## 4. 测试与验证

- [x] 4.1 新建 `test/chaosRecipeOverlay.test.js`：VM 加载 overlay.js（假 BrowserWindow/screen），覆盖窗口销毁后 `getState()` 为 null 且可重新创建、崩溃窗口重建、区域非法 `create` 返回 false、日志不输出敏感信息
- [x] 4.2 扩展 automation 相关断言：`start()` 同步失败路径调用 `overlay.close()`
- [x] 4.3 运行 `node --test test/chaosRecipeOverlay.test.js test/chaosRecipeAutomation.test.js`，再运行 `npm test`
- [x] 4.4 运行 `openspec validate fix-chaos-recipe-preview-overlay --strict`
