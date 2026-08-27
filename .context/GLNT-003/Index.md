# GLNT-3 · iOS 硬件标识 / 稳定 ID 维度调研

> updated_by: Codex - GPT-5
> updated_at: 2026-06-29 12:49:25

---

## 0. 调研基线

GLNT-3 iOS 厂商调研以 **iOS 17.5** 作为当前基线版本。选择理由：Privacy Manifest 要求已稳定，Required Reason API 已上线，IDFA / ATT 约束已成熟；同时不影响记录厂商 SDK 对更低 iOS 版本的官方支持范围。

---

## 1. 调研目标

GLNT-3 的目标是复刻 Android 方向的厂商调研方法，面向 iOS 侧梳理指定厂商实际采集、声明采集或可反推出的硬件标识、稳定设备标识、SDK 自建 ID、持久化 token、服务端衍生 ID 及其底层采集维度。

本轮不是 iOS WKWebView 指纹可行性研究，也不是概率相似度方案设计。核心问题只有一个：

> 指定厂商在 iOS 侧到底用了哪些稳定采集维度来得到设备 ID 或近似设备 ID？

---

## 2. 厂商范围

iOS 调研厂商必须与 Android GLNT-4 的厂商清单一比一对应：

- Android 已调研的厂商，iOS 不允许遗漏。
- Android 没有调研的厂商，iOS 不允许新增。
- Android 已判定为非厂商的后续条目，iOS 不纳入厂商调研。
- 厂商顺序原则上沿用 Android，便于后续横向对照。

---

## 3. 调研口径

Android 侧已有 `DeviceInfoRepository` 作为实现基线，因此 Android 厂商文档采用“删除已实现字段，仅保留未实现字段”的差量口径。

iOS 侧当前没有等价的实现基线，因此 GLNT-3 必须采用全量口径：

- 不做“已实现字段扣减”。
- 不把字段提前判定为已覆盖。
- 按公开资料全量整理 iOS 侧可采集、可声明、可反推的稳定维度。
- Android-only、HarmonyOS-only 字段不作为 iOS 字段，但可在跨端能力边界中说明。
- iOS-only 字段必须保留并归类。

---

## 4. 聚焦对象

优先寻找能够支撑 100% ID 或接近确定性 ID 的底层维度，包括但不限于：

- Apple 官方或半官方设备 / 安装 / vendor scope 标识。
- SDK 自建 device id、install id、visitor id、server token、request token、receipt token。
- Keychain、App Group、NSUserDefaults、Web storage、cookie、pasteboard 等持久化路径，以及 storage token / storage token state；其中 WKWebView localStorage 不具备跨卸载重装持久化能力，不能单独作为稳定 ID 路径。
- IDFV、IDFA、DeviceCheck、App Attest、APNs token、广告归因 token 等平台相关标识；其中 IDFV 只能视为 vendor scope 标识，不等同于全局硬件 ID。
- MDM、企业签名、越狱环境、私有 API 或系统侧暴露的硬件标识线索。
- 账号、会话、安装上下文、重装上下文等可辅助稳定识别的业务上下文。
- SIM、运营商、网络、IP、代理、VPN、coarse network、时区、语言、区域等可辅助稳定识别的环境维度。
- 服务端设备图谱、账号图谱、手机号 / 邮箱 / IP 风险画像、黑产样本库等衍生 ID 能力。

### 4.1 来源分类与最低证据要求

单厂商条目必须区分三类来源：

- **实际采集**：官方 SDK 文档、SDK 仓库、quickstart、API reference、changelog 或 privacy manifest 明确说明 SDK 会采集、返回或支持该字段 / 信号。
- **声明采集**：官方材料明确声明产品具备某类 device intelligence / Smart Signal / raw attributes 能力，但没有公开完整底层字段。
- **可反推**：由官方返回字段、稳定性场景、版本边界、跨端对照或公开样例合理推导出的底层依赖；可反推项必须标注推导来源，不能当作已实现事实。

