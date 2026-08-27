# C-011 · Sift 未实现维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-26 18:10:41
>
> 视角：Sift 厂商 LENS
> 来源：TASK-011
> 当前口径：以 `DeviceInfoRepository` 的实际实现为准，删除已实现字段，仅保留未实现字段、服务端衍生能力和公开资料缺口。

---

## 0. 整理口径

`DeviceInfoRepository` 已实现以下字段族，因此本文不再把这些字段作为 Sift 缺口保留：

- `BuildInfo` 中的品牌、型号、厂商、设备代号、产品名、Android 版本、SDK 版本、主板、硬件、显示版本、Build fingerprint、Build ID、Serial。
- `RomInfo` 中的主流厂商 ROM system property，包括 MIUI / HyperOS / EMUI / Magic / OPPO / OnePlus / Realme / Vivo / OneUI / Flyme / Smartisan / LeTV / Lenovo / Nubia / Oxygen / Harmony 相关属性。
- `IdentifierInfo` 中的 OAID、Android ID / SSAID、GAID、Widevine Device ID。
- `TelephonyInfo` 中的 IMEI / MEID 合并读取、IMSI、ICCID、MSISDN、本机号码、SIM / Network operator、SIM state、SIM operator name。

Sift Android SDK 公开源码中直接读取 Android ID、设备厂商、设备型号、Android 版本等字段；这些已由当前实现覆盖，因此不再保留为缺口。Sift 也读取 carrier / SIM country 等 Telephony 相关信息，其中与当前 `TelephonyInfo` 重合的部分不保留；未覆盖的细项在本文单独列出。

本文保留的内容满足以下任一条件：

- Sift Android SDK / Device Fingerprinting API / Events API / Score API 公开材料明确提及，但 `DeviceInfoRepository` 当前没有字段或采集方法。
- Sift 公开材料只暴露服务端信号、聚合结果或风险判断，当前本地实现没有等价产物。
- Sift 公开材料提及能力但未公开具体 attribute，需要作为后续追问或实现决策项。

---

## 1. Sift 产品定位

Sift 公开材料将自身定位为 **Digital Trust & Safety / Fraud Decisioning / Risk Intelligence** 平台，而不是单一 Android 设备指纹 SDK。

核心能力分为六层：

| 层级 | 公开表达 | 与当前实现的差异 |
|------|----------|------------------|
| Android SDK / Mobile SDK | 采集 Android device information 与 application interaction events | 当前没有 Sift 式 app state、activity lifecycle、root evidence、installed apps、network addresses |
| Device Fingerprinting API | Web 侧 JavaScript beacon 采集浏览器 / 设备信号并返回 session id | 当前没有 Web / H5 / WebView device fingerprinting session |
| Events API | 上送账号、支付、内容、设备、行为事件 | 当前没有业务事件图谱 |
| Score API / Workflows | 输出风险评分、决策和工作流动作 | 当前没有 risk score、workflow decision 或 reason code |
| Global Data Network | 跨客户、跨交易和跨事件的网络智能 | 当前没有服务端历史关联和网络关联 |
| Machine Learning | 机器学习模型、风险评分、自动决策 | 当前没有服务端模型输出 |

与 `DeviceInfoRepository` 的差异在于：`DeviceInfoRepository` 当前主要采集 Android 本地基础标识、Build / ROM / Telephony 字段；Sift 的核心差异化集中在 app 上下文、activity lifecycle、位置、电池、网络地址、root evidence、installed apps、Web device fingerprinting session 和服务端风险网络。

---

## 2. Android / Mobile 接入方式

Sift 公开材料中的接入形态：

| 形态 | 说明 |
|------|------|
| Android SDK | GitHub `SiftScience/sift-android`，Maven 依赖 `com.siftscience:sift-android`，`minSdk` 19 |
| Application lifecycle integration | 在 `Application.ActivityLifecycleCallbacks` 中 `Sift.open()` / `Sift.collect()` / `pause()` / `resume()` / `close()` |
| Custom Activity / Fragment integration | 每个页面或 Fragment 手动调用 `Sift.open()` / `collect()` |
| User binding | `Sift.setUserId()` / `unsetUserId()`，后续事件包含 user id |
| Location collection control | `withDisallowLocationCollection(true)` 可禁用位置采集 |
| React Native wrapper | 公开仓库存在 React Native 封装 |
| JavaScript Device Fingerprinting API | Web 侧加载 `beacon.js`，采集 device fingerprint 并得到 session id |
| Events API / Score API / Workflows | 服务端上送业务事件并获得风险评分、决策和 workflow 动作 |

Android SDK 公开字段来源主要有三类：

