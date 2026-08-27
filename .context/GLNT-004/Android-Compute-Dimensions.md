# GLNT-4 · Android 计算维度全集 主清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-29 00:00:00
>
> 视角：goal
> 来源：TASK-007（首版收束产出）；C-008（SEON 厂商 LENS，全量纳入）；C-009（Talsec 厂商 LENS，全量纳入）；C-010（ThreatMetrix / LexisNexis Risk Solutions 厂商 LENS，全量纳入）；C-011（Sift 厂商 LENS，全量纳入）；C-012（Sumsub 厂商 LENS，全量纳入）；C-018（阿里云风险识别 / 设备风险 SDK 厂商 LENS，全量纳入）；C-021（数美科技设备指纹 厂商 LENS，全量纳入）；C-022（顶象设备指纹 厂商 LENS，全量纳入）；11 家补充厂商 LENS（Incognia / Bureau / DataVisor / Feedzai / Unit21 / 腾讯云 T-Sec / 京东云 / 同盾 / 网易易盾 / 百度智能云 / 极验，全量纳入）
> 演进规则：C-003 §5.2 + 本文 §3 厂商编号约定

---

## 0. 维护约定

- **本文档为 GLNT-4 维度主清单的唯一源**。每轮厂商 LENS 完成后，其反推出的维度必须全量进入本文档；goal LENS 只负责归位、去重、命名统一、双归位标注和来源说明。
- **当前阶段为全量调研阶段**：已完成厂商 LENS 反推出的维度必须全量纳入本文档；后续只能做归位、去重、命名统一、双归位标注和来源说明，不做抽样式筛除。
- **Index.md 中保留一行引用**指明本文档路径；不在 Index.md 中维护主清单内容。
- **双归位标注规则**：在双归位条目的归位分组中显式标注 `（双归位：另见 XXX 分组）`，并在被引用分组顶部加一行 `> 本分组中可作为风险信号的双归位维度另见：XXX 分组`。
- **校准后完成度门槛**（v2.0 整合后重校）：反推维度 ≥ 25 / 归位分歧 ≤ 15 / 未决问题 ≤ 30 / 资料覆盖 ≥ 4。
- **v2.0 新增 11 家厂商编号前缀**：
  - `I-NNN` Incognia（C-013）/ `B-NNN` Bureau（C-014）/ `DV-NNN` DataVisor（C-015）/ `FZ-NNN` Feedzai（C-016）/ `U2-NNN` Unit21（C-017，与 Sumsub `U-NNN` 区分）
  - `YJ-NNN` 腾讯云 T-Sec（C-019）/ `JD-NNN` 京东云（C-020）/ `TD-NNN` 同盾科技（C-023）/ `WY-NNN` 网易易盾（C-024）/ `BD-NNN` 百度智能云（C-025，反推 0 条）/ `GT-NNN` 极验（C-026，沿用 C-026 附录 A 显式编号）

---

## 0.1 DeviceInfoRepository 实现概览

`DeviceInfoRepository` 是当前 Android 端设备信息读取的本地实现封装，包名为 `com.lisitede.preset.preset`。它接收 `Context`，内部统一转为 `applicationContext`，初始化时调用 `DeviceIdentifier.register(appContext as Application)` 预取 Android_CN_OAID 库的设备标识结果。对外暴露四个读取入口：`getBuildInfo()`、`getRomInfo()`、`getIdentifierInfo()`、`getTelephonyInfo()`。

实现层面遵循以下约定：

- Build 与 ROM 字段以原始系统值为主，不做厂商归类、风险判断或聚合评分。
- ROM 字段通过反射读取 `android.os.SystemProperties.get(key)`，字段名用下划线映射实际 system property key。
- 标识类字段分为 MSA/GMS/DRM 标识与 Telephony 受限硬件标识两组；读取失败、权限不足、系统限制或异常时统一返回空字符串。
- 代码用 KDoc 标注每个读取方法的生命周期、权限声明、是否触发弹窗、返回值和 PII 属性；实际方法内部以 `try/catch` 兜底。
- `VAID` / `AAID` 因当前 `DeviceIdentifier` 未暴露同步读取方法，在 `IdentifierInfo` 中保留字段但返回空字符串。
- `IMEI` 字段承接库内 fallback：优先 IMEI，空时可能降级为 MEID；当前实现未单独暴露 MEID 字段。

### 0.1.1 `BuildInfo`

设备身份型号与 Android 构建系统版本字段，全部读取自 `android.os.Build` 或其兼容方法。

| 字段 | 含义 / 来源 |
|------|-------------|
| `brand` | `Build.BRAND` |
| `model` | `Build.MODEL` |
| `manufacturer` | `Build.MANUFACTURER` |
| `device` | `Build.DEVICE` |
| `product` | `Build.PRODUCT` |
| `androidVersion` | `Build.VERSION.RELEASE` |
| `sdkInt` | `Build.VERSION.SDK_INT` |
| `board` | `Build.BOARD` |
| `hardware` | `Build.HARDWARE` |
| `display` | `Build.DISPLAY` |
| `fingerprint` | `Build.FINGERPRINT` |
| `id` | `Build.ID` |
| `serial` | `Build.getSerial()` / `Build.SERIAL` fallback |

### 0.1.2 `RomInfo`

ROM 相关 system property 原始读取结果，不汇总、不归一化、不做 ROM 归类。

| 字段 | 对应 system property |
|------|----------------------|
| `ro_miui_ui_version_name` | `ro.miui.ui.version.name` |
| `ro_miui_ui_version_code` | `ro.miui.ui.version.code` |
| `ro_mi_os_version_name` | `ro.mi.os.version.name` |
| `ro_mi_os_version_code` | `ro.mi.os.version.code` |
| `ro_mi_os_version_incremental` | `ro.mi.os.version.incremental` |
| `ro_build_version_emui` | `ro.build.version.emui` |
| `ro_build_version_magic` | `ro.build.version.magic` |
| `ro_build_version_opporom` | `ro.build.version.opporom` |
| `ro_build_version_oplusrom` | `ro.build.version.oplusrom` |
| `ro_build_version_realmeui` | `ro.build.version.realmeui` |
| `ro_vivo_os_name` | `ro.vivo.os.name` |
| `ro_vivo_os_version` | `ro.vivo.os.version` |
| `ro_vivo_rom` | `ro.vivo.rom` |
| `ro_vivo_rom_version` | `ro.vivo.rom.version` |
| `ro_build_version_oneui` | `ro.build.version.oneui` |
| `ro_flyme_published` | `ro.flyme.published` |
| `ro_meizu_setupwizard_flyme` | `ro.meizu.setupwizard.flyme` |
| `ro_smartisan_version` | `ro.smartisan.version` |
| `ro_letv_release_version` | `ro.letv.release.version` |
| `ro_lenovo_lvp_version` | `ro.lenovo.lvp.version` |
| `ro_build_nubia_rom_name` | `ro.build.nubia.rom.name` |
| `ro_build_nubia_rom_code` | `ro.build.nubia.rom.code` |
| `ro_build_version_oxygen` | `ro.build.version.oxygen` |
| `ro_build_version_harmony` | `ro.build.version.harmony` |
| `ro_build_version_harmony_type` | `ro.build.version.harmony_type` |
| `hw_sc_build_platform_version` | `hw_sc.build.platform.version` |

### 0.1.3 `IdentifierInfo`

设备标识族读取结果，覆盖 MSA 匿名标识、Android ID、Google Advertising ID 与 Widevine DRM 设备标识。

| 字段 | 含义 / 读取路径 |
|------|-----------------|
| `oaid` | OAID，`DeviceIdentifier.getOAID(appContext)` |
| `vaid` | VAID，当前实现保留字段但返回空字符串 |
| `aaid` | AAID，当前实现保留字段但返回空字符串 |
| `androidId` | Android ID / SSAID，`DeviceIdentifier.getAndroidID(appContext)` |
| `gaid` | GAID，`AdvertisingIdClient.getAdvertisingIdInfo(appContext).id` |
| `widevineDeviceId` | Widevine Device ID，`DeviceIdentifier.getWidevineID()` |

### 0.1.4 `TelephonyInfo`

受限硬件标识族与运营商 / 归属地族读取结果，主要来自 `TelephonyManager` 和 `DeviceIdentifier.getIMEI(appContext)`。

| 字段 | 含义 / 读取路径 |
|------|-----------------|
| `imei` | IMEI / MEID 合并读取，`DeviceIdentifier.getIMEI(appContext)` |
| `imsi` | IMSI，`TelephonyManager.getSubscriberId` |
| `iccid` | ICCID，`TelephonyManager.getSimSerialNumber` |
| `line1Number` | MSISDN / 本机号码，`TelephonyManager.getLine1Number` |
| `simOperator` | SIM Operator MCC-MNC，`TelephonyManager.getSimOperator` |
| `networkOperator` | 当前注册网络运营商 MCC-MNC，`TelephonyManager.getNetworkOperator` |
| `simState` | SIM 卡状态，`TelephonyManager.getSimState` |
| `simOperatorName` | SIM 运营商显示名称，`TelephonyManager.getSimOperatorName` |

---

## 1. 主清单（当前版 v2.0 · 447 条）

### 1.1 系统标识（2 条）

| # | 维度 | 来源 | 风险信号？ | 备注 |
|---|------|------|----------|------|
| FZ-001 | Device fingerprint（跨 session 设备整体指纹引用） | C-016 §F-8.1（Feedzai） | 否 | **双归位**：系统标识 + 时间与稳定性；Digital Trust 公开表达"device fingerprint, usage across sessions"；不等同 SSAID；服务端综合指纹引用 |
| TD-033 | country（国家代码） | C-023 §F-8.1（同盾） | 否 | 部分覆盖 SI-002；同盾开源字段 |

> **双归位引用**：本分组中 FZ-001 另见时间与稳定性分组（跨 session 设备指纹引用）。

### 1.2 设备与 Build（27 条）

