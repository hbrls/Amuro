# 阿里云函数计算 AgentRun 技术产品调研

> updated_by: Qoder - Claude
> updated_at: 2026-07-18
> evidence_window: 2026-07-18；目标版本为官方文档与产品页公开快照（产品发布于 2025-12-15）

## 交付结论

1. **产品定位**：AgentRun 是阿里云函数计算（FC）旗下的「一站式 Agentic AI 基础设施平台」，以高代码为核心、生态开放、灵活组装，为企业级 Agent 应用提供开发—部署—运维全生命周期管理。一句话概括：`AgentRun = 云原生运行底座 + 沙箱平台 + 模型治理与工具生态 + 安全与可观测能力`。
2. **运行形态**：构建在阿里云函数计算 FC 的 Serverless 底座之上，由两大类运行时组成——**Agent 运行时**（承载 Agent 业务逻辑）与 **Sandbox 运行时**（承载不可信代码执行与浏览器自动化）。两者均支持缩容到 0、毫秒级浅休眠唤醒、会话亲和，平台侧 3AZ 高可用。
3. **核心架构**：平台由六个核心组件构成——AgentRuntime、Sandbox、模型管理、工具管理、凭证管理、可观测与运维。Agent 通过统一模型代理调用 LLM，通过 MCP/Function Call 调用工具，通过 Sandbox 执行代码与浏览器操作，全程由 OpenTelemetry 全链路追踪。
4. **接口形态**：对外提供兼容 OpenAI Chat Completions 的 HTTP API、多语言 SDK（Python/Node.js，已开源）、UI 集成、MCP 集成四种方式；Sandbox 浏览器能力通过 CDP over WebSocket 暴露，兼容 Puppeteer/Playwright。
5. **部署形态**：默认云上 Serverless 托管，无需维护服务器/容器/K8s；同时支持 VPC/IDC 私有化部署（核心数据不出域）、PrivateLink 内网访问；首次使用需完成 SLR 服务关联角色授权。
6. **维护状态**：产品于 2025-12-15 正式发布，2026-03 获评亚太 Agentic AI 开发平台市场领导者，处于活跃演进早期；Sandbox SDK 已开源（`Serverless-Devs/agentrun-sdk-python`、`agentrun-sdk-nodejs`）。
7. **边界提示**：Computer/Mobile Use、All-in-One、RL、Sim 等沙箱类型为官方「规划与扩展方向」，**非当前可用能力**；社区反馈样本稀疏（产品较新），个案不代表普遍结论。

## 调研目标、范围与边界

### 调研目标

理解阿里云函数计算 AgentRun 是什么、解决什么问题、技术架构如何组成，为后续是否基于该平台构建或集成 Agent 应用提供判断依据。

### 核心问题

- 产品定位与目标用户是谁？
- 系统以什么形态运行、由哪些主要组件组成？
- 一条核心链路如何穿过这些组件？
- 接口、持久化、通信、部署四类技术约束如何影响使用与扩展？

### 覆盖范围

- 产品调研：定位、用户、核心流程、功能边界、维护状态、版本演进、生态与反馈。
- 技术架构调研：运行形态、主要依赖、接口形态、持久化方式、通信方式、部署形态。

### 明确排除

- 不做源码审计（不逐文件扫描 SDK 实现、不枚举路由/配置键）。
- 不做竞品比较（不与 Dify、Coze、AWS Bedrock Agents 等横向对比）。
- 不做性能 benchmark。

## 证据口径

| 证据类型 | 来源 | 使用边界 |
| --- | --- | --- |
| 官方产品资料 | 阿里云产品页 `aliyun.com/product/fc/agentrun` | 宣传性表述已与官方帮助文档交叉确认 |
| 官方帮助文档 | `help.aliyun.com/zh/functioncompute/fc/what-is-agenrun`（核心架构来源） | 文档可能滞后，已记录证据时间为 2026-07 快照 |
| 仓库元数据 | `github.com/Serverless-Devs/agentrun-sdk-python`、`agentrun-sdk-nodejs` | 仅证明 SDK 已开源与语言覆盖，不外推运行时表现 |
| 社区与新闻资料 | 阿里云开发者社区、知乎深度解析、新浪科技报道 | 用于判断发布时间与生态反馈，个案不代表普遍 |
| 架构推导 | 基于官方文档的组件关系与调用流向描述 | 已标注为推导，不等同于运行验证 |
| 未决 | 缺少运行验证或官方未说明的事项 | 标注为未决，不以「未发现」推导「不存在」 |

