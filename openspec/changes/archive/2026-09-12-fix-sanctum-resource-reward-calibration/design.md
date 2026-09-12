## Context

见 proposal.md。原生读取当前只支持一个 panelRegion；状态栏流程已有无标题奖励定位与完整账本同步。

## Goals / Non-Goals

目标为游戏地图内分散资源及悬浮奖励可用。不增加独立状态栏资源布局、自动滚动或第二套奖励解析。

## Decisions

- 校准新增 coinsRegion、resolveRegion、inspirationRegion，v5 白名单丢弃旧字段；不推测大框中的小框位置。
- 原生端一次截图输出带区域键的裁剪集合；主进程逐块 OCR，区域类型决定字段归属，替代依赖游戏标签。
- readRunPanel('rewards') 委托现有 rescanEffects，清除扫描缓存后启动现有采集与账本同步，替代固定区域奖励读取。
- 保留 readRunPanel(kind) 接口；资源部分缺失允许读取，其余字段置为未知。

## Risks / Trade-offs

- OCR 误读 → 严格数字格式及冲突检查，未知交由人工修正。
- 奖励重扫会走现有地图采集 → 复用已有详情缓存、状态栏布局及输入安全生命周期。
- 旧资源需重新配置 → 页面明确显示重新框选提示，无关配置保持。

## Migration Plan

配置加载归一化到 v5，后续保存持久化；旧标题由注册表白名单移除。开发版验证，无打包发布。
