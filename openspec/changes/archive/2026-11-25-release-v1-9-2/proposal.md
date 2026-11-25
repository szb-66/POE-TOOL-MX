## Why

当前未提交的修复和圣所策略自动保存已完成代码审查，需要整理面向用户的更新说明并发布 v1.9.2 补丁版本。

## What Changes

- 将 package.json 与 package-lock.json 的应用版本同步为 1.9.2。
- 编写 docs/release-notes/v1.9.2.md，概述圣所、制作浮窗、查价兼容和运行稳定性改进。
- 运行开发环境验证与发布契约检查，提交当前已审查更改，推送 v1.9.2 标签触发现有发布流程。
- 核验 GitHub Release、CNB 镜像及自动更新元数据，记录实际验证结果与未完成的人工验收。

## Capabilities

### New Capabilities

无。此次仅整理版本和发布文档，已有功能改动由各自 OpenSpec 变更描述。

### Modified Capabilities

无。沿用现有标签发布和镜像契约，不修改发布行为；使用 skip_specs。

## Impact

package.json、package-lock.json、docs/release-notes/v1.9.2.md，以及现有 GitHub/CNB 发布流水线。版本选择按 1.9.1 的下一补丁版本处理。
