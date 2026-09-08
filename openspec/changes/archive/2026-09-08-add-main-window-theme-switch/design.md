## Context
现有 mainWindowTheme 按路由强制深色，Less 的共享控件也限定深色。设置通用页和标题栏可直接增加入口。

## Goals / Non-Goals
统一偏好与实际配色，保证启动与热更新一致；不改变自动化、不为业务浮窗增加亮色。

## Decisions
使用独立主题控制器负责 localStorage、matchMedia、订阅与销毁，Vue 适配层提供共享响应式状态，避免每个组件重复监听。偏好键 app-theme-preference，非法值回退 system。
保留窗口路由分类，在 html 上分别挂载 app-light-theme/app-dark-theme；公共规则同时匹配两者，亮色补齐全部令牌。浮窗预览局部重设深色令牌。
标题栏切换进入手动模式；通用外观选项恢复 system；全量重置同时重置主题。
启动 HTML 提前读取相同偏好并设置加载颜色，模块挂载后由控制器接管。不新增依赖。Electron 主窗口在 ready-to-show 后显示，避免首帧主题解析前显示固定深色底；独立窗口不变。

## Risks / Trade-offs
硬编码深色影响亮色可读性 → 检查全局和业务样式，修正主题相关颜色，保留物品语义颜色。
重复监听 → 控制器销毁与 HMR 清理；存储异常 → 会话内状态继续工作。

## Migration Plan
缺失偏好自动采用 system，无数据迁移；回滚代码后独立偏好键可被旧版本忽略。仅开发版验证，不打包。
