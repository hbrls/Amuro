# Trigger.dev 技术产品调研

> updated_by: Qoder - Claude
> updated_at: 2026-08-07 20:00:00
> evidence_window: 2026-08-07, main 分支, v4.5.9

## 调研目标

- 围绕 Stateful 编排调度、客户端接入、Windows 与 macOS 工作机部署、依赖根源与架构范式，形成可追溯的独立产品调研。
- 判断产品是否持久拥有工作对象、对象关系和任务生命周期，并依据依赖、状态与策略持续推进任务。
- 核验 Windows 与 macOS 工作机支持情况、Local 优先适配程度、云端依赖与最小部署成本。
- 识别调度最小核心职责与非调度增值能力的边界，评估改造范围与风险。

## 交付结论

### Trigger.dev 是 Stateful 任务编排平台，具备服务器端调度能力，但不构成 Index 定义的 Agent 工作调度系统

Trigger.dev 是面向 TypeScript 的长时任务编排平台，提供服务器端任务队列、调度器、工作器池、检查点恢复、重试、并发控制和可观测性。产品持久拥有 Task 定义、Run 实例、Schedule 和 Batch 等工作对象，维护完整的任务生命周期（waiting → delayed → enqueued → running → completed / failed / expired / cancelled），在进程重启、工作器崩溃或网络中断后可从 Postgres 和 Redis 恢复调度状态。

但 Trigger.dev 的调度对象是代码定义的函数任务，不是 Agent 工作项。产品不存在 Workspace、Issue、Plan 对象，不存在 Agent 身份与分派，不存在 Agent 跨任务的连续执行归属。工作器是通用执行环境，按队列和并发策略领取任务，不是被调度器选择的有身份执行者。因此，Trigger.dev 是 Stateful 任务编排平台，不是 Index 定义的 Agent 工作调度系统。