| # | 维度 | 来源 | 风险信号？ | 备注 |
|---|------|------|----------|------|
| M-003 | `device_memory` | C-005 附录 A #12（Fingerprint） | 否 | 新增 |
| M-004 | `languages` | C-005 附录 A #13（Fingerprint） | 否 | 新增（归位"设备与 Build"） |
| S-006 | 内核版本 + 内核编译选项 | C-003 §5.1 补充项 | 否 | 公开厂商材料提及 |
| X-004 | Android phone state for profiling | C-010 §F-8.1（ThreatMetrix） | 否 | `READ_PHONE_STATE` optional better profiling；具体字段待确认 |
| SI-008 | Build tags risk（test-keys 等） | C-011 §F-8.1（Sift） | **是** | **双归位**：设备与 Build + 风险与异常态；Sift 公开采集 `Build.TAGS` |
| DX-003 | DEVICE_ID | C-022 §F-8.1（顶象） | 否 | **新增**；PrivacyFlag `DEVICE_ID` 明示；与 ANDROID_ID 区分；具体含义待 SDK 文档展开 |
| TD-004 | `host` | C-023 §F-8.1（同盾） | 否 | **新增**（同盾开源独有）；`Build.HOST` |
| TD-005 | `abiType` | C-023 §F-8.1（同盾） | 否 | **新增**（同盾开源独有）；`Build.SUPPORTED_ABIS`；CPU 架构列表 |
| TD-006 | `cpuHardware` | C-023 §F-8.1（同盾） | 否 | **新增**（同盾开源独有）；`/proc/cpuinfo` Hardware 字段 |
| TD-007 | `cpuProcessor` | C-023 §F-8.1（同盾） | 否 | **新增**（同盾开源独有）；`/proc/cpuinfo` Processor 字段 |
| TD-008 | `coresCount` | C-023 §F-8.1（同盾） | 否 | **新增**（同盾开源独有）；CPU 核心数 |
| TD-009 | `vbMetaDigest` | C-023 §F-8.1（同盾） | 否 | **新增**（同盾开源独有）；Verified Boot 启动验证摘要；设备启动完整性校验 |
| WY-001 | cpu_model（CPU 型号） | C-024 §F-8.1（网易易盾） | 否 | **新增**；三方 SDK 采集说明明示"CPU型号" |
| WY-002 | device_memory_and_storage（设备内存及存储大小） | C-024 §F-8.1（网易易盾） | 否 | **新增**；扩展 M-003 device_memory 到"内存 + 存储大小" |
| WY-003 | device_architecture（设备架构） | C-024 §F-8.1（网易易盾） | 否 | **新增**；与 C-006 BuildSerial 不同源（设备架构 vs Build.SERIAL） |
| WY-004 | baseband_info（基带信息） | C-024 §F-8.1（网易易盾） | 否 | **新增**；与 S-003 Build 序列部分覆盖 |
| WY-005 | accessibility_services_list（辅助功能列表） | C-024 §F-8.1（网易易盾） | 否 | **新增**；与 S-007 不同源 |
| WY-006 | emulator_type_as_device_feature（模拟器类型作为设备特征） | C-024 §F-8.1（网易易盾） | 否 | **新增**；与 M-011 Android Emulator 视角不同——"设备特征" vs "风险信号" |
| GT-002 | 设备类型（phone / tablet / foldable 等形态） | C-026 §F-8.1（极验） | 否 | **新增**；与 M-001/M-002 部分覆盖 |
| GT-003 | 系统属性（Build.* 字段集合） | C-026 §F-8.1（极验） | 否 | **新增**；与 S-003 Build 序列部分覆盖 |
| YJ-001 | Build.FINGERPRINT 篡改检测（502 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；**双归位**：设备与 Build + 风险与异常态；与 S-003 同源但服务端篡改判定 |
| YJ-002 | 设备信息篡改综合识别（1001 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；**双归位**：设备与 Build + 风险与异常态 |
| YJ-003 | OAID 篡改检测（503 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；**三重归位**：系统标识 + 设备与 Build + 风险与异常态；与 C-001 OAID 互补 |
| YJ-004 | IMEI 篡改检测（501 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；**双归位**：设备与 Build + 风险与异常态；与 C-003 IMEI 互补 |
| YJ-005 | IMSI 篡改检测（504 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；**双归位**：设备与 Build + 风险与异常态；与 C-004 IMSI 互补 |
| JD-011 | 云手机检测（产品功能明示） | C-020 §F-8.1（京东云） | **是** | **新增**；**双归位**：风险与异常态 + 设备与 Build；与 SEON SE-018 Possible Cloud Device 同模式 |

**部分新增（1 条）**（不重复编号）：

| 部分编号 | 维度 | 来源 | 归位 | 备注 |
|---------|------|------|------|------|
| TD-043 | `allowMockLocation` | C-023 §F-8.1（同盾） | 设备与 Build | 部分覆盖 M-016 Geolocation Spoofing |

> **双归位引用**：本分组中 SI-008 可作为风险信号的双归位维度另见：风险与异常态分组；YJ-001~YJ-005 另见风险与异常态分组（设备信息篡改检测）；JD-011 另见风险与异常态分组（云手机检测）。

### 1.3 媒体与能力（3 条）

| # | 维度 | 来源 | 风险信号？ | 备注 |
|---|------|------|----------|------|
| S-002 | MediaDrm ID | C-003 §5.1 补充项 | **是** | **双归位**：媒体与能力 + 风险与异常态（按 C-003 Q2 模式） |
| T-013 | Hardware-backed keystore unavailable | C-009 §F-8.1（Talsec） | **是** | **双归位**：媒体与能力 + 风险与异常态；安全硬件能力缺失 |
| U-002 | MobileSDK hardware access context（camera / microphone / geolocation） | C-012 §F-8.1（Sumsub） | 否 | MobileSDK 管理 camera、microphone、geolocation 等硬件组件访问；不推断具体硬件指纹 |

> **双归位引用**：本分组中 S-002 / T-013 可作为风险信号的双归位维度另见：风险与异常态分组。

### 1.4 显示、输入、传感器（24 条）

| # | 维度 | 来源 | 风险信号？ | 备注 |
|---|------|------|----------|------|
| S-004 | 传感器指纹（加速度计 / 陀螺仪偏置） | C-003 §5.1 补充项 | 否 | 公开学术与厂商材料提及 |
| S-005 | 电池曲线 / 充电控制器 ID | C-003 §5.1 补充项 | 否 | 公开厂商材料提及（硬件身份锚点） |
| M-005 | `battery_level` | C-005 附录 A #10（Fingerprint） | 否 | S-005 扩展（瞬时电量，与硬件指纹共存） |
| M-006 | `battery_low_power_mode` | C-005 附录 A #11（Fingerprint） | 否 | 新增 |
| SE-001 | Audio status + volume | C-008 附录 A #1（SEON） | 否 | SEON 独有；设备偏好 / 音频状态信号 |
| SE-024 | charging status | C-008 附录 A #24（SEON） | 否 | M-005 扩展；充电状态与瞬时电量并列 |
| SI-004 | Battery state / health / plug state | C-011 §F-8.1（Sift） | 否 | Sift Android app state 采集电池状态、健康状态和充电来源 |
| C-009 | `screen_resolution` | C-018 §F-8.1（阿里云） | 否 | 新增；SDK 合规文档明示采集屏幕分辨率（`NO_BASIC_DEVICE_DATA`） |
| DX-004 | `sensor_list`（传感器类型列表） | C-022 §F-8.1（顶象） | 否 | **新增**；PrivacyFlag `GET_SENSOR_LIST` 明示；与 S-004 传感器指纹"偏置数据"区分；这是"类型列表"而非"指纹偏置" |
| TD-010 | `screenInches` | C-023 §F-8.1（同盾） | 否 | **新增**（同盾开源独有）；屏幕尺寸英寸 |
| TD-011 | `screenBrightness` | C-023 §F-8.1（同盾） | 否 | **新增**（同盾开源独有）；屏幕亮度 |
| TD-012 | `screenOffTimeout` | C-023 §F-8.1（同盾） | 否 | **新增**（同盾开源独有）；屏幕休眠时长 |
| TD-013 | `batteryHealthStatus` | C-023 §F-8.1（同盾） | 否 | **新增**（同盾开源独有）；电池健康状态（good / cold / dead / overheat / over voltage / unknown） |
| TD-014 | `batteryTemp` | C-023 §F-8.1（同盾） | 否 | **新增**（同盾开源独有）；电池温度 |
| TD-015 | `batteryTotalCapacity` | C-023 §F-8.1（同盾） | 否 | **新增**（同盾开源独有）；电池总容量 mAh |
| TD-036 | `batteryStatus` | C-023 §F-8.1（同盾） | 否 | 部分覆盖 SI-004 battery state |
| FZ-007 | Gyroscopic data（陀螺仪行为生物特征） | C-016 §F-8.1（Feedzai） | 否 | **新增**；Feedzai 公开明确把 gyroscopic data 作为 Android 行为信号源；与 S-004 传感器指纹"硬件身份锚点"语义不同——是"行为生物特征"用途 |
| GT-004 | DETECT_SCREEN_RECORDING（API 35+ 屏幕录制检测） | C-026 §F-8.1（极验） | **是** | **新增**；**双归位**：显示、输入、传感器 + 风险与异常态；与 T-006 Screen recording detected 路径类似 |
| GT-005 | 屏幕尺寸 | C-026 §F-8.1（极验） | 否 | **新增**；与 C-009 screen_resolution 部分覆盖 |
| GT-023 | Web 端屏幕颜色比特值（双归位候选） | C-026 §F-8.1（极验） | **是** | **新增**；**双归位**：显示、输入、传感器 + 风险与异常态；与 DX-008 browser_color_depth 同源 |
| YJ-006 | 页面监听（221 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；**双归位**：显示、输入、传感器 + 风险与异常态；客户端屏幕监控类信号（与 Talsec T-005 截图检测 / T-006 录屏检测 同源但更广义） |

**部分新增（1 条）**：

- WY-012 screen_brightness（显示、输入、传感器，部分覆盖；C-009 screen_resolution 部分覆盖）

### 1.5 运行时与 WebView（31 条）

| # | 维度 | 来源 | 风险信号？ | 备注 |
|---|------|------|----------|------|
| S-010 | Runtime clusters（WebView UA / runtime 指纹聚类） | C-003 §5.1 补充项 | 否 | WORKSHOP-003 列为"条件必选" |
| SE-005 | WebGL 指纹 | C-008 附录 A #5（SEON） | 否 | S-010 扩展 |
| SE-006 | Canvas 指纹 | C-008 附录 A #6（SEON） | 否 | S-010 扩展 |
| SE-007 | Fonts 指纹 | C-008 附录 A #7（SEON） | 否 | S-010 扩展 |
| SE-008 | Spoofing Hash | C-008 附录 A #8（SEON） | 否 | SEON 独有 hash；具体输入数据未公开 |
| SE-009 | Math Hash | C-008 附录 A #9（SEON） | 否 | SEON 独有 hash；具体输入数据未公开 |
| SE-010 | MIME Type Hash | C-008 附录 A #10（SEON） | 否 | SEON 独有 hash；媒体处理能力相关 |
| SE-011 | System Colors Hash | C-008 附录 A #11（SEON） | 否 | SEON 独有 hash；系统视觉设置相关 |
| SE-022 | HTML Canvas Element Spoofing | C-008 附录 A #22（SEON） | **是** | **双归位**：运行时与 WebView + 风险与异常态 |
| SI-013 | Web Device Fingerprinting session reference | C-011 §F-8.1（Sift） | 否 | **双归位**：运行时与 WebView + 时间与稳定性；Sift JavaScript / beacon 采集引用 |
| DX-008 | `browser_color_depth`（Web 端浏览器颜色深度） | C-022 §F-8.1（顶象） | **是** | **双归位**：运行时与 WebView + 风险与异常态；Web 端公开材料明示"是否篡改浏览器颜色深度" |
| DX-009 | `browser_platform`（Web 端浏览器平台信息） | C-022 §F-8.1（顶象） | **是** | **双归位**：运行时与 WebView + 风险与异常态；Web 端公开材料明示"浏览器平台与 ua 是否一致" |
| DX-010 | `cookie_enabled`（Web 端 cookie 状态） | C-022 §F-8.1（顶象） | **是** | **双归位**：运行时与 WebView + 风险与异常态；Web 端公开材料明示"是否禁用 cookie" |
| I-016 | Privacy browser detection | C-013 §F-8.1（Incognia） | **是** | **新增**；**双归位**：运行时与 WebView + 风险与异常态；brave / tor / duckduckgo 等 fingerprint 防御浏览器 |
| B-007 | RASP XVM virtualized runtime engine | C-014 §F-8.1（Bureau） | 否 | **新增**；OS-level RASP，使用 XVM 自定义字节码；比 Talsec 反调试更深一层 |
| B-024 | Bureau Bot Detection Honeypot HTML elements | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：运行时与 WebView + 风险与异常态 |
| B-025 | Bureau Bot Detection JavaScript Computations | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：运行时与 WebView + 风险与异常态 |
| TD-016 | defaultInputMethod（默认输入法包名） | C-023 §F-8.1（同盾） | 否 | **新增**（同盾开源独有）；`Settings.Secure.DEFAULT_INPUT_METHOD`；用于检测非主流输入法（可能是改机工具） |
| TD-017 | filesAbsolutePath | C-023 §F-8.1（同盾） | 否 | **新增**（同盾开源独有）；`getFilesDir().getAbsolutePath()` |
| TD-018 | accessibilityEnabled | C-023 §F-8.1（同盾） | **是** | **新增**；**双归位**：运行时与 WebView + 风险与异常态；与黑灰产工具关联 |
| TD-019 | dataRoaming | C-023 §F-8.1（同盾） | 否 | **新增**（同盾开源独有）；`Settings.Global.DATA_ROAMING` |
| TD-041 | developmentSettingEnabled | C-023 §F-8.1（同盾） | 否 | **部分覆盖**；`Settings.Global.DEVELOPMENT_SETTINGS_ENABLED`；与 M-015 developer tools 同源 |
| TD-042 | adbEnabled | C-023 §F-8.1（同盾） | 否 | **部分覆盖**；`Settings.Global.ADB_ENABLED`；与 M-015 developer tools 同源 |
| TD-043 | allowMockLocation | C-023 §F-8.1（同盾） | 否 | **部分覆盖**；`Settings.Secure.ALLOW_MOCK_LOCATION`；与 M-016 同源 |
| WY-015 | view_click_event_collection | C-024 §F-8.1（网易易盾） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| WY-016 | touch_event_ai_detection | C-024 §F-8.1（网易易盾） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| UN-015 | Tampered browser（Unit21 公开承认） | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：运行时与 WebView + 风险与异常态；与 SE-022 同源 |
| GT-016 | web_touch_enabled（Web 端触屏能力） | C-026 §F-8.1（极验） | 否 | **新增**（极验独有 Web 端）；`ontouchstart` 探测 |
| GT-017 | web_referer（Web 端 referer） | C-026 §F-8.1（极验） | 否 | **新增**（极验独有 Web 端）；`document.referrer` |
| GT-018 | wifi_ssid_bssid（Web 端 Wi-Fi 不可用，独立字段） | C-026 §F-8.1（极验） | 否 | **新增**（极验独有 Web 端）；与 C-011 不同——Web 端字段 |

