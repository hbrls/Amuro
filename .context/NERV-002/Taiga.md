# Taiga 技术产品调研

> updated_by: Qoder - Claude-Sonnet
> updated_at: 2026-08-10 16:50:00
> evidence_window: 2026-08-10；目标版本 6.10.2（taiga-back，main 分支含 django17 迁移标签）；分支 `main`；运行时 Python/Django + PostgreSQL + RabbitMQ + Celery + Angular

## 交付结论

### Taiga 是敏捷项目管理平台，不是 Stateful 任务调度器

已确认：Taiga 的核心持久对象是 Epic、UserStory、Task、Issue、Milestone（Sprint）、Wiki、Swimlane、Points（故事点）、自定义属性、附件、时间线、通知，对象域清晰分布于 [taiga/projects](https://github.com/taigaio/taiga-back/tree/main/taiga/projects)（epics/userstories/tasks/issues/milestones/wiki 等子 app）。它是本批五个产品中对象模型最丰富的一个，但**没有** Agent、Worker、Run、执行归属（调度义）、任务队列（业务义）、任务间依赖或 DAG。

架构判断：Taiga 有真正的任务对象、可配置状态机、人工分配与阻塞标记，但这些都是**人工驱动的任务跟踪**，不是系统依据依赖/状态/策略持续推进任务并选择执行者的调度。它不满足本专项 Stateful 调度判定基准，应归类为**敏捷项目协作管理平台**。

与前四个产品对比：Taiga 的对象模型最完整（Epic→UserStory→Task 层级、Sprint、故事点、可配置状态机），但同样无任务依赖与执行调度；其 Celery 是后台作业队列（通知/webhook/导入导出/遥测），与业务任务调度无关。

### Task/UserStory 有可配置状态机与人工分配，但无任务间依赖，阻塞仅是手动标记

已确认：[Task 模型](https://github.com/taigaio/taiga-back/blob/main/taiga/projects/tasks/models.py)含 `user_story`（隶属用户故事）、`status`（ForeignKey 到项目级 TaskStatus，`is_closed` 判关闭）、`milestone`（Sprint）、`assigned_to`（分配给用户）、`owner`、`finished_date`，并混入 BlockedMixin、Watched、Tagged、DueDate、OCC（乐观并发控制）。[UserStory 模型](https://github.com/taigaio/taiga-back/blob/main/taiga/projects/userstories/models.py)另有 `points`/`role_points`（故事点）、`assigned_users`（多分配）、`generated_from_issue`/`generated_from_task`（来源追溯）、`swimlane`。

关键判定：
- **状态机由项目配置**（UserStoryStatus/TaskStatus 等），状态迁移由用户手动驱动，不是系统依据依赖自动推进。
- **`assigned_to`/`assigned_users` 是人工分配**（把人指派到任务），不是系统选择执行者；任务不"执行"，只是被跟踪。
- **阻塞是手动标记**：[BlockedMixin](https://github.com/taigaio/taiga-back/blob/main/taiga/projects/mixins/blocked.py) 仅 `is_blocked` 布尔 + `blocked_note` 文本，pre_save 在取消阻塞时清空 note。它没有指向"前置对象"的依赖边，也没有自动解锁。
- **无任务间前置依赖、并行分支或 DAG**；Epic→UserStory→Task 是包含/层级关系，不是可执行性依赖。

### Celery 是后台作业队列，不是任务执行调度

已确认：[taiga/celery.py](https://github.com/taigaio/taiga-back/blob/main/taiga/celery.py) 用 `autodiscover_tasks` 收集各 app 的异步任务，beat_schedule 中唯一的周期任务是 `send_telemetry`（每日遥测，`ENABLE_TELEMETRY` 可关）。Celery 承载通知发送、webhook 触发、导入导出、遥测等**后台作业**，broker 为 RabbitMQ。

架构判断：Celery 在 Taiga 中是应用基础设施层的异步任务队列（"把耗时操作挪到后台"），不是"推进业务任务生命周期"的调度器。它不判断任务依赖、不选择执行者、不维护业务任务的执行归属或失败恢复。这与本专项要找的 Stateful 调度能力正交。

### 多服务自托管架构，无原生桌面应用，官方 SaaS 并存

已确认：Taiga 采用多服务架构，官方 [taiga-docker](https://github.com/taigaio/taiga-docker) 编排 9 个服务：`taiga-db`（postgres:12.3）、`taiga-back`（Django REST API）、`taiga-async`（Celery worker）、`taiga-async-rabbitmq`（Celery broker）、`taiga-front`（Angular SPA）、`taiga-events`（Node WebSocket 实时服务）、`taiga-events-rabbitmq`（events broker）、`taiga-protected`（附件保护）、`taiga-gateway`（nginx 网关）。

客户端为浏览器（Angular SPA），无 Windows/macOS/Linux 原生桌面应用。运行形态为自托管（MPL-2.0）与官方 SaaS（tree.taiga.io）并存。

Local 优先判断：架构原则适配——自托管实例数据完全本地，无云端强依赖；官方 SaaS 为可选。选型缺陷是：无原生桌面应用；且多服务架构（9 容器）部署与运维复杂度显著高于前四个产品（Wekan/4ga Boards 双/三容器，tududi/TaskTrove 单容器），最小部署成本高。

### PostgreSQL + RabbitMQ 是核心硬依赖，Redis 辅助，多服务协调复杂

已确认：[requirements.in](https://github.com/taigaio/taiga-back/blob/main/requirements.in) 含 Django>=3.2,<4、celery、gunicorn、psycopg2（PostgreSQL）、redis、django-pglocks（PG 行锁）。PostgreSQL 是唯一系统记录（所有业务对象），RabbitMQ 双实例分别服务 Celery 与 events，Redis 辅助（缓存/锁），django-pglocks 用于行级锁。

架构判断：PostgreSQL 与 RabbitMQ 是不可轻量剥离的核心依赖（持久化 + 异步/实时消息）。多服务协调（back/async/events/双 RabbitMQ/gateway）使部署、备份、升级、故障排查都显著复杂。这是功能完整敏捷平台的合理架构，但对"轻量自托管"诉求是负担。

## 调研目标

- 判断 Taiga 是否持久拥有工作对象、执行归属和可恢复的 Stateful 调度状态
- 明确 Epic、UserStory、Task、Issue、Sprint 的实际对象模型及任务关系与生命周期
- 核验可配置状态机、人工分配、阻塞标记、Celery 是否构成任务调度或执行分派
- 分别评估 Windows、macOS 工作机接入及本地、云端运行形态
- 识别核心依赖、标准接入面和私有化改造范围

## 产品定位与核心流程

### 定位与用户

Taiga 是 MPL-2.0 许可的开源敏捷项目管理平台，支持 Scrum 与 Kanban，面向敏捷团队管理 Epic、用户故事、任务、缺陷、Sprint、Wiki。由 Kaleidos 主导开发，提供官方 SaaS（tree.taiga.io）与自托管。定位是功能完整、可定制的敏捷协作平台。

### 端到端流程

1. 用户注册/登录，创建 Project（选 Scrum/Kanban 模板），配置状态机、角色、点数、自定义属性。
2. 建 Epic → UserStory（估点、分配、入 Sprint/milestone、泳道）→ 拆分为 Task；Issue 独立跟踪缺陷，可转为 UserStory/Task。
3. 团队在看板/列表上拖拽迁移状态（项目配置的状态机），标记阻塞（is_blocked + note）、分配成员、设到期日。
4. 实时协作经 taiga-events（WebSocket）广播；webhooks 外发事件；通知经 Celery 异步发送。
5. 数据经 REST API 读写；支持导入导出、第三方集成（hooks/external_apps）。

## 工作对象与调度模型

### Epic、UserStory、Task、Issue、Sprint 映射

| 对象 | 结论 | 持久化与归属 | 调度影响 |
| --- | --- | --- | --- |
| Epic | 一等持久容器 | Django/PostgreSQL | 顶层组织边界，跨 Sprint，非调度对象 |
| UserStory | 一等持久工作对象 | 状态机、故事点、多分配、Sprint、泳道、来源追溯 | 核心工作项，但状态人工迁移，无执行归属（调度义） |
| Task | 一等持久工作对象 | 隶属 UserStory，状态机、assigned_to、阻塞标记 | 被跟踪的工作，不"执行"，无依赖/队列 |
| Issue | 一等持久缺陷对象 | 独立状态机，可转 US/Task | 缺陷跟踪，非调度 |
| Milestone (Sprint) | 持久迭代容器 | 含起止日期，聚合 US/Task | 迭代边界，非依赖调度 |
| 任务依赖 / DAG / Agent / Run / 执行队列 | 当前证据未发现 | 无对应模型（BlockedMixin 是手动标记非依赖边） | 不构成调度对象模型 |

### 任务关系、可执行性与状态所有者

Taiga 的状态机由项目自定义（UserStoryStatus/TaskStatus/IssueStatus），状态迁移由用户在看板/列表上手动驱动。没有"系统把任务从等待推进到可执行"的调度角色。Epic⊃UserStory⊃Task 是包含层级，Issue 可转化，但**没有任务间前置依赖、阻塞边（依赖义）、并行分支或 DAG**。阻塞是手动标记，不影响可执行性，不自动解锁下游。无多执行者抢占或系统自动分派。

### 自动化与定时机制

无业务任务自动化规则引擎。Celery beat 仅每日遥测；其余 Celery 任务为通知、webhook、导入导出等后台作业。webhooks 与 events 提供事件外发与实时推送，是集成/协作机制，不是任务调度。

## 技术架构

### 系统全貌

```text
Browser (Angular SPA, taiga-front)
      | HTTPS REST + WebSocket (events)
      v
taiga-gateway (nginx)
      |---> taiga-back (Django REST API, gunicorn)
      |         | SQL (psycopg2, django-pglocks)
      |         v
      |     taiga-db (PostgreSQL 12)
      |         ^
      |---> taiga-async (Celery worker) -- taiga-async-rabbitmq (broker)
      |---> taiga-events (Node WebSocket) -- taiga-events-rabbitmq (broker)
      |---> taiga-protected (附件保护)
      +---> Redis (缓存/锁)
```

### 持久化与并发

所有业务对象持久化于 PostgreSQL（Django ORM + 迁移，OCC 乐观并发控制，django-pglocks 行锁）。附件经 taiga-protected 保护，静态/媒体数据独立卷。RabbitMQ 双实例分别支撑 Celery 异步与 events 实时。Redis 辅助缓存/锁。无业务任务队列或调度状态。

### 接口与鉴权

| 边界 | 主要接口 | 鉴权/约束 |
| --- | --- | --- |
| Browser ↔ Server | REST API + WebSocket（events） | Django 会话/token；项目级权限（permissions app） |
| 第三方 ↔ Server | REST API（完整文档）+ webhooks + external_apps | API token；webhook 签名 |
| Server ↔ DB | Django ORM（psycopg2） | PostgreSQL |
| Server ↔ 异步/实时 | Celery（RabbitMQ）、events（RabbitMQ） | 内网 broker |
| Server ↔ 外部 | importers（Trello/Jira 等）、hooks | 导入映射 |

### 数据边界

自托管实例全部数据存于本地 PostgreSQL 与媒体卷，无强制云端回传（遥测可经 ENABLE_TELEMETRY 关闭）。官方 SaaS（tree.taiga.io）数据位于其托管环境。断网不影响本地实例核心流程。

## 部署与工作机支持

### macOS

| 项目 | 结论 |
| --- | --- |
| 官方安装 | 无原生 .app/.dmg。Docker Compose（taiga-docker，9 服务）或源码（Python/Django + Node/Angular） |
| 运行入口 | `docker compose up -d`（taiga-docker），经 gateway 访问；源码需分别起 back/front/async/events |
| 依赖 | Docker Desktop；或 Python 3.x + PostgreSQL + RabbitMQ + Node（源码） |
| 权限 | 容器内运行，卷挂 db/media/static；源码视环境而定 |
| 网络 | 局域网自托管可离线；公网需 gateway 配 TLS（Caddy/Nginx） |
| 升级 | 拉新镜像，跑迁移；注意版本间迁移与 django17 迁移分支 |
| 卸载 | 官方未提供一键卸载；`docker compose down -v` 删容器与卷为合理推导 |

macOS 无原生工作机应用，只能浏览器访问或本地跑多服务 Docker。

### Windows

| 项目 | 结论 |
| --- | --- |
| 官方安装 | 无原生 .exe 安装器。Docker Desktop（taiga-docker）或 WSL/源码 |
| 运行入口 | 同 macOS：`docker compose up -d` 后浏览器访问 |
| 依赖 | Docker Desktop（Windows）；或 WSL + Python/Node/PostgreSQL/RabbitMQ |
| 权限 | 容器内运行；源码视环境而定 |
| 网络 | 局域网自托管可离线；公网需 gateway 配 TLS |
| 升级 | 同 macOS |
| 卸载 | 无官方卸载流程；删容器/卷/源码目录 |

Windows 同样无原生工作机应用，依赖 Docker Desktop 或 WSL。多服务架构在 Windows 上的资源占用与运维复杂度更高。

### 自托管服务器与官方 SaaS

生产为 Docker Compose 多服务（9 容器），资源与运维成本在本批产品中最高。官方 SaaS（tree.taiga.io）提供托管，含免费与付费档。MPL-2.0 许可证允许自托管与修改（弱 copyleft，文件级），商用私有化比 fair-code（TaskTrove）宽松，但需遵守 MPL 文件级开源义务。

## 接入与改造边界

### 最小接入路径

1. 读写 Epic/UserStory/Task/Issue/Sprint 用完整 REST API（含 API 文档），复用项目权限，不应绕过服务器直写 PostgreSQL。
2. 事件外发用 webhooks / external_apps 对接外部系统。
3. 若要把 Taiga 当"工作对象来源"接入外部调度：外部系统经 REST API 读取 Epic/US/Task/Issue（含状态机/分配/阻塞标记），自行维护任务依赖与执行归属；Taiga 本身不提供依赖或调度状态。

### 私有化与依赖剥离

| 组件 | 性质 | 改造判断 |
| --- | --- | --- |
| PostgreSQL | 核心硬依赖 | 全部业务对象持久化 + 行锁，不可轻量替换 |
| RabbitMQ | 核心硬依赖 | Celery 异步 + events 实时双 broker，去除影响通知/实时 |
| Celery | 后台作业队列 | 承载通知/webhook/导入导出，非业务调度，但与异步链路耦合 |
| Redis | 辅助 | 缓存/锁，影响面较小 |
| taiga-events | 实时推送 | 可降级（关 events 失实时），不影响核心 REST |
| taiga-front | Angular SPA | 可替换前端，REST API 稳定 |

Taiga 没有"调度最小核心职责"可剥离——它本就不含执行调度中心。若目标是 Stateful 调度，Taiga 只能作为工作对象（Epic/US/Task/Issue）的来源或协作可视化层，任务依赖、执行归属、失败恢复都需外部系统另行实现。其多服务架构使私有化改造与运维成本显著高于单/双容器产品。

### 扩展约束

多服务协调（back/async/events/双 RabbitMQ/gateway）是主要扩展约束：水平扩展需处理 Celery worker 扩容、events 连接归属、RabbitMQ 集群化。对象模型无任务依赖，不构成可扩展的执行编排底座。其敏捷平台定位不适合直接改造为多执行者调度平台。

## 维护状态、开源与公开反馈

仓库（taiga-back）为 [MPL-2.0 许可](https://github.com/taigaio/taiga-back/blob/main/LICENSE)，主分支 `main`，主语言 Python，2021 年 4 月创建（Taiga 项目本身历史更久，前端/部署分列 taiga-front、taiga-docker 等仓库）。截至 2026-08-10：taiga-back 844 stars、300 forks、94 open issues，`pushed_at` 2026-08-04（近期活跃），最新 tag 6.10.2，并有 `django17-deploy-step1` 标签（正向 Django 新版本迁移）。由 Kaleidos 主导，社区成熟，文档（API/安装/用户）与社区论坛完善。

公开反馈以 GitHub Issues、Taiga 社区论坛为主（如 events 连接、反代配置等部署问题），个案不代表整体，本报告不据此外推稳定性结论。

## 未决项与证据边界

- 本次未实际部署或运行 Taiga；实时 events、webhook、Celery 异步、导入导出行为来自官方文档与定点源码证据，未在目标环境复现。
- "无任务依赖/执行分派"是基于 Task/UserStory 模型与 BlockedMixin 的定点证据之"未发现"，非对未来版本的永久否定；custom_attributes 可能允许用户自建"依赖"字段，但那不是原生依赖调度。
- 官方未提供 Windows/macOS 原生应用与一键卸载说明。
- 官方 SaaS（tree.taiga.io）的数据驻留、SLA 与自托管功能逐项等价性未核验。
- 状态机的允许迁移约束、权限矩阵细节、webhook 事件覆盖面未逐一核验。
- django17 迁移分支的完成度与对生产部署的影响未决。
- 多服务架构在高并发/多实例下的扩展边界（Celery 扩容、events 协调、RabbitMQ 集群）未验证。

## 后续验证建议

1. 在干净 macOS 与 Windows（Docker Desktop）环境各执行一次 taiga-docker 多服务部署、备份/恢复与升级，记录 9 服务编排的资源占用与运维复杂度。
2. 验证 REST API 对 Epic/UserStory/Task/Issue/Sprint 的读写覆盖面、状态机迁移约束与权限，确认是否足以支撑外部系统读取工作对象。
3. 若拟以 Taiga 为工作对象来源外接调度器，自行设计任务依赖与执行归属的映射（Taiga 无原生依赖字段），不要把 BlockedMixin 手动标记当作依赖边。
4. 若需依赖驱动编排或执行分派，明确 Taiga 无原生能力，须由外部系统实现；评估在其多服务架构上改造的成本，或仅将其作只读工作对象来源。
5. 若运维成本敏感，对比单/双容器产品的部署复杂度，评估 Taiga 多服务架构是否匹配团队运维能力（本报告不做竞品比较，仅提示架构复杂度差异）。
