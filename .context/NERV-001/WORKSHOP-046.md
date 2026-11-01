# Maestro（Netflix/maestro）技术产品调研

> updated_by: Qoder - Claude Sonnet 4.5
> updated_at: 2026-07-31 19:20:00
> evidence_window: 调研日期 2026-07-31；GitHub 仓库 `Netflix/maestro`（创建于 2024-04-17，主干 `main` 最近推送 2026-07-31）；无 GitHub Release/Tag，以 `main` 主干目录、各模块 README、`maestro-server/src/main/resources/application.yml`、`db/migration/postgres` 迁移脚本、`WorkflowInstance`/`StepInstance`/`RunStrategy` 源码定义与 Netflix Tech Blog 系列文章为准；许可证 Apache-2.0

## 交付结论

### Maestro 是 Netflix 面向数据/ML 的通用工作流编排器，是一个真正的 Stateful 调度系统

Maestro 官方定位为「Netflix 的通用工作流编排器」，以工作流即服务（Workflow-as-a-Service，WAAS）形式服务数据科学家、数据工程师与 ML 工程师，日调度数十万工作流、数百万作业（[README](https://github.com/Netflix/maestro)，直接事实）。

它满足 Index 定义的全部 Stateful 调度判定基准：持久拥有工作对象（workflow definition / workflow instance / step instance）、对象关系（DAG、step 依赖、foreach、subworkflow）、任务状态机与执行归属，并由中心引擎判断任务何时可执行、按何顺序推进、失败后如何继续。这是本轮调研迄今**最完整、最典型的 Stateful 调度器样本**（架构推导 + 源码事实）。

与 WORKSHOP-043 的同名产品「RunMaestro/Maestro」（本地 AI Agent 编排桌面应用）完全无关，二者仅名称相同；本报告只针对 `Netflix/maestro`。

### 调度对象是数据/ML 批处理作业，不是 AI Agent，与 GLNT-10 的「Agent 自主工作」议题只在调度机制层同源

Maestro 的执行单元（step）是 Spark 作业、Jupyter Notebook、Docker 容器、Kubernetes 批任务、SQL/数据搬运等预定义 step type，或用户自定义容器（[ByteByteGo 归纳自 Netflix 博客](https://blog.bytebytego.com/p/how-netflix-orchestrates-millions)，直接事实）。它不感知「AI Agent」概念，没有 Agent 会话、handoff、上下文共享或人审分派语义。

因此 Maestro 对 GLNT-10 的价值在于**调度机制范本**（任务对象模型、状态机、依赖解析、run strategy、分布式队列租约、事件驱动触发），而非 Agent 协作产品范本。若要承载 Agent 工作，需把「AI Agent 执行」封装为一种 step type / 执行运行时，Maestro 自身不提供这一层（架构推导）。

### 运行形态是服务端、云原生、分布式微服务集群，与 Local 优先 / PC 工作机要求根本冲突

Maestro 由三类无状态微服务组成，全部状态外置到分布式 SQL 数据库，靠水平扩容支撑峰值（[ByteByteGo/Netflix 博客](https://blog.bytebytego.com/p/how-netflix-orchestrates-millions)，直接事实）。它是运行在数据中心/云上的后端平台，**没有桌面客户端、没有 PC 安装形态**。

这构成本轮最重要的**选型缺陷**：Maestro 与「Windows/macOS 工作机本地运行」的核心调研焦点从根本上不匹配。它可以在开发者的 macOS/Windows 上以 JVM 进程 `./gradlew bootRun` 跑起来做开发验证，但那是开发运行而非工作机产品形态，不能视为 Local 优先适配（概念区分，见常见陷阱 4）。

### 工作对象模型完整且持久化：Workflow / Instance / Step 三级 + DAG + foreach + subworkflow

`maestro_workflow_instance`（工作流运行）与 `maestro_step_instance`（步骤运行）表明确持久化 `status`、`runtime_state`、`dependencies`、`outputs`、`artifacts`、`timeline`、`runtime_overview`（[V202011201000__add_instance_tables.sql](https://github.com/Netflix/maestro/blob/main/maestro-engine/src/main/resources/db/migration/postgres/V202011201000__add_instance_tables.sql)，直接事实）。

工作流以 DAG 表示，step 之间支持依赖、条件分支、foreach 循环（可嵌套，单实例可展开百万级 step）、subworkflow、step template 复用；参数通过安全表达式语言 SEL 动态注入（[netflix-sel README](https://github.com/Netflix/maestro/tree/main/netflix-sel) + [ByteByteGo](https://blog.bytebytego.com/p/how-netflix-orchestrates-millions)，直接事实）。对照 Index 对象模型：Workflow=持久编排定义（含版本）、Instance/Run=持久运行对象、Step=持久执行单元；**无 Issue/Plan/Project 等 Agent 任务管理容器概念**（这是数据编排器而非项目/Agent 管理器）。

### 任务生命周期与调度决策由中心状态驱动，重启/断线后可恢复，是真 Stateful 而非单会话

工作流实例状态机为 `CREATED → IN_PROGRESS → (PAUSED) → SUCCEEDED / FAILED / STOPPED / TIMED_OUT`；step 状态机更细，含 `WAITING_FOR_SIGNALS`、`WAITING_FOR_PERMITS`、`EVALUATING_PARAMS`、`RUNNING`、`FINISHING` 及 `SUCCEEDED / USER_FAILED / PLATFORM_FAILED / FATALLY_FAILED / TIMED_OUT` 等终态，并携带 `retryable` 标志驱动自动重试（[WorkflowInstance.java / StepInstance.java](https://github.com/Netflix/maestro/tree/main/maestro-common/src/main/java/com/netflix/maestro/models/instance)，直接事实）。

「何时可执行、按何顺序推进」由 **RunStrategy** 决定：`SEQUENTIAL`（按创建序逐个）、`STRICT_SEQUENTIAL`（上一次失败则阻塞后续）、`FIRST_ONLY`、`LAST_ONLY`、以及带 `workflowConcurrency` 的并行（[RunStrategy.java](https://github.com/Netflix/maestro/blob/main/maestro-common/src/main/java/com/netflix/maestro/models/definition/RunStrategy.java)，直接事实）。这是中心调度器对同一 workflow 多实例排队/并发的显式策略层。

因所有服务无状态、状态全部落 DB，实例与 step 状态在进程重启、节点更替后可从数据库恢复继续——符合 Index「进程重启/断线后仍可恢复」的 Stateful 判定，明确不属于 Stateless/Serverless 单会话执行（架构推导 + 源码事实）。

### 持久化强绑定分布式 SQL 数据库：生产 CockroachDB，开源默认 PostgreSQL 17

生产环境用 CockroachDB（分布式 SQL，强一致，水平扩展）承载全部工作流定义、实例、step 状态（[Netflix 博客](https://blog.bytebytego.com/p/how-netflix-orchestrates-millions)，直接事实）。开源仓库默认 `db-type: postgres`、`jdbc:tc:postgresql:17`（Testcontainers Postgres 17），并用 Flyway 管理 `db/migration/postgres` 迁移脚本（[application.yml](https://github.com/Netflix/maestro/blob/main/maestro-server/src/main/resources/application.yml)，直接事实）。

数据库是架构底层刚需（任务状态一致性、run strategy 排队、队列租约、幂等去重全依赖它），**不可剥离**；CockroachDB↔Postgres 之间存在 JDBC 抽象层（`maestro-database` 模块「JDBC persistence layer over a specific database system」）使替换成为可能，但去掉分布式 SQL 会直接摧毁其水平扩展与强一致前提（架构推导 + 源码事实）。

### 任务队列 = 数据库表 + 内存队列，支撑分布式并行抢占；这是调度可靠性核心

`maestro-queue` 模块用「数据库表 + 内存队列」实现内部作业队列，支持并行、分布式运行；signal 与 time-trigger 模块也可复用该队列（[maestro-queue README](https://github.com/Netflix/maestro/tree/main/maestro-queue)，直接事实）。`application.yml` 中每个 queue id 配 `worker-num` 与 `scan-interval`，并设 `ownership-timeout`（如 125000ms）实现所有权/租约超时回收——任务领取、租约、超时回收由中心 DB 状态驱动，而非单次执行进程私有（[application.yml](https://github.com/Netflix/maestro/blob/main/maestro-server/src/main/resources/application.yml)，直接事实）。

底层由自研 `maestro-flow` 引擎推进：它是「高度优化的 flow engine」，用 Java 虚拟线程简化并发，只负责在单机内存内推进并行任务列表，foreach/条件分支/subworkflow 等高级图模式建在其上；引擎替代了早期依赖的 Netflix Conductor（[maestro-flow README](https://github.com/Netflix/maestro/tree/main/maestro-flow) + [100X Faster 博客](https://netflixtechblog.com/100x-faster-how-we-supercharged-netflix-maestros-workflow-engine-028e9637f041)，直接事实）。

### 触发有两条中心链路：时间调度（cron/间隔，at-least-once + 去重达 exactly-once）与信号服务（事件驱动 + gating + lineage）

时间调度服务轻量、可扩展，提供 at-least-once 触发保证，引擎侧去重从而实践上达 exactly-once；开源默认 `type: noop`，AWS 模块用 SQS delay-queue 实现（[maestro-timetrigger README](https://github.com/Netflix/maestro/tree/main/maestro-timetrigger) + [Netflix 博客](https://blog.bytebytego.com/p/how-netflix-orchestrates-millions)，直接事实）。

信号服务提供事件驱动编排：支持 signal trigger（信号匹配触发整个 workflow，含 join key）、signal dependency（step 等待信号且支持比较运算符 gating）、output signal（step 完成后发信号触发下游或解锁其他 step），并追踪 signal lineage 建立上下游依赖图（[maestro-signal README](https://github.com/Netflix/maestro/tree/main/maestro-signal)，直接事实）。这对应 Index 关注的「上游完成/失败后下游如何解锁」的中心状态驱动机制。

### 对外接口以 REST 为主（`/api/v3`），多 DSL 定义（YAML/Python/Java）+ Python SDK + Web UI + Metaflow 集成

系统边界接口是 HTTP REST：`POST /api/v3/workflows`（推送定义）、`.../actions/start`（触发）、`.../instances/{id}/runs/{id}`（查运行）、`POST /api/v3/signals`（发信号）等（[README](https://github.com/Netflix/maestro) + [maestro-signal README](https://github.com/Netflix/maestro/tree/main/maestro-signal)，直接事实）。

工作流定义支持 YAML（最常用）、Python DSL、Java DSL，以及 JSON API、图形化 Maestro UI、Metaflow 集成；官方提供 `maestro-sdk` Python 客户端（`pip install maestro-sdk`）（[ByteByteGo](https://blog.bytebytego.com/p/how-netflix-orchestrates-millions) + [README](https://github.com/Netflix/maestro)，直接事实）。事件对外通过 Kafka / SNS 发布（内部生命周期事件 + 外部状态变更事件），供下游系统响应（[Netflix 博客](https://blog.bytebytego.com/p/how-netflix-orchestrates-millions)，直接事实）。

### 部署形态是服务端集群：Java 21 + Spring Boot + 分布式 SQL + 队列 +（可选）K8s/AWS，无终端用户安装包

开源部署路径：`Git + Java 21 + Gradle + Docker`，`./gradlew bootRun` 起 Spring Boot server（端口 8080）；`maestro-aws` 模块经 LocalStack 提供 SQS/SNS（另含 Redis）；`maestro-kubernetes` 经 `Fabric8RuntimeExecutor` 向 K8s 集群提交批任务；`maestro-extensions` 作为独立 Spring Boot 服务经 SQS 消费事件做 foreach flattening（[README](https://github.com/Netflix/maestro) + [maestro-aws/kubernetes/extensions README](https://github.com/Netflix/maestro)，直接事实）。

**双平台工作机结论（核心焦点）**：Maestro 无 Windows/macOS 桌面安装方式、无原生二进制、无客户端程序。macOS/Windows 仅作为开发者跑 JVM 的开发机，需自备 Java 21 + Gradle + Docker + Postgres/CockroachDB；这是开发运行而非工作机产品形态，两平台均**不构成合格的工作机本地落地路径**（选型缺陷，直接事实 + 概念区分）。

### 维护活跃、工程规范、Netflix 官方持续投入，但无发布版本号体系

仓库 3,810 stars / 301 forks / 34 open issues（2026-07-31 快照），Apache-2.0，Java 为主，`main` 主干持续高频推送（近期提交涉及 flow engine 唤醒机制、可配置默认参数、signal 终态、step 致命失败等，均为调度内核打磨）。无 GitHub Release/Tag，采用主干滚动发布，官方伴有 Netflix Tech Blog 系列文章与 AWS re:Invent 分享，属**长期活跃、官方背书**的开源基础设施（直接事实）。

### 综合判定：作为「Stateful 中心调度器」范式的教科书级样本，但作为 Local 优先 / Agent 工作机产品不适配

作为 GLNT-10「Agent 如何持续获得工作并可治理」议题下的**调度机制参考**，Maestro 价值极高：完整的持久任务对象、状态机、依赖解析、run strategy 排队、分布式队列租约、事件驱动触发、rollup/aggregated view 可观测，都是中心调度的成熟工程范本，建议列为**架构参考、非落地候选**。作为产品选型，因其服务端云原生形态、无 PC 工作机形态、调度对象为数据/ML 批作业而非 AI Agent，判定为**不适配 Local 优先与工作机接入要求**，需明确标注为选型缺陷。

## 调研目标

- 判定 `Netflix/maestro` 是否具备 Stateful 调度能力，还是仅为任务执行宿主。
- 厘清其工作对象模型、任务关系、生命周期与调度决策机制。
- 判断运行形态（本地/云端/混合）、持久化根源依赖与 Windows/macOS 工作机适配。
- 评估其对 GLNT-10「Agent 持续获得并推进工作」议题的参考价值与选型缺陷。

## 产品调研

### 产品定位与目标用户

- **一句话定位**：Maestro 是 Netflix 开源的通用工作流编排器，以 WAAS 形式为数据/ML 工作流（数据管道、模型训练、A/B 实验、回填等）提供大规模、高可靠、可水平扩展的调度与执行编排。
- **目标用户**：Netflix 内部数据科学家、数据工程师、ML 工程师、软件工程师、内容制作者与业务分析师；对外为需要大规模批处理/ML 编排的工程团队。
- **前身与动机**：替代旧编排器 Meson——Meson 单主节点、只能垂直扩容，在午夜 UTC 峰值触发时性能吃紧；工作流量逐年翻倍促成 Maestro 以分布式、无状态微服务重建（[ByteByteGo/Netflix 博客](https://blog.bytebytego.com/p/how-netflix-orchestrates-millions)，直接事实）。

### 核心流程

1. 用户以 YAML / Python / Java DSL 或 UI 定义工作流（DAG + step + 依赖 + 参数），经 `POST /api/v3/workflows` 推送、版本化持久化；
2. 通过手动 `actions/start`、时间调度（cron/间隔）或信号事件触发 workflow instance；
3. 引擎按 RunStrategy 决定实例排队/并发，创建 step instance，评估参数（SEL），解析依赖与 signal gating；
4. flow engine + queue 分布式推进各 step（Spark/notebook/docker/k8s 等 step type 提交到对应运行时），状态持久化到 CockroachDB/Postgres；
5. step 完成可发 output signal 解锁下游、触发其他 workflow；失败按 retryable 自动重试或按 failure mode 处理；
6. rollup/aggregated view 汇总多层执行状态，事件经 Kafka/SNS 外发供下游系统消费。

### 功能地图与边界

- **调度内核**：DAG 引擎、step 状态机、RunStrategy 排队策略、foreach（可嵌套，百万级 step）、subworkflow、条件分支、step template、SEL 参数注入。
- **触发**：时间调度（at-least-once + 去重）、信号服务（事件触发 + step gating + signal lineage）。
- **执行抽象**：预定义 step type（Spark、SQL、数据搬运等）、Notebook 执行、Docker、Kubernetes 批任务。
- **可观测**：timeline 视图、aggregated view（跨 run 状态汇总）、rollup（跨 subworkflow/foreach 递归展平统计）、内部/外部事件发布。
- **接入**：REST API、YAML/Python/Java DSL、Python SDK、Web UI、Metaflow 集成。
- **明确不含**：AI Agent 会话/handoff、人-Agent 协作、桌面客户端、项目/Issue/Plan 管理容器（非本产品职责）。

## 技术架构调研

### 系统全貌与运行形态

三类无状态微服务 + 外置分布式 SQL + 分布式队列的云原生集群（[Netflix 博客](https://blog.bytebytego.com/p/how-netflix-orchestrates-millions) + 仓库模块，直接事实 + 架构推导）：

| 组件 | 职责 | 运行位置 |
| --- | --- | --- |
| Workflow Engine（`maestro-engine`） | 工作流全生命周期：定义/版本/元数据、step instance 执行、foreach/条件/subworkflow、step template、SEL、timeline | 服务端集群 |
| Time-Based Scheduling（`maestro-timetrigger`） | cron/间隔触发，at-least-once + 引擎去重 | 服务端（AWS 用 SQS delay-queue） |
| Signal Service（`maestro-signal`） | 事件驱动触发、step gating、output signal、signal lineage | 服务端集群 |
| Flow Engine（`maestro-flow`） | 单机内存内推进并行任务列表的高优化引擎（Java 虚拟线程），替代 Conductor | 服务端进程内 |
| Queue（`maestro-queue`） | DB 表 + 内存队列，分布式并行/抢占/租约 | 服务端 + DB |
| Database（`maestro-database`） | JDBC 持久化抽象层（CockroachDB / Postgres） | 外置分布式 SQL |
| Server（`maestro-server`） | Spring Boot 应用，暴露 `/api/v3` REST | 服务端 |
| DSL（`maestro-dsl`）/ SEL（`netflix-sel`） | 工作流定义模型/解析 + 安全表达式语言 | 服务端 |
| K8s / AWS / Extensions | K8s 批任务提交 / SNS·SQS 事件 / foreach flattening | 服务端 + 外部基础设施 |

- **范式判定**：中心化特权调度服务（无状态微服务 + 外置强一致 DB + 分布式队列），是分布式 Stateful 调度器，非分布式任务池、非 Stateless/Serverless 消费者、非任务执行宿主。

### 主要组件与核心链路

**核心链路（signal 触发 + gating，最能解释系统协作）**：外部/内部 signal 经 `POST /api/v3/signals` 进入 → signal service 匹配订阅条件（含 join key）触发 workflow instance，或解锁处于 `WAITING_FOR_SIGNALS` 的 step → 引擎按 RunStrategy 检查后置 `IN_PROGRESS` → flow engine 经 queue 分布式推进 step，评估 SEL 参数、申请 tag permit → step 提交到对应运行时（Spark/K8s/docker/notebook）→ 状态与 outputs 落 DB，step 发 output signal 解锁下游 → rollup 汇总、事件经 Kafka/SNS 外发。跨进程/跨机器边界：REST 入口、DB 状态面、队列、外部消息系统、K8s/执行运行时（架构推导 + 源码事实）。

### 主要依赖

- **运行时硬依赖**：JVM（Java 21）、分布式 SQL（生产 CockroachDB / 开源 Postgres 17）、内部队列（DB 表 + 内存）；三者为调度一致性刚需，不可去除。
- **可选/环境依赖**：Kubernetes（K8s step 运行时）、AWS SNS·SQS（时间触发 delay-queue、事件外发）、Kafka（外部事件）、Redis（AWS compose 示例含）、Metaflow（集成）。
- **构建依赖**：Gradle、Docker、Flyway（DB 迁移）、Lombok、Spring Boot。

### 接口形态

REST（`/api/v3`，workflow/instance/step/signal 管理与触发）为主；辅以 Python SDK（`maestro-sdk`）、YAML/Python/Java DSL、Web UI、Metaflow；事件出向 Kafka/SNS。无面向 PC 工作机的客户端协议或桌面 IPC。

### 持久化方式

全部工作对象（workflow 定义/版本、workflow instance、step instance、run strategy、tag permit、template、flow、queue、signal）持久化到分布式 SQL；生产 CockroachDB，开源 Postgres 17，Flyway 管理各模块 `db/migration/postgres` 迁移。状态由中心 DB 拥有，服务无状态、可水平扩容，重启后从 DB 恢复。

### 通信方式

- 服务间：分布式队列解耦 + DB 状态共享（非直接 RPC 强耦合）。
- 触发：时间调度（轮询/delay-queue）+ 信号（事件驱动）。
- 对外：REST 请求/响应 + Kafka/SNS 事件发布（异步）。
- 队列采用 `worker-num` + `scan-interval` 扫描 + `ownership-timeout` 租约回收模式。

### 部署形态

#### 工作机安装（Windows / macOS）

- **Windows**：无原生安装方式；仅能作为开发机装 JDK 21 + Gradle + Docker 后 `gradlew bootRun`，属开发运行，非产品形态。
- **macOS**：同上，无 DMG/pkg/客户端；仅开发机 JVM 运行路径。
- **依赖、权限与网络**：需 Java 21、Gradle、Docker、可访问的 Postgres/CockroachDB，及（可选）K8s 集群、AWS SNS/SQS、Kafka；面向数据中心/云网络，非单机离线。
- **卸载**：无安装包即无标准卸载流程（停止 JVM 进程、清理 DB）。

#### 主体功能运行位置

- 主体功能运行在**服务端集群（数据中心/云）**，非 PC 本地。桌面/工作机无任何常驻组件。
- **Local 优先适配判断**：不满足。无本地优先形态，无工作机客户端，核心依赖分布式 SQL 与云基础设施——明确的 Local 优先选型缺陷。

#### 云端/服务端形态

- **职责边界**：中心化工作流编排与执行调度平台，拥有全部任务状态与调度决策。
- **核心组件**：Workflow Engine / Time-Trigger / Signal Service / Flow Engine / Queue / 分布式 SQL / REST Server。
- **主要依赖**：JVM、CockroachDB(生产)/Postgres(开源)、K8s、SNS·SQS、Kafka。
- **接口/持久化/通信**：REST + DSL/SDK/UI；分布式 SQL 持久化；队列 + DB 状态 + 事件消息通信。
- **部署/托管**：Spring Boot 微服务集群，K8s/AWS 环境；开源可自托管但仍是服务端集群，非工作机。
- **数据/权限/网络边界**：任务定义与运行数据集中存于中心 DB；REST 以 `user` header 标识发起者（示例）；面向内网/云网络，断开中心 DB 或队列则调度不可用。

## 未决项与证据边界

- **未做运行验证**：未实际部署/触发工作流，状态机与队列行为基于源码定义与官方博客推导，非运行时抓包。
- **生产与开源差异**：CockroachDB 为生产环境（博客口径），开源默认 Postgres；Netflix 内部完整部署拓扑、扩缩容与高可用细节未在开源仓库完全暴露，属未决。
- **鉴权/权限模型**：开源示例以 `user` header 标识用户，完整的 Netflix 内部认证/授权/多租户模型未开源，未决。
- **`maestro-flow`/`maestro-queue` 迁移脚本**：按目录树存在（`V202408312300__add_flow_tables.sql`、`V202503222300__add_queue_tables.sql`），本次以 raw 直取时返回 404（路径/分支缓存差异），未逐行核验其列定义；不影响「DB 表 + 内存队列」与「flow tables 持久化」的结论（README + 目录树已直接佐证）。
- **快照边界**：stars/forks/issue 数、主干代码持续变化；结论以 2026-07-31 `main` 快照为准。

## 后续验证建议

- 若需评估「把 AI Agent 执行封装为 Maestro step type」的可行性，应实证：Agent 长时运行、人审 gating（可复用 signal/breakpoint 机制）、Agent 会话状态与 Maestro step 状态的映射边界。
- 若关注调度内核借鉴，可运行验证 RunStrategy 各模式、foreach 展平、signal lineage、queue 租约回收在 Postgres 单机下的实际行为。
- 明确该产品在本轮选型中的定位：**架构机制参考**而非工作机落地候选，避免与 RunMaestro/Maestro（同名桌面 Agent 编排器）混淆。