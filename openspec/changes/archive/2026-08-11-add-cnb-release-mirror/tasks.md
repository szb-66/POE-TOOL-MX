## 1. 发布契约测试

- [x] 1.1 扩展 `test/releaseContract.test.js`，约束 CNB Generic Provider 基址、CNB 流水线规定资产、GitHub Release 后同步顺序及源码中不得出现实际令牌
- [x] 1.2 运行发布契约测试并确认新断言在实现前按预期失败

## 2. CNB 镜像发布链路

- [x] 2.1 新增 `.cnb.yml`，在稳定标签事件中下载并验证同标签 GitHub Release 的安装包、`.blockmap`、`latest.yml`、校验文件和第三方声明
- [x] 2.2 在 CNB 资产验证成功后创建 Release、上传完整附件并仅将成功镜像标记为 Latest
- [x] 2.3 扩展 `.github/workflows/release.yml`，在 GitHub Release 成功后使用 `CNB_TOKEN` 非交互同步默认分支与同名标签到 `Auto-Tool-MX/POE-TOOL-MX`

## 3. 客户端更新源与运维说明

- [x] 3.1 将 `package.json` 的 Windows publish 配置改为 CNB `releases/latest/download` Generic Provider，并保持现有 GitHub Release 显式上传步骤
- [x] 3.2 更新发布检查文档，记录 `CNB_TOKEN` 权限、首个镜像版本限制、CNB Latest URL 和 GitHub/CNB 摘要核验步骤
- [x] 3.3 将 `package.json` 与锁文件版本升级到 `1.0.3`，并新增 `v1.0.3` 发布说明

## 4. 验证

- [x] 4.1 运行 `node --test test/releaseContract.test.js test/applicationUpdate.test.js` 和完整 `npm test`
- [x] 4.2 运行 `openspec validate add-cnb-release-mirror --strict` 并检查变更中没有令牌、重复构建或失败方案遗留代码
- [x] 4.3 检查工作树范围、远端 `v1.0.3` 标签不存在且 GitHub Secret `CNB_TOKEN` 名称已配置，不读取或输出令牌值

## 5. 真实发布与远端验收

- [x] 5.1 提交本变更并推送默认分支，确认 Windows CI 通过
- [x] 5.2 创建并推送 `v1.0.3` 标签，监控 GitHub Release 工作流和 CNB 标签镜像流水线至完成或明确失败
- [x] 5.3 验证 GitHub 与 CNB `v1.0.3` Release 资产完整，CNB Latest `latest.yml`、安装包和 `.blockmap` 可下载，且两端安装包 SHA-256 一致

## 6. 用户可选下载源

- [x] 6.1 扩展更新服务、IPC 与设置存储，支持默认 CNB、可选 GitHub 的持久化来源，并在运行时配置对应 Generic Provider
- [x] 6.2 在设置界面增加下载源选择和当前来源提示，检查或下载期间禁止切换，失败后允许用户换源重试
- [x] 6.3 扩展更新单元与集成测试，运行定向测试、完整 `npm test` 和 OpenSpec 严格校验
