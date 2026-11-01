# Talsec-Dimensions · GLNT-3 iOS 维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-29 13:21:07
>
> 视角：Talsec iOS 厂商 LENS（research）
> 来源：TASK-014
> 文件命名口径：厂商名 + `Dimensions`，参考 GLNT-4 的 `Talsec-Dimensions.md`
> 当前口径：参考 Android 厂商调研方式；iOS 侧无实现基线，因此按公开资料全量整理 Talsec 在 iOS 上实际采集、声明采集或可反推出的稳定硬件标识、设备标识、SDK 自建 ID、持久化 token、服务端衍生 ID 和公开资料缺口。Talsec 的核心是 RASP / AppSec，不是传统 device fingerprinting；device binding / app data migration 只作为稳定性线索。
> 调研基线 iOS 版本：iOS 17.5

---

## 0. 调研口径

本条目只依据 Talsec 公开资料、`.context/GLNT-4/Talsec-Dimensions.md` 和 GLNT-3 既定 iOS 口径整理。Android 侧 Talsec 维度只作为跨端对照线索，不作为 iOS 已采集事实。

公开来源：

- Talsec docs / freeRASP iOS：`https://docs.talsec.app/freerasp/integration/ios`
- Talsec freeRASP GitHub：`https://github.com/talsec/Free-RASP-iOS`
- Talsec threat callbacks / covered threats 文档
- Talsec App Data Migration / Device Binding 公开说明
- Talsec RASP+ / AppiCrypt / Secure Storage / Dynamic TLS Pinning 产品材料
- Talsec Privacy Policy：`https://talsec.app/privacy-policy`

来源分层：

- **实际采集**：freeRASP iOS SDK 公开集成、threat callbacks、jailbreak / debugger / tamper / simulator / passcode / screen capture 等检测。
- **声明采集**：RASP+、AppiCrypt、App Data Migration / Device Binding、Portal telemetry、Device Risk Scoring。
- **可反推**：由 device binding / app data migration、app integrity cryptogram、secure storage 推导出的安装 / 设备绑定线索。

非公开 = 仅作线索、不作结论。Talsec 没有公开 iOS device binding 的底层材料、Keychain / Secure Enclave 使用细节、AppiCrypt cryptogram 内容和完整检测 attribute。

---

## 1. 产品定位

Talsec 是 Mobile App Security / RASP 厂商，关注运行时威胁、App 完整性、反调试、越狱、篡改、截屏录屏、网络风险和服务端完整性证明。iOS 侧的“稳定 ID”不是主产品目标；更重要的是设备 / App 安全状态和绑定异常。

iOS 侧关键结论：

- freeRASP iOS 公开存在，支持 iOS SDK 集成和 threat callbacks。
- iOS 明确覆盖 jailbreak、debugger、runtime tamper、simulator、screen capture / recording、passcode / device lock、unofficial store / app integrity 等风险。
- Talsec 有 App Data Migration / Device Binding 语境，用于检测或保护应用数据迁移和绑定异常。
- AppiCrypt / RASP+ / Portal 属于服务端或商业保护能力，公开资料不展开底层字段。
- 公开资料未证明 Talsec iOS SDK 明确使用 IDFV、IDFA、Keychain、DeviceCheck、App Attest 或 APNs token 作为设备 ID。

---

## 2. iOS / Apple 接入方式

| 接入形态 | iOS 侧判断 | 来源分层 | 备注 |
|---|---|---|---|
| freeRASP iOS SDK | 原生 iOS RASP 检测 | 实际采集 | GitHub / docs 公开 |
| Threat callbacks | jailbreak、debugger、tamper、simulator、passcode、screen capture 等 | 实际采集 | 风险事件，不是设备 ID |
| App Data Migration / Device Binding | 设备 / 应用数据绑定异常线索 | 声明采集 | 底层材料未公开 |
| RASP+ / AppiCrypt | 商业保护、服务端 cryptogram | 声明采集 | 服务端验证 |
| Secure Storage / Secret Vault | 密钥保护能力 | 声明采集 | 是否用于设备 ID 未公开 |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：jailbreak、screen capture / recording、passcode / device lock、simulator、App Data Migration。
- iOS 缺失：Android root、ADB、developer mode、system VPN 等需找 iOS 等价，不能直接迁移。
- Android 等价物：tamper、debugger、hook、emulator/simulator、MITM、device binding、AppiCrypt 是跨端概念。

---

## 3. iOS 稳定 ID 与硬件标识维度

| 维度 | iOS 侧判断 | 来源分层 | 稳定性边界 |
|---|---|---|---|
| App Data Migration / Device Binding | 设备 / 应用数据绑定异常线索 | 声明采集 | 不是通用设备 ID；底层材料未公开 |
| External user correlation | 可配置外部用户 / 业务标识 | 可反推 | 业务关联键，不是设备 ID |
| App integrity continuity | 包名 / bundle / 签名 / 完整性持续符合预期 | 实际采集 / 声明采集 | 安全状态，不是设备 ID |
| AppiCrypt integrity cryptogram | 服务端完整性证明 | 声明采集 | cryptogram 内容未公开 |
| IDFV | 未公开 | 公开缺口 | 若使用，仅 vendor scope |
| IDFA / ATT | 未公开 | 公开缺口 | 不能假设 |
| Keychain / Secure Storage | Secure Storage 是产品能力，但是否用于设备 ID 未公开 | 公开缺口 | 不能假设跨重装 |
| DeviceCheck / App Attest | 未公开 | 公开缺口 | 不能写成事实 |
| APNs token | 未公开 | 公开缺口 | token 可轮换 |