> **双归位引用**：本分组中 SE-022 / DX-008 / DX-009 / DX-010 / I-016 / B-024 / B-025 / TD-018 / WY-015 / WY-016 / UN-015 可作为风险信号的双归位维度另见：风险与异常态分组；SI-013 另见时间与稳定性分组。

### 1.6 网络与环境（41 条）

| # | 维度 | 来源 | 风险信号？ | 备注 |
|---|------|------|----------|------|
| S-009 | Coarse network（IP / ASN / coarse geo） | C-003 §5.1 补充项 | 否 | WORKSHOP-003 列为"条件必选" |
| M-007 | Timezone（设备系统 IANA） | C-005 附录 A #15（Fingerprint） | 否 | S-009 细化 |
| M-008 | IP Geolocation（IP 派生的 lat/long/city/country/ASN/datacenter_result） | C-005 附录 A #16（Fingerprint） | 否 | S-009 扩展 |
| SE-002 | DNS tracking | C-008 附录 A #2（SEON） | 否 | SEON 显式提及 IP address & DNS tracking |
| SE-003 | TCP/IP + TLS fingerprints | C-008 附录 A #3（SEON） | 否 | Residential proxy / VPN detection 的客户端可上送低层网络信号 |
| SE-004 | WebRTC IP detection | C-008 附录 A #4（SEON） | 否 | Default rule HC101 相关；WebRTC 多 IP 检测 |
| T-009 | Unsecure Wi-Fi | C-009 §F-8.1（Talsec） | **是** | **双归位**：网络与环境 + 风险与异常态；不安全 Wi-Fi 环境 |
| T-015 | System VPN detected | C-009 §F-8.1（Talsec） | **是** | **双归位**：网络与环境 + 风险与异常态；Android system VPN 本地状态 |
| X-002 | Mobile Location Services（GPS / coarse location） | C-010 §F-8.1（ThreatMetrix） | 否 | Android SDK location permissions + location services profiling |
| X-003 | Android Wi-Fi state for profiling | C-010 §F-8.1（ThreatMetrix） | 否 | `ACCESS_WIFI_STATE` / `CHANGE_WIFI_STATE` profiling 输入 |
| X-009 | Location / distance anomaly（GPS / IP / GeoIP mismatch） | C-010 §F-8.1（ThreatMetrix） | **是** | **双归位**：网络与环境 + 风险与异常态；位置距离异常 / true location 判断 |
| SI-002 | Mobile carrier + SIM country code | C-011 §F-8.1（Sift） | 否 | Sift Android SDK 采集 carrier name 与 SIM ISO country code |
| SI-005 | Local network interface addresses | C-011 §F-8.1（Sift） | 否 | Sift Android app state 枚举 non-loopback network interface addresses |
| U-007 | Advanced IP risk profile（risk score / ASN / ISP / proxy / VPN / TOR） | C-012 §F-8.1（Sumsub） | **是** | **双归位**：网络与环境 + 风险与异常态；Advanced IP Check 输出 IP 风险画像 |
| U-008 | IP / document / address / EXIF country mismatch and distant IP locations | C-012 §F-8.1（Sumsub） | **是** | **双归位**：网络与环境 + 风险与异常态；IP 与证件、地址、照片元数据和连续位置不一致 |
| C-010 | DNS IP | C-018 §F-8.1（阿里云） | 否 | 新增；SDK 合规文档明示采集 DNS IP（`NO_EXTRA_DEVICE_DATA`） |
| C-011 | connected_WiFi_info（SSID + BSSID） | C-018 §F-8.1（阿里云） | 否 | T-009 细化；连接态 Wi-Fi 指纹的具体字段 |
| C-012 | nearby_WiFi_list | C-018 §F-8.1（阿里云） | **是** | **双归位**：网络与环境 + 风险与异常态；iOS 合规文档明示 LAN 探测服务于"设备牧场 / 群控识别" |
| C-014 | MAC 地址 | C-018 §F-8.1（阿里云） | **是** | **双归位**：网络与环境 + 风险与异常态；**Android 6+ 应用层获取受限**（系统返回固定 02:00:00:00:00:00），公开材料保留声明是"采集意图"而非"采集能力" |
| DX-005 | `internal_ip`（内网 IP） | C-022 §F-8.1（顶象） | 否 | **新增**；PrivacyFlag `GET_IP_ADDR` 明示；与 M-008 IP Geolocation / SE-002 DNS tracking 区分；局域网内 IP 地址 |
| DX-006 | `bluetooth_info`（蓝牙信息：附近蓝牙设备列表 + 已连接蓝牙设备 MAC） | C-022 §F-8.1（顶象） | 否 | **新增**；PrivacyFlag `GET_BT_INFO` 明示；与 S-009 / C-012 nearby_WiFi_list 路径类似但服务端用途不同 |
| I-001 | Indoor location fingerprint（< 10 feet，30x more accurate than GPS，Wi-Fi / Bluetooth / sensor fusion） | C-013 §F-8.1（Incognia） | 否 | **新增**（Incognia 独有）；与 S-009 Coarse network / M-008 IP Geolocation 形成"粗 / 细"两套定位能力 |
| I-004 | Address / location binding verification（device + 室内 location + 物理 address 三方融合） | C-013 §F-8.1（Incognia） | **是** | **新增**；**双归位**：网络与环境 + 行为序列 |
| I-015 | IP to Location mapping consistency check | C-013 §F-8.1（Incognia） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态；Web / 移动端 IP 推断位置与设备实际位置 / 用户声称 address 一致性检查 |
| I-017 | Web Geolocation tampering detection | C-013 §F-8.1（Incognia） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态；与 M-016 Android native 区分 |
| B-013 | RASP Packet sniffing & MITM attack prevention | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态 |
| B-014 | RASP HTTP Proxy & L2 VPN bypass detection | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态 |
| B-015 | RASP Geo spoofing detection（true IP / VPN exit / cell tower comparison） | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态；"reveals true location, not just spoof flag" |
| DV-007 | IP Reputation Service 风险画像 | C-015 §F-8.1（DataVisor） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态；与 M-017 / U-007 同源 |
| DV-027 | GPS Spoofing detection | C-015 §F-8.1（DataVisor） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态 |
| DV-028 | P2P VPN Networks detection | C-015 §F-8.1（DataVisor） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态 |
| FZ-012 | Feedzai IQ Signals（BIN / domain / geo 预计算 risk attributes） | C-016 §F-8.1（Feedzai） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态；与 U-007 Advanced IP risk profile 类似但更广 |
| UN-014 | VPN detection（Unit21 公开承认） | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态；与 T-015 System VPN 互补 |
| YJ-007 | HTTP 代理检测（210 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态 |
| YJ-008 | VPN 代理（209 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态；与 T-015 同源 |
| WY-007 | network_proxy（网络代理） | C-024 §F-8.1（网易易盾） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态；与 T-015 System VPN 路径类似但单独字段名 |
| WY-008 | wifi_mac_address_separated（WIFI MAC 地址单独） | C-024 §F-8.1（网易易盾） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态；与 C-014 MAC 地址 部分覆盖 |
| WY-009 | sim_card_state_runtime（SIM 卡状态运行时） | C-024 §F-8.1（网易易盾） | **是** | **新增**；与 SI-002 Mobile carrier 视角不同——运行时 SIM 状态 vs 运营商标识 |
| GT-006 | 网络制式 / 网络类型（2G/3G/4G/5G/WIFI/ETHERNET） | C-026 §F-8.1（极验） | 否 | **新增**；与 S-009 Coarse network 部分覆盖 |
| GT-007 | Sim 卡状态 | C-026 §F-8.1（极验） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态；与 C-005 SimSerial 部分覆盖 |
| GT-008 | 定位信息 | C-026 §F-8.1（极验） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态；与 X-002 同源 |
| GT-021 | network_type（Web 端网络类型） | C-026 §F-8.1（极验） | 否 | **新增**（极验独有）；Web 端网络类型 |
| GT-022 | 定位信息（双归位候选） | C-026 §F-8.1（极验） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态；与 GT-008 互补 |
| TD-045 | `httpProxy` | C-023 §F-8.1（同盾） | 否 | 部分覆盖 SE-003 TCP/IP + TLS fingerprints；同盾开源字段名 httpProxy |

> **双归位引用**：本分组中可作为风险信号的双归位维度另见：风险与异常态分组（datacenter_result / M-017、Unsecure Wi-Fi / T-009、System VPN / T-015、Location / distance anomaly / X-009、Advanced IP risk profile / U-007、IP mismatch and distant IP locations / U-008、nearby_WiFi_list / C-012、MAC 地址 / C-014，以及 11 家新增的 I-004 / I-015 / I-017 / B-013 / B-014 / B-015 / DV-007 / DV-027 / DV-028 / FZ-012 / UN-014 / YJ-007 / YJ-008 / WY-007 / WY-008 / GT-007 / GT-008 / GT-022）。

### 1.7 风险与异常态（62 条）

