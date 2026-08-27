# Bureau-Dimensions · GLNT-3 iOS 维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-29 13:09:13
>
> 视角：Bureau iOS 厂商 LENS（research）
> 来源：TASK-010
> 文件命名口径：厂商名 + `Dimensions`，参考 GLNT-4 的 `Bureau-Dimensions.md`
> 当前口径：参考 Android 厂商调研方式；iOS 侧无实现基线，因此按公开资料全量整理 Bureau 在 iOS 上实际采集、声明采集或可反推出的稳定硬件标识、设备标识、SDK 自建 ID、持久化 token、服务端衍生 ID 和公开资料缺口。厂商提到的 Device ID / Device Intelligence / RASP / Behavioral Biometrics 只作为线索，必须尽量拆解到底层稳定采集维度。
> 调研基线 iOS 版本：iOS 17.5

---

## 0. 调研口径

本条目只依据 Bureau 公开资料、`.context/GLNT-4/Bureau-Dimensions.md` 和 GLNT-3 既定 iOS 口径整理。Android 侧 Bureau 维度只作为跨端对照线索，不作为 iOS 已采集事实。

公开来源：

- Bureau Device ID：`https://www.bureau.id/product/device-id`
- Bureau Device Intelligence：`https://www.bureau.id/product/device-intelligence`
- Bureau Behavioral Biometrics：`https://www.bureau.id/product/behavioral-biometrics`
- Bureau RASP / Mobile App Security：`https://www.bureau.id/product/mobile-app-security`
- Bureau Device Graph / Graph Identity Network / Mule Score 产品材料
- Bureau SDK GitHub：`https://github.com/Bureau-Inc`
- Bureau Privacy Policy：`https://www.bureau.id/privacy-policy`

来源分层：

- **实际采集**：Bureau 公开 SDK / API 入口、Device Intelligence / Behavioral Biometrics API、Device ID 产品接入声明。
- **声明采集**：persistent Device ID、RASP、behavioral biometrics、Device Graph、Mule Score、Bot Detection、risk decisioning。
- **可反推**：由 99.7% / 99.97% persistence、factory reset / firmware / incognito resilience、100+ behavior signals、160+ attributes 等表述推导出的设备 / 行为 / 服务端融合能力。

非公开 = 仅作线索、不作结论。Bureau 的 Device ID 生成材料、iOS 持久化路径、RASP OS-level signals、behavioral raw events 和 Graph Identity Network 算法未公开，不能写成具体 iOS 本地字段全集。

---

## 1. 产品定位

Bureau 是 Unified Risk Decisioning Platform，围绕 Device ID、Device Intelligence、Behavioral Biometrics、RASP、Bot Detection、Device Graph、Mule Score 和实时决策输出建立风控体系。iOS 侧的核心不是单个 Apple 标识，而是持久设备 ID、行为连续性、运行时安全和服务端图谱的组合。

iOS 侧关键结论：

- Bureau 明确有 iOS / Android SDK 或 API 入口。
- Bureau Device ID 明确声明 99.7% / 99.97% persistent，并对 factory reset、firmware changes、plugin usage、incognito modes 具备 resilience。
- Bureau Device Intelligence 公开覆盖 device, network, location, behavior, session risk 等。
- Bureau Behavioral Biometrics 声明 100+ behavior signals，Behavioral Continuity 160+ attributes。
- Bureau RASP 声明 OS-level signals、anti-debugging、code injection、repackaging、cloning、MITM、VPN / proxy、tapjacking 等能力。
- 公开资料未证明 Bureau iOS SDK 明确使用 IDFV、IDFA、Keychain、DeviceCheck、App Attest 或 APNs token。

---

## 2. iOS / Apple 接入方式

| 接入形态 | iOS 侧判断 | 来源分层 | 备注 |
|---|---|---|---|
| Bureau SDK / API | iOS / Android / Web 端接入 Bureau 产品能力 | 实际采集 / 声明采集 | GitHub 和产品页存在公开入口 |
| Device ID | 持久设备 ID，声明高 persistence | 声明采集 | 底层 iOS 材料未公开 |
| Device Intelligence | device、network、location、behavior、session risk | 声明采集 | 多信号聚合 |
| Behavioral Biometrics | typing、tap、swipe、sensor、pointer 等 | 声明采集 | 原始事件格式未公开 |
| RASP | 运行时保护 / OS-level signals / XVM | 声明采集 | iOS 具体路径未公开 |
| Device Graph / Mule Score | 服务端图谱、mule 风险评分 | 声明采集 | 服务端能力 |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：jailbreak / iOS runtime protection、可能的 Keychain / Secure Enclave / IDFV 路径；后者未公开。
- iOS 缺失：Android root / emulator / system virtualization trigger 不能直接迁移为 iOS 事实。
- Android 等价物：Persistent Device ID、RASP、Behavioral Biometrics、Device Graph、Mule Score 可跨端对照。

---

## 3. iOS 稳定 ID 与硬件标识维度

