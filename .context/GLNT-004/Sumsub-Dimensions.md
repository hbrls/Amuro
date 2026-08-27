# C-012 · Sumsub 未实现维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-26 18:18:20
>
> 视角：Sumsub 厂商 LENS
> 来源：TASK-012
> 当前口径：以 `DeviceInfoRepository` 的实际实现为准，删除已实现字段，仅保留未实现字段、服务端衍生能力和公开资料缺口。

---

## 0. 整理口径

`DeviceInfoRepository` 已实现以下字段族，因此本文不再把这些字段作为 Sumsub 缺口保留：

- `BuildInfo` 中的品牌、型号、厂商、设备代号、产品名、Android 版本、SDK 版本、主板、硬件、显示版本、Build fingerprint、Build ID、Serial。
- `RomInfo` 中的主流厂商 ROM system property，包括 MIUI / HyperOS / EMUI / Magic / OPPO / OnePlus / Realme / Vivo / OneUI / Flyme / Smartisan / LeTV / Lenovo / Nubia / Oxygen / Harmony 相关属性。
- `IdentifierInfo` 中的 OAID、Android ID / SSAID、GAID、Widevine Device ID。
- `TelephonyInfo` 中的 IMEI / MEID 合并读取、IMSI、ICCID、MSISDN、本机号码、SIM / Network operator、SIM state、SIM operator name。

Sumsub 公开材料对 Android native 原始字段披露较少，更多暴露 Device Intelligence / Fisherman、risk labels、Advanced IP、Behavior Monitoring、Fraud Network 和 applicant risk score。本文只保留当前代码没有等价字段、检测方法或服务端模型的部分。

不保留 iOS-only 字段作为 Android 实现缺口；例如 `jailbroken` 属于 iOS 语境，本文不列入 Android 待实现字段。

---

## 1. Sumsub 产品定位

Sumsub 将 Device Intelligence 放在 Fraud Prevention / Pre-KYC Risk Assessment / Behavior Monitoring / Transaction Monitoring 的组合体系里，而不是单一 Android ID 或单一设备指纹 SDK。

核心能力分为六层：

| 层级 | 公开表达 | 与当前实现的差异 |
|------|----------|------------------|
| Device Intelligence | 通过 `@sumsub/fisherman` / Fisherman 模块采集 device fingerprint，并输出 risk labels | 当前没有 Fisherman、fingerprint、visitorId 或 risk labels |
| Android SDK Fisherman module | Android SDK 1.43.0 起默认包含 Fisherman Device Intelligence 模块 | 当前没有 Sumsub SDK 模块启用状态或 Android native Device Intelligence 链路 |
| Pre-KYC Fraud Risk Assessment | sign-up / login / onboarding 阶段用 device、IP、email、phone、fraud network、risk score 做早期风险判断 | 当前没有 pre-KYC 多信号评分 |
| Advanced IP Check | IP、risk level、abuse velocity、connection type、location、timezone、ISP、org、proxy、VPN、TOR | 当前没有 IP 风险画像 |
| Behavior Monitoring | user platform events、captured device、IP data、custom properties、rules engine、risk score | 当前没有行为事件流或 captured device 绑定 |
| Fraud Network Detection | blocked users、related accounts、shared devices、similar patterns | 当前没有服务端设备图谱或多账号关联模型 |

与 `DeviceInfoRepository` 的差异在于：`DeviceInfoRepository` 当前主要采集 Android 本地基础标识、Build / ROM / Telephony 字段；Sumsub 的核心差异化集中在 device fingerprint、risk labels、sessionId 连续性、captured device 事件绑定、Advanced IP、Behavior Monitoring、Fraud Network 和 applicant risk score。

---

## 2. Android / Mobile 接入方式

Sumsub 公开材料中的接入形态：

