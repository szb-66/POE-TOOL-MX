# 开发版启动计时

正常运行 `npm run electron:dev` 会在终端打印本次 JSONL 日志路径，日志位于系统临时目录。每次 Electron 重启使用独立编号；首次运行从开发脚本进程启动计时，应用内重启从再次启动 Electron 计时。日志不记录账号、业务数据或网络响应。

日志依次覆盖 Vite 导入、服务器创建与监听、Electron 子进程启动、主模块导入、服务初始化、窗口显示、页面挂载及首页可操作。`interactive` 表示首页组件挂载且运行时同步已结束；同步失败仍可能允许操作，应同时检查 `failed` 事件。

## 基准命令

先正常退出现有开发进程，释放 3000 端口。基准不会搜索或结束已有实例，也不会切换端口、清除缓存或打包。

```powershell
# 重启电脑后的第一次执行：只能采集一次，不能先运行其他启动基准。
npm run startup:benchmark -- --scenario=boot-first

# 每轮重新启动开发服务器和 Electron，默认三轮。
npm run startup:benchmark -- --scenario=process-restart --runs=3

# 保留同一个 Vite，先启动一次预热，再采集三轮 Electron 重启。
npm run startup:benchmark -- --scenario=electron-restart --runs=3
```

报告和原始日志保存在系统临时目录，路径由终端输出。报告保留失败、缺失里程碑及超时，窗口显示预算为 10 秒，首页可操作预算为 15 秒；比较前后结果时应使用相同场景和机器。`boot-first` 是用户声明的场景，脚本无法自行证明它是电脑重启后的首次运行，因此不会标记为已经自动验证。

基准每轮最多等待 120 秒，超时只终止该基准自己创建的进程树。正常开发启动没有自动终止行为。当前已有进程占用端口时，报告会明确失败，不算作启动性能样本。
