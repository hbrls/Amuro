# BaiduHaotian-Dimensions · GLNT-3 iOS 维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-29 13:54:05
>
> 视角：百度智能云风控 / 昊天镜 iOS 厂商 LENS（research）
> 来源：TASK-022
> 文件命名口径：厂商名 + `Dimensions`，参考 GLNT-4 的 `BaiduHaotian-Dimensions.md`
> 当前口径：以 `.context/GLNT-3/Index.md` §7 单厂商文档结构为准，独立整理百度智能云风控 / 昊天镜在 iOS 侧公开可确认的稳定 ID、准稳定 ID、ztoken、设备指纹 ID、业务保护、威胁情报和服务端模型能力；与 Android `BaiduHaotian-Dimensions.md` 的对照只作为本厂商跨端线索，不把 Android-only 字段写成 iOS 已采集事实。
> 调研基线 iOS 版本：iOS 17.5

---

## 0. 调研口径

本条目只回答百度智能云风控 / 昊天镜在 iOS 侧可能形成的硬件标识、稳定 ID 与风控计算维度。公开资料确认 iOS SDK、ztoken、设备风险查询和业务保护 API，但客户端 SDK 内部采集字段、风险标签全集和设备 ID 生成算法不公开；非公开 = 仅作线索、不作结论。

---

## 1. 产品定位

百度智能云业务安全风控 AFD 定位为全链路业务安全风控防御体系。昊天镜是其中的设备指纹 / 设备风险服务，通过 Android / iOS / JS SDK 生成 ztoken，服务端 API 查询设备指纹 ID、设备风险标签和业务风险等级。

---

## 2. iOS / Apple 接入方式

| 形态 | iOS 侧含义 | 稳定性判断 |
|------|-----------|------------|
| iOS SDK `libHSDKLib.a` + `HSDKLib.h` | Native iOS 设备指纹 SDK | 生成 ztoken，底层字段未公开 |
| JavaScript SDK | H5 / 小程序设备指纹 | `jt` / `jid` / `jtag` 与 Native 边界需区分 |
| 设备风险查询 API | `/rcs/factor-saas` | 查询 `x` 设备指纹 ID 和设备风险标签 |
| 业务保护 API | `/rcs/sync-saas` | 注册、登录、活动、渠道等场景风险 |
| Server SDK / BCE 签名 | 服务端认证链路 | bce-auth-v1 + SHA256 |

---

## 3. iOS 稳定 ID 与硬件标识维度

### 3.1 公开确认的 ID / token

| 维度 | iOS 侧状态 | 结论 |
|------|------------|------|
| ztoken | iOS / Android SDK 主 token | 准稳定请求凭证；禁止缓存口径需遵守 |
| 本地默认 ztoken | 未初始化、无网、超时等 fallback | 降级材料，可信度需追问 |
| 云端 ztoken | resultCode=1 语义 | 云端生成成功的 token |
| `x` 设备指纹 ID | 设备风险查询 API 出参 | 服务端设备指纹 ID，生命周期未公开 |
| `jt` | JS SDK 颁发 token | H5 token，不可缓存 |
| `jid` / `jtag` | H5 设备指纹 ID / 风险标签 | Web 场景，不等同 Native iOS |

### 3.2 Apple 标识与系统能力

| 维度 | iOS 侧状态 | 结论 |
|------|------------|------|
| IDFV | 未见公开确认 | 非公开 = 仅作线索、不作结论 |
| IDFA | 未见公开确认 | iOS 17.5 下即使使用也需 ATT 授权；不能假设 |
| Keychain | 未见公开确认 | 不能把 ztoken 稳定性归因于 Keychain |
| UserDefaults / App Group | 未见公开确认 | 不能写成跨安装或跨 App 持久化事实 |
| DeviceCheck / App Attest | 未见公开确认 | 可作为 App / 设备真实性追问项 |
| APNs token | 未见公开确认 | token 可轮换；未确认使用 |