当前结论：Talsec iOS 侧没有公开稳定设备 ID 主路径；最接近稳定性的是 App Data Migration / Device Binding 和 AppiCrypt，但都属于安全绑定 / 完整性证明，不是通用硬件 ID。

---

## 4. 持久化路径与 SDK 自建 ID

| 路径 / ID | iOS 侧判断 | 来源分层 | 备注 |
|---|---|---|---|
| Device Binding / App Data Migration state | 绑定 / 迁移异常状态 | 声明采集 | 是否跨重装、换机、恢复备份未公开 |
| App integrity cryptogram | 服务端校验 token | 声明采集 | 一次或短期证明，不是稳定 ID |
| Secure Storage / Secret Vault | 密钥保护能力 | 声明采集 | 不等同设备 ID |
| Keychain | 未公开 | 公开缺口 | 不能假设 |
| UserDefaults / App Group | 未公开 | 公开缺口 | 不能写成事实 |

iOS 独有 / iOS 缺失 / Android 等价物：

- iOS 独有：App Data Migration 与 iOS 备份 / 迁移生态相关，值得单独保留。
- iOS 缺失：Android ADB / developer mode / system VPN 不直接迁移。
- Android 等价物：Device Binding、AppiCrypt、RASP callbacks 是跨端概念。

---

## 5. 服务端衍生 ID 与风险能力

| 能力 | iOS 侧判断 | 来源分层 | 是否可作为本地采集字段 |
|---|---|---|---|
| Jailbreak | iOS 本地风险检测 | 实际采集 | 风险信号 |
| Debugger attached | iOS 本地风险检测 | 实际采集 | 风险信号 |
| Runtime tamper / hook / Frida | iOS 本地风险检测 | 实际采集 / 声明采集 | 具体覆盖范围未公开 |
| Simulator | iOS 本地风险检测 | 实际采集 | 风险信号 |
| Screen capture / recording | iOS 本地风险检测 | 实际采集 | 风险信号 |
| Passcode / device lock absent | iOS 设备安全状态 | 实际采集 | 风险信号 |
| Untrusted source / repackaging / app integrity | App 完整性 | 实际采集 / 声明采集 | 风险信号 |
| MITM / unsecure Wi-Fi / VPN | 网络风险 | 声明采集 | iOS 细节未公开 |
| AppiCrypt / Portal telemetry / Device Risk Scoring | 服务端保护与统计 | 声明采集 | 服务端输出 |

服务端能力边界：Talsec 的维度应进入统一主清单的风险与完整性分组，不能写成设备稳定 ID 主路径。

---

## 6. 公开资料缺口

非公开 = 仅作线索、不作结论。

| # | 缺口 | 影响 |
|---|---|---|
| Q-1 | Device Binding / App Data Migration 底层材料 | 决定是否涉及 Keychain、Secure Enclave、App Group 或服务端 token |
| Q-2 | Device Binding 生命周期 | 决定备份恢复、换机、重装、清数据边界 |
| Q-3 | IDFV / IDFA / Keychain / DeviceCheck 是否使用 | 决定 Apple 标识和持久化路径 |
| Q-4 | AppiCrypt cryptogram 内容 | 决定服务端证明是否含设备环境摘要 |
| Q-5 | Hook / Frida / runtime tamper 覆盖范围 | 决定 iOS threat callbacks 可解释性 |
| Q-6 | Screen capture / recording 可见性边界 | 决定投屏、系统录屏、后台、分屏等场景 |
| Q-7 | MITM / VPN / unsecure Wi-Fi iOS 检测方式 | 决定本地网络状态与服务端判断边界 |
| Q-8 | Portal telemetry 字段 | 决定 Talsec 是否上送设备型号、OS、区域、风险事件时间 |

---

## 7. 当前结论

Talsec iOS 调研结论：

- **可确认**：freeRASP iOS 明确支持 jailbreak、debugger、tamper、simulator、screen capture / recording、passcode / device lock 等本地风险检测。
- **可进入统一 Dimensions**：App Data Migration / Device Binding、AppiCrypt、Secure Storage、RASP threat callbacks、screen capture / recording、App integrity、network risk。
- **不可确认**：IDFV、IDFA、Keychain、DeviceCheck、App Attest、APNs token 是否参与设备身份；Device Binding 底层材料。
- **关键边界**：Talsec 是 RASP / AppSec 厂商，不应被写成传统稳定设备 ID 供应商。

Talsec 可进入 iOS 统一主清单，但应标注为“风险与完整性信号强，稳定 ID 主路径未公开”。
