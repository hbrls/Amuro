# CloudShip AI 技术产品调研

> updated_by: Qoder - Claude
> updated_at: 2026-08-07
> evidence_window: 2026-08-07, Station v0.25.0 (GitHub Releases), main 分支, 官方文档 docs.cloudshipai.com

## 交付结论

### CloudShip AI 不具备 Stateful 调度能力，应归类为任务执行宿主与预定义工作流编排器

CloudShip AI 的核心运行时 Station 是一个自托管的 AI Agent 执行宿主。它能够执行 Agent、通过 cron 定时触发 Agent、通过 HTTP Webhook 接收外部事件触发执行，以及通过 YAML 工作流定义编排多步骤流程。但 Station 不持久拥有动态工作对象、对象间依赖关系、任务状态机或执行归属分配。工作流引擎虽然持久化工作流定义与运行记录，但其步骤序列是预定义的编排脚本，不具备调度器所需的动态任务创建、优先级排队、执行者选择和失败恢复能力。依据 Index 调度判定基准，Station 应归类为**任务执行宿主 + 预定义工作流编排器 + Stateless 任务消费者**（对于 cron/webhook 触发场景），而非 Stateful 调度系统。[已确认，基于官方文档与仓库证据]

### Workspace、Environment、Agent、Bundle、Workflow、Run 是真实持久化对象；Issue、Plan、Task 不作为独立调度对象存在

Station 的工作对象模型由数据库表支撑：`agents`、`runs`、`run_events`、`mcp_configs`、`schedules`、`workflows`、`workflow_runs` 均存储在 SQLite 数据库中，跨重启持久化。但 Index 关注的 Issue、Plan、Task 并非 Station 的独立对象——"Task" 仅是传递给 Agent 的输入字符串，不是拥有生命周期、状态机和归属关系的持久化调度对象。Plan 不存在为持久化编排对象，工作流定义（`.workflow.yaml`）是预定义脚本而非动态 Plan。Workspace 是文件系统配置目录而非调度容器。[已确认，基于官方架构文档数据库 schema 与文档]

### 工作流引擎具备持久化状态与暂停/恢复能力，但不具备动态调度核心特征

Station 工作流引擎支持并行执行、条件分支、人工审批门控、数据转换、循环迭代，工作流运行记录持久化于数据库，可暂停/恢复/取消，支持版本管理和 SSE 实时流。这是接近 Stateful 编排的特征。但关键缺失包括：无动态任务创建（工作流步骤在 YAML 中预定义）、无优先级排队、无执行者动态选择（Agent 名称在步骤中硬编码）、无失败后自动重试或任务转交、无任务阻塞/解锁机制。工作流失败后运行记录标记为 failed，不会自动恢复或重新排队。[已确认，基于官方工作流文档与 API]

### Windows 仅通过 WSL 支持，无原生二进制，构成平台选型缺陷

Station 的 GitHub Releases 仅提供 `darwin_arm64`、`darwin_amd64`、`linux_amd64`、`linux_arm64` 四种二进制。安装文档将 Windows 列为通过 WSL（Windows Subsystem for Linux）支持，系统要求表中 OS 列为"Linux, macOS, Windows (WSL)"。没有原生 Windows 二进制，Windows 用户必须先安装 WSL 才能使用 Station CLI。macOS 则有完整的 Apple Silicon 和 Intel 原生二进制支持。[已确认，基于 GitHub Releases 下载列表与官方安装文档]

### 主体功能运行在本地，Local 优先适配程度高

Station 的核心能力——Agent 执行、MCP 工具调用、工作流编排、定时调度、Webhook 接收——全部运行在本地 Station 进程中。用户凭据（API Key、AWS 凭证等）存储在本地 `variables.yml` 和环境变量中，不发送给第三方。AI 模型推理依赖外部 AI 提供商（OpenAI/Gemini/Anthropic/CloudShip AI），但可使用 Ollama 实现完全本地推理。CloudShip Platform（SaaS）是可选的集中管理层，不是主体功能运行的必要条件；Station 可在 `local_mode: true` 下完全独立运行。[已确认，基于官方文档与架构图]

### 云端组件（CloudShip Platform + Lighthouse）可完整自托管，但自托管 Lighthouse 增加运维复杂度

CloudShip Platform 的 Lighthouse 通信服务支持自托管（需 PostgreSQL + Redis + TLS 证书），Station 可通过 `endpoint` 配置指向自托管实例。云端职责包括：Station 注册管理、Bundle 分发、远程命令下发、遥测收集、OAuth 认证。数据边界清晰：Agent 提示词留在本地 Station，仅执行结果可选上报，遥测可选开启。但 Lighthouse 自托管引入 PostgreSQL 和 Redis 两个额外依赖，增加了私有化部署的运维成本。[已确认，基于官方 Lighthouse 文档与 Platform 概览]

### NATS 是工作流引擎和 Lattice 网格的内部消息基础设施，构成架构底层硬依赖

工作流引擎依赖 NATS 进行内部任务分发（工作流故障排查明确提到"Check NATS is running and workflow consumer started"）。Agentic Harness 使用 NATS JetStream KV bucket 存储 Agent 执行状态。Lattice 多 Station 网格使用嵌入式 NATS 服务器和 JetStream KV 实现跨节点 Agent 发现、远程调用和异步工作队列。NATS 不是可选依赖，而是工作流、Harness 和 Lattice 三个核心子系统的共同基础设施。[架构推导，基于工作流故障排查文档、Harness 配置文档和 Lattice 架构文档的交叉证据]

## 调研目标

