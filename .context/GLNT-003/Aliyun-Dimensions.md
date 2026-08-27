# Aliyun-Dimensions · GLNT-3 iOS 维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-29 13:28:15
>
> 视角：阿里云 iOS 厂商 LENS（research）
> 来源：TASK-015
> 文件命名口径：厂商名 + `Dimensions`，参考 GLNT-4 的 `Aliyun-Dimensions.md`
> 当前口径：以 `.context/GLNT-3/Index.md` §7 单厂商文档结构为准，独立整理阿里云风险识别 / 设备风险 SDK 在 iOS 侧公开可确认的稳定 ID、准稳定 ID、设备环境、网络位置、风险标签和服务端衍生能力；与 Android `Aliyun-Dimensions.md` 的对照只作为本厂商跨端线索，不把 Android-only 字段写成 iOS 已采集事实。
> 调研基线 iOS 版本：iOS 17.5

---

## 0. 调研口径

本条目只回答阿里云风险识别 / 设备风险 SDK 在 iOS 侧可能形成的硬件标识、稳定 ID 与风控计算维度。

资料分层如下：

| 层级 | 本文处理方式 |
|------|--------------|
| iOS 公开接入文档 | 作为事实依据，记录 SDK 接入、权限、token、业务绑定和调用时序 |
| 阿里云设备风险服务端 API / 产品说明 | 作为服务端能力依据，记录风险标签、评分、日志和设备唯一 ID 等衍生能力 |
| Android `Aliyun-Dimensions.md` | 仅作同厂商跨端线索，不能反推 iOS 已采集字段 |
| Apple 平台能力 | 只在阿里云公开资料确认或需要解释 iOS 17.5 限制时引用 |
| 非公开字段、算法和模型 | 非公开 = 仅作线索、不作结论 |

---

## 1. 产品定位

阿里云风险识别 / 设备风险 SDK 是阿里云业务风险管理产品中的设备风险采集与识别链路。客户端 SDK 负责生成或上送设备侧 token / session 类材料，服务端风险识别接口结合业务 `bizId`、设备 token、网络环境和历史风险画像输出设备风险判断。

iOS 侧公开材料的重点不在暴露底层硬件字段，而在：

- App 集成 iOS SDK 后获取 `deviceToken` 或会话材料。
- 通过 `getSession` 等调用路径把客户端采集结果交给业务服务端。
- 使用 `bizId` 把业务场景与设备 token 绑定。
- 可选接入 IDFA 授权、定位、本地网络等权限来增强识别质量。
- 服务端返回设备风险、增强版设备唯一 ID、风险标签、日志和请求追踪信息。

因此阿里云的 iOS 维度应被拆成两层：本地 SDK 公开确认的 token / session / 权限类信号，以及服务端衍生的风险标签 / 设备唯一 ID / 日志链路。两者不能混写。

---

## 2. iOS / Apple 接入方式

| 形态 | iOS 侧含义 | 稳定性判断 |
|------|-----------|------------|
| iOS SDK | App 集成阿里云风险识别 SDK，初始化后获取设备风险相关 token / session | SDK 自建材料，稳定性由阿里云 token 生命周期和服务端画像决定 |
| `deviceToken` | 客户端 SDK 生成或返回的设备风险 token | 准稳定请求凭证，不等同硬件 ID |
| `getSession` | 获取本次设备风险会话 / session 引用 | 会话级引用，适合绑定一次业务请求 |
| `bizId` | 业务场景或业务身份绑定字段 | 业务上下文，不是设备 ID |
| IDFA 授权 | iOS 17.5 下必须经 ATT 授权；阿里云文档将其作为可选增强 | 广告标识，不应作为默认稳定 ID 主路径 |
| 定位权限 | 用于位置相关风险、设备环境或群控识别增强 | 高敏环境信号，不是硬件 ID |
| 本地网络权限 | 用于局域网 / 设备牧场 / 网络环境类风险增强 | 环境信号，需用户授权或系统弹窗 |
| 服务端 API | 业务服务端携带 token / session 调用风险识别 | 服务端衍生风险，不是本地字段 |

