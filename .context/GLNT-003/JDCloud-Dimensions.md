# JDCloud-Dimensions · GLNT-3 iOS 维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-29 13:38:07
>
> 视角：京东云 iOS 厂商 LENS（research）
> 来源：TASK-017
> 文件命名口径：厂商名 + `Dimensions`，参考 GLNT-4 的 `JDCloud-Dimensions.md`
> 当前口径：以 `.context/GLNT-3/Index.md` §7 单厂商文档结构为准，独立整理京东云设备指纹在 iOS 侧公开可确认的稳定 ID、准稳定 ID、策略下发、采集控制、风险标签和服务端衍生能力；与 Android `JDCloud-Dimensions.md` 的对照只作为本厂商跨端线索，不把 Android-only 字段写成 iOS 已采集事实。
> 调研基线 iOS 版本：iOS 17.5

---

## 0. 调研口径

本条目只回答京东云设备指纹在 iOS 侧可能形成的硬件标识、稳定 ID 与风控计算维度。

资料分层如下：

| 层级 | 本文处理方式 |
|------|--------------|
| 京东云设备指纹 / 验证码 iOS SDK 公开材料 | 作为事实依据，记录 iOS SDK、设备指纹掩码、验证码联动等 |
| 京东云设备指纹 OpenAPI / 产品材料 | 作为服务端能力依据，记录 `eid`、`tk`、`vttok`、策略字段和风险标签 |
| Android `JDCloud-Dimensions.md` | 仅作同厂商跨端线索，不能反推 iOS 已采集字段 |
| Apple 平台能力 | 只在公开资料确认或解释 iOS 17.5 限制时引用 |
| 非公开字段、算法和模型 | 非公开 = 仅作线索、不作结论 |

---

## 1. 产品定位

京东云设备指纹定位为反欺诈设备识别 SDK / API。公开材料强调通过 Android / iOS / JS 等多端采集设备信息，由服务端生成设备唯一 ID、token、采集策略和风险标签，并服务机器注册、批量登录、营销作弊、支付风险、内容盗爬、刷榜刷单和虚假裂变等场景。

iOS 侧可拆为四层：

- 设备唯一 ID：服务端返回 `eid`，并宣称自研高可靠生成和恢复算法。
- Token：`tk`、`tokenTime`、`tokenActTime` 表示 token 与生命周期。
- 策略下发：`vttok` / `verifyCode` / `isStrategy` / `cltTime` / `cltFreq` / `isCltSens` / `cltDevice` 等控制采集和验证。
- 风险标签：`ise`、`isr`、`ism`、`ish`、`isj` 分别对应模拟器、root、篡改、hook、越狱等风险语义。

因此京东云的核心不是公开 Apple 硬件标识，而是服务端聚合 `eid`、token 生命周期和动态采集策略。

---

## 2. iOS / Apple 接入方式

| 形态 | iOS 侧含义 | 稳定性判断 |
|------|-----------|------------|
| iOS SDK | 设备指纹 / 验证码 iOS 接入，采集设备风险材料 | SDK 采集入口，底层字段未公开 |
| JS SDK | PC / mobile Web 设备指纹 | Web / H5 场景，不等同 Native iOS |
| Server API `device` | 上报采集结果，返回 `DeviceRespBody` | 服务端生成 ID 和风险标签 |
| Server API `vttok` | 策略下发和 token 返回 | 动态采集策略 / token 生命周期 |
| P7 信封加密 | 请求体加密传输 | 保护链路，不是设备 ID |
| `bizId` / `pin` / `tenantId` | 业务、用户和租户绑定 | 业务上下文，不是硬件 ID |

与 Android 对照：Android 侧材料出现传感器采集、App 列表、人机数据和 P7 加密；iOS 侧若公开资料没有字段级说明，只能保留策略和服务端返回，不能把 Android 的 App 列表、包名、root、ROM、Android ID、OAID 等迁移为 iOS 采集事实。

