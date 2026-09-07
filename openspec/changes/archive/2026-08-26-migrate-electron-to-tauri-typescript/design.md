## Context

当前 Windows 桌面端由 Electron 43、一个大型 preload API、229 个 IPC handler、133 个 Electron 模块和 Vue 3 JavaScript 前端组成。窗口、账号 Session、网络、更新、文件、Python 和业务算法混合在 Node/Electron 主进程；产品包含多个透明浮窗、多显示器物理坐标换算和需要管理员完整性的游戏自动化。现有 `%APPDATA%\流放助手` 同时保存 Chromium Local Storage、独立账号 Cookie 分区及应用文件数据。

本设计必须保留用户已确认的整体管理员运行策略，但不得关闭 WebView2 沙盒。默认只在开发版实施和验证；正式打包、安装覆盖、发布、真实性能门槛和跨 Windows 版本验收仍受单独授权约束。

## Goals / Non-Goals

**Goals:**

- 用 Tauri v2/Rust 系统层完全替换 Electron/Node 桌面运行时，同时维持全部现有业务行为。
- 将产品前端和可复用纯领域逻辑迁为严格 TypeScript，并用类型化桥接隔离 WebView 与高权限原生层。
- 让管理员 Tauri 主进程、WebView2、多窗口、Python 自动化和旧数据迁移具有明确的安全、失败和回退边界。
- 在完整功能对等后一次切换正式入口，并为后续普通权限主程序与独立高权限 Host 保留可拆分边界。

**Non-Goals:**

- 本变更不重新设计界面、业务流程、错误码、自动化阈值或功能范围。
- 本变更不引入 Node sidecar，不把领域算法整体重写为 Rust，也不实现独立高权限 AutomationHost。
- 本变更不在未授权时构建安装器、覆盖现有安装、发布更新或声明真实游戏/Windows 10 验收完成。
- 构建脚本和非产品测试辅助脚本不要求与产品代码同步全部迁为 TypeScript。

## Decisions

### 1. 新 Tauri 树并行建设，旧 Electron 冻结为基线

新增 `src-tauri`、TypeScript 配置和 Tauri 开发入口；迁移期保留当前 Electron 入口、测试与依赖，只允许阻断 Tauri 对照验证的必要兼容修复。每一类功能在 Tauri 侧完成后用同一组行为测试比较，而不是在 Electron 代码里长期维护双运行时分支。全部切换门槛通过后一次性删除 Electron 运行路径。

替代方案是先在现有 `electronApi` 内加入 Tauri/Electron 双适配。它能更早复用页面，但会把 229 个入口的双实现扩散到产品代码并延长高权限边界共存时间，因此不采用。

### 2. TypeScript 领域层与 Rust 系统层

Vue、Pinia、路由、共享工具以及不需要 Node/OS 权限的制作、解析、匹配和规划算法迁入 TypeScript。CPU 密集且可序列化的制作规划使用 Web Worker，保持 UI 线程响应。Rust 负责窗口、屏幕、DPI、快捷键、文件、HTTP/Cookie、诊断、更新、运行时路径、Python 生命周期和跨窗口状态。

不采用 TypeScript/Node sidecar，因为它会继续携带 Node 运行时、增加一条高权限 IPC 和额外进程生命周期；也不将全部领域算法改写为 Rust，以避免同时承担语言重写和运行时迁移两类回归。

### 3. `desktopApi` 是唯一前端原生边界

`src/api/desktop` 按领域提供 TypeScript 请求、结果、错误和事件类型。底层 adapter 统一调用生成明确名称的 Tauri command，并在入口处将响应式对象转换为普通契约数据。Rust 以 serde 结构体接收和返回相同形状；共享 JSON fixture、序列化往返测试和错误码清单验证两端一致。

Vue 组件、store 和 worker 不直接导入 Tauri invoke/event/plugin。事件 API 总是返回幂等取消函数。命令按窗口标签验证调用方，并由 Tauri capability 进行第二层最小授权；主窗口、业务浮窗、登录窗口和屏幕选择窗口分别声明权限。

### 4. 整体管理员运行，但不扩大 WebView 能力

Windows Rust 可执行文件嵌入 `requireAdministrator` 清单。开发脚本先以普通权限启动固定端口 3000 的 Vite，再单独启动带清单的 Tauri 可执行文件，因此 UAC 不提升终端、npm 或 Vite。Rust 启动健康检查记录进程完整性和 WebView2 创建阶段的脱敏原因。

WebView2 保持默认沙盒、AppContainer/LowIL 与用户数据权限；不设置 `--no-sandbox`、不修改系统 WebView2 ACL。管理员模式仍失败时，本变更只留下诊断证据并阻止切换，不在本变更内静默改为权限分离；权限分离需要新的 OpenSpec。

### 5. Rust 模块按原有业务域而非按插件组织

