# C-018 · 阿里云风险识别 / 设备风险 SDK 未实现维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-26 19:10:02
>
> 视角：阿里云风险识别 / 设备风险 SDK 厂商 LENS
> 来源：TASK-018
> 当前口径：以 `DeviceInfoRepository` 的实际实现为准，删除已实现字段，仅保留未实现字段、服务端衍生能力和公开资料缺口。

---

## 0. 整理口径

`DeviceInfoRepository` 已实现以下字段族，因此本文不再把这些字段作为阿里云缺口保留：

- `BuildInfo` 中的品牌、型号、厂商、设备代号、产品名、Android 版本、SDK 版本、主板、硬件、显示版本、Build fingerprint、Build ID、Serial。
- `RomInfo` 中的主流厂商 ROM system property，包括 MIUI / HyperOS / EMUI / Magic / OPPO / OnePlus / Realme / Vivo / OneUI / Flyme / Smartisan / LeTV / Lenovo / Nubia / Oxygen / Harmony 相关属性。
- `IdentifierInfo` 中的 OAID、Android ID / SSAID、GAID、Widevine Device ID。
- `TelephonyInfo` 中的 IMEI / MEID 合并读取、IMSI、ICCID、MSISDN、本机号码、SIM / Network operator、SIM state、SIM operator name。

阿里云公开合规文档列出的 OAID、GAID、Android_ID、IMEI、IMSI、SimSerial、BuildSerial、设备名、Android 版本号等基础字段，凡是已被当前代码覆盖的，不再作为缺口保留。本文只保留当前代码没有等价字段、检测方法或服务端模型的阿里云设备风险能力。

不保留 iOS-only 字段作为 Android 实现缺口；HarmonyOS SDK 信息只作为跨平台资料缺口记录，不作为 Android 字段缺口。

---

## 1. 阿里云产品定位

阿里云风险识别 / 设备风险 SDK 定位为业务风险管理产品中的设备风险子能力。Android SDK 负责采集设备侧信号并生成 deviceToken，服务端 `device_risk` / `device_risk_pro` 计算风险标签、设备唯一 ID 和日志投递能力。

核心能力分为六层：

| 层级 | 公开表达 | 与当前实现的差异 |
|------|----------|------------------|
| Android SDK 采集器 | AAR + SO，采集设备风险相关字段并生成 token | 当前没有阿里云 SDK 或 token |
| 可选敏感信息 | 黑灰产 App 列表、局域网 IP、DNS IP、Wi-Fi 信息、附近 Wi-Fi、定位信息 | 当前没有这些扩展环境字段 |
| 风险标签 | `is_emulator`、`is_rooted`、`is_virtual` | 当前没有模拟器、root、多开风险标签 |
| 增强版设备唯一 ID | `Data.extend` 返回设备唯一 ID | 当前没有阿里云服务端聚合设备 ID |
| Token 生命周期 | deviceToken 7 天有效，可多次调用服务端 API | 当前没有 token 生命周期和 bizId 绑定 |
| SDK 防护 | 插花、膨胀、加解密操作、token 降级 | 当前没有阿里云 SDK 抗逆向和降级策略 |

与 `DeviceInfoRepository` 的差异在于：`DeviceInfoRepository` 当前主要采集 Android 本地基础标识、Build / ROM / Telephony 字段；阿里云的差异化集中在设备风险 SDK、扩展环境采集、黑灰产应用识别、Wi-Fi / DNS / LAN 信息、服务端风险标签、deviceToken、增强版设备唯一 ID、SLS 日志投递和 SDK 抗逆向。

---

## 2. Android / Mobile 接入方式

阿里云公开材料中的接入形态：

| 形态 | 说明 |
|------|------|
| Native Android SDK | `Android-AliyunDevice-版本号.aar`，包含多架构 SO |
| Server API | `device_risk` 基础版和 `device_risk_pro` 增强版 |
| Java SDK | 服务端通过 `aliyun-java-sdk-saf` 等依赖调用 |
| SLS 日志投递 | 增强版支持日志投递和一年存储 |
| 权限 | `INTERNET`、`ACCESS_NETWORK_STATE` 必选，`READ_PHONE_STATE`、存储权限推荐 |
| Token 调用 | 初始化后至少间隔 2 秒调用，否则 token 数据降级 |
| deviceToken | 7 天有效，可复用调用服务端 API |