## 产品调研

### 产品定位与目标用户

**定位**：面向企业级 Agentic AI 应用的一站式 Serverless 基础设施平台。它不是单一 Agent 开发框架，也不是模型调用 SDK，而是把执行环境、模型网关、工具调用、日志监控、权限体系打包为一个为 Agent 场景优化的平台，让团队专注于业务逻辑与智能体行为本身。

**目标用户与开发模式分层**：

| 开发模式 | 面向角色 | 形态 |
| --- | --- | --- |
| 无代码（AI Studio） | 业务/运营人员 | 可视化界面搭建 Agent |
| 低代码（快速创建 Agent） | 原型验证者 | 界面选模型、写提示词、配工具/Sandbox |
| 高代码（代码创建 Agent） | 工程团队 | Python/Node.js/Java + 任意框架 |

低代码验证完成后可**一键转换为高代码**，平台据当前配置生成可维护代码，后续直接在高代码模式迭代，无需重写。

### 核心流程

以「企业构建并运行一个带代码执行能力的 Agent」为例，端到端流程：

1. **构建**：用户在控制台选择开发模式（无/低/高代码），配置模型、提示词、工具、Sandbox。
2. **部署**：代码包（本地/OSS）/在线编码/自定义容器镜像上传至 Agent 运行时，平台基于 Serverless 弹性调度实例，版本管理与灰度发布。
3. **集成**：外部应用通过 OpenAI 兼容 HTTP API、SDK、UI 或 MCP 调用 Agent。
4. **运行**：Agent 接收请求 → 经统一模型代理调用 LLM（负载均衡/Fallback） → 按需通过 MCP/Function Call 调用工具 → 按需调用 Sandbox 执行代码或浏览器操作。
5. **观测**：全链路 OpenTelemetry Trace 贯穿 请求→网关→Agent→模型→工具→外部依赖；Token 级成本归因；日志入 SLS 检索分析。
6. **演进**：低代码可一键转高代码迭代；支持版本管理与灰度发布。

### 功能地图与边界

| 功能域 | 当前可用 | 实验性/规划 |
| --- | --- | --- |
| Agent 运行时（多语言、会话亲和、弹性） | ✅ Python 3.10/3.12、Node.js 18/20、Java 8/11/17 | — |
| Sandbox — Code Interpreter | ✅ 50+ 语言、文件/会话管理 | — |
| Sandbox — Browser Use | ✅ CDP over WebSocket、兼容 Puppeteer/Playwright | — |
| Sandbox — Computer/Mobile Use、All-in-One、RL、Sim | ❌ | 🟡 规划与扩展方向 |
| 模型管理（第三方 + 开源托管 + 向量模型） | ✅ 千问/DeepSeek/开源，FunModel 一键托管 | — |
| 工具管理（MCP + Function Call） | ✅ Tool Hub、自定义工具、MCP 打包 | 🟡 AI 自动生成工具定义、工具推荐引擎 |
| 凭证管理 | ✅ API Key/JWT/Basic/AK-SK、动态注入、一键禁用 | — |
| 可观测与运维 | ✅ OpenTelemetry Trace、Prometheus/ARMS、SLS 日志 | — |
| 数据与记忆 | ✅ 集成 Mem0/RAGFlow，托管或绑定已有部署 | — |

> 标注依据：官方帮助文档「核心组件与架构」与「开箱即用的 Sandbox 能力」章节明确将 Computer/Mobile Use 等列为「规划与扩展方向」，故归为非当前可用。

### 维护状态与版本演进

