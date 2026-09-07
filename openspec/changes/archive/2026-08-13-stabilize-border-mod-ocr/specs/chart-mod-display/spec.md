## MODIFIED Requirements

### Requirement: 外边缘悬停显示边框词缀
系统 SHALL 在最优方案卡片 12 段外边缘悬停时显示对应边框词缀文本;未识别的边缘 MUST 显示未知,并在本次识别存在非空 `rawTexts` 时附带 OCR 原文以供诊断。

#### Scenario: 悬停已识别边缘
- **WHEN** 鼠标悬停在已识别词缀的外边缘段上
- **THEN** 浮层显示该边缘的边框词缀文本

#### Scenario: 悬停有原文的未知边缘
- **WHEN** 鼠标悬停在标记为未知且存在非空 `rawTexts` 的外边缘段上
- **THEN** 浮层显示「词缀：未知」及本次 OCR 原文

#### Scenario: 悬停无原文的未知边缘
- **WHEN** 鼠标悬停在标记为未知且 `rawTexts` 为空的外边缘段上
- **THEN** 浮层仅显示「词缀：未知」,不得显示伪造或上一次识别的文本
