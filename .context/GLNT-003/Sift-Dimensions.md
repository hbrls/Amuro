# Sift-Dimensions · GLNT-3 iOS 维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-29 12:58:08
>
> 视角：Sift iOS 厂商 LENS（research）
> 来源：TASK-007
> 文件命名口径：厂商名 + `Dimensions`，参考 GLNT-4 的 `Sift-Dimensions.md`
> 当前口径：参考 Android 厂商调研方式；iOS 侧无实现基线，因此按公开资料全量整理 Sift 在 iOS 上实际采集、声明采集或可反推出的稳定硬件标识、设备标识、SDK 自建 ID、持久化 token、服务端衍生 ID 和公开资料缺口。厂商提到的 device fingerprinting 只作为线索，必须尽量拆解到底层稳定采集维度。
> 调研基线 iOS 版本：iOS 17.5

---

## 0. 调研口径

本条目只依据 Sift 公开资料、`.context/GLNT-4/Sift-Dimensions.md` 和 GLNT-3 既定 iOS 口径整理。Android 侧 Sift 维度只作为跨端对照线索，不作为 iOS 已采集事实。

公开来源：

- Sift iOS SDK GitHub：`https://github.com/SiftScience/sift-ios`
- Sift iOS SDK 文档：`https://developers.sift.com/docs/curl/ios`
- Sift Device Fingerprinting API：`https://developers.sift.com/docs/curl/events-api/device-fingerprinting`
- Sift Events API：`https://developers.sift.com/docs/curl/events-api`
- Sift Score API / Workflows：`https://developers.sift.com/docs/curl/score-api`
- Sift Privacy Notice：`https://sift.com/service-privacy`

来源分层：

- **实际采集**：Sift iOS SDK 公开接入、device properties collection、`setUserId` / `unsetUserId`、`Sift.open()` / `collect()` / `close()` 等事件采集路径。
- **声明采集**：Device Fingerprinting API、risk score、workflows、Global Data Network、Account Defense / Fraud Platform 能力。
- **可反推**：由 SDK 事件模型、user binding、installation / device fingerprinting session、服务端事件图谱推导出的设备 / 用户关联维度。

非公开 = 仅作线索、不作结论。Sift 的服务端 risk score、Global Data Network、workflow decision、device fingerprinting 原始字段和模型权重未公开，不能写成具体 iOS 本地字段全集。

---

## 1. 产品定位

Sift 定位为 Digital Trust & Safety / Fraud Decisioning 平台。iOS SDK 的作用是采集移动端设备属性和 App 交互上下文，并把这些信号与用户、事件和服务端风控图谱关联。Sift 的稳定识别依赖“SDK 安装 / 设备属性 + user id + 事件流 + 服务端历史网络”，不是单一硬件 ID。

iOS 侧关键结论：

- Sift iOS SDK 是公开仓库，支持 CocoaPods、Carthage、Swift Package Manager。
- iOS SDK 明确提供 `setUserId` / `unsetUserId`，并通过 `open` / `collect` / `close` 类调用采集 app interaction events。
- Sift 公开材料说明会收集 device properties，但 iOS 底层属性清单没有像 Android 源码那样完整展开。
- Device Fingerprinting API 更偏 Web / browser session，不能直接等同 Native iOS SDK。
- 服务端 Global Data Network、risk score、workflow decision 是服务端衍生能力，不是 iOS 本地字段。

---

## 2. iOS / Apple 接入方式

| 接入形态 | iOS 侧判断 | 来源分层 | 备注 |
|---|---|---|---|
| Sift iOS SDK | Native iOS 接入，采集 device properties 和 app interaction events | 实际采集 | 公开 GitHub / 文档 |
| `Sift.open()` / `collect()` / `close()` | App 页面 / 事件生命周期采集 | 实际采集 | 用于移动端事件上下文 |
| `setUserId()` / `unsetUserId()` | 账号与设备 / 安装 / 事件关联 | 实际采集 | 业务账号键，不是设备硬件 ID |
| Device Fingerprinting API | Web 侧 device fingerprinting session | 声明采集 | 与 Native iOS SDK 边界需区分 |
| Events API / Score API | 服务端事件图谱和风控输出 | 声明采集 | 账号、支付、内容、设备事件融合 |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：可能涉及 IDFV、Keychain、IDFA / ATT、DeviceCheck / App Attest、APNs token，但 Sift 公开资料未确认。
- iOS 缺失：Android 开源 SDK 中 Android ID、carrier、SIM country、root evidence、installed apps 等不能直接迁移到 iOS。
- Android 等价物：Android 的 `installation_id`、app state、device properties、root evidence、installed apps 对 iOS 只提供结构参照。

---

## 3. iOS 稳定 ID 与硬件标识维度

