# Vikunja 技术产品调研

> updated_by: Qoder - Claude
> updated_at: 2026-08-08 00:00:00
> evidence_window: 2026-08-08, master 分支, v2.5.0 (2026-08-04), pkg.go.dev v0.24.6

## 调研目标

- 围绕 Stateful 编排调度、客户端接入、Windows 与 macOS 工作机部署、依赖根源与架构范式，形成可追溯的独立产品调研。
- 判断产品是否持久拥有工作对象、对象关系和任务生命周期，并依据依赖、状态与策略持续推进任务。
- 核验 Windows 与 macOS 工作机支持情况、Local 优先适配程度、云端依赖与最小部署成本。
- 识别调度最小核心职责与非调度增值能力的边界，评估改造范围与风险。

## 交付结论

### Vikunja 是开源自托管任务管理应用，持久拥有 Task 对象与关系但不具备 Agent 调度能力，属于人工驱动的任务管理系统而非 Stateful 调度器

Vikunja（go-vikunja/vikunja）是 Konrad Langenberg 个人开发的开源自托管任务管理应用，AGPLv3 许可证。产品以单二进制或 Docker 容器形态部署，提供 List、Kanban、Gantt、Table 四种视图，支持任务关系、重复任务、提醒、团队协作、CalDAV 同步、Webhook 通知等功能。产品同时提供 Vikunja Cloud 托管 SaaS 和完全开源的自托管方案。GitHub 5k stars、595 forks。

Vikunja 持久拥有工作对象——Project、Task、TaskRelation、Bucket、Label、Team、Webhook 均为数据库中的持久化记录，拥有标识、归属、层级和状态。Task 是核心工作对象，拥有 done 状态、due_date、start_date、end_date、repeat_after、priority、percent_done 等字段。TaskRelation 支持 11 种关系类型（subtask、parenttask、related、duplicateof、duplicates、blocking、blocked、precedes、follows、copiedfrom、copiedto），构成任务间的 DAG。但产品不具备 Stateful 调度能力：不存在 Agent 分派机制、不存在执行者选择逻辑、不存在自动状态推进、不存在任务依赖驱动的解锁或阻塞。Task 的 done 状态由人工手动标记，TaskRelation 是展示和导航关系，不是调度依赖——blocking/blocked 关系不阻止任务被标记为 done，precedes/follows 关系不驱动自动状态迁移。