与 Android 对照：Android 侧公开了 `deviceToken`、7 天生命周期、初始化后调用间隔、`Data.extend` 设备唯一 ID、黑灰产 App、Wi-Fi / DNS / LAN、定位等更细的采集和标签线索；iOS 侧只能确认 token / session / 权限 / 服务端能力，不能把 Android 的 IMEI、IMSI、OAID、Wi-Fi 扫描或应用列表等字段迁移成 iOS 事实。

---

## 3. iOS 稳定 ID 与硬件标识维度

### 3.1 公开确认的 ID / token

| 维度 | iOS 侧状态 | 结论 |
|------|------------|------|
| `deviceToken` | 公开资料确认设备风险 SDK token 路径 | 准稳定 SDK token；是阿里云 iOS 侧最明确的设备风险引用，但不是硬件 ID |
| `getSession` / session | 公开资料确认会话获取路径 | 会话级或交易级引用，用于把一次业务请求绑定到 SDK 采集结果 |
| `bizId` | 公开资料确认业务绑定 | 业务场景键，不是设备标识；会影响服务端画像归因 |
| RequestId / API trace | 服务端 API 常见返回追踪字段 | 请求追踪，不是设备 ID |

### 3.2 Apple 标识与系统能力

| 维度 | iOS 侧状态 | 结论 |
|------|------------|------|
| IDFA | 公开资料将 IDFA / 广告标识作为可选增强线索 | iOS 17.5 下需 ATT 授权；不能作为默认采集事实 |
| IDFV | 未见公开确认 | 非公开 = 仅作线索、不作结论 |
| Keychain | 未见公开确认 | 不能把 token 稳定性归因于 Keychain |
| UserDefaults / App Group | 未见公开确认 | 不能写成跨重装或跨 App 持久化事实 |
| DeviceCheck / App Attest | 未见公开确认 | 可作为 Apple 风险能力追问项，不写入已实现事实 |
| APNs token | 未见公开确认 | token 可轮换；未确认使用 |

### 3.3 设备 / 环境弱指纹

| 维度 | iOS 侧状态 | 结论 |
|------|------------|------|
| 设备型号、系统版本、App 版本、SDK 版本 | SDK 类产品通常会使用，但阿里云 iOS 字段明细未公开 | 只能作为字段缺口，不写成已确认采集 |
| 屏幕 / 分辨率 / 语言 / 时区 | Android 对照和风控产品常见弱信号 | iOS 未公开字段明细，作为缺口保留 |
| 定位信息 | 公开资料涉及定位权限 / 位置信号 | 高敏环境信号；可作为风险计算维度，不是稳定 ID |
| 本地网络 / LAN | 公开资料涉及本地网络权限或局域网风险线索 | 网络环境维度；不能等同设备硬件 ID |

---

## 4. 持久化路径与 SDK 自建 ID

阿里云 iOS 侧公开可确认的自建 ID 路径是 SDK token / session，而不是 Apple 原生稳定标识。

| 路径 | 状态 | 判断 |
|------|------|------|
| SDK `deviceToken` | 公开确认 | 可作为阿里云设备风险链路的主引用；生命周期、刷新和降级规则由 SDK / 服务端控制 |
| Session | 公开确认 | 更接近一次采集或一次业务请求引用 |
| `bizId` 绑定 | 公开确认 | 业务侧归因键，帮助服务端把 token 与场景关联 |
| 增强版设备唯一 ID / `Data.extend` | Android / 服务端材料明确；iOS 底层输入未公开 | 可作为服务端衍生 ID 记录，不能写成本地 iOS 硬件标识 |
| Keychain 持久化 | 未公开 | 非公开 = 仅作线索、不作结论 |
| 跨卸载重装稳定性 | 未公开 | 不能从 token 存在反推跨重装稳定 |

与 Android 对照：Android 文档中的 token 7 天有效、调用过早导致数据降级、增强版设备唯一 ID、SDK 加固等信息说明阿里云有明确的 token 生命周期和服务端聚合能力；iOS 若没有同等公开字段，只能归为服务端能力或资料缺口。

---

## 5. 服务端衍生 ID 与风险能力

阿里云风险识别的价值主要在服务端衍生层。以下能力可以作为 iOS 计算维度保留，但不能写成本地 iOS 已采集字段。

