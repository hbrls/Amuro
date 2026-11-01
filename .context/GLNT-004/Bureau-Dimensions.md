# C-014 · Bureau 未实现维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-26 18:39:01
>
> 视角：Bureau 厂商 LENS
> 来源：TASK-014
> 当前口径：以 `DeviceInfoRepository` 的实际实现为准，删除已实现字段，仅保留未实现字段、服务端衍生能力和公开资料缺口。

---

## 0. 整理口径

`DeviceInfoRepository` 已实现以下字段族，因此本文不再把这些字段作为 Bureau 缺口保留：

- `BuildInfo` 中的品牌、型号、厂商、设备代号、产品名、Android 版本、SDK 版本、主板、硬件、显示版本、Build fingerprint、Build ID、Serial。
- `RomInfo` 中的主流厂商 ROM system property，包括 MIUI / HyperOS / EMUI / Magic / OPPO / OnePlus / Realme / Vivo / OneUI / Flyme / Smartisan / LeTV / Lenovo / Nubia / Oxygen / Harmony 相关属性。
- `IdentifierInfo` 中的 OAID、Android ID / SSAID、GAID、Widevine Device ID。
- `TelephonyInfo` 中的 IMEI / MEID 合并读取、IMSI、ICCID、MSISDN、本机号码、SIM / Network operator、SIM state、SIM operator name。

Bureau 公开材料提到 operating system、hardware parameters、software parameters、device IDs 等基础设备字段；其中已由当前代码覆盖的基础标识、Build / ROM / Telephony 字段不再作为缺口保留。本文只保留当前代码没有等价字段、检测方法或服务端模型的 Bureau 能力。

不保留 iOS-only 字段作为 Android 实现缺口；例如 jailbreak 只作为跨平台语境出现，不列入 Android 待实现字段。

---

## 1. Bureau 产品定位

Bureau 将 Device Intelligence 放在 **Unified Risk Decisioning Platform** 的核心位置，强调 Device ID 持久性、Device Graph、Behavioral Continuity、RASP、Bot Detection 和 Mule Score 的组合，而不是单一 Android ID SDK。

核心能力分为八层：

| 层级 | 公开表达 | 与当前实现的差异 |
|------|----------|------------------|
| Device ID | 99.7% / 99.97% persistent，resilient to factory reset、firmware changes、plugins usage、incognito modes | 当前没有 Bureau 持久 Device ID |
| Device / Browser Fingerprint | 99.9% persistent fingerprint，识别 spoofed devices、apps、SDKs | 当前没有多信号服务端指纹 |
| Device Graph / Graph Identity Network | devices、accounts、emails、mobile numbers、IPs 关联 | 当前没有服务端设备图谱 |
| Behavioral Biometrics | 100+ behavior signals，keystrokes、touches、swipes、sensors、pointer movement | 当前没有行为生物特征采集 |
| Behavioral Continuity | 160+ attributes，continuous passive authentication | 当前没有行为连续性评分 |
| RASP | Four-layer Zero Trust，XVM custom bytecode virtualization，OS-level signals | 当前没有 RASP / XVM / OS-level runtime protection |
| Bot Detection | Bureau Fingerprint、honeypots、JavaScript computations、behavior analysis | 当前没有 Web bot detection |
| Mule Score | onboarding scoring、cross-ecosystem mule detection、real-time interdiction | 当前没有 mule 风险模型 |

与 `DeviceInfoRepository` 的差异在于：`DeviceInfoRepository` 当前主要采集 Android 本地基础标识、Build / ROM / Telephony 字段；Bureau 的核心差异化集中在持久 Device ID、RASP/XVM、行为生物特征、设备图谱、Bot Detection、位置欺诈检测、Mule Score 和实时风险决策。

---

## 2. Android / Mobile 接入方式

Bureau 公开材料中的接入形态：

| 形态 | 说明 |
|------|------|
| Bureau SDK | 公开材料称可在 Android、iOS、desktop OS 上实现，并由 SDK 采集必要信息 |
| RASP SDK | 嵌入 app 的运行时保护，使用 OS-level signals 和 custom XVM bytecode virtualization |
| Behavioral Biometrics SDK | 采集 typing、tapping、holding、moving、sensor 数据 |
| Bureau Fingerprint | 设备 + 浏览器指纹，同时覆盖 Web 与 Mobile |
| Honeypot + JavaScript Computations | Web 端隐藏元素和 JS challenge，用于 bot detection |
| API / Risk Decisioning Platform | 服务端实时返回 approval、rejection、step-up verification、manual review、promo restriction、transaction limits |

