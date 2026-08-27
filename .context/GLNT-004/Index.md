# GLNT-4 · 下一轮 Kickoff

> updated_by: GPT-5
> updated_at: 2026-06-29 00:00:00
> 变更：C-001 ~ C-004 已归档删除；U3 纳入条件整合至本文档"主清单纳入条件"节
>
> **Android 计算维度全集 主清单**：[Android-Compute-Dimensions.md](./Android-Compute-Dimensions.md)

## 当前状态

当前已经形成的共识是：

- 不讨论稳定 ID 方案。
- 不讨论整体 hash 方案。
- SDK 只负责采集并上送 observation / evidence，不负责生成最终身份结论。
- 服务端维护 identity cluster，并基于 evidence、profile、match decision 做同设备判断。
- Observation / evidence 采用 append-only 思路。
- Anchor、环境证据、运行时证据、质量信息、策略上下文需要分层理解。

## 下一轮议题

下一轮 workshop 只讨论一件事：

**Android 设备识别中，所有需要纳入计算的维度清单。**

这里的“所有”按你的要求理解为完整覆盖，不预先做取舍。

## 讨论边界

- 不讨论 Schema。
- 不讨论优化目标。
- 不讨论合规筛选对维度是否进入讨论的影响。
- 不讨论维度之间的优先级。
- 不讨论分 Phase。

## 表达原则

- 维度之间是平等的。
- 如果后续需要分组，只作为表达方便，不代表高低先后。
- 当前产物优先是维度清单，不强制引入评分框架。

## 产出方向

下一轮希望整理成一份可继续扩展的 Android 维度清单，覆盖所有可选维度，包括但不限于：

- 系统标识类
- 设备与 Build 类
- 安装与应用上下文类
- 运行时与 WebView 类
- 媒体与能力类
- 显示、输入、传感器类
- 网络与环境类
- 风险与异常态类
- 时间与稳定性相关类
- 行为序列类

## 主清单纳入条件

本清单以**客户端 SDK 现场可观察 / 客户端可上送**为纳入条件（C-003 U3 决断）：

| 信号 | 纳入主清单？ | 归位分组 | 理由 |
|------|------------|---------|------|
| IP / ASN / 粗粒度网络 | 是 | 网络与环境 | 客户端可采集（IP 派生），本就是 SDK 上送项 |
| VPN / Proxy / NAT 标识 | 是 | 风险与异常态 + 网络与环境 | 客户端可探测；双归位 |
| 触控模式 / 输入节奏 / 操作时序 | 是 | 行为序列 | 客户端 SDK 现场采集，telemetry 类信号 |
| 账号 / 登录身份 | 否 | — | 纯服务端关联信号；不属 Android 计算维度 |
| 设备 / 账号 / IP 关系图谱 | 否 | — | 纯服务端聚合，属消费方而非采集方 |
| 威胁情报 / 黑名单 / 信誉库 | 否 | — | 消费方规则，不是可观察维度 |
| 行为序列（聚合后的用户行为画像） | 否 | — | 聚合后画像由服务端产出；原始 telemetry 信号仍进入 |

**双归位规则**：同一维度同时属于两个分组时，在主清单归位分组中显式标注 `（双归位：另见 XXX 分组）`，并在被引用分组顶部加一行交叉引用。双归位条目不重复计入总条数。

## 新增讨论项

### 业界头部厂商方案分析

下一轮需要先找到业界关于 Android 设备指纹 / device intelligence 的头部厂商，并搜索、分析其公开方案。

分析目标不是照搬厂商实现，而是从公开资料中反推出 Android 设备识别通常会纳入哪些计算维度，以及这些维度在行业方案中如何被组织、解释和使用。

本议题必须逐个深入讨论厂商方案，不漏、不省略、不合并带过。每个厂商都必须作为独立讨论单元推进，并单独形成分析结论。这不是可选项，是强制要求。

为每个厂商设置独立讨论，表示每个厂商至少需要一轮专门分析，不表示一轮 LENS 后即可结束。每个厂商的分析是否完成，必须由后续 pilot 根据公开资料覆盖度、方案理解深度、Android 维度提取完整性和未决问题数量判断。

如果 pilot 判断当前厂商尚未分析充分，应继续围绕同一厂商创建下一轮 LENS，而不是切换到下一个厂商。只有当前厂商达到完成标准后，才允许进入下一个厂商。

厂商名单以本文档“厂商清单与进度”为唯一来源。厂商名单允许在搜索过程中继续扩展；如果发现新的头部厂商或强相关厂商，应纳入后续厂商轮次。头部厂商的判断依赖 LLM 基于公开资料、行业影响力、Android / mobile device fingerprint 相关性、device intelligence / fraud detection 相关性和资料可得性进行判断。

**全量调研规则**：

- 本阶段是全量调研，不允许抽样。
- 本文档列名厂商必须全部纳入分析。
- 不允许使用“代表厂商”“任选 1-2 家”“地域平衡代表”“参考性带过”等方式替代完整分析。
- 多个厂商出现在同一行时，只表示清单展示方便；执行时必须拆成每个厂商独立 LENS。
- 每个厂商完成后，其反推出的维度必须全量进入 [Android-Compute-Dimensions.md](./Android-Compute-Dimensions.md)；后续只做归位、去重、命名统一、双归位标注和来源说明，不做抽样式筛除。

