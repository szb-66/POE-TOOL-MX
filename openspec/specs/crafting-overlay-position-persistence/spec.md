# crafting-overlay-position-persistence Specification

## Purpose

让物品制作悬浮窗在重新创建或应用重启后恢复用户最后移动的位置，同时在显示器布局变化或状态损坏时保证固定尺寸窗口完整可见。

## Requirements

### Requirement: Persist the crafting overlay position
系统 SHALL 在用户移动物品制作悬浮窗后持久化其位置，并在悬浮窗重新创建或应用重启时恢复最后一次有效位置。

#### Scenario: Recreate the overlay after moving it
- **WHEN** 用户移动物品制作悬浮窗后关闭并重新创建该悬浮窗
- **THEN** 系统 SHALL 在最后保存的位置创建悬浮窗

#### Scenario: Restart the application after moving the overlay
- **WHEN** 用户移动物品制作悬浮窗后重启应用并再次打开该悬浮窗
- **THEN** 系统 SHALL 从当前用户的应用数据中恢复最后保存的位置

### Requirement: Keep restored bounds visible and fixed-size
系统 MUST 以固定规范尺寸恢复物品制作悬浮窗；仅当保存位置能使完整窗口位于任一当前显示器工作区内时才可恢复，否则 SHALL 在主显示器工作区右上角使用默认位置。

#### Scenario: Restore a valid secondary-display position
- **WHEN** 保存位置使完整悬浮窗位于当前副显示器工作区内
- **THEN** 系统 SHALL 恢复该位置并保持固定宽高

#### Scenario: Saved display is no longer available
- **WHEN** 保存位置不能使完整悬浮窗位于任何当前显示器工作区内
- **THEN** 系统 SHALL 在主显示器工作区右上角显示完整的固定尺寸悬浮窗

#### Scenario: Saved position data is invalid
- **WHEN** 保存的位置缺失、损坏或包含非有限坐标
- **THEN** 系统 SHALL 忽略该位置并使用主显示器工作区内的默认位置
