## 自动化验证

- 定向 Node 测试：37 项通过，0 失败（包含 Python 测试入口）。
- 项目内 Python 测试：39 项通过，0 失败；覆盖提交警告、异常窗口、已有布局复用，以及新增缓存复用、跨轮失效、周期检查与阶段计时。
- `npm test`：2054 项，2052 通过、2 跳过、0 失败。结果在 `.runtime/faustus-startup-tests.log`。
- 最后调整加载/扫描阶段同步后，manager 与加载反馈定向复查：22 项通过。
- Vite development 转换：浮士德页面与 store 均通过。首次转换遇到现有开发版 HMR 端口占用，已结束该验证进程，使用关闭 HMR 的隔离转换复查通过。
- `openspec validate optimize-faustus-startup-feedback --strict` 通过。
- 本次修改的代码 `git diff --check` 通过；全工作区检查发现其他已有规格文件末尾空行，未改动该文件。

## 开发版实测状态

已只读检查现有开发版与游戏窗口。游戏当前显示仓库和背包，未打开浮士德市集，因此没有执行真实改价，未取得首次/再次启动及逐件间隔对比。任务 3.2 保持未完成，不以模拟测试耗时代替真实游戏耗时。没有打包。

## 后续计时方法

使用 `FAUSTUS_TIMING=1` 启动开发版并打开待测浮士德市集。主进程记录 `runtime_ready`、`startup_feedback_visible`；Python 记录 `adapter_load`、`initial_preflight`、`occupancy_scan`、`page_recheck`、`footprint_probe`、`open_price_window`、`submission_ocr`、`submission_check`、`submit_to_next_window`。

分别采样首次/再次启动、连续单格、多格、通货切换和超过 12 个候选格的场景，同时验证全局停止。`submit_to_next_window` 从提交操作返回后开始，包含提交确认和下一件识别；不包含提交点击自身的等待。日志仅包含阶段、耗时、缓存命中及既有 OCR 面积/路径类型，不记录完整物品文本或剪贴板。

整页占用识别仍为每轮一次，首轮不再重复页面/网格检查；相邻候选格已取得的文本直接复用。提交 OCR 与输入等待保持原行为，实际缩短多少仍需上述游戏内采样确认。