---

## 3. iOS 稳定 ID 与硬件标识维度

### 3.1 公开确认的 ID / token

| 维度 | iOS 侧状态 | 结论 |
|------|------------|------|
| `eid` | 公开资料确认设备唯一性 ID | 服务端聚合设备 ID；底层输入和恢复算法未公开 |
| `tk` | 公开资料确认 token | 与 `eid` 关联的准稳定 token，不是硬件 ID |
| `tokenTime` | 公开资料确认 token 生成时间 | 生命周期元数据 |
| `tokenActTime` | 公开资料确认 token 有效时间 | 生命周期元数据 |
| `bizId` | 公开资料确认业务唯一标识 | 业务场景键 |
| `pin` | 公开资料确认用户唯一标识 | 账号绑定键，不是设备 ID |
| `tenantId` | 公开资料出现租户 / 签名维度线索 | 租户或接入方上下文，不是设备 ID |

### 3.2 Apple 标识与系统能力

| 维度 | iOS 侧状态 | 结论 |
|------|------------|------|
| IDFV | 未见公开确认 | 非公开 = 仅作线索、不作结论 |
| IDFA | 未见公开确认 | iOS 17.5 下即使使用也需 ATT 授权；不能假设 |
| Keychain | 未见公开确认 | 不能把 `eid` 或 `tk` 稳定性归因于 Keychain |
| UserDefaults / App Group | 未见公开确认 | 不能写成跨安装或跨 App 持久化事实 |
| DeviceCheck / App Attest | 未见公开确认 | 可作为设备真实性和 App 完整性追问项 |
| APNs token | 未见公开确认 | token 可轮换；未确认使用 |

### 3.3 风险标签与设备状态

| 维度 | iOS 侧状态 | 结论 |
|------|------------|------|
| `ise` 是否模拟器 | 公开服务端风险标签 | iOS 可作为模拟器风险标签，但 trigger 未公开 |
| `isr` 是否 root | Android 语义明确；iOS 需区分 jailbreak | iOS 不应写成 root，本地等价应追问 |
| `ism` 是否篡改 | 公开服务端风险标签 | 设备 / App / 环境篡改风险，底层 evidence 未公开 |
| `ish` 是否 hook | 公开服务端风险标签 | Frida / Substrate 等覆盖范围未公开 |
| `isj` 是否越狱 | iOS 语义明确 | iOS 风险标签，可以保留 |
| APP 多开 / 云手机 / 设备伪造 | 产品能力公开 | 服务端或 SDK 聚合风险，不是稳定 ID |

---

## 4. 持久化路径与 SDK 自建 ID

京东云 iOS 侧公开的主身份路径是服务端 `eid` 和 token，而不是 Apple 原生稳定标识。

| 路径 | 状态 | 判断 |
|------|------|------|
| `eid` | 公开确认 | 服务端聚合设备唯一 ID；跨重装和恢复算法未公开 |
| `tk` | 公开确认 | token / 请求凭证；生命周期由 `tokenTime` / `tokenActTime` 描述 |
| `vttok` | 公开确认策略和 token 路径 | 策略下发引用，不是硬件 ID |
| `bizId` / `pin` / `tenantId` | 公开确认 | 业务、账号和租户绑定键 |
| Keychain / 本地持久化 | 未公开 | 非公开 = 仅作线索、不作结论 |
| P7 信封加密 | 公开确认 | 安全传输和 payload 保护，不是 ID |

与 Android 对照：Android 的 `BiometricService`、App 列表、人机数据、传感器策略和本地字段均可解释京东云有动态采集能力，但 iOS 侧只能确认同名策略字段和服务端返回，不能反推出原始字段。

---

## 5. 服务端衍生 ID 与风险能力

