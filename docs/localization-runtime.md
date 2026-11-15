# 汉化组件开发与分发

汉化组件与翻译资源分开维护：`npm run localization:build` 生成受控原生读写组件，服务器只更新签名词库数据。组件源码位于 `electron/native/localization-helper`，发布输出位于 `.runtime/localization-helper`；`bin/obj` 中间文件不进入 Git 或助手分发。

开发和未来打包前执行：

```powershell
npm run localization:build
npm run runtime:verify
npm run electron:dev
```

构建依赖 Windows x64、.NET 8 SDK 与 Visual Studio C++ x64 Build Tools。脚本固定资源库和开源 codec 源码修订，发布为自包含组件；用户无需安装 .NET。`runtime:verify` 检查自包含文件、结构指纹、公钥和组件自检，缺失时阻止后续安装包构建。

开发版从 `.runtime/localization-helper/LocalizationHelper.exe` 调用组件；打包配置将整个发布目录复制到 `resources/localization-helper`，保留 schema、运行时、原生 codec 及许可证，排除 PDB。

`schema.json` 负责当前国际服目标结构，`source-schema-cn.json` 固定官方 dat-schema 修订 `91e6578a63678faf1b6c980ed0d02a0c6ca5afee`，仅用于读取 3.29.3 国服来源。两个文件均随组件提供并校验指纹；不得用来源结构写入目标游戏。展示字段采用逐表白名单，标识、机制值与资源路径保持不可写。

当前内部资源入口默认 `http://127.0.0.1:44317`，公钥固定在 `electron/assets/localization-public-key.pem`。维护环境可通过 `LOCALIZATION_RESOURCE_BASE_URL` 与 `LOCALIZATION_PUBLIC_KEY_FILE` 指定入口和公钥；`LOCALIZATION_ALLOW_LOOPBACK_HTTP=0` 可禁止本机 HTTP。不得将发布私钥放入客户端或仓库。

`runtime:verify` 只做组件和分发验证，不会对真实游戏应用汉化。用户点击“切简体”后，主进程在同一任务中完成游戏检测、资源检查、按需下载和应用；“切繁体”仅使用本地应用前备份中的官方繁体，不调用服务器检查或下载。启动或打开设置不会自动运行这些操作。预览入口和手动完整性确认已移除。

应用请求的 `mode` 为 `simplified` 或 `traditional`，缺省按简体处理，非法模式在操作前拒绝。已应用模式记录在原生事务中，并与资源版本共同决定是否可复用既有补丁；切换模式不能因词库版本相同而跳过。繁体不接收简体替换条目；仅在存在同游戏版本的本地验签词库时附带其版本以保留映射，无匹配缓存时使用本地 `native-tw` 标识，仍可完成切换。

原生组件自动检查结构与版本，保存应用前备份并通过事务提交修改；无需玩家先执行 Steam 手动完整性校验。备份代表首次应用前文件，不能证明文件一定是官方原版。同版外部修改、备份损坏等异常仍会阻止写入，恢复只适用于同一 Steam Build。

游戏原生市集的实例目录通过独立、默认关闭的原生组件翻译；沿用受管简繁模式，保留现有资源事务和 `fr` tag。启用须先退出游戏，等待组件连接后再进入角色；停止或换词库后必须重启游戏清除缓存。兼容版本、构建、启停限制及实机记录见[原生市集翻译](native-market-localization.md)。
