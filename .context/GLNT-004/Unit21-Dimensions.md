# C-017 · Unit21 未实现维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-26 19:04:14
>
> 视角：Unit21 厂商 LENS
> 来源：TASK-017
> 当前口径：以 `DeviceInfoRepository` 的实际实现为准，删除已实现字段，仅保留未实现字段、服务端衍生能力和公开资料缺口。

---

## 0. 整理口径

`DeviceInfoRepository` 已实现以下字段族，因此本文不再把这些字段作为 Unit21 缺口保留：

- `BuildInfo` 中的品牌、型号、厂商、设备代号、产品名、Android 版本、SDK 版本、主板、硬件、显示版本、Build fingerprint、Build ID、Serial。
- `RomInfo` 中的主流厂商 ROM system property，包括 MIUI / HyperOS / EMUI / Magic / OPPO / OnePlus / Realme / Vivo / OneUI / Flyme / Smartisan / LeTV / Lenovo / Nubia / Oxygen / Harmony 相关属性。
- `IdentifierInfo` 中的 OAID、Android ID / SSAID、GAID、Widevine Device ID。
- `TelephonyInfo` 中的 IMEI / MEID 合并读取、IMSI、ICCID、MSISDN、本机号码、SIM / Network operator、SIM state、SIM operator name。

Unit21 公开材料没有逐项公开 Android SDK 字段清单，只公开了 `deep device and behavioral signals`、rooted devices、VPNs、tampered browsers、bots、account farms、mule networks、Device Risk Score 和 Fraud Consortium 等能力。因此，本文不把基础 Build / ROM / Identifier / Telephony 字段重复列为缺口，只保留当前代码没有等价实现的风险检测、评分、图谱和决策能力。

不保留 iOS-only 字段作为 Android 实现缺口。

---

## 1. Unit21 产品定位

Unit21 定位为 Agentic AI Platform for Fraud & AML Operations，核心是把设备信号、行为信号、交易、账号历史、欺诈类型和跨客户情报放进统一风控与 AML 工作流，而不是提供单一 Android 设备指纹字段表。

核心能力分为六层：

| 层级 | 公开表达 | 与当前实现的差异 |
|------|----------|------------------|
| Device Intelligence | deep device and behavioral signals | 当前没有 Unit21 SDK 或深度设备 / 行为信号采集 |
| Device Risk Score | transparent 0-100 Device Risk Score，score composition visible | 当前没有 0-100 设备风险评分和分数组成解释 |
| Risk Environment | rooted devices、VPNs、tampered browsers、bots、account farms、mule networks | 当前没有 root、VPN、浏览器篡改、bot、账号农场、mule network 检测 |
| Fraud Consortium | 80M+ US adults shared intelligence network | 当前没有跨客户匿名风险网络 |
| AI Agents | Detection Agent、Investigation Agent、learn from outcomes and analyst feedback | 当前没有 AI Agent 检测、调查和反馈学习 |
| Real-Time Monitoring | sub-250ms latency，block / step-up / alert / monitor | 当前没有实时风控阻断和决策动作输出 |

与 `DeviceInfoRepository` 的差异在于：`DeviceInfoRepository` 当前主要采集 Android 本地基础标识、Build / ROM / Telephony 字段；Unit21 的差异化集中在可解释 Device Risk Score、跨客户 Fraud Consortium、AI Agent 调查与检测、规则引擎集成、案件管理、mule / account farm / fraud ring 识别和实时决策动作。

---

## 2. Android / Mobile 接入方式

Unit21 公开材料中的接入形态：

| 形态 | 说明 |
|------|------|
| Android SDK | lightweight SDK across web、iOS、Android、hybrid environments |
| Web / Hybrid SDK | 与 mobile SDK 并列，用于 Web、H5、WebView 或混合场景 |
| Signal triggers | login、signup、transaction events 触发采集 |
| Encrypted ingestion | device signals 加密后实时传输到 Unit21 |
| Device Risk Score | 服务端生成透明 0-100 分 |
| Rule Builder integration | device signals 和 risk score 直接进入规则引擎 |
| Case workflow integration | 每个 device event 进入 case management，可关联账号与活动 |
| Decision actions | block、step-up authentication、alert、monitor |

当前 `DeviceInfoRepository` 没有接入 Unit21 SDK，也没有加密上送、规则引擎、案件管理、跨 Web / Mobile 设备关联或决策动作回传。