每个厂商都需要讨论其公开方案，以及能搜索到的所有相关方案；同一厂商下的不同产品、文档、SDK、API、博客、白皮书、隐私说明、接入指南和案例材料都应纳入分析。

每个厂商至少需要讨论：

- 公开产品定位：device fingerprint、device intelligence、device risk、fraud detection、mobile security 等。
- Android / mobile 接入方式：SDK、API、token、server-side enrichment、Web / H5 / 小程序联动等。
- 公开声称采集或使用的维度。
- 明确偏 Android 本地的维度。
- 明确偏服务端关联、网络、行为、风控画像的维度。
- 风险环境识别能力：root、hook、emulator、repackaging、tamper、proxy、VPN、群控、设备农场等。
- 设备连续性表达：跨安装、重装、清数据、换账号、换网络、系统升级后的识别或解释能力。
- 可补充进 GLNT-4 Android 计算维度清单的维度。
- 公开资料中无法确认但值得追问的维度。

### 厂商清单与进度

本节是 GLNT-4 厂商清单与进度的唯一来源。状态取值：

- `已完成`：厂商 LENS 已完成，且发现已纳入 Android 计算维度全集。
- `待整合`：厂商 LENS 已完成，但发现尚未纳入 Android 计算维度全集。
- `未开始`：尚未启动厂商 LENS。

| # | 厂商 / 方案 | 状态 | 当前产物 / 下一步 | 备注 |
|---|------------|------|------------------|------|
| V-001 | Fingerprint | 已完成 | C-005；发现已纳入 Android-Compute-Dimensions.md | 公开强调 Android / mobile device identification、100+ device and network signals、device intelligence、bot / VPN / emulator 等 smart signals |
| V-002 | SEON | 已完成 | C-008；发现已纳入 Android-Compute-Dimensions.md | 公开强调 Web 与 mobile SDK、device intelligence、device fingerprinting、实时风险判断 |
| V-003 | ThreatMetrix / LexisNexis Risk Solutions | 已完成 | C-010；发现已纳入 Android-Compute-Dimensions.md | 公开强调实时多源数据、风险模型和关联分析 |
| V-004 | Sift | 已完成 | C-011；发现已纳入 Android-Compute-Dimensions.md | 公开强调 device fingerprinting、behavioral analytics、machine learning 和 trust & safety 平台能力 |
| V-005 | Sumsub | 已完成 | C-012；发现已纳入 Android-Compute-Dimensions.md | 公开强调 Device Intelligence / Fisherman、risk labels、Android SDK 默认模块、Advanced IP、Behavior Monitoring、Fraud Network、sessionId 连续性 |
| V-006 | Incognia | 已完成 | C-013；I-001 ~ I-024 已纳入 Android-Compute-Dimensions.md v2.0 | 公开强调 mobile device signals、location intelligence 和 tamper detection |
| V-007 | Bureau | 已完成 | C-014；B-001 ~ B-025 已纳入 Android-Compute-Dimensions.md v2.0 | 公开强调 Device ID、持久性、设备关联和欺诈防控 |
| V-008 | DataVisor | 已完成 | C-015；DV-001 ~ DV-030 已纳入 Android-Compute-Dimensions.md v2.0 | 风控平台；必须独立分析，不作为泛泛参考带过 |
| V-009 | Feedzai | 已完成 | C-016；FZ-001 ~ FZ-014 已纳入 Android-Compute-Dimensions.md v2.0 | 风控平台；必须独立分析，不作为泛泛参考带过 |
| V-010 | Unit21 | 已完成 | C-017；UN-001 ~ UN-023 已纳入 Android-Compute-Dimensions.md v2.0 | 风控平台；必须独立分析，不作为泛泛参考带过 |
| V-011 | Talsec | 已完成 | C-009；发现已纳入 Android-Compute-Dimensions.md | Android 安全厂商；MediaDrm、设备模型、root / hook / repackaging 等 Android 本地信号参考源 |
| CN-001 | 阿里云风险识别 / 设备风险 SDK | 已完成 | C-018；C-001 ~ C-014 已纳入 Android-Compute-Dimensions.md v1.0（v2.0 沿用） | 公开强调 Android 设备指纹采集、设备风险识别、模拟器限制、架构支持、设备 / 网络 / 行为风险 |
| CN-002 | 腾讯云 T-Sec 设备安全 | 已完成 | C-019；YJ-001 ~ YJ-035 已纳入 Android-Compute-Dimensions.md v2.0 | 公开强调 Android / iOS / 小程序 / H5 SDK，模拟器、设备篡改、群控设备风险，以及账号、设备、IP 环境关联网络 |
| CN-003 | 京东云设备指纹 | 已完成 | C-020；JD-001 ~ JD-011 已纳入 Android-Compute-Dimensions.md v2.0 | 公开提供 JS / Android / iOS 接入管理 |
| CN-004 | 数美科技设备指纹 | 已完成 | C-021；10 条独立编号（公开字段粒度低）已纳入 Android-Compute-Dimensions.md v1.0（v2.0 沿用） | 公开强调 Android / iOS / Web / 小程序全平台，篡改设备、虚拟机、设备农场、全球设备风险库和设备风险结果 |
| CN-005 | 顶象设备指纹 | 已完成 | C-022；DX-001 ~ DX-011 已纳入 Android-Compute-Dimensions.md v1.0（v2.0 沿用） | 公开强调 Android / iOS / H5 / 小程序 SDK，设备指纹 token、设备风险识别 |
| CN-006 | 同盾科技 / 小盾设备指纹 | 已完成 | C-023；TD-001 ~ TD-049 已纳入 Android-Compute-Dimensions.md v2.0 | 公开强调风控 SDK、设备风险识别、多维度交叉验证 |
| CN-007 | 网易易盾智能风控 | 已完成 | C-024；WY-001 ~ WY-016 已纳入 Android-Compute-Dimensions.md v2.0 | 公开资料强调风控 SDK、客户端作弊工具、异常设备环境、异常内存行为、模拟器品牌和作弊工具类型识别 |
| CN-008 | 百度智能云风控 / 昊天镜 | 已完成 | C-025；BD-000（API 入参字段全被现有维度覆盖）已纳入 Android-Compute-Dimensions.md v2.0 | 公开资料强调设备指纹 SDK、设备风险识别、IP 画像、黑卡检测、威胁情报、ztoken / 设备风险标签 |
| CN-009 | 极验设备验 / GeeGuard | 已完成 | C-026；GT-001 ~ GT-023 + GT-P1 ~ GT-P6 已纳入 Android-Compute-Dimensions.md v2.0 | 公开资料强调设备指纹、风险设备识别、安全模型、反仿冒、重打包 / 签名校验等能力 |

