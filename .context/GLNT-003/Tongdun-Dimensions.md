# Tongdun-Dimensions · GLNT-3 iOS 维度清单

> updated_by: Codex - GPT-5
> updated_at: 2026-06-29 13:48:28
>
> 视角：同盾 / 小盾 iOS 厂商 LENS（research）
> 来源：TASK-020
> 文件命名口径：厂商名 + `Dimensions`，参考 GLNT-4 的 `Tongdun-Dimensions.md`
> 当前口径：以 `.context/GLNT-3/Index.md` §7 单厂商文档结构为准，独立整理同盾 TrustDevice / 小盾设备指纹在 iOS 侧公开可确认的稳定 ID、准稳定 ID、设备详情、风险标签、Pro 风险库、SDK 防护和服务端决策能力；与 Android `Tongdun-Dimensions.md` 的对照只作为本厂商跨端线索，不把 Android-only 字段写成 iOS 已采集事实。
> 调研基线 iOS 版本：iOS 17.5

---

## 0. 调研口径

本条目只回答同盾 / 小盾在 iOS 侧可能形成的硬件标识、稳定 ID 与风控计算维度。同盾公开资料同时包含开源版和 Pro 版；开源 Android 的 `device_detail` 字段只能作为同厂商线索，不能直接迁移到 iOS。非公开 = 仅作线索、不作结论。

---

## 1. 产品定位

同盾 TrustDevice / 小盾设备指纹定位为 device fingerprint、device intelligence、device risk 和反欺诈决策引擎。公开材料包含开源版 `device_id`、`device_risk_label`、`device_detail`，以及 Pro 版 70+ 风险标签、100+ 设备风险标签、3000+ 黑产工具、30+ 作弊框架、VMP 加固、行为活动捕获、环境风险评估、设备风险分和 TrustDecision 决策引擎。

---

## 2. iOS / Apple 接入方式

| 形态 | iOS 侧含义 | 稳定性判断 |
|------|-----------|------------|
| trustdevice-ios | iOS Native 设备指纹 SDK | SDK 采集入口，iOS 字段表未公开 |
| trustdevice-js | Web 指纹 | 与 Native iOS 边界需区分 |
| Server API / TrustDecision | 服务端决策引擎 | 风险评分和决策输出 |
| SaaS / PaaS / 私有化 | 部署形态 | 不影响本地 ID 判断 |
| HarmonyOS SDK | 跨端能力 | 不作为 iOS 字段事实 |

与 Android 对照：开源 Android 明确 `device_id`、`device_detail` 和 9 项风险标签；iOS 可保留同类能力，但 `gsfId`、ADB、Android app list、Magisk、Xposed 等 Android-only 字段不能迁移为 iOS 已采集字段。

---

## 3. iOS 稳定 ID 与硬件标识维度

### 3.1 公开确认的 ID / token

| 维度 | iOS 侧状态 | 结论 |
|------|------------|------|
| device_id | 公开资料确认同盾输出设备 ID | 准稳定厂商设备 ID；iOS 生成算法和生命周期未公开 |
| 客户端预生成第一指纹 | 专利 / 公开线索 | iOS 是否适用需确认 |
| 服务端第二指纹确认 | 专利 / 公开线索 | 服务端二次确认能力，不是本地硬件 ID |
| fallback DeviceId 组合 | Android 线索 | iOS 不能照搬 imei / wifiMac 等组合 |

### 3.2 Apple 标识与系统能力

| 维度 | iOS 侧状态 | 结论 |
|------|------------|------|
| IDFV | 未见公开确认 | 非公开 = 仅作线索、不作结论 |
| IDFA | 未见公开确认 | iOS 17.5 下即使使用也需 ATT 授权；不能假设 |
| Keychain | 未见公开确认 | 不能把 device_id 稳定性归因于 Keychain |
| UserDefaults / App Group | 未见公开确认 | 不能写成跨安装或跨 App 持久化事实 |
| DeviceCheck / App Attest | 未见公开确认 | 可作为设备真实性和 App 完整性追问项 |
| APNs token | 未见公开确认 | token 可轮换；未确认使用 |

### 3.3 设备详情和风险标签

