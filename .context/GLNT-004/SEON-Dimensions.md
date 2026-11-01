# C-008 · SEON 未实现维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-26 17:35:58
>
> 视角：SEON 厂商 LENS
> 来源：TASK-008
> 当前口径：以 `DeviceInfoRepository` 的实际实现为准，删除已实现字段，仅保留未实现字段、服务端衍生能力和公开资料缺口。

---

## 0. 整理口径

`DeviceInfoRepository` 已实现以下字段族，因此本文不再把这些字段作为 SEON 缺口保留：

- `BuildInfo` 中的品牌、型号、厂商、设备代号、产品名、Android 版本、SDK 版本、主板、硬件、显示版本、Build fingerprint、Build ID、Serial。
- `RomInfo` 中的主流厂商 ROM system property，包括 MIUI / HyperOS / EMUI / Magic / OPPO / OnePlus / Realme / Vivo / OneUI / Flyme / Smartisan / LeTV / Lenovo / Nubia / Oxygen / Harmony 相关属性。
- `IdentifierInfo` 中的 OAID、Android ID / SSAID、GAID、Widevine Device ID。
- `TelephonyInfo` 中的 IMEI / MEID 合并读取、IMSI、ICCID、MSISDN、本机号码、SIM / Network operator、SIM state、SIM operator name。

本文保留的内容满足以下任一条件：

- SEON 公开材料明确提及，但 `DeviceInfoRepository` 当前没有字段或读取方法。
- SEON 公开材料只暴露服务端信号、聚合结果或风险判断，当前本地实现没有等价产物。
- SEON 公开材料提及能力但未公开具体 attribute，需要作为后续追问或实现决策项。

不保留 iOS-only 字段作为 Android 实现缺口；例如 `is_screen_captured` 属于 iOS Native 语境，本文不列入 Android 待实现字段。

---

## 1. SEON 产品定位

SEON 公开材料将自身定位为 **AI Fraud Prevention & AML Compliance Platform**。它不是只提供本地设备字段采集，而是把设备指纹、行为生物特征、地理围栏、数字足迹和 AI 风控评分组合成实时风险决策能力。

与 `DeviceInfoRepository` 的差异在于：`DeviceInfoRepository` 当前主要采集 Android 本地基础标识、Build / ROM / Telephony 字段；SEON 的核心差异化集中在 True Device ID、8 类 hash、behavioral biometrics、remote access / device farm / vishing 等 suspicious flags，以及服务端 Fraud API / Geofence API 的风险输出。

---

## 2. Android / Mobile 接入方式

SEON 公开材料中的接入形态：

| 形态 | 说明 |
|------|------|
| Android SDK | Native Android Java / Kotlin app 接入，生成 device fingerprint session |
| iOS SDK | iOS Native 接入；iOS-only 字段不作为本文 Android 缺口 |
| JavaScript SDK | Web / H5 使用，覆盖浏览器指纹、WebGL、Canvas、Fonts、TCP/IP + TLS 等 Web 侧信号 |
| React Native Plugin | 跨端移动应用接入 |
| Flutter Plugin | 跨端移动应用接入 |
| Unity Plugin | 游戏 / Unity 应用接入 |
| Fraud API | 服务端接收 session，返回 risk score、suspicious flags 和决策结果 |
| Geofence API | 服务端接收 session，用 GPS / IP / browser location 等信号做地理围栏判断 |

Android SDK 公开材料提到的关键能力包括 rooted / tampered device、emulator、remote access、screen mirroring、active call、automation、device farm、vishing、geolocation 和行为监控。当前 `DeviceInfoRepository` 没有实现这些风险检测链路。

---

## 3. 未实现字段清单

### 3.1 客户端原始属性