| 维度 | iOS 侧判断 | 来源分层 | 稳定性边界 |
|---|---|---|---|
| Sift iOS SDK device properties | iOS SDK 明确采集 device properties | 实际采集 | 公开资料未展开全量底层字段 |
| User ID binding | `setUserId()` 将业务用户与设备 / 事件关联 | 实际采集 | 业务账号稳定性强，但不是设备 ID |
| App interaction event context | `open` / `collect` / `close` 形成事件流 | 实际采集 | 行为 / 页面上下文，不是硬件 ID |
| Device Fingerprinting session | Web API 支持 device fingerprinting session | 声明采集 | Web / browser 语境；Native iOS 边界未公开 |
| Installation / device association | 由 SDK 事件、device properties 和 user id 可反推 | 可反推 | 是否存在 iOS installation ID 未公开 |
| IDFV | 未公开 | 公开缺口 | 若使用，仅 vendor scope |
| IDFA / ATT | 未公开 | 公开缺口 | 需 ATT 授权；不能假设 |
| Keychain / SDK storage | 未公开 | 公开缺口 | 不能假设跨卸载重装 |
| DeviceCheck / App Attest | 未公开 | 公开缺口 | 不能写成事实 |
| APNs token | 未公开 | 公开缺口 | token 可轮换 |

当前结论：Sift iOS 最明确的是 SDK device properties + user binding + event stream；稳定设备 ID、安装 ID 和 Apple 标识使用情况未公开。

---

## 4. 持久化路径与 SDK 自建 ID

| 路径 / ID | iOS 侧判断 | 来源分层 | 备注 |
|---|---|---|---|
| SDK event context | SDK 生命周期事件可持续关联同一 app session / user | 实际采集 | 事件上下文稳定性取决于 app 与服务端关联 |
| User ID | 业务账号键可跨设备或跨安装 | 实际采集 | 不是设备 ID，但对风控图谱非常关键 |
| Installation ID | iOS 公开资料未确认 | 公开缺口 | Android 有 `installation_id` 线索，但不能迁移 |
| Keychain | 未公开 | 公开缺口 | 不得假设跨卸载重装 |
| Web session / browser storage | Device Fingerprinting API 语境存在 | 可反推 | 不是 Native iOS 主路径 |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：如 Sift 使用 Keychain / IDFV，会形成 iOS 特有安装或 vendor scope 路径；当前未公开。
- iOS 缺失：Android Android ID / installed apps / root evidence 没有直接 iOS 等价。
- Android 等价物：Android `installation_id` 对 iOS 是公开缺口，不可直接复用结论。

---

## 5. 服务端衍生 ID 与风险能力

| 能力 | iOS 侧判断 | 来源分层 | 是否可作为本地采集字段 |
|---|---|---|---|
| Events API event graph | 账号、支付、内容、设备事件融合 | 声明采集 | 否，服务端图谱 |
| Score API risk score | 服务端风险评分 | 声明采集 | 否，服务端输出 |
| Workflow decision | 自动决策 / 审核 / 阻断流程 | 声明采集 | 否，服务端输出 |
| Global Data Network | 跨客户 / 跨事件网络智能 | 声明采集 | 否，服务端网络 |
| User-device association | user id + device properties + event stream | 可反推 | 关联结果，不是本地字段 |
| Behavioral analytics | 行为序列和事件节奏 | 声明采集 | 原始事件粒度未公开 |
| IP / network reputation | 服务端风控常见输入 | 声明采集 | 网络画像，不是设备 ID |

服务端能力边界：Sift 的核心稳定性来自用户、设备属性、事件流和服务端历史网络的关联。可进入统一维度主清单，但必须标注为“事件 / 服务端关联”，不能写成本地 iOS 稳定硬件 ID。

---

## 6. 公开资料缺口

非公开 = 仅作线索、不作结论。

| # | 缺口 | 影响 |
|---|---|---|
| Q-1 | iOS SDK device properties 全量字段 | 决定哪些字段属于实际本地采集 |
| Q-2 | iOS 是否存在 installation ID | 决定是否有安装级稳定锚点 |
| Q-3 | IDFV / IDFA / Keychain 是否使用 | 决定 Apple 标识和持久化路径 |
| Q-4 | iOS SDK 是否采集 location、battery、network address、carrier 等字段 | Android 有线索，iOS 未公开 |
| Q-5 | iOS 是否采集 jailbreak / simulator / tamper 风险 | 决定风险能力是否来自 Native SDK |
| Q-6 | Device Fingerprinting API 与 Native iOS SDK 的关联方式 | 避免把 Web session 写成 Native iOS 字段 |
| Q-7 | user-device association 的服务端合并规则 | 决定同设备 / 同用户如何关联 |
| Q-8 | Global Data Network 中 device 节点规则 | 决定服务端设备身份稳定性 |
| Q-9 | Score / workflow reason code 是否暴露 iOS evidence | 决定服务端输出能否追溯到底层字段 |

---

## 7. 当前结论

Sift iOS 调研结论：

- **可确认**：Sift iOS SDK 公开存在，采集 device properties 和 app interaction events，并支持 user id 绑定。
- **可确认但非设备 ID**：user id、event stream、score、workflow decision、Global Data Network 都是服务端或业务关联能力。
- **可反推**：Sift 可形成 user-device association，但 iOS installation ID 或持久化路径未公开。
- **不可确认**：IDFV、IDFA、Keychain、DeviceCheck、App Attest、APNs token、jailbreak / simulator / tamper 具体 iOS trigger。

Sift 可进入 iOS 统一主清单，但应标注为“iOS SDK device properties + user/event association 明确，安装级稳定 ID 和底层 Apple 标识未公开”。
