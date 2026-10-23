# Cognitum.One 技术产品调研

> updated_by: Kilo - glm-5.2
> updated_at: 2026-07-19 10:05:00
> evidence_window: 2026-07-19，cognitum.one 官网（SPA）+ `/.well-known/` 结构化规范（cognitum-manifest.json / agent-guide.md / robots.txt / openapi）+ CES 2026 Innovation Awards 官方页面（ Embedded Technologies 类别 Honoree）

## 交付结论

1. **判定：不符合本次调研焦点要求。** Cognitum 是自学习**嵌入式硬件 / AI 处理器产品**，主体功能（传感数据采集、向量化、自我学习基线、异常检测、向量记忆、Witness Chain 审计）运行在 **Seed 设备自身的嵌入式硅/WASM 运行时**上，不在 Windows/macOS 工作 PC 的操作系统上运行。工作 PC 只是宿主与控制器，承载 SDK / MCP 客户端 / 编码 Agent（Claude Code、Codex 等），通过 USB 与 `cognitum.local`（mDNS）与设备通信。
2. **与 Plane 的排除原因不同：** Plane 因主体在云端被排除；Cognitum 恰恰相反——官方明确"offline-first、no cloud dependency、data never leaves the device"，是本地优先、反云端的。其不符合要求的原因是"主体在专用嵌入式硬件、而非工作 PC 的 OS"，属于**产品类别不匹配（硬件/嵌入式 AI）**，而非"云端壳"。
3. Cognitum **不是 Linux-only**：Seed 为 USB 即插即用硬件，PC 端 SDK 跨平台（Rust / Node.js / Python），设备发现走 mDNS（`cognitum.local`），与编码 Agent 通过 MCP（Claude Code 原生）或 REST 集成，Windows/macOS 均可作为宿主。因此排除点不在"平台支持"，而在"主体运行位置"。
4. 产品族三阶段：**Seed**（$131，信用卡尺寸自学习智能传感器，现已接受订购）/ **v0 桌面设备**（Q2 2026，协调多 Seed 的桌面 appliance，独立物理盒子）/ **v1 芯片**（Late 2026，257 核自学习硅）。三者均非"安装在 Win/Mac 工作机上的软件"。
5. CES 2026 Innovation Awards（Embedded Technologies 类别 Honoree）第三方权威背书：Cognitum by ChipStart® 是"ultra-low-power, high-performance AI processor ... embedded AI inference directly on-device"，目标市场为智能监控、AR/VR 可穿戴、物联网、工业自动化、农业科技——确认其定位为边缘嵌入式 AI 硬件。
6. 由于核心焦点（主体功能在工作 PC 本地 OS 上运行）不满足，依据 RUNBOOK 不再展开嵌入式固件实现、WASM 运行时内部、芯片微架构、硅后验证等深入架构调研。

## 调研目标、范围与边界

### 调研目标

判断 Cognitum（cognitum.one）能否作为"主体功能运行在 Windows/macOS 工作 PC 本地 OS 上"的产品，并说明其在工作机上的安装/运行形态、依赖与权限。

### 核心问题

- Cognitum 的主体功能（自学习、向量记忆、异常检测、Witness Chain）运行在 PC 的 OS 上，还是运行在专用嵌入式硬件上？
- Windows 与 macOS 工作机上如何安装、运行 Cognitum？依赖与权限是什么？
- 工作机软件是独立可运行的产品本体，还是连接 Seed 硬件的客户端/控制层？

### 覆盖范围

- 官网 cognitum.one 首页（SPA，提取 HTML meta 与结构化数据）
- `/.well-known/cognitum-manifest.json`（平台能力清单，权威）
- `/.well-known/agent-guide.md`（集成指南，权威）
- `robots.txt`（含产品族、架构、安全、集成点说明，权威）
- `sitemap.xml`（页面清单与更新时间）
- CES 2026 Innovation Awards 官方 Honoree 页面（第三方权威）

### 明确排除

- 不做源码审计、不盘点固件内部、WASM 字节码、MCP 工具实现、HNSW 索引实现
- 不做竞品比较（其他边缘 AI 硬件仅作官方对照说明，不展开选型矩阵）
- 不调研遥测——官方明确"无遥测、无云同步"，不展开运营数据采集
- 不展开云端 Escalation 层的服务端实现（官方明确默认关闭、仅辅助角色）
- 不把 Linux 安装作为默认路径（产品为跨平台 USB 硬件 + 跨平台 SDK，无 Linux 优先假设）

