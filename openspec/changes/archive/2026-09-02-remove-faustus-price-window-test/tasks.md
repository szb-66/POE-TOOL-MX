## 1. 移除前端入口与门禁

- [x] 1.1 从浮士德页面删除价格窗口识别测试按钮、识别结果和开始阻止提示，保留配置与网格校准校验。
- [x] 1.2 从浮士德 store 删除 `recognition` 状态、`testPriceWindow` 操作和 `PRICE_RECOGNITION_REQUIRED` 门禁，验证有效配置与网格可直接启动。

## 2. 移除 Electron 测试通道

- [x] 2.1 删除 renderer Electron API 和 preload 暴露的价格窗口测试方法。
- [x] 2.2 删除 `faustus-price-window-test` IPC 处理器及专用请求规范化函数，并保持其余浮士德 IPC sender 校验不变。
- [x] 2.3 从主进程 manager 删除价格识别校准键、启动断言、一次性测试流程及无其他调用者的结果浮层/等待辅助代码。

## 3. 移除 Python 测试模式

- [x] 3.1 删除首个物品查找与只读价格窗口测试函数、`price-window-test` CLI 选项和事件分支。
- [x] 3.2 复查正式 `run` 模式，确认逐件价格/通货识别、锁定物品跳过、网格复检和全局安全终止逻辑未被删除。

## 4. 更新契约与验证

- [x] 4.1 更新浮士德 UI/store 测试，断言测试入口与门禁已移除，且网格校准后可直接开始。
- [x] 4.2 更新 Electron 与 Python 契约测试，断言已移除的 API/IPC/运行模式不再暴露，主进程无测试令牌也能启动。
- [x] 4.3 运行全部浮士德相关测试、Vite 开发构建、项目全量测试、引用搜索、差异检查和 `openspec validate remove-faustus-price-window-test --strict`；不执行打包。