---

## 3. 未实现字段清单

### 3.1 Device Intelligence 与 Device Risk Score

| 维度 | Unit21 公开表达 | 当前实现状态 | 备注 |
|------|-----------------|--------------|------|
| Deep device signals | deep device signals | 未实现 | 当前只读取基础字段，没有 Unit21 深度信号集合 |
| Behavioral signals | behavioral signals | 未实现 | 当前没有行为采集 |
| Device Risk Score 0-100 | clear, explainable Device Risk Score | 未实现 | 当前没有 Unit21 设备风险评分 |
| Glass-box score composition | score composition is visible, auditable | 未实现 | 当前没有字段贡献度或评分解释 |
| Device event logging | every device event is logged inside case management | 未实现 | 当前没有设备事件日志进入案件系统 |
| Raw signal review | analysts can review raw signals | 未实现 | 当前没有可审计 raw evidence 输出 |
| Linked activity context | linked activity and enriched account data | 未实现 | 当前没有设备事件与账号活动关联 |

### 3.2 风险环境与异常态

| 维度 | Unit21 公开表达 | 当前实现状态 | 备注 |
|------|-----------------|--------------|------|
| Rooted device | rooted devices | 未实现 | 当前没有 root 文件、包、属性、Magisk 或可写目录检测 |
| VPN detection | VPNs | 未实现 | 当前没有 VPN / 代理 / 网络匿名化识别 |
| Tampered browser | tampered browsers | 未实现 | 当前没有浏览器、WebView 或 JS 环境篡改检测 |
| Bot detection | bots | 未实现 | 当前没有 bot / automation 行为检测 |
| Account farm detection | account farms | 未实现 | 当前没有账号农场检测 |
| Mule network detection | mule networks | 未实现 | 当前没有 mule network 风险图谱 |
| High-risk device / suspicious network | high-risk device or suspicious network | 未实现 | 当前没有设备风险与网络风险联合判断 |

### 3.3 使用场景与行为风险

| 维度 | Unit21 公开表达 | 当前实现状态 | 备注 |
|------|-----------------|--------------|------|
| Account takeover | compromised accounts when behavior changes | 未实现 | 当前没有 ATO 风险模型 |
| High-risk signup | first risk signal before transaction history exists | 未实现 | 当前没有注册前设备风险评分 |
| Synthetic identity | high-risk signup & synthetic identity | 未实现 | 当前没有合成身份风险关联 |
| Rapid-fire fraud | abnormal transaction frequency | 未实现 | 当前没有快速交易 / 批量事件风险 |
| Velocity-based fraud | structuring behavior and rapid-value spikes | 未实现 | 当前没有 velocity 风险模型 |
| Fraud ring | hidden connections across accounts | 未实现 | 当前没有跨账号团伙图谱 |
| Dormant account reactivation | inactive account wakes up on risky device | 未实现 | 当前没有沉睡账号唤醒风险检测 |

### 3.4 服务端图谱、AI Agent 与合规工作流

| 维度 | Unit21 公开表达 | 当前实现状态 | 备注 |
|------|-----------------|--------------|------|
| Fraud Consortium | shared intelligence network covering 80M+ adults | 未实现 | 当前没有跨客户匿名情报 |
| Identity Graphing | graph analysis connects entities | 未实现 | 当前没有 device / account / transaction / entity 图谱 |
| Cross-Entity Link Analysis | linked entities and hidden relationships | 未实现 | 当前没有跨实体链接分析 |
| Real-Time Monitoring | sub-250ms latency | 未实现 | 当前没有亚 250ms 实时监控链路 |
| Adaptive Risk Scoring | adaptive risk scoring | 未实现 | 当前没有动态评分 |
| AI Agent for Detection | analyzes alerts, transactions, behavioral signals | 未实现 | 当前没有检测 Agent |
| AI Agent for Investigation | summarizes risks, generates case narratives | 未实现 | 当前没有调查 Agent |
| Configurable AI | configurable AI | 未实现 | 当前没有客户可配置 AI 策略 |
| Customer Risk Rating | activity, device signals, sanctions, network associations | 未实现 | 当前没有客户风险评级 |
| Continuous Compliance Monitoring | continuous monitoring ensures ongoing compliance | 未实现 | 当前没有持续合规监控 |
| SAR / STR / CTR pre-population | AI agents pre-populate regulatory filings | 未实现 | 当前没有合规报告自动生成 |