## 证据口径

- **官方 `/.well-known/` 结构化文件（manifest / agent-guide / robots.txt）**：用于产品定位、产品族、架构分层、安全模型、集成接口。属官方权威机器可读规范，证据时间 2026-03-07 至 2026-05-21。宣传性表述（"offline-first""data never leaves the device"）需与架构分层和安全字段交叉确认——manifest 的 `security.data_residency: "On-device only"` 与 `architecture.principles` 一致，相互印证。
- **官网 HTML meta 与 JSON-LD 结构化数据**：用于价格、预售状态、产品类别。注意 manifest 标 `status: "available"` 而 HTML JSON-LD 标 `availability: PreOrder`，存在轻度不一致，已如实记录。
- **CES 2026 Innovation Awards 官方页面（CTA）**：第三方权威背书，确认产品为嵌入式 AI 处理器/边缘设备，非 PC 软件。
- **架构推导**：基于官方架构分层（Seed → Coordination → Escalation）推断主体位置，标注为推导。
- **未决项**：PC 端 SDK 的具体系统要求、USB 驱动形态、是否需要主机后台常驻服务，官方资料未明确。

## 产品调研

### 产品定位与目标用户

manifest 自述："Self-learning hardware platform. Starts with a sensor, grows into an appliance, ends up in everything. No cloud required." robots.txt 自述："Agentic Hardware Platform"。HTML meta 关键词聚焦 edge intelligence、AI agent platform、MCP protocol、Seed device、agentic computing。

CES 官方背书定位："ultra-low-power, high-performance AI processor designed for the next generation of edge devices ... embedded AI inference directly on-device"。目标市场：智能监控与摄像系统、AR/VR 可穿戴、连接型智能设备、工业自动化、农业科技。官网 solutions 页覆盖 healthcare、elder-care、retail、smart-building、security、industrial、sleep-health、research、defense、financial-services、silicon——以物理世界感知与受监管行业的本地智能为主。

一句话定位：面向物理世界、本地优先、无需云端的嵌入式自学习 AI 硬件平台，工作 PC 上的编码 Agent 通过 MCP/REST 调用它。

### 核心流程

以"让 Seed 学会某传感器并检测异常"为主线：将传感器（温度/振动/湿度等）接入 Seed → Seed 读取读数并自动向量化 → 随时间学习"正常基线"（无需标注数据、无需训练管线）→ 当读数偏离基线时标记异常 → 向量记忆（10 万+ 向量，HNSW，<1ms 检索）与 Witness Chain（Ed25519 签名追加式审计）记录于设备本地 → 编码 Agent（Claude Code 等）通过 12 个 MCP 工具或 REST API（`cognitum.local/api/v1/`）查询设备状态、向量检索、审计链。

整条链路的"学习与判定"主体发生在 Seed 嵌入式硬件上；工作 PC 上的 Agent/SDK 只负责发起查询与消费结果。

### 功能地图与边界

- **当前可用**：Cognitum Seed（$131，接受订购）——USB 即插即用、设备端自学习、10 万+ 向量记忆、Ed25519 + Witness Chain、12 个 MCP 工具、REST API、离线优先、AES-256 静态加密。
- **规划/未发布**：v0 桌面设备（Q2 2026，协调多 Seed，4200 GOPS 算力、GbE mesh、拜占庭容错）；v1 芯片（Late 2026，257 核、8GHz 突发、20MB SRAM、10–20x perf-per-joule）。
- **边界**：Cognitum 是嵌入式硬件 AI 产品，不是 PC 端软件应用；PC 端 SDK/MCP 层是集成控制层，不是产品本体。

### 维护状态与版本演进

- 官网 sitemap 显示高频更新：enterprise / stories / services / marketplace / solutions 等页 lastmod 2026-07-16，learn 博客 lastmod 2026-07-18。manifest `version: 1.0.0`，robots.txt `Version: 1.0.0, Last Updated: 2026-03-07`。
- 产品族路线图清晰：Seed（现售）→ v0 appliance（Q2 2026）→ v1 chip（Late 2026），方向为"从传感器到桌面设备到芯片"。
- 未发现公开 GitHub 仓库或开源代码线索（manifest 无仓库链接；官网无开发者源码入口）。许可证未知（未决）。

### 生态与反馈

