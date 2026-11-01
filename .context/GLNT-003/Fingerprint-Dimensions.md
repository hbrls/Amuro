# Fingerprint-Dimensions · GLNT-3 iOS 维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-29 11:55:42
>
> 视角：Fingerprint 厂商 LENS（research）
> 来源：TASK-003
> 文件命名口径：厂商名 + `Dimensions`，参考 GLNT-4 的 `Fingerprint-Dimensions.md`
> 当前口径：参考 Android 厂商调研方式；iOS 侧无实现基线，因此按公开资料全量整理 Fingerprint 在 iOS 上实际采集、声明采集或可反推出的稳定硬件标识、设备标识、SDK 自建 ID、持久化 token、服务端衍生 ID 和公开资料缺口。厂商提到的 device fingerprint 只作为线索，必须尽量拆解到底层稳定采集维度。
> 调研基线 iOS 版本：iOS 17.5

---

## 0. 调研口径

本条目采用 `Fingerprint-Dimensions` 风格组织：厂商名 + Dimensions，内容聚焦 Fingerprint 在 iOS 侧公开可确认的稳定 ID、持久化路径、SDK 自建 ID、服务端衍生 ID 与风险信号。Android 侧 `Fingerprint-Dimensions.md` 只作为跨端对照基线，不把 Android-only 能力自动映射为 iOS 已采集字段。

证据分三类：

| 分类 | 本条目采用标准 |
|------|----------------|
| 实际采集 | 官方 iOS 文档、SDK README / Package.swift、官方 quickstart 或 Smart Signals reference 明确写出 SDK 采集、返回或支持的字段 |
| 声明采集 | 官方文档声明 iOS SDK 会采集若干属性、提供某类 Smart Signal，但未公开底层字段清单 |
| 可反推 | 官方返回字段、版本说明、稳定性场景或跨端对照能推出底层依赖，但不能替代“实际采集” |

非公开字段只作为缺口和追问线索，不作为“已实现”结论。

公开资料入口：

- Fingerprint iOS devices 文档：https://docs.fingerprint.com/docs/ios
- Fingerprint iOS quickstart：https://docs.fingerprint.com/docs/ios-quickstart
- Fingerprint Smart Signals reference：https://docs.fingerprint.com/docs/smart-signals-reference
- Fingerprint Pro iOS SDK GitHub：https://github.com/fingerprintjs/fingerprintjs-pro-ios
- FingerprintJS iOS 开源库 GitHub：https://github.com/fingerprintjs/fingerprintjs-ios
- Apple IDFV 文档：https://developer.apple.com/documentation/uikit/uidevice/1620059-identifierforvendor

## 1. 产品定位

Fingerprint 将 iOS 产品定位为移动端 device intelligence：在 native iOS app 中返回设备访问标识 `visitorId`，并通过 Smart Signals 给风控系统提供风险输入。iOS 文档明确区分两件事：

- 设备标识主路径：`visitorId` 由 Apple `identifierForVendor`（IDFV）派生。
- 风险能力路径：请求 `visitorId` 时，SDK 会连同 IDFV 采集若干设备属性，Smart Signals 由这些属性与算法组合推导。

最关键结论：Fingerprint 官方文档明确说 iOS SDK 的 `visitorId` 仅由 IDFV 派生，并且 SDK 不使用 fingerprinting techniques 来识别设备。因此本条目不能把 Android 侧 “100+ signals 生成 visitorId” 的口径直接搬到 iOS。iOS 的强稳定主锚点是 IDFV 派生标识，Smart Signals 是风险层，不是 visitorId 的等价底层枚举。

完成度标准定标：

- 单厂商 iOS 条目至少需要覆盖 ID 主路径、稳定性边界、持久化 / 重装行为、服务端处理、Smart Signals、合规姿态、公开资料缺口。
- 每个“实际采集”字段必须有公开文档或 SDK 仓库证据；只有产品页泛称 device intelligence 时，最多记为“声明采集”或“可反推”。
- 非公开算法、未列出的 attribute、服务端模型权重不得写成事实。

## 2. iOS / Apple 接入方式

