# Agently 技术产品调研

> updated_by: Qoder - Claude
> updated_at: 2026-08-07 18:00:00
> evidence_window: 2026-08-07, main 分支, v4.1.4.6

## 调研目标

- 围绕 Stateful 编排调度、客户端接入、Windows 与 macOS 工作机部署、依赖根源与架构范式，形成可追溯的独立产品调研。
- 判断产品是否持久拥有工作对象、对象关系和任务生命周期，并依据依赖、状态与策略持续推进任务。
- 核验 Windows 与 macOS 工作机支持情况、Local 优先适配程度、云端依赖与最小部署成本。
- 识别调度最小核心职责与非调度增值能力的边界，评估改造范围与风险。

## 交付结论

### Agently 是 GenAI 应用运行时框架，具备工作流级编排能力，但不是 Stateful 调度系统

Agently 是一个面向 GenAI 应用开发的 Python 运行时框架，提供结构化请求、契约式输出控制、Action 运行时、TriggerFlow 工作流编排、Dynamic Task DAG 和 RecordStore 持久化。产品拥有工作流执行级的状态管理、暂停/恢复、save/load 和快照保留能力，但这些能力绑定在单个 TriggerFlow 执行的生命周期内，不构成 Index 定义的 Stateful 调度系统。产品不持久拥有跨执行的中心调度状态，不维护全局任务队列，不负责跨执行的任务发现、分派和连续推进。调度逻辑由应用代码在 Python 进程内驱动，不是独立持久的服务。

