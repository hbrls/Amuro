# Huly Platform 技术产品调研

> updated_by: Qoder - Claude
> updated_at: 2026-08-08 00:00:00
> evidence_window: 2026-08-07, main 分支, v0.7.426, huly-selfhost main

## 调研目标

- 围绕 Stateful 编排调度、客户端接入、Windows 与 macOS 工作机部署、依赖根源与架构范式，形成可追溯的独立产品调研。
- 判断产品是否持久拥有工作对象、对象关系和任务生命周期，并依据依赖、状态与策略持续推进任务。
- 核验 Windows 与 macOS 工作机支持情况、Local 优先适配程度、云端依赖与最小部署成本。
- 识别调度最小核心职责与非调度增值能力的边界，评估改造范围与风险。

## 交付结论

### Huly 是项目管理与团队协作平台，持久拥有工作对象但不具备 Agent 调度能力，属于项目管理工单系统而非 Stateful 调度器

Huly Platform（hcengineering/platform）是 Hardcore Engineering Inc. 开发的开源 All-in-One 项目管理平台，定位为 Linear、Jira、Slack、Notion、Motion 的替代品。产品以 Docker Compose 或 Kubernetes 多容器微服务形态部署，包含 14 个服务协同工作，提供 Tracker（Issue 追踪）、Documents（文档协作）、Chat（即时通讯）、Virtual Office（音视频）、Cards（自定义数据对象）、HRM（人力资源管理）、CRM 等模块。仓库开源协议为 EPL-2.0，GitHub 27.3k stars、2.1k forks。

Huly 持久拥有工作对象——Workspace、Project、Issue、Card、Document 均为 CockroachDB 中的持久化记录，拥有标识、归属、层级和状态。但产品不具备 Stateful 调度能力：不存在 Agent 分派机制、不存在任务依赖 DAG、不存在调度决策器、不存在 Agent 生命周期管理。Issue 的状态迁移（Todo → In Progress → Done）是工单状态管理，不是调度状态机——状态迁移由人工手动操作，不由调度器自动推进。Process 服务提供工作流触发器（OnExecutionDone）和必填字段验证（WhenRequiredFieldsFilled），但这是 Jira 式工作流自动化，不是 Agent 调度——它不选择执行者、不判断任务何时可执行、不负责失败后恢复。

重要事实：Hosted Huly（云端托管服务）正在关闭。GitHub README 顶部明确声明"Hosted Huly is shutting down — please migrate your data"，服务关闭预期在 July 20。这意味着产品不再提供托管云端服务，自托管成为唯一使用路径。

