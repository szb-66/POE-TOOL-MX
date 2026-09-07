# 检测进程退出证据留存 — 技术设计

## Context

检测进程确定性异常退出但证据链断裂：退出码随 close 回调结束丢弃；原生崩溃无 faulthandler 时 stderr 为空；循环异常只保留 `str(exc)`。诊断系统 `sanitizeDiagnosticEvent` 已支持 `metadata.exitCode`（`EVENT_METADATA_KEYS` 白名单），渲染端 `reportDiagnosticFailure` 已有 metadata 参数，但 bag 链路全程未传值。取证实验已排除 GDI/内存泄漏、Python 异常逃逸与 Electron 侧误杀；脚本独立运行正常。

## Goals / Non-Goals

**Goals:**
- 一次复现即可获得：退出码（UI 提示 + events.json + 主进程日志）、原生崩溃栈（faulthandler → stderr → 主进程日志）、循环异常完整 traceback

**Non-Goals:**
- 自动重启兜底（用户明确只要根因修复）
- 不改 mss 实例化方式、不更换 OpenCV 版本——避免在取证阶段改变崩溃面
- 不调整诊断事件的 reasonCode 分类体系（入库中止噪声问题不在本变更范围，exitCode 字段本身即可区分两类事件）

## Decisions

1. **faulthandler 在 stdio 重配置后、依赖导入前启用。** `faulthandler.enable()` 输出到默认 sys.stderr；放在 `import cv2/mss` 之前可覆盖导入期原生崩溃。Python 3.13 内置，零依赖。
2. **`exitCode` 作为协调器状态字段一路透传，不做字符串解析。** close 处理器发布 `{ reason, exitCode: code }`；`bag-detection-stopped` 载荷透传；`bagStore.setStopReason` 从 `failure.exitCode` 组装 `metadata` 传给 `reportDiagnosticFailure`。入库中止等无退出码路径不产生该字段，天然区分事件来源。
3. **主进程日志用单条 console.error 记录退出码与 stderr 尾部（各截断）。** stderr 已逐块打印，此处只补退出码与尾部摘要，供打包版用户通过诊断导出回溯。
4. **describeDetectionExit 文案不变**（已含"（退出码 X）"），仅新增结构化字段，避免影响既有文案断言与用户感知。

## Risks / Trade-offs

- [faulthandler 输出可能含路径等敏感信息] → stderr 只进主进程日志，诊断事件仅记录数字退出码，不落原始栈文本，符合 structured-diagnostic-events 的脱敏边界
- [exitCode 为 null（信号终止）] → metadata 组装时过滤非有限数值，与 sanitize 白名单行为一致

## Migration Plan

纯增量日志与字段，无数据迁移；回滚即还原四个文件。

## Open Questions

（无——退出码与崩溃栈到位后，二期针对性修复另立变更。）
