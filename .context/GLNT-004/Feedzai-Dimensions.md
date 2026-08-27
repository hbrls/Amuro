# C-016 · Feedzai 未实现维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-26 18:58:12
>
> 视角：Feedzai 厂商 LENS
> 来源：TASK-016
> 当前口径：以 `DeviceInfoRepository` 的实际实现为准，删除已实现字段，仅保留未实现字段、服务端衍生能力和公开资料缺口。

---

## 0. 整理口径

`DeviceInfoRepository` 已实现以下字段族，因此本文不再把这些字段作为 Feedzai 缺口保留：

- `BuildInfo` 中的品牌、型号、厂商、设备代号、产品名、Android 版本、SDK 版本、主板、硬件、显示版本、Build fingerprint、Build ID、Serial。
- `RomInfo` 中的主流厂商 ROM system property，包括 MIUI / HyperOS / EMUI / Magic / OPPO / OnePlus / Realme / Vivo / OneUI / Flyme / Smartisan / LeTV / Lenovo / Nubia / Oxygen / Harmony 相关属性。
- `IdentifierInfo` 中的 OAID、Android ID / SSAID、GAID、Widevine Device ID。
- `TelephonyInfo` 中的 IMEI / MEID 合并读取、IMSI、ICCID、MSISDN、本机号码、SIM / Network operator、SIM state、SIM operator name。

Feedzai 公开材料提到 device intelligence、OS and browser、device metadata、IP address、behavioral biometrics、network and threat intelligence 等类别。已由当前代码覆盖的基础标识、Build / ROM / Telephony 字段不再作为缺口保留；未公开到 Android API 级别的基础字段不强行扩展为已确认字段。

不保留 iOS-only 字段作为 Android 实现缺口；例如 jailbreak 只作为跨平台语境出现，不列入 Android 待实现字段。

---

## 1. Feedzai 产品定位

Feedzai 定位为 AI-Native RiskOps / Fraud & Financial Crime Prevention 平台，强调统一 fraud、identity、AML 和 scam prevention 决策，而不是单一 Android 设备指纹 SDK。

核心能力分为六层：

| 层级 | 公开表达 | 与当前实现的差异 |
|------|----------|------------------|
| Digital Trust | device intelligence、behavioral biometrics、network and threat intelligence | 当前没有 Feedzai Digital Trust SDK |
| Device Intelligence | device fingerprint、usage across sessions、OS and browser、device metadata | 当前没有 Feedzai 综合 device fingerprint 和跨 session 使用模型 |
| Behavioral Biometrics | typing cadence、mouse movements、swipe gestures、gyroscopic data | 当前没有行为生物特征采集 |
| Network and Threat Intelligence | malware、emulators、RAT、JavaScript tampering、SDK integrity、IP address | 当前没有威胁情报和 SDK 完整性检测 |
| Feedzai IQ | federated learning、collective intelligence、IQ Score、IQ Signals | 当前没有跨客户联合学习和风险信号网络 |
| ScamPrevent / Active Defense | device + behavior + transaction 信号融合并主动中断高风险会话 | 当前没有会话级主动阻断链路 |

与 `DeviceInfoRepository` 的差异在于：`DeviceInfoRepository` 当前主要采集 Android 本地基础标识、Build / ROM / Telephony 字段；Feedzai 的差异化集中在设备指纹抽象、行为生物特征、陀螺仪行为信号、威胁情报、SDK integrity、AI agent 识别、跨账号图谱、实时风险评分和 Active Defense。

---

## 2. Android / Mobile 接入方式

Feedzai 公开材料中的接入形态：

