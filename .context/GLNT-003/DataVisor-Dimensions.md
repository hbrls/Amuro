# DataVisor-Dimensions · GLNT-3 iOS 维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-29 13:12:08
>
> 视角：DataVisor iOS 厂商 LENS（research）
> 来源：TASK-011
> 文件命名口径：厂商名 + `Dimensions`，参考 GLNT-4 的 `DataVisor-Dimensions.md`
> 当前口径：参考 Android 厂商调研方式；iOS 侧无实现基线，因此按公开资料全量整理 DataVisor 在 iOS 上实际采集、声明采集或可反推出的稳定硬件标识、设备标识、SDK 自建 ID、持久化 token、服务端衍生 ID 和公开资料缺口。厂商提到的 Unique Device ID / Device Intelligence / Fraud Platform 只作为线索，必须尽量拆解到底层稳定采集维度。
> 调研基线 iOS 版本：iOS 17.5

---

## 0. 调研口径

本条目只依据 DataVisor 公开资料、`.context/GLNT-4/DataVisor-Dimensions.md` 和 GLNT-3 既定 iOS 口径整理。Android 侧 DataVisor 维度只作为跨端对照线索，不作为 iOS 已采集事实。

公开来源：

- DataVisor Device Intelligence / SDK 产品材料
- DataVisor Fraud Platform / AI-Native Risk Platform：`https://www.datavisor.com/`
- DataVisor IP Reputation / Email Reputation / Behavioral Biometrics / Transaction Monitoring 公开产品材料
- DataVisor fraud wiki / blog 中关于 device fingerprinting、emulator、cloud phone、device flashing、RAT、P2P VPN、SIM swap 等公开说明
- DataVisor Privacy Policy：`https://www.datavisor.com/privacy-policy/`

来源分层：

- **实际采集**：DataVisor 公开称 Android / iOS / desktop / mobile SDK 采集 100+ data fields in real time，并生成 unique device ID。
- **声明采集**：edge computing、whitebox encryption、digital signature、per-device encryption key、behavioral biometrics、IP / email reputation、real-time scoring、AI decisioning。
- **可反推**：由“IMEI 缺失仍能识别”“设备参数变化仍保持 unique device ID”“SDK 本地处理数据”等表述推导出的服务端聚合和 SDK 自建 ID 能力。

非公开 = 仅作线索、不作结论。DataVisor 没有公开 iOS SDK 100+ data fields 明细、Unique Device ID 算法、持久化路径和 iOS 本地 risk evidence。

---

## 1. 产品定位

DataVisor 是 AI-Native 实时金融犯罪防护平台，核心能力是 SDK 端采集、边缘计算、SDK 保护、服务端无监督 ML、图谱分析和实时决策。iOS 侧稳定识别应理解为“SDK 采集 + Unique Device ID + 服务端模型”，不是单一 Apple 标识。

iOS 侧关键结论：

- DataVisor 公开称覆盖 Android / iOS / desktop / mobile devices，采集 100+ data fields in real time。
- DataVisor 公开声明生成 unique device ID，且在设备参数变化、IMEI 缺失场景下仍尝试识别。
- DataVisor 公开 edge computing、whitebox encryption、digital signature、per-device encryption key，用于保护 SDK 和数据。
- 风险能力覆盖 emulator、botnet、hijacked device、app cloner、cloud phone、root / hook、device flashing、RAT、SIM swap、GPS spoofing、P2P VPN、ATO 等。
- 公开资料未证明 DataVisor iOS SDK 明确使用 IDFV、IDFA、Keychain、DeviceCheck、App Attest 或 APNs token。

---

## 2. iOS / Apple 接入方式

| 接入形态 | iOS 侧判断 | 来源分层 | 备注 |
|---|---|---|---|
| DataVisor mobile SDK | 公开覆盖 iOS / Android / desktop / mobile | 实际采集 / 声明采集 | 100+ fields schema 未公开 |
| Unique Device ID | SDK / 服务端生成每设备唯一 ID | 声明采集 | 底层输入未公开 |
| Edge computing | 本地处理数据，降低流量与延迟 | 声明采集 | 具体本地特征未公开 |
| SDK protection | whitebox encryption、digital signature、per-device key | 声明采集 | 安全保护能力，不是设备 ID |
| Fraud Platform API | 实时评分和决策 | 声明采集 | 服务端输出 |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：可能涉及 IDFV、Keychain、DeviceCheck / App Attest、IDFA / ATT；公开资料未确认。
- iOS 缺失：Android emulator、root、hook、cloud phone 等 trigger 不能直接迁移。
- Android 等价物：100+ data fields、Unique Device ID、edge computing、SDK protection、risk labels 可跨端对照。

---

## 3. iOS 稳定 ID 与硬件标识维度

| 维度 | iOS 侧判断 | 来源分层 | 稳定性边界 |
|---|---|---|---|
| DataVisor Unique Device ID | 公开声明每设备唯一 ID | 声明采集 | 底层输入和生命周期未公开 |
| 100+ data fields schema | 公开称 iOS / mobile SDK 采集 100+ fields | 实际采集 / 声明采集 | 字段明细未公开 |
| 参数扰动后的设备连续性 | 设备参数变化仍尝试识别 | 声明采集 | 更可能依赖服务端聚合 |
| IMEI 缺失后的识别 | IMEI / IMEA missing 仍可识别 | 声明采集 | iOS 无 IMEI 常规权限，说明不依赖单一硬件 ID |
| Edge-computed feature payload | 本地处理数据后上送 | 可反推 | 本地特征未公开 |
| Per-device encryption key | 每设备唯一加密密钥 | 声明采集 | 安全保护，不等同设备 ID |
| IDFV | 未公开 | 公开缺口 | 若使用，仅 vendor scope |
| IDFA / ATT | 未公开 | 公开缺口 | 不能假设 |
| Keychain / SDK storage | 未公开 | 公开缺口 | 不能假设跨重装 |
| DeviceCheck / App Attest | 未公开 | 公开缺口 | 不能写成事实 |
| APNs token | 未公开 | 公开缺口 | token 可轮换 |

