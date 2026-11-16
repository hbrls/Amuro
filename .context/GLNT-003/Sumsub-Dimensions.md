# Sumsub-Dimensions · GLNT-3 iOS 维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-29 13:01:20
>
> 视角：Sumsub iOS 厂商 LENS（research）
> 来源：TASK-008
> 文件命名口径：厂商名 + `Dimensions`，参考 GLNT-4 的 `Sumsub-Dimensions.md`
> 当前口径：参考 Android 厂商调研方式；iOS 侧无实现基线，因此按公开资料全量整理 Sumsub 在 iOS 上实际采集、声明采集或可反推出的稳定硬件标识、设备标识、SDK 自建 ID、持久化 token、服务端衍生 ID 和公开资料缺口。厂商提到的 Device Intelligence / Fisherman 只作为线索，必须尽量拆解到底层稳定采集维度。
> 调研基线 iOS 版本：iOS 17.5

---

## 0. 调研口径

本条目只依据 Sumsub 公开资料、`.context/GLNT-4/Sumsub-Dimensions.md` 和 GLNT-3 既定 iOS 口径整理。Android 侧 Sumsub 维度只作为跨端对照线索，不作为 iOS 已采集事实。

公开来源：

- Sumsub iOS SDK 文档：`https://docs.sumsub.com/docs/get-started-ios`
- Sumsub Mobile SDK changelog：`https://docs.sumsub.com/docs/mobile-sdk-changelog`
- Sumsub Device Intelligence：`https://docs.sumsub.com/docs/device-intelligence`
- Sumsub Advanced IP Check：`https://docs.sumsub.com/docs/advanced-ip-check`
- Sumsub Behavior Monitoring：`https://docs.sumsub.com/docs/behavior-monitoring`
- Sumsub Fraud Network：`https://docs.sumsub.com/docs/fraud-network`
- Sumsub Pre-KYC Fraud Risk Assessment：`https://docs.sumsub.com/docs/pre-kyc-fraud-risk-assessment`

来源分层：

- **实际采集**：iOS MobileSDK 本身、MobileSDK verification flow、Device Intelligence iOS 模块公开文档 / changelog 中明确提到的设备标识、session 和风险标签。
- **声明采集**：Device Intelligence、Advanced IP、Behavior Monitoring、Fraud Network、Pre-KYC Risk Assessment 的公开能力。
- **可反推**：由 sessionId、device fingerprint、unique device identifier、risk labels、captured device 和 applicant / platform event 关系推导出的稳定性和服务端关联。

非公开 = 仅作线索、不作结论。Sumsub 的 device fingerprint / visitorId 生成材料、iOS 持久化路径、risk label evidence 和服务端 Fraud Network 合并规则未公开，不能写成具体 iOS 本地字段全集。

---

## 1. 产品定位

Sumsub 把 Device Intelligence 放在 KYC / KYB / Fraud Prevention / Behavior Monitoring 体系中。iOS 侧不仅有 MobileSDK verification flow，也开始把 Device Intelligence 能力引入 iOS SDK，用于生成设备身份、风险标签和设备 / applicant / 事件关联。

iOS 侧关键结论：

- Sumsub 公开文档显示 iOS SDK 存在 Device Intelligence 集成路径；Mobile SDK changelog 提到 iOS Device Intelligence 作为可选模块引入。
- Device Intelligence 声明生成 stable unique device identifier，并强调跨 session、移动端跨重装识别。
- 公开 risk labels 包括 jailbroken、locationSpoofing、mitmAttack 等移动端风险，但底层 iOS evidence 未公开。
- Behavior Monitoring 和 Fraud Network 将 device、IP、user platform event、financial transaction、applicant 关联到服务端图谱。
- 公开资料未证明 Sumsub iOS Device Intelligence 使用 IDFV、IDFA、Keychain、DeviceCheck、App Attest 或 APNs token。

---

## 2. iOS / Apple 接入方式

