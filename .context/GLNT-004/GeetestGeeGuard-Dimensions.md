# C-026 · 极验设备验 / GeeGuard 未实现维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-26 19:22:40
>
> 视角：极验设备验 / GeeGuard 厂商 LENS
> 来源：TASK-026
> 当前口径：以 `DeviceInfoRepository` 的实际实现为准，删除已实现字段，仅保留未实现字段、服务端衍生能力和公开资料缺口。

---

## 0. 整理口径

`DeviceInfoRepository` 已实现以下字段族，因此本文不再把这些字段作为极验设备验缺口保留：

- `BuildInfo` 中的品牌、型号、厂商、设备代号、产品名、Android 版本、SDK 版本、主板、硬件、显示版本、Build fingerprint、Build ID、Serial。
- `RomInfo` 中的主流厂商 ROM system property，包括 MIUI / HyperOS / EMUI / Magic / OPPO / OnePlus / Realme / Vivo / OneUI / Flyme / Smartisan / LeTV / Lenovo / Nubia / Oxygen / Harmony 相关属性。
- `IdentifierInfo` 中的 OAID、Android ID / SSAID、GAID、Widevine Device ID。
- `TelephonyInfo` 中的 IMEI / MEID 合并读取、IMSI、ICCID、MSISDN、本机号码、SIM / Network operator、SIM state、SIM operator name。

极验公开材料中的设备型号、设备品牌、系统平台、系统版本、AndroidID、OAID、IMEI、运营商名称、SIM 卡状态等字段，凡是已被当前代码覆盖的，不再作为基础字段缺口保留。

不保留 iOS-only 字段作为 Android 实现缺口。HarmonyOS / Web / 小程序字段只在确实代表当前 Android 代码没有覆盖的产品能力或公开资料缺口时保留。

---

## 1. 极验设备验产品定位

极验设备验 / GeeGuard 定位为设备指纹与设备风险识别服务。公开材料强调通过多维度设备弱特征因子生成稳定设备编号，并结合设备关系图谱、设备三维复核模型、风险数据库和业务规则能力输出风险结果。

与 `DeviceInfoRepository` 的差异在于：`DeviceInfoRepository` 当前主要采集 Android 本地基础标识、Build / ROM / Telephony 字段；GeeGuard 的差异化集中在 GeeToken / respondedGeeToken、300+ 弱特征因子聚合、云端设备编号、风险标签、设备关系图谱、虚拟设备 / 自动化设备 / 定制设备识别、IP / 手机号风险画像和服务端决策能力。

---

## 2. Android / Mobile 接入方式

极验公开材料中的接入形态：

| 形态 | 说明 |
|------|------|
| Native Android SDK | `geetest_geeguard_android_vx.y.z_date.aar`，通过 `GeeGuard.register` 初始化 |
| iOS SDK | iOS 端设备验 SDK |
| HarmonyOS Next SDK | `.har` 形式的 HarmonyOS SDK |
| Web / H5 SDK | Web 端设备指纹采集 |
| 微信小程序 / 小游戏 SDK | 小程序侧设备指纹采集 |
| Server API | 服务端查询 respondedGeeToken / geeToken 对应风险结果 |

当前 `DeviceInfoRepository` 没有接入 GeeGuard SDK，也没有 GeeToken、respondedGeeToken、极验服务端查询、风险标签解析或业务流水号绑定机制。

---

## 3. 未实现字段清单

### 3.1 GeeToken、设备编号与服务端回执

| 维度 | 极验公开表达 | 当前实现状态 | 备注 |
|------|--------------|--------------|------|
| GeeToken | 客户端 `fetchReceipt` 生成，约 4000 字符 | 未实现 | 当前没有极验 token |
| respondedGeeToken | `submitReceipt` 异步返回，约 1000 字符 | 未实现 | 当前没有服务端聚合回执 |
| 业务 data 绑定 | token 可绑定本次业务流水号或凭证 | 未实现 | 当前没有业务场景防剥离参数 |
| 设备唯一编号 | 通过设备弱特征因子生成稳定设备编号 | 未实现 | 当前没有极验设备 ID |
| token 降级链路 | 提交失败时可降级使用 GeeToken 查询 | 未实现 | 当前没有 SDK 错误降级 |
| 原始响应 | `receipt.originalResponse` | 未实现 | 当前没有极验原始响应保留 |

### 3.2 Android 未覆盖采集项

