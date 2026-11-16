# GLNT-3 · iOS 计算维度全集 主清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-29 14:00:53
>
> 视角：goal
> 来源：TASK-003（Fingerprint 厂商 LENS，全量纳入）；TASK-005（SEON 厂商 LENS，首版初始化）；TASK-006（ThreatMetrix / LexisNexis Risk Solutions 厂商 LENS，全量纳入）；TASK-007（Sift 厂商 LENS，全量纳入）；TASK-008（Sumsub 厂商 LENS，全量纳入）；TASK-009（Incognia 厂商 LENS，全量纳入）；TASK-010（Bureau 厂商 LENS，全量纳入）；TASK-011（DataVisor 厂商 LENS，全量纳入）；TASK-012（Feedzai 厂商 LENS，全量纳入）；TASK-013（Unit21 厂商 LENS，全量纳入）；TASK-014（Talsec 厂商 LENS，全量纳入）；TASK-015（阿里云厂商 LENS，全量纳入）；TASK-016（腾讯云 T-Sec 厂商 LENS，全量纳入）；TASK-017（京东云厂商 LENS，全量纳入）；TASK-018（数美科技厂商 LENS，全量纳入）；TASK-019（顶象厂商 LENS，全量纳入）；TASK-020（同盾 / 小盾厂商 LENS，全量纳入）；TASK-021（网易易盾厂商 LENS，全量纳入）；TASK-022（百度智能云风控 / 昊天镜厂商 LENS，全量纳入）；TASK-023（极验设备验 / GeeGuard 厂商 LENS，全量纳入）
> 演进规则：以 `.context/GLNT-3/Index.md` 调研口径为准；单厂商 `C-*` 是独立调研快照，本文档负责统一归位、去重、编号、双归位标注和来源说明

---

## 0. 维护约定

- **本文档为 GLNT-3 iOS 计算维度主清单的唯一源**。每轮厂商 LENS 完成后，其反推出的 iOS 计算维度必须全量进入本文档；goal LENS 只负责归位、去重、命名统一、双归位标注和来源说明。
- **当前阶段为全量调研阶段**：已完成厂商 LENS 反推出的维度必须全量纳入本文档；后续只能做归位、去重、命名统一、双归位标注和来源说明，不做抽样式筛除。
- **单厂商输出保持独立**：任何厂商的 `C-*` 输出不得作为另一厂商事实依据；本文档可用于维护编号和归位，但不能把其它厂商结论迁移成当前厂商事实。
- **公共口径修改边界**：如需调整模板、来源分层、稳定性口径或归位规则，只修改 `.context/GLNT-3/Index.md`；如需沉淀统一维度，只修改本文档。
- **非公开边界**：非公开 = 仅作线索、不作结论。服务端聚合 ID、设备图谱、风险画像、模型分数和黑产库只能按公开资料标注证据等级，不能反写成已确认本地采集字段。
- **双归位标注规则**：在双归位条目的归位分组中显式标注 `（双归位：另见 XXX 分组）`，并在被引用分组顶部加一行 `> 本分组中可作为风险信号的双归位维度另见：XXX 分组`。
- **iOS 基线**：当前调研基线固定为 iOS 17.5。

---

## 1. 主清单（当前版 v0.20 · Fingerprint + SEON + ThreatMetrix + Sift + Sumsub + Incognia + Bureau + DataVisor + Feedzai + Unit21 + Talsec + 阿里云 + 腾讯云 T-Sec + 京东云 + 数美科技 + 顶象 + 同盾 / 小盾 + 网易易盾 + 百度智能云 + 极验）

### 1.1 系统 / Apple 标识

| # | 维度 | 来源 | 风险信号？ | 备注 |
|---|------|------|----------|------|
| SE-001 | IDFV 使用情况未公开 | C-005 §3 / §6（SEON） | 否 | SEON 公开资料未确认使用；若使用也仅为 vendor scope 标识，不等同全局硬件 ID |
| SE-002 | IDFA / ATT 使用情况未公开 | C-005 §3 / §6（SEON） | 否 | iOS 17.5 下需 ATT 授权；不进入通用设备身份主路径 |
| SE-003 | DeviceCheck / App Attest 使用情况未公开 | C-005 §3 / §6（SEON） | 否 | 可作为设备真实性 / App 完整性线索，不是稳定 ID |
| SE-004 | APNs token 使用情况未公开 | C-005 §3 / §6（SEON） | 否 | token 可轮换，不能直接视为稳定 ID |
| TM-001 | IDFV 使用情况未公开 | C-006 §3 / §6（ThreatMetrix） | 否 | 若使用，仅 vendor scope；公开资料未确认 |
| TM-002 | IDFA / mobile ad identifier | C-006 §3 / §6（ThreatMetrix） | 否 | 隐私声明层面提及 mobile ad identifiers；不能证明 SDK 默认采集 IDFA |
| TM-003 | DeviceCheck / App Attest 使用情况未公开 | C-006 §3 / §6（ThreatMetrix） | 否 | 不能写成事实 |
| TM-004 | APNs token 使用情况未公开 | C-006 §3 / §6（ThreatMetrix） | 否 | token 可轮换 |
| SI-001 | IDFV 使用情况未公开 | C-007 §3 / §6（Sift） | 否 | 若使用，仅 vendor scope；公开资料未确认 |
| SI-002 | IDFA / ATT 使用情况未公开 | C-007 §3 / §6（Sift） | 否 | 不能假设 |
| SI-003 | DeviceCheck / App Attest 使用情况未公开 | C-007 §3 / §6（Sift） | 否 | 不能写成事实 |
| SI-004 | APNs token 使用情况未公开 | C-007 §3 / §6（Sift） | 否 | token 可轮换 |
| SU-001 | IDFV 使用情况未公开 | C-008 §3 / §6（Sumsub） | 否 | 若使用，仅 vendor scope；公开资料未确认 |
| SU-002 | IDFA / ATT 使用情况未公开 | C-008 §3 / §6（Sumsub） | 否 | 不能假设 |
| SU-003 | DeviceCheck / App Attest 使用情况未公开 | C-008 §3 / §6（Sumsub） | 否 | 不能写成事实 |
| SU-004 | APNs token 使用情况未公开 | C-008 §3 / §6（Sumsub） | 否 | token 可轮换 |
| IN-001 | IDFV 使用情况未公开 | C-009 §3 / §6（Incognia） | 否 | 若使用，仅 vendor scope；公开资料未确认 |
| IN-002 | IDFA / ATT 使用情况未公开 | C-009 §3 / §6（Incognia） | 否 | 不能假设 |
| IN-003 | DeviceCheck / App Attest 使用情况未公开 | C-009 §3 / §6（Incognia） | 否 | 不能写成事实 |
| IN-004 | APNs token 使用情况未公开 | C-009 §3 / §6（Incognia） | 否 | token 可轮换 |
| BU-001 | IDFV 使用情况未公开 | C-010 §3 / §6（Bureau） | 否 | 若使用，仅 vendor scope；公开资料未确认 |
| BU-002 | IDFA / ATT 使用情况未公开 | C-010 §3 / §6（Bureau） | 否 | 不能假设 |
| BU-003 | DeviceCheck / App Attest 使用情况未公开 | C-010 §3 / §6（Bureau） | 否 | 不能写成事实 |
| BU-004 | APNs token 使用情况未公开 | C-010 §3 / §6（Bureau） | 否 | token 可轮换 |
| DV-001 | IDFV 使用情况未公开 | C-011 §3 / §6（DataVisor） | 否 | 若使用，仅 vendor scope；公开资料未确认 |
| DV-002 | IDFA / ATT 使用情况未公开 | C-011 §3 / §6（DataVisor） | 否 | 不能假设 |
| DV-003 | DeviceCheck / App Attest 使用情况未公开 | C-011 §3 / §6（DataVisor） | 否 | 不能写成事实 |
| DV-004 | APNs token 使用情况未公开 | C-011 §3 / §6（DataVisor） | 否 | token 可轮换 |
| FZ-001 | IDFV 使用情况未公开 | C-012 §3 / §6（Feedzai） | 否 | 若使用，仅 vendor scope；公开资料未确认 |
| FZ-002 | IDFA / ATT 使用情况未公开 | C-012 §3 / §6（Feedzai） | 否 | 不能假设 |
| FZ-003 | DeviceCheck / App Attest 使用情况未公开 | C-012 §3 / §6（Feedzai） | 否 | 不能写成事实 |
| FZ-004 | APNs token 使用情况未公开 | C-012 §3 / §6（Feedzai） | 否 | token 可轮换 |
| U2-001 | IDFV 使用情况未公开 | C-013 §3 / §6（Unit21） | 否 | 若使用，仅 vendor scope；公开资料未确认 |
| U2-002 | IDFA / ATT 使用情况未公开 | C-013 §3 / §6（Unit21） | 否 | 不能假设 |
| U2-003 | DeviceCheck / App Attest 使用情况未公开 | C-013 §3 / §6（Unit21） | 否 | 不能写成事实 |
| U2-004 | APNs token 使用情况未公开 | C-013 §3 / §6（Unit21） | 否 | token 可轮换 |
| TS-001 | IDFV 使用情况未公开 | C-014 §3 / §6（Talsec） | 否 | 若使用，仅 vendor scope；公开资料未确认 |
| TS-002 | IDFA / ATT 使用情况未公开 | C-014 §3 / §6（Talsec） | 否 | 不能假设 |
| TS-003 | DeviceCheck / App Attest 使用情况未公开 | C-014 §3 / §6（Talsec） | 否 | 不能写成事实 |
| TS-004 | APNs token 使用情况未公开 | C-014 §3 / §6（Talsec） | 否 | token 可轮换 |
| AL-001 | IDFV 使用情况未公开 | C-015 §3 / §6（阿里云） | 否 | 若使用，仅 vendor scope；公开资料未确认 |
| AL-002 | IDFA / ATT 可选增强线索 | C-015 §2 / §3 / §6（阿里云） | 否 | iOS 17.5 下需 ATT 授权；不能作为默认稳定 ID 主路径 |
| AL-003 | DeviceCheck / App Attest 使用情况未公开 | C-015 §3 / §6（阿里云） | 否 | 可作为追问项，不写成事实 |
| AL-004 | APNs token 使用情况未公开 | C-015 §3 / §6（阿里云） | 否 | token 可轮换；公开资料未确认 |
| TC-001 | IDFV 使用情况未公开 | C-016 §3 / §6（腾讯云 T-Sec） | 否 | 若使用，仅 vendor scope；公开资料未确认 |
| TC-002 | IDFA / ATT 使用情况未公开 | C-016 §3 / §6（腾讯云 T-Sec） | 否 | iOS 17.5 下需 ATT 授权；不能假设 |
| TC-003 | DeviceCheck / App Attest 使用情况未公开 | C-016 §3 / §6（腾讯云 T-Sec） | 否 | 可作为 App / 设备真实性追问项 |
| TC-004 | APNs token 使用情况未公开 | C-016 §3 / §6（腾讯云 T-Sec） | 否 | token 可轮换；公开资料未确认 |
| JD-001 | IDFV 使用情况未公开 | C-017 §3 / §6（京东云） | 否 | 若使用，仅 vendor scope；公开资料未确认 |
| JD-002 | IDFA / ATT 使用情况未公开 | C-017 §3 / §6（京东云） | 否 | iOS 17.5 下需 ATT 授权；不能假设 |
| JD-003 | DeviceCheck / App Attest 使用情况未公开 | C-017 §3 / §6（京东云） | 否 | 可作为设备真实性和 App 完整性追问项 |
| JD-004 | APNs token 使用情况未公开 | C-017 §3 / §6（京东云） | 否 | token 可轮换；公开资料未确认 |
| SM-001 | IDFV 使用情况未公开 | C-018 §3 / §6（数美科技） | 否 | 若使用，仅 vendor scope；公开资料未确认 |
| SM-002 | IDFA / ATT 使用情况未公开 | C-018 §3 / §6（数美科技） | 否 | iOS 17.5 下需 ATT 授权；不能假设 |
| SM-003 | DeviceCheck / App Attest 使用情况未公开 | C-018 §3 / §6（数美科技） | 否 | 可作为设备真实性和 App 完整性追问项 |
| SM-004 | APNs token 使用情况未公开 | C-018 §3 / §6（数美科技） | 否 | token 可轮换；公开资料未确认 |
| DX-001 | IDFV 使用情况未公开 | C-019 §3 / §6（顶象） | 否 | 若使用，仅 vendor scope；公开资料未确认 |
| DX-002 | IDFA / ATT 使用情况未公开 | C-019 §3 / §6（顶象） | 否 | iOS 17.5 下需 ATT 授权；不能假设 |
| DX-003 | DeviceCheck / App Attest 使用情况未公开 | C-019 §3 / §6（顶象） | 否 | 可作为 App / 设备真实性追问项 |
| DX-004 | APNs token 使用情况未公开 | C-019 §3 / §6（顶象） | 否 | token 可轮换；公开资料未确认 |
| TD-001 | IDFV 使用情况未公开 | C-020 §3 / §6（同盾 / 小盾） | 否 | 若使用，仅 vendor scope；公开资料未确认 |
| TD-002 | IDFA / ATT 使用情况未公开 | C-020 §3 / §6（同盾 / 小盾） | 否 | iOS 17.5 下需 ATT 授权；不能假设 |
| TD-003 | DeviceCheck / App Attest 使用情况未公开 | C-020 §3 / §6（同盾 / 小盾） | 否 | 可作为设备真实性和 App 完整性追问项 |
| TD-004 | APNs token 使用情况未公开 | C-020 §3 / §6（同盾 / 小盾） | 否 | token 可轮换；公开资料未确认 |
| YD-001 | IDFV 使用情况未公开 | C-021 §3 / §6（网易易盾） | 否 | 若使用，仅 vendor scope；公开资料未确认 |
| YD-002 | IDFA / ATT 使用情况未公开 | C-021 §3 / §6（网易易盾） | 否 | iOS 17.5 下需 ATT 授权；不能假设 |
| YD-003 | DeviceCheck / App Attest 使用情况未公开 | C-021 §3 / §6（网易易盾） | 否 | 可作为设备真实性和 App 完整性追问项 |
| YD-004 | APNs token 使用情况未公开 | C-021 §3 / §6（网易易盾） | 否 | token 可轮换；公开资料未确认 |
| BD-001 | IDFV 使用情况未公开 | C-022 §3 / §6（百度智能云） | 否 | 若使用，仅 vendor scope；公开资料未确认 |
| BD-002 | IDFA / ATT 使用情况未公开 | C-022 §3 / §6（百度智能云） | 否 | iOS 17.5 下需 ATT 授权；不能假设 |
| BD-003 | DeviceCheck / App Attest 使用情况未公开 | C-022 §3 / §6（百度智能云） | 否 | 可作为 App / 设备真实性追问项 |
| BD-004 | APNs token 使用情况未公开 | C-022 §3 / §6（百度智能云） | 否 | token 可轮换；公开资料未确认 |
| GG-001 | IDFV 使用情况未公开 | C-023 §3 / §6（极验） | 否 | 若使用，仅 vendor scope；公开资料未确认 |
| GG-002 | IDFA / ATT 使用情况未公开 | C-023 §3 / §6（极验） | 否 | iOS 17.5 下需 ATT 授权；不能假设 |
| GG-003 | DeviceCheck / App Attest 使用情况未公开 | C-023 §3 / §6（极验） | 否 | 可作为 App / 设备真实性追问项 |
| GG-004 | APNs token 使用情况未公开 | C-023 §3 / §6（极验） | 否 | token 可轮换；公开资料未确认 |
| FP-001 | IDFV / identifierForVendor | C-003 §2 / §3（Fingerprint） | 否 | iOS visitorId 主锚点，vendor scope |
| FP-002 | IDFA / ATT 使用情况未公开 | C-003 §3 / §6（Fingerprint） | 否 | 官方 iOS 主路径未见 IDFA |
| FP-003 | DeviceCheck / App Attest 使用情况未公开 | C-003 §3 / §6（Fingerprint） | 否 | 未见公开声明 |
| FP-004 | APNs token 使用情况未公开 | C-003 §3 / §6（Fingerprint） | 否 | 未见公开声明 |

