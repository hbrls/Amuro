# ThreatMetrix-Dimensions · GLNT-3 iOS 维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-29 12:53:50
>
> 视角：ThreatMetrix / LexisNexis Risk Solutions iOS 厂商 LENS（research）
> 来源：TASK-006
> 文件命名口径：厂商名 + `Dimensions`，参考 GLNT-4 的 `ThreatMetrix-Dimensions.md`
> 当前口径：参考 Android 厂商调研方式；iOS 侧无实现基线，因此按公开资料全量整理 ThreatMetrix / LexisNexis Risk Solutions 在 iOS 上实际采集、声明采集或可反推出的稳定硬件标识、设备标识、SDK 自建 ID、持久化 token、服务端衍生 ID 和公开资料缺口。厂商提到的 device profiling / digital identity 只作为线索，必须尽量拆解到底层稳定采集维度。
> 调研基线 iOS 版本：iOS 17.5

---

## 0. 调研口径

本条目只依据 ThreatMetrix / LexisNexis Risk Solutions 公开资料、`.context/GLNT-4/ThreatMetrix-Dimensions.md` 和 GLNT-3 既定 iOS 口径整理。Android 侧 ThreatMetrix 维度只作为跨端对照线索，不作为 iOS 已采集事实。

公开来源：

- Worldpay ThreatMetrix iOS SDK 指南：`https://developer.worldpay.com/products/access/h2h/3ds/testing/ios`
- Worldpay FraudSight / deviceData collection reference 文档：`https://developer.worldpay.com/products/access/fraudsight/assessment`
- Ping Identity ThreatMetrix mobile/native 集成文档：`https://docs.pingidentity.com/pingfederate/12.2/authentication_policies/pf_lexisnexis_threatmetrix_integration_mobile_native.html`
- LexisNexis Risk Solutions ThreatMetrix 产品说明：`https://risk.lexisnexis.com/products/threatmetrix`
- LexisNexis Strong ID 说明：`https://risk.lexisnexis.com/products/threatmetrix/strong-id`
- LexisNexis Risk Solutions Privacy Processing Notice：`https://risk.lexisnexis.com/privacy-policy`

来源分层：

- **实际采集**：iOS SDK `TMXProfiling` / `TMXProfilingConnections`、`initProfile()` / `doProfile()`、`sessionID`、deviceData collection reference 等公开接入路径。
- **声明采集**：Digital Identity Network、Strong ID、device profiling、risk score、bot / RAT / spoofing 等产品能力。
- **可反推**：由 SDK 权限入口、session 生命周期、Strong ID cryptographic bind 和服务端 assessment 推导出的稳定性 / 持久化线索。

非公开 = 仅作线索、不作结论。ThreatMetrix 的 collected attributes、Strong ID cryptographic material、identity graph 规则和风险模型未公开，不能写成具体 iOS 本地字段全集。

---

## 1. 产品定位

ThreatMetrix 现归属 LexisNexis Risk Solutions，定位为 Digital Identity Intelligence / Fraud Detection / Authentication 平台。它不是只提供单个 iOS 设备 ID，而是通过移动 SDK profiling、会话引用、Strong ID、Digital Identity Network、风控决策和历史图谱来识别设备、账号、凭证和风险模式。

iOS 侧关键结论：

- Worldpay 公开文档明确存在 ThreatMetrix iOS SDK，并使用 `TMXProfiling` / `TMXProfilingConnections`。
- iOS SDK 通过 `initProfile()` 创建 unique `sessionId`，通过 `doProfile()` 启动 profiling，并在 completion 中返回 session ID。
- 交易 / 认证 / assessment 流程通过 `deviceData.collectionReference` 或等价字段提交该 session ID。
- Strong ID 声明与浏览器 / App 建立 cryptographic bind，但 iOS 客户端密钥材料、存储位置和生命周期未公开。
- LexisNexis 处理声明提到 device identifiers、cookies、mobile ad identifiers、IP address、device characteristics 等类型，但不等于本 SDK 已公开采集全部字段。

---

## 2. iOS / Apple 接入方式

