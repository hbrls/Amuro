# C-009 · Talsec 未实现维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-26 17:48:03
>
> 视角：Talsec 厂商 LENS
> 来源：TASK-009
> 当前口径：以 `DeviceInfoRepository` 的实际实现为准，删除已实现字段，仅保留未实现字段、服务端衍生能力和公开资料缺口。

---

## 0. 整理口径

`DeviceInfoRepository` 已实现以下字段族，因此本文不再把这些字段作为 Talsec 缺口保留：

- `BuildInfo` 中的品牌、型号、厂商、设备代号、产品名、Android 版本、SDK 版本、主板、硬件、显示版本、Build fingerprint、Build ID、Serial。
- `RomInfo` 中的主流厂商 ROM system property，包括 MIUI / HyperOS / EMUI / Magic / OPPO / OnePlus / Realme / Vivo / OneUI / Flyme / Smartisan / LeTV / Lenovo / Nubia / Oxygen / Harmony 相关属性。
- `IdentifierInfo` 中的 OAID、Android ID / SSAID、GAID、Widevine Device ID。
- `TelephonyInfo` 中的 IMEI / MEID 合并读取、IMSI、ICCID、MSISDN、本机号码、SIM / Network operator、SIM state、SIM operator name。

Talsec 的 Android device ID 文章提到 SSAID、Advertising ID、MediaDrm / Widevine ID、设备型号、OS 版本等内容。上述字段中，Android ID、GAID、Widevine Device ID、设备型号、Android 版本已由当前代码覆盖，因此不再保留为缺口。App Set ID、Firebase Installation ID 不是当前 `DeviceInfoRepository` 字段，且 Talsec 文章主要将其作为设备 ID 方案对比项，本文只在资料缺口中记录。

本文保留的内容满足以下任一条件：

- Talsec freeRASP / RASP+ / DeviceState / ThreatDetected 公开材料明确提及，但 `DeviceInfoRepository` 当前没有字段或检测方法。
- Talsec 公开材料只暴露服务端证明、Portal telemetry 或风险评分能力，当前本地实现没有等价产物。
- Talsec 公开材料提及能力但未公开具体 attribute，需要作为后续追问或实现决策项。

---

## 1. Talsec 产品定位

Talsec 公开材料将自身定位在 **Mobile App Security / Runtime Application Self-Protection / App Integrity / Device Risk** 交叉地带，而不是传统 device fingerprinting 厂商。

核心能力分为四层：

| 层级 | 公开表达 | 与当前实现的差异 |
|------|----------|------------------|
| L0 - Detect Attacks | freeRASP + Talsec Portal insights，检测 app security state | 当前没有 root、hook、emulator、tamper、debugger 等 runtime risk 检测 |
| L1 - Protect App | RASP+、AppHardening、Secret Vault、Dynamic TLS Pinning | 当前没有 app 绑定、反逆向、反绕过、动态 pinning 或 secret vault |
| L2 - Protect Transactions | AppiCrypt，后端校验 App Integrity Cryptogram | 当前没有服务端 integrity cryptogram |
| L3 - Protect Users | Device Risk Scoring + Malware Detection | 当前没有设备风险评分或恶意 / 可疑应用扫描 |

与 `DeviceInfoRepository` 的差异在于：`DeviceInfoRepository` 当前主要采集 Android 本地基础标识、Build / ROM / Telephony 字段；Talsec 的核心差异化集中在运行时安全、app 完整性、反逆向、恶意环境检测、设备安全状态和服务端完整性证明。

---

## 2. Android / Mobile 接入方式

Talsec 公开材料中的接入形态：

| 形态 | 说明 |
|------|------|
| Android Native SDK | `com.aheaditec.talsec.security:TalsecSecurity-Community`，在 `Application.onCreate` 中配置并启动 |
| Flutter / React Native / Capacitor / Cordova | 跨平台 wrapper 暴露同类 threat callback |
| freeRASP | 免费版 Runtime Application Self-Protection，检测型为主 |
| RASP+ | 商业版，app-specific SDK customization，可关闭向 Talsec 数据库采集 |
| AppiCrypt | 后端 App Integrity Cryptogram 校验 |
| freeMalwareDetection | 扫描恶意 / 可疑应用，基于包名、hash、危险权限等 |
| Talsec Portal | 根据 `watcherMail` 注册后查看 app 数据和 global statistics |

Android 公开回调类型来自 `ThreatDetected` 与 `DeviceState`：

- `ThreatDetected`：root、debugger、emulator、tamper、untrusted installation source、hook、device binding、obfuscation issues、screenshot、screen recording、multi-instance、location spoofing、time spoofing、unsecure Wi-Fi、automation、malware detected。
- `DeviceState`：unlocked device、hardware-backed keystore unavailable、developer mode、ADB enabled、system VPN。

当前 `DeviceInfoRepository` 没有接入 Talsec SDK，也没有等价的 runtime risk callback。

---

## 3. 未实现字段清单

### 3.1 App / SDK 配置与完整性

