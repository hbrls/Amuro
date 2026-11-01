# WORKSHOP-001 · GLNT-3 iOS 硬件标识 / 稳定 ID 维度调研 checkpoint

> updated_by: Codex - GPT-5
> updated_at: 2026-06-30 11:56:08
>
> Vision Id: GLNT-3
> 来源：Index.md、已整合的 C-001 / C-002 前置决策、C-003 至 C-024、iOS-Compute-Dimensions.md
> 调研基线 iOS 版本：iOS 17.5

---

## 0. Checkpoint 结论

GLNT-3 可以收束为阶段性 checkpoint。

本轮目标是按 Android 厂商调研方法，对 iOS 侧指定厂商全量整理公开可确认、声明采集或可反推出的硬件标识、稳定设备标识、SDK 自建 ID、持久化 token、服务端衍生 ID 与底层采集维度。当前 20 家目标厂商均已完成单厂商 iOS 输出，并已全部进入统一主清单 `.context/GLNT-3/iOS-Compute-Dimensions.md`。

当前主清单版本为 v0.20，合计 462 个独立编号、284 个风险信号、114 个双归位条目。现存缺口均属于公开资料不足、服务端模型非公开、SDK 原始字段未公开或跨端边界需后续深挖，不阻塞本阶段 checkpoint。

---

## 1. 输入与产物范围

本次 checkpoint 读取并整合当前 Vision 目录 `.context/GLNT-3/` 下阶段性文件；原 C-001 / C-002 的信息已并入本文第 2、3、4 节，不再作为独立历史文件保留：

| 文件 | 角色 |
| --- | --- |
| Index.md | GLNT-3 调研目标、iOS 17.5 基线、来源分层、禁止项、单厂商模板和主清单维护规则 |
| 原 C-001 内容 | 已整合为目标澄清、目标边界、核心问题、关键假设、未决问题和回写口径 |
| 原 C-002 内容 | 已整合为启动条件、第一家厂商选择依据、LENS 选择和后续派生路线 |
| C-003.md | Fingerprint iOS 单厂商条目 |
| C-004.md | Fingerprint 完成后的 pilot 收束，决定一次性推进剩余 19 家 |
| C-005.md 至 C-023.md | 其余 19 家 iOS 单厂商条目 |
| C-024.md | 统一主清单收束与 checkpoint 判定 |
| iOS-Compute-Dimensions.md | GLNT-3 iOS 计算维度全集主清单 v0.20 |

本 checkpoint 只新增当前文件，不回写、不重写任何已有 `C-*`、`Index.md` 或 `iOS-Compute-Dimensions.md`。

---

## 2. 目标与边界

### 2.1 已确认目标

GLNT-3 的目标是复刻 Android GLNT-4 的厂商调研方法，在 iOS 侧按同一厂商范围全量梳理稳定 ID 与计算维度。由于 iOS 当前没有 `DeviceInfoRepository` 这类实现基线，本轮不做字段扣减，不预设已实现字段，按公开资料全量整理。

全量口径包括 iOS 上实际采集、声明采集或可反推出的硬件标识、稳定设备标识、SDK 自建 ID、持久化 token、服务端衍生 ID 及其底层采集维度。厂商清单与 Android GLNT-4 一一对应，不增不减，顺序沿用 Android，便于横向对照。

单厂商条目必须回答以下问题：

1. 该厂商 iOS SDK 在 iOS 14+ 实际采集了哪些稳定标识，区分 Apple 官方标识、SDK 自建 ID、持久化路径和服务端衍生 ID。
2. 哪些维度跨重装稳定，哪些属于 vendor / install scope，哪些易变。
3. 是否使用 IDFA，IDFA 在广告归因、受众、风控或 DeviceId 主路径中的角色是什么。
4. 是否声明或可反推使用服务端设备图谱、账号图谱、风险画像或黑产样本库，服务端衍生 ID 的前端入参是什么。
5. device fingerprint / device intelligence / risk signals 表述背后能拆解到哪些底层稳定维度。
6. 公开资料找不到或仅有间接线索的维度如何标注缺口，避免写成已实现事实。
7. App Tracking Transparency、Privacy Manifest、Required Reason API 等 iOS 合规姿态是否影响可采集性。
8. Android 端稳定维度在 iOS 是否有等价物，等价物的稳定性是否一致。

### 2.2 调研基线

本轮统一使用 iOS 17.5 作为调研基线。该基线覆盖 IDFA / ATT 成熟约束、Privacy Manifest、Required Reason API 等平台限制，不影响记录厂商 SDK 对更低 iOS 版本的官方支持范围。

