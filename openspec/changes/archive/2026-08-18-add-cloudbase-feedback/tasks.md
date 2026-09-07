## 1. CloudBase资源准备

- [x] 1.1 绑定并复查`ap-shanghai`流放助手专用体验环境`poe-tool-d7gbuduivbdb631bf`，记录完整EnvId、到期时间和PostgreSQL资源模式
- [x] 1.2 开启匿名登录、确保Publishable Key，通过版本化迁移创建`public.app_feedback`表并创建私有PG Storage桶`feedback`
- [x] 1.3 配置匿名`anon`角色的反馈表仅INSERT GRANT/RLS（排除通用`anon`主体）、用户前缀存储INSERT/SELECT/DELETE RLS（SELECT仅满足删除前置校验）、容量约束，等待传播后用管理工具复查权限、用量和超额停服状态
- [ ] 1.4 在CloudBase控制台选择告警接收人并配置费用/容量告警（管理接口未提供接收人列表，不能替用户猜测接收对象）

## 2. 主进程反馈服务

- [x] 2.1 实现反馈配置、字段/附件验证、文件名净化、反馈编号和云对象路径工具并补充单元测试
- [x] 2.2 实现安装级随机设备标识、匿名登录、内存令牌缓存及401后单次刷新/重登逻辑并补充模拟HTTP测试
- [x] 2.3 实现PG Storage签名上传信息获取、附件PUT、PostgreSQL HTTP记录写入、进度上报与失败补偿删除并覆盖部分上传和写库失败测试
- [x] 2.4 复用现有脱敏诊断快照构建器生成内存JSON附件，保证默认不生成且不经临时文件或渲染进程传递

## 3. IPC与附件选择

- [x] 3.1 增加原生多选附件对话框和主进程选择令牌映射，提交前重新校验文件状态
- [x] 3.2 注册`feedback:pick-attachments`与`feedback:submit`处理器，并通过窗口事件发布窄化进度数据
- [x] 3.3 在preload和渲染端`electronApi`中暴露pick、submit、onProgress接口，补充非Electron降级与IPC契约测试

## 4. 设置页反馈界面

- [x] 4.1 实现工业工具型非对称双栏`FeedbackSettings`组件，包括字段校验、附件列表、诊断开关、进度、错误保留和成功编号复制
- [x] 4.2 将“问题反馈”加入设置页第六个会话Tab，使用`v-show`保持挂载并在该Tab隐藏“重置所有设置”
- [x] 4.3 更新设置Tab、反馈表单和视觉契约测试，确认现有五类设置行为不回归

## 5. 验证与收尾

- [x] 5.1 运行反馈相关Node测试、设置页测试、完整`npm test`、`npm run build`和Vite开发转换检查
- [x] 5.2 在开发代码上真实提交纯文本、图片/文件和可选诊断反馈，结合模拟网络/上传故障验证超限、断网、失败回滚及CloudBase PG记录/存储对象结果
- [x] 5.3 执行CloudBase代码审查与安全审计，检查敏感信息、无用失败方案代码、OpenSpec任务状态及`openspec validate add-cloudbase-feedback --strict`
