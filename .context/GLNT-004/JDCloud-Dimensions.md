# C-020 · 京东云设备指纹 未实现维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-26 19:23:40
>
> 视角：京东云设备指纹 厂商 LENS
> 来源：TASK-020
> 当前口径：以 `DeviceInfoRepository` 的实际实现为准，删除已实现字段，仅保留未实现字段、服务端衍生能力和公开资料缺口。

---

## 0. 整理口径

`DeviceInfoRepository` 已实现以下字段族，因此本文不再把这些字段作为京东云缺口保留：

- `BuildInfo` 中的品牌、型号、厂商、设备代号、产品名、Android 版本、SDK 版本、主板、硬件、显示版本、Build fingerprint、Build ID、Serial。
- `RomInfo` 中的主流厂商 ROM system property，包括 MIUI / HyperOS / EMUI / Magic / OPPO / OnePlus / Realme / Vivo / OneUI / Flyme / Smartisan / LeTV / Lenovo / Nubia / Oxygen / Harmony 相关属性。
- `IdentifierInfo` 中的 OAID、Android ID / SSAID、GAID、Widevine Device ID。
- `TelephonyInfo` 中的 IMEI / MEID 合并读取、IMSI、ICCID、MSISDN、本机号码、SIM / Network operator、SIM state、SIM operator name。

京东云公开材料没有列出 Android SDK 明文字段清单，请求体走 P7 信封加密。本文不根据未公开字段补写基础 ID / Build / Telephony 缺口，只保留公开 API 返回、策略下发、风险标签、服务端模型和 SDK 工程能力中当前代码没有等价实现的部分。

不保留 iOS-only 字段作为 Android 实现缺口。

---

## 1. 京东云产品定位

京东云设备指纹定位为反欺诈 SDK，通过 Android / iOS / JS SDK 采集设备数据，并由服务端生成设备唯一 ID、token、采集策略和风险标签。公开材料强调京东集团零售、金融、物流场景沉淀，以及对机器注册、批量登录、营销作弊、支付风险、内容盗爬、刷榜刷单和虚假裂变的实时防御。

核心能力分为六层：

| 层级 | 公开表达 | 与当前实现的差异 |
|------|----------|------------------|
| 设备唯一 ID | `eid`，自研高可靠生成和恢复算法 | 当前没有京东云 eid |
| Token | `tk`、`tokenTime`、`tokenActTime` | 当前没有京东云 token 生命周期 |
| 策略下发 | `vttok` 下发采集策略、传感器采集、App 列表采集 | 当前没有服务端动态采集策略 |
| 风险标签 | `ise`、`isr`、`ism`、`ish`、`isj` | 当前没有京东云风险标签 |
| SDK 防护 | P7 信封加密、代码和资源加固 | 当前没有京东云 SDK 加固链路 |
| 业务反欺诈 | 黑手机卡、猫池、改机、模拟器、多开、代理 IP | 当前没有京东云业务风控模型 |

与 `DeviceInfoRepository` 的差异在于：`DeviceInfoRepository` 当前主要采集 Android 本地基础标识、Build / ROM / Telephony 字段；京东云的差异化集中在服务端稳定设备 ID、token、策略下发、传感器采集控制、人机数据采集、App 列表采集、P7 加密、root / hook / 模拟器 / 篡改标签，以及京东业务场景的反欺诈模型。

---

## 2. Android / Mobile 接入方式

京东云公开材料中的接入形态：

| 形态 | 说明 |
|------|------|
| Native Android SDK | `BiometricService`，通过 `startBiometric` 采集设备信息，通过 `getToken` 获取 token |
| Server API `device` | 采集设备信息并上报，返回 `DeviceRespBody` |
| Server API `vttok` | 策略下发和 token，返回 `PolicyRespBody` |
| P7 信封加密 | 请求体 `{ data: String }` 为加密数据 |
| 业务参数 | `bizId` 必填，`pin` 用户唯一标识，`tenantId` Android 签名中出现 |
| JS SDK | PC 和移动端两套 JS |
| 控制台业务管理 | 管理业务 ID |

当前 `DeviceInfoRepository` 没有接入京东云 SDK，也没有 `device` / `vttok` OpenAPI、P7 加密、bizId / pin / tenantId 绑定或策略下发。

---

## 3. 未实现字段清单

### 3.1 设备 ID、Token 与生命周期

