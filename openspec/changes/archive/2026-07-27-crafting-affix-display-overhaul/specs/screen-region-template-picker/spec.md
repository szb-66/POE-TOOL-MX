## ADDED Requirements

### Requirement: 模板保存结果使消费者缓存失效
系统 SHALL 在模板成功替换后返回变化版本，并使渲染层预览与运行态识别器立即放弃旧模板缓存。

#### Scenario: 同路径覆盖模板
- **WHEN** 用户将新截图保存到已有模板路径
- **THEN** 预览 URL 使用新版本加载且识别器重新读取该文件