### 1.2 SDK 自建 ID 与持久化

| # | 维度 | 来源 | 风险信号？ | 备注 |
|---|------|------|----------|------|
| SE-005 | SEON fingerprint session ID | C-005 §2 / §3 / §4（SEON） | 否 | iOS SDK 生成 fingerprint session，服务端 Fraud API 使用；跨重装稳定性未公开 |
| SE-006 | SEON device hash | C-005 §3 / §5（SEON） | 否 | 聚合设备 hash；底层输入未公开 |
| SE-007 | SEON True Device ID | C-005 §3 / §5（SEON） | 否 | 厂商声明的跨 session 设备识别能力；服务端 / SDK 聚合 ID，不能等同硬件 ID |
| SE-008 | Keychain 持久化未公开 | C-005 §4 / §6（SEON） | 否 | 不能假设跨卸载重装持久化 |
| SE-009 | UserDefaults / App Group 持久化未公开 | C-005 §4 / §6（SEON） | 否 | 不能写成事实 |
| SE-010 | Cookie / Web storage / cookie hash（Web 场景） | C-005 §4（SEON） | 否 | Web / WKWebView 线索，不等同 Native iOS 主路径 |
| TM-005 | ThreatMetrix profiling sessionId | C-006 §2 / §3 / §4（ThreatMetrix） | 否 | iOS SDK `initProfile()` / `doProfile()` 创建并返回；会话 / 交易级引用 |
| TM-006 | deviceData.collectionReference | C-006 §2 / §3（ThreatMetrix） | 否 | 服务端 assessment / authentication 绑定 profiling 结果 |
| TM-007 | Profiling status | C-006 §3（ThreatMetrix） | 否 | profiling 状态字段，不是 ID |
| TM-008 | Collected attributes container | C-006 §3 / §6（ThreatMetrix） | 否 | SDK 上送 attributes，但原始字段未公开 |
| TM-009 | Strong ID cryptographic device binding | C-006 §3 / §4 / §5（ThreatMetrix） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态；声明 cryptographic bind，客户端材料未公开 |
| TM-010 | Keychain / SDK storage 持久化未公开 | C-006 §4 / §6（ThreatMetrix） | 否 | 不能假设跨卸载重装 |
| SI-005 | Sift iOS SDK device properties | C-007 §2 / §3（Sift） | 否 | SDK 明确采集 device properties，但 iOS 底层字段未公开 |
| SI-006 | Sift user ID binding | C-007 §2 / §3 / §4（Sift） | **是** | **双归位**：SDK 自建 ID 与持久化 + 行为序列；业务账号键，不是设备 ID |
| SI-007 | Sift installation ID 未公开 | C-007 §3 / §4 / §6（Sift） | 否 | Android 有 `installation_id` 线索，iOS 公开资料未确认 |
| SI-008 | Keychain / SDK storage 持久化未公开 | C-007 §4 / §6（Sift） | 否 | 不能假设跨卸载重装 |
| SI-009 | Web Device Fingerprinting session | C-007 §2 / §3 / §4（Sift） | 否 | Web / browser 语境，不等同 Native iOS 主路径 |
| SU-005 | Sumsub stable unique device identifier | C-008 §3 / §4（Sumsub） | 否 | 声明跨 session、移动端跨重装；底层材料未公开 |
| SU-006 | Sumsub device fingerprint | C-008 §3 / §4（Sumsub） | 否 | 聚合指纹，不等同硬件 ID |
| SU-007 | Sumsub sessionId | C-008 §3 / §4（Sumsub） | 否 | Device Intelligence / Behavior Monitoring 连续性引用 |
| SU-008 | sessionAgeMs | C-008 §3（Sumsub） | 否 | 会话生命周期指标 |
| SU-009 | visitorId / fingerprint 类标识 | C-008 §4 / §6（Sumsub） | 否 | iOS Native 生成材料未公开 |
| SU-010 | Keychain / SDK storage 持久化未公开 | C-008 §4 / §6（Sumsub） | 否 | 不能把跨重装声明直接归因为 Keychain |
| IN-005 | Incognia ID | C-009 §3 / §4 / §5（Incognia） | 否 | device intelligence + location intelligence 融合身份；服务端融合 ID |
| IN-006 | Reinstall-proof device ID | C-009 §3 / §4 / §6（Incognia） | 否 | 声明跨重装；底层路径未公开 |
| IN-007 | Factory-reset-proof identity | C-009 §3 / §4 / §6（Incognia） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态；更可能依赖服务端重识别 |
| IN-008 | Cross-device persistent identity | C-009 §3 / §4（Incognia） | 否 | 用户 / 位置 / 服务端图谱，不是单设备 ID |
| IN-009 | New device detection | C-009 §3（Incognia） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态；服务端判断 |
| IN-010 | Keychain / SDK storage 持久化未公开 | C-009 §4 / §6（Incognia） | 否 | 不得把跨重装声明直接归因于 Keychain |
| BU-005 | Bureau persistent Device ID | C-010 §3 / §4（Bureau） | 否 | 声明 99.7% / 99.97% persistent；底层 iOS 材料未公开 |
| BU-006 | Device / Browser Fingerprint | C-010 §3 / §4（Bureau） | 否 | Web / mobile 混合语境 |
| BU-007 | Factory reset resilience | C-010 §3 / §4 / §6（Bureau） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态；不能归因于本地字段 |
| BU-008 | Firmware / OS change resilience | C-010 §3（Bureau） | 否 | iOS 场景边界未公开 |
| BU-009 | Keychain / SDK storage 持久化未公开 | C-010 §4 / §6（Bureau） | 否 | 不能把 persistent Device ID 直接归因为 Keychain |
| BU-010 | Service-side graph continuity | C-010 §4 / §5（Bureau） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力 |
| DV-005 | DataVisor Unique Device ID | C-011 §3 / §4（DataVisor） | 否 | 声明每设备唯一 ID，底层输入未公开 |
| DV-006 | 100+ data fields schema | C-011 §3 / §6（DataVisor） | 否 | iOS / mobile SDK 字段明细未公开 |
| DV-007 | 参数扰动后的设备连续性 | C-011 §3（DataVisor） | 否 | 更可能依赖服务端聚合 |
| DV-008 | Edge-computed feature payload | C-011 §3 / §4（DataVisor） | 否 | 本地特征未公开 |
| DV-009 | Per-device encryption key | C-011 §3 / §4（DataVisor） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态；保护机制，不等同设备 ID |
| DV-010 | Keychain / SDK storage 持久化未公开 | C-011 §4 / §6（DataVisor） | 否 | 不能假设跨重装 |
| FZ-005 | Feedzai device fingerprint | C-012 §3 / §4（Feedzai） | 否 | 聚合设备指纹；底层输入未公开 |
| FZ-006 | Usage across sessions | C-012 §3 / §4（Feedzai） | 否 | 不能等同跨安装稳定 |
| FZ-007 | Behavioral baseline | C-012 §4 / §5（Feedzai） | **是** | **双归位**：SDK 自建 ID 与持久化 + 行为序列；正常用户行为基线 |
| FZ-008 | Keychain / SDK storage 持久化未公开 | C-012 §4 / §6（Feedzai） | 否 | 不能假设 |
| U2-005 | Encrypted device signal payload | C-013 §2 / §4（Unit21） | 否 | 是否含自建 ID 未公开 |
| U2-006 | Device Risk Score 0-100 | C-013 §3 / §4 / §5（Unit21） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态；分数不是 ID |
| U2-007 | Linked activity context | C-013 §3 / §4（Unit21） | **是** | **双归位**：SDK 自建 ID 与持久化 + 行为序列；设备事件与账号活动关联 |
| U2-008 | Keychain / SDK storage 持久化未公开 | C-013 §4 / §6（Unit21） | 否 | 不能假设 |
| TS-005 | App Data Migration / Device Binding state | C-014 §3 / §4 / §6（Talsec） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态；不是通用设备 ID |
| TS-006 | External user correlation | C-014 §3（Talsec） | 否 | 业务关联键，不是设备 ID |
| TS-007 | App integrity cryptogram | C-014 §3 / §4 / §5（Talsec） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态；服务端完整性证明 |
| TS-008 | Secure Storage / Secret Vault | C-014 §3 / §4（Talsec） | 否 | 密钥保护能力，是否用于设备 ID 未公开 |
| TS-009 | Keychain / Secure Storage 持久化未公开 | C-014 §3 / §6（Talsec） | 否 | 不能假设跨重装 |
| AL-005 | 阿里云 deviceToken | C-015 §2 / §3 / §4（阿里云） | 否 | SDK 设备风险 token / 准稳定请求凭证，不等同硬件 ID |
| AL-006 | getSession / session 引用 | C-015 §2 / §3 / §4（阿里云） | 否 | 会话级或交易级采集引用 |
| AL-007 | bizId 业务绑定 | C-015 §2 / §3 / §4（阿里云） | 否 | 业务场景键，不是设备 ID |
| AL-008 | token 生命周期 / 降级 / 调用时序 | C-015 §4 / §5 / §6（阿里云） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态；影响设备风险质量 |
| AL-009 | 增强版设备唯一 ID / Data.extend | C-015 §4 / §5 / §6（阿里云） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力；底层 iOS 输入未公开 |
| AL-010 | Keychain / SDK storage 持久化未公开 | C-015 §3 / §4 / §6（阿里云） | 否 | 不能把 token 稳定性归因于 Keychain |
| TC-005 | Tencent T-Sec DeviceToken | C-016 §2 / §3 / §4（腾讯云 T-Sec） | 否 | iOS SDK 主引用；准稳定 SDK token，不等同硬件 ID |
| TC-006 | Openid 设备匿名标识 | C-016 §3 / §4 / §5（腾讯云 T-Sec） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力；服务端生成 ID |
| TC-007 | Unionid / 图灵盾统一 ID | C-016 §3 / §4 / §5（腾讯云 T-Sec） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力；稳定性边界未公开 |
| TC-008 | SceneCode / business binding | C-016 §2 / §4（腾讯云 T-Sec） | 否 | 业务场景键，不是设备 ID |
| TC-009 | DegradationType / ExtraInfos | C-016 §3 / §4 / §6（腾讯云 T-Sec） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态；采集质量或降级状态 |
| TC-010 | Keychain / SDK storage 持久化未公开 | C-016 §3 / §4 / §6（腾讯云 T-Sec） | 否 | 不能把 DeviceToken 稳定性归因于 Keychain |
| JD-005 | 京东云 eid | C-017 §3 / §4 / §5（京东云） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力；服务端聚合设备 ID |
| JD-006 | tk / token | C-017 §3 / §4 / §5（京东云） | 否 | 与 eid 关联的 token / 请求凭证 |
| JD-007 | tokenTime / tokenActTime | C-017 §3 / §4（京东云） | 否 | token 生命周期元数据 |
| JD-008 | vttok / strategy token | C-017 §4 / §5（京东云） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力；策略下发引用，不是硬件 ID |
| JD-009 | bizId / pin / tenantId binding | C-017 §2 / §3 / §4（京东云） | 否 | 业务、账号和租户绑定键 |
| JD-010 | Keychain / SDK storage 持久化未公开 | C-017 §3 / §4 / §6（京东云） | 否 | 不能把 eid / tk 稳定性归因于 Keychain |
| SM-005 | boxId 加密设备标识 | C-018 §2 / §3 / §4（数美科技） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力；不是明文硬件 ID |
| SM-006 | boxData 加密采集数据 | C-018 §2 / §3 / §4（数美科技） | 否 | 加密 payload，可参与服务端生成 / 恢复标识 |
| SM-007 | short boxData / usingShortBoxData | C-018 §3 / §6（数美科技） | 否 | 压缩或短数据策略，安全性边界需追问 |
| SM-008 | cloudconf / 云配 | C-018 §2 / §4（数美科技） | 否 | 服务端采集配置 |
| SM-009 | setNotCollect / 可控采集配置 | C-018 §2 / §4 / §6（数美科技） | 否 | 字段级隐私控制能力，iOS 表项未公开 |
| SM-010 | 私有化 / 代理 / 海外接入链路 | C-018 §2 / §4 / §6（数美科技） | 否 | 部署和上报路径，不是设备 ID |
| SM-011 | Keychain / SDK storage 持久化未公开 | C-018 §3 / §4 / §6（数美科技） | 否 | 不能把 boxId 稳定性归因于 Keychain |
| DX-005 | hardId 服务端设备 ID | C-019 §3 / §4 / §5（顶象） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力；只存在后端 |
| DX-006 | token 通讯产物 | C-019 §3 / §4 / §7（顶象） | 否 | 客户端与后端通讯凭证，不等同 hardId |
| DX-007 | 24 小时缓存 token | C-019 §3 / §4（顶象） | 否 | 本地缓存策略，不代表跨安装稳定 |
| DX-008 | 降级 token | C-019 §3 / §4 / §6（顶象） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态；服务端不可达或超时降级 |
| DX-009 | token 长度区分 | C-019 §3 / §6（顶象） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态；size=40 / size>40 线索 |
| DX-010 | 私有化缓存控制 / PRIVATE_CLEAR_TOKEN | C-019 §4 / §6（顶象） | 否 | 缓存控制能力 |
| DX-011 | Keychain / SDK storage 持久化未公开 | C-019 §3 / §4 / §6（顶象） | 否 | 不能把 token 缓存归因于 Keychain |
| TD-005 | 同盾 device_id | C-020 §3 / §4 / §5（同盾 / 小盾） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力；iOS 生命周期未公开 |
| TD-006 | 客户端预生成第一指纹 | C-020 §3 / §4（同盾 / 小盾） | 否 | 专利 / 公开线索，iOS 是否适用需确认 |
| TD-007 | 服务端第二指纹确认 | C-020 §3 / §4 / §5（同盾 / 小盾） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力 |
| TD-008 | fallback DeviceId 组合 | C-020 §3 / §4 / §6（同盾 / 小盾） | 否 | Android 线索，iOS 不能照搬 |
| TD-009 | Keychain / SDK storage 持久化未公开 | C-020 §3 / §4 / §6（同盾 / 小盾） | 否 | 不能把 device_id 稳定性归因于 Keychain |
| YD-005 | 易盾 token | C-021 §3 / §4 / §7（网易易盾） | 否 | 设备指纹 / 风控引擎主引用 |
| YD-006 | 离线 base64 数据 | C-021 §3 / §4 / §6（网易易盾） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态；弱网降级材料 |
| YD-007 | 离线 token | C-021 §3 / §4 / §6（网易易盾） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态；可信度需追问 |
| YD-008 | token 缓存时间 / cacheTime | C-021 §3 / §4（网易易盾） | 否 | 缓存策略，不代表跨安装稳定 |
| YD-009 | DNA 唯一设备指纹 | C-021 §3 / §5 / §6（网易易盾） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力；输入字段未公开 |
| YD-010 | Keychain / SDK storage 持久化未公开 | C-021 §3 / §4 / §6（网易易盾） | 否 | 不能把 token 稳定性归因于 Keychain |
| BD-005 | ztoken | C-022 §3 / §4 / §7（百度智能云） | 否 | SDK 请求凭证，公开口径禁止缓存 |
| BD-006 | 本地默认 ztoken | C-022 §3 / §4 / §6（百度智能云） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态；无网 / 超时降级材料 |
| BD-007 | 云端 ztoken | C-022 §3 / §4（百度智能云） | 否 | 云端生成成功 token |
| BD-008 | `x` 设备指纹 ID | C-022 §3 / §4 / §5（百度智能云） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力；生命周期未公开 |
| BD-009 | `jt` / `jid` / `jtag` H5 指纹链路 | C-022 §3 / §4 / §6（百度智能云） | 否 | Web 场景，不等同 Native iOS |
| BD-010 | Keychain / SDK storage 持久化未公开 | C-022 §3 / §4 / §6（百度智能云） | 否 | 不能把 ztoken 稳定性归因于 Keychain |
| GG-005 | GeeToken | C-023 §3 / §4 / §7（极验） | 否 | 客户端采集 token，不等同硬件 ID |
| GG-006 | respondedGeeToken | C-023 §3 / §4 / §7（极验） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力；服务端聚合回执 |
| GG-007 | 业务 data 绑定 | C-023 §3 / §4（极验） | 否 | 业务流水号或凭证绑定 |
| GG-008 | 设备唯一编号 | C-023 §3 / §4 / §5（极验） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力；生命周期未公开 |
| GG-009 | token 降级查询 | C-023 §3 / §4 / §6（极验） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态；提交失败时降级 |
| GG-010 | originalResponse | C-023 §3 / §6（极验） | 否 | 排障和审计材料，不是设备 ID |
| GG-011 | Keychain / SDK storage 持久化未公开 | C-023 §3 / §4 / §6（极验） | 否 | 不能把 GeeToken 稳定性归因于 Keychain |
| FP-005 | Fingerprint visitorId | C-003 §3 / §4 / §7（Fingerprint） | 否 | IDFV 派生的核心稳定 ID |
| FP-006 | requestId | C-003 §2 / §3 / §5（Fingerprint） | 否 | 单次 identification event ID |
| FP-007 | AppID / vendor / workspace 作用域 | C-003 §3 / §7（Fingerprint） | 否 | 决定跨 app 是否相同 |
| FP-008 | Keychain-backed device id 强线索 | C-003 §4 / §6（Fingerprint） | 否 | 开源库明确，商业 SDK 实现未完全公开 |
| FP-009 | getDeviceId 开源路径 | C-003 §4（Fingerprint） | 否 | IDFV + Keychain，对照商业 SDK |
| FP-010 | getFingerprint 本地弱指纹 hash | C-003 §4（Fingerprint） | 否 | 稳定性低于 device id |
| FP-011 | commercial advanced attributes | C-003 §4 / §6（Fingerprint） | 否 | 完整字段未公开 |