| 维度 | 京东云公开表达 | 当前实现状态 | 备注 |
|------|----------------|--------------|------|
| `eid` | 设备唯一性 ID | 未实现 | 当前没有京东云服务端聚合设备 ID |
| 高可靠生成和恢复算法 | 自研算法生成全球唯一设备 ID | 未实现 | 当前没有服务端恢复算法 |
| `tk` | 根据 eid 获取到的 token | 未实现 | 当前没有京东云 token |
| `tokenTime` | token 生成时间 | 未实现 | 当前没有 token 生成时间 |
| `tokenActTime` | token 有效时间 | 未实现 | 当前没有 token 有效窗口 |
| `pin` 绑定 | 用户唯一标识 | 未实现 | 当前没有用户 ID 与设备指纹绑定 |
| `bizId` 绑定 | 业务唯一标识 | 未实现 | 当前没有业务 ID 绑定 |
| `tenantId` | Android 签名中出现 | 未实现 | 当前没有租户维度 |

### 3.2 服务端策略下发与采集控制

| 维度 | 京东云公开表达 | 当前实现状态 | 备注 |
|------|----------------|--------------|------|
| `verifyCode` | 滑块验证码类型 | 未实现 | 当前没有验证码类型下发 |
| `isStrategy` | 是否下发传感器采集策略 | 未实现 | 当前没有服务端采集策略 |
| `cltTime` | 总采集时间，毫秒 | 未实现 | 当前没有采集时长控制 |
| `cltFreq` | 采集频率，N 毫秒一次 | 未实现 | 当前没有采样频率控制 |
| `isCltSens` | 是否执行采集传感器 | 未实现 | 当前没有传感器采集开关 |
| `cltDevice` | 是否采集设备数据 | 未实现 | 当前没有设备数据采集开关 |
| `cltManMachine` | 是否采集人机数据，Android only | 未实现 | 当前没有人机行为采集开关 |
| `cltAppList` | 是否采集 App 列表，Android only | 未实现 | 当前没有 App 列表采集开关 |

### 3.3 服务端风险标签

| 维度 | 京东云公开表达 | 当前实现状态 | 备注 |
|------|----------------|--------------|------|
| `ise` | 是否模拟器 | 未实现 | 当前没有模拟器检测 |
| `isr` | 是否 root | 未实现 | 当前没有 root 检测 |
| `ism` | 是否篡改 | 未实现 | 当前没有设备篡改检测 |
| `ish` | 是否被 hook | 未实现 | 当前没有 hook 检测 |
| `isj` | 是否越狱 | 未实现 | iOS 语境为主，不作为 Android 本地字段；作为服务端标签保留 |
| APP 多开检测 | 产品功能明示 | 未实现 | 当前没有多开环境检测 |
| 云手机检测 | 产品功能明示 | 未实现 | 当前没有云手机检测 |
| 设备伪造识别模型 | 设备风险识别 | 未实现 | 当前没有服务端伪造识别模型 |

### 3.4 传感器、人机与 App 列表采集

| 维度 | 京东云公开表达 | 当前实现状态 | 备注 |
|------|----------------|--------------|------|
| 传感器策略采集 | `isStrategy` / `isCltSens` / `cltTime` / `cltFreq` | 未实现 | 当前没有服务端控制的传感器采样 |
| 人机数据采集 | `cltManMachine` | 未实现 | 当前没有触控、输入、滑动、传感行为采集 |
| App 列表采集 | `cltAppList` | 未实现 | 当前没有 installed apps 枚举 |
| 采集设备数据总开关 | `cltDevice` | 未实现 | 当前没有服务端采集总开关 |
| 滑块验证联动 | `verifyCode` | 未实现 | 当前没有风险触发验证码 |

### 3.5 SDK 加固、安全传输与工程能力

| 维度 | 京东云公开表达 | 当前实现状态 | 备注 |
|------|----------------|--------------|------|
| P7 信封加密 | API 请求 `{ data: String }` | 未实现 | 当前没有 P7 加密 payload |
| SDK 代码安全 | 防止破解、调试、逆向、篡改 | 未实现 | 当前没有京东云 SDK 加固 |
| 资源数据文件安全 | 全方位加固保护 | 未实现 | 当前没有资源保护 |
| 客户端字段加密上报 | SDK 内部字段不明文公开 | 未实现 | 当前没有加密上送 |
| JS SDK 设备指纹 | PC / mobile 两套 JS | 未实现 | 当前没有 Web / H5 指纹 |

### 3.6 业务反欺诈场景

