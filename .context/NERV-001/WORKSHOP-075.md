# Leantime 技术产品调研

> updated_by: Qoder - Claude-Sonnet
> updated_at: 2026-08-10 16:58:00
> evidence_window: 2026-08-10；目标版本 v3.9.8（2026-07-08）；分支 `master`；运行时 PHP 8.2/Laravel + MySQL 8.4

## 交付结论

### Leantime 是目标导向的项目管理系统，不是 Stateful 任务调度器

已确认：Leantime 的核心持久对象是 Ticket（工单/任务）、Sprint、Milestone、Goal（目标画布）、Idea、Timesheet、Wiki、Calendar、各类 Canvas（蓝图/逻辑模型/利益相关者）、Comment、Notification，对象域以 DDD 结构分布于 [app/Domain](https://github.com/Leantime/leantime/tree/master/app/Domain)（Tickets/Sprints/Goalcanvas/Ideas/Timesheets/Wiki/Canvas 等模块）。它是本批六个产品中对象模型第二丰富的（仅次于 Taiga），但**没有** Agent、Worker、Run、执行归属（调度义）、任务队列（业务义）或任务间 DAG。

架构判断：Leantime 有任务对象、状态机、人工分配、Sprint/里程碑、估算（故事点/工时），以及**单前置任务链接**（dependingTicketId），但这些都是**人工驱动的任务跟踪**，不是系统依据依赖/状态/策略持续推进任务并选择执行者的调度。它不满足本专项 Stateful 调度判定基准，应归类为**目标导向的项目协作管理平台**（面向非项目经理，强调目标对齐与无障碍设计）。

### Ticket 有单前置任务链接，但仅用于分组展示与防环，不驱动自动推进

已确认：[Tickets 模型](https://github.com/Leantime/leantime/blob/master/app/Domain/Tickets/Models/Tickets.php)含 `headline`、`type`、`editorId`（负责人）、`userId`（分配）、`priority`、`dateToFinish`（截止）、`status`（状态机，默认 3）、`storypoints`、`hourRemaining`、`sprint`、`milestoneid`，以及 **`dependingTicketId`**（单前置任务 ID）。

关键判定（[Tickets Service](https://github.com/Leantime/leantime/blob/master/app/Domain/Tickets/Services/Tickets.php) 与 [Repository](https://github.com/Leantime/leantime/blob/master/app/Domain/Tickets/Repositories/Tickets.php)）：
- `dependingTicketId` 是**单前置任务链接**（链式：B、C 都可依赖 A；Repository 用 `leftJoin parent on dependingTicketId` 取父任务标题，并有子任务聚合查询）。
- 其业务用途是**分组展示**（`groupBy === 'dependingTicketId'`）、按 `parentHeadline` 显示父子层级、以及**依赖链防环**（沿链向上遍历检测循环）。
- **没有发现"前置完成后自动解锁/推进下游任务"的可执行性判定逻辑**。它是组织/展示关系，不是调度依赖。

注意：[app/Core/Resources/Models/Dependency.php](https://github.com/Leantime/leantime/blob/master/app/Core/Resources/Models/Dependency.php) 名为"Dependency"，但实为**外部承诺**（partnership/grant/supplier 等利益相关者风险项），用于画布报告，**不是任务间前置依赖**。

### 状态机与分配是人工驱动，无执行分派

已确认：Ticket 的 `status` 是项目可配置状态（Status 域），状态迁移由用户在看板/列表上手动驱动；`editorId`/`userId` 是**人工分配**（把人指派到工单），不是系统选择执行者；工单不"执行"，只是被跟踪。无多执行者抢占或系统自动分派。Sprint/Milestone 是迭代/里程碑容器，非依赖调度。

### Laravel Queue 与 poor man's cron 是后台作业，不是任务执行调度

已确认：[Queue 域](https://github.com/Leantime/leantime/tree/master/app/Domain/Queue/Workers)的 Workers 为 DefaultWorker、**EmailWorker**、**HttpRequestWorker**——承载发邮件、发 HTTP/webhook 等**后台作业**。[Cron 域](https://github.com/Leantime/leantime/blob/master/app/Domain/Cron/Services/Cron.php)是 **"poor man's cron"**（HTTP 响应后经 console kernel 跑 Laravel `schedule:run`），驱动 Laravel 调度器（通知/报告/提醒等）。

架构判断：Queue 与 Cron 是应用基础设施层的异步/定时后台作业，不判断任务依赖、不选择执行者、不维护业务任务的执行归属或失败恢复。与本专项要找的 Stateful 调度能力正交。

### 双容器自托管，无原生桌面应用，官方 SaaS 并存，AGPL-3.0 强约束

已确认：Leantime 采用 PHP/Laravel + MySQL 架构，官方 [.docker/docker-compose.yml](https://github.com/Leantime/leantime/blob/master/.docker/docker-compose.yml) 编排 `leantime_db`（mysql:8.4）+ `leantime`（应用）双容器，卷 db_data/userfiles/public_userfiles/plugins/logs。客户端为浏览器，无 Windows/macOS/Linux 原生桌面应用。运行形态为自托管（AGPL-3.0）与官方 SaaS（leantime.io）并存；据官方支持文档，**开源版功能等同云端 Core 计划**（无功能阉割），云端有更高付费档（插件/支持）。

Local 优先判断：架构原则适配——自托管实例数据完全本地（MySQL + 文件卷），无云端强依赖；官方 SaaS 为可选。双容器部署轻量（官方称可跑在 $5 VPS）。选型缺陷是：无原生桌面应用；**AGPL-3.0 是强 copyleft**——若将 Leantime 作为网络服务集成进商用产品并修改，需开源衍生作品，商用私有化约束比 MPL（Taiga）更严。

### MySQL 是核心硬依赖，无独立队列/实时服务

已确认：[composer.json](https://github.com/Leantime/leantime/blob/master/composer.json) 依赖 PHP ^8.2、laravel/framework、ext-mysqli/ext-pdo_mysql、doctrine/dbal、laravel/sanctum（API 认证）、laravel/socialite（SSO）、sentry、laravel/mcp。MySQL 是唯一系统记录（所有业务对象）。Queue 用 Laravel 队列（数据库/Redis 驱动），无独立 RabbitMQ/events 服务（区别于 Taiga）。

架构判断：MySQL 是不可轻量剥离的核心依赖。架构比 Taiga 简洁（双容器，无独立消息代理/实时服务），但比单容器产品（tududi/TaskTrove）多一个数据库服务。实时协作能力弱于 Taiga（无 WebSocket 实时推送，靠轮询/刷新）。

## 调研目标

- 判断 Leantime 是否持久拥有工作对象、执行归属和可恢复的 Stateful 调度状态
- 明确 Ticket、Sprint、Milestone、Goal、Idea 的实际对象模型及任务关系与生命周期
- 核验状态机、人工分配、单前置任务链接、Queue/Cron 是否构成任务调度或执行分派
- 分别评估 Windows、macOS 工作机接入及本地、云端运行形态
- 识别核心依赖、标准接入面和私有化改造范围（含 AGPL-3.0 约束）

## 产品定位与核心流程

### 定位与用户

Leantime 是 AGPL-3.0 许可的开源**目标导向项目管理系统**，面向非项目经理（small teams、创业公司），强调目标对齐（goals focused）与无障碍设计（为 ADHD、自闭症、阅读障碍用户优化）。提供官方 SaaS 与自托管。定位是降低项目管理门槛、以目标驱动执行的协作平台。

### 端到端流程

1. 用户注册/登录，创建 Project，配置状态机、角色、画布。
2. 在 Goalcanvas 定义目标，拆为 Milestone（里程碑）与 Sprint；在 Ideas/Canvas 收集想法与策略。
3. 建 Ticket（工单），设类型/优先级/状态/截止/故事点/工时，分配成员（editorId/userId），可设单前置任务（dependingTicketId）与里程碑/Sprint。
4. 团队在看板/列表/日历/甘特上跟踪，迁移状态、记工时（Timesheets）、讨论（Comments）。
5. 后台经 Laravel Queue 发邮件/HTTP webhook，poor man's cron 跑通知/报告/提醒。
6. 数据经 REST API（sanctum 认证）读写；支持 SSO（OIDC/LDAP）、插件扩展。

## 工作对象与调度模型

### Ticket、Sprint、Milestone、Goal、Idea 映射

| 对象 | 结论 | 持久化与归属 | 调度影响 |
| --- | --- | --- | --- |
| Goal (Goalcanvas) | 一等持久目标对象 | MySQL | 目标对齐层，非调度对象 |
| Milestone / Sprint | 持久迭代/里程碑容器 | 含起止，聚合 Ticket | 迭代边界，非依赖调度 |
| Ticket | 一等持久工作对象 | 状态机、分配、估算、单前置链接、里程碑/Sprint | 核心工作项，但状态人工迁移，无执行归属（调度义） |
| Idea / Canvas | 持久想法/策略对象 | MySQL | 前期规划，非调度 |
| Timesheet | 持久工时记录 | 关联 Ticket/User | 工时跟踪，非调度 |
| 任务依赖 | 单前置链接（dependingTicketId） | 链式 + 防环 + 分组展示 | 组织/展示关系，不驱动自动推进 |
| Agent / Run / 执行队列 / DAG | 当前证据未发现 | 无对应模型 | 不构成调度对象模型 |

### 任务关系、可执行性与状态所有者

Leantime 的状态机由项目配置（Status 域），状态迁移由用户手动驱动。没有"系统把任务从等待推进到可执行"的调度角色。Ticket 间通过 `dependingTicketId` 形成单前置链（含防环），用于分组/层级展示，但**没有依赖满足自动解锁、并行分支或 DAG 的可执行性判定**。无多执行者抢占或系统自动分派。

### 自动化与定时机制

无业务任务自动化规则引擎。poor man's cron 跑 Laravel 调度器（通知/报告/提醒），Queue Workers 处理邮件/HTTP webhook 后台作业。这些是后台基础设施，不是任务调度。

## 技术架构

### 系统全貌

```text
Browser (SPA/服务端渲染)
      | HTTPS REST + 页面
      v
Web Server (nginx/Apache) -> PHP-FPM (Laravel)
      | SQL (pdo_mysql / doctrine)
      v
MySQL 8.4 (唯一系统记录)
      ^
      |-- Laravel Queue (Email/HttpRequest Workers, DB/Redis 驱动)
      |-- poor man's cron (HTTP 响应后跑 schedule:run)
```

### 持久化与并发

所有业务对象持久化于 MySQL（Laravel Eloquent/doctrine，迁移在 database/）。附件/插件/日志独立卷。Queue 用 Laravel 队列（数据库或 Redis 驱动），无独立消息代理。无业务任务队列或调度状态。并发靠 MySQL 事务与 Laravel 机制。

### 接口与鉴权

| 边界 | 主要接口 | 鉴权/约束 |
| --- | --- | --- |
| Browser ↔ Server | 页面 + REST API | Laravel 会话/sanctum token；项目级权限 |
| 第三方 ↔ Server | REST API + webhooks（HttpRequestWorker） | sanctum token；SSO（OIDC/LDAP/Socialite） |
| Server ↔ DB | Eloquent / doctrine DBAL | MySQL |
| Server ↔ 异步 | Laravel Queue（DB/Redis） | 内部 |
| Server ↔ 外部 | CsvImport、Connector、Plugins、laravel/mcp | 插件/集成机制 |

### 数据边界

自托管实例全部数据存于本地 MySQL 与文件卷，无强制云端回传（sentry 可配）。官方 SaaS 数据位于其托管环境。断网不影响本地实例核心流程。

## 部署与工作机支持

### macOS

| 项目 | 结论 |
| --- | --- |
| 官方安装 | 无原生 .app/.dmg。Docker Compose（.docker/docker-compose.yml，双容器）或源码（PHP 8.2 + Composer + Node 前端构建） |
| 运行入口 | `docker compose up -d`（.docker 目录），浏览器访问；源码需起 PHP + MySQL |
| 依赖 | Docker Desktop；或 PHP 8.2 + MySQL 8 + Composer + Node（源码） |
| 权限 | 容器内运行，卷挂 db/userfiles/plugins/logs；源码视环境而定 |
| 网络 | 局域网自托管可离线；公网需反代配 TLS |
| 升级 | 拉新镜像，跑迁移；注意版本间迁移 |
| 卸载 | 官方未提供一键卸载；`docker compose down -v` 删容器与卷为合理推导 |

macOS 无原生工作机应用，只能浏览器访问或本地跑双容器 Docker。

### Windows

| 项目 | 结论 |
| --- | --- |
| 官方安装 | 无原生 .exe 安装器。Docker Desktop（双容器）或 WSL/源码 |
| 运行入口 | 同 macOS：`docker compose up -d` 后浏览器访问 |
| 依赖 | Docker Desktop（Windows）；或 WSL + PHP/MySQL/Composer/Node |
| 权限 | 容器内运行；源码视环境而定 |
| 网络 | 局域网自托管可离线；公网需反代配 TLS |
| 升级 | 同 macOS |
| 卸载 | 无官方卸载流程；删容器/卷/源码目录 |

Windows 同样无原生工作机应用，依赖 Docker Desktop 或 WSL。双容器比 Taiga 的 9 服务轻量。

### 自托管服务器与官方 SaaS

生产为 Docker Compose 双容器（leantime + mysql），资源与运维成本低于 Taiga，高于单容器产品。官方 SaaS（leantime.io）提供托管，开源版功能等同云端 Core 计划，更高档含插件/支持。**AGPL-3.0 是强 copyleft**：自托管内部使用自由，但若修改并作为网络服务对外提供（尤其商用集成），需以 AGPL 开源衍生作品——这是六个产品中最严的许可证约束（比 MPL 的 Taiga 更严）。

## 接入与改造边界

### 最小接入路径

1. 读写 Goal/Milestone/Sprint/Ticket/Idea/Timesheet 用 REST API（sanctum 认证），复用项目权限，不应绕过服务器直写 MySQL。
2. 事件外发用 webhooks（HttpRequestWorker）对接外部系统。
3. 若要把 Leantime 当"工作对象来源"接入外部调度：外部系统经 REST API 读取 Ticket（含状态机/分配/单前置链接），自行维护任务依赖与执行归属；Leantime 的 dependingTicketId 可作依赖线索，但其本身不驱动推进。

### 私有化与依赖剥离

| 组件 | 性质 | 改造判断 |
| --- | --- | --- |
| MySQL | 核心硬依赖 | 全部业务对象持久化，不可轻量替换 |
| Laravel Queue | 后台作业 | 邮件/HTTP webhook，DB/Redis 驱动，非业务调度 |
| poor man's cron | 定时后台 | 通知/报告/提醒，可替换为系统 cron |
| Plugins / Modulemanager | 扩展机制 | 可扩展功能，AGPL 约束衍生 |
| laravel/mcp | MCP 集成 | 可作 AI/Agent 接入面（值得关注的现代化接口） |

Leantime 没有"调度最小核心职责"可剥离——它本就不含执行调度中心。若目标是 Stateful 调度，Leantime 只能作为工作对象（Goal/Ticket/Sprint）的来源或协作可视化层，任务依赖（超出单前置展示）、执行归属、失败恢复都需外部系统另行实现。**AGPL-3.0 是私有化的关键约束**：商用集成并修改需开源衍生，比 MPL 更严，需法务评估。

### 扩展约束

PHP/Laravel 单体 + MySQL 是主要架构形态；水平扩展靠 PHP-FPM 扩容 + MySQL 主从，无独立实时/队列服务（实时协作弱）。对象模型有单前置链接但无 DAG，不构成可扩展的执行编排底座。其目标导向定位不适合直接改造为多执行者调度平台。laravel/mcp 提供 MCP 接口，是六个产品中较突出的 AI/Agent 接入面。

## 维护状态、开源与公开反馈

仓库为 [AGPL-3.0 许可](https://github.com/Leantime/leantime/blob/master/LICENSE)，主分支 `master`，主语言 PHP，2015 年 1 月创建（成熟项目）。截至 2026-08-10：11292 stars（本批最高）、1099 forks、321 open issues，`pushed_at` 2026-08-05（近期活跃），最新 release v3.9.8（2026-07-08），版本节奏稳定（v3.9.x 系列密集迭代）。社区活跃，文档（安装/API/插件）与官方支持完善。有 CLAUDE.md（AI 辅助开发配置）与 laravel/mcp，显示对 AI/Agent 集成的关注。

公开反馈以 GitHub Issues、Reddit r/selfhosted 为主（如开源版功能完整性、轻量部署），个案不代表整体，本报告不据此外推稳定性结论。

## 未决项与证据边界

- 本次未实际部署或运行 Leantime；看板/甘特/日历/工时/画布行为来自官方文档与定点源码证据，未在目标环境复现。
- "无任务自动推进/执行分派"是基于 Tickets 模型、Service/Repository 中 dependingTicketId 用法、Queue Workers、Cron 的定点证据之"未发现"，非对未来版本的永久否定。
- dependingTicketId 是否在某些 UI/通知中影响"可开始"提示（非强制推进）未逐一核验；当前证据显示其用于分组/层级/防环。
- 官方未提供 Windows/macOS 原生应用与一键卸载说明。
- 官方 SaaS 的数据驻留、SLA、付费档与自托管的逐项功能差异（官方称开源版等同 Core 计划）未逐项核验。
- AGPL-3.0 在具体商用集成/私有化场景的合规边界需法务确认，本报告不构成法律意见。
- laravel/mcp 的能力覆盖面（可读/可写对象、工具集）未逐一核验。
- 状态机的允许迁移约束、权限矩阵细节、插件生态成熟度未逐一核验。

## 后续验证建议

1. 在干净 macOS 与 Windows（Docker Desktop）环境各执行一次双容器部署、备份/恢复与升级，记录资源占用与运维复杂度。
2. 验证 REST API 对 Goal/Milestone/Sprint/Ticket/Idea/Timesheet 的读写覆盖面、状态机迁移约束与权限，确认是否足以支撑外部系统读取工作对象。
3. 核验 dependingTicketId 在 UI/通知中的实际语义（是否仅展示/分组，或影响"可开始"提示），确认其不构成自动推进。
4. 评估 laravel/mcp 接口作为 AI/Agent 接入面的能力（可读/可写对象、工具集），这是 Leantime 相对其他产品的差异化集成点。
5. 若拟商用集成或私有化修改，先就 AGPL-3.0 合规边界（网络服务开源义务）咨询法务，再决定自托管改造或联系官方获取商业许可。
6. 若需依赖驱动编排或执行分派，明确 Leantime 无原生能力（单前置链接不驱动推进），须由外部系统实现。
