## Context

参见 proposal.md。脚本分布在 resources、app.asar.unpacked 和渲染端 raw 模板三类位置；已有运行时验证在 beforePack 执行，发布冒烟检查验证实际产物。

## Goals / Non-Goals

保证业务脚本本地依赖在各自执行目录可达，捕获延迟导入；不执行真实截图或键鼠操作，不调整业务算法。

## Decisions

- 保留两份 interface_titles 分发副本，避免改变圣所入口路径或全局 Python 搜索路径。
- 用 electron-builder FileMatcher 解析 files/asarUnpack，用 extraResources 显式映射脚本目标；只检查 Python 脚本，不复制整个运行时。
- Python AST 遍历实际分发脚本的全部 Import/ImportFrom，以源码脚本模块名识别项目本地依赖；依赖必须位于调用方同目录。当前项目本地模块均为平铺脚本；未来包结构必须显式扩展检查器。
- 校验源码脚本清单覆盖全部 src/assets/scripts/*.py，包括渲染端 raw 模板；发布目标缺失与导入缺失分别报告相对路径，不输出用户绝对路径。
- 开发临时布局与发布实际目录复用检查器；beforePack 的运行时验证加入开发布局检查。回归用隔离 Python 和合成图片，运行有限检测循环以验证状态事件。

## Risks / Trade-offs

- AST 不执行字符串动态导入 → 当前源码无此本地导入方式，行为回归实际调用已知延迟导入。
- 静态检查不能证明截图效果 → 合成图覆盖匹配和状态上报，真实游戏验收不作为自动测试的依赖。
- 增加运行时清单条目需要重新准备运行时元数据 → 沿用已有 prepare/verify 工作流，不手改安装目录。
