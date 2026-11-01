# C-005 · Fingerprint 未实现维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-07-15 00:00:00
>
> 视角：Fingerprint 厂商 LENS
> 来源：TASK-005
> 当前口径：以 `DeviceInfoRepository` 的实际实现为准，删除已实现字段，仅保留未实现字段、服务端衍生能力和公开资料缺口。

---

## 0. 整理口径

`DeviceInfoRepository` 已实现以下字段族，因此本文不再把这些字段作为 Fingerprint 缺口保留：

- `BuildInfo` 中的品牌、型号、厂商、设备代号、产品名、Android 版本、SDK 版本、主板、硬件、显示版本、Build fingerprint、Build ID、Serial。
- `IdentifierInfo` 中的 OAID、Android ID / SSAID、GAID、Widevine Device ID。
- `TelephonyInfo` 中的 IMEI / MEID 合并读取、IMSI、ICCID、MSISDN、本机号码、SIM / Network operator、SIM state、SIM operator name。
- `DisplayInfo` 中的物理宽度、物理高度、刷新率、旋转、显示状态、HDR 与广色域状态。
- `MemoryInfo` 中的总内存与标称内存。
- `BatteryInfo` / `PowerInfo` 中的电池电量与省电模式状态。

本文保留的内容满足以下任一条件：

- Fingerprint 公开材料明确提及，但 `DeviceInfoRepository` 当前没有字段或读取方法。
- Fingerprint 公开材料只暴露服务端信号、聚合结果或风险判断，当前本地实现没有等价产物。
- Fingerprint 公开材料提及能力但未公开具体 attribute，需要作为后续追问或实现决策项。

---

## 1. Fingerprint 产品定位

Fingerprint 公开材料将自身定位为 **device intelligence platform**，核心产物是跨 session 的 `visitorId`。其公开能力分为三层：

- **Device identification**：用 100+ device and network signals 生成设备访问标识。
- **Device intelligence**：在设备标识上叠加 behavioral / network signals，识别 emulator、automation framework、VPN、proxy 等风险信号。
- **Smart signals**：把设备智能结果组织成可消费字段，覆盖 Bot Detection、VPN Detection、Emulator & Virtual Machine Detection、Developer Tools Detection、Geolocation Spoofing Detection 等。

与 `DeviceInfoRepository` 的差异在于：`DeviceInfoRepository` 当前主要采集本地原始字段；Fingerprint 的核心差异化是服务端 fuzzy matching、跨 session `visitorId` 和 smart signals 风险解释层。

---

## 2. Android / Mobile 接入方式

Fingerprint 公开材料中的移动端接入形态：

| 形态 | 说明 |
|------|------|
| Native Android SDK | `fingerprint-android-pro`，商业 SDK，采集本地信号并上送服务端 |
| Open-source Android library | `fingerprintjs-android`，本地 hash，无服务端 fuzzy matching |
| React Native SDK | `fingerprintjs-pro-react` |
| Flutter SDK | `fingerprintjs-pro-flutter` |
| JavaScript agent | Web / H5 使用；与 Android SDK 的 `visitorId` 不同源 |
| Server API v4 / Webhooks | 服务端读取 smart signals、raw device attributes 和事件流 |
| Sealed Client Results | 客户端不直接读取 signal，由服务端验签后取回 |

权限层面，Fingerprint 公开材料提到 Android SDK 需要 `INTERNET`，并提到 `READ_GSERVICES` 可用于 Google Services Framework 相关读取。`DeviceInfoRepository` 当前没有读取 GSF ID。

---

## 3. 未实现字段清单

### 3.1 客户端原始属性

| 维度 | Fingerprint 公开来源 | 当前实现状态 | 备注 |
|------|----------------------|--------------|------|
| GSF ID（Google Services Framework ID） | Android 设备识别材料 / Raw Device Attributes 示例 | 未实现 | `DeviceInfoRepository` 未读取 GSF ID；当前只实现 Android ID、OAID、GAID、Widevine |
| `languages` | Raw Device Attributes | 未实现 | 当前没有读取系统语言 / preferred languages |
| `screen_resolution` | Raw Device Attributes | 未实现 | 当前代码已读取显示物理宽高，但尚未形成统一的 `screen_resolution` 字段；Fingerprint 文档中 Android 支持仍为 coming soon |

### 3.2 本地风险与完整性信号

| 维度 | Fingerprint signal | 当前实现状态 | 备注 |
|------|--------------------|--------------|------|
| Rooted Device | `root_apps` | 未实现 | 当前没有 root 文件、包名、属性或 writable dir 检测 |
| Frida Detection | `frida` | 未实现 | 当前没有 Frida server / gadget / 注入特征检测 |
| Android Emulator Detection | `emulator` | 未实现 | 当前没有模拟器硬件不一致、缺失传感器、异常 driver 检测 |
| Cloned App Detection | `cloned_app` | 未实现 | 当前没有多开、克隆、重打包或 profile 差异检测 |
| MitM Attack Detection | `mitm_attack` | 未实现 | 当前没有证书、代理劫持或链路完整性检测 |
| Tampered Request Detection | `tampering` + `tampering_details.anomaly_score` | 未实现 | 当前没有请求篡改或 anomalous device attributes 评分 |
| Developer Tools Detection | `developer_tools` | 未实现 | 当前没有 developer options、ADB、USB debugging、Wireless debugging 读取或聚合 |
| Geolocation Spoofing Detection | `location_spoofing` | 未实现 | 当前没有 mock location、provider 差异或 fake GPS app 检测 |

### 3.3 时间与稳定性

