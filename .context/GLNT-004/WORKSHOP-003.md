# WORKSHOP-003 · FingerprintObservation 上送 Schema

> updated_by: Codex - GPT-5
> updated_at: 2026-06-15 15:54:41

## 核心小结

本文件保留 Phase 2 第一版 FingerprintObservation 上送维度的阶段性结论。

MVP 应以 anchor evidence、quality 和 policy 为中心。FingerprintObservation 的职责是把一次采集形成的 evidence、字段状态、策略上下文和质量信息完整上送，为后续 retrieval、scoring、decision、audit 提供可解释、可追溯、可重算的输入。

所有字段进入 retrieval、scoring 或 audit 前必须通过 purpose gating。

## 推荐维度

- observation_meta
- policy_context
- anchor_evidence
- environment_evidence
- runtime_fingerprint_evidence
- request_context
- quality_evidence

## 必选字段边界

- meta：observation id、采集时间、SDK 版本、App 版本、平台类型、schema version 等基础元信息。
- policy：采集目的、策略版本、字段 allowlist、授权状态、purpose gating 结果。
- platform base：Android 版本、API level、设备基础平台信息，以及字段可用性状态。
- environment base：运行环境、WebView / native capability 基础状态、网络粗粒度环境。
- quality base：采集完整度、失败原因、异常标记、可信度基础评分。
- field state：每个字段的 available、missing、denied、unsupported、failed、redacted 等状态。

## 条件必选字段边界

- Android ID / SSAID：作为 Android 主锚点候选，需要记录 scope、source、value_hash、可用性和质量状态。
- MediaDrm：作为强 evidence 候选，必须先确认合规、兼容性和失败降级策略。
- server token：表达安装周期或 App scope 连续性，不能等同于最终 DeviceId。
- install evidence：安装时间、重装迹象、升级路径等可用于解释锚点变化的辅助 evidence。
- runtime clusters：WebView / runtime 指纹聚类信息，用于辅助校验、降级召回和异常解释。
- account / session：仅在目的和授权允许时作为上下文 evidence，不应无条件进入身份主路径。
- coarse network：仅允许粗粒度网络上下文，不能采集精细网络标识。
- reinstall context：用于解释卸载重装、数据清除、迁移恢复等状态变化。

## 可选字段边界

- locale：语言、区域等低风险环境信息。
- display detail：屏幕尺寸、密度、方向等展示能力信息。
- native capability：系统能力、传感器能力位图、WebView 能力位图等非高风险能力信息。
- request metadata：请求来源、链路、服务端接收上下文等审计辅助信息。
- risk flags：emulator、hook、root、proxy 等风险标记。

## 禁止字段边界

- IMEI、MEID、设备序列号。
- MAC、Wi-Fi BSSID / SSID、蓝牙硬件标识。
- 通讯录、短信、相册、文件列表、已安装 App 列表。
- 精确位置、剪贴板、输入内容、页面内容。
- 原始高频传感器数据。
- 未哈希 PII。
- 广告标识作为身份主键。

## 建模原则

- 字段缺失必须被显式建模，不能与空值、失败或拒绝授权混淆。
- anchor evidence 与 runtime fingerprint evidence 必须分层表达，保留可解释、可审计、可重算的 evidence 结构。
- quality evidence 应参与检索和评分前的门控，避免低质量 observation 污染 profile。
- policy_context 应记录字段采集和字段使用的策略依据，支持后续审计和删除。
- request_context 只能作为解释和审计辅助，不应反向污染设备身份判断。

## 后续方向

冻结 schema、field state、policy context、anchor conflict 和 quality gate。

下一步需要明确每个字段的 source、scope、retention、purpose、hash/redaction 规则、失败语义，以及进入 anchor retrieval、layered scoring、decision policy、audit 前的门控条件。