| 形态 | 说明 |
|------|------|
| Digital Trust SDK | 采集 device intelligence、behavioral biometrics、network and threat intelligence |
| Behavioral Biometrics agent | 采集 typing cadence、mouse movements、swipe gestures、pressure、speed、gyroscopic data |
| Device Fingerprinting API | 提供浏览器和设备指纹能力，强调跨 session 使用 |
| Network and Threat Intelligence | 检测 malware、emulators、RAT、JavaScript tampering、SDK integrity、IP address |
| Feedzai IQ API | 输出 IQ Score 和 IQ Signals，承接 federated learning 与 collective intelligence |
| ScamPrevent | 将 transaction analytics、behavioral biometrics、device intelligence 融合到 scam session |
| Active Defense | 对高风险会话执行实时中断或阻断 |
| RiskOps Platform / Studio | 统一规则、模型、调查和决策配置 |

当前 `DeviceInfoRepository` 没有接入 Feedzai SDK，也没有行为采集、威胁检测、Web / H5 协同、服务端 IQ 评分或 Active Defense 会话阻断。

---

## 3. 未实现字段清单

### 3.1 Device Intelligence 与跨 Session 指纹

| 维度 | Feedzai 公开表达 | 当前实现状态 | 备注 |
|------|------------------|--------------|------|
| Device fingerprint | device fingerprint | 未实现 | 当前没有 Feedzai 综合设备指纹 |
| Usage across sessions | usage across sessions | 未实现 | 当前没有跨 session 使用连续性模型 |
| Trusted browser fingerprinting | browser fingerprinting accuracy | 未实现 | 当前没有浏览器 / WebView 指纹 |
| OS and browser 组合画像 | OS and browser | 未实现 | Android OS 基础版本已覆盖，但 browser / WebView 指纹未覆盖 |
| Device metadata 聚合 | device metadata | 部分未实现 | 基础 Build 字段已覆盖；Feedzai 的聚合指纹和衍生标签未实现 |
| Continuous authentication | continuous authentication throughout a session | 未实现 | 当前没有会话内持续认证 |
| Continuous behavioral risk monitoring | continuously monitors sessions | 未实现 | 当前没有持续风险监控 |

### 3.2 行为生物特征

| 维度 | Feedzai 公开表达 | 当前实现状态 | 备注 |
|------|------------------|--------------|------|
| Typing cadence | typing cadence | 未实现 | 当前没有输入节奏 |
| Typing speed | typing speed | 未实现 | 当前没有按键速度 |
| Typing rhythm | typing rhythm | 未实现 | 当前没有节奏模型 |
| Typing pressure | typing pressure | 未实现 | 当前没有按键压力 |
| Mouse movements | mouse movements | 未实现 | 当前没有鼠标或指针轨迹 |
| Mouse click patterns | click patterns | 未实现 | 当前没有点击模式 |
| Swipe gestures | swipe gestures | 未实现 | 当前没有滑动手势采集 |
| Swipe pressure | swipe pressure | 未实现 | 当前没有滑动压力 |
| Swipe direction | swipe direction | 未实现 | 当前没有滑动方向 |
| Swipe speed | swipe speed | 未实现 | 当前没有滑动速度 |
| Touchscreen interactions | touchscreen interactions | 未实现 | 当前没有触屏交互行为模型 |
| Gyroscopic data | gyroscopic data | 未实现 | 当前没有陀螺仪行为采样 |
| Behavioral baseline | baseline of normal user behavior | 未实现 | 当前没有用户行为基线 |
| Behavioral shift / coached behavior | behavioral shift from confident to coached | 未实现 | 当前没有被诱导、被指导或异常行为漂移识别 |
| Agentic AI behavior baseline | distinguish AI agents from humans | 未实现 | 当前没有 AI agent 与真人行为区分 |

### 3.3 Network and Threat Intelligence

