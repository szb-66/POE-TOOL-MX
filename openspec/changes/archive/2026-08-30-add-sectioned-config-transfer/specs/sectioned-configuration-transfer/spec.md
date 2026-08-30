## Purpose

定义用户可在本地按区块和单个预设安全导出、预览并导入当前配置的稳定契约，同时隔离设备数据、私密状态与自动化运行风险。

## ADDED Requirements

### Requirement: 设置页提供分区配置传输入口
系统 SHALL 在“设置 → 系统”提供“配置导入与导出”卡片，并 SHALL 在独立弹窗中按“预设、便携设置、本机环境”分组展示可选区块。导出初始 MUST 不选择任何区块，导入预览 MUST 默认只选择兼容的预设区块。

#### Scenario: 选择单个预设导出
- **WHEN** 用户打开导出弹窗并仅勾选一个物品制作预设
- **THEN** 系统只把该预设写入配置包
- **AND** 导出按钮在没有选择任何内容时不可用

#### Scenario: 选择完整备份
- **WHEN** 用户使用“完整备份”快捷选择
- **THEN** 系统选择所有允许导出的便携与本机配置
- **AND** 在包含本机环境前要求用户再次确认风险

#### Scenario: 预览导入内容
- **WHEN** 用户打开一个有效配置包
- **THEN** 系统在写入任何设置前展示来源版本、导出时间、兼容区块、预设数量、冲突和隐私警告

### Requirement: 使用版本化配置包
系统 MUST 以 UTF-8 JSON 表示配置包，顶层 MUST 包含 `kind="poe-cn-helper/config-bundle"`、`formatVersion=1`、应用版本、导出时间和以稳定区块 ID 为键的 `sections`；每个区块 MUST 独立携带 `schemaVersion` 和 `data`。配置包 MUST NOT 直接暴露 localStorage 键或内部文件路径。

#### Scenario: 导出当前格式
- **WHEN** 用户导出至少一个区块
- **THEN** 系统生成符合主格式版本 1 的配置包
- **AND** 每个已选区块使用自己的 schema 版本

#### Scenario: 打开未来主格式
- **WHEN** 文件的 `kind` 正确但 `formatVersion` 高于当前支持版本
- **THEN** 系统拒绝导入且不改变任何本地数据

#### Scenario: 打开包含未知区块的文件
- **WHEN** 当前主格式文件同时包含兼容区块和未知区块
- **THEN** 系统把未知区块标记为不支持且不可选择
- **AND** 仍允许用户导入其他兼容区块

#### Scenario: 打开未来区块版本
- **WHEN** 已知区块的 `schemaVersion` 高于当前支持版本
- **THEN** 系统只禁用该区块并说明版本不兼容

### Requirement: 使用稳定区块标识
系统 SHALL 支持预设区块 `preset.item`、`preset.map`、`preset.chart`、`preset.shop`、`preset.story`、`preset.storySkill`；便携区块 `settings.general`、`settings.automation`、`settings.overlay`、`settings.bag`、`settings.priceCheck`、`settings.chaosRecipe`、`settings.stashPickup`、`settings.junfeng`、`settings.puzzle`、`settings.toolSites`、`settings.craftingPrices`；本机区块 `device.shortcuts`、`device.windowDetection`、`device.screenLayout`、`device.combatInput`。

#### Scenario: 部分区块导入
- **WHEN** 用户只选择 `preset.chart` 和 `settings.automation`
- **THEN** 系统只变更这两个区块拥有的数据
- **AND** 其他预设、设置和当前页面状态保持不变

### Requirement: 导出内容遵守隐私与资产边界
系统 MUST NOT 导出账号 Cookie 或会话、反馈身份、缓存、日志、诊断、训练数据、运行状态、识别结果、窗口或 Tab 临时状态、绝对路径、背景图片或视频、识别模板文件及其来源路径。导入覆盖层或界面识别设置时 MUST 保留接收方现有自定义背景和模板选择。

#### Scenario: 导出完整备份
- **WHEN** 用户确认导出全部允许的区块
- **THEN** 生成文件不包含任何被排除的私密、临时或资产数据
- **AND** 通用设置最多包含不带认证信息的赛季偏好

#### Scenario: 接收方已有自定义资产
- **WHEN** 用户导入包含覆盖层外观或识别阈值的配置且本机已选择自定义背景或模板
- **THEN** 系统应用与资产无关的兼容字段
- **AND** 不改变本机背景、模板和对应路径

### Requirement: 预设导入采用安全合并
系统 MUST 逐项导出和导入预设。导入预设 MUST 创建独立副本、重新生成顶层及全部嵌套实体 ID、不得覆盖或删除本地预设，并 MUST 保持所有本地当前预设不变。重名副本 SHALL 依次使用“原名（导入）”“原名（导入 2）”等未占用名称。

#### Scenario: 导入重名预设
- **WHEN** 配置包中的预设名称与本地预设重名
- **THEN** 系统创建带递增“导入”后缀和新 ID 的副本
- **AND** 本地同名预设及当前选择保持不变

#### Scenario: 重复导入同一文件
- **WHEN** 用户再次导入相同预设
- **THEN** 系统继续创建独立且名称不冲突的新副本