| 维度 | Talsec 公开来源 | 当前实现状态 | 备注 |
|------|-----------------|--------------|------|
| Expected package name | SDK 初始化配置 | 未实现 | 当前没有预期包名校验或 package spoof 检测 |
| Expected signing certificate hash | SDK 初始化配置 | 未实现 | 当前没有签名证书 hash 校验 |
| Supported alternative stores | SDK 初始化配置 | 未实现 | 当前没有安装来源白名单 |
| Dev vs Release / `isProd` | SDK 配置 | 未实现 | 当前没有按环境切换风险检测策略 |
| Callback bypass / `killOnBypass` | RASP 防绕过 | 未实现 | 当前没有检测 callback 被 hook / modified |
| Obfuscation issues | `onObfuscationIssuesDetected()` | 未实现 | 当前没有混淆质量或保护强度检查 |
| App integrity / tamper / repackaging | `onTamperDetected()` | 未实现 | 当前没有包名、签名、完整性、重打包检测 |
| Dynamic TLS Pinning | RASP+ / Protect App | 未实现 | 当前没有动态证书绑定或 pinning 策略 |
| Secret Vault / secret protection | RASP+ / Protect App | 未实现 | 当前没有密钥保护或 secret vault 能力 |

### 3.2 本地威胁与运行时风险

| 维度 | Talsec 公开 callback | 当前实现状态 | 备注 |
|------|----------------------|--------------|------|
| Root / privileged access | `onRootDetected()` | 未实现 | 当前没有 root 文件、包名、属性、Magisk 或 writable dir 检测 |
| Hook / instrumentation | `onHookDetected()` | 未实现 | 当前没有 Frida、Xposed、Substrate、inline hook、callback bypass 检测 |
| Debugger attached | `onDebuggerDetected()` | 未实现 | 当前没有 debugger、ptrace、JDWP 或调试状态检测 |
| Emulator / simulator | `onEmulatorDetected()` | 未实现 | 当前没有模拟器硬件不一致、Build 异常、驱动或传感器缺失检测 |
| Multi-instance / app multi-opening | `onMultiInstanceDetected()` | 未实现 | 当前没有多开、克隆、沙箱、work profile 或虚拟容器检测 |
| Automation detected | `onAutomationDetected()` | 未实现 | 当前没有 Accessibility、instrumentation、UIAutomator、脚本或输入节奏检测 |
| Location spoofing | `onLocationSpoofingDetected()` | 未实现 | 当前没有 mock location、fake GPS app 或 provider 差异检测 |
| Time spoofing | `onTimeSpoofingDetected()` | 未实现 | 当前没有系统时间伪造或网络时间对比 |
| Screenshot detected | `onScreenshotDetected()` | 未实现 | 当前没有 Android 14+ 屏幕截图事件检测 |
| Screen recording detected | `onScreenRecordingDetected()` | 未实现 | 当前没有 Android 15+ 录屏事件检测 |
| Untrusted installation source | `onUntrustedInstallationSourceDetected()` | 未实现 | 当前没有 installer package / unofficial store 风险判断 |
| Malware / suspicious apps present | `onMalwareDetected(suspiciousApps)` | 未实现 | 当前没有恶意 / 可疑应用扫描或 suspicious app 列表 |

### 3.3 DeviceState 设备安全状态

| 维度 | Talsec 公开 callback | 当前实现状态 | 备注 |
|------|----------------------|--------------|------|
| Unlocked device / passcode absent | `onUnlockedDeviceDetected()` | 未实现 | 当前没有锁屏、口令或生物认证安全状态读取 |
| Hardware-backed keystore unavailable | `onHardwareBackedKeystoreNotAvailableDetected()` | 未实现 | 当前没有硬件密钥库能力判断 |
| Developer mode | `onDeveloperModeDetected()` | 未实现 | 当前没有开发者选项状态读取 |
| ADB enabled | `onADBEnabledDetected()` | 未实现 | 当前没有 ADB / USB debugging / wireless debugging 状态读取 |
| System VPN | `onSystemVPNDetected()` | 未实现 | 当前没有系统级 VPN 状态检测 |
| Unsecure Wi-Fi | `onUnsecureWifiDetected()` | 未实现 | 当前没有开放 Wi-Fi、弱加密、MITM、evil twin 或 captive portal 判断 |

### 3.4 设备绑定与连续性

| 维度 | Talsec 公开来源 | 当前实现状态 | 备注 |
|------|-----------------|--------------|------|
| Device binding abnormal | `onDeviceBindingDetected()` | 未实现 | 当前没有设备绑定、解绑异常或绑定生命周期模型 |
| External user correlation | `externalId` | 未实现 | 这是业务关联键，不是设备维度；当前 repository 没有安全事件关联模型 |
| App integrity continuity | 包名 + 签名 + 混淆 + tamper 检测 | 未实现 | 当前无法确认当前运行 app 是否持续符合预期 |

### 3.5 服务端衍生与保护能力

以下字段不是单纯 Android 本地读取字段，但 Talsec 公开材料将其作为 RASP+、AppiCrypt、Portal 或 Device Risk 输出。当前 `DeviceInfoRepository` 没有等价产物。

