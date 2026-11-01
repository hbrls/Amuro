# C-010 · ThreatMetrix 未实现维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-26 17:56:22
>
> 视角：ThreatMetrix 厂商 LENS
> 来源：TASK-010
> 当前口径：以 `DeviceInfoRepository` 的实际实现为准，删除已实现字段，仅保留未实现字段、服务端衍生能力和公开资料缺口。

---

## 0. 整理口径

ThreatMetrix 当前作为 LexisNexis Risk Solutions 的数字身份与欺诈风控产品存在。本文标题保留产品名 `ThreatMetrix`，正文用 LexisNexis Risk Solutions 说明其当前公开资料归属。

`DeviceInfoRepository` 已实现以下字段族，因此本文不再把这些字段作为 ThreatMetrix 缺口保留：

- `BuildInfo` 中的品牌、型号、厂商、设备代号、产品名、Android 版本、SDK 版本、主板、硬件、显示版本、Build fingerprint、Build ID、Serial。
- `RomInfo` 中的主流厂商 ROM system property，包括 MIUI / HyperOS / EMUI / Magic / OPPO / OnePlus / Realme / Vivo / OneUI / Flyme / Smartisan / LeTV / Lenovo / Nubia / Oxygen / Harmony 相关属性。
- `IdentifierInfo` 中的 OAID、Android ID / SSAID、GAID、Widevine Device ID。
- `TelephonyInfo` 中的 IMEI / MEID 合并读取、IMSI、ICCID、MSISDN、本机号码、SIM / Network operator、SIM state、SIM operator name。

ThreatMetrix 公开材料提到 Android SDK profiling、`READ_PHONE_STATE`、location、Wi-Fi、device、geolocation、IP、behavior、bot / RAT patterns、Strong ID、LexID Digital 等能力。对其中已经由 `DeviceInfoRepository` 覆盖的基础标识和 Build / Telephony 字段，本文不再保留为缺口；对权限入口下的未公开细节，只保留当前代码没有等价字段或模型的部分。

---

## 1. ThreatMetrix 产品定位

ThreatMetrix 的公开定位不是单一 Android SDK 或单一设备指纹，而是 **Digital Identity Intelligence / Automated Risk Management / Fraud Detection / Authentication** 的组合。

核心能力分为五层：

| 层级 | 公开表达 | 与当前实现的差异 |
|------|----------|------------------|
| Mobile SDK profiling | Android / iOS SDK 采集 attributes 并返回 `sessionId` | 当前没有 profiling session、collection reference 或 SDK 上送链路 |
| Strong ID | 浏览器 / app 与 ThreatMetrix 之间的 cryptographic bind | 当前没有 cryptographic device binding |
| Digital Identity Network | 跨行业共享、匿名化、tokenized signals 的网络智能 | 当前没有服务端身份网络、关系图谱或跨客户信誉模型 |
| Decision engine / AI models | 基于组织数据、全球网络数据、AI / ML 做实时策略决策 | 当前没有 risk score、reason code 或模型输出 |
| Behavior / risk intelligence | geolocation、IP、behavior、historical patterns、bot / RAT patterns | 当前没有行为遥测、位置异常、Bot / RAT 模式或历史风险关联 |

与 `DeviceInfoRepository` 的差异在于：`DeviceInfoRepository` 当前主要采集 Android 本地基础标识、Build / ROM / Telephony 字段；ThreatMetrix 的核心差异化集中在 Android profiling 入口、会话引用、服务端数字身份网络、位置 / 行为 / 历史风险关联和 Strong ID 连续性。

---

## 2. Android / Mobile 接入方式

ThreatMetrix 公开材料中的接入形态：

