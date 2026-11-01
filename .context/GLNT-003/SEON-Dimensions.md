# SEON-Dimensions · GLNT-3 iOS 维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-29 12:49:25
>
> 视角：SEON iOS 厂商 LENS（research）
> 来源：TASK-005
> 文件命名口径：厂商名 + `Dimensions`，参考 GLNT-4 的 `SEON-Dimensions.md`
> 当前口径：参考 Android 厂商调研方式；iOS 侧无实现基线，因此按公开资料全量整理 SEON 在 iOS 上实际采集、声明采集或可反推出的稳定硬件标识、设备标识、SDK 自建 ID、持久化 token、服务端衍生 ID 和公开资料缺口。厂商提到的 device fingerprint 只作为线索，必须尽量拆解到底层稳定采集维度。
> 调研基线 iOS 版本：iOS 17.5

---

## 0. 调研口径

本条目只依据 SEON 公开资料、`.context/GLNT-4/SEON-Dimensions.md` 和 GLNT-3 既定 iOS 口径整理。Android 侧 SEON 维度只作为跨端对照线索，不作为 iOS 已采集事实。

公开来源：

- SEON Device Intelligence integration：`https://docs.seon.io/integration/device-intelligence`
- SEON True Device ID：`https://docs.seon.io/knowledge-base/device-intelligence/true-device-id-device-identification-with-seon-device-intelligence`
- SEON Fraud API：`https://docs.seon.io/api-reference/fraud-api`
- SEON Device Intelligence getting started：`https://docs.seon.io/getting-started/device-intelligence`
- SEON Fraud API migration guides：`https://docs.seon.io/api-reference/migration-guides`
- SEON behavioral data signals：`https://docs.seon.io/knowledge-base/device-intelligence/understanding-behavioral-data-signals-with-device-intelligence`
- SEON understanding hashes：`https://docs.seon.io/knowledge-base/device-intelligence/understanding-hashes%3A-device-identification-with-seon%27s-device-intelligence`

来源分层：

- **实际采集**：SEON iOS SDK / Fraud API / integration 文档明确要求 SDK 生成 session、上送 fingerprint，或公开 API 返回字段中出现 iOS / mobile device details。
- **声明采集**：SEON 产品材料声明 Device Intelligence、Device Fingerprinting、behavioral analysis、geolocation、remote access / fraud flags 等能力，但没有公开 iOS 底层字段。
- **可反推**：由 API 返回字段、SDK 配置项、跨端 mobile 字段和 iOS 平台约束推导出的底层依赖；仅作合理推导，不写成已确认本地采集。

“非公开 = 仅作线索、不作结论”。SEON 的 True Device ID、device hash、proxy / VPN 分层、行为模型和 AI scoring 未公开算法，不能反写成具体 iOS 本地字段全集。

---

## 1. 产品定位

SEON 定位为 Fraud Prevention / AML / Device Intelligence 平台，iOS SDK 负责在 App 侧生成 device fingerprint session，并将 session ID 交给服务端 Fraud API 进行风控评估。SEON 的稳定识别并非只依赖单个 Apple 标识，而是由 SDK session、设备 / 网络 / 环境属性、行为信号和服务端历史画像共同组成。

iOS 侧关键结论：

- SEON 明确有 iOS SDK 接入与 session 生成流程。
- Fraud API 的 device details / mobile details 会返回 device hash、true device id、screen、battery、storage、CPU、network、risk flags 等聚合字段。
- 公开资料没有证明 SEON iOS SDK 明确使用 IDFV、IDFA、Keychain、DeviceCheck、App Attest 或 APNs token。
- SEON 的 True Device ID / device hash 属于服务端或 SDK 聚合标识；底层输入未公开。

---

## 2. iOS / Apple 接入方式

