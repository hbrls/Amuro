# C-023 · 同盾科技 / 小盾设备指纹 未实现维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-07-15 00:00:00
>
> 视角：同盾科技 / 小盾设备指纹 厂商 LENS
> 来源：TASK-023
> 当前口径：以 `DeviceInfoRepository` 的实际实现为准，删除已实现字段，仅保留未实现字段、服务端衍生能力和公开资料缺口。

---

## 0. 整理口径

`DeviceInfoRepository` 已实现以下字段族，因此本文不再把这些字段作为同盾缺口保留：

- `BuildInfo` 中的品牌、型号、厂商、设备代号、产品名、Android 版本、SDK 版本、主板、硬件、显示版本、Build fingerprint、Build ID、Serial。
- `RomInfo` 中的主流厂商 ROM system property，包括 MIUI / HyperOS / EMUI / Magic / OPPO / OnePlus / Realme / Vivo / OneUI / Flyme / Smartisan / LeTV / Lenovo / Nubia / Oxygen / Harmony 相关属性。
- `IdentifierInfo` 中的 OAID、Android ID / SSAID、GAID、Widevine Device ID。
- `TelephonyInfo` 中的 IMEI / MEID 合并读取、IMSI、ICCID、MSISDN、本机号码、SIM / Network operator、SIM state、SIM operator name。
- `DisplayInfo` 中的物理宽度、物理高度、刷新率、旋转、显示状态、HDR 与广色域状态。
- `MemoryInfo` 中的总内存与标称内存。
- `BatteryInfo` / `PowerInfo` 中的电池电量与省电模式状态。

同盾开源 `deviceDetail` 中的 `androidId`、`brand`、`model`、`product`、`display`、`fingerprint`、`hardware`、`sdkVersion`、`simOperator`、`networkOperator` 等基础字段，凡是已由当前代码覆盖的，不再作为缺口保留。本文只保留当前代码没有等价字段、风险检测、服务端模型或 Pro 能力的部分。

`gsfId` 是同盾公开样例中的独有字段，当前代码未实现，作为同盾未实现字段保留。HarmonyOS 专属能力只作为同盾 / 鸿蒙资料缺口记录，不扩大到 Android 通用字段。

---

## 1. 同盾产品定位

同盾 TrustDevice / 小盾设备指纹定位为 device fingerprint + device intelligence + device risk + 反欺诈决策引擎。公开材料同时包含开源版和 Pro 版：开源版给出 `device_detail` 样例、9 项 risk label 和基础设备 ID；Pro 版强调 70+ 风险标签、设备风险分、环境风险、欺诈工具检测、行为活动捕获、VMP 加固、鸿蒙原生 SDK 和跨行业联防联控。

核心能力分为七层：

| 层级 | 公开表达 | 与当前实现的差异 |
|------|----------|------------------|
| 开源 deviceDetail | 60+ 字段 JSON | 当前覆盖其中基础 Build / ID / Telephony，以及部分显示、内存和电源字段 |
| 开源 Risk Label | root、debug、multiple、xposed、magisk、hook、emulator、vpn、device_info_tampered | 当前没有这些风险标签 |
| Pro 风险能力 | 70+ 风险标签、100+ 设备风险标签、3000+ 黑产工具、30+ 作弊框架 | 当前没有同盾 Pro 风险库 |
| 设备 ID | device_id，客户端预生成 + 服务端二次确认 | 当前没有同盾设备 ID |
| SDK 防护 | OLLVM、VMP、防抓包、防降级 | 当前没有同盾 SDK 防护 |
| 反欺诈决策 | TrustDecision 决策引擎、实时模型、离线分析 | 当前没有决策引擎 |
| HarmonyOS | HarmonyOS / HarmonyOS NEXT SDK | 当前 Android 实现不处理鸿蒙 SDK |

与 `DeviceInfoRepository` 的差异在于：`DeviceInfoRepository` 当前采集 Android 本地基础标识、Build / ROM / Telephony，以及部分显示、内存、电源字段；同盾的差异化集中在更大的设备详情集合、风险标签、设备 ID fallback 组合、Pro 风险库、加固和防抓包、设备画像、IP Location、Risk Score、Environment Risk Evaluation、Fraud Tools Detection、Behavioral Activity Capturing。

---

## 2. Android / Mobile 接入方式

同盾公开材料中的接入形态：

| 形态 | 说明 |
|------|------|
| 开源 Android SDK | `com.trustdecision.android:mobrisk`，`TDRisk.getBlackbox()` 输出 `device_id`、`device_risk_label`、`device_detail` |
| 异步回调 | `TDRiskCallback.onEvent(JSONObject deviceInfo)` |
| Pro Android SDK | 商业版，VMP 加固，字段和风险标签更丰富 |
| iOS / JS SDK | trustdevice-ios / trustdevice-js |
| HarmonyOS SDK | HarmonyOS / HarmonyOS NEXT 原生设备指纹 SDK |
| Server API | TrustDecision 反欺诈决策引擎 |
| SaaS / PaaS | 支持 SaaS 和私有化 / 专有云 |