当前 `DeviceInfoRepository` 没有接入 Bureau SDK，也没有 RASP、behavioral biometrics、device graph 或 risk decisioning 链路。

---

## 3. 未实现字段清单

### 3.1 持久 Device ID 与设备指纹

| 维度 | Bureau 公开表达 | 当前实现状态 | 备注 |
|------|-----------------|--------------|------|
| Persistent Device ID | 99.7% / 99.97% persistent | 未实现 | 当前没有跨 factory reset / firmware / incognito 的 Bureau Device ID |
| Device / Browser Fingerprint | 99.9% persistent fingerprint | 未实现 | 当前没有服务端多信号 fingerprint |
| Factory reset resilience | resilient to device and factory resets | 未实现 | 当前没有 factory reset 后身份恢复 |
| Firmware change resilience | resilient to firmware changes | 未实现 | 当前没有固件变化后的身份连续性 |
| Plugin / incognito resilience | resilient to plugins usage and incognito modes | 未实现 | 当前没有 Web / browser 层连续性模型 |
| Spoofed device / app / SDK detection | identify spoofed devices, apps & SDKs | 未实现 | 当前没有 spoofed app / SDK / device 检测 |
| Botnets / TOR detection | spot spoofing, botnets, emulators, TOR | 未实现 | 当前没有 botnet 或 TOR 检测 |

### 3.2 RASP / Runtime Protection

| 维度 | Bureau 公开表达 | 当前实现状态 | 备注 |
|------|-----------------|--------------|------|
| XVM custom VM virtualization | private instruction format | 未实现 | 当前没有自定义字节码虚拟化 |
| Code protection / obfuscation | Code protection & obfuscation | 未实现 | 当前没有代码保护质量检测 |
| Reverse engineering / anti-debugging | anti-debugging protection | 未实现 | 当前没有 debugger、ptrace、JDWP 或反逆向检测 |
| Code injection prevention | Code injection prevention | 未实现 | 当前没有运行时代码注入检测 |
| App repackaging protection | App Repackaging Protection | 未实现 | 当前没有签名、包完整性或重打包检测 |
| App tampering protection | App Tampering Protection | 未实现 | 当前没有 app 篡改检测 |
| Anti-rooting | Anti-rooting across Android | 未实现 | 当前没有 root 文件、包名、属性、Magisk 或 writable dir 检测 |
| App cloning / virtualization / device masking | App cloning, virtualization & device masking detection | 未实现 | 当前没有多开、虚拟化、设备伪装检测 |
| Memory scanning / provision breach | Memory scanning & provision breach detection | 未实现 | 当前没有内存扫描或 provision breach 检测 |
| Software Gesture Attack | malware-driven gesture automation | 未实现 | 当前没有运行时手势自动化检测 |
| Overlay Attack / Tapjacking | OS-level IPC monitoring | 未实现 | 当前没有覆盖层、tapjacking 或 IPC 监控 |
| Virtual OS-Based Emulator | OS-level emulator signals | 未实现 | 当前没有 OS-level emulator 检测 |
| Per-threat enforcement | Monitor / Warn / Block | 未实现 | 当前没有逐威胁执行策略 |
| Immutable audit logs | timestamped, classified, enforcement-mapped | 未实现 | 当前没有 RASP 审计日志 |

### 3.3 网络与位置欺诈

| 维度 | Bureau 公开表达 | 当前实现状态 | 备注 |
|------|-----------------|--------------|------|
| Network telemetry | Device Intelligence 参数 | 未实现 | 当前没有网络遥测画像 |
| IP reputation | Bot Detection / request indicators | 未实现 | 当前没有 IP reputation |
| Packet sniffing / MITM | Packet sniffing & MITM prevention | 未实现 | 当前没有链路劫持或 MITM 检测 |
| HTTP Proxy / L2 VPN bypass | HTTP proxy & L2 VPN bypass detection | 未实现 | 当前没有代理、VPN 检测 |
| ARP spoof | RASP 网络风险 | 未实现 | 当前没有 ARP spoof 检测 |
| SSL Strip | RASP 网络风险 | 未实现 | 当前没有 SSL Strip 检测 |
| 256-bit channel encryption | RASP enforced channel encryption | 未实现 | 当前没有 Bureau 通道加密控制 |
| Geo spoofing true location | reveals true location, not just spoof flag | 未实现 | 当前没有真实位置推断 |
| GPS elevation / pressure | location spoofing detection | 未实现 | 当前没有海拔、气压或传感器位置校验 |
| Cell tower / IP / network correlation | GPS、IP、network、device intel 关联 | 未实现 | 当前没有多源位置相关性模型 |
| GPS spoofing apps / emulators / VPNs | location spoofing risk | 未实现 | 当前没有 fake GPS app、模拟器、VPN 组合判断 |

