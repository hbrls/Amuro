# C-013 · Incognia 未实现维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-26 18:36:08
>
> 视角：Incognia 厂商 LENS
> 来源：TASK-013
> 当前口径：以 `DeviceInfoRepository` 的实际实现为准，删除已实现字段，仅保留未实现字段、服务端衍生能力和公开资料缺口。

---

## 0. 整理口径

`DeviceInfoRepository` 已实现以下字段族，因此本文不再把这些字段作为 Incognia 缺口保留：

- `BuildInfo` 中的品牌、型号、厂商、设备代号、产品名、Android 版本、SDK 版本、主板、硬件、显示版本、Build fingerprint、Build ID、Serial。
- `RomInfo` 中的主流厂商 ROM system property，包括 MIUI / HyperOS / EMUI / Magic / OPPO / OnePlus / Realme / Vivo / OneUI / Flyme / Smartisan / LeTV / Lenovo / Nubia / Oxygen / Harmony 相关属性。
- `IdentifierInfo` 中的 OAID、Android ID / SSAID、GAID、Widevine Device ID。
- `TelephonyInfo` 中的 IMEI / MEID 合并读取、IMSI、ICCID、MSISDN、本机号码、SIM / Network operator、SIM state、SIM operator name。

Incognia 公开材料提到 Device Model、hardware signatures 等基础设备字段；其中品牌、型号、厂商、Android 版本等已由当前实现覆盖，因此不再保留为缺口。Incognia 的开发者文档需要登录访问，公开资料没有暴露 Android SDK 原始字段 schema，本文只保留公开材料明确提及且当前代码没有等价实现的能力。

不保留 iOS-only 字段作为 Android 实现缺口；例如 `Screen Sharing` 在旧文档中标注为 iOS Native，本文不列入 Android 待实现字段。

---

## 1. Incognia 产品定位

Incognia 将 device intelligence 与 location intelligence 融合成 Incognia ID，核心卖点是识别“设备背后的人”，并公开强调 reinstall-proof、factory-reset-proof、cross-device persistent identity。

核心能力分为七层：

| 层级 | 公开表达 | 与当前实现的差异 |
|------|----------|------------------|
| App security | root、emulator、Frida、code injection、debugging、app cloner、data mismatch、instrumentation tools | 当前没有本地风险环境检测 |
| Device identity | 基于 device signals 生成 reinstall-proof device ID | 当前没有跨重装持久身份 |
| Location intelligence | indoor location、GPS / IP / address 一致性、location watchlist | 当前没有定位、室内定位或位置行为画像 |
| Incognia ID | app security + device identity + location intelligence 融合为跨设备身份 | 当前没有服务端身份融合模型 |
| AI-Powered Browser ID | Transformer 模型 token 化 200+ 浏览器 metadata signals，生成 embedding vector | 当前没有 Web 指纹或 embedding identity |
| Location Identity Verification | device + indoor location + physical address 三方绑定 | 当前没有地址、设备、位置一致性验证 |
| Frictionless Authentication | 用 device + location 信号替代 OTP / facial biometrics | 当前没有基于 trusted device/location 的认证决策 |

与 `DeviceInfoRepository` 的差异在于：`DeviceInfoRepository` 当前主要采集 Android 本地基础标识、Build / ROM / Telephony 字段；Incognia 的核心差异化集中在位置智能、室内定位、位置行为、跨设备持久身份、本地 tamper 风险、Web Browser ID 和服务端图谱 / 风险评分。

---

## 2. Android / Mobile 接入方式

Incognia 公开材料中的接入形态：

| 形态 | 说明 |
|------|------|
| Mobile SDK | mobile device intelligence 结合 device signals、location intelligence、tamper detection |
| Web SDK | AI-Powered Browser ID 采集 200+ 浏览器 metadata signals |
| Incognia ID | 服务端 ML 模型将 device signals + location signals 融合为持久 identity |
| API | 客户通过 API 获取 Incognia ID、risk score、risk labels |
| Webhook / event-based | onboarding、login、transaction 阶段给出 high risk / low risk 判断 |
| Trust & Safety 集成 | 作为风控、KYC、Trust & Safety 平台输入信号 |

当前 `DeviceInfoRepository` 没有接入 Incognia SDK，也没有 location behavior、Incognia ID、risk score、risk labels 或 event-based 风险评估链路。

---

## 3. 未实现字段清单

### 3.1 Android 本地风险环境

