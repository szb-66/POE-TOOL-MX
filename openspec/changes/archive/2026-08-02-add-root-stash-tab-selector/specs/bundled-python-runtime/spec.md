## ADDED Requirements

### Requirement: 离线仓库 OCR 运行时
Windows x64 正式安装包 MUST 携带仓库页识别所需的固定 OCR 推理包、中文模型及其传递依赖，并 MUST 在无网络和无系统 OCR 语言包时可用。

#### Scenario: 离线识别中文仓库名称
- **WHEN** 用户在断网且未安装 Windows 中文 OCR 能力的电脑启用仓库页自动选择
- **THEN** 应用使用内置运行时和内置模型完成识别

#### Scenario: OCR 依赖不完整
- **WHEN** 构建资源缺少 OCR 包、推理引擎、模型、校验值或许可证声明
- **THEN** 运行时验证失败且不得生成可发布安装包