| 类别 | 公开源码 / schema | 字段主题 |
|------|------------------|----------|
| `android_device_properties` | `mobile_event.yaml` + `DevicePropertiesCollector.java` | app、carrier、Build、Android ID、root evidence、installed apps |
| `android_app_state` | `mobile_event.yaml` + `AppStateCollector.java` | activity、location、电池、网络地址、SDK version |
| `mobile_event` | `mobile_event.yaml` + README lifecycle 调用 | time、path、mobile_event_type、user_id、installation_id、fields |

当前 `DeviceInfoRepository` 没有接入 Sift SDK，也没有 app interaction event、app state collector 或服务端 score/workflow 链路。

---

## 3. 未实现字段清单

### 3.1 Android App 与 SDK 上下文

| 维度 | Sift 公开字段 / 代码 | 当前实现状态 | 备注 |
|------|----------------------|--------------|------|
| App name | `app_name` | 未实现 | 当前没有应用展示名 |
| App version | `app_version` | 未实现 | 当前没有 host app version |
| Sift SDK version | `sdk_version` | 未实现 | 当前没有第三方 SDK version |
| Custom fields | `fields` | 未实现 | 业务上下文，不是 Android 固有字段；当前 repository 无扩展属性模型 |
| Device properties blob | `device_properties` | 未实现 | 当前没有客户自定义 device properties 容器 |

### 3.2 Android App State

| 维度 | Sift 公开字段 / 代码 | 当前实现状态 | 备注 |
|------|----------------------|--------------|------|
| Activity class name | `activity_class_name` | 未实现 | 当前没有当前 Activity / 页面上下文 |
| Logical path | `path` | 未实现 | 当前没有 app 内路径或页面序列 |
| Mobile event type | `mobile_event_type` | 未实现 | 当前没有 open / collect / pause / resume / close 等事件类型 |
| Event time | `time` | 未实现 | 当前没有 app interaction event 时间序列 |
| User id | `user_id` | 未实现 | 业务账号关联键，不是设备字段；当前 repository 无账号关联模型 |
| User-device association | `user_id` + `installation_id` | 未实现 | `installation_id` 由 Android ID 填充已覆盖，但账号-设备安装关联模型未实现 |

### 3.3 位置、电池与网络

| 维度 | Sift 公开字段 / 代码 | 当前实现状态 | 备注 |
|------|----------------------|--------------|------|
| Location latitude / longitude | Fused Location Provider | 未实现 | 当前没有经纬度、精度或 provider |
| Location collection control | `withDisallowLocationCollection(true)` | 未实现 | 当前没有位置采集策略开关 |
| Battery level | `battery_level` | 未实现 | 当前没有 BatteryManager 或电池广播读取 |
| Battery state | `battery_state` | 未实现 | 当前没有电池状态 |
| Battery health | `battery_health` | 未实现 | 当前没有电池健康状态 |
| Plug state | `plug_state` | 未实现 | 当前没有充电来源 / 插电状态 |
| Local network addresses | `NetworkInterface.getNetworkInterfaces()` | 未实现 | 当前没有本地网络接口 IP / non-loopback addresses |
| Carrier name 细项 | `mobile_carrier_name` | 部分未实现 | 当前有 SIM operator name，但没有明确 network operator name / carrier name 字段归一 |
| SIM country code 细项 | `mobile_iso_country_code` | 部分未实现 | 当前有 SIM operator MCC-MNC，但没有单独 ISO country code 字段 |

### 3.4 Root Evidence 与安装应用

| 维度 | Sift 公开字段 / 代码 | 当前实现状态 | 备注 |
|------|----------------------|--------------|------|
| Root evidence files | `su` / Superuser 路径存在性 | 未实现 | 当前没有 root 文件检测 |
| Root apps packages | SuperSU、Superuser 等包名 | 未实现 | 当前没有 root app 包名检测 |
| Dangerous apps packages | Lucky Patcher、ROM Manager 等包名 | 未实现 | 当前没有高风险 app 包名集合 |
| Root cloaking / hook tooling packages | RootCloak、Xposed、Substrate 等包名 | 未实现 | 当前没有 hook / cloaking 工具检测 |
| Dangerous system properties | `ro.debuggable=1` / `ro.secure=0` | 未实现 | 当前没有危险系统属性检测 |
| Writable system directories | `/system`、`/vendor/bin`、`/sbin` 等 | 未实现 | 当前没有系统目录可写检测 |
| Build tags risk | `Build.TAGS` / `test-keys` | 未实现 | 当前 `BuildInfo` 不含 `Build.TAGS` |
| Installed apps inventory | `package_name` / `app_name` | 未实现 | 当前没有一般安装应用清单 |

### 3.5 Web / WebView 与服务端风控

