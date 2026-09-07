# Design: separate-templates-by-runtime-mode

## Context

模板写入路径只有两处，均收敛在主进程：

- 框选保存：`electron/modules/ipc/bag.js` `capture-bag-template` handler → `savePngAtomically`（`electron/modules/bag/templateCapture.js`）
- 手动上传：同文件 `upload-bag-template` handler，由 `assertBagTemplateTarget(type)` 的白名单文件名推导目标名（保留用户扩展名）

`templateCapture.js` 是纯 Node 模块（无 Electron 依赖，文件系统可注入），现有测试在 `test/screenRegionPicker.test.js`。所有下游消费者（stashPickup、junfeng、chaosRecipe 的运行时配置及 Python 脚本）只读取 LocalStorage 下发的绝对路径，不感知文件名。动机见 proposal.md。

## Goals / Non-Goals

**Goals:**

- 框选与上传两条写入路径按 `app.isPackaged` 解析出互不冲突的目标文件名
- 安装版文件名与现状完全一致（既有安装版用户零迁移、零感知）
- 保持 `templateCapture.js` 的纯模块可测性

**Non-Goals:**

- 不改变 LocalStorage 元数据结构、模板校验逻辑（尺寸/显示环境校验）
- 不迁移/重命名既有模板文件
- 不处理单实例锁互斥（维持现状）
- 不改变 Python 脚本与各 IPC 消费者

## Decisions

### D1：新增 `resolveTemplateFileName(fileName, isPackaged = true)`，默认值为打包模式

`templateCapture.js` 中新增导出函数：`isPackaged` 为真时原样返回白名单文件名；否则在 `path.extname` 前插入 `.dev`。`assertBagTemplateTarget(type, isPackaged = true)` 与 `savePngAtomically(..., isPackaged = true)` 透传该参数。

- **为什么默认 `true`**：默认产生安装版文件名，任何遗漏传参的调用点退化为现状行为而非破坏安装版；唯一的两个生产调用点（bag.js 两个 handler）显式传入 `app.isPackaged`。
- **为什么不用 `app.isPackaged` 直接 import 进模块**：会破坏 `templateCapture.js` 的纯 Node 可测性（现有测试以注入 fileSystem 方式运行，不加载 Electron）。
- **备选被否决**：在 `BAG_TEMPLATE_TARGETS` 中存两套文件名（map 值改为对象）——改动面更大，白名单语义变复杂；为目录整体换 dev 专用目录——偏离共享目录设计且使预览/排障路径不直观。

### D2：临时文件与备份文件名随目标文件名自然派生

`savePngAtomically` 内部临时/备份文件名已基于解析后的 `fileName` 拼接，无需额外改动；dev 模式的临时文件为 `.stash_title.dev.png.<token>.tmp` 形态。

### D3：上传路径复用同一解析结果

`upload-bag-template` 现有逻辑 `path.basename(assertBagTemplateTarget(type), '.png') + ext` 改为基于 `assertBagTemplateTarget(type, app.isPackaged)` 推导，保证与框选保存落点一致。

### D4：安全边界不变

白名单校验仍以 `BAG_TEMPLATE_TARGETS` 的键（type）为准，文件名始终由白名单值派生，`.dev` 后缀不引入路径遍历面；`assertBagTemplateTarget` 对非法 type 的拒绝行为不变。

## Risks / Trade-offs

- [开发版旧配置指向旧文件名，升级后校验失败一次] → 符合 `stable-user-data` 禁止迁移的既有边界，重新框选一次即可；错误文案已有（"模板尺寸与采集记录不一致"）。
- [未来新增模板目标时可能遗漏传参] → `isPackaged` 默认 `true`，遗漏退化为安装版行为；新增目标时白名单 map 仍是唯一事实来源。
- [两版模板内容各自独立后，同屏对比时可能困惑"为何两版截图不同"] → 这正是本次修复的目的；文件名后缀自解释来源。

## Migration Plan

无数据迁移。安装版行为不变；开发版首次运行后需对仓库/背包/君锋标题模板各重新框选一次。回滚：还原代码即可，dev 文件残留在共享模板目录中无副作用。

## Open Questions

（无）