- **发布时间**：2025-12-15（官方「一文看懂函数计算 AgentRun」）。
- **生态认可**：2026-03-02 阿里凭 AgentRun 获评「亚太 Agentic AI 开发平台市场领导者」。
- **底座成熟度**：构建于阿里云函数计算 FC（成熟 Serverless 产品）之上，运行底座的稳定性可继承 FC 既有能力；但 AgentRun 作为独立产品形态处于早期演进阶段。
- **开源动作**：AgentRun Sandbox SDK 已开源（Python/Node.js），表明生态开放承诺正在落地。
- **判断**：产品活跃、处于早期快速演进，方向性变化（沙箱类型、工具智能化）在官方路线图中但尚未全部落地。

### 生态与反馈

**集成生态（官方明确）**：
- Agent 框架：LangChain、AgentScope（含 Java 版）、CrewAI、Google ADK、PydanticAI。
- 模型：千问、DeepSeek 等主流厂商，以及 vLLM/SGLang/Ollama/LMDeploy 托管的开源模型。
- 记忆/RAG：Mem0、RAGFlow 深度集成。
- 第三方平台：Dify 等平台中可使用 AgentRun Agent。
- 应用模板（应用广场）：氛围编程专家、电商点单外卖助手（A2A 多 Agent）、舆情分析专家、深度研究专家、函数求值专家、浏览器搜索助手。

**反馈样本与边界**：当前公开反馈以阿里云官方/开发者社区内容与少量第三方实践文章为主（如赛博朋克眼镜 Hack 案例、舆情分析专家实现），属于早期采用者个案，样本稀疏，不构成普遍生产反馈。Star/Fork/Issue 数只能描述公开快照，不直接等同采用率。

## 技术架构调研

### 系统全貌与运行形态

AgentRun 运行在阿里云函数计算 FC 的 Serverless 底座上。整体为云上托管形态，由**控制面**（管理 Agent/Sandbox/模型/工具/凭证配置，控制台 + RAM 鉴权）与**数据面**（实际运行 Agent 与 Sandbox 实例、处理请求与模型/工具调用）两层组成。平台通过 3 个可用区（3AZ）实现自动容灾，单可用区宕机不影响服务。用户无需维护服务器、容器或 K8s 集群。

> 架构推导（非运行验证）：控制面/数据面分层与 FC 既有 Serverless 模型一致，基于官方对「控制面安全/数据面安全/基础设施安全」的描述推断。

### 主要组件与核心链路

**六个核心组件**（官方「核心组件与架构」章节）：

1. **AgentRuntime（智能体运行时）**——Agent 执行环境与生命周期管理。支持多语言（Python/Node.js/Java）、会话亲和、Serverless 弹性、多实例并发、版本与 Endpoint 灰度发布；部署方式为代码包（本地/OSS）、在线编码、自定义容器镜像。
2. **Sandbox（沙箱管理平台）**——为代码执行与浏览器操作提供安全、高性能的 Serverless 沙箱。基于安全容器（MicroVM）多级隔离（请求级/实例级/会话级），支持缩容到 0、毫秒级唤醒、万级实例/分钟极速交付，支持预置镜像与自定义镜像。
3. **模型管理**——统一 LLM 接入与治理。来源含第三方模型、开源托管模型（vLLM/SGLang/Ollama/LMDeploy）、向量模型；提供 Serverless 模型运行时（弹性 GPU、低峰缩 0）；治理含多模型负载代理、Fallback、并发控制、超时缓存、内容安全、Token 限流与成本监控。
4. **工具管理**——统一工具定义、调用与治理。支持 MCP 与 Function Call 双协议；Tool Hub 提供常用工具一键接入；支持 Hook 注入、语义分析、智能路由；支持 MCP 打包工具聚合为单一网关。
5. **凭证管理**——统一管理 Agent/Sandbox/LLM/工具访问凭证（API Key/JWT/Basic/AK-SK）；与运行时联动动态注入；支持一键禁用疑似泄露凭证。
6. **可观测与运维**——OpenTelemetry 全链路 Trace（请求→网关→Agent→模型→工具→外部依赖）；Prometheus/ARMS 监控大盘；日志统一存储支持检索与 SQL 分析；支持对模型调用日志做质量/安全/意图二次评估。

**核心链路（带代码执行能力的 Agent 请求）**：

