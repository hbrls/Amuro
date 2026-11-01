# Apboa Next 技术产品调研

> updated_by: Codex - GPT-5
> updated_at: 2026-07-20 23:41:03
> evidence_window: 2026-07-20；GitHub 仓库 `huxuehao/apboa-next` 的 `master` 分支快照，最新 API 快照提交 `a872998428a52f520bf934bce620fc678c0e4112`

## 交付结论

1. **判定：不符合本次 RUNBOOK 的核心焦点要求。** Apboa Next 是浏览器访问的企业级 AI 智能体开发与运行平台，主体功能运行在 Java/Spring Boot 后端服务、Nginx 前端和数据库/缓存/向量库组成的服务端拓扑中，不是 Windows/macOS 工作机上的原生桌面产品。
2. **产品定位**：平台以 ReAct 智能体为核心，提供多模型接入、MCP 工具、A2A 协作、知识库与 RAG、长期记忆、可视化 Workflow、脚本沙箱和多租户权限管理，目标用户是需要构建、配置和运行企业级智能体的开发或业务团队。
3. **官方部署形态**：快速开始要求 Docker Engine 20+ 与 Docker Compose v2，通过 Bash 脚本启动单机体验版；生产形态拆成控制台节点、执行节点和中间件节点。官方没有提供 Windows/macOS 原生安装包、桌面应用入口或卸载流程。
4. **主体运行位置**：前端通过 Nginx 提供浏览器页面，管理控制台、AI Runtime、Shell Proxy、文件同步和 WebSocket 服务在容器或 Java 进程中运行；MySQL、Redis、pgvector 保存和支撑运行状态。云端不是 Apboa 自带的产品网关，模型供应商、向量服务等是可选外部依赖。
5. **维护状态**：项目创建于 2026-07-06，仓库快照显示 2026-07-17 仍有推送，近期提交密集集中在 UI、Workflow、依赖和运行时修正；但尚无 GitHub Release 或 Tag，只有 18 Star、3 Fork、0 个开放 Issue，公开反馈和采用规模仍不足以判断。
6. **架构结论的证据强度**：产品与部署边界由 README、Docker 部署指南、Compose 文件、Dockerfile 和开发配置相互印证；本次未安装、未启动、未压测，也未进行逐文件源码审计。

## 调研目标、范围与边界

### 调研目标

理解 `huxuehao/apboa-next` 是什么、服务谁、如何使用，并重点判断其在 Windows/macOS 工作机上的安装方式、运行形态和主体功能位置。

### 核心问题

- Apboa Next 的产品定位、目标用户和主要使用流程是什么？
- 当前公开版本和维护活动处于什么状态？生态入口和反馈样本有哪些？
- 系统由哪些主要组件组成，核心请求和智能体执行链路如何流转？
- Windows/macOS 工作机是否有官方安装入口、依赖、权限和卸载方式？
- 主体功能运行在工作 PC 本地，还是运行在服务端/云端？

### 覆盖范围

- 产品定位、目标用户、核心流程和功能边界。
- 维护状态、近期版本演进、公开生态和反馈快照。
- 运行形态、主要依赖、接口形态、持久化、通信和部署拓扑。
- Windows/macOS 工作机安装入口、运行入口、依赖和权限边界。

### 明确排除

- 不做竞品比较、选型矩阵或优劣排名。
- 不做逐文件、逐路由、逐表或逐依赖的源码审计。
- 不做性能、并发、可靠性、安全合规或生产容量 benchmark。
- 不调研遥测、监控、指标采集和运营数据采集。
- 不实施安装、集成、改造或部署。

## 证据口径

- **官方产品资料**：仓库 README 和 `docker/README.md` 用于产品定位、功能、快速开始和部署模型；宣传性能力按“官方声称”表述，不把节点数量或功能清单等同于实测结果。
- **仓库与配置证据**：GitHub 仓库元数据、`pom.xml`、`ui/package.json`、开发配置、Compose 文件和 Dockerfile 用于确认语言、运行入口、依赖、服务边界和端口。
- **版本与反馈快照**：GitHub API 元数据、提交、Release、Tag、Issue、Pull Request 和贡献者列表只描述 2026-07-20 的公开快照，不等同产品质量或采用率。
- **架构推导**：根据官方部署拓扑和配置推导组件关系；未运行系统的结论标记为架构层判断，不包装为运行时验证。
- **未决项**：Windows/macOS Docker Desktop 实际兼容性、真实安装时长、资源消耗、生产故障恢复和模型供应商可用性均未在本次验证。

