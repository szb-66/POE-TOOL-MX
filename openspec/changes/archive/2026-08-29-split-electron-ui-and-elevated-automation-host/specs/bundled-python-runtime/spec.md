## MODIFIED Requirements

### Requirement: 正式版使用内置运行时
Windows x64 正式安装包 MUST 携带受支持的 Python 运行时以及全部固定脚本依赖，且 MUST NOT 依赖系统 Python。需要 Python 的普通权限只读操作与 17 个高权限输入操作 MUST 使用同一随包解释器；薄 Host、固定脚本及其资源 MUST 只从固定的自动化资源根解析。

#### Scenario: 电脑没有安装 Python
- **WHEN** 用户在没有系统 Python 的 Windows 10/11 x64 电脑使用任一固定操作
- **THEN** 普通权限路径或薄 Host 均使用安装包内的解释器与依赖

#### Scenario: 电脑存在其他 Python
- **WHEN** 正式版运行在安装了一个或多个系统 Python 的电脑
- **THEN** 应用仍只选择内置解释器，不受系统解释器版本或模块影响

### Requirement: 开发版允许受控回退
开发环境 MUST 优先接受显式运行时路径，并在未提供时回退到满足模块要求的本机 Python。普通权限只读操作和按需 Host MUST 使用主进程已经选定的同一解释器；Host MUST NOT 在提权后通过环境 `PATH` 重新选择解释器。

#### Scenario: 配置显式解释器
- **WHEN** 开发者通过受支持的环境变量提供有效解释器
- **THEN** 应用使用该解释器运行本地操作和按需 Host，并报告来源为显式覆盖

#### Scenario: 回退系统解释器
- **WHEN** 开发模式没有显式解释器且存在满足依赖的系统 Python
- **THEN** 应用选择该解释器并报告来源为系统环境

### Requirement: 运行时完整性验证
构建检查 MUST 验证随包解释器、薄 Host 入口、注册操作引用的固定脚本和必要模块可以实际加载；每次启动操作前 MUST 检查该操作的固定入口位于预期资源根且本次所需模块可导入。系统 MUST 对缺失或损坏返回结构化错误，但 MUST NOT 为此要求完整文件闭包摘要清单或启动期 Host 健康扫描。

#### Scenario: 构建资源不完整
- **WHEN** 打包前缺少解释器、薄 Host、任一已注册固定入口、许可证或必要 Python 模块
- **THEN** 构建失败且不会生成可发布安装包

#### Scenario: 安装后资源损坏
- **WHEN** 固定操作入口缺失、越出随包资源根或无法导入本次所需模块
- **THEN** 该操作在创建子进程前失败并返回明确原因，其他不依赖该资源的功能继续可用

#### Scenario: 应用启动但尚未执行 Python
- **WHEN** 用户只打开主界面或使用不依赖 Python 的功能
- **THEN** 系统不扫描完整 Host 文件清单、不启动 Host且不显示 UAC
