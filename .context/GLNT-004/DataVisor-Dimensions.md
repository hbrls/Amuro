# C-015 · DataVisor 未实现维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-26 18:47:30
>
> 视角：DataVisor 厂商 LENS
> 来源：TASK-015
> 当前口径：以 `DeviceInfoRepository` 的实际实现为准，删除已实现字段，仅保留未实现字段、服务端衍生能力和公开资料缺口。

---

## 0. 整理口径

`DeviceInfoRepository` 已实现以下字段族，因此本文不再把这些字段作为 DataVisor 缺口保留：

- `BuildInfo` 中的品牌、型号、厂商、设备代号、产品名、Android 版本、SDK 版本、主板、硬件、显示版本、Build fingerprint、Build ID、Serial。
- `RomInfo` 中的主流厂商 ROM system property，包括 MIUI / HyperOS / EMUI / Magic / OPPO / OnePlus / Realme / Vivo / OneUI / Flyme / Smartisan / LeTV / Lenovo / Nubia / Oxygen / Harmony 相关属性。
- `IdentifierInfo` 中的 OAID、Android ID / SSAID、GAID、Widevine Device ID。
- `TelephonyInfo` 中的 IMEI / MEID 合并读取、IMSI、ICCID、MSISDN、本机号码、SIM / Network operator、SIM state、SIM operator name。

DataVisor 公开材料提到 `device info`、`operating system`、`location setting`、`timestamp`、`languages`、`user agents` 和 Android SDK 采集 100+ data fields。已由当前代码覆盖的基础标识、Build / ROM / Telephony 字段不再作为缺口保留；公开材料未逐项列名的基础字段不强行扩展为已确认字段。

不保留 iOS-only 字段作为 Android 实现缺口。

---

## 1. DataVisor 产品定位

DataVisor 定位为 AI-Native 实时金融犯罪防护平台，核心不是单一 Android 设备指纹 SDK，而是将设备信号、行为、网络、账号、交易和跨实体图谱合并到实时风险决策链路中。

核心能力分为六层：

| 层级 | 公开表达 | 与当前实现的差异 |
|------|----------|------------------|
| Device Intelligence | Android / iOS / desktop and mobile devices gather 100+ data fields in real time | 当前没有 DataVisor SDK，也没有 100+ 字段 schema |
| Unique Device ID | fraudsters change device parameters、IMEI missing 时仍输出 unique device ID | 当前没有 DataVisor device ID 或抗参数扰动身份算法 |
| Edge Computing | locally processes data、reduces traffic loads、eliminates latency | 当前没有 SDK 端前置计算 |
| SDK Protection | whitebox encryption、digital signature、unique encryption key per device | 当前没有 SDK 白盒加密、签名保护或每设备密钥 |
| AI / Graph Platform | unsupervised ML、cross-entity intelligence、ID graph、knowledge graph | 当前没有服务端图谱和无监督风险标签 |
| Real-time Decisioning | <100ms scoring、15000+ QPS、AI decisioning & automation | 当前没有实时评分和自动化决策输出 |

与 `DeviceInfoRepository` 的差异在于：`DeviceInfoRepository` 当前主要采集 Android 本地基础标识、Build / ROM / Telephony 字段；DataVisor 的差异化集中在 SDK 端 100+ 信号、抗篡改 device ID、边缘计算、SDK 保护、风险环境检测、行为生物特征、跨实体图谱、跨客户匿名信号和实时风险评分。

---

## 2. Android / Mobile 接入方式

DataVisor 公开材料中的接入形态：

| 形态 | 说明 |
|------|------|
| Android SDK | 公开称 Android / iOS / desktop and mobile devices 采集 100+ data fields in real time |
| Edge computing | 在本地设备上处理部分数据，降低流量和延迟 |
| Whitebox encryption + digital signature | 保护 SDK 和数据，防止被劫持、篡改或离线分析 |
| Per-device encryption key | 每设备唯一加密密钥，降低少量设备被攻破后的扩散风险 |
| Unique Device ID | 不依赖单一 IMEI / IMEA，即使设备参数变化仍尝试识别设备 |
| Service-side scoring | SDK 信号进入服务端无监督 ML 和实时评分 |
| Web / Mobile 协同 | 公开场景覆盖 websites and mobile applications |

