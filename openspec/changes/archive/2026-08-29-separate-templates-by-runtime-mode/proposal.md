# Proposal: separate-templates-by-runtime-mode

## Why

开发版与安装版共享 `%APPDATA%/流放助手` 用户数据目录（`stable-user-data` 规范的设计），但模板 PNG 以固定文件名（如 `stash_title.png`）存放在共享的 `templates` 目录，而两版渲染进程 origin 不同（`http://localhost:3000` vs `file://`）导致 LocalStorage 中各自的采集元数据互相隔离。任一版本重新框选模板都会覆盖共享 PNG，另一版本的旧元数据随即与磁盘文件不一致，启动校验报"模板尺寸与采集记录不一致"或匹配分数骤降——用户未做任何修改，模板"突然不能用"。

## What Changes

- 模板 PNG 保存文件名按运行模式区分：安装版保持现有固定文件名（`stash_title.png` 等，既有用户零影响）；开发版在扩展名前插入 `.dev` 后缀（如 `stash_title.dev.png`）
- 框选保存（`savePngAtomically`）与手动上传模板两条写入路径统一走同一模式感知的文件名解析
- 不迁移既有文件：开发版中已指向旧文件名的模板配置会失效一次，重新框选即可（符合 `stable-user-data` 规范"禁止迁移旧数据"的边界）；安装版用户无感知
- 下游消费者（stashPickup、junfeng、chaosRecipe、Python 脚本）均从配置读取绝对路径，无需改动

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `screen-region-template-picker`: "受限模板保存"需求的行为变化——模板保存目标文件名 SHALL 依据运行模式区分，开发版与安装版在共享 `templates` 目录中各自维护独立的模板文件，互不覆盖

## Impact

- `electron/modules/bag/templateCapture.js`：新增模式感知的文件名解析；`savePngAtomically` 传递运行模式
- `electron/modules/ipc/bag.js`：`upload-bag-template` 与 `capture-bag-template` 两个 handler 传入 `app.isPackaged`
- `test/screenRegionPicker.test.js`：既有断言适配，并补充开发版后缀用例
- 不影响：模板校验逻辑（尺寸/显示环境校验基于 LocalStorage 中的绝对路径与元数据，天然指向各自文件）、Python 脚本、其余 IPC 消费者