| 接入形态 | iOS 侧判断 | 来源分层 | 备注 |
|---|---|---|---|
| iOS SDK `TMXProfiling` | Native iOS 接入，执行 device profiling | 实际采集 | Worldpay 文档明确 |
| `initProfile()` / `doProfile()` | 初始化 session 并启动 profiling | 实际采集 | 返回 session ID / profiling status |
| `sessionId` / collection reference | 后续 assessment / authentication 使用的设备采集引用 | 实际采集 | 会话级稳定引用，不等同设备硬件 ID |
| Strong ID | 与 App / browser 形成 cryptographic bind | 声明采集 | 客户端密钥和持久化位置未公开 |
| Digital Identity Network | 服务端跨客户 / 跨行业身份网络 | 声明采集 | 服务端图谱，不是本地字段 |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：可能涉及 Keychain、Secure Enclave / Keychain keychain item、IDFV、DeviceCheck / App Attest 等 Apple 能力，但 ThreatMetrix 公开资料未确认。
- iOS 缺失：Android 文档中的 `READ_PHONE_STATE`、Wi-Fi state、phone state profiling 在 iOS 无同等开放权限。
- Android 等价物：Android `TMXProfiling` 的 `sessionId`、collection reference、location / Wi-Fi / phone state 权限入口和 Strong ID 可作为 iOS 对照线索。

---

## 3. iOS 稳定 ID 与硬件标识维度

| 维度 | iOS 侧判断 | 来源分层 | 稳定性边界 |
|---|---|---|---|
| ThreatMetrix profiling `sessionId` | iOS SDK 明确创建 unique session ID 并返回 | 实际采集 | 会话 / 交易级引用；是否跨启动复用取决于调用方，不能等同设备 ID |
| `deviceData.collectionReference` | 服务端 assessment 用于绑定 profiling 结果 | 实际采集 | 交易 / 认证上下文引用 |
| Profiling status | SDK completion 返回 profiling 状态 | 实际采集 | 状态字段，不是 ID |
| Collected attributes | SDK 执行 profiling 并上送 attributes | 实际采集 | 原始字段未公开 |
| Strong ID cryptographic device binding | 声明对 App / browser 建立 cryptographic bind | 声明采集 | 可能强于普通 session，但客户端存储与生命周期未公开 |
| LexID / digital identity graph | 服务端身份图谱与置信度 | 声明采集 | 服务端衍生 ID，不是本地硬件 ID |
| IP address / GeoIP | 产品能力和处理声明均涉及 IP / geolocation | 声明采集 | 网络信号，非设备稳定 ID |
| Device characteristics / device identifiers | 处理声明中泛称设备标识和设备特征 | 声明采集 | 未拆到底层 iOS 字段 |
| IDFV | 未公开 | 公开缺口 | 若使用，仅 vendor scope |
| IDFA / mobile ad identifier | 隐私声明层面提及 mobile ad identifiers | 声明采集 | iOS 17.5 下需 ATT；不能证明 ThreatMetrix SDK 默认采集 IDFA |
| Keychain / App Group / UserDefaults | 未公开 | 公开缺口 | 不能假设持久化路径 |
| DeviceCheck / App Attest | 未公开 | 公开缺口 | 不能写成事实 |
| APNs token | 未公开 | 公开缺口 | token 可轮换 |

---

## 4. 持久化路径与 SDK 自建 ID

| 路径 / ID | iOS 侧判断 | 来源分层 | 备注 |
|---|---|---|---|
| Session lifecycle | SDK 公开创建 session 并在完成回调返回 | 实际采集 | 主路径是 session reference，而不是公开稳定设备 ID |
| Strong ID bind | 声明 cryptographic bind | 声明采集 | 可能涉及本地密钥或 token，但公开资料未说明 |
| SDK custom attributes | 移动 SDK 可结合业务上下文 / 认证上下文 | 可反推 | 业务扩展，不是设备固有字段 |
| Keychain | 未公开 | 公开缺口 | 不得写成跨卸载重装保证 |
| Cookie / web storage | Web profiling 场景可能使用 | 可反推 | Native iOS 不等同 Web |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：若 Strong ID 使用 Keychain 或 Secure Enclave 相关机制，可能形成安装级强绑定；但公开资料不足。
- iOS 缺失：Android phone / Wi-Fi 权限入口不可直接迁移。
- Android 等价物：Android 和 iOS 都围绕 `TMXProfiling` session ID + server assessment 工作。

