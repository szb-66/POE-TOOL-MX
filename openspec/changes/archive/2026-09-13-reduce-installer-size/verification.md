# 验证记录

## 实施内容

- 五个渲染端依赖移到 devDependencies；锁文件对照确认所有依赖版本不变。
- Python extraResources 排除字节码缓存及四个指定包的 tests，保留开发运行时原件。
- 发布检查核对筛选后所有 Python 文件的存在和大小，拒绝冗余文件与嵌套前端依赖，检测主进程直接依赖遗漏，并导入清单中全部模块；探测不生成缓存。
- 分发审计使用 electron-builder 的 FileMatcher，生成独立副本和前后文件清单。

## 未压缩体积

当前应用版本 1.9.0，同一已安装依赖版本对照：

| 部分 | 之前（字节） | 之后（字节） | 减少（字节） |
| --- | ---: | ---: | ---: |
| Python 分发文件 | 283447393 | 270440395 | 13006998 |
| 生产依赖闭包原始文件 | 82453680 | 10241589 | 72212091 |

Python 约减少 12.40 MiB；生产依赖原始文件约减少 68.87 MiB。Node 数字未模拟 builder 对 node_modules 的默认排除，不能直接当成 app.asar 或安装包减少量。没有生成安装包。

本地证据位于 `.cache/installer-size/before.json`、`after.json`、`summary.json`；不含账户数据。缓存清理后可按下方流程重新生成。

## 复现命令

1. 在重分类前保存同版本 `package-lock.json` 为单独文件。
2. `node scripts/runtime/auditDistribution.js <改动前锁文件>`：在 `.cache/installer-size` 生成文件清单、摘要及独立运行时副本；版本不一致时拒绝对照。
3. 使用摘要中 `runtimeCopy` 下的 `python.exe -I -B scripts/runtime/offlineProbe.py .`：禁止 Python 网络连接，导入清单中全部依赖并识别固定喷泉图。
4. 将 `POE_TEST_PYTHON` 指向该副本解释器，运行 `node --test test/puzzleRecognizer.test.js test/sanctumRecognition.test.js test/sanctumOcrPipeline.test.js test/junfengHighlight.test.js`。
5. 下次正常发布时执行 `npm run release:smoke`；本次用过滤副本及正反向测试验证新增检查，未对旧版本产物运行正式验收。

## 已完成验证

- 针对性测试 13 项通过；发布检查增强后相关测试 8 项通过。
- 过滤副本导入 25 个 Python 模块成功；网络被阻断时使用副本自带模型识别出“包含痛苦喷泉”。
- 使用副本解释器运行拼图、圣域与高亮识别回归：59 项通过，无跳过。
- `npm run build` 通过；存在 Vite 大 chunk 提示，无构建错误。
- `npm run electron:dev -- --remote-debugging-port=9224` 启动成功，Electron 主窗口标题为“流放助手”，模型校验 ready 为 true。首次启动等待较久，未为此修改代码。
- 开发服务器浏览器实查：首页、更多功能弹窗、SVG 图标、设置路由正常；不将浏览器检查等同于完整 Electron IPC 或游戏内实机验收。
- `openspec validate reduce-installer-size --strict` 通过。

## 完整测试首次结果

`npm test`：2644 项，2641 通过、1 失败、2 跳过。失败项为开发 Python 运行时预检（约 11.94 秒），预检自身超时为 10 秒，疑似并发资源竞争。单独复测该文件：5 项全部通过，约 1.41 秒。未修改运行时超时或断言。

完整复测 `npm test -- --test-concurrency=2`：2644 项，2642 通过、0 失败、2 跳过，耗时约 323.83 秒。原失败的预检本次约 1.07 秒通过。保留首次结果，默认并发下的偶发超时未作为本轮缩包变更修复。

临时浏览器页面和本次启动的开发进程已关闭。没有增加失败方案的业务代码，也没有修改其他任务的 OpenSpec 记录。
