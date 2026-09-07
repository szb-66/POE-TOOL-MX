# help-center Specification

## REMOVED Requirements

### Requirement: 帮助中心提供分层信息架构
**Reason**: 集中式帮助中心页面被删除，帮助内容按模块就近分配到各一级页面的帮助抽屉（见 `contextual-module-help`）。
**Migration**: 快速开始内容归属首页帮助抽屉；各模块指南归属对应页面帮助抽屉。

### Requirement: 帮助中心覆盖全部应用模块
**Reason**: 模块指南改为在各功能页就地展示，不再集中罗列于独立页面的功能指南分类。
**Migration**: 每个模块的用途、使用前提、基础步骤与风险提示在对应一级页面的帮助抽屉中呈现。

### Requirement: 帮助中心支持本地全文搜索
**Reason**: 帮助中心页面删除后，全文搜索与搜索结果定位失去集中入口；内容已就近分布，不再提供跨主题搜索。
**Migration**: 无替代搜索入口；用户直接在对应页面的帮助抽屉中查阅内容。

### Requirement: 帮助专题支持稳定深链接
**Reason**: `/help?topic=` 深链接随帮助中心页面一起移除，且应用内无外部引用依赖该链接格式。
**Migration**: 无替代；帮助内容通过各页面的"?"入口直接访问。

### Requirement: 做装规则完整保留
**Reason**: 做装参考专题改由做装模拟页与查价页的帮助抽屉就近承载，不再集中于独立分类。
**Migration**: 全部做装参考专题正文迁移到做装模拟页帮助抽屉，"国服官方挂单查价"专题同时出现在查价页帮助抽屉。

### Requirement: 关于信息来自有效来源
**Reason**: "关于"分类移出帮助中心，归属设置页"关于"Tab，由 `settings-tab-navigation` 能力承接。
**Migration**: 版本卡片与关于主题在设置页"关于"Tab 中展示，仍使用包元数据版本与有效项目地址。