| 维度 | iOS 侧状态 | 结论 |
|------|------------|------|
| device_detail 60+ 字段 | Android 开源明确；iOS 明细未公开 | iOS 只保留字段表缺口 |
| 显示 / 电池 / 传感器 / 内存 / 存储 | Android 开源字段 | iOS 可作为弱环境能力追问 |
| root / debug / multiple / xposed / magisk / hook / emulator / vpn / tampered | 开源 9 项风险标签 | iOS 侧应替换为 jailbreak、debug、hook、emulator、vpn、tamper 等等价标签 |
| 70+ / 100+ Pro 风险标签 | Pro 能力公开 | 服务端或商业 SDK 能力，字段明细未公开 |

---

## 4. 持久化路径与 SDK 自建 ID

| 路径 | 状态 | 判断 |
|------|------|------|
| device_id | 公开确认 | 厂商设备 ID；iOS 稳定性未公开 |
| first fingerprint / second fingerprint | 公开线索 | 客户端预生成 + 服务端确认的组合能力 |
| fallback DeviceId | Android 线索 | iOS 不能照搬 Android 标识组合 |
| Keychain / 本地持久化 | 未公开 | 非公开 = 仅作线索、不作结论 |
| OLLVM / VMP / 防抓包 / 防降级 | 公开能力 | SDK 保护，不是设备 ID |

---

## 5. 服务端衍生 ID 与风险能力

| 能力 | iOS 侧归位 | 说明 |
|------|------------|------|
| device_id 服务端确认 | 服务端衍生 ID | 生成算法和生命周期未公开 |
| Device Risk Score | 服务端风险分 | Pro 能力 |
| Environment Risk Evaluation | 环境风险 | 网络、调试、模拟器、代理、系统状态等 |
| Fraud Tools Detection | 工具库 | 3000+ 黑产工具、30+ 作弊框架 |
| Behavioral Activity Capturing | 行为捕获 | 原始触控、滑动、传感器或会话事件未公开 |
| IP Location | 网络画像 | 服务端网络风险 |
| TrustDecision | 决策引擎 | 实时模型、离线分析、策略决策 |
| 全球风险联防联控 | 服务端图谱 | 跨客户 / 跨行业共享边界未公开 |

---

## 6. 公开资料缺口

非公开 = 仅作线索、不作结论。

| # | 缺口 | 为什么重要 |
|---|------|------------|
| Q-1 | iOS 完整字段表 | 决定开源 Android 60+ 字段哪些适用于 iOS |
| Q-2 | device_id 生成算法和生命周期 | 决定跨重装、清数据、恢复出厂、换账号稳定性 |
| Q-3 | Keychain / IDFV 是否参与 | 决定 iOS 本地稳定材料是否进入主路径 |
| Q-4 | iOS 风险标签全集 | 决定 root / magisk / xposed 等 Android 标签如何映射到 iOS |
| Q-5 | Pro 版 70+ / 100+ 标签 | 决定商业能力边界 |
| Q-6 | Fraud Tools Detection 工具库 | 决定黑产工具和作弊框架覆盖范围 |
| Q-7 | Behavioral Activity Capturing 原始信号 | 决定触控、滑动、传感器、会话行为是否采集 |
| Q-8 | VMP / 防抓包 / 防降级在 iOS 的实现 | 决定 SDK 防护强度 |
| Q-9 | TrustDecision API 输出 | 决定 device_id 如何进入服务端决策 |
| Q-10 | 全球风险联防联控规则 | 决定跨客户共享和隐私边界 |

---

## 7. 当前结论

同盾 / 小盾 iOS 侧可以明确保留 device_id、设备详情字段表缺口、风险标签体系、Pro 风险分、黑产工具库、行为捕获、环境风险和 TrustDecision 服务端决策能力。device_id 是厂商设备 ID，但 iOS 生成算法、生命周期和持久化路径未公开。

IDFV、IDFA、Keychain、UserDefaults / App Group、DeviceCheck / App Attest、APNs token 均未见公开确认。Android 开源字段中的 `gsfId`、ADB、Xposed、Magisk、Android app list、fallback imei / wifiMac 等不能迁移为 iOS 事实。