- 集成生态：12 个 MCP 工具，兼容 Claude Code（Anthropic，MCP 原生）、Codex（OpenAI，REST）、Gemini Code Assist（Google，REST）、GitHub Copilot（REST）、自定义 MCP 客户端；并提供 Rust / Node.js / Python SDK 与 `claude-code` SDK 子页。
- 第三方背书：CES 2026 Innovation Awards Embedded Technologies 类别 Honoree（CTA 官方页面，证据时间 2026 年）。
- 反馈样本边界：未抽样公开 Issue/Discussion（未发现公开代码托管与社区讨论入口）；官网 stories 页为遴选展示，不代表普遍反馈。

## 技术架构调研

### 系统全貌与运行形态

Cognitum 由 **嵌入式硬件设备 + 工作 PC 侧集成层 + 可选云端 Escalation** 三层组成。主体智能在嵌入式硬件上运行，工作 PC 侧为宿主/控制器，云端默认关闭。

官方架构分层（manifest `architecture.layers`）：

| 层 | 角色 | 运行位置 |
| --- | --- | --- |
| Seed | 感知与学习：读传感器、向量化、学习正常基线、标记异常 | Seed 嵌入式硬件（WASM 运行时） |
| Coordination | 决策：汇总多 Seed 上下文、应用规则、本地解决多数情况 | v0 桌面设备（Q2 2026，独立物理盒子） |
| Escalation | 重负载：仅在需要时启用 GPU 或云资源，默认关闭 | 可选，官方明确"Off by default" |

架构原则（官方）：离线优先、数据默认不出设备、事件驱动（仅当有事发生才工作）、自学习（无需训练管线/标注）、每条记录有加密审计。

### 主要组件与核心链路

- **Seed 嵌入式硬件**：运行 WASM 运行时，承载自学习、向量记忆（HNSW，10 万+ 向量，<1ms 检索）、Witness Chain（Ed25519 签名追加式）、传感器读取。USB 即插即用，通过 mDNS 暴露 `cognitum.local`。
- **工作 PC 侧（宿主/控制层）**：编码 Agent（Claude Code 等）+ SDK（Rust/Node/Python）+ MCP 客户端，通过 USB/局域网与 Seed 通信。这是 PC 上安装的软件，但属控制层而非本体。
- **可选云端 Escalation**：默认关闭，仅在需要重负载时启用 GPU 或云资源，符合 RUNBOOK"云端仅辅助角色"。

核心链路（以"Agent 查询设备异常与向量记忆"为例）：编码 Agent 在工作 PC 发起 MCP 工具调用（如 `anomaly_list` / `vector_search`）→ 请求经 mDNS 路由到 `cognitum.local/api/v1/`（X-Api-Key 鉴权）→ Seed 在嵌入式硬件本地完成向量检索/异常查询/审计链读取 → 结果返回 Agent。整条链路的"查询执行"主体在 Seed 硬件上，PC 侧仅发起与消费。

### 主要依赖

- 设备侧硬依赖：传感器（温度、振动、湿度、空气质量、光与占用、电流/功率、自定义模拟/数字传感器）；Ed25519 签名；AES-256 静态加密；HNSW 向量索引；WASM 运行时。
- PC 侧依赖：编码 Agent（Claude Code / Codex / Gemini Code Assist / Copilot 之一）或自定义 MCP/REST 客户端；Rust / Node.js / Python 运行时（按所选 SDK）。
- 云端依赖：无（默认）。官方明确"No cloud dependency""works fully offline"。

### 接口形态

- 对编码 Agent / 集成：**MCP 协议**（12 个工具：`vector_store`/`vector_search`/`vector_delete`/`sensor_read`/`sensor_history`/`witness_append`/`witness_query`/`device_status`/`baseline_get`/`anomaly_list`/`config_get`/`config_set`）；**REST API**（`https://cognitum.local/api/v1/`，X-Api-Key 或 JWT 鉴权，关键端点 `/vectors/search`、`/sensors`、`/witness/chain`、`/device/status`）。
- 对传感器：模拟/数字传感器直连 Seed 硬件。
- 不穷举端点与 MCP 工具内部实现。

### 持久化方式

- 主体状态（向量记忆、学习基线、Witness Chain 审计、传感器历史、设备配置）存放于 **Seed 设备本地**，AES-256 静态加密，Ed25519 签名。
- 数据居留：on-device only，默认不出设备。
- 工作 PC 侧是否缓存设备数据：官方资料未明确（未决）；即便有缓存也不改变主体在设备的结论。

### 通信方式