主要证据入口：

- [GitHub 仓库](https://github.com/huxuehao/apboa-next)
- [README 指向的 Gitee 仓库](https://gitee.com/studious_tiger/apboa-next)
- [README](https://github.com/huxuehao/apboa-next/blob/master/README.md)
- [Docker 部署指南](https://github.com/huxuehao/apboa-next/blob/master/docker/README.md)
- [单机 Compose](https://github.com/huxuehao/apboa-next/blob/master/docker/docker-compose-simple.yml)
- [控制台节点 Compose](https://github.com/huxuehao/apboa-next/blob/master/docker/docker-compose-console.yml)
- [执行节点 Compose](https://github.com/huxuehao/apboa-next/blob/master/docker/docker-compose-execute.yml)
- [中间件 Compose](https://github.com/huxuehao/apboa-next/blob/master/docker/docker-compose-middleware.yml)
- [根 `pom.xml`](https://github.com/huxuehao/apboa-next/blob/master/pom.xml)
- [Console 开发配置样例](https://github.com/huxuehao/apboa-next/blob/master/runner-console/src/main/resources/application-dev.sample.yml)
- [Runtime 开发配置样例](https://github.com/huxuehao/apboa-next/blob/master/runner-runtime/src/main/resources/application-dev.sample.yml)

## 产品调研

### 产品定位与目标用户

Apboa Next 的 README 将其定位为“企业级 AI 智能体平台”，以 ReAct 范式为核心，覆盖智能体定义、模型供应商、工具和 MCP、知识库、记忆、工作流、A2A 协作、脚本执行和多租户治理。它不是单一模型 SDK，也不是只提供聊天 UI 的客户端，而是把智能体配置、运行、数据管理和组织权限放在同一套 Web 平台中。

目标用户可从公开功能和部署方式归纳为：

- 需要配置多个模型和工具、构建企业内部智能体的开发团队。
- 需要多租户、租户审批、平台级和租户级 RBAC 的组织管理员。
- 需要将智能体、知识库、MCP 服务或外部 API 组合成可视化 Workflow 的业务/技术团队。
- 需要把 AI Runtime 从控制台节点拆出并横向扩展的部署运维团队。

上述用户画像是基于产品功能和部署拓扑的归纳，不是仓库外部用户访谈结论。

### 核心流程

1. 管理员或用户通过浏览器打开 Nginx 提供的前端页面，登录后进入控制台。
2. 用户在控制台配置模型供应商、提示词、Agent、工具、MCP、知识库、记忆和租户权限。
3. 用户发起对话或 Workflow 运行；前端请求由 Nginx 路由到 Console 或 Runtime。
4. Runtime 使用 AgentScope 驱动 ReAct 循环，按 Agent 配置调用模型、内置工具、MCP 服务、知识库/RAG、记忆和其他 Agent。
5. 需要执行 Shell 或文件操作时，Runtime 可将任务交给独立的 Proxy 或文件服务；结果通过 AG-UI 流式接口和 WebSocket 返回前端。
6. 会话、配置、消息、租户和业务数据落入后端存储；Redis 同时承担缓存、分布式锁和发布订阅等基础能力。

### 功能地图与边界

**当前公开资料明确展示的功能域：**

- **Agent 运行**：ReAct 循环、PlanNotebook、AutoContext、多 Session 并行、用户确认和状态保存。
- **模型与工具**：OpenAI、DashScope、Anthropic、Gemini、Ollama 适配；MCP 支持 HTTP、SSE、STDIO；内置工具、Groovy 动态工具和 Agent-as-Tool。
- **知识与记忆**：百炼、Dify、RagFlow、本地 RAG；pgvector、Milvus、Elasticsearch、Qdrant、Weaviate；Mem0、ReMe、百炼长期记忆后端。
- **协作与编排**：WellKnown/Nacos A2A、可视化 Workflow、30+ 节点、子工作流、外部 HTTP/API/MQ/MCP 集成。
- **治理与安全**：多租户、租户发现/申请/审批、平台和租户 RBAC、敏感词、Hook、Shell 沙箱和脚本安全扫描。
- **运行平台**：管理控制台、AI Runtime、WebSocket 推送、Shell Proxy、文件同步、Nginx 前端和 Docker Compose 部署。

**边界：**

- README 中的“30+ 节点”“48 张业务表”“支持无限横向扩展”等是项目方当前公开表述，本次未逐项审计或实测。
- 平台自身不提供模型推理能力；模型供应商 API、外部 MCP 服务、向量服务和长期记忆后端可能引入额外网络或账号依赖。
- 平台没有公开的原生桌面应用、独立 CLI 产品或离线单机安装包；本地开发入口与正式部署入口都是服务进程/容器加浏览器。

### 维护状态与版本演进

- **仓库状态**：公开仓库创建于 2026-07-06，默认分支为 `master`，GitHub API 快照显示最近一次推送时间为 2026-07-17；仓库未归档。
- **版本标记**：当前根 `pom.xml` 仍为 `1.0-SNAPSHOT`；GitHub Releases 为空，Tags 为空，没有可供终端用户下载的正式版本资产。
- **近期演进**：2026-07-13 至 2026-07-16 的提交集中在 Workflow、布局、认证页、组件 UI、SKILL 依赖、调度器和类型修正，说明项目处于早期快速整合期。
- **公开快照**：18 Star、3 Fork、0 个开放 Issue、1 个订阅者；GitHub 贡献者接口仅显示 `huxuehao` 一名贡献者。指标只描述公开快照，不等同采用率或质量。

综合判断：项目**活跃但非常早期**。代码推送频率较高，功能面较宽，但缺少 Release/Tag、公开 Issue 讨论和多贡献者协作记录，稳定性、兼容性和生产成熟度仍未闭合。

### 生态与反馈

- **代码与部署入口**：GitHub 镜像仓库；README 的快速开始和 Docker 文档实际指向 Gitee 仓库地址 `studious_tiger/apboa-next`。
- **协议**：仓库元数据显示 MIT License，根目录存在 `LICENSE` 文件。
- **协议生态**：MCP、A2A、AG-UI、AgentScope、Vue Flow、Spring Boot、MyBatis-Plus、Quartz 等构成主要集成生态入口。
- **公开反馈**：截至证据窗口，GitHub 没有开放 Issue；已有 4 个已关闭 Pull Request，主要由仓库所有者创建或合并。没有足够公开讨论样本归纳真实使用痛点。
- **社区边界**：在本次检查的仓库和 README 公开入口中，未发现独立论坛、产品文档站或公开用户案例入口；README 页面预览属于项目方展示，不代表普遍使用反馈。

### 当前可用、实验性与规划能力

- 当前仓库和 Compose 中已有明确实现入口的能力包括多模型、MCP、Agent、Workflow、RAG、WebSocket、Docker 部署和多租户页面。
- README 中“理论上可扩展支持任意类型文档”“无限横向扩展”等属于扩展方向或宣传性表达，不能当作已验证的生产能力。
- 本次没有发现明确的弃用清单或正式版本路线图。

## 技术架构调研

### 系统全貌与运行形态

Apboa Next 是“Web 前端 + 多个 Spring Boot 服务 + 基础设施”的组合：

```text
浏览器
  |
  v
Nginx 前端 (:80)
  |-- /api/* ------> runner-console (:3060)
  |-- /api/runtime -> runner-runtime (:3061)
  |-- /api/ws -----> runner-websocket (:3064)
  |
  +--> MySQL (:3306) / Redis (:6379) / pgvector (:5432)

runner-runtime --> runner-proxy (:3062) 执行受限 Shell
runner-runtime --> runner-file              文件同步（分布式部署）
runner-runtime --> 模型供应商 / MCP / 向量后端等外部服务
```

官方单机 Compose 将上述组件放在一台 Docker 主机上，生产 Compose 则拆为三类节点：

- **控制台节点**：runner-console、runner-websocket、frontend/Nginx。
- **执行节点**：runner-runtime、runner-proxy、runner-file，可增加多个执行节点。
- **中间件节点**：MySQL、Redis、pgvector。

因此，系统的主体运行时是服务端拓扑。即使把单机 Compose 放在 Windows/macOS 的 Docker Desktop 中，产品形态仍是运行服务集群并通过浏览器访问，不等于原生工作机应用。

### 主要组件与核心链路

**主要组件职责：**

- **runner-console**：账号、租户、Agent、模型、工具、提示词、MCP、知识库等管理 API，默认端口 3060。
- **runner-runtime**：AgentScope/ReAct 运行时、AG-UI 端点、模型和工具调用、会话执行，默认端口 3061。
- **runner-proxy**：受限 Shell 命令执行代理，使用独立容器和更严格的 Linux 容器限制。
- **runner-file**：分布式部署下的技能文件同步服务。
- **runner-websocket**：实时推送服务，默认端口 3064，并与 Redis Pub/Sub 协作。
- **frontend/Nginx**：构建并托管 Vue 3 前端，负责静态文件和 API/WebSocket 反向代理。
- **MySQL、Redis、pgvector**：分别承载关系业务数据、缓存/锁/发布订阅和默认向量存储。

**核心链路：**

1. 浏览器从 Nginx 加载主应用，管理请求进入 Console，实时消息和运行请求分别由 Nginx 路由到 WebSocket/Runtime。
2. Runtime 读取数据库中的 Agent、模型、工具和租户配置，建立 AgentScope 会话并执行 ReAct 循环。
3. 模型输出如果需要工具、MCP、知识检索、记忆或其他 Agent，Runtime 在同一条会话链中调用相应适配器。
4. Shell 任务经 Proxy 进入隔离容器；Runtime 负责接收结果并继续循环或返回失败。
5. 运行状态和消息通过 AG-UI/流式接口与 WebSocket 返回前端；业务数据、会话和向量数据落到对应存储。

### 主要依赖

**本地开发硬依赖：**

- JDK 21+
- Maven 3.8+
- MySQL 8.0+
- Redis 7+
- Node.js 20.19+ 或 22.12+
- pnpm 9+

**运行与可选能力依赖：**

- Spring Boot 3.4.9、AgentScope 1.0.12、MyBatis-Plus 3.5.7、Java 21。
- Vue 3.5、Vite 7、Ant Design Vue 4、Vue Flow、TypeScript。
- Docker Engine 20+、Docker Compose v2；构建阶段使用 Maven、Node 22、pnpm 9 和 Nginx 镜像。
- 默认向量后端为 pgvector/PG16，也可配置 Milvus、Qdrant、Elasticsearch 或 Weaviate。
- 模型供应商、MCP 服务、A2A Agent 和长期记忆后端属于外部服务边界，具体是否必需取决于启用的能力。

### 接口形态

- **浏览器/HTTP**：Nginx 对外提供 Web UI 和 API 反向代理；Console 与 Runtime 暴露管理和运行接口。
- **AG-UI**：Runtime 使用 `/runtime/agui` 路径提供流式智能体交互。
- **WebSocket**：前端通过 `/api/ws/` 连接独立 WebSocket 服务接收实时消息。
- **MCP**：平台作为 MCP 客户端支持 HTTP、SSE、STDIO 三种协议形态。
- **A2A**：支持 WellKnown/Nacos 发现与 Agent-to-Agent 调用。
- **进程/容器边界**：Runtime 与 Shell Proxy 通过服务地址通信；分布式节点通过主机 IP、心跳上报和 Redis/数据库协作。

本报告不枚举全部端点、命令注册项或路由实现。

### 持久化方式

- **MySQL 8**：主业务数据库，保存账号、租户、Agent、模型、工具、配置、消息和其他关系数据。
- **Redis 7**：缓存、分布式锁、定时任务去重、消息发布订阅和 WebSocket 协作。
- **pgvector/其他向量后端**：知识库和 RAG 向量数据；默认 Compose 采用 pgvector/PG16。
- **宿主机卷**：Docker Compose 将 MySQL、Redis、pgvector 数据目录以及各服务日志和 `.apboa` 工作目录映射到宿主机路径。
- **前端资产**：构建后的 Vue 静态资源由 Nginx 镜像托管，不是运行时数据库。

持久化结论来自配置和 Compose；本次未验证迁移脚本在不同版本数据库上的兼容性，也未盘点全部表结构。

### 通信方式

- **浏览器到平台**：HTTP API、流式 AG-UI 和 WebSocket。
- **前端到服务**：Nginx 按路径将请求路由到 Console、Runtime 和 WebSocket。
- **服务到存储**：Console/Runtime/文件服务通过 JDBC/Redis 客户端访问 MySQL、Redis 和向量后端。
- **服务间运行链路**：Runtime 调用 Proxy 执行 Shell；Runtime 和文件服务向 Console 心跳上报；WebSocket 使用 Redis Pub/Sub 接收跨进程消息。
- **跨网络外部边界**：模型供应商、MCP/A2A 服务、可选向量库和长期记忆服务可能通过 HTTP 或各自 SDK 访问。

### 部署形态

#### 工作机安装（Windows / macOS）

- **官方单机入口**：README 要求 Docker Engine 20+、Docker Compose v2，克隆仓库后进入 `docker` 目录执行 `bash start-simple.sh`，或者直接执行 `docker compose -f docker-compose-simple.yml up -d --build`。
- **官方生产入口**：分别执行 `start-middleware.sh`、`start-console.sh`、`start-execute.sh`，将中间件、控制台和执行节点部署到一台或多台服务器。
- **Windows**：当前官方 README、Docker 文档和仓库文件未提供 `.exe`、Windows 服务、PowerShell 安装脚本或 Windows 专门步骤。Docker Desktop/WSL2 理论上可能承载 Linux 容器，但本次没有官方兼容声明或实机验证，不能写成官方 Windows 支持。
- **macOS**：当前官方资料未提供 `.dmg`、原生桌面应用或 macOS 专门步骤。macOS 上的 Docker Desktop 理论兼容性不等于 Apboa Next 的官方桌面支持，本次未实机验证。
- **本地开发入口**：在任意具备 JDK、Maven、MySQL、Redis、Node.js 和 pnpm 的环境中，分别启动 Console、Runtime、WebSocket Java 服务，再启动 Vite 前端；开发前端默认端口 3030，生产 Nginx 默认端口 80。
- **依赖与权限**：需要 Docker 守护进程和 Compose 权限；源码开发需要读写代码、日志和本地数据库。官方没有给出 Windows/macOS 的管理员权限要求、安装器权限模型或卸载流程。
- **卸载方式**：没有原生卸载器。Docker 形态可按 Compose 文档执行 `down` 删除容器和网络；宿主机数据卷、日志和镜像的清理需要用户另行处理。开发形态需手动停止 Java/Vite 进程并清理本地依赖。

#### 主体功能运行位置

主体功能运行在 Console、Runtime、Proxy、WebSocket、File、Nginx 和数据库/缓存/向量库这些服务中。浏览器只是交互入口，工作机不承载独立的原生 Agent 运行时或桌面业务逻辑。

依据 RUNBOOK，Apboa Next **不符合“主体功能运行在 Windows/macOS 工作 PC 本地产品运行时”这一焦点要求**。把 Docker Compose 部署在工作机上只能视为在工作机运行服务器负载，不改变产品的服务端形态。

#### 云端网关（如存在）

本次没有发现 Apboa Next 自带的云端 SaaS 网关或必须登录的官方云控制面。外部模型、MCP、A2A、向量库和长期记忆服务属于用户配置的依赖；它们不是 Apboa Next 的统一云端后端。按 RUNBOOK，对这些外部服务不展开服务端实现、扩缩容或 SLA 调研。

## 未决项与证据边界

- **Windows/macOS 实机行为未验证**：未在 Docker Desktop、WSL2 或原生 Java/Node 环境启动，无法确认脚本中的 `hostname -I`、`ip route`、卷权限和容器网络在各平台的实际表现。
- **官方兼容声明缺失**：没有 Windows/macOS、Linux 发行版或 CPU 架构支持矩阵；“Docker 可运行”不能替代平台兼容性声明。
- **资源与生产能力未验证**：README 中的内存/CPU 默认限制和“可横向扩展”只是部署配置或项目方表述，不构成容量结论。
- **模型与外部服务未验证**：没有配置真实模型 API、MCP、A2A、向量库或长期记忆服务，无法判断各适配器的当前可用性。
- **反馈样本不足**：GitHub 无开放 Issue，已关闭 PR 主要由仓库所有者维护；没有公开生产案例或可复核用户反馈主题。
- **版本边界**：仓库没有 Release/Tag，报告只代表 2026-07-20 读取到的 `master` 快照，后续提交可能改变部署和功能边界。
- **未做运行验证**：本次没有安装依赖、执行构建、启动服务、运行端到端对话或执行安全测试。

## 后续验证建议

1. 由人工在 Windows 11 和 macOS 上分别使用 Docker Desktop/Compose 执行单机体验版，记录镜像构建、卷权限、容器网络、浏览器访问和停止清理行为；这属于人工验收，不应由本次报告代替。
2. 在隔离环境中配置一种模型供应商、一个 MCP 服务和默认 pgvector，跑通“登录 → 创建 Agent → 工具调用 → 流式返回 → 会话恢复”的最小链路。
3. 锁定后续目标 commit 或正式 Tag 后，再复核 Java/Node 版本要求、Compose 配置、镜像来源和数据库初始化脚本。
4. 若目标仍是 Windows/macOS 工作机上的本地产品，应把 Apboa Next 作为服务器型平台单独评估，不将 Docker Desktop 部署包装成原生桌面应用能力。
