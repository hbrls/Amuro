# Incognia-Dimensions · GLNT-3 iOS 维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-29 13:05:37
>
> 视角：Incognia iOS 厂商 LENS（research）
> 来源：TASK-009
> 文件命名口径：厂商名 + `Dimensions`，参考 GLNT-4 的 `Incognia-Dimensions.md`
> 当前口径：参考 Android 厂商调研方式；iOS 侧无实现基线，因此按公开资料全量整理 Incognia 在 iOS 上实际采集、声明采集或可反推出的稳定硬件标识、设备标识、SDK 自建 ID、持久化 token、服务端衍生 ID 和公开资料缺口。厂商提到的 Incognia ID / device intelligence / location intelligence 只作为线索，必须尽量拆解到底层稳定采集维度。
> 调研基线 iOS 版本：iOS 17.5

---

## 0. 调研口径

本条目只依据 Incognia 公开资料、`.context/GLNT-4/Incognia-Dimensions.md` 和 GLNT-3 既定 iOS 口径整理。Android 侧 Incognia 维度只作为跨端对照线索，不作为 iOS 已采集事实。

公开来源：

- Incognia Device Intelligence：`https://www.incognia.com/device-intelligence`
- Incognia Location Intelligence：`https://www.incognia.com/location-intelligence`
- Incognia ID / Fraud Prevention 产品材料：`https://www.incognia.com/fraud-prevention`
- Incognia Developer docs 入口：`https://developer.incognia.com/`
- Incognia Privacy Policy：`https://www.incognia.com/privacy-policy`
- Incognia Trust & Safety / account security 公开材料

来源分层：

- **实际采集**：公开资料确认 Incognia 提供 iOS / Android mobile SDK，结合 device signals、location signals、risk environment 信号做识别。
- **声明采集**：Incognia ID、reinstall-proof / factory-reset-proof / cross-device persistent identity、indoor location、GPS spoofing、tamper、jailbreak / emulator 等能力。
- **可反推**：由 location intelligence、trusted location、device reset / new device / multi-accounting 场景推导出的服务端身份重识别能力。

非公开 = 仅作线索、不作结论。Incognia 的 developer docs 需要登录，公开材料没有暴露 iOS SDK 原始字段 schema、Incognia ID 生成材料、位置融合算法和持久化路径。

---

## 1. 产品定位

Incognia 将 device intelligence 与 location intelligence 融合为 Incognia ID，用于识别“设备背后的人”、降低认证摩擦、识别多账号、ATO、设备农场、位置欺诈和风险环境。它的 iOS 能力核心不是单一 Apple 标识，而是设备信号、位置行为、室内定位、风险环境和服务端模型的组合。

iOS 侧关键结论：

- Incognia 明确支持 mobile SDK，并在产品层面覆盖 iOS / Android。
- Incognia 公开强调 reinstall-proof、factory-reset-proof、cross-device persistent identity。
- Incognia 的强项是 location intelligence：室内位置、历史位置行为、trusted location、address / location binding、IP-to-location consistency。
- 风险环境包括 jailbreak / root、emulator、Frida、code injection、debugging、app cloner、data mismatch、GPS spoofing、VPN / proxy 等。
- 公开资料未证明 Incognia iOS SDK 明确使用 IDFV、IDFA、Keychain、DeviceCheck、App Attest 或 APNs token。

---

## 2. iOS / Apple 接入方式

| 接入形态 | iOS 侧判断 | 来源分层 | 备注 |
|---|---|---|---|
| Incognia mobile SDK | iOS / Android App 接入，采集 device + location + risk signals | 实际采集 / 声明采集 | developer docs 需登录，原始字段未公开 |
| Incognia ID | device intelligence + location intelligence 融合身份 | 声明采集 | 服务端融合 ID，非单一硬件 ID |
| Location Intelligence | 室内定位、历史位置行为、trusted location、address match | 声明采集 | 高敏能力，需按授权 / 合规边界处理 |
| Device Intelligence | 设备身份、new device、reinstall / reset 识别 | 声明采集 | 底层持久化未公开 |
| Risk environment | jailbreak、emulator、tamper、GPS spoofing、VPN / proxy 等 | 声明采集 | iOS trigger 未公开 |
| Web / Browser ID | 公开材料提到 AI Browser ID / web metadata | 声明采集 | Web 侧，不等同 Native iOS |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：jailbreak、iOS location permission、可能的 Keychain / IDFV / DeviceCheck 路径；后者未公开。
- iOS 缺失：Android root / emulator / Frida 等 trigger 不能直接迁移为 iOS 事实。
- Android 等价物：reinstall-proof device ID、factory reset detection、GPS spoofing、instrumentation tools、location behavior signature、Incognia ID 可跨端对照。

---

## 3. iOS 稳定 ID 与硬件标识维度

| 维度 | iOS 侧判断 | 来源分层 | 稳定性边界 |
|---|---|---|---|
| Incognia ID | 公开强调识别设备背后的人，融合 device + location + identity | 声明采集 | 服务端融合 ID，不等同本地硬件 ID |
| Reinstall-proof device ID | 公开强调跨重装设备身份 | 声明采集 | 底层路径未公开；不能归因于 Keychain |
| Factory-reset-proof identity | 公开强调设备重置后仍可关联 | 声明采集 | 更可能依赖服务端位置 / 行为 / 账号历史重识别 |
| Cross-device persistent identity | 公开强调跨设备识别用户 | 声明采集 | 用户 / 位置 / 服务端图谱，不是设备 ID |
| New device detection | 识别新设备 / 可信设备 | 声明采集 | 服务端判断 |
| Indoor location fingerprint | 室内位置 < 10 feet / 多信号融合 | 声明采集 | 高敏位置能力，非设备 ID |
| Location behavior signature | 历史位置行为、trusted location | 声明采集 | 服务端行为画像 |
| IP to location mapping consistency | IP 位置与设备 / 地址一致性 | 声明采集 | 网络 + 位置一致性 |
| IDFV | 未公开 | 公开缺口 | 若使用，仅 vendor scope |
| IDFA / ATT | 未公开 | 公开缺口 | 不能假设 |
| Keychain / SDK storage | 未公开 | 公开缺口 | 不得把跨重装声明直接归因于 Keychain |
| DeviceCheck / App Attest | 未公开 | 公开缺口 | 不能写成事实 |
| APNs token | 未公开 | 公开缺口 | token 可轮换 |