| 维度 | SEON 公开来源 | 当前实现状态 | 备注 |
|------|---------------|--------------|------|
| `device_memory` / RAM | Device characteristics / hardware details | 未实现 | 当前 `BuildInfo` 不含 RAM / memory 字段 |
| CPU / processor 细节 | Device characteristics / hardware details | 未实现 | 当前没有读取 CPU ABI 之外的 processor / core / frequency / `/proc/cpuinfo` 类字段 |
| Keyboard layout | User & Device Preferences | 未实现 | 当前没有读取键盘布局或输入法偏好 |
| Timezone | User & Device Preferences | 未实现 | 当前没有读取系统 IANA timezone |
| Display settings / brightness | User & Device Preferences | 未实现 | 当前没有读取亮度、显示设置或可访问性显示状态 |
| `battery_level` | User & Device Preferences | 未实现 | 当前没有读取 BatteryManager 或电池广播 |
| Charging status | User & Device Preferences | 未实现 | 当前没有读取充电状态 |
| Audio status and volume | User & Device Preferences | 未实现 | 当前没有读取音频模式、静音状态或音量 |
| GPS / location data | Geolocation / Geofence API | 未实现 | 当前没有读取 Android location provider、经纬度或定位精度 |
| IP address | Network insights | 未实现 | 当前没有采集本机公网 IP 或服务端解析 IP |
| ISP / connection type | Network insights | 未实现 | 当前没有 ISP、连接类型或网络出口画像 |

### 3.2 本地风险与完整性信号

| 维度 | SEON 公开信号 | 当前实现状态 | 备注 |
|------|---------------|--------------|------|
| Rooted Device | rooted or tampered devices | 未实现 | 当前没有 root 文件、包名、属性、Magisk 或 writable dir 检测 |
| Tampered Device / App Tampering | rooted or tampered devices | 未实现 | 当前没有重签名、完整性、调试、hook 或运行时篡改检测 |
| Hook / Frida | Device integrity 相关公开材料未展开 | 未实现 | 当前没有 Frida server / gadget / 注入特征检测 |
| Android Emulator / Simulator | emulator detection / simulated environments | 未实现 | 当前没有模拟器硬件不一致、Build 异常、驱动或传感器缺失检测 |
| App Cloning / Modified App | modified and cloned applications | 未实现 | 当前没有多开、克隆、重打包、安装路径或 profile 差异检测 |
| Geolocation Spoofing / Simulated Location | simulated location detection | 未实现 | 当前没有 mock location、fake GPS app 或 provider 差异检测 |
| Possible Automation | `possible_automation` | 未实现 | 当前没有 automation tool、脚本、传感器或行为异常检测 |
| Possible Device Farm | `possible_device_farm` | 未实现 | 当前没有设备农场行为、环境或频次模型 |
| Possible Cloud Device | `possible_cloud_device` | 未实现 | 当前没有云手机、虚拟化 Android 或 cloud-hosted device farm 指标 |
| Active Call / Ongoing Call | `possible_ongoing_call` | 未实现 | 当前 `TelephonyInfo` 只读标识与运营商信息，不判断通话进行中 |
| Possible Vishing | `possible_vishing` | 未实现 | 当前没有 interaction pattern、sensor data、active call 的复合判断 |
| Remote Control Active | `is_remote_control_connected` | 未实现 | 当前没有 AnyDesk / TeamViewer 等远控活动会话检测 |
| Remote Control Provider | `remote_control_provider` | 未实现 | 当前没有远控软件名称枚举 |
| Screen Mirroring | `is_screen_being_mirrored` | 未实现 | 当前没有投屏、屏幕镜像或媒体投射状态检测 |
| Interfering Apps | `interfering_apps` | 未实现 | 当前没有潜在远控、覆盖层、辅助功能或干扰应用列表 |

### 3.3 行为生物特征

SEON 将 behavioral biometrics 作为核心能力之一；当前 `DeviceInfoRepository` 没有行为遥测采集。

| 维度 | SEON 公开信号 | 当前实现状态 |
|------|---------------|--------------|
| Touch gestures / touch movement | `suspicious_touch_movement` | 未实现 |
| Accelerometer / gyroscope 行为异常 | behavior monitoring / sensor analysis | 未实现 |
| Keystroke characteristics | `suspicious_keypress_characteristics` | 未实现 |
| Mouse movement | `suspicious_mouse_movement` | 未实现 |
| Form fillout behavior | `suspicious_form_fillout` | 未实现 |
| Paste used | `paste_used` | 未实现 |
| Autofill used | `autofill_used` | 未实现 |
| No user interaction | `no_user_interaction` | 未实现 |

### 3.4 Web / WebView 与浏览器指纹

以下能力主要来自 SEON JavaScript SDK 或 Web 风险模型。当前 `DeviceInfoRepository` 是 Android 本地 repository，不包含 WebView / browser fingerprint 采集。

