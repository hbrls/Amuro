# Feedzai-Dimensions · GLNT-3 iOS 维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-29 13:14:47
>
> 视角：Feedzai iOS 厂商 LENS（research）
> 来源：TASK-012
> 文件命名口径：厂商名 + `Dimensions`，参考 GLNT-4 的 `Feedzai-Dimensions.md`
> 当前口径：参考 Android 厂商调研方式；iOS 侧无实现基线，因此按公开资料全量整理 Feedzai 在 iOS 上实际采集、声明采集或可反推出的稳定硬件标识、设备标识、SDK 自建 ID、持久化 token、服务端衍生 ID 和公开资料缺口。厂商提到的 Digital Trust / device fingerprint / behavioral biometrics 只作为线索，必须尽量拆解到底层稳定采集维度。
> 调研基线 iOS 版本：iOS 17.5

---

## 0. 调研口径

本条目只依据 Feedzai 公开资料、`.context/GLNT-4/Feedzai-Dimensions.md` 和 GLNT-3 既定 iOS 口径整理。Android 侧 Feedzai 维度只作为跨端对照线索，不作为 iOS 已采集事实。

公开来源：

- Feedzai Digital Trust / ScamProtect / RiskOps 公开产品材料：`https://feedzai.com/`
- Feedzai Behavioral Biometrics 公开材料
- Feedzai ScamPrevent / Active Defense 公开材料
- Feedzai IQ / collective intelligence 公开材料
- Feedzai Privacy Policy：`https://feedzai.com/privacy-policy/`

来源分层：

- **实际采集**：公开资料明确称 Digital Trust 使用 device intelligence、behavioral biometrics、network and threat intelligence，但未公开 iOS SDK 字段 schema。
- **声明采集**：device fingerprint、usage across sessions、typing / swipe / gyroscopic data、RAT、emulator、malware、SDK integrity、IP risk、AI agent detection、IQ Score / Signals。
- **可反推**：由 continuous authentication、usage across sessions、scam session intervention、device + phone + email link analysis 推导出的服务端连续性和图谱能力。

非公开 = 仅作线索、不作结论。Feedzai 没有公开 iOS SDK 原始字段、device fingerprint 组成、Apple 标识使用情况和行为采样格式。

---

## 1. 产品定位

Feedzai 是 AI-Native RiskOps / Fraud & Financial Crime Prevention 平台。Digital Trust 将 device intelligence、behavioral biometrics、network and threat intelligence 融合，服务于 ATO、scam、fraud、AML 和会话级主动防御。iOS 侧稳定识别应理解为“设备指纹 + 行为连续性 + 网络威胁 + 服务端 IQ”，不是单一硬件 ID。

iOS 侧关键结论：

- Feedzai 公开明确 device fingerprint 和 usage across sessions。
- Feedzai Behavioral Biometrics 明确包含 typing、mouse、swipe、touchscreen、gyroscopic data 等行为信号。
- Feedzai Network and Threat Intelligence 涉及 malware、emulators、RAT、JavaScript tampering、SDK integrity、IP address。
- ScamPrevent / Active Defense 将 device、behavior、transaction 信号用于实时中断或干预高风险会话。
- 公开资料未证明 Feedzai iOS SDK 明确使用 IDFV、IDFA、Keychain、DeviceCheck、App Attest 或 APNs token。

---

## 2. iOS / Apple 接入方式

| 接入形态 | iOS 侧判断 | 来源分层 | 备注 |
|---|---|---|---|
| Digital Trust SDK / agent | device intelligence + behavior + network/threat intelligence | 声明采集 | iOS 字段 schema 未公开 |
| Behavioral Biometrics agent | typing、touch、swipe、gyro 等 | 声明采集 | iOS 原始事件格式未公开 |
| Device Fingerprinting | device fingerprint、usage across sessions | 声明采集 | 底层输入未公开 |
| ScamPrevent / Active Defense | 会话级 scam / social engineering 干预 | 声明采集 | 服务端决策为主 |
| Feedzai IQ API | IQ Score / IQ Signals / collective intelligence | 声明采集 | 服务端输出 |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：可能涉及 IDFV、Keychain、DeviceCheck / App Attest、IDFA / ATT；公开资料未确认。
- iOS 缺失：Android emulator、malware、SDK integrity 具体 trigger 不能直接迁移。
- Android 等价物：device fingerprint、behavioral biometrics、RAT、SDK integrity、IP risk、IQ Score 可跨端对照。

---

## 3. iOS 稳定 ID 与硬件标识维度

