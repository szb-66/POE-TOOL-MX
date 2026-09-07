## 1. 前台监视器

- [x] 1.1 新增 `src/assets/scripts/foreground_watcher.py`（250ms 轮询、标题配置热读取、EVENT 行）
- [x] 1.2 新增 `electron/modules/system/foregroundWatcher.js`（spawn、解析、重启、停止）
- [x] 1.3 `main.js` 启动监视器并纳入退出清理

## 2. 快捷键门禁

- [x] 2.1 `shortcuts/manager.js` 拆分意图集/已注册集并新增作用域 API
- [x] 2.2 `ipc/shortcut.js` 改用配置意图 API，新增作用域 IPC 与 deferred 语义
- [x] 2.3 `preload.cjs` 与 `src/api/electron.js` 暴露新接口

## 3. 渲染层与诊断

- [x] 3.1 `settingsStore` 新增开关与前台状态并持久化
- [x] 3.2 `SettingsView.vue` 新增“仅在游戏窗口前台时生效”开关
- [x] 3.3 `scriptService` 启动时同步门禁状态并监听变化
- [x] 3.4 首页健康状态展示暂停/回退/注册状态
- [x] 3.5 帮助中心 FAQ 与诊断允许集合更新

## 4. 打包资源

- [x] 4.1 `package.json` extraResources 加入 `foreground_watcher.py`
- [x] 4.2 `scripts/runtime/manifest.json` requiredScripts 加入该脚本

## 5. 测试

- [x] 5.1 新增快捷键门禁单元测试
- [x] 5.2 新增前台监视器单元测试
- [x] 5.3 运行全量 `node --test` 全部通过