| 维度 | Fingerprint 公开来源 | 当前实现状态 | 备注 |
|------|----------------------|--------------|------|
| Factory Reset Timestamp | Factory Reset Detection | 未实现 | 当前没有读取或推断 factory reset 时间戳 |
| `visitorId` 跨场景保持 | Native Android integration 文档 | 未实现 | 这是 Fingerprint 服务端 fuzzy matching 产物，不是当前本地字段 |
| 多 user profile / 多 account 下同设备保持 | Native Android integration 文档 | 未实现 | 当前没有跨 profile / account 的设备连续性模型 |

### 3.4 网络与环境

| 维度 | Fingerprint 公开来源 | 当前实现状态 | 备注 |
|------|----------------------|--------------|------|
| Timezone（IANA） | Raw Device Attributes / VPN origin timezone | 未实现 | 当前没有读取系统 timezone |
| IP Geolocation | IP Geolocation signal | 未实现 | 当前没有 IP、GeoIP、city、country、postal code、accuracy radius 等字段 |
| ASN information | IP Geolocation signal | 未实现 | 当前没有 ASN number / name / network / type |
| Datacenter indicator / name | IP Geolocation signal | 未实现 | 当前没有 datacenter_result 或 datacenter_name |
| `vpn_methods.timezone_mismatch` | VPN Detection | 未实现 | 当前没有 timezone 与网络来源对比 |
| `vpn_methods.public_vpn` | VPN Detection | 未实现 | 当前没有公开 VPN 库匹配 |

### 3.5 服务端衍生与风控画像

以下字段不是单纯 Android 本地读取字段，但 Fingerprint 公开材料将其作为 smart signals 或服务端输出。当前 `DeviceInfoRepository` 没有等价产物。

| 维度 | Fingerprint 公开来源 | 当前实现状态 |
|------|----------------------|--------------|
| `proxy` + `proxy_confidence` + `proxy_details` | Proxy Detection | 未实现 |
| VPN Detection 整体结论 | VPN Detection | 未实现 |
| Suspect Score | Suspect Score signal | 未实现 |
| Velocity Signals | per visitorID / linkedID / IP 计数 | 未实现 |
| Proximity Detection | `proximity.id` + `precision_radius` + `confidence` | 未实现 |
| IP Blocklist | `email_spam` / `attack_source` / `tor_node` | 未实现 |
| High-Activity Device | visitorID 24h 活跃度分位 | 未实现 |
| `linked_id` 关联 | Velocity Signals per linkedID | 未实现 |

---

## 4. 公开资料缺口

Fingerprint 公开资料大多只暴露 boolean、hash 或聚合结果，不公开具体 attribute 和算法。以下缺口应作为后续是否实现的追问项。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | Root 检测具体 attribute | 决定是检查 su binary、Magisk、危险属性，还是依赖其他安全服务 |
| Q-2 | Frida 检测具体 attribute | 决定是否检查 frida-server 端口、frida-gadget、进程内存或符号特征 |
| Q-3 | Emulator 检测具体 attribute | 决定是否检查硬件不一致、缺失传感器、异常 driver 或 Build 特征 |
| Q-4 | Cloned App 检测路径 | 决定是否检测重签名、安装路径、多实例、profile 或包名差异 |
| Q-5 | MitM 检测路径 | 决定是否需要证书 pinning、代理证书、TLS 异常或系统代理检测 |
| Q-6 | Tampered Request anomaly score | 决定 anomaly_score 是字段缺失、分布异常、哈希冲突还是请求签名异常 |
| Q-7 | Developer Tools 检测路径 | 决定读取 Settings.Global、system property、ADB 广播还是多源聚合 |
| Q-8 | Geolocation Spoofing non-intrusive check | 决定 mock location、fake GPS app、GPS/network provider 差异如何处理 |
| Q-9 | Raw Device Attributes 全量列表 | Fingerprint 宣称 100+ signals，但公开 mobile raw attributes 只展示少量字段 |
| Q-10 | `visitorId` fuzzy matching 算法 | 决定服务端如何组合硬件、软件、网络、行为信号 |
| Q-11 | Sealed Client Results 加密边界 | 决定客户端是否能安全消费 smart signals |
| Q-12 | IP Geolocation 精度边界 | 决定 IP 位置能力是否适合作为本地缺口或仅作为服务端能力 |
| Q-13 | Proximity Detection 应用层规则 | 决定 co-location / device farm 是否进入本地或服务端模型 |
| Q-14 | High-Activity Device 阈值 | 决定是否能本地复现，或只能作为服务端频次建模结果 |
| Q-15 | Factory Reset Detection 算法升级 | 决定如何区分真实 factory reset、系统更新和 Google silent update |
| Q-16 | VPN `auxiliary_mobile` 细节 | 决定是否存在移动端私有采集信号 |
| Q-17 | Proxy provider 列表 | 决定住宅代理 / 数据中心代理识别粒度 |
| Q-18 | `datacenter_name` 枚举 | 决定数据中心识别覆盖范围 |
| Q-19 | Velocity Signals 10000 事件上限逻辑 | 决定高活跃设备的服务端截断策略 |

---

## 5. 当前结论

按 `DeviceInfoRepository` 当前实现，Fingerprint 公开材料中已被覆盖的本地基础标识与 Build 类字段不再作为缺口保留。

当前仍有价值的 Fingerprint 缺口集中在四类：

1. 本地未采集的设备状态：`languages`、`screen_resolution`；系统 timezone 仍未采集。
2. 本地风险检测：root、Frida、emulator、cloned app、MitM、tampering、developer tools、geolocation spoofing。
3. 稳定性与连续性：Factory Reset Timestamp、`visitorId` 服务端 fuzzy matching、跨 profile / account 连续性。
4. 服务端智能信号：proxy、VPN、Suspect Score、Velocity、Proximity、IP blocklist、High-Activity Device、IP geolocation / ASN / datacenter。