### 3.4 行为生物特征

| 维度 | Bureau 公开表达 | 当前实现状态 | 备注 |
|------|-----------------|--------------|------|
| 100+ behavior signals | behavioral biometrics | 未实现 | 当前没有行为信号采集 |
| Keystrokes | keystrokes | 未实现 | 当前没有击键时序 |
| Touches / taps | touches / tapping / holding | 未实现 | 当前没有触摸压力、时长或节奏 |
| Swipes / scrolling | swipes / average scroll length | 未实现 | 当前没有滑动或滚动行为 |
| Sensors / gyrometer | sensor captured tap depth | 未实现 | 当前没有陀螺仪 / 传感器行为建模 |
| Pointer movement | pointer movement | 未实现 | 当前没有鼠标或指针行为 |
| Dwell time | dwell time on a screen page | 未实现 | 当前没有页面停留时间 |
| Press / release time | per-keystroke press and release time | 未实现 | 当前没有按下 / 释放时长 |
| One-handed vs dual-handed | hand-use behavior | 未实现 | 当前没有手持方式推断 |
| Completion speed | completion speeds | 未实现 | 当前没有任务完成速度模型 |
| Mid-session behavioral shifts | bot / synthetic identity / mid-session shifts | 未实现 | 当前没有会话中行为漂移检测 |
| Continuous passive authentication | continuously evaluate user behaviors | 未实现 | 当前没有持续被动认证 |

### 3.5 Web Bot Detection

| 维度 | Bureau 公开表达 | 当前实现状态 | 备注 |
|------|-----------------|--------------|------|
| Browser attributes | bot detection indicators | 未实现 | 当前没有浏览器属性指纹 |
| User-Agent / headers | user agents / browser headers | 未实现 | 当前没有 Web / WebView UA 和 headers |
| Mouse movements | bot detection indicators | 未实现 | 当前没有鼠标行为 |
| Request patterns | bot detection indicators | 未实现 | 当前没有请求模式分析 |
| Honeypot HTML elements | hidden traps | 未实现 | 当前没有隐藏元素 bot trap |
| JavaScript computations | human-like response challenges | 未实现 | 当前没有 JS challenge |
| Clicks / scrolling / movement | behavior analysis | 未实现 | 当前没有 Web 行为分析 |

### 3.6 服务端图谱、Mule 与决策输出

| 维度 | Bureau 公开表达 | 当前实现状态 | 备注 |
|------|-----------------|--------------|------|
| Device Graph / Graph Identity Network | device-account-email-phone-IP linkage | 未实现 | 当前没有设备 / 账号 / 邮箱 / 手机号 / IP 图谱 |
| Verification history | devices / sessions / industries | 未实现 | 当前没有跨 touchpoint 验证历史 |
| 1B+ identities mapped | collusion and hidden fraud networks | 未实现 | 当前没有 Bureau 网络身份映射 |
| Connected clusters / connector nodes | clusters of devices and identities | 未实现 | 当前没有图谱集群和关键节点分析 |
| Fund flow analysis | trace how funds flow within entities | 未实现 | 当前没有资金流图谱 |
| Mule Score | three-tier mule framework | 未实现 | 当前没有 money mule 评分 |
| Cross-ecosystem mule detection | real-time interdiction alerts | 未实现 | 当前没有跨生态 mule 检测 |
| Real-time risk score | approval / rejection / review | 未实现 | 当前没有 Bureau 风险评分 |
| Decisioning actions | step-up、manual review、promo restriction、transaction limits | 未实现 | 当前没有决策动作输出 |
| Decisions-not-data | tokenized risk signals | 未实现 | 当前没有 tokenized risk signal 共享 |
| Self-learning models / feedback loop | self-learning + feedback | 未实现 | 当前没有反馈闭环模型 |
| No-code / low-code workflows | configurable workflows | 未实现 | 当前没有风控工作流配置 |

---

## 4. 公开资料缺口