- 判断 CloudShip AI 是否持久拥有工作对象、对象关系和任务生命周期，并依据依赖、状态与策略持续推进任务
- 核验 Workspace、Project、Issue、Plan、Task 的实际对象模型与缺失项
- 核验任务之间的顺序、依赖和生命周期推进方式
- 明确产品是否具备 Stateful 调度能力；若仅能承接已有 Task 并启动 Agent，归类为执行宿主或 Stateless 任务消费者
- 明确 Windows 与 macOS 支持情况、Local 优先适配程度、云端依赖与私有化改造边界
- 识别架构范式与扩展可行性，评估调度逻辑下沉或封装为普通 Agent 任务节点的可行性

## 产品调研

### 产品定位与目标用户

CloudShip AI 是一个 AI Agent 编排平台，专注于将 DevOps、FinOps 和安全运维工作转化为可自动执行的 AI Agent。产品由两个核心组件构成：

- **Station**（开源，Apache 2.0）：自托管的轻量级 Agent 运行时，提供 Agent 执行、MCP 工具集成、工作流编排、定时调度和 Webhook 事件触发。Go 语言编写，使用 SQLite 作为默认数据库。[已确认，基于 GitHub 仓库 README 与官方文档]
- **CloudShip Platform**（SaaS）：集中化管理层，提供 Station 注册管理、Bundle 分发、监控遥测和 OAuth 认证。支持自托管 Lighthouse 组件。[已确认，基于官方 Platform 文档]

目标用户分两层：工程团队（DevOps/SRE/FinOps 工程师）负责安装、配置和部署 Agent；管理层（CTO/VP Engineering）通过 Platform 查看结构化洞察和决策视图。[已确认，基于官方首页与产品介绍]

### 核心流程

一条端到端核心流程为：

1. 工程师在工作机上安装 Station CLI（`curl ... | bash`）
2. 初始化 AI 提供商配置（`stn init --provider openai --ship`）
3. 安装预构建 Bundle 或自定义 Agent（`.prompt` 文件 + `template.json` MCP 配置）
4. 通过 MCP 客户端（Claude Desktop/Cursor/OpenCode）、CLI 或 REST API 执行 Agent
5. Agent 通过 MCP 协议调用外部工具（Kubernetes、AWS、Datadog 等）完成运维任务
6. 执行结果可选上报至 CloudShip Platform，转化为结构化洞察和可视化 Widget
7. 管理层通过 Platform Dashboard 查看决策视图和数据溯源

[已确认，基于官方首页交互式流程演示与 GitHub README]

### 功能地图与边界

**当前可用能力**：

- Agent 创建、配置、执行与管理（CRUD + 执行）
- MCP 工具集成（41+ 内置工具，支持自定义 MCP Server）
- 多 Agent 团队（Coordinator 委派给 Specialist，Agent-as-Tool 模式）
- 工作流引擎（并行、条件分支、人工审批、循环迭代、数据转换）
- Cron 定时调度（6 字段表达式，秒级精度）
- Webhook 事件触发（HTTP POST 异步执行）
- Bundle 打包与分发
- GitOps 工作流（配置版本化）
- OpenTelemetry 可观测性（Jaeger 链路追踪）
- Lattice 多 Station 网格（NATS 实现，跨节点 Agent 发现与远程调用）
- Agentic Harness（doom loop 检测、上下文压缩、Git 集成、沙箱执行）
- 沙箱代码执行（Docker 容器隔离）
- 评估系统（LLM-as-judge 自动评分）
- Faker 系统（AI 生成模拟数据用于开发测试）

**规划/实验性能力**：

- E2B 沙箱模式标记为 experimental
- 官方 SDK（Python/TypeScript/Go）标注"coming soon"

**明确不在范围内**：

- 无动态任务调度器
- 无任务优先级排队
- 无 Agent 执行者动态分配
- 无失败任务自动重试或转交
- 无 Issue 跟踪系统
- 无动态 Plan 生成与持久化

[已确认，基于官方文档索引与各功能页面]

### 维护状态与版本演进

GitHub 仓库 `cloudshipai/station` 当前 428 Star、41 Fork，Apache 2.0 许可证。最新 Release 为 v0.25.0（2026 年 1 月发布），前序版本序列为 v0.24.2 至 v0.24.10，发布节奏活跃。v0.25.0 的关键变化是将 CloudShip AI 作为默认 AI 提供商，集成 CloudShip AI 认证流程，并添加顶层工具调用模型。仓库提交活跃，文档持续更新。[已确认，基于 GitHub Releases 页面与仓库元数据，证据时间 2026-08-07]

### 生态与反馈

官方提供 30+ 预构建 DevOps 工具 MCP 模板（Trivy、Terraform、Kubectl、Helm、Prometheus、Grafana、Vault、ArgoCD、Docker、Ansible 等），以及预构建 Agent Bundle（FinOps、Security、DevOps、SRE）。官方首页引用 IBM Developer Advocate JJ Asghar 和 Toolhouse CTO Orlando Kalossakas 的推荐语。官方 Discord 社区和 GitHub Issues 渠道开放。具体社区活跃度和用户反馈样本未深入调查。[已确认，基于官方首页与 Registry 页面；反馈样本边界为官方引用的推荐语，不代表普遍用户反馈]

## 技术架构调研

### 系统全貌与运行形态

CloudShip AI 运行形态为**本地运行时 + 可选云端管理平台**的混合架构：