| 接入形态 | iOS 侧判断 | 来源分层 | 备注 |
|---|---|---|---|
| iOS SDK fingerprint session | iOS App 集成 SDK 后生成 fingerprint session，服务端用 session 查询 Fraud API | 实际采集 | 这是 SEON iOS 调研的主入口 |
| Geolocation 配置 | SDK / Fraud API 可使用位置相关能力做 geolocation / geofence / mismatch 判断 | 声明采集 | 精确位置在 GLNT-3 禁止项边界内，只记录为高风险能力或用户授权能力 |
| Behavioral analysis | SEON 声明行为生物特征、触控 / 输入 / 表单等行为风险能力 | 声明采集 | iOS 原始事件格式未公开 |
| Fraud API | 服务端接收 session 与交易上下文，返回风险分数、状态、flags 和 device details | 实际采集 | 属于服务端消费和聚合输出 |
| JavaScript / Web SDK | SEON 还有 Web / browser fingerprint 能力 | 声明采集 | iOS WKWebView 场景只作跨端线索，不等同 Native iOS 采集 |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：可能涉及 ATT / IDFA、IDFV、Keychain、DeviceCheck / App Attest、APNs token，但 SEON 公开资料未明确证实。
- iOS 缺失：Android 侧 root、emulator、screen mirroring、active call 等明确 native risk flag，在 iOS 侧只能寻找 jailbreak、simulator、screen capture、remote access 等等价风险表达；SEON 公开资料未给出完整 iOS 字段。
- Android 等价物：`SEON-Dimensions.md` 中 True Device ID、device hash、behavioral biometrics、proxy / VPN / datacenter、remote access、device farm 等可作为 iOS 调研线索。

---

## 3. iOS 稳定 ID 与硬件标识维度

| 维度 | iOS 侧判断 | 来源分层 | 稳定性边界 |
|---|---|---|---|
| SEON fingerprint session ID | iOS SDK 生成并用于服务端 Fraud API 查询 | 实际采集 | 跨单次请求 / 会话；是否跨重装取决于 SDK 持久化与服务端关联，公开资料未说明 |
| SEON device hash | Fraud API / device details 侧公开出现的设备 hash / device hash 类字段 | 实际采集 | 聚合标识；底层输入未公开，不能等同硬件 ID |
| SEON True Device ID | SEON 产品能力公开强调跨 session / 防欺诈设备识别 | 声明采集 | 服务端衍生或 SDK 聚合 ID；公开资料不足以证明跨卸载重装稳定 |
| IP address / IP geolocation | Fraud API / geolocation / IP intelligence 能力公开 | 实际采集 | 网络出口信号；非设备稳定 ID |
| Screen / display attributes | Fraud API mobile details 暴露屏幕、显示类字段 | 实际采集 | 弱指纹，不能单独稳定识别 |
| Battery / charging / power state | Fraud API mobile details 暴露电池 / charging 相关字段 | 实际采集 | 瞬时状态或弱环境信号 |
| Storage / memory / CPU class | Fraud API mobile details 暴露存储、CPU、设备能力类字段 | 实际采集 | 设备属性弱指纹，iOS 公开 API 粒度有限 |
| Timezone / locale / language | SEON device intelligence / user preferences 类能力可反推 | 可反推 | 环境维度，非稳定 ID |
| IDFV | SEON 公开资料未确认使用 | 公开缺口 | 若使用，仅 vendor scope；不等同全局硬件 ID |
| IDFA / ATT | SEON 公开资料未确认使用 | 公开缺口 | iOS 17.5 下需 ATT 授权；不进入通用设备身份主路径 |
| DeviceCheck / App Attest | SEON 公开资料未确认使用 | 公开缺口 | 可作为设备真实性 / App 完整性线索，不是稳定 ID |
| APNs token | SEON 公开资料未确认使用 | 公开缺口 | token 可轮换，不能直接视为稳定 ID |

当前结论：SEON iOS 侧最明确的稳定 / 准稳定锚点是 SDK fingerprint session、device hash / True Device ID 等厂商聚合标识；底层 Apple 标识和持久化路径未公开。

---

## 4. 持久化路径与 SDK 自建 ID

| 路径 / ID | iOS 侧判断 | 来源分层 | 备注 |
|---|---|---|---|
| SDK session / fingerprint token | iOS SDK 明确围绕 session 生成和服务端查询运作 | 实际采集 | 主路径 |
| SDK 自建 device ID | True Device ID / device hash 暗示 SDK 或服务端存在自建设备引用 | 声明采集 | 未公开是否落地 Keychain / UserDefaults |
| Keychain | 未公开 | 公开缺口 | 不能假设跨卸载重装持久化 |
| UserDefaults / App Group | 未公开 | 公开缺口 | 不能写成事实 |
| Cookie / Web storage | Web SDK 场景存在浏览器指纹与 cookie hash 线索 | 可反推 | Native iOS 不等同 Web / WKWebView |
| Pasteboard | 未公开 | 公开缺口 | 高风险追踪路径，不默认纳入 |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：Keychain 若被使用可支撑更强安装级持久化，但 SEON 未公开。
- iOS 缺失：Android 侧部分设备硬件 /系统状态字段在 iOS 无公开等价 API。
- Android 等价物：Android SEON True Device ID / 8 类 hash 体系可作为自建 ID 线索，但不能直接搬到 iOS。