| 维度 | Sift 公开来源 | 当前实现状态 | 备注 |
|------|---------------|--------------|------|
| JavaScript beacon session id | Device Fingerprinting API | 未实现 | 当前没有 Web / H5 / WebView 采集引用 |
| Browser / device fingerprinting | Device Fingerprinting API | 未实现 | 当前没有 Canvas、WebGL、fonts、UA、timezone、storage、plugins 等 Web 指纹 |
| IP / network reputation | Score API / risk platform | 未实现 | 当前没有 IP reputation 或服务端 IP 风险 |
| Global Data Network | Sift 平台材料 | 未实现 | 当前没有跨商户 / 跨事件历史网络 |
| Risk score | Score API | 未实现 | 当前没有风险评分 |
| Workflow decision | Workflows | 未实现 | 当前没有自动决策输出 |
| Account / payment / content event graph | Events API | 未实现 | 当前没有账号、交易、内容、设备事件图谱 |
| Behavioral analytics | 产品材料 | 未实现 | 当前没有触控、输入节奏、页面停留、路径序列、失败登录速度等行为模型 |

---

## 4. 公开资料缺口

Sift 公开资料能确认 Android SDK 的部分源码字段，但生产版本、闭源能力、Web 指纹和服务端模型细节仍不完整。以下缺口应作为后续是否实现的追问项。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | 当前生产 Android SDK 是否仍与 GitHub `sift-android` 公开源码字段一致 | 决定本文字段是否代表当前生产实现 |
| Q-2 | Android SDK 是否有闭源商业版风险信号 | 决定 emulator、VPN、proxy、debugger、tamper、remote control 等是否遗漏 |
| Q-3 | `installation_id` 的 Android ID 生命周期 | Android ID 已覆盖，但需要确认 Android 8+ scoped Android ID、重装、签名变化、多用户、work profile 下如何处理 |
| Q-4 | `installed_apps` 在现代 Android package visibility 限制下的可见性策略 | 决定安装应用清单是否仍可实现 |
| Q-5 | 是否采集 App Set ID / Firebase Installation ID / MediaDrm / Keystore key / Play Integrity | 决定除 Android ID、GAID、Widevine 以外是否还有锚点 |
| Q-6 | `network_addresses` 字段范围 | 决定是否包含 IPv6、VPN interface、cellular / Wi-Fi interface 区分 |
| Q-7 | carrier name / SIM country 归一规则 | 决定无 SIM、双卡、eSIM、漫游场景如何处理 |
| Q-8 | root evidence arrays 如何进入服务端风险 score | 决定逐项权重、任一命中还是模型输入 |
| Q-9 | Xposed / Substrate / RootCloak 包名是否仍有效 | 决定 hook / cloaking evidence 是否过时 |
| Q-10 | dangerous apps package list 是否动态更新 | 决定 SDK 固定列表与服务端名单如何维护 |
| Q-11 | Web Device Fingerprinting API 原始字段 | 决定 Canvas、WebGL、fonts、UA、timezone、IP、storage、plugins 是否包含 |
| Q-12 | Web beacon session 与 Android `installation_id` 的关联方式 | 决定 WebView / deep link / app-to-web 场景是否能串联 |
| Q-13 | Global Data Network 中 device 节点合并 / 拆分规则 | 决定服务端如何合并设备、账号和行为 |
| Q-14 | risk score / workflow decision reason code 是否暴露 Android evidence | 决定服务端输出能否追溯到本地 evidence |
| Q-15 | Account Defense behavioral analytics 原始事件 | 决定是否包含触控、输入节奏、页面停留、路径序列、失败登录速度 |
| Q-16 | location collection 禁用或权限拒绝时的降级字段 | 决定无位置权限时保留哪些能力 |
| Q-17 | 是否识别 device farm / cloud device / automation | 决定输入来自 Android SDK 还是服务端行为聚合 |
| Q-18 | 是否区分 app repackaging 与 request tampering | 决定风险检测是否需要 app 完整性链路 |
| Q-19 | React Native wrapper 字段一致性 | 决定跨端接入是否暴露与原生 Android SDK 相同字段 |
| Q-20 | 隐私 / 数据保留策略对 installed apps 与 Android ID 的限制 | 决定采集和保存边界 |

---

## 5. 当前结论

按 `DeviceInfoRepository` 当前实现，Sift 公开材料中与品牌、型号、厂商、Android 版本、SDK 版本、ROM 属性、OAID、Android ID、GAID、Widevine、IMEI / MEID、IMSI、ICCID、运营商相关的本地基础字段不再作为缺口保留。

当前仍有价值的 Sift 缺口集中在五类：

1. App 与 SDK 上下文：app name、app version、Sift SDK version、custom fields、device properties blob。
2. App interaction event：activity class、path、mobile event type、event time、user id、user-device association。
3. 设备状态与网络位置：location、location collection control、battery level / state / health、plug state、local network addresses、carrier / SIM country 细项。
4. Root evidence 与安装应用：root files、root apps、dangerous apps、hook / cloaking tools、dangerous system properties、writable system dirs、Build tags risk、installed apps inventory。
5. Web 与服务端风控：Web beacon session、browser fingerprinting、IP reputation、Global Data Network、risk score、workflow decision、account / payment / content graph、behavioral analytics。