| 维度 | 极验公开表达 | 当前实现状态 | 备注 |
|------|--------------|--------------|------|
| 系统语言 | Android / iOS / HarmonyOS 字段 | 未实现 | 当前没有语言采集 |
| 屏幕高度 / 宽度 | Android / iOS / 小程序字段 | 未实现 | 当前没有屏幕尺寸采集 |
| 设备类型 | Android / iOS / HarmonyOS 字段 | 未实现 | 当前没有 phone / tablet 等类型判定 |
| 内存大小 | Android / iOS / HarmonyOS 字段 | 未实现 | 当前没有总内存 / 可用内存 |
| 设备名称 | Android / iOS / HarmonyOS 字段 | 未实现 | 当前没有用户设备名 |
| Wi-Fi SSID | Android / iOS 可配置字段 | 未实现 | 当前没有连接 Wi-Fi 名称 |
| Wi-Fi BSSID | Android / iOS 可配置字段 | 未实现 | 当前没有接入点 BSSID |
| 定位信息 | Android / iOS / HarmonyOS 可配置字段 | 未实现 | 当前没有粗定位 / 精确定位 |
| IP | Android / iOS / HarmonyOS / Web / 小程序字段 | 未实现 | 当前没有 IP 或出口网络画像 |
| 网络制式 | 3G / 4G / 5G 等 | 未实现 | 当前没有蜂窝网络制式 |
| 网络类型 | Wi-Fi / 移动网络 / 以太网等 | 未实现 | 当前没有网络类型 |
| 屏幕录制状态 | Android API 35+ `DETECT_SCREEN_RECORDING` | 未实现 | 当前没有屏幕录制检测 |

### 3.3 风险识别与异常环境

| 维度 | 极验公开表达 | 当前实现状态 | 备注 |
|------|--------------|--------------|------|
| 虚拟设备识别 | 识别虚拟设备、自动化设备、定制设备 | 未实现 | 当前没有模拟器 / 云手机判定 |
| 自动化设备识别 | 设备风险识别能力 | 未实现 | 当前没有自动化环境检测 |
| 定制设备识别 | 改机工具、云手机、定制设备 | 未实现 | 当前没有改机 / 定制设备检测 |
| Root 风险 | 设备风险标签能力 | 未实现 | 当前没有 root 检测 |
| 越狱风险 | iOS 侧风险能力，不作为 Android 字段缺口 | 未实现 | 仅保留为跨端公开能力 |
| 虚拟定位 | 风险工具覆盖项 | 未实现 | 当前没有位置欺骗检测 |
| 摄像头劫持 | 风险工具覆盖项 | 未实现 | 当前没有摄像头劫持检测 |
| 屏幕共享 / 录屏风险 | 风险工具覆盖项 | 未实现 | 当前没有屏幕共享风险标签 |
| 签名校验 | SDK / 风险环境能力 | 未实现 | 当前没有应用签名一致性检查 |
| 调试检测 | 不安全运行环境识别 | 未实现 | 当前没有 debug / attach 检测 |
| 篡改检测 | 多种类型篡改检测 | 未实现 | 当前没有注入、重打包、Hook 检测 |
| 在线特征更新 | 支持在线更新检测特征 | 未实现 | 当前没有动态下发检测规则 |

### 3.4 服务端模型、画像与风险库

| 维度 | 极验公开表达 | 当前实现状态 | 备注 |
|------|--------------|--------------|------|
| 300+ 设备弱特征因子 | SDK 聚合并上送 | 未实现 | 当前只有少量本地基础字段 |
| 设备关系图谱 | 用于识别设备风险 | 未实现 | 当前没有图谱关系 |
| 设备三维复核模型 | 识别虚拟设备、自动化设备、定制设备 | 未实现 | 当前没有三维复核 |
| 风险标签 | 实时输出设备风险标签和风险状态 | 未实现 | 当前没有极验标签体系 |
| 手机号风险识别 | 输入手机号获取画像标签 | 未实现 | 当前没有手机号画像 |
| IP 风险识别 | 日均百万级风险 IP 库更新 | 未实现 | 当前没有 IP 风险库 |
| 风险工具样本库 | 覆盖数千款改机工具、云手机、模拟器、虚拟定位工具 | 未实现 | 当前没有样本库匹配 |
| 决策引擎 | 极验决策引擎 / 业务规则编排 | 未实现 | 当前没有服务端规则引擎 |

### 3.5 Web / 小程序公开字段

