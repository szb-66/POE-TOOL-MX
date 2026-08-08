# github-release-distribution Specification

## Purpose

定义公开 GitHub 项目的可复现构建、版本标签发布、Release 资产和用户文档契约，让下载者可以确认安装包版本、来源和完整性。

## Requirements

### Requirement: Windows CI 验证
仓库 SHALL 在 Windows CI 中安装锁定依赖、准备内置运行时、运行测试、构建前端并验证正式安装包。

#### Scenario: 拉取请求或主分支更新
- **WHEN** CI 被代码提交触发
- **THEN** 只有测试、生产构建、运行时验证和安装包冒烟检查全部成功时任务才通过

### Requirement: 标签驱动发布
系统 SHALL 仅由与应用版本一致的 `v<semver>` 标签创建公开 Release。

#### Scenario: 合法版本标签
- **WHEN** `v*` 标签版本与包版本一致且全部检查通过
- **THEN** 工作流创建或更新对应 Release 并上传规定资产

#### Scenario: 版本不一致
- **WHEN** 标签版本与包版本不一致
- **THEN** 发布失败且不上传安装包

### Requirement: 可验证发布资产
每个 Release MUST 包含固定命名的 Windows x64 NSIS 安装包、与安装包匹配的 `.blockmap`、`latest.yml`、SHA-256 校验文件和第三方声明，并 SHALL 生成安装包与校验文件的构建来源证明。

#### Scenario: 发布完成
- **WHEN** 标签工作流成功
- **THEN** 安装包名为 `PoE-CN-Helper-<version>-win-x64-setup.exe`，`.blockmap` 与安装包同名，`latest.yml` 引用该安装包的版本、大小和摘要，且 SHA-256 校验文件中的摘要与安装包一致

### Requirement: 用户优先的项目首页
README SHALL 说明真实功能、支持范围、下载与安装、管理员权限、未签名警告、首次配置、排错、隐私、开发和许可证。

#### Scenario: 普通用户访问仓库
- **WHEN** 用户打开 GitHub 项目首页
- **THEN** 用户无需阅读源码即可找到 Release 下载入口、兼容范围、首次运行步骤和常见问题