> **双归位引用**：本分组中 TM-009 / SI-006 / SU-016 / IN-007 / IN-009 / BU-007 / BU-010 / DV-009 / FZ-007 / U2-006 / U2-007 / TS-005 / TS-007 / AL-008 可作为风险信号的双归位维度另见：风险与异常态分组；BU-010 / AL-009 另见服务端图谱与衍生能力分组；FZ-007 / U2-007 另见行为序列分组。

### 1.3 设备与环境属性

| # | 维度 | 来源 | 风险信号？ | 备注 |
|---|------|------|----------|------|
| SE-011 | Screen / display attributes | C-005 §3（SEON） | 否 | 弱指纹，不能单独稳定识别 |
| SE-012 | Battery / charging / power state | C-005 §3（SEON） | 否 | 瞬时状态或弱环境信号 |
| SE-013 | Storage / memory / CPU class | C-005 §3（SEON） | 否 | 设备能力弱指纹；iOS 公开 API 粒度有限 |
| SE-014 | Timezone / locale / language | C-005 §3（SEON） | 否 | 环境维度，非稳定 ID |
| TM-011 | Device characteristics / device identifiers 泛称 | C-006 §3（ThreatMetrix） | 否 | 隐私声明和产品材料泛称，未拆到底层 iOS 字段 |
| SI-010 | iOS device properties 底层字段缺口 | C-007 §3 / §6（Sift） | 否 | location、battery、network、carrier 等是否采集未公开 |
| SU-011 | MobileSDK camera / microphone / geolocation verification context | C-008 §2（Sumsub） | 否 | 身份验证上下文；不等同设备指纹主路径 |
| IN-011 | Mobile device signals schema 缺口 | C-009 §2 / §6（Incognia） | 否 | developer docs 需登录，iOS 原始字段未公开 |
| BU-011 | Device Intelligence device telemetry | C-010 §3（Bureau） | 否 | device、session、network、behavior 聚合，底层字段未公开 |
| DV-011 | device info / OS / location setting / timestamp / languages / user agents 类目 | C-011 §3 / §6（DataVisor） | 否 | 类目级公开，字段未展开 |
| FZ-009 | OS / browser / device metadata | C-012 §3（Feedzai） | 否 | iOS Native 与 Web 边界未公开 |
| U2-009 | Deep device signals schema 缺口 | C-013 §3 / §6（Unit21） | 否 | iOS 字段清单未公开 |
| TS-010 | Passcode / device lock absent | C-014 §5（Talsec） | **是** | **双归位**：设备与环境属性 + 风险与异常态；iOS 设备安全状态 |
| AL-011 | iOS device properties schema 缺口 | C-015 §3 / §6（阿里云） | 否 | 设备型号、系统版本、App 版本、SDK 版本等字段明细未公开 |
| AL-012 | 屏幕 / 语言 / 时区等弱环境信号缺口 | C-015 §3 / §6（阿里云） | 否 | Android 对照和风控产品常见，但 iOS 公开资料未展开 |
| TC-011 | 设备信息篡改 | C-016 §3 / §5 / §6（腾讯云 T-Sec） | **是** | **双归位**：设备与环境属性 + 风险与异常态；底层 evidence 未公开 |
| TC-012 | SIM / 黑名单设备 / 系统重置状态 | C-016 §3 / §5 / §6（腾讯云 T-Sec） | **是** | **双归位**：设备与环境属性 + 风险与异常态；服务端画像或本地状态边界未公开 |
| JD-011 | cltDevice 设备数据采集开关 | C-017 §5 / §6（京东云） | 否 | 服务端策略控制设备数据采集；字段明细未公开 |
| JD-012 | isStrategy / cltTime / cltFreq 采集策略 | C-017 §5 / §6（京东云） | **是** | **双归位**：设备与环境属性 + 行为序列；采样强度和策略控制 |
| SM-021 | 50+ 设备属性标签 | C-018 §5 / §6（数美科技） | **是** | 服务端属性体系；字段明细未公开 |
| SM-022 | 100+ 原始数据维度 | C-018 §5 / §6（数美科技） | **是** | 软硬件、上网环境、设备指纹等，iOS 明细未公开 |
| DX-012 | iOS PrivacyFlag / 采集字段表缺口 | C-019 §3 / §6（顶象） | 否 | Android PrivacyFlag 完整，iOS 字段表未公开 |
| DX-013 | App 主体信息 / 应用列表缺口 | C-019 §3 / §6（顶象） | 否 | iOS 权限边界不同，不能照搬 Android |
| TD-010 | iOS device_detail 字段表缺口 | C-020 §3 / §6（同盾 / 小盾） | 否 | Android 开源 60+ 字段，iOS 明细未公开 |
| TD-011 | 显示 / 电池 / 传感器 / 内存 / 存储 | C-020 §3 / §6（同盾 / 小盾） | 否 | iOS 可作为弱环境能力追问 |
| YD-011 | 设备 / 系统 / 运行状态扩展字段缺口 | C-021 §2 / §6（网易易盾） | 否 | 启动时间、USB、电池、CPU、基带、辅助功能等 iOS 明细未公开 |
| YD-012 | 应用签名 / 进程名 / 应用版本 | C-021 §3 / §6（网易易盾） | **是** | App 完整性和上下文风险 |
| GG-012 | 系统语言 / 屏幕 / 设备类型 / 内存 / 设备名称 | C-023 §3 / §6（极验） | 否 | iOS 明细未公开 |
| GG-013 | 300+ 设备弱特征因子 | C-023 §5 / §6（极验） | **是** | 服务端 / SDK 输入全集未公开 |
| FP-021 | Raw Device Attributes / native iOS 字段缺口 | C-003 §5 / §6（Fingerprint） | 否 | Enterprise 能力；native iOS 完整字段未公开 |

