## Why

国服角色数据无法直接在助手中导入 PoeCharm，用户需要借助外部工具转换。提供独立导出入口，将本人及公开角色转换为可复制的 PoB 导入码。

## What Changes

- 新增侧栏 PoB 导出页面，支持本人和他人论坛 ID 的赛季、角色选择。
- 主进程获取角色、装备技能及天赋珠宝，翻译并生成压缩构筑码。
- 提供复制、生成时间、未识别数据提示和明确的失败反馈，隔离过期请求。

## Capabilities

### New Capabilities
- `cn-pob-export`: 国服 PoE 1 本人及公开角色导出到 PoeCharm。

### Modified Capabilities
无。

## Impact

新增 Electron 导出服务、IPC、前端页面，接入路由与模块目录；依赖锁定 cn-poe-utils 0.0.9。复用国服认证，不上传构筑到第三方，不涉及打包发布。
