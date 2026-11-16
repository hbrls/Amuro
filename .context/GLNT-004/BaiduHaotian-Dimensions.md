# C-025 · 百度智能云风控 / 昊天镜 未实现维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-26 19:56:41
>
> 视角：百度智能云风控 / 昊天镜 厂商 LENS
> 来源：TASK-025
> 当前口径：以 `DeviceInfoRepository` 的实际实现为准，删除已实现字段，仅保留未实现字段、服务端衍生能力和公开资料缺口。

---

## 0. 整理口径

`DeviceInfoRepository` 已实现以下字段族，因此本文不再把这些字段作为百度智能云缺口保留：

- `BuildInfo` 中的品牌、型号、厂商、设备代号、产品名、Android 版本、SDK 版本、主板、硬件、显示版本、Build fingerprint、Build ID、Serial。
- `RomInfo` 中的主流厂商 ROM system property，包括 MIUI / HyperOS / EMUI / Magic / OPPO / OnePlus / Realme / Vivo / OneUI / Flyme / Smartisan / LeTV / Lenovo / Nubia / Oxygen / Harmony 相关属性。
- `IdentifierInfo` 中的 OAID、Android ID / SSAID、GAID、Widevine Device ID。
- `TelephonyInfo` 中的 IMEI / MEID 合并读取、IMSI、ICCID、MSISDN、本机号码、SIM / Network operator、SIM state、SIM operator name。

百度智能云 API 入参中的 IMEI、IMSI、MAC、设备型号、App 版本、UA、Wi-Fi BSSID / SSID、网络类型、GPS 经纬度等字段，凡是已被当前代码或前序通用实现覆盖的，不再作为基础字段缺口保留。本文只保留当前代码没有等价实现的昊天镜 ztoken、设备指纹 ID、风险标签、业务保护 API、威胁情报和服务端模型能力。

不保留 iOS-only 字段作为 Android 实现缺口。

---

## 1. 百度智能云产品定位

百度智能云业务安全风控 AFD 定位为全链路业务安全风控防御体系。昊天镜是其中的设备指纹 / 设备风险服务，通过 Android / iOS / JS SDK 生成 ztoken，服务端 API 查询设备指纹 ID、设备风险标签和业务风险等级。

核心能力分为六层：

| 层级 | 公开表达 | 与当前实现的差异 |
|------|----------|------------------|
| 昊天 SDK | Android Haotian SDK 生成 ztoken | 当前没有 ztoken |
| 设备风险查询 | `x` 设备指纹 ID、`t` 设备风险标签 | 当前没有昊天镜设备 ID 和标签 |
| 业务保护 API | 注册、登录、活动防刷、渠道反作弊 | 当前没有业务风控 API |
| 威胁情报 | 黑产资源、攻击手段、威胁情报分析 | 当前没有威胁情报 |
| 设备库 | 20 亿+ 设备库、8 亿+ 活跃设备 | 当前没有设备库匹配 |
| AI 风控模型 | 实时 + 离线风控、无监督模型、全链路关联分析 | 当前没有服务端模型 |

与 `DeviceInfoRepository` 的差异在于：`DeviceInfoRepository` 当前主要采集 Android 本地基础标识、Build / ROM / Telephony 字段；百度智能云的差异化集中在 ztoken、云端设备指纹 ID、设备风险标签、H5 指纹、业务风险等级、注册 / 登录 / 活动 / 渠道反作弊 API、威胁情报和设备风险画像。

---

## 2. Android / Mobile 接入方式

百度智能云公开材料中的接入形态：

| 形态 | 说明 |
|------|------|
| Native Android SDK | Haotian SDK，`HTH.init`、`HTH.start`、`HTH.gzfi` |
| iOS SDK | `libHSDKLib.a` + `HSDKLib.h` |
| JavaScript SDK | H5、百度小程序、微信小程序 |
| 反爬 JS-SDK | 单独反爬服务 |
| 设备风险查询 API | `/rcs/factor-saas` |
| 业务保护 API | `/rcs/sync-saas`，按 `sc` 区分业务场景 |
| Server SDK | Java / PHP / Python / C# / Node.js |
| 认证机制 | bce-auth-v1 + SHA256 签名 |

