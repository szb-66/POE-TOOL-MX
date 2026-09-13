## Context

见 proposal.md。目录、路由、主进程各有开发限制；Python 无法直接读取 app.asar，且奖励图标和校准示例依赖脚本相对路径。

## Goals / Non-Goals

开放完整圣所功能；保留模块启停和安全限制。不改识别算法，不执行打包发布。

## Decisions

- 移除圣所开发限制，仅保留模型训练限制；沿用懒加载。
- 将圣所脚本和依赖、校准示例、货币图标纳入 files 与 asarUnpack，保持原目录布局；原生入口将 app.asar 路径映射至 app.asar.unpacked。相比重新组织 extraResources，避免重写 Python 相对路径。
- 发布冒烟检查覆盖解包资源；开发测试覆盖正式目录、路由及资源配置。离线样本仍为开发工具。

## Risks / Trade-offs

外部 Python 不能读取归档 → 显式解包并验证依赖资源完整性。当前安装程序不会自动改变 → 下次打包更新后生效。本次不运行安装版或游戏自动输入。