| 能力 | iOS 侧归位 | 说明 |
|------|------------|------|
| `eid` 高可靠生成和恢复算法 | 服务端聚合 ID | 底层输入和恢复条件未公开 |
| `tk` / token 生命周期 | SDK + 服务端 token | 与 `eid` 关联，失效和刷新边界需追问 |
| `vttok` 策略下发 | 服务端采集控制 | 控制采样、设备数据、人机数据和验证码策略 |
| `verifyCode` | 验证码联动 | 可能由风险策略触发滑块 / 验证 |
| `isStrategy` / `cltTime` / `cltFreq` / `isCltSens` / `cltDevice` | 采集策略维度 | iOS 是否完整支持各开关需公开确认 |
| `ise` / `ism` / `ish` / `isj` | 风险标签 | 模拟器、篡改、hook、越狱等服务端输出 |
| APP 多开 / 云手机 / 设备伪造 | 风险模型 | iOS trigger 未公开 |
| 传感器 / 人机数据 | 行为采集策略 | 原始触控、滑动、传感器范围未公开 |
| P7 信封加密 / SDK 加固 | 工程安全 | 防调试、逆向、篡改和加密上报 |
| 业务反欺诈模型 | 服务端模型 | 机器注册、批量登录、营销作弊、支付风险、刷榜刷单等 |

---

## 6. 公开资料缺口

非公开 = 仅作线索、不作结论。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | iOS SDK 实际采集字段清单 | 决定 IDFV、设备型号、系统版本、网络、传感器等是否进入模型 |
| Q-2 | `eid` 生成与恢复算法 | 决定跨重装、清数据、换账号后的稳定性 |
| Q-3 | `tk` 与 `eid` 生命周期关系 | 决定 token 失效后 `eid` 是否仍稳定 |
| Q-4 | `vttok` 策略下发在 iOS 的字段覆盖 | 决定传感器、人机、设备数据采集开关是否适用于 iOS |
| Q-5 | `cltTime` / `cltFreq` 采样规则 | 决定传感器采样强度和隐私风险 |
| Q-6 | `cltManMachine` 原始信号 | 决定触控、滑动、输入、传感器、人机行为是否采集 |
| Q-7 | `cltAppList` 是否适用于 iOS | iOS installed apps 枚举受限，不能照搬 Android |
| Q-8 | `ish` hook 覆盖范围 | 决定 Frida、Substrate、动态库注入等覆盖度 |
| Q-9 | `isj` 越狱检测规则 | 决定 jailbreak 检测深度和误判边界 |
| Q-10 | `ise` 模拟器 / 云手机覆盖范围 | 决定 iOS simulator、云真机、自动化环境识别能力 |
| Q-11 | P7 信封加密密钥管理 | 决定客户端密钥安全和轮换方式 |
| Q-12 | DeviceCheck / App Attest 是否使用 | 决定 Apple App 完整性是否参与判断 |
| Q-13 | 京东集团内部设备指纹复用关系 | 决定是否复用零售、金融、物流场景沉淀 |

---

## 7. 当前结论

京东云 iOS 侧最明确的稳定或准稳定链路是服务端 `eid`、`tk`、`tokenTime`、`tokenActTime`、`vttok` 策略下发，以及 `bizId` / `pin` / `tenantId` 绑定。`eid` 是服务端聚合设备 ID，不等同于 iOS 硬件标识；`tk` 是 token / 请求凭证。

京东云的差异化能力在动态策略下发和服务端风险标签：`verifyCode`、`isStrategy`、`cltTime`、`cltFreq`、`isCltSens`、`cltDevice`、`cltManMachine`、`cltAppList` 反映采集控制；`ise`、`isr`、`ism`、`ish`、`isj` 反映模拟器、root / 越狱、篡改、hook 等风险输出。

IDFV、IDFA、Keychain、UserDefaults / App Group、DeviceCheck / App Attest、APNs token 均未见公开确认。Android 侧的 App 列表、root、Android ID、OAID、包名、ROM 等不能迁移为 iOS 事实；只能作为同厂商跨端追问线索。