---

## 4. 持久化路径与 SDK 自建 ID

| 路径 / ID | iOS 侧判断 | 来源分层 | 备注 |
|---|---|---|---|
| Unique Device ID | DataVisor 自建 / 服务端设备身份 | 声明采集 | 主稳定身份线索 |
| 100+ field fingerprint | 多字段聚合指纹 | 可反推 | 字段明细未公开 |
| Edge computing local features | 本地计算特征 | 可反推 | 具体 feature 未公开 |
| Whitebox / signature / per-device key | SDK 保护和数据完整性 | 声明采集 | 可作为风险与安全维度 |
| Keychain | 未公开 | 公开缺口 | 不能假设 |
| Web / H5 / App association | Web / mobile 协同公开场景 | 声明采集 | 关联方式未公开 |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：Keychain / IDFV 若使用会影响稳定性，但未公开。
- iOS 缺失：Android IMEI 缺失场景不能直接迁移为 iOS 字段。
- Android 等价物：Unique Device ID、100+ fields、SDK protection 是跨端产品能力。

---

## 5. 服务端衍生 ID 与风险能力

| 能力 | iOS 侧判断 | 来源分层 | 是否可作为本地采集字段 |
|---|---|---|---|
| Emulator / cloud phone / botnet / hijacked device | 风险环境识别 | 声明采集 | iOS trigger 未公开 |
| Root / hook / app cloner / device flashing | Android 语境强，iOS 需找 jailbreak / tamper 等价 | 声明采集 | iOS evidence 未公开 |
| RAT / remote access | 远控风险 | 声明采集 | 服务端或 SDK 聚合 |
| GPS spoofing / P2P VPN / IP reputation | 网络与位置风险 | 声明采集 | 服务端画像 |
| Behavioral Biometrics | 行为生物特征 | 声明采集 | 原始事件未公开 |
| Transaction Monitoring / Email Reputation / NLP | 业务与内容风险 | 声明采集 | 服务端模型 |
| Identity Graph / Knowledge Graph | 设备、账号、邮箱、手机号、IP、交易图谱 | 声明采集 | 服务端图谱 |
| Cross-customer anonymized signals | 跨客户匿名信号 | 声明采集 | 服务端网络 |
| Real-time scoring / AI decisioning | <100ms 评分、自动化决策 | 声明采集 | 服务端输出 |
| Unsupervised ML / anomaly detection | 自动发现未知欺诈 | 声明采集 | 服务端模型 |

服务端能力边界：DataVisor 的 Unique Device ID 和 100+ fields 可进入统一主清单，但必须标注“公开字段明细缺失，服务端聚合显著”，不能写成已公开 iOS 本地稳定硬件 ID。

---

## 6. 公开资料缺口

非公开 = 仅作线索、不作结论。

| # | 缺口 | 影响 |
|---|---|---|
| Q-1 | iOS SDK 100+ data fields 明细 | 决定哪些字段为实际采集 |
| Q-2 | Unique Device ID 生成材料和生命周期 | 决定跨启动、跨安装、跨设备边界 |
| Q-3 | IDFV / IDFA / Keychain / DeviceCheck 是否使用 | 决定 Apple 标识和持久化路径 |
| Q-4 | Edge computing 本地计算内容 | 决定是否在端上生成风险标签或 hash |
| Q-5 | Whitebox / per-device key 与设备身份的关系 | 决定它是保护机制还是识别锚点 |
| Q-6 | iOS jailbreak / tamper / simulator / hook evidence | 决定风险能力是否来自 Native SDK |
| Q-7 | Web / H5 / App 关联方式 | 决定跨端设备关联是否存在 |
| Q-8 | Real-time decision reason code | 决定服务端输出能否追溯到 iOS evidence |
| Q-9 | Cross-customer anonymized signals 合并规则 | 决定服务端图谱如何影响设备身份 |

---

## 7. 当前结论

DataVisor iOS 调研结论：

- **可确认 / 强声明**：DataVisor 覆盖 iOS / mobile SDK，采集 100+ data fields，并生成 Unique Device ID。
- **高价值维度**：Unique Device ID、100+ fields、edge computing、whitebox encryption、digital signature、per-device key、behavioral biometrics、IP reputation、Identity Graph、real-time scoring。
- **不可确认**：IDFV、IDFA、Keychain、DeviceCheck、App Attest、APNs token、100+ fields 具体列表、Unique Device ID 生命周期。
- **关键边界**：DataVisor 的设备稳定性应写成“SDK 多字段 + 服务端聚合 ID”，不能写成已公开 iOS 本地硬件 ID。

DataVisor 可进入 iOS 统一主清单，并应标注为“Unique Device ID 和 100+ fields 声明明确，但 iOS 字段 schema 与 Apple 标识使用未公开”。
