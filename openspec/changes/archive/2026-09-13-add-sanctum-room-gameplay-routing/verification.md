# 验证记录

- 2026-09-13：`npm test -- --test-concurrency=4`，2611 项：2609 通过，2 跳过，0 失败。
- 首次默认并发完整测试：运行时探测失败及旧标题丢弃断言失败。运行时探测降低并发复测通过，未修改检测实现；旧断言按保留名称并按楼层匹配的需求更新，真实图像测试通过。
- 新增标题独立性测试发现空正文的初始化数组被标成已知，修复 `identified` 门禁后通过。采集、保存、知识门禁与房型集成测试共 36 项通过。
- 实机四张 OCR 裁剪维持一次调用，正文回归通过；标题别名依据 reward/purse/pact/fountain 裁剪核对，不将数字装饰当作名称。
- 复用 Vite 开发服务器转换 RoomDetails、RoomRecognition、Settings 成功。在开发测试页挂载实际组件，验证出口＋冰圈、出口＋穿越陷阱偏好、来源链接、推荐理由及小首领/楼层首领修正选项。未操作游戏采集或打包。
- `openspec validate add-sanctum-room-gameplay-routing --strict` 与 `git diff --check` 通过。未保留失败实现的替代分支；预览脚本和运行日志仅在忽略的 `.cache` 中。