Bureau 公开材料覆盖产品能力很广，但 Android SDK 原始字段、RASP 实现细节、Device ID 生命周期和服务端图谱算法仍不透明。以下缺口应作为后续是否实现的追问项。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | Device ID 99.7% / 99.97% persistence 的测试方法 | 决定持久度数字是否可验证 |
| Q-2 | factory reset 后 Device ID 恢复材料 | 决定是否包含 OS-level signals、MediaDrm、Keystore、Build、sensor |
| Q-3 | Device ID 生命周期 | 决定跨重装、清数据、系统升级、隐身模式的行为 |
| Q-4 | Bureau Android SDK 原始字段 | 决定是否采集 Android ID、App Set ID、Advertising ID、Build、sensor、MediaDrm、Keystore |
| Q-5 | Behavioral Biometrics 100+ signals 清单 | 决定具体行为信号边界 |
| Q-6 | 160+ attributes 明细 | 决定 fingerprint、device、behavior、network 类字段分布 |
| Q-7 | RASP XVM private instruction format 实现层级 | 决定是 Java bytecode、DEX 还是 native 指令重写 |
| Q-8 | App cloning / virtualization / device masking 覆盖范围 | 决定 Android Studio emulator、Genymotion、云手机、容器化 Android 是否区分 |
| Q-9 | Virtual OS-Based Emulator OS-level signals | 决定底层检测路径 |
| Q-10 | Software Gesture Attack runtime behavior | 决定是否检查 accessibility service、touch timing、sensor pattern |
| Q-11 | Overlay Attack OS-level IPC monitoring | 决定监听哪些 IPC 或窗口事件 |
| Q-12 | Geo spoofing true IP 判断 | 决定 GPS、cell tower、pressure、IP 如何综合 |
| Q-13 | HTTP Proxy / L2 VPN bypass detection rate | 决定网络风险检测准确性 |
| Q-14 | Graph Identity Network 100% accuracy 定义 | 决定是图谱覆盖率、真阳性率还是内部指标 |
| Q-15 | 1B+ identities mapped 数据来源 | 决定自有网络还是第三方数据 |
| Q-16 | Mule Score tier 1 / 2 / 3 标准 | 决定 onboarding、cross-ecosystem、interdiction 如何评分 |
| Q-17 | Continuous Passive Authentication 延迟 | 决定能否实时阻断 mid-session shift |
| Q-18 | JavaScript Computations 的可访问性影响 | 决定对辅助技术和用户体验的影响 |
| Q-19 | Honeypot HTML 对 SEO / a11y 的影响 | 决定 Web 接入风险 |
| Q-20 | Device ID / RASP / Behavioral Biometrics 是否同一 SDK | 决定模块化接入和权限边界 |
| Q-21 | decisions-not-data token 协议 | 决定客户能否拿到 raw evidence |
| Q-22 | 排除部分模块后的剩余采集 | 决定关闭 RASP / Behavioral / Device ID 后是否仍采集风险信号 |
| Q-23 | 隐私合规和数据保留 | 决定 Device ID、Behavioral Biometrics、Mule Score、Graph Identity Network 的保留期 |
| Q-24 | Android SDK minSdk / targetSdk / 权限 / footprint | 决定实际集成成本 |
| Q-25 | RASP Policy Trust 默认策略 | 决定 Monitor / Warn / Block 的行业模板 |
| Q-26 | Self-learning model fine-tuning | 决定客户反馈是否影响模型 |
| Q-27 | pre-login mule catch 技术入口 | 决定 SDK 启动前还是网络层完成 |
| Q-28 | Privacy Sandbox / Android Private Compute Core 兼容 | 决定新 Android 隐私生态下的可行性 |

---

## 5. 当前结论

按 `DeviceInfoRepository` 当前实现，Bureau 公开材料中与品牌、型号、厂商、Android 版本、SDK 版本、ROM 属性、OAID、Android ID、GAID、Widevine、IMEI / MEID、IMSI、ICCID、运营商相关的本地基础字段不再作为缺口保留。

当前仍有价值的 Bureau 缺口集中在六类：

1. 持久身份与设备指纹：Persistent Device ID、Device / Browser Fingerprint、factory reset / firmware / incognito resilience、spoofed device / app / SDK、botnets、TOR。
2. RASP / Runtime Protection：XVM、obfuscation、anti-debugging、code injection、repackaging、tampering、root、cloning、memory scanning、gesture attack、tapjacking、OS-level emulator、enforcement、audit logs。
3. 网络与位置欺诈：network telemetry、IP reputation、MITM、proxy、VPN、ARP spoof、SSL Strip、channel encryption、true location、GPS elevation / pressure、cell tower / IP / network correlation。
4. 行为生物特征：100+ behavior signals、keystrokes、touches、swipes、sensors、pointer movement、dwell time、press/release time、one-handed vs dual-handed、completion speed、mid-session shifts、continuous passive authentication。
5. Web Bot Detection：browser attributes、UA / headers、mouse movements、request patterns、honeypots、JavaScript computations、click / scroll behavior。
6. 服务端图谱与决策：Device Graph、verification history、1B+ identities、connected clusters、fund flow、Mule Score、cross-ecosystem mule detection、risk score、decisioning actions、decisions-not-data、feedback loop、workflows。