| 维度 | Feedzai 公开表达 | 当前实现状态 | 备注 |
|------|------------------|--------------|------|
| Malware detection | malware | 未实现 | 当前没有恶意软件检测 |
| Credential stealers | credential stealers | 未实现 | 当前没有凭证窃取类应用或行为识别 |
| Android emulator | emulators | 未实现 | 当前没有模拟器检测 |
| Remote Access Trojan | RAT | 未实现 | 当前没有远控木马检测 |
| Active Remote Access Tool during transaction | monitors active calls / identifies Remote Access Tools | 未实现 | 当前没有交易中远控或通话风险识别 |
| JavaScript tampering | JavaScript tampering | 未实现 | 当前没有 JS / WebView 篡改检测 |
| SDK integrity | SDK integrity | 未实现 | 当前没有 SDK 完整性校验 |
| Bot / automation tools | automation tools and bots | 未实现 | 当前没有自动化工具或 bot 检测 |
| AI agent detection | Agentic AI Readiness | 未实现 | 当前没有 AI 智能体识别 |
| IP risk intelligence | IP address | 未实现 | 当前没有 IP reputation、datacenter、proxy、VPN 风险画像 |
| Man-in-the-middle context | ATO 攻击材料提到 MitM | 未实现 | 当前没有中间人攻击或网络篡改检测 |

### 3.4 ScamPrevent、会话与交易上下文

| 维度 | Feedzai 公开表达 | 当前实现状态 | 备注 |
|------|------------------|--------------|------|
| Transaction analytics | transactional analytics + behavioral + device | 未实现 | 当前没有交易事件上下文 |
| Active call during transaction | active calls during incoming and outgoing payments | 未实现 | 当前没有支付时通话状态或通话风险模型 |
| Unusually long sessions | tracks unusually long sessions | 未实现 | 当前没有异常长会话检测 |
| Session duration risk | lengthy session | 未实现 | 当前没有会话时长风险标签 |
| Scam session intervention | ScamPrevent | 未实现 | 当前没有诈骗会话实时干预 |
| Active Defense session termination | end sessions automatically | 未实现 | 当前没有服务端主动中断会话 |
| Adaptive risk-based review | analyzes user behavior in real time | 未实现 | 当前没有动态 review / step-up / deny 决策 |
| Phishing / social engineering context | ATO / scam prevention | 未实现 | 当前没有 phishing 或社工诱导上下文模型 |
| SIM swap context | ATO guide 提到 SIM swapping | 未实现 | 当前没有 SIM swap 风险模型 |

### 3.5 服务端图谱、IQ 与联合学习

| 维度 | Feedzai 公开表达 | 当前实现状态 | 备注 |
|------|------------------|--------------|------|
| Feedzai IQ Score | real-time risk score via a single API | 未实现 | 当前没有 Feedzai IQ 风险评分 |
| Feedzai IQ Signals | BIN、email domain、zip code risk attributes | 未实现 | 当前没有预计算风险属性 |
| Federated learning signals | global federated learning | 未实现 | 当前没有跨客户联合学习 |
| Collective intelligence | shared, collective intelligence | 未实现 | 当前没有跨机构风险网络 |
| Device + phone + email link analysis | links devices, phone signals, and email patterns | 未实现 | 当前没有设备、手机号、邮箱图谱 |
| Cross-account / cross-device onboarding graph | flag one person opens multiple accounts | 未实现 | 当前没有 onboarding 阶段跨账号识别 |
| Mule detection via link analysis | mules identified via link analysis | 未实现 | 当前没有 mule 图谱检测 |
| 360 customer risk view | synthesizes watchlist, behavior, device, account changes, transaction history | 未实现 | 当前没有 360 风险视图 |
| Risk score per event | risk score per event | 未实现 | 当前没有事件级评分 |
| RiskOps rules / workflows | RiskOps Studio | 未实现 | 当前没有规则、工作流或调查平台集成 |

---

## 4. 公开资料缺口