| 维度 | Talsec 公开来源 | 当前实现状态 |
|------|-----------------|--------------|
| AppiCrypt integrity cryptogram | AppiCrypt | 未实现 |
| App impersonation / API abuse 防护 | AppiCrypt / Protect Transactions | 未实现 |
| Session hijacking / botnet / DDoS 交易保护 | AppiCrypt / Protect Transactions | 未实现 |
| Talsec Portal telemetry | freeRASP Portal insights | 未实现 |
| Device Risk Scoring | L3 - Protect Users | 未实现 |
| Customer-owned collection | RASP+ no data collection | 未实现 |
| Malware blacklist / whitelist 更新机制 | freeMalwareDetection | 未实现 |

---

## 4. 公开资料缺口

Talsec 公开资料大多暴露 callback、配置项或产品能力，不公开具体检测 attribute 和算法。以下缺口应作为后续是否实现的追问项。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | `onDeviceBindingDetected()` 的具体绑定材料 | 决定绑定依赖 Android Keystore、硬件 ID、MediaDrm、server-issued key，还是 SDK 内部状态 |
| Q-2 | Device binding 生命周期 | 决定 app 重装、清数据、系统升级、换签名、换安装渠道后的保持策略 |
| Q-3 | `onAutomationDetected()` 具体输入 | 决定是否检查 Accessibility、instrumentation、UIAutomator、input event timing、sensor stability 或 app-specific heuristics |
| Q-4 | `onHookDetected()` 覆盖范围 | 决定是否覆盖 Frida Gadget、LSPosed、Xposed、Substrate、Magisk Zygisk、inline hook、ptrace |
| Q-5 | `killOnBypass` 底层信号 | 决定 callback 被 hook / modified 的检测方法 |
| Q-6 | `onMultiInstanceDetected()` 区分策略 | 决定 app clone、work profile、parallel space、Android multi-user、虚拟化容器如何识别 |
| Q-7 | `onUnsecureWifiDetected()` 判定输入 | 决定 open Wi-Fi、弱加密、MITM、证书劫持、evil twin、captive portal 是否都覆盖 |
| Q-8 | `onSystemVPNDetected()` 粒度 | 决定是否区分企业 VPN、用户主动 VPN、恶意 VPN、VPN app 包名 |
| Q-9 | freeMalwareDetection suspicious app 输出字段 | 决定是否包含 package name、签名、hash、权限、安装来源、安装时间 |
| Q-10 | AppiCrypt cryptogram 内容 | 决定包含设备环境摘要、app integrity 摘要、请求摘要还是服务端 nonce |
| Q-11 | RASP+ customer-owned collection 原始字段 | 决定客户自建收集服务能否拿到风险 callback 之外的 attribute |
| Q-12 | freeRASP telemetry 字段清单 | 决定 Portal 是否包含设备型号、OS、SDK 版本、app version、region、risk event timestamp |
| Q-13 | App Set ID / Firebase Installation ID 的实际使用边界 | Talsec 文章讨论这些 ID，但未说明 SDK 是否实际采集或仅作为方案对比 |
| Q-14 | screenshot / screen recording 可见性边界 | 决定后台、分屏、投屏、系统录屏权限不同状态下是否能准确触发 |
| Q-15 | hardware-backed keystore unavailable 误报边界 | 低端设备没有硬件安全模块时可能影响风险解释 |
| Q-16 | `expectedPackageName` 与 package name spoof / context tamper 的关系 | 决定是否有专门防护运行时 Context 篡改 |
| Q-17 | `expectedSigningCertificateHashBase64` 与 Play App Signing / key rotation / 多渠道签名 | 决定生产环境签名校验如何配置 |
| Q-18 | Developer mode 与 ADB enabled 的风险权重 | 决定二者是独立风险还是调试环境辅助信号 |

---

## 5. 当前结论

按 `DeviceInfoRepository` 当前实现，Talsec 公开材料中与 Android ID、GAID、Widevine Device ID、设备型号、Android 版本、SDK 版本、ROM 属性、IMEI / MEID、IMSI、ICCID、运营商相关的本地基础字段不再作为缺口保留。

当前仍有价值的 Talsec 缺口集中在五类：

1. App 完整性与配置：预期包名、签名证书 hash、安装来源白名单、`isProd`、callback bypass、obfuscation issues、tamper / repackaging、dynamic TLS pinning、secret vault。
2. 本地威胁检测：root、hook、debugger、emulator、multi-instance、automation、location spoofing、time spoofing、screenshot、screen recording、untrusted source、malware / suspicious apps。
3. 设备安全状态：unlocked device、hardware-backed keystore unavailable、developer mode、ADB enabled、system VPN、unsecure Wi-Fi。
4. 设备绑定与连续性：device binding abnormal、external user correlation、app integrity continuity。
5. 服务端保护能力：AppiCrypt cryptogram、交易保护、Portal telemetry、Device Risk Scoring、customer-owned collection、malware blacklist / whitelist 更新机制。
