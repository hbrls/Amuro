# WORKSHOP-002 · GLNT-3 iOS 维度处理策略与方案候选池收束

> updated_by: Codex - GPT-5
> updated_at: 2026-07-02 12:13:37
>
> Vision Id: GLNT-3
> 来源：iOS-Compute-Dimensions.md、Index.md、WORKSHOP-001.md、C-003 至 C-023
> 调研基线 iOS 版本：iOS 17.5

---

## 0. Checkpoint 结论

GLNT-3 iOS 阶段已从“维度处理策略”进一步收束为“方案候选池收束”。

本轮输出把 iOS 462 个维度收束为可进入后续方案设计的 P0 / P1 候选池、P2 弱信号增强池、P2-H 高敏 / 合规 / 人工验收池、P3 明确不实现池，以及厂商能力认知池。当前不再需要创建新的 `C-*` 文件，也不需要等待后续任务编号；本文件是本阶段唯一收束产物。

本轮收束的关键判断是：

1. iOS 方案不以本地硬件 ID 枚举为核心。
2. iOS 方案应以厂商 SDK / API 明确返回值、服务端风险输出、RASP / 完整性标签和弱信号上下文为核心。
3. 高敏维度必须进入人工验收或合规决策，不得进入默认路径。
4. 服务端图谱、模型权重、样本库和跨客户网络不进入本地实现。
5. 证据缺口不阻塞本文件完成收束，但会限制字段级实现与稳定性承诺。

---

## 1. 输入与产物范围

本次 checkpoint 读取并整合当前 Vision 目录 `.context/GLNT-3/` 下阶段性文件：

| 文件 | 角色 |
| --- | --- |
| Index.md | GLNT-3 调研目标、iOS 17.5 基线、来源分层、禁止项、单厂商模板和主清单维护规则 |
| C-003.md、C-005.md 至 C-023.md | 20 家厂商 iOS 单厂商条目与主清单条目来源 |
| iOS-Compute-Dimensions.md | GLNT-3 iOS 计算维度全集主清单 v0.20 |
| WORKSHOP-001.md | 前一阶段 checkpoint 结论（仅作为历史参照） |

本 checkpoint 的唯一产物为当前文件。为清理冗余上下文，本阶段不再保留中间任务书或中间 `C-*` 收束文件；后续接手以本文件为准。

---

## 2. 目标与边界

### 2.1 已确认目标

GLNT-3 的目标已经从“厂商维度调研”推进到“iOS 方案候选池收束”。本轮的任务不再是继续扩充证据，而是将既有 iOS 主清单按可落地程度分层，明确哪些字段可以进入方案设计，哪些必须人工验收，哪些应排除。

### 2.2 调研基线

本轮统一使用 iOS 17.5 作为基线。该基线下 ATT、Privacy Manifest、Required Reason API 等平台约束已成熟，因此后续方案设计必须尊重 Apple 平台限制，不把其它平台的可见字段迁移为 iOS 事实。

### 2.3 明确不做

本轮不再延续旧的 WKWebView 指纹、概率碰撞、identity cluster、uncertain 匹配等主线。

本轮也不把 Android-only、HarmonyOS-only 字段迁移成 iOS 事实，不覆盖代码改动、SDK 接入、隐私政策文案、模型设计或 hash 还原 DeviceId 的方案。

---

## 3. 来源分层与证据规则

GLNT-3 单厂商条目统一采用三类来源：

| 来源类型 | 判定标准 | 写法约束 |
| --- | --- | --- |
| 实际采集 | 官方 SDK 文档、SDK 仓库、quickstart、API reference、changelog 或 privacy manifest 明确说明 SDK 会采集、返回或支持字段 / 信号 | 可写入具体维度，但仍需说明稳定性和平台边界 |
| 声明采集 | 官方材料声明具备 device intelligence、device fingerprint、Smart Signal、raw attributes、risk labels 等能力，但未公开完整底层字段 | 只能写成声明能力，不得反写成具体已确认本地字段 |
| 可反推 | 由官方返回字段、稳定性场景、版本边界、跨端对照或公开样例合理推导 | 必须标注推导来源，不能当作已实现事实 |