| # | 维度 | 来源 | 风险信号？ | 备注 |
|---|------|------|----------|------|
| M-009 | Rooted Device（`root_apps`） | C-005 附录 A #1（Fingerprint） | 是 | 本地探测信号 |
| M-010 | Frida（`frida`） | C-005 附录 A #2（Fingerprint） | 是 | 本地探测信号 |
| M-011 | Android Emulator（`emulator`） | C-005 附录 A #3（Fingerprint） | 是 | 本地探测 + 服务端综合 |
| M-012 | Cloned App（`cloned_app`） | C-005 附录 A #4（Fingerprint） | 是 | Android only |
| M-013 | MitM Attack（`mitm_attack`） | C-005 附录 A #5（Fingerprint） | 是 | 通信链路完整性校验 |
| M-014 | Tampered Request（`tampering` + `anomaly_score`） | C-005 附录 A #6（Fingerprint） | 是 | 本地 + 服务端综合 |
| M-015 | Developer Tools on mobile（`developer_tools`） | C-005 附录 A #7（Fingerprint） | 是 | developer options / ADB / USB debugging / Wireless debugging |
| M-016 | Geolocation Spoofing（`location_spoofing`） | C-005 附录 A #8（Fingerprint） | 是 | 系统 location provider 与 GPS sensor 对比 |
| M-017 | `ip_info.datacenter_result` + `datacenter_name` | C-005 附录 A #17（Fingerprint） | **是** | **双归位**：网络与环境 + 风险与异常态（按 S-002 模式） |
| SE-012 | Possible Vishing | C-008 附录 A #12（SEON） | 是 | SEON 独有；语音钓鱼风险信号 |
| SE-013 | Active Call / Ongoing Call（Android only） | C-008 附录 A #13（SEON） | 是 | SEON 独有；可作为 vishing 复合 trigger 的事实信号 |
| SE-014 | Remote Control Active（Android Native） | C-008 附录 A #14（SEON） | 是 | SEON 独有；`is_remote_control_connected` / `remote_control_provider` |
| SE-015 | Screen Mirroring（Android Native） | C-008 附录 A #15（SEON） | 是 | SEON 独有；`is_screen_being_mirrored` |
| SE-016 | Screen Captured（iOS Native） | C-008 附录 A #16（SEON） | 是 | SEON 独有；iOS only，保留为跨平台对照信号 |
| SE-017 | Interfering Apps（Android Native） | C-008 附录 A #17（SEON） | 是 | SEON 独有；潜在远程工具 / 干扰应用 |
| SE-018 | Possible Cloud Device（Android Native） | C-008 附录 A #18（SEON） | 是 | SEON 独有；cloud-hosted device farm / virtualized Android hardware-level indicators |
| SE-019 | Possible Device Farm（Android + iOS + JS） | C-008 附录 A #19（SEON） | 是 | SEON 独有；Android Native 与 JS Agent trigger 需按厂商语义区分 |
| SE-020 | Remote Access 三 flag（Web：interaction / screen_sharing / remote_control） | C-008 附录 A #20（SEON） | 是 | SEON 独有；Web 远程交互 / 屏幕共享 / 远程控制信号 |
| SE-021 | Experimental User-Agent Spoofing | C-008 附录 A #21（SEON） | 是 | SEON 独有；UA 字符串篡改风险信号 |
| SE-023 | Private browsing / Incognito | C-008 附录 A #23（SEON） | 是 | SEON 独有；主要用于 Web / WebView 风险识别 |
| T-001 | App integrity / tamper / repackaging | C-009 §F-8.1（Talsec） | 是 | 包名 + 签名证书 hash + app 完整性；与 M-014 request tampering 区分 |
| T-002 | Untrusted installation source / unofficial store | C-009 §F-8.1（Talsec） | 是 | Android 安装来源可信度 |
| T-003 | Debugger attached | C-009 §F-8.1（Talsec） | 是 | 逆向调试环境 |
| T-004 | Obfuscation issues | C-009 §F-8.1（Talsec） | 是 | app 保护强度不足 / 混淆异常 |
| T-005 | Screenshot detected | C-009 §F-8.1（Talsec） | 是 | Android 14+ 屏幕截图检测 |
| T-006 | Screen recording detected | C-009 §F-8.1（Talsec） | 是 | Android 15+ 录屏检测 |
| T-007 | Multi-instance / app multi-opening | C-009 §F-8.1（Talsec） | 是 | 多开 / 克隆 / 沙箱相关风险 |
| T-010 | Automation detected（Android local） | C-009 §F-8.1（Talsec） | 是 | Android 本地自动化 / bot / 脚本环境 |
| T-011 | Malware / suspicious apps present | C-009 §F-8.1（Talsec） | 是 | 设备上安装的恶意或可疑应用集合 |
| T-014 | Unlocked device / passcode absent | C-009 §F-8.1（Talsec） | 是 | 本地设备锁屏 / 口令安全状态 |
| X-005 | Root / jailbreak cloaking detection | C-010 §F-8.1（ThreatMetrix） | 是 | root / jailbreak 隐藏或绕过检测；补充 M-009 / M-010 来源 |
| X-006 | Device spoofing detection | C-010 §F-8.1（ThreatMetrix） | 是 | mobile SDK case study 明确 anomaly and device spoofing detection |
| X-007 | Bot patterns | C-010 §F-8.1（ThreatMetrix） | 是 | 服务端行为 / 风险模式识别 |
| X-008 | RAT patterns | C-010 §F-8.1（ThreatMetrix） | 是 | Remote Access Trojan 模式；不同于 Android native 远控会话字段 |
| X-009 | Location / distance anomaly（GPS / IP / GeoIP mismatch） | C-010 §F-8.1（ThreatMetrix） | **是** | **双归位**：网络与环境 + 风险与异常态 |
| X-010 | Digital identity graph links（device / credential / threat / behavior） | C-010 §F-8.1（ThreatMetrix） | **是** | **双归位**：行为序列 + 风险与异常态；服务端关系图谱 |
| X-011 | LexID confidence score / trust score | C-010 §F-8.1（ThreatMetrix） | 是 | 服务端身份关联置信度与信誉完整性 |
| X-012 | History / velocity / previous risk associations | C-010 §F-8.1（ThreatMetrix） | **是** | **双归位**：时间与稳定性 + 风险与异常态 |
| X-013 | Strong ID cryptographic device binding | C-010 §F-8.1（ThreatMetrix） | **是** | **双归位**：时间与稳定性 + 风险与异常态；不等同稳定硬件 ID |
| SI-006 | Root evidence detail（files / packages / dangerous properties / writable dirs） | C-011 §F-8.1（Sift） | 是 | Sift Android SDK 暴露 root evidence 数组，不只是 rooted boolean |
| SI-007 | Installed apps inventory（package_name / app_name） | C-011 §F-8.1（Sift） | **是** | **双归位**：安装与应用上下文 + 风险与异常态；区别于 T-011 suspicious apps |
| SI-008 | Build tags risk（test-keys 等） | C-011 §F-8.1（Sift） | **是** | **双归位**：设备与 Build + 风险与异常态 |
| SI-009 | Sift Global Data Network risk associations | C-011 §F-8.1（Sift） | **是** | **双归位**：行为序列 + 风险与异常态；跨客户 / 跨事件网络关联 |
| SI-010 | Sift risk score / workflow decision output | C-011 §F-8.1（Sift） | 是 | 服务端模型与 workflow 决策输出 |
| SI-011 | Account / payment / content event graph | C-011 §F-8.1（Sift） | **是** | **双归位**：行为序列 + 风险与异常态；服务端多事件图谱 |
| SI-012 | User-device association（user_id + installation_id） | C-011 §F-8.1（Sift） | **是** | **双归位**：时间与稳定性 + 风险与异常态；账号与设备安装引用关联 |
| U-004 | Device Intelligence risk labels aggregate | C-012 §F-8.1（Sumsub） | 是 | Sumsub risk labels 聚合：adblock / bot / clonedApp / emulator / Frida / incognito / rooted / tampering / virtualMachine 等 |
| U-005 | Device Intelligence sessionId continuity | C-012 §F-8.1（Sumsub） | **是** | **双归位**：时间与稳定性 + 风险与异常态；同一 sessionId 关联历史与新 device signals |
| U-006 | Captured device binding to platform event / financial transaction | C-012 §F-8.1（Sumsub） | **是** | **双归位**：行为序列 + 风险与异常态；设备与登录、注册、密码重置、交易等事件绑定 |
| U-007 | Advanced IP risk profile（risk score / ASN / ISP / proxy / VPN / TOR） | C-012 §F-8.1（Sumsub） | **是** | **双归位**：网络与环境 + 风险与异常态 |
| U-008 | IP / document / address / EXIF country mismatch and distant IP locations | C-012 §F-8.1（Sumsub） | **是** | **双归位**：网络与环境 + 风险与异常态 |
| U-009 | Abuse velocity over recent IP / device activity | C-012 §F-8.1（Sumsub） | **是** | **双归位**：时间与稳定性 + 风险与异常态；过去 24-48 小时频繁 abusive behavior |
| U-010 | Multiple devices / multiple mobile devices for one applicant | C-012 §F-8.1（Sumsub） | **是** | **双归位**：时间与稳定性 + 风险与异常态 |
| U-011 | Failed session continuation on another device | C-012 §F-8.1（Sumsub） | **是** | **双归位**：时间与稳定性 + 风险与异常态；WebSDK link 跨设备继续失败 |
| U-012 | Lengthy onboarding session / multiple session attempts | C-012 §F-8.1（Sumsub） | **是** | **双归位**：时间与稳定性 + 风险与异常态 |
| U-014 | Password hash reuse across platform events / accounts | C-012 §F-8.1（Sumsub） | **是** | **双归位**：行为序列 + 风险与异常态；平台事件可上送 passwordHash 用于识别重复使用 |
| U-015 | Fraud Network shared devices / related accounts / similar patterns | C-012 §F-8.1（Sumsub） | **是** | **双归位**：行为序列 + 风险与异常态；blocked users、related accounts、shared devices、similar patterns |
| U-016 | Applicant risk score / risk tags / workflow decision | C-012 §F-8.1（Sumsub） | 是 | 服务端多信号评分、标签和动态工作流决策 |
| U-017 | Privacy settings mode / signal randomization-obfuscation | C-012 §F-8.1（Sumsub） | **是** | **双归位**：运行时与 WebView + 风险与异常态；隐私设置随机化 / 混淆信号输出 |
| C-012 | nearby_WiFi_list | C-018 §F-8.1（阿里云） | **是** | **双归位**：网络与环境 + 风险与异常态；LAN 探测服务于设备牧场识别 |
| C-013 | 黑灰产 App 列表 | C-018 §F-8.1（阿里云） | **是** | **双归位**：安装与应用上下文 + 风险与异常态；已安装应用包名匹配阿里云维护的黑灰产库 |
| C-014 | MAC 地址 | C-018 §F-8.1（阿里云） | **是** | **双归位**：网络与环境 + 风险与异常态；**Android 6+ 应用层获取受限**，资料缺口 |
| DX-007 | application_installed_list（PrivacyFlag `GET_INSTALLED_PACKAGES`） | C-022 §F-8.1（顶象） | **是** | **双归位**：安装与应用上下文 + 风险与异常态；与 SI-007 / C-013 同源；中国厂商公开材料粒度上限 |
| DX-008 | `browser_color_depth`（Web 端浏览器颜色深度） | C-022 §F-8.1（顶象） | **是** | **双归位**：运行时与 WebView + 风险与异常态；Web 端公开材料明示"是否篡改浏览器颜色深度" |
| DX-009 | `browser_platform`（Web 端浏览器平台信息） | C-022 §F-8.1（顶象） | **是** | **双归位**：运行时与 WebView + 风险与异常态；Web 端公开材料明示"浏览器平台与 ua 是否一致" |
| DX-010 | `cookie_enabled`（Web 端 cookie 状态） | C-022 §F-8.1（顶象） | **是** | **双归位**：运行时与 WebView + 风险与异常态；Web 端公开材料明示"是否禁用 cookie" |
| I-007 | Factory Reset event detection | C-013 §F-8.1（Incognia） | **是** | **新增**；**双归位**：时间与稳定性 + 风险与异常态；与 M-018 同源 |
| I-008 | Advanced GPS spoofing detection | C-013 §F-8.1（Incognia） | **是** | **新增**；与 M-016 区分——Incognia 公开"Advanced GPS spoofing"独立维度 |
| I-009 | Data Mismatch detection | C-013 §F-8.1（Incognia） | **是** | **新增**；客户端 SDK 上送数据与服务端预期不一致；与 M-014 Tampered Request 区分 |
| I-010 | Instrumentation tools detection | C-013 §F-8.1（Incognia） | **是** | **新增**；Android Native；Xposed / Substrate / Frida / Hook 框架检测；与 Frida 区分 |
| I-011 | App cloner detection（补 T-007 来源） | C-013 §F-8.1（Incognia） | **是** | **新增**；补 T-007 来源，I-011 编号作为补充来源文档 |
| I-012 | Code injection detection（补 Talsec 来源） | C-013 §F-8.1（Incognia） | **是** | **新增**；补 Talsec hook 来源 |
| I-013 | Debugging mode detection（补 T-003 来源） | C-013 §F-8.1（Incognia） | **是** | **新增**；补 T-003 来源 |
| I-014 | Screen Sharing detection（补 SE-015 来源） | C-013 §F-8.1（Incognia） | **是** | **新增**；补 SE-015 来源，Incognia 公开 iOS Native |
| I-016 | Privacy browser detection | C-013 §F-8.1（Incognia） | **是** | **新增**；**双归位**：运行时与 WebView + 风险与异常态；brave / tor / duckduckgo 等 fingerprint 防御浏览器 |
| I-018 | Web Bot activity detection | C-013 §F-8.1（Incognia） | **是** | **新增**；与 X-007 / U-004 同源 |
| I-019 | Location spoofing app detection | C-013 §F-8.1（Incognia） | **是** | **新增**；检测 fake GPS app 安装；与 M-016 区分 |
| I-021 | Multi-accounting detection | C-013 §F-8.1（Incognia） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| I-022 | Collusion and fraud farm detection | C-013 §F-8.1（Incognia） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| I-023 | Incognia risk score / risk label | C-013 §F-8.1（Incognia） | **是** | **新增**；服务端 AI 评分 |
| I-024 | AI Rule Builder | C-013 §F-8.1（Incognia） | 否 | **新增**；2026 新品；客户用 AI 配置风控规则；配置面，不是计算维度 |
| B-002 | Bureau persistent Device ID | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：时间与稳定性 + 风险与异常态；99.7% / 99.97% persistent，factory reset / firmware / plugins / incognito resilient |
| B-003 | Device Graph / Graph Identity Network | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| B-005 | Continuous Passive Authentication | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| B-006 | Bureau real-time risk score | C-014 §F-8.1（Bureau） | **是** | **新增**；毫秒级 risk score + decisioning actions |
| B-008 | RASP Memory scanning & provision breach | C-014 §F-8.1（Bureau） | **是** | **新增**；RASP 公开"Memory scanning & provision breach detection" |
| B-009 | RASP App cloning / virtualization / device masking | C-014 §F-8.1（Bureau） | **是** | **新增**；RASP 公开 "App cloning, virtualization & device masking detection" |
| B-010 | RASP Software Gesture Attack detection | C-014 §F-8.1（Bureau） | **是** | **新增**；runtime behavior-based |
| B-011 | RASP Overlay Attack (Tapjacking) OS-level IPC | C-014 §F-8.1（Bureau） | **是** | **新增**；OS-level IPC monitoring |
| B-012 | RASP Virtual OS-Based Emulator detection | C-014 §F-8.1（Bureau） | **是** | **新增**；OS-level signals |
| B-013 | RASP Packet sniffing & MITM attack prevention | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态 |
| B-014 | RASP HTTP Proxy & L2 VPN bypass detection | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态 |
| B-015 | RASP Geo spoofing detection（true IP / VPN exit / cell tower comparison） | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态 |
| B-016 | RASP / Device Intelligence Remote Control software / active remote session detection | C-014 §F-8.1（Bureau） | **是** | **新增**；social engineering 反制 |
| B-017 | Bureau Mule Score (three-tier) | C-014 §F-8.1（Bureau） | **是** | **新增**；onboarding → cross-ecosystem → real-time interdiction |
| B-018 | Bureau Graph Identity Network cluster / fund flow | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态；1B+ identities |
| B-019 | Bureau cross-ecosystem mule detection | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| B-020 | Bureau Behavioral Continuity 160+ attributes | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| B-021 | Bureau RASP four-layer Zero Trust | C-014 §F-8.1（Bureau） | 否 | **新增**；Application / Device / Network / Policy 四层框架；控制框架 |
| B-022 | Bureau immutable audit logs | C-014 §F-8.1（Bureau） | 否 | **新增**；timestamped, classified, enforcement-mapped；审计 |
| B-023 | Bureau verification history | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：时间与稳定性 + 风险与异常态 |
| B-024 | Bureau Bot Detection Honeypot HTML elements | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：运行时与 WebView + 风险与异常态；hidden traps |
| B-025 | Bureau Bot Detection JavaScript Computations | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：运行时与 WebView + 风险与异常态；JS challenges |
| DV-002 | Cross-Entity Link Analysis | C-015 §F-8.1（DataVisor） | **是** | **新增**；跨实体链接分析 |
| DV-003 | Cross-customer anonymized signal | C-015 §F-8.1（DataVisor） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态；跨客户匿名信号 |
| DV-004 | Unsupervised ML 风险标签 | C-015 §F-8.1（DataVisor） | **是** | **新增**；无监督算法自动生成 unknown fraud labels |
| DV-005 | Real-time scoring（<100ms） | C-015 §F-8.1（DataVisor） | **是** | **新增**；**双归位**：风险与异常态 + 时间与稳定性 |
| DV-007 | IP Reputation Service 风险画像 | C-015 §F-8.1（DataVisor） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态；与 M-017 / U-007 同源 |
| DV-008 | Email Reputation Service 邮件风险画像 | C-015 §F-8.1（DataVisor） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| DV-011 | AI Decisioning & Automation 决策自动化 | C-015 §F-8.1（DataVisor） | **是** | **新增**；平台级自动决策 |
| DV-012 | Generative AI 风险应用（双刃剑） | C-015 §F-8.1（DataVisor） | **是** | **新增**；防御 + 攻击两端 |
| DV-015 | Anomaly Detection 异常检测 | C-015 §F-8.1（DataVisor） | **是** | **新增**；Fraud Tech 标签 |
| DV-016 | Android Emulator detection（DataVisor 公开承认） | C-015 §F-8.1（DataVisor） | **是** | **新增**；与 M-011 同源 |
| DV-017 | Botnet detection | C-015 §F-8.1（DataVisor） | **是** | **新增**；与 X-007 同源 |
| DV-018 | Hijacked Device detection | C-015 §F-8.1（DataVisor） | **是** | **新增**；DataVisor 公开承认 |
| DV-019 | App Cloner detection | C-015 §F-8.1（DataVisor） | **是** | **新增**；与 M-012 同源 |
| DV-020 | Cloud Phone detection | C-015 §F-8.1（DataVisor） | **是** | **新增**；与 SE-018 Possible Cloud Device 同源 |
| DV-021 | Device Flashing detection | C-015 §F-8.1（DataVisor） | **是** | **新增**；DataVisor 博客《Mobile Fraud Gone in a (Device) Flash》 |
| DV-022 | M1 MacBook 滥用检测 | C-015 §F-8.1（DataVisor） | **是** | **新增**；"It detects bad actors abusing the new Macbooks with M1 chips" |
| DV-023 | Remote Access Trojan (RAT) 模式 | C-015 §F-8.1（DataVisor） | **是** | **新增**；Wiki 公开讨论 RAT 绕过 device fingerprinting 的局限 |
| DV-025 | Credential Stuffing 关联识别 | C-015 §F-8.1（DataVisor） | **是** | **新增**；与 SI-011 同源 |
| DV-026 | SIM Swap Fraud 关联识别 | C-015 §F-8.1（DataVisor） | **是** | **新增**；与 SI-002 同源 |
| DV-027 | GPS Spoofing 关联识别 | C-015 §F-8.1（DataVisor） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态 |
| DV-028 | P2P VPN Networks 关联识别 | C-015 §F-8.1（DataVisor） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态 |
| DV-029 | Deepfakes 关联识别 | C-015 §F-8.1（DataVisor） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态；与 NLP / ID graph 关联 |
| DV-030 | Account Takeover (ATO) 关联识别 | C-015 §F-8.1（DataVisor） | **是** | **新增**；与 X-010 同源 |
| FZ-008 | Android SDK integrity | C-016 §F-8.1（Feedzai） | **是** | **新增**；客户端 SDK 完整性独立校验；与 M-013 / M-014 / T-001 部分重合 |
| FZ-009 | Agentic AI / AI agent detection | C-016 §F-8.1（Feedzai） | **是** | **新增**；Feedzai 公开明确"distinguish AI agents from humans"；与 bot / automation 是不同风险来源 |
| FZ-010 | Active Remote Access Tool / RAT during transaction | C-016 §F-8.1（Feedzai） | **是** | **新增**；区别于 X-008 RAT patterns；FZ-010 强调 scam session 实时识别 |
| FZ-011 | Feedzai IQ Score | C-016 §F-8.1（Feedzai） | **是** | **新增**；服务端 AI 评分；与 U-016 Sumsub applicant risk score 类似 |
| FZ-013 | Cross-account / cross-device link at onboarding | C-016 §F-8.1（Feedzai） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态；onboarding 阶段跨账号 / 跨设备图谱 |
| FZ-014 | Active Defense session termination | C-016 §F-8.1（Feedzai） | **是** | **新增**；服务端主动中断高风险会话；新维度 |
| UN-003 | Real-Time Monitoring sub-250ms | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：风险与异常态 + 时间与稳定性 |
| UN-004 | AI Agent for Detection | C-017 §F-8.1（Unit21） | **是** | **新增**；与 DataVisor Vera 不等同；自动决策代理 |
| UN-005 | AI Agent for Investigation | C-017 §F-8.1（Unit21） | **是** | **新增**；自动案件调查 |
| UN-006 | Adaptive Risk Scoring | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：风险与异常态 + 时间与稳定性 |
| UN-007 | Configurable AI | C-017 §F-8.1（Unit21） | **是** | **新增**；可解释 / 可配置 AI |
| UN-009 | Continuous Compliance Monitoring | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：时间与稳定性 + 风险与异常态 |
| UN-011 | Real-time interdiction（block / step-up / alert / monitor） | C-017 §F-8.1（Unit21） | **是** | **新增**；公开承认四类决策动作 |
| UN-012 | Glass-box Device Risk Score 0-100 | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：风险与异常态 + 时间与稳定性；评分构成可见可审计 |
| UN-013 | Rooted Device（Unit21 公开承认） | C-017 §F-8.1（Unit21） | **是** | **新增**；与 M-009 同源 |
| UN-014 | VPN detection（Unit21 公开承认） | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态 |
| UN-015 | Tampered browser（Unit21 公开承认） | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：运行时与 WebView + 风险与异常态；与 SE-022 同源 |
| UN-016 | Bot detection（Unit21 公开承认） | C-017 §F-8.1（Unit21） | **是** | **新增**；与 X-007 同源 |
| UN-017 | Account farm detection（Unit21 公开承认） | C-017 §F-8.1（Unit21） | **是** | **新增**；与 SE-019 同源 |
| UN-018 | Mule network detection（Unit21 公开承认） | C-017 §F-8.1（Unit21） | **是** | **新增**；与 Bureau B-017 同模式 |
| UN-019 | Synthetic Identity detection | C-017 §F-8.1（Unit21） | **是** | **新增**；Use Case "High-risk signup & synthetic identity detection" |
| UN-020 | Account Takeover (ATO) detection | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| UN-021 | Rapid-fire / velocity fraud detection | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：时间与稳定性 + 风险与异常态 |
| UN-022 | Dormant account reactivation risk | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：时间与稳定性 + 风险与异常态 |
| UN-023 | Fraud ring detection | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| YJ-001 | Build.FINGERPRINT 篡改检测（502 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；**双归位**：设备与 Build + 风险与异常态；与 S-003 同源 |
| YJ-002 | 设备信息篡改综合识别（1001 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；**双归位**：设备与 Build + 风险与异常态；客户端采集 + 服务端一致性校验 |
| YJ-003 | OAID 篡改检测（503 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；**三重归位**：系统标识 + 设备与 Build + 风险与异常态 |
| YJ-004 | IMEI 篡改检测（501 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；**双归位**：设备与 Build + 风险与异常态 |
| YJ-005 | IMSI 篡改检测（504 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；**双归位**：设备与 Build + 风险与异常态 |
| YJ-006 | 页面监听（221 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；**双归位**：显示、输入、传感器 + 风险与异常态；客户端屏幕监控类信号 |
| YJ-007 | HTTP 代理检测（210 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态 |
| YJ-008 | VPN 代理（209 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态 |
| YJ-009 | 云模拟器（302 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；与 M-011 Android Emulator 区分 |
| YJ-010 | 云手机（303 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；云端真机 |
| YJ-011 | 云真机（1100 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；区别于云模拟器，真机云端 |
| YJ-012 | 设备解锁 / bootloader 解锁状态（220 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增** |
| YJ-013 | 异常 ROM 检测（212 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；非官方定制 ROM |
| YJ-014 | 黑灰产 ROM 检测（218 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；黑灰产定制 ROM 库匹配 |
| YJ-015 | 非常见 ROM 检测（219 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；罕见型号 ROM |
| YJ-016 | 鸿蒙Next容器环境（223 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；鸿蒙 Next 容器 |
| YJ-017 | 轻应用/快玩环境（224 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；快应用 / 小游戏 |
| YJ-018 | 摄像头劫持工具枚举（1318 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；与 1006 摄像头劫持合并 |
| YJ-019 | 内存被扫描（1202 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；攻击型信号 |
| YJ-020 | 协议挂请求（1201 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；通信安全 |
| YJ-021 | 系统劫持（213 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增** |
| YJ-022 | 非系统用户 / 多用户切换（216 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；多用户切换检测 |
| YJ-023 | 系统多开 / 系统级虚拟化容器（214 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；系统级虚拟化容器 |
| YJ-024 | 改机工具枚举（1310 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；与 X-006 device spoofing 互补 |
| YJ-025 | 作弊工具大类（1313 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增** |
| YJ-026 | 众包工具（1315 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；众包 / 接码平台工具 |
| YJ-027 | 接码平台工具（1317 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；接码平台专用工具 |
| YJ-028 | 自动发卡工具（1319 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增** |
| YJ-029 | 虚拟位置工具（1320 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；虚拟定位工具 |
| YJ-030 | VPN 工具（1309 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；VPN 工具软件检测 |
| YJ-031 | 模拟器应用（1308 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；模拟器应用类 |
| YJ-032 | 风险引流应用（1307 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；风险引流应用类 |
| YJ-033 | 破解版应用（1306 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；破解版应用类 |
| YJ-035 | 团伙欺诈 + 应用刷量 + 多账号异常（802 + 801 + 901 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；**三重归位**：行为序列 + 时间与稳定性 + 风险与异常态 |
| JD-001 | verifyCode（滑块验证码类型，服务端动态下发） | C-020 §F-8.1（京东云） | **是** | **新增**；服务端动态下发的"何时需要滑块"信号；可作为"高风险行为触发"的事件锚点 |
| JD-002 | isStrategy（传感器采集策略下发，客户端控制） | C-020 §F-8.1（京东云） | **是** | **新增**（京东云独有）；服务端策略下发 + 客户端二次确认机制 |
| JD-003 | isCltSens（传感器采集开关，服务端控制） | C-020 §F-8.1（京东云） | **是** | **新增**（京东云独有）；服务端动态下发"是否执行采集传感器" |
| JD-004 | cltTime（采集总时长，ms） | C-020 §F-8.1（京东云） | **是** | **新增**（京东云独有）；服务端动态下发"采集多久"参数 |
| JD-005 | cltFreq（采集频率，N ms/次） | C-020 §F-8.1（京东云） | **是** | **新增**（京东云独有）；服务端动态下发"采集频率"参数 |
| JD-006 | cltDevice（是否采集设备数据，服务端开关） | C-020 §F-8.1（京东云） | **是** | **新增**（京东云独有）；服务端动态控制"是否采集设备数据"的总开关 |
| JD-007 | cltManMachine（是否采集人机数据，Android only） | C-020 §F-8.1（京东云） | **是** | **新增**（京东云独有）；服务端动态控制"是否采集人机数据" |
| JD-008 | cltAppList（是否采集 app 列表，Android only） | C-020 §F-8.1（京东云） | **是** | **新增**（京东云独有）；服务端动态控制"是否采集 app 列表" |
| JD-009 | ish（是否被 hook，服务端聚合） | C-020 §F-8.1（京东云） | **是** | **新增**；与 M-010 Frida 不同抽象层（服务端聚合）；京东云独有 |
| JD-010 | isj（是否越狱，服务端聚合） | C-020 §F-8.1（京东云） | **是** | **新增**；与 Talsec 越狱检测不同抽象层（服务端聚合） |
| JD-011 | 云手机检测（产品功能明示，标签未公开） | C-020 §F-8.1（京东云） | **是** | **新增**；**双归位**：风险与异常态 + 设备与 Build；与 SE-018 Possible Cloud Device 同模式 |
| TD-018 | accessibilityEnabled | C-023 §F-8.1（同盾） | **是** | **新增**；**双归位**：运行时与 WebView + 风险与异常态；与黑灰产工具关联 |
| TD-021 | Suspected risky ROM | C-023 §F-8.1（同盾） | **是** | **新增**（Pro VS Others 独有）；与 SI-008 Build tags risk 邻近但更广义 |
| TD-022 | 设备无 SIM 卡 | C-023 §F-8.1（同盾） | **是** | **新增**（Pro VS Others 独有）；与 SI-002 Mobile carrier + SIM country code 互补 |
| TD-023 | HTTP 代理风险 | C-023 §F-8.1（同盾） | **是** | **新增**（Pro VS Others 独有）；与开源 httpProxy 字段配合 |
| TD-024 | Android 云模拟器 | C-023 §F-8.1（同盾） | **是** | **新增**（Pro VS Others 独有）；与 SE-018 Possible Cloud Device 同源 |
| TD-025 | Android 云真机 | C-023 §F-8.1（同盾） | **是** | **新增**（Pro VS Others 独有）；与 SE-018 类似但云真机比云模拟器更难识别 |
| TD-026 | 系统虚拟化工具（Parallel Space / Dual Space） | C-023 §F-8.1（同盾） | **是** | **新增**（Pro VS Others 独有）；与 T-007 Multi-instance 同源 |
| TD-027 | 设备改机工具 | C-023 §F-8.1（同盾） | **是** | **新增**（Pro VS Others 独有） |
| TD-028 | 脚本工具 | C-023 §F-8.1（同盾） | **是** | **新增**（Pro VS Others 独有）；与 T-010 Automation detected / X-007 Bot patterns 同源 |
| TD-029 | 群控工具（Device Farm / Device Group） | C-023 §F-8.1（同盾） | **是** | **新增**（Pro VS Others 独有）；与 SE-019 / C-013 同源 |
| TD-030 | Offerwall 软件（广告诈骗） | C-023 §F-8.1（同盾） | **是** | **新增**（Pro VS Others 独有）；与 SE-017 Interfering Apps 同源但更聚焦在 offerwall 类 |
| TD-031 | Replay attack | C-023 §F-8.1（同盾） | **是** | **新增**（Pro VS Others 独有）；与 M-014 Tampered Request + M-013 MitM Attack 同源 |
| TD-032 | 二次打包（Secondary packaging） | C-023 §F-8.1（同盾） | **是** | **新增**（Pro VS Others 独有）；与 T-001 App integrity / tamper / repackaging 同源 |
| TD-047 | androidId | C-023 §F-8.1（同盾） | **是** | **新增**；**双归位**：系统标识 + 风险与异常态；与 S-001 SSAID 同源 |
| TD-048 | multiple risk label | C-023 §F-8.1（同盾） | **是** | **部分覆盖**；T-007 Multi-instance 邻近但同盾开源独有命名 |
| TD-049 | device_info_tampered risk label | C-023 §F-8.1（同盾） | **是** | **部分覆盖**；T-001 / M-014 同源但同盾聚合输出 |
| WY-007 | network_proxy（网络代理） | C-024 §F-8.1（网易易盾） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态 |
| WY-008 | wifi_mac_address_separated（WIFI MAC 地址单独） | C-024 §F-8.1（网易易盾） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态 |
| WY-010 | app_signature_info（应用签名信息） | C-024 §F-8.1（网易易盾） | **是** | **新增**；**双归位**：安装与应用上下文 + 风险与异常态；与 DX-011 app_subject_info 部分覆盖 |
| WY-013 | full_apk_installed_list_query_all_packages | C-024 §F-8.1（网易易盾） | **是** | **新增**；**双归位**：安装与应用上下文 + 风险与异常态；与 SI-007 / C-013 / DX-007 同源 |
| WY-015 | view_click_event_collection | C-024 §F-8.1（网易易盾） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态；与 S-008 Telemetry 同源 |
| WY-016 | touch_event_ai_detection | C-024 §F-8.1（网易易盾） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态；与 SEON behavioral biometrics 部分覆盖 |
| GT-004 | DETECT_SCREEN_RECORDING（API 35+ 屏幕录制检测） | C-026 §F-8.1（极验） | **是** | **新增**；**双归位**：显示、输入、传感器 + 风险与异常态 |
| GT-007 | Sim 卡状态 | C-026 §F-8.1（极验） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态 |
| GT-008 | 定位信息 | C-026 §F-8.1（极验） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态 |
| GT-009 | iOS Rootless 越狱检测 | C-026 §F-8.1（极验） | **是** | **新增**（极验独有）；2025-03-26 文章主推能力 |
| GT-010 | 自定义 ROM 检测 | C-026 §F-8.1（极验） | **是** | **新增**；Android 本地 |
| GT-011 | 不安全运行环境检测 | C-026 §F-8.1（极验） | **是** | **新增**；多维度聚合 |
| GT-012 | 多种类型的篡改检测 | C-026 §F-8.1（极验） | **是** | **新增**；多维篡改信号聚合 |
| GT-013 | 签名校验 | C-026 §F-8.1（极验） | **是** | **新增**；与 T-001 App integrity / repackaging 路径类似 |
| GT-014 | 摄像头劫持 | C-026 §F-8.1（极验） | **是** | **新增**；中国厂商独有细化 |
| GT-015 | 屏幕共享检测 | C-026 §F-8.1（极验） | **是** | **新增**；与 SE-015 Screen Mirroring 路径类似 |
| GT-022 | 定位信息（双归位候选） | C-026 §F-8.1（极验） | **是** | **新增**；**双归位**：网络与环境 + 风险与异常态 |
| GT-023 | Web 端屏幕颜色比特值（双归位候选） | C-026 §F-8.1（极验） | **是** | **新增**；**双归位**：显示、输入、传感器 + 风险与异常态 |