只有泛称 device fingerprint / device intelligence / risk signals，不能直接写成底层稳定 ID 已采集；必须继续拆解到底层维度，拆不出来则进入公开资料缺口。

---

## 5. 禁止项与高风险边界

以下内容不作为常规 iOS 稳定 ID 调研目标。若厂商公开材料明确提及，只记录为高风险能力或合规缺口，不默认纳入建议采集维度：

- IDFA 只作为广告用途或专项授权下的归因标识，不进入通用设备身份主路径。
- DeviceCheck 只作为设备真实性或有限状态线索，不作为恢复 UUID 或跨安装持久 ID 的通用路径。
- 一次性凭证、一次性 request token、单次 receipt token 不能作为稳定查找键；只有厂商明确说明其可跨会话、跨安装或绑定稳定设备身份时，才可作为稳定 ID 线索。
- 通讯录、短信、相册、文件列表。
- 已安装 App 列表。
- 精确位置。
- 剪贴板内容。
- 用户输入内容、页面内容。
- 原始高频传感器数据。
- 未哈希 PII。
- 私有 API、高敏硬件标识、隐蔽追踪路径。

---

## 6. 关于 Device Fingerprint 的处理

厂商文档中出现的 device fingerprint、设备指纹、device intelligence、risk signals 等表述，只作为线索，不作为调研终点。

处理原则：

- 不停留在“厂商有设备指纹能力”这一层。
- 必须继续追问该指纹由哪些底层稳定 ID、持久化 token、硬件 / 系统 / 网络 / 账号维度组成。
- Canvas、WebGL、Audio、字体、屏幕等弱指纹信号可以记录，但不能替代稳定 ID 调研。
- 99% 相似、概率聚类、uncertain 匹配不是本轮主目标。

---

## 7. 单厂商文档建议结构

每个厂商文档建议采用以下结构：

```markdown
# C-XXX · {厂商名} iOS 硬件标识 / 稳定 ID 维度清单

> updated_by: Codex - GPT-5
> updated_at: {当前时间}
>
> 视角：{厂商名} iOS 厂商 LENS
> 来源：TASK-XXX
> 当前口径：参考 Android 厂商调研方式；iOS 侧无实现基线，因此按公开资料全量整理指定厂商实际采集、声明采集或可反推出的稳定硬件标识、设备标识、SDK 自建 ID、持久化 token、服务端衍生 ID 和公开资料缺口。厂商提到的 device fingerprint 只作为线索，必须尽量拆解到底层稳定采集维度。

## 0. 调研口径

## 1. 产品定位

## 2. iOS / Apple 接入方式

## 3. iOS 稳定 ID 与硬件标识维度

## 4. 持久化路径与 SDK 自建 ID

## 5. 服务端衍生 ID 与风险能力

## 6. 公开资料缺口

## 7. 当前结论
```

---

## 8. 当前边界

GLNT-3 后续应清理旧的 WKWebView 指纹可行性、概率碰撞、identity cluster、uncertain 匹配等表达。它们可以作为历史讨论背景，但不应继续作为 iOS 厂商调研主线。

服务端衍生 ID、服务端设备图谱、风险画像、黑产样本库和模型权重部分以公开资料为限；非公开部分仅作线索、不作结论，不得写成厂商已公开采集或本地 SDK 已实现字段。

---

## 9. iOS 统一 Dimensions 主清单

GLNT-3 的 iOS 侧统一计算维度主清单为 `.context/GLNT-3/iOS-Compute-Dimensions.md`。

维护规则：

- 单厂商 `C-*` 输出是独立调研快照，不作为其它厂商事实依据。
- 每个厂商任务完成时，应把本厂商反推出的 iOS 计算维度同步沉淀到 `iOS-Compute-Dimensions.md`。
- 如需调整模板、来源分层、稳定性口径或归位规则，只修改本 `Index.md`。
- 如需补齐、去重、重编号或修正统一维度归位，只修改 `iOS-Compute-Dimensions.md`。
- 不回写或重写其它厂商的 `C-*` 输出，除非任务明确要求。