### 1.4 网络与位置环境

| # | 维度 | 来源 | 风险信号？ | 备注 |
|---|------|------|----------|------|
| SE-015 | IP address / IP geolocation | C-005 §3 / §5（SEON） | 否 | 网络出口信号；非设备稳定 ID |
| SE-016 | Geolocation / geofence / mismatch | C-005 §2 / §5（SEON） | **是** | **双归位**：网络与位置环境 + 风险与异常态；精确位置属于高风险能力，只按授权 / 服务端判断记录 |
| SE-017 | Proxy / VPN / datacenter verdict | C-005 §5 / §6（SEON） | **是** | **双归位**：网络与位置环境 + 风险与异常态；分层 trigger 未公开 |
| TM-012 | IP address / GeoIP | C-006 §3 / §5（ThreatMetrix） | 否 | 网络信号，非设备稳定 ID |
| TM-013 | Location / distance anomaly | C-006 §5 / §6（ThreatMetrix） | **是** | **双归位**：网络与位置环境 + 风险与异常态；GPS / IP / GeoIP mismatch 类能力，底层输入未公开 |
| TM-014 | Proxy / VPN risk | C-006 §5 / §6（ThreatMetrix） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| SI-011 | IP / network reputation | C-007 §5（Sift） | **是** | **双归位**：网络与位置环境 + 风险与异常态；服务端画像 |
| SU-012 | Advanced IP risk profile | C-008 §5（Sumsub） | **是** | **双归位**：网络与位置环境 + 风险与异常态；IP、VPN、proxy、TOR、ISP、ASN、location、timezone |
| SU-013 | IP / document / address / EXIF mismatch | C-008 §5（Sumsub） | **是** | **双归位**：网络与位置环境 + 风险与异常态；服务端一致性判断 |
| SU-014 | Location spoofing | C-008 §5 / §6（Sumsub） | **是** | **双归位**：网络与位置环境 + 风险与异常态；底层输入未公开 |
| IN-012 | Indoor location fingerprint | C-009 §3 / §5 / §6（Incognia） | **是** | **双归位**：网络与位置环境 + 风险与异常态；高敏位置能力 |
| IN-013 | Location behavior signature / trusted location | C-009 §3 / §5（Incognia） | **是** | **双归位**：网络与位置环境 + 行为序列；历史位置行为 |
| IN-014 | IP to location mapping consistency | C-009 §3 / §5（Incognia） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| IN-015 | GPS spoofing / location spoofing app | C-009 §5 / §6（Incognia） | **是** | **双归位**：网络与位置环境 + 风险与异常态；底层输入未公开 |
| IN-016 | VPN / proxy risk | C-009 §5（Incognia） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| BU-012 | Network telemetry / IP reputation | C-010 §5（Bureau） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| BU-013 | Packet sniffing / MITM / proxy / VPN | C-010 §5 / §6（Bureau） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| BU-014 | Geo spoofing true location | C-010 §5（Bureau） | **是** | **双归位**：网络与位置环境 + 风险与异常态；高敏位置能力 |
| DV-012 | IP Reputation Service | C-011 §5（DataVisor） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| DV-013 | GPS spoofing / location setting risk | C-011 §5 / §6（DataVisor） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| DV-014 | P2P VPN Networks | C-011 §5（DataVisor） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| FZ-010 | IP risk intelligence | C-012 §5（Feedzai） | **是** | **双归位**：网络与位置环境 + 风险与异常态；服务端网络画像 |
| U2-010 | VPN / suspicious network | C-013 §5 / §6（Unit21） | **是** | **双归位**：网络与位置环境 + 风险与异常态；网络画像或本地状态未公开 |
| TS-011 | MITM / unsecure Wi-Fi / VPN | C-014 §5 / §6（Talsec） | **是** | **双归位**：网络与位置环境 + 风险与异常态；iOS 细节未公开 |
| AL-013 | 定位权限 / location info | C-015 §2 / §3 / §5 / §6（阿里云） | **是** | **双归位**：网络与位置环境 + 风险与异常态；高敏位置能力，不是稳定 ID |
| AL-014 | 本地网络 / LAN signal | C-015 §2 / §3 / §5 / §6（阿里云） | **是** | **双归位**：网络与位置环境 + 风险与异常态；用于局域网或设备牧场类线索 |
| AL-015 | IP / DNS / Wi-Fi 环境缺口 | C-015 §3 / §6（阿里云） | 否 | iOS 底层字段未公开；Android 对照只作线索 |
| TC-013 | HTTP / VPN 代理 | C-016 §3 / §5 / §6（腾讯云 T-Sec） | **是** | **双归位**：网络与位置环境 + 风险与异常态；iOS 风险标签明确 |
| TC-014 | 虚拟定位 / ClientIP 风险 | C-016 §3 / §5 / §6（腾讯云 T-Sec） | **是** | **双归位**：网络与位置环境 + 风险与异常态；位置欺骗与网络画像 |
| SM-012 | 网络连接状态 / 代理 / IP 异常 | C-018 §3 / §5 / §6（数美科技） | **是** | **双归位**：网络与位置环境 + 风险与异常态；网络风险维度 |
| SM-013 | Wi-Fi / cell / 位置环境缺口 | C-018 §3 / §6（数美科技） | 否 | iOS 字段未公开，Android 对照只作线索 |
| DX-014 | GPS / 内网 IP / 蓝牙 / 传感器列表缺口 | C-019 §3 / §6（顶象） | 否 | Android PrivacyFlag 线索，iOS 未逐项确认 |
| DX-015 | 代理 IP / VPN | C-019 §3 / §5 / §6（顶象） | **是** | **双归位**：网络与位置环境 + 风险与异常态；移动端风险能力公开 |
| TD-012 | HTTP 代理 / VPN / IP Location | C-020 §3 / §5 / §6（同盾 / 小盾） | **是** | **双归位**：网络与位置环境 + 风险与异常态；网络画像和代理风险 |
| YD-013 | IP / 网络类型 / 网络代理 | C-021 §3 / §6（网易易盾） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| YD-014 | Wi-Fi / 通话状态采集开关 | C-021 §3 / §4 / §6（网易易盾） | 否 | iOS 可行性需确认 |
| BD-011 | API 入参网络 / Wi-Fi / GPS / UA 字段缺口 | C-022 §6 / §7（百度智能云） | 否 | API 入参不等于 iOS SDK 已采集字段 |
| GG-014 | Wi-Fi / 定位 / IP / 网络制式 / 网络类型 | C-023 §3 / §6（极验） | **是** | **双归位**：网络与位置环境 + 风险与异常态；高敏环境信号 |
| FP-017 | Geolocation Spoofing Detection | C-003 §5 / §6（Fingerprint） | **是** | **双归位**：网络与位置环境 + 风险与异常态；SDK 不主动申请定位权限 |
| FP-018 | IP Geolocation / Proxy / IP Blocklist / VPN | C-003 §5（Fingerprint） | **是** | **双归位**：网络与位置环境 + 风险与异常态；服务端网络画像 |

> **双归位引用**：本分组中 SE-016 / SE-017 / TM-013 / TM-014 / SI-011 / SU-012 / SU-013 / SU-014 / IN-012 / IN-014 / IN-015 / IN-016 / BU-012 / BU-013 / BU-014 / DV-012 / DV-013 / DV-014 / FZ-010 / U2-010 / TS-011 / AL-013 / AL-014 / TC-013 / TC-014 可作为风险信号的双归位维度另见：风险与异常态分组；IN-013 另见行为序列分组。

### 1.5 行为序列

