# Spec: 背包自动入库功能

## ADDED Requirements

### Requirement: 背包自动入库核心功能

系统应提供完整的背包自动入库功能，包括模板匹配检测和自动入库操作。

#### Scenario: 用户启用背包检测

**Given** 用户已上传仓库标题和道具标题模板图片  
**And** 用户已配置匹配区域和阈值  
**When** 用户在背包页面启用"启用模块"开关  
**Then** 系统应启动Python检测进程  
**And** 检测状态应显示为"检测中"  
**And** 系统应每200ms检测一次屏幕匹配状态

#### Scenario: 检测到匹配成功

**Given** 背包检测已启用  
**And** Python检测进程正在运行  
**When** 仓库标题和道具标题都匹配成功（匹配度≥阈值）  
**Then** 系统应输出 "MATCH_SUCCESS" 到标准输出  
**And** 前端应接收到匹配成功事件  
**And** 检测状态应更新为"匹配成功"  
**And** "开始入库"按钮应变为可用状态

#### Scenario: 检测到匹配失败

**Given** 背包检测已启用  
**And** 之前的状态为"匹配成功"  
**When** 仓库标题或道具标题匹配失败（匹配度<阈值）  
**Then** 系统应输出 "MATCH_FAILED" 到标准输出  
**And** 前端应接收到匹配失败事件  
**And** 检测状态应更新为"等待匹配"  
**And** "开始入库"按钮应变为禁用状态

#### Scenario: 显示一键入库按钮

**Given** 背包检测已启用  
**When** 检测到匹配成功  
**Then** "开始入库"按钮应显示在页面上  
**And** 按钮应处于可点击状态

#### Scenario: 隐藏一键入库按钮

**Given** "开始入库"按钮已显示  
**When** 检测到匹配失败或用户停止检测  
**Then** "开始入库"按钮应从页面隐藏

#### Scenario: 用户开始一键入库

**Given** 背包检测匹配成功  
**And** "开始入库"按钮已显示  
**When** 用户点击"开始入库"按钮  
**Then** 系统应从设置中读取背包首格位置和格子尺寸  
**And** 系统应启动Python入库进程  
**And** 入库状态应显示为"进行中"  
**And** 应显示进度条（初始值0%）

#### Scenario: 按顺序处理背包格子

**Given** 入库进程正在运行  
**And** 背包为12列×5行布局  
**When** 系统处理背包物品  
**Then** 应按从左到右、每列从上到下的顺序处理  
**And** 处理顺序应为：第1列从上到下（格子1-5），第2列从上到下（格子6-10），依此类推，直到第12列（格子56-60）  
**And** 对每个格子执行Ctrl+左键操作  
**And** 每个格子处理后等待50ms再处理下一个

**示例布局（12列×5行）**：
```
列:  1   2   3   4  ...  12
行1: 1   6  11  16  ...  56
行2: 2   7  12  17  ...  57
行3: 3   8  13  18  ...  58
行4: 4   9  14  19  ...  59
行5: 5  10  15  20  ...  60
```
处理顺序：1→2→3→4→5→6→7→8→9→10→...→60

#### Scenario: 入库进度更新

**Given** 入库进程正在运行  
**When** Python脚本处理每个格子后  
**Then** 系统应输出 "PROGRESS:N" 到标准输出（N为0-100的整数）  
**And** 前端应接收到进度更新事件  
**And** 进度条应更新为对应百分比

#### Scenario: 入库完成

**Given** 入库进程正在运行  
**When** Python脚本处理完所有60个格子  
**Then** 系统应输出 "STASH_COMPLETED" 到标准输出  
**And** 前端应接收到入库完成事件  
**And** 应显示成功提示消息  
**And** 进度条应显示100%  
**And** 应播放完成提示音（如果系统支持）

#### Scenario: 用户停止检测

**Given** 背包检测已启用  
**When** 用户关闭"启用模块"开关  
**Then** 系统应终止Python检测进程（SIGTERM）  
**And** 如果2秒后进程仍未退出，应强制终止（SIGKILL）  
**And** 检测状态应重置为"模块未启用"  
**And** "开始入库"按钮应禁用

#### Scenario: 用户停止入库

**Given** 入库进程正在运行  
**When** 用户关闭"启用模块"开关或点击"停止入库"按钮  
**Then** 系统应终止Python入库进程（SIGTERM）  
**And** 如果2秒后进程仍未退出，应强制终止（SIGKILL）  
**And** 入库状态应重置  
**And** 进度条应隐藏

---

### Requirement: IPC处理器使用模板文件

IPC处理器应使用 `bag_auto_stash_template.py` 模板文件，而不是内联生成Python脚本。

#### Scenario: 启动检测时使用模板文件

