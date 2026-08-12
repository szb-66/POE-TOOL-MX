# 第三方软件与来源说明

本文件随源码和 Windows Release 一同发布。构建所用的精确版本、下载地址和 SHA-256 记录在
[`scripts/runtime/manifest.json`](scripts/runtime/manifest.json) 中；内置运行时也保留各组件随包提供的许可证文本。

## Python 运行时与模块

Windows 安装包包含以下运行时组件：

| 组件 | 版本 | 许可证 | 用途 |
| --- | --- | --- | --- |
| CPython embeddable package | 3.13.14 x64 | Python Software Foundation License 2.0 | 内置脚本解释器 |
| NumPy | 2.5.1 | BSD-3-Clause | 数组与图像数据处理 |
| opencv-python-headless | 5.0.0.93 | MIT（打包代码）/ Apache-2.0（OpenCV） | 图像与模板识别 |
| MSS | 10.2.0 | MIT | 屏幕捕获 |
| pynput | 1.8.2 | LGPL-3.0-or-later | 输入设备控制 |
| Pyperclip | 1.11.0 | BSD-3-Clause | 剪贴板访问 |
| six | 1.17.0 | MIT | pynput 的兼容性依赖 |
| RapidOCR | 3.9.1 | Apache-2.0 | 仓库页中文文字离线识别与模型 |
| ONNX Runtime | 1.27.0 | MIT | RapidOCR 模型离线推理 |
| pyclipper | 1.4.0 | MIT | OCR 文本框几何处理 |
| Shapely | 2.1.2 | BSD-3-Clause | OCR 几何处理 |
| Pillow | 12.3.0 | MIT-CMU | OCR 图像输入 |
| PyYAML / OmegaConf | 6.0.3 / 2.0.0 | MIT / BSD-3-Clause | OCR 配置读取 |
| Requests 及其传递依赖 | 2.34.2 | Apache-2.0 等 | RapidOCR 运行依赖；选择器运行时不访问网络 |
| colorlog / colorama / tqdm | 6.12.0 / 0.4.6 / 4.70.0 | MIT / BSD-3-Clause / MPL-2.0 与 MIT | OCR 日志与进度依赖 |
| flatbuffers / protobuf / packaging | 25.12.19 / 7.35.1 / 26.2 | Apache-2.0 / BSD-3-Clause / Apache-2.0 或 BSD-2-Clause | ONNX Runtime 传递依赖 |

CPython 的 `LICENSE.txt` 和各 wheel 的 `*.dist-info` 元数据、许可证文件保留在安装包的
`resources/python-runtime` 中。上述项目的版权归各自作者和贡献者所有。

## ChaosRecipeEnhancer

- 项目地址：https://github.com/ChaosRecipeEnhancer/ChaosRecipeEnhancer
- 上游许可证：GNU General Public License version 3
- 用途：本项目的“混沌配方”功能参考了上游项目的仓库物品分类、配方组装和适合背包装载的取件排序思路，并针对 Electron/Vue 与国服接口进行了 JavaScript/Python 重写。

Copyright (c) ChaosRecipeEnhancer contributors.

本项目保留上述来源和版权说明。完整 GPL 许可证见 [LICENSE.md](LICENSE.md)。

## Awakened PoE Trade / Simplified Chinese fork

- 上游项目：https://github.com/SnosMe/awakened-poe-trade
- 国服参考分支：https://github.com/hongchenduzhe/Awakened-PoE-Trade-Simplified-Chinese
- 上游许可证：MIT
- 固定上游提交：`18a401efce4683a274978e3f41ce08ac8948732b`
- 直接采用并适配的文件：`renderer/src/web/price-check/trade/pathofexile-trade.ts`、`renderer/src/web/price-check/filters/create-item-filters.ts`、`renderer/src/web/price-check/filters/create-stat-filters.ts`
- 历史翻译参考：简体中文分支的 `renderer/public/data/zh_CN/items.ndjson` 与 `stats.ndjson`。该分支不再作为当前游戏规则或目录覆盖的权威来源。
- 当前目录来源：Path of Exile 官方国际服 `/api/trade/data/stats` 提供通用 stat ID、类型和查询语义，腾讯国服官方 `/api/trade/data/stats` 与 `/api/trade/data/items` 提供简体中文 matcher 和物品名称；内置快照于 2026-08-11 从这些官方接口刷新，对应 POE1 3.29。
- 用途：国服查价的请求构造采用上游的在线状态、按需过滤组和宽松默认语义；本项目适配当前详细复制格式、腾讯国服端点、简体中文物品模型和官方 stat identifier。

Copyright (c) 2020 Alexander Drozdov.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction, subject to inclusion of the above copyright notice and permission notice in substantial portions.

## Sidekick

- 项目地址：https://github.com/Sidekick-Poe/Sidekick
- 上游许可证：MIT
- 固定数据提交：`deb2455264929447748f1d3d25a1f8d9f5e10628`
- 用途：构建查价目录时读取当前 POE1 繁体中文游戏 stat 描述，并仅按仍存在于官方交易目录的 trade ID 补充游戏剪贴板 matcher；不采用其应用代码或运行时服务。

Copyright (c) 2020 Dominique Alexandre.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction, subject to inclusion of the above copyright notice and permission notice in substantial portions.

## OpenCC / opencc-js

- 项目地址：https://github.com/BYVoid/OpenCC 、https://github.com/nk2028/opencc-js
- 使用版本：`opencc-js@1.4.1`
- 许可证：MIT、Apache-2.0（含词典数据的对应许可）
- 用途：仅在开发期生成查价目录时，把 Sidekick 的繁体中文游戏描述转换为大陆简体中文；不进入 Electron 运行时代码。

## PoEDB 与 Path of Exile 物品美术

- 数据页面：https://poedb.tw/cn/Unique_item
- 用途：构建版本化的简体中文传奇名称、底材与物品图片离线快照。
- 部分 PoEDB 图片地址不可用时，生成器从 `web.poecdn.com` 获取相同的 Path of Exile 官方物品美术资源。

PoEDB 页面仅作为数据来源；物品名称和美术资源的相关权利归其各自权利人所有。本项目不会在应用运行时请求 PoEDB。
