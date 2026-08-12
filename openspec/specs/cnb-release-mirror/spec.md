# cnb-release-mirror Specification

## Purpose

定义 GitHub 正式发布产物在 CNB 国内镜像中的同步时序、资产一致性、最新版本入口与失败安全边界，确保镜像可直接作为桌面客户端的可信更新源。

## Requirements

### Requirement: 正式发布后触发镜像
系统 SHALL 仅在 GitHub 稳定 Release 已成功创建并包含规定资产后，向 CNB 仓库推送同名版本标签并触发镜像。

#### Scenario: GitHub 发布成功
- **WHEN** 与应用版本一致的稳定标签工作流完成 GitHub Release 发布
- **THEN** 系统把当前发布提交和同名标签同步到 `Auto-Tool-MX/POE-TOOL-MX` 并启动 CNB Release 镜像流水线

#### Scenario: GitHub 发布失败
- **WHEN** 构建、验证或 GitHub Release 发布任一步骤失败
- **THEN** 系统不得推送对应 CNB 标签或创建不完整的 CNB Release

### Requirement: 镜像资产与源发布一致
每个 CNB Release MUST 包含与同标签 GitHub Release 相同的 Windows x64 NSIS 安装包、匹配的 `.blockmap`、`latest.yml`、SHA-256 校验文件和第三方声明，且 MUST NOT 在 CNB 重新构建安装包。

#### Scenario: 完成镜像
- **WHEN** CNB 标签流水线成功同步一个稳定版本
- **THEN** CNB Release 包含五类规定资产，安装包名称、大小和摘要与 GitHub Release 一致，且 `latest.yml` 引用该安装包

#### Scenario: 任一源资产不可用
- **WHEN** CNB 流水线无法下载任一规定资产或资产校验不一致
- **THEN** 镜像任务失败且不得把该不完整版本标记为最新 Release

### Requirement: 最新稳定版本下载入口
CNB 镜像 SHALL 将最近一次成功同步的稳定 Release 标记为 Latest，并 MUST 通过稳定的 `releases/latest/download` 路径提供更新元数据及其引用资产。

#### Scenario: 客户端查询最新版本
- **WHEN** 客户端请求 CNB `releases/latest/download/latest.yml`
- **THEN** CNB 返回最近一次成功镜像的稳定版本元数据，且元数据引用的安装包和 `.blockmap` 可从同一入口下载

### Requirement: 镜像凭据最小暴露
跨平台同步凭据 MUST 只通过 GitHub Actions Secret 注入，不得写入代码、构建产物、Release、流水线日志或客户端。

#### Scenario: 推送 CNB 标签
- **WHEN** GitHub Actions 使用 `CNB_TOKEN` 向 CNB 推送提交和标签
- **THEN** 工作流以非交互方式完成认证且日志中不包含令牌原文或可复用凭据

### Requirement: 真实发布验收
版本 `1.0.3` 的发布 SHALL 在本地测试与严格规格校验通过、CNB Secret 前置条件满足后触发，并 MUST 以远端结果验证完整镜像链路。

#### Scenario: 端到端发布成功
- **WHEN** `v1.0.3` GitHub Release 与 CNB Release 流水线均执行成功
- **THEN** 验收确认 CNB Latest `latest.yml`、安装包和 `.blockmap` 可下载，且 GitHub 与 CNB 安装包 SHA-256 一致

#### Scenario: 发布前置条件或远端流程失败
- **WHEN** 本地验证失败、`CNB_TOKEN` 未配置、GitHub Actions 失败或 CNB 镜像验证失败
- **THEN** 发布操作在当前安全停止点暂停并报告真实失败原因，不伪造链路成功结果
