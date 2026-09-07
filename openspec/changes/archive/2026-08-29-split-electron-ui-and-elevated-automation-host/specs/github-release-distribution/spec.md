## ADDED Requirements

### Requirement: Windows 发布包必须保留普通权限界面
Windows 构建检查 MUST 验证最终主程序 manifest 为 `asInvoker`，并验证随包 Python、薄 Host 入口以及操作注册表引用的固定脚本存在且可加载。任一检查失败 MUST 阻止发布；检查 MUST NOT 要求 native addon、独立 sentinel 或完整文件摘要清单。

#### Scenario: 发布候选完整
- **WHEN** 构建生成 Windows x64 发布候选
- **THEN** 检查实际可执行文件 manifest、薄 Host 入口和固定操作资源，而不只检查源配置文本

#### Scenario: 权限或最小资源不一致
- **WHEN** 主程序仍要求管理员，或随包 Python、Host 入口、任一固定操作入口缺失
- **THEN** 发布检查失败且不上传安装包

### Requirement: 无法启动的旧版用户必须有直接升级路径
公开发布说明和项目首页 MUST 提供与正常更新相同的直接安装包，并 SHALL 说明旧版若在 renderer 启动前失败，需要手动覆盖安装一次；不得要求用户关闭 Chromium 沙箱。

#### Scenario: 旧版无法进入应用内更新
- **WHEN** 用户的旧版在主界面加载前持续 `launch-failed/18`
- **THEN** 用户可从公开 Release 获取直接安装包，覆盖安装后保留现有用户数据
