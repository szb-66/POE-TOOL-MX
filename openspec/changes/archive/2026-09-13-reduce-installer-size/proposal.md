## Why

安装包重复分发已编译进前端的依赖，并包含 Python 第三方测试与缓存。清理分发冗余可降低下载和安装占用，保留完整离线功能。

## What Changes

- 五个前端依赖改为开发依赖，保持版本与主进程依赖不变。
- Python 分发排除缓存及指定第三方测试，保留开发运行时原件。
- 增加分发清单、体积报告和发布结构防回归检查。

## Capabilities

### New Capabilities
- `lean-runtime-distribution`: 分发只携带运行所需依赖，排除指定冗余并验证离线识别完整性。

### Modified Capabilities
无。

## Impact

影响依赖清单、Python 资源复制规则、发布检查和验证脚本；不变更用户 API、配置、更新协议或业务资源。
