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

尚未推送发布标签；正式安装包由现有 GitHub 标签流水线构建，CNB 通过现有镜像流程分发。
