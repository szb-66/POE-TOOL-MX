# 做装原始文字快照

目录按 POE 补丁版本隔离，例如 `3.28/`。每个版本包含：

- `manifest.json`：记录每个来源的稳定 ID、URL、类别、HTTP 状态、抓取时间、SHA-256 和文件路径。
- `pages/*.html.gz`：UTF-8 原始 HTML 的 gzip 压缩文件；内容哈希按解压后的 UTF-8 文本计算。

生成命令：

- `npm run crafting:data`：默认离线读取当前版本快照并重建 `dataset.json`，不会联网。
- `npm run crafting:data:missing`：只抓取 manifest 缺少、文件损坏或哈希不符的文字来源。
- `node scripts/generateCraftingData.js --refresh <来源ID|页面名|URL>`：只刷新指定文字来源。
- `npm run crafting:data:refresh`：显式全量刷新当前版本的全部文字来源。
- `node scripts/generateCraftingData.js --patch <版本>`：选择独立的补丁目录。

文字快照流程不下载图片。规范化数据生成只复用已有图片缓存，缺失图片回退到占位图。
