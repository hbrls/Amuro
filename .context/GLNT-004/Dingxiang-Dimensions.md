# C-022 · 顶象设备指纹 未实现维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-07-15 00:00:00
>
> 视角：顶象设备指纹 厂商 LENS
> 来源：TASK-022
> 当前口径：以 `DeviceInfoRepository` 的实际实现为准，删除已实现字段，仅保留未实现字段、服务端衍生能力和公开资料缺口。

---

## 0. 整理口径

`DeviceInfoRepository` 已实现以下字段族，因此本文不再把这些字段作为顶象缺口保留：

- `BuildInfo` 中的品牌、型号、厂商、设备代号、产品名、Android 版本、SDK 版本、主板、硬件、显示版本、Build fingerprint、Build ID、Serial。
- `RomInfo` 中的主流厂商 ROM system property，包括 MIUI / HyperOS / EMUI / Magic / OPPO / OnePlus / Realme / Vivo / OneUI / Flyme / Smartisan / LeTV / Lenovo / Nubia / Oxygen / Harmony 相关属性。
- `IdentifierInfo` 中的 OAID、Android ID / SSAID、GAID、Widevine Device ID。
- `TelephonyInfo` 中的 IMEI / MEID 合并读取、IMSI、ICCID、MSISDN、本机号码、SIM / Network operator、SIM state、SIM operator name。
- `DisplayInfo` 中的物理宽度、物理高度、刷新率、旋转、显示状态、HDR 与广色域状态。
- `MemoryInfo` 中的总内存与标称内存。
- `BatteryInfo` / `PowerInfo` 中的电池电量与省电模式状态。

顶象公开 PrivacyFlag 中的 IMEI、IMSI、MEID、SERIAL_NUMBER、ICCID、ANDROID_ID、设备版本、系统版本、手机样式、手机名、运营商名称 / 代码等基础字段，凡是已由当前代码覆盖或等价覆盖的，不再作为缺口保留。本文只保留当前代码没有等价字段、检测方法或服务端模型的顶象能力。

不保留 iOS-only 字段作为 Android 实现缺口；Web / 小程序字段只在跨端风险能力中记录。

---

## 1. 顶象产品定位

顶象设备指纹 UNIFYID 定位为跨 Android、iOS、Web/H5、公众号、小程序的设备唯一标识和设备风险识别能力。公开材料强调唯一设备 ID、跨浏览器稳定性、移动端抗篡改、模拟器 / 改机 / Root / 代理 / VPN 检测，以及设备画像。

核心能力分为七层：

| 层级 | 公开表达 | 与当前实现的差异 |
|------|----------|------------------|
| 设备唯一标识 | hardId 只存在于后端服务器，token 为通讯产物 | 当前没有顶象 hardId / token |
| PrivacyFlag 字段表 | Android 端公开可选字段白名单 | 当前覆盖其中基础 ID / Telephony，以及部分显示、内存和电源字段 |
| Web 风险识别 | UA 篡改、禁用 cookie、分辨率异常、浏览器特征异常 | 当前没有 Web 指纹 |
| 移动端抗篡改 | 篡改 IMEI、MAC、AndroidId、SIM、GPS、机型、厂商等后保持指纹不变 | 当前没有抗篡改身份模型 |
| 风险检测 | 模拟器、刷机改机、Root、代理 IP、VPN、劫持注入 | 当前没有这些风险标签 |
| 降级机制 | 本地生成降级 token、24 小时缓存 | 当前没有 token 缓存和降级 |
| 设备画像 | 近期行为、常出现地、访问趋势 | 当前没有服务端画像 |

与 `DeviceInfoRepository` 的差异在于：`DeviceInfoRepository` 当前采集 Android 本地基础标识、Build / ROM / Telephony，以及部分显示、内存、电源字段；顶象的差异化集中在 PrivacyFlag 字段控制、hardId / token、降级 token、蓝牙 / 内网 IP / 安装包主体信息 / 传感器列表、Web 风险识别、移动端抗篡改、设备画像和服务端风险标签。

---

## 2. Android / Mobile 接入方式

顶象公开材料中的接入形态：

| 形态 | 说明 |
|------|------|
| Native Android SDK | `dx-risk-vx_x_x.aar`，多架构 SO |
| iOS SDK | 多种 `DXRisk` xcframework |
| Harmony-Next SDK | HAR 字节码格式 |
| Web SDK | `const-id.js` / 私有化 JS |
| 小程序 SDK | 微信、支付宝、百度、抖音、uniapp |
| Server SDK | Java / PHP 服务端 SDK |
| 接口地址 | 移动端 `/udid/m1`，Web `/c1`，小程序 `/w1` |
| 私有化部署 | 自定义 `DXRisk.KEY_URL`，可清理缓存 |