```
┌─────────────────────────────────────────────────────┐
│                 客户基础设施（本地）                    │
│                                                      │
│  Station 进程（单个二进制 stn）                         │
│  ├─ REST API Server (:8585)                          │
│  ├─ MCP Server (:8586)                               │
│  ├─ Dynamic Agent MCP (:8587)                        │
│  ├─ SSH Admin (:2222)                                │
│  ├─ SQLite 数据库 (station.db)                       │
│  ├─ Scheduler Service (cron)                         │
│  ├─ Workflow Engine (NATS 内部)                      │
│  ├─ Agentic Harness (可选)                            │
│  └─ Lattice Node (可选，NATS 网格)                     │
│                                                      │
│  外部 AI 提供商 (OpenAI / Gemini / Anthropic / Ollama) │
│  MCP 工具进程 (npx @modelcontextprotocol/...)         │
└─────────────────────────────────────────────────────┘
          │ gRPC (TLS, 双向流)
          ▼
┌─────────────────────────────────────────────────────┐
│            CloudShip Platform（SaaS 或自托管）          │
│  ├─ Lighthouse (gRPC 通信服务)                        │
│  │   ├─ PostgreSQL                                   │
│  │   └─ Redis (可选)                                  │
│  ├─ Bundle Registry                                  │
│  ├─ Telemetry Collector                              │
│  └─ Web Dashboard (app.cloudshipai.com)              │
└─────────────────────────────────────────────────────┘
```

Station 是单体 Go 二进制，内嵌 Web UI、REST API、MCP Server 和调度服务。通过 `stn serve` 直接运行或通过 `stn up` 在 Docker 容器中运行。Station 可以完全独立运行（`local_mode: true`），也可以注册到 CloudShip Platform 获得集中管理。[已确认，基于官方架构文档与容器生命周期文档]

### 主要组件与核心链路

**主要组件**：

| 组件 | 运行位置 | 职责 |
|---|---|---|
| Station CLI (`stn`) | 本地 | 命令行入口，Agent/Bundle/环境管理 |
| REST API (:8585) | Station 进程内 | Agent/Run/Workflow CRUD 与执行 |
| MCP Server (:8586) | Station 进程内 | 工具发现、Agent 调用、资源访问 |
| Dynamic Agent MCP (:8587) | Station 进程内 | Agent 执行入口 + Webhook 接收 |
| SchedulerService | Station 进程内 | Cron 定时触发 Agent 执行 |
| Workflow Engine | Station 进程内 | 多步骤工作流编排（依赖 NATS） |
| AgentExecutionEngine | Station 进程内 | Agent 执行核心（GenKit + MCP 生命周期管理） |
| SQLite | 本地文件 | 持久化 Agent/Run/Workflow/Schedule |
| Lighthouse | Platform 侧 | gRPC 双向流通信，命令下发与状态上报 |
| Lattice (NATS) | 可选 | 多 Station 网格，跨节点 Agent 发现与调用 |

**核心链路：Agent 执行（`stn agent run analyzer "Check logs"`）**：

1. CLI 解析命令 → 加载 `config.yaml` → 打开数据库
2. AgentService 创建 `agent_runs` 记录（status: running）
3. AgentExecutionEngine 加载环境配置 → 初始化 GenKit（AI 提供商）
4. MCPConnectionManager 连接 MCP Server → 发现工具 → 缓存
5. GenKit 处理提示词 + 工具调用 → AI 模型返回工具调用请求 → 通过 MCP 执行工具 → 结果返回 AI → 生成最终响应
6. 更新 `agent_runs` 记录（status: completed, response, tool_calls, tokens_used, duration_ms）
7. 可选：发送运行数据到 Lighthouse（如已配置 CloudShip 集成）

**核心链路：工作流执行**：

1. 通过 API 或 CLI 创建工作流运行（`POST /api/v1/workflow-runs`）
2. Workflow Engine 从数据库加载工作流定义 → 创建 `workflow_runs` 记录
3. 按状态机执行：inject → agent → parallel → switch → human_approval → transform
4. 每个 agent 步骤调用 AgentExecutionEngine 执行指定 Agent
5. 步骤间通过模板变量（`${var}`）和 JSONPath（`$.path`）传递数据
6. 人工审批步骤阻塞等待，通过 API approve/reject 后继续
7. 完成后记录最终输出，支持 SSE 实时流推送

[已确认，基于官方架构深度文档与工作流文档]

### 主要依赖

**运行时硬依赖**：

| 依赖 | 类型 | 是否可关闭/替换 | 影响 |
|---|---|---|---|
| SQLite / libsql | 数据持久化 | 可替换为 Turso 云数据库 | 所有状态持久化依赖此数据库 |
| NATS | 工作流引擎 + Lattice + Harness | 工作流引擎启动时必需；Lattice 和 Harness 可选 | 工作流分发、跨 Station 通信、Harness 状态存储 |
| Docker | `stn up` 容器运行模式 | 可用 `stn serve` 直接运行替代 | 容器化部署和沙箱执行需要 |
| AI 提供商 API | AI 推理 | 可在多个提供商间切换；可用 Ollama 本地化 | Agent 执行的必要条件 |
| GenKit (Go) | AI 抽象层 | 内嵌于 Station 二进制 | 无额外运行时依赖 |

**Lighthouse 自托管额外依赖**：

| 依赖 | 是否必需 | 替代方案 |
|---|---|---|
| PostgreSQL | 必需 | 无（Lighthouse 状态存储） |
| Redis | 可选 | 仅用于缓存 |
| TLS 证书 | 必需 | 无（gRPC 通信加密） |

**依赖剥离评估**：SQLite→libsql 可平滑迁移；NATS 是工作流引擎的结构性依赖，不可关闭（工作流引擎启动时检查 NATS）；Docker 仅在容器模式需要，`stn serve` 可绕过；AI 提供商可切换至 Ollama 实现完全本地化。[已确认 + 架构推导，基于官方数据库文档、工作流故障排查和 Lighthouse 文档]

