## Why

安装版圣所仍被开发环境开关排除，用户无法进入。当前只有模型训练应为开发版专属。

## What Changes

- 正式开放圣所目录、页面、浮窗与后台服务。
- 补齐可供外部 Python 读取的识别脚本及相对路径资源。
- 回归验证正式功能集合和资源完整性；仅在开发环境验证，不打包。

## Capabilities

### New Capabilities

### Modified Capabilities

- `feature-module-management`: 正式功能包含圣所，仅模型训练限定开发环境；圣所运行资源完整提供。

## Impact

功能目录、路由、主进程启动、圣所原生脚本路径、electron-builder 配置、发布检查及相关测试。
