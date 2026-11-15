# 第三方软件与来源说明

本文件随源码和 Windows Release 一同发布。构建所用的精确版本、下载地址和 SHA-256 记录在
[`scripts/runtime/manifest.json`](scripts/runtime/manifest.json) 中；内置运行时也保留各组件随包提供的许可证文本。

## Steam 汉化原生组件

汉化 helper 源码位于 `electron/native/localization-helper`，构建入口为
`scripts/buildLocalizationHelper.ps1`，构建后精确依赖信息记录在
`.runtime/localization-helper/dependencies.json`。翻译热更新不执行下载的程序。

| 组件 | 固定来源 | 许可证 | 用途 |
| --- | --- | --- | --- |
| LibBundle3 | aianlinb/LibGGPK3，v2.7.5，commit `50c2d279b3806366f79e831acc1c03bc35bb6442` | AGPL-3.0-or-later | Steam Bundle 与索引读写 |
| aianlinb.SystemExtensions | NuGet 1.8.0 | MIT | LibBundle3 基础依赖 |
| ooz | powzix/ooz，commit `05038060aa68f9187ae9923b2388ca8db40e58d1` | GPL-3.0-or-later | Kraken/Mermaid/Selkie/Leviathan 等资源解码 |
| PoE dat-schema | poe-tool-dev/dat-schema，commit `9f095ca68ae0c822e4b0d8be3525e0466ddec11d`，schema v7 | MIT | 已固定的 PoE1 数据表结构 |
| PoE dat-schema 国服来源快照 | poe-tool-dev/dat-schema，commit `91e6578a63678faf1b6c980ed0d02a0c6ca5afee`，3.29.3 | MIT | 仅读取旧国服翻译，不用于国际服目标写入 |
| .NET | Microsoft .NET 8，win-x64 自包含运行时 | 随运行时组件许可证 | helper 执行环境 |

LibBundle3 的唯一源码适配是将自建 bundle 路径前缀开放给 helper，使用
`PoEHelper/<generation>/` 隔离。适配过程完整保留在构建脚本中。
`CodecBridge.cpp` 与所链接 ooz 源码通过 GPL-3.0-or-later 提供；生成的
`oo2core.dll` 是本项目自行构建的开源 ABI 适配层，不是私有 Oodle 二进制。
写回使用标准不压缩帧，因此本地候选可能较大；服务器翻译对象仍独立 gzip 压缩。
原生组件附带 `LibBundle3-LICENSE.txt`、`ooz-LICENSE.txt`，可依固定提交和脚本重建源码。
官方语言内容来自维护者已安装的游戏资源；本轮只在内部服务器分发测试数据。

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

## cn-poe-utils

- 版本：0.0.9，作者：me1ting，许可证：MIT。
- 项目：https://github.com/cn-poe-community/cn-poe-utils
- 用途：国服 PoE 1 装备和技能翻译、PoB 构筑转换；在本机执行。
- 额外游戏文本中英映射来自 PoeCharm（Chuanhsing/PoeCharm）；固定提交及文件摘要保存在 `electron/assets/pob-export/compatibility.json`，由 `scripts/generatePobCompatibilityData.py` 提取。转换逻辑仍使用 cn-poe-utils，保留上游消歧规则。

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
- 综合规则固定提交：`91b5a05b14cda3a632a306b5f606ca1cced8b4a9`（Awakened PoE Trade 3.29.102）
- 综合规则适配来源：`renderer/src/web/price-check/filters/pseudo/index.ts`；稳定 stat ref 来源：同一提交的 `renderer/public/data/en/stats.ndjson`
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

## Exile-UI

- 项目地址：https://github.com/Lailloken/Exile-UI
- 上游许可证：MIT
- Map-Tracker 行为参考：日志自动统计与用户显式触发采集的边界、历史表格信息层级。地图实例状态机、区域目录、经验效率、持久化、输入门禁、模板识别及 Electron/Vue 界面均为本项目独立实现；未复制其 AHK 算法、地图映射数据或图标素材。

- 圣所行为参考：按 Client.txt 内部区域 ID 区分四层及编号入口、检测已保存图与当前层的变化。日志事件绑定、进程核验及采集取消为独立实现；未复制其 AHK 实现或素材。
- 圣所房间玩法目录：2026-09-13 核对 Exile-UI `data/english/UI.txt` 的五类速查分类，并与编年史中英文 Rooms 行及社区房型表对应。派生映射位于 `shared/sanctumRoomProfiles.js`；保留小首领、出口、清理守卫、穿越陷阱和竞技场分类及来源，不复制 UI 或图像。

Copyright (c) Lailloken and Exile-UI contributors.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to inclusion of the copyright and permission notice in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## OpenCC / opencc-js