Feedzai 公开资料能确认 Digital Trust、Behavioral Biometrics、Network and Threat Intelligence、Feedzai IQ、ScamPrevent 和 Active Defense 的产品能力，但 Android SDK 原始字段、API 调用、采样频率和检测 evidence 仍不透明。以下缺口应作为后续是否实现的追问项。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | Digital Trust Android SDK 的完整字段 schema | 决定哪些字段是真正客户端采集，哪些是服务端衍生 |
| Q-2 | Android SDK 是否开源或可获得集成文档 | 决定能否核对具体 Kotlin / Java API |
| Q-3 | Device fingerprint 的组成 | 决定是否使用 Android ID、GAID、OAID、MediaDrm、Keystore、Build、sensor、WebView |
| Q-4 | Usage across sessions 的生命周期 | 决定跨重装、清数据、系统升级、换账号、work profile 下的连续性 |
| Q-5 | Gyroscopic data 采样率和用途 | 决定是行为生物特征、硬件指纹还是 bot 检测 |
| Q-6 | Typing / swipe pressure 在 Android 上的归一方法 | 决定不同 ROM、键盘、屏幕硬件下是否可比 |
| Q-7 | SDK integrity 检测机制 | 决定是签名、哈希、证书 pinning、Play Integrity 还是运行时校验 |
| Q-8 | Credential stealers / malware evidence 集合 | 决定是否扫描包名、服务、权限、无障碍服务、进程或网络行为 |
| Q-9 | RAT detection 实现入口 | 决定是否依赖 AccessibilityService、AudioManager、MediaProjection、输入事件或服务端行为 |
| Q-10 | JavaScript tampering 适用范围 | 决定覆盖 Web、H5、WebView 还是只覆盖浏览器侧 JS |
| Q-11 | AI agent detection 的输入 | 决定是否检测浏览器自动化、移动端自动化、脚本调用或 agentic traffic |
| Q-12 | Active call during transaction 的 Android 实现 | 决定是否需要电话状态、音频状态或第三方 scam intelligence |
| Q-13 | Feedzai IQ Score 是否返回 reason code | 决定客户能否解释 emulator、RAT、malware、behavior shift 等具体原因 |
| Q-14 | IQ Signals 的字段定义 | 决定 BIN、domain、geo 等风险属性是否可落到本地字段或仅服务端字段 |
| Q-15 | Federated learning 的跨客户合并规则 | 决定 collective intelligence 对设备和账号的影响边界 |
| Q-16 | Active Defense 的客户端回调 | 决定高风险会话中断如何通知 Android 客户端 |
| Q-17 | RiskOps Studio 是否暴露 Digital Trust 字段名 | 决定后续能否从平台配置反推字段 |
| Q-18 | Flutter / React Native wrapper 字段一致性 | 决定跨技术栈接入时 Android 原生字段是否缺失 |

---

## 5. 当前结论

按 `DeviceInfoRepository` 当前实现，Feedzai 公开材料中与品牌、型号、厂商、Android 版本、SDK 版本、ROM 属性、OAID、Android ID、GAID、Widevine、IMEI / MEID、IMSI、ICCID、运营商相关的本地基础字段不再作为缺口保留。

当前仍有价值的 Feedzai 缺口集中在五类：

1. Device Intelligence 与跨 session 指纹：device fingerprint、usage across sessions、browser fingerprint、OS and browser 组合画像、device metadata 聚合、continuous authentication、continuous behavioral monitoring。
2. 行为生物特征：typing cadence / speed / rhythm / pressure、mouse movement / click pattern、swipe pressure / direction / speed、touchscreen interactions、gyroscopic data、behavior baseline、behavioral shift、AI agent behavior baseline。
3. Network and Threat Intelligence：malware、credential stealers、emulator、RAT、active remote access tool、JavaScript tampering、SDK integrity、bot / automation、AI agent、IP risk、MitM。
4. ScamPrevent 与会话交易上下文：transaction analytics、active call during transaction、unusually long session、scam intervention、Active Defense session termination、adaptive review、phishing、SIM swap。
5. 服务端图谱和 IQ：IQ Score、IQ Signals、federated learning、collective intelligence、device + phone + email link analysis、cross-account / cross-device onboarding graph、mule detection、360 customer risk view、event score、RiskOps workflow。
