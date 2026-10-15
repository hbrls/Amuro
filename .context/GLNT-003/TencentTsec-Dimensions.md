# TencentTsec-Dimensions · GLNT-3 iOS 维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-29 13:33:19
>
> 视角：腾讯云 T-Sec iOS 厂商 LENS（research）
> 来源：TASK-016
> 文件命名口径：厂商名 + `Dimensions`，参考 GLNT-4 的 `TencentTsec-Dimensions.md`
> 当前口径：以 `.context/GLNT-3/Index.md` §7 单厂商文档结构为准，独立整理腾讯云 T-Sec 设备安全在 iOS 侧公开可确认的稳定 ID、准稳定 ID、设备风险标签、环境维度、行为维度和服务端衍生能力；与 Android `TencentTsec-Dimensions.md` 的对照只作为本厂商跨端线索，不把 Android-only 字段写成 iOS 已采集事实。
> 调研基线 iOS 版本：iOS 17.5

---

## 0. 调研口径

本条目只回答腾讯云 T-Sec 设备安全在 iOS 侧可能形成的硬件标识、稳定 ID 与风控计算维度。

资料分层如下：

| 层级 | 本文处理方式 |
|------|--------------|
| 腾讯云 iOS 设备安全公开文档 | 作为事实依据，记录 iOS DeviceToken、服务端返回字段和 iOS 风险标签 |
| 腾讯云 T-Sec 产品 / API 文档 | 作为服务端能力依据，记录 Openid、Unionid、RiskInfos、SceneRiskInfos、SuggestionLevel 等 |
| Android `TencentTsec-Dimensions.md` | 仅作同厂商跨端线索，不能反推 iOS 已采集字段 |
| Apple 平台能力 | 只在公开资料确认或解释 iOS 17.5 限制时引用 |
| 非公开字段、算法和模型 | 非公开 = 仅作线索、不作结论 |

---

## 1. 产品定位

腾讯云 T-Sec 设备安全定位为可信设备标识、设备风险识别和服务端关联网络能力。公开材料强调客户端生成 DeviceToken，服务端结合业务场景、账号、IP、设备风险标签和历史画像输出风险信息。

iOS 侧可拆为四层：

- SDK / H5 / 小程序等多端采集入口，客户端侧生成或提交 DeviceToken。
- 服务端 API 返回 Openid、Unionid、RiskInfos、HistRiskInfos、SceneRiskInfos、SuggestionLevel、ExtraInfos 等。
- iOS 明确风险标签，包括越狱、注入、HTTP / VPN 代理、HOOK、逆向调试、多开、设备信息篡改、重打包、模拟器、虚拟定位、自动化设备、屏幕共享、SIM、黑名单设备、系统重置等。
- 服务端关联网络和行为模型，包括账号 / 设备 / IP 关联、应用刷量、多账号异常、团伙欺诈、传感行为 AI、设备威胁态势感知。

因此腾讯云 T-Sec 的 iOS 维度不应只看 Apple 系统标识。它的核心是 DeviceToken + 服务端匿名 ID / 统一 ID + 风险标签体系。

---

## 2. iOS / Apple 接入方式

| 形态 | iOS 侧含义 | 稳定性判断 |
|------|-----------|------------|
| iOS SDK | App 集成设备安全 SDK，获取 DeviceToken 并上送服务端 | SDK 自建准稳定引用，底层输入未公开 |
| H5 / 小程序 SDK | Web / 小程序场景采集设备风险材料 | 与 Native iOS 边界需区分 |
| Server API | `DescribeFraudBase` / `DescribeFraudUltimate` 等服务端接口 | 输出服务端风险，不是本地字段 |
| DeviceToken | 客户端 SDK 生成，服务端 API 核心输入 | 准稳定请求凭证，不等同硬件 ID |
| SceneCode | login / register 等场景输入 | 业务场景键，不是设备 ID |
| UserId / OpenId / PhoneNumber / ClientIP | 业务侧输入 | 账号和网络上下文，不是本地设备 ID |
| RiskInfos / SuggestionLevel | 服务端风险输出 | 风险判断结果，不是本地采集字段 |

与 Android 对照：Android 侧有 IMEI、IMSI、OAID、Android ID、Build fingerprint、ROM、root、云手机、多开工具、风险应用库等细粒度标签。iOS 公开资料确认了一批 iOS 等价风险标签，但 IMEI / IMSI / OAID / Android ID / ROM / 包名枚举等不能迁移为 iOS 事实。