当前 `DeviceInfoRepository` 没有接入 DataVisor SDK，也没有 SDK 端边缘计算、SDK 保护、行为采集、Web / H5 协同或服务端评分链路。

---

## 3. 未实现字段清单

### 3.1 SDK 端 100+ 信号与唯一 Device ID

| 维度 | DataVisor 公开表达 | 当前实现状态 | 备注 |
|------|--------------------|--------------|------|
| 100+ data fields schema | gathers 100+ data fields in real time | 未实现 | 当前只有 Build / ROM / Identifier / Telephony 基础字段族 |
| DataVisor Unique Device ID | delivers a unique device ID for each device | 未实现 | 当前没有 DataVisor 生成的设备身份 |
| 参数扰动后的设备连续性 | no matter how fraudsters change device parameters | 未实现 | 当前没有抗参数修改的服务端身份归并 |
| IMEI / IMEA 缺失后的识别 | even when IMEA and IMEI are missing | 未实现 | 当前 IMEI 只是本地读取字段，缺失后无替代识别算法 |
| Edge computing 本地前置计算 | processes data locally | 未实现 | 当前没有本地风险特征计算或压缩上送 |
| Whitebox encryption | protect data and SDK with whitebox encryption | 未实现 | 当前没有 SDK 白盒保护 |
| Digital signature protection | protect data from being hijacked, tampered or analyzed offline | 未实现 | 当前没有 DataVisor 签名校验或离线分析防护 |
| Per-device encryption key | unique encryption key per device | 未实现 | 当前没有每设备密钥体系 |
| SDK 数据劫持 / 篡改防护 | hijacked、tampered、analyzed offline | 未实现 | 当前没有 SDK 通信与本地数据完整性保护 |
| Web / H5 / App 关联 | websites and mobile applications | 未实现 | 当前没有跨 Web、H5、WebView、App 的设备关联 |

### 3.2 本地环境与风险检测

| 维度 | DataVisor 公开表达 | 当前实现状态 | 备注 |
|------|--------------------|--------------|------|
| Android Emulator | Detect Emulators | 未实现 | 当前没有模拟器检测 |
| Botnet | Botnets | 未实现 | 当前没有 botnet 设备或流量模式检测 |
| Hijacked Device | Hijacked devices | 未实现 | 当前没有设备被劫持检测 |
| App Cloner | App cloners | 未实现 | 当前没有应用多开 / 克隆检测 |
| Cloud Phone | Cloud phones | 未实现 | 当前没有云手机检测 |
| Rooted Device | rooted devices | 未实现 | 当前没有 root 文件、包、属性、Magisk 或可写目录检测 |
| Hooked Device | hooked devices | 未实现 | 当前没有 Frida、Xposed、Substrate、inline hook 或 instrumentation 检测 |
| Device Flashing | Mobile Fraud Gone in a Device Flash | 未实现 | 当前没有刷机、固件更换或设备参数重置后的风险识别 |
| M1 MacBook abuse | abusing the new Macbooks with M1 chips | 未实现 | 当前没有非 Android 设备仿冒或跨平台滥用识别 |
| Remote Access Trojan | RAT 绕过 device fingerprinting 的局限 | 未实现 | 当前没有远控木马或远程控制会话检测 |
| Stolen Device ID | device IDs available for purchase | 未实现 | 当前没有被盗设备 ID 复用检测 |
| Synthetic Identity | device fingerprinting 不能单独识别 synthetic identities | 未实现 | 当前没有账号侧合成身份关联模型 |
| Credential Stuffing | 公开 Defense 标签 | 未实现 | 当前没有撞库攻击序列识别 |
| SIM Swap Fraud | 公开 Defense 标签 | 未实现 | 当前没有 SIM swap 风险模型 |
| GPS Spoofing | 公开 Defense 标签 | 未实现 | 当前没有 fake GPS、位置篡改或多源位置校验 |
| P2P VPN Networks | 公开 Defense 标签 | 未实现 | 当前没有 P2P VPN 网络识别 |
| Deepfakes | 公开 Defense 标签 | 未实现 | 当前没有深伪风险关联 |
| Account Takeover | 公开 Defense / Wiki 标签 | 未实现 | 当前没有 ATO 风险模型 |