> **双归位引用**：本分组中可作为风险信号的双归位维度另见：
> - 媒体与能力分组（MediaDrm / S-002）
> - 媒体与能力分组（Hardware-backed keystore unavailable / T-013）
> - 网络与环境分组（datacenter_result / M-017）
> - 网络与环境分组（Unsecure Wi-Fi / T-009、System VPN / T-015）
> - 网络与环境分组（nearby_WiFi_list / C-012、MAC 地址 / C-014）
> - 运行时与 WebView分组（HTML Canvas Element Spoofing / SE-022、Privacy settings mode / U-017、browser_color_depth / DX-008、browser_platform / DX-009、cookie_enabled / DX-010）
> - 时间与稳定性分组（Factory Reset Timestamp，频繁重装 + 异常信号聚集时）
> - 时间与稳定性分组（Time spoofing / T-008、Device binding abnormal / T-012）
> - 网络与环境分组（Location / distance anomaly / X-009）
> - 行为序列分组（Digital identity graph links / X-010）
> - 时间与稳定性分组（History / velocity / previous risk associations / X-012、Strong ID cryptographic device binding / X-013）
> - 安装与应用上下文分组（Installed apps inventory / SI-007、黑灰产 App 列表 / C-013、application_installed_list / DX-007）
> - 设备与 Build 分组（Build tags risk / SI-008）
> - 行为序列分组（Global Data Network / SI-009、Account / payment / content event graph / SI-011）
> - 时间与稳定性分组（User-device association / SI-012）
> - 时间与稳定性分组（Device Intelligence sessionId continuity / U-005、Abuse velocity / U-009、Multiple devices / U-010、Failed session continuation / U-011、Lengthy onboarding session / U-012）
> - 行为序列分组（Captured device binding / U-006、Password hash reuse / U-014、Fraud Network shared devices / U-015）
> - 网络与环境分组（Advanced IP risk profile / U-007、IP mismatch and distant IP locations / U-008）