### 2.3 明确不做

本轮不再延续旧的 WKWebView 指纹可行性、概率碰撞、identity cluster、uncertain 匹配或 99% 聚类方案主线；这些只作为历史背景，不作为 GLNT-3 厂商调研目标。

本轮也不把 Android-only 或 HarmonyOS-only 字段迁移成 iOS 事实。IMEI、IMSI、OAID、Android ID、GSF ID、Widevine、ROM、Android app list、Magisk、Xposed、ADB 等只可作为跨端追问线索。

本轮不覆盖代码改动、SDK 接入、隐私政策文案撰写、`FingerprintObservation` / `DeviceProfile` / `DeviceMatch` 模型设计，也不研究任何从设备指纹 hash 还原 DeviceId 的方案。

### 2.4 前置假设与未决问题

本 checkpoint 继承并收束以下前置假设：

- GLNT-4 的厂商清单适合作为 iOS 侧参照系；若该前提不成立，强行一一对应会产生为对齐而对齐的伪条目。
- 公开资料足以支撑全量口径；资料不足时只能停留在声明采集或可反推层级，并必须标注公开资料缺口。
- Apple 平台能力在本轮基线内相对稳定，IDFV、DeviceCheck、App Attest、Keychain、App Group、NSUserDefaults、Privacy Manifest 和 Required Reason API 可以作为统一分析对象。
- iOS SDK 与 Android SDK 在维度选型上具有可比性，但可比不等于相同。
- device fingerprint / device intelligence / risk signals 的厂商表述应尽量拆解到底层稳定维度；无法拆解时只能保留为声明能力。
- iOS-only 字段应保留并归类，不与 Android 字段强行合并。

前置未决问题已在本 checkpoint 中收束：

- 完成度标准：单厂商条目采用 0-7 节模板，并强制区分实际采集、声明采集、可反推和公开资料缺口。
- 跨端字段对照表承载位置：先放在单厂商条目和主清单中，不另建独立对照文件。
- iOS 调研基线版本：采用 iOS 17.5。
- 服务端衍生 ID 非公开边界：非公开 = 仅作线索、不作结论。

---

## 3. 来源分层与证据规则

GLNT-3 单厂商条目统一采用三类来源：

| 来源类型 | 判定标准 | 写法约束 |
| --- | --- | --- |
| 实际采集 | 官方 SDK 文档、SDK 仓库、quickstart、API reference、changelog 或 privacy manifest 明确说明 SDK 会采集、返回或支持字段 / 信号 | 可写入具体维度，但仍需说明稳定性和平台边界 |
| 声明采集 | 官方材料声明具备 device intelligence、device fingerprint、Smart Signal、raw attributes、risk labels 等能力，但未公开完整底层字段 | 只能写成声明能力，不得反写成具体已确认本地字段 |
| 可反推 | 由官方返回字段、稳定性场景、版本边界、跨端对照或公开样例合理推导 | 必须标注推导来源，不能当作已实现事实 |

全局边界为：非公开 = 仅作线索、不作结论。服务端聚合 ID、设备图谱、风险画像、黑产样本库、模型权重、SDK 原始字段全集和持久化算法在未公开时，不得升级为 iOS 已确认采集项。

原目标澄清中的回写建议已在本轮口径中落地：调研基线明确为 iOS 17.5；来源分层明确为实际采集、声明采集、可反推；服务端衍生 ID 的非公开部分仅作线索、不作结论。

---

## 4. 厂商覆盖

20 家目标厂商已全部完成单厂商输出，并全部进入主清单。

首家厂商选择 Fingerprint（GLNT-4 V-001）的原因是公开资料最完整、结构最简单、跨端可比性高，且其公开文档、SDK、Raw Device Attributes、Smart Signals、Server API 和 Webhooks 足以覆盖实际采集、声明采集、可反推三类证据。Talsec、SEON、Sift、Sumsub、Bureau、Incognia 等厂商作为后续对象处理，原因分别是 iOS 公开资料弱、产品矩阵更复杂或适合作为第二梯队。

首轮 LENS 选择 research LENS。scope LENS 不再适用，因为 Index.md 已给出边界；evidence LENS 不适用，因为本轮不是基于失败现象取证，而是基于公开资料做稳定 ID 维度梳理。由于 research LENS 当时仍是占位骨架，第一条厂商调研按 Index.md 第 6 节单厂商模板临时承担 Research 视角产出。

