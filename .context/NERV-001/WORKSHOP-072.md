# tududi 技术产品调研

> updated_by: Qoder - Claude-Sonnet
> updated_at: 2026-08-10 16:05:00
> evidence_window: 2026-08-10；目标版本 v1.4.0-rc.1（预发布，最新稳定 tag v1.3.1）；分支 `main`；运行时 Node.js + Express + Sequelize + SQLite

## 交付结论

### tududi 是个人任务管理系统，不是 Stateful 任务调度器

已确认：tududi 的核心持久对象是 Task、Project、Area、Note、Tag、Subtask（Task 自关联）、RecurringCompletion、InboxItem、Goal、View、Person、Permission、Role、User、Notification、Action、TaskEvent，以及 CalDAV/OIDC/API token 等集成对象（[backend/models](https://github.com/chrisvel/tududi/tree/main/backend/models)）。它是一个 GTD 风格的个人生活/工作组织系统（Today/Upcoming/Someday 过滤、Inbox、Areas 分组），不是多执行者的任务分派平台。

架构判断：tududi 持久拥有任务对象及其状态，但**没有** Agent、Worker、Run、执行归属、任务队列、抢占、失败转移等概念，也**没有任务间依赖**（对 [task.js](https://github.com/chrisvel/tududi/blob/main/backend/models/task.js) 扫描 depend/block/predecess/requires/waiting_for 均无命中）。它的"调度"仅限于个人重复任务的后台实例化与到期处理，不满足本专项"依据依赖/状态/策略持续推进任务并选择执行者"的 Stateful 调度判定基准，应归类为**个人任务管理工具**。

与前两个产品相比：tududi 比 Wekan、4ga Boards 在"任务"维度更强（有真正的任务状态机与子任务），但它是**单用户/个人导向**，无执行者分派，无任务依赖，同样不构成调度中心。

### Task 有 7 态生命周期状态机与子任务层级，但无任务间依赖

已确认：[Task 模型](https://github.com/chrisvel/tududi/blob/main/backend/models/task.js)定义 `Task.STATUS = { NOT_STARTED:0, IN_PROGRESS:1, DONE:2, ARCHIVED:3, WAITING:4, CANCELLED:5, PLANNED:6 }`，是真实的任务生命周期状态机（含等待、计划、取消等语义）。`Task.PRIORITY = { LOW:0, MEDIUM:1, HIGH:2 }`。

子任务通过 `parent_task_id` 自关联（`ParentTask`/`Subtasks`，含 order 排序索引）。重复任务通过 `recurring_parent_id` 自关联（`RecurringParent`/`RecurringChildren`），生成的实例连到原始重复模式。

关键判定：尽管有状态机和子任务，**没有任何任务间的前置依赖、阻塞、并行分支或 DAG**。状态推进由用户手动驱动（或重复任务自动生成新实例），没有"前置完成后自动解锁下游"的可执行性判定。子任务仅是层级包含与进度跟踪，父任务完成不级联驱动子任务之外的下游对象。

### "smart workflows" 是重复任务实例化与到期处理，不是依赖驱动调度

已确认：tududi 的 Recurring Tasks 支持多种模式（`RECURRENCE_TYPE`：daily/weekly/monthly/monthly_weekday/monthly_last_day）、基于完成日期重复、自定义间隔、结束日期、习惯（habit）频率/连续模式/灵活度。后台由 [taskScheduler.js](https://github.com/chrisvel/tududi/blob/main/backend/modules/tasks/taskScheduler.js) 用 `node-cron` 驱动，配合 [recurringTaskService.js](https://github.com/chrisvel/tududi/blob/main/backend/modules/tasks/recurringTaskService.js) 生成实例。

taskScheduler 的 cron 任务为：任务摘要推送（daily/weekdays/weekly/1h–12h）、`cleanup_tokens`（清理过期 token）、`deferred_tasks`（处理延迟任务，每 5 分钟）、`due_tasks`/`due_projects`（到期任务/项目，每 15 分钟）。

架构判断：这些后台 cron 是**个人任务的重复实例化、到期处理、摘要通知与 token 清理**，属于任务管理的辅助自动化。它不判断任务依赖、不选择执行者、不维护执行归属或失败恢复。这是"定时生成/提醒"，不是"调度执行"。

### 单容器 SQLite 自托管 + PWA，无原生桌面应用，符合 Local 优先

已确认：tududi 部署为单容器（[docker-compose.yml](https://github.com/chrisvel/tududi/blob/main/docker-compose.yml) 仅一个 `tududi` 服务，镜像 `chrisvel/tududi:latest`，端口 3002，卷 `/app/db` 与 `/app/uploads`）。数据库为 **SQLite**（[backend/config/database.js](https://github.com/chrisvel/tududi/blob/main/backend/config/database.js) 中 `dialect:'sqlite'`，storage 为 dbFile），无需外部数据库服务。

客户端形态：响应式 Web + **可安装 PWA**（桌面/移动浏览器添加到主屏，离线可读缓存、写操作队列联网后自动同步）。官网与仓库均未提供 Windows/macOS/Linux 原生桌面应用。移动端可经 CalDAV 用 tasks.org、Apple Reminders 等原生客户端访问任务。

运行形态：自托管（MIT，免费）与官方托管订阅并存（"hosted subscription for a hassle-free, managed solution"）。

Local 优先判断：架构高度适配——单容器 + SQLite，数据完全留在本地，无云端强依赖，离线可用（PWA）。官方托管为可选，功能与自托管等价。选型缺陷是：无原生桌面应用（仅 PWA），对要求"工作机原生应用"的场景需经 CalDAV 借第三方原生客户端间接实现。

### SQLite 是唯一持久化依赖，无外置数据库、无消息队列，部署极简

已确认：tududi 仅依赖 SQLite（Sequelize ORM），单容器即可运行，无需 PostgreSQL/MySQL/Redis/Kafka 等任何外部服务。后台调度（node-cron）运行在应用进程内。附件存于 `/app/uploads` 卷。

架构判断：这是极致的 Local 优先/低运维部署——单二进制容器 + 嵌入式 SQLite + 进程内 cron。没有需要分布式事务、行锁或消息队列保护的调度状态（因为它本非调度器）。SQLite 通过 Sequelize 抽象，理论上可换其他库，但官方仅提供 SQLite 配置。

## 调研目标

- 判断 tududi 是否持久拥有工作对象、执行归属和可恢复的 Stateful 调度状态
- 明确 Task、Project、Area、Note、子任务、重复任务的实际对象模型及生命周期
- 核验"smart workflows"（重复任务/后台 cron）是否构成任务调度或执行分派
- 分别评估 Windows、macOS 工作机接入及本地、云端运行形态
- 识别核心依赖、标准接入面和私有化改造范围

## 产品定位与核心流程

### 定位与用户

tududi 是 MIT 许可的开源个人生产力系统，定位"calm, open system for organizing life and work"，强调清晰层级、智能重复任务、隐私（自托管）。面向个人用户管理任务、项目、领域、笔记、标签，采用 GTD 式过滤（Today/Upcoming/Someday）与 Inbox 收集。支持项目共享协作，但核心是单人组织。

### 端到端流程

1. 用户注册/登录（密码或 OIDC/SSO），经 Inbox 快速收集想法，或直接在 Project/Area 下建 Task。
2. Task 可设优先级、截止日期、状态（7 态）、子任务、重复模式、标签；Project 归 Area，可含多个 Task 与 Note。
3. 重复任务由后台 cron 按模式自动生成新实例（父子关联）；到期/延迟任务被周期性处理。
4. 多设备经 PWA（离线队列同步）或 CalDAV（tasks.org/Apple Reminders 等）访问；Telegram 可快速建任务与收每日摘要。
5. 第三方经 REST API（个人 API key，Swagger 文档）读写任务/项目/笔记/领域。

## 工作对象与调度模型

### Task、Project、Area、子任务、重复任务映射

| 对象 | 结论 | 持久化与归属 | 调度影响 |
| --- | --- | --- | --- |
| Task | 一等持久工作对象 | Sequelize/SQLite 持有，属 User | 有 7 态状态机与优先级，但无执行归属/依赖 |
| Subtask | 真实持久（`parent_task_id` 自关联） | 父子层级 + order | 层级包含与进度跟踪，父完成不级联解锁下游 |
| Recurring Task | 真实持久（`recurring_parent_id` + recurrence 字段族） | 模式定义 + 实例关联 | 后台 cron 实例化，是模板生成非依赖调度 |
| Project | 持久容器 | 隶属 Area，含 Task/Note | 组织边界，非调度对象 |
| Area | 持久分组 | 分组 Project | 组织边界 |
| Note / Tag / InboxItem / Goal / View | 一等持久辅助对象 | 笔记/标签/收集/目标/视图 | 组织与呈现，非调度 |
| 任务依赖 / Agent / Run / 执行队列 | 当前证据未发现一等对象 | 无对应字段/模型 | 不构成调度对象模型 |

### 任务关系、可执行性与状态所有者

tududi 有真实任务状态机（7 态），但状态推进由用户手动驱动，或重复任务到期自动生成新实例。没有"谁把任务从等待推进到可执行"的调度角色——WAITING/PLANNED 等状态是用户标注，不由系统依据依赖自动迁移。

任务间只有父子（subtask）与重复模式（recurring）两种自关联，**没有任务间前置依赖、阻塞或 DAG**。没有持续扫描依赖并自动推进下游的调度器。任务属单个 User，无多执行者分派或抢占。

### 后台自动化与定时机制

后台 cron（node-cron，进程内）负责：重复任务实例化、延迟任务处理（每 5 分钟）、到期任务/项目处理（每 15 分钟）、任务摘要推送、过期 token 清理。这些是任务管理的辅助自动化，不涉及依赖解析、执行分派或失败恢复。CalDAV 后台自动同步（双向、冲突检测）是另一独立后台机制。

## 技术架构

### 系统全貌

```text
Browser / PWA (React + webpack + tailwind; 离线缓存 + 写队列同步)
      | HTTPS REST (/api/v1) + session/Bearer token
      v
Express Server (Node.js + Sequelize ORM)
      |-- node-cron (进程内: recurring/deferred/due/summary/cleanup)
      |-- CalDAV 模块 (双向同步, RRULE, 冲突检测)
      |-- OIDC/SSO, Telegram 集成
      | SQL (Sequelize)
      v
SQLite (嵌入式, /app/db)   +   附件 (/app/uploads)
```

单容器形态下全部组件位于一个进程/容器；开发形态为 backend:dev（:3001）+ frontend:dev（:8080）双进程。

### 持久化与并发

所有对象持久化于嵌入式 SQLite（Sequelize 迁移，如 recurring 增强、recurring_parent_id 等）。附件存文件系统卷。无外置数据库、无 Redis/Kafka、无第二任务队列；后台调度为进程内 node-cron。并发与一致性需求低（个人工具，单用户为主），SQLite 单写足够。

### 接口与鉴权

| 边界 | 主要接口 | 鉴权/约束 |
| --- | --- | --- |
| Browser/PWA ↔ Server | HTTPS REST `/api/v1`（Swagger 于 /api-docs） | 会话 cookie 或 Bearer 个人 API key |
| 第三方 ↔ Server | REST API（任务/项目/笔记/领域 CRUD） | 个人 API key；express-rate-limit |
| CalDAV 客户端 ↔ Server | CalDAV 协议（HTTP Basic） | 加密存储密码（AES-256-GCM）；双向同步 |
| Server ↔ 外部 | Telegram、OIDC/SSO（Google/Okta/Keycloak/Authentik/PocketID/Azure AD） | OIDC JIT  provisioning、账号链接、邮箱域名定 admin |

### 数据边界

自托管实例全部数据存于本地 SQLite 与上传卷，无强制云端回传。PWA 离线可读缓存、写操作队列联网后同步。CalDAV 可与外部服务器（Nextcloud/Baikal）双向同步，数据可离开本实例（用户自主选择）。官方托管时数据位于其托管环境。断网不影响本地实例核心流程（PWA 离线可用）。

## 部署与工作机支持

### macOS

| 项目 | 结论 |
| --- | --- |
| 官方安装 | 无原生 .app/.dmg。Docker 单容器或源码（Node.js + npm） |
| 运行入口 | `docker run -p 3002:3002 -v ~/tududi_db:/app/db ... chrisvel/tududi:latest`，浏览器访问 `http://localhost:3002`；可装 PWA 到主屏/桌面 |
| 依赖 | Docker Desktop；或 Node.js + npm（源码 backend:dev :3001 + frontend:dev :8080） |
| 权限 | 容器内运行，PUID/PGID 匹配宿主用户；卷挂 db/uploads |
| 网络 | 局域网自托管可离线；公网需反向代理（设 TUDUDI_TRUST_PROXY/ALLOWED_ORIGINS） |
| 升级 | 拉新镜像重启；注意 v1.1→v1.2 卷路径从 /app/backend/db 变为 /app/db |
| 卸载 | 官方未提供一键卸载；删容器与 db/uploads 目录为合理推导，数据保留由用户决定 |

macOS 无原生桌面应用；可经 PWA 或 CalDAV（Apple Reminders）获得类原生体验。

### Windows

| 项目 | 结论 |
| --- | --- |
| 官方安装 | 无原生 .exe 安装器。Docker Desktop 单容器或源码（Node.js） |
| 运行入口 | 同 macOS：`docker run` 后浏览器访问；或 WSL/源码 |
| 依赖 | Docker Desktop（Windows）；或 Node.js + npm |
| 权限 | 容器内运行；源码视 Node 环境而定 |
| 网络 | 局域网自托管可离线；公网需反向代理 |
| 升级 | 同 macOS，拉新镜像 |
| 卸载 | 无官方卸载流程；删容器/卷/源码目录 |

Windows 同样无原生桌面应用，依赖 Docker Desktop 或 WSL/源码。可经 PWA 或 CalDAV 客户端（Thunderbird）间接接入。

### 自托管服务器与官方托管

生产为单容器（SQLite 内嵌），资源占用极低。必需环境变量：TUDUDI_USER_EMAIL/PASSWORD、TUDUDI_SESSION_SECRET；可选 OIDC、CalDAV（ENCRYPTION_KEY）、反向代理（TRUST_PROXY/ALLOWED_ORIGINS）。官方托管订阅提供免运维方案，功能与自托管等价。

## 接入与改造边界

### 最小接入路径

1. 读写任务/项目/笔记/领域用 REST API（个人 API key + Swagger），不应绕过服务器直写 SQLite。
2. 任务接入可经 CalDAV（tasks.org/Apple Reminders/Thunderbird/Evolution）双向同步，含重复任务 RRULE。
3. 若要把 tududi 当"工作对象来源"接入外部调度：外部系统经 REST API 读取 Task（含状态机/子任务/重复），自行维护任务依赖与执行归属；tududi 本身不提供依赖或调度状态。

### 私有化与依赖剥离

| 组件 | 性质 | 改造判断 |
| --- | --- | --- |
| SQLite | 核心嵌入式依赖 | 全部对象持久化；Sequelize 抽象但官方仅配 SQLite，换库需自行验证 |
| node-cron | 进程内后台调度 | 重复/到期/摘要/清理；可关（disableScheduler），非调度一致性组件 |
| CalDAV | 可选集成 | 可关（CALDAV_ENABLED），不影响核心任务管理 |
| OIDC/SSO | 可选认证 | 可关，回退密码认证 |
| Telegram | 可选集成 | 可关 |
| 附件存储 | 文件系统卷 | 可挂外部存储 |

tududi 没有"调度最小核心职责"可剥离——它本就不含执行调度中心。若目标是 Stateful 调度，tududi 只能作为工作对象（任务）的来源或个人执行前端，任务依赖、执行归属、失败恢复都需外部系统另行实现。

### 扩展约束

后台调度为进程内 node-cron，水平扩展需自行处理多实例 cron 重复触发（当前未见分布式锁）。对象模型无任务依赖，不构成可扩展的执行编排底座。其单用户/个人导向设计不适合直接扩展为多执行者调度平台。

## 维护状态、开源与公开反馈

仓库为 [MIT 许可](https://github.com/chrisvel/tududi/blob/main/LICENSE)，主分支 `main`，主语言 TypeScript，2023 年 11 月创建。截至 2026-08-10：3229 stars、233 forks、仅 16 open issues（issue 密度低，反映维护响应较好），`pushed_at` 2026-08-10（当日活跃）。无正式 Release，最新 tag 为 v1.4.0-rc.1（预发布），最新稳定 tag v1.3.1。由个人开发者 Chris Veleris 主导，接受赞助/托管订阅维持开发。

生态与反馈：CalDAV（双向同步）、Telegram、OIDC/SSO、REST API、24 语言、PWA。公开反馈样本少（16 open issues），个案不代表整体，本报告不据此外推稳定性结论。

## 未决项与证据边界

- 本次未实际部署或运行 tududi；重复任务实例化、到期处理、CalDAV 同步、PWA 离线队列行为来自官方文档与定点源码证据，未在目标环境复现。
- "无任务依赖/执行分派"是基于 task 模型字段与全仓扫描的"未发现"，非对未来版本的永久否定。
- 官方未提供 Windows/macOS 原生应用与一键卸载说明；PWA 在不同浏览器/系统安全策略下的长期体验未决。
- 官方托管订阅的数据驻留、SLA 与自托管功能逐项等价性未核验。
- 多实例部署下 node-cron 是否重复触发（无分布式锁证据）未在源码层确认；SQLite 在多写并发下的边界未验证。
- Task.STATUS 各状态间的允许迁移与责任方未逐一核验（仅确认枚举值存在）。

## 后续验证建议

1. 在干净 macOS 与 Windows（Docker Desktop）环境各执行一次单容器部署、OIDC/CalDAV 配置、备份与升级（含 v1.1→v1.2 卷路径迁移），记录依赖与数据保留行为。
2. 验证重复任务实例化的触发时机与父子关联、到期/延迟任务处理边界，以及 PWA 离线队列的实际同步行为。
3. 若拟以 tududi 为工作对象来源外接调度器，经 REST API 验证 Task（状态机/子任务/重复）读取覆盖面，自行设计任务依赖与执行归属的映射。
4. 若需依赖驱动编排或多执行者分派，明确 tududi 无原生能力，须由外部系统实现；其对象模型（无依赖字段、个人导向）需外部补齐。
5. 若考虑多实例/高可用，先验证 node-cron 的分布式协调与 SQLite 的并发写边界，再决定是否纳入生产部署。
