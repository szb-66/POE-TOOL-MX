# Purpose

定义设置点位的跨显示器选取、取消清理以及 Windows 物理像素坐标契约。

## Requirements

### Requirement: 设置点位点击选取
系统 SHALL 为背包首格、每个通货坐标和物品位置提供点击取点入口，同时保留手工输入能力。

#### Scenario: 成功选取点位
- **WHEN** 用户点击某个点位的取点按钮并在取点层中单击目标位置
- **THEN** 系统将该位置的 Windows 物理屏幕像素坐标回填到对应字段
- **AND** 系统立即通过对应设置 store 方法保存坐标

#### Scenario: 不为尺寸提供取点
- **WHEN** 用户查看背包单格宽高、DPI、延迟或其他非点位设置
- **THEN** 系统不显示点位取点按钮

#### Scenario: 保留手工输入
- **WHEN** 用户直接修改点位的 X 或 Y 数值
- **THEN** 系统继续按现有设置保存流程保存该坐标

### Requirement: 跨显示器取点层
系统 MUST 在所有已连接显示器上提供置顶取点层，并将点击位置转换为 Windows 虚拟桌面的物理像素坐标。

#### Scenario: 在副显示器取点
- **WHEN** 用户在任意副显示器的取点层中单击
- **THEN** 系统按该显示器的 DPI 缩放转换并返回正确的全局物理坐标

#### Scenario: 选取负坐标
- **WHEN** 目标显示器位于主屏左侧或上方
- **THEN** 系统允许保存负 X 或负 Y 坐标
- **AND** 自动化脚本能够使用该坐标移动鼠标

#### Scenario: 混合 DPI 取点
- **WHEN** 多个显示器使用不同的 DPI 缩放比例
- **THEN** 系统基于实际点击所在显示器完成 DIP 到物理像素转换

### Requirement: 取点取消与资源清理
系统 MUST 允许取消取点，并保证每次取点请求只结算一次且不遗留遮挡窗口或事件监听器。

#### Scenario: 使用 Esc 取消
- **WHEN** 用户在取点过程中按下 Esc
- **THEN** 系统关闭全部取点窗口并保留原坐标值

#### Scenario: 取点窗口异常结束
- **WHEN** 任一取点窗口加载失败、被关闭或应用开始退出
- **THEN** 系统取消当前取点并清理全部关联窗口和监听器

#### Scenario: 重复发起取点
- **WHEN** 已存在未完成的取点请求时再次发起请求
- **THEN** 系统不创建第二组取点窗口，并返回当前请求或明确的忙碌结果

### Requirement: 统一物理坐标契约
系统 MUST 将设置中的所有点位解释为 Windows 物理屏幕像素，且 Windows API 鼠标路径不得重复应用 DPI 缩放。

#### Scenario: Windows API 使用坐标
- **WHEN** 物品、地图或背包自动化通过 Windows API 移动鼠标
- **THEN** 系统直接使用已保存的物理坐标

#### Scenario: pynput 回退
- **WHEN** Windows API 鼠标路径不可用而回退到 pynput
- **THEN** 系统仅在该适配边界执行 pynput 所需的 DPI 换算