| 接入形态 | iOS 侧判断 | 来源分层 | 备注 |
|---|---|---|---|
| Sumsub iOS MobileSDK | 原生 iOS 身份验证 / KYC flow | 实际采集 | 管理 camera、microphone、geolocation 等验证上下文 |
| iOS Device Intelligence 模块 | 可选模块，面向 iOS 的 Device Intelligence 能力 | 实际采集 / 声明采集 | 公开 changelog / 文档存在，但具体底层字段未公开 |
| Device Intelligence session | 使用 sessionId / fingerprint / device identifier 建模 | 声明采集 | 稳定性声明强，底层材料缺口大 |
| Behavior Monitoring | user platform event、device、IP、custom properties | 声明采集 | 事件流和服务端风控 |
| Advanced IP Check | IP risk score、VPN / proxy / TOR、location / timezone / ISP | 声明采集 | 服务端网络画像 |
| Fraud Network | shared devices、related accounts、similar patterns | 声明采集 | 服务端图谱 |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：jailbroken risk label、iOS Device Intelligence 模块、可能的 Keychain / IDFV / DeviceCheck 路径；后者未公开。
- iOS 缺失：Android risk labels 中 rooted、Frida、clonedApp、emulator 不能直接迁移到 iOS。
- Android 等价物：Fisherman / Device Intelligence、sessionId、fingerprint、risk labels、Advanced IP 和 Fraud Network 可跨端对照。

---

## 3. iOS 稳定 ID 与硬件标识维度

| 维度 | iOS 侧判断 | 来源分层 | 稳定性边界 |
|---|---|---|---|
| Device Intelligence stable unique device identifier | Sumsub 声明生成稳定唯一设备标识 | 声明采集 | 声明跨 session、移动端跨重装；底层持久化未公开 |
| Device fingerprint | Device Intelligence / Fisherman 公开能力 | 声明采集 | 聚合指纹，不等同硬件 ID |
| sessionId | Device Intelligence / Behavior Monitoring 中用于连续性 | 实际采集 / 声明采集 | session 连续性明确；跨重装取决于 device identifier |
| sessionAgeMs | Behavior Monitoring device object 语境 | 声明采集 | 会话生命周期指标 |
| Captured device binding | applicant / event / transaction 绑定 captured device | 声明采集 | 服务端事件绑定 |
| Device risk labels aggregate | Device Intelligence 输出风险标签 | 声明采集 | 标签是聚合输出 |
| IDFV | 未公开 | 公开缺口 | 若使用，仅 vendor scope |
| IDFA / ATT | 未公开 | 公开缺口 | 不能假设 |
| Keychain / SDK storage | 未公开 | 公开缺口 | 跨重装稳定性声明强，但持久化路径未公开 |
| DeviceCheck / App Attest | 未公开 | 公开缺口 | 不能写成事实 |
| APNs token | 未公开 | 公开缺口 | token 可轮换 |

当前结论：Sumsub 是目前 iOS 侧明确声明“稳定唯一设备标识 / 跨 session / 移动端跨重装”的厂商之一；但底层 iOS 标识、Keychain、IDFV 或其它 Apple 能力没有公开证据。

---

## 4. 持久化路径与 SDK 自建 ID

| 路径 / ID | iOS 侧判断 | 来源分层 | 备注 |
|---|---|---|---|
| Stable unique device identifier | Device Intelligence 声明生成 | 声明采集 | 强稳定性声明，但不公开算法 |
| sessionId continuity | access token / session 相关流程 | 实际采集 / 声明采集 | token refresh 建议保持同一 session |
| visitorId / fingerprint 类标识 | Device Intelligence / JS Fisherman 语境存在 | 可反推 | iOS Native 生成材料未公开 |
| Keychain | 未公开 | 公开缺口 | 不能将“跨重装”直接归因于 Keychain |
| UserDefaults / App Group | 未公开 | 公开缺口 | 不能写成事实 |
| Web storage | JS Fisherman 语境可能存在 | 可反推 | Native iOS 不等同 Web |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：如果跨重装稳定性在 iOS 成立，可能涉及 Keychain 或服务端历史关联；公开资料未说明。
- iOS 缺失：Android emulator / rooted / Frida / clonedApp 等标签不能直接映射。
- Android 等价物：Device Intelligence risk labels、session continuity、fingerprint、Advanced IP、Behavior Monitoring 可跨端对照。