---

## 5. 服务端衍生 ID 与风险能力

| 能力 | iOS 侧判断 | 来源分层 | 是否可作为本地采集字段 |
|---|---|---|---|
| Digital Identity Network | 跨设备、凭证、威胁、行为的身份网络 | 声明采集 | 否，服务端图谱 |
| LexID / confidence / trust score | 服务端身份置信度 / 信任评分 | 声明采集 | 否，服务端输出 |
| Reason codes / risk decision | assessment / authentication 决策输出 | 声明采集 | 否，服务端输出 |
| Device spoofing / tampering / emulator | 移动风险能力公开 | 声明采集 | iOS trigger 未公开 |
| Root / jailbreak cloaking | 移动风险能力公开 | 声明采集 | iOS jailbreak 具体检测未公开 |
| Bot / RAT patterns | 行为 / 风险模式识别 | 声明采集 | 服务端或 SDK 聚合 |
| Location / distance anomaly | GPS / IP / GeoIP mismatch 类能力 | 声明采集 | 多源位置判断，底层输入未公开 |
| History / velocity / previous risk associations | 历史风险关联 | 声明采集 | 服务端历史画像 |

服务端能力边界：ThreatMetrix 的强项是 session profiling + 服务端 identity graph + Strong ID / risk decision。可进入统一维度主清单，但必须标注为服务端聚合或声明能力，不能写成已公开 iOS 本地硬件标识。

---

## 6. 公开资料缺口

非公开 = 仅作线索、不作结论。

| # | 缺口 | 影响 |
|---|---|---|
| Q-1 | iOS `TMXProfiling` collected attributes 全量字段 | 决定哪些字段属于实际本地采集 |
| Q-2 | `sessionId` 生命周期 | 决定是否跨启动 / 跨交易复用 |
| Q-3 | Strong ID cryptographic bind 的 iOS 客户端材料 | 决定是否依赖 Keychain、Secure Enclave、cookie、SDK storage 或服务端 token |
| Q-4 | Strong ID 在 App 重装、清数据、系统升级后的行为 | 决定是否具备跨安装稳定性 |
| Q-5 | IDFV / IDFA / Keychain 是否使用 | 决定 Apple 标识和持久化路径 |
| Q-6 | jailbreak / simulator / tamper 的 iOS trigger | 决定是否可写成实际采集字段 |
| Q-7 | location / Wi-Fi / phone state 在 iOS 的可用边界 | 避免迁移 Android 权限模型 |
| Q-8 | RAT / bot / spoofing 模式输入 | 决定客户端和服务端分工 |
| Q-9 | LexID / Digital Identity graph 中 device 节点合并规则 | 决定服务端设备身份稳定性 |

---

## 7. 当前结论

ThreatMetrix / LexisNexis iOS 调研结论：

- **可确认**：iOS SDK 使用 `TMXProfiling` 执行 profiling，创建并返回 `sessionId`，服务端 assessment / authentication 通过 collection reference 消费该 profiling 结果。
- **可确认但非本地 ID**：profiling status、collection reference、risk decision、reason codes、identity graph、trust / confidence score 属于 session / 服务端输出。
- **声明能力**：Strong ID cryptographic bind、Digital Identity Network、device spoofing、bot / RAT、location anomaly、history / velocity、previous risk associations。
- **不可确认**：IDFV、IDFA、Keychain、DeviceCheck、App Attest、APNs token、iOS collected attributes 全量字段。

ThreatMetrix 可进入 iOS 统一主清单，但应标注为“SDK profiling session 明确，Strong ID / identity graph 属于声明或服务端聚合，底层 iOS 稳定标识未公开”。