| 能力 | iOS 侧归位 | 说明 |
|------|------------|------|
| 设备风险评分 / 风险标签 | 服务端衍生风险 | 综合 token、业务、网络、历史和模型信号输出 |
| 增强版设备唯一 ID | 服务端聚合 ID | 底层输入未公开；不能等同 IDFV / IDFA / Keychain |
| 模拟器 / 越狱 / 虚拟化等风险 | 风险标签 | Android 明确有 emulator/root/virtual；iOS 需确认 jailbreak / simulator / tamper 等价标签 |
| 黑灰产 App / 恶意工具 | 风险库 / 服务端模型 | iOS 应用枚举受限；除非公开确认，否则不写成本地采集 |
| 设备牧场 / 群控 | 服务端聚类风险 | 可能消费 LAN、IP、位置、业务行为和历史图谱 |
| token 篡改 / 降级 | SDK + 服务端完整性 | 调用时序、token 完整性和弱网场景会影响风险质量 |
| SLS 日志投递 | 服务端日志链路 | 增强版能力；不是设备 ID |
| RequestId | API 追踪 | 仅用于排障和请求链路追踪 |

---

## 6. 公开资料缺口

非公开 = 仅作线索、不作结论。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | iOS SDK 原始采集字段清单 | 决定是否真实采集 IDFV、设备型号、系统版本、屏幕、语言、时区、网络等字段 |
| Q-2 | `deviceToken` 生命周期与刷新规则 | 决定 token 是短期请求凭证还是准稳定设备引用 |
| Q-3 | `getSession` 与 `deviceToken` 的关系 | 决定 session 是 token 包装、一次性采集引用还是服务端 profile key |
| Q-4 | IDFA 是否默认采集以及 ATT 拒绝后的降级路径 | 决定广告标识是否进入主路径 |
| Q-5 | Keychain / UserDefaults / App Group 是否用于 token 持久化 | 决定是否存在跨安装或跨 App 持久化能力 |
| Q-6 | IDFV 是否采集 | 决定是否存在 vendor scope 稳定 ID |
| Q-7 | DeviceCheck / App Attest 是否接入 | 决定是否有 Apple 设备真实性或 App 完整性证明 |
| Q-8 | iOS 越狱 / 模拟器 / hook / tamper 风险标签 | 决定 Android `is_rooted`、`is_emulator`、`is_virtual` 的 iOS 等价物 |
| Q-9 | 本地网络权限实际采集内容 | 决定是否采集 LAN IP、局域网设备、DNS 或 Wi-Fi 类信号 |
| Q-10 | 定位权限实际用途 | 决定定位用于位置风险、设备牧场还是仅作业务风控辅助 |
| Q-11 | 黑灰产 App 在 iOS 的可行路径 | iOS installed apps 枚举受限，需确认是否依赖 URL scheme、配置名单或服务端行为 |
| Q-12 | 增强版设备唯一 ID 的 iOS 输入材料 | 决定服务端 ID 稳定性和误判边界 |
| Q-13 | token 降级、弱网和初始化时序规则的 iOS 版本差异 | 决定 SDK 接入质量如何影响设备风险结果 |

---

## 7. 当前结论

阿里云 iOS 侧可以明确保留的稳定或准稳定链路是 `deviceToken`、`getSession` / session、`bizId` 绑定和服务端设备风险 API。它们共同构成阿里云设备风险识别的引用路径，但都不等同于 iOS 硬件 ID。

IDFA 只能作为可选增强线索，iOS 17.5 下受 ATT 约束；IDFV、Keychain、DeviceCheck / App Attest、APNs token、UserDefaults / App Group 等均未见公开确认，不能写成事实。

阿里云差异化能力主要落在服务端衍生层：设备风险标签、增强版设备唯一 ID、设备风险评分、设备牧场 / 群控、黑灰产风险、token 完整性、SLS 日志和 RequestId。Android 对照中的 IMEI、IMSI、OAID、Wi-Fi 扫描、应用列表、root / emulator / virtual 等字段不能直接迁移到 iOS；iOS 侧只能保留公开确认的权限、token、session 和服务端输出，并把未公开部分列为缺口。