### 3.3 网络、位置、语言和运行时上下文

| 维度 | DataVisor 公开表达 | 当前实现状态 | 备注 |
|------|--------------------|--------------|------|
| Location setting | location setting | 未实现 | 当前没有定位服务开关、授权状态或定位模式 |
| Timestamp / timing context | timestamp | 未实现 | 当前没有采集时间、事件时间、安装时间、升级路径或重装迹象模型 |
| Languages / locale | languages | 未实现 | 当前没有语言、区域、locale 列表 |
| User-Agent | user agents | 未实现 | 当前没有 WebView / 浏览器 UA |
| IP Reputation Service | 公开 Defense 标签 | 未实现 | 当前没有 IP reputation、datacenter、proxy、VPN 风险画像 |
| Network Analysis | 公开 Fraud Tech 标签 | 未实现 | 当前没有设备、账号、IP、交易的网络关联分析 |
| P2P VPN 关联 | P2P VPN Networks | 未实现 | 当前没有 P2P VPN 与设备风险联合判断 |
| GPS spoofing 关联 | GPS Spoofing | 未实现 | 当前没有 GPS、IP、网络、设备参数交叉校验 |

### 3.4 行为生物特征与交易上下文

| 维度 | DataVisor 公开表达 | 当前实现状态 | 备注 |
|------|--------------------|--------------|------|
| Behavioral Biometrics | 公开 Defense 标签 | 未实现 | 当前没有触控、输入、滑动或传感器行为采集 |
| Transaction Monitoring | 公开 Defense 标签 | 未实现 | 当前没有交易监控上下文 |
| Email Reputation Service | 公开 Defense 标签 | 未实现 | 当前没有邮箱风险画像 |
| Natural Language Processing | 公开 Fraud Tech 标签 | 未实现 | 当前没有文本、工单、对话或内容风险建模 |
| Generative AI risk | 公开 Fraud Tech 标签 | 未实现 | 当前没有生成式 AI 攻击 / 防御风险标签 |
| Tokenization | 公开 Defense 标签 | 未实现 | 当前没有账号侧 token 化风险信号 |
| 2FA context | 公开 Defense 标签 | 未实现 | 当前没有二次验证上下文或 step-up 结果 |

### 3.5 服务端图谱、模型与实时决策

| 维度 | DataVisor 公开表达 | 当前实现状态 | 备注 |
|------|--------------------|--------------|------|
| Identity Graphing / Knowledge Graph | Identity (ID) Graphing / Knowledge Graph | 未实现 | 当前没有设备、账号、邮箱、手机号、IP、交易图谱 |
| Cross-Entity Link Analysis | Cross-Entity Link Analysis | 未实现 | 当前没有跨实体链接分析 |
| Cross-customer anonymized signals | anonymized signals across industries | 未实现 | 当前没有跨客户匿名信号共享 |
| DEFEND community signal | DEFEND community | 未实现 | 当前没有社区化风险情报输入 |
| Feature Store | feature store and data ingestion platform | 未实现 | 当前没有服务端 feature store |
| Unsupervised ML 风险标签 | proprietary unsupervised machine learning algorithms | 未实现 | 当前没有无监督风险聚类或标签生成 |
| Real-time scoring | <100ms latency、15000+ QPS | 未实现 | 当前没有毫秒级评分链路 |
| AI Decisioning & Automation | AI Decisioning & Automation | 未实现 | 当前没有 allow / review / deny / step-up 等决策输出 |
| Vera Conversational AI Agent | Vera | 未实现 | 当前没有 conversational agent 参与调查或决策 |
| Anomaly Detection | 公开 Fraud Tech 标签 | 未实现 | 当前没有异常检测模型 |
| Cross-industry fraud pattern | anonymized signals across industries | 未实现 | 当前没有跨行业 fraud pattern 归并 |

---

## 4. 公开资料缺口