当前结论：Incognia 对“稳定身份”的声明很强，但公开材料显示其核心是设备 + 位置 + 服务端模型融合，而不是公开的 iOS 本地硬件标识。

---

## 4. 持久化路径与 SDK 自建 ID

| 路径 / ID | iOS 侧判断 | 来源分层 | 备注 |
|---|---|---|---|
| Incognia ID | 服务端融合身份 | 声明采集 | 可跨重装 / 重置 / 跨设备的声明，底层未公开 |
| Reinstall-proof device ID | 声明能力 | 声明采集 | 不能写成 Keychain 事实 |
| Location history / trusted locations | 位置行为可辅助重识别 | 可反推 | 高敏服务端历史 |
| Keychain | 未公开 | 公开缺口 | 不能假设 |
| IDFV / IDFA | 未公开 | 公开缺口 | 不能假设 |
| Web embedding vector | Web / Browser ID 语境 | 声明采集 | 不是 Native iOS 主路径 |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：Keychain 若使用会影响跨重装稳定性，但公开资料未确认。
- iOS 缺失：Android factory reset / root / emulator trigger 不等同 iOS。
- Android 等价物：Incognia ID、reinstall-proof、factory-reset-proof、location behavior 可跨端对照，但底层实现需分别确认。

---

## 5. 服务端衍生 ID 与风险能力

| 能力 | iOS 侧判断 | 来源分层 | 是否可作为本地采集字段 |
|---|---|---|---|
| Jailbreak / root risk | iOS jailbreak 与 Android root 作为跨端风险 | 声明采集 | iOS trigger 未公开 |
| Emulator / simulator | 风险环境识别 | 声明采集 | iOS simulator trigger 未公开 |
| Frida / instrumentation / code injection | tamper / instrumentation tools | 声明采集 | 本地 evidence 未公开 |
| App cloner / data mismatch | 设备环境 / 上报数据不一致 | 声明采集 | 服务端或 SDK 聚合 |
| GPS spoofing / location spoofing app | 位置风险 | 声明采集 | 底层输入未公开 |
| VPN / proxy / privacy browser | 网络 / Web 风险 | 声明采集 | iOS Native 与 Web 边界未公开 |
| Address / location binding verification | device + indoor location + physical address 三方融合 | 声明采集 | 服务端验证 |
| Multi-accounting / collusion / fraud farm | 多账号、共谋、设备农场 | 声明采集 | 服务端图谱 |
| Risk score / risk labels | API / 风险决策输出 | 声明采集 | 服务端输出 |
| AI Browser ID embedding vector | Web metadata 生成高维向量 | 声明采集 | Web 侧服务端模型，不是 Native iOS 字段 |

服务端能力边界：Incognia 的“跨重装 / 重置 / 跨设备”应进入统一主清单，但必须标注为服务端融合 / 声明能力，不能写成已公开 iOS 本地持久 ID。

---

## 6. 公开资料缺口

非公开 = 仅作线索、不作结论。

| # | 缺口 | 影响 |
|---|---|---|
| Q-1 | iOS SDK 原始字段 schema | 决定具体采集哪些 device / location / risk signals |
| Q-2 | Incognia ID 生成材料和生命周期 | 决定跨重装 / 重置 / 跨设备的真实边界 |
| Q-3 | Keychain / IDFV / IDFA / DeviceCheck 是否使用 | 决定 Apple 标识和持久化路径 |
| Q-4 | Factory reset 后身份恢复机制 | 决定依赖位置历史、账号历史还是其它服务端图谱 |
| Q-5 | Indoor location 具体信号组合 | 决定 Wi-Fi、Bluetooth、sensor fusion、beacon、UWB 等边界 |
| Q-6 | iOS jailbreak / simulator / tamper trigger | 决定风险标签是否可解释 |
| Q-7 | GPS spoofing / location spoofing app 检测依据 | 决定是否本地检测 fake GPS / provider 差异 |
| Q-8 | Privacy browser / Web Browser ID 与 Native iOS 的边界 | 避免把 Web 指纹写成 Native iOS 字段 |
| Q-9 | Risk score / labels reason code | 决定服务端输出能否追溯到具体 evidence |

---

## 7. 当前结论

Incognia iOS 调研结论：

- **可确认 / 强声明**：Incognia 支持 mobile SDK，融合 device intelligence 与 location intelligence，公开强调 Incognia ID、reinstall-proof、factory-reset-proof、cross-device persistent identity。
- **高价值维度**：Incognia ID、reinstall-proof device ID、factory-reset-proof identity、indoor location fingerprint、location behavior signature、trusted location、address / location binding、GPS spoofing、risk environment。
- **不可确认**：IDFV、IDFA、Keychain、DeviceCheck、App Attest、APNs token、iOS SDK 原始字段 schema。
- **关键边界**：跨重装 / 重置能力应被写成“声明的服务端融合 / 重识别能力”，不能写成已公开的 iOS 本地持久化路径。

Incognia 可进入 iOS 统一主清单，并应标注为“位置智能 + 服务端身份融合极强，底层 iOS 稳定标识和持久化路径未公开”。
