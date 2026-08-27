# WORKSHOP-001 · 稳定 ID 与整体 Hash 方案判断

> updated_by: Codex - GPT-5
> updated_at: 2026-06-15 15:54:41

## 核心判断

Android 设备识别不应尝试稳定 ID 方案，也不应尝试整体 hash 方案。

这两个方向不进入后续架构讨论主线。后续讨论直接围绕系统锚点、服务端 evidence / profile、概率判断、冲突处理、uncertain lifecycle 和审计约束展开。

## 保留边界

- SDK 负责采集并上送 observation / evidence，不负责生成最终身份结论。
- 安装周期内的本地缓存只能用于减少重复采集或提升读取效率，不能承担身份语义。
- WebView / runtime 信号只能作为辅助 evidence，用于辅助校验、降级召回、异常解释和概率匹配。
- 锚点应作为独立 evidence 分层建模，不应混成单个不可解释的整体结果。
- 锚点一致仍需经过质量门控、冲突检测和策略判断，不能无条件视为永久真值。

## 后续方向

继续推进 anchor retrieval、降级召回、分层评分、概率校准、decision policy、uncertain lifecycle 和审计闭环。