DataVisor 公开资料能确认 Android SDK、100+ 字段、unique device ID、edge computing、whitebox encryption、实时评分和无监督 ML，但没有公开完整 Android SDK schema。以下缺口应作为后续是否实现的追问项。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | Android SDK 100+ data fields 明细 | 决定哪些字段是真正客户端采集，哪些是服务端衍生 |
| Q-2 | 公开 6 类字段到具体字段的映射 | `device info`、`operating system`、`location setting`、`timestamp`、`languages`、`user agents` 仍是类目级表达 |
| Q-3 | Unique Device ID 生命周期 | 决定跨重装、清数据、系统升级、work profile、恢复出厂设置后的连续性 |
| Q-4 | Unique Device ID 是否使用 Android ID、App Set ID、GAID、OAID、MediaDrm、Keystore、Play Integrity | 决定与当前已实现字段的重叠和新增工作量 |
| Q-5 | Edge computing 的本地计算内容 | 决定 SDK 端是否计算风险标签、特征 hash、模型分数或压缩 payload |
| Q-6 | Whitebox encryption 和 per-device key fallback | 决定 Android Keystore 不可用、root、hook 环境下的保护路径 |
| Q-7 | Root / hook / emulator / app cloner / cloud phone 的 evidence 集合 | 决定本地检测需要采集哪些文件、包名、属性、进程、native 特征 |
| Q-8 | Device flashing 判定方法 | 决定是否依赖系统属性漂移、安装时间、账号历史或服务端图谱 |
| Q-9 | Location setting 与 GPS spoofing 的字段边界 | 决定是否需要定位权限、mock location、传感器、IP、cell tower 关联 |
| Q-10 | Behavioral Biometrics 原始信号 | 决定是否采集触控、键盘、滑动、传感器、页面停留和任务完成速度 |
| Q-11 | Web / H5 / WebView 与 Android App 的关联方式 | 决定是否需要 JS SDK、WebView bridge、cookie、device token 或服务端 session linkage |
| Q-12 | Real-time scoring 的端到端 SLA | 决定 <100ms 是否包含 SDK 网络、服务端评分和决策回传 |
| Q-13 | Decisioning reason code | 决定客户端或服务端能否获得 emulator、botnet、ATO、SIM swap 等具体原因 |
| Q-14 | Cross-customer anonymized signals 的合并规则 | 决定跨客户风险网络是否会影响本地用户和设备画像 |
| Q-15 | Feature Store 是否暴露字段定义 | 决定客户能否复用 DataVisor 的 feature naming 和 definition |
| Q-16 | Vera 是否参与设备 / 账号 / 交易决策链路 | 决定 conversational agent 是否只是调查界面还是风险模型一部分 |

---

## 5. 当前结论

按 `DeviceInfoRepository` 当前实现，DataVisor 公开材料中与品牌、型号、厂商、Android 版本、SDK 版本、ROM 属性、OAID、Android ID、GAID、Widevine、IMEI / MEID、IMSI、ICCID、运营商相关的本地基础字段不再作为缺口保留。

当前仍有价值的 DataVisor 缺口集中在五类：

1. SDK 端 100+ 信号与设备身份：100+ data fields、Unique Device ID、抗参数扰动、IMEI 缺失后的识别、edge computing、whitebox encryption、digital signature、per-device key、Web / App 关联。
2. 本地风险环境：emulator、botnet、hijacked device、app cloner、cloud phone、root、hook、device flashing、RAT、stolen device ID、synthetic identity、credential stuffing、SIM swap、GPS spoofing、P2P VPN、deepfake、ATO。
3. 网络、位置和运行时上下文：location setting、timestamp、languages、user agents、IP reputation、network analysis、P2P VPN、GPS spoofing 关联。
4. 行为和交易：behavioral biometrics、transaction monitoring、email reputation、NLP、generative AI risk、tokenization、2FA context。
5. 服务端模型与决策：Identity Graph、Cross-Entity Link Analysis、cross-customer anonymized signals、Feature Store、Unsupervised ML、Real-time scoring、AI Decisioning、Vera、Anomaly Detection、cross-industry fraud pattern。