| 维度 | iOS 侧判断 | 来源分层 | 稳定性边界 |
|---|---|---|---|
| Feedzai device fingerprint | 公开明确 device fingerprint | 声明采集 | 底层输入未公开 |
| Usage across sessions | 公开强调跨 session 使用 | 声明采集 | 不能等同跨安装稳定 |
| OS / browser / device metadata | Digital Trust 类目 | 声明采集 | iOS Native 与 Web 边界未公开 |
| Continuous authentication | 会话内持续认证 | 声明采集 | 行为 + 设备 + 服务端模型 |
| Device + phone + email link analysis | 图谱关联 | 声明采集 | 服务端关联 |
| IDFV | 未公开 | 公开缺口 | 若使用，仅 vendor scope |
| IDFA / ATT | 未公开 | 公开缺口 | 不能假设 |
| Keychain / SDK storage | 未公开 | 公开缺口 | 不能假设跨重装 |
| DeviceCheck / App Attest | 未公开 | 公开缺口 | 不能写成事实 |
| APNs token | 未公开 | 公开缺口 | token 可轮换 |

---

## 4. 持久化路径与 SDK 自建 ID

| 路径 / ID | iOS 侧判断 | 来源分层 | 备注 |
|---|---|---|---|
| Device fingerprint | Feedzai 聚合设备指纹 | 声明采集 | 主稳定线索 |
| Session continuity | usage across sessions / continuous authentication | 声明采集 | 是否跨重装未公开 |
| Behavioral baseline | 正常用户行为基线 | 声明采集 | 服务端或 SDK 聚合 |
| Keychain | 未公开 | 公开缺口 | 不能假设 |
| Web / browser fingerprint | OS/browser 组合画像 | 声明采集 | 不等同 Native iOS |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：Keychain / IDFV 若使用会影响稳定性；当前未公开。
- iOS 缺失：Android malware / emulator / RAT trigger 不等同 iOS。
- Android 等价物：device fingerprint、usage across sessions、behavioral baseline、IQ Score 是跨端能力。

---

## 5. 服务端衍生 ID 与风险能力

| 能力 | iOS 侧判断 | 来源分层 | 是否可作为本地采集字段 |
|---|---|---|---|
| Typing cadence / speed / rhythm / pressure | 行为生物特征 | 声明采集 | 原始事件格式未公开 |
| Swipe pressure / direction / speed | 移动触屏行为 | 声明采集 | iOS 采样边界未公开 |
| Gyroscopic data | 行为生物特征 | 声明采集 | 高敏传感器，原始采样未公开 |
| RAT / active remote access | Scam / ATO 风险 | 声明采集 | iOS trigger 未公开 |
| Malware / emulator / SDK integrity / JS tampering | Network and Threat Intelligence | 声明采集 | iOS 与 Web 边界未公开 |
| AI agent detection | 区分 AI agent 与真人 | 声明采集 | 输入未公开 |
| IP risk intelligence | IP address / geo / threat | 声明采集 | 服务端网络画像 |
| Active Defense session termination | 高风险会话中断 | 声明采集 | 服务端动作 |
| Feedzai IQ Score / IQ Signals | 联合学习 / collective intelligence | 声明采集 | 服务端输出 |
| Cross-account / cross-device onboarding graph | 多账号 / 设备关联 | 声明采集 | 服务端图谱 |

服务端能力边界：Feedzai 的 device fingerprint 和 behavioral biometrics 可进入统一主清单，但必须标注为声明能力；没有公开 iOS 本地稳定 ID 或持久化路径。

---

## 6. 公开资料缺口

非公开 = 仅作线索、不作结论。

| # | 缺口 | 影响 |
|---|---|---|
| Q-1 | iOS Digital Trust SDK 字段 schema | 决定哪些字段为实际采集 |
| Q-2 | Device fingerprint 组成 | 决定是否使用 IDFV、Keychain、WebView、传感器或服务端历史 |
| Q-3 | Usage across sessions 生命周期 | 决定是否跨启动、跨安装、跨账号 |
| Q-4 | IDFV / IDFA / Keychain / DeviceCheck 是否使用 | 决定 Apple 标识和持久化路径 |
| Q-5 | Typing / swipe / gyro 原始采样格式 | 决定行为采集边界 |
| Q-6 | RAT / active remote access iOS trigger | 决定风险能力是否来自 Native SDK |
| Q-7 | SDK integrity iOS 实现 | 决定签名、runtime、jailbreak、hook 的 evidence |
| Q-8 | IQ Score reason code | 决定服务端输出能否追溯到 iOS evidence |
| Q-9 | Active Defense 客户端回调 | 决定高风险会话如何中断 |

---

## 7. 当前结论

Feedzai iOS 调研结论：

- **可确认 / 强声明**：Feedzai Digital Trust 使用 device fingerprint、behavioral biometrics、network and threat intelligence，并强调 usage across sessions。
- **高价值维度**：device fingerprint、behavioral baseline、typing / swipe / gyro、RAT / active remote access、SDK integrity、IP risk、IQ Score / Signals、Active Defense。
- **不可确认**：IDFV、IDFA、Keychain、DeviceCheck、App Attest、APNs token、iOS SDK 字段 schema、device fingerprint 组成。
- **关键边界**：Feedzai 的稳定性应写成“device fingerprint + 行为 / 网络 / 服务端图谱”，不能写成已公开 iOS 本地硬件 ID。

Feedzai 可进入 iOS 统一主清单，并应标注为“Digital Trust 能力明确，底层 iOS 稳定标识和持久化路径未公开”。
