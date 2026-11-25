## Context

builder-util 的 copyDir 遍历器固定跳过 `.gitkeep` 与 `.DS_Store`；单独构造 FileMatcher 不包含此行为。

## Goals / Non-Goals

对齐实际复制语义；不改变应用功能或放宽模型、DLL 等必需资源校验。

## Decisions

在 runtimeFilter 中追加这两个 basename 的排除模式，供清单与测试复制共同使用。不套用仅适用于主应用文件的其他默认排除规则。回归测试调用打包器实际 copyFiles，避免复制与校验同错而测试通过。

## Risks / Trade-offs

打包器未来可能改变默认规则 → 固定依赖版本并通过真实复制 API 回归。

## Migration Plan

先本地测试；确认 v1.9.1 尚无 Release 后提交修复并更新失败标签，触发原发布流程，验证 GitHub 与 CNB 资产。
