## Purpose

为剧情通关流程提供可跨页面持续运行、可感知游戏前后台状态并保留本地完成记录的可靠计时能力。

## ADDED Requirements

### Requirement: Control a persistent story run timer
系统 SHALL 提供独立于页面生命周期的剧情流程计时器，支持开始、停止、继续和重置，并 MUST 以时间戳累计真实经过时间。

#### Scenario: Start and pause a run
- **WHEN** 用户开始计时后再次触发同一个启停操作
- **THEN** 系统停止增加用时并保留当前累计值，后续继续时累计同一次流程

#### Scenario: Restore after application restart
- **WHEN** 应用关闭或异常退出时存在未重置计时
- **THEN** 下次启动恢复退出前已保存用时为暂停状态且不计算离线时长

### Requirement: Bind a run to its starting story preset
系统 MUST 在一次流程首次开始时记录当前剧情预设标识和名称，并在重置前保持该归属不变。

#### Scenario: Switch preset during a run
- **WHEN** 用户在未重置计时的情况下切换剧情预设
- **THEN** 计时继续且最终历史记录仍使用首次开始时的预设名称

### Requirement: Store bounded timer history
系统 SHALL 在重置非零计时时保存剧情预设名、完成时间和总用时，最多保留最近 100 条，并 SHALL 仅提供带确认的逐条删除。

#### Scenario: Reset a non-zero timer
- **WHEN** 用户重置具有累计用时的计时
- **THEN** 系统新增一条完成记录、清零当前计时并保留不超过 100 条最新记录

#### Scenario: Reset a zero timer
- **WHEN** 用户重置尚无累计用时的计时
- **THEN** 系统保持空计时且不创建历史记录

#### Scenario: Delete history
- **WHEN** 用户确认删除一条历史记录
- **THEN** 系统仅删除该条记录且不提供一键清空或批量删除操作

### Requirement: Respect game background pause policy
系统 SHALL 提供默认开启的“游戏后台停止计时”设置；开启后，后台状态 MUST 自动暂停正在运行的计时。页面按钮在后台仍可触发开始或继续意图，但 MUST 等待游戏恢复前台后才实际累计时间。

#### Scenario: Lose and regain game foreground
- **WHEN** 运行中的计时因游戏失去前台而自动暂停并随后恢复游戏前台
- **THEN** 系统自动继续该计时

#### Scenario: Preserve an explicit pause
- **WHEN** 计时因手动停止、模块关闭或应用重启而暂停
- **THEN** 游戏恢复前台时系统不得自动继续

#### Scenario: Attempt to start from the page in background
- **WHEN** 后台停止已开启且用户在游戏后台点击页面开始或继续按钮
- **THEN** 系统记录待开始或继续意图、提示切换到游戏前台，并在游戏恢复前台后自动开始累计时间

#### Scenario: Stop from the page in background
- **WHEN** 后台停止已开启且页面按钮当前表示停止
- **THEN** 用户仍可点击按钮停止本次运行或取消待开始意图

#### Scenario: Foreground detection unavailable
- **WHEN** 前台监视器不可用且后台停止已开启
- **THEN** 系统退化为手动启停、显示警告且不中断当前计时
