# crafting-script-startup Specification

## Purpose
TBD - created by archiving change fix-crafting-start-execution. Update Purpose after archive.
## Requirements
### Requirement: 制作脚本可靠启动
系统 SHALL 在物品制作或地图制作被触发时，完成配置校验、脚本生成和后台进程启动，并且仅在后台进程已确认成功启动后报告成功。系统 MUST 在共享进程状态中保存对应运行类型，并在进程完整生命周期内同步 renderer 状态。

#### Scenario: 启动物品制作
- **WHEN** 用户通过页面或已注册快捷键触发物品制作且配置有效、运行环境满足要求
- **THEN** 系统生成物品制作脚本并启动对应 Python 进程
- **AND** 返回真实进程标识、`items` 运行类型并将前端状态同步为运行中

#### Scenario: 启动地图制作
- **WHEN** 用户通过页面或已注册快捷键触发地图制作且配置有效、运行环境满足要求
- **THEN** 系统生成地图制作脚本并启动对应 Python 进程
- **AND** 返回真实进程标识、`map` 运行类型并将前端状态同步为运行中

#### Scenario: 启动阶段立即失败
- **WHEN** Python 解释器、必需模块、脚本文件或进程创建在启动阶段失败
- **THEN** 系统返回包含根因的失败结果
- **AND** 系统停止文件监听并清除进程引用与运行类型
- **AND** 前端不得进入运行中状态

#### Scenario: 查询当前状态
- **WHEN** renderer 在应用加载或手动刷新时查询共享脚本状态
- **THEN** 系统返回运行状态、真实进程标识以及 `items`、`map` 或空运行类型

#### Scenario: 进程结束
- **WHEN** 共享脚本被手动停止、正常退出或异常退出
- **THEN** 主进程清除进程引用和运行类型
- **AND** 向主窗口发布包含退出状态、运行类型、进程标识、退出码和可用错误信息的结构化事件
- **AND** 前端停止显示对应模块为运行中

### Requirement: 共享启动入口行为一致
系统 MUST 让看板操作、模块页面操作与全局快捷键通过同一个物品制作或地图制作启动函数执行，避免入口之间出现配置、状态或错误处理差异。

#### Scenario: 快捷键分发制作动作
- **WHEN** Electron 发送物品开始或地图开始快捷键事件
- **THEN** 系统分别调用物品制作或地图制作的公共启动函数
- **AND** 每次触发只发起一次后台启动请求

#### Scenario: 看板分发制作动作
- **WHEN** 用户在看板点击物品或地图启动按钮
- **THEN** 系统调用对应公共启动函数
- **AND** 执行与快捷键入口相同的配置校验、启动和状态同步

### Requirement: 制作脚本运行环境校验
系统 SHALL 在写入并启动制作脚本前确认所选 Python 解释器能够导入制作脚本需要的模块。

#### Scenario: 仅存在不兼容的 Python
- **WHEN** 系统能找到 Python 可执行文件但该解释器缺少 `pynput` 或 `pyperclip`
- **THEN** 系统拒绝启动并明确报告缺失制作依赖
- **AND** 不创建虚假的运行中状态