| 维度 | 极验公开表达 | 当前实现状态 | 备注 |
|------|--------------|--------------|------|
| Web 屏幕颜色比特值 | `screen.colorDepth` | 未实现 | 当前 Android 代码没有 Web 指纹 |
| Web 屏幕色彩范围 | `screen.colorGamut` | 未实现 | 当前没有 Web 色域 |
| Web 高对比度 / 强制色彩 | 无障碍 / CSS media query | 未实现 | 当前没有 Web 可访问性状态 |
| Web cookies / localStorage / sessionStorage / indexedDB | 存储能力状态 | 未实现 | 当前没有 Web 存储能力 |
| Web CPU 核心数 / 内存大小 | `hardwareConcurrency` / `deviceMemory` | 未实现 | 当前没有 Web runtime 字段 |
| Web 插件、UA、referer | 浏览器环境字段 | 未实现 | 当前没有浏览器指纹 |
| 小程序设备电量 / 充电状态 | 小程序端字段 | 未实现 | 当前 Android 代码没有电量状态 |

### 3.6 HarmonyOS 公开字段

| 维度 | 极验公开表达 | 当前实现状态 | 备注 |
|------|--------------|--------------|------|
| ODID | HarmonyOS 字段 | 未实现 | 非 Android 字段，作为鸿蒙公开资料缺口保留 |
| HarmonyOS 持久化存储权限 | `STORE_PERSISTENT_DATA` | 未实现 | 当前没有鸿蒙 SDK |
| HarmonyOS App Tracking Consent | 用于 OAID 授权 | 未实现 | 当前没有鸿蒙授权链路 |

---

## 4. 公开资料缺口

极验公开材料披露了合规字段、接入方式和风险能力，但关键算法和服务端输出仍不透明。以下缺口应作为后续是否实现的追问项。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | GeeToken / respondedGeeToken 生成结构 | 决定 token 是否绑定设备、业务事件、时间窗口和 App |
| Q-2 | 300+ 弱特征因子全集 | 决定当前 Android 代码距离极验采集面差多少 |
| Q-3 | 设备唯一编号生命周期 | 决定跨重装、清数据、换网络、换账号后的稳定性 |
| Q-4 | 风险标签完整枚举 | 决定服务端结果能否落入本地统一风险 schema |
| Q-5 | 设备关系图谱字段 | 决定设备、账号、手机号、IP、行为之间如何关联 |
| Q-6 | 设备三维复核模型输入 | 决定虚拟设备、自动化设备、定制设备的判定来源 |
| Q-7 | IP 风险库标签 | 决定代理、机房、秒拨、黑产 IP 如何区分 |
| Q-8 | 手机号画像标签 | 决定手机号风险是否属于设备维度还是账号维度 |
| Q-9 | 风险工具样本覆盖清单 | 决定改机工具、云手机、模拟器和虚拟定位的覆盖边界 |
| Q-10 | Android SDK 实际采集字段 | 合规字段表不等于 SDK 内部全部信号 |
| Q-11 | 在线特征更新协议 | 决定端侧规则是否可动态变化 |
| Q-12 | Web / Android / HarmonyOS 指纹合并方式 | 决定跨端设备身份是否能统一 |

---

## 5. 当前结论

按 `DeviceInfoRepository` 当前实现，极验公开材料中与品牌、型号、厂商、Android 版本、SDK 版本、ROM 属性、OAID、Android ID、GAID、Widevine、IMEI / MEID、IMSI、ICCID、运营商、SIM 状态相关的本地基础字段不再作为缺口保留。

当前仍有价值的极验缺口集中在六类：

1. GeeGuard token 链路：GeeToken、respondedGeeToken、业务 data 绑定、设备编号、降级查询、原始响应。
2. Android 未覆盖基础环境：语言、屏幕、设备类型、内存、设备名称、Wi-Fi、定位、IP、网络制式、网络类型、屏幕录制状态。
3. 风险环境：虚拟设备、自动化设备、定制设备、Root、虚拟定位、摄像头劫持、屏幕共享、签名、调试、篡改、在线特征更新。
4. 服务端能力：300+ 弱特征因子、设备关系图谱、三维复核模型、风险标签、手机号画像、IP 风险库、风险工具样本库、决策引擎。
5. Web / 小程序指纹：屏幕色彩、存储能力、浏览器环境、UA、referer、电量和充电状态。
6. HarmonyOS 公开资料缺口：ODID、持久化存储权限、App Tracking Consent。