| 维度 | SEON 公开信号 | 当前实现状态 | 备注 |
|------|---------------|--------------|------|
| Screen resolution | Browser fingerprinting | 未实现 | 当前没有读取屏幕分辨率；Web 侧还会进入浏览器指纹 |
| WebGL fingerprint | Browser fingerprinting | 未实现 | 当前没有 WebGL renderer / vendor / canvas 上下文采集 |
| Canvas fingerprint | Browser fingerprinting | 未实现 | 当前没有 Canvas 绘制指纹 |
| Fonts fingerprint | Browser fingerprinting | 未实现 | 当前没有字体枚举或字体渲染指纹 |
| Browser Hash | 8 类 hash 体系 | 未实现 | Web 侧 hash；当前 Android repository 无等价产物 |
| Cookie Hash | 8 类 hash 体系 | 未实现 | 当前没有 cookie session identifier |
| Spoofing Hash | 8 类 hash 体系 | 未实现 | 当前没有 spoofing hash |
| Math Hash | 8 类 hash 体系 | 未实现 | 当前没有数学运算差异 hash |
| MIME Type Hash | 8 类 hash 体系 | 未实现 | 当前没有 MIME handling 能力指纹 |
| System Colors Hash | 8 类 hash 体系 | 未实现 | 当前没有系统颜色 / 视觉设置 hash |
| HTML Canvas Element Spoofing | `htmlcanvaselement_spoof` | 未实现 | 当前没有 Canvas API 篡改检测 |
| Experimental User-Agent Spoofing | `experimental_user_agent_spoofing` | 未实现 | 当前没有 User-Agent 篡改检测 |
| Private browsing / Incognito | private browsing detection | 未实现 | 当前没有浏览器隐私模式检测 |
| AI agent flags | `potential_ai_agent` / `openai_agent` / `devin_agent` / `manusai_agent` / `opera_neon_agent` | 未实现 | JS / 服务端风险信号，当前本地实现无等价产物 |

### 3.5 网络与环境

| 维度 | SEON 公开来源 | 当前实现状态 | 备注 |
|------|---------------|--------------|------|
| IP Geolocation | geolocation / geofencing | 未实现 | 当前没有 IP 派生 city / state / country / zip / lat / long |
| GPS 与 IP / browser location 差异 | Geofence API | 未实现 | 当前没有多来源位置一致性判断 |
| DNS tracking | IP address & DNS tracking | 未实现 | 当前没有 DNS resolver、DNS 请求或 DNS 异常检测 |
| TCP/IP + TLS fingerprints | Residential proxy detection | 未实现 | 当前没有底层 TCP/IP、TLS 指纹 |
| WebRTC IP detection | Default rules / WebRTC IP 多地址 | 未实现 | 当前没有 WebRTC 内网 / 多出口 IP 检测 |
| Proxy 分层检测 | `proxy1`-`proxy4` | 未实现 | SEON 未公开各层 trigger，当前也没有 proxy 判断 |
| VPN 分层检测 | `vpn1`-`vpn4` | 未实现 | SEON 未公开各层 trigger，当前也没有 VPN 判断 |
| Datacenter / hosting indicator | Default rules / IP intelligence | 未实现 | 当前没有数据中心 ISP、hosting 或 ASN 判断 |

### 3.6 服务端衍生与风控画像

以下字段不是单纯 Android 本地读取字段，但 SEON 公开材料将其作为 Device Intelligence / Fraud API / AI scoring 输出。当前 `DeviceInfoRepository` 没有等价产物。

| 维度 | SEON 公开来源 | 当前实现状态 |
|------|---------------|--------------|
| True Device ID | True Device ID / 8 类 hash 体系 | 未实现 |
| Device Hash | Understanding hashes | 未实现 |
| AI insights score | Machine Learning / score explanation | 未实现 |
| Fraud API risk score / state | Fraud API | 未实现 |
| Suspicious flags 聚合输出 | Device Intelligence / suspicious flags | 未实现 |
| Velocity rules | login / registration / transaction velocity | 未实现 |
| Network analysis | device / IP / email 关系网络 | 未实现 |
| Email clusters | 服务端聚合 email 关系 | 未实现 |
| Default rules | P105 / P106 / P112 / HC101 / HC107 等 | 未实现 |
| Geofence API verdict | Geofence API | 未实现 |

---

## 4. 公开资料缺口

