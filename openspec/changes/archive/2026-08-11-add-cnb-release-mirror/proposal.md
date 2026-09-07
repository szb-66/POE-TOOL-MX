## Why

当前客户端把 GitHub Release 作为唯一自动更新源，国内网络环境可能在版本检查或安装包下载阶段超时，导致已经实现的应用内更新不可用。需要在不重复构建、不引入自建更新服务器的前提下，以 CNB Release 提供国内可访问的可信镜像。

## What Changes

- 新增 GitHub Release 到 `Auto-Tool-MX/POE-TOOL-MX` CNB Release 的标签驱动镜像流水线。
- GitHub 正式发布成功后才向 CNB 推送同名标签，避免 CNB 在源产物尚未就绪时同步失败。
- CNB Release 镜像必须包含安装包、匹配的 `.blockmap`、`latest.yml`、SHA-256 校验文件和第三方声明，并标记为最新稳定版本。
- Windows 客户端默认使用 CNB `latest` Release 下载入口，并允许用户在设置中手动切换到 GitHub Release；所选来源持久化，保留现有版本判断、摘要校验、进度和确认安装流程。
- 文档化 GitHub Secret `CNB_TOKEN` 的最小权限、首次仓库同步和发布验证方法；令牌不得写入仓库或日志。
- 将应用版本升级到 `1.0.3`，在全部开发验证通过且 `CNB_TOKEN` Secret 就绪后提交、推送并发布 `v1.0.3`，以真实 GitHub→CNB 链路验证镜像可用性。

## Capabilities

### New Capabilities

- `cnb-release-mirror`: 定义正式 GitHub Release 产物同步到 CNB Release、最新版本别名和完整性要求。

### Modified Capabilities

- `application-update`: 为正式 Windows 客户端提供默认 CNB、可手动切换 GitHub 的更新来源，并保持失败隔离与安装安全行为。

## Impact

- 受影响文件预计包括 `.github/workflows/release.yml`、新增 `.cnb.yml`、`package.json`、更新服务、设置存储与界面、发布检查文档及自动更新测试。
- 外部系统包括 GitHub Actions、GitHub Releases 和 CNB 仓库 `Auto-Tool-MX/POE-TOOL-MX`。
- 需要仓库维护者在 GitHub Actions Secrets 中配置具有 CNB `repo-code` 与 `repo-release` 最小权限的 `CNB_TOKEN`。
- 本变更会创建并发布版本标签 `v1.0.3`；发布过程中需要监控 GitHub Actions 与 CNB 流水线，并核验两端产物摘要。
- 不新增运行时依赖，不改变安装包命名、用户配置目录或安装确认流程。