| 形态 | 说明 |
|------|------|
| Android SDK | Worldpay 文档公开 `TMXProfiling` / `TMXProfilingConnections` AAR，适用于 ThreatMetrix SDK V6-2 |
| iOS SDK | Worldpay iOS 文档同样使用 `TMXProfiling` / `TMXProfilingConnections` |
| Web profiling HTML / JS | 支付网关文档使用 profiling HTML + session id |
| PingFederate mobile/native enhanced | mobile/native app 集成 ThreatMetrix SDK，并在认证 API 中提交 `sessionId` |
| Exemption / FraudSight / payment assessment | Worldpay 将 `sessionId` 放入 `deviceData.collectionReference`，再用于 assessment |
| Portal / inline variables / rules | Portal 使用 ThreatMetrix data 建模、规则和人工 case review |

Android SDK 公开集成要点：

- app 集成 `TMXProfiling` 与 `TMXProfilingConnections`。
- 初始化时传入 `Context`、`ORG_ID`、`FP_SERVER / Profiling domain`。
- `profile()` 开始 device profiling。
- SDK 将 collected attributes 与 unique `sessionId` 传给 ThreatMetrix Platform。
- `TMXEndNotifier.complete()` 返回 profiling status 与 `sessionID`。
- 后续在服务端 assessment / authentication API 中提交该 `sessionId`。

当前 `DeviceInfoRepository` 没有接入 ThreatMetrix SDK，也没有 profiling status、session lifecycle 或 collection reference 字段。

---

## 3. 未实现字段清单

### 3.1 Android / Mobile SDK Profiling

| 维度 | ThreatMetrix 公开来源 | 当前实现状态 | 备注 |
|------|-----------------------|--------------|------|
| Profiling sessionId | `TMXEndNotifier.complete()` 返回 `sessionID` | 未实现 | 当前没有会话级 profiling reference |
| Collection reference | Worldpay `deviceData.collectionReference` | 未实现 | 当前没有把 profiling 结果绑定到交易 / 认证 assessment |
| Profiling status | `TMXEndNotifier.complete()` | 未实现 | 当前没有 profiling 成功 / 失败状态 |
| Collected attributes | SDK `profile()` 上送 attributes | 未实现 | 原始字段未公开，当前也没有统一 profiling attribute 容器 |
| Custom attributes | `TMXProfilingOptions.setCustomAttributes()` | 未实现 | 业务上下文，不是 Android 固有字段；当前 repository 无扩展属性模型 |
| Profiling domain / org id | `FP_SERVER` / `ORG_ID` | 未实现 | 部署配置，不是设备字段；当前 repository 无 SDK 配置模型 |

### 3.2 权限入口与本地环境

| 维度 | ThreatMetrix 公开来源 | 当前实现状态 | 备注 |
|------|-----------------------|--------------|------|
| GPS / precise location | `ACCESS_FINE_LOCATION` optional | 未实现 | 当前没有读取经纬度、精度、provider 或 location services |
| Coarse location | `ACCESS_COARSE_LOCATION` optional | 未实现 | 当前没有 coarse location |
| Wi-Fi state | `ACCESS_WIFI_STATE` optional | 未实现 | 当前没有 Wi-Fi SSID、BSSID、RSSI、连接状态或 Wi-Fi 网络环境 |
| Change Wi-Fi state 相关入口 | `CHANGE_WIFI_STATE` optional | 未实现 | 具体用途未公开；当前没有 Wi-Fi 状态控制或探测链路 |
| Phone state profiling | `READ_PHONE_STATE` optional | 部分未实现 | 当前已实现 IMEI / MEID、IMSI、ICCID、号码和运营商；但未实现 call state、network type 等 ThreatMetrix 可能使用的 phone state profiling 细项 |
| IP address | Product / brochure | 未实现 | 当前没有公网 IP 或服务端 IP 解析 |
| GeoIP / true location | Product / brochure | 未实现 | 当前没有 IP 派生位置或 GPS / IP 对比 |
| Proxy / VPN | Product / brochure / location anomaly | 未实现 | 当前没有代理、VPN 或网络出口风险判断 |

### 3.3 风险环境与异常态

