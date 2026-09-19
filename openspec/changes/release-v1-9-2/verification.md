# v1.9.2 发布验证

## 发布准备

- package.json 与 package-lock.json 的应用版本统一为 1.9.2；未变更锁定依赖。
- docs/release-notes/v1.9.2.md 覆盖本次已审查更改；release:check 通过。
- 发布契约与更新说明相关测试 15/15 通过；前一轮代码审查的相关测试 171/171 通过。
- OpenSpec 全量严格校验 160/160 通过；git diff --check 通过。

## 测试与环境记录

- 首次 npm test：2718 项，2715 通过、2 跳过、1 失败，约 248 秒。失败为 singleInstance.test.js 的管道通知在固定等待 20ms 后尚未到达；锁定和拒绝第二实例断言已通过。
- 单独运行 singleInstance.test.js 与 sanctumView.test.js：4/4 通过，包含实际 Vite 开发模式转换。未修改该测试或运行时代码。
- 两个修改的 Vue 组件通过独立开发转换；独立检查脚本退出时出现依赖预构建取消或等待，已结束本次创建的检查进程，正式 Vite 验证以仓库测试的成功退出为准。
- npm run electron:dev -- --diagnostic-exit-after-interactive 因现有开发实例占用 3000 端口退出。未关闭现有开发实例，也未进行真实游戏输入。
- 本次未完成圣所真实窗口操作及连续制作两件的人工验收，对应原变更任务继续保留未勾选。
- npm test -- --test-concurrency=4 全量复测通过：2718 项，2716 通过、2 跳过、0 失败，约 248 秒，退出码 0。首次失败与高并发负载下的通知调度时序一致，未增加规避断言的代码。

## 公开发布

- 发布提交：`a3fc6b32103edb8db659ff670fa14c4f8aac6864`，标签 `v1.9.2`。GitHub 与 CNB 标签均指向该源码提交。
- GitHub Release 工作流 `35452489132` 成功；云端测试 2718 项，2716 通过、2 跳过、0 失败，前端构建、NSIS 安装包、包内冒烟、更新说明注入、校验文件和构建来源证明均成功。
- Windows CI 工作流 `35452489209` 成功。
- GitHub Release：https://github.com/szb-66/POE-TOOL-MX/releases/tag/v1.9.2 。五类资产全部 uploaded，公开更新说明与 docs/release-notes/v1.9.2.md 一致。
- CNB Release：https://cnb.cool/Auto-Tool-MX/POE-TOOL-MX/-/releases/tag/v1.9.2 。发布页包含全部更新说明段落；latest.yml 为 1.9.2，嵌入说明与源码文件一致。
- CNB latest.yml、blockmap、SHA256SUMS.txt、THIRD_PARTY_NOTICES.md 的 SHA-256 与 GitHub 资产摘要逐一一致。
- CNB 安装包入口返回 HTTP 200，大小 257474128 字节，与 GitHub 相同。CNB 校验文件中的安装包 SHA-256 与 GitHub 资产摘要一致：`a0b575e6c811a212e6bdc268727d2eb394854e52e660ff560a8b992429052138`。
- 本机代理 DNS 将 CNB 域名解析为虚拟地址，资产正文请求发生 TLS EOF。使用公开 DNS 的真实解析地址，仅对校验请求指定解析后成功，未修改系统代理或 DNS 设置。
- 安装包完整下载因速度较慢已主动停止，随后用户明确要求“不用下载”；没有完成本地安装包全文件哈希复算，也未安装运行正式包。按用户要求停止后不再下载，结论限于已核验的公开摘要、入口大小、四个小资产和成功的 CI/CNB 校验流程。
