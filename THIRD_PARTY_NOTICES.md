# 第三方软件与来源说明

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
- 用途：国服查价的请求构造直接采用上游的在线状态、按需过滤组和宽松默认语义；本项目仅改为 JavaScript，并适配腾讯国服端点、简体中文物品模型和官方 stat identifier。

Copyright (c) 2020 Alexander Drozdov.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction, subject to inclusion of the above copyright notice and permission notice in substantial portions.

## PoEDB 与 Path of Exile 物品美术

- 数据页面：https://poedb.tw/cn/Unique_item
- 用途：构建版本化的简体中文传奇名称、底材与物品图片离线快照。
- 部分 PoEDB 图片地址不可用时，生成器从 `web.poecdn.com` 获取相同的 Path of Exile 官方物品美术资源。

PoEDB 页面仅作为数据来源；物品名称和美术资源的相关权利归其各自权利人所有。本项目不会在应用运行时请求 PoEDB。
