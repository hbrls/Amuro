# GeetestGeeGuard-Dimensions · GLNT-3 iOS 维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-29 13:56:37
>
> 视角：极验设备验 / GeeGuard iOS 厂商 LENS（research）
> 来源：TASK-023
> 文件命名口径：厂商名 + `Dimensions`，参考 GLNT-4 的 `GeetestGeeGuard-Dimensions.md`
> 当前口径：以 `.context/GLNT-3/Index.md` §7 单厂商文档结构为准，独立整理极验设备验 / GeeGuard 在 iOS 侧公开可确认的稳定 ID、准稳定 ID、GeeToken、respondedGeeToken、业务绑定、弱特征、风险标签、设备关系图谱和服务端决策能力；与 Android `GeetestGeeGuard-Dimensions.md` 的对照只作为本厂商跨端线索，不把 Android-only、Web-only、小程序或 HarmonyOS 字段写成 iOS 已采集事实。
> 调研基线 iOS 版本：iOS 17.5

---

## 0. 调研口径

本条目只回答极验设备验 / GeeGuard 在 iOS 侧可能形成的硬件标识、稳定 ID 与风控计算维度。公开资料确认 iOS SDK、GeeToken、respondedGeeToken、设备弱特征聚合和服务端查询，但 300+ 弱特征全集、设备编号生命周期和风险标签全集不公开；非公开 = 仅作线索、不作结论。

---

## 1. 产品定位

极验设备验 / GeeGuard 定位为设备指纹与设备风险识别服务。公开材料强调多维度设备弱特征因子生成稳定设备编号，并结合设备关系图谱、设备三维复核模型、风险数据库和业务规则能力输出风险结果。

---

## 2. iOS / Apple 接入方式

| 形态 | iOS 侧含义 | 稳定性判断 |
|------|-----------|------------|
| iOS 设备验 SDK | Native iOS 采集入口 | 生成 GeeToken / 回执，底层字段未公开 |
| Android / HarmonyOS / Web / 小程序 SDK | 跨端采集入口 | 只能作为跨端能力线索 |
| Server API | 查询 GeeToken / respondedGeeToken 对应风险结果 | 服务端风险输出 |
| 业务 data 绑定 | token 可绑定业务流水号或凭证 | 防剥离和场景绑定 |

---

## 3. iOS 稳定 ID 与硬件标识维度

### 3.1 公开确认的 ID / token

| 维度 | iOS 侧状态 | 结论 |
|------|------------|------|
| GeeToken | 客户端 `fetchReceipt` 生成 | 准稳定采集 token，约 4000 字符，不能等同硬件 ID |
| respondedGeeToken | `submitReceipt` 异步返回 | 服务端聚合回执，约 1000 字符 |
| 业务 data 绑定 | 可绑定业务流水号或凭证 | 场景绑定，不是设备 ID |
| 设备唯一编号 | 公开称由弱特征生成稳定设备编号 | 服务端 / SDK 聚合 ID，生命周期未公开 |
| token 降级查询 | 提交失败可用 GeeToken 查询 | 降级路径，可信度需追问 |
| originalResponse | 原始响应 | 排障和审计材料，不是设备 ID |

### 3.2 Apple 标识与系统能力

| 维度 | iOS 侧状态 | 结论 |
|------|------------|------|
| IDFV | 未见公开确认 | 非公开 = 仅作线索、不作结论 |
| IDFA | 未见公开确认 | iOS 17.5 下即使使用也需 ATT 授权；不能假设 |
| Keychain | 未见公开确认 | 不能把 GeeToken 稳定性归因于 Keychain |
| UserDefaults / App Group | 未见公开确认 | 不能写成跨安装或跨 App 持久化事实 |
| DeviceCheck / App Attest | 未见公开确认 | 可作为 App / 设备真实性追问项 |
| APNs token | 未见公开确认 | token 可轮换；未确认使用 |

### 3.3 弱特征和风险维度