当前 `DeviceInfoRepository` 没有接入同盾 SDK，也没有 `getBlackbox()`、risk label、device_id、Pro 风险库、服务端二次确认、SaaS / PaaS 或鸿蒙 SDK。

---

## 3. 未实现字段清单

### 3.1 开源 deviceDetail 中未覆盖的字段

| 维度 | 同盾公开表达 | 当前实现状态 | 备注 |
|------|--------------|--------------|------|
| `gsfId` | Google Services Framework ID | 未实现 | 同盾独有字段 |
| `abiType` | 支持 ABI 列表 | 未实现 | 当前没有 ABI 列表 |
| `cpuHardware` | CPU hardware | 未实现 | 当前没有 CPU 硬件字段 |
| `cpuProcessor` | CPU processor | 未实现 | 当前没有 CPU processor |
| `coresCount` | CPU 核心数 | 未实现 | 当前没有 CPU 核心数 |
| `host` | Build host | 未实现 | 当前没有 Build.HOST |
| `vbMetaDigest` | Verified Boot metadata digest | 未实现 | 当前没有 VBMeta 摘要 |
| `country` | 国家字段 | 未实现 | 当前没有国家代码 |
| `availableMemory` | 可用内存 | 未实现 | 当前没有内存容量 |
| `availableStorage` | 可用存储 | 未实现 | 当前没有存储容量 |
| `totalStorage` | 总存储 | 未实现 | 当前没有总存储 |
| `filesAbsolutePath` | App files 绝对路径 | 未实现 | 当前没有应用私有路径 |
| `defaultInputMethod` | 默认输入法 | 未实现 | 当前没有输入法信息 |
| `systemAppList` | 系统应用列表 | 未实现 | 当前没有系统应用列表 |
| `appList` | 应用列表 | 未实现 | 当前没有安装应用列表 |

### 3.2 显示、电池、传感器与系统状态

| 维度 | 同盾公开表达 | 当前实现状态 | 备注 |
|------|--------------|--------------|------|
| `screenInches` | 屏幕英寸 | 未实现 | 当前没有屏幕尺寸 |
| `screenBrightness` | 屏幕亮度 | 未实现 | 当前没有亮度 |
| `screenOffTimeout` | 熄屏超时 | 未实现 | 当前没有屏幕超时 |
| `batteryHealthStatus` | 电池健康 | 未实现 | 当前没有电池健康 |
| `batteryStatus` | 充电 / 满电状态 | 未实现 | 当前没有电池状态 |
| `batteryTemp` | 电池温度 | 未实现 | 当前没有电池温度 |
| `batteryTotalCapacity` | 电池总容量 | 未实现 | 当前没有电池容量 |
| `sensorsInfo` | 传感器信息 | 未实现 | 当前没有传感器列表 / 传感器指纹 |

### 3.3 系统设置、调试和运行时状态

| 维度 | 同盾公开表达 | 当前实现状态 | 备注 |
|------|--------------|--------------|------|
| `accessibilityEnabled` | 无障碍服务状态 | 未实现 | 当前没有 Accessibility 检测 |
| `adbEnabled` | ADB 状态 | 未实现 | 当前没有 ADB 检测 |
| `developmentSettingEnabled` | 开发者选项 | 未实现 | 当前没有开发者选项检测 |
| `allowMockLocation` | 允许模拟位置 | 未实现 | 当前没有 mock location 检测 |
| `httpProxy` | HTTP 代理 | 未实现 | 当前没有 HTTP 代理检测 |
| `dataRoaming` | 数据漫游 | 未实现 | 当前没有 data roaming |
| `debug` | 调试状态 / risk label 输入 | 未实现 | 当前没有调试风险检测 |

### 3.4 开源 9 项风险标签

| 维度 | 同盾公开表达 | 当前实现状态 | 备注 |
|------|--------------|--------------|------|
| Root | `root` | 未实现 | 当前没有 root 检测 |
| Debug | `debug` | 未实现 | 当前没有 debugger / debuggable 检测 |
| Multiple | `multiple` | 未实现 | 当前没有多开 / 克隆检测 |
| Xposed | `xposed` | 未实现 | 当前没有 Xposed 检测 |
| Magisk | `magisk` | 未实现 | 当前没有 Magisk 检测 |
| Hook | `hook` | 未实现 | 当前没有 hook 检测 |
| Emulator | `emulator` | 未实现 | 当前没有模拟器检测 |
| VPN | `vpn` | 未实现 | 当前没有 VPN 检测 |
| Device info tampered | `device_info_tampered` | 未实现 | 当前没有设备信息篡改检测 |

### 3.5 Pro 风险库、攻击工具与行为能力

