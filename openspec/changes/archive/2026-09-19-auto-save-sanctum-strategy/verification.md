## 自动化验证

- 相关回归：`node --test test/sanctumStrategyAutosave.test.js test/sanctumStrategySelectors.test.js test/sanctumService.test.js test/sanctumEnabled.test.js test/sanctumPersistence.test.js test/sanctumView.test.js`，25/25 通过，包含 Vite 开发模式页面及样式转换。
- 随后补充实际 Vue 组件事件和卸载重建测试，`node --test test/sanctumStrategyAutosave.test.js`，8/8 通过。首轮组件测试误读取 `modelValue`，实际模板属性为 `model-value`；仅修正测试取值，没有增加规避断言的业务代码。
- 测试覆盖预设、权重修改及添加、痛苦增删、初始化不提交、串行合并、旧状态保护、关闭、失败保留与重试、页签组件重建和真实服务磁盘重启恢复。
- `npm test`：2714 项，2711 通过、2 跳过、1 失败。失败为 `runtimeDistribution.test.js` 的开发运行时 ready 断言，与本次策略改动无关；该文件单独重跑 5/5 通过。没有修改运行时或测试阈值以掩盖失败。
- `openspec validate auto-save-sanctum-strategy --strict` 通过；目标源码 diff 空白检查通过。

## 开发版窗口验证限制

开发服务器端口 3000 和项目 Electron 窗口已运行。通过 computer-use 获取到主窗口，但首次及重新获取窗口后的激活均返回 `failed to activate captured window`，无法完成真实窗口点击验证。未向该窗口发送编辑输入，未修改现有游戏配置；实际控件事件已由组件测试验证，真实窗口交互仍待验证，因此 tasks 中综合验证项保留未完成。

未打包或发布。
