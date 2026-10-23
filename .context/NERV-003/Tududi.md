# tududi 技术产品调研

> updated_by: Qoder
> updated_at: 2026-10-13 10:35:00
> evidence_window: 2026-10-13；目标版本 v1.9.1（tag，2026-10-10 发布）；分支 `main`；运行时 Node.js 22 + Express 4 + Sequelize 6 + SQLite/PostgreSQL；上轮窗口 2026-08-10 / v1.4.0-rc.1 的结论已失效，本版为完整重做

## 交付结论

### tududi 已从单人 GTD 工具演进为多用户协作 + 云端订阅产品，但仍不是 Stateful 任务调度器

已确认：本轮窗口内 tududi 的产品形态发生了实质变化。它现在持久拥有工作对象（Task/Project/Area/Note/Goal/Tag/Habit/InboxItem/DailyPlan）、**对象间关系**（[`task_relations`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/models/task_relation.js)）、**任务状态机**（7 态）、**执行归属**（`assigned_to` → [`people.uid`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/models/task.js)），并新增了角色/成员/共享、CalDAV 双向同步、Telegram、MCP、云端订阅与计费。这些是上一版报告（v1.4.0-rc.1）判定为"没有"的能力。

但调度判定的**第二半完全缺失**：没有任何代码决定"任务何时可执行"、"以什么顺序推进"、"由谁执行"、"失败后如何继续"。阻塞关系是**读取时派生的提示**而非门禁（[docs/00-tasks-behavior.md](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/00-tasks-behavior.md)："A task is blocked while any task that blocks it is still open… This is derived on read: completing the blocker unblocks the task, with nothing to clear"）；到期不改状态（同文件："No automatic status changes when due date passes"）；生产代码中**不存在** worker / queue / lease / claim / dispatch / 失败重试的概念（多进程协调全部由 [`jobLock.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/services/jobLock.js) 的 PostgreSQL advisory lock 承担，且只用于"哪个进程跑定时任务"，不用于任务分派）。

判定：按 Index 的 Stateful 调度基准，tududi 应归类为**工作对象系统 / 任务承接宿主**。它可以作为 Agent 系统的持久化对象层与状态存储，但不提供推进引擎；调度能力必须由外部承担。

### 任务关系自 v1.6.0 起真实持久化并拒绝环，但"阻塞"只是读取期标注，不门禁任何状态迁移

已确认：[`backend/models/task_relation.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/models/task_relation.js) 定义 `RELATION_TYPES = ['blocks','related_to','duplicates']`，字段含 `source_task_id`/`target_task_id`（FK `tasks.id` ON DELETE CASCADE）、`created_by_user_id`（FK `users.id` ON DELETE SET NULL），表名 `task_relations`，唯一索引 `[source_task_id, target_task_id, relation_type]`。

已确认：[`backend/modules/tasks/relations/service.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/modules/tasks/relations/service.js) 中 `wouldCreateBlockCycle()` 拒绝循环阻塞链（`MAX_CYCLE_DEPTH = 100`），`RESOLVED_STATUSES = [DONE, ARCHIVED, CANCELLED]` 界定"阻塞者已解除"。`blockedCondition()` 是一段**原生 SQL 读取期 WHERE 片段**（`INNER JOIN tasks blocker … WHERE tr.relation_type='blocks' AND blocker.status NOT IN (…)`），被 REST 列表与 MCP `list_tasks?blocked=` 共用。

已确认：[`backend/modules/tasks/relations/routes.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/modules/tasks/relations/routes.js) 只暴露 `GET/POST/DELETE /api/task/:uid/relations[/:relationUid]`。**没有任何端点会因为阻塞者被解除而迁移下游任务的状态**。关系变更写入审计（[`task_event.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/models/task_event.js) 的 `event_type` 含 `relation_added`/`relation_removed`），但不触发推进。

架构判断：这是一个**可查询的依赖图，不是可执行的依赖图**。Agent 可以读 `blocked=true` 自行决策，也可以无视它——两条路径都不会被服务端拒绝。这一点在 MCP 侧被明确承认（见下条）。

### 执行归属存在但指向"人"，且是无租约的弱归属：两个 Agent 可同时认领同一任务而互不察觉

已确认：[`backend/models/task.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/models/task.js) 中 `assigned_to` 类型为 `DataTypes.STRING`，`references { model: 'people', key: 'uid' }`；另有 `involves`（JSON 数组）与 `ai_insights`（JSON）。[`backend/models/person.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/models/person.js) 含 `user_id`（归属者）与 `linked_user_id`（FK `users`），即一个 Person 可以是真实账户，也可以只是通讯录条目。

已确认：[docs/19-people-and-roles.md](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/19-people-and-roles.md) 明确区分两种语义——"Assigning a task to a member notifies them and gives them access to that task"（产生 `task_assigned` 通知，出现在"Assigned to me"，可打开并完成），而"Assigning a task to a contact is only a label"。可指派对象由 `GET /api/people/assignable` 与 `GET /api/projects/:uid/assignable-people` 提供。同文件定位："Tududi is meant for one person, a family or a small team"。

架构判断：`assigned_to` 是**归属标注 + 访问授权 + 通知**，不是执行租约。没有 claim/lock/heartbeat/超时回收/失败转移；把它重新指向另一个执行者只是一次普通字段更新。若把 Person 当作 Agent 身份使用，并发安全完全依赖调用方自律。这是"任务承接宿主"与"调度器"的分界线。

### 唯一的自动状态迁移是重复任务的"原地推进"，且发生在请求路径内，不是后台实例化——上一版报告此项结论错误

已确认：[docs/01-recurring-tasks-behavior.md](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/01-recurring-tasks-behavior.md)（文档版本 1.0.0，Last Updated 2026-03-14）："A recurring task is a single task that automatically resets itself when completed"、"The task doesn't create copies - it's the same task reusing itself"、未来 occurrence 是**虚拟的**——"They don't exist in the database as separate tasks - they're computed from the parent task's recurrence pattern"，概念名为 **In-Place Advancement**；历史记入 `recurring_completions`（跳过记 `skipped = true`）。

已确认：推进逻辑在 [`backend/modules/tasks/operations/recurring.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/modules/tasks/operations/recurring.js)（`handleRecurrenceUpdate`/`calculateNextIterations`/`skipRecurringOccurrence`），由 [`routes.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/modules/tasks/routes.js) 在**完成请求的处理路径中同步调用**；跳过经 `POST /api/task/:uid/skip-occurrence` 或 MCP `skip_task_occurrence`。

已确认：[`backend/modules/tasks/taskScheduler.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/modules/tasks/taskScheduler.js) 注册 14 个 node-cron 频率（daily `0 7 * * *`、weekdays `0 7 * * 1-5`、weekly `0 7 * * 1`、1h/2h/4h/8h/12h 摘要，`cleanup_tokens 0 2 * * *`，`deferred_tasks */5`，`due_tasks */15`，`due_projects */15`，`habit_reminders */5`，`account_lifecycle 0 3 * * *`），**其中没有重复任务实例化作业**。`deferredTaskService.js` 与 `dueTaskService.js` 只 `import { Task, Notification, User }` 并按状态过滤，**仅创建 `Notification` 行，零状态写入**。

更正：上一版报告"后台由 taskScheduler 用 node-cron 配合 recurringTaskService 生成实例"的表述不成立。该行为文档在本轮窗口之前（2026-03-14）即已如此描述，属上轮调研的误判，非产品变更。

