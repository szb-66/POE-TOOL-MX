## Context

脚本生成器在单件阶段输出“[完成]”；浮窗直接搜索 stdout 分块，将这些文本误判为流程结束。已有结构化事件和停止消息提供流程级结果。

## Goals / Non-Goals

**Goals:** 用既有流程事件驱动完成状态，验证浮窗实际事件处理和关闭布防。

**Non-Goals:** 不修改通货操作、前台预检、地图完成规则或新增 IPC。

## Decisions

- 复用现有逐行 JSON 事件解析，在 crafting-completed 与 crafting-batch-completed 上设置完成；单件批次事件只更新进度。不采用修改日志文案规避误判的方式。
- 开始日志也按完整行顺序处理，防止同一分块中开始日志在完成事件之后重置状态；重置状态时显式解除关闭布防。
- 停止消息的 termination 为物品流程结果依据，不再读取单件 affixMatch/socketMatch/eldritchImplicitMatch。修正缺失 mapStats 被当成地图的判断。
- 测试执行浮窗 script setup 的真实处理函数并使用 Vue 响应式调度及关闭监听替身，覆盖分块事件、阶段达标、续作和停止。

## Risks / Trade-offs

- 事件分块或同块混排 → 按完整行顺序处理并加入回归用例。
- 实际游戏环境未就绪 → 明确记录开发版验证范围，不以模拟事件宣称实机连续制作已通过。

## Migration Plan

无需数据迁移。开发版测试通过后使用现有启动流程；回退本次浮窗改动即可回滚。