```
外部应用
  |  (OpenAI 兼容 HTTP API / SDK / UI / MCP)
  v
AgentRuntime 实例（会话亲和、Serverless 弹性）
  |
  +-> 模型管理（统一模型代理：负载均衡/Fallback/内容安全/Token 限流）
  |      +-> LLM（千问/DeepSeek/开源托管）
  |
  +-> 工具管理（MCP/Function Call，含 Hook/智能路由）
  |      +-> 外部工具 / Tool Hub / MCP 网关
  |
  +-> Sandbox（MicroVM 隔离）
         +-> Code Interpreter（执行代码，挂载 OSS/NAS）
         +-> Browser Use（CDP over WebSocket，Puppeteer/Playwright）

全程：OpenTelemetry Trace + Token 成本归因 + SLS 日志
凭证：凭证管理运行时动态注入（API Key/JWT/Basic/AK-SK）
```

**关键边界与约束**：
- Agent 运行时与 Sandbox 运行时**安全隔离**，分属不同执行环境。
- Sandbox 网络外访权限由用户决定；元数据 AES256 加密，API 与内部通信 TLS 1.2+。
- 跨进程/网络边界：Agent<->模型代理、Agent<->Sandbox、Agent<->外部工具均为跨边界调用。
- 会话亲和保证同一会话尽量落同一实例，便于持续对话与状态管理。

### 主要依赖

- **运行底座**：阿里云函数计算 FC（Serverless、3AZ 高可用、安全容器隔离）——影响安装/运行/部署的核心依赖。
- **云存储/网络**：OSS（代码/层缓存、Sandbox 挂载）、NAS（Sandbox 挂载）、ACR（容器镜像缓存）、VPC/PrivateLink（内网访问）。
- **可观测/日志**：OpenTelemetry、Prometheus、ARMS、日志服务 SLS。
- **记忆/RAG 集成**：Mem0、RAGFlow（可选，可绑定已有部署）。
- **模型框架（可选托管）**：vLLM/SGLang/Ollama/LMDeploy（用于开源模型一键托管为 OpenAI 兼容 API）。

> 不输出完整依赖树，开发依赖与运行时硬依赖不作混为一谈。以上均为影响安装、运行、部署或关键能力的依赖。

### 接口形态

| 接口类型 | 用途 | 协议/形态 |
| --- | --- | --- |
| HTTP API | 调用 Agent/模型/工具 | 兼容 OpenAI Chat Completions，多语言任意后端可调 |
| SDK | 封装鉴权与调用细节 | Python、Node.js（已开源 GitHub）；Agent Runtime / Sandbox / 模型代理均可 SDK 调用 |
| UI 集成 | 一键生成可视化界面并嵌入网页 | 前后端一体应用，需 devs 流水线权限 |
| MCP 集成 | Agent/Sandbox/工具一键 MCP 化 | 单一端点 MCP 网关，含 Hook/语义分析/智能路由 |
| Sandbox 浏览器 | 浏览器自动化 | CDP over WebSocket，兼容 Puppeteer/Playwright |

> 不穷举端点/handler/命令注册项；仅说明边界上接口类型与用途。

### 持久化方式

- **元数据**：Agent/模型/工具/凭证等配置元数据 AES256 密文存储，解密后缓存不超 600s，实例释放时随之释放；除用户自身与服务账号外不可访问。
- **代码/镜像**：代码与层缓存至 OSS，容器镜像缓存至 ACR。
- **Sandbox 存储**：支持挂载 OSS/NAS，文件与会话管理由 Code Interpreter 维护。
- **日志**：统一存储至日志服务 SLS，支持检索与 SQL 分析。
- **记忆/RAG**：可选 Mem0/RAGFlow，支持「一键托管」或「绑定已有部署」（VPC/IDC），核心数据可私有化。

> 不扫描 schema 或枚举数据表；仅说明主要状态存放位置、归属与本地/外置/云端形态。

### 通信方式

- **外部→平台**：HTTP（OpenAI 兼容）、WebSocket（Sandbox 浏览器 CDP）；均 TLS 1.2+ 加密传输。
- **内部调用**：Agent->模型代理、Agent->工具、Agent->Sandbox 均为平台内跨进程/跨服务调用（同步为主）。
- **弹性调度**：会话亲和（同一会话尽量同实例）、浅休眠毫秒级唤醒、深休眠秒级唤醒、缩容到 0。
- **可观测**：OpenTelemetry Trace 贯穿全链路；Prometheus/ARMS 指标采集。

