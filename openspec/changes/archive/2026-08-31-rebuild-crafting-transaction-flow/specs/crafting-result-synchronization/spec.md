## MODIFIED Requirements

### Requirement: 所有制作目标只使用当前请求的解析结果

系统 MUST 对装备、地图和航海海图使用同一版本化命令协议。每次启动 SHALL 建立新的 sessionId，每次通货动作 SHALL 建立 transactionId，每次解析 SHALL 建立 requestId；解析结果、提交命令和发布确认 MUST 同时匹配三者才属于当前事务。Python 侧 SHALL 是请求/提交/统计命令文件的唯一写入方，Electron 侧 SHALL 是解析结果/发布确认文件的唯一写入方。新会话开始、监听停止或协议版本不匹配时，所有旧候选和未确认提交 MUST 失效。

#### Scenario: 当前解析结果快速返回

- **WHEN** 当前 sessionId、transactionId 和 requestId 的完整解析结果在脚本开始等待前已经写回
- **THEN** 系统接受该结果并继续当前事务验证
- **AND** 不因清理文件或等待顺序忽略快速结果

#### Scenario: 旧请求结果晚到

- **WHEN** 任一 sessionId、transactionId 或 requestId 不匹配的解析结果晚到
- **THEN** 系统忽略该结果并继续等待当前请求
- **AND** 不用旧结果更新面板、事务或统计

#### Scenario: 协议版本不匹配

- **WHEN** 生成脚本与 Electron 主进程使用的制作文件协议版本不一致
- **THEN** 系统在任何后续通货、目标移动或统计提交前安全停止
- **AND** 显示可区分的协议不兼容失败原因

#### Scenario: 文件事件被合并或遗漏

- **WHEN** Windows 合并或遗漏当前命令或结果的文件变化事件，但完整内容已经落盘
- **THEN** 系统通过独立于全局自动操作等待的有界轮询读取最新完整命令或结果
- **AND** 同一复合请求标识至多处理一次

#### Scenario: 当前候选结果不提前显示

- **WHEN** 当前复合请求标识的 candidate 已写回，但 Python 尚未完成结构化事务验证
- **THEN** Python 可以读取该候选用于验证
- **AND** Electron 不更新制作面板、当前格统计或完成状态

#### Scenario: 验证通过后提交同一请求结果

- **WHEN** Python 验证 candidate 属于当前 sessionId、transactionId 和 requestId 且满足动作迁移
- **THEN** Python 发送只引用该复合标识的 commit 命令
- **AND** Electron 只能发布先前缓存的同一 candidate 并返回 publication ack

#### Scenario: 提交文件事件被合并或遗漏

- **WHEN** Windows 未报告当前 commit 命令的文件变化事件，但完整命令已经写入请求文件
- **THEN** Electron 通过独立内部轮询读取并幂等处理该 commit
- **AND** 面板至多发布一次且实际发送成功后写入 publication ack

#### Scenario: 结果文件处于写入中间态

- **WHEN** Python 对结果文件的监听或轮询读取到空文件、部分 JSON 或损坏内容
- **THEN** 系统不接受结果、不推进事务且不更新成功内容去重基线
- **AND** 后续完整 response 仍可按当前复合标识正常处理

#### Scenario: 旧监听会话回调晚到

- **WHEN** 文件监听停止或重启后，旧监听代次的延迟事件、轮询或防抖回调才执行
- **THEN** 系统按监听代次和 sessionId 拒绝该回调
- **AND** 该回调不得发布、确认或污染新会话的候选、面板和统计

#### Scenario: 陈旧 requestId 不提交

- **WHEN** 某 candidate 完成业务验证时，其 requestId 已不再属于当前 sessionId 和 transactionId
- **THEN** Python 不发送 commit，Electron 也拒绝任何引用该 candidate 的迟到 commit
- **AND** 不用该结果覆盖当前目标的面板或事务状态

#### Scenario: 缺省发布字段保持兼容

- **WHEN** 调用审计确认存在非自动制作的既有 v1 调用方发送不含 `publish` 字段的请求
- **THEN** 隔离的 v1 边界解码器可继续按既有 `publish: true` 语义处理该非制作请求
- **AND** 该请求不得进入或改变任何 v2 制作 session、candidate 缓存、面板事务或统计；若审计不存在该调用方则删除 v1 解码器

#### Scenario: 当前结果快速返回

- **WHEN** 当前装备、地图或航海海图的 response 在 Python 开始等待之前已经完整写回
- **THEN** Python 立即接受完整匹配复合标识的 response
- **AND** 不因清理文件、建立监听或等待顺序删除或忽略快速结果

#### Scenario: 装备解析结果快速返回

- **WHEN** 当前装备的 candidate 在 Python 开始等待前已经完整写回
- **THEN** Python 接受完整匹配复合标识的 candidate 用于当前制作步骤需要的结构化动作迁移验证
- **AND** candidate 在显式 commit 和 publication ack 前不更新面板

#### Scenario: 地图或海图解析结果快速返回

- **WHEN** 当前地图或航海海图格位的 candidate 在 Python 开始等待前已经完整写回
- **THEN** Python 接受完整匹配复合标识的 candidate 并保持当前格
- **AND** 不因等待时序错误换格或提前提交统计

#### Scenario: 陈旧结果晚到

- **WHEN** 任一 sessionId、transactionId 或 requestId 不匹配的旧 response 在当前请求后才到达
- **THEN** 系统忽略该 response 并继续等待当前复合标识结果
- **AND** 即使旧 response 是 publication ack 或 stats ack 也不得覆盖当前面板、事务或统计

#### Scenario: 序列号变化但内容未更新

