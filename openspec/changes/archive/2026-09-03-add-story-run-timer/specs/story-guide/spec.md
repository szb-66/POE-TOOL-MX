## ADDED Requirements

### Requirement: Configure story overlay modules independently
系统 SHALL 为剧情、技能和计时提供独立且持久化的浮窗显示开关；开关 MUST 只控制浮窗内容而不影响页面编辑能力。剧情和技能默认开启，计时默认关闭。

#### Scenario: Hide one overlay module
- **WHEN** 用户关闭剧情、技能或计时模块
- **THEN** 游戏浮窗移除对应内容，剧情与技能编辑内容保持可用

#### Scenario: Disable every overlay module
- **WHEN** 三个浮窗模块全部关闭
- **THEN** 系统关闭现有剧情浮窗并禁用外层浮窗开关，直到至少一个模块重新开启

#### Scenario: Re-enable a module
- **WHEN** 用户在全部关闭后重新开启任一模块
- **THEN** 外层浮窗开关恢复可用但系统不自动打开浮窗

### Requirement: Lay out enabled story overlay modules
系统 SHALL 根据启用模块动态布局浮窗；计时栏与剧情内容同时显示时 MUST 作为额外左栏，不挤占配置的剧情内容宽度。

#### Scenario: Show story and skills
- **WHEN** 剧情和技能同时启用
- **THEN** 两者保持可调整比例的左右分栏

#### Scenario: Show one content module
- **WHEN** 剧情或技能仅有一个启用
- **THEN** 启用模块独占剧情内容宽度且不显示分割抓手

#### Scenario: Show timer with content
- **WHEN** 计时与剧情或技能内容同时启用
- **THEN** 浮窗最左侧增加固定 120px 计时栏且总宽度相应增加

#### Scenario: Show timer only
- **WHEN** 仅计时模块启用
- **THEN** 系统显示紧凑计时浮窗且不显示冗余的计时模块名称；运行时仅突出显示累计时间，暂停或未开始时在时间下方显示对应状态

#### Scenario: Show timer with other modules
- **WHEN** 计时模块与剧情或技能模块共同显示
- **THEN** 计时栏不显示模块名称，以放大的累计时间为主要内容；运行时不显示“计时中”，暂停或未开始时显示对应状态