SEON 公开资料大多只暴露 boolean、hash、flag 或聚合结果，不公开具体 attribute 和算法。以下缺口应作为后续是否实现的追问项。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | Root 检测具体 attribute | 决定是检查 su binary、Magisk、危险属性，还是依赖 Play Integrity / 其他安全服务 |
| Q-2 | Tampered device / app 的判断边界 | 决定覆盖重签名、debuggable、hook、运行时篡改还是请求篡改 |
| Q-3 | Hook / Frida 是否为 SEON 明确能力 | SEON 公开材料没有像 Fingerprint 一样明确暴露 `frida` 字段 |
| Q-4 | Android Emulator Detection 具体 attribute | 决定是否检查硬件不一致、缺失传感器、异常 driver、Build 特征或虚拟化文件 |
| Q-5 | App Cloning 检测路径 | 决定是否检测重签名、安装路径、多实例、profile 或包名差异 |
| Q-6 | Geolocation Spoofing non-intrusive check | 决定 mock location、fake GPS app、GPS / network provider 差异如何处理 |
| Q-7 | `possible_automation` trigger | 决定是行为节奏、传感器异常、自动化框架、辅助功能还是脚本痕迹 |
| Q-8 | `possible_device_farm` trigger | 决定本地可实现部分和服务端频次 / 关系图部分如何拆分 |
| Q-9 | `possible_cloud_device` hardware-level indicators | 决定云手机识别依赖虚拟化文件、硬件不一致、云厂商 IP 还是传感器缺失 |
| Q-10 | `possible_vishing` trigger | 决定是否由 active call、interaction hesitation、sensor pattern 和远控信号复合生成 |
| Q-11 | `remote_control_provider` 枚举 | 决定远控软件覆盖范围和包名 / 进程 / 服务识别策略 |
| Q-12 | `interfering_apps` 枚举 | 决定哪些覆盖层、辅助功能、远控或安全软件会被列入干扰应用 |
| Q-13 | Behavioral biometrics 原始事件格式 | 决定触摸、键盘、鼠标、表单、粘贴、自动填充如何采样和上送 |
| Q-14 | True Device ID 算法细节 | 决定 8 类 hash、网络、行为和服务端历史如何组合成统一 ID |
| Q-15 | 8 类 hash 的具体输入 | 决定 Device / Browser / Cookie / Spoofing / Math / MIME / System Colors hash 是否能本地复现 |
| Q-16 | Proxy / VPN `1`-`4` 分层含义 | 决定每层是 IP 库、TLS、DNS、WebRTC、行为还是服务端历史 |
| Q-17 | TCP/IP + TLS fingerprint 可见范围 | 决定 Android app 是否可采集，还是只能由服务端或 JS SDK 观察 |
| Q-18 | WebRTC IP detection 在移动端边界 | 决定该能力是否只属于 Web / WebView，还是 Native SDK 也参与 |
| Q-19 | AI agent flags trigger | 决定 OpenAI / Devin / Manus / Opera Neon 等标记来自 UA、浏览器特征、行为还是服务端模型 |

---

## 5. 当前结论

按 `DeviceInfoRepository` 当前实现，SEON 公开材料中与品牌、型号、厂商、Android 版本、SDK 版本、ROM 属性、OAID、Android ID、GAID、Widevine、IMEI / MEID、IMSI、ICCID、运营商相关的本地基础字段不再作为缺口保留。

当前仍有价值的 SEON 缺口集中在六类：

1. 本地未采集的设备状态：RAM / CPU 细节、keyboard layout、timezone、display settings、battery、charging、audio、location、IP / ISP。
2. 本地风险检测：root、tamper、hook / Frida、emulator、app cloning、geolocation spoofing、automation、device farm、cloud device。
3. 远程访问与通话风险：active call、vishing、remote control、remote control provider、screen mirroring、interfering apps。
4. 行为生物特征：touch、sensor、keypress、mouse、form、paste、autofill、no interaction。
5. Web / WebView 与网络指纹：WebGL、Canvas、Fonts、8 类 hash、UA / Canvas spoofing、incognito、DNS、TCP/IP + TLS、WebRTC、proxy / VPN / datacenter。
6. 服务端智能信号：True Device ID、AI insights score、Fraud API risk score、suspicious flags、velocity、network analysis、email clusters、default rules、Geofence API verdict。