Rust 系统层分为 `commands`、`events`、`windows`、`runtime`、`storage`、`migration`、`auth`、`update`、`diagnostics` 和 `automation`。命令模块只负责调用方/载荷验证和结果映射，业务状态保存在受管 service 中；窗口和 Python 句柄由统一生命周期协调器清理。这样可保留现有错误码、互斥锁和退出顺序，并能在未来把 `automation` service 移到独立 Host 而不改变前端契约。

通用 shell plugin、任意文件插件和前端可控 sidecar 不加入 capability。所有外部进程操作由 Rust 固定操作表解析资源、工作目录和允许参数。

### 6. 多窗口使用稳定标签和单路由应用

主窗口及现有 overlay route 继续复用一个 Vue 构建产物，但每个原生窗口使用固定标签和目标 hash route。Rust 创建窗口时显式配置透明、装饰、置顶、任务栏、焦点、阴影和初始物理 bounds；跨 DPI 坐标通过 Windows 原生显示器信息统一转换，不依赖 CSS 像素猜测。

窗口状态通过 Rust service 快照和定向事件传播。鼠标穿透与可交互区域由原生窗口策略和受控前端事件共同切换，所有移动/缩放命令验证 sender 标签及边界。

### 7. 旧数据直接迁移到类型化存储

耐久应用数据根继续是 `%APPDATA%\流放助手`，Tauri 自身 WebView 缓存放在独立子目录，避免把浏览器 origin 当作产品设置数据库。设置采用版本化 JSON repository：Rust 原子读写，TypeScript 通过 `desktopApi` 获取和更新，Pinia 只保存内存状态。

首次迁移在确认旧 Electron 未运行后复制相关 LevelDB、Local State 和 Cookie 数据库到版本化快照。LevelDB importer 只识别当前 Electron/Chromium 布局和代码中登记的键，解析后经过 TypeScript/Rust 共用 fixture 验证；未知记录不做猜测。现有文件目录按明确 allowlist 和格式校验兼容读取，不扫描其他旧目录。

账号恢复只在 Rust 内读取 `Partitions/poe-cn-auth/Network/Cookies` 和对应密钥材料，限定允许域名与 Cookie 名，使用当前 Windows 用户保护上下文解密后写入专用登录 WebView。秘密使用后立即丢弃，不写入迁移报告；任何格式、解密或验证失败都降级为重新登录。

迁移使用临时目标、原子提交和版本标记。源数据永不删除，失败时丢弃未提交目标并保留快照，重复启动依据标记和目标校验幂等跳过。

早期 v1 完成标记不代表所有声明的文件数据已经转换，因此追加独立的 v2 修复阶段：它复用只读快照和仍保留的稳定根旧目录，按类别生成临时目标并在全部验证后原子提交。设置修复以当前类型化仓库为主，旧 `presets` 与物品、地图、海图、商城预设按规范化 JSON 去重；ID 相同但内容不同时保留当前项，并为旧项生成基于内容哈希的确定性 `legacy-` ID 与“旧版”名称。有效的当前选择不改变。

文件修复不再把“目录存在且总大小低于阈值”当作导入完成。君锋镇校准索引、训练索引、会话原图和图块逐项验证路径、PNG 签名、字段及单文件上限，再转换为当前 `calibration` 仓库格式；谜题区域预览迁入当前受控预览目录，由既有谜题页面 API 通过专用原生命令读取、保存和清理。个人背景、模板及其他兼容目录也采用逐文件校验，单个损坏或累计目录较大不影响其他有效条目。迁移报告只记录类别、计数和脱敏警告。

### 8. Python 仍是自动化执行层，由 Rust 监督

正式版继续使用随包 Python runtime，开发版保留显式路径和受控系统回退。Rust 根据固定 operation ID 选择脚本和资源，不接受 WebView 提供的脚本路径、正文或通用命令。启动前依次检查运行时完整性、管理员完整性、DPI、坐标、模板和自动化互斥；一次性输入操作在启动前检查游戏进程与前台。被动喝药和主动循环等驻留监控允许在游戏不位于前台时启动并进入等待状态，但脚本每次检测或发送输入前仍必须检查游戏前台；任何不满足输入条件的状态都不得产生键鼠输入。

输入能力与全局互斥资格分别建模：制作、入库、取件等原有独占任务仍相互拒绝并返回既有锁定错误，被动喝药、主动循环和一键回城沿用 Electron 基线，不占用该独占锁且可与这些任务及彼此并行。同一驻留战斗辅助重复启动必须幂等返回当前进程；进程注册后立即按 operation 发布 `starting`，后续成功、失败和停止也使用同一 operation 的权威状态，避免启动窗口期和并行任务造成跨页面状态滞后或串线。