**Given** 用户启用背包检测  
**When** IPC处理器处理 `start-bag-detection` 请求  
**Then** 系统应读取 `src/assets/scripts/bag_auto_stash_template.py` 文件  
**And** 系统应将配置序列化为JSON格式  
**And** 系统应通过 `--mode detect --config <json>` 参数启动Python脚本  
**And** 不应内联生成Python代码

#### Scenario: 启动入库时使用模板文件

**Given** 用户点击"开始入库"按钮  
**When** IPC处理器处理 `start-bag-stash` 请求  
**Then** 系统应读取 `src/assets/scripts/bag_auto_stash_template.py` 文件  
**And** 系统应从设置store读取背包参数（startPos, slotSize）  
**And** 系统应将完整配置序列化为JSON格式  
**And** 系统应通过 `--mode stash --config <json>` 参数启动Python脚本  
**And** 不应内联生成Python代码

---

### Requirement: 前端API封装

前端应提供统一的 `electronApi.bag` API，封装所有背包相关的IPC调用。

#### Scenario: 调用检测API

**Given** 前端需要启动背包检测  
**When** 调用 `electronApi.bag.startDetection(config)`  
**Then** 应触发 `start-bag-detection` IPC调用  
**And** 应返回 Promise，包含 `{ success, processId }` 或 `{ success: false, error }`

#### Scenario: 调用入库API

**Given** 前端需要启动入库  
**When** 调用 `electronApi.bag.startStash(config)`  
**Then** 应触发 `start-bag-stash` IPC调用  
**And** 应返回 Promise，包含 `{ success, processId }` 或 `{ success: false, error }`

#### Scenario: 监听检测事件

**Given** 前端需要监听检测匹配结果  
**When** 调用 `electronApi.events.onBagDetectionMatch(callback)`  
**Then** 应注册 `bag-detection-match` 事件监听器  
**And** 当检测状态变化时，应调用callback并传递 `{ matched: boolean }`

#### Scenario: 监听入库进度

**Given** 前端需要监听入库进度  
**When** 调用 `electronApi.events.onBagStashProgress(callback)`  
**Then** 应注册 `bag-stash-progress` 事件监听器  
**And** 当进度更新时，应调用callback并传递 `{ progress: number }`

---

### Requirement: 状态管理

背包store应管理检测和入库的所有状态。

#### Scenario: 管理匹配状态

**Given** 背包store已初始化  
**When** 调用 `setMatchedStatus(true)`  
**Then** `isMatched` 状态应更新为 `true`  
**And** 状态变化应触发UI更新

#### Scenario: 管理入库进度

**Given** 入库正在进行  
**When** 调用 `setStashingStatus(true, 50)`  
**Then** `isStashing` 应为 `true`  
**And** `stashProgress` 应为 `50`  
**And** 进度条应显示50%

#### Scenario: 重置状态

**Given** 用户停止检测或入库  
**When** 调用状态重置方法  
**Then** 所有运行状态应重置为初始值  
**And** UI应反映重置后的状态

---

### Requirement: 配置集成

系统应从全局设置中读取背包参数，并正确传递给Python脚本。

#### Scenario: 读取背包参数

**Given** 用户在设置中配置了背包首格位置和格子尺寸  
**When** 启动入库功能  
**Then** 系统应从 `settingsStore.inventory` 读取配置  
**And** 应包含 `startPos.x`, `startPos.y`, `slotSize.w`, `slotSize.h`  
**And** 应将这些参数传递给Python脚本

#### Scenario: 验证配置完整性

**Given** 用户启动入库功能  
**When** 背包参数未配置或无效  
**Then** 系统应显示警告消息"请先在设置中配置背包首格坐标"  
**And** 不应启动入库进程

---

### Requirement: 错误处理

系统应优雅处理各种错误情况。

#### Scenario: Python依赖缺失

**Given** 用户系统未安装opencv-python或mss  
**When** 启动检测或入库  
**Then** Python脚本应输出错误信息  
**And** 前端应显示错误提示  
**And** 应提示用户安装依赖包

#### Scenario: 模板文件不存在

**Given** 用户上传的模板文件已被删除  
**When** 启动检测  
**Then** Python脚本应输出错误信息  
**And** 前端应显示"模板文件不存在"错误  
**And** 应提示用户重新上传

#### Scenario: 进程启动失败

**Given** Python可执行文件未找到  
**When** 启动检测或入库  
**Then** IPC处理器应返回 `{ success: false, error: '未找到Python可执行文件' }`  
**And** 前端应显示错误提示

#### Scenario: 进程异常退出

**Given** Python进程正在运行  
**When** 进程因异常而退出  
**Then** 系统应监听 `close` 事件  
**And** 应通知前端进程已停止  
**And** 应清理进程引用