| 形态 | 公开证据 | 对稳定 ID 的意义 |
|------|----------|----------------|
| Native iOS commercial SDK | `fingerprintjs-pro-ios` README 与 iOS quickstart；Package.swift 当前版本 2.16.0，最低 iOS 13 | 主路径；通过 `FingerprintProFactory.getInstance(configuration)` 调用 |
| Open-source iOS library | `fingerprintjs-ios` README | 对照路径；公开说明 `getDeviceId()` 使用 IDFV，并保存在 Keychain 以跨重装稳定；`getFingerprint()` 是本地弱指纹 hash |
| Server API / backend quickstart | iOS quickstart 要求把 `requestId` 发给后端，再用 Events API 取可信 visitor 信息 | 客户端不应只信任前端返回的 `visitorId`；服务端是风控决策面 |
| Smart Signals | iOS 文档与 Smart Signals reference | 风险能力层；包括 factory reset、Frida、geolocation spoofing、IP geolocation、IP blocklist、jailbreak、MitM、tampering、VPN、simulator、developer tools 等 |
| Privacy Manifest | iOS 文档声明 v2.3.2 起包含 privacy manifest | 合规入口；说明 SDK 适配 Apple 2023 后隐私清单要求 |
| Multi-platform SDK | iOS 文档列出 Flutter / React Native | 接入形态补充；不改变 iOS 底层 IDFV 主路径 |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：IDFV、AppID / vendor scope、Xcode / development profile / developer mode 检测、iOS simulator、jailbreak。
- iOS 缺失：Android OAID / SSAID / GAID / Widevine / GSF ID / Build fingerprint / telephony hardware ID。
- Android 等价物：Android `visitorId` 是服务端 fuzzy matching 产物；iOS `visitorId` 则明确基于 IDFV，稳定性来源不同。

## 3. iOS 稳定 ID 与硬件标识维度

| 维度 | 类型 | 稳定性 | 证据强度 | 结论 |
|------|------|--------|----------|------|
| IDFV | Apple vendor scope 标识 | vendor scope；官方场景中 app 重装前后可由 Fingerprint visitorId 保持，但裸 IDFV 本身可能随 vendor app 全部移除而变化 | 实际采集 | iOS 主锚点；Fingerprint 明确 visitorId 仅由 IDFV 派生 |
| `visitorId` | SDK / 服务端返回的设备访问标识 | 跨 app 重启、设备重启、app 重装、签名证书变化、越狱、Lockdown Mode、设置重置保持；factory reset 后变更 | 实际返回 | Fingerprint iOS 最核心稳定 ID；同 vendor 且同 Fingerprint workspace 才可能跨 app 相同 |
| AppID / vendor / workspace 作用域 | 作用域维度 | 决定 visitorId 跨 app 是否相同 | 可反推 | iOS 文档明确同 vendor + 同 workspace 才保持 |
| `requestId` | 单次 identification event ID | 单次事件稳定，不是设备稳定 ID | 实际返回 | quickstart 要求发后端，用于 Events API 取可信结果 |
| IDFA | Apple advertising ID | ATT 约束；未见 Fingerprint iOS 主路径公开使用 | 公开未确认 | 不能纳入已采集；仅作为“未见公开证据” |
| DeviceCheck / App Attest | Apple 风险证明能力 | 可作为 app/device integrity 线索，但 Fingerprint iOS 公开资料未声明使用 | 公开未确认 | 不纳入已采集 |
| APNs token | Apple push token | app install / push scope；公开资料未声明使用 | 公开未确认 | 不纳入已采集 |
| 硬件序列号 / IMEI / MEID / Wi-Fi MAC | 硬件标识 | iOS 常规 App Store app 不可用 | 无公开证据 | 不纳入 Fingerprint iOS 稳定维度 |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：`identifierForVendor` 是主锚点；Android 没有同等 Apple vendor scope。
- iOS 缺失：Android 侧 Fingerprint 可讨论 OAID / GAID / Android ID / Widevine / GSF 等；iOS 公开路径不使用这些。
- Android 等价物：Android 侧 `visitorId` 更接近服务端综合设备标识；iOS 侧 `visitorId` 是 IDFV 派生并经服务端处理，不能等价为硬件指纹。

## 4. 持久化路径与 SDK 自建 ID