---

## 3. iOS 稳定 ID 与硬件标识维度

### 3.1 公开确认的 ID / token

| 维度 | iOS 侧状态 | 结论 |
|------|------------|------|
| DeviceToken | 公开资料确认客户端 SDK 获取并供服务端查询 | 腾讯云 T-Sec iOS 主引用；准稳定 SDK token，不是硬件 ID |
| Openid | 服务端返回设备匿名标识 | 服务端生成 ID，稳定性和底层输入未公开 |
| Unionid | 服务端返回或图灵盾统一 ID | 服务端统一 ID / 关联 ID，不是本地 Apple 标识 |
| RiskInfos / HistRiskInfos | 服务端返回实时 / 历史风险信息 | 风险标签集合，不是设备 ID |
| SceneRiskInfos | 服务端按场景返回风险信息 | 业务场景风险，不是设备 ID |
| SuggestionLevel | 服务端建议等级 | 风险决策结果 |
| ExtraInfos / DegradationType | 服务端额外信息 / 降级信息 | 采集质量或降级状态，不是 ID |

### 3.2 Apple 标识与系统能力

| 维度 | iOS 侧状态 | 结论 |
|------|------------|------|
| IDFV | 未见公开确认 | 非公开 = 仅作线索、不作结论 |
| IDFA | 未见公开确认 | iOS 17.5 下即使使用也需 ATT 授权；不能假设 |
| Keychain | 未见公开确认 | 不能把 DeviceToken 稳定性归因于 Keychain |
| UserDefaults / App Group | 未见公开确认 | 不能写成跨安装或跨 App 持久化事实 |
| DeviceCheck / App Attest | 未见公开确认 | 可作为 App / 设备真实性追问项 |
| APNs token | 未见公开确认 | token 可轮换；未确认使用 |

### 3.3 iOS 风险标签中的设备状态

| 维度 | iOS 侧状态 | 结论 |
|------|------------|------|
| 越狱 | iOS 风险标签明确 | 本地风险检测或 SDK + 服务端风险判断 |
| 注入 / HOOK / 逆向调试 | iOS 风险标签明确 | 运行时攻击风险，不是稳定 ID |
| 重打包 | iOS 风险标签明确 | App 完整性风险 |
| 模拟器 / 多开 / 自动化设备 | iOS 风险标签明确 | 虚拟化 / 自动化风险 |
| 设备信息篡改 | iOS 风险标签明确 | 多字段一致性或历史画像风险；底层字段未公开 |
| HTTP / VPN 代理 | iOS 风险标签明确 | 网络环境风险 |
| 虚拟定位 | iOS 风险标签明确 | 位置欺骗风险 |
| 屏幕共享 | iOS 风险标签明确 | 远控 / 泄露风险 |
| SIM / 黑名单设备 / 系统重置 | iOS 风险标签明确 | 设备状态或服务端画像标签，底层 evidence 未公开 |

---

## 4. 持久化路径与 SDK 自建 ID

腾讯云 T-Sec iOS 公开确认的自建引用是 DeviceToken。Openid / Unionid 更偏服务端匿名 ID 和统一 ID。

| 路径 | 状态 | 判断 |
|------|------|------|
| DeviceToken | 公开确认 | SDK 主引用；稳定性、刷新策略、跨重装边界未公开 |
| Openid | 公开确认服务端输出 | 设备匿名标识；生成算法和生命周期未公开 |
| Unionid | 公开确认服务端输出 / 统一 ID 语义 | 跨场景或统一关联 ID；不等同 Apple 标识 |
| SceneCode + UserId / OpenId / PhoneNumber | 公开确认业务输入 | 帮助服务端做账号 / 设备 / IP 关联 |
| Keychain / 本地持久化 | 未公开 | 非公开 = 仅作线索、不作结论 |
| DegradationType | 公开资料存在降级信息线索 | 采集质量指标，不是设备 ID |

与 Android 对照：Android 的 IMEI / OAID / Android ID / ROM / SIM 等可能进入 T-Sec 风险标签或篡改检测；iOS 侧不能照搬这些字段，只能保留 DeviceToken、Openid、Unionid 和 iOS 明确风险标签。

---

## 5. 服务端衍生 ID 与风险能力