| C 文件 | 厂商 | 主清单前缀 | 主清单编号数 | 结论 |
| --- | --- | --- | --- | --- |
| C-003 | Fingerprint | FP | 24 | 已进入 |
| C-005 | SEON | SE | 24 | 已进入 |
| C-006 | ThreatMetrix / LexisNexis Risk Solutions | TM | 24 | 已进入 |
| C-007 | Sift | SI | 20 | 已进入 |
| C-008 | Sumsub | SU | 22 | 已进入 |
| C-009 | Incognia | IN | 22 | 已进入 |
| C-010 | Bureau | BU | 24 | 已进入 |
| C-011 | DataVisor | DV | 24 | 已进入 |
| C-012 | Feedzai | FZ | 22 | 已进入 |
| C-013 | Unit21 | U2 | 22 | 已进入 |
| C-014 | Talsec | TS | 18 | 已进入 |
| C-015 | 阿里云风险识别 / 设备风险 SDK | AL | 22 | 已进入 |
| C-016 | 腾讯云 T-Sec 设备安全 | TC | 30 | 已进入 |
| C-017 | 京东云设备指纹 | JD | 24 | 已进入 |
| C-018 | 数美科技设备指纹 | SM | 24 | 已进入 |
| C-019 | 顶象设备指纹 | DX | 22 | 已进入 |
| C-020 | 同盾科技 / 小盾设备指纹 | TD | 24 | 已进入 |
| C-021 | 网易易盾智能风控 | YD | 24 | 已进入 |
| C-022 | 百度智能云风控 / 昊天镜 | BD | 22 | 已进入 |
| C-023 | 极验设备验 / GeeGuard | GG | 24 | 已进入 |

覆盖结论：厂商范围与 GLNT-4 对齐，不增不减；C-004 为 pilot 记录，不计入 20 家厂商覆盖数。

---

## 5. 主清单状态

统一主清单为 `.context/GLNT-3/iOS-Compute-Dimensions.md`，当前版本 v0.20。

| 分组 | 条数 | 风险信号 | 双归位 |
| --- | ---: | ---: | ---: |
| 系统 / Apple 标识 | 80 | 0 | 0 |
| SDK 自建 ID 与持久化 | 117 | 33 | 33 |
| 设备与环境属性 | 33 | 9 | 4 |
| 网络与位置环境 | 39 | 33 | 32 |
| 行为序列 | 41 | 40 | 40 |
| 风险与异常态 | 194 | 194 | 89 |
| 服务端图谱与衍生能力 | 68 | 65 | 18 |
| 合计 | 462 | 284 | 114 |

主清单已具备统一编号、来源引用、风险信号标注、双归位标注、分组总览和厂商条数核对。双归位条目按独立编号去重，不在合计中重复计数。

---

## 6. 厂商结论矩阵

