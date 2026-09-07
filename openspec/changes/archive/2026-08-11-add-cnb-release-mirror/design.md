## Context

参见 `proposal.md`。当前 Windows 安装包由 GitHub Actions 唯一构建并发布，应用内更新由 `electron-updater` 读取打包进客户端的 GitHub Provider 配置。CNB 仓库 `Auto-Tool-MX/POE-TOOL-MX` 已创建，但尚无同步流水线；当前 `v1.0.2` GitHub Release 缺少 `latest.yml` 和 `.blockmap`，因此不能作为首个完整镜像版本。

## Goals / Non-Goals

**Goals:**

- 保持 GitHub Actions 为唯一构建与校验环境，CNB 仅复制已发布的不可变产物。
- 在 GitHub Release 完成后顺序触发 CNB 镜像，消除标签先到而资产尚未生成的竞态。
- 让 `electron-updater` 默认通过 CNB Generic Provider 获取资产，并允许用户手动切换到 GitHub Generic Provider。
- 令跨平台凭据只存在于 GitHub Secret 和单次托管 Runner 进程中。

**Non-Goals:**

- 不在 CNB 重复构建 Electron 安装包。
- 不接入第三方公共 GitHub 代理、自建反向代理、对象存储或 CDN。
- 不实现来源失败后的静默自动切换，来源选择始终由用户控制。
- 不修补已经发布但资产不完整的 `v1.0.2`，首个镜像版本从后续新版本开始。

## Decisions

### GitHub 发布完成后推送 CNB 分支与标签

在现有 GitHub Release 上传步骤之后，使用 `CNB_TOKEN` 将当前发布提交同步到 CNB 默认分支，再推送同名标签。分支同步保证 CNB 在处理标签事件时能读取同一提交内的 `.cnb.yml`；标签后推保证 GitHub 下载地址已经可用。选择这一顺序而不是同时向两个平台推标签，可避免 CNB 流水线与 GitHub 构建竞态。

认证使用 HTTPS 和 GitHub Secret 注入的令牌，不把令牌写入远程 URL、仓库文件或持久化配置。CNB 不支持 SSH，且直接在客户端保存令牌不符合安全边界。

### CNB 流水线只下载并验证源产物

`.cnb.yml` 在 `tag_push` 事件中根据标签和固定资产命名，从公开 GitHub Release 下载规定文件，先验证文件齐全、`latest.yml` 版本及文件引用、SHA-256 校验，再创建 CNB Release 并上传附件。相比 CNB 再次打包，该方案避免两次构建产生不同安装包，也节省 CNB 构建资源。

Release 创建必须位于下载与验证之后，上传失败则流水线失败且不能把不完整版本作为可用更新。若 CNB 的 Release 创建步骤会立即变更 Latest，实施时应把 `latest: true` 放到附件上传成功后的覆盖更新步骤，确保失败版本不会抢占 Latest。

### 打包默认 CNB 并在运行时应用用户选择

将打包配置改为 `provider: generic`，基址设为：

`https://cnb.cool/Auto-Tool-MX/POE-TOOL-MX/-/releases/latest/download`

该打包配置继续作为未保存设置时的 CNB 默认值。更新服务在加载持久化设置或用户切换后，使用 `electron-updater.setFeedURL` 在以下两个 Generic Provider 基址之间选择：

- CNB：`https://cnb.cool/Auto-Tool-MX/POE-TOOL-MX/-/releases/latest/download`
- GitHub：`https://github.com/szb-66/POE-TOOL-MX/releases/latest/download`

设置界面仅在未检查、未下载时允许切换，防止同一次操作混用不同来源的元数据和安装包。来源失败后保留明确错误和当前选择，由用户切换并重试，不静默回退。

GitHub Release 仍由工作流中的 `gh release create` 显式发布，因此改变 electron-builder 的 Provider 不影响 GitHub 资产上传。

### 发布验证分为静态契约与远端冒烟

本地测试验证 Generic Provider URL、资产命名和同步脚本的静态契约。随后将版本升级到 `1.0.3`，确认 GitHub Secret `CNB_TOKEN` 已存在后提交并推送主分支，再创建并推送 `v1.0.3` 标签触发正式发布。发布后通过 CNB `latest/latest.yml`、安装包和 `.blockmap` 的 HTTP 可达性以及 GitHub/CNB 安装包摘要比对完成远端冒烟。

发布属于不可轻易撤回的外部写操作，因此每个安全停止点都必须满足前置条件：本地定向测试、完整测试和 OpenSpec 严格校验全部通过；工作树只包含本变更；远端不存在 `v1.0.3`；GitHub Secret 名称可见但不得读取或打印其值。任一条件失败时停止发布并如实报告。

## Risks / Trade-offs

- [CNB `latest` 别名行为发生变化] → 发布检查明确请求 `latest/latest.yml` 并验证其版本，失败时阻止把镜像声明为可用。
- [GitHub 可用但 CNB 同步暂时失败] → GitHub Release 保持有效；修复网络或配置后重新运行 CNB 标签流水线，不重新构建产物。
- [GitHub Secret 缺失或权限不足] → GitHub Release 已完成但 CNB 同步步骤明确失败；发布文档列出 `repo-code`、`repo-release` 权限和仓库范围。
- [Generic Provider 切换后旧客户端仍指向 GitHub] → Provider 配置只随新安装包生效；首个带 CNB 配置的新版本仍需通过现有渠道分发，此后版本使用 CNB 更新。
- [没有自动 GitHub 回退] → 设置提供显式双源选择并显示当前来源，避免静默切换掩盖网络或镜像问题。

## Migration Plan

1. 在仓库中加入 CNB 标签流水线、发布同步步骤、Generic Provider 配置和发布说明。
2. 静态验证 OpenSpec、测试、构建配置及流水线语法，不触发正式发布。
3. 维护者把 CNB 令牌保存为 GitHub Actions Secret `CNB_TOKEN`，实施者只验证 Secret 名称存在。
4. 将版本升级到 `1.0.3`，补充发布说明，完成提交并推送主分支。
5. 确认远端不存在冲突标签后创建并推送 `v1.0.3`，监控 GitHub Release 与 CNB 镜像流水线。
6. 验证两个平台安装包摘要一致，并验证 CNB Latest 元数据及引用资产可下载。
7. 若 GitHub 发布失败，在修复前不触发或重试 CNB；若 CNB 镜像失败，保留 GitHub Release并修复同步后重跑；若客户端更新源验证失败，则在下一版本恢复 GitHub Provider并继续提供手动下载。