| 维度 | Incognia 公开表达 | 当前实现状态 | 备注 |
|------|------------------|--------------|------|
| Root / privileged access | Root / Jailbreak | 未实现 | 当前没有 root 文件、包名、属性、Magisk 或 writable dir 检测 |
| Android emulator | Emulator | 未实现 | 当前没有模拟器硬件不一致、Build 异常、驱动或传感器缺失检测 |
| Frida | Frida | 未实现 | 当前没有 Frida server / gadget / 注入特征检测 |
| Code injection | Code Injection | 未实现 | 当前没有运行时代码注入检测 |
| Debugging mode | Debugging Mode | 未实现 | 当前没有 debugger、ptrace、JDWP 或调试状态检测 |
| App cloner | App Cloner | 未实现 | 当前没有多开、克隆、重打包或 profile 差异检测 |
| Data mismatch | Data Mismatch | 未实现 | 当前没有客户端上报数据与服务端预期不一致检测 |
| Instrumentation tools | Instrumentation tools | 未实现 | 当前没有 Xposed、Substrate、Frida、hook framework 等泛化 instrumentation 检测 |
| Factory reset | Factory Reset / Device reset detection | 未实现 | 当前没有 factory reset event 或 timestamp 判断 |
| GPS spoofing | GPS Spoofing / Advanced GPS spoofing | 未实现 | 当前没有 GPS / IP / provider / sensor 一致性判断 |
| Location spoofing app | Location spoofing app | 未实现 | 当前没有 fake GPS app 安装检测 |

### 3.2 位置智能与位置行为

| 维度 | Incognia 公开表达 | 当前实现状态 | 备注 |
|------|------------------|--------------|------|
| Indoor location fingerprint | Indoor location < 10 feet / 30x more accurate than GPS | 未实现 | 当前没有 Wi-Fi / Bluetooth / sensor fusion 室内定位 |
| Location behavior signature | historical location behavior / trusted location | 未实现 | 当前没有位置轨迹或历史行为画像 |
| Trusted location | known signal environment | 未实现 | 当前没有可信地点模型 |
| Suspicious location watchlist | suspicious location watchlist | 未实现 | 当前没有 location watchlist |
| Address match | address 与 device historical / real-time location 匹配 | 未实现 | 当前没有用户地址、设备位置和历史位置一致性判断 |
| IP to location mapping consistency | IP to Location Mapping | 未实现 | 当前没有 IP 位置与设备实际位置 / 声称地址一致性判断 |
| Location risk score | 当前位置与历史位置行为匹配后输出 risk score | 未实现 | 当前没有位置风险评分 |

### 3.3 持久身份与设备连续性

| 维度 | Incognia 公开表达 | 当前实现状态 | 备注 |
|------|------------------|--------------|------|
| Reinstall-proof device ID | reinstall-proof device ID | 未实现 | 当前没有跨 app 重装保持的设备 ID |
| Factory-reset-proof Incognia ID | after device reset remains linked | 未实现 | 当前没有 factory reset 后身份恢复模型 |
| Cross-device persistent identity | recognizes users across devices | 未实现 | 当前没有跨设备用户身份关联 |
| New device detection | New device detection | 未实现 | 当前没有新设备判断 |
| Frictionless device authorization | frictionless device authorization | 未实现 | 当前没有可信设备授权决策 |
| Incognia ID | recognize the person behind the device | 未实现 | 当前没有 device + location + identity 融合 ID |

### 3.4 Web / Browser ID

| 维度 | Incognia 公开表达 | 当前实现状态 | 备注 |
|------|------------------|--------------|------|
| 200+ web metadata signals | AI-Powered Browser ID | 未实现 | 当前没有 Web metadata 采集 |
| User-Agent | Web SDK 输入 | 未实现 | 当前没有 Web / WebView UA |
| Screen resolution | Web SDK 输入 | 未实现 | 当前没有屏幕分辨率 |
| Fonts | Web SDK 输入 | 未实现 | 当前没有字体指纹 |
| Language | Web SDK 输入 | 未实现 | 当前没有语言偏好 / Accept-Language |
| Browser hardware signatures | Web SDK 输入 | 未实现 | 当前没有浏览器侧硬件签名 |
| Embedding vector | Transformer 高维向量身份表示 | 未实现 | 当前没有服务端 embedding identity |
| Identity persistence under attribute shift | attributes shift 后仍聚类 | 未实现 | 当前没有 Web 身份持久化模型 |
| Incognito mode | Incognito Mode | 未实现 | 当前没有隐身模式检测 |
| Privacy browser detection | Privacy Browsers | 未实现 | 当前没有 Brave / Tor / DuckDuckGo 等 privacy browser 检测 |
| Web geolocation tampering | Geolocation Tampering | 未实现 | 当前没有 Web Geolocation API 篡改检测 |
| Web bot detection | Bot Detection | 未实现 | 当前没有 Web bot 行为检测 |
| VPN / Proxy | VPN/Proxy / Proxy | 未实现 | 当前没有代理 / VPN 风险判断 |

### 3.5 服务端图谱与风控输出