- 项目地址：https://github.com/BYVoid/OpenCC 、https://github.com/nk2028/opencc-js
- 使用版本：`opencc-js@1.4.1`
- 许可证：MIT、Apache-2.0（含词典数据的对应许可）
- 用途：仅在开发期生成查价和物品占位目录时，把繁体中文游戏数据转换为大陆简体中文；不进入 Electron 运行时代码。

## RePoE

- 项目地址：https://github.com/repoe-fork/repoe
- 托管数据：https://repoe-fork.github.io/
- 目录数据版本：POE1 `3.29.3.1.2`
- 上游许可证：MIT；`data` 目录中的游戏数据归 Grinding Gear Games 所有，并受其使用条款约束。
- 用途：仅在开发期生成物品占位目录时读取英文与繁体中文的 `base_items`、繁体中文 `item_classes`、内部记录身份及 `inventory_width` / `inventory_height`；生成结果记录来源版本和 SHA-256，应用运行时不请求 RePoE。

Copyright (c) 2016 brather1ng.

## PoEDB 与 Path of Exile 物品美术

- 数据页面：https://poedb.tw/cn/Unique_item
- Path of Exile 开发者参考：https://www.pathofexile.com/developer/docs/reference
- 用途：构建版本化的简体中文传奇名称、真实属性 matcher、带稳定 `sourceId` 的做装底材与物品图片离线快照；做装通货账单的图标由开发期生成器根据 Path of Exile 官方交易静态目录的 `image` 字段获取并作为本地快照随应用提供。真实属性 matcher 用于区分游戏详细复制中的传奇属性与说明文字，`sourceId` 同时用于生成物品占位目录时与 RePoE 英文底材身份关联。
- 部分 PoEDB 图片地址不可用时，生成器从 `web.poecdn.com` 获取相同的 Path of Exile 官方物品美术资源。

PoEDB 页面和 Path of Exile 官方交易目录仅作为开发期数据/美术来源；物品名称和美术资源的相关权利归其各自权利人所有。本项目不会在应用运行时请求 PoEDB、`web.poecdn.com` 或官方交易目录以显示账单图标。

## PoEDB 圣所数据与用户提供的游戏截图

- 奖励通货美术：按 PoEDB Rewards 表收录 35 种 StackableCurrency，复用原有 13 种通货图标，其余从官方 `web.poecdn.com` 同资源路径获取。具体来源及 SHA-256 见 `electron/assets/sanctum/currency/manifest.json`，开发期生成器为 `scripts/sanctum/generateCurrencyIcons.js`；运行时识别与卡片绘制均使用本地资源。

- 来源：[圣所数据表](https://poedb.tw/cn/Sanctum_league)、[遗物目录](https://poedb.tw/cn/Relics)及其中七种底材详情页；具体 URL、采集时间和 SHA-256 保存在 `electron/assets/sanctum/catalog.json`。
- 用途：开发期生成离线名称、底材尺寸、词缀数值和传奇限制目录。未复制社区 Wiki 历史正文或外部项目代码。游戏数据和截图的相关权利归各自权利人。
- 识别样本由用户提供，裁剪范围与缺失的环境信息记录在 `test/fixtures/sanctum/supplied-samples.json`；首领图形模板的具体来源见 `src/assets/sanctum/README.md`。
- 运行时解析、回放和评分不请求上述站点。已核对数据和未支持效果分别标记，不将旧赛季或 PTR 数据自动当成当前规则。

## PoB 启动助手的 ZIP 依赖及下载来源

- yauzl 2.10.0：MIT，https://github.com/thejoshwolfe/yauzl ，用于解压前检查归档路径和文件类型（含构建期内置运行时准备）。
- PoeCharm：https://github.com/Chuanhsing/PoeCharm ，用户主动安装或更新时下载官方提交归档。
- Path of Building Community：https://github.com/PathOfBuildingCommunity/PathOfBuilding ，用户主动安装或更新时下载官方稳定版 Portable 资产。
- 两个外部工具不随助手打包，保留下载归档中的许可证及说明文件。

## 原生市集翻译组件

- MinHook 1.3.4：https://github.com/TsudaKageyu/minhook ，固定提交 `c3fcafdc10146beb5919319d0683e44e3c30d537`，BSD 2-Clause。用于已实测 Windows x64 游戏版本的原生调用挂钩，完整许可随组件提供为 `MinHook-LICENSE.txt`。
- nlohmann/json 3.11.3：https://github.com/nlohmann/json ，MIT。用于市集目录和查询 JSON 的解析，完整许可随组件提供为 `nlohmann-json-LICENSE.txt`。
- 游戏目录名称与词缀按项目现有中文交易目录、受管资源及官方语言数据对齐；其游戏数据权利归 Grinding Gear Games 等相应权利人。第三方市集程序仅用于研究机制，不随本项目分发，不作为运行依赖，未复制其二进制或整套词库。