| 形态 | 说明 |
|------|------|
| JavaScript Device Intelligence SDK | NPM 包 `@sumsub/fisherman`，初始化后调用 `fingerprint()` |
| Device Intelligence access token | 后端调用 `/resources/accessTokens/behavior`，传入 `sessionId`，返回 access token |
| Captured device submit | 创建 applicant、发送 user platform event、发送 financial transaction 时携带 captured device |
| Android SDK Fisherman module | Android SDK 1.43.0 起默认包含 Fisherman；可排除 `idensic-mobile-sdk-fisherman` 以禁用 |
| MobileSDK verification flow | MobileSDK 管理 camera、microphone、geolocation 等硬件访问 |
| Behavior Monitoring API | user platform event payload 示例含 `device.coords`、`ipInfo`、`userAgent`、`sessionId`、`fingerprint`、`sessionAgeMs`、`acceptLang` |

当前 `DeviceInfoRepository` 没有接入 Sumsub SDK，也没有 Device Intelligence access token、captured device、behavior event 或 applicant risk score 链路。

---

## 3. 未实现字段清单

### 3.1 Device Intelligence / Fisherman

| 维度 | Sumsub 公开字段 / 表达 | 当前实现状态 | 备注 |
|------|------------------------|--------------|------|
| Fisherman module enabled | Android SDK 1.43.0 起默认包含 Fisherman | 未实现 | 当前没有 Sumsub SDK 模块状态 |
| Fingerprint | JS SDK / 行为事件中的 device fingerprint | 未实现 | 当前没有 Web / native fingerprint 字段 |
| VisitorId | simulation config 中 `visitorId` | 未实现 | browser/device 级标识，不等同稳定硬件 ID |
| SessionId | access token 请求参数 | 未实现 | 当前没有 Sumsub session 连续性引用 |
| Session age | `sessionAgeMs` | 未实现 | 当前没有 session 年龄或生命周期 |
| Access token continuity | token refresh 建议保持同一 `sessionId` | 未实现 | 当前没有旧 session 与新采集信号关联模型 |
| Risk labels aggregate | Device Intelligence 输出 risk labels | 未实现 | 当前没有风险标签集合 |

### 3.2 Android / Mobile 风险标签

| 维度 | Sumsub risk label | 当前实现状态 | 备注 |
|------|-------------------|--------------|------|
| Android emulator | `emulator` | 未实现 | 当前没有模拟器硬件不一致、Build 异常、驱动或传感器缺失检测 |
| Rooted device | `rooted` | 未实现 | 当前没有 root 文件、包名、属性、Magisk 或 writable dir 检测 |
| Frida tampering | `fridaTool` | 未实现 | 当前没有 Frida server / gadget / 注入特征检测 |
| Cloned app | `clonedApp` | 未实现 | 当前没有多开、克隆、重打包或 profile 差异检测 |
| MITM attack | `mitmAttack` | 未实现 | 当前没有证书、代理劫持、TLS 或请求完整性检测 |
| Factory reset | `factoryReset` | 未实现 | 当前没有近期 factory reset 判断 |
| Location spoofing | `locationSpoofing` | 未实现 | 当前没有 mock location、fake GPS app 或 provider 差异检测 |

### 3.3 Web / WebView 风险标签

| 维度 | Sumsub risk label | 当前实现状态 | 备注 |
|------|-------------------|--------------|------|
| Adblock | `adblock` | 未实现 | 当前没有浏览器扩展 / adblock 检测 |
| Bad bot / good bot | `badBot` / `goodBot` | 未实现 | 当前没有 bot 分类 |
| Developer tools | `developerTools` | 未实现 | 当前没有 Chrome / Firefox developer tools 或移动端调试状态检测 |
| Incognito / private mode | `incognito` | 未实现 | 当前没有隐私浏览模式检测 |
| Privacy settings mode | `privacySettingsMode` | 未实现 | 当前没有随机化 / 混淆信号输出的隐私设置检测 |
| Browser tampering | `tampering` | 未实现 | 当前没有 anti-detect browser、browser API monkey patch 或 WebView hook 检测 |
| Virtual machine | `virtualMachine` | 未实现 | 当前没有浏览器虚拟化环境检测 |

