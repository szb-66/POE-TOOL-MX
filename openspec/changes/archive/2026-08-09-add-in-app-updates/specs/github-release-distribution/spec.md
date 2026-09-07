## MODIFIED Requirements

### Requirement: 可验证发布资产
每个 Release MUST 包含固定命名的 Windows x64 NSIS 安装包、与安装包匹配的 `.blockmap`、`latest.yml`、SHA-256 校验文件和第三方声明，并 SHALL 生成安装包与校验文件的构建来源证明。

#### Scenario: 发布完成
- **WHEN** 标签工作流成功
- **THEN** 安装包名为 `PoE-CN-Helper-<version>-win-x64-setup.exe`，`.blockmap` 与安装包同名，`latest.yml` 引用该安装包的版本、大小和摘要，且 SHA-256 校验文件中的摘要与安装包一致