| 能力 | iOS 侧归位 | 说明 |
|------|------------|------|
| RiskInfos / HistRiskInfos | 服务端风险标签 | 实时 / 历史风险集合，Type + Level 等结构 |
| SceneRiskInfos | 场景化风险 | login / register 等业务场景判断 |
| SuggestionLevel | 综合建议等级 | 服务端综合决策，常用于放行 / 拦截 / 二次校验 |
| Openid / Unionid | 服务端设备 ID / 关联 ID | 稳定性、跨账号、跨重装和跨设备边界未公开 |
| 设备信息篡改 | 风险标签 | iOS 底层字段和一致性算法未公开 |
| 越狱 / 注入 / HOOK / 逆向调试 / 重打包 | 运行时攻击风险 | SDK 或端管云综合检测 |
| 模拟器 / 多开 / 自动化设备 | 虚拟化和自动化风险 | 可能结合本地特征和服务端行为 |
| HTTP / VPN 代理 / 虚拟定位 | 网络与位置风险 | 与 ClientIP、位置、代理特征、历史画像相关 |
| 屏幕共享 | 远控 / 泄露风险 | iOS trigger 未公开 |
| 黑名单设备 / 系统重置 | 服务端画像风险 | 依赖历史设备画像或黑名单库 |
| 账号 / 设备 / IP 关联网络 | 服务端图谱 | 不是本地字段 |
| 传感行为 AI / 人机行为识别 | 行为模型 | 原始传感器、触控、页面事件范围未公开 |

---

## 6. 公开资料缺口

非公开 = 仅作线索、不作结论。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | DeviceToken 生命周期、刷新和跨重装边界 | 决定它是短期查询 token 还是准稳定设备锚点 |
| Q-2 | Openid / Unionid 生成策略 | 决定服务端 ID 的稳定性、冲突率和跨账号边界 |
| Q-3 | iOS SDK 原始采集字段 | 决定 IDFV、设备型号、系统版本、网络、传感器等是否进入模型 |
| Q-4 | Keychain / UserDefaults / App Group 是否参与持久化 | 决定是否存在本地跨安装或跨 App 连续性 |
| Q-5 | DeviceCheck / App Attest 是否使用 | 决定 Apple 设备真实性和 App 完整性是否进入信号 |
| Q-6 | iOS 设备信息篡改 evidence | 决定篡改标签基于哪些 iOS 字段和历史画像 |
| Q-7 | 越狱 / 注入 / HOOK / 逆向调试覆盖范围 | 决定 Frida、Substrate、调试器、动态库注入等覆盖边界 |
| Q-8 | 模拟器 / 多开 / 自动化设备判定算法 | 决定云设备、自动化框架和容器化运行时的可识别度 |
| Q-9 | HTTP / VPN 代理与虚拟定位 trigger | 决定本地网络状态、系统配置和服务端 IP 画像的分工 |
| Q-10 | 屏幕共享和页面监听的 iOS 采集路径 | 决定是否依赖系统 API、无障碍类信号或服务端行为 |
| Q-11 | 黑名单设备和系统重置的画像规则 | 决定是否使用历史 DeviceToken、Openid / Unionid 或服务端图谱 |
| Q-12 | 传感行为 AI 的 iOS 原始事件 | 决定触控、陀螺仪、加速度、页面停留和输入节奏是否采集 |
| Q-13 | ExtraInfos / DegradationType 枚举 | 决定权限缺失、弱网、SDK 降级时的可信度处理 |

---

## 7. 当前结论

腾讯云 T-Sec iOS 侧的核心可确认链路是 DeviceToken、服务端 Openid / Unionid、RiskInfos / HistRiskInfos / SceneRiskInfos、SuggestionLevel 和 iOS 风险标签体系。DeviceToken 是准稳定 SDK token；Openid / Unionid 是服务端衍生 ID；二者都不能直接等同于 Apple 硬件标识。

iOS 公开资料明确了一组设备风险标签：越狱、注入、HTTP / VPN 代理、HOOK、逆向调试、多开、设备信息篡改、重打包、模拟器、虚拟定位、自动化设备、屏幕共享、SIM、黑名单设备、系统重置等。这些可以进入 iOS 计算维度，但它们是风险标签或服务端判断，不是稳定 ID。

IDFV、IDFA、Keychain、UserDefaults / App Group、DeviceCheck / App Attest、APNs token 均未见公开确认。Android 侧的 IMEI / IMSI / OAID / Android ID / ROM / 风险应用包名等不能迁移为 iOS 事实；只能作为同厂商跨端追问线索。