### 3.4 MobileSDK 硬件访问上下文

| 维度 | Sumsub 公开来源 | 当前实现状态 | 备注 |
|------|-----------------|--------------|------|
| Camera access context | MobileSDK verification flow | 未实现 | 当前没有相机访问状态、权限或采集上下文 |
| Microphone access context | MobileSDK verification flow | 未实现 | 当前没有麦克风访问状态、权限或采集上下文 |
| Geolocation access context | MobileSDK verification flow / Behavior Monitoring | 未实现 | 当前没有定位权限、经纬度、精度或 provider |
| User agent | Behavior Monitoring device object | 未实现 | 当前没有 Web / WebView user agent |
| Accept-Language | Behavior Monitoring device object | 未实现 | 当前没有浏览器 accept language 或语言偏好 |

### 3.5 Advanced IP 与网络画像

| 维度 | Sumsub 公开来源 | 当前实现状态 | 备注 |
|------|-----------------|--------------|------|
| IP risk profile | Advanced IP Check | 未实现 | 当前没有 IP 风险画像 |
| IP risk score / risk level | Advanced IP Check | 未实现 | 当前没有 IP 评分 |
| Abuse velocity | Advanced IP Check | 未实现 | 当前没有 24-48 小时 abuse 行为频次 |
| Connection type | Advanced IP Check | 未实现 | 当前没有网络连接类型画像 |
| IP location / timezone | Advanced IP Check | 未实现 | 当前没有 IP 派生位置或 timezone |
| ISP / organization / ASN | Advanced IP Check | 未实现 | 当前没有 ISP、org、ASN |
| Proxy / VPN / TOR | Advanced IP Check | 未实现 | 当前没有代理、VPN、TOR 检测 |
| IP / document / address / EXIF mismatch | Advanced IP Check / Pre-KYC | 未实现 | 当前没有多来源国家 / 位置一致性判断 |
| Distant IP locations | Advanced IP Check | 未实现 | 当前没有短时间 IP 位置距离异常 |

### 3.6 Behavior Monitoring 与 Fraud Network

| 维度 | Sumsub 公开来源 | 当前实现状态 | 备注 |
|------|-----------------|--------------|------|
| Captured device binding | platform event / financial transaction 携带 captured device | 未实现 | 当前没有设备与事件 / 交易绑定 |
| User platform event stream | login、sign-up、settings change、password update、自定义事件 | 未实现 | 当前没有行为事件流 |
| Password hash reuse | `passwordHash` | 未实现 | 当前没有账号密码复用风险模型 |
| Multiple devices / mobile devices | Pre-KYC / Advanced IP 风险标签 | 未实现 | 当前没有同一 applicant 多设备判断 |
| Failed session continuation | WebSDK link 设备切换失败 | 未实现 | 当前没有跨设备 session continuation 判断 |
| Lengthy onboarding session | onboarding session 过长或多次尝试 | 未实现 | 当前没有 onboarding 时长 / 尝试次数模型 |
| Fraud Network links | blocked users、related accounts、shared devices、similar patterns | 未实现 | 当前没有服务端 fraud network 图谱 |
| Applicant risk score / tags | 多信号评分、规则、标签、动态 onboarding / 限制 | 未实现 | 当前没有 applicant 风险评分或 workflow decision |

---

## 4. 公开资料缺口