| 维度 | 类型 | 稳定性 | 证据强度 | 结论 |
|------|------|--------|----------|------|
| IDFV 派生 visitorId 跨重装保持 | 持久化行为 | app 删除并重装后保持 | 实际声明 | 商业 SDK 文档明确 visitorId 重装后相同；实现细节未公开 |
| Keychain 保存 device id | 持久化路径 | 开源库 README 明确把 IDFV 派生 device id 记入 Keychain，以跨重装稳定 | 实际采集（开源库）/ 商业 SDK 可反推 | 商业 SDK 基于开源库，但商业 SDK内部实现未完全公开；可作为强线索 |
| `getDeviceId()` | 开源库 SDK 自建 ID | IDFV + Keychain 路径，跨重装稳定 | 实际采集（开源库） | 属开源 FingerprintJS-iOS，不等同商业 SDK 返回格式 |
| `getFingerprint()` | 开源库本地弱指纹 hash | 稳定性低于 device id；OS 更新或设置变化可能改变 | 实际采集（开源库） | 只作为对照；商业 SDK 文档强调 visitorId 不是 fingerprinting 技术 |
| 商业 SDK advanced attributes | 设备属性集合 | 不直接形成主 ID；用于服务端处理和 Smart Signals | 声明采集 | 文档仅说比开源库多很多属性，未公开完整列表 |
| NSUserDefaults / App Group / Web storage / cookie / pasteboard | 可能持久化路径 | 未见 Fingerprint iOS 商业 SDK 公开声明 | 公开未确认 | 不纳入已采集 |
| Sealed / receipt token | 保护传输或服务端取数相关 token | iOS quickstart 主路径是 `requestId` 到后端；本轮未找到 iOS 特有 receipt token 证据 | 公开未确认 | 不纳入稳定 ID |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：Keychain 可解释跨重装稳定；Android 侧没有同等系统 Keychain 语义。
- iOS 缺失：Android 常见持久化还可能涉及 SharedPreferences / Keystore / app set id / 广告 ID；本 iOS 条目不展开。
- Android 等价物：Android `Factory Reset Timestamp` 与 iOS factory reset 行为都可作为稳定性边界，但底层检测方式不同。

## 5. 服务端衍生 ID 与风险能力

### 5.1 服务端衍生 ID / 事件 ID

| 维度 | 类型 | 证据强度 | 结论 |
|------|------|----------|------|
| 服务端处理 visitorId | 服务端处理 | 实际声明 | 商业 SDK 的 visitorId 由设备内生成并由服务器处理；相比开源库，collision 很少 |
| `requestId` | identification event ID | 实际返回 | 前端拿到后发给后端，后端通过 Events API 取完整识别数据 |
| `linkedId` | 客户侧关联 ID | Smart Signals velocity 文档使用 | 可反推 | 不是设备 ID；用于客户侧业务实体关联 |
| Velocity per visitorID / linkedID / IP | 服务端聚合 | 实际声明 | 5 分钟 / 1 小时 / 24 小时窗口的计数；是风控聚合，不是客户端稳定 ID |
| High-Activity Device | 服务端聚合 | 实际声明 | 以 visitorID 过去 24h 活跃度与客户正常分布对比 |

### 5.2 iOS Smart Signals

| 维度 | iOS 支持 | 底层可见维度 | 证据强度 | 结论 |
|------|----------|--------------|----------|------|
| Factory Reset Detection | 是 | `factory_reset_timestamp`；未公开完整算法 | 实际返回 | factory reset 后 visitorId 变化，Smart Signal 返回最近 reset 时间 |
| Frida Detection | 是 | hook / instrumentation 特征，未公开具体 attribute | 实际返回 | 动态插桩风险 |
| Geolocation Spoofing Detection | 是 | host app 已有定位权限时做非侵入检查 | 实际返回 | SDK 不主动申请定位权限 |
| IP Geolocation | 是 | IP 地址、ASN、组织类型、datacenter、粗位置 | 实际返回 | 服务端网络画像；非 iOS 本地稳定 ID |
| IP Blocklist | 是 | Tor / attack source / email spam 等 IP 库 | 实际返回 | 服务端威胁情报 |
| Jailbroken Device Detection | 是 | 越狱状态；具体检测项未公开 | 实际返回 | iOS 独有风险信号 |
| MitM Attack Detection | 是 | Fingerprint 请求链路是否被拦截 / 修改 | 实际返回 | 请求完整性风险 |
| Tampered Request Detection | 是 | anomalous device attributes / anomaly_score | 实际返回 | 证明 SDK 会采集属性并服务端判异常，但完整 attribute 未公开 |
| VPN Detection | 是 | timezone_mismatch / public_vpn / auxiliary_mobile / relay / origin timezone / origin country | 实际返回 | iOS `vpn_origin_country` 需 iOS SDK 2.9.0+；无需定位权限 |
| iOS Simulator Detection | 是 | simulator 环境 | 实际返回 | iOS SDK 2.12.0+ |
| Developer Tools Detection | 是 | developer mode、development profile、Xcode 运行 | 实际返回 | iOS SDK 2.12.0+，2.13.0+ 推荐 |
| Suspect Score | 是 | 所有 Smart Signals 的加权分数 | 实际返回 | 聚合风险分 |
| Proxy Detection | 是（common） | residential / datacenter proxy、provider、ML score | 实际返回 | 服务端 IP 画像 |
| Raw Device Attributes | 是（Enterprise） | web 样例列出大量 browser 属性；native iOS 完整字段未公开 | 声明采集 | 只能确认能力，不确认 iOS native 全量字段 |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：jailbreak、iOS simulator、developer mode / development profile / Xcode run。
- iOS 缺失：root apps、Android emulator、cloned app 是 Android-only。
- Android 等价物：Frida、MitM、tampering、VPN、factory reset、geolocation spoofing、IP geolocation、proxy、velocity 属跨端风险能力，但底层采集项不应合并。