当前 `DeviceInfoRepository` 没有接入阿里云 SDK，也没有服务端 `device_risk` / `device_risk_pro` 链路。

---

## 3. 未实现字段清单

### 3.1 扩展环境与网络字段

| 维度 | 阿里云公开表达 | 当前实现状态 | 备注 |
|------|----------------|--------------|------|
| 屏幕分辨率 | 基础标识信息 | 未实现 | 当前没有屏幕尺寸、分辨率或密度 |
| MAC 地址 | 不可变更唯一设备标识码 | 未实现 | Android 6+ 应用层读取受限，仍是公开资料缺口 |
| 局域网 IP | 扩展敏感信息 | 未实现 | 当前没有 LAN / 内网地址采集 |
| DNS IP | 扩展敏感信息 | 未实现 | 当前没有 DNS 服务器信息 |
| 连接的 Wi-Fi 信息 | SSID、BSSID | 未实现 | 当前没有当前 Wi-Fi 指纹 |
| 附近 Wi-Fi 列表 | 周边 Wi-Fi 扫描结果 | 未实现 | 当前没有 Wi-Fi 扫描列表 |
| 定位信息 | 扩展敏感信息 | 未实现 | 当前没有粗 / 精确定位采集 |
| 网络状态 | `ACCESS_NETWORK_STATE` | 未实现 | 当前没有网络类型、联网状态或连接状态 |

### 3.2 安装应用与黑灰产风险

| 维度 | 阿里云公开表达 | 当前实现状态 | 备注 |
|------|----------------|--------------|------|
| 黑灰产 App 列表 | 扩展敏感信息 | 未实现 | 当前没有 installed apps 枚举或黑灰产包名匹配 |
| 恶意工具运行 | 设备风险识别覆盖类型 | 未实现 | 当前没有恶意工具检测 |
| 黑灰产应用库 | 服务端维护名单 | 未实现 | 当前没有服务端应用风险库 |
| 应用列表采集合规开关 | DataType 可选项 | 未实现 | 当前没有按配置开关控制采集 |

### 3.3 风险标签与服务端模型

| 维度 | 阿里云公开表达 | 当前实现状态 | 备注 |
|------|----------------|--------------|------|
| 模拟器风险标签 | `is_emulator` | 未实现 | 当前没有模拟器检测 |
| Root 风险标签 | `is_rooted` | 未实现 | 当前没有 root 检测 |
| 多开环境标签 | `is_virtual` | 未实现 | 当前没有多开 / 虚拟化环境检测 |
| 篡改设备参数 | 公开覆盖风险类型 | 未实现 | 当前没有设备参数一致性校验 |
| 设备牧场 / 群控 | LAN 探测用于发现设备牧场、群控 | 未实现 | 当前没有 LAN 聚类或群控识别 |
| 设备风险评分 | 服务端风控引擎综合评分 | 未实现 | 当前没有阿里云风险评分 |
| 全量 risk tags | 更多标签需控制台查看 | 未实现 | 当前没有阿里云标签释义接入 |

### 3.4 Token、设备唯一 ID 与日志链路

| 维度 | 阿里云公开表达 | 当前实现状态 | 备注 |
|------|----------------|--------------|------|
| deviceToken | SDK 生成 token，7 天有效 | 未实现 | 当前没有阿里云 token |
| token 降级 | 初始化后调用间隔不足会降级 | 未实现 | 当前没有弱网 / 时序降级逻辑 |
| bizId 绑定 | 业务 ID 绑定 deviceToken | 未实现 | 当前没有业务 ID 与设备 token 绑定 |
| token 篡改校验 | 服务端结合 bizId 校验 | 未实现 | 当前没有 token 完整性校验 |
| 增强版设备唯一 ID | `Data.extend` | 未实现 | 当前没有服务端聚合设备 ID |
| SLS 日志投递 | 增强版授权后日志投递 | 未实现 | 当前没有设备风险日志投递 |
| RequestId 追踪 | 服务端 API 返回请求追踪 ID | 未实现 | 当前没有阿里云 API 调用追踪 |