以上为已确认事实，依据[Trigger.dev 官网](https://trigger.dev/)、[How it works 文档](https://trigger.dev/docs/how-it-works)和[GitHub 仓库](https://github.com/triggerdotdev/trigger.dev)。

### 工作对象模型以 Task / Run / Schedule 为核心，不存在 Workspace / Issue / Plan 对象

Trigger.dev 的持久化工作对象模型如下：

- **Organization**：顶层组织对象，拥有成员、计费、项目列表和 API 密钥。由仪表盘创建和管理。不等价于调度系统中的 Workspace，它是计费和访问控制容器。
- **Project**：部署分组对象，拥有环境列表（prod / staging / preview branches）、API 密钥和默认配置。由 CLI 或仪表盘创建。Project 是部署和版本管理的容器，不是工作计划对象。
- **Environment**：运行环境对象（prod / staging / preview），拥有独立的 API 密钥、任务版本和运行历史。Preview branch 支持从代码分支创建隔离环境。
- **Task**：任务定义对象，由 TypeScript 代码中的 `task({ id, run })` 声明。拥有唯一 ID、重试配置、队列配置、机器预设和 schema。Task 定义在部署时注册到服务器，版本化锁定。这是代码级函数定义，不是从外部系统读取的工作项。
- **Run**：任务运行实例，拥有唯一 Run ID、状态、payload、output、metadata、tags、attempt 计数、worker 归属和 checkpoint。Run 是 Trigger.dev 的核心调度对象，完整记录一次执行的整个生命周期。
- **Schedule**：cron 调度对象，可声明式（代码中 `schedules.task()`）或命令式（SDK `schedules.create()` / 仪表盘）创建。支持 timezone、deduplicationKey 和多租户调度。Schedule 持久化在 Postgres 中，服务端按 cron 表达式触发 Run。
- **Batch**：批量触发对象，将多个 Run 组织为一次批量操作。拥有唯一 Batch ID 和关联的 Run 列表。

Index 定义的 Workspace、Issue、Plan 作为全局持久化调度对象在 Trigger.dev 中均不存在。Trigger.dev 的对象模型以代码任务定义和运行实例为核心，Schedule 和 Batch 是触发机制，不是工作计划或问题跟踪对象。

以上为已确认事实，依据[How it works 文档](https://trigger.dev/docs/how-it-works)、[Triggering 文档](https://trigger.dev/docs/triggering)和[Scheduled Tasks 产品页](https://trigger.dev/product/scheduled-tasks)。

### 任务关系与生命周期由服务器端调度器持久化和推进，具备完整的 DAG 和状态机能力

Trigger.dev 在服务器端持久化任务关系和生命周期，这是此前调研产品中最强的调度能力：

- **父子任务关系**：通过 `triggerAndWait()` 在任务内部触发子任务并等待结果。父任务在等待期间被检查点挂起（CRIU），子任务完成后自动恢复父任务。父子关系由服务器持久化，不是进程内临时状态。
- **批量并发**：`batchTriggerAndWait()` 支持 fan-out 模式，一次触发多个子任务并行执行并等待全部完成。批量内的 Run 拥有独立的 retry 和 lifecycle。
- **任务依赖与幂等**：通过 `idempotencyKeys.create()` 为子任务分配幂等键，父任务重试时已完成的子任务返回缓存结果，不重复执行。这构成实质的 DAG 式依赖执行。
- **任务状态机**：Run 拥有完整的状态机：`WAITING` → `DELAYED` → `ENQUEUED` → `EXECUTING` → `COMPLETED` / `FAILED` / `EXPIRED` / `CANCELED`。状态迁移由服务器端调度器驱动，不是客户端或 Agent 驱动。
- **延迟与 TTL**：`delay` 选项支持延迟触发（duration、绝对时间、Date 对象、时区）。`ttl` 选项设置最大排队等待时间，超时自动过期。Delayed 状态的 Run 在服务端持久化，到时间后自动入队。
- **Debounce**：`debounce` 选项支持触发去重，相同 key 的连续触发推迟执行。支持 `maxDelay` 上限和 leading / trailing 模式。
- **优先级**：Run 支持 `priority` 选项，影响队列中的执行顺序。
- **并发控制**：Task 定义 `queue.concurrencyLimit` 控制并发上限。`concurrencyKey` 实现按租户隔离的独立队列。队列并发上限可设为环境限制的百分比。
- **Cron 调度**：声明式 `schedules.task()` 和命令式 `schedules.create()` 支持 cron 表达式、timezone、多租户调度。Schedule 持久化在服务器，按时间自动触发。
- **重试策略**：`retry` 配置支持 maxAttempts、指数退避（minTimeoutInMs、maxTimeoutInMs、factor、randomize）。`handleError()` 支持条件重试。`retry.fetch()` 支持 HTTP 响应驱动重试。`retry.onThrow()` 支持任务内细粒度重试。
- **检查点恢复**：使用 CRIU（Checkpoint/Restore In Userspace）对任务进程做完整快照（内存、CPU 寄存器、文件描述符），等待子任务或 `wait.for()` 时挂起并释放资源，事件驱动恢复。这是进程级检查点，不是应用级序列化。仅 Cloud 可用，自托管不支持。

以上为已确认事实，依据[How it works 文档](https://trigger.dev/docs/how-it-works)、[Triggering 文档](https://trigger.dev/docs/triggering)和[Concurrency 产品页](https://trigger.dev/product/concurrency-and-queues)。

### Agent 分派与连续性不存在，工作器是通用执行环境而非有身份执行者

Trigger.dev 不存在 Agent 分派、Agent 身份或 Agent 连续性。任务执行者的确定方式如下：

- **工作器池领取**：工作器（Worker）是通用执行环境，从队列中按并发限制和优先级领取 Run。工作器没有身份、没有跨任务连续性、没有被"选择"或"分派"的过程。
- **机器预设**：Run 可指定 `machine` 预设（如 small-1x、large-2x），控制 CPU 和内存。这是资源分配，不是执行者选择。
- **多区域**：Cloud 支持多区域工作器，Run 可指定 `region`。这是地理调度，不是 Agent 分派。
- **无 Agent 归属**：Run 与工作器的归属是临时的——Run 被分配给某个工作器执行，执行完毕后工作器领取下一个 Run。不存在 Run 与 Agent 的持久归属关系。
- **无失败转交**：Run 失败后由调度器按重试策略重新入队，下一个可用工作器领取执行。不存在"转交给特定 Agent"的概念，任何工作器都可执行任何 Run。
- **chat.agent 不是调度 Agent**：v4 引入的 `chat.agent` 是 AI 聊天代理 SDK 抽象（工具调用、HITL、流式输出），不是调度系统中的执行者分派。chat.agent 的 Run 仍然由通用工作器执行。

以上为已确认事实，依据[How it works 文档](https://trigger.dev/docs/how-it-works)、[Triggering 文档](https://trigger.dev/docs/triggering)和[GitHub 仓库](https://github.com/triggerdotdev/trigger.dev)。

### 持久化使用 Postgres + Redis + ClickHouse，服务器端完整拥有调度状态

Trigger.dev 的持久化架构由服务器端完全拥有，客户端不持有调度状态：

- **Postgres**：主数据库，存储 Organization、Project、Environment、Task 定义、Run 状态、Schedule、Batch、IdempotencyKey、metadata、tags 等核心调度状态。自托管使用内置 Postgres 容器，Cloud 使用托管 Postgres。这是调度状态的权威来源。
- **Redis**：队列和调度中间件，存储任务队列、延迟队列和调度器状态。Run 从 Postgres 持久化后入 Redis 队列等待执行。
- **ClickHouse**：可观测性数据库，存储 OpenTelemetry traces、spans、logs 和 run 事件。支持读副本分离读写流量。自托管使用内置 ClickHouse 容器。
- **S3 兼容对象存储**：存储大于 512KB 的 payload 和大于阈值的 output。自托管内置容器注册表和 MinIO 对象存储。
- **检查点存储**：CRIU 快照压缩后存储在磁盘，仅 Cloud 可用。自托管不支持检查点。
- **日志保留**：自托管日志永不删除。Cloud 按计划保留。
- **数据库不可替换**：Postgres、Redis 和 ClickHouse 是架构底层刚需依赖，不可关闭或替换。自托管以 Docker 容器形式提供，不支持外置数据库替换。

以上为已确认事实，依据[Self-hosting 文档](https://trigger.dev/docs/open-source-self-hosting)、[Docker Compose 文档](https://trigger.dev/docs/self-hosting/docker)和[How it works 文档](https://trigger.dev/docs/how-it-works)。

### 对外接口以 TypeScript SDK 和 REST API 为主，提供 CLI、Realtime 和 MCP 接入

Trigger.dev 的对外接口覆盖调度侧、客户端侧和管理侧：

- **TypeScript SDK（`@trigger.dev/sdk`）**：核心接入载体。提供 `tasks.trigger()`、`tasks.batchTrigger()`、`yourTask.triggerAndWait()`、`runs.retrieve()`、`runs.cancel()`、`runs.reschedule()`、`schedules.create()` 等函数。从后端代码或任务内部调用。鉴权使用 `TRIGGER_SECRET_KEY` 环境变量。
- **REST API**：提供 `POST /api/v1/runs`（触发任务）、`GET /api/v1/runs/:id`（查询状态）、`POST /api/v1/batches`（批量触发）、`GET /api/v1/reports/health`（健康报告）等端点。支持 Personal Access Token 和 Secret Key 鉴权。List 端点限制每页最多 100 条。
- **CLI（`npx trigger.dev@latest`）**：提供 `login`、`init`、`dev`（本地开发）、`deploy`（部署）、`mcp`（MCP 服务器）、`report health`（健康报告）、`switch`（切换 profile）等命令。支持多 profile 切换不同实例。
- **Realtime API**：通过 React Hooks（`@trigger.dev/react-hooks`）和 Realtime streams 将 Run 状态和 LLM 流式输出推送到前端。支持断线恢复。鉴权使用 Secret Key 或 Public Token。
- **MCP Server**：内置 MCP 服务器，通过 `trigger mcp` 启动。提供 `get_report` 等工具，支持 MCP 主机中以 slash command 调用 `report`。
- **Web Dashboard**：管理界面，提供 Run 列表、Task 管理、Schedule 管理、Queue 监控、observability 仪表盘、环境变量管理和部署管理。自托管和 Cloud 均提供。
- **GitHub Integration**：连接 GitHub 仓库后自动追踪分支、创建 preview 环境和自动部署。
- **Vercel Integration**：与 Vercel 项目集成，同步环境变量和部署。

以上为已确认事实，依据[Triggering 文档](https://trigger.dev/docs/triggering)、[How it works 文档](https://trigger.dev/docs/how-it-works)和[GitHub v4.5.9 Release Notes](https://github.com/triggerdotdev/trigger.dev/releases/tag/v4.5.9)。

### 消息通信以 HTTP 短连接和 SSE 长连接为主，无分布式中间件

Trigger.dev 的消息通信模式如下：

- **触发通信**：客户端通过 SDK 或 REST API 以 HTTP 短连接触发任务，服务器返回 Run handle 后立即响应。任务在后台异步执行，客户端通过 `runs.retrieve()` 轮询或 Realtime API 订阅状态。
- **Realtime 推送**：使用 Server-Sent Events（SSE）长连接将 Run 状态变更和 LLM 流式输出推送到前端。支持断线恢复。可配置从主库或读副本读取 Run 数据。
- **工作器通信**：Supervisor 通过 HTTP 与 Webapp 通信，领取 Run、报告状态、上传日志和 checkpoint。工作器与 Webapp 之间是短连接轮询模式，不是长连接。
- **进程间通信**：Supervisor 与 Runner 之间通过进程间通信（Docker 容器内）。Runner 执行任务代码，通过 SDK 回调向 Supervisor 报告状态。
- **无消息中间件**：Trigger.dev 不依赖 Kafka、RabbitMQ 或其他消息中间件。任务队列由 Redis 实现，状态由 Postgres 持有。跨机器通信通过 HTTP。
- **多工作器协调**：多个 Worker 机器通过 `MANAGED_WORKER_SECRET` 与 Webapp 认证。工作器之间无直接通信，均通过 Webapp 协调。

以上为已确认事实，依据[How it works 文档](https://trigger.dev/docs/how-it-works)、[Docker Compose 文档](https://trigger.dev/docs/self-hosting/docker)和[Self-hosting 文档](https://trigger.dev/docs/open-source-self-hosting)。

### 任务队列由 Postgres + Redis 实现，具备持久化、原子抢占和租约回收

Trigger.dev 的任务队列机制如下：

- **持久化队列**：Run 创建后先持久化到 Postgres（包括 payload、options、metadata），然后入 Redis 队列等待执行。Delayed Run 在 Postgres 中持久化，到时间后由调度器入队。队列状态在进程重启后可恢复。
- **并发限制**：Task 定义 `queue.concurrencyLimit`，也可在触发时通过 `queue` 选项覆盖。并发限制按队列名称和 concurrencyKey 维度生效。自 v4.5.9 起支持按环境限制的百分比设置。
- **原子抢占**：工作器通过 HTTP 向 Webapp 请求领取 Run。Webapp 在 Postgres 中原子标记 Run 为 EXECUTING 并关联工作器。多个工作器并发请求时由 Postgres 事务保证原子性。
- **租约与超时回收**：工作器领取 Run 后获得隐式租约。如果工作器崩溃或超时，Supervisor 检测到后回收 Run，按重试策略重新入队。租约管理在服务器端，不在工作器进程内。
- **失败转移**：Run 失败后由调度器按 `retry.maxAttempts` 配置重新入队。重试使用指数退避。已完成的子任务通过 idempotency key 返回缓存结果，不重复执行。任何可用工作器都可领取重试的 Run，不限于原工作器。
- **公平队列**：通过 `concurrencyKey` 实现按租户隔离的独立队列。每个 key 拥有独立的并发限制和队列深度。支持查看每个队列的 backlog、throughput、并发使用率和等待时间。

以上为已确认事实，依据[Triggering 文档](https://trigger.dev/docs/triggering)、[Concurrency 产品页](https://trigger.dev/product/concurrency-and-queues)和[Self-hosting 文档](https://trigger.dev/docs/open-source-self-hosting)。

### Windows 与 macOS 工作机均可用于开发，但自托管调度服务仅限 Linux 容器

Trigger.dev 在 Windows 和 macOS 上的支持情况如下：

- **开发模式（Dev Mode）**：`npx trigger.dev@latest dev` 在 Windows 和 macOS 上均可运行。Node.js 和 npm/npx 是唯一前置依赖。Dev 模式使用相同的 esbuild 构建系统在本地构建和运行任务代码，调度仍在 Trigger.dev 服务器（Cloud 或自托管实例）上进行。不支持离线 dev 模式，需要网络连接到服务器。
- **CLI**：`npx trigger.dev@latest` 在 Windows 和 macOS 上均可运行，提供 login、init、dev、deploy、mcp 等命令。Node.js 是唯一依赖。
- **SDK**：`@trigger.dev/sdk` 是纯 TypeScript 包，可在 Windows 和 macOS 上的 Node.js 环境中安装和使用。从后端代码触发任务不依赖平台。
- **Realtime React Hooks**：`@trigger.dev/react-hooks` 是前端包，在浏览器中运行，与操作系统无关。
- **自托管调度服务**：需要 Docker 20.10.0+ 和 Docker Compose 2.20.0+。Webapp 容器需要 3+ vCPU、6+ GB RAM；Worker 容器需要 4+ vCPU、8+ GB RAM。Docker 在 Windows（Docker Desktop）和 macOS（Docker Desktop）上均可运行，但生产部署通常在 Linux 服务器上。自托管使用 Linux 容器，不是 Windows 或 macOS 原生二进制。
- **任务执行环境**：部署后的任务在 Docker 容器中执行（Linux 容器），与工作机操作系统无关。任务代码编译为 ESM 并打包到 Docker 镜像。在 dev 模式下，任务在本地 Node.js 进程中执行。
- **CRIU 检查点**：仅 Linux 内核支持 CRIU，因此检查点恢复仅在 Cloud 上可用。自托管不支持检查点，`wait.for()` 和 `triggerAndWait()` 在自托管中使用阻塞等待而非检查点。

以上为已确认事实，依据[How it works 文档](https://trigger.dev/docs/how-it-works)、[Docker Compose 文档](https://trigger.dev/docs/self-hosting/docker)和[Self-hosting 文档](https://trigger.dev/docs/open-source-self-hosting)。

### 主体功能依赖云端调度服务，自托管可替代但功能阉割

Trigger.dev 的运行形态分析：

- **Cloud（Trigger.dev Cloud）**：全功能托管服务。提供自动伸缩、Warm starts、检查点（CRIU）、多区域工作器、Static IP、AWS PrivateLink、专用支持和 SSO/Directory Sync。调度服务、工作器、仪表盘和 API 均在云端运行。客户端通过 SDK/CLI/REST API 接入。数据（payload、output、logs）存储在云端。
- **自托管（Self-hosted）**：Docker Compose 或 Kubernetes 部署。功能与 Cloud 基本一致，但缺少：Warm starts（连续运行更快启动）、自动伸缩（需手动添加工作器）、检查点（CRIU 不可用，wait 和 triggerAndWait 使用阻塞等待）和专用支持。内置容器注册表和 MinIO 对象存储，不需要第三方服务。
- **Dev Mode**：本地运行任务代码，调度仍在服务器（Cloud 或自托管）上进行。不是独立运行形态，仍依赖服务器调度。不支持离线模式。
- **Local 优先判断**：Trigger.dev 的主体调度能力（任务队列、调度器、状态持久化、生命周期管理、并发控制）全部在服务器端运行。客户端（SDK/CLI）只是触发和查询接口，不持有调度状态。Dev 模式虽然任务代码在本地执行，但调度逻辑仍在服务器。因此，Trigger.dev 是**云端优先**架构，Local 优先适配为选型缺陷——自托管可以缓解数据主权问题，但调度服务仍需要服务器端运行。
- **最小部署成本**：自托管最小部署需要一台 Webapp 机器（3+ vCPU、6+ GB RAM）和一台 Worker 机器（4+ vCPU、8+ GB RAM），运行 Docker Compose。也可合并到单台机器测试。内置 Postgres、Redis、ClickHouse、MinIO 和容器注册表。

以上为已确认事实，依据[Self-hosting 文档](https://trigger.dev/docs/open-source-self-hosting)、[Docker Compose 文档](https://trigger.dev/docs/self-hosting/docker)和[How it works 文档](https://trigger.dev/docs/how-it-works)。

### 客户端接入以 SDK 和 CLI 为标准载体，调度状态由服务器持有

Trigger.dev 的客户端接入模式：

- **标准接入载体**：TypeScript SDK（`@trigger.dev/sdk`）是官方标准接入方式。CLI（`npx trigger.dev@latest`）用于初始化、部署和开发。REST API 供非 TypeScript 后端接入。
- **客户端触发任务**：后端代码通过 `tasks.trigger()` 或 `yourTask.trigger()` 触发任务，返回 Run handle。客户端不参与调度决策，只发起触发请求。
- **客户端领取任务**：Trigger.dev 不支持客户端主动领取任务。工作器由 Supervisor 管理，被动接收 Webapp 分配的 Run。不存在客户端轮询或领取队列的机制。
- **服务器唤起客户端执行**：Dev 模式下，服务器调度 Run 后通过 WebSocket 通知本地 dev 进程执行任务代码。这是"服务器唤起客户端执行"模式，但仅限 dev 模式。部署模式下，Run 在服务器端 Worker 容器中执行。
- **调度状态归属**：所有调度状态（Run 状态、队列位置、Schedule、并发计数）由服务器端持有。客户端只持有 Run handle（ID）用于查询。断线后客户端可通过 Run ID 恢复查询，不需要恢复调度状态。
- **跳过官方客户端**：可通过 REST API 直接触发和管理 Run，不需要 SDK。但任务定义必须通过 CLI 部署到服务器。MCP 服务器提供另一种接入途径。
- **Windows 与 macOS 接入差异**：无差异。SDK 和 CLI 均基于 Node.js，跨平台一致。

以上为已确认事实，依据[Triggering 文档](https://trigger.dev/docs/triggering)、[How it works 文档](https://trigger.dev/docs/how-it-works)和[GitHub 仓库](https://github.com/triggerdotdev/trigger.dev)。

### 依赖根源为 Postgres + Redis + ClickHouse + Docker，架构范式为服务器端任务编排平台

Trigger.dev 的依赖和架构范式分析：

- **架构底层刚需依赖**：
  - **Postgres**：调度状态的权威数据源，存储所有工作对象和状态。不可替换。
  - **Redis**：任务队列和调度中间件。不可替换。
  - **ClickHouse**：可观测性数据存储。自托管内置，理论上可关闭 observability 功能但影响诊断能力。
  - **Docker**：任务执行环境（容器化）和自托管部署载体。部署模式必须，dev 模式不必须。
  - **esbuild**：构建系统，打包任务代码。SDK 依赖，不可关闭。
- **非调度增值能力依赖**：
  - **OpenTelemetry**：自动 instrument Prisma、AWS SDK 等库，提供 traces 和 logs。可通过 `trigger.config.ts` 的 `instrumentations` 配置关闭。
  - **React Hooks**：前端 Realtime 集成。可选，不影响调度核心。
  - **MCP Server**：AI 工具集成。可选，不影响调度核心。
  - **Python Extension**：在任务中执行 Python 脚本。可选 build extension。
  - **Puppeteer/FFmpeg/apt-get**：可选 build extensions，不影响调度核心。
- **架构范式**：Trigger.dev 属于**服务器端 Stateful 任务编排平台**。核心架构为 Webapp（仪表盘 + API + 调度器 + Postgres + Redis + ClickHouse）和 Worker（Supervisor + Runner）。Supervisor 管理 Runner 容器池，从 Webapp 领取 Run 并分配给 Runner 执行。这是中心化调度服务 + 分布式工作器池的架构范式。
- **调度最小核心职责**：Run 生命周期管理（创建 → 入队 → 调度 → 执行 → 完成/失败/重试）、Schedule 管理（cron 触发）、并发控制（队列 + concurrencyLimit + concurrencyKey）、重试策略（maxAttempts + 退避 + 幂等）。
- **非调度增值能力**：AI chat agent（`chat.agent`）、Realtime 流式、Observability 仪表盘、GitHub/Vercel 集成、MCP Server、SSO/Directory Sync、多区域/Static IP/PrivateLink。
- **扩展可行性**：工作器可水平扩展（添加更多 Worker 机器）。Webapp 可通过 Kubernetes 扩展。但调度逻辑是中心化的——所有调度决策由 Webapp 做出，不存在多调度节点协调或分布式调度器。调度逻辑不能下沉为普通任务节点，因为调度状态由 Postgres 和 Redis 在 Webapp 进程内管理。
- **任务隔离**：每个 Run 在独立的 Docker 容器中执行，资源限制由机器预设强制。Preview branch 提供环境隔离。Docker Socket Proxy 限制容器权限。

以上为已确认事实，依据[Self-hosting 文档](https://trigger.dev/docs/open-source-self-hosting)、[Docker Compose 文档](https://trigger.dev/docs/self-hosting/docker)、[How it works 文档](https://trigger.dev/docs/how-it-works)和[GitHub 仓库](https://github.com/triggerdotdev/trigger.dev)。

## 产品调研

### 基本信息

- **产品名称**：Trigger.dev
- **官方主页**：[https://trigger.dev/](https://trigger.dev/)
- **源码仓库**：[github.com/triggerdotdev/trigger.dev](https://github.com/triggerdotdev/trigger.dev)
- **许可证**：Apache License 2.0
- **语言**：TypeScript
- **GitHub Stars**：15,930
- **Forks**：1,402
- **Open Issues**：412
- **最新版本**：v4.5.9（2026-07-30）
- **CLI**：`npx trigger.dev@latest`
- **SDK**：`@trigger.dev/sdk`（npm）
- **Cloud**：[cloud.trigger.dev](https://cloud.trigger.dev)
- **Discord**：5,000+ 成员
- **Topics**：ai、ai-agent-framework、ai-agents、automation、background-jobs、mcp、mcp-server、nextjs、orchestration、scheduler、serverless、workflow-automation、workflows

### 版本演进

Trigger.dev 经历了从 v3 到 v4 的重大架构升级：

- **v3（已 EOL）**：4.5.0 是最后支持 v3 SDK 任务的版本。4.5.1+ 拒绝 v3 触发、批量触发和部署。v3 任务需要迁移到 v4。
- **v4（当前）**：重新设计的架构。Supervisor + Runner 模型取代了 v3 的 provider + coordinator。内置容器注册表和 MinIO 对象存储。支持多工作器水平扩展。Docker Socket Proxy 增强安全。资源限制默认强制。自托管不再支持检查点（CRIU），检查点仅 Cloud 可用。
- **近期发布**：
  - v4.5.9（2026-07-30）：队列并发限制支持百分比设置、MCP 服务器修复、健康报告命令、安全增强。
  - v4.5.8（2026-07-27）：chat.agent 流式恢复、仪表盘收藏夹、List API 页面限制、SSO 解锁。
  - v4.5.7（2026-07-22）：Node.js 24/26 runtime、chat agent turn loop 改进、dev 模式崩溃修复。
  - v4.5.6（2026-07-21）：安全发布——移除共享默认凭据、CLI/MCP 登录需要浏览器审批、原型污染防护、部署令牌签名验证。
  - v4.5.5（2026-07-20）：Node.js 24/26 实验性 runtime、ClickHouse 读副本、batchTrigger 幂等修复。

### 生态与集成

Trigger.dev 提供丰富的框架集成和示例项目：

- **框架支持**：Next.js、Remix、SvelteKit、Bun、Node.js、Express、Astro、Nuxt。
- **第三方集成**：Vercel、GitHub、Stripe webhooks、Supabase、Hookdeck、Sequin、Resend。
- **AI 集成**：Vercel AI SDK、OpenAI Agents SDK（TypeScript 和 Python）、Claude Agent SDK、Mastra、Replicate、Fal.ai、Deepgram。
- **Build Extensions**：Python、Prisma、Puppeteer、esbuild、FFmpeg、apt-get、additionalPackages、audioWaveform、自定义。

## 技术架构调研

### 系统形态

Trigger.dev 是服务器端 Stateful 任务编排平台，由两个可独立扩展的组件组成：

1. **Webapp**：包含仪表盘、API 服务、调度器、Postgres、Redis、ClickHouse 和内置容器注册表 / MinIO。负责 Run 生命周期管理、队列调度、Schedule 触发、并发控制和状态持久化。
2. **Worker**：包含 Supervisor 和 Runner。Supervisor 从 Webapp 领取 Run，在 Docker 容器中启动 Runner 执行任务代码。可水平扩展多个 Worker 机器。

### 核心链路

任务从触发到完成的完整链路：

1. **触发**：客户端通过 SDK（`tasks.trigger()`）或 REST API 向 Webapp 发送触发请求，携带 payload 和 options（delay、ttl、idempotencyKey、debounce、queue、concurrencyKey、priority、machine、region）。
2. **持久化**：Webapp 将 Run 记录持久化到 Postgres（payload > 512KB 上传到 S3/MinIO），分配 Run ID。
3. **入队**：根据 delay 和 debounce 决定立即入队还是延迟。立即入队的 Run 进入 Redis 队列，按 queue name 和 concurrencyKey 分配。Delayed Run 在 Postgres 中等待到时间后入队。
4. **调度**：调度器从 Redis 队列中按优先级和并发限制选取 Run，分配给可用 Worker。
5. **执行**：Worker 的 Supervisor 接收 Run，在 Docker 容器中启动 Runner，加载任务代码并执行。任务代码通过 SDK 回调向 Webapp 报告状态、日志和 output。
6. **检查点**（仅 Cloud）：当任务调用 `triggerAndWait()` 或 `wait.for(>60s)` 时，CRIU 对 Runner 进程做完整快照，释放 Worker 资源。子任务完成或等待结束时，从快照恢复 Runner 进程继续执行。
7. **完成/失败**：任务返回 output（>阈值上传到 S3/MinIO），Webapp 更新 Run 状态。失败时按 retry 策略重新入队。已完成的子任务通过 idempotency key 返回缓存结果。
8. **通知**：Webapp 通过 Realtime API（SSE）将状态变更推送到订阅的前端。

### 关键技术依赖

- **CRIU（Checkpoint/Restore In Userspace）**：Linux 内核功能，对进程做完整内存快照。仅 Cloud 可用，自托管不支持。
- **esbuild**：构建系统，打包任务代码为 ESM，tree-shaking 依赖。
- **Docker**：任务执行环境容器化和自托管部署。
- **Docker Socket Proxy**：限制 Runner 容器对 Docker socket 的直接访问。
- **OpenTelemetry**：自动 instrument 任务代码，traces、spans、logs 写入 ClickHouse。

## 未决项与后续验证建议

### 自托管检查点缺失的影响需进一步验证

自托管 v4 明确不支持 CRIU 检查点。文档指出 `wait.for()` 和 `triggerAndWait()` 在自托管中使用阻塞等待而非检查点，这意味着工作器资源在等待期间不会被释放。需验证在高并发场景下自托管是否因阻塞等待导致资源瓶颈，以及这是否影响长时任务的可靠性。

### 多调度节点协调机制未在文档中明确

文档描述了 Worker 水平扩展，但未明确多个 Webapp 实例是否可以同时运行并共享调度状态。如果 Webapp 是单点调度器，需要验证是否可以通过 Kubernetes 部署多个 Webapp 副本实现高可用，以及 Postgres 行锁是否足以防止重复调度。

### Windows/macOS 自托管的实际可行性需验证

Docker Desktop 在 Windows 和 macOS 上可以运行 Docker Compose，但 Trigger.dev 的 Webapp 和 Worker 容器需要较高的资源（Webapp 3+ vCPU / 6+ GB RAM，Worker 4+ vCPU / 8+ GB RAM）。需验证在 Windows 和 macOS 工作机上通过 Docker Desktop 运行完整自托管实例的实际性能和稳定性，以及 Docker Desktop 的资源限制是否影响生产可用性。

### 任务定义的动态注册能力未明确

当前文档表明 Task 定义通过代码中 `task({ id, run })` 声明并在部署时注册到服务器。需验证是否存在运行时动态注册 Task 的 API，以及是否支持从外部系统（如 Issue Tracker）动态创建 Task 定义而非代码声明。