## 6. 公开资料缺口

非公开 = 仅作线索、不作结论。以下缺口不得被写成 Fingerprint iOS 已采集事实。

| # | 缺口 | 影响 |
|---|------|------|
| Q-1 | 商业 SDK 如何让 IDFV 派生 visitorId 跨 app 重装保持 | 文档给出行为结论，但没有公开完整持久化机制；Keychain 只能由开源库强线索支持 |
| Q-2 | 商业 SDK advanced attributes 完整清单 | 文档只说多于开源库，未列 native iOS 全量字段 |
| Q-3 | Tampered Request 的 anomalous device attributes 具体列表 | 无法知道服务端判定依赖哪些 iOS 原始字段 |
| Q-4 | Factory Reset Detection 的 iOS 算法 | 只公开返回语义和版本边界 |
| Q-5 | Frida / jailbreak / simulator / developer tools 具体检测项 | 只公开风险含义与返回字段 |
| Q-6 | IDFA 是否被商业 SDK 采集 | 本轮未见官方 iOS SDK 主路径使用 IDFA 的证据；不能纳入 |
| Q-7 | DeviceCheck / App Attest 是否用于商业 SDK 风险证明 | 未见公开证据；不能纳入 |
| Q-8 | APNs token、pasteboard、App Group、NSUserDefaults、Web storage 是否参与持久化 | 未见公开证据；不能纳入 |
| Q-9 | Raw Device Attributes 中 native iOS 字段与 Web 样例的差异 | 文档说 native SDK 收集低层数据点，但公开样例主要偏 Web / browser |
| Q-10 | 服务端 fuzzy matching 的输入权重和 collision 处理 | 只公开“processed further on server”和“very rare collisions”，未公开算法 |

## 7. 当前结论

Fingerprint iOS 第一条厂商调研可以收束为以下判断：

1. **主稳定 ID 是 IDFV 派生的 `visitorId`**。官方明确不使用 fingerprinting techniques 来识别 iOS 设备。
2. **`visitorId` 的稳定边界清晰**：app / device restart、app reinstall、签名证书变化、越狱、Lockdown Mode、设置重置保持；factory reset 后生成新 ID；跨 app 只在同 vendor + 同 Fingerprint workspace 下保持。
3. **Keychain 是强线索但不是商业 SDK 完整公开实现**。开源库明确用 Keychain 记住 IDFV 派生 device id；商业 SDK 基于开源库并给出跨重装行为，但完整内部持久化未公开。
4. **服务端层必须通过 `requestId` 获取可信结果**。quickstart 明确前端把 `requestId` 发给后端，由后端取 visitor 信息和风险信号。
5. **Smart Signals 是风险层，不是主 ID 底层字段清单**。iOS 支持 factory reset、Frida、jailbreak、MitM、tampering、VPN、simulator、developer tools、IP geolocation、proxy、velocity 等，但大量底层 attribute 和算法不公开。
6. **IDFA / DeviceCheck / App Attest / APNs token / pasteboard 等未见公开证据**。它们只能保留为缺口或追问项，不能写入已采集维度。
7. **与 Android 的最大差异**：Android Fingerprint 调研强调服务端 fuzzy matching + 100+ device/network signals；iOS 商业 SDK 明确把 `visitorId` 限定在 IDFV 派生路径上，风险能力另由 Smart Signals 承担。

本条目已满足 TASK-003 对 0-7 节结构、iOS 17.5 基线声明、证据分类、公开资料缺口和跨端小行对照的要求。