### 1.8 时间与稳定性（35 条）

| # | 维度 | 来源 | 风险信号？ | 备注 |
|---|------|------|----------|------|
| S-007 | 安装时间 / 升级路径 / 重装迹象 | C-003 §5.1 补充项 | 否（重装本身）；频繁重装 + 异常聚集时双归位 | WORKSHOP-003 列为"条件必选"；C-003 Q4 决断 |
| M-018 | Factory Reset Timestamp | C-005 附录 A #9（Fingerprint） | **是**（频繁重装 + 异常聚集时） | S-007 细化（精确时间戳）；**双归位**：时间与稳定性 + 风险与异常态（按 C-003 Q4 模式） |
| T-008 | Time spoofing | C-009 §F-8.1（Talsec） | **是** | **双归位**：时间与稳定性 + 风险与异常态；系统时间伪造 |
| T-012 | Device binding abnormal | C-009 §F-8.1（Talsec） | **是** | **双归位**：时间与稳定性 + 风险与异常态；设备绑定/解绑异常，不等同稳定 ID |
| X-001 | ThreatMetrix profiling sessionId / collection reference | C-010 §F-8.1（ThreatMetrix） | 否 | profiling 结果引用，用于后端 assessment；不是稳定设备 ID |
| X-012 | History / velocity / previous risk associations | C-010 §F-8.1（ThreatMetrix） | **是** | **双归位**：时间与稳定性 + 风险与异常态；服务端历史风险关联 |
| X-013 | Strong ID cryptographic device binding | C-010 §F-8.1（ThreatMetrix） | **是** | **双归位**：时间与稳定性 + 风险与异常态；cryptographic bind / possession |
| SI-012 | User-device association（user_id + installation_id） | C-011 §F-8.1（Sift） | **是** | **双归位**：时间与稳定性 + 风险与异常态；Android `installation_id` 与 `user_id` 同事件关联 |
| SI-013 | Web Device Fingerprinting session reference | C-011 §F-8.1（Sift） | 否 | **双归位**：运行时与 WebView + 时间与稳定性；Web beacon session 引用 |
| U-003 | Device Intelligence visitorId / browser-device identifier | C-012 §F-8.1（Sumsub） | 否 | Fisherman simulation 支持 `visitorId`，表示 browser/device 级标识；不等同稳定硬件 ID |
| U-005 | Device Intelligence sessionId continuity | C-012 §F-8.1（Sumsub） | **是** | **双归位**：时间与稳定性 + 风险与异常态 |
| U-009 | Abuse velocity over recent IP / device activity | C-012 §F-8.1（Sumsub） | **是** | **双归位**：时间与稳定性 + 风险与异常态 |
| U-010 | Multiple devices / multiple mobile devices for one applicant | C-012 §F-8.1（Sumsub） | **是** | **双归位**：时间与稳定性 + 风险与异常态 |
| U-011 | Failed session continuation on another device | C-012 §F-8.1（Sumsub） | **是** | **双归位**：时间与稳定性 + 风险与异常态；WebSDK link 跨设备继续失败 |
| U-012 | Lengthy onboarding session / multiple session attempts | C-012 §F-8.1（Sumsub） | **是** | **双归位**：时间与稳定性 + 风险与异常态 |
| I-003 | Incognia ID cross-device persistent identity | C-013 §F-8.1（Incognia） | 否 | **新增**；**双归位**：时间与稳定性 + 行为序列；跨设备 / 跨重装 / 跨 factory reset |
| I-006 | Reinstall-proof device ID survival | C-013 §F-8.1（Incognia） | 否/是 | **新增**；Android 设备 ID 跨重装存活；与 S-007 / M-018 / U-001 互补 |
| I-007 | Factory Reset event detection | C-013 §F-8.1（Incognia） | **是** | **新增**；**双归位**：时间与稳定性 + 风险与异常态 |
| I-020 | AI Browser ID embedding vector | C-013 §F-8.1（Incognia） | 否 | **新增**；服务端 ML 模型高维向量身份表示；identity persistence |
| B-002 | Bureau persistent Device ID | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：时间与稳定性 + 风险与异常态；99.7% / 99.97% persistent |
| B-023 | Bureau verification history | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：时间与稳定性 + 风险与异常态 |
| FZ-001 | Device fingerprint（跨 session 设备整体指纹引用） | C-016 §F-8.1（Feedzai） | 否 | **新增**；**双归位**：系统标识 + 时间与稳定性；Digital Trust 跨 session 引用 |
| UN-003 | Real-Time Monitoring sub-250ms | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：风险与异常态 + 时间与稳定性 |
| UN-006 | Adaptive Risk Scoring | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：风险与异常态 + 时间与稳定性 |
| UN-009 | Continuous Compliance Monitoring | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：时间与稳定性 + 风险与异常态 |
| UN-012 | Glass-box Device Risk Score 0-100 | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：风险与异常态 + 时间与稳定性 |
| UN-021 | Rapid-fire / velocity fraud detection | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：时间与稳定性 + 风险与异常态 |
| UN-022 | Dormant account reactivation risk | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：时间与稳定性 + 风险与异常态 |
| YJ-035 | 团伙欺诈 + 应用刷量 + 多账号异常（802 + 801 + 901 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；**三重归位**：行为序列 + 时间与稳定性 + 风险与异常态 |
| TD-037 | availableMemory | C-023 §F-8.1（同盾） | 否 | **部分覆盖**（同盾开源独有）；M-003 仅 total；available 拆分独立 |
| TD-038 | totalMemory | C-023 §F-8.1（同盾） | 否 | **部分覆盖**；与 M-003 device_memory 同源 |
| TD-039 | availableStorage | C-023 §F-8.1（同盾） | 否 | **部分覆盖**；与 SI-007 / S-007 邻近但语义不同 |
| TD-040 | totalStorage | C-023 §F-8.1（同盾） | 否 | **部分覆盖**；无现有覆盖 |
| WY-014 | boot_time_as_runtime_anchor | C-024 §F-8.1（网易易盾） | 否 | **部分覆盖**；与 S-007 不同源（开机时间 vs 安装时间） |
| DV-005 | Real-time scoring（<100ms） | C-015 §F-8.1（DataVisor） | **是** | **新增**；**双归位**：风险与异常态 + 时间与稳定性 |