### 接口形态

Station 在系统边界上提供以下接口：

| 接口类型 | 端口/方式 | 用途 | 鉴权 |
|---|---|---|---|
| REST API | HTTP :8585 `/api/v1/` | Agent/Run/Workflow/Environment CRUD | 本地模式无鉴权；CloudShip 模式 Bearer Token |
| MCP Server (HTTP) | :8586 `/mcp` | 工具发现、Agent 调用、资源访问 | 本地无鉴权；CloudShip OAuth |
| MCP Server (stdio) | stdin/stdout | AI 编辑器集成（Claude/Cursor） | 进程级 |
| Dynamic Agent MCP | :8587 | Agent 执行 + Webhook 接收 | 本地无鉴权；生产 API Key |
| Webhook | POST :8587/execute | 外部事件触发 Agent | API Key 或 OAuth |
| SSH Admin | :2222 | 管理访问 | SSH 密钥 |
| gRPC (Lighthouse) | Platform:443 | Station ↔ Platform 通信 | TLS + Registration Key |
| NATS (Lattice) | :4222 | 多 Station 网格通信 | 网络级 |
| SSE | :8585 `/api/v1/workflow-runs/:id/stream` | 工作流运行实时更新 | 同 REST API |

不穷举端点清单。关键发现：Station 可通过 REST API 直接接入，跳过官方 MCP 客户端，适合编程式集成。Webhook 接口使外部系统（PagerDuty、GitHub Actions、Prometheus Alertmanager）可直接触发 Agent 执行。[已确认，基于官方 API 参考与 Webhook 文档]

### 持久化方式

| 数据类别 | 存储位置 | 拥有者 | 形态 |
|---|---|---|---|
| Agent 定义 | SQLite `agents` 表 + `.prompt` 文件 | Station | 数据库 + 文件双写（DeclarativeSync 双向同步） |
| Agent 执行记录 | SQLite `agent_runs` + `run_events` 表 | Station | 数据库，含状态、响应、工具调用、Token 用量 |
| MCP 配置 | SQLite `mcp_configs` 表 + `template.json` | Station | 数据库 + 文件双写 |
| 定时调度 | SQLite `schedules` 表 + `.prompt` frontmatter | Station | 数据库 + 文件双写 |
| 工作流定义 | SQLite `workflows` 表 + `.workflow.yaml` | Station | 数据库 + 文件双写，支持版本管理 |
| 工作流运行 | SQLite `workflow_runs` 表 | Station | 数据库，含状态、步骤、输出 |
| Harness 状态 | NATS JetStream KV (`harness-state`) | Station | NATS KV，TTL 24h |
| Lattice 注册 | NATS JetStream KV (`stations`, `agents`, `work`) | Orchestrator Station | NATS KV |
| Platform 注册 | Lighthouse PostgreSQL | Platform | 数据库 |

备份方案：Litestream 持续复制 SQLite 到 S3/GCS/Azure，新实例启动时自动恢复。libsql/Turso 提供多实例共享和多云复制。[已确认，基于官方数据库文档与 Harness 配置]

### 通信方式

| 通信场景 | 模式 | 协议 |
|---|---|---|
| MCP 客户端 ↔ Station | 请求-响应 / 流 | stdio 或 HTTP (StreamableHTTP) |
| Station ↔ AI 提供商 | 请求-响应 | HTTPS REST |
| Station ↔ MCP 工具进程 | 请求-响应 | stdio (JSON-RPC) |
| Station ↔ Lighthouse | 双向流 | gRPC (TLS) |
| Station ↔ Station (Lattice) | 发布-订阅 / 请求-响应 | NATS |
| 工作流内部步骤分发 | 消息队列 | NATS (JetStream) |
| 工作流运行更新推送 | 服务端推送 | SSE |
| 外部系统 → Station | 异步 Webhook | HTTP POST |

关键发现：Lighthouse 使用 gRPC 双向流，Station 主动连接 Lighthouse 并维持管理通道，周期上报状态并接收命令。Lattice 使用嵌入式 NATS 服务器（Orchestrator 模式）或连接远端 NATS（Member 模式）。工作流引擎内部使用 NATS 进行步骤分发——这从故障排查"Check NATS is running and workflow consumer started"得到交叉确认。[已确认 + 架构推导，基于 Lighthouse、Lattice 和工作流文档]

### 部署形态

#### 工作机安装（Windows / macOS）

**macOS**：

- 安装方式：`curl -fsSL https://raw.githubusercontent.com/cloudshipai/station/main/install.sh | bash`（自动检测 Apple Silicon / Intel）
- 或手动下载：`station_darwin_arm64.tar.gz` / `station_darwin_amd64.tar.gz`，解压后 `mv stn ~/.local/bin/`
- 或源码构建：`git clone` + `make build-with-ui`（需 Go 1.21+）
- 运行入口：`stn serve`（直接运行）或 `stn up`（Docker 容器运行）
- 依赖：无强制外部依赖（`stn serve` 模式）；`stn up` 需要 Docker
- 权限：本地用户权限，写入 `~/.config/station/` 和 `~/.local/bin/`
- 网络要求：出站 HTTPS（AI 提供商 API）；可选出站 gRPC:443（Lighthouse）
- 卸载：`rm ~/.local/bin/stn` + `rm -rf ~/.config/station/`

**Windows**：