当前进度汇总：

- 已完成：20 家（Fingerprint / SEON / Talsec / ThreatMetrix / Sift / Sumsub / Incognia / Bureau / DataVisor / Feedzai / Unit21 / 阿里云 / 腾讯云 T-Sec / 京东云 / 数美 / 顶象 / 同盾 / 网易易盾 / 百度智能云 / 极验）。
- 未开始：0 家。
- 下一家建议：已无下一家厂商 LENS 需创建；20 家厂商 LENS 全部 1:1 完成，维度全集已纳入 Android-Compute-Dimensions.md v2.0（447 条 + 130+ 双归位），GLNT-4 调研讨论已结束。后续如有新厂商发现，按 Android-Compute-Dimensions.md §3 编号约定模式扩展。

本讨论项的产出应服务于“Android 计算维度全集”，重点记录：

- 厂商公开声称使用或强调的 Android / mobile 维度。
- 厂商如何区分 device identification、device intelligence、risk signal、behavior signal。
- 哪些维度被多个厂商反复提及。
- 哪些维度更偏 Android 本地能力，哪些维度更偏服务端关联或风控上下文。
- 哪些维度可以补充到 GLNT-4 的 Android 维度清单中。

参考入口：

- Fingerprint Android device identification: https://fingerprint.com/blog/android-device-identification-fingerprint/
- Fingerprint device intelligence platforms: https://fingerprint.com/blog/best-device-intelligence-platforms/
- SEON Device Intelligence: https://docs.seon.io/getting-started/device-intelligence
- SEON Device Intelligence integration: https://docs.seon.io/integration/device-intelligence
- ThreatMetrix: https://risk.lexisnexis.com/products/threatmetrix
- Sumsub Device Intelligence: https://docs.sumsub.com/docs/device-intelligence
- Incognia Device Intelligence: https://www.incognia.com/device-intelligence
- Bureau Device Intelligence: https://bureau.id/device-intelligence
- Talsec Android device ID / MediaDrm discussion: https://docs.talsec.app/appsec-articles/articles/fraud-proofing-an-android-app-choosing-the-best-device-id-for-promo-abuse-prevention
- 阿里云设备风险 SDK Android 接入: https://help.aliyun.com/zh/fraud-detection/developer-reference/device-risk-detection-sdk-for-android
- 腾讯云 T-Sec 设备安全: https://cloud.tencent.com/product/tds
- 京东云设备指纹接入管理: https://docs.jdcloud.com/cn/device-fingerprint/access
- 数美科技设备指纹: https://www.ishumei.com/product/bs-post-sdk.html
- 顶象设备指纹: https://www.dingxiang-inc.com/docs/detail/const-id
- 百度智能云登录保护 API: https://intl.cloud.baidu.com/zh/doc/AFD/s/Mk9bkjpv7-intl
- 极验设备指纹合规指南: https://docs.geetest.com/guard/privacy
- 阿里云风险识别产品页: https://www.aliyun.com/product/security/saf

## 备注

如果后续发现仅靠维度清单不足以支撑说明，可以再补充最多三个极简评分项作为佐证，但当前不作为主目标。