> **双归位引用**：本分组中 M-018 / T-008 / T-012 / X-012 / X-013 / SI-012 / U-005 / U-009 / U-010 / U-011 / U-012 可作为风险信号的双归位维度另见：风险与异常态分组；SI-013 另见运行时与 WebView 分组。

### 1.9 行为序列（39 条）

| # | 维度 | 来源 | 风险信号？ | 备注 |
|---|------|------|----------|------|
| S-008 | Telemetry 信号（操作时序 / 触控模式 / 输入节奏） | C-003 §5.1 补充项；C-008 §F-8.1（SEON behavioral biometrics 细化） | 否 | C-003 Q3 决断；SEON 细化为 keypress / mouse / form / touch / paste / autofill |
| X-010 | Digital identity graph links（device / credential / threat / behavior） | C-010 §F-8.1（ThreatMetrix） | **是** | **双归位**：行为序列 + 风险与异常态；服务端关系图谱 |
| SI-003 | Android app interaction event context（activity_class_name / path / mobile_event_type / time） | C-011 §F-8.1（Sift） | 否 | Sift Android SDK 通过 lifecycle 上送 app interaction events |
| SI-009 | Sift Global Data Network risk associations | C-011 §F-8.1（Sift） | **是** | **双归位**：行为序列 + 风险与异常态；跨客户 / 跨事件网络智能 |
| SI-011 | Account / payment / content event graph | C-011 §F-8.1（Sift） | **是** | **双归位**：行为序列 + 风险与异常态；账号、支付、内容和设备事件图谱 |
| U-006 | Captured device binding to platform event / financial transaction | C-012 §F-8.1（Sumsub） | **是** | **双归位**：行为序列 + 风险与异常态 |
| U-013 | Behavior Monitoring user platform event stream | C-012 §F-8.1（Sumsub） | 否 | login、sign-up、settings change、password update、自定义事件 |
| U-014 | Password hash reuse across platform events / accounts | C-012 §F-8.1（Sumsub） | **是** | **双归位**：行为序列 + 风险与异常态；平台事件可上送 passwordHash 用于识别重复使用 |
| U-015 | Fraud Network shared devices / related accounts / similar patterns | C-012 §F-8.1（Sumsub） | **是** | **双归位**：行为序列 + 风险与异常态；blocked users、related accounts、shared devices、similar patterns |
| I-002 | Location behavior signature | C-013 §F-8.1（Incognia） | 否/是 | **新增**；trusted location / historical location behavior |
| I-003 | Incognia ID cross-device persistent identity | C-013 §F-8.1（Incognia） | 否 | **新增**；**双归位**：时间与稳定性 + 行为序列 |
| I-004 | Address / location binding verification | C-013 §F-8.1（Incognia） | **是** | **新增**；**双归位**：网络与环境 + 行为序列 |
| I-005 | Location watchlist | C-013 §F-8.1（Incognia） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| I-021 | Multi-accounting detection | C-013 §F-8.1（Incognia） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| I-022 | Collusion and fraud farm detection | C-013 §F-8.1（Incognia） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| B-003 | Device Graph / Graph Identity Network | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| B-004 | Bureau Behavioral Biometrics signals (100+) | C-014 §F-8.1（Bureau） | 否 | **新增**；keystroke / tap / swipe / sensor / pointer 行为流 |
| B-005 | Continuous Passive Authentication | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| B-018 | Bureau Graph Identity Network cluster / fund flow | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| B-019 | Bureau cross-ecosystem mule detection | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| B-020 | Bureau Behavioral Continuity 160+ attributes | C-014 §F-8.1（Bureau） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| DV-001 | Identity (ID) Graphing / Knowledge Graph | C-015 §F-8.1（DataVisor） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| DV-003 | Cross-customer anonymized signal | C-015 §F-8.1（DataVisor） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| DV-006 | Behavioral Biometrics 行为生物特征 | C-015 §F-8.1（DataVisor） | **是** | **新增**；公开 Defense 标签 |
| DV-008 | Email Reputation Service 邮件风险画像 | C-015 §F-8.1（DataVisor） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| DV-009 | Transaction Monitoring | C-015 §F-8.1（DataVisor） | **是** | **新增**；公开 Defense 标签 |
| DV-010 | 跨客户 / 跨行业 fraud pattern | C-015 §F-8.1（DataVisor） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| DV-013 | Natural Language Processing 文本质检 | C-015 §F-8.1（DataVisor） | 否 | **新增**；Fraud Tech 标签 |
| DV-014 | Network Analysis 关联网络分析 | C-015 §F-8.1（DataVisor） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| DV-024 | Synthetic Identity 关联识别 | C-015 §F-8.1（DataVisor） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| DV-029 | Deepfakes 关联识别 | C-015 §F-8.1（DataVisor） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| FZ-002 | Typing pressure | C-016 §F-8.1（Feedzai） | 否 | **新增**；typing pressure 在 mobile context 公开 |
| FZ-003 | Mouse click patterns | C-016 §F-8.1（Feedzai） | 否 | **新增**；click patterns 在 Digital Trust 公开 |
| FZ-004 | Swipe pressure | C-016 §F-8.1（Feedzai） | 否 | **新增**；swipe pressure 明确是 Android 触屏信号 |
| FZ-005 | Swipe direction | C-016 §F-8.1（Feedzai） | 否 | **新增**；swipe direction 明确是 Android 触屏信号 |
| FZ-006 | Swipe speed | C-016 §F-8.1（Feedzai） | 否 | **新增**；swipe speed 明确是 Android 触屏信号 |
| FZ-013 | Cross-account / cross-device link at onboarding | C-016 §F-8.1（Feedzai） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| UN-001 | Fraud Consortium（80M+ US adults） | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| UN-002 | Identity Graphing / Cross-Entity Link Analysis | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| UN-008 | Customer Risk Rating | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| UN-010 | AI-driven SAR/STR/CTR pre-population | C-017 §F-8.1（Unit21） | 否 | **新增**；AI agents pre-populate filings |
| UN-020 | Account Takeover (ATO) detection | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| UN-023 | Fraud ring detection | C-017 §F-8.1（Unit21） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| YJ-035 | 团伙欺诈 + 应用刷量 + 多账号异常（802 + 801 + 901 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；**三重归位**：行为序列 + 时间与稳定性 + 风险与异常态 |
| WY-015 | view_click_event_collection | C-024 §F-8.1（网易易盾） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |
| WY-016 | touch_event_ai_detection | C-024 §F-8.1（网易易盾） | **是** | **新增**；**双归位**：行为序列 + 风险与异常态 |

> **双归位引用**：本分组中 X-010 / SI-009 / SI-011 / U-006 / U-014 / U-015 / I-003 / I-004 / I-005 / I-021 / I-022 / B-003 / B-005 / B-018 / B-019 / B-020 / DV-001 / DV-003 / DV-008 / DV-010 / DV-014 / DV-024 / DV-029 / FZ-013 / UN-001 / UN-002 / UN-008 / UN-020 / UN-023 / YJ-035 / WY-015 / WY-016 可作为风险信号的双归位维度另见：风险与异常态分组。

