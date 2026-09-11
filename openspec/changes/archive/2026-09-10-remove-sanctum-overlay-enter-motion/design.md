## Context

逐帧复现确认：thickFrame: false 和 DWM 禁用都未阻止透明窗口从中心放大；屏幕内容仍从 881×587 增至 900×600。根因是 Chromium Aura 的窗口显隐合成动画，窗口 getBounds 不变，因此前两次验证没有测到真实现象。推荐房间和左上角说明面板同属路线遮罩窗口，控制按钮另有窗口。

## Goals / Non-Goals

**Goals:** 圣所窗口首次出现、恢复和隐藏时直接切换画面，避免缩放及过渡闪烁。

**Non-Goals:** 不调整截图恢复时序、坐标或其他模块的窗口。

## Decisions

在同步的 showInactive/hide 调用期间临时设置 Chromium 的 wm-window-animations-disabled 开关，finally 恢复原状；已有开关保持不动。该开关在 Aura 处理显隐时同步读取，局部对照实验首个可见帧即为 900×600。主进程注入 app.commandLine，仅圣所两类窗口调用该辅助函数，不全局永久关闭其他窗口动画。删除无效的 Python/DWM 初始化、门控和对应测试，保留无框样式配置。

## Risks / Trade-offs

禁用 thickFrame 同时禁用边框缩放与阴影 → 现有窗口已设 resizable: false、hasShadow: false；保留基于坐标更新的控制浮窗拖动。

## Migration Plan

重启开发版加载主进程代码，无数据迁移。验证使用真实桌面逐帧捕获，不能用固定 getBounds 或接口成功代替动画验证。