- 安装方式：仅通过 WSL（Windows Subsystem for Linux）支持。安装文档系统要求表明确列"Windows (WSL)"
- 无原生 Windows 二进制：GitHub Releases 资产仅包含 `darwin_arm64`、`darwin_amd64`、`linux_amd64`、`linux_arm64`
- 运行入口：在 WSL 环境中使用 `stn serve` 或 `stn up`
- 依赖：WSL + Docker（如使用 `stn up`）
- 权限：WSL 内权限
- 网络要求：同 macOS
- 卸载：WSL 内 `rm ~/.local/bin/stn` + `rm -rf ~/.config/station/`

**Windows 平台选型缺陷**：Station 不提供原生 Windows 二进制，Windows 用户必须安装 WSL 才能使用。这增加了部署门槛，限制了 Windows 工作机上的原生集成能力（如与 Windows 原生进程、服务或凭据管理器的交互）。macOS 有完整的原生支持。[已确认，基于 GitHub Releases 下载资产列表与官方安装文档]

#### 主体功能运行位置

主体功能运行在**工作机本地**。Station 进程负责 Agent 执行、MCP 工具调用、工作流编排、定时调度和 Webhook 接收，全部在本地完成。用户凭据（AI API Key、AWS 凭证等）存储在本地，不发送给第三方。

唯一的外部依赖是 AI 模型推理——默认使用外部 AI 提供商（OpenAI/Gemini/Anthropic），但可通过 Ollama 实现完全本地推理。CloudShip Platform 是可选的，`local_mode: true` 时 Station 完全独立运行。

**Local 优先适配判断**：适配程度高。核心执行能力本地化，凭据不离开基础设施，桌面客户端不是壳。唯一选型注意点是 AI 推理的外部依赖，但 Ollama 提供了本地化路径。[已确认，基于官方文档与架构设计]

#### 云端形态（如存在）

CloudShip Platform 是 SaaS 云端组件，Lighthouse 可自托管。

**职责边界**：Station 注册管理、Bundle 分发与版本控制、远程命令下发（`EXECUTE_AGENT`、`LIST_AGENTS`、`INSTALL_BUNDLE`、`SYNC`）、遥测收集、OAuth 认证。

**核心组件**：Lighthouse（gRPC 服务）、Bundle Registry、Telemetry Collector、Web Dashboard。

**主要依赖**：PostgreSQL（必需）、Redis（可选，缓存）、TLS 证书（必需）。

**接口**：gRPC 双向流（Station 主动连接）、Web Dashboard（HTTPS）、OAuth 端点。

**持久化**：Station 注册信息、Bundle 元数据、组织权限存储在 Lighthouse 的 PostgreSQL 中。

**通信方式**：Station 通过 Registration Key 注册，建立 TLS 加密的 gRPC 双向流。Station 周期上报状态（健康、Agent、工具），Lighthouse 下发命令。Registration Key 一次性使用，每次连接重新认证。

**数据边界**：Agent 提示词留在 Station 本地，仅执行结果可选上报，遥测可选开启。数据不离开工作机除非显式配置。

**权限与网络边界**：TLS 加密所有通信，PKCE OAuth 流程，Token 缓存 5 分钟减少认证调用。Station 可随时通过 `local_mode: true` 断开云端连接。

**故障影响**：Lighthouse 不可用时，Station 本地功能不受影响；仅失去远程管理、Bundle 分发和集中监控能力。

**自托管 Lighthouse 的运维成本**：需维护 PostgreSQL + Redis + TLS 证书，Docker Compose 部署。对于 Local 优先场景，自托管 Lighthouse 是可行但增加运维复杂度的方案。[已确认，基于官方 Lighthouse 与 Platform 文档]

### 中心调度核心关注点

#### 调度判定基准

Station **不满足** Stateful 调度系统的判定基准。具体分析：

1. **持久拥有工作对象**：部分满足。Agent、Workflow、Schedule 持久化于数据库，但缺少 Issue、Plan、Task 作为独立持久化调度对象。
2. **持久拥有对象关系**：不满足。工作流步骤间有转换关系，但这是预定义的编排序列，不是运行时动态建立的对象依赖。
3. **持久拥有任务状态**：部分满足。`agent_runs` 和 `workflow_runs` 有状态字段（running/completed/error），但缺少 waiting/blocked/ready 等调度状态。
4. **持久拥有执行归属**：不满足。Agent 名称在工作流步骤或 cron 调度中硬编码，不存在运行时动态执行者选择和归属记录。
5. **判断任务何时可执行**：不满足。cron 按时间触发，webhook 按事件触发，工作流按定义顺序执行，无优先级排队或条件就绪判断。
6. **按何种顺序推进**：部分满足。工作流步骤顺序在 YAML 中预定义，但无运行时动态重排序。
7. **由谁执行**：不满足。执行 Agent 在定义中指定，无动态分配。
8. **失败后如何继续**：不满足。cron 调度的执行失败不自动重试；工作流失败后标记为 failed，不自动恢复或转交。

**归类结论**：Station 是**任务执行宿主 + 预定义工作流编排器 + Stateless 任务消费者**。它能够接收任务（cron/webhook/API）并启动 Agent 执行，但不拥有调度状态、依赖解析或执行归属分配。不得因其使用"Schedule""Workflow""Agent"等名称而判定为调度工具。[已确认，基于官方调度、工作流和架构文档的综合分析]

#### 工作对象模型