| # | 维度 | 来源 | 风险信号？ | 备注 |
|---|------|------|----------|------|
| SE-018 | Behavioral biometrics | C-005 §5 / §6（SEON） | **是** | **双归位**：行为序列 + 风险与异常态；原始事件格式未公开 |
| SE-019 | Touch / input / form behavior signals | C-005 §5 / §6（SEON） | **是** | **双归位**：行为序列 + 风险与异常态；用于 suspicious flags / behavioral analysis |
| TM-015 | Behavioral patterns / user device interactions | C-006 §5（ThreatMetrix） | **是** | **双归位**：行为序列 + 风险与异常态；声明能力，原始事件未公开 |
| TM-016 | History / velocity / previous risk associations | C-006 §5（ThreatMetrix） | **是** | **双归位**：行为序列 + 风险与异常态；服务端历史画像 |
| SI-006 | Sift user ID binding | C-007 §2 / §3 / §4（Sift） | **是** | **双归位**：SDK 自建 ID 与持久化 + 行为序列；业务账号键，不是设备 ID |
| SI-012 | App interaction event context | C-007 §2 / §3（Sift） | 否 | `open` / `collect` / `close` 形成事件流 |
| SI-013 | User-device association | C-007 §5 / §6（Sift） | **是** | **双归位**：行为序列 + 风险与异常态；服务端关联结果 |
| SI-014 | Behavioral analytics | C-007 §5 / §6（Sift） | **是** | **双归位**：行为序列 + 风险与异常态；原始事件粒度未公开 |
| SU-015 | Behavior Monitoring event stream | C-008 §5 / §6（Sumsub） | **是** | **双归位**：行为序列 + 风险与异常态；login、sign-up、settings change、password update、自定义事件 |
| SU-016 | Captured device binding | C-008 §3 / §5（Sumsub） | **是** | **双归位**：行为序列 + 风险与异常态；platform event / financial transaction 绑定设备 |
| IN-013 | Location behavior signature / trusted location | C-009 §3 / §5（Incognia） | **是** | **双归位**：网络与位置环境 + 行为序列；历史位置行为 |
| IN-017 | Address / location binding verification | C-009 §5（Incognia） | **是** | **双归位**：行为序列 + 风险与异常态；device + indoor location + physical address |
| IN-018 | Multi-accounting / collusion / fraud farm | C-009 §5（Incognia） | **是** | **双归位**：行为序列 + 风险与异常态；服务端图谱 |
| BU-015 | Behavioral Biometrics 100+ signals | C-010 §5 / §6（Bureau） | **是** | **双归位**：行为序列 + 风险与异常态；typing、tap、swipe、sensor、pointer |
| BU-016 | Behavioral Continuity 160+ attributes | C-010 §5 / §6（Bureau） | **是** | **双归位**：行为序列 + 风险与异常态；持续被动认证 |
| BU-017 | Bot Detection behavior analysis | C-010 §5（Bureau） | **是** | **双归位**：行为序列 + 风险与异常态；Web 侧为主 |
| DV-015 | Behavioral Biometrics | C-011 §5 / §6（DataVisor） | **是** | **双归位**：行为序列 + 风险与异常态；原始事件未公开 |
| DV-016 | Transaction Monitoring | C-011 §5（DataVisor） | **是** | **双归位**：行为序列 + 风险与异常态；服务端交易上下文 |
| FZ-007 | Behavioral baseline | C-012 §4 / §5（Feedzai） | **是** | **双归位**：SDK 自建 ID 与持久化 + 行为序列 |
| FZ-011 | Typing cadence / speed / rhythm / pressure | C-012 §5 / §6（Feedzai） | **是** | **双归位**：行为序列 + 风险与异常态 |
| FZ-012 | Swipe pressure / direction / speed | C-012 §5 / §6（Feedzai） | **是** | **双归位**：行为序列 + 风险与异常态 |
| FZ-013 | Gyroscopic data | C-012 §5 / §6（Feedzai） | **是** | **双归位**：行为序列 + 风险与异常态；高敏传感器，原始采样未公开 |
| FZ-014 | Continuous authentication / behavioral monitoring | C-012 §3 / §4（Feedzai） | **是** | **双归位**：行为序列 + 风险与异常态 |
| U2-007 | Linked activity context | C-013 §3 / §4（Unit21） | **是** | **双归位**：SDK 自建 ID 与持久化 + 行为序列 |
| U2-011 | Behavioral signals | C-013 §3 / §6（Unit21） | **是** | **双归位**：行为序列 + 风险与异常态；原始事件未公开 |
| U2-012 | ATO / high-risk signup / synthetic identity behavior | C-013 §5（Unit21） | **是** | **双归位**：行为序列 + 风险与异常态 |
| U2-013 | Velocity / rapid-fire / dormant account reactivation | C-013 §5（Unit21） | **是** | **双归位**：行为序列 + 风险与异常态 |
| TC-015 | 传感行为 AI / 人机行为识别 | C-016 §5 / §6（腾讯云 T-Sec） | **是** | **双归位**：行为序列 + 风险与异常态；原始传感器和触控事件未公开 |
| TC-016 | 账号 / 设备 / IP 关联行为 | C-016 §5 / §6（腾讯云 T-Sec） | **是** | **双归位**：行为序列 + 服务端图谱与衍生能力；服务端关联网络 |
| TC-017 | 应用刷量 / 多账号异常 / 团伙欺诈 | C-016 §5（腾讯云 T-Sec） | **是** | **双归位**：行为序列 + 风险与异常态；服务端行为模型 |
| JD-012 | isStrategy / cltTime / cltFreq 采集策略 | C-017 §5 / §6（京东云） | **是** | **双归位**：设备与环境属性 + 行为序列；采样强度和策略控制 |
| JD-013 | isCltSens 传感器采集策略 | C-017 §5 / §6（京东云） | **是** | **双归位**：行为序列 + 风险与异常态；原始传感器范围未公开 |
| JD-014 | cltManMachine 人机数据采集 | C-017 §5 / §6（京东云） | **是** | **双归位**：行为序列 + 风险与异常态；触控、滑动、输入等未公开 |
| SM-014 | 加速度计 / 陀螺仪 / 姿态 | C-018 §3 / §5 / §6（数美科技） | **是** | **双归位**：行为序列 + 风险与异常态；原始采样未公开 |
| SM-015 | 屏幕触摸 / View 级追踪 | C-018 §3 / §5 / §6（数美科技） | **是** | **双归位**：行为序列 + 风险与异常态；smsdk_screentouch 线索 |
| SM-016 | 内存扫描 / MemDetector | C-018 §3 / §5 / §6（数美科技） | **是** | **双归位**：行为序列 + 风险与异常态；iOS 可行路径未公开 |
| DX-016 | 设备画像近期行为 / 访问趋势 | C-019 §5 / §6（顶象） | **是** | **双归位**：行为序列 + 服务端图谱与衍生能力；服务端画像 |
| TD-013 | Behavioral Activity Capturing | C-020 §5 / §6（同盾 / 小盾） | **是** | **双归位**：行为序列 + 风险与异常态；原始事件未公开 |
| YD-015 | 模拟点击 / View 点击采集 | C-021 §3 / §6（网易易盾） | **是** | **双归位**：行为序列 + 风险与异常态；模拟点击 AI 输入未公开 |
| FP-013 | Velocity per visitorID / linkedID / IP | C-003 §5（Fingerprint） | **是** | **双归位**：行为序列 + 风险与异常态；服务端窗口聚合 |
| FP-014 | High-Activity Device | C-003 §5（Fingerprint） | **是** | **双归位**：行为序列 + 风险与异常态；24h 活跃度异常 |

> **双归位引用**：本分组中 SE-018 / SE-019 / TM-015 / TM-016 / SI-013 / SI-014 / SU-015 / SU-016 / IN-017 / IN-018 / BU-015 / BU-016 / BU-017 / DV-015 / DV-016 / FZ-011 / FZ-012 / FZ-013 / FZ-014 / U2-011 / U2-012 / U2-013 / TC-015 / TC-017 可作为风险信号的双归位维度另见：风险与异常态分组；IN-013 另见网络与位置环境分组；TC-016 另见服务端图谱与衍生能力分组。

### 1.6 风险与异常态