### 3.3 风险和业务上下文

| 维度 | iOS 侧状态 | 结论 |
|------|------------|------|
| 设备风险标签 `t` | 示例含 `jailbreak`、`inject`、`repkg` | iOS 明确风险标签线索 |
| 业务风险等级 level 1-4 | 业务保护 API 输出 | 服务端决策，不是本地字段 |
| 注册 / 登录 / 活动 / 渠道场景 | 业务保护 API | 业务上下文 |
| 安全环境扫描 | `host_call_env` 触发线索 | 本地检测项未公开 |

---

## 4. 持久化路径与 SDK 自建 ID

| 路径 | 状态 | 判断 |
|------|------|------|
| ztoken | 公开确认 | 请求凭证，公开口径禁止缓存 |
| 本地默认 ztoken | 公开确认 | 降级路径，不代表稳定设备 ID |
| 云端 ztoken | 公开确认 | 云端生成成功的 token |
| `x` | 公开确认 | 服务端设备指纹 ID |
| `jt` / `jid` | 公开确认 | H5 指纹链路 |
| Keychain / 本地持久化 | 未公开 | 非公开 = 仅作线索、不作结论 |

---

## 5. 服务端衍生 ID 与风险能力

| 能力 | iOS 侧归位 | 说明 |
|------|------------|------|
| 设备风险标签 | 服务端风险 | `jailbreak` / `inject` / `repkg` 等示例 |
| 业务风险等级和标签 | 服务端决策 | level 1-4 和业务标签 |
| 业务保护 API | 场景风控 | 注册、登录、活动防刷、渠道反作弊、反爬 |
| 20 亿+ 设备库 / 8 亿+ 活跃设备 | 服务端设备库 | 设备库匹配规则未公开 |
| 风险设备画像 | 服务端画像 | 多维设备风险画像 |
| 威胁情报分析 | 服务端情报 | 黑产资源、攻击手段、网络风险 |
| 实时 + 离线风控 / 无监督模型 | 服务端模型 | 全链路关联分析 |
| bce-auth-v1 | 服务端认证 | 请求安全，不是设备 ID |

---

## 6. 公开资料缺口

非公开 = 仅作线索、不作结论。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | 设备风险标签完整枚举 | 当前仅示例 `jailbreak` / `inject` / `repkg` |
| Q-2 | ztoken 生成算法 | 决定 ztoken 是否绑定设备、账号、事件还是时序 |
| Q-3 | `x` 设备指纹 ID 生命周期 | 决定跨重装、清数据、换账号、换网络后的连续性 |
| Q-4 | iOS SDK 实际采集字段 | API 入参不等于 SDK 内部字段 |
| Q-5 | 本地默认 ztoken 可信度 | 决定无网、超时、云服务错误时的风控价值 |
| Q-6 | 安全环境扫描检测项 | 决定 `host_call_env` 触发哪些本地检查 |
| Q-7 | H5 指纹与 Native 指纹关联 | 决定 `jt` / `jid` 与 ztoken / `x` 是否可合并 |
| Q-8 | 设备库匹配规则 | 决定 20 亿+ 设备库如何生成风险结果 |
| Q-9 | 业务风险等级 reason code | 决定 level 1-4 是否可解释 |

---

## 7. 当前结论

百度智能云风控 / 昊天镜 iOS 侧最明确的链路是 ztoken、云端 ztoken、本地默认 ztoken、服务端设备指纹 ID `x`、H5 `jt` / `jid` / `jtag`、设备风险标签和业务风险等级。ztoken 是请求凭证；`x` 是服务端设备指纹 ID；二者都不能等同 Apple 硬件标识。

IDFV、IDFA、Keychain、UserDefaults / App Group、DeviceCheck / App Attest、APNs token 均未见公开确认。API 入参中的 Wi-Fi、GPS、UA、网络类型等不能反推 iOS SDK 已采集字段，只能作为追问缺口。