| 对象 | 是否存在 | 标识 | 归属 | 层级 | 创建来源 | 状态所有者 |
|---|---|---|---|---|---|---|
| Workspace | 存在（文件目录） | 文件系统路径 `~/.config/station/` | Station | 顶层容器 | `stn init` 创建 | 文件系统 |
| Environment | 存在（持久化） | 名称（unique） | Station | Workspace 下级 | `stn init` 或 API | Station 数据库 |
| Agent | 存在（持久化） | ID + 名称 | Station | Environment 下级 | `.prompt` 文件同步或 API | Station 数据库 |
| Bundle | 存在（tarball） | UUID | Platform Registry / 本地 | 跨环境打包 | `stn bundle create` | 文件系统 |
| Workflow | 存在（持久化） | workflowId + 版本 | Station | Environment 下级 | `.workflow.yaml` 或 API | Station 数据库 |
| Workflow Run | 存在（持久化） | run ID | Station | Workflow 下级 | API 或 CLI | Station 数据库 |
| Schedule | 存在（持久化） | Agent ID 关联 | Station | Agent 关联 | `.prompt` frontmatter 或 CLI | Station 数据库 |
| Issue | **不存在** | — | — | — | — | — |
| Plan | **不存在为持久化对象** | 工作流 YAML 定义可视为静态 Plan，但无运行时动态 Plan 对象 | — | — | — | — |
| Task | **不作为独立调度对象存在** | "task" 是传给 Agent 的输入字符串，不是拥有生命周期的持久化对象 | — | — | — | — |

关键发现：Index 关注的 Issue、Plan、Task 三个对象在 Station 中缺失。Plan 的最接近形态是工作流 YAML 定义，但它是预定义脚本而非运行时动态编排对象。Task 仅是 Agent 执行的输入参数。[已确认，基于官方数据库 schema 与各功能文档]

#### 任务关系与生命周期

**工作流步骤关系**（Station 提供的最接近形态）：

| 关系类型 | 是否支持 | 实现方式 |
|---|---|---|
| 父子关系 | 不支持（无 Task 父子对象） | — |
| 先后顺序 | 支持 | `transition` 字段定义下一步 |
| 前置依赖 | 部分（隐式顺序） | 步骤按 transition 链执行，但无显式依赖声明 |
| 阻塞关系 | 支持 | `human_approval` 步骤阻塞直到审批 |
| 并行分支 | 支持 | `parallel` 类型，多 branch 并发 |
| 循环迭代 | 支持 | `foreach` 类型，`maxConcurrency` 控制并发 |
| DAG | 不支持 | 无显式 DAG 定义 |

**工作流运行状态机**：

```
pending → running → completed
                 → failed
                 → cancelled
running → paused → resumed → running
```

状态迁移责任方：Station Workflow Engine 负责推进状态；API 调用方可通过 `pause`/`resume`/`cancel` 主动迁移。

**Agent 执行状态**：running → completed / error，无中间调度状态。

**失败恢复**：cron 调度的执行失败不自动重试（"each scheduled execution is independent"）；工作流步骤失败导致整个 run 标记为 failed，无步骤级重试或跳过机制。上游失败后，下游步骤不会自动解锁、阻塞、跳过或重试。[已确认，基于官方工作流与调度文档]

#### Agent 分派与连续性

| 能力 | 是否具备 | 证据 |
|---|---|---|
| 系统选择执行者 | 不具备 | Agent 名称在工作流步骤或 cron 配置中硬编码 |
| 系统分派任务 | 不具备（动态分派） | 工作流步骤指定 `agent: my-agent`，无运行时选择 |
| 唤起 Agent | 支持 | `EXECUTE_AGENT` 命令（Lighthouse）、`POST /agents/:id/run`（API）、`call_agent`（MCP） |
| 重新唤起 Agent | 不支持（自动） | 失败后标记为 error，无自动重新唤起 |
| Agent 与 Task 归属持久化 | 部分 | `agent_runs` 记录 agent_id 关联，但 Task 不是独立对象 |
| 一次性启动 | 支持 | CLI/API/MCP 触发单次执行 |
| 已有 Agent 领取任务 | 不支持 | 无任务队列领取机制（Lattice 有异步工作队列但用于跨节点调用，非本地调度） |
| 调度器主动选择执行者 | 不支持 | 无调度器组件 |
| Agent 退出后恢复 | 不支持 | Agent 执行是单次同步/异步过程，无会话恢复 |
| 失败转交其他 Agent | 不支持 | 失败后不转交 |
| 进度/检查点持久化 | 部分 | `run_events` 记录逐步执行日志，但不用于恢复执行 |
| 结果属于调度状态还是 Agent 会话 | Agent 会话 | 执行结果存储在 `agent_runs` 表，属于 Station 数据库而非调度状态 |

关键区分：Station 的多 Agent 团队模式是 Coordinator Agent 通过 Agent-as-Tool 机制委派给 Specialist Agent，这是 Agent 内部逻辑的委派，不是调度系统的分派。Coordinator 的委派行为由 AI 模型决定，不由持久化调度状态驱动。[已确认，基于官方多 Agent 文档与架构分析]

#### 数据库与持久化

（已在"持久化方式"章节详述，此处补充调度相关关注点）

调度相关数据存储：

| 数据 | 存储位置 | 拥有者 | 持久化方式 |
|---|---|---|---|
| 调度定义 | `schedules` 表 + `.prompt` frontmatter | Station | 数据库 + 文件双写 |
| 工作流定义 | `workflows` 表 + `.workflow.yaml` | Station | 数据库 + 文件双写，版本管理 |
| 工作流运行 | `workflow_runs` 表 | Station | 数据库 |
| Agent 执行记录 | `agent_runs` + `run_events` 表 | Station | 数据库 |
| Harness 状态 | NATS JetStream KV `harness-state` | Station | NATS KV，TTL 24h |
| Lattice 注册 | NATS JetStream KV `stations`/`agents`/`work` | Orchestrator Station | NATS KV |