| # | 维度 | 来源 | 风险信号？ | 备注 |
|---|------|------|----------|------|
| SE-016 | Geolocation / geofence / mismatch | C-005 §2 / §5（SEON） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| SE-017 | Proxy / VPN / datacenter verdict | C-005 §5 / §6（SEON） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| SE-018 | Behavioral biometrics | C-005 §5 / §6（SEON） | **是** | **双归位**：行为序列 + 风险与异常态 |
| SE-019 | Touch / input / form behavior signals | C-005 §5 / §6（SEON） | **是** | **双归位**：行为序列 + 风险与异常态 |
| SE-020 | Remote access / screen sharing / device farm / cloud device flags | C-005 §5 / §6（SEON） | **是** | iOS 本地 trigger 未公开；服务端或 SDK 聚合风险标记 |
| SE-021 | Fraud API risk score / state | C-005 §5（SEON） | **是** | 服务端输出，不是本地采集字段 |
| SE-022 | Suspicious flags aggregate | C-005 §5（SEON） | **是** | 可能消费本地、网络、行为和服务端历史信号 |
| TM-009 | Strong ID cryptographic device binding | C-006 §3 / §4 / §5（ThreatMetrix） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态 |
| TM-013 | Location / distance anomaly | C-006 §5 / §6（ThreatMetrix） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| TM-014 | Proxy / VPN risk | C-006 §5 / §6（ThreatMetrix） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| TM-015 | Behavioral patterns / user device interactions | C-006 §5（ThreatMetrix） | **是** | **双归位**：行为序列 + 风险与异常态 |
| TM-016 | History / velocity / previous risk associations | C-006 §5（ThreatMetrix） | **是** | **双归位**：行为序列 + 风险与异常态 |
| TM-017 | Device spoofing / tampering / emulator | C-006 §5 / §6（ThreatMetrix） | **是** | iOS trigger 未公开 |
| TM-018 | Root / jailbreak cloaking | C-006 §5 / §6（ThreatMetrix） | **是** | iOS jailbreak 具体检测未公开 |
| TM-019 | Bot / RAT patterns | C-006 §5 / §6（ThreatMetrix） | **是** | 服务端或 SDK 聚合 |
| TM-020 | Risk decision / reason codes | C-006 §5（ThreatMetrix） | **是** | 服务端 assessment / authentication 输出 |
| SI-011 | IP / network reputation | C-007 §5（Sift） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| SI-013 | User-device association | C-007 §5 / §6（Sift） | **是** | **双归位**：行为序列 + 风险与异常态 |
| SI-014 | Behavioral analytics | C-007 §5 / §6（Sift） | **是** | **双归位**：行为序列 + 风险与异常态 |
| SI-015 | Score API risk score | C-007 §5（Sift） | **是** | 服务端风险评分 |
| SI-016 | Workflow decision | C-007 §5（Sift） | **是** | 服务端自动决策 / 审核 / 阻断流程 |
| SI-017 | Global Data Network risk associations | C-007 §5 / §6（Sift） | **是** | 跨客户 / 跨事件网络智能 |
| SI-018 | iOS jailbreak / simulator / tamper trigger 未公开 | C-007 §6（Sift） | **是** | 是否来自 Native SDK 未公开 |
| SU-012 | Advanced IP risk profile | C-008 §5（Sumsub） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| SU-013 | IP / document / address / EXIF mismatch | C-008 §5（Sumsub） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| SU-014 | Location spoofing | C-008 §5 / §6（Sumsub） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| SU-015 | Behavior Monitoring event stream | C-008 §5 / §6（Sumsub） | **是** | **双归位**：行为序列 + 风险与异常态 |
| SU-016 | Captured device binding | C-008 §3 / §5（Sumsub） | **是** | **双归位**：行为序列 + 风险与异常态 |
| SU-017 | Device risk labels aggregate | C-008 §3 / §5（Sumsub） | **是** | Device Intelligence 聚合输出 |
| SU-018 | Jailbroken risk label | C-008 §5 / §6（Sumsub） | **是** | iOS 语境明确风险标签，底层 trigger 未公开 |
| SU-019 | MITM attack risk label | C-008 §5 / §6（Sumsub） | **是** | 证书 / TLS / 请求完整性路径未公开 |
| SU-020 | Applicant risk score / tags | C-008 §5（Sumsub） | **是** | 服务端输出 |
| IN-007 | Factory-reset-proof identity | C-009 §3 / §4 / §6（Incognia） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态 |
| IN-009 | New device detection | C-009 §3（Incognia） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态 |
| IN-012 | Indoor location fingerprint | C-009 §3 / §5 / §6（Incognia） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| IN-014 | IP to location mapping consistency | C-009 §3 / §5（Incognia） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| IN-015 | GPS spoofing / location spoofing app | C-009 §5 / §6（Incognia） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| IN-016 | VPN / proxy risk | C-009 §5（Incognia） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| IN-017 | Address / location binding verification | C-009 §5（Incognia） | **是** | **双归位**：行为序列 + 风险与异常态 |
| IN-018 | Multi-accounting / collusion / fraud farm | C-009 §5（Incognia） | **是** | **双归位**：行为序列 + 风险与异常态 |
| IN-019 | Jailbreak / emulator / tamper / instrumentation risk | C-009 §5 / §6（Incognia） | **是** | iOS trigger 未公开 |
| IN-020 | Risk score / risk labels | C-009 §5 / §6（Incognia） | **是** | 服务端输出 |
| BU-007 | Factory reset resilience | C-010 §3 / §4 / §6（Bureau） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态 |
| BU-012 | Network telemetry / IP reputation | C-010 §5（Bureau） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| BU-013 | Packet sniffing / MITM / proxy / VPN | C-010 §5 / §6（Bureau） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| BU-014 | Geo spoofing true location | C-010 §5（Bureau） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| BU-015 | Behavioral Biometrics 100+ signals | C-010 §5 / §6（Bureau） | **是** | **双归位**：行为序列 + 风险与异常态 |
| BU-016 | Behavioral Continuity 160+ attributes | C-010 §5 / §6（Bureau） | **是** | **双归位**：行为序列 + 风险与异常态 |
| BU-017 | Bot Detection behavior analysis | C-010 §5（Bureau） | **是** | **双归位**：行为序列 + 风险与异常态 |
| BU-018 | RASP / XVM / runtime protection | C-010 §5 / §6（Bureau） | **是** | anti-debugging、code injection、repackaging、tampering 等，iOS trigger 未公开 |
| BU-019 | App cloning / virtualization / device masking | C-010 §5（Bureau） | **是** | iOS 边界未公开 |
| BU-020 | Risk score / decisioning actions | C-010 §5（Bureau） | **是** | 服务端输出 |
| DV-009 | Per-device encryption key | C-011 §3 / §4（DataVisor） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态 |
| DV-012 | IP Reputation Service | C-011 §5（DataVisor） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| DV-013 | GPS spoofing / location setting risk | C-011 §5 / §6（DataVisor） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| DV-014 | P2P VPN Networks | C-011 §5（DataVisor） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| DV-015 | Behavioral Biometrics | C-011 §5 / §6（DataVisor） | **是** | **双归位**：行为序列 + 风险与异常态 |
| DV-016 | Transaction Monitoring | C-011 §5（DataVisor） | **是** | **双归位**：行为序列 + 风险与异常态 |
| DV-017 | Emulator / cloud phone / botnet / hijacked device | C-011 §5（DataVisor） | **是** | iOS trigger 未公开 |
| DV-018 | Root / hook / app cloner / device flashing | C-011 §5（DataVisor） | **是** | iOS 需找 jailbreak / tamper 等价 |
| DV-019 | RAT / remote access | C-011 §5（DataVisor） | **是** | 服务端或 SDK 聚合 |
| DV-020 | Real-time scoring / AI decisioning | C-011 §5（DataVisor） | **是** | 服务端输出 |
| FZ-010 | IP risk intelligence | C-012 §5（Feedzai） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| FZ-011 | Typing cadence / speed / rhythm / pressure | C-012 §5 / §6（Feedzai） | **是** | **双归位**：行为序列 + 风险与异常态 |
| FZ-012 | Swipe pressure / direction / speed | C-012 §5 / §6（Feedzai） | **是** | **双归位**：行为序列 + 风险与异常态 |
| FZ-013 | Gyroscopic data | C-012 §5 / §6（Feedzai） | **是** | **双归位**：行为序列 + 风险与异常态 |
| FZ-014 | Continuous authentication / behavioral monitoring | C-012 §3 / §4（Feedzai） | **是** | **双归位**：行为序列 + 风险与异常态 |
| FZ-015 | RAT / active remote access | C-012 §5 / §6（Feedzai） | **是** | iOS trigger 未公开 |
| FZ-016 | Malware / emulator / SDK integrity / JS tampering | C-012 §5 / §6（Feedzai） | **是** | iOS 与 Web 边界未公开 |
| FZ-017 | AI agent detection | C-012 §5 / §6（Feedzai） | **是** | 输入未公开 |
| FZ-018 | Active Defense session termination | C-012 §5 / §6（Feedzai） | **是** | 服务端动作 |
| U2-006 | Device Risk Score 0-100 | C-013 §3 / §4 / §5（Unit21） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态 |
| U2-010 | VPN / suspicious network | C-013 §5 / §6（Unit21） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| U2-011 | Behavioral signals | C-013 §3 / §6（Unit21） | **是** | **双归位**：行为序列 + 风险与异常态 |
| U2-012 | ATO / high-risk signup / synthetic identity behavior | C-013 §5（Unit21） | **是** | **双归位**：行为序列 + 风险与异常态 |
| U2-013 | Velocity / rapid-fire / dormant account reactivation | C-013 §5（Unit21） | **是** | **双归位**：行为序列 + 风险与异常态 |
| U2-014 | Rooted / jailbreak device | C-013 §5 / §6（Unit21） | **是** | iOS jailbreak trigger 未公开 |
| U2-015 | Tampered browser | C-013 §5 / §6（Unit21） | **是** | Native iOS 与 Web 边界未公开 |
| U2-016 | Bot / automation / account farm / mule network | C-013 §5（Unit21） | **是** | 服务端图谱和行为检测 |
| U2-017 | Block / step-up / alert / monitor decision actions | C-013 §5 / §6（Unit21） | **是** | 服务端动作 |
| TS-005 | App Data Migration / Device Binding state | C-014 §3 / §4 / §6（Talsec） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态 |
| TS-007 | App integrity cryptogram | C-014 §3 / §4 / §5（Talsec） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态 |
| TS-010 | Passcode / device lock absent | C-014 §5（Talsec） | **是** | **双归位**：设备与环境属性 + 风险与异常态 |
| TS-011 | MITM / unsecure Wi-Fi / VPN | C-014 §5 / §6（Talsec） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| TS-012 | Jailbreak | C-014 §5（Talsec） | **是** | iOS 本地风险检测 |
| TS-013 | Debugger attached | C-014 §5（Talsec） | **是** | iOS 本地风险检测 |
| TS-014 | Runtime tamper / hook / Frida | C-014 §5 / §6（Talsec） | **是** | 具体覆盖范围未公开 |
| TS-015 | Simulator | C-014 §5（Talsec） | **是** | iOS 本地风险检测 |
| TS-016 | Screen capture / recording | C-014 §5 / §6（Talsec） | **是** | iOS 本地风险检测 |
| TS-017 | Untrusted source / repackaging / app integrity | C-014 §5（Talsec） | **是** | App 完整性风险 |
| TS-018 | AppiCrypt / Portal telemetry / Device Risk Scoring | C-014 §5 / §6（Talsec） | **是** | 服务端保护与统计 |
| AL-008 | token 生命周期 / 降级 / 调用时序 | C-015 §4 / §5 / §6（阿里云） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态 |
| AL-013 | 定位权限 / location info | C-015 §2 / §3 / §5 / §6（阿里云） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| AL-014 | 本地网络 / LAN signal | C-015 §2 / §3 / §5 / §6（阿里云） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| AL-016 | 黑灰产 App / 恶意工具风险 | C-015 §5 / §6（阿里云） | **是** | iOS installed apps 枚举受限；公开资料不足时只作服务端或配置线索 |
| AL-017 | 设备风险标签聚合 | C-015 §5 / §6（阿里云） | **是** | 服务端聚合输出，不是本地字段 |
| AL-018 | Jailbreak / simulator / tamper 标签缺口 | C-015 §5 / §6（阿里云） | **是** | Android root / emulator / virtual 的 iOS 等价物未公开 |
| AL-019 | 设备牧场 / 群控风险 | C-015 §5 / §6（阿里云） | **是** | 可能消费 LAN、IP、位置、业务行为和历史图谱 |
| AL-020 | token 篡改 / bizId 完整性校验 | C-015 §5 / §6（阿里云） | **是** | 服务端结合业务绑定和 token 完整性判断 |
| AL-021 | 设备风险评分 / risk decision | C-015 §5 / §7（阿里云） | **是** | 服务端输出，不是本地采集字段 |
| TC-009 | DegradationType / ExtraInfos | C-016 §3 / §4 / §6（腾讯云 T-Sec） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态 |
| TC-011 | 设备信息篡改 | C-016 §3 / §5 / §6（腾讯云 T-Sec） | **是** | **双归位**：设备与环境属性 + 风险与异常态 |
| TC-012 | SIM / 黑名单设备 / 系统重置状态 | C-016 §3 / §5 / §6（腾讯云 T-Sec） | **是** | **双归位**：设备与环境属性 + 风险与异常态 |
| TC-013 | HTTP / VPN 代理 | C-016 §3 / §5 / §6（腾讯云 T-Sec） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| TC-014 | 虚拟定位 / ClientIP 风险 | C-016 §3 / §5 / §6（腾讯云 T-Sec） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| TC-015 | 传感行为 AI / 人机行为识别 | C-016 §5 / §6（腾讯云 T-Sec） | **是** | **双归位**：行为序列 + 风险与异常态 |
| TC-017 | 应用刷量 / 多账号异常 / 团伙欺诈 | C-016 §5（腾讯云 T-Sec） | **是** | **双归位**：行为序列 + 风险与异常态 |
| TC-018 | RiskInfos / HistRiskInfos | C-016 §3 / §5（腾讯云 T-Sec） | **是** | 服务端实时 / 历史风险标签集合 |
| TC-019 | SceneRiskInfos | C-016 §3 / §5（腾讯云 T-Sec） | **是** | 场景化风险输出 |
| TC-020 | SuggestionLevel | C-016 §3 / §5（腾讯云 T-Sec） | **是** | 综合建议等级 / 服务端决策 |
| TC-021 | 越狱 / 注入 / HOOK / 逆向调试 | C-016 §3 / §5 / §6（腾讯云 T-Sec） | **是** | iOS 明确风险标签 |
| TC-022 | 重打包 / App 完整性风险 | C-016 §3 / §5（腾讯云 T-Sec） | **是** | iOS 明确风险标签 |
| TC-023 | 模拟器 / 多开 / 自动化设备 | C-016 §3 / §5 / §6（腾讯云 T-Sec） | **是** | iOS 明确风险标签 |
| TC-024 | 屏幕共享 | C-016 §3 / §5 / §6（腾讯云 T-Sec） | **是** | iOS 明确风险标签；trigger 未公开 |
| TC-025 | 黑名单设备 / 系统重置画像 | C-016 §3 / §5 / §6（腾讯云 T-Sec） | **是** | 服务端画像或本地状态边界未公开 |
| JD-015 | verifyCode / 验证码联动 | C-017 §5 / §6（京东云） | **是** | 风险触发验证码或滑块策略 |
| JD-013 | isCltSens 传感器采集策略 | C-017 §5 / §6（京东云） | **是** | **双归位**：行为序列 + 风险与异常态 |
| JD-014 | cltManMachine 人机数据采集 | C-017 §5 / §6（京东云） | **是** | **双归位**：行为序列 + 风险与异常态 |
| JD-016 | cltAppList / App 列表采集开关 | C-017 §5 / §6（京东云） | **是** | iOS installed apps 枚举受限；不能照搬 Android |
| JD-017 | ise 模拟器标签 | C-017 §3 / §5 / §6（京东云） | **是** | 服务端风险标签；iOS trigger 未公开 |
| JD-018 | isr / isj root / jailbreak 标签 | C-017 §3 / §5 / §6（京东云） | **是** | iOS 应重点看 jailbreak；root 不直接迁移 |
| JD-019 | ism 设备 / 环境篡改标签 | C-017 §3 / §5 / §6（京东云） | **是** | 服务端风险标签，底层 evidence 未公开 |
| JD-020 | ish hook 标签 | C-017 §3 / §5 / §6（京东云） | **是** | Frida / Substrate 等覆盖范围未公开 |
| JD-021 | APP 多开 / 云手机 / 设备伪造 | C-017 §3 / §5 / §6（京东云） | **是** | 服务端或 SDK 聚合风险 |
| JD-022 | P7 信封加密 / 加密上报 | C-017 §4 / §5 / §6（京东云） | **是** | 链路完整性与抗篡改能力 |
| JD-023 | SDK 代码 / 资源加固 | C-017 §5 / §6（京东云） | **是** | 防破解、调试、逆向、篡改 |
| JD-024 | 业务反欺诈模型 | C-017 §5 / §7（京东云） | **是** | 机器注册、批量登录、营销作弊、支付风险、刷榜刷单等 |
| SM-012 | 网络连接状态 / 代理 / IP 异常 | C-018 §3 / §5 / §6（数美科技） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| SM-014 | 加速度计 / 陀螺仪 / 姿态 | C-018 §3 / §5 / §6（数美科技） | **是** | **双归位**：行为序列 + 风险与异常态 |
| SM-015 | 屏幕触摸 / View 级追踪 | C-018 §3 / §5 / §6（数美科技） | **是** | **双归位**：行为序列 + 风险与异常态 |
| SM-016 | 内存扫描 / MemDetector | C-018 §3 / §5 / §6（数美科技） | **是** | **双归位**：行为序列 + 风险与异常态 |
| SM-017 | 模拟器 / 云手机 / 设备农场 / 多开 | C-018 §3 / §5 / §6（数美科技） | **是** | 风险环境模型，iOS trigger 未公开 |
| SM-018 | 篡改设备 / 伪造设备标识 | C-018 §3 / §5 / §6（数美科技） | **是** | 多维交叉或服务端画像 |
| SM-019 | 高危软件 / 积分墙工具 | C-018 §3 / §5 / §6（数美科技） | **是** | iOS installed apps 路径受限，需追问 |
| SM-020 | 40+ 风险设备标签 | C-018 §5 / §6（数美科技） | **是** | 虚假设备、机器操控、设备可疑等服务端标签 |
| SM-024 | 异常使用习惯 / 机器操控 / 图挖掘 | C-018 §5 / §6（数美科技） | **是** | **双归位**：风险与异常态 + 服务端图谱与衍生能力 |
| DX-008 | 降级 token | C-019 §3 / §4 / §6（顶象） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态 |
| DX-009 | token 长度区分 | C-019 §3 / §6（顶象） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态 |
| DX-015 | 代理 IP / VPN | C-019 §3 / §5 / §6（顶象） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| DX-017 | 模拟器 / 虚拟机 / 刷机改机 | C-019 §3 / §5 / §6（顶象） | **是** | 移动端风险能力，iOS trigger 未公开 |
| DX-018 | Root / 越狱 | C-019 §3 / §5 / §6（顶象） | **是** | iOS 侧按越狱追问 |
| DX-019 | 劫持注入 / hook | C-019 §3 / §5 / §6（顶象） | **是** | 运行时攻击风险 |
| DX-020 | 31 项篡改检测 / 抗篡改身份模型 | C-019 §3 / §5 / §6（顶象） | **是** | 具体字段未公开 |
| DX-021 | Web 风险识别 | C-019 §5 / §6（顶象） | **是** | UA、cookie、分辨率、浏览器特征、颜色深度等 |
| DX-022 | 全量风险标签 | C-019 §5 / §6（顶象） | **是** | 控制台可见，公开材料未展开 |
| TD-012 | HTTP 代理 / VPN / IP Location | C-020 §3 / §5 / §6（同盾 / 小盾） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| TD-013 | Behavioral Activity Capturing | C-020 §5 / §6（同盾 / 小盾） | **是** | **双归位**：行为序列 + 风险与异常态 |
| TD-014 | root / jailbreak / debug | C-020 §3 / §5 / §6（同盾 / 小盾） | **是** | iOS 侧应按 jailbreak、debug 等价标签处理 |
| TD-015 | multiple / emulator | C-020 §3 / §5 / §6（同盾 / 小盾） | **是** | 多开 / 模拟器风险 |
| TD-016 | hook / xposed / magisk 等运行时攻击 | C-020 §3 / §5 / §6（同盾 / 小盾） | **是** | Android-only 名称不能直接迁移，iOS trigger 需追问 |
| TD-017 | device_info_tampered | C-020 §3 / §5 / §6（同盾 / 小盾） | **是** | 设备信息篡改风险 |
| TD-018 | 70+ / 100+ Pro 风险标签 | C-020 §5 / §6（同盾 / 小盾） | **是** | 商业版标签体系，明细未公开 |
| TD-019 | 3000+ 黑产工具 / 30+ 作弊框架 | C-020 §5 / §6（同盾 / 小盾） | **是** | Fraud Tools Detection 工具库 |
| TD-020 | Environment Risk Evaluation | C-020 §5 / §6（同盾 / 小盾） | **是** | 环境风险评估 |
| TD-021 | Device Risk Score | C-020 §5 / §6（同盾 / 小盾） | **是** | 服务端风险分 |
| TD-022 | OLLVM / VMP / 防抓包 / 防降级 | C-020 §4 / §6（同盾 / 小盾） | **是** | SDK 防护能力 |
| TD-023 | Replay attack / 二次打包 | C-020 §5 / §6（同盾 / 小盾） | **是** | 攻击和完整性风险 |
| YD-006 | 离线 base64 数据 | C-021 §3 / §4 / §6（网易易盾） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态 |
| YD-007 | 离线 token | C-021 §3 / §4 / §6（网易易盾） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态 |
| YD-013 | IP / 网络类型 / 网络代理 | C-021 §3 / §6（网易易盾） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| YD-015 | 模拟点击 / View 点击采集 | C-021 §3 / §6（网易易盾） | **是** | **双归位**：行为序列 + 风险与异常态 |
| YD-016 | 内存修改 / 进程调试 / 反调试 | C-021 §3 / §6（网易易盾） | **是** | 风控引擎运行时风险 |
| YD-017 | 修改器 / 加速器 / 多开器 / 脚本 | C-021 §3 / §6（网易易盾） | **是** | 反外挂风险标签 |
| YD-018 | 智能追回 / 设备信息篡改恢复 | C-021 §5 / §6（网易易盾） | **是** | 设备信息篡改后的连续性 |
| YD-019 | 在线检测 API / 风控引擎风险输出 | C-021 §5 / §6（网易易盾） | **是** | 服务端风险输出 |
| YD-020 | 白盒加密 / 白盒 HMAC | C-021 §5 / §6（网易易盾） | **是** | 安全通信能力 |
| YD-021 | 本地数据加解密 / gameKey | C-021 §5 / §6（网易易盾） | **是** | 游戏保护，不等同设备 ID |
| BD-006 | 本地默认 ztoken | C-022 §3 / §4 / §6（百度智能云） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态 |
| BD-012 | 设备风险标签 `t` | C-022 §3 / §5 / §6（百度智能云） | **是** | 示例含 jailbreak、inject、repkg |
| BD-013 | 业务风险等级 level 1-4 | C-022 §3 / §5 / §6（百度智能云） | **是** | 服务端决策 |
| BD-014 | 业务风险标签 | C-022 §3 / §5（百度智能云） | **是** | 业务保护 API 输出 |
| BD-015 | 安全环境扫描 host_call_env | C-022 §3 / §6（百度智能云） | **是** | 本地检测项未公开 |
| BD-016 | 注册 / 登录 / 活动 / 渠道场景风险 | C-022 §3 / §5（百度智能云） | **是** | 业务场景风控 |
| BD-017 | 反爬 / H5 风险 | C-022 §2 / §5（百度智能云） | **是** | JS-SDK 场景 |
| GG-009 | token 降级查询 | C-023 §3 / §4 / §6（极验） | **是** | **双归位**：SDK 自建 ID 与持久化 + 风险与异常态 |
| GG-014 | Wi-Fi / 定位 / IP / 网络制式 / 网络类型 | C-023 §3 / §6（极验） | **是** | **双归位**：网络与位置环境 + 风险与异常态；高敏环境信号 |
| GG-015 | 虚拟设备 / 自动化设备 / 定制设备 | C-023 §3 / §5 / §6（极验） | **是** | 设备三维复核模型 |
| GG-016 | Root / 越狱 / 虚拟定位 | C-023 §3 / §5 / §6（极验） | **是** | iOS trigger 未公开 |
| GG-017 | 摄像头劫持 / 屏幕共享 / 录屏 | C-023 §3 / §5 / §6（极验） | **是** | 风险工具覆盖项 |
| GG-018 | 签名 / 调试 / 篡改检测 | C-023 §3 / §5 / §6（极验） | **是** | 不安全运行环境 |
| GG-019 | 风险标签 / 风险状态 | C-023 §5 / §6（极验） | **是** | 服务端输出，全集未公开 |
| GG-020 | 手机号风险识别 | C-023 §5 / §6（极验） | **是** | 服务端画像，不是本地设备字段 |
| GG-021 | IP 风险识别 | C-023 §5 / §6（极验） | **是** | 服务端风险库 |
| GG-022 | 风险工具样本库 | C-023 §5 / §6（极验） | **是** | 改机工具、云手机、模拟器、虚拟定位工具 |
| FP-013 | Velocity per visitorID / linkedID / IP | C-003 §5（Fingerprint） | **是** | **双归位**：行为序列 + 风险与异常态 |
| FP-014 | High-Activity Device | C-003 §5（Fingerprint） | **是** | **双归位**：行为序列 + 风险与异常态 |
| FP-015 | Factory Reset Detection | C-003 §5 / §6（Fingerprint） | **是** | Smart Signal；算法未公开 |
| FP-016 | Frida Detection | C-003 §5 / §6（Fingerprint） | **是** | instrumentation 风险 |
| FP-017 | Geolocation Spoofing Detection | C-003 §5 / §6（Fingerprint） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| FP-018 | IP Geolocation / Proxy / IP Blocklist / VPN | C-003 §5（Fingerprint） | **是** | **双归位**：网络与位置环境 + 风险与异常态 |
| FP-019 | Jailbreak / Simulator / Developer Tools | C-003 §5 / §6（Fingerprint） | **是** | iOS 风险信号 |
| FP-020 | MitM / Tampered Request Detection | C-003 §5 / §6（Fingerprint） | **是** | 请求完整性和属性异常 |
| FP-022 | Suspect Score | C-003 §5（Fingerprint） | **是** | Smart Signals 聚合风险分 |