---

## 5. 服务端衍生 ID 与风险能力

| 能力 | iOS 侧判断 | 来源分层 | 是否可作为本地采集字段 |
|---|---|---|---|
| Fraud API risk score / state | 服务端返回风险分数与状态 | 实际采集 | 否，服务端输出 |
| Suspicious flags | Fraud API / Device Intelligence 返回设备、网络、行为风险标记 | 实际采集 | 部分 flag 依赖本地信号，但 flag 本身是聚合输出 |
| Proxy / VPN / datacenter | SEON 公开 IP intelligence、proxy / VPN、datacenter 风险能力 | 实际采集 | 网络 / 服务端画像，不是设备硬件 ID |
| Remote access / screen sharing / device farm | SEON 公开远控、设备农场、云设备等风险能力 | 声明采集 | iOS 本地 trigger 未公开 |
| Behavioral biometrics | SEON 公开行为生物特征能力 | 声明采集 | 原始事件格式未公开 |
| Email / phone / IP reputation | SEON 风控平台常规画像能力 | 声明采集 | 业务 / 服务端画像，不是设备本地字段 |
| AI scoring / rules / network analysis | 服务端模型和规则引擎 | 声明采集 | 否，服务端衍生 |

服务端能力边界：True Device ID、device hash、risk score、suspicious flags、proxy / VPN verdict、device farm verdict 都可以进入统一维度主清单，但必须标注为“服务端聚合 / SDK 聚合 / 公开底层不足”，不能降格写成 iOS 已确认采集某个私有硬件 ID。

---

## 6. 公开资料缺口

非公开 = 仅作线索、不作结论。

| # | 缺口 | 影响 |
|---|---|---|
| Q-1 | SEON iOS SDK 是否使用 IDFV | 决定是否存在 vendor scope 设备标识主路径 |
| Q-2 | SEON iOS SDK 是否使用 IDFA / ATT | 决定广告标识是否参与设备风险，不影响通用身份主路径 |
| Q-3 | SDK 自建 ID 是否写入 Keychain | 决定是否可能跨卸载重装稳定 |
| Q-4 | device hash / True Device ID 的底层输入 | 决定能否拆解为具体 iOS 维度 |
| Q-5 | iOS jailbreak / simulator / tamper 的具体 trigger | 决定风险能力能否写成实际采集 |
| Q-6 | remote access / screen sharing 在 iOS Native 的检测路径 | 决定是否属于 iOS SDK 侧能力还是 Web / 服务端推断 |
| Q-7 | behavioral biometrics 原始事件格式 | 决定行为采集粒度与合规边界 |
| Q-8 | proxy / VPN 分层含义 | 决定是 IP 库、DNS、TLS、WebRTC、系统 VPN 状态还是服务端历史 |
| Q-9 | Web / JS hash 与 Native iOS SDK 的边界 | 避免把浏览器指纹误写成 Native iOS 采集 |

---

## 7. 当前结论

SEON iOS 调研结论：

- **可确认**：SEON iOS SDK 生成 fingerprint session，并通过 Fraud API / Device Intelligence 输出 device hash、True Device ID 类聚合标识、device details、risk score、suspicious flags、网络 / geolocation / 行为 / 风险能力。
- **不可确认**：IDFV、IDFA、Keychain、DeviceCheck、App Attest、APNs token 是否参与 SEON iOS 主身份路径。
- **可进入统一 Dimensions**：SEON fingerprint session、device hash、True Device ID、device details、IP / geolocation、proxy / VPN / datacenter、behavioral biometrics、remote access / device farm / cloud device、risk score / suspicious flags。
- **不应写成事实**：任何未公开的底层算法、Keychain 持久化、Apple 私有标识、跨卸载重装保证。

SEON 可进入 iOS 统一主清单，但应标注为“SDK session + 服务端聚合 ID 明确，底层稳定 Apple 标识未公开”。
