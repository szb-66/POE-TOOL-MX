# Tasks: 实现背包自动入库功能

## 1. 修改IPC处理器使用模板文件

**目标**：修改 `electron/modules/ipc/bag.js`，使用 `bag_auto_stash_template.py` 模板文件而不是内联生成脚本

**步骤**：
- [x] 修正 `bag_auto_stash_template.py` 中的循环顺序（第454-464行）
  - 将 `for row in range(rows): for col in range(cols):` 改为 `for col in range(cols): for row in range(rows):`
  - 修正格子索引计算：`slot_index = col * rows + row + 1`
  - 确保处理顺序为：第1列（1-5）、第2列（6-10）...第12列（56-60）
- [x] 移除 `generateDetectionScript()` 和 `generateStashScript()` 函数
- [x] 修改 `start-bag-detection` 处理器，使用模板文件并通过命令行参数传递配置
- [x] 修改 `start-bag-stash` 处理器，使用模板文件并传递背包配置
- [x] 从 settingsStore 读取背包参数（startPos, slotSize）
- [x] 确保配置正确序列化为JSON并传递给Python脚本

**验证**：
- 启动检测时，Python脚本能正确加载模板文件
- 配置参数能正确传递到Python脚本
- 检测和入库功能正常工作

**依赖**：无

---

## 2. 添加前端API封装

**目标**：在 `src/api/electron.js` 中添加 `bag` 模块的完整API封装

**步骤**：
- [x] 添加 `bag.startDetection(config)` - 启动检测
- [x] 添加 `bag.stopDetection()` - 停止检测
- [x] 添加 `bag.startStash(config)` - 启动入库
- [x] 添加 `bag.stopStash()` - 停止入库
- [x] 添加 `bag.uploadTemplate(path, type)` - 上传模板
- [x] 添加事件监听器：
  - `events.onBagDetectionMatch(callback)` - 检测匹配结果
  - `events.onBagStashProgress(callback)` - 入库进度
  - `events.onBagStashCompleted(callback)` - 入库完成
  - `events.onBagStashStopped(callback)` - 入库停止
- [x] 添加 mock API 用于非Electron环境

**验证**：
- API调用能正确触发IPC通信
- 事件监听器能正确接收消息
- 在浏览器环境下不会报错

**依赖**：任务1

---

## 3. 实现前端检测逻辑

**目标**：在 `BagView.vue` 中实现检测状态管理和显示

**步骤**：
- [x] 修改 `handleModuleToggle` 使用新的API
- [x] 添加检测匹配事件监听器
- [x] 根据匹配结果更新 `detectionStatus`
- [x] 在 `bagStore` 中添加 `isMatched` 状态
- [x] 从 `settingsStore` 读取背包参数并传递给检测配置

**验证**：
- 启用模块后，检测状态正确显示
- 匹配成功时，状态显示"匹配成功"
- 匹配失败时，状态显示"等待匹配"
- 关闭模块后，检测停止

**依赖**：任务2

---

## 4. 实现一键入库按钮

**目标**：在 `BagView.vue` 中添加"开始入库"按钮和入库逻辑

**步骤**：
- [x] 在UI中添加"开始入库"按钮
- [x] 按钮仅在 `moduleEnabled && isMatched` 时显示（使用 `v-if`）
- [x] 实现 `handleStartStash` 方法：
  - 从 settingsStore 读取背包参数（startPos, slotSize）
  - 调用 `electronApi.bag.startStash(config)`
  - 更新入库状态
- [x] 添加入库进度监听器
- [x] 添加入库完成监听器
- [x] 添加"停止入库"功能
- [x] 确保入库顺序为从左到右、每列从上到下（12列×5行）

**验证**：
- 匹配成功时，按钮显示并可点击
- 点击按钮后，入库开始
- 不需要显示进度条，按钮文案变为入库中
- 完成后显示成功提示
- 可以中途停止入库

**依赖**：任务3

---

## 5. 完善状态管理

**目标**：在 `bagStore` 中添加完整的状态管理

**步骤**：
- [x] 添加 `isMatched` 状态（检测是否匹配成功）
- [x] 添加 `setMatchedStatus(status)` 方法
- [x] 确保 `isStashing` 和 `stashProgress` 正确更新
- [x] 添加错误状态管理
- [x] 添加状态重置方法

**验证**：
- 状态变化能正确反映到UI
- 多次启动/停止不会导致状态混乱
- 错误状态能正确显示

**依赖**：任务2

---

## 6. 添加Electron预加载脚本

**目标**：在 `electron/preload.js` 中添加背包相关的IPC通道

**步骤**：
- [x] 添加 `startBagDetection` IPC调用
- [x] 添加 `stopBagDetection` IPC调用
- [x] 添加 `startBagStash` IPC调用
- [x] 添加 `stopBagStash` IPC调用
- [x] 添加 `uploadBagTemplate` IPC调用
- [x] 添加事件监听通道：
  - `bag-detection-match`
  - `bag-stash-progress`
  - `bag-stash-completed`
  - `bag-stash-stopped`

**验证**：
- IPC通道正确注册
- 前端能通过 window.electronAPI 调用
- 事件能正确传递到前端

**依赖**：任务1

---

## 7. 集成测试

**目标**：端到端测试完整功能

**步骤**：
- [ ] 测试模板上传功能
- [ ] 测试匹配区域配置
- [ ] 测试检测启动和停止
- [ ] 测试匹配成功和失败场景
- [ ] 测试入库功能（完整60格）
- [ ] 测试进度显示
- [ ] 测试中途停止
- [ ] 测试配置保存和加载
- [ ] 测试错误处理（Python未安装、依赖缺失等）

**验证**：
- 所有功能正常工作
- 无明显bug
- 错误提示清晰

**依赖**：任务1-6

---

## 8. 文档更新

**目标**：更新相关文档

**步骤**：
- [ ] 更新 `openspec/project.md` 中的背包功能描述（如需要）
- [ ] 添加用户使用说明（如需要）
- [ ] 更新API文档（如需要）

**验证**：
- 文档准确反映当前实现

**依赖**：任务7

---

## 任务依赖关系

```
任务1 (IPC处理器)
  ↓
任务2 (前端API) ← 任务6 (预加载脚本)
  ↓
任务3 (检测逻辑) ← 任务5 (状态管理)
  ↓
任务4 (入库按钮)
  ↓
任务7 (集成测试)
  ↓
任务8 (文档)
```

## 预估工作量

- 任务1: 2小时
- 任务2: 1小时
- 任务3: 1.5小时
- 任务4: 2小时
- 任务5: 1小时
- 任务6: 1小时
- 任务7: 2小时
- 任务8: 0.5小时

**总计**: 约11小时