当前 `DeviceInfoRepository` 没有接入顶象 SDK，也没有 hardId / token、Server API、私有化 URL、降级 token、缓存策略或跨端 Web / 小程序指纹。

---

## 3. 未实现字段清单

### 3.1 PrivacyFlag 中仍未覆盖的 Android 字段

| 维度 | 顶象公开表达 | 当前实现状态 | 备注 |
|------|--------------|--------------|------|
| MAC 地址 | `MAC_ADDRESS` | 未实现 | 当前没有网卡 MAC |
| DEVICE_ID | `DEVICE_ID` | 未实现 | 具体含义需确认，当前未实现 |
| 应用安装列表 | `GET_INSTALLED_PACKAGES` | 未实现 | 当前没有 installed apps |
| App 应用主体信息 | `GET_PACKAGE_INFO` | 未实现 | 当前没有包名、签名、版本、安装时间等主体信息 |
| GPS 地理位置 | `GET_GPS_LOCATION` | 未实现 | 当前没有经纬度、高度、方位角 |
| 蓝牙信息 | `GET_BT_INFO` | 未实现 | 当前没有附近蓝牙设备和已连接蓝牙 MAC |
| 传感器列表 | `GET_SENSOR_LIST` | 未实现 | 当前没有设备可用传感器列表 |
| 内网 IP | `GET_IP_ADDR` | 未实现 | 当前没有局域网 IP |
| 国家代码 | 必选字段 | 未实现 | 当前没有 country code |
| App 应用名 | 必选字段 | 未实现 | 当前没有 app display name |
| App 应用版本 | 必选字段 | 未实现 | 当前没有 app version |

### 3.2 hardId、token、缓存与降级

| 维度 | 顶象公开表达 | 当前实现状态 | 备注 |
|------|--------------|--------------|------|
| hardId | 设备唯一标识只存在于后端服务器 | 未实现 | 当前没有顶象服务端设备 ID |
| token | 客户端与后端通讯产物 | 未实现 | 当前没有顶象 token |
| token 24 小时缓存 | 非风险环境本地缓存约 24 小时 | 未实现 | 当前没有 token 缓存 |
| 降级 token | 超时后将上报数据加密为临时 token | 未实现 | 当前没有降级 token |
| token 长度区分 | size=40 后台生成，size>40 本地生成 | 未实现 | 当前没有 token 类型判断 |
| `KEY_DELAY_MS_TIME` | 自定义超时毫秒 | 未实现 | 当前没有采集延迟配置 |
| `KEY_TIMEOUT_MS` | 请求超时配置 | 未实现 | 当前没有 SDK 请求超时 |
| `PRIVATE_CLEAR_TOKEN` | 私有化关闭 SDK 缓存 | 未实现 | 当前没有缓存控制 |

### 3.3 移动端风险检测与抗篡改

| 维度 | 顶象公开表达 | 当前实现状态 | 备注 |
|------|--------------|--------------|------|
| 模拟器识别 | 识别已知和未知模拟器，准确性 > 99.99% | 未实现 | 当前没有模拟器检测 |
| 虚拟机识别 | 虚拟设备识别 | 未实现 | 当前没有虚拟机检测 |
| 刷机改机 | 改机 / 刷机风险 | 未实现 | 当前没有改机或刷机检测 |
| Root / 越狱 | Root 越狱 | 未实现 | Android root 未实现；越狱不作为 Android 本地缺口 |
| 劫持注入 | 劫持注入风险 | 未实现 | 当前没有注入 / hook / 劫持检测 |
| 代理 IP | 代理 IP 风险 | 未实现 | 当前没有代理 IP 检测 |
| VPN | VPN 风险 | 未实现 | 当前没有 VPN 检测 |
| 31 项篡改检测 | 移动端篡改多类字段后保持指纹不变 | 未实现 | 当前没有抗篡改身份模型 |
| Web / 移动跨端稳定性 | 跨浏览器、跨站点、跨篡改稳定 | 未实现 | 当前没有跨端稳定指纹 |

### 3.4 Web / H5 风险识别

