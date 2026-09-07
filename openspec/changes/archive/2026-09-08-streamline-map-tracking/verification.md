# 验证记录

- 地图追踪、日志与共享抓手相关测试：95/95 通过（包含新增日志回放、进程创建时间验证、旧配置兼容与首页组件折叠）。
- 全量 npm test：2013 项，2007 通过、4 失败、2 跳过。此轮之后补充的进程会话与 store 修改已重跑受影响测试。
- 全量失败：advancedAlchemy 页面旧模板断言；chartRolling 内部 Tab 旧断言；gridLayout 首页 md=6 旧断言；helpContent 模块指南数量旧断言。这些预期涉及本轮开始时已经存在的其他改动，本次未修改相关业务。
- Vite 开发转换：MapTrackerOverlayView、MapTrackerSettingsDrawer、MapTrackerDrawer、MapTrackerDashboard 和 DashboardView 成功。
- 浏览器开发页面实查：首页关闭状态折叠；刷图设置与历史战绩独立打开；浮窗页面呈现计时、名称和传送门。未调用真实游戏输入，也未更改用户追踪开关。
- OpenSpec 严格校验通过。
- 尚未完成：原生游戏内穿透与拖动、多 DPI 实测。原生窗口工具一次截图超时（FrameArrived timed out），另一次返回不对应目标内容的异常截图，因此没有把它当作验证通过。任务 3.2 保持未完成。
- 未打包，保留经验底层和旧配置后台采样。

- 2026-09-08：按用户要求同步并归档，保留任务 3.2 未完成。历史战绩已移除掉落、角色、编辑及重复总开关；开发页面三条记录自然行高约 40px，未固定行高。
