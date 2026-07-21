## Context

现有 `pickScreenCoordinate` 为每个显示器创建透明置顶窗口，将单击位置从窗口 DIP 坐标转换为 Windows 虚拟桌面物理像素。背包页面则独立上传仓库/背包标题图片并编辑四个区域坐标，因此模板可能来自不同分辨率或 DPI，搜索区域也可能小于模板或偏离实际标题。新方案需要横跨窗口管理、屏幕截图、文件保存、IPC、背包配置和 OpenCV 匹配，同时继续支持多显示器负坐标与旧配置。

## Goals / Non-Goals

**Goals:**

- 通过一次拖框同时生成干净模板图片、带容错边距的搜索区域和采集元数据。
- 在混合 DPI、多显示器和负坐标布局下保持 Windows 物理像素契约。
- 确保取消、截图失败或保存失败不会留下半套配置或遮挡窗口。
- 让背包页面以可视化框选为主要入口，同时保留旧上传和手工坐标作为高级回退。
- 在分辨率、DPI 或显示器发生变化时明确阻止使用不兼容的已采集模板。

**Non-Goals:**

- 不支持跨两个显示器拖出单个选区。
- 不实现 OCR、多尺度模板匹配或自动寻找标题。
- 不替换现有单点坐标选取行为。
- 不保证独占全屏下所有显卡驱动都能被 Electron 正确截图；失败时保留手工配置入口。

## Decisions

### 统一选取会话，保留 point 与 region 两种模式

窗口管理器将现有 `coordinatePickerSession` 泛化为单一 screen-picker 会话，同一时间只允许一个 point 或 region 请求。point 模式保持现有点击返回行为；region 模式在每个显示器窗口内处理 pointer down/move/up，实时绘制矩形，允许 Enter 或确认按钮提交、Esc 取消。拖动方向任意，结果统一规范化为 left/top/right/bottom；选区限制在起始显示器内且最小为 20×10 物理像素。

选择独立窗口而非在主窗口内绘制，是为了覆盖游戏所在的任意显示器并复用现有置顶、负坐标和异常清理逻辑。

### 先截取干净画面，再显示选区层

主进程使用 Electron `desktopCapturer` 在创建选区窗口前为每个显示器获取截图，并通过 screen source 的 display id 与 `screen.getAllDisplays()` 对应。截图请求使用显示器物理尺寸；若实际 thumbnail 尺寸不同，则记录比例并在裁剪前换算。

选区窗口只负责交互，最终模板始终从预先捕获的原始截图裁剪，不能从含半透明蒙层、提示框或边框的桌面重新截图。替代方案是选区完成后先关闭窗口再截图，但窗口消失和游戏画面更新存在竞态，会造成用户所见与保存内容不一致。

### 选区与搜索区域承担不同职责

用户拖框得到的物理矩形是模板范围，裁剪 PNG 尺寸必须严格等于 `right-left` × `bottom-top`。实际 `stashRegion`/`inventoryRegion` 是该矩形向四周扩展 12 个物理像素后、裁剪到所在显示器物理边界内的搜索区域。

不让搜索区域与模板完全相等，因为 OpenCV 在同尺寸输入上没有位移搜索空间，标题轻微移动就会失败。12px 为固定 v1 默认值，足以容纳小幅 UI 偏移且不会显著扩大误匹配范围。

### Bag IPC 负责受限目标保存与原子配置结果

窗口管理器的内部 `pickScreenRegion()` 返回物理矩形、PNG Buffer 和显示器元数据，不直接接受任意文件路径。背包 IPC 新增受限的 `capture-bag-template`，目标只允许 `stashTitle` 或 `inventoryTitle`，并将图片写入 userData/templates 下的固定文件。

文件先写入同目录临时文件，再原子替换目标 PNG；成功后返回：

```js
{
  path,
  region: { left, top, right, bottom },
  metadata: {
    displayId,
    scaleFactor,
    displayPhysicalSize: { width, height },
    templateSize: { width, height },
    selectedRegion: { left, top, right, bottom },
    capturedAt
  }
}
```

渲染进程只在完整成功响应后调用 store 的单一更新方法，同时写入图片路径、搜索区域和对应 metadata。取消或错误不修改任何旧值。

### 显示环境校验在启动检测边界执行

背包配置为仓库和背包分别增加 capture metadata。启动检测时主进程根据保存的物理选区定位当前显示器，并比较 display id、scale factor 与物理尺寸。存在 metadata 且任一关键值不一致时拒绝启动并要求重新框选；旧配置没有 metadata 时继续允许运行，但返回 legacy warning 供页面提示。

这种校验放在启动边界而不是只在页面展示，是为了覆盖应用启动自动恢复和快捷键路径。

### 模板匹配统一使用灰度图

采集图片保存原始 PNG 供预览；Python 加载模板和实时截图后转为灰度，再使用现有 `TM_CCOEFF_NORMED`。灰度可降低轻微颜色、亮度变化对固定标题文字的影响，但不引入多尺度匹配；DPI 或分辨率变化仍由元数据校验处理。

## Risks / Trade-offs

- [desktopCapturer 在独占全屏下返回黑屏或空图] → 检查图像尺寸和像素方差，失败时不保存并提示切换无边框/窗口模式，保留高级手工配置。
- [display id 在系统重启或显卡变化后改变] → 同时比较物理尺寸和 scale factor；不兼容时要求重新框选，不猜测迁移。
- [拖框过紧导致字体抗锯齿边缘变化] → 页面提示框选完整稳定标题，搜索区域自动加 12px，但模板内容仍由用户决定。
- [截图 thumbnail 与物理显示器尺寸不一致] → 使用实际尺寸比例裁剪，并在保存前断言输出 PNG 尺寸等于选区尺寸。
- [保存新图片成功但 store 更新失败] → 固定目标文件使用临时文件原子替换；配置只有在 IPC 成功后更新，重新框选可恢复一致状态。

## Migration Plan

1. 扩展通用选取会话和截图裁剪能力，同时保持现有 point API 与测试不变。
2. 增加背包受限保存 IPC、配置 metadata 规范化和环境校验。
3. 接入背包页面的新框选入口、预览和高级设置折叠区。
4. 切换 Python 到灰度匹配并完成多显示器/DPI、取消和失败回滚测试。
5. 旧配置不迁移图片内容；用户首次重新框选后自然获得 metadata，新代码回滚时旧路径与区域仍可读取。

## Open Questions

无。