| 维度 | iOS 侧判断 | 来源分层 | 稳定性边界 |
|---|---|---|---|
| Bureau persistent Device ID | 产品页明确 99.7% / 99.97% persistent | 声明采集 | 底层 iOS 标识和持久化路径未公开 |
| Device / Browser Fingerprint | 99.9% persistent fingerprint 表述 | 声明采集 | Web / mobile 混合语境，需区分 Native iOS |
| Factory reset resilience | 声明 resilient to factory reset | 声明采集 | 更可能含服务端重识别，不得归因于本地字段 |
| Firmware / OS change resilience | 声明 resilient to firmware changes | 声明采集 | iOS 场景边界未公开 |
| Plugin / incognito resilience | Web / browser resilience | 声明采集 | 不等同 Native iOS |
| Session risk / device telemetry | Device Intelligence 公开能力 | 声明采集 | 设备 / 网络 / 行为聚合 |
| IDFV | 未公开 | 公开缺口 | 若使用，仅 vendor scope |
| IDFA / ATT | 未公开 | 公开缺口 | 不能假设 |
| Keychain / SDK storage | 未公开 | 公开缺口 | 不能把 persistent Device ID 直接归因为 Keychain |
| DeviceCheck / App Attest | 未公开 | 公开缺口 | 不能写成事实 |
| APNs token | 未公开 | 公开缺口 | token 可轮换 |

---

## 4. 持久化路径与 SDK 自建 ID

| 路径 / ID | iOS 侧判断 | 来源分层 | 备注 |
|---|---|---|---|
| Bureau Device ID | 自建 persistent Device ID | 声明采集 | 强稳定性声明，底层未公开 |
| Device fingerprint | 多信号 fingerprint | 声明采集 | Web / mobile 混合 |
| Session risk token | Device Intelligence session 风险上下文 | 可反推 | 不是稳定 ID |
| Keychain | 未公开 | 公开缺口 | 不能假设 |
| UserDefaults / App Group | 未公开 | 公开缺口 | 不能写成事实 |
| Service-side graph continuity | Device Graph / verification history | 声明采集 | 服务端连续性 |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：如果 Device ID 在 iOS 跨重装，可能涉及 Keychain 或服务端重识别；公开资料未说明。
- iOS 缺失：Android firmware / root / emulator 表述不能直接迁移。
- Android 等价物：persistent Device ID 和 device graph 是跨平台产品能力，但底层实现需按 iOS 单独确认。

---

## 5. 服务端衍生 ID 与风险能力

| 能力 | iOS 侧判断 | 来源分层 | 是否可作为本地采集字段 |
|---|---|---|---|
| RASP / XVM / runtime protection | 运行时保护、anti-debugging、code injection、repackaging | 声明采集 | iOS trigger 未公开 |
| App cloning / virtualization / device masking | 设备伪装与虚拟化 | 声明采集 | iOS 边界未公开 |
| Packet sniffing / MITM / proxy / VPN | 网络攻击与代理检测 | 声明采集 | 多数为本地 + 服务端聚合 |
| Geo spoofing true location | GPS / IP / network / device intel 关联 | 声明采集 | 高敏位置能力，底层未公开 |
| Behavioral Biometrics | typing、touch、swipe、sensor、pointer | 声明采集 | 原始事件格式未公开 |
| Behavioral Continuity | 160+ attributes，持续被动认证 | 声明采集 | 服务端 / SDK 聚合 |
| Bot Detection | honeypot、JavaScript computations、behavior analysis | 声明采集 | Web 侧为主 |
| Device Graph / Graph Identity Network | device-account-email-phone-IP linkage | 声明采集 | 服务端图谱 |
| Mule Score | mule 风险三层评分 | 声明采集 | 服务端输出 |
| Risk score / decisioning actions | approve / reject / step-up / review 等 | 声明采集 | 服务端输出 |

服务端能力边界：Bureau 的 Device ID 和 RASP / behavior / graph 能力可以进入统一维度主清单，但必须标注为声明或服务端聚合，不能写成已公开 iOS 本地硬件标识。

---

## 6. 公开资料缺口

非公开 = 仅作线索、不作结论。

| # | 缺口 | 影响 |
|---|---|---|
| Q-1 | iOS Device ID 生成材料 | 决定是否使用 IDFV、Keychain、服务端历史或其它信号 |
| Q-2 | factory reset / firmware resilience 的测试方法 | 决定持久度数字是否可验证 |
| Q-3 | IDFV / IDFA / Keychain / DeviceCheck 是否使用 | 决定 Apple 标识和持久化路径 |
| Q-4 | RASP iOS OS-level signals | 决定 jailbreak、debug、hook、tamper 的 evidence |
| Q-5 | Behavioral Biometrics 100+ signals 清单 | 决定具体采集哪些行为事件 |
| Q-6 | Behavioral Continuity 160+ attributes 明细 | 决定 fingerprint、device、behavior、network 类字段分布 |
| Q-7 | Device Graph 节点合并规则 | 决定设备、账号、邮箱、手机号、IP 如何关联 |
| Q-8 | Bureau raw evidence 是否返回客户 | 决定服务端 risk score 是否可解释 |
| Q-9 | iOS SDK 模块边界 | 决定 Device ID、RASP、Behavioral 是否同一 SDK 或独立模块 |

---

## 7. 当前结论

Bureau iOS 调研结论：

- **强声明**：Bureau persistent Device ID 具备高 persistence，并声明对 factory reset、firmware、incognito 等具备 resilience。
- **明确产品能力**：Device Intelligence、Behavioral Biometrics、RASP、Device Graph、Mule Score、Risk Decisioning。
- **不可确认**：IDFV、IDFA、Keychain、DeviceCheck、App Attest、APNs token、iOS Device ID 底层生成材料、RASP iOS evidence。
- **关键边界**：Bureau 的持久 Device ID 应写成“厂商声明的聚合 / 服务端能力”，不能直接写成 iOS 本地稳定硬件 ID。

Bureau 可进入 iOS 统一主清单，并应标注为“强持久 Device ID 声明 + RASP / 行为 / 图谱能力明确，底层 iOS 标识和持久化路径未公开”。