| 维度 | 同盾公开表达 | 当前实现状态 | 备注 |
|------|--------------|--------------|------|
| 70+ risk labels | Pro 版 | 未实现 | 当前没有同盾 Pro 标签 |
| 100+ 设备风险标签 | 小盾安全 | 未实现 | 当前没有同盾标签体系 |
| 3000+ 黑产工具 | 高效识别黑产工具 | 未实现 | 当前没有黑产工具库 |
| 30+ 作弊框架 | 作弊框架识别 | 未实现 | 当前没有作弊框架库 |
| Fraud Tools Detection | Pro 独有 | 未实现 | 当前没有欺诈工具检测 |
| Behavioral Activity Capturing | Pro 独有 | 未实现 | 当前没有行为活动捕获 |
| Environment Risk Evaluation | Pro 独有 | 未实现 | 当前没有环境风险评估 |
| Device Risk Score | Pro 独有 | 未实现 | 当前没有设备风险分 |
| IP Location | Pro 独有 | 未实现 | 当前没有 IP Location |
| Offerwall 软件 | 产品页公开 | 未实现 | 当前没有积分墙 / offerwall 检测 |
| Replay attack | Pro 对比表 | 未实现 | 当前没有重放攻击检测 |
| 二次打包 | Pro 对比表 | 未实现 | 当前没有二次打包检测 |

### 3.6 SDK 防护与服务端决策

| 维度 | 同盾公开表达 | 当前实现状态 | 备注 |
|------|--------------|--------------|------|
| device_id | 开源输出 | 未实现 | 当前没有同盾设备 ID |
| 客户端预生成第一指纹 | 专利摘要 | 未实现 | 当前没有本地 first fingerprint |
| 服务端第二指纹确认 | 专利摘要 | 未实现 | 当前没有服务端二次确认 |
| fallback DeviceId 组合 | imei + udid + wifiMac 等 | 未实现 | 当前没有 fallback 组合 |
| OLLVM | 开源版代码保护 | 未实现 | 当前没有 OLLVM |
| VMP | Pro 版标配 VMP | 未实现 | 当前没有 VMP 加固 |
| 防抓包 | Android 能力 | 未实现 | 当前没有 anti-packet-capture |
| 防降级 | Pro / 对比表 | 未实现 | 当前没有防降级 |
| TrustDecision 决策引擎 | 实时决策模型 / 离线分析 | 未实现 | 当前没有同盾决策引擎 |
| 全球风险联防联控 | 多层次风控 | 未实现 | 当前没有跨客户风险联防 |

---

## 4. 公开资料缺口

同盾开源版公开字段粒度高，但 Pro 版字段表、70+ 标签和服务端算法仍不透明。以下缺口应作为后续是否实现的追问项。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | Pro 版完整字段表 | 决定开源 60+ 字段之外还有哪些字段 |
| Q-2 | Pro 版 70+ 风险标签 | 决定风险标签实现边界 |
| Q-3 | `gsfId` 生命周期和用途 | 决定是否作为同盾独有设备锚点 |
| Q-4 | device_id 生成算法 | 决定跨重装、清数据、恢复出厂、换账号稳定性 |
| Q-5 | fallback DeviceId 组合实际实现 | 决定专利和 CSDN 分析是否仍适用于当前版本 |
| Q-6 | VMP 和防抓包实现 | 决定 Android SDK 防护强度 |
| Q-7 | Fraud Tools Detection 工具库 | 决定 3000+ 黑产工具和 30+ 作弊框架覆盖范围 |
| Q-8 | Behavioral Activity Capturing 原始信号 | 决定触控、滑动、传感器、会话行为是否采集 |
| Q-9 | Environment Risk Evaluation 维度 | 决定环境风险具体标签 |
| Q-10 | Device Risk Score reason code | 决定评分能否解释 |
| Q-11 | HarmonyOS SDK 字段表 | 决定鸿蒙与 Android 字段差异 |
| Q-12 | TrustDecision 服务端 API | 决定客户端输出如何进入决策引擎 |
| Q-13 | 全球风险联防联控规则 | 决定跨客户共享和隐私边界 |

---

## 5. 当前结论

按 `DeviceInfoRepository` 当前实现，同盾公开材料中与品牌、型号、厂商、Android 版本、SDK 版本、ROM 属性、OAID、Android ID、GAID、Widevine、IMEI / MEID、IMSI、ICCID、运营商相关的本地基础字段不再作为缺口保留。

当前仍有价值的同盾缺口集中在六类：

1. 开源 deviceDetail 未覆盖字段：`gsfId`、ABI、CPU、核心数、host、VBMeta、国家、可用内存、存储、私有路径、默认输入法、系统 / 安装应用列表。
2. 显示、电池、传感器：屏幕英寸、亮度、熄屏、电池健康、电池状态、温度、总容量、传感器信息。
3. 系统设置和运行时：无障碍、ADB、开发者选项、mock location、HTTP 代理、漫游、debug。
4. 开源风险标签：root、debug、multiple、xposed、magisk、hook、emulator、vpn、device_info_tampered。
5. Pro 风险能力：70+ 标签、100+ 标签、3000+ 黑产工具、30+ 作弊框架、Fraud Tools、Behavioral Activity、Environment Risk、Risk Score、IP Location、Offerwall、Replay、二次打包。
6. SDK 防护和决策：device_id、客户端预生成、服务端二次确认、fallback 组合、OLLVM、VMP、防抓包、防降级、TrustDecision 决策引擎、全球风险联防联控。
