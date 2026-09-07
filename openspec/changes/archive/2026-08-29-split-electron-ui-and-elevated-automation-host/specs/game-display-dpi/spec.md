## MODIFIED Requirements

### Requirement: 运行时刷新与坐标语义
系统 MUST 在主界面启动后异步准备自动 DPI 状态，并在每次做装或洗图自动化开始前刷新 DPI，保持 Windows API 坐标为物理像素，并在 Windows 多显示器虚拟桌面中保留显示器标识、缩放倍率与负坐标。`game.dpi-probe` MUST 作为普通权限只读操作运行，启动期和自动化前 DPI 刷新 MUST NOT 单独启动 AutomationHost 或显示 UAC。

#### Scenario: 应用启动
- **WHEN** 主界面完成挂载且处于自动模式
- **THEN** 系统异步执行普通权限只读 DPI 检测，不阻塞其他初始化、不启动 Host 且不显示 UAC

#### Scenario: 自动化运行前
- **WHEN** 用户在自动模式下开始做装或地图洗练
- **THEN** 系统在提交固定输入操作前通过普通权限 DPI 探测重新检测并解析有效倍率

#### Scenario: Python 鼠标控制
- **WHEN** 固定输入脚本使用 Windows API 移动鼠标
- **THEN** 坐标不进行 DPI 乘除；仅 `pynput` 回退路径使用有效倍率换算

#### Scenario: 副屏位于主屏左侧或上方
- **WHEN** 游戏窗口位于带负原点的副显示器
- **THEN** 系统保留负物理坐标并使用该显示器的实际倍率进行校准和自动化

#### Scenario: 常见缩放倍率
- **WHEN** 游戏位于 100%、125%、150% 或 200% 缩放的显示器
- **THEN** 浮窗、区域选择和自动化坐标均引用同一显示器上下文且不重复缩放
