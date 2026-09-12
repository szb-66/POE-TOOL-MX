## 1. 样本入库

- [x] 1.1 从会话数据库导出三张截图为 `test/fixtures/sanctum/status-dark-base.png`、`status-dark-rewards-hover.png`、`status-dark-afflictions-hover.png`，验证文件尺寸为 2000×1088 且 PNG 完整可解码
- [x] 1.2 新增 evidence md 记录样本来源（用户提供的暗场景真实基线/悬停截图、剪贴板转存尺寸、无原生 3840 帧），并说明回放噪声边界

## 2. 定位算法修复

- [x] 2.1 `sanctum_tooltip.py` plain 分支：以基线变暗掩码（before−gray 差分）为候选源，横向闭运算跨文字孔洞，保留尺寸/位置/邻近门槛；用三张真实样本离线回放验证两图标点均产生候选
- [x] 2.2 将候选完整性门槛由 delta>28 均值改为矩形内变暗覆盖率，按回放标定阈值；验证浮窗外噪声区域（覆盖率约 0.04）不成为候选
- [x] 2.3 放宽 changed_panel_boundary 低对比边带判定（阈值或边带宽度按面板尺寸派生），验证真实浮窗矩形通过、合成错误裁剪矩形（339×149）仍被拒绝
- [x] 2.4 清理修复过程中的失败尝试代码，确认无残留

## 3. 回归测试

- [x] 3.1 新增暗场景回放测试：两浮窗 × 1920/2560/3072/3840 四宽度定位成功，裁剪 OCR 分流为 5 条次要痛苦与 3 项本轮待领奖励（工匠石 60、改造石 30、混沌石 14），icon_candidates 复现入口坐标
- [x] 3.2 旧用例全绿：sanctumRewardTooltipLocation、sanctumEffectCrop、sanctumEffectRecognition、sanctumStatusRewards、sanctumDynamic 受影响文件通过，随后 npm test 全量通过
- [x] 3.3 OpenSpec 严格校验通过，改动范围限于 sanctum_tooltip.py、fixtures 与测试文件

## 4. 现场验收

- [ ] 4.1 开发版重采状态栏：两个图标浮窗均读出内容，错误列表清空；结果截图与识别条目一致
