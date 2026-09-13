## 1. 修复和验证

- [x] 1.1 对齐复制排除规则，使用真实打包器复制 API 回归验证占位文件、必需模型和 DLL。
- [x] 1.2 运行完整单元测试与 OpenSpec 严格校验（2670 通过，2 跳过，0 失败）。

## 2. 发布恢复

- [x] 2.1 提交修复并恢复 v1.9.1 标签发布，确认 GitHub 工作流通过和 CNB 镜像资产完整。

发布验证：修复提交 `8fca40c2`；Windows CI `34766577052` 与 GitHub Release `34766587102` 均成功。GitHub 五类资产全部 uploaded，CNB latest.yml 为 1.9.1，安装包、blockmap 与许可证均返回 HTTP 200；CNB SHA256SUMS 中的安装包摘要与 GitHub 资产摘要一致：`8ddd6605887ff22927f183953ac6345dcd45c32a5676f8776379ffda7096e239`。
