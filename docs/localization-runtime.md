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

当前内部资源入口默认 `http://127.0.0.1:44317`，公钥固定在 `electron/assets/localization-public-key.pem`。维护环境可通过 `LOCALIZATION_RESOURCE_BASE_URL` 与 `LOCALIZATION_PUBLIC_KEY_FILE` 指定入口和公钥；`LOCALIZATION_ALLOW_LOOPBACK_HTTP=0` 可禁止本机 HTTP。不得将发布私钥放入客户端或仓库。

`runtime:verify` 只做组件和分发验证，不会对真实游戏应用汉化；游戏扫描、下载、应用和恢复均由用户手动触发。