数据库类型与剥离评估：

- SQLite：默认，零配置，单文件。可替换为 libsql（Turso 云数据库）实现多实例共享。
- NATS：工作流引擎的硬依赖（启动时检查），不可关闭。Lattice 模式需要嵌入式或远端 NATS。
- PostgreSQL：仅 Lighthouse 自托管需要，Station 本身不需要。
- Redis：Lighthouse 可选缓存，非必需。

依赖可关闭性：SQLite→libsql 可平滑迁移；NATS 不可关闭（工作流引擎依赖）；Docker 可用 `stn serve` 绕过；AI 提供商可用 Ollama 本地化。[已确认，基于官方数据库文档与架构分析]

#### 对外接口

（已在"接口形态"章节详述，此处补充调度侧关注点）

调度相关接口：

| 接口 | 用途 | 调度角色 |
|---|---|---|
| `POST /api/v1/agents/:id/run` | 触发 Agent 执行 | 任务接收入口 |
| `POST /api/v1/workflow-runs` | 启动工作流 | 工作流触发入口 |
| `POST :8587/execute` (Webhook) | 外部事件触发 Agent | 事件触发入口 |
| Scheduler Service (cron) | 定时触发 Agent | 时间触发入口 |
| `EXECUTE_AGENT` (Lighthouse 命令) | 远程触发 Agent | 远程管理入口 |

鉴权方式：本地模式无鉴权；CloudShip 模式 Bearer Token / OAuth；Webhook 生产模式 API Key。

客户端接入准入：Station 可通过 REST API 直接接入，跳过官方 MCP 客户端。Webhook 接口使任何能发送 HTTP POST 的系统都可触发执行。[已确认，基于官方 API 参考与 Webhook 文档]

#### 消息通信

（已在"通信方式"章节详述，此处补充调度相关关注点）

| 通信场景 | 调度相关 | 模式 |
|---|---|---|
| 工作流步骤分发 | 是 | NATS 消息队列（工作流引擎内部） |
| Lighthouse 命令下发 | 是 | gRPC 双向流（Lighthouse → Station） |
| Lattice 远程调用 | 是（跨节点） | NATS 请求-响应 + 异步工作队列（JetStream） |
| 工作流运行更新 | 是 | SSE 服务端推送 |
| Agent 执行 | 否（同步调用） | 进程内函数调用 |

关键发现：Station 的通信模式是请求-响应和消息队列的组合，但缺少调度系统典型的持久任务领取、租约和超时回收机制。Lattice 的"Async Work Queue with JetStream-backed tracking"是唯一接近任务队列的机制，但它用于跨节点远程调用，不是本地调度队列。[已确认 + 架构推导，基于官方通信文档]

#### 任务队列

| 特征 | 是否具备 | 证据 |
|---|---|---|
| 持久化队列 | 部分 | 工作流使用 NATS JetStream；`workflow_runs` 持久化在数据库 |
| 内存队列 | 不明确 | 官方文档未明确说明 |
| 任务防重复领取 | 不支持 | 无证据表明有原子抢占机制 |
| 原子抢占 | 不支持 | 无证据 |
| 并发协调 | 部分 | 工作流 `parallel` 和 `foreach` 有 `maxConcurrency` 控制，但这是步骤级并发控制，不是队列级 |
| 任务领取 | 不支持 | 无 Agent 主动领取任务的机制 |
| 租约 | 不支持 | 无租约机制 |
| 超时回收 | 部分 | 工作流步骤有 `timeout` 配置，但超时后不回收重试 |
| 重试 | 不支持 | cron 执行不重试；工作流步骤失败不重试 |
| 失败转移 | 不支持 | 失败后不转交其他 Agent 或 Station |
| 中心状态驱动 | 不满足 | 调度状态由 Station 本地数据库持有，非中心调度器 |

Lattice 的 JetStream 工作队列是唯一接近持久化队列的机制，但它的定位是跨 Station 远程调用的工作分配，不是本地任务调度队列。文档未提及防重复领取、原子抢占或租约机制。[架构推导，基于官方文档；未发现明确的任务队列机制]

### 客户端与调度层接入

**官方标准接入载体**：

1. MCP 客户端（Claude Desktop、Cursor、OpenCode）通过 stdio 或 HTTP 连接 Station MCP Server
2. CLI（`stn` 命令）直接操作
3. REST API（HTTP）编程式接入
4. Webhook（HTTP POST）外部事件触发

**三种接入语义区分**：

| 语义 | 支持情况 | 接入方式 |
|---|---|---|
| 客户端创建/管理任务 | 支持 | REST API CRUD Agent/Workflow/Schedule |
| 客户端领取任务 | 不支持 | 无任务领取机制 |
| 服务端唤起客户端执行 | 支持（Lighthouse） | `EXECUTE_AGENT` 命令通过 gRPC 下发 |

**能否跳过官方客户端直接接入调度中心**：可以。Station 可通过 REST API 直接操作，无需 MCP 客户端。Webhook 接口使外部系统可直接触发执行。但 Station 本身不是"调度中心"，而是执行宿主。

**Windows 与 macOS 接入差异**：macOS 原生二进制，完整支持所有接入方式。Windows 仅通过 WSL，MCP 客户端配置中 Station 的 `command` 为 `stn`，在 WSL 环境中可用，但与 Windows 原生 MCP 客户端的集成可能存在路径和环境变量传递的额外配置成本。[已确认 + 架构推导，基于官方文档]

### 依赖根源与改造边界

**架构底层刚需依赖**（影响核心判断）：