全局边界为：非公开 = 仅作线索、不作结论。服务端聚合 ID、设备图谱、风险画像、黑产样本库、模型权重、SDK 原始字段全集和持久化算法在未公开时，不得升级为 iOS 已确认采集项。

---

## 4. 厂商覆盖

20 家目标厂商已全部完成单厂商输出，并全部进入主清单。

| C 文件 | 厂商 | 主清单前缀 | 主清单编号数 | 结论 |
| --- | --- | --- | --- | --- |
| C-003 | Fingerprint | FP | 24 | 已进入 |
| C-005 | SEON | SE | 24 | 已进入 |
| C-006 | ThreatMetrix / LexisNexis Risk Solutions | TM | 24 | 已进入 |
| C-007 | Sift | SI | 20 | 已进入 |
| C-008 | Sumsub | SU | 22 | 已进入 |
| C-009 | Incognia | IN | 22 | 已进入 |
| C-010 | Bureau | BU | 24 | 已进入 |
| C-011 | DataVisor | DV | 24 | 已进入 |
| C-012 | Feedzai | FZ | 22 | 已进入 |
| C-013 | Unit21 | U2 | 22 | 已进入 |
| C-014 | Talsec | TS | 18 | 已进入 |
| C-015 | 阿里云风险识别 / 设备风险 SDK | AL | 22 | 已进入 |
| C-016 | 腾讯云 T-Sec 设备安全 | TC | 30 | 已进入 |
| C-017 | 京东云设备指纹 | JD | 24 | 已进入 |
| C-018 | 数美科技设备指纹 | SM | 24 | 已进入 |
| C-019 | 顶象设备指纹 | DX | 22 | 已进入 |
| C-020 | 同盾科技 / 小盾设备指纹 | TD | 24 | 已进入 |
| C-021 | 网易易盾智能风控 | YD | 24 | 已进入 |
| C-022 | 百度智能云风控 / 昊天镜 | BD | 22 | 已进入 |
| C-023 | 极验设备验 / GeeGuard | GG | 24 | 已进入 |

覆盖结论：厂商范围与 GLNT-4 对齐，不增不减；C-004 为 pilot 记录，不计入 20 家厂商覆盖数。

---

## 5. 主清单状态

统一主清单为 `.context/GLNT-3/iOS-Compute-Dimensions.md`，当前版本 v0.20。

| 分组 | 条数 | 风险信号 | 双归位 |
| --- | ---: | ---: | ---: |
| 系统 / Apple 标识 | 80 | 0 | 0 |
| SDK 自建 ID 与持久化 | 117 | 33 | 33 |
| 设备与环境属性 | 33 | 9 | 4 |
| 网络与位置环境 | 39 | 33 | 32 |
| 行为序列 | 41 | 40 | 40 |
| 风险与异常态 | 194 | 194 | 89 |
| 服务端图谱与衍生能力 | 68 | 65 | 18 |
| 合计 | 462 | 284 | 114 |

主清单已具备统一编号、来源引用、风险信号标注、双归位标注、分组总览和厂商条数核对。双归位条目按独立编号去重，不在合计中重复计数。

---

## 6. 收束结论

### 6.1 P0 默认方案候选

P0 进入条件：厂商 SDK / API 明确返回，且可按引用字段、请求凭证或服务端出参消费。

代表内容：

- `requestId`、`sessionId`、`collectionReference`
- `visitorId`、`deviceToken`、`DeviceToken`、`boxId`、`boxData`
- `hardId`、`ztoken`、`GeeToken`、`respondedGeeToken`
- `Openid`、`Unionid`、`eid`、`device_id`、`x`
- 风险分、reason code、SuggestionLevel、RiskInfos、SceneRiskInfos、Device Risk Score

### 6.2 P1 风控方案候选

P1 进入条件：厂商返回风险标签、risk score、reason code、完整性标签、RASP 标签或网络风险结果。

代表内容：

