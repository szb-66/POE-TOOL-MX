## 1. 词缀目录数据

- [x] 1.1 创建 `src/data/chartModsData.js`,转录 poedb 海图碎片词缀 150 条(等级、前后缀、全部描述行、标签),剔除英文内部标签行
- [x] 1.2 添加大海图边框词缀 65 条(全部描述行)
- [x] 1.3 编写 `test/chartModsData.test.js`:校验条目数量(150/65)、字段完整、描述行非空

## 2. 匹配引擎

- [x] 2.1 创建 `src/utils/chartModMatcher.js`,实现 `normalizeChartModText`(全角转半角、去空白、数值范围与百分比占位化)
- [x] 2.2 实现碎片词缀匹配:首行取候选集、剩余描述行打分确定唯一档位;检测「航行词缀将在完成测绘后揭示」标记未揭示
- [x] 2.3 实现边框词缀模糊匹配:相似度阈值与置信度输出,低于阈值标记未知
- [x] 2.4 编写 `test/chartModMatcher.test.js`:数值范围样例匹配正确档位、未测绘样例、OCR 噪声样例

## 3. Python 探测脚本

- [x] 3.1 创建 `src/assets/scripts/chart_mods_probe.py`,复用窗口/前台校验/emit/fail 公共函数骨架,支持 `--mode copy|border`
- [x] 3.2 实现 copy 模式:聚焦游戏、按页签切换、逐格移动鼠标并发送 Ctrl+C、剪贴板哨兵等待与前后保存恢复、逐格输出文本与 EVENT
- [x] 3.3 实现 border 模式:12 个边缘目标点移动鼠标、帧签名变化等待浮窗(带超时)、截图鼠标上方区域、rapidocr 逐边输出文本与 EVENT
- [x] 3.4 编写 `test/python/chart_mods_probe_checks.py` 静态检查(参数、输出格式、安全预检)

## 4. Electron 服务编排

- [x] 4.1 在 puzzle service 实现 12 段外边缘目标点纯函数计算(段中点外侧 20px,clamp 屏幕内)
- [x] 4.2 编写 `test/chartEdgeGeometry.test.js`:12 段坐标、偏移方向、屏幕边界 clamp
- [x] 4.3 实现探测进程管理:双 mode spawn、自动化锁占用与释放、overlay hide/show、EVENT 转发、停止与异常清理
- [x] 4.4 改造 `analyze()`:形状识别 → 碎片词缀复制读取 → 边缘词缀 OCR 三阶段编排,词缀结果(fragmentMods/borderMods)与阶段进度聚合到响应与事件

## 5. Store 与 UI

- [x] 5.1 `src/stores/puzzle.js`:slot 增加 mods 状态、新增 edges 状态、分析响应合并词缀结果、清空区域时清除词缀
- [x] 5.2 `PuzzleView.vue`:碎片仓库格子 hover 浮层显示碎片词缀(已识别/未揭示/未知)
- [x] 5.3 `PuzzleView.vue`:最优方案卡片 12 个出口按钮 hover 显示边框词缀
- [x] 5.4 识别按钮阶段进度提示(碎片词缀 n/60、边缘词缀 n/12)与采集期间操作禁用

## 6. 验证

- [x] 6.1 运行受影响 `node --test` 测试文件并执行 `npm test`
- [x] 6.2 Vite 开发转换验证与 `openspec validate --strict`
- [ ] 6.3 `npm run electron:dev` 实机联调:浮窗延迟与 OCR 区域参数标定,确认未测绘与失败容错路径

## 7. 独立边缘词缀识别与完成后自动识别

- [x] 7.1 service 抽取 `probeBorderMods({ atlasMetadata })`(复用锁、进度 EVENT 与 hover 参数),`probeChartMods` 内部复用
- [x] 7.2 IPC/preload/渲染 API 三处新增 `puzzle-probe-border-mods` 通道
- [x] 7.3 store:新增 `autoProbeBorderMods`(默认开启并持久化)与 `probingBorder`、`probeBorderMods()` action;`completeCurrentChart` 勾选时自动识别;修复手动空格化时 mods 残留
- [x] 7.4 最优方案卡片新增「识别边缘词缀」按钮与「完成后自动识别」选框及结果提示
- [x] 7.5 更新 `puzzleIntegration.test.js` 断言并运行受影响测试与 `openspec validate --strict`

## 8. 修复边缘词缀识别链路问题

- [x] 8.1 修复 `probeBorderMods` 键名不一致(store 传 `atlasRegionMetadata`、service 解构 `atlasMetadata` 导致误报请先框选海图区)
- [x] 8.2 重构 `probeChartMods`:海图区缺失只跳过边缘识别不连累碎片词缀;border/copy 阶段异常保留已识别结果并带 reason
- [x] 8.3 「当前海图已完成」按钮移入最优方案卡片,置于方案切换行下方
- [x] 8.4 一键识别完成后对跳过的词缀阶段给出原因提示
- [x] 8.5 更新测试断言并回归 `npm test`、`vite build` 与 `openspec validate --strict`

## 9. 修复探测结果解析与展示

- [x] 9.1 修复 `runProbe` 流式解析吞掉 RESULT 行(单独捕获 RESULT,处理 chunk 切割,reject 消息截断 stderr)
- [x] 9.2 Python 脚本压掉弃用警告并在处理前发送进度 EVENT(与 UI「正在处理第 n 个」语义对齐)
- [x] 9.3 边缘偏移 20 改 50,测试同步
- [x] 9.4 碎片悬浮改原生 title(移除 el-tooltip 与 el-dropdown 嵌套),fragmentMods 携带复制原文
- [x] 9.5 独立边缘识别按钮显示进度与完成统计,主进程打印词缀阶段统计日志
- [x] 9.6 更新测试断言并回归 `npm test`、`vite build` 与 `openspec validate --strict`