当前 `DeviceInfoRepository` 没有接入 Haotian SDK，也没有 ztoken、bce-auth-v1、`factor-saas` / `sync-saas` API 或 JS SDK。

---

## 3. 未实现字段清单

### 3.1 ztoken、设备指纹 ID 与 H5 指纹

| 维度 | 百度公开表达 | 当前实现状态 | 备注 |
|------|--------------|--------------|------|
| ztoken | Android SDK 生成，禁止缓存 | 未实现 | 当前没有 ztoken |
| 本地默认 ztoken | 未初始化、无网、超时等 fallback | 未实现 | 当前没有默认 ztoken |
| 云端 ztoken | resultCode=1 云端指纹生成成功 | 未实现 | 当前没有云端 ztoken |
| `x` 设备指纹 ID | 设备风险查询 API 出参 | 未实现 | 当前没有昊天镜设备 ID |
| `jt` | JS SDK 颁发，带特殊字符，不可缓存 | 未实现 | 当前没有 JS token |
| `jid` | H5 设备指纹 ID | 未实现 | 当前没有 H5 指纹 |
| `jtag` | H5 设备风险标签 | 未实现 | 当前没有 H5 风险标签 |
| 多进程 HaotianService / Provider | 多进程支持 | 未实现 | 当前没有 SDK 多进程配置 |

### 3.2 设备风险和业务风险输出

| 维度 | 百度公开表达 | 当前实现状态 | 备注 |
|------|--------------|--------------|------|
| 设备风险标签 `t` | 示例 `jailbreak`、`inject`、`repkg` | 未实现 | 当前没有百度设备标签 |
| 业务风险等级 | `ret_data.level` 1-4 | 未实现 | 当前没有业务风险等级 |
| 业务风险标签 | 业务保护 API 出参 `t` | 未实现 | 当前没有业务风险标签 |
| `request_id` | 服务端请求 ID | 未实现 | 当前没有请求追踪 |
| `ret_code` / `ret_msg` | 服务端状态码 | 未实现 | 当前没有百度 API 状态处理 |
| 安全环境扫描 | `host_call_env` 3300-3400 触发 | 未实现 | 当前没有安全环境扫描 |

### 3.3 业务保护 API 与场景上下文

| 维度 | 百度公开表达 | 当前实现状态 | 备注 |
|------|--------------|--------------|------|
| 注册保护 | `sc=account_register` | 未实现 | 当前没有注册风控 |
| 登录保护 | `sc=account_login` | 未实现 | 当前没有登录风控 |
| 活动防刷 | 营销活动 API | 未实现 | 当前没有活动防刷 |
| 渠道反作弊 | 渠道推广流量作弊 | 未实现 | 当前没有渠道反作弊 |
| 反爬服务 | JS-SDK | 未实现 | 当前没有反爬 |
| 登录方式 | password / sms / onepass / other | 未实现 | 当前没有登录方式上下文 |
| 登录账户类型 | mobile / userid / email / username / other | 未实现 | 当前没有账号类型上下文 |
| 登录结果和失败原因 | `lr` / `fr` | 未实现 | 当前没有登录成败上下文 |
| 安全验证码通过状态 | `sv` | 未实现 | 当前没有验证码上下文 |
| 注册时间和注册 IP | `rts` / `rip` | 未实现 | 当前没有注册历史上下文 |

### 3.4 威胁情报、设备库与服务端模型

| 维度 | 百度公开表达 | 当前实现状态 | 备注 |
|------|--------------|--------------|------|
| 20 亿+ 设备库 | 昊天镜账号安全保护 | 未实现 | 当前没有百度设备库 |
| 8 亿+ 活跃设备 | 海量数据全端覆盖 | 未实现 | 当前没有活跃设备库 |
| 风险设备画像 | 多维设备风险画像 | 未实现 | 当前没有设备画像 |
| 威胁情报分析 | 黑产攻击资源和攻击手段 | 未实现 | 当前没有威胁情报 |
| 黑卡账号识别 | 黑卡账号、垃圾注册、扫号撞库 | 未实现 | 当前没有黑卡模型 |
| 网络风险识别 | 代理 IP、秒播 IP、机房 IP | 未实现 | 当前没有网络风险识别 |
| 行为异常识别 | 多维策略模型 | 未实现 | 当前没有行为异常模型 |
| 实时 + 离线风控引擎 | 双重防护 | 未实现 | 当前没有双引擎 |
| 全链路关联分析 | 全流程关联 | 未实现 | 当前没有关联分析 |
| 无监督风控模型 | 前沿人工智能 | 未实现 | 当前没有无监督模型 |

