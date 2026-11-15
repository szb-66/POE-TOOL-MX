# 原生市集简繁翻译

## 实现边界

原生市集由两类文字组成：搜索按钮、占位符与数值上下限来自本地 ClientStrings；筛选栏目、选项、词缀和物品候选来自游戏实例下发的压缩目录。仅修改 DAT／CSD 或 `fr` tag 无法覆盖后者。

本组件独立实现目录字段替换和中文查询名称还原，保留游戏布局、控件、交易 ID、选项值、数值和查询结构。现有简繁资源、备份事务和 `fr` 入口不变；没有扩展远端 DAT／CSD 签名协议，也没有加入覆盖层或助手市集。

只支持已实测的 Windows x64 Steam 国际服 POE1：

- Steam Build `26673341`，游戏 `3.30.0b`。
- `PathOfExileSteam.exe` SHA-256：`c86e4b153a93e573e7d800dcdf01a79b3392a52f73e29ca48d2bd8297ad28031`。
- 不支持 POE2、独立客户端或其他版本。未知版本拒绝启用，不自动重新定位。

采用 DLL 注入，仍存在账号和兼容风险。版本校验不能消除这些风险。用户提供的第三方程序仅用于研究机制，未运行该安装包，不作为运行依赖，也未复制其二进制或整套词库。

## 使用与停止

在“设置 → 游戏汉化”应用简体或繁体汉化后，打开语言切换按钮下方的“市集翻译”开关。首次默认关闭，之后记住选择；助手运行期间会自动为新启动的游戏启用对应语言的市集翻译，游戏退出后继续等待下次启动，无需逐次点击。助手重启时也恢复该开关。界面只保留一行开关，失败或需要重启时显示简短提示。

在游戏已经运行时打开开关，或启动助手时游戏已经运行，会先尝试接回该游戏已加载的同路径市集组件。只有原会话已初始化、语言及完整词库一致时才恢复查询转换；不会向未加载组件的旧游戏迟注入。没有可接续状态时等待游戏重启，状态不一致时明确提示。开关偏好保存在当前国际服汉化目录的 `market-settings.json`；切服和助手退出仅停止当前会话，不清除偏好。关闭开关才取消后续自动启用。

游戏会把目录字符串复制到自己的缓存中，缓存跨角色登录保留。因此：

- 必须在首次目录加载前启用；已经进入过游戏的会话不能补做完整翻译。
- 同一游戏进程只允许同一模式和词库。修改模式或词库后必须重启游戏。
- 开关开启期间自动跟随有效的受管简繁模式；恢复原版或资源无效时暂停，重新应用有效语言后恢复监听。版本或 Hook 冲突失败不反复尝试同一 PID，具体错误保留至该进程退出。
- 停止、切服、助手退出或管道断开会恢复原调用。已显示的中文缓存仍可能保留，**关闭再打开市集不会清除缓存**，必须完整重启游戏刷新。控制连接中断期间不要使用缓存中文名称搜索；开启市集开关后重启助手可接回一致的原会话，无需重启游戏。
- DLL 不强制卸载；提供给游戏的译文节点保留至游戏退出，避免悬空指针。

## 组件与协议

- `electron/native/market-localization/MarketHook.cpp`：MinHook 1.3.4 管理字段读取与查询构造挂钩，nlohmann/json 3.11.3 解析目录规则和查询。
- `electron/native/market-localization/compatibility.json`：固定版本的函数指纹和 12 个允许替换的调用点完整上下文。
- `electron/native/localization-helper/MarketHost.cs`：现有 helper 的独立 `--market-host` 常驻模式，不复用一次性资源操作管道。
- `electron/modules/marketLocalization/`：Electron 会话与主窗口 IPC 管理。
- `electron/assets/market-localization/catalog.json`：随助手发布的项目目录，未知条目透传原文。

Electron 与 host 使用 JSON 行协议 `marketProtocolVersion: 1`，只允许 `enable / resume / disable / status / self-test`。host 自行查找唯一匹配的进程，渲染进程不能指定 PID 或 DLL 路径。`resume` 不执行注入：核对已加载模块的路径及既有状态后，复用 DLL 原有 `configure` 身份校验，仅接受完全相同的语言和规则。host 与 DLL 使用限当前用户、首实例且校验客户端 PID 的命名管道，消息为 uint32 小端长度加 UTF-8 JSON，最大 16 MiB。

管道安全按 Windows 当前 User SID 建立独占访问规则，并显式设置 Medium／NoWriteUp 完整性标签，兼容“管理员助手＋同账号普通权限游戏”。不能使用 `PipeOptions.CurrentUserOnly` 代替该策略：它在 Windows 上同时限制提权身份，管理员进程的 Owner SID 可能是 Administrators，普通权限同账号的该组仅有 deny-only 身份，连接会被拒绝。[微软文档](https://learn.microsoft.com/en-us/dotnet/api/system.io.pipes.pipeoptions?view=net-8.0)、[.NET 8 实现](https://github.com/dotnet/runtime/blob/v8.0.0/src/libraries/System.IO.Pipes/src/System/IO/Pipes/NamedPipeServerStream.Windows.cs)。原生组件自检必须读回实际管道的 Owner、受保护 DACL 和完整性标签，不能只验证构造参数。

host 核对 Steam manifest、路径、x64、完整 EXE 哈希、受管资源状态、索引哈希和事务日志，拒绝已知第三方市集 Hook。DLL 核对 PE 身份、四个函数的原始指令及每个调用点上下文；不符时保持原行为。静态验证器另检查指纹在 `.text` 中唯一、目标 RVA 正确且不跨 ASLR 重定位。

目录规则分 `items / stats / filters`。只替换展示与检索文字；stats 的 `type` 是查询身份，禁止翻译。简体按 `cn → tw → 原文` 回退，繁体按 `tw → 原文` 回退。交易词缀通过稳定 ID 和参数模板对齐；不同原文对应同一中文物品名时补充原文以区分候选。查询只精确还原 `query.name / type / term` 中的已知名称；name/type 的变体对象仅修改 `option`，保留 discriminator、词缀 ID、数值范围和其他键值。

## 构建与验证

```powershell
npm run localization:build
npm run runtime:verify
node scripts/verifyMarketCompatibility.js "E:\SteamLibrary\steamapps\common\Path of Exile\PathOfExileSteam.exe"
node --test test/market*.test.js test/localizationDistribution.test.js
```

单独重建 DLL 可执行 `npm run market:build`。构建脚本固定依赖提交／头文件哈希，运行原生离线自测，再分发 DLL、原生自测程序、兼容资料、依赖指纹和完整许可证。`runtime:verify` 同时执行原资源组件自检、独立 market host 自检和原生市集自检，缺件或指纹不符时拒绝打包。不会对真实游戏应用汉化或发起交易。

真实游戏验收见[市集实机验收记录](native-market-acceptance.md)。最小原型验证通过与完整目录的全部内容实测是不同的验收项，未验证项如实保留。