---

## 5. 服务端衍生 ID 与风险能力

| 能力 | iOS 侧判断 | 来源分层 | 是否可作为本地采集字段 |
|---|---|---|---|
| Jailbroken risk label | iOS 语境明确风险标签 | 声明采集 | 底层 trigger 未公开 |
| Location spoofing | Device Intelligence risk label / Behavior Monitoring | 声明采集 | 可能依赖定位、IP、权限和服务端一致性 |
| MITM attack | risk label | 声明采集 | 证书 / TLS / 请求完整性路径未公开 |
| Advanced IP risk profile | IP、VPN、proxy、TOR、ISP、ASN、location、timezone | 声明采集 | 服务端网络画像 |
| IP / document / address / EXIF mismatch | Pre-KYC / Advanced IP | 声明采集 | 服务端一致性判断 |
| Behavior Monitoring event stream | login、sign-up、settings change、password update、自定义事件 | 声明采集 | 服务端事件流 |
| Captured device binding | platform event / financial transaction 绑定设备 | 声明采集 | 服务端绑定 |
| Fraud Network shared devices / related accounts | blocked users、related accounts、shared devices、similar patterns | 声明采集 | 服务端图谱 |
| Applicant risk score / tags | 多信号评分、规则、标签、动态工作流 | 声明采集 | 服务端输出 |

服务端能力边界：Sumsub 的 device identifier 和 risk labels 可以进入统一维度主清单，但必须标注“稳定性声明强，底层 iOS 持久化 / 采集材料未公开”。

---

## 6. 公开资料缺口

非公开 = 仅作线索、不作结论。

| # | 缺口 | 影响 |
|---|---|---|
| Q-1 | iOS stable unique device identifier 的生成材料 | 决定是否依赖 IDFV、Keychain、服务端历史或其它信号 |
| Q-2 | 跨重装稳定性的实现路径 | 不能把跨重装声明直接归因为 Keychain |
| Q-3 | IDFV / IDFA / Keychain / DeviceCheck / App Attest 是否使用 | 决定 Apple 标识和持久化路径 |
| Q-4 | iOS risk label evidence 是否返回客户 | 决定 jailbroken / locationSpoofing / mitmAttack 是否可解释 |
| Q-5 | Device Intelligence iOS 与 JS Fisherman 字段一致性 | 决定 visitorId / fingerprint 能否统一建模 |
| Q-6 | Behavior Monitoring 标准 event type 与原始行为字段 | 决定是否包含触控、输入节奏、页面停留 |
| Q-7 | Advanced IP risk score / risk level 权重 | 决定网络画像解释性 |
| Q-8 | Fraud Network shared devices 合并规则 | 决定服务端设备身份稳定性 |
| Q-9 | iOS Device Intelligence 模块版本与发布边界 | 公开 changelog 含未来版本信息，执行时需确认实际可用性 |

---

## 7. 当前结论

Sumsub iOS 调研结论：

- **可确认 / 强声明**：iOS Device Intelligence 存在公开接入路径，声明生成 stable unique device identifier，并强调跨 session、移动端跨重装识别。
- **可确认但非本地 ID**：sessionId、captured device、applicant risk score、risk labels、Advanced IP、Behavior Monitoring、Fraud Network 都是服务端或 SDK 聚合能力。
- **不可确认**：IDFV、IDFA、Keychain、DeviceCheck、App Attest、APNs token、stable device identifier 的底层输入。
- **高价值缺口**：跨重装稳定性的实现路径和 risk label evidence。

Sumsub 可进入 iOS 统一主清单，并应标注为“稳定唯一设备标识声明强，但底层 iOS 持久化和 Apple 标识使用未公开”。
