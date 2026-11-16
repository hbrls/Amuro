# 4ga Boards 技术产品调研

> updated_by: Qoder - Claude-Sonnet
> updated_at: 2026-08-10 15:45:00
> evidence_window: 2026-08-10；目标版本 v3.3.13（2026-07-15 发布）；分支 `main`；运行时 Node.js + Sails.js + PostgreSQL

## 交付结论

### 4ga Boards 是实时协作看板，不是 Stateful 任务调度器

已确认：4ga Boards 的核心持久对象是 Project、Board、List、Card、Task、Label、Comment、Attachment、Notification、Action（活动流）、Archive、BoardTemplate。这些对象由 Sails.js 服务器持有，经 Knex.js 落入 PostgreSQL。模型目录（[server/api/models](https://github.com/RARgames/4gaBoards/tree/main/server/api/models)）中没有任何 Agent、Worker、Run、执行归属、任务队列、依赖、规则、触发器或调度对象。

架构判断：4ga Boards 没有"判断任务何时可执行、由谁执行、失败后如何继续"的任何机制。它的"实时"指多人协作的看板状态同步（WebSocket），不是任务执行的调度推进。它不满足本专项对 Stateful 调度的判定基准，应归类为**协作工作管理工具（实时看板）**，而非任务执行宿主或调度中心。

与 Wekan 相比，4ga Boards 在自动化维度更弱：它连看板规则自动化（trigger→action）和卡片间依赖都没有，只有看板、卡片与子任务的纯人工协作。

### Task 是 Card 的清单子项，仅有完成/未完成二态，无依赖与状态机

已确认：[Task 模型](https://github.com/RARgames/4gaBoards/blob/main/server/api/models/Task.js)的字段为 `position`、`name`、`isCompleted`、`completedAt`、`dueDate`、`cardId`（必填，指向 Card）、`memberUsers`（经 TaskMembership）。这是看板卡片下的**清单式子任务**（checklist item），只有"完成/未完成"二态，没有独立生命周期状态机，没有父子层级之外的依赖，没有执行归属。

[Card 模型](https://github.com/RARgames/4gaBoards/blob/main/server/api/models/Card.js)的字段为 `position`、`name`、`isCompleted`、`completedAt`、`description`、`dueDate`、`timer`（json，工时/计时）、`commentCount`、`boardId`、`listId`。**没有** `parentId`（卡片无父子层级）、**没有** 卡片间依赖字段、**没有** 阻塞关系。卡片的"状态"就是所在列表 + `isCompleted`。

关键判定：对象层级为 projects → boards → lists → cards → tasks，是纯粹的包含/组织关系。没有任何机制在前置项完成后自动推进或解锁后续项，也没有拓扑排序或 DAG。

### 无任何任务依赖、自动化规则或定时推进，仅有系统维护型 cron

已确认：对 server 端 631 个文件按依赖/调度/自动化/触发/规则/队列/任务等关键词扫描，仅命中两个 cron hook —— [cron-failed-auths-cleanup](https://github.com/RARgames/4gaBoards/tree/main/server/api/hooks/cron-failed-auths-cleanup)（清理失败认证记录）与 [cron-notifications-batching](https://github.com/RARgames/4gaBoards/tree/main/server/api/hooks/cron-notifications-batching)（通知批处理）。二者都是系统维护任务，与任务调度无关。

架构判断：4ga Boards 没有事件驱动的看板自动化、没有定时任务推进、没有任务队列或执行分派。任务/卡片的创建、移动、完成全部由用户手动操作，经 WebSocket 广播给其他在线客户端。它甚至不具备 Wekan 那样的规则引擎，是最纯粹的"人工实时看板"。

### 纯 Web 应用，无 Windows/macOS 原生桌面端，自托管与官方 SaaS 并存

已确认：4ga Boards 是"Web App 设计 —— 实时更新无需刷新页面"，客户端为浏览器，官网与仓库均未提供任何 Windows/macOS/Linux 原生桌面应用或安装包。部署方式为 Docker Compose（推荐）、Kubernetes（[helm-chart](https://github.com/RARgames/4gaBoards/tree/main/helm-chart)）、TrueNAS、Manual（Node.js + pnpm 源码）。

运行形态：开源自托管（MIT，免费）与官方托管 SaaS 并存。官网提供 Pro Trial（免费试用）、Pro（£6/用户/月）、Enterprise（£10/用户/月起，独立实例、VPN、99% uptime）、Enterprise On-Premise（自托管 + 商业支持）。FAQ 明确"为什么没免费层？因为开源可自托管，免费"。

Local 优先判断：架构原则适配——开源自托管实例的核心能力（看板、卡片、任务、实时协作、SSO）完整运行在本地，不强制依赖官方云服务。官方 SaaS 是可选托管，功能与自托管等价。选型缺陷是：无任何原生桌面应用，工作机只能作为浏览器客户端或自行部署服务器；对要求"工作机原生应用"的场景不友好。

### PostgreSQL 是核心持久化依赖，Redis 可选，无第二任务队列

已确认：默认 [docker-compose.yml](https://github.com/RARgames/4gaBoards/blob/main/docker-compose.yml) 含三服务 —— `db`（postgres:18-alpine）、`redis`（redis:8-alpine，appendonly + requirepass）、`4gaBoards`（ghcr.io/rargames/4gaboards，端口 3000→1337）。同时提供 [docker-compose-no-redis.yml](https://github.com/RARgames/4gaBoards/blob/main/docker-compose-no-redis.yml)，仅 postgres + 应用两服务。

Redis 用途经源码定位为：速率限制（[rate-limit-auth](https://github.com/RARgames/4gaBoards/blob/main/server/api/policies/rate-limit-auth.js)、[rate-limit-upload](https://github.com/RARgames/4gaBoards/blob/main/server/api/policies/rate-limit-upload.js)）、会话存储（[config/session.js](https://github.com/RARgames/4gaBoards/blob/main/server/config/session.js)）、sockets 配置（[config/sockets.js](https://github.com/RARgames/4gaBoards/blob/main/server/config/sockets.js)）。即 Redis 用于速率限制/会话/实时扩展，**可选**，不是任务队列。

架构判断：PostgreSQL 是唯一的核心持久化硬依赖（看板对象、用户、会话、活动流）。Redis 可省略（降级为无速率限制/本地会话）。系统没有 Redis Stream、Kafka 或任何持久任务队列；实时性由 Sails.js 的 WebSocket（sockets）提供。这与调度一致性无关——4ga Boards 没有需要队列或分布式锁保护的调度状态。

## 调研目标

- 判断 4ga Boards 是否持久拥有工作对象、执行归属和可恢复的 Stateful 调度状态
- 明确 Project、Board、List、Card、Task 的实际对象模型及任务关系与生命周期
- 核验是否存在任务依赖、自动化规则、定时推进或执行分派机制
- 分别评估 Windows、macOS 工作机接入及本地、云端运行形态
- 识别核心依赖、标准接入面和私有化改造范围

## 产品定位与核心流程

### 定位与用户

4ga Boards 是 MIT 许可的开源实时看板项目管理工具，主打简洁直观的 UI/UX、暗色模式、Markdown 编辑器、多语言（含中文）。定位是"无夸大复杂方案的本质项目管理工具"，面向个人、小团队到企业（营销、初创、开发、HR、会计等行业）。强调数据安全与开源自托管透明。

### 端到端流程

1. 用户注册/登录（支持 Google/GitHub/Microsoft/OIDC SSO），创建 Project，其下建 Board（可用模板或从 Trello/CSV 导入）。
2. Board 内建 List，List 内建 Card；Card 可填描述（Markdown）、成员、多个受让人、截止日期、timer 工时、标签、附件、评论；Card 下建 Task 清单子项。
3. 多人实时协作：拖拽移动卡片/列表、折叠列表与侧栏、过滤排序，变更经 WebSocket 实时广播，无需刷新。
4. 任务分派与跟踪：把 Card/Task 指派给成员、设优先级、跟踪进度与截止、控制工时成本；通知批处理推送。
5. 数据可导入导出（Trello JSON、CSV），可备份/恢复（boards-backup.sh / boards-restore.sh）。

## 工作对象与调度模型

### Project、Board、List、Card、Task 映射

| 对象 | 结论 | 持久化与归属 | 调度影响 |
| --- | --- | --- | --- |
| Project | 一等持久容器 | Sails.js/PostgreSQL 持有 | 顶层组织边界，不表达任务依赖或执行归属 |
| Board | 一等持久看板 | 同上；隶属 Project，可用模板 | 工作组织边界，非调度对象 |
| List | 持久看板列 | 同上；隶属 Board | 卡片状态的可视化分区，移动即状态变更 |
| Card | 一等持久工作对象 | 持有名称、描述、受让人、dueDate、timer、`isCompleted`、`boardId`、`listId` | 核心工作项，但无执行态/依赖/父子层级 |
| Task | 持久子项（Card 的 `cardId`） | 名称、`isCompleted`、dueDate、成员 | 清单子项，仅完成二态，无依赖与状态机 |
| 卡片依赖 / Plan / Issue / Agent / Run / 调度义 Task | 当前证据未发现一等对象 | 无对应模型 | 不构成调度对象模型 |

### 任务关系、可执行性与状态所有者

4ga Boards 的"状态"是卡片所在列表 + `isCompleted` 布尔，以及 Task 的 `isCompleted`。没有独立的任务生命周期状态机，没有"谁把任务从等待推进到可执行"的调度角色。卡片/任务的创建、移动、完成全部由用户手动操作，服务器校验权限后落库并广播。

对象间只有包含关系（Project⊃Board⊃List⊃Card⊃Task），没有任务间的前置依赖、阻塞、并行分支或 DAG。没有持续扫描依赖并自动推进下游的调度器；也没有任何事件/定时自动化去变更任务状态。

### 自动化与定时机制

仅有的两个 cron hook 是系统维护（失败认证清理、通知批处理），与任务调度无关。没有规则引擎、没有触发器、没有定时任务推进、没有执行分派。实时性体现在协作状态同步，而非任务执行的自动推进。

## 技术架构

### 系统全貌

```text
Browser (React + Redux + Redux-Saga + Redux-ORM + react-beautiful-dnd)
      | HTTPS + WebSocket (Sails.js sockets, realtime)
      v
Sails.js Server (Node.js, Knex.js ORM)  -- REST API + sockets + cron hooks
      | SQL (Knex)
      v
PostgreSQL 18  (核心持久化)
      +
Redis 8 (可选：rate-limit / session / sockets 扩展)
      |
      +-- Attachments/Avatars/Backgrounds: 卷 (filesystem)
```

Docker 形态为 db + redis + app 三容器（或 no-redis 两容器）；Kubernetes 经 Helm；Manual 为 Node.js + pnpm 源码（`pnpm dev`，开发库用 docker-compose-dev.yml）。

### 持久化与并发

所有看板对象、用户、会话、活动流持久化于 PostgreSQL（Knex.js 迁移，如 [create_session_table](https://github.com/RARgames/4gaBoards/blob/main/server/db/migrations/20220906094517_create_session_table.js)）。附件/头像/项目背景图存于文件系统卷（user-avatars、project-background-images、attachments）。Redis 可选，用于速率限制与会话/实时扩展，非任务队列。无 Kafka/RabbitMQ 等消息中间件。

### 接口与鉴权

| 边界 | 主要接口 | 鉴权/约束 |
| --- | --- | --- |
| Browser ↔ Server | HTTPS REST + WebSocket（Sails sockets） | 密码 + SSO（Google/GitHub/Microsoft/OIDC）；权限系统；会话（可存 Redis） |
| 第三方 ↔ Server | REST API（ApiClient 模型，`isCreatedViaApi` 标记） | API 客户端凭据；速率限制（Redis） |
| Server ↔ DB | Knex.js SQL | PostgreSQL 18 |
| Server ↔ 外部 | 邮件创建卡片（`mailCreatorAddress`）、通知 | 邮件令牌（MailToken） |

存在 ApiClient 模型与 `isCreatedViaApi` 字段，说明有面向程序接入的 REST API；GitHub 双向同步标注"即将推出"（未落地）。

### 数据边界

自托管实例持久化全部数据于本地 PostgreSQL 与文件卷，无强制云端回传。官方 SaaS 时数据位于其托管环境（Enterprise 可选独立实例、VPN、多地备份）。断网不影响局域网自托管实例核心流程。

## 部署与工作机支持

### macOS

| 项目 | 结论 |
| --- | --- |
| 官方安装 | 无原生 .app/.dmg。仅 Docker（Desktop）或源码（Node.js + pnpm） |
| 运行入口 | `docker compose up -d` 后浏览器访问 `http://localhost:3000`；源码 `pnpm dev` |
| 依赖 | Docker Desktop；或 Node.js + pnpm + PostgreSQL（开发库用 docker-compose-dev.yml） |
| 权限 | 容器内运行，本地卷挂附件/DB；源码默认用户目录 |
| 网络 | 局域网自托管可离线；公网需自行配 TLS/反向代理 |
| 升级 | 拉新镜像 `docker compose pull && up -d`；备份用 boards-backup.sh |
| 卸载 | 官方未提供一键卸载；`docker compose down -v` 删容器与卷为合理推导，数据保留由用户决定 |

macOS 无原生工作机应用，只能作浏览器端或本地跑 Docker/源码服务器。

### Windows

| 项目 | 结论 |
| --- | --- |
| 官方安装 | 无原生 .exe 安装器。仅 Docker Desktop 或源码（Node.js + pnpm） |
| 运行入口 | 同 macOS：`docker compose up -d` 后浏览器访问；或 WSL/源码 |
| 依赖 | Docker Desktop（Windows）；或 Node.js + pnpm + PostgreSQL |
| 权限 | 容器内运行；源码视 Node 环境而定 |
| 网络 | 局域网自托管可离线；公网需自行配 TLS |
| 升级 | 同 macOS，拉新镜像 |
| 卸载 | 无官方卸载流程；删容器/卷/源码目录 |

Windows 同样无原生工作机应用。官方文档未针对 Windows 提供专属安装路径，依赖 Docker Desktop 或类 Unix 源码环境（WSL）。

### 自托管服务器与官方 SaaS

生产推荐 Docker Compose（三容器）或 Kubernetes（Helm）。默认账号 demo/demo，需改 SECRET_KEY、POSTGRES_PASSWORD、DATABASE_URL、BASE_URL。官方 SaaS 提供 Pro/Enterprise/Enterprise On-Premise 多档，含自动更新、备份、SSO、权限系统；Enterprise 提供独立实例、VPN、99% uptime、定制 SLA。开源自托管功能完整，无功能阉割（FAQ 明示）。

## 接入与改造边界

### 最小接入路径

1. 读写看板数据用 REST API（ApiClient），复用 SSO/权限与速率限制，不应绕过服务器直写 PostgreSQL。
2. 事件外发可基于通知/邮件机制对接，但无成熟 webhook 体系（当前证据未发现一等 webhook 对象）。
3. 若要把 4ga Boards 当"工作对象来源"接入外部调度：外部系统经 REST API 读取 Project/Board/Card/Task，自行维护任务生命周期、依赖与执行归属；4ga Boards 本身不提供调度状态。

### 私有化与依赖剥离

| 组件 | 性质 | 改造判断 |
| --- | --- | --- |
| PostgreSQL | 核心硬依赖 | 全部对象持久化，替换成本高（Knex.js 抽象但官方仅支持 PostgreSQL） |
| Redis | 可选增强 | 仅速率限制/会话/sockets，可用 no-redis compose 省略 |
| Sails.js sockets | 核心实时机制 | 与服务器耦合，仅服务协作同步，与调度无关 |
| 附件存储 | 文件系统卷 | 可挂外部存储；未见对象存储后端抽象证据 |
| SSO | 可配置 | Google/GitHub/Microsoft/OIDC，可对接私有 IdP |

4ga Boards 没有"调度最小核心职责"可剥离——它本就不含调度中心。若目标是 Stateful 调度，4ga Boards 只能作为工作对象（卡片/任务）的来源或可视化层，调度状态、依赖解析、执行归属、失败恢复都需外部系统另行实现。

### 扩展约束

实时与权限校验运行在 Sails.js 进程内，Redis 仅作速率限制/会话/实时扩展。水平扩展靠多应用实例 + 共享 PostgreSQL/Redis，未提供多调度节点协调或任务抢占机制——因为它本非调度器。对象模型无依赖关系，不构成可扩展的执行编排底座。

## 维护状态、开源与公开反馈

仓库为 [MIT 许可](https://github.com/RARgames/4gaBoards/blob/main/LICENSE)，主分支 `main`，主语言 JavaScript，2023 年 1 月创建。截至 2026-08-10：686 stars、119 forks、157 open issues，`pushed_at` 2026-08-09（昨日活跃），最新 Release v3.3.13 于 2026-07-15 发布，近期标签 v3.3.6–v3.3.13 密集。官网显示 99770 下载、2636 次提交，由小型团队（RARgames，创始人 Piotr Pakulski 等）维护，采用"开源 + 官方托管 SaaS"双轨商业模式。

生态与反馈：支持 Trello/CSV 导入、多语言、SSO；GitHub 双向同步为规划能力（未落地）。公开反馈以 GitHub Issues 为主（157 个开放），个案不代表整体，本报告不据此外推稳定性结论。

## 未决项与证据边界

- 本次未实际部署或运行 4ga Boards；实时同步、SSO、通知批处理与备份恢复行为来自官方文档与定点源码证据，未在目标环境复现。
- "无任务依赖/自动化/调度"是基于模型目录与全仓关键词扫描的"未发现"，非对未来版本的永久否定；GitHub 双向同步等规划能力未计入现有结论。
- 官方未提供 Windows/macOS 原生应用与一键卸载说明；Docker Desktop 在工作机上的长期运行体验未决。
- 官方 SaaS 的数据驻留、SLA 细节与自托管的功能逐项等价性未核验；Enterprise On-Premise 的实施范围未决。
- REST API 的完整端点覆盖面、webhook 能力（是否存在）未逐一核验；`isCreatedViaApi` 仅证明存在程序接入路径。
- Redis 省略后的会话/实时降级边界（单实例 vs 多实例）未在源码层确认。

## 后续验证建议

1. 在干净 macOS 与 Windows（Docker Desktop）环境各执行一次 compose 部署、SSO 配置、备份/恢复与升级，记录依赖与数据保留行为。
2. 验证 REST API 对 Project/Board/Card/Task 的读写覆盖面与鉴权、速率限制，确认是否足以支撑外部系统读取工作对象。
3. 若拟以 4ga Boards 为工作对象来源外接调度器，自行设计任务生命周期、依赖与执行归属的映射，不要期待其原生提供调度状态。
4. 若需依赖驱动编排或自动化，明确 4ga Boards 无原生能力，须由外部系统实现；其对象模型（无依赖字段）需外部补齐。
5. 若 Redis 省略是诉求，验证单实例下会话与实时的降级行为，再决定是否纳入最小部署。