以上为已确认事实，依据 [GitHub README](https://github.com/hcengineering/platform)、[huly.io](https://huly.io/) 和 [Architecture Overview](https://github.com/hcengineering/huly-selfhost/blob/main/ARCHITECTURE_OVERVIEW.md)。

### 工作对象模型以 Workspace、Project、Issue 为核心，持久化在 CockroachDB 中

Huly 的工作对象模型如下：

- **Workspace**：顶层持久化容器。用户注册后创建 Workspace，拥有名称、成员列表、模块配置（Tracker、Documents、Cards 等）、邀请设置和角色权限体系。持久化在 CockroachDB 中。
- **Project（Tracker）**：Issue 追踪项目容器。拥有类型（Classic 或自定义）、标题、标识符（如"FE-42"）、描述、图标、默认指派人、默认状态、所有者和隐私设置。持久化在 CockroachDB 中。Project 组织 Issue 但不调度 Issue。
- **Issue（Tracker）**：持久化工单记录。拥有标题、描述、状态（Todo/In Progress/Done 等）、指派人、优先级、标签、里程碑。Issue ID 格式为"项目标识符-序号"（如 FE-42）。Issue 是工单追踪对象，不是调度单元——它不具备任务依赖、DAG、前置阻塞或自动状态推进。
- **Card**：自定义数据对象实例。基于 Type（类型定义）创建，拥有 Type 定义的属性和 Tag。支持派生类型继承（如 Character 继承 Game Component）。Card 是灵活的数据记录，不是调度对象。
- **Document**：持久化富文本文档。支持实时协作编辑（Y.js CRDT）、版本历史、内联评论、Mermaid 图表。Document 是知识管理对象，不是调度对象。
- **Plan**：不存在持久化编排对象。Planner 模块提供日历视图和时间块（Time-blocking），展示来自 Tracker 的 Issue 和个人事件，但不编排任务依赖或调度决策。
- **Task（调度意义）**：不存在。Issue 是最接近的工单对象，但 Issue 之间不存在父子依赖、前置阻塞或 DAG。

对象层级：Workspace → Project → Issue。Project 可设为私有，限制访问成员。Workspace 拥有 Owner、Maintainer、User、Guest、Readonly 五级角色权限。这些是工单权限管理，不是调度归属。

以上为已确认事实，依据 [Huly Docs](https://docs.huly.io)（经 context7.com 检索）和 [v0.7.426 Release Notes](https://github.com/hcengineering/platform/releases/tag/v0.7.426) 中的 Cards & Attributes 和 Processes 章节。

### 任务关系与生命周期以 Issue 状态管理为核心，不存在 DAG 依赖或调度状态机

Huly 的 Issue 生命周期管理：

- **Issue 状态机**：Issue 拥有状态字段（如 Todo、In Progress、Done），状态由 Project 配置定义。每个 Project 可配置自定义状态和默认状态。状态迁移由人工在 UI 中手动操作——用户点击状态按钮将 Issue 从 Todo 推进到 In Progress 或 Done。不存在调度器自动推进状态的机制。
- **任务依赖**：不存在。Issue 之间没有 `needs`、前置依赖、阻塞关系或 DAG。一个 Issue 的完成不会自动解锁或触发另一个 Issue。这是线性工单追踪，不是依赖编排。
- **上游下游**：不存在上游完成后解锁下游的机制。GitHub 双向同步可将 GitHub Issue 同步到 Huly Issue，但同步是镜像，不是调度链。
- **Process 工作流**：v0.7.426 引入了 Process 相关功能——OnExecutionDone 触发器、Todo required fields、WhenRequiredFieldsFilled。这暗示存在某种工作流自动化能力（类似 Jira Workflow），但文档和证据不足以确认其是否支持状态机迁移、条件分支或自动状态推进。Process 服务在自托管部署的完整构建中可用（被排除在 minified 变体之外），但 Architecture Overview 将其列为"Cloud/Enterprise 服务，不在自托管中"——两处证据矛盾，需源码验证。
- **优先级与计划时间**：Issue 拥有优先级字段。Planner 模块将 Issue 显示在日历视图中，支持 Time-blocking。但优先级和计划时间不参与自动调度决策——它们是展示和人工规划工具。
- **并发限制**：不存在。没有证据表明系统协调多个 Issue 的并发执行或资源约束。

以上为已确认事实，依据 [Huly Docs](https://docs.huly.io) 和 [v0.7.426 Release Notes](https://github.com/hcengineering/platform/releases/tag/v0.7.426)。Process 工作流的自动化程度为未决项。

### Agent 分派不存在，Huly 是人工驱动的工单分配系统而非 Agent 调度器

Huly 不选择、不分派、不唤起 Agent。所有工作分派由人工完成：

- **Issue 指派**：Project 可配置默认指派人。Issue 可手动指派给 Workspace 成员。这是人工工单分配，不是 Agent 调度。系统不选择执行者、不判断任务应由谁执行。
- **Agent 启动**：不存在。Huly 不包含 AI Agent 运行时。AI Bot 服务（aibot 容器）是可选的聊天机器人，使用 OpenAI API 提供对话、翻译和语音翻译，不执行 Issue 或调度任务。
- **Agent 连续性**：不存在。没有 Agent 进程管理、Agent 失败恢复或 Agent 任务转交机制。
- **执行进度与检查点**：Issue 的状态（Todo/In Progress/Done）由人工更新。不存在自动执行进度跟踪或检查点恢复。
- **AI Bot 服务**：aibot 容器是可选服务，提供 AI 聊天、消息翻译和语音翻译。它使用 OpenAI API（默认 gpt-4o-mini），需要 MongoDB 存储对话数据。AI Bot 不是调度 Agent——它不接收 Issue、不执行任务、不汇报结果。它是一个嵌入在 Chat 中的 AI 助手。

以上为已确认事实，依据 [huly-selfhost README](https://github.com/hcengineering/huly-selfhost) 中的 AI Service 章节和 [Huly Docs](https://docs.huly.io)。

### 持久化基于 CockroachDB 分布式 SQL，辅以 MinIO 对象存储和 Elasticsearch 全文检索

Huly 的持久化模型为多组件微服务架构：

- **CockroachDB**：主数据库，分布式 SQL，提供 ACID 事务和水平可扩展性。存储所有应用数据——用户、Workspace、Project、Issue、Card、Document、元数据。Docker 镜像为 `cockroachdb/cockroach`，端口 26257。自托管使用 Docker volume `dev_db` 或 `VOLUME_CR_DATA_PATH` 持久化。CockroachDB 连接串为 `postgresql://user:pass@cockroach:26257/huly`（PostgreSQL 协议兼容）。
- **MinIO**：S3 兼容对象存储。存储所有二进制文件——附件、图片、文档 blob。Docker 镜像为 `minio/minio`，端口 9000/9001。Nginx 直接代理文件下载到 MinIO。
- **Elasticsearch**：全文搜索引擎。由 fulltext 服务消费 Redpanda 事件、提取文档内容、维护搜索索引。Docker 镜像为 `elasticsearch:7.14.2`，端口 9200。
- **Redpanda**：Kafka 兼容事件流平台。提供可靠消息投递，用于异步处理（如文档变更后的搜索索引更新）。端口 9092/19092。Topic 包括 fulltext、process、tx、users、workspace。
- **HulyKVS**：键值存储服务。提供快速 KV 存储用于应用配置、用户偏好和缓存数据。端口 8094，依赖 CockroachDB。
- **MongoDB**（可选）：AI Bot 服务使用 MongoDB 存储对话数据。仅在启用 AI Bot 时需要。

调度状态存储：以上数据库中均不存在调度状态表——没有任务依赖表、执行归属表、调度决策表或租约表。Issue 表存储工单状态（Todo/In Progress/Done），但这是工单状态管理，不是调度状态。Process 服务的状态存储机制未公开，需源码验证。

数据库依赖剥离：CockroachDB 是硬性依赖，不可替换为其他数据库（虽兼容 PostgreSQL 协议）。Elasticsearch 和 Redpanda 在 minified 变体中可排除（牺牲搜索和异步处理能力）。MinIO 是硬性依赖（文件存储）。

以上为已确认事实，依据 [Architecture Overview](https://github.com/hcengineering/huly-selfhost/blob/main/ARCHITECTURE_OVERVIEW.md) 和 [huly-selfhost README](https://github.com/hcengineering/huly-selfhost)。

### 对外接口以 WebSocket 和 REST API 为主，Transactor 为核心事务处理网关

Huly 的对外接口形态：

- **WebSocket（Transactor）**：核心实时通信通道。Transactor 服务（端口 3333）维护与客户端的 WebSocket 连接，处理所有数据变更、强制业务逻辑、发布事件到消息队列。外部访问路径为 `ws(s)://${HOST_ADDRESS}/_transactor`。这是客户端与后端交互的主通道。
- **WebSocket（Collaborator）**：实时文档协作通道。Collaborator 服务（端口 3078）使用 Y.js CRDT 实现多人同时编辑，自动冲突解决和 presence 感知。外部访问路径为 `ws(s)://${HOST_ADDRESS}/_collaborator`。
- **HTTP REST API**：通过 Nginx 反向代理暴露各服务。路由映射：`/` → front:8080、`/_accounts` → account:3000、`/_transactor` → transactor:3333、`/_collaborator` → collaborator:3078、`/_rekoni` → rekoni:4004、`/_stats` → stats:4900、`/files` → minio:9000。
- **Platform API**：提供基础 REST 端点用于自定义集成和扩展。文档位于 [huly-examples 仓库](https://github.com/hcengineering/huly-examples/tree/main/platform-api)。API Client 提供所有 Huly 操作的 typed interface。
- **认证**：JWT 令牌认证。Account 服务处理用户注册、登录、JWT 令牌生成/验证和 Workspace 成员关系。所有服务共享 `SERVER_SECRET` 用于内部认证。支持 OpenID Connect 和 GitHub OAuth 外部认证。
- **调度接口**：不存在。没有任务提交、任务领取、调度状态查询或 Agent 分派接口。

以上为已确认事实，依据 [Architecture Overview](https://github.com/hcengineering/huly-selfhost/blob/main/ARCHITECTURE_OVERVIEW.md) 中的 Network Topology 和 Authentication Flow 章节。

### 消息通信以 WebSocket 长连接和 Redpanda 事件流为双轨

- **客户端与 Huly**：HTTP/HTTPS（REST API 和静态资源）+ WebSocket（Transactor 实时数据变更和 Collaborator 文档协作）。客户端通过 Nginx 反向代理访问所有服务。
- **服务间同步通信**：HTTP（如 Transactor → Fulltext、Transactor → Account）。
- **服务间异步通信**：Redpanda（Kafka 兼容）。事件生产者为 Transactor（文档事件、用户操作）、Workspace（Workspace 事件）、Account（账户事件）。事件消费者为 Fulltext（搜索索引）。Topic 包括 fulltext、process、tx、users、workspace。
- **文件存储通信**：服务通过 S3 API 访问 MinIO。Nginx 直接代理客户端文件下载到 MinIO。
- **认证流程**：客户端登录 → Nginx → Front → Account（验证凭据、生成 JWT）→ 返回 Token + Workspace 列表。客户端连接 Workspace → Nginx → Account（验证 Token）→ Workspace（查询 Workspace 信息）→ Transactor（WebSocket 连接，验证 Token，加载用户权限）。
- **断线恢复**：Transactor 维护 WebSocket 连接。客户端断线后需重新建立 WebSocket 连接并重新认证。CockroachDB 中的数据状态在进程重启后可恢复——这是 ACID 事务保证。但不存在调度状态的恢复问题，因为不存在调度状态。
- **HulyPulse**：可选的 WebSocket 推送通知服务。自 v0.7.375 起支持内存后端（无需 Redis），适用于单节点或小型自托管部署。Redis 可作为可选后端用于多节点或高可用部署。

以上为已确认事实，依据 [Architecture Overview](https://github.com/hcengineering/huly-selfhost/blob/main/ARCHITECTURE_OVERVIEW.md) 中的 Service Communication Patterns 和 Event-Driven Architecture 章节。

### 任务队列不存在于核心代码，Redpanda 是事件流而非调度队列

Huly 核心代码不包含持久化任务队列或调度队列。调度意义上的任务队列——防重复领取、原子抢占、租约超时回收、重试和失败转移——均不存在。

- **Redpanda（Kafka）**：事件流平台，用于异步处理。生产者（Transactor、Workspace、Account）发布事件到 Topic，消费者（Fulltext）订阅 Topic 处理事件。这是发布-订阅模式的事件驱动架构，不是任务队列——消息被广播给消费者，不存在任务抢占、租约或失败转移。Redpanda Topic 包括 fulltext、process、tx、users、workspace——这些是数据变更事件流，不是调度任务队列。
- **Process 服务**：在完整自托管构建中可用（minified 变体排除）。Process Topic 存在于 Redpanda 中。但 Process 服务的具体职责——是否为工作流引擎、是否持久化流程状态、是否支持任务编排——均因源码不可及而无法确认。v0.7.426 Release Notes 中的 Process 相关功能（OnExecutionDone 触发器、Todo required fields、WhenRequiredFieldsFilled）暗示存在工作流自动化能力，但不足以证明其为 Stateful 调度。
- **Workspace 后台任务**：Workspace 服务运行后台作业用于 Workspace 维护。这是系统维护任务，不是用户自定义调度。
- **Telegram Bot**：Telegram Bot 服务作为外部通知通道发送通知到 Telegram，不提供交互式控制或命令执行。它消费 Redpanda 事件并发送到 Telegram chat。

以上为已确认事实，依据 [Architecture Overview](https://github.com/hcengineering/huly-selfhost/blob/main/ARCHITECTURE_OVERVIEW.md) 和 [huly-selfhost README](https://github.com/hcengineering/huly-selfhost) 中的 Telegram Bot 章节。Process 服务的调度能力为未决项。

### Windows 与 macOS 均通过 Desktop App 支持，但 Desktop App 是服务端瘦客户端而非本地运行时

Huly 支持 Windows、macOS 和 Linux 三个平台，但运行形态为客户端-服务器架构：

- **Desktop App**：原生桌面应用，可从 huly.io/download 下载，支持 macOS、Windows 和 Linux。Desktop App 是连接到 Huly 服务器的瘦客户端——所有数据存储和业务逻辑在服务端运行，Desktop App 提供 UI 渲染和本地文件系统访问。可通过 `--server` 参数连接到自托管服务器。
- **macOS 安装方式与入口**：下载 Huly Desktop App。通过 `open -a "Huly" --args --server https://your-huly-server.com` 或 `/Applications/Huly.app/Contents/MacOS/Huly --server https://your-huly-server.com` 连接到自托管服务器。Desktop App 支持 Backup 和 Restore 操作。
- **Windows 安装方式与入口**：下载 Huly Desktop App。通过 `"C:\Program Files\Huly\Huly.exe" --server https://your-huly-server.com` 连接到自托管服务器。或修改快捷方式目标字段添加 `--server` 参数。
- **Web Browser**：也可通过浏览器直接访问 `http://huly.local:8087`（开发模式）或 `https://${HOST_ADDRESS}`（生产模式），无需 Desktop App。
- **服务器部署**：Huly 服务器（14 个容器）必须运行在 Docker 环境中。支持 amd64 和 arm64 容器，Linux 和 macOS Docker。Windows 需通过 WSL2 运行 Docker。服务器最低要求：2 vCPUs + 8GB RAM，推荐 4 vCPUs + 16GB RAM。
- **WSL 构建**：支持在 Windows NTFS 驱动上通过 WSL 构建和运行。完整部署消耗 35GB+ WSL 虚拟磁盘空间，应用文件夹占用 4.5GB。需配置 WSL 集成和 Git 行尾设置。

关键判断：Desktop App 不是本地运行时——它不包含数据库、业务逻辑或服务端组件。所有主体功能运行在 Docker 容器中的 14 个服务里。Desktop App 只是 UI 壳。Windows 和 macOS 上不存在本地中心调度服务——服务端必须在 Docker 中运行。这是 Local 优先维度的选型缺陷：用户不能在工作机上"轻量本地运行" Huly，必须部署完整的 Docker 容器栈。

以上为已确认事实，依据 [GitHub README](https://github.com/hcengineering/platform)、[huly.io/download](https://huly.io/download) 和 [Huly Docs](https://docs.huly.io)（经 context7.com 检索）中的 self-host 章节。

### Local 优先适配判断：自托管完整但部署形态为重型容器化服务端应用，Desktop App 仅为瘦客户端

Huly 的全部主体功能运行在 Docker 容器中的 14 个服务里。自托管方式不依赖 Huly 运营的云端服务——Hosted Huly 正在关闭，自托管成为唯一路径。数据存储在本地 Docker volume（CockroachDB、Elasticsearch、MinIO、Redpanda）中。LLM 调用（AI Bot）通过 OpenAI API 出站到外部端点（可选服务）。

但 Huly 的部署形态是重型容器化服务端应用——它不是轻量级桌面工具或 CLI。14 个容器、最低 2 vCPU + 8GB RAM、35GB+ 磁盘空间。Desktop App 是瘦客户端，不包含任何服务端能力。用户必须运行完整的 Docker 容器栈才能使用 Huly。对于需要极简本地部署的场景，这是显著的部署门槛。

选型结论：Huly 在 Local 优先维度上不存在云端强依赖（Hosted Huly 关闭后自托管是唯一路径，但自托管本身不依赖云端）。但部署形态为重型容器化服务端应用，比轻量级本地工具重得多。适合团队/组织级部署而非个人开发者快速使用。Desktop App 在 Windows 和 macOS 上均可用，但仅为连接到服务器的 UI 壳，不具备本地运行时能力。

以上为已确认事实，依据 [GitHub README](https://github.com/hcengineering/platform) 和 [huly-selfhost README](https://github.com/hcengineering/huly-selfhost) 中的 System Requirements。

### Hosted Huly 云端服务正在关闭，自托管为唯一路径且不依赖任何 Huly 运营的云端组件

Hosted Huly（云端托管服务）正在关闭：

- **关闭声明**：GitHub README 顶部明确声明"Hosted Huly is shutting down — please migrate your data"。服务关闭预期在 July 20。用户被要求导出和备份数据并迁移到自托管设置。
- **影响范围**：仅影响 Hosted Huly 托管服务。自托管部署不受影响。
- **云端组件依赖**：自托管方式不调用任何 huly.io 域名的 API 或服务。所有 14 个服务运行在本地 Docker 容器中。唯一的外部网络依赖是 AI Bot 服务的 OpenAI API 调用（可选）和外部集成（GitHub 同步、Google Calendar、Telegram Bot 等可选服务）。
- **数据边界**：自托管方式下，所有数据存储在本地 Docker volume 中。代码、会话、文档、附件不离开工作机。可选的 AI Bot 服务将聊天消息发送到 OpenAI API（出站 HTTPS）。
- **断网影响**：自托管方式断网后，核心功能（Tracker、Documents、Chat、Cards）仍可用（因为是本地容器）。AI Bot、GitHub 同步、Google Calendar、Telegram Bot 等可选服务需要网络连接。

Hosted Huly 关闭后，自托管成为唯一使用路径。自托管不依赖任何 Huly 运营的云端组件。

以上为已确认事实，依据 [GitHub README](https://github.com/hcengineering/platform) 顶部声明和 [huly-selfhost README](https://github.com/hcengineering/huly-selfhost)。

## 技术架构调研

### 系统全貌与运行形态

Huly 以 Docker Compose 多容器微服务为部署单元：

1. **Nginx**：反向代理和 SSL 终止。路由外部请求到内部服务，处理 HTTPS 证书，提供所有客户端连接的单一入口。端口 80/443。
2. **Front**：Web 应用服务器，服务 Huly UI。处理静态资源、客户端路由、与后端服务协调数据和认证。端口 8080。
3. **Account**：认证和用户管理服务。处理注册、登录、JWT 令牌生成/验证、Workspace 成员关系。端口 3000。
4. **Transactor**：核心事务处理引擎。维护与客户端的 WebSocket 连接，处理所有数据变更，强制业务逻辑，发布事件到消息队列。端口 3333。
5. **Workspace**：Workspace 生命周期管理。处理创建、初始化、升级和配置。运行后台维护作业。
6. **Collaborator**：实时文档协作服务，使用 Y.js CRDT。支持多人同时编辑、自动冲突解决和 presence 感知。端口 3078。
7. **Fulltext**：搜索索引服务。消费 Redpanda 事件，提取文档内容，维护 Elasticsearch 搜索索引。端口 4700。
8. **Rekoni**：内容智能服务。从二进制文档（PDF、DOC、DOCX、RTF）提取文本和结构化数据。端口 4004。
9. **Stats**：指标收集服务。聚合所有服务的使用统计和健康指标。端口 4900。
10. **CockroachDB**：主数据库。分布式 SQL，ACID 事务，水平可扩展。端口 26257。
11. **Elasticsearch**：搜索引擎。端口 9200。
12. **MinIO**：S3 兼容对象存储。端口 9000/9001。
13. **Redpanda**：Kafka 兼容事件流平台。端口 9092/19092。
14. **HulyKVS**：键值存储服务。端口 8094。

可选服务（按需启用）：AI Bot（OpenAI 聊天）、Love（LiveKit 音视频）、HulyPulse（WebSocket 推送）、Calendar（Google 日历）、GitHub（双向同步）、Telegram Bot、Print（PDF）、Export（数据导出）、Mail（SMTP/SES 邮件）。

系统边界：自托管方式下，14 个核心服务运行在本地 Docker 环境中。外部网络依赖仅为可选服务（AI Bot → OpenAI API、GitHub 同步 → GitHub API、Calendar → Google API 等）。

### 主要组件与核心链路

Huly 的组件结构按微服务划分：

- **Front（前端层）**：Web 应用服务器，服务 Svelte 前端构建产物。处理静态资源、客户端路由、协调后端服务。
- **Account（认证层）**：用户注册、登录、JWT 令牌、Workspace 成员关系、OpenID Connect、GitHub OAuth。
- **Transactor（核心事务层）**：所有数据变更的唯一入口。WebSocket 连接客户端，处理事务，强制业务逻辑，发布事件到 Redpanda。Transactor 是 Huly 的核心——所有 Tracker Issue 操作、Card 操作、Document 操作均通过 Transactor 提交事务。
- **Workspace（管理层）**：Workspace 生命周期、初始化、升级、后台维护。
- **Collaborator（协作层）**：Y.js CRDT 实时文档编辑，多人 presence 感知。
- **Fulltext（搜索层）**：消费 Redpanda 事件，索引到 Elasticsearch。
- **Rekoni（内容智能层）**：二进制文档文本提取。

核心链路：一次用户创建 Tracker Issue 的完整流程。

1. 用户在浏览器/Desktop App 中打开 Tracker 模块，点击"+ New Issue"。
2. Front 发送 HTTP 请求到 Account 验证 JWT 令牌。
3. 客户端通过 WebSocket 连接到 Transactor（`/_transactor`）。
4. Transactor 验证令牌（通过 Account 服务），加载用户权限。
5. 用户填写 Issue 标题、描述、状态、指派人，提交到 Transactor。
6. Transactor 在 CockroachDB 中创建 Issue 记录（ACID 事务），强制业务逻辑。
7. Transactor 发布文档事件到 Redpanda。
8. Fulltext 消费事件，将 Issue 内容索引到 Elasticsearch。
9. Transactor 通过 WebSocket 推送 Issue 创建事件到所有连接的客户端。
10. 可选：如果配置了 GitHub 双向同步，GitHub 服务将 Issue 同步到 GitHub Issue。

### 主要依赖

- **Docker + Docker Compose**：硬性运行时依赖。14 个核心服务均以 Docker 容器形式运行。无 Docker 则无法部署。支持 Kubernetes 部署（kube 目录提供示例配置）。
- **Node.js v20.11.0**：源码构建依赖。使用 Microsoft Rush 管理多包仓库。仅源码构建和开发模式需要，运行时使用 Docker 镜像。
- **CockroachDB**：主数据库依赖。分布式 SQL，ACID 事务。硬性依赖，不可替换。PostgreSQL 协议兼容（连接串使用 `postgresql://`）。
- **MinIO**：对象存储依赖。S3 兼容。硬性依赖（文件存储）。
- **Elasticsearch 7.14.2**：搜索引警依赖。在 minified 变体中可排除（牺牲搜索）。
- **Redpanda**：事件流依赖。Kafka 兼容。在 minified 变体中可排除（牺牲异步处理）。
- **Nginx**：反向代理依赖。SSL 终止和路由。
- **Microsoft Rush**：构建工具依赖。管理多包 monorepo。仅源码构建需要。
- **LiveKit（可选）**：Love 服务的音视频基础设施。仅在启用 Virtual Office 时需要。
- **OpenAI API（可选）**：AI Bot 服务的 LLM 依赖。仅在启用 AI Bot 时需要。

影响安装和运行的关键依赖为 Docker + Docker Compose（运行时）和 CockroachDB（数据）。服务器最低 2 vCPU + 8GB RAM。

### 接口形态

- **Web UI（HTTP）**：主要用户界面。通过 Nginx 反向代理访问 Front 服务。Desktop App 和浏览器均通过此接口。
- **WebSocket（Transactor）**：`/_transactor`，核心实时数据通道。所有数据变更通过 WebSocket 提交到 Transactor。
- **WebSocket（Collaborator）**：`/_collaborator`，实时文档协作通道。
- **REST API**：通过 Nginx 暴露各服务端点。`/_accounts` → Account、`/_rekoni` → Rekoni、`/_stats` → Stats、`/files` → MinIO。
- **Platform API**：基础 REST 端点用于自定义集成。文档在 huly-examples 仓库。API Client 提供 typed interface。
- **Desktop App CLI**：`--server` 参数连接到自托管服务器。
- **GitHub App Webhook**：`/_github/api/webhook`，接收 GitHub 事件实现双向同步。
- **调度接口**：不存在。没有任务提交、领取、状态查询或 Agent 分派接口。

### 持久化方式

- **CockroachDB（主数据库）**：分布式 SQL，ACID 事务。存储所有应用数据——用户、Workspace、Project、Issue、Card、Document、元数据。Docker volume `dev_db` 或 `VOLUME_CR_DATA_PATH` 持久化。PostgreSQL 协议兼容。不可替换。
- **MinIO（对象存储）**：S3 兼容。存储所有二进制文件——附件、图片、文档 blob。Docker volume `dev_files` 或 `VOLUME_FILES_PATH` 持久化。Nginx 直接代理文件下载。
- **Elasticsearch（搜索索引）**：存储文档内容索引。Docker volume `dev_elastic` 或 `VOLUME_ELASTIC_PATH` 持久化。可排除（牺牲搜索）。
- **Redpanda（事件流）**：Kafka 兼容。存储事件流数据。Docker volume 或 `VOLUME_REDPANDA_PATH` 持久化。Topic: fulltext、process、tx、users、workspace。可排除（牺牲异步处理）。
- **MongoDB（可选）**：AI Bot 对话数据。仅在启用 AI Bot 时需要。

状态所有权：CockroachDB 拥有所有应用数据状态。MinIO 拥有文件。Elasticsearch 拥有搜索索引（从 CockroachDB 派生）。Redpanda 拥有事件流（瞬态，用于异步处理）。不存在调度状态的持久化——因为不存在调度状态。

### 通信方式

- **客户端与 Huly**：HTTP/HTTPS（Web UI 和 REST API）+ WebSocket（Transactor 数据变更和 Collaborator 文档协作）。通过 Nginx 反向代理。
- **服务间同步通信**：HTTP。如 Transactor → Account（令牌验证）、Transactor → Fulltext（搜索请求）、Front → Account（认证）。
- **服务间异步通信**：Redpanda（Kafka）。Transactor/Workspace/Account 发布事件，Fulltext 消费事件。
- **文件存储通信**：服务通过 S3 API 访问 MinIO。Nginx 直接代理客户端文件下载。
- **认证流程**：JWT 令牌 + 共享 `SERVER_SECRET`。客户端登录获取 JWT，后续 WebSocket 和 HTTP 请求携带 JWT。服务间使用 `SERVER_SECRET` 进行内部认证。
- **HulyPulse（可选）**：WebSocket 推送通知。内存后端（单节点）或 Redis 后端（多节点）。

### 部署形态

#### 工作机安装（Windows / macOS）

**macOS 安装方式与入口**：

- 方式一（Desktop App）：从 huly.io/download 下载 Huly Desktop App。通过 `open -a "Huly" --args --server https://your-server.com` 连接到自托管服务器。
- 方式二（浏览器）：直接访问 `https://${HOST_ADDRESS}`。
- 服务器部署：在 macOS 上运行 Docker Desktop，通过 `docker compose up -d` 启动 14 个容器。支持 amd64 和 arm64。需配置 `/etc/hosts` 添加 `huly.local`。最低 2 vCPU + 8GB RAM。
- 权限：Docker 容器以 root 运行。macOS 上 Docker Desktop 不需要 sudo。
- 网络：出站 HTTPS 到 OpenAI API（可选 AI Bot）、GitHub API（可选同步）、Google API（可选 Calendar）。入站端口 80/443（Nginx）。
- 卸载：`docker compose down` 停止容器，删除 Docker volume 清除数据。

**Windows 安装方式与入口**：

- 方式一（Desktop App）：从 huly.io/download 下载 Huly Desktop App。通过 `"C:\Program Files\Huly\Huly.exe" --server https://your-server.com` 连接到自托管服务器。
- 方式二（浏览器）：直接访问 `https://${HOST_ADDRESS}`。
- 服务器部署：通过 WSL2 运行 Docker。需配置 WSL 集成、Git 行尾设置（`core.autocrlf false`）。完整部署消耗 35GB+ WSL 虚拟磁盘空间。
- 权限：WSL 中部分命令需 `sudo`。
- 网络：同 macOS。
- 卸载：同 macOS。

两个平台均支持 Desktop App 和浏览器访问。但服务器必须在 Docker 中运行——Desktop App 不包含服务端能力。Windows 通过 WSL 部署存在摩擦（WSL 依赖、Docker Desktop 要求、磁盘空间）。macOS 部署相对顺畅。

#### 主体功能运行位置

- 主体功能运行在 Docker 容器中的 14 个服务里。CockroachDB、Transactor、Account、Workspace、Collaborator 等核心服务均在本地 Docker 中运行。
- Hosted Huly 云端服务正在关闭。自托管方式不依赖任何 Huly 运营的云端组件。
- Desktop App 是瘦客户端，不包含服务端能力。所有数据存储和业务逻辑在服务端。
- Local 优先适配判断：**自托管无云端强依赖，但部署形态为重型容器化服务端应用**。14 个容器、最低 8GB RAM。不适合轻量级本地部署。

#### 云端形态

Hosted Huly 云端服务正在关闭：

- **职责**：原为完全托管的 Huly 服务，用户无需自托管。
- **关闭原因**：GitHub README 声明"hosting is no longer being funded"。
- **关闭时间**：预期 July 20。
- **迁移路径**：自托管（huly-selfhost）或导出数据迁移。
- **自托管与 Cloud 关系**：Hosted Huly 关闭后，自托管成为唯一路径。自托管不依赖任何 huly.io 域名的 API 或服务。

## 未决项与证据边界

### Process 服务的调度能力为核心未决项，证据矛盾需源码验证

Process 服务是判断 Huly 是否具备工作流自动化能力的关键。当前证据存在矛盾：

- **证据一（矛盾）**：[Architecture Overview](https://github.com/hcengineering/huly-selfhost/blob/main/ARCHITECTURE_OVERVIEW.md) 的"Services NOT Included in Self-Hosted"表格将 Process 列为"Workflow automation"，标注为 Cloud/Enterprise 服务不在自托管中。
- **证据二（矛盾）**：[Platform README](https://github.com/hcengineering/platform) 的 minified 变体说明将"process"列为可排除的服务（`excludes hulypulse, redis, process, backup, ...`），暗示 Process 在完整自托管构建中可用。
- **证据三（功能）**：v0.7.426 Release Notes 的"Processes"章节包含"OnExecutionDone trigger"、"Todo required fields"、"WhenRequiredFieldsFilled"，暗示存在工作流触发器和条件逻辑。
- **证据四（基础设施）**：Redpanda Topic 列表包含"process"（`fulltext, process, tx, users, workspace`），暗示 Process 服务消费或生产事件。

合理推导：Process 服务可能是一个工作流引擎容器（`hardcoreeng/process`），在完整自托管构建中可用但在 minified 变体中排除。Architecture Overview 的"NOT Included"表格可能已过时。Process 的能力可能是 Jira 式工作流自动化（状态迁移触发器、必填字段验证），而非 Agent 调度。但 Process 服务的源码、状态模型、触发器机制和调度能力均因源码不可及而无法确认。需获取 Process 服务源码或运行环境验证。

### Issue 状态机的自定义程度和自动化迁移需源码验证

Huly 的 Issue 状态管理已知支持自定义状态和默认状态（Project 设置中配置）。但状态机的自定义程度——是否支持自定义状态迁移规则、条件迁移、自动迁移触发器——在文档层面未充分说明。v0.7.426 的 Process 功能（OnExecutionDone、WhenRequiredFieldsFilled）暗示存在某种自动化迁移能力，但具体实现和范围未公开。需源码验证 Tracker Issue 的状态迁移机制。

### Huly Desktop App 的技术栈和本地能力需验证

Huly Desktop App 支持 macOS、Windows 和 Linux，可从 huly.io/download 下载。但 Desktop App 的技术栈（Electron 或 Tauri 或其他）、本地文件系统访问能力、离线工作能力和自更新机制在文档层面未充分说明。Desktop App 的 `--server` 参数暗示它是服务端瘦客户端，但是否支持任何本地缓存或离线模式需验证。已知 Desktop App 支持 Backup/Restore 操作，暗示具备本地文件系统访问能力。

### AI Bot 服务的 Agent 能力边界需验证

AI Bot 服务（aibot 容器）使用 OpenAI API 提供聊天、翻译和语音翻译。文档明确它是"AI-powered chatbot"，但未说明它是否能够：接收 Tracker Issue 并自动执行、调用其他 Huly API 完成任务、生成并提交新的 Issue 或 Document。如果 AI Bot 仅限于 Chat 中的对话式交互，则不构成 Agent 调度。但如果 AI Bot 能够通过 Platform API 操作 Issue、Document 或 Card，则可能具备有限的 Agent 能力。当前证据指向前者（Chat 对话助手），但需源码或运行验证。

## 后续验证建议

1. **获取 Process 服务源码和文档**：定位 `hardcoreeng/process` 容器的源码（可能在 platform 仓库的某个子目录或独立仓库中），确认其工作流引擎能力——是否支持状态机迁移、条件分支、触发器链、任务编排。这是判断 Huly 是否具备工作流自动化能力的必要步骤。

2. **运行验证 Process 服务功能**：在本地部署完整 Huly 自托管（非 minified 变体），启用 Process 服务，创建自定义工作流，观察触发器（OnExecutionDone）和条件逻辑（WhenRequiredFieldsFilled）的实际行为。验证是否存在自动状态迁移、任务编排或 Agent 分派能力。

3. **源码验证 Tracker Issue 状态机**：定位 platform 仓库中 Tracker Issue 的状态管理代码，确认状态迁移是否支持自定义规则、条件迁移和自动迁移触发器。这不影响"Huly 不是 Stateful 调度器"的结论（因为不存在 Agent 分派），但有助于评估工作流自动化能力边界。

4. **验证 Desktop App 技术栈**：下载并检查 Huly Desktop App 的安装包结构和进程信息，确认其技术栈（Electron/Tauri/其他）、本地能力和离线模式支持。

5. **追踪 Hosted Huly 关闭后的产品演进**：Hosted Huly 正在关闭，自托管成为唯一路径。追踪后续版本发布和社区反馈，判断产品是否向更轻量的本地部署方向演进，或保持重型容器化服务端形态。
