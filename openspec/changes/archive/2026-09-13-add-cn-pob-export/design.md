## Context

见 proposal.md。助手已有共享国服认证、HTTP JSON 请求和按目录注册的侧栏模块，但没有角色导出链路。

## Goals / Non-Goals

**Goals:** 在独立页面完成本人及公开角色导出，兼容 PoeCharm，确保错误与未识别信息可见。

**Non-Goals:** 不提供托管链接、历史构筑、PoE 2 或战斗配置推断。

## Decisions

- 主进程复用认证会话和 requestPoeCnJson；仅接受本人或论坛 ID、角色名、赛季等结构化参数，不接受任意 URL。本人账号从认证状态取得。
- 新增 pobExport.listCharacters 与 exportBuild，返回现有 success/data/error 结构。listCharacters 返回角色摘要；exportBuild 返回 code、character、generatedAt、warnings。
- 锁定 cn-poe-utils 0.0.9，按需 import 翻译和 building 模块，通过隔离适配层生成 XML 并 zlib/Base64 编码；不另造整套翻译字典。检查上游实际输出并覆盖关键字段，未识别条目返回 warnings。
- 按用户补充要求复用第三方：保留 PoExport/cn-poe-utils 的转换引擎，使用固定提交的 PoeCharm 中英游戏文本补充缺失技能和词缀，记录来源及摘要并提供生成脚本。官网新 description 对象词缀统一为上游字符串输入。普通天赋导出为项目当前 3.29；与 PoB 2.67.2 核对过 60 个珠宝插槽顺序一致。PoEDB /cn/pob 仅提供构筑托管，不作为转换接口。
- 每次导出重新获取列表确认角色身份，再获取装备和天赋，保留插槽链接、技能等级品质、升华及珠宝。关键数据不完整时失败。
- 前端两张独立卡片使用请求序号隔离加载与导出；任何输入变化、账号变化或卸载使旧响应失效并清空结果。复用账号设置入口，不复制登录逻辑。
- 赛季列表来自所加载角色，仅本人默认选择共享赛季，不通过浏览他人角色修改全局赛季。

## Risks / Trade-offs

- 上游转换字典落后于游戏 → 对未识别内容展示警告，并用真实 PoeCharm 导入核验。
- 官网隐私、限流、会话过期 → 转换为脱敏中文错误，不无限重试。
- 无真实角色或 PoeCharm 环境 → 保留真实验收任务未完成，明确记录限制，不以编码往返测试代替。

## Migration Plan

无用户数据迁移。新增模块可通过现有功能管理关闭；不打包发布。
