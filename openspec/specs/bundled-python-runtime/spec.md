# bundled-python-runtime Specification

## Purpose

确保 Windows 正式安装包在没有系统 Python 的全新电脑上也能稳定运行全部自动化脚本，并让开发环境仍可使用可控的本机解释器。

## Requirements

### Requirement: 正式版使用内置运行时
Windows x64 正式安装包 MUST 携带受支持的 Python 运行时以及全部脚本依赖，且 MUST NOT 依赖系统 Python。

#### Scenario: 电脑没有安装 Python
- **WHEN** 用户在没有系统 Python 的 Windows 10/11 x64 电脑启动正式版
- **THEN** 运行时健康检查成功，所有 Python 脚本使用安装包内的解释器

#### Scenario: 电脑存在其他 Python
- **WHEN** 正式版运行在安装了一个或多个系统 Python 的电脑
- **THEN** 应用仍只选择内置解释器，不受系统解释器版本或模块影响

### Requirement: 开发版允许受控回退
开发环境 MUST 优先接受显式运行时路径，并在未提供时回退到满足模块要求的本机 Python。

#### Scenario: 配置显式解释器
- **WHEN** 开发者通过受支持的环境变量提供有效解释器
- **THEN** 应用使用该解释器并报告来源为显式覆盖

#### Scenario: 回退系统解释器
- **WHEN** 开发模式没有显式解释器且存在满足依赖的系统 Python
- **THEN** 应用选择该解释器并报告来源为系统环境

### Requirement: 运行时完整性验证
构建和运行时健康检查 MUST 验证解释器版本、CPU 架构和所需模块，并对缺失或损坏返回结构化错误。

#### Scenario: 构建资源不完整
- **WHEN** 打包前缺少解释器、依赖清单、许可证或必要 Python 模块
- **THEN** 构建失败且不会生成可发布安装包

#### Scenario: 安装后资源损坏
- **WHEN** 正式版内置运行时无法启动或导入所需模块
- **THEN** 应用报告运行时不可用并阻止自动化启动

### Requirement: 离线仓库 OCR 运行时
Windows x64 正式安装包 MUST 携带仓库页识别所需的固定 OCR 推理包、中文模型及其传递依赖，并 MUST 在无网络和无系统 OCR 语言包时可用。

#### Scenario: 离线识别中文仓库名称
- **WHEN** 用户在断网且未安装 Windows 中文 OCR 能力的电脑启用仓库页自动选择
- **THEN** 应用使用内置运行时和内置模型完成识别

#### Scenario: OCR 依赖不完整
- **WHEN** 构建资源缺少 OCR 包、推理引擎、模型、校验值或许可证声明
- **THEN** 运行时验证失败且不得生成可发布安装包