### 1.10 安装与应用上下文（13 条）

| # | 维度 | 来源 | 风险信号？ | 备注 |
|---|------|------|----------|------|
| SI-001 | Android app identity / version / SDK context（app_name / app_version / sdk_version） | C-011 §F-8.1（Sift） | 否 | Sift Android SDK 公开采集 app 与 SDK 上下文 |
| SI-007 | Installed apps inventory（package_name / app_name） | C-011 §F-8.1（Sift） | **是** | **双归位**：安装与应用上下文 + 风险与异常态；一般 installed apps inventory，不等同 T-011 suspicious apps |
| U-001 | Sumsub Android Fisherman module enabled | C-012 §F-8.1（Sumsub） | 否 | Android SDK 1.43.0 起默认包含 Fisherman Device Intelligence 模块；可排除该模块禁用 |
| C-013 | 黑灰产 App 列表 | C-018 §F-8.1（阿里云） | **是** | **双归位**：安装与应用上下文 + 风险与异常态；SDK 采集已安装应用包名 + 阿里云维护的黑灰产库匹配 |
| DX-011 | `app_subject_info`（PrivacyFlag `GET_PACKAGE_INFO`：包名 / 版本号 / 签名 / first install time 等元数据） | C-022 §F-8.1（顶象） | 否 | **新增**；PrivacyFlag `GET_PACKAGE_INFO` 明示；与 SI-001 app_name / app_version / sdk_version 类似但更细化（包含 first install time / 签名等元数据） |
| B-001 | Bureau Android / iOS SDK enabled | C-014 §F-8.1（Bureau） | 否 | **新增**；Bureau SDK 安装开关 |
| TD-020 | systemAppList | C-023 §F-8.1（同盾） | 否 | **新增**（同盾开源独有）；`PackageManager.getInstalledPackages()` 区分 user app 与 system app |
| TD-044 | packageName | C-023 §F-8.1（同盾） | 否 | **部分覆盖**；同盾开源字段名；与 SI-001 app_name / app_version 部分覆盖 |
| TD-046 | appList | C-023 §F-8.1（同盾） | 否 | **部分覆盖**；同盾开源字段名；与 SI-007 Installed apps inventory 部分覆盖 |
| TD-047 | androidId | C-023 §F-8.1（同盾） | **是** | **新增**；**双归位**：系统标识 + 风险与异常态；与 S-001 SSAID 同源 |
| WY-010 | app_signature_info（应用签名信息） | C-024 §F-8.1（网易易盾） | **是** | **新增**；**双归位**：安装与应用上下文 + 风险与异常态；隐含为 `PackageInfo.signatures` |
| WY-011 | app_process_name（应用进程名） | C-024 §F-8.1（网易易盾） | **是** | **新增**；与 M-009 Rooted Device 部分覆盖 |
| WY-013 | full_apk_installed_list_query_all_packages | C-024 §F-8.1（网易易盾） | **是** | **新增**；**双归位**：安装与应用上下文 + 风险与异常态；与 SI-007 / C-013 / DX-007 同源 |
| YJ-034 | 安装风险软件 + 黑灰产应用类型分类（1002 + 1301-1308 标签） | C-019 §F-8.1（腾讯 T-Sec） | **是** | **新增**；**双归位**：安装与应用上下文 + 风险与异常态；细分 8 类应用类型 |

> **双归位引用**：本分组中 SI-007 / C-013 / DX-007 / TD-047 / WY-010 / WY-013 / YJ-034 可作为风险信号的双归位维度另见：风险与异常态分组。

---

## 2. 主清单总览（按分组，v2.0）

| 分组 | 条数 | 风险信号 | 双归位 |
|------|------|---------|--------|
| 系统标识 | 10 | 0 | 4（C-001 / C-002 → 设备与 Build；FZ-001 → 时间与稳定性；TD-047 → 风险与异常态） |
| 设备与 Build | 48 | 6（SI-008 + YJ-001 ~ YJ-005） | 11（SI-008 / C-001 / C-002 / YJ-001 ~ YJ-005 / JD-011 / TD-047 跨组） |
| 媒体与能力 | 3 | 0 | 2（S-002 / T-013 → 风险与异常态） |
| 显示、输入、传感器 | 24 | 3（GT-004 / YJ-006 / GT-023） | 4（YJ-006 / GT-004 / GT-023 双归位到风险与异常态） |
| 运行时与 WebView | 31 | 14（SE-022 / DX-008~DX-010 / I-016 / B-024 / B-025 / TD-018 / UN-015 / WY-015 / WY-016 等） | 17（含 SE-022 / SI-013 / DX-008~DX-010 / I-016 / B-024 / B-025 / TD-018 / UN-015 等） |
| 网络与环境 | 41 | 30+ | 25+（I-004 / I-015 / I-017 / B-013 / B-014 / B-015 / DV-007 / DV-027 / DV-028 / FZ-012 / UN-014 / YJ-007 / YJ-008 / WY-007 / WY-008 / GT-007 / GT-008 / GT-022 跨组） |
| 风险与异常态 | 203 | 200+ | 50+（11 家新增的 I-007 / I-016 / B-002 / B-005 / UN-005 / UN-012 / UN-021 / UN-022 / YJ-002 / YJ-003 / YJ-004 / YJ-005 / YJ-035 / WY-007 / WY-008 / WY-010 / WY-013 / WY-015 / WY-016 / GT-004 / GT-007 / GT-008 / GT-022 / GT-023 等双归位条目） |
| 时间与稳定性 | 35 | 18+ | 19+（含 I-007 / B-002 / B-023 / FZ-001 / UN-003 / UN-006 / UN-009 / UN-012 / UN-021 / UN-022 / YJ-035 / DV-005 跨组） |
| 行为序列 | 39 | 30+ | 27+（含 I-003 / I-004 / I-005 / I-021 / I-022 / B-003 / B-005 / B-018 / B-019 / B-020 / DV-001 / DV-003 / DV-008 / DV-010 / DV-014 / DV-024 / DV-029 / FZ-013 / UN-001 / UN-002 / UN-008 / UN-020 / UN-023 / YJ-035 / WY-015 / WY-016 跨组） |
| 安装与应用上下文 | 13 | 6 | 6（SI-007 / C-013 / DX-007 / TD-047 / WY-010 / WY-013 / YJ-034 跨组） |
| **合计** | **447** | 290+（去重后，含 11 家新增的 269+ 条独立维度编号 + 18 条部分新增 + 116+ 条双归位） | 130+ 条双归位引用 |

注：
- v2.0 主清单合计 **447 条**（按独立编号 + 部分新增未重复计数后的总数；含 §1.1 ~ §1.10 十个分组的全部维度）
- 双归位条目 130+ 条；通过分组顶部"双归位引用"标注，不重复增加总条数
- 风险与异常态（203 条）显著扩张，与 11 家厂商公开材料"风控平台"定位一致
- 行为序列（39 条）和时间与稳定性（35 条）也因 Incognia / Bureau / DataVisor / Feedzai / Unit21 等的连续性表达和服务端图谱反推而显著扩张

---

## 3. 编号约定

- **S-NNN**：C-003 §5.1 补充项清单条目（首版种子）
- **M-NNN**：C-005 附录 A 扩张项候选条目（首版扩张项）
- **SE-NNN**：C-008 附录 A 扩张项候选条目（SEON）。C-008 原文建议使用 `S-NNN`，本文档为避免与首版种子 `S-NNN` 冲突，统一改用 `SE-NNN`。
- **未来 NNN**：后续厂商 LENS 引入的扩张项按"Z-NNN"（Z = 厂商代码）编号
  - Talsec 厂商扩张项：`T-NNN`（Talsec）
  - ThreatMetrix 厂商扩张项：`X-NNN`（threAtmetrix）
  - Sift 厂商扩张项：`SI-NNN`（SIft）
  - Sumsub 厂商扩张项：`U-NNN`（SUmsub）
  - Incognia 厂商扩张项：`I-NNN`（Incognia）
  - Bureau 厂商扩张项：`B-NNN`（Bureau）
  - DataVisor 厂商扩张项：`DV-NNN`（DataVisor）
  - Feedzai 厂商扩张项：`FZ-NNN`（FeedZai）
  - Unit21 厂商扩张项：`U2-NNN`（UNit21；与 Sumsub `U-NNN` 区分）
  - 中国厂商扩张项：`C-NNN`（China，按厂商轮次顺序编号；阿里云 CN-001 → C-001 ~ C-014；数美 CN-004 → 已纳入主清单对应分组但未单独编号；顶象 CN-005 → DX-001 ~ DX-011）
  - v2.0 11 家未纳入厂商编号：
    - 腾讯云 T-Sec CN-002 → `YJ-NNN`（YunJi 腾讯云拼音；YJ-001 ~ YJ-035）
    - 京东云 CN-003 → `JD-NNN`（JD-001 ~ JD-011）
    - 同盾科技 CN-006 → `TD-NNN`（TongDun；TD-001 ~ TD-049）
    - 网易易盾 CN-007 → `WY-NNN`（WangYi；WY-001 ~ WY-016）
    - 百度智能云 CN-008 → `BD-NNN`（BaiDu；BD-000，反推 0 条）
    - 极验 CN-009 → `GT-NNN`（GeeTest；GT-001 ~ GT-023，沿用 C-026 附录 A 显式编号）

---

## 4. 条数核对

### 4.1 v2.0 11 家厂商反推贡献明细

按 v2.0 整合统计：

| 厂商 | 编号前缀 | 新增编号 | 部分新增 | 双归位贡献 |
|------|---------|---------|---------|-----------|
| C-013 Incognia | `I-NNN` | 24 | 0 | 9 |
| C-014 Bureau | `B-NNN` | 25 | 0 | 13 |
| C-015 DataVisor | `DV-NNN` | 30 | 0 | 11 |
| C-016 Feedzai | `FZ-NNN` | 14 | 0 | 3 |
| C-017 Unit21 | `U2-NNN`（`UN-NNN`） | 23 | 0 | 14 |
| C-019 腾讯云 T-Sec | `YJ-NNN` | 35 | 0 | 13 |
| C-020 京东云 | `JD-NNN` | 11 | 0 | 1 |
| C-023 同盾 | `TD-NNN` | 32 | 17 | 4 |
| C-024 网易易盾 | `WY-NNN` | 11 | 5 | 5 |
| C-025 百度智能云 | `BD-NNN` | 0 | 0 | 0 |
| C-026 极验 | `GT-NNN` | 23 | 6 | 5 |
| **合计** | — | **228** | **28** | **80** |

---

## 6. 鸿蒙字段

本节暂存 HarmonyOS / HarmonyOS Next 独有、当前 Android `DeviceInfoRepository` 未覆盖的系统标识字段，避免混入 Android 本地实现已覆盖的主清单比较口径。

| # | 维度 | 来源 | 风险信号？ | 备注 |
|---|------|------|----------|------|
| TD-002 | harmonyOS（HarmonyOS 设备识别布尔） | C-023 §F-8.1（同盾） | 否 | "false" / "true"；同盾开源独有；与 OAID 形成 Android / HarmonyOS 双路径 |
| GT-001 | ODID（Open Device Identifier，HarmonyOS 独有 OAID 替代物） | C-026 §F-8.1（极验） | 否 | HarmonyOS Next 通过 APP_TRACKING_CONSENT 动态权限获取；与 C-001 OAID 形成 Android / HarmonyOS 双路径 |

---

## 7. 同盾独有字段

本节暂存同盾开源实现或同盾厂商材料中独有、但当前 `DeviceInfoRepository` 未覆盖的字段，避免混入 Android 本地实现已覆盖的主清单比较口径。

| # | 维度 | 来源 | 风险信号？ | 备注 |
|---|------|------|----------|------|
| TD-001 | gsfId（Google Services Framework ID） | C-023 §F-8.1（同盾） | 否 | Google 私有 ID；同盾开源独有；与 C-001 OAID / C-002 GAID 互补 |