架构判断：即便这唯一的自动迁移，也是**由用户完成动作触发的同步副作用**，不是调度器推进。它没有"到点自动开始"、"上游完成自动解锁下游"、"失败自动重试"中的任何一种。

### Agent 接入面是 MCP（65 工具）+ REST，但 MCP 写工具复制业务逻辑而未复用服务层，导致 Agent 写入绕过重复推进且不产生审计行

已确认：[docs/14-mcp-integration.md](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/14-mcp-integration.md) 列出 **65 个工具 / 12 个分类**（Tasks 12、Comments 2、Projects 5、Inbox 6、Views 5、Goals 5、Areas 5、Notes 5、Tags 5、Habits 9、People 5、Misc 1）。传输为 **stdio**（`TUDUDI_API_TOKEN` + `node backend/modules/mcp/server.js`）与 **HTTP**（Bearer，`POST /api/mcp`，文档自述"Streamable HTTP (stateless mode)"，浏览器客户端需 `mcp-remote`）。已列客户端：Claude Desktop、Cursor、VS Code + Continue、Windsurf、Zed。工具面已覆盖依赖语义：`list_tasks` 带 `blocked` 布尔过滤；`create_task_relation`（"Circular blocking chains are refused, and you need edit access to both tasks"）、`list_task_relations`、`remove_task_relation`；`create_task`/`update_task` 接受 `assigned_to`（Person UID）与 `defer_until`。

