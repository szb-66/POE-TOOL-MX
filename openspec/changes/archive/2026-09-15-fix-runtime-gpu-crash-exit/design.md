## Context

动机见 proposal.md。main.js 已在合法 renderer 成功事件后调用 markStartupComplete；CrashGuard 目前仅在页面加载失败时使用此状态。GPU 和渲染器共用 handleGone，必须避免改变渲染器行为。

## Goals / Non-Goals

**Goals:** 在日志记录后、requestRecovery 前对启动已完成的 GPU 事件返回，保持诊断证据。

**Non-Goals:** 不改变渲染器异常、preload、首次挂载边界，不新增重启策略或公开 API，不诊断 GPU 驱动。

## Decisions

- 使用 source 为 child 且 type 大小写归一后为 gpu 的条件隔离处理；复用该判断识别启动关键子进程。
- 使用 startupComplete 而非仅 elapsed time，避免快速启动后在 30 秒内错误重启；未挂载的慢启动仍保留失败提示。
- 开发版通过主进程调试连接注入 app 的 child-process-gone 事件，不添加永久故障注入开关。验证窗口、页面交互和日志；测试替身覆盖时间、安全模式及重复事件。

## Risks / Trade-offs

- GPU 底层故障可能仍影响画面 → 保留原诊断，不声称修复驱动或保证真实崩溃后画面恢复。
- 意外影响渲染器错误处理 → 分流限定 GPU，运行现有启动与退出诊断测试。

## Migration Plan

无数据迁移。在开发版验证，不打包；回滚仅撤销本变更的 GPU 判断和对应测试。