### 1.7 服务端图谱与衍生能力

| # | 维度 | 来源 | 风险信号？ | 备注 |
|---|------|------|----------|------|
| SE-023 | Email / phone / IP reputation | C-005 §5（SEON） | **是** | 业务 / 服务端画像，不是设备本地字段 |
| SE-024 | AI scoring / rules / network analysis | C-005 §5（SEON） | **是** | 服务端模型和规则引擎 |
| TM-021 | Digital Identity Network | C-006 §5（ThreatMetrix） | **是** | 跨设备、凭证、威胁、行为的服务端身份网络 |
| TM-022 | LexID / confidence / trust score | C-006 §5（ThreatMetrix） | **是** | 服务端身份置信度 / 信任评分 |
| TM-023 | Identity graph links | C-006 §5 / §6（ThreatMetrix） | **是** | device / credential / threat / behavior graph |
| TM-024 | Consortium / shared intelligence | C-006 §5（ThreatMetrix） | **是** | 跨客户 / 跨行业共享风险网络 |
| SI-019 | Events API account / payment / content / device graph | C-007 §5（Sift） | **是** | 服务端事件图谱 |
| SI-020 | Global Data Network | C-007 §5（Sift） | **是** | 服务端跨客户网络 |
| SU-021 | Fraud Network shared devices / related accounts | C-008 §5 / §6（Sumsub） | **是** | 服务端图谱 |
| SU-022 | Applicant / event / transaction device graph | C-008 §5（Sumsub） | **是** | 设备、申请人、事件和交易的服务端关联 |
| IN-021 | AI Browser ID embedding vector | C-009 §5（Incognia） | **是** | Web metadata 服务端模型，不是 Native iOS 字段 |
| IN-022 | Incognia service-side identity graph | C-009 §5（Incognia） | **是** | 设备、位置、地址、账号和行为融合图谱 |
| BU-010 | Service-side graph continuity | C-010 §4 / §5（Bureau） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力 |
| BU-021 | Device Graph / Graph Identity Network | C-010 §5（Bureau） | **是** | device-account-email-phone-IP linkage |
| BU-022 | Mule Score | C-010 §5（Bureau） | **是** | money mule 风险评分 |
| BU-023 | Verification history | C-010 §5（Bureau） | **是** | 跨 touchpoint 验证历史 |
| BU-024 | Decisions-not-data tokenized risk signals | C-010 §5（Bureau） | **是** | 服务端风险信号共享 |
| DV-021 | Identity Graph / Knowledge Graph | C-011 §5（DataVisor） | **是** | 设备、账号、邮箱、手机号、IP、交易图谱 |
| DV-022 | Cross-customer anonymized signals | C-011 §5 / §6（DataVisor） | **是** | 跨客户匿名信号 |
| DV-023 | Unsupervised ML / anomaly detection | C-011 §5（DataVisor） | **是** | 服务端模型 |
| DV-024 | Feature Store / cross-industry fraud pattern | C-011 §5（DataVisor） | **是** | 服务端特征和行业图谱 |
| FZ-019 | Feedzai IQ Score / IQ Signals | C-012 §5 / §6（Feedzai） | **是** | 联合学习 / collective intelligence 输出 |
| FZ-020 | Cross-account / cross-device onboarding graph | C-012 §5（Feedzai） | **是** | 服务端图谱 |
| FZ-021 | Device + phone + email link analysis | C-012 §5（Feedzai） | **是** | 服务端关联 |
| FZ-022 | RiskOps rules / workflows | C-012 §5（Feedzai） | **是** | 服务端规则与决策配置 |
| U2-018 | Fraud Consortium | C-013 §5 / §6（Unit21） | **是** | 80M+ adults shared intelligence |
| U2-019 | Identity Graphing / Cross-Entity Link Analysis | C-013 §5（Unit21） | **是** | 服务端实体图谱 |
| U2-020 | Real-Time Monitoring sub-250ms | C-013 §5 / §6（Unit21） | **是** | 服务端链路 |
| U2-021 | AI Agent for Detection / Investigation | C-013 §5（Unit21） | **是** | 服务端 AI |
| U2-022 | Customer Risk Rating / Continuous Compliance Monitoring | C-013 §5（Unit21） | **是** | 服务端画像和合规监控 |
| AL-009 | 增强版设备唯一 ID / Data.extend | C-015 §4 / §5 / §6（阿里云） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力 |
| AL-022 | SLS 日志投递 / RequestId / 风险识别 API 链路 | C-015 §5 / §6（阿里云） | **是** | 服务端日志、追踪和风控引擎链路，不是本地设备 ID |
| TC-006 | Openid 设备匿名标识 | C-016 §3 / §4 / §5（腾讯云 T-Sec） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力 |
| TC-007 | Unionid / 图灵盾统一 ID | C-016 §3 / §4 / §5（腾讯云 T-Sec） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力 |
| TC-016 | 账号 / 设备 / IP 关联行为 | C-016 §5 / §6（腾讯云 T-Sec） | **是** | **双归位**：行为序列 + 服务端图谱与衍生能力 |
| TC-026 | 账号 / 设备 / IP 关联网络 | C-016 §5 / §6（腾讯云 T-Sec） | **是** | 社群发现、关联网络和风险聚类 |
| TC-027 | 设备威胁态势感知 / 无监督聚类 | C-016 §5 / §6（腾讯云 T-Sec） | **是** | 服务端模型能力 |
| TC-028 | 腾讯生态 OpenId / 账号输入关联 | C-016 §2 / §5 / §6（腾讯云 T-Sec） | **是** | 业务侧输入参与服务端画像 |
| TC-029 | Server API trace / RiskCheckTimestamp | C-016 §3 / §5（腾讯云 T-Sec） | **是** | 检测时间和服务端链路，不是本地设备 ID |
| TC-030 | 场景化风控模型 | C-016 §5 / §6（腾讯云 T-Sec） | **是** | login / register 等场景模型和服务端决策 |
| JD-005 | 京东云 eid | C-017 §3 / §4 / §5（京东云） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力 |
| JD-008 | vttok / strategy token | C-017 §4 / §5（京东云） | **是** | 策略下发与服务端采集控制 |
| JD-024 | 业务反欺诈模型 | C-017 §5 / §7（京东云） | **是** | **双归位**：风险与异常态 + 服务端图谱与衍生能力 |
| SM-005 | boxId 加密设备标识 | C-018 §2 / §3 / §4（数美科技） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力 |
| SM-023 | 11 亿+ 设备样本库 / 全球设备风险库 | C-018 §5 / §6（数美科技） | **是** | 服务端样本库和风险库匹配 |
| SM-024 | 异常使用习惯 / 机器操控 / 图挖掘 | C-018 §5 / §6（数美科技） | **是** | **双归位**：风险与异常态 + 服务端图谱与衍生能力 |
| DX-005 | hardId 服务端设备 ID | C-019 §3 / §4 / §5（顶象） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力 |
| DX-016 | 设备画像近期行为 / 访问趋势 | C-019 §5 / §6（顶象） | **是** | **双归位**：行为序列 + 服务端图谱与衍生能力 |
| TD-005 | 同盾 device_id | C-020 §3 / §4 / §5（同盾 / 小盾） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力 |
| TD-007 | 服务端第二指纹确认 | C-020 §3 / §4 / §5（同盾 / 小盾） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力 |
| TD-024 | TrustDecision / 全球风险联防联控 | C-020 §5 / §6（同盾 / 小盾） | **是** | 服务端决策引擎和跨行业风险联防 |
| YD-009 | DNA 唯一设备指纹 | C-021 §3 / §5 / §6（网易易盾） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力 |
| YD-022 | 设备信用体系 | C-021 §5 / §6（网易易盾） | **是** | 长期画像和信用评分 |
| YD-023 | 风险画像 | C-021 §5 / §6（网易易盾） | **是** | 账号 / IP / 手机号黑灰产标签 |
| YD-024 | 私有化 / 海外部署 / 配置下发链路 | C-021 §2 / §4（网易易盾） | **是** | 服务端配置和部署策略 |
| BD-008 | `x` 设备指纹 ID | C-022 §3 / §4 / §5（百度智能云） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力 |
| BD-018 | 20 亿+ 设备库 / 8 亿+ 活跃设备 | C-022 §5 / §6（百度智能云） | **是** | 服务端设备库匹配 |
| BD-019 | 风险设备画像 | C-022 §5 / §6（百度智能云） | **是** | 多维设备风险画像 |
| BD-020 | 威胁情报分析 | C-022 §5 / §6（百度智能云） | **是** | 黑产资源、攻击手段、网络风险 |
| BD-021 | 实时 + 离线风控 / 无监督模型 | C-022 §5 / §6（百度智能云） | **是** | 全链路关联分析 |
| BD-022 | bce-auth-v1 / Server SDK 链路 | C-022 §2 / §5 / §6（百度智能云） | **是** | 服务端认证和调用链路 |
| GG-006 | respondedGeeToken | C-023 §3 / §4 / §7（极验） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力 |
| GG-008 | 设备唯一编号 | C-023 §3 / §4 / §5（极验） | **是** | **双归位**：SDK 自建 ID 与持久化 + 服务端图谱与衍生能力 |
| GG-023 | 设备关系图谱 | C-023 §5 / §6（极验） | **是** | 设备、账号、手机号、IP、行为关联 |
| GG-024 | 设备三维复核模型 / 决策引擎 | C-023 §5 / §6（极验） | **是** | 服务端模型和业务规则编排 |
| FP-012 | linkedId 客户侧关联 ID | C-003 §5（Fingerprint） | 否 | 业务关联键，不是设备 ID |
| FP-023 | 服务端处理 visitorId / requestId 取数 | C-003 §5 / §7（Fingerprint） | 否 | 服务端可信结果链路 |
| FP-024 | 服务端 fuzzy matching / collision 缺口 | C-003 §6（Fingerprint） | 否 | 算法和权重未公开 |