#### Scenario: 导入来源默认预设
- **WHEN** 导入项在来源设备是不可删除的默认预设
- **THEN** 接收方将其创建为普通可管理副本

### Requirement: 地图与海图坐标需要双重选择
系统 MUST 默认从地图和航海海图预设中移除来源设备网格坐标，并为导入副本写入未配置的安全网格。只有导出端明确选择“包含本机坐标”且导入端再次选择接收 `deviceGrid` 时，系统才 SHALL 把经过校验的坐标附加到新副本。

#### Scenario: 分享海图预设
- **WHEN** 用户未选择包含本机坐标而导出并在另一设备导入海图预设
- **THEN** 洗练规则、条件和选项被保留
- **AND** 新预设的网格坐标为空或未配置

#### Scenario: 导入端拒绝坐标
- **WHEN** 配置包携带 `deviceGrid` 但导入端未选择接收坐标
- **THEN** 系统忽略该坐标并报告已跳过本机字段

### Requirement: 非预设区块使用确定的合并语义
系统 SHALL 让已选单例区块只替换其拥有的规范化字段；工具站点 SHALL 按规范化 URL 合并且本地冲突项优先；制作价格 SHALL 按资源 ID 合并、让导入值覆盖同 ID 值并保留文件中未涉及的本地资源。

#### Scenario: 导入单例设置
- **WHEN** 用户选择导入自动化时序但未选择快捷键
- **THEN** 系统替换规范化后的完整时序字段
- **AND** 本地快捷键保持不变

#### Scenario: 合并工具站点
- **WHEN** 导入文件包含一个本地已有 URL 和一个新 URL
- **THEN** 系统保留本地冲突站点并追加新站点

#### Scenario: 合并制作价格
- **WHEN** 导入文件包含已有资源和新资源的价格覆盖
- **THEN** 已有资源使用导入值，新资源被加入，其他本地覆盖保持不变

### Requirement: 导入在校验和停止后事务式应用
系统 MUST 在任何写入前完成文件、已选区块和全部候选数据校验并建立恢复快照。涉及快捷键、坐标或输入运行时的区块 MUST 先停止所有自动化；停止失败 MUST 终止导入且不改变数据。提交过程 MUST 串行同步候选运行时并持久化，失败时 MUST 恢复 renderer、持久存储和主进程状态。

#### Scenario: 候选数据无效
- **WHEN** 任一已选区块无法通过当前 schema 校验或 normalizer
- **THEN** 系统拒绝整次已选内容导入且不执行紧急停止或写入

#### Scenario: 紧急停止失败
- **WHEN** 已选区块需要停止输入功能但统一停止返回失败
- **THEN** 系统中止导入并保持所有本地配置不变

#### Scenario: 中途同步失败
- **WHEN** 部分候选运行时已同步但后续同步或持久化失败
- **THEN** 系统恢复导入前的全部已选区块和运行时快照
- **AND** 不显示导入成功

#### Scenario: 回滚不完整
- **WHEN** 导入失败后的任一运行时恢复也失败
- **THEN** 系统明确列出恢复异常并强制相关输入功能保持关闭

### Requirement: 导入不得自动启用输入功能
系统 MUST 从可传输配置中排除运行中状态，并 MUST 在导入涉及持续输入模块时把相关持久启用字段设为关闭。一次性自动化 MUST 保持停止，且导入 MUST NOT 自动切换当前预设或触发任何输入。

#### Scenario: 导入已启用来源配置
- **WHEN** 来源数据曾对应已启用的查价、背包、混沌配方、仓库取件或君锋模块
- **THEN** 接收方导入后的相关模块保持关闭

#### Scenario: 导入制作和地图预设
- **WHEN** 用户导入制作或地图预设
- **THEN** 系统只新增非当前预设且不启动制作任务

### Requirement: 文件访问受限且结果不泄露路径
系统 SHALL 只通过由主窗口发起的专用打开和保存操作访问配置文件，MUST 拒绝超过 5 MiB 的文件，并 MUST 以同目录临时文件替换方式原子保存。界面可见结果 MUST 只包含文件名、状态和安全错误码，不得包含绝对路径。

#### Scenario: 取消文件对话框
- **WHEN** 用户取消打开或保存
- **THEN** 系统返回取消状态且不显示错误

#### Scenario: 打开超限文件
- **WHEN** 用户选择超过 5 MiB 的配置文件
- **THEN** 系统返回文件过大错误且不把内容发送给 renderer

#### Scenario: 非主窗口调用文件接口
- **WHEN** 非主窗口 renderer 调用配置文件接口
- **THEN** 系统拒绝请求且不打开系统对话框

### Requirement: 导入结果按区块反馈
系统 SHALL 对成功导入显示各区块的新增、更新、跳过、冲突和保持关闭数量，并 SHALL 以不同错误码区分格式错误、大小超限、兼容性错误、停止失败、同步失败和回滚异常。

#### Scenario: 部分兼容文件导入成功
- **WHEN** 用户成功导入兼容区块且文件还包含未选择或不支持区块
- **THEN** 系统报告已应用内容和已跳过原因
- **AND** 不把跳过项误报为失败应用
