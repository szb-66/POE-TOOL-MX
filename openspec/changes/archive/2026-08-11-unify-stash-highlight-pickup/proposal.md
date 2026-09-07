## Why

仓库自动取件仍使用旧的图像统计阈值，无法直接表达“搜索结果就是取件目标”，同时启用时会因 Vue Proxy 穿过 Electron IPC 而报 `An object could not be cloned`。当前高亮模型已经包含 12×12 和 24×24 仓库训练素材，应统一由高亮识别驱动普通仓库取件。

## What Changes

- 修复仓库取件运行配置的 IPC 可克隆边界，禁止响应式 Proxy 直接进入 preload。
- 普通仓库继续自动选择根仓库/文件夹仓库校准和 12×12/24×24 布局，但候选物品改由当前高亮模型识别。
- 搜索框为空时取出模型识别的全部高亮物品；输入筛选时仅取出筛选后仍高亮的物品。
- 移除普通仓库方差、亮度、饱和度阈值配置界面，保留检测预览和安全停止能力。
- 普通仓库不复用君锋镇即时近邻纠正，避免跨场景校准污染；两者共享当前基础模型和取件算法。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `grid-stat-stash-pickup`: 将候选检测从图像统计阈值改为高亮模型，并定义空筛选/有筛选时的统一取件语义。
- `junfeng-highlight-pickup`: 将当前高亮模型与安全取件算法扩展为普通仓库和君锋镇共用能力。

## Impact

- 影响仓库取件 renderer store、Electron API/manager、Python 高亮取件脚本和背包设置页。
- 沿用现有 ONNX Runtime、OpenCV、mss 和 pynput 依赖，不新增打包依赖。
- 只在开发版执行测试和运行验证，不执行安装包构建。