- 工作 PC ↔ Seed：USB（即插即用）+ 局域网 mDNS（`cognitum.local`），REST（HTTPS）与 MCP。
- 多 Seed 之间：mesh 协调（v0 桌面设备，Q2 2026）。
- 设备 ↔ 云：默认无；Escalation 层仅在显式启用时与云/GPU 交互。
- 不审计心跳/锁/重试/退避实现。

### 部署形态

#### 工作机安装（Windows / macOS）

- **PC 侧软件（宿主/控制层，非产品本体）**：
  - 安装入口：官网 `/developers`、`/sdks`（Rust / Node.js / Python / `claude-code` 子页）。
  - 安装方式：在 Win/macOS 工作机上安装编码 Agent（如 Claude Code）与所选语言 SDK；通过 MCP 配置或 REST `X-Api-Key` 连接 Seed。
  - 设备发现：Seed 通过 USB 接入后在局域网以 `cognitum.local`（mDNS）暴露 REST/MCP 接口；跨平台，无 Linux 优先假设。
  - 依赖与权限：需 Rust/Node/Python 运行时之一；需 USB 访问与局域网/mDNS；需 Seed 设备本身（$131）。具体系统版本要求、USB 驱动形态、是否需主机后台常驻服务，官方资料未明确（未决）。
  - 卸载：按各平台常规方式卸载 Agent/SDK；设备数据保留在 Seed 硬件本地。
- **硬件本体（产品本体，不在 PC OS 上运行）**：Cognitum Seed 为独立嵌入式硬件，$131，官网 `/order` 接受订购；v0 桌面设备（Q2 2026）为独立物理 appliance，非安装在 PC 上的软件。

#### 主体功能运行位置

- **主体功能运行在 Seed 嵌入式硬件（WASM 运行时 / 自学习硅），不在工作 PC 的 Windows/macOS OS 上。**
- 工作 PC 侧软件（Agent + SDK + MCP 客户端）是控制/集成层，不承载自学习、向量记忆、Witness Chain 等主体逻辑。
- 依 RUNBOOK 判定：**不符合"主体功能运行在工作 PC 本地 OS"的要求**——但排除原因为"嵌入式硬件产品、主体在专用硅"，与 Plane 的"云端壳"排除原因本质不同。Cognitum 实为本地优先、反云端产品。
- 边界说明：Seed 物理上插在工作 PC 的 USB 口上，但其智能在嵌入式硅而非 PC 的 CPU/OS。若将"USB 外设的嵌入式智能"宽松解读为"在 PC 本地"，则属类别外延讨论，建议人工裁决（HH）。

#### 云端网关（如存在）

- 官方明确无云依赖、默认无云同步。Escalation 层（GPU/云资源）默认关闭，仅在显式启用时承担重负载辅助角色——符合 RUNBOOK"云端仅辅助角色"，简单提及即可，不展开。

## 未决项与证据边界

- **主体位置判定为不符合**，但属"嵌入式硬件 vs PC OS"的类别不匹配，非云端排除。是否将"插在 PC USB 口上的嵌入式智能外设"计为"在 PC 本地"，超出 RUNBOOK 焦点字面范围，建议人工裁决。
- PC 侧 SDK 的系统版本要求、USB 驱动形态、是否需主机后台常驻服务，官方资料未明确。
- manifest 标 Seed `status: "available"`，HTML JSON-LD 标 `availability: PreOrder`，存在轻度不一致；以"接受订购、$131"为可信边界。
- 未发现公开代码托管（GitHub 等）与社区讨论入口，许可证未知，反馈样本未覆盖。
- 未抽样公开 Issue/Discussion；官网 stories/solutions 为遴选展示，不代表普遍反馈。

## 后续验证建议

- 若仍考虑 Cognitum 作为"工作机本地的边缘 AI 硬件 + 编码 Agent 集成"方案（而非"主体为 PC OS 软件"），应改用独立调研流程，重点验证：Seed 实机在 Win/macOS 上的 USB 即插即用体验、`cognitum.local` mDNS 解析、MCP 工具在 Claude Code 中的实际可用性、向量检索延迟与离线行为。
- 如需确认"主体是否真在设备而非 PC"，可在断网/断开 PC 进程后验证 Seed 是否仍持续学习与记录异常——官方架构声称如此，建议运行验证。
- 建议人工裁决"嵌入式硬件外设"是否纳入"主体在 PC 本地"的口径；若口径仅限 PC OS 软件，则 Cognitum 不符合且无需后续验证。