所有 Python 子进程加入统一 registry。全局停止、窗口关闭、更新安装和异常退出共享同一清理协调器，先阻止新任务，再请求停止，超时后终止受管进程并确认状态。

自动入库、仓库自动取件、混沌配方和君锋镇沿用 Electron 的 `InterfaceDetectionCoordinator` 语义，共享唯一 `bag-detect` 进程和同一检测状态。消费者加入或离开只改变注册集合；只有公共模板、区域或匹配阈值的稳定指纹变化才重配检测进程，最后一个消费者离开时才停止。

高频检测驱动的浮窗状态和页面尺寸回报使用单任务、最新值覆盖及相同值跳过。原生窗口 API 统一在 Tauri 主线程执行，且调用时不持有共享状态锁；尺寸调整后的窗口状态事件不得再次无条件触发相同尺寸调整。

### 9. 更新使用 Tauri 签名资产和一次完整切换

迁移版本不尝试让旧 Electron differential updater 安装 Tauri。首个 Tauri 版本通过用户明确启动的完整 NSIS 安装器切换，并保留用户数据根；之后更新服务继续保留 CNB 默认/GitHub 可选、手动/自动模式、六小时调度、共享进度和用户确认安装语义，但元数据改为 Tauri 平台清单、完整安装器 URL 和签名。

签名和摘要在原生层验证，资源清理成功后才交给安装器。打包密钥只由发布环境提供，不进入仓库或开发配置。

### 10. 分层验证和切换门禁

TypeScript 使用严格模式、`vue-tsc --noEmit`、领域/worker 单测和契约 fixture；Rust 使用单元、command sender、存储/迁移、进程和窗口配置测试；开发版做真实 WebView2 多窗口与 UAC 冷启动冒烟。旧 Electron 的现有测试继续作为行为基线，直到对应 Tauri 覆盖完成。

正式性能指标只在用户授权打包后测量，同机重复采样并记录安装体积、主程序及 WebView2 进程树空闲内存和从进程启动到主窗口 ready 的冷启动时间。

## Risks / Trade-offs

- [管理员 WebView2 仍可能因用户数据目录、Administrator Protection 或低完整性子进程而失败] → 保留默认安全机制，增加分阶段启动诊断和连续冷启动测试；失败则阻止切换并另开权限分离变更。
- [直接解析 Chromium LevelDB/Cookie 是内部格式且会随版本变化] → 只支持检测到的当前布局、先快照、白名单解析、逐项验证；Cookie 失败安全降级为重新登录。
- [早期完成标记可能掩盖未真正转换的文件数据] → 使用独立 v2 标记审计目标格式，安全合并预设并逐项转换旧校准、训练和预览文件；旧源和 v1 快照始终只读保留。
- [将 Node 领域模块迁到 Web Worker 可能改变时序和取消行为] → 保持请求 ID、进度、取消和结果语义，通过固定数据集对照 Electron 结果。
- [229 个 IPC 一次替换容易遗漏 sender 校验或错误语义] → 先建立接口清单和契约矩阵，逐领域迁移，只有矩阵全部通过才删除旧入口。
- [Rust 与 TypeScript 双端类型可能漂移] → 以契约 fixture、序列化往返和错误码清单作为 CI 门禁，不允许业务代码直接绕过 facade。
- [迁移期两套运行时增加仓库体积和测试时间] → Electron 只冻结保留，Tauri 功能完成后统一清理，不长期发布双运行时包。
- [不在本变更实现独立高权限 Host，管理员主进程扩大原生命令风险] → 按窗口最小 capability、sender 校验、固定操作表和无通用 shell/file API 限制攻击面，并保持未来拆分边界。

## Migration Plan

1. 建立 Tauri/TypeScript 工具链、管理员开发启动、`desktopApi` 契约、capability 和基础启动诊断，不改变 Electron 正式入口。
2. 迁移纯领域模块与 Vue 产品代码，建立 worker 和严格类型检查；同步用现有测试数据验证输出等价。
3. 按系统基础、窗口/浮窗、Python/自动化、账号/网络、反馈/诊断、更新的顺序实现 Rust services 和 commands，每完成一域即补齐 sender/capability/生命周期测试。
4. 实现稳定设置 repository 和直接 Electron 数据迁移，在复制的真实结构夹具上覆盖成功、锁定、损坏、重复、部分失败与 Cookie 降级。
5. 完成开发版 UAC、多窗口、多 DPI、全部业务和紧急停止回归；保持 Electron 作为可执行回退。
6. 用户单独授权后构建 Tauri 正式包，完成 Windows 10/11、WebView2 缺失/已安装、性能和完整安装器覆盖验收。
7. 所有门槛通过后切换入口并删除 Electron/preload/builder/Node 桌面依赖；若切换失败，恢复旧 Electron 入口和未修改的用户数据，Tauri 迁移目标与快照保留用于诊断。