### 3.5 SDK 工程、安全与认证链路

| 维度 | 百度公开表达 | 当前实现状态 | 备注 |
|------|--------------|--------------|------|
| AppKey / SecretKey 绑定 | 包名 + 签名唯一关联 | 未实现 | 当前没有百度密钥绑定 |
| 用户隐私同意开关 | `HTH.setAgreePolicy` | 未实现 | 当前没有 SDK 同意开关 |
| GzfiCallback | 异步 ztoken 回调 | 未实现 | 当前没有回调机制 |
| Callback 移除 | 防止内存泄漏 | 未实现 | 当前没有回调生命周期管理 |
| bce-auth-v1 | Access Key + Secret + SHA256 | 未实现 | 当前没有 BCE 签名 |
| SDK 内部错误码 | -1 到 -6 | 未实现 | 当前没有错误码处理 |

---

## 4. 公开资料缺口

百度智能云公开 API 入参完整，但客户端 SDK 内部采集字段、风险标签全集和设备 ID 生成算法不透明。以下缺口应作为后续是否实现的追问项。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | 设备风险标签完整枚举 | 当前仅示例 `jailbreak` / `inject` / `repkg` |
| Q-2 | ztoken 生成算法 | 决定 ztoken 是否绑定设备、账号、事件还是时序 |
| Q-3 | `x` 设备指纹 ID 生命周期 | 决定跨重装、清数据、换账号、换网络后的连续性 |
| Q-4 | Android SDK 实际采集字段 | API 入参不等于 SDK 内部字段 |
| Q-5 | 本地默认 ztoken 可信度 | 决定无网、超时、云服务错误时的风控价值 |
| Q-6 | 安全环境扫描检测项 | 决定 `host_call_env` 触发哪些本地检查 |
| Q-7 | 威胁情报输入 | 决定黑产资源、攻击手段如何映射到设备标签 |
| Q-8 | 设备库匹配规则 | 决定 20 亿+ 设备库如何生成风险结果 |
| Q-9 | 网络风险识别方法 | 决定代理 IP、秒播 IP、机房 IP 的判定来源 |
| Q-10 | 业务风险等级 reason code | 决定 level 1-4 是否可解释 |
| Q-11 | H5 指纹与 Android 指纹关联 | 决定 jt / jid 与 ztoken / x 是否能跨端合并 |
| Q-12 | bce-auth-v1 请求签名集成细节 | 决定服务端调用安全性 |

---

## 5. 当前结论

按 `DeviceInfoRepository` 当前实现，百度智能云公开材料中与品牌、型号、厂商、Android 版本、SDK 版本、ROM 属性、OAID、Android ID、GAID、Widevine、IMEI / MEID、IMSI、ICCID、运营商相关的本地基础字段不再作为缺口保留。

当前仍有价值的百度智能云缺口集中在五类：

1. ztoken 和设备指纹：ztoken、本地默认 ztoken、云端 ztoken、`x`、`jt`、`jid`、`jtag`、多进程服务。
2. 风险输出：设备风险标签、业务风险等级、业务风险标签、请求 ID、状态码、安全环境扫描。
3. 业务场景：注册保护、登录保护、活动防刷、渠道反作弊、反爬、登录方式、账号类型、登录结果、验证码、注册历史。
4. 服务端模型：设备库、活跃设备库、风险设备画像、威胁情报、黑卡、网络风险、行为异常、实时 / 离线引擎、关联分析、无监督模型。
5. SDK 和认证链路：AppKey / SecretKey、隐私同意开关、异步回调、回调移除、bce-auth-v1、SDK 错误码。