| 维度 | Incognia 公开表达 | 当前实现状态 | 备注 |
|------|------------------|--------------|------|
| Multiple accounts per device | Incognia ID 能力表 | 未实现 | 当前没有同设备多账号检测 |
| Multiple devices per account | Incognia ID 能力表 | 未实现 | 当前没有同账号多设备检测 |
| Multiple accounts per user | Incognia ID 能力表 | 未实现 | 当前没有同一用户多账号检测 |
| Multiple users per account | Incognia ID 能力表 | 未实现 | 当前没有同一账号多用户检测 |
| ATO detection | Incognia ID 能力表 | 未实现 | 当前没有账号接管风险模型 |
| Collusion and fraud farm detection | Incognia ID / Fraud Prevention | 未实现 | 当前没有共谋或设备农场图谱检测 |
| Address / location binding verification | device + location + address 三方融合 | 未实现 | 当前没有实体地址绑定验证 |
| Incognia risk score / risk labels | API / risk decisioning | 未实现 | 当前没有 risk score 或 risk labels |
| AI Rule Builder | 2026 新品 | 未实现 | 当前没有 AI 规则配置面或风控规则生成 |

---

## 4. 公开资料缺口

Incognia 公开资料对产品能力描述充分，但开发者文档需要登录访问，Android native 原始字段、室内定位输入和身份生命周期仍不透明。以下缺口应作为后续是否实现的追问项。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | Mobile SDK 实际采集的 Android native 字段 | 决定 Android ID、App Set ID、Advertising ID、Build、sensor、MediaDrm、Keystore、PackageManager、Settings.Secure 是否包含 |
| Q-2 | Indoor location 具体信号组合 | 决定使用 Wi-Fi fingerprinting、Bluetooth、UWB、sensor fusion，是否需要专门 beacon |
| Q-3 | `incognia_id` 生成材料和生命周期 | 决定 reinstall-proof 是 client-side cache 还是 server-side re-derivation |
| Q-4 | Factory reset 后身份恢复机制 | 决定依赖 location history、服务端 user-account 关联，还是其他持久锚点 |
| Q-5 | AI Browser ID 200+ signals 完整列表 | 决定除 IP / UA / screen resolution / fonts / language / hardware signatures 外还包含哪些字段 |
| Q-6 | AI Browser ID embedding vector 维度和存储时长 | 决定跨 cookie 清除、incognito session、浏览器升级后的匹配边界 |
| Q-7 | Address verification binding 实现 | 决定依赖用户填写 address、device location history、postal database，还是组合判断 |
| Q-8 | Data Mismatch 检测依据 | 决定是 GPS vs IP、UA vs canvas，还是 SDK 上送字段与服务端预期的其他差异 |
| Q-9 | Instrumentation tools 覆盖范围 | 决定是否覆盖 Xposed、Substrate、Frida、Magisk、Lucky Patcher |
| Q-10 | Trusted / suspicious location watchlist 定义 | 决定是家 / 公司、location category，还是已知欺诈事件关联 location fingerprint |
| Q-11 | Multi-accounting detection 实现机制 | 决定基于 Incognia ID、device ID、location behavior，还是服务端图谱 |
| Q-12 | Collusion and fraud farm detection 数据源 | 决定 location behavior similarity 阈值以及是否跨客户共享 |
| Q-13 | Incognia risk score 解释性 | 决定是否暴露 location / device / behavior 子分数和 reason code |
| Q-14 | AI Rule Builder schema | 决定规则输入 / 输出、执行位置和客户数据使用方式 |
| Q-15 | Privacy browser detection 覆盖范围 | 决定具体覆盖哪些浏览器和检测依据 |
| Q-16 | Web Bot Detection 机制 | 决定基于 behavior pattern、JS challenge 还是 ML model |
| Q-17 | 客户可关闭维度机制 | 决定关闭某些采集字段后 risk score 是否降级 |
| Q-18 | Reinstall-proof ID 跨 OS upgrade 边界 | 决定 Android 大版本升级后是否仍保持 |
| Q-19 | device fingerprint / Incognia ID / location history 保留期 | 决定隐私合规和数据最小化边界 |
| Q-20 | Developer docs 登录后 SDK schema | 决定公开营销材料之外的字段是否需要补充 |

---

## 5. 当前结论

按 `DeviceInfoRepository` 当前实现，Incognia 公开材料中与品牌、型号、厂商、Android 版本、SDK 版本、ROM 属性、OAID、Android ID、GAID、Widevine、IMEI / MEID、IMSI、ICCID、运营商相关的本地基础字段不再作为缺口保留。

当前仍有价值的 Incognia 缺口集中在五类：

1. 本地风险检测：root、emulator、Frida、code injection、debugging、app cloner、data mismatch、instrumentation tools、factory reset、GPS spoofing、location spoofing app。
2. 位置智能：indoor location fingerprint、location behavior signature、trusted location、suspicious location watchlist、address match、IP-to-location consistency、location risk score。
3. 持久身份：reinstall-proof device ID、factory-reset-proof Incognia ID、cross-device persistent identity、new device detection、frictionless device authorization、Incognia ID。
4. Web / Browser ID：200+ metadata signals、UA、screen resolution、fonts、language、hardware signatures、embedding vector、incognito、privacy browser、Web geolocation tampering、bot、VPN / proxy。
5. 服务端图谱与风控输出：multi-accounting、ATO detection、collusion and fraud farm、address / location binding、risk score / labels、AI Rule Builder。
