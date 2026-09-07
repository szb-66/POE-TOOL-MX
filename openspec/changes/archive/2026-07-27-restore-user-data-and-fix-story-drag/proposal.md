## Why

开发版与正式版必须写入同一个明确的新数据目录，避免继续产生多套格式和兼容分支。剧情浮窗虽然显示了三点抓手，但抓手仍位于穿透窗口内部，无法可靠接管鼠标完成拖动。

## What Changes

- 固定开发版和正式版使用唯一的 `流放助手` 用户数据目录和当前数据格式。
- 固定开发服务器使用 `http://localhost:3000`，端口被占用时明确失败，不再静默切换 origin 造成 LocalStorage 看似丢失。
- 删除旧 `Electron` 目录识别、LevelDB 解析、LocalStorage 导入、迁移标记及相关兼容测试；应用不读取或转换旧格式。
- 将剧情抓手拆成独立、可接收鼠标的原生小窗口；内容浮窗保持全程穿透，抓手移动时同步内容浮窗位置。
- 增加单一数据目录和原生抓手拖动回归测试。

## Capabilities

### New Capabilities

- `stable-user-data`: 开发版和正式版统一使用唯一的新数据目录与当前格式。

### Modified Capabilities

- `story-guide`: 剧情浮窗通过独立原生抓手可靠拖动，同时内容区域继续穿透游戏操作。

## Impact

- Electron 启动生命周期与用户数据目录选择。
- Vite 开发服务器端口与 Electron 开发页 origin。
- `Local Storage`、`templates`、`backgrounds`、`crafting` 和 `window-state.json` 的统一存储位置。
- 剧情浮窗窗口管理、抓手渲染与位置持久化。
- 数据目录和剧情浮窗集成测试。