- **WHEN** 当前事务取得新鲜剪贴板序列号证据，但非空文本与复制前相同
- **THEN** 文本仍可作为当前 requestId 的 parse 输入
- **AND** 结果同步层不把同文本解释为成功或失败，业务结论由当前事务结构化 before/after 规则决定

#### Scenario: 复制到旧剪贴板内容

- **WHEN** 必须变化通货后的第一个新鲜读取仍解析为动作前结构化状态
- **THEN** 系统不得 commit 或发布该 candidate
- **AND** 在当前事务读取预算内继续读取，耗尽后安全停止

#### Scenario: 重试复制到相同物品文本

- **WHEN** 允许稳定通货的第二个当前事务读取取得相同非空文本且两次均有新鲜序列号证据
- **THEN** 系统分别解析并按当前领域结构化指纹与事务上下文判断稳定候选
- **AND** 若已有文本只是解析传输失败，则仅重发 parse 命令而不再次复制

#### Scenario: 完整的当前结果返回

- **WHEN** 当前复合标识返回当前领域与动作规则实际所需字段完整的 candidate
- **THEN** Python 完成结构化迁移验证后发送 commit，并只接受匹配的 publication ack
- **AND** 只有该已确认快照可用于继续制作、更新面板或推进业务状态

## ADDED Requirements

### Requirement: 解析候选只能通过显式提交命令发布

Electron 解析当前命令后 SHALL 保存与复合请求标识关联的完整候选并返回给脚本，但 MUST NOT 更新制作面板。脚本完成结构化事务验证后 MUST 发送只引用该候选的显式提交命令；Electron 再次验证会话、事务、请求、候选完整性和当前有效性后，SHALL 至多发布一次并写入发布确认。Python MUST NOT 直接改写解析结果为已发布状态。

#### Scenario: 候选返回但尚未验证

- **WHEN** 当前解析命令已经产生完整候选，但脚本尚未验证动作迁移
- **THEN** 脚本可以读取该候选
- **AND** 制作面板、当前格统计和完成状态均不变化

#### Scenario: 当前候选显式提交

- **WHEN** 脚本发送匹配当前复合请求标识的提交命令且面板实际发送成功
- **THEN** Electron 发布缓存候选并写入同一事务的确认结果
- **AND** 重复提交命令不重复更新面板

#### Scenario: 候选不存在或已失效

- **WHEN** 提交命令引用不存在、不完整、旧会话或已被新事务取代的候选
- **THEN** Electron 拒绝发布并返回可区分失败
- **AND** 不从提交命令携带的任意物品字段重建候选

### Requirement: 结果同步失败有统一上界且不改变业务目标

解析结果与发布确认等待 SHALL 具有固定内部上界，并 MUST 独立于用户的全局自动操作等待。解析请求可对同一捕获文本串行重发，但任何结果同步恢复 MUST NOT 使用通货、发送额外目标点击、移动地图格位或提交当前目标统计。空文件、部分写入和损坏 JSON MUST 只等待下一次完整读取，不得推进事务。

#### Scenario: 当前 requestId 长期无结果

- **WHEN** 当前解析请求在内部上界内没有返回完整匹配结果
- **THEN** 系统按事务的解析传输恢复预算处理，耗尽后安全停止
- **AND** 不无限等待或改用旧 requestId

#### Scenario: 写入中间态

- **WHEN** 监听或轮询读取到空文件、部分 JSON 或损坏内容
- **THEN** 系统不更新去重基线、不发布且不确认
- **AND** 后续完整内容仍可按当前复合请求标识处理

#### Scenario: 停止后的延迟回调

- **WHEN** 监听停止或重启后，旧会话的防抖、轮询或文件回调才执行
- **THEN** 系统拒绝该回调
- **AND** 不污染新会话的候选缓存、面板或统计

### Requirement: 地图与海图统计通过独立完成命令提交

地图或航海海图事务只有进入已定义完成终态后，脚本才 MAY 发送携带当前 sessionId、目标标识和累计统计的完成命令。Electron MUST 校验命令属于当前运行会话并只接受规范化统计字段；候选解析、未确认事务、失败格和旧会话命令不得改变已完成统计。

#### Scenario: 当前格完成后提交统计

- **WHEN** 当前地图或航海海图已完成全部必要事务并进入完成终态
- **THEN** 脚本发送一次当前格完成命令
- **AND** Electron 更新规范化统计后才允许业务流程移动到下一格

#### Scenario: 失败格尝试提交统计

- **WHEN** 当前格事务失败、发布未确认或命令来自旧会话
- **THEN** Electron 拒绝该完成命令
- **AND** 已处理、符合条件和词缀统计保持此前完成格数值

## REMOVED Requirements

### Requirement: 装备、地图或海图解析失败时保持当前目标并安全停止

**Reason**: 读取预算、传输恢复和业务停止现由统一制作事务能力定义，结果同步能力只负责命令交付和隔离。

**Migration**: 保持当前目标、不重复通货和三次串行预算迁移到 `crafting-transaction-flow`；本能力保留传输上界。

### Requirement: 地图或海图仅在单张目标进入明确终态后换格

**Reason**: 换格属于制作事务的业务推进门禁，不是解析结果传输职责。

**Migration**: 完整终态与未确认不换格场景迁移到 `crafting-transaction-flow`。

### Requirement: 异常停止后从当前目标安全恢复

**Reason**: 恢复新会话、当前目标重读和检查点语义属于事务生命周期。

**Migration**: 全部恢复场景迁移到 `crafting-transaction-flow`，结果同步只负责拒绝旧会话。

### Requirement: 地图或海图统计仅提交完成格位

**Reason**: 旧方案允许 Python 与 Electron 共同改写结果文件，职责与候选发布混杂。

**Migration**: 统计改为当前会话的独立完成命令；业务完成门禁由 `crafting-transaction-flow` 定义。