- jailbreak、simulator、debugger、hook、Frida、tamper、repackaging
- MITM、VPN、proxy、datacenter、GeoIP anomaly
- token 降级、离线 token、采集质量、链路可信度
- 设备伪造、设备农场、远控、黑名单、系统重置、样本库匹配

### 6.3 P2 弱信号增强候选

P2 进入条件：低敏设备属性、粗粒度上下文、网络出口上下文、采集配置上下文。

代表内容：

- 设备型号、系统版本、语言、时区、屏幕
- App 版本、签名、业务场景、租户绑定
- IP、GeoIP、网络类型、Wi-Fi / DNS / UA 缺口
- 云配、可控采集、私有化 / 海外部署、缓存控制

### 6.4 P2-H 高敏 / 合规 / 人工验收池

必须人工确认的内容：

- IDFA / ATT
- Keychain 跨重装持久化
- 精确位置、室内定位、位置历史
- LAN、nearby Wi-Fi、蓝牙、MAC
- 触控、输入节奏、行为生物特征、原始传感器
- 录屏、屏幕共享、摄像头风险
- 黑产工具、App 列表、样本库、跨客户共享网络

### 6.5 P3 明确不实现池

明确排除：

- IDFA 作为通用设备身份主路径
- DeviceCheck / App Attest 作为跨安装稳定 ID
- APNs token 作为稳定设备 ID
- 私有 API、隐蔽追踪、高敏默认采集
- 剪贴板、通讯录、短信、相册、文件列表、用户输入内容
- 未公开原始字段、模型权重、图谱合并规则、consortium 本体
- Web / H5 / 小程序字段写成 Native iOS 字段

---

## 7. 字段消费模型

后续 iOS 方案设计不应直接围绕“设备 ID”建模，而应围绕以下消费模型建模：

| 模型 | 字段来源 | 必填元数据 | 设计用途 |
| --- | --- | --- | --- |
| `vendor_event_ref` | requestId、sessionId、collectionReference、profiling reference | vendor、scene、generated_at、expires_at、single_use、source | 事件追踪、服务端查询、审计 |
| `vendor_token` | deviceToken、ztoken、GeeToken、boxData、tk、离线 token、降级 token | vendor、token_type、issuer、cache_policy、degraded、lifecycle_evidence | 请求凭证、链路状态、采集质量 |
| `server_device_ref` | visitorId、Openid、Unionid、eid、boxId、hardId、device_id、x、设备唯一编号 | vendor、scope、server_generated、stability_claim、persistence_evidence | 设备级引用，但不承诺硬件 ID |
| `risk_result` | risk score、risk label、reason code、decision、SuggestionLevel | vendor、risk_type、score、level、reason、decision、raw_label | 风控策略和解释 |
| `runtime_risk_label` | jailbreak、simulator、debugger、hook、Frida、tamper、repackaging | vendor、label、platform_boundary、trigger_public、confidence | App / 运行时风险 |
| `network_risk_label` | VPN、proxy、IP reputation、GeoIP anomaly、MITM | vendor、label、source_ip_context、location_permission_used、server_side | 网络风险 |
| `collection_quality` | token 降级、离线 token、采集失败、profiling status、ExtraInfos | vendor、status、degraded_reason、retryable、fallback_used | 降级和可信度 |
| `compliance_gate` | P2-H 高敏维度 | data_type、purpose、permission、retention、review_status、approved_by | 人工验收和合规拦截 |

统一约束：

- 每个字段必须记录 `source = sdk_returned | server_returned | business_input | vendor_claim | evidence_gap`。
- 每个字段必须记录 `local_collection = yes | no | unknown`。
- 每个字段必须记录 `stability = single_event | session | install | vendor_scope | server_scope | unknown`。
- `unknown` 不能在实现中被解释为稳定。

---

## 8. 证据缺口与是否阻塞