| 依赖 | 类别 | 剥离影响 |
|---|---|---|
| SQLite | 状态持久化 | 可替换为 libsql/Turso，迁移成本低（SQL 兼容） |
| NATS | 工作流分发 + Lattice + Harness | 不可关闭（工作流引擎依赖）；替换需要重写工作流引擎内部消息分发 |
| GenKit | AI 抽象层 | 可替换，但需重写 Agent 执行引擎的 AI 调用层 |
| Go runtime | 运行时 | 内嵌于二进制，无外部运行时依赖 |

**上层附加能力依赖**（非调度核心）：

| 依赖 | 类别 | 剥离影响 |
|---|---|---|
| Docker | 容器运行 + 沙箱 | 可用 `stn serve` 绕过；沙箱能力丧失 |
| Jaeger | 可观测性 | 可关闭，丧失链路追踪 |
| Litestream | 备份 | 可关闭，丧失连续备份 |
| Lighthouse (PostgreSQL + Redis) | 云端管理 | 可关闭（`local_mode: true`），丧失集中管理 |
| AI 提供商 API | AI 推理 | 可切换至 Ollama 本地化 |

**调度最小核心职责**：Station 不存在调度最小核心，因为它不是调度系统。其核心职责是 Agent 执行——接收输入、调用 AI 模型、执行 MCP 工具调用、返回输出。

**改造范围评估**：若要将 Station 改造为 Stateful 调度系统，需要新增：任务对象模型（Issue/Task 持久化）、任务关系图（DAG/依赖）、任务状态机（waiting→ready→running→completed/failed）、执行者动态分配、任务队列（领取/租约/超时回收/重试）、失败恢复机制。这相当于在现有 Agent 执行引擎之上构建独立的调度层，改动范围大，涉及数据库 schema、新服务模块和消息队列机制的全面新增。[架构推导，基于现有架构与调度系统需求的差距分析]

### 架构范式与扩展可行性

**产品归类**：Station 是**任务执行宿主 + 预定义工作流编排器**。它不是 Stateful 调度器、不是自动化运行器（无自动触发条件配置引擎）、在 cron/webhook 触发场景下是 Stateless 任务消费者。

**架构范式**：单体 Go 二进制，内嵌多服务（REST API + MCP Server + Scheduler + Workflow Engine），通过 SQLite 持久化本地状态，通过 NATS 实现内部消息分发，通过 gRPC 连接云端管理平台，可选 NATS 网格实现分布式执行。

**调度逻辑下沉可行性**：Station 不存在调度逻辑需要下沉。现有工作流引擎可以封装为"Agent 任务节点"（工作流步骤本身就是 Agent 调用），但下沉后不会获得持久任务状态、依赖解析或执行归属——因为 Station 本身不具备这些能力。

**Lattice 扩展约束**：Lattice 提供跨 Station 的 Agent 发现和远程调用，使用 NATS 实现节点间通信。但 Lattice 不解决调度问题——它扩展了执行范围，不增加调度能力。Lattice 的"Async Work Queue"是跨节点任务分发，不是本地调度队列。

**任务隔离与多调度节点协调**：Station 是单实例设计（SQLite 单写入者）。多实例需要切换至 libsql 共享数据库或使用 Lattice 网格。多调度节点互斥机制不存在，因为不存在调度节点。[架构推导，基于现有架构分析]

## 未决项与证据边界

- **NATS 内嵌方式**：文档确认工作流引擎依赖 NATS，但 `stn serve`（非 Docker 模式）是否自动启动嵌入式 NATS 服务器，还是需要用户预装 NATS，文档未明确说明。[未决]
- **工作流步骤级重试**：文档未提及步骤级重试配置。`timeout` 存在但超时后的行为（标记失败 vs 重试）未明确。[未决]
- **Lattice 异步工作队列的持久化保证**：Lattice 文档提到 JetStream-backed tracking，但具体的消息持久化保证、消息确认机制和故障恢复行为未详细说明。[未决]
- **Windows 原生支持路线图**：当前无原生 Windows 二进制，文档未提及是否有计划提供。[未决]
- **Agent 失败后的 Lighthouse 侧处理**：Lighthouse 可下发 `EXECUTE_AGENT` 命令，但 Agent 执行失败后 Lighthouse 是否有重试或转交逻辑，文档未说明。[未决]
- **Workflow Engine 与 NATS 的具体交互机制**：文档确认 NATS 是工作流引擎的依赖，但工作流步骤如何通过 NATS 分发、消费者如何注册、消息格式如何定义等实现细节未公开。[架构推导，基于故障排查文档的间接证据]

## 后续验证建议

1. **运行验证**：在 macOS 工作机上执行 `stn serve` 和 `stn up`，验证 NATS 是否自动启动，工作流引擎是否在无外部 NATS 时正常工作。
2. **Windows 验证**：在 Windows + WSL 环境中安装 Station，验证 MCP 客户端集成是否可用，路径和环境变量传递是否有额外配置成本。
3. **工作流失败恢复验证**：创建包含多步骤的工作流，在中间步骤制造失败，观察后续步骤的行为和 run 记录的状态变化。
4. **Lattice 工作队列验证**：搭建 Orchestrator + Member 多 Station 环境，测试异步工作队列的任务分配、持久化和故障恢复行为。
5. **源码核验**：如需确认 NATS 在工作流引擎中的具体角色，可定点阅读 `internal/services/` 下工作流引擎和调度器相关源码，验证 NATS 消息交互机制。
6. **Lighthouse 自托管验证**：部署自托管 Lighthouse（PostgreSQL + Redis + Docker），验证 Station 注册、命令下发和 Bundle 分发的完整流程。