| 维度 | iOS 侧状态 | 结论 |
|------|------------|------|
| 系统语言 / 屏幕 / 设备类型 / 内存 / 设备名称 | iOS / Android / HarmonyOS 字段线索 | iOS 明细未公开 |
| Wi-Fi / 定位 / IP / 网络制式 / 网络类型 | iOS 可配置字段线索 | 高敏环境信号，不是稳定 ID |
| 虚拟设备 / 自动化设备 / 定制设备 | 风险能力公开 | 服务端或 SDK 聚合风险 |
| Root / 越狱 / 虚拟定位 / 摄像头劫持 / 屏幕共享 / 签名 / 调试 / 篡改 | 风险工具和不安全环境线索 | iOS trigger 未公开 |

---

## 4. 持久化路径与 SDK 自建 ID

| 路径 | 状态 | 判断 |
|------|------|------|
| GeeToken | 公开确认 | 客户端采集 token |
| respondedGeeToken | 公开确认 | 服务端聚合回执 |
| 设备唯一编号 | 公开能力 | 弱特征生成，生命周期未公开 |
| 业务 data 绑定 | 公开确认 | 业务防剥离参数 |
| Keychain / 本地持久化 | 未公开 | 非公开 = 仅作线索、不作结论 |

---

## 5. 服务端衍生 ID 与风险能力

| 能力 | iOS 侧归位 | 说明 |
|------|------------|------|
| 300+ 设备弱特征因子 | SDK + 服务端输入 | 全集未公开 |
| 设备关系图谱 | 服务端图谱 | 设备、账号、手机号、IP、行为关联 |
| 设备三维复核模型 | 服务端模型 | 虚拟设备、自动化设备、定制设备 |
| 风险标签 / 风险状态 | 服务端输出 | 标签全集未公开 |
| 手机号风险识别 | 服务端画像 | 不属于设备本地字段 |
| IP 风险识别 | 服务端风险库 | 日均百万级风险 IP 更新口径 |
| 风险工具样本库 | 服务端样本库 | 改机工具、云手机、模拟器、虚拟定位工具 |
| 决策引擎 | 服务端规则 | 业务规则编排 |

---

## 6. 公开资料缺口

非公开 = 仅作线索、不作结论。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | GeeToken / respondedGeeToken 生成结构 | 决定 token 是否绑定设备、业务事件、时间窗口和 App |
| Q-2 | 300+ 弱特征因子全集 | 决定 iOS 实际采集面 |
| Q-3 | 设备唯一编号生命周期 | 决定跨重装、清数据、换网络、换账号后的稳定性 |
| Q-4 | 风险标签完整枚举 | 决定服务端结果能否落入统一风险 schema |
| Q-5 | 设备关系图谱字段 | 决定设备、账号、手机号、IP、行为之间如何关联 |
| Q-6 | 设备三维复核模型输入 | 决定虚拟设备、自动化设备、定制设备的判定来源 |
| Q-7 | IP 风险库标签 | 决定代理、机房、秒拨、黑产 IP 如何区分 |
| Q-8 | 风险工具样本覆盖清单 | 决定改机工具、云手机、模拟器和虚拟定位覆盖边界 |
| Q-9 | iOS SDK 实际采集字段 | 合规字段表不等于 SDK 内部全部信号 |
| Q-10 | 在线特征更新协议 | 决定端侧规则是否可动态变化 |

---

## 7. 当前结论

极验设备验 / GeeGuard iOS 侧最明确的链路是 GeeToken、respondedGeeToken、业务 data 绑定、设备唯一编号、token 降级查询和服务端风险结果。GeeToken / respondedGeeToken 是 SDK 与服务端 token，不等同 Apple 硬件标识。

IDFV、IDFA、Keychain、UserDefaults / App Group、DeviceCheck / App Attest、APNs token 均未见公开确认。Web、小程序和 HarmonyOS 字段不能迁移为 iOS 事实；300+ 弱特征、设备关系图谱、三维复核和风险工具样本库只能作为服务端能力或公开资料缺口保留。