| 维度 | ThreatMetrix 公开信号 | 当前实现状态 | 备注 |
|------|-----------------------|--------------|------|
| Device emulation | mobile SDK case study | 未实现 | 当前没有模拟器硬件不一致、Build 异常、驱动或传感器缺失检测 |
| Tampering | mobile SDK case study | 未实现 | 当前没有 app repackaging、request tampering、runtime memory tamper 或 certificate tamper 检测 |
| Root / jailbreak cloaking | mobile SDK case study | 未实现 | 当前没有 root 隐藏、Magisk Hide / Zygisk、Xposed、Frida、Substrate 等绕过检测 |
| Device spoofing | anomaly and device spoofing detection | 未实现 | 当前没有 Build、UA、sensor、location、network、runtime 或服务端图谱不一致检测 |
| Bot patterns | brochure / bot attacks | 未实现 | 当前没有触控节奏、输入时序、传感器稳定性、HTTP/TLS 指纹或设备农场频次模型 |
| RAT patterns | remote access trojan patterns | 未实现 | 当前没有远控进程、Accessibility、屏幕共享、可疑应用或行为异常检测 |
| Location / distance anomaly | geolocation / distance anomalies | 未实现 | 当前没有 GPS、IP、GeoIP、VPN / proxy 的多源位置一致性模型 |

### 3.4 行为、历史与连续性

| 维度 | ThreatMetrix 公开来源 | 当前实现状态 | 备注 |
|------|-----------------------|--------------|------|
| Behavioral patterns | Product / brochure | 未实现 | 当前没有行为遥测采集 |
| User device interactions | Product / brochure | 未实现 | 当前没有点击、触摸、输入、表单或操作序列 |
| Activity patterns | Product / brochure | 未实现 | 当前没有活动模式或时序聚合 |
| History / velocity | Product / brochure | 未实现 | 当前没有跨事件频次、速度或历史聚合 |
| Previous risk associations | Product / brochure | 未实现 | 当前没有同设备、同 IP、同账户、同邮箱、同手机号等历史风险关联 |
| Strong ID cryptographic bind | Strong ID / smart authentication | 未实现 | 当前没有 key pair、Android Keystore、SDK storage 或服务端 token 绑定模型 |
| Strong ID lifecycle | Strong ID / persistent device recognition | 未实现 | 当前没有重装、清数据、系统升级、换设备、换账号后的绑定生命周期 |

### 3.5 服务端衍生与风控画像

以下字段不是单纯 Android 本地读取字段，但 ThreatMetrix / LexisNexis Risk Solutions 公开材料将其作为 Digital Identity Network、LexID Digital 或 fraud decisioning 输出。当前 `DeviceInfoRepository` 没有等价产物。

| 维度 | ThreatMetrix 公开来源 | 当前实现状态 |
|------|-----------------------|--------------|
| LexID Digital | Digital Identity Network | 未实现 |
| Confidence score | Digital Identity Network / USAePay | 未实现 |
| Trust score | Digital Identity Network | 未实现 |
| Reason codes | USAePay / risk output | 未实现 |
| Digital identity graph links | graph visualization / link analysis | 未实现 |
| Identity and link analysis | Digital Identity Network | 未实现 |
| Devices / credentials / threats / behavior graph | Digital Identity Network | 未实现 |
| Consortium / shared intelligence | Digital Identity Network global intelligence | 未实现 |
| Transaction data risk context | Fraud decisioning | 未实现 |
| Email / phone / physical address identity graph | Product / brochure | 未实现 |
| Portal offline model data | Portal / inline variables / rules | 未实现 |

---

## 4. 公开资料缺口