| 维度 | 京东云公开表达 | 当前实现状态 | 备注 |
|------|----------------|--------------|------|
| 机器注册 | 全路径布控 | 未实现 | 当前没有机器注册识别 |
| 批量登录 | 全栈实时防御 | 未实现 | 当前没有批量登录识别 |
| 营销作弊 | 营销场景防刷 | 未实现 | 当前没有营销作弊模型 |
| 支付交易风险 | 支付风险识别 | 未实现 | 当前没有交易风险上下文 |
| 内容盗爬 | 内容被盗爬 | 未实现 | 当前没有爬虫 / 盗爬模型 |
| 刷榜刷单 | 刷榜刷单 | 未实现 | 当前没有刷量 / 刷单检测 |
| 虚假用户裂变 | 虚假裂变 | 未实现 | 当前没有裂变作弊模型 |
| 黑手机卡 | 批量注册对抗目标 | 未实现 | 当前没有黑卡模型 |
| 猫池 / 接打码平台 | 批量注册对抗目标 | 未实现 | 当前没有猫池 / 接码平台识别 |
| 代理 IP / 秒播 IP | 规避风控策略 | 未实现 | 当前没有代理 IP / 秒播 IP 检测 |

---

## 4. 公开资料缺口

京东云公开材料最大缺口是 Android SDK 实际采集字段不公开，API 只暴露服务端聚合字段和策略字段。以下缺口应作为后续是否实现的追问项。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | Android SDK 实际采集字段清单 | 决定 `BiometricService.startBiometric` 采集哪些本地字段 |
| Q-2 | `eid` 生成与恢复算法 | 决定跨重装、清数据、换 SIM、换账号后的稳定性 |
| Q-3 | `tk` 与 `eid` 生命周期关系 | 决定 token 失效后 eid 是否仍稳定 |
| Q-4 | `cltTime` / `cltFreq` 单位和策略 | 决定采样强度和风控触发条件 |
| Q-5 | `cltManMachine` 原始信号 | 决定是否采集触控、滑动、按键、传感器、人机行为 |
| Q-6 | `cltAppList` 采集范围 | 决定 Android 11+ package visibility 下如何处理 |
| Q-7 | `ish` hook 覆盖工具 | 决定 Frida、Xposed、Magisk Hide、Substrate 等覆盖度 |
| Q-8 | `ise` 模拟器覆盖度 | 决定 Android Emulator、Genymotion、BlueStacks、云模拟器覆盖度 |
| Q-9 | APP 多开检测覆盖度 | 决定双开助手、VirtualXposed、Parallel Space 等覆盖度 |
| Q-10 | 云手机检测覆盖范围 | 决定华为云手机、阿里云手机、红手指、河马云手机等覆盖度 |
| Q-11 | P7 信封加密密钥管理 | 决定客户端密钥如何安全存储和轮换 |
| Q-12 | SDK 抗逆向实现 | 决定 DEX 混淆、SO 加固、反调试、字符串加密覆盖范围 |
| Q-13 | `verifyCode` 触发条件 | 决定验证码是 eid 命中、行为异常、IP 异常还是业务策略触发 |
| Q-14 | 京东集团内部设备指纹复用关系 | 决定是否复用京东、京东金融、物流场景沉淀 |

---

## 5. 当前结论

按 `DeviceInfoRepository` 当前实现，京东云公开材料中与品牌、型号、厂商、Android 版本、SDK 版本、ROM 属性、OAID、Android ID、GAID、Widevine、IMEI / MEID、IMSI、ICCID、运营商相关的本地基础字段不再作为缺口保留。

当前仍有价值的京东云缺口集中在六类：

1. 设备 ID 与 token：`eid`、高可靠生成和恢复算法、`tk`、`tokenTime`、`tokenActTime`、`pin`、`bizId`、`tenantId`。
2. 策略下发：`verifyCode`、`isStrategy`、`cltTime`、`cltFreq`、`isCltSens`、`cltDevice`、`cltManMachine`、`cltAppList`。
3. 服务端风险标签：`ise`、`isr`、`ism`、`ish`、`isj`、APP 多开、云手机、设备伪造识别模型。
4. 传感器、人机与 App 列表：传感器策略采集、人机数据采集、App 列表采集、采集总开关、滑块验证联动。
5. SDK 防护：P7 信封加密、代码安全、资源数据文件安全、加密上报、JS SDK 设备指纹。
6. 业务反欺诈：机器注册、批量登录、营销作弊、支付风险、内容盗爬、刷榜刷单、虚假裂变、黑手机卡、猫池 / 接码平台、代理 IP / 秒播 IP。
