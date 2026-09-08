## Why

浮士德启动先同步检查运行时才显示浮窗，首次运行缺少反馈。逐件提交检查和占格探测造成可感知间隔，需要消除重复工作并展示真实阶段。

## What Changes

- 使用异步运行时检测，准备阶段纳入互斥、停止和反馈。
- 发布识别、扫描、提交确认阶段，扩展可选耗时诊断。
- 复用本轮格子身份，移除首轮重复预检，保留提交确认与周期检查。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `faustus-market-repricing`: 增加可取消的准备反馈和本轮扫描复用要求。

## Impact

浮士德 manager、Python 扫描脚本、页面及 store、相关测试。启动 IPC 和持久配置不变，无新依赖。