ThreatMetrix 公开资料大多只暴露 SDK 接入方式、权限入口、服务端能力和风险输出，不公开 Android 原始 attribute 和算法。以下缺口应作为后续是否实现的追问项。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | Android `TMXProfiling` collected attributes 全量字段 | 决定哪些字段已由当前 repository 覆盖，哪些还需要新增 |
| Q-2 | `READ_PHONE_STATE` 具体用途 | 当前已覆盖部分 Telephony 字段，但不知道是否还需要 call state、network type 或其他 phone state |
| Q-3 | Wi-Fi state 具体字段 | 决定是否采集 SSID、BSSID、RSSI、连接状态、代理配置或网络类型 |
| Q-4 | SDK 是否采集 App Set ID / MediaDrm / Keystore key 等锚点 | Android ID、GAID、Widevine 已覆盖，但 App Set ID、Keystore key 等未覆盖 |
| Q-5 | `sessionId` 生命周期 | 决定过期时间、重用规则、跨屏幕 / 跨交易复用边界 |
| Q-6 | Strong ID cryptographic bind 的客户端材料 | 决定是否依赖 key pair、Android Keystore、cookie、local storage、SDK storage 或服务端 token |
| Q-7 | Strong ID 生命周期 | 决定 app 重装、清数据、系统升级、换设备、换账号后的行为 |
| Q-8 | Device spoofing detection 输入 | 决定检测 Build props、UA、sensor、location、network、runtime 还是服务端图谱不一致 |
| Q-9 | Root / jailbreak cloaking 覆盖范围 | 决定是否覆盖 Magisk Hide / Zygisk、Xposed / LSPosed、Frida、Substrate、su hide |
| Q-10 | Tampering 分类 | 决定是否区分 app repackaging、request tampering、runtime memory tamper、certificate tamper |
| Q-11 | Device emulation 分类 | 决定是否区分 AOSP emulator、Genymotion、云手机、Android container、ChromeOS Android Runtime |
| Q-12 | RAT patterns 输入 | 决定是否包含已安装应用、Accessibility、屏幕共享、远控进程、行为异常或服务端关系模式 |
| Q-13 | Bot patterns 输入 | 决定是否包含触控节奏、输入时序、传感器稳定性、HTTP/TLS 指纹或设备农场频率 |
| Q-14 | Location / distance anomaly 算法 | 决定距离阈值、GPS / IP 优先级、VPN / proxy 处理策略 |
| Q-15 | LexID confidence score / trust score 特征 | 决定是否包含 Android 本地 profiling 原始字段 |
| Q-16 | Digital identity graph device 节点规则 | 决定同一设备如何合并 / 拆分 |
| Q-17 | Previous risk associations 范围 | 决定是否区分同设备、同 IP、同账户、同邮箱、同手机号、同地址、同支付工具 |
| Q-18 | Portal offline model 字段 | 决定可用的是 Android SDK 原始字段还是派生变量 |
| Q-19 | Consortium 数据回流方式 | 决定共享网络数据是否能成为单次 Android profiling 的 reason code |
| Q-20 | Android 隐私权限拒绝时的降级字段集合 | 决定无 phone / location / Wi-Fi 权限时还能保留哪些能力 |

---

## 5. 当前结论

按 `DeviceInfoRepository` 当前实现，ThreatMetrix 公开材料中与品牌、型号、厂商、Android 版本、SDK 版本、ROM 属性、OAID、Android ID、GAID、Widevine、IMEI / MEID、IMSI、ICCID、运营商相关的本地基础字段不再作为缺口保留。

当前仍有价值的 ThreatMetrix 缺口集中在五类：

1. SDK profiling：`sessionId`、collection reference、profiling status、collected attributes、custom attributes、profiling domain / org id。
2. 权限入口与网络位置：GPS / coarse location、Wi-Fi state、phone state profiling 细项、IP、GeoIP、proxy / VPN。
3. 风险环境：device emulation、tampering、root / jailbreak cloaking、device spoofing、bot patterns、RAT patterns、location / distance anomaly。
4. 行为与连续性：behavioral patterns、user device interactions、activity patterns、history / velocity、previous risk associations、Strong ID cryptographic bind。
5. 服务端智能信号：LexID Digital、confidence score、trust score、reason codes、identity graph、link analysis、consortium intelligence、transaction risk context、Portal offline model data。
