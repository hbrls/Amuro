# Unit21-Dimensions · GLNT-3 iOS 维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-29 13:17:28
>
> 视角：Unit21 iOS 厂商 LENS（research）
> 来源：TASK-013
> 文件命名口径：厂商名 + `Dimensions`，参考 GLNT-4 的 `Unit21-Dimensions.md`
> 当前口径：参考 Android 厂商调研方式；iOS 侧无实现基线，因此按公开资料全量整理 Unit21 在 iOS 上实际采集、声明采集或可反推出的稳定硬件标识、设备标识、SDK 自建 ID、持久化 token、服务端衍生 ID 和公开资料缺口。厂商提到的 Device Risk Score / deep device signals 只作为线索，必须尽量拆解到底层稳定采集维度。
> 调研基线 iOS 版本：iOS 17.5

---

## 0. 调研口径

本条目只依据 Unit21 公开资料、`.context/GLNT-4/Unit21-Dimensions.md` 和 GLNT-3 既定 iOS 口径整理。Android 侧 Unit21 维度只作为跨端对照线索，不作为 iOS 已采集事实。

公开来源：

- Unit21 Device Intelligence / Device Risk Score 产品材料：`https://www.unit21.ai/`
- Unit21 Fraud Consortium、Fraud & AML Platform、Transaction Monitoring、KYC / KYB、Case Management、AI Agents 公开材料
- Unit21 Blog / resources 中关于 rooted devices、VPNs、tampered browsers、bots、account farms、mule networks 的公开说明
- Unit21 Privacy Policy：`https://www.unit21.ai/privacy-policy`

来源分层：

- **实际采集**：Unit21 公开称 SDK 覆盖 web、iOS、Android、hybrid environments，并采集 encrypted device signals。
- **声明采集**：Device Risk Score 0-100、deep device and behavioral signals、rooted devices、VPNs、tampered browsers、bots、account farms、mule networks。
- **可反推**：由 Device Risk Score、Fraud Consortium、Identity Graphing、Rule Builder 和 case workflow 推导出的服务端设备 / 账号 / 交易关联能力。

非公开 = 仅作线索、不作结论。Unit21 没有公开 iOS SDK 字段 schema、Device Risk Score 字段贡献度、Apple 标识使用情况和 SDK 加密细节。

---

## 1. 产品定位

Unit21 是 Fraud & AML Operations 平台，Device Intelligence 是其交易监控、KYC、AML、案件工作流和 AI Agent 的信号层之一。iOS 侧稳定识别不是单一设备 ID，而是 encrypted device signals、behavioral signals、Device Risk Score、Fraud Consortium 和账号 / 交易上下文融合。

iOS 侧关键结论：

- Unit21 明确支持 web、iOS、Android、hybrid SDK。
- Unit21 公开 Device Risk Score 0-100，并强调 glass-box / explainable score composition。
- 风险环境包括 rooted devices、VPNs、tampered browsers、bots、account farms、mule networks。
- Device signals 可流入 Rule Builder、case workflow，并触发 block、step-up、alert、monitor。
- 公开资料未证明 Unit21 iOS SDK 明确使用 IDFV、IDFA、Keychain、DeviceCheck、App Attest 或 APNs token。

---

## 2. iOS / Apple 接入方式

| 接入形态 | iOS 侧判断 | 来源分层 | 备注 |
|---|---|---|---|
| Unit21 SDK | 覆盖 web / iOS / Android / hybrid environments | 实际采集 / 声明采集 | iOS 字段 schema 未公开 |
| Encrypted device signals | 设备信号加密实时上送 | 声明采集 | 加密与字段明细未公开 |
| Device Risk Score | 0-100 可解释设备风险分 | 声明采集 | 服务端评分 |
| Rule Builder / Case Workflow | 风险信号进入规则和案件流程 | 声明采集 | 服务端工作流 |
| Decision actions | block / step-up / alert / monitor | 声明采集 | 服务端动作 |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：可能涉及 IDFV、Keychain、DeviceCheck / App Attest、IDFA / ATT；公开资料未确认。
- iOS 缺失：rooted device、tampered browser、VPN、bot 等 trigger 在 iOS 需要单独证据。
- Android 等价物：Device Risk Score、deep signals、risk environment、Fraud Consortium 可跨端对照。

---

## 3. iOS 稳定 ID 与硬件标识维度

| 维度 | iOS 侧判断 | 来源分层 | 稳定性边界 |
|---|---|---|---|
| Deep device signals | iOS SDK 覆盖语境下的设备信号 | 声明采集 | 字段明细未公开 |
| Behavioral signals | 行为信号进入 Device Risk Score | 声明采集 | 原始事件未公开 |
| Device Risk Score 0-100 | 设备风险评分 | 声明采集 | 服务端输出，不是设备 ID |
| Device event logging | device event 进入 case management | 声明采集 | 服务端事件日志 |
| Raw signal review | analyst 可审查 raw signals 的说法 | 声明采集 | raw evidence 是否客户可见未公开 |
| IDFV | 未公开 | 公开缺口 | 若使用，仅 vendor scope |
| IDFA / ATT | 未公开 | 公开缺口 | 不能假设 |
| Keychain / SDK storage | 未公开 | 公开缺口 | 不能假设跨重装 |
| DeviceCheck / App Attest | 未公开 | 公开缺口 | 不能写成事实 |
| APNs token | 未公开 | 公开缺口 | token 可轮换 |