| 厂商 | iOS 主身份 / 主引用 | 风险与衍生能力 | 关键边界 |
| --- | --- | --- | --- |
| Fingerprint | IDFV 派生 visitorId、requestId | Smart Signals、velocity、IP / VPN、jailbreak、simulator、tamper | 官方明确 iOS visitorId 不使用 fingerprinting techniques；Keychain 是开源库强线索，商业 SDK 细节未全公开 |
| SEON | fingerprint session、device hash、True Device ID | Fraud API、proxy / VPN、behavioral、remote access、device farm | IDFV / IDFA / Keychain 未公开 |
| ThreatMetrix | TMXProfiling sessionId、collectionReference、Strong ID 声明 | Digital Identity Network、Strong ID、risk decision、bot / RAT | collected attributes 与 Strong ID 客户端材料未公开 |
| Sift | device properties、user ID binding、event stream | Score API、workflow、Global Data Network | installation ID 与 Apple 标识未公开 |
| Sumsub | stable unique device identifier、sessionId、device fingerprint 声明 | Device Intelligence、Advanced IP、Behavior Monitoring、Fraud Network | 跨重装声明强，但生成材料和持久化路径未公开 |
| Incognia | Incognia ID、reinstall-proof / factory-reset-proof identity 声明 | location intelligence、risk environment、multi-accounting | 核心是位置 + 服务端融合，不是公开本地硬件 ID |
| Bureau | persistent Device ID、Device / Browser Fingerprint 声明 | RASP、Behavioral Biometrics、Device Graph、Mule Score | persistence 数字和 iOS 底层材料未公开 |
| DataVisor | Unique Device ID、100+ data fields 声明 | edge computing、SDK protection、Identity Graph、real-time scoring | iOS 字段 schema 未公开 |
| Feedzai | device fingerprint、usage across sessions、behavioral baseline | Behavioral Biometrics、RAT、SDK integrity、IQ Score | iOS SDK 原始字段和 device fingerprint 组成未公开 |
| Unit21 | encrypted device signals、Device Risk Score | Fraud Consortium、Identity Graph、Rule Builder | 更偏服务端 AML / 风控工作流，本地稳定 ID 未公开 |
| Talsec | Device Binding / App Data Migration 声明、AppiCrypt | jailbreak、debugger、tamper、simulator、screen capture、passcode | RASP / AppSec 厂商，不是传统设备 ID 供应商 |
| 阿里云 | deviceToken、getSession、bizId | 设备风险标签、增强版设备唯一 ID、设备牧场、token 完整性 | IDFA 仅可选增强；iOS token 生命周期和底层字段未公开 |
| 腾讯云 T-Sec | DeviceToken、Openid、Unionid | RiskInfos、SceneRiskInfos、越狱、HOOK、模拟器、屏幕共享、系统重置 | 风险标签清晰，底层 evidence 与 DeviceToken 生命周期未公开 |
| 京东云 | eid、tk、vttok、bizId / pin / tenantId | 策略下发、验证码联动、ise / isj / ish 等风险标签 | eid 是服务端聚合 ID；iOS 采集策略覆盖待确认 |
| 数美科技 | boxId、boxData | 100+ 原始维度、40+ 风险标签、样本库、微行为、图挖掘 | boxId 是加密标识，不能还原成明文 Apple 硬件 ID |
| 顶象 | hardId、token、降级 token | 设备画像、31 项篡改检测、模拟器、越狱、VPN | hardId 只在服务端；token 是通讯产物 |
| 同盾 / 小盾 | device_id、第一 / 第二指纹线索 | Pro 风险标签、黑产工具、TrustDecision | Android 开源字段不能迁移，iOS device_id 生命周期未公开 |
| 网易易盾 | 易盾 token、离线 token、DNA 唯一设备指纹 | 风控引擎、模拟点击、安全通信、风险画像 | DNA 输入字段和 iOS 原始字段表未公开 |
| 百度 / 昊天镜 | ztoken、云端 ztoken、本地默认 ztoken、x 设备指纹 ID | 设备风险标签、业务风险等级、设备库、威胁情报 | ztoken 是请求凭证且公开口径禁止缓存；x 是服务端 ID |
| 极验 / GeeGuard | GeeToken、respondedGeeToken、设备唯一编号 | 300+ 弱特征、设备关系图谱、三维复核、风险工具库 | token 与设备编号生命周期、弱特征全集未公开 |

---

## 7. 横向规律

### 7.1 Apple 标识公开度低

除 Fingerprint 明确把 IDFV 作为 visitorId 主锚点外，多数厂商没有公开确认 IDFV、IDFA、Keychain、DeviceCheck、App Attest 或 APNs token 的使用情况。

因此主清单必须保留“使用情况未公开”而不是补成“未使用”。IDFA 在 iOS 17.5 下受 ATT 约束，不能进入通用设备身份主路径。

### 7.2 iOS 常见主路径不是硬件 ID

厂商更常公开的是 SDK token、session、回执、服务端设备 ID、风险标签和图谱输出。例如 DeviceToken、deviceToken、eid、boxId、hardId、device_id、ztoken、GeeToken、visitorId、requestId、sessionId 等。

这些是准稳定引用或服务端聚合 ID，不能等同硬件 ID。稳定性必须按生命周期、持久化路径、跨重装、跨账号、跨 App、服务端恢复条件分别标注。

### 7.3 服务端衍生能力是主体

大量厂商的确定性或接近确定性能力来自服务端设备图谱、账号图谱、IP / 手机 / 邮箱画像、风险样本库、黑产工具库、历史行为、位置历史、模型分数和跨客户网络。它们应进入“服务端图谱与衍生能力”，但不能反写成本地 iOS SDK 已采集字段。

### 7.4 风险信号比稳定 ID 更公开

iOS 侧相对更容易公开的是 jailbreak、simulator、debugger、hook、tamper、screen capture、VPN、proxy、虚拟定位、remote access、device farm、bot、RAT、risk score、risk labels 等风险能力。主清单中风险与异常态分组已达到 194 条，是当前最大分组。

### 7.5 行为和位置属于高价值但高敏维度

行为序列、触控、滑动、传感器、陀螺仪、位置、室内定位、可信位置、IP-to-location consistency 等常被厂商用作风险能力，但它们在 iOS 侧的权限、采样、合规和用户授权边界必须单独处理，不应被视作默认稳定 ID 路径。

