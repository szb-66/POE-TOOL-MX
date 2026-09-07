## ADDED Requirements

### Requirement: 主界面必须在普通完整性级别启动
Windows 正式版 MUST 使用 `asInvoker` 主程序清单，开发版 MUST 保持 Electron 与开发服务器继承普通调用者权限。系统 MUST NOT 把普通权限作为健康警告。

#### Scenario: 正式版正常启动
- **WHEN** 用户通过安装器创建的快捷方式或安装目录正常启动应用
- **THEN** 主进程与 renderer 使用普通完整性级别并保留 Chromium 默认沙箱

#### Scenario: 开发版正常启动
- **WHEN** 开发者从普通权限终端运行开发入口
- **THEN** 终端、开发服务器和 Electron 主界面保持普通权限

### Requirement: 普通权限修复不得关闭 Chromium 沙箱
系统 MUST NOT 为解决权限相关启动故障而自动启用 `--no-sandbox`、`--disable-gpu-sandbox` 或 `sandbox:false`，且 MUST NOT 增加针对用户手动管理员启动的专用处理。

#### Scenario: 普通权限启动失败
- **WHEN** 普通权限 Electron 在启动期发生非 GPU renderer 故障
- **THEN** 应用沿用既有故障处理，不执行禁用 Chromium 沙箱的重启

#### Scenario: 真实 GPU 崩溃
- **WHEN** 启动期发生既有白名单内的 GPU 子进程崩溃
- **THEN** 系统仍按现有规则执行至多一次禁用 GPU 的安全模式恢复