### 3.5 SDK 防护与工程约束

| 维度 | 阿里云公开表达 | 当前实现状态 | 备注 |
|------|----------------|--------------|------|
| SDK 抗逆向 | 插花、膨胀及加解密操作 | 未实现 | 当前没有阿里云 SDK 加固 |
| SO 多架构组件 | arm / armv7 / arm64 | 未实现 | 当前没有阿里云 native 组件 |
| 混淆 keep 规则 | `net.security.device.api.**` | 未实现 | 当前没有相关 SDK 类 |
| 三方网络依赖 | okhttp / okio | 未实现 | 当前没有阿里云 SDK 网络链路 |
| SDK 版本 / AppKey 校验 | 版本与 AppKey 不匹配拒绝服务 | 未实现 | 当前没有 AppKey 绑定或版本校验 |

---

## 4. 公开资料缺口

阿里云公开材料覆盖 SDK 接入、权限、DataType、服务端 API、部分 risk tag 和 FAQ，但服务端算法、完整标签和真实 Android 字段仍不透明。以下缺口应作为后续是否实现的追问项。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | 模拟器识别算法 | 决定是否覆盖高级模拟器、云手机、内核特征、虚拟化框架 |
| Q-2 | Root 识别覆盖度 | 决定是否覆盖 Magisk、KernelSU、APatch、Zygisk、隐藏 root |
| Q-3 | 多开识别覆盖度 | 决定是否覆盖双开助手、VirtualXposed、多开分身、企业定制容器 |
| Q-4 | Android 6+ MAC 真实采集路径 | 决定公开声明是合规占位还是实际能力 |
| Q-5 | 黑灰产 App 库维护机制 | 决定包名库更新频率、覆盖范围、地区差异 |
| Q-6 | 设备唯一 ID 稳定性 | 决定跨重装、清数据、换 SIM、换账号后的连续性 |
| Q-7 | deviceToken 与设备唯一 ID 的关系 | 决定 7 天 token 是否只是请求凭证还是设备身份锚点 |
| Q-8 | bizId 校验 token 篡改机制 | 决定是签名校验、服务端二次采集还是历史画像对比 |
| Q-9 | 设备牧场 / 群控判定方法 | 决定 LAN、Wi-Fi、IP、行为同步如何进入聚类 |
| Q-10 | SDK 抗逆向实现 | 决定 DEX 混淆、字符串加密、SO 加固、反调试覆盖范围 |
| Q-11 | 弱网 token 长度膨胀原因 | 决定是否补传更多字段、加密头变长或降级上报 |
| Q-12 | HarmonyOS SDK 与 Android SDK 字段差异 | 决定鸿蒙包是否采集 Android 侧没有的字段 |
| Q-13 | 与阿里集团内部设备指纹关系 | 决定是否复用支付宝、淘宝或 UTDID 体系 |

---

## 5. 当前结论

按 `DeviceInfoRepository` 当前实现，阿里云公开材料中与品牌、型号、厂商、Android 版本、SDK 版本、ROM 属性、OAID、Android ID、GAID、Widevine、IMEI / MEID、IMSI、ICCID、运营商相关的本地基础字段不再作为缺口保留。

当前仍有价值的阿里云缺口集中在五类：

1. 扩展环境与网络字段：屏幕分辨率、MAC、局域网 IP、DNS IP、连接 Wi-Fi、附近 Wi-Fi、定位、网络状态。
2. 安装应用与黑灰产风险：黑灰产 App 列表、恶意工具运行、黑灰产应用库、应用列表采集合规开关。
3. 风险标签与模型：`is_emulator`、`is_rooted`、`is_virtual`、篡改设备参数、设备牧场 / 群控、设备风险评分、全量 risk tags。
4. Token 与服务端链路：deviceToken、token 降级、bizId 绑定、token 篡改校验、增强版设备唯一 ID、SLS 日志投递、RequestId。
5. SDK 防护与工程约束：抗逆向、SO 多架构组件、keep 规则、网络依赖、SDK 版本 / AppKey 校验。