### 3.5 决策动作与业务系统集成

| 维度 | Unit21 公开表达 | 当前实现状态 | 备注 |
|------|-----------------|--------------|------|
| Block action | trigger actions: block | 未实现 | 当前没有阻断动作输出 |
| Step-up authentication | step-up authentication | 未实现 | 当前没有升阶验证动作 |
| Alert action | alert | 未实现 | 当前没有告警动作 |
| Monitor action | monitor | 未实现 | 当前没有监控动作 |
| Rule Builder native integration | signals flow directly into Rule Builder | 未实现 | 当前没有规则构建器集成 |
| Case workflow native integration | case workflows automatically | 未实现 | 当前没有案件工作流 |
| Transaction / KYC enrichment | combine with transaction or KYC data | 未实现 | 当前没有交易或 KYC 数据融合 |

---

## 4. 公开资料缺口

Unit21 公开材料能确认 Android / Web / hybrid SDK、6 类风险信号、0-100 Device Risk Score、Fraud Consortium、AI Agents 和实时决策动作，但没有公开 Android SDK 字段 schema。以下缺口应作为后续是否实现的追问项。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | Android SDK 具体字段清单 | 决定 deep device signals 是否包含 Android ID、GAID、OAID、Build、MediaDrm、Keystore、sensor |
| Q-2 | Behavioral signals 明细 | 决定是否包含触控、输入节奏、页面停留、传感器、失败登录速度 |
| Q-3 | Rooted device evidence | 决定是否检查 su、Magisk、Zygisk、Xposed、Frida、Substrate、可写目录 |
| Q-4 | VPN / suspicious network 检测方法 | 决定是否需要本地 VPN 状态、代理、IP reputation 或服务端网络画像 |
| Q-5 | Tampered browser 范围 | 决定覆盖 Web、H5、WebView、JS tampering、header spoofing 还是浏览器扩展 |
| Q-6 | Bot / account farm / mule network 的 reason code | 决定客户是否能解释具体触发原因 |
| Q-7 | Device Risk Score 0-100 的字段贡献度 | 决定 glass-box score composition 是否能落到字段级证据 |
| Q-8 | Fraud Consortium 合并规则 | 决定跨客户匿名信号如何影响设备和账号风险 |
| Q-9 | SDK 加密和传输保护细节 | 决定是否包含白盒加密、证书 pinning、消息签名或每设备密钥 |
| Q-10 | Web / Android / hybrid 的设备关联方式 | 决定 WebView、H5、App-to-Web 场景是否需要统一 device token |
| Q-11 | Real-Time Monitoring sub-250ms SLA 边界 | 决定是否包含 SDK 网络、服务端评分和动作回传 |
| Q-12 | AI Agents 是否返回机器可读决策结果 | 决定 Android 或服务端能否获得 allow / review / deny / step-up |
| Q-13 | Customer Risk Rating 的 device signal 权重 | 决定设备信号如何进入长期客户风险画像 |
| Q-14 | Mule network 与 fraud ring 的图谱阈值 | 决定图节点、边和聚类规则是否可解释 |

---

## 5. 当前结论

按 `DeviceInfoRepository` 当前实现，Unit21 公开材料中与品牌、型号、厂商、Android 版本、SDK 版本、ROM 属性、OAID、Android ID、GAID、Widevine、IMEI / MEID、IMSI、ICCID、运营商相关的本地基础字段不再作为缺口保留。

当前仍有价值的 Unit21 缺口集中在五类：

1. Device Intelligence 与评分：deep device signals、behavioral signals、0-100 Device Risk Score、glass-box score composition、device event logging、raw signal review。
2. 风险环境：rooted device、VPN、tampered browser、bot、account farm、mule network、high-risk device / suspicious network。
3. 使用场景：ATO、high-risk signup、synthetic identity、rapid-fire fraud、velocity fraud、fraud ring、dormant account reactivation。
4. 服务端图谱与 AI：Fraud Consortium、Identity Graphing、Cross-Entity Link Analysis、Real-Time Monitoring、Adaptive Risk Scoring、AI Agent for Detection / Investigation、Customer Risk Rating、Continuous Compliance Monitoring。
5. 决策与集成：block、step-up、alert、monitor、Rule Builder、Case workflow、transaction / KYC enrichment。