Sumsub 公开资料明确了 risk labels 和服务端能力，但 Android native 原始采集字段、visitorId 生命周期和 risk label evidence 仍不透明。以下缺口应作为后续是否实现的追问项。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | Fisherman Android 模块具体采集哪些 Android native 字段 | 决定 Android ID、App Set ID、Advertising ID、Build、sensor、MediaDrm、Keystore 是否包含 |
| Q-2 | `visitorId` 的生成材料、生命周期、存储位置 | 决定跨重装 / 清数据 / 系统升级行为 |
| Q-3 | `fingerprint` 原始输入 | 决定 Canvas、WebGL、fonts、audio、storage、timezone、UA、accept language 是否包含 |
| Q-4 | Android SDK Fisherman 与 Web JS `@sumsub/fisherman` 字段一致性 | 决定 native 与 Web 是否可统一建模 |
| Q-5 | `emulator` 标签覆盖范围 | 决定 Android Studio emulator、Genymotion、云手机、ChromeOS Android Runtime、容器化 Android 是否区分 |
| Q-6 | Android risk label evidence 是否返回给客户 | 决定 `rooted` / `fridaTool` / `clonedApp` 是否只有标签或可解释 evidence |
| Q-7 | `mitmAttack` 检测路径 | 决定是客户端证书 / pinning / TLS 检测，还是服务端请求完整性判断 |
| Q-8 | `factoryReset` 检测依据 | 决定是系统字段、设备历史、首次见到时间，还是服务端行为推断 |
| Q-9 | `locationSpoofing` 输入组合 | 决定 GPS、IP、系统 mock location、传感器和权限状态如何组合 |
| Q-10 | `privacySettingsMode` 覆盖范围 | 决定具体覆盖哪些浏览器、系统或 Android 隐私设置 |
| Q-11 | `tampering` 覆盖范围 | 决定是否包含 anti-detect browser、browser API monkey patch、WebView hook、request tampering、runtime tamper |
| Q-12 | Advanced IP `riskScore` / `riskLevel` 权重和数据源 | 决定能否解释 IP 风险画像 |
| Q-13 | Distant IP locations 阈值 | 决定 100KM 阈值是否可配置，是否区分 VPN、漫游、移动网络出口 |
| Q-14 | Multiple mobile devices 的 unique mobile device 定义 | 决定是否来自 Fisherman visitorId / fingerprint |
| Q-15 | Failed session continuation 条件 | 决定 WebSDK link 的失败条件和设备切换逻辑 |
| Q-16 | Behavior Monitoring 标准 event type | 决定是否包含触控、输入节奏、页面停留等行为细节 |
| Q-17 | Fraud Network shared devices / similar patterns 解释性 | 决定是否可以追溯到具体设备证据 |
| Q-18 | Applicant risk score reason code 和权重 | 决定是否暴露 Device Intelligence risk label 的贡献 |
| Q-19 | Android SDK 排除 Fisherman 后的剩余设备采集 | 决定是否仍采集设备、IP、geolocation 风险信号 |
| Q-20 | device fingerprint / visitorId / risk labels / IP check 的保留期和最小化约束 | 决定隐私合规边界 |

---

## 5. 当前结论

按 `DeviceInfoRepository` 当前实现，Sumsub 公开材料中与品牌、型号、厂商、Android 版本、SDK 版本、ROM 属性、OAID、Android ID、GAID、Widevine、IMEI / MEID、IMSI、ICCID、运营商相关的本地基础字段不再作为缺口保留。

当前仍有价值的 Sumsub 缺口集中在六类：

1. Device Intelligence：Fisherman module、fingerprint、visitorId、sessionId、sessionAgeMs、risk labels aggregate。
2. Android / mobile 风险标签：emulator、rooted、Frida、cloned app、MITM、factory reset、location spoofing。
3. Web / WebView 风险标签：adblock、bot、developer tools、incognito、privacy settings mode、browser tampering、virtual machine。
4. MobileSDK 硬件访问：camera、microphone、geolocation、user agent、accept language。
5. Advanced IP：IP risk score、abuse velocity、connection type、location、timezone、ISP、ASN、proxy、VPN、TOR、mismatch、distant IP。
6. 服务端风控网络：captured device binding、Behavior Monitoring event stream、password hash reuse、multiple devices、failed continuation、lengthy onboarding、Fraud Network links、applicant risk score。
