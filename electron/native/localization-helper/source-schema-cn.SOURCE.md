# 国服只读来源结构

`source-schema-cn.json` 来源为 [poe-tool-dev/dat-schema](https://github.com/poe-tool-dev/dat-schema/tree/91e6578a63678faf1b6c980ed0d02a0c6ca5afee)，固定修订 `91e6578a63678faf1b6c980ed0d02a0c6ca5afee`（2026-09-08，`3.29.3`）。上游许可证为 MIT。

生成方式：将该修订的 `dat-schema/` 通过 `git archive` 导出到独立临时目录，使用现有上游 `dist/cli.js` 编译，再从 `schema-poe1.min.json` 保留 `tables` 并附加来源信息；不修改上游工作树，也不对游戏文件写入。

此结构仅用于读取旧版本国服英文与简体文本，以稳定标识和完全相同的英文源文匹配翻译。不得将其用于解析或写入当前 Steam 目标表；目标写入继续使用 `schema.json`。

2026-11-15 只读检查的国服为 `3.29.3b`。该版本的 `BaseItemTypes` 每行 374 字节，当前 Steam 对应表为 373 字节；`GrantedEffects` 为 235/259 字节，`PassiveSkills` 为 354/409 字节，`WorldAreas` 为 662/646 字节，`Mods` 为 654/692 字节。两个版本不能共用单一行结构。此快照验证可读取国服上述表；新版本不匹配时必须拒绝猜测行结构。