已确认（关键缺陷）：[`backend/modules/mcp/tools/taskTools.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/modules/mcp/tools/taskTools.js) 的 `complete_task` 实现为裸 `task.update()`：

```js
const newStatus = task.status === 2 ? 0 : 2;
// Completing a blocked task is allowed; the caller is told.
const openBlockers = newStatus === 2 ? await relationsService.getOpenBlockers(task, context.userId) : [];
const updates = { status: newStatus, completed_at: newStatus === 2 ? new Date() : null };
await task.update(updates);
```

即：(a) 被阻塞的任务**允许完成**，仅在返回值附 `warning` 与 `open_blockers`（[docs/14-mcp-integration.md](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/14-mcp-integration.md) 原文确认此行为）；(b) 走裸 `update()` 因此**跳过重复任务的原地推进**；(c) `backend/modules/mcp/tools/*.js` 中不含 `logEvent` / `taskEventService` / `createNotification` 调用，而 `operations/recurring.js` 与 `routes.js` 含——**MCP 写入不产生 `TaskEvent` 审计行**。

已确认：该问题已在仓库被提出——[issue #1646](https://github.com/chrisvel/tududi/issues/1646)（2026-09-26 开启）指出 REST 路径 `PATCH /api/task/:uid` 行为正确、MCP 路径不正确；截至本轮窗口**仍为 open，0 条评论**。

架构判断：这是接入层面的实质风险，不是风格问题。**Agent 通过 MCP 写入与用户通过 UI/REST 写入不等价**，会静默丢失重复推进与审计链。若以 tududi 作为 Agent 对象层，写入应走 REST（`/api/v1`）而非 MCP，或等待 #1646 修复后复验。

### DailyPlan 是持久对象但不是编排对象：不入备份、不自动结转、无 MCP 工具、并发写后者覆盖

已确认：[`backend/models/daily_plan.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/models/daily_plan.js) 为 `{uid, user_id, plan_date DATEONLY, started_at, ai_wrap_up JSON}`，唯一索引 `[user_id, plan_date]`；[`daily_plan_item.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/models/daily_plan_item.js) 为 `{daily_plan_id, task_id, position, start_minute, duration_minutes=30}`，唯一索引 `[daily_plan_id, task_id]`。排序与时间片确实落库。

已确认：[docs/20-daily-plan.md](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/20-daily-plan.md) 的 Known limitations 三条原文——"Two open planners for the same day overwrite each other; the last save wins."、"Unfinished tasks are not carried over to the next day's plan."、"There are no MCP tools for the plan yet."；数据模型节另述"Plans and feeds are not included in backups: plans are short-lived"。`PUT /api/daily-plan/:date` 语义为**整体替换**，并"Rejects overlaps, slots past midnight, duplicates and tasks the user cannot see"。

已确认：候选排序由 [`backend/modules/daily-plan/ranking.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/modules/daily-plan/ranking.js) 计算（十个桶 × 项目/无项目），次序存于 `users.ui_settings.planning.candidateOrder`；筛选设置由 `planningSettings.js` 读取。这是**读取期排序/过滤**，不写状态、不触发执行。

架构判断：DailyPlan 是"今天打算做什么"的持久化清单，不是工作流编排对象——它不参与任务状态迁移，不被备份视为需要保留的数据，不向 Agent 暴露。AI 侧的 `sanitizeDraft`（[`backend/modules/daily-plan/ai.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/modules/daily-plan/ai.js)）只做冲突消解与 15 分钟网格对齐，产出仍是本地自动保存的清单。

### 主体功能完全运行在本地/自托管实例上；tududi Cloud 是同一 MIT 镜像加一个开关，无闭源云端核心

已确认：云端与自托管共用同一镜像，差异仅由 `TUDUDI_HOSTED_MODE=true` 触发（[docs/17-hosted-mode.md](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/17-hosted-mode.md)："It is off by default and a self-hosted install never needs it. Everything in this document is a no-op until `TUDUDI_HOSTED_MODE=true`"）。官方 Cloud 页面原文："Exactly the same app. No cloud-only features and no crippled self-hosted build. If we ever shut the service down you get your data and a migration guide."（[tududi.com/cloud](https://tududi.com/cloud/)）。计费路由在自托管实例上**全部返回 404**（同 docs/17）。

已确认：hosted 模式启动时强校验（`config/hostedConfig.js`）——未配置 session secret、trust proxy、allowed origins、public URLs、email 与 **PostgreSQL** 则拒绝启动。多租户边界是 [`accounts`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/models/account.js) 表（模型注释："A customer's account on a hosted instance… Self-hosted instances leave this table empty."）；`account_admin` 只管自己账户，实例级 `is_admin` Superadmin 全局唯一。权限由 `entitlementsService.js` 解析（顺序：hosted off → admin exemption → admin override → active/trialing subscription → past-due grace → local trial → free），且"**Only creation is ever limited.** Reads, edits, completing, deleting, exporting and downloading always work."

已确认：云端定价为单一计划——€5/月/人 或 €50/年/人（EARLY BIRD，价格不含税，由支付服务商代收），14 天免费试用无需信用卡，试用期内**不含 AI 助手、公开笔记链接、添加成员**；页脚明示"Would you rather run the server yourself? That is free, and it is the same application."（[tududi.com/cloud](https://tududi.com/cloud/)）。托管侧技术形态：Caddy + `web`（关闭作业）+ `worker`（开启作业）+ PostgreSQL 16（[docs/examples/docker-compose.hosted.yml](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/examples/docker-compose.hosted.yml)）；官方部署使用 Kamal（[Dockerfile](https://github.com/chrisvel/tududi/blob/v1.9.1/Dockerfile) 中 `LABEL service="tududi"` 的注释："# service: Kamal (the hosted deploy) refuses images without it."，仓库内不含 Kamal 配置）；数据库每晚 dump 并存放到服务机之外（Cloud 页"Backups you do not have to remember"）。支付商为 Lemon Squeezy（merchant of record，自行处理 VAT 与发票）或 Stripe，由 `BILLING_PROVIDER` 选择。

Local 优先判断：**符合**。主体功能（任务、关系、重复、计划、通知、MCP、CalDAV、Telegram、AI）全部在自托管实例内运行，MIT 许可，导出永不被付费墙拦截，`TUDUDI_REQUIRE_SUBSCRIPTION` 的 402 墙也显式放行 profile/密码、备份导出与下载、全部 `/api/billing`、以及认证路由。**选型缺陷不在 Local 优先性上**，而在下条。

### 选型缺陷是工作机形态：无原生 Windows/macOS 桌面应用，只有浏览器 PWA；且云端无免费档

已确认（macOS 与 Windows 分别核验）：仓库根 [`package.json`](https://github.com/chrisvel/tududi/blob/v1.9.1/package.json)（v1.9.1）无任何桌面打包脚本，全仓库除 `package-lock.json` 的传递依赖外无 Electron/Tauri 痕迹；官网 `/download`、`/desktop`、`/app` 均返回前端 SPA 外壳（无 canonical、无 h1），不存在桌面下载页。

已确认：客户端形态为**可安装 PWA**。[docs/15-pwa.md](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/15-pwa.md) 给出按浏览器区分的安装方式，且安装表是 per-browser 的：
- **Windows**：Chrome/Edge → 地址栏图标或 ⋮ → Install app（桌面版 Chrome/Edge/Firefox/Safari 的 Web Push 均为 Yes）。
- **macOS**：Safari（iOS 16.4+ 对应移动端；macOS Safari 走 Share/Add to Home Screen 语义）或 Chrome/Edge 桌面安装；桌面浏览器 Web Push 支持为 Yes。
- 两个平台共同的已知限制（原文）："no conflict resolution (last writer wins)"，且 iOS 无 Background Sync API。
- 子路径部署（如 Home Assistant ingress）会破坏安装提示，因为 `start_url`/`scope` 静态写死为 `/`。

已确认：云端**无免费档**——只有 14 天试用，之后单一付费计划；Free 计划仅存在于自托管（`TUDUDI_HOSTED_MODE=false` 时计划与限额完全不生效），而 hosted 模式下 Free 档为 200 活跃任务 / 10 项目 / 50 笔记 / 50MB 附件 / **0 次 AI 请求 / 0 成员，且不含 AI 助手、MCP、CalDAV、Telegram、备份导入**（[docs/17-hosted-mode.md](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/17-hosted-mode.md) 计划表；`TUDUDI_PLANS_JSON` 可深合并覆盖）。实际 Cloud 页面直接售卖单一计划，未展示 Free 档。

架构判断：若要求在工作机上以本地进程形态运行，tududi 只能通过 Docker 单容器（[`docker-compose.yml`](https://github.com/chrisvel/tududi/blob/v1.9.1/docker-compose.yml)：单服务，卷 `./tududi_db:/app/db`、`./uploads`、`./backups`，端口 `3002:3002`）或源码 `npm start` 运行，再以浏览器访问——Windows 与 macOS 上均需 Docker Desktop 或 Node.js 22 运行时，无一键安装包。这是本产品在双平台工作机场景下的主要接入成本。

### AI 不是云端专属能力，但自托管与托管的配置权归属相反

已确认：[docs/13-ai-assistant.md](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/13-ai-assistant.md) —— **自托管**为 per-user provider（API key / base URL / model 存库，key 由 [`backend/shared/crypto/secretCipher.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/shared/crypto/secretCipher.js) 静态加密，按字段覆盖 `.env`；UI 只显示末 4 位与 Clear）；**hosted 模式下 `PUT/GET /api/profile/ai-settings` 返回 403**，只能用运营方 `.env` 的 provider，并要求 `LLM_API_KEY`，按日历月计 AI Credits。

已确认：环境变量为 `LLM_API_KEY|OPENAI_API_KEY`、`LLM_BASE_URL|OPENAI_BASE_URL`、`LLM_MODEL|TUDUDI_AI_MODEL`（默认 `gpt-4o-mini`）；[`backend/modules/ai-assistant/service.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/modules/ai-assistant/service.js) 使用 `require('openai')`，`resolveAIConfig()` 返回 `{apiKey, baseURL, baseUrlSource:'user'|'env'|null, model, modelSource:'user'|'env'|'default'}`，不安全 base URL 抛 `AI_BASE_URL_UNSAFE`；未配置时无 key → 503 `AI_NOT_CONFIGURED`，`GET /api/ai-assistant/config` → `api_key_set:false`。

已确认（Local 相关性）：**per-user base URL 必须是公网地址**（SSRF 守卫 `modules/url/ssrfGuard.js`），本地模型只能由运营方设 `LLM_BASE_URL` 指向 localhost——文档原文说明这正是"self-hosted local Ollama setup is meant to work"的方式。即：本地模型可用，但配置权在部署者而非终端用户。

已确认：规划器 AI 需 per-user 开关（Profile → Features）否则 403；而 planning tips 是**本地计算，从不调用模型**（[docs/20-daily-plan.md](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/20-daily-plan.md)）。

### 默认零外部依赖的单容器 SQLite；一旦要多进程/多副本，PostgreSQL 14+ 成为硬依赖，且仍无消息队列

已确认：默认 `dialect:'sqlite'`（WAL + mmap），单容器可直接跑，`DB_FILE=/app/db/production.sqlite3`（[Dockerfile](https://github.com/chrisvel/tududi/blob/v1.9.1/Dockerfile) ENV 默认值）。

已确认：[docs/16-postgresql.md](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/16-postgresql.md) —— PostgreSQL 14+ 为可选引擎，两引擎均进测试与 CI；`start.sh` → `scripts/db-prepare.js`（缺 `users` 表则 `sequelize.sync()` 建基线 + 写 `SequelizeMeta`，并 seed `registration_enabled=false`）→ `sequelize-cli db:migrate`；历史迁移是 SQLite-only 且不在 PG 上重放；**无内置 SQLite→PG 迁移工具**（跨引擎只能走 per-user JSON 导出/导入）；容器在迁移失败时拒绝启动；`DB_POOL_MAX` 每进程 10，需保证 `max_connections > DB_POOL_MAX × 进程数` 并为 psql/备份/**MCP server** 留余量；PG 会话时区为 UTC 且用 `timestamptz`；JSON 列存为 `json`；"SELECT … FOR UPDATE … honoured by PostgreSQL (SQLite ignores it)"；迁移在 advisory lock 下执行（[`scripts/with-db-lock.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/scripts/with-db-lock.js)）。

已确认：多进程协调机制为 [`backend/services/jobLock.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/services/jobLock.js)，导出 `withJobLock`/`tryBecomeLeader`/`releaseLeadership`/`isLeader`；文件头注释原文："On PostgreSQL an advisory lock makes exactly one process run each job; on SQLite there is only ever one process, so a local mutex is enough."消费方为 `demo/service.js`（`demo-reset`）、`tasks/taskScheduler.js`（`task-scheduler:${frequency}`）、`telegram/telegramInitializer.js`（leader）、`caldav/services/sync-scheduler.js`（`caldav-sync`）。

已确认：[docs/22-kubernetes.md](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/22-kubernetes.md) —— 无 Helm chart，`docs/examples/kubernetes/` 为纯 manifest；SQLite 下**必须单副本**（`replicas: 1` + `Recreate`），"Two pods would write to the same file and send everything twice"；要 >1 web pod 必须换 PostgreSQL 并按 `docker-compose.hosted.yml` 拆分 web/worker（web 侧 `DISABLE_SCHEDULER=true`、`DISABLE_TELEGRAM=true`）；**SQLite 置于 NFS/SMB 可能损坏文件**；镜像以 root 启动修正 `/app/db`、`/app/uploads` 属主后降到 uid 1001，NFS `root_squash` 场景需直接 `runAsUser: 1001` 并跳过 entrypoint；"Don't copy the SQLite file while the pod is running, the WAL makes that copy unreliable."

依赖裁剪边界（已确认）：`CALDAV_ENABLED` 出现在 [`backend/.env.example`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/.env.example) 但**在后端 JS 中无任何消费点**，[`backend/app.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/app.js) 无条件 `app.use(caldavRoutes)`；MCP **不存在启用/禁用开关**（docs/14 自述"Enabled by default"）；[`backend/modules/feature-flags/service.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/modules/feature-flags/service.js) 只上报 `{hosted, billing}`。可裁剪项为 `DISABLE_SCHEDULER`、`DISABLE_TELEGRAM`、`ENABLE_EMAIL`、`OIDC_ENABLED`、`PASSWORD_AUTH_ENABLED`、`PROJECT_TEMPLATES_ENABLED`；必需最小集为 `TUDUDI_USER_EMAIL`、`TUDUDI_USER_PASSWORD`、`TUDUDI_SESSION_SECRET`。

架构范式判断：**单机优先的模块化单体**。横向扩展的正确姿势不是加副本，而是"web（无作业）+ worker（有作业）+ PostgreSQL"的两角色拆分；协调原语是数据库 advisory lock + leader 选举，**不是消息队列**。要把它改造成可分派 Agent 任务的调度器，需要新增的正是它完全没有的那一层（队列/租约/认领/重试），而不是调参。

### 通信形态为 HTTP 请求-响应 + 前端 30 秒轮询 + Web Push，无 WebSocket/SSE；客户端唯一持有的状态是 PWA 离线写队列

已确认：[`frontend/components/Notifications/NotificationsDropdown.tsx`](https://github.com/chrisvel/tududi/blob/v1.9.1/frontend/components/Notifications/NotificationsDropdown.tsx) 第 103 行为 `const interval = setInterval(fetchUnreadCount, 30000);`；生产代码中无 WebSocket/SSE/EventSource 通道。MCP HTTP 传输自述为 stateless 模式（[docs/14](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/14-mcp-integration.md)），即不维持会话态长连接。

已确认：推送为 **Web Push（VAPID）**，在 Profile → Notifications 按设备订阅；Android 经 FCM/Mozilla push，**iOS 16.4+ 仅限已安装到主屏的应用**，桌面 Chrome/Edge/Firefox/Safari 均支持（[docs/15-pwa.md](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/15-pwa.md)）。

已确认：离线语义（同 docs/15）——`handleApiGet` 网络优先 + `tududi-api-v1` 陈旧回退 + `503 {offline:true}`；`handleApiMutation` 写入 IndexedDB（库 `tududi-offline` / store `tududi-sync-queue`）并返回 `202 {queued:true}` + `X-Tududi-Queued: 1`，Background Sync tag `tududi-sync`；重放前重新获取 CSRF；`SYNC_COMPLETE` 触发 SWR 全局 `mutate(() => true)`。已知限制：无冲突消解（后者胜）、iOS 无 Background Sync API、离线创建存在 ID 依赖限制、错误会话重放风险由 user-ID 标注缓解。

架构判断：**服务端不主动向客户端推送任务**。任何"任务可执行"的信号都必须由客户端轮询或用户操作拉取。这对 Agent 接入意味着：Agent 侧需要自建轮询或被外部事件源驱动，tududi 不提供订阅式任务分发。

### 维护活跃度极高但为单维护者项目（bus factor 1），且公开路线图不含自动化/Agent/调度项

已确认：版本节奏——上轮窗口 v1.4.0-rc.1（2026-08-10）至本轮 v1.9.1（2026-10-10），期间 ≥ v1.5.0 共 41 个 release，最近 10 天内 8 个 tag（v1.7.10/v1.7.11 2026-10-06、v1.7.12 10-07、v1.8.0 10-08、v1.8.1/v1.8.2 10-09、v1.9.0/v1.9.1 10-10，[GitHub Releases](https://github.com/chrisvel/tududi/releases)）。仓库计数 3431 stars / 266 forks；**9 open issues / 672 closed issues / 908 closed PRs**。

已确认：贡献者分布高度集中——chrisvel 1269 commits，次位贡献者 23 commits（[GitHub Contributors](https://github.com/chrisvel/tududi/graphs/contributors)）。**bus factor = 1**。

已确认：[CHANGELOG.md](https://github.com/chrisvel/tududi/blob/v1.9.1/CHANGELOG.md) 中 v1.5.0 记录了本轮演进的关键基础设施项："Several app processes can share one PostgreSQL database: schema and migrations run under an advisory lock, scheduled jobs and Telegram polling elect one runner, and rate limits are stored in the database (#1476)"，以及 `GET /api/health/ready`、pino 结构化日志、Backup format 2 (#1486)、`GET /api/tasks` 数据库分页 (#1487)、entrypoint 不再重置 bootstrap admin 密码 (#1473)。v1.6.0 记录 Cloud 开放（移除 waitlist 与 `cloudOpen` 标志）。v1.4.2 起改为引用 GitHub release notes。

已确认：官方公开 roadmap 看板中**不含自动化、Agent 编排或调度相关条目**。

架构判断：产品演进方向是"个人/家庭/小团队的生活与工作组织系统 + 云端订阅"，不是任务编排平台。对本专项而言，tududi 的路线不会自行长出调度能力；若采用，调度层需自建并长期维护。单维护者风险需计入长期依赖评估。

## 调研目标

- 判定 tududi 是否构成 Stateful 任务调度器：是否持久拥有工作对象、对象关系、任务状态与执行归属，并是否决定可执行时机、推进顺序、执行者与失败后继续方式。
- 核实其工作对象模型与任务关系/生命周期的真实语义，尤其是"阻塞"是否门禁状态迁移。
- 核实 Agent 接入面（MCP / REST）的能力范围，以及 Agent 写入语义是否与用户路径等价。
- 核实部署形态与 Windows/macOS 工作机支持，判断主体功能是否可完全在本地/自托管运行（Local 优先）。
- 核实云端形态是否为闭源核心、是否构成功能裁剪或依赖绑定。
- 核实维护活跃度、开源许可、依赖根与改造边界。

## 产品定位与核心流程

已确认：tududi 自述为组织生活与工作的系统，目标人群是"one person, a family or a small team"（[docs/19-people-and-roles.md](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/19-people-and-roles.md)）。核心流程是 GTD 式的：Inbox 收集 → Areas/Projects/Tags 归类 → Today 规划（Planning 模式 `/today/plan` 与 Doing 模式 `/today`，经典 Today 页已移除，`/today_legacy` 重定向）→ 完成/重复推进 → 洞察报告。

已确认：v1.9.1 的 [`README.md`](https://github.com/chrisvel/tududi/blob/v1.9.1/README.md) 新增了 "Families & Small Teams" 特性块（"Assign to anyone… see everyone's day on one Everyone board"），并把数据库表述为 "SQLite or PostgreSQL"、CalDAV "enabled by default"（凭证 AES-256-GCM 加密）。这标志产品重心从单人向小团队协作扩展。

架构判断：其核心流程的推进动力全部来自**人的操作**。系统提供的是可见性（列表、看板、日历、Everyone board、Insights）与提醒（通知、邮件、Web Push、Telegram），不提供自动推进。

## 工作对象模型与调度判定

### 对象模型

已确认：持久对象包括 Task、Project、Area、Note、Tag、Goal、Habit、InboxItem、View、Person、DailyPlan/DailyPlanItem、TaskRelation、TaskEvent、RecurringCompletion、Notification、User/Role/Permission/Group、Account（hosted）、CalendarFeed、BillingAccount/BillingEvent/UsageCounter（hosted）、PushSubscription、WaitlistSubscriber（landing）。模型目录见 [backend/models](https://github.com/chrisvel/tududi/tree/v1.9.1/backend/models)。

已确认：[`Task`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/models/task.js) 定义 `Task.STATUS = { NOT_STARTED:0, IN_PROGRESS:1, DONE:2, ARCHIVED:3, WAITING:4, CANCELLED:5, PLANNED:6 }`、`Task.PRIORITY = { LOW:0, MEDIUM:1, HIGH:2 }`、`RECURRENCE_TYPE` = none/daily/weekly/monthly/monthly_weekday/monthly_last_day；自关联两套（`parent_task_id` 的 ParentTask/Subtasks，`recurring_parent_id` 的 RecurringParent/RecurringChildren）；另有 `estimated_minutes`（5–720，见 [docs/20](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/20-daily-plan.md)）、`ai_insights`（JSON）、`involves`（JSON）；共 11 个索引。

已确认：审计为持久化的 [`task_events`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/models/task_event.js)，`event_type` 的 `isIn` 含 `status_changed`、`completed`、`archived`、`recurring_occurrence_completed`、`recurring_occurrence_skipped`、`comment_added`、`relation_added`、`relation_removed`，并带 `field_name`/`old_value`/`new_value`（JSON）/`user_id`（行为者）。

### 任务关系与生命周期

已在"交付结论"第 2、4 条详述，此处只补状态迁移的判定要点。

已确认：[docs/00-tasks-behavior.md](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/00-tasks-behavior.md) 明确——完成动作只设置/清除 `completed_at`；状态转 Done 是手动的/复选框驱动；"No automatic status changes when due date passes"；子任务有独立状态；父项目变更不级联到子任务。

架构推导：由此可推断 tududi 的状态机是**纯人工驱动的标注系统**。WAITING/PLANNED 两个状态具有调度语义的外观，但没有任何机制在进入/退出这两个状态时触发下游动作。

### 执行归属与 Agent 分派

已在"交付结论"第 3 条详述。补充：

已确认：成员可无邮箱——通过登录链接（有效期 30 天，`RATE_LIMIT_SIGN_IN_LINK_MAX` 30 次/15 分钟/IP，审计记录，撤销即结束所有会话）接入（[docs/19](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/19-people-and-roles.md)）。角色为 Admin/user/guest 并带 capability 集合。

已确认：[`backend/services/workspaceMembers.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/services/workspaceMembers.js) 头注释："The people a user works with: everyone they share something with (in either direction), everyone who is in a group with them, and the accounts they created or that created them."——**"workspace" 是派生概念而非持久对象**；hosted 模式下的租户边界是 `accounts` 表。

架构判断：不存在 Agent 身份模型。若要接入 Agent，只能借用 Person（可选 `linked_user_id` 绑定真实用户）作为身份载体，并自行承担并发认领安全。

### 后台自动化与任务队列

已在"交付结论"第 4、10 条详述。

已确认：全部后台自动化 = taskScheduler 的 14 个 cron 频率（摘要推送、token 清理、到期提醒、延迟任务提醒、习惯提醒、账户生命周期）+ CalDAV 同步调度 + Telegram 轮询 + demo 重置。全部为**通知/维护型**，无状态推进型作业。

已确认：`account_lifecycle`（03:00 UTC）是 hosted 模式的账户生命周期作业：发送删除警告（距删除 ≤7 天）、仅删除已警告 ≥7 天的账户、向 1–7 天未验证的自注册用户发送一次验证提醒（[docs/17](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/17-hosted-mode.md)）。它作用于**账户**而非任务，与任务调度无关。

## 技术架构

### 系统全貌与运行形态

已确认：Node.js 22 + Express 4.21.2 + Sequelize 6.37.7 后端；React 18.3.1 + TypeScript 5.6.2 + Webpack 5 + Tailwind + Zustand + SWR 前端；node-cron 4.1.0；pino 结构化日志；Nodemailer；Multer 附件；Swagger（`SWAGGER_ENABLED=false` 默认，`/api-docs` 需认证）。依赖清单见 [`package.json`](https://github.com/chrisvel/tududi/blob/v1.9.1/package.json)。

```text
Browser / 可安装 PWA (React 18 + TS + Webpack + Tailwind + Zustand + SWR)
      | HTTPS REST /api/v1 (session cookie 或 Bearer)  | 30s 轮询未读数  | Web Push (VAPID)
      | 离线: IndexedDB 写队列 + Background Sync(tag tududi-sync)
      v
Express 单进程 (Node 22)
      |-- MCP (stdio / Streamable HTTP stateless, 65 工具)   |-- CalDAV 服务端 + 远程同步
      |-- Telegram 轮询(leader)   |-- OIDC/SSO + OAuth2 JWT 资源服务器(RFC 9728)
      |-- node-cron 14 频率 (taskScheduler) —— 仅通知/维护, 无状态推进
      |-- jobLock: PG advisory lock / SQLite 进程内 mutex
      v Sequelize
SQLite (WAL+mmap, /app/db)  或  PostgreSQL 14+      + 附件 /app/uploads + 备份 /app/backups
```

已确认：镜像构建为多阶段（builder `--platform=$BUILDPLATFORM node:22-alpine`，运行 `node:22-alpine`），`npm install --omit=dev` 后裁剪 node_modules 并做 smoke require，APP_UID/GID 1001，`dumb-init` + `su-exec`，`VOLUME /app/db /app/uploads /app/backups`，`EXPOSE 3002`，`HEALTHCHECK wget --spider http://127.0.0.1:3002/api/health`，ENTRYPOINT [`scripts/docker-entrypoint.sh`](https://github.com/chrisvel/tududi/blob/v1.9.1/scripts/docker-entrypoint.sh)（`set -eu`，支持运行时 PUID/PGID 覆盖，`DATABASE_URL` 或 `DB_DIALECT=postgres` 时跳过 SQLite 权限修正，`chown -R` 后 `exec su-exec … dumb-init -- /app/backend/cmd/start.sh`）。

已确认：运行形态三档——(a) 单容器 + SQLite（[`docker-compose.yml`](https://github.com/chrisvel/tududi/blob/v1.9.1/docker-compose.yml)，最简）；(b) Caddy + web + worker + PostgreSQL 16（[`docker-compose.hosted.yml`](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/examples/docker-compose.hosted.yml)：postgres `max_connections=60`/`shared_buffers=256MB`/`pg_isready` healthcheck，web `DB_POOL_MAX=10` + `DISABLE_SCHEDULER=true` + `DISABLE_TELEGRAM=true` + `expose: 3002`，worker `DB_POOL_MAX=5` 且两个 DISABLE 均 false，共享 `./uploads`、`./backups`；[`Caddyfile`](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/examples/Caddyfile) 为 `reverse_proxy tududi-web:3002` + X-Forwarded-Proto/For + HSTS + `-Server` + JSON 日志）；(c) Kubernetes 纯 manifest（单副本约束见前）。开发形态为 backend:dev（:3001）+ frontend:dev（:8080）双进程。

已确认：`GET /api/health/ready` 为就绪探针（CHANGELOG v1.5.0）；hosted 模式下 `GET /api/health` 省略 environment 与 proxy 设置（[docs/17](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/17-hosted-mode.md)）。

### 主要依赖

已确认：数据库 SQLite（默认，WAL + mmap）或 PostgreSQL 14+（多进程/多副本/hosted 模式必需）。AI 走 OpenAI 兼容 SDK（`openai` 包）。推送走 Web Push（VAPID）。支付走 Stripe 或 Lemon Squeezy。人机验证走 Cloudflare Turnstile（`TURNSTILE_SITE_KEY`/`TURNSTILE_SECRET_KEY`，表单以 `captcha_token` 提交，Cloudflare 不可达时放行并记录，故其故障不会锁死用户）。

已确认：SSRF 守卫为 `backend/modules/url/ssrfGuard.js`，用于远程日历 feed（仅公网主机，逐个重定向校验，`CALDAV_ALLOW_PRIVATE_HOSTS=true` 才允许 LAN，永不允许 link-local/元数据地址；10 秒超时、5MB 上限、每进程缓存 15 分钟）与 per-user AI base URL。

已确认：备份——SQLite 在迁移前与启动时备份到文件旁，**PostgreSQL 部署跳过该机制，需自行用 cron 跑 `pg_dump`**；迁移快照刻意不命名为 `db-backup-*` 以免被 7 天保留策略删除；>7 天自动清理；恢复前须先删除 `-wal`/`-shm`（[docs/backups.md](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/backups.md)）。

### 接口形态

已确认：三类接口并存——

1. **REST `/api/v1`**（主接口，Swagger 可选）；
2. **MCP**（65 工具，stdio + Streamable HTTP stateless；认证由 `requireAuth` 处理 API key 或 OAuth2 JWT，见 [`backend/modules/mcp/middleware.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/modules/mcp/middleware.js)；`backend/modules/oauth/routes.js` 提供 `/.well-known/oauth-protected-resource`，`backend/middleware/auth.js` 设置 `WWW-Authenticate: Bearer resource_metadata=…`，即 RFC 9728 资源服务器发现）；
3. **CalDAV 服务端 + 远程同步**（双向，凭证 AES-256-GCM 加密），另有只读 iCal calendar feeds（"Tududi never writes to these calendars"，[docs/20](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/20-daily-plan.md)）。

已确认：直接 HTTP 探测 MCP 可用 `GET /api/mcp/tools`、`GET /api/mcp/config`、`POST /api/mcp`；"Every MCP tool query includes `user_id` filtering"（[docs/14](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/14-mcp-integration.md)）。MCP 于 v1.0.0 经 PR #953 引入。

已确认：`update_task` 的入参约束为"Any parameter not in the table above is rejected"——白名单式，Agent 侧不能透传任意字段。

### 持久化方式

已确认：Sequelize ORM + 迁移。PG 下 JSON 列存为原生 `json`，时间用 `timestamptz`，会话时区 UTC，`SELECT … FOR UPDATE` 被 PG 尊重而 SQLite 忽略。DailyPlan/CalendarFeed **不进备份**（计划短命，feed 地址用本机密钥加密）。hosted 模式的 `billing_accounts`/`billing_events`/`usage_counters` 三表由 `services/accountErasureService.js` 随账户删除。

已确认：升级安全网——每次启动把 SQLite 文件备份到同目录，迁移失败则容器拒绝启动；跨方言启动需显式 `TUDUDI_ALLOW_DIALECT_SWITCH=true`（[README](https://github.com/chrisvel/tududi/blob/v1.9.1/README.md)）；README 另有 v1.1→v1.2 卷路径变更导致数据丢失的警告。

### 通信方式

已在"交付结论"第 10 条详述（HTTP 请求-响应 + 30 秒轮询 + Web Push，无长连接；离线写队列在客户端 IndexedDB）。

补充已确认：Focus 作用域（area + 可选 project + 可选 tags，存 `ui_settings.focus`）由**客户端在每次列表请求上以普通 query 参数发送，服务端从不自行应用已保存的 Focus**；且 Calendar、Kanban、Eisenhower、Inbox 列表、tag/area 详情页、Habits、**REST API、MCP 与 Telegram 均不受 Focus 约束**（[docs/25-focus.md](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/25-focus.md)，实现 `backend/services/scopeService.js`）。DailyPlan 侧则保留全部条目并给每条打 `in_focus: true|false`，由 Today 与规划器把范围外的条目变暗（[docs/20](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/20-daily-plan.md)）。

架构判断：作用域是**表现层过滤器**，不是数据分区。Agent 经 MCP/REST 访问时看到的是全量数据，不受用户 UI 上的 Focus 影响——这一点对 Agent 接入是有利的（无隐式上下文丢失），但也意味着不能依赖 Focus 做权限或范围隔离。

## 部署形态与工作机支持

### macOS

已确认：**无原生 macOS 应用**。可用形态三种：

1. **Docker Desktop 单容器**——[`docker-compose.yml`](https://github.com/chrisvel/tududi/blob/v1.9.1/docker-compose.yml)，镜像 `chrisvel/tududi:${TUDUDI_VERSION:-latest}`，端口 `3002:3002`，卷 `./tududi_db:/app/db`、`./uploads:/app/uploads`、`./backups:/app/backups`；必需环境变量 `TUDUDI_USER_EMAIL`、`TUDUDI_USER_PASSWORD`、`TUDUDI_SESSION_SECRET`（[backend/.env.example](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/.env.example)）。
2. **源码运行**——Node.js 22，`npm install` 后 `npm start`；开发模式端口 3001（前端）/ 8080（后端），API base `http://localhost:8080/api/v1`（[README](https://github.com/chrisvel/tududi/blob/v1.9.1/README.md)）。
3. **官方 Cloud**——浏览器访问 `app.tududi.com`，€5/月/人或 €50/年/人，14 天试用（[tududi.com/cloud](https://tududi.com/cloud/)）。

运行入口：浏览器访问 `http://localhost:3002`（或 Cloud 域名）。可选：Safari/Chrome/Edge 安装为 PWA（Share → Add to Home Screen / 地址栏图标）。

依赖与权限：Docker Desktop 或 Node.js 22；数据目录写权限（容器内以 uid 1001 运行，宿主机目录需可被该 uid 写）；无系统级权限申请；无内核扩展/驱动。

网络要求：本地实例可完全离线运行（`ENABLE_EMAIL=false` 默认；远程日历 feed 与 AI 需出网，且 per-user AI base URL 必须是公网地址，本地模型只能由部署者用 `LLM_BASE_URL` 指向 localhost）；Cloud 需持续联网。反向代理场景需设 `TUDUDI_TRUST_PROXY` 为代理层数，并把公网 URL 放进 `TUDUDI_ALLOWED_ORIGINS`。

升级：拉新 tag 重启即可；每次启动自动把 SQLite 备份到同目录，迁移失败则拒绝启动（数据保持旧版可用）。跨方言需 `TUDUDI_ALLOW_DIALECT_SWITCH=true`。

卸载：删除容器与三个卷目录即完全移除；卸载前可 `POST /api/v1/backup/export` + `GET /api/v1/backup/<uid>/download` 取回全量数据（[docs/22](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/22-kubernetes.md)）。

### Windows

已确认：**无原生 Windows 应用**，官网无桌面下载页（`/download`、`/desktop`、`/app` 均为 SPA 外壳）。可用形态与 macOS 相同三种（Docker Desktop for Windows / WSL2 或原生 Node.js 22 源码运行 / 官方 Cloud）。

运行入口：浏览器访问 `http://localhost:3002`；Chrome/Edge 可安装为 PWA（地址栏图标或 ⋮ → Install app，[docs/15-pwa.md](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/15-pwa.md)）。

依赖与权限：Docker Desktop（需 WSL2 或 Hyper-V）或 Node.js 22；卷目录写权限（Windows 下经 Docker Desktop 文件共享映射，uid 1001 语义由 Docker 处理）；无系统级权限申请。

网络要求：与 macOS 相同。Web Push 在桌面 Chrome/Edge/Firefox 均支持（docs/15 安装表）。

升级与卸载：与 macOS 相同。

架构判断（双平台）：两个平台的结论一致——**tududi 在 Windows 与 macOS 上都不是本地应用，而是"本地服务器上运行的 Web 应用"**。它满足"数据与主体功能留在本地"的 Local 优先要求，但不满足"以原生进程形态集成到工作机"的要求。若选型需要桌面级集成（系统托盘、全局快捷键、本地文件监听、无浏览器依赖），tududi 需要额外封装，且封装层不在其产品范围内。

### 服务器容器与 Kubernetes

已在"交付结论"第 9 条详述（单副本约束、NFS/SMB 风险、uid 1001 与 `root_squash`、ingress-nginx 1MB body 限制需为附件调高、无 Helm chart）。

补充已确认：`docs/examples/kubernetes/deployment.yaml` 中镜像 tag 仍钉在陈旧的 `docker.io/chrisvel/tududi:1.5.0`——文档示例未随版本更新，直接复制会部署到旧版本（[docs/22](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/22-kubernetes.md) 与 `docs/examples/kubernetes/`）。

### 主体功能运行位置与 Local 优先判断

已在"交付结论"第 6 条详述。结论：**主体功能 100% 运行在自托管实例内，Local 优先成立**；无闭源云端核心；导出永不被付费墙拦截；停服承诺提供数据与迁移指南。

### 云端形态

已在"交付结论"第 6、7 条详述（同一镜像 + `TUDUDI_HOSTED_MODE=true`、`accounts` 多租户、`account_admin` vs 唯一 Superadmin、entitlements/plans/limits、按席位计费、Stripe 或 Lemon Squeezy、Turnstile、试用规则、`TUDUDI_REQUIRE_SUBSCRIPTION` 402 墙及其四类放行路由、Kamal 部署、单域名 `app.tududi.com`、无 SLA）。

补充已确认：hosted 模式的注册开关为管理员可切换的 `registration_enabled`，也是快速关闭注册的途径；OIDC 自动开户仅在注册开启时生效；首个注册用户成为 admin 的行为**仅存在于自托管**，hosted 下 admin 来自 `TUDUDI_USER_EMAIL`，且无角色时 `POST /api/admin/set-admin-role` 被拒绝（[docs/17](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/17-hosted-mode.md)）。

补充已确认：同一镜像可按主机名提供营销落地页（`backend/modules/landing/`，EJS 模板 + 26 种语言的 `locales/<code>/landing.json`），由 `TUDUDI_LANDING_HOSTS` 逐主机名开启，`TUDUDI_LANDING_URL` 用于 canonical/hreflang，`TUDUDI_LANDING_PRICING_JSON` 覆盖页面价格（默认 `{"monthly":5,"annual":49,"standard":99,"business":499,"launchActive":true}`）；落地主机上 `/` 与 `/<locale>` 渲染页面，`/api/*` 仍可用，其余路径 301 到 `FRONTEND_URL`。发布说明订阅写入 `waitlist_subscribers`（每地址一行，重复提交累加 `submission_count`），三种情形返回同一重定向以防枚举；管理员在 `/admin/waitlist` 查看并可导出 CSV（`GET /api/admin/waitlist/export`）。落地页有独立 CSP。

## 接入与改造边界

### 依赖根

已确认：依赖根为**单一 Node.js 进程 + 单一数据库文件/实例**。默认 SQLite 单容器无外部依赖；横向扩展时 PostgreSQL 成为依赖根，`web`/`worker` 拆分后 `worker` 成为定时作业与 Telegram 轮询的单点（由 advisory lock 保证唯一）。

已确认：`DISABLE_SCHEDULER` 与 `DISABLE_TELEGRAM` 是唯一的进程级功能剥离开关；MCP 与 CalDAV **不可剥离**（无开关，路由无条件挂载）。

### 最小接入路径

1. 读写任务/项目/笔记/领域优先走 **REST `/api/v1`**（个人 API token），不应绕过服务器直写数据库文件。
2. Agent 侧若用 MCP，需知悉写入语义与 REST 不等价（见"交付结论"第 5 条），至少对完成类写入改用 REST 直至 [issue #1646](https://github.com/chrisvel/tududi/issues/1646) 修复。
3. 依赖图读取用 `list_tasks?blocked=` 或 `GET /api/task/:uid/relations`；依赖写入用 `create_task_relation`（服务端拒绝环）。推进决策必须在调用方实现。
4. 第三方原生任务客户端可经 CalDAV 双向同步接入（含 RRULE）。

### 改造边界

架构推导（基于上述已确认事实）：

1. **要把 tududi 变成调度器，需要新增的层它完全没有**：任务队列、租约/认领、心跳与超时回收、失败重试与死信、执行者能力匹配。现有 `jobLock.js` 只解决"哪个进程跑 cron"，不能复用为任务分派。
2. **阻塞语义需从"读取期派生"改为"写入门禁"**，涉及 [`relations/service.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/modules/tasks/relations/service.js) 的 `blockedCondition()` 以及所有状态迁移入口（REST `routes.js`、MCP `taskTools.js`、CalDAV 同步、Telegram）。当前入口分散且已存在语义不一致（MCP 与 REST 不等价），改造面比看起来大。
3. **Agent 身份需寄生在 Person 上**，而 Person 的设计意图是"人"（`linked_user_id` 可选、contact 型 Person 只是标签）。作为 Agent 身份载体缺少 capability/并发控制/租约语义。
4. **DailyPlan 不可作为编排载体**：不入备份、整体替换语义、并发后者胜、无 MCP 工具、无自动结转。
5. **无服务端推送**，Agent 侧的"任务就绪"感知必须自建轮询或外部事件源。

已确认（有利面）：MIT 许可；MCP 与 REST 均已带 `user_id` 过滤与共享/角色权限模型；`task_events` 提供了可复用的审计基座；`task_relations` 提供了可复用的依赖存储；PostgreSQL 路径已经过多进程验证。这意味着**作为对象层与状态存储复用是低成本的，作为调度器改造是高成本的**。

## 维护状态、开源与公开反馈

已确认：MIT 许可（[LICENSE](https://github.com/chrisvel/tududi/blob/v1.9.1/LICENSE)）。发布节奏极高（近 10 天 8 个 tag，≥v1.5.0 共 41 个 release）。仓库计数 3431 stars / 266 forks / 9 open issues / 672 closed issues / 908 closed PRs。贡献者高度集中（chrisvel 1269 commits，次位 23），**bus factor = 1**。存在 `SECURITY.md` 与 `CODE_OF_CONDUCT.md`。社区渠道为 Discord、Reddit、GitHub Sponsors、Patreon、Buy a Coffee、PayPal（[tududi.com/cloud](https://tududi.com/cloud/) 页脚）。

已确认：商业化已成型——Cloud 单一计划（€5/月或 €50/年，EARLY BIRD，价格不含税，由支付服务商代收），14 天试用无需信用卡，试用不含 AI 助手/公开笔记链接/添加成员；退款与条款有独立页面（Terms / Privacy / Refunds）。Cloud 页面明示"No cloud-only features and no crippled self-hosted build"以及停服时提供数据与迁移指南。

架构判断：项目的可持续性风险主要在**单人维护**与**商业化早期**（EARLY BIRD 定价、无 SLA、无免费云端档）。对本专项的影响是：不应把关键调度语义寄托在 tududi 的路线图上（其公开 roadmap 不含自动化/Agent/调度），而应把它视为可替换的对象存储层。

## 未决项与证据边界

未决（官方来源之间自相矛盾，本轮已判定以哪个为准，但对方来源未更新）：

1. **功能开关是否存在**——docs.tududi.com 记载 `FF_ENABLE_CALDAV` / `FF_ENABLE_MCP` / `FF_ENABLE_BACKUPS` 三个开关，但 v1.9.1 源码中 `FF_*` 已不存在（后端 grep 无命中），[`backend/.env.example`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/.env.example) 的 `CALDAV_ENABLED` 无消费点，[`backend/app.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/app.js) 无条件挂载 CalDAV 路由，[`feature-flags/service.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/modules/feature-flags/service.js) 只上报 `{hosted, billing}`，而 [docs/14](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/14-mcp-integration.md) 自述 MCP "Enabled by default" 且未提开关。**判定：以源码为准，CalDAV 与 MCP 不可裁剪；docs.tududi.com 该页滞后。** 未决部分：hosted 模式下是否另有未在源码中体现的裁剪机制。
2. **通知渠道可用性**——docs.tududi.com/features/notifications 称 Email 与 Push "Not yet available"，而 v1.6.11（2026-10-02）已发布 Web Push，源码存在 `backend/modules/push/` 与 `push_subscription` 表，[docs/15-pwa.md](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/15-pwa.md) 详列各平台支持矩阵。**判定：营销站该页滞后，Push 已可用。** 未决部分：iOS 上"仅限已安装应用"的实际到达率。
3. **MCP 工具总数**——三个官方来源给出三个数字：65（[docs/14-mcp-integration.md](https://github.com/chrisvel/tududi/blob/v1.9.1/docs/14-mcp-integration.md)）、62（`docs/architecture.md`）、59（docs.tududi.com）。本报告采用仓库内 v1.9.1 的 65，但**未逐一枚举核对**，实际数字未决。

未决（官方未说明/未找到）：

4. **Cloud 的基础设施与合规细节**——官方未公布托管商、区域/数据驻留选项、SLA、正常运行时间承诺、备份保留期（页面只说"dumped nightly and kept off the machine"）、是否支持自定义域名、是否提供 DPA/SCC。仅能从 Dockerfile 的 Kamal 注释与 `docs/17` 推断部署方式。
5. **Cloud 的实际计划矩阵**——`backend/config/plans.js` 定义了 free/trial/pro 三档及 `TUDUDI_REQUIRE_SUBSCRIPTION` 402 墙，但 Cloud 页面只售卖单一计划。**`app.tududi.com` 上 Free 档是否对任何人可达、`TUDUDI_REQUIRE_SUBSCRIPTION` 是否已开启，未决**（需注册验证，本轮未执行）。
6. **CalDAV 双向同步的冲突处理语义**——README 称 CalDAV "enabled by default" 且为双向，但本轮未核验冲突消解规则（PWA 侧明示 last-writer-wins，CalDAV 侧未查证）。
7. **`docs/examples/kubernetes/` 示例的可用性**——deployment.yaml 钉在 v1.5.0，其余 manifest 是否与该版本兼容未核验。
8. **`Task.STATUS` 各状态间的允许迁移矩阵与责任方**——本轮仅确认枚举值与"无自动迁移"，未逐一核验每条迁移路径的服务端校验。

证据边界说明：

- 本报告未做源码审计。所有源码引用均为验证已提出的问题而定位的单点阅读（模型定义、关系服务、MCP `complete_task`、jobLock、taskScheduler、entrypoint、Dockerfile、compose 示例），未做全仓库遍历。
- "生产代码中不存在 worker/queue/lease/claim/dispatch 概念"这一否定性结论，其证据强度为：多进程协调机制的官方文档与实现（`jobLock.js` 头注释）明确指出协调原语是 advisory lock 与 leader 选举，且 K8s/hosted 文档在讨论横向扩展时从未提及队列；这是**架构推导**，非穷尽搜索证明。
- 本轮未实际部署或运行 tududi；离线队列、Web Push 到达、CalDAV 同步、并发认领等行为均来自官方文档与定点源码证据，未在目标环境复现。
- 按 RUNBOOK 要求，本报告不含遥测/监控/埋点调研内容。
- 按 Index 要求，本报告不含与其他产品的比较、选型矩阵或排名。

## 后续验证建议

1. **复验 [issue #1646](https://github.com/chrisvel/tududi/issues/1646)**：若已关闭，重新核验 [`mcp/tools/taskTools.js`](https://github.com/chrisvel/tududi/blob/v1.9.1/backend/modules/mcp/tools/taskTools.js) 是否改为复用 REST 服务层，并确认 MCP 写入是否产生 `TaskEvent` 与重复推进。这直接决定 Agent 写入路径选 MCP 还是 REST。
2. **实测并发认领**：用两个 `linked_user_id` 不同的 Person 同时对同一 Task 写入 `assigned_to` 与状态，确认是否存在任何服务端拒绝。用于量化"弱归属"的实际风险。
3. **实测阻塞门禁**：对一个 `blocked=true` 的任务分别经 REST `PATCH /api/task/:uid`、MCP `update_task`、CalDAV 写入、Telegram 完成，确认四条路径是否都能成功迁移状态。已知 MCP 允许并返回 warning，其余三条未实测。
4. **注册 Cloud 试用**核验未决项 5（Free 档可达性、`TUDUDI_REQUIRE_SUBSCRIPTION` 是否生效、AI Credits 计量口径）。
5. **本地部署 + 本地模型实测**：用 `LLM_BASE_URL` 指向 Ollama/LM Studio，核验 AI 规划、长度猜测、日终 wrap-up 在完全离线环境下的可用性与降级行为（`503 AI_NOT_CONFIGURED` 与 `AI_BASE_URL_UNSAFE` 的触发边界）。
6. **Windows/macOS 双平台实测 PWA**：核验安装后离线写队列的实际行为、Background Sync 重放成功率、Web Push 到达率，以及 `no conflict resolution (last writer wins)` 在双设备场景下的数据丢失表现。
7. **监控 v1.10+ 的 roadmap 与 release notes**，关注是否出现队列/worker/自动化/Agent 编排相关条目——这决定 tududi 是否会自行进入调度器赛道。