---

## 2. 主清单总览（当前版 v0.20）

| 分组 | 条数 | 风险信号 | 双归位 |
|------|------|---------|--------|
| 系统 / Apple 标识 | 80 | 0 | 0 |
| SDK 自建 ID 与持久化 | 117 | 33 | 33 |
| 设备与环境属性 | 33 | 9 | 4 |
| 网络与位置环境 | 39 | 33 | 32 |
| 行为序列 | 41 | 40 | 40 |
| 风险与异常态 | 194 | 194 | 89 |
| 服务端图谱与衍生能力 | 68 | 65 | 18 |
| **合计** | **462** | **284** | **114** |

注：合计按独立编号去重；双归位条目不重复计数。

---

## 3. 编号约定

- **FP-NNN**：Fingerprint（C-003）反推出的 iOS 计算维度。
- **SE-NNN**：SEON（C-005）反推出的 iOS 计算维度。
- **TM-NNN**：ThreatMetrix / LexisNexis Risk Solutions（C-006）反推出的 iOS 计算维度。
- **SI-NNN**：Sift（C-007）反推出的 iOS 计算维度。
- **SU-NNN**：Sumsub（C-008）反推出的 iOS 计算维度。
- **IN-NNN**：Incognia（C-009）反推出的 iOS 计算维度。
- **BU-NNN**：Bureau（C-010）反推出的 iOS 计算维度。
- **DV-NNN**：DataVisor（C-011）反推出的 iOS 计算维度。
- **FZ-NNN**：Feedzai（C-012）反推出的 iOS 计算维度。
- **U2-NNN**：Unit21（C-013）反推出的 iOS 计算维度。
- **TS-NNN**：Talsec（C-014）反推出的 iOS 计算维度。
- **AL-NNN**：阿里云风险识别 / 设备风险 SDK（C-015）反推出的 iOS 计算维度。
- **TC-NNN**：腾讯云 T-Sec 设备安全（C-016）反推出的 iOS 计算维度。
- **JD-NNN**：京东云设备指纹（C-017）反推出的 iOS 计算维度。
- **SM-NNN**：数美科技设备指纹（C-018）反推出的 iOS 计算维度。
- **DX-NNN**：顶象设备指纹（C-019）反推出的 iOS 计算维度。
- **TD-NNN**：同盾科技 / 小盾设备指纹（C-020）反推出的 iOS 计算维度。
- **YD-NNN**：网易易盾智能风控（C-021）反推出的 iOS 计算维度。
- **BD-NNN**：百度智能云风控 / 昊天镜（C-022）反推出的 iOS 计算维度。
- **GG-NNN**：极验设备验 / GeeGuard（C-023）反推出的 iOS 计算维度。
- 后续厂商按任务执行顺序分配厂商前缀；前缀必须避免与既有编号冲突，并在本节追加说明。

---

## 4. 条数核对

| 厂商 | 编号前缀 | 新增编号 | 双归位贡献 |
|------|---------|---------|-----------|
| C-003 Fingerprint | `FP-NNN` | 24 | 4 |
| C-005 SEON | `SE-NNN` | 24 | 4 |
| C-006 ThreatMetrix / LexisNexis Risk Solutions | `TM-NNN` | 24 | 5 |
| C-007 Sift | `SI-NNN` | 20 | 4 |
| C-008 Sumsub | `SU-NNN` | 22 | 5 |
| C-009 Incognia | `IN-NNN` | 22 | 11 |
| C-010 Bureau | `BU-NNN` | 24 | 8 |
| C-011 DataVisor | `DV-NNN` | 24 | 6 |
| C-012 Feedzai | `FZ-NNN` | 22 | 6 |
| C-013 Unit21 | `U2-NNN` | 22 | 7 |
| C-014 Talsec | `TS-NNN` | 18 | 4 |
| C-015 阿里云风险识别 / 设备风险 SDK | `AL-NNN` | 22 | 4 |
| C-016 腾讯云 T-Sec 设备安全 | `TC-NNN` | 30 | 10 |
| C-017 京东云设备指纹 | `JD-NNN` | 24 | 6 |
| C-018 数美科技设备指纹 | `SM-NNN` | 24 | 6 |
| C-019 顶象设备指纹 | `DX-NNN` | 22 | 5 |
| C-020 同盾科技 / 小盾设备指纹 | `TD-NNN` | 24 | 5 |
| C-021 网易易盾智能风控 | `YD-NNN` | 24 | 5 |
| C-022 百度智能云风控 / 昊天镜 | `BD-NNN` | 22 | 4 |
| C-023 极验设备验 / GeeGuard | `GG-NNN` | 24 | 5 |
| **合计** | — | **462** | **114** |