| 证据缺口 | 当前处理 | 是否阻塞方案收束 |
| --- | --- | --- |
| iOS SDK 原始字段表普遍不公开 | 保留为字段 schema 缺口；不得升级为已采集事实。 | 不阻塞 P0 / P1 收束；阻塞字段级本地实现。 |
| IDFV、IDFA、Keychain、DeviceCheck、App Attest、APNs token 使用情况多数未公开 | 保留为 Apple 标识缺口或人工验收项。 | 不阻塞 token / 风险标签设计；阻塞 Apple 标识进入默认路径。 |
| token、服务端设备 ID、跨重装和跨账号生命周期未公开 | 按厂商声明或出参消费，生命周期标 unknown。 | 不阻塞消费出参；阻塞稳定 ID 语义承诺。 |
| Keychain / App Group / Web storage / cookie 等持久化路径未公开 | 不归因、不补写。 | 不阻塞方案设计；阻塞本地持久化实现。 |
| 服务端图谱、风险画像、模型权重、合并规则不可验证 | 归入服务端图谱与厂商能力认知。 | 不阻塞消费明确标签；阻塞复刻算法或图谱。 |
| 行为、位置、传感器、本地网络采样范围未公开 | 列为 P2-H 高敏和人工验收项。 | 不阻塞 P0 / P1；阻塞高敏增强落地。 |
| Web / H5 / 小程序与 Native iOS 边界不清 | 不迁移为 Native iOS 字段。 | 不阻塞 Native iOS 方案；阻塞 Web 场景设计。 |
| 风险标签 trigger 未公开 | 消费标签，不反推底层 trigger。 | 不阻塞风险结果消费；阻塞自研检测实现。 |

结论：证据缺口不阻塞本文件完成内容收束。真正可推进的输出是 P0 / P1 默认候选池；缺口只限制稳定性承诺、字段级本地实现和高敏增强落地。

---

## 9. 下一阶段接手方式

### 9.1 方案推进入口

如果下一步进入实现，应优先使用证据强、合规边界清晰、iOS API 可行的维度：

| 优先级 | 维度类型 | 说明 |
| --- | --- | --- |
| P0 | 厂商 SDK 返回 token / session / requestId / receipt | 以厂商公开 API 为准，避免自行扩展高敏采集 |
| P1 | 服务端风险标签、risk score、reason code | 作为风控结果消费，不反推本地字段 |
| P1 | App 完整性、jailbreak、simulator、debugger、tamper 等 RASP 信号 | 需依赖厂商 SDK 或公开可实现能力 |
| P2 | 网络、IP、VPN、proxy、coarse location | 需处理权限、合规和授权边界 |
| P2 | 行为序列与传感器 | 高敏，必须有明确产品目的和采样最小化 |
| P3 | IDFA、精确位置、剪贴板、App 列表、私有 API | 默认不进入通用设备身份主路径 |

### 9.2 维护入口

- 调整目标、口径、证据规则：修改 `Index.md`
- 补齐、去重、重编号或修正统一维度归位：修改 `iOS-Compute-Dimensions.md`
- 不回写历史单厂商 `C-*`，除非任务明确要求

---

## 10. 停止条件与验收点

### 10.1 已满足的停止条件

- 20 家目标厂商全部完成单厂商输出。
- 20 家厂商全部进入 iOS 统一 Dimensions 主清单。
- 主清单包含统一分组、编号、来源、风险信号、双归位和条数核对。
- 非公开与高敏边界已在 Index、单厂商条目和主清单中保持一致。
- 本文件已明确给出收束后的 P0 / P1 / P2 / P2-H / P3 分层。

### 10.2 人工验收点

如 Human 需要验收，建议只看以下点：

1. 是否接受 iOS 后续方案以 P0 / P1 为主体。
2. 是否接受 P2-H 高敏维度必须先人工验收。
3. 是否接受 P3 不进入实现。
4. 是否接受服务端图谱、样本库、模型权重不进入本地实现。
5. 是否接受“非公开 = 仅作线索、不作结论”的证据边界。

### 10.3 USE 判定

本次 checkpoint 未识别到“必须由人执行且阻塞下一阶段”的闭合动作。

当前人工验收点属于可选验收，不是进入 checkpoint 的强制前置条件；因此本 WORKSHOP 不生成 `USE-002` 章节。