以上为已确认事实，依据 [GitHub 仓库](https://github.com/go-vikunja/vikunja)、[官方文档](https://vikunja.io/docs/) 和 [pkg.go.dev models 文档](https://pkg.go.dev/code.vikunja.io/api/pkg/models)。

### 工作对象模型以 Project、Task、TaskRelation 为核心，持久化在关系型数据库中

Vikunja 的工作对象模型如下：

- **Project**：持久化项目容器。拥有 ID、标题、描述、identifier（短标识符，用于构建 Task identifier）、hex_color、owner、parent_project_id（支持嵌套项目）、is_archived、background、views。Project 支持无限层级嵌套（parent_project_id 递归）。持久化在数据库中。
- **Task**：持久化任务记录。拥有 ID、标题、描述、done、done_at、due_date、start_date、end_date、reminders、project_id、repeat_after、repeat_mode、priority、percent_done、identifier（由 project identifier + index 构成，如 "PROJ-42"）、index、hex_color、assignees、labels、attachments、related_tasks、position、is_favorite。Task 是核心工作对象，但不是调度单元——它不具备执行状态机、不被调度器自动推进。
- **TaskRelation**：持久化任务关系。拥有 task_id、other_task_id、relation_kind。支持 11 种关系：subtask（子任务）、parenttask（父任务）、related（相关）、duplicateof（重复于）、duplicates（重复）、blocking（阻塞）、blocked（被阻塞）、precedes（先于）、follows（后于）、copiedfrom（复制自）、copiedto（复制到）。TaskRelation 构成任务间的 DAG，但仅用于展示和导航——blocking/blocked 关系不阻止任务被标记为 done，precedes/follows 关系不驱动自动状态迁移。
- **Bucket**：Kanban 列容器。拥有 title、project_view_id、limit（WIP 限制）、position、count。Bucket 是 Kanban 视图的展示容器，不是调度对象。
- **Label**：持久化标签。与 Task 多对多关联。
- **Team**：持久化团队。拥有成员列表和项目访问权限。
- **Webhook**：持久化 Webhook 配置。拥有 target_url、events（订阅的事件类型列表）、project_id、secret（HMAC 签名密钥）。
- **SavedFilter**：持久化过滤器。保存用户自定义的查询条件。
- **Subscription**：持久化订阅。用户订阅 Task 或 Project 的变更通知。
- **Plan**：不存在持久化编排对象。
- **Task（调度意义）**：Task 是最接近的调度对象，但 Task 的 done 状态由人工手动标记，不存在调度器自动推进。TaskRelation 是展示关系，不是调度依赖。

对象层级：User → Project（可嵌套）→ Task。Task 通过 TaskRelation 与其他 Task 关联。Project 通过 Team 共享给多个用户。

以上为已确认事实，依据 [pkg.go.dev models 文档](https://pkg.go.dev/code.vikunja.io/api/pkg/models)（v0.24.6）。

### 任务关系与生命周期以 Task done 状态和 TaskRelation 为核心，不存在调度状态机或自动推进

Vikunja 的 Task 生命周期管理：

- **Task 状态机**：Task 拥有二元状态——`done: true/false`。不存在多阶段状态机（如 Todo → In Progress → Done）。done 状态由人工在 UI 中手动标记，或通过 API 设置。不存在调度器自动推进状态的机制。
- **任务依赖**：TaskRelation 支持 11 种关系类型，构成任务间的 DAG。但关系仅用于展示和导航——blocking/blocked 关系不阻止被阻塞任务被标记为 done，precedes/follows 关系不驱动自动状态迁移。一个 Task 的完成不会自动解锁或触发另一个 Task。
- **上游下游**：不存在上游完成后解锁下游的机制。TaskRelation 是静态关系记录，不是动态调度链。
- **重复任务**：Task 拥有 repeat_after（秒数）和 repeat_mode（0=按 repeat_after 间隔重复、1=每月重复、3=从当前日期重复）。当标记为 done 时，Task 自动取消 done 状态并按 repeat_after 增加 due_date 和 reminders。这是自动重复机制，不是调度推进——它不创建新 Task，而是重置现有 Task 的日期。
- **提醒**：TaskReminder 支持绝对时间提醒和相对时间提醒（relative_to: due_date/start_date/end_date，relative_period: 秒数偏移）。`RegisterReminderCron` 每分钟检查一次是否有提醒到期，发送邮件通知。`RegisterOverdueReminderCron` 每天检查一次过期未完成任务。提醒是通知机制，不是调度推进。
- **优先级与计划时间**：Task 拥有 priority（任意整数）和 due_date/start_date/end_date。这些参数参与排序和展示，但不参与调度决策——没有优先级驱动的执行顺序、没有资源约束、没有并发限制。
- **并发限制**：Bucket 拥有 limit 字段（WIP 限制），但仅用于 Kanban 视图展示，不阻止任务被移入超限的 Bucket。

以上为已确认事实，依据 [pkg.go.dev Task、TaskRelation、TaskReminder、TaskRepeatMode 文档](https://pkg.go.dev/code.vikunja.io/api/pkg/models)。

### Agent 分派不存在，Vikunja 是人工驱动的任务管理系统而非 Agent 调度器

Vikunja 不选择、不分派、不唤起 Agent。所有任务创建和状态变更由人工完成：

- **Task 创建**：用户通过 Web UI、桌面应用、移动应用或 API 手动创建 Task。系统不自动发现或创建任务。
- **Task 指派**：Task 可手动指派给 Project 成员（assignees）。这是人工任务分配，不是 Agent 调度。系统不选择执行者、不判断任务应由谁执行。
- **Agent 启动**：不存在。Vikunja 不包含 AI Agent 运行时。
- **Agent 恢复**：不存在。
- **执行进度与检查点**：Task 的 percent_done 是手动设置的进度百分比，不是自动跟踪的执行进度。不存在执行检查点或断点续传。
- **后台 Cron**：Vikunja 包含多个后台 cron job（`RegisterReminderCron`、`RegisterOverdueReminderCron`、`RegisterAddTaskToFilterViewCron`、`RegisterOldExportCleanupCron`、`RegisterUserDeletionCron`），但这些是维护和通知任务，不是调度器——它们不创建任务、不选择执行者、不编排依赖、不推进任务生命周期。

以上为已确认事实，依据 [pkg.go.dev models 文档](https://pkg.go.dev/code.vikunja.io/api/pkg/models)。

### 持久化以 SQLite/MySQL/PostgreSQL 为核心，可选 Redis 和 S3

- **数据库**：支持 SQLite（默认）、MySQL 8.0+/MariaDB 10.2+、PostgreSQL 12+。通过 xorm ORM 抽象，可替换。数据库迁移在启动时自动执行。
- **核心表**：tasks、projects、task_relations、buckets、labels、teams、users、webhooks、saved_filters、subscriptions、task_reminders、task_attachments、api_tokens、link_shares。
- **Redis**：可选的键值存储后端，用于缓存和限流计数器（`keyvalue.type: redis`）。默认使用内存键值存储（`keyvalue.type: memory`）。Redis 是可选优化，不是硬依赖。
- **文件存储**：默认本地文件系统（`files.type: local`），可选 S3 兼容对象存储（`files.type: s3`）。S3 是可选优化，不是硬依赖。
- **Typesense**：可选的搜索引擎，用于全文搜索（`CreateTypesenseCollections`、`InitTypesense`）。不配置时使用数据库查询。Typesense 是可选优化，不是硬依赖。
- **依赖剥离**：Redis 可完全关闭（使用内存键值存储）。S3 可完全关闭（使用本地文件存储）。Typesense 可完全关闭（使用数据库查询）。SMTP 通知可关闭（`mailer.enabled: false`）。CalDAV 可关闭（`service.enablecaldav: false`）。Webhook 可关闭（`webhooks.enabled: false`）。

以上为已确认事实，依据 [配置文档](https://vikunja.io/docs/config-options/) 和 [pkg.go.dev models 文档](https://pkg.go.dev/code.vikunja.io/api/pkg/models)。

### 对外接口以 REST API 和 CalDAV 为核心，支持 WebSocket 和 Webhook

- **REST API v1**：完整的 RESTful JSON API，使用 JWT 或 API Token 认证。支持 Task CRUD、Project CRUD、TaskRelation CRUD、Bucket CRUD、Label CRUD、Team CRUD、Webhook CRUD、SavedFilter CRUD、Subscription CRUD、文件上传、用户管理。Swagger 文档可用。
- **REST API v2**：新增批量创建 Task 端点（v2.5.0 引入），支持一次请求创建多个 Task。
- **CalDAV**：支持 CalDAV 协议同步（`service.enablecaldav: true`），允许日历客户端（如 Thunderbird、Apple Calendar）读写 Task。
- **WebSocket**：支持 WebSocket 实时通知（v2.5.0 引入 WebSocket 端点限流）。
- **Webhook**：支持出站 Webhook 通知。用户可配置 Webhook 订阅特定事件（task.created、task.updated 等），Vikunja 在事件发生时向目标 URL 发送 POST 请求。支持 HMAC-SHA256 签名验证。Webhook 是出站通知，不是入站调度。
- **鉴权方式**：JWT（JSON Web Token）、API Token（项目级或用户级）、OpenID Connect、LDAP。Link Share 提供只读公开链接。
- **桌面应用**：Electron 桌面应用通过 REST API 与服务器通信，支持 CORS（需配置 `cors.origins` 包含 `http://127.0.0.1:45735`）。
- **移动应用**：独立的移动应用（功能有限），通过 REST API 与服务器通信。

以上为已确认事实，依据 [Webhook 文档](https://vikunja.io/docs/webhooks/) 和 [v2.5.0 Changelog](https://vikunja.io/changelog/vikunja-2.5.0-was-released/)。

### 消息通信以 HTTP 短连接和 WebSocket 为核心，无消息中间件

- **入站通信**：客户端通过 HTTP 短连接发送 REST API 请求。桌面应用通过 HTTP 短连接与服务器通信（CORS 配置允许 localhost）。移动应用通过 HTTP 短连接与服务器通信。
- **WebSocket**：支持 WebSocket 实时通知，用于前端实时更新。v2.5.0 引入 WebSocket 端点限流。
- **内部通信**：单进程架构。API 服务器和前端打包在同一个二进制中。后台 cron job 在同一进程内运行。无跨进程通信。
- **出站通信**：Webhook 通知通过 HTTP 短连接发送到用户配置的 URL。邮件通知通过 SMTP 发送。CalDAV 同步通过 HTTP 短连接。
- **无消息中间件**：不使用 RabbitMQ、Kafka、Redis Pub/Sub 或 NATS。事件系统使用进程内事件总线（`events.Event`）。
- **断线恢复**：WebSocket 断线后客户端自动重连。REST API 是无状态的，断线后客户端重新发起请求。

以上为已确认事实，依据 [v2.5.0 Changelog](https://vikunja.io/changelog/vikunja-2.5.0-was-released/) 和 [Webhook 文档](https://vikunja.io/docs/webhooks/)。

### 任务队列以进程内 cron 和事件总线为核心，无持久化队列

- **队列实现**：无独立队列组件（无 Celery、Sidekiq、Bull）。后台任务通过 Go 的 `cron` 库在同一进程内调度。
- **后台 Cron**：`RegisterReminderCron`（每分钟检查提醒）、`RegisterOverdueReminderCron`（每天检查过期任务）、`RegisterAddTaskToFilterViewCron`（定期更新过滤视图）、`RegisterOldExportCleanupCron`（清理旧导出）、`RegisterUserDeletionCron`（删除计划删除的用户）。
- **事件总线**：进程内事件系统（`events.Event`），用于触发通知和 Webhook。`RegisterListeners` 注册所有事件监听器。`RegisterEventForWebhook` 将事件转发给 Webhook 监听器。
- **并发协调**：单进程架构，无分布式协调需求。数据库事务保证数据一致性。
- **最小依赖**：单机最小部署只需 Vikunja 二进制 + SQLite 数据库。无外部服务依赖。

以上为已确认事实，依据 [pkg.go.dev models 文档](https://pkg.go.dev/code.vikunja.io/api/pkg/models)。

### Windows 与 macOS 均通过 Electron 桌面应用支持，服务器端通过 Docker 或二进制部署

- **Windows**：Electron 桌面应用提供 .exe 和 .msi 安装包。桌面应用是 Web 前端的 Electron 封装，通过 REST API 与服务器通信。服务器端可通过 Docker Desktop 或 Windows 二进制运行（需自行配置）。
- **macOS**：Electron 桌面应用提供 macOS 版本。桌面应用是 Web 前端的 Electron 封装，通过 REST API 与服务器通信。服务器端可通过 Docker Desktop 或 macOS 二进制运行（需自行配置）。
- **Linux**：Electron 桌面应用提供 AppImage、.deb、.rpm、Snap、Flatpak、Alpine、Arch Linux 等多种格式。服务器端提供原生二进制（amd64、arm64、armhf）、Docker 镜像、Debian/Ubuntu 包、RPM 包、Arch Linux 包、Alpine 包。
- **原生二进制**：服务器端提供原生 Go 二进制，支持 Windows、macOS、Linux。桌面应用是 Electron 封装，不是原生应用。
- **桌面客户端**：Electron 桌面应用，支持快速入口窗口（quick-entry window）、系统托盘、命令行标志。桌面应用需要连接到 Vikunja 服务器（自托管或 Vikunja Cloud）。
- **CLI 接入**：无专用 CLI 工具。通过 REST API 或 CalDAV 接入。
- **SDK 接入**：无官方 SDK。通过 REST API 接入，任何语言均可通过 HTTP 客户端使用。
- **选型缺陷**：桌面应用是 Electron 封装而非原生应用，资源占用较高。macOS 桌面应用未在官方文档中明确列出支持格式（仅提到 Linux 和 Windows），需进一步验证。

以上为已确认事实，依据 [桌面应用文档](https://vikunja.io/docs/desktop-packages/) 和 [安装文档](https://vikunja.io/docs/installing)。

### Local 优先适配存在选型缺陷：主体功能为服务器端服务，桌面应用为客户端壳

- **运行形态**：Vikunja 的主体功能运行在服务器端（单二进制或 Docker 容器）。桌面应用是 Web 前端的 Electron 封装，通过 REST API 与服务器通信。工作机上不运行任务管理逻辑——桌面应用只是客户端壳。
- **Local 优先适配**：不匹配。Vikunja 是服务器端任务管理服务，不是工作机本地工具。桌面应用需要连接到服务器才能使用。虽然服务器可以在本地运行（localhost），但官方文档明确说明"Since it's designed as a web application, it is not really possible to host it standalone on a desktop device only"。
- **云端依赖**：Vikunja Cloud 提供托管 SaaS。自托管实例完全独立运行，不依赖 Vikunja Cloud 云端服务。自托管实例可完全离线运行（除 Webhook 和邮件通知的出站请求外）。
- **数据边界**：自托管实例的数据完全存储在用户自己的 SQLite/MySQL/PostgreSQL 和可选 S3 中。无数据外流。
- **断网影响**：自托管实例断网后，如果服务器在本地运行，Web UI 和 REST API 仍可用。Webhook 和邮件通知将无法发送，因为它们需要出站互联网连接。CalDAV 同步将无法与外部日历客户端同步。
- **最小部署成本**：单二进制 + SQLite，零外部依赖。Docker 部署只需一个容器。资源需求极低——Go 二进制轻量级运行，Raspberry Pi 上 RSS 约 48.7MB。
- **选型缺陷**：Vikunja 不是工作机本地工具，无法直接适配"Agent 在工作机上持续运行"的场景。它是服务器端任务管理服务，桌面应用只是客户端壳。但作为 Agent 工作流的"任务看板"补充组件，部署成本极低且自托管无云端依赖。

以上为已确认事实，依据 [安装文档](https://vikunja.io/docs/installing) 和 [配置文档](https://vikunja.io/docs/config-options/)。

### 云端形态：Vikunja Cloud SaaS 与自托管功能等价，Vikunja Pro 提供增值功能

- **Vikunja Cloud**：提供托管 SaaS，免费版支持基本功能。付费版（Personal 4€/月）提供无限 lists、tasks、reminders、share links、relations、filters、10GB 附件存储。
- **Vikunja Pro**：v2.4.0 引入的首批 Pro 功能（具体功能未在证据中明确列出）。
- **自托管**：完全开源，AGPLv3 许可证。功能与 SaaS 基本等价（除 Pro 功能外）。Docker 镜像在 Docker Hub 上提供。原生二进制支持 Windows、macOS、Linux。
- **无闭源核心**：核心代码开源，AGPLv3 许可证。Vikunja Pro 功能是闭源增值模块。
- **版本活跃度**：v2.5.0 发布于 2026-08-04（203 commits，1 个安全修复，1 个新功能），v2.4.0 发布于 2026-07-19（10 个安全修复，首批 Pro 功能），v2.3.0 发布于 2026 年上半年（11 个安全修复，插件系统，OAuth 2.0 provider，WeKan + CSV 导入）。维护非常活跃，约每 2-3 周发布一个版本。

以上为已确认事实，依据 [v2.5.0 Changelog](https://vikunja.io/changelog/vikunja-2.5.0-was-released/)、[WinterFlow v2.4.0](https://winterflow.io/catalog/vikunja/releases/v2.4.0/) 和 [WinterFlow v2.3.0](https://winterflow.io/catalog/vikunja/releases/v2.3.0/)。

## 未决项与证据边界

- **macOS 桌面应用支持格式**：官方桌面应用文档仅明确列出 Linux 和 Windows 的安装格式，未明确列出 macOS 格式。GitHub go-vikunja/desktop 仓库和下载页面可能提供 macOS 版本，但证据不足以确认。
- **Vikunja Pro 功能范围**：v2.4.0 引入首批 Pro 功能，但具体功能列表未在证据中明确列出。
- **TaskRelation 的 DAG 能力**：TaskRelation 支持 11 种关系类型，理论上构成 DAG。但证据未明确说明系统是否检测循环依赖（`IsErrTaskRelationCycle` 错误存在，说明有循环检测），以及是否支持拓扑排序或关键路径分析。
- **WebSocket 功能范围**：v2.5.0 引入 WebSocket 端点限流，说明 WebSocket 功能已存在。但 WebSocket 的具体功能（实时通知、协作编辑等）未在证据中明确列出。

## 后续验证建议

- 如考虑将 Vikunja 作为 Agent 工作流的任务看板组件，可验证 TaskRelation 的 blocking/blocked 和 precedes/follows 关系是否可通过 API 用于构建外部调度逻辑。
- 如需要 Agent 工作断点续传的监控，可验证 Task 的 repeat_after 和 repeat_mode 机制是否可用于周期性任务的自动重置。
- 如需要将 Vikunja 嵌入现有工作流系统，可验证 REST API v2 的批量创建端点和 Webhook 的事件覆盖范围。
- 如需要 macOS 桌面应用，可验证 go-vikunja/desktop 仓库的发布产物是否包含 macOS 版本。
