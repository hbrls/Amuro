# WORKSHOP-002 · 服务端 Identity Cluster 架构

> updated_by: Codex - GPT-5
> updated_at: 2026-06-15 15:54:41

## 核心小结

DeviceId 应是服务端维护的 identity cluster，用于表达一组 observation、anchor、profile 和 match decision 在当前策略下形成的同设备判断。

FingerprintObservation 是不可变 evidence。系统目标是基于锚点、环境证据、历史 profile、质量门控和策略上下文完成同设备概率判断。

## 有效结论

- Observation 必须 append-only，不能被原地覆盖或事后改写。
- Anchor 需要记录 type、value_hash、scope、source、confidence、first_seen、last_seen 和 conflict_count。
- DeviceProfile 表达历史特征分布和锚点状态，而不是某一次采集的静态快照。
- DeviceMatch 必须记录 raw_score、calibrated_probability、decision、model_version、calibration_version、threshold_policy_id 和 explanation。
- 锚点冲突、低质量采集、模拟器、root、hook、重打包等场景应进入 uncertain 或 rejected。
- 合规、字段 allowlist、purpose gating、retention、deletion、opt-out 是字段进入检索、评分和审计之前的前置能力。
- SDK 只负责采集 observation 和上送 evidence，最终 DeviceId 由服务端策略判断生成或维护。

## 核心对象

### FingerprintObservation

- 语义：一次采集上送形成的不可变 evidence。
- 特性：append-only、可审计、可重放、可追溯采集环境和策略上下文。
- 作用：为后续 retrieval、scoring、calibration、decision 和 audit 提供原始事实基础。

### Anchor

- 语义：具备一定稳定性和区分度的锚点 evidence。
- 必要字段：type、value_hash、scope、source、confidence、first_seen、last_seen、conflict_count。
- 处理原则：锚点可以高权重召回，但不能无条件成为永久真值；冲突必须显式记录并影响 decision。

### DeviceProfile

- 语义：服务端维护的历史特征分布和锚点状态。
- 作用：承载设备长期画像、锚点生命周期、特征漂移、异常状态和可重算基础。
- 边界：不是单次 observation 的复制，也不是不可变身份结论。

### DeviceMatch

- 语义：一次匹配判断的可审计结果。
- 必要字段：raw_score、calibrated_probability、decision、model_version、calibration_version、threshold_policy_id、explanation。
- 作用：记录为什么匹配、为什么拒绝、为什么进入 uncertain，并支持后续策略回放和模型重算。

## Decision 原则

- 强锚点一致可以进入高置信候选，但仍需质量门控、冲突检测和策略判断。
- 锚点缺失时允许降级召回，但必须降低置信度并依赖更多辅助 evidence。
- 锚点冲突时优先进入 uncertain 或 rejected，不能直接强合并。
- 低质量 observation、异常环境、疑似伪造或被篡改环境，应降低权重或拒绝进入主路径。
- 所有 match decision 都必须保留 model version、calibration version、policy 和 explanation，避免不可解释归因。

## 架构取舍

- 服务端 identity cluster 需要支持合并、拆分、重算和审计。
- 分层 evidence 可以保留可解释性并降低误合并风险。
- raw score + calibrated probability + decision policy 可以使阈值和策略独立演进。
- uncertain lifecycle 可以为人工复核、后续 observation 补证和策略回放保留空间。

## 后续方向

优先建设 anchor retrieval、降级召回、分层评分、概率校准、decision policy、uncertain lifecycle 和审计闭环。

下一步应继续冻结 observation schema、policy context、field state、anchor conflict、quality gate，以及各字段进入 retrieval、scoring、audit 前的 purpose gating 规则。