---

## 8. 公开资料缺口

以下缺口不阻塞 checkpoint，但应作为后续实现或深挖的证据等级约束。

| 缺口 | 当前处理 |
| --- | --- |
| iOS SDK 原始字段表普遍不公开 | 统一保留字段 schema 缺口，不升级为已采集事实 |
| Keychain / IDFV / DeviceCheck / App Attest 使用情况多数未公开 | 保留为 Apple 标识缺口或追问项 |
| 跨重装、恢复出厂、清数据、换账号生命周期未公开 | 仅按厂商声明或服务端恢复能力标注，不归因到本地存储 |
| 服务端设备 ID、设备图谱、风险画像、模型权重不可验证 | 归入服务端图谱与衍生能力 |
| Web / 小程序 / H5 / HarmonyOS 与 Native iOS 边界 | 单独标注平台边界，不迁移为 Native iOS 字段 |
| Android-only 字段与风险标签 | 仅作跨端线索，不写成 iOS 事实 |
| 行为、位置、传感器和本地网络采样范围 | 归为高敏能力或公开资料缺口 |

---

## 9. 后续接手入口

### 9.1 Android 对齐入口

下一阶段如需与 Android GLNT-4 对齐，应以两个主清单为输入：

- iOS：`.context/GLNT-3/iOS-Compute-Dimensions.md`
- Android：`.context/GLNT-4/Android-Compute-Dimensions.md`

对齐时不要直接按字段名合并。建议先按能力层归类：

1. 平台官方标识与授权约束
2. SDK 自建 ID / token / session / receipt
3. 本地持久化路径
4. 设备与环境弱属性
5. 网络、位置和代理环境
6. 行为序列与人机信号
7. RASP / 运行时 / 完整性风险
8. 服务端图谱、风险库和模型输出

### 9.2 实现优先级入口

如果后续要落到实现，应优先使用证据强、合规边界清晰、iOS API 可行的维度：

| 优先级 | 维度类型 | 说明 |
| --- | --- | --- |
| P0 | 厂商 SDK 返回 token / session / requestId / receipt | 以厂商公开 API 为准，避免自行扩展高敏采集 |
| P1 | 服务端风险标签、risk score、reason code | 作为风控结果消费，不反推本地字段 |
| P1 | App 完整性、jailbreak、simulator、debugger、tamper 等 RASP 信号 | 需依赖厂商 SDK 或公开可实现能力 |
| P2 | 网络、IP、VPN、proxy、coarse location | 需处理权限、合规和授权边界 |
| P2 | 行为序列与传感器 | 高敏，必须有明确产品目的和采样最小化 |
| P3 | IDFA、精确位置、剪贴板、App 列表、私有 API | 默认不进入通用设备身份主路径 |

### 9.3 文档维护入口

后续如果补充新厂商或修正维度：

- 调整目标、口径、证据规则：修改 `Index.md`。
- 补齐、去重、重编号或修正统一维度归位：修改 `iOS-Compute-Dimensions.md`。
- 不回写历史单厂商 `C-*`，除非任务明确要求。
- 新增厂商前缀必须写入主清单编号约定，避免与既有 FP / SE / TM / SI / SU / IN / BU / DV / FZ / U2 / TS / AL / TC / JD / SM / DX / TD / YD / BD / GG 冲突。

---

## 10. 停止条件与验收点

### 10.1 已满足的停止条件

- 20 家目标厂商全部完成单厂商输出。
- 20 家厂商全部进入 iOS 统一 Dimensions 主清单。
- 主清单包含统一分组、编号、来源、风险信号、双归位和条数核对。
- 非公开与高敏边界已在 Index、单厂商条目和主清单中保持一致。
- C-024 已明确判定可以进入 checkpoint。

### 10.2 人工验收点

如 Human 需要验收，建议只看以下点：

1. 厂商范围是否确实与 GLNT-4 对齐，不缺厂商、不增厂商。
2. `iOS-Compute-Dimensions.md` v0.20 的 462 个独立编号是否满足后续 Android 对齐需要。
3. 是否认可“非公开 = 仅作线索、不作结论”的证据边界。
4. 是否认可 Android-only 字段不迁移为 iOS 事实。
5. 是否以本 WORKSHOP 作为 GLNT-3 阶段收束入口。

### 10.3 USE 判定

本次 checkpoint 未识别到“必须由人执行且阻塞下一阶段”的闭合动作。

当前人工验收点属于可选验收，不是进入 checkpoint 的强制前置条件；因此本 WORKSHOP 不生成 `USE-001` 章节。
