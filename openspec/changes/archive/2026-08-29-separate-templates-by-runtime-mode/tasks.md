# Tasks: separate-templates-by-runtime-mode

## 1. 模板文件名模式感知解析

- [x] 1.1 在 `electron/modules/bag/templateCapture.js` 新增 `resolveTemplateFileName(fileName, isPackaged = true)`：打包模式原样返回，开发模式在扩展名前插入 `.dev` 后缀
- [x] 1.2 为 `assertBagTemplateTarget(type, isPackaged = true)` 与 `savePngAtomically(..., isPackaged = true)` 增加透传参数，保存与临时/备份文件名随解析结果派生，非法 type 拒绝行为不变

## 2. 写入路径接入运行模式

- [x] 2.1 `electron/modules/ipc/bag.js` `capture-bag-template` handler 调用 `savePngAtomically` 时传入 `app.isPackaged`
- [x] 2.2 `electron/modules/ipc/bag.js` `upload-bag-template` handler 基于 `assertBagTemplateTarget(type, app.isPackaged)` 推导上传目标文件名，保留用户文件原始扩展名

## 3. 测试

- [x] 3.1 更新 `test/screenRegionPicker.test.js` 既有断言：默认（打包模式）文件名保持 `stash_title.png` 等不变
- [x] 3.2 补充用例：开发模式框选保存写入 `stash_title.dev.png` 且不改动同名无后缀文件；临时/备份文件名跟随；`resolveTemplateFileName` 对非法 type 与各白名单目标的输出
- [x] 3.3 运行 `node --test test/screenRegionPicker.test.js`，通过后再运行 `npm test`

## 4. 规范校验

- [x] 4.1 运行 `openspec validate separate-templates-by-runtime-mode --strict` 通过
