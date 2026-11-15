# 阿里云反馈内部测试版

本轮使用全新的反馈数据，不读取腾讯云历史记录。反馈提交、会话回复、附件及每日使用统计均通过阿里云服务处理。

## 启动连接

在本机 PowerShell 保持以下命令运行：

```powershell
ssh -N -o ExitOnForwardFailure=yes -L 127.0.0.1:44317:127.0.0.1:8081 aliyun-kmio
```

后台地址为 <http://127.0.0.1:44317>。关闭隧道后，后台和内部测试版的反馈服务不可用；不会回退到腾讯云。

## 构建内部测试包

```powershell
npm run runtime:verify
npm run build
npx electron-builder --config build/aliyun-test.cjs --win nsis --x64 --publish never
```

产物位于 `dist-electron-aliyun-test/`。内部测试版使用独立应用标识、用户数据目录，不启用正式软件更新，不覆盖原版安装或设置。

该安装包仅用于这台已配置 SSH 的电脑。正式向用户开放前，需要确定公网域名、HTTPS 入口，并重新构建连接正式入口的版本。

## 本次交付验证（2026-11-11）

- 服务器当前发布：`feedback-20261111-04`，systemd 服务 `poe-feedback.service`。
- 后台真实 PostgreSQL 测试 85 项全部通过；客户端以 `node --test --test-concurrency=4` 执行 2756 项测试，全部通过。
- 后台完整依赖审计为 0 漏洞，生产页面入口与本次构建的 `/assets/index-Dunlyx5i.js` 一致。
- 已实际安装测试包，验证独立用户目录、禁用正式更新、诊断及附件上传、管理员带附件回复、客户端追问、状态修改、编号搜索；最后一轮渲染进程无未捕获异常。
- 浏览器入口连续三次检查通过，数据库备份已在隔离数据库恢复验证，代码回退及恢复当前发布均通过。
- 验收反馈、消息、附件、测试统计和隔离数据库已清理；保留测试版身份以便下次直接使用。原有 Asset Forge 健康检查仍为 200。
- 清理后的基线备份：`/srv/poe-feedback/backups/20261111T124517317754Z`。

内部测试版安装在 `%LOCALAPPDATA%\Programs\PoE-Helper-Aliyun-Test`；本机 SSH 隧道已启动，但不会自动随 Windows 登录启动。隧道进程结束或电脑重启后，重新运行上述命令即可。