---

## 4. 持久化路径与 SDK 自建 ID

| 路径 / ID | iOS 侧判断 | 来源分层 | 备注 |
|---|---|---|---|
| Device Risk Score | 设备风险稳定画像 | 声明采集 | 分数不是 ID |
| Linked activity context | 设备事件与账号活动关联 | 声明采集 | 服务端关联 |
| Encrypted signal payload | 设备信号加密上送 | 声明采集 | 是否含自建 ID 未公开 |
| Keychain | 未公开 | 公开缺口 | 不能假设 |
| Web / mobile device linkage | web / iOS / Android / hybrid 跨端覆盖 | 可反推 | 关联方式未公开 |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：Keychain / IDFV 若使用会影响稳定性；当前未公开。
- iOS 缺失：Android rooted / browser tamper 表述不能直接迁移为 iOS 字段。
- Android 等价物：Device Risk Score、device event logging、Rule Builder integration 是跨端能力。

---

## 5. 服务端衍生 ID 与风险能力

| 能力 | iOS 侧判断 | 来源分层 | 是否可作为本地采集字段 |
|---|---|---|---|
| Rooted / jailbreak device | 风险环境 | 声明采集 | iOS jailbreak trigger 未公开 |
| VPN / suspicious network | 风险环境 | 声明采集 | 网络画像或本地状态未公开 |
| Tampered browser | Web / browser 风险 | 声明采集 | Native iOS 与 Web 边界未公开 |
| Bot / automation | 风险环境 | 声明采集 | 原始行为未公开 |
| Account farm / mule network | 服务端图谱 | 声明采集 | 不是本地字段 |
| Fraud Consortium | 80M+ adults shared intelligence | 声明采集 | 服务端跨客户网络 |
| Identity Graphing / Cross-Entity Link Analysis | 实体关系图谱 | 声明采集 | 服务端图谱 |
| Real-Time Monitoring | sub-250ms 风控 | 声明采集 | 服务端链路 |
| AI Agent for Detection / Investigation | 检测与调查 Agent | 声明采集 | 服务端 AI |
| Customer Risk Rating / Compliance Monitoring | 长期客户风险和合规监控 | 声明采集 | 服务端画像 |

服务端能力边界：Unit21 的多数价值维度是服务端风控 / AML 工作流。可进入统一维度主清单，但必须标注为“Device Risk Score 和服务端图谱”，不能写成 iOS 本地稳定 ID。

---

## 6. 公开资料缺口

非公开 = 仅作线索、不作结论。

| # | 缺口 | 影响 |
|---|---|---|
| Q-1 | iOS SDK 具体字段清单 | 决定 deep device signals 是否含 Apple 标识 |
| Q-2 | Device Risk Score 字段贡献度 | 决定 glass-box score 是否能落到 iOS evidence |
| Q-3 | IDFV / IDFA / Keychain / DeviceCheck 是否使用 | 决定 Apple 标识和持久化路径 |
| Q-4 | Root / jailbreak / VPN / tampered browser trigger | 决定风险标签是否来自 Native SDK |
| Q-5 | SDK 加密和传输保护细节 | 决定是否含白盒、签名、pinning 或每设备密钥 |
| Q-6 | Web / iOS / Android / hybrid 关联方式 | 决定跨端设备 token 是否存在 |
| Q-7 | Fraud Consortium 合并规则 | 决定跨客户网络如何影响设备身份 |
| Q-8 | Decision actions 客户端回调 | 决定 iOS 是否接收 block / step-up / alert / monitor |

---

## 7. 当前结论

Unit21 iOS 调研结论：

- **可确认 / 强声明**：Unit21 支持 iOS SDK 语境，采集 encrypted device signals，输出 Device Risk Score，并把设备信号接入规则、案件和决策动作。
- **高价值维度**：Device Risk Score 0-100、deep device / behavioral signals、rooted / VPN / tampered browser / bot / mule network、Fraud Consortium、Identity Graph、AI Agents。
- **不可确认**：IDFV、IDFA、Keychain、DeviceCheck、App Attest、APNs token、iOS 字段 schema、risk score 字段贡献度。
- **关键边界**：Unit21 更像服务端风控与 AML 工作流平台，设备信号进入评分和图谱；不能写成已公开 iOS 本地稳定硬件 ID。

Unit21 可进入 iOS 统一主清单，并应标注为“Device Risk Score 与服务端图谱明确，底层 iOS 标识和持久化路径未公开”。