> 不审计每一种心跳/锁/重试/退避/幂等实现；仅说明总体通信模式。

### 部署形态

| 形态 | 说明 | 适用场景 |
| --- | --- | --- |
| 云上 Serverless 托管（默认） | 代码包/在线编码/自定义镜像上传，平台弹性调度，免运维服务器/容器/K8s | 快速上线、突发流量、稀疏调用 |
| 预付费资源包/常驻资源池 | CU 资源包、包年包月常驻实例（可锁定指定规格与卡型） | 稳定负载、成本可控 |
| VPC/IDC 私有化部署 | 核心数据不出企业私域，记忆/RAG 可绑定已有部署 | 安全合规、数据不出域 |
| PrivateLink 内网访问 | 通过 PrivateLink 配置内网访问端点 | 企业内网访问 AgentRun 资源 |

**首次使用前置**：需完成 SLR 服务关联角色授权（AliyunServiceRoleForFC、AliyunServiceRoleForAgentRun 等），子账号需 RAM 授权访问 FC/Sandbox/大模型/日志/OSS/VPC 等。

**计费**：按量付费、预付费（CU 资源包）、常驻资源池（包年包月）三种；统一为 CU 使用量计费项，含浅休眠计费能力。

> 桌面应用形态不适用本产品；AgentRun 为云上服务，未发现离线独立运行说明。私有化部署的是「数据与记忆」层，运行底座仍依赖 FC 云服务（未发现完全离线运行说明，标记为未决）。

## 未决项与证据边界

1. **完全离线运行能力**：官方明确支持 VPC/IDC 私有化部署与数据不出域，但未说明运行底座是否可完全脱离阿里云 FC 离线运行。当前证据未发现「完全离线」说明，**不得推导为「不支持」**，标记为未决。
2. **规划能力的落地时间**：Computer/Mobile Use、All-in-One、RL、Sim 沙箱，以及 AI 自动生成工具定义、工具推荐引擎等，官方列为「规划与扩展方向」，未给出发布时间，标记为未决。
3. **运行时实际性能表现**：毫秒级唤醒、百万并发等为官方宣传指标，未在本调研中做运行验证，属于「官方声称」，非「已验证」。
4. **生产环境普遍反馈**：产品发布于 2025-12，公开反馈样本稀疏，缺乏大规模生产环境反馈，不构成普遍结论。
5. **区域可用性**：证据未明确列出支持地域，需用户在控制台核实。

## 后续验证建议

- 若评估用于生产，建议运行验证：在控制台创建一个带 Code Interpreter 的示例 Agent，实测冷启动、会话亲和、唤醒延迟与计费。
- 若安全合规要求高，需核实支持地域、VPC/IDC 部署的具体边界、以及「数据不出域」是否满足企业合规要求。
- 若考虑深度集成，建议查看开源 SDK（`Serverless-Devs/agentrun-sdk-python`、`agentrun-sdk-nodejs`）的实际 API 与鉴权方式。
- 若依赖规划能力（如 Computer/Mobile Use），需向官方确认落地时间表后再纳入架构设计。

## 检查清单（交付前自检）

- [x] 报告直接回答了最初的核心问题（定位、运行形态、组件、链路、四类技术约束）。
- [x] 已删除文件、端点、表、配置和依赖的无关盘点。
- [x] 未包含源码审计内容。
- [x] 未包含竞品比较或选型矩阵。
- [x] 已明确维护状态、版本演进和反馈样本边界。
- [x] 已区分直接事实、架构推导、社区反馈和未决项。
- [x] 已整合为单一交付文档。

## 证据锢点

- 官方产品页：`https://www.aliyun.com/product/fc/agentrun`
- 官方帮助文档（核心）：`https://help.aliyun.com/zh/functioncompute/fc/what-is-agenrun`
- 开源 SDK：`https://github.com/Serverless-Devs/agentrun-sdk-python`、`https://github.com/Serverless-Devs/agentrun-sdk-nodejs`
- 发布与生态报道：阿里云开发者社区、知乎深度解析、新浪科技（2025-12 至 2026-03）