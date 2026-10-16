# 验证记录

- 受影响测试：154 项全部通过。
- 全量首次执行：2723 项，2718 通过、3 失败、2 跳过。两项 OCR 子进程在高并发下分别达到 110 秒和 60 秒超时；另一项旧测试的未知秽生传奇查询预期与本次阻止错误身份的要求冲突。
- 更新旧测试：保留未知普通传奇的背景解析覆盖，并补充未知秽生传奇必须阻止查询的断言。
- 失败项及新增用例串行复查：12 项全部通过；海图和浮士德 OCR 分别约 17.7 秒、5.8 秒完成。
- 最终全量 `npm test -- --test-concurrency=4`：2723 项，2721 通过、0 失败、2 跳过；用时约 173 秒。未修改全局测试配置。
- `openspec validate support-foulborn-unique-price-check --strict` 和 `git diff --check` 通过。
- 开发版：运行 `npm run electron:dev`，加载实际浮窗组件；确认原始名称、秽生状态为是、通途词缀默认选中，点击真实搜索按钮后请求使用直觉之跃、翠绿珠宝、mutated=true 和 explicit.stat_1211779989。
- 开发网络验证使用内存桩，没有验证实际官方挂单。截图和请求证据分别位于 `.cache/foulborn-overlay.png`、`.cache/foulborn-dev-validation.json`；开发进程已退出，无打包。
- 开发验证脚本首次把词缀当作按钮查找而断言失败，改为读取实际组件的 role=checkbox/aria-checked 后通过；该临时脚本不进入项目实现。
- 首次开发启动记录 Vite 临时缓存 EPERM 和公共界面检测 mss.MSS 异常；第二次启动完成浮窗验证，该次日志未出现上述异常。