以上为已确认事实，依据[GitHub README](https://github.com/AgentEra/Agently)和[TriggerFlow 文档](https://agently.tech/docs/en/triggerflow/overview.html)。

### 工作对象模型以执行为核心，不存在 Workspace / Project / Issue / Plan / Task 全局对象

Agently 的持久化和运行时对象模型如下：

- **AgentExecution**：真实运行时对象，拥有一次运行的 prompt、策略（direct / flat / TaskBoard）、Action 绑定、Skill 绑定、进程流、TaskContext 证据和结果视图。执行结束后不自动持久化，除非显式 save。不等价于调度系统中的 Workspace 或 Project。
- **TriggerFlowExecution**：工作流执行对象，拥有状态快照、运行时资源、运行时流和待处理中断。通过 `save()` / `async_load()` 可跨进程重启恢复。但这是单次执行的状态，不是全局调度状态。
- **TaskDAG / DynamicTask**：DAG 任务对象，支持 `task_dag/v1` schema，包含 task id、kind（local / model）、binding、depends_on、inputs 和 semantic_outputs。DAG 经验证后编译为 TriggerFlow 执行。这是模型或应用生成的计划数据，不是持久化的全局任务记录。
- **RecordStore**：持久化存储对象，本地实例物化为 `.agently/records/records.db`（SQLite）。存储记录、快照、事件、检查点和 SessionMemory。提供 `keep_last` 保留策略和快照投影。这是最接近持久化工作对象的结构，但它是执行快照存储，不是全局任务注册表。
- **TaskContext / ContextReader**：任务信息聚合和消费者绑定的渐进式读取。TaskContext 拥有源绑定和派生索引；ContextReader 拥有消费者绑定的渐进式回读。
- **TaskWorkspace**：任务文件和执行授权的拥有者，管理文件包含、变更策略、回读和摘要。
- **Session**：有界多轮会话状态，保持会话上下文。适用于单条对话线程，不等价于工作流存储。
- **SkillLibrary**：不可变 Skill 修订版本存储，AgentExecution 拥有精确修订选择和绑定。

Index 定义的 Workspace、Project、Issue、Plan、Task 作为全局持久化调度对象在 Agently 中均不存在。Agently 的对象模型以单次执行为核心，RecordStore 提供跨重启的执行快照持久化，但不存在跨执行的中心任务注册表或全局工作对象。

以上为已确认事实，依据[GitHub README](https://github.com/AgentEra/Agently)、[TriggerFlow 概览](https://agently.tech/docs/en/triggerflow/overview.html)和[v4.1.4.2 Release Notes](https://github.com/AgentEra/Agently/releases/tag/v4.1.4.2)。

### 任务关系与生命周期存在于单次执行内，不具备跨执行调度能力

Agently 在单个 TriggerFlow 执行内拥有丰富的任务关系和生命周期管理：

- **TaskDAG 依赖关系**：支持 `depends_on` 声明任务间依赖，支持父子关系、先后顺序和 DAG 拓扑。TaskDAGValidator 验证 DAG 语法、依赖、schema 版本、语义输出和副作用策略。TaskDAGResolver 将 binding 映射到可运行 handler。TaskDAGExecutor 将验证后的 DAG 编译为 TriggerFlow 执行。这是真实的有向无环图任务关系。
- **TriggerFlow 分支与并发**：支持 `if_condition` / `elif_condition` / `else_condition` / `match` / `case` 分支，`for_each(concurrency=...)` / `batch(...)` 并发，`when(...)` / `emit(...)` 事件驱动分支。
- **暂停/恢复**：`pause_for(type=..., resume_to=...)` 支持人工审批和外部事件等待。`continue_with(interrupt_id, payload)` 恢复中断，支持幂等 `resume_request_id` 防重复投递。
- **save/load 持久化**：`execution.save()` 捕获重启安全快照（状态、生命周期元数据、待处理中断状态、资源需求）。`async_load(saved, runtime_resources=...)` 在不同进程中恢复执行。支持租约管理（`claim_lease`）和快照存储接口（`put_snapshot` / `get_snapshot`）。
- **快照保留**：RecordStore 默认保留每个 `run_id` 的最近三个执行快照版本，可配置 `keep_last` 策略。支持终端值投影（digest 模式）减少快照体积。

但这些能力不构成 Stateful 调度：

- 所有任务关系和生命周期绑定在单个 TriggerFlow 执行内，不是跨执行的全局调度。
- save/load 提供跨重启恢复，但需要应用代码显式调用，没有自动恢复守护进程。
- 不存在全局任务状态机（等待→可执行→运行→完成→失败→阻塞）。
- 不存在跨执行的任务优先级、计划时间或资源约束调度。
- 不存在失败后自动转交其他 Agent 或重新排队。

以上为已确认事实，依据[TriggerFlow 概览](https://agently.tech/docs/en/triggerflow/overview.html)、[持久化与 Blueprint 文档](https://agently.tech/docs/en/triggerflow/persistence-and-blueprint.html)和[Dynamic Task 文档](https://agently.tech/docs/en/dynamic-task/)。

### Agent 分派由应用代码和模型决策驱动，不存在中心调度器选择执行者

Agently 不存在中心调度器选择执行者。任务执行者的确定方式如下：

- **DAG handler 绑定**：TaskDAG 中的 `binding` 字段（如 `"local_handler"`）在应用代码中通过 `handlers={"local_handler": local_handler}` 显式绑定。TaskDAGResolver 按 `task.binding` → `task.id` → `task.kind` 顺序解析。执行者在代码编写时确定，不是运行时调度。
- **TriggerFlow chunk 执行**：TriggerFlow 的 chunk handler 是 Python 异步函数，由开发者编写。执行顺序由 `flow.to(...)` 链和分支条件决定，不是调度器分派。
- **模型决策**：在 AgentExecution 的 TaskBoard 策略中，模型可以选择 Action 调用和控制决策，但这是模型在单次执行内的决策，不是跨执行的 Agent 分派。
- **无执行者持久化归属**：Agent 与 Task 的归属关系不持久化。每次执行创建新的 AgentExecution，结束后释放。
- **无失败转交**：Agent 退出、失败或断线后，Task 不能自动转交其他 Agent。需要应用代码通过 save/load 手动恢复或重新创建执行。

以上为已确认事实，依据[Dynamic Task 文档](https://agently.tech/docs/en/dynamic-task/)和[TriggerFlow 概览](https://agently.tech/docs/en/triggerflow/overview.html)。

### 持久化通过本地 SQLite RecordStore 和执行快照实现，无外置数据库强依赖

Agently 的持久化机制如下：

- **RecordStore**：本地 SQLite 数据库，物化为 `<root>/.agently/records/records.db`。存储记录、检索索引、链接、检查点、TriggerFlow 快照/事件和 SessionMemory 持久化。提供 `keep_last` 保留策略和快照投影策略。
- **执行快照**：`execution.save()` 返回 JSON 友好的 dict，包含执行状态、生命周期元数据、待处理中断状态、版本化顶层快照、资源键和资源需求。应用可选择存储到 Redis、PostgreSQL、S3 或文件——框架不附带后端。
- **Blueprint 序列化**：`flow.save_blueprint()` 序列化流程定义结构（chunk 引用、分支、条件），不含 chunk 函数体。用于版本控制或分发流程定义。
- **TaskWorkspace**：任务文件存储，管理文件包含、变更策略和摘要。
- **不捕获的内容**：执行快照不捕获运行时资源本身（不可序列化）、进行中的 chunk（无执行中协程）、分布式存储所有权和活动对象状态。

无强制外置数据库依赖。RecordStore 使用内嵌 SQLite，不需要单独部署数据库。应用可通过 `put_snapshot` / `get_snapshot` 接口接入外部持久化存储（Redis、PostgreSQL 等），但这是应用侧选择，不是框架内置。这是 Local 优先架构的正面特征。

以上为已确认事实，依据[持久化与 Blueprint 文档](https://agently.tech/docs/en/triggerflow/persistence-and-blueprint.html)和[v4.1.4.2 Release Notes](https://github.com/AgentEra/Agently/releases/tag/v4.1.4.2)。

### 接口形态以 Python API 为主，生产部署通过 FastAPI 封装

Agently 的接口形态如下：

- **Python API**：`from agently import Agently`，在 Python 代码中直接使用。通过链式调用（`.input(...)` `.output(...)` `.start()`）或 TriggerFlow API 编写应用逻辑。
- **无 CLI**：不提供命令行工具。`agently-devtools init` 是可选的项目脚手架工具，不是运行时 CLI。
- **无 REST API**：Agently 本身不提供 HTTP 接口。生产部署通过 `agently.integrations.fastapi` 的 `FastAPIHelper` 封装为 POST、SSE 和 WebSocket 服务。
- **无 gRPC**：不提供。
- **流式输出**：通过 `result.get_generator(type="instant")` 获取结构化流式事件，适用于 SSE 响应和 UI 更新。
- **MCP 集成**：通过 `agent.use_mcp(...)` 加载本地或远程 MCP 工具到 Action 面。
- **SDK 嵌入**：Agently 本身是 Python 库，直接在应用中 import 使用。

以上为已确认事实，依据[Quickstart](https://agently.tech/docs/en/start/quickstart.html)和[Actions 概览](https://agently.tech/docs/en/actions/overview.html)。

### 通信方式为进程内函数调用和异步协程，无分布式消息中间件

Agently 的所有通信在同一 Python 进程内通过函数调用和异步协程完成。

- **Module 间通信**：TriggerFlow chunk 间通过 `data.input`（上一个 chunk 的返回值）和 `data.async_set_state` / `get_state` 传递数据。
- **LM 通信**：通过 ModelRequester 插件向 LM Provider 发起 HTTP API 调用。支持 OpenAI 兼容（Chat Completions 和 Responses API）和 Anthropic 兼容协议。
- **Action 通信**：Action 通过 `ActionRuntime` → `ActionFlow` → `ActionExecutor` 链路执行。ActionExecutor 支持本地函数、MCP、沙箱（Python/Bash/Node/SQLite/Docker）和自定义后端。
- **事件通信**：TriggerFlow 支持 `async_emit(event, payload)` 和 `when(event)` 事件驱动分支。事件在进程内传递。
- **运行时流**：`data.async_put_into_stream(item)` 向运行时流推送项目，消费者可在模型仍在流式输出时反应。
- **无消息中间件**：不依赖 Redis、RabbitMQ、Kafka 或任何外部消息队列。分布式场景的快照存储和租约管理由应用侧实现。

以上为已确认事实，依据[TriggerFlow 概览](https://agently.tech/docs/en/triggerflow/overview.html)和[Actions 概览](https://agently.tech/docs/en/actions/overview.html)。

### 任务队列是 TriggerFlow 执行内的 chunk 链，无持久化分布式队列

Agently 的"任务队列"概念存在于两个层面：

- **TriggerFlow chunk 链**：`flow.to(A).to(B)` 定义 chunk 执行顺序。执行时 chunk 按 定义顺序运行，支持分支和并发。这是进程内的执行流程，不是持久化队列。
- **TaskDAG 依赖解析**：TaskDAGExecutor 将验证后的 DAG 编译为 TriggerFlow chunks，按 `depends_on` 关系确定执行顺序。这是 DAG 拓扑排序，不是队列消费。
- **租约管理**：`execution.claim_lease("worker-a", lease_ttl=30)` 提供执行级租约，防止多 worker 并发操作同一执行。但这是单执行的并发控制，不是全局任务队列的原子抢占。
- **快照存储接口**：`put_snapshot(run_id, state)` 和 `get_snapshot(run_id)` 提供持久化快照存储接口，应用可实现分布式存储。但框架不附带分布式存储后端。
- **无全局任务队列**：不存在跨执行的全局任务队列。每个 TriggerFlow 执行运行自己的 chunk 链。Dynamic Task 的 DAG 是每次执行的，不共享全局 cron 文件或任务表。
- **无原子抢占或分布式并发协调**：不存在多节点任务抢占或分布式锁。租约是执行级的，不是全局任务级的。

以上为已确认事实，依据[TriggerFlow 概览](https://agently.tech/docs/en/triggerflow/overview.html)和[持久化与 Blueprint 文档](https://agently.tech/docs/en/triggerflow/persistence-and-blueprint.html)。

### Windows 与 macOS 均原生支持，无平台缺陷

Agently 是纯 Python 库，通过 `pip install -U agently` 安装，在 Python 3.10+ 环境下运行。

- **macOS**：原生支持。`pip install -U agently` 即可使用。无特殊依赖、权限或网络要求（除 LM API 调用外）。Apple Silicon 和 Intel 架构均支持。
- **Windows**：原生支持。`pip install -U agently` 即可使用。无 POSIX 依赖、无 bash 要求、无 WSL 需求。可选的 `enable_shell()` Action 使用 shell 命令，但这是可选功能，不是核心运行要求。
- **Linux**：原生支持，安装方式与 macOS/Windows 相同。

无选型缺陷。三个平台均原生支持，无平台特定的能力缺失。可选的 `enable_python()`、`enable_shell()`、`enable_nodejs()`、`enable_sqlite()` 等 Action 功能在 Windows 上的行为可能因 shell 命令差异而不同，但这些是可选能力，不影响框架核心运行。

以上为已确认事实，依据[Quickstart](https://agently.tech/docs/en/start/quickstart.html)和 [GitHub API](https://api.github.com/repos/AgentEra/Agently)。

### 主体功能完全运行在 PC 本地，Local 优先适配良好

Agently 是一个纯本地运行的 Python 库。所有核心能力——结构化请求、Action 运行时、TriggerFlow 工作流、Dynamic Task DAG、RecordStore 持久化、Session Memory——均在用户的 Python 进程中运行。

- **无云端组件**：Agently 产品本身不包含任何云端服务、SaaS 后端或中心化调度服务。Agently 的官方文档站（agently.tech / agently.cn）和 GitHub 仓库是信息资源，不是运行依赖。
- **模型 Provider 依赖**：Agently 需要调用外部 LLM API（OpenAI、Anthropic、DeepSeek 等）进行模型推理。通过 OpenAI 兼容、Anthropic 兼容或 OpenAI Responses 兼容协议接入。支持本地 Ollama。这是 API 调用依赖，不是云端运行依赖。断网后 Module 无法调用模型，但已保存的执行快照和 RecordStore 数据不受影响。
- **Local 优先判断**：Agently 在 Local 优先维度适配良好。主体功能完全运行在 PC 本地，无云端强绑定依赖，数据不离开工作机（模型 API 调用除外）。RecordStore 使用本地 SQLite，不依赖外部数据库服务。

以上为已确认事实，依据[Quickstart](https://agently.tech/docs/en/start/quickstart.html)和 [GitHub README](https://github.com/AgentEra/Agently)。

### 依赖根源为 Python + Agently-Stage，无不可剥离的硬依赖

Agently 的运行时依赖如下：

| 依赖 | 用途 | 是否可替换 |
| --- | --- | --- |
| Python 3.10+ | 核心运行时 | 不可替换 |
| Agently-Stage >= 0.3.5, < 0.4.0 | 进程级任务生命周期管理，TriggerFlow 任务拥有者 | 不可替换，核心依赖 |
| SQLite | RecordStore 本地持久化 | Python 标准库内置，无需单独安装 |
| LiteLLM / HTTP | LM Provider 接入 | 通过 ModelRequester 插件替换，不依赖特定库 |

以上为已确认事实，依据[Quickstart](https://agently.tech/docs/en/start/quickstart.html)和 [v4.1.4.5 Release Notes](https://github.com/AgentEra/Agently/releases/tag/v4.1.4.5)。

- **模型 Provider**：运行时依赖外部 LLM API。没有 LLM API，Agent 无法执行模型任务。这不是可剥离的依赖。但支持本地 Ollama，可实现完全离线运行（模型推理除外）。
- **无外置数据库依赖**：RecordStore 使用 Python 内置 SQLite，不依赖 PostgreSQL、MySQL 或 Redis。
- **无消息中间件依赖**：不依赖外部消息队列。
- **可选依赖**：`agently-devtools`（开发工具）、`fastapi`（服务暴露）、`chromadb`（知识库）、`pydantic`（结构化输出模型）。
- **改造边界**：要将 Agently 改造为 Stateful 调度系统，需要新增全局工作对象模型（跨执行的 Workspace/Project/Issue/Plan/Task）、中心任务队列、执行者选择逻辑和跨执行调度状态持久化。Agently 的 RecordStore、TriggerFlow save/load 和 TaskDAG 可作为底层基础设施，且比 DSPy 或 Prime Agent 提供了更接近调度的能力。但当前架构的调度是单次执行级的，需要显著扩展为跨执行的持久调度层。改造范围中等偏大。这是架构推导。

### 架构范式为分层运行时框架，具备工作流编排但不支持分布式扩展

Agently 的架构范式是**单进程分层 GenAI 应用运行时框架**：

- **分层模型**：Application → Settings → AgentExecution → ModelRequest → Model → Result，加上 Skills、Action Runtime、Execution Resource、TaskContext、TaskWorkspace、RecordStore、TaskDAG/DynamicTask、TriggerFlow、RuntimeEvents/DevTools。各层可独立使用但设计为组合。
- **Action 栈**：Agent → Action facade → ActionRuntime（规划和调用标准化）→ ActionFlow（循环和编排桥接）→ ActionExecutor（函数、MCP、沙箱、Search/Browse、自定义）→ ExecutionResourceProvider（资源生命周期）。
- **无分布式扩展**：不存在多节点协调、分布式锁或集群调度。TriggerFlow 的 `for_each(concurrency=...)` 是单机异步并发，不是分布式调度。Agently-Stage 是进程级任务生命周期管理器，不是分布式协调器。
- **调度逻辑部分可下沉**：Agently 的 TriggerFlow 和 TaskDAG 是独立的工作流编排逻辑，可以封装为外部调度系统的执行节点。但下沉后失去 save/load 恢复和租约管理能力——除非外部系统重新实现这些功能。
- **扩展约束**：任务隔离依赖 Python 进程隔离（每个 Python 进程独立运行 TriggerFlow 执行）。多调度节点协调不存在。互斥机制仅限于执行级租约（`claim_lease`）。
- **持久化可外部接入**：TriggerFlow 的 `put_snapshot` / `get_snapshot` 接口允许应用实现分布式快照存储，支持跨 worker 恢复。但框架不附带分布式存储后端。

以上为已确认事实和架构推导，依据[GitHub README](https://github.com/AgentEra/Agently)和[持久化与 Blueprint 文档](https://agently.tech/docs/en/triggerflow/persistence-and-blueprint.html)。

### 客户端接入通过 Python import 和 FastAPI 封装，不存在调度中心

Agently 不存在独立的"调度中心"。接入方式如下：

- **标准接入**：`from agently import Agently`，在 Python 代码中直接使用。`Agently.create_agent()` 创建 Agent，通过链式调用或 TriggerFlow API 编写应用逻辑。
- **服务化接入**：通过 `agently.integrations.fastapi.FastAPIHelper` 将 Agent、请求、生成器、TriggerFlow 定义和执行封装为 POST、SSE 和 WebSocket 服务。这是用户侧的部署选择。
- **配置接入**：通过 YAML 设置文件和 `${ENV.*}` 环境变量占位符配置模型 Provider、API Key 和其他设置。
- **TriggerFlow 执行接入**：通过 `flow.create_execution(auto_close=False)` 创建显式执行，保持执行句柄用于 save/load 和外部事件恢复。适用于 webhook、人工审批和 SSE/WebSocket 路由。
- **Dynamic Task 接入**：通过 `Agently.create_dynamic_task(target=..., plan=..., handlers=...)` 或 `agent.create_dynamic_task()` 创建 DAG 任务。
- **Windows 与 macOS 差异**：无差异。两个平台上 Agently 的行为一致。

由于产品不提供调度中心，不存在"跳过客户端直接接入调度中心"的场景。如需将 Agently 作为执行节点接入外部调度系统，可通过 TriggerFlow 的 `put_snapshot` / `get_snapshot` 接口和 `claim_lease` 租约机制实现分布式恢复。改造范围限于应用侧实现分布式存储和恢复逻辑，框架提供了契约接口但不附带后端。这是架构推导。

## 产品调研

### 产品定位与目标用户

Agently 是 AgentEra 发布的开源 GenAI 应用开发框架，定位为"AI 应用运行时框架"（AI Application Runtime Framework）。产品面向从"模型能做一次"转向"应用必须可靠执行"的团队：产品工程师（构建助手、内部 copilot、知识工具、运营工作流或 AI 后端 API）、平台团队（需要清晰的模型 Provider、工具、MCP、沙箱、工作流和可观测性扩展点）、技术负责人（比较 AI 框架的可维护性、显式控制、可调试性和生产交接）。产品始于 2023 年 6 月，当前版本 4.1.4.6。

以上为已确认事实，依据[GitHub README](https://github.com/AgentEra/Agently)和[官方首页](https://agently.tech)。

### 核心流程

用户通过 `pip install -U agently` 安装，在 Python 代码中导入。配置 LM Provider 后，通过链式调用定义 Agent 的角色、信息、指令、输入和输出契约，调用 `.start()` 或 `.get_result()` 执行。对于复杂工作流，使用 TriggerFlow 定义分支、并发、事件驱动、暂停/恢复和持久化。对于模型生成的计划，使用 Dynamic Task 提交 TaskDAG，经验证和解析后编译为 TriggerFlow 执行。可选使用 `agently-devtools` 进行本地观察、评估和项目脚手架。

以上为已确认事实，依据[Quickstart](https://agently.tech/docs/en/start/quickstart.html)和[GitHub README](https://github.com/AgentEra/Agently)。

### 功能地图与边界

- **当前可用**：结构化请求（prompt slots、output 契约）、契约式输出控制（Pydantic v2 约束、required 字段提取、parser feedback、retries、ensure_keys、validation handlers）、结构化流式（instant events）、Actions（action_func、MCP、shell/python/node/sqlite、Search/Browse）、Runtime Skills（SkillLibrary、immutable revisions）、TriggerFlow（分支、并发、事件、runtime stream、pause/resume、save/load、sub-flows）、Dynamic Task（TaskDAG、验证、解析、执行）、Session Memory、Knowledge base helpers、FastAPI 服务暴露、可观测性（observation events、DevTools）、Model Pool（多模型切换）、API Key Pool（轮询和故障转移）。
- **实验性/规划中**：gVisor 和 Seatbelt 沙箱 provider（[Issue #324](https://github.com/AgentEra/Agently/issues/324)，贡献者所有）、分布式快照存储 provider。
- **不支持**：全局持久化工作对象模型（Workspace/Project/Issue/Plan/Task）、跨执行的中心调度服务、分布式调度、多节点协调、后台守护进程、持续运行的 Agent、自动失败恢复和任务转交、原生 REST/gRPC 接口（需用户通过 FastAPI 封装）。

以上为已确认事实，依据[GitHub README](https://github.com/AgentEra/Agently)和[v4.1.4.4 Release Notes](https://github.com/AgentEra/Agently/releases/tag/v4.1.4.4)。

### 维护状态与版本演进

- **创建时间**：仓库创建于 2023-06-30，截至调研日（2026-08-07）约 3 年 1 个月。
- **最新版本**：v4.1.4.6（2026-07-31），近一周内发布。
- **版本密度**：v4.1.4.2 至 v4.1.4.6 共 5 个版本，约 10 天内发布（2026-07-22 至 2026-07-31），迭代速度极高。
- **方向性变化**：v4.1.4.2 是重大架构版本，将原合并的 Workspace 和 Skills 执行拥有权拆分为 TaskContext、TaskWorkspace、RecordStore、SkillLibrary 和 AgentExecution 独立拥有者。v4.1.4.4 增加了 Pydantic v2 约束投影到 prompt 和恢复感知的 TriggerFlow 快照。v4.1.4.5 将 Agently-Stage 作为 TriggerFlow 任务生命周期的直接拥有者。v4.1.4.6 统一了推理生命周期事件和 SSE 重试策略。
- **仓库热度**：1,635 stars，181 forks，16 个 open issues。对于 3 年仓库，热度中等但稳定增长。
- **提交活跃度**：最后 push 日期为 2026-07-31（调研前一周），表明项目处于活跃维护状态。
- **测试严格度**：v4.1.4.4 报告 2,438 个通过测试和 27 个跳过，Pyright 静态类型检查 0 错误，wheel 构建和隔离 Python 3.10 环境安装验证。

以上为已确认事实，依据 [GitHub API](https://api.github.com/repos/AgentEra/Agently) 和 [Releases](https://github.com/AgentEra/Agently/releases)。

### 生态与反馈

- **组织**：AgentEra，有独立的 Agently-Stage 仓库（异步和多线程编程库，16 stars）、Agently-Skills 仓库（coding agent 实现指导）。
- **文档体系**：完整的英文和中文文档，覆盖 Quickstart、Model Setup、Output Control、Actions、TriggerFlow、Dynamic Task、FastAPI、Observability 等。文档站位于 agently.tech（EN）和 agently.cn（中文）。
- **社区入口**：GitHub Discussions（已启用）、WeChat 群组、Twitter/X。
- **集成生态**：ChromaDB（知识库）、FastAPI（服务暴露）、OpenAI 兼容（OpenAI、DeepSeek、Qwen、Ollama、Kimi、GLM、MiniMax、Doubao、SiliconFlow、Groq、ERNIE、Gemini-via-OpenAI）、Anthropic 兼容（Claude）、MCP（Model Context Protocol）、agently-devtools（开发工具和项目脚手架）。
- **License 模式**：open-core 模型，开源核心为 Apache 2.0，企业扩展和服务为单独商业协议。
- **Issue 反馈样本**：16 个 open issues，样本量较小。v4.1.4.4 修复了 Issue #331（快照体积膨胀），v4.1.4.2 修复了 Issue #320（sub-flow 取消）。

以上为已确认事实，依据[GitHub README](https://github.com/AgentEra/Agently)和 [GitHub API](https://api.github.com/repos/AgentEra/Agently)。反馈样本边界：16 个 open issues 数量少，不能代表普遍反馈。

## 技术架构调研

### 系统全貌与运行形态

Agently 以**单进程分层 Python 运行时框架**形态运行。系统由以下组件角色组成：

| 角色 | 职责 | 运行位置 |
| --- | --- | --- |
| AgentExecution | 一次运行的 prompt、策略、Action、Skill、进程流、TaskContext 和结果视图 | Python 进程内 |
| ModelRequest | prompt 和输出控制 | Python 进程内 |
| ModelRequester 插件 | LM Provider 接入（OpenAI 兼容 / Anthropic 兼容 / Responses 兼容） | Python 进程内（HTTP 出站到 Provider） |
| ActionRuntime | Action 规划、调用标准化、分发、日志 | Python 进程内 |
| ActionExecutor | 函数、MCP、沙箱、Search/Browse 执行 | Python 进程内或子进程 |
| ExecutionResourceProvider | MCP、Python、Bash、Node、Browser、SQLite 资源生命周期 | Python 进程内或子进程 |
| TaskContext / ContextReader | 任务信息和渐进式披露 | Python 进程内 |
| TaskWorkspace | 任务文件和执行授权 | 本地文件系统 |
| RecordStore | 记录、快照、事件、检查点、SessionMemory 持久化 | 本地 SQLite |
| TaskDAG / DynamicTask | 验证后的 DAG 计划数据 | Python 进程内 |
| TriggerFlow | 分支、并发、事件、runtime stream、pause/resume、持久化 | Python 进程内 |
| Agently-Stage | 进程级任务生命周期管理 | Python 进程内 |
| RuntimeEvents / DevTools | 可观测性和开发工具 | Python 进程内或可选 DevTools 进程 |
| Model Provider | LLM 推理 API | 外部云端服务 |

系统边界完全在单台工作机内。唯一网络出口是对 LM Provider 的 API 调用。

以上为已确认事实，依据[GitHub README](https://github.com/AgentEra/Agently)和[Actions 概览](https://agently.tech/docs/en/actions/overview.html)。

### 主要组件与核心链路

**核心链路 1：结构化请求 → 模型执行 → 结果返回**

1. 用户通过链式调用定义 Agent 的 `.role()`、`.info()`、`.instruct()`、`.input()` 和 `.output()` 契约。
2. `AgentExecution` 管理一次运行的 prompt 快照、策略和 TaskContext。
3. `ModelRequest` 将 prompt slots 渲染为 LM 消息，通过 ModelRequester 插件发送。
4. Provider 返回响应，Adapter 解析输出字段，Pydantic v2 约束验证。
5. 失败时触发 parser feedback 和 bounded retries。
6. 返回 `AgentExecutionResult`，支持 `get_data()`、`get_full_data()`、`get_text()` 和 `get_meta()` 多视图读取。

**核心链路 2：TriggerFlow 工作流执行**

1. 用户定义 `TriggerFlow(name=...)`，通过 `flow.to(chunk)` 链和 `flow.when(event)` 事件分支定义工作流拓扑。
2. `flow.create_execution(auto_close=False)` 创建显式执行，注入 `runtime_resources`。
3. `execution.async_start(input)` 启动执行，chunk handler 按 定义顺序运行。
4. chunk 可调用 Agent、工具、外部 API，更新 `data.async_set_state()` 和 `data.async_emit()`。
5. 可选 `pause_for(...)` 暂停等待外部事件，`continue_with(interrupt_id, payload)` 恢复。
6. `execution.async_close()` 等待所有 chunk 完成，返回 close snapshot（所有状态 dict）。
7. 可选 `execution.save()` 持久化快照，`async_load(saved, runtime_resources=...)` 跨进程恢复。

**核心链路 3：Dynamic Task DAG 执行**

1. `Agently.create_dynamic_task(target=..., plan=task_dag, handlers=...)` 创建动态任务。
2. `AgentlyTaskDAGPlanner` 生成确定性 TaskDAG 数据（可选，当调用方提供 plan 时跳过）。
3. `TaskDAGValidator` 验证 DAG 语法、依赖、schema 版本、语义输出和副作用策略。
4. `TaskDAGResolver` 将 `task.binding` → `task.id` → `task.kind` 映射到可运行 handler。
5. `TaskDAGExecutor` 将验证后的 DAG 编译为 TriggerFlow chunks，通过 TriggerFlow 生命周期执行。
6. 返回 snapshot，包含 `semantic_outputs`。

以上为已确认事实，依据[GitHub README](https://github.com/AgentEra/Agently)、[TriggerFlow 概览](https://agently.tech/docs/en/triggerflow/overview.html)和[Dynamic Task 文档](https://agently.tech/docs/en/dynamic-task/)。

### 主要依赖

见"依赖根源"结论。核心运行时依赖为 Python 3.10+ 和 Agently-Stage >= 0.3.5。无外部数据库（使用内置 SQLite）、消息中间件或云服务依赖。

### 接口形态

见"接口形态"结论。纯 Python API + FastAPI 服务封装 + MCP 集成，无原生 REST/gRPC/WebSocket/CLI。

### 持久化方式

见"持久化"结论。本地 SQLite RecordStore + 执行快照 save/load + Blueprint 序列化，无外置数据库。

### 通信方式

见"通信方式"结论。进程内函数调用和异步协程 + HTTP 到 LM Provider，无分布式中间件。

### 部署形态

#### 工作机安装（Windows / macOS）

**macOS**：
- 安装方式：`pip install -U agently` 或 `uv pip install -U agently`
- 运行入口：Python `from agently import Agently`
- 依赖：Python 3.10+（用户自行安装），Agently-Stage >= 0.3.5（自动安装），SQLite（Python 标准库内置）
- 权限：当前用户权限，无 root 要求
- 网络要求：安装时需要下载 PyPI 包；运行时需要访问 LM Provider API
- 卸载方式：`pip uninstall agently`，可选删除 `.agently/` 目录

**Windows**：
- 安装方式：与 macOS 相同，`pip install -U agently`
- 运行入口：与 macOS 相同，Python `from agently import Agently`
- 依赖：与 macOS 相同
- 权限：当前用户权限
- 网络要求：与 macOS 相同
- 卸载方式：与 macOS 相同
- 无选型缺陷

以上为已确认事实，依据[Quickstart](https://agently.tech/docs/en/start/quickstart.html)和 [GitHub API](https://api.github.com/repos/AgentEra/Agently)。

#### 主体功能运行位置

主体功能完全运行在 PC 本地。Local 优先适配良好，无云端强绑定依赖。

#### 云端形态

Agently 产品本身不存在云端组件。LM Provider（OpenAI、Anthropic、DeepSeek 等）是外部依赖，不是 Agently 的云端组件。支持本地 Ollama 实现完全离线运行（模型推理除外）。FastAPI 服务部署是用户侧选择，不是 Agently 内置的云服务。

## 未决项与证据边界

- **可选 Action 在 Windows 上的行为**：`enable_shell()` 使用 shell 命令（如 `pwd`、`rg`），在 Windows 上的行为可能因 shell 环境不同而有差异。`enable_nodejs()` 和 `enable_sqlite()` 在 Windows 上的子进程行为未在文档中明确验证。需要实际运行验证。但这些都是可选功能，不影响框架核心运行。
- **Agently-Stage 在高并发下的行为**：Agently-Stage 是进程级异步和多线程编程库，v4.1.4.5 性能测试报告了有界本地开销（managed task create +4.74%，取消 -3.08%），但未提供大规模并发（数百个并发 TriggerFlow 执行）的性能基准数据。
- **分布式快照存储的实际行为**：TriggerFlow 提供 `put_snapshot` / `get_snapshot` 接口和 `claim_lease` 租约机制支持分布式恢复，但框架不附带分布式存储后端。实际分布式场景的行为取决于应用侧实现，文档未提供参考实现。
- **RecordStore SQLite 在大规模数据下的性能**：RecordStore 使用本地 SQLite，v4.1.4.4 报告了快照投影可将 1.3MB 快照降至 107KB（91.83% 减少），但未提供大规模执行（数千个 run_id）的查询和保留性能基准。

## 后续验证建议

- 在 Windows 上实际安装和运行 Agently，验证可选 Action（`enable_shell()`、`enable_python()`、`enable_nodejs()`）在 Windows 上的行为一致性。
- 测试 TriggerFlow save/load 在跨进程恢复场景的实际行为：创建执行 → 暂停 → save → 新进程 load → 恢复 → 验证状态一致性。
- 测试 Dynamic Task 的模型自动规划能力：让模型生成 TaskDAG，验证 TaskDAGValidator 的验证覆盖度和 TaskDAGExecutor 的执行正确性。
- 评估将 Agently 的 TriggerFlow + RecordStore + TaskDAG 作为外部调度系统的执行节点接入的可行性和改造范围——TriggerFlow 的 `put_snapshot` / `get_snapshot` 接口和 `claim_lease` 租约机制提供了分布式恢复的契约，但需要外部系统实现分布式存储、任务发现和执行者选择。
- 如需 Stateful 调度能力，Agently 比纯编程框架（如 DSPy）提供了更接近调度的能力（TaskDAG、save/load、RecordStore、租约），但当前架构的调度是单次执行级的，需要扩展为跨执行的持久调度层和中心调度服务。