| 维度 | 顶象公开表达 | 当前实现状态 | 备注 |
|------|--------------|--------------|------|
| UA 篡改检测 | Web 风险 | 未实现 | 当前没有 Web / WebView UA 篡改检测 |
| 禁用 cookie 检测 | Web 风险 | 未实现 | 当前没有 cookie 状态 |
| 分辨率异常 | Web 风险 | 未实现 | 当前没有 Web 分辨率异常 |
| 浏览器特征异常 | Web 风险 | 未实现 | 当前没有浏览器特征模型 |
| 浏览器与系统匹配 | 浏览器和当前系统是否匹配 | 未实现 | 当前没有 OS / browser consistency |
| 浏览器平台与 UA 一致性 | 平台与 UA 是否一致 | 未实现 | 当前没有 platform / UA consistency |
| 颜色深度篡改 | 是否篡改浏览器颜色深度 | 未实现 | 当前没有 color depth |
| 跨浏览器识别 | 支持主流浏览器 | 未实现 | 当前没有跨浏览器指纹 |
| 抗缓存清除 | 禁用 / 清除 cookie 和缓存后保持稳定 | 未实现 | 当前没有 Web 抗清除模型 |

### 3.5 设备画像与服务端风险

| 维度 | 顶象公开表达 | 当前实现状态 | 备注 |
|------|--------------|--------------|------|
| 近期行为 | 设备画像 | 未实现 | 当前没有近期行为查询 |
| 常出现地 | 设备画像 | 未实现 | 当前没有常出现地画像 |
| 访问趋势 | 设备画像 | 未实现 | 当前没有访问趋势 |
| 全量风险标签 | 控制台可见，公开材料未展开 | 未实现 | 当前没有顶象风险标签 |
| Server SDK 查询 | Java / PHP Server SDK | 未实现 | 当前没有 token 到 hardId 查询 |
| TPS / 延迟能力 | TPS 5000+，响应 <20ms / <30ms | 未实现 | 当前没有服务端 SLA 链路 |

---

## 4. 公开资料缺口

顶象公开字段表相对完整，但服务端 hardId、risk label、设备画像和风险算法仍不透明。以下缺口应作为后续是否实现的追问项。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | hardId 生命周期 | 决定跨重装、清数据、换账号、换系统后的稳定性 |
| Q-2 | token 与 hardId 映射规则 | 决定 token 是否只是查询凭证还是身份锚点 |
| Q-3 | 降级 token 风险 | 决定 size>40 本地 token 的可靠性和欺诈风险 |
| Q-4 | DEVICE_ID 含义 | 决定是 Telephony deviceId、厂商 deviceId 还是 SDK 内部字段 |
| Q-5 | GET_PACKAGE_INFO 明细 | 决定是否包含签名 hash、first install time、last update time |
| Q-6 | 传感器列表用途 | 决定只是设备能力还是风险指纹 |
| Q-7 | 蓝牙信息采集边界 | 决定附近设备列表、已连接设备 MAC 的权限和兼容性 |
| Q-8 | 31 项篡改检测明细 | 决定具体覆盖哪些字段和工具 |
| Q-9 | 模拟器 >99.99% 口径 | 决定测试集、未知模拟器、云手机是否纳入 |
| Q-10 | Web 风险算法 | 决定 UA、cookie、颜色深度、平台一致性的具体 evidence |
| Q-11 | 设备画像字段 | 决定近期行为、常出现地、访问趋势的统计窗口 |
| Q-12 | 控制台全量风险标签 | 决定可实现的标签边界 |
| Q-13 | Harmony-Next 与 Android 字段差异 | 决定 HAR 包是否弱化字段采集 |

---

## 5. 当前结论

按 `DeviceInfoRepository` 当前实现，顶象公开材料中与品牌、型号、厂商、Android 版本、SDK 版本、ROM 属性、OAID、Android ID、GAID、Widevine、IMEI / MEID、IMSI、ICCID、运营商相关的本地基础字段不再作为缺口保留。

当前仍有价值的顶象缺口集中在五类：

1. PrivacyFlag 未覆盖字段：MAC、DEVICE_ID、应用安装列表、App 主体信息、GPS、蓝牙、传感器列表、内网 IP、国家代码、App 名称和版本。
2. hardId / token：服务端 hardId、token、24 小时缓存、降级 token、token 长度区分、超时配置、私有化缓存控制。
3. 移动端风险：模拟器、虚拟机、刷机改机、root、劫持注入、代理 IP、VPN、31 项篡改检测、跨端稳定性。
4. Web 风险：UA 篡改、cookie 禁用、分辨率异常、浏览器特征、浏览器 / 系统一致性、颜色深度、跨浏览器识别、抗缓存清除。
5. 设备画像和服务端风险：近期行为、常出现地、访问趋势、全量风险标签、Server SDK 查询、服务端 SLA 链路。
