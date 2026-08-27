# Healthchecks 技术产品调研

> updated_by: Qoder - Claude
> updated_at: 2026-08-07 00:00:00
> evidence_window: 2026-08-07, master 分支, v4.3 (2026-07-14), v4.4-dev unreleased

## 调研目标

- 围绕 Stateful 编排调度、客户端接入、Windows 与 macOS 工作机部署、依赖根源与架构范式，形成可追溯的独立产品调研。
- 判断产品是否持久拥有工作对象、对象关系和任务生命周期，并依据依赖、状态与策略持续推进任务。
- 核验 Windows 与 macOS 工作机支持情况、Local 优先适配程度、云端依赖与最小部署成本。
- 识别调度最小核心职责与非调度增值能力的边界，评估改造范围与风险。

## 交付结论

### Healthchecks 是 Cron Job 监控服务，持久拥有 Check 对象与状态生命周期但不具备 Agent 调度能力，属于被动监控告警系统而非 Stateful 调度器

Healthchecks（healthchecks/healthchecks）是 Pēteris Caune 个人开发的开源 Cron Job 与后台任务监控服务，BSD 3-clause 许可证。产品以两种形态提供服务：healthchecks.io 托管 SaaS 和自托管实例。核心功能是监听来自 cron job 和计划任务的 HTTP 请求与电子邮件（"ping"），在预期 ping 未按时到达时发送告警通知。产品同时提供 healthchecks.io 云端 SaaS 和完全开源的自托管方案。

Healthchecks 持久拥有工作对象——Check 是 PostgreSQL/MySQL/SQLite 中的持久化记录，拥有 UUID、名称、slug、tags、schedule、timeout、grace、status（new/up/down/paused）等字段。Check 的状态生命周期（new → up → down → up）是持久化的状态机，由 `sendalerts` 后台进程持续轮询数据库驱动。但产品不具备 Stateful 调度能力：不存在 Agent 分派机制、不存在任务依赖 DAG、不存在执行者选择逻辑、不存在 Agent 生命周期管理。Healthchecks 的"调度"仅限于自身内部的 alert 轮询和 notification 发送——它监控外部 cron job 的运行结果，不编排或推进任务。

以上为已确认事实，依据 [GitHub 仓库](https://github.com/healthchecks/healthchecks)、[官方自托管文档](https://healthchecks.io/docs/self_hosted/) 和 [master 分支源码](https://github.com/healthchecks/healthchecks/blob/master/hc/api/models.py)。

### 工作对象模型以 Project、Check、Channel 为核心，持久化在关系型数据库中

Healthchecks 的工作对象模型如下：

- **Project**：顶层持久化容器。拥有名称、API key（读写 key 和只读 key）、ping key、owner、成员列表。Project 限制 Check 数量和通知频率。持久化在数据库中。
- **Check**：持久化监控对象。拥有 UUID（`code` 字段）、slug、tags、描述、kind（simple/cron/oncalendar）、timeout、grace、schedule、tz、status（new/up/down/paused）、last_ping、last_start、last_duration、n_pings、alert_after。Check 是核心工作对象，但不是调度单元——它不依赖其他 Check、不被其他 Check 阻塞、不参与 DAG。
- **Ping**：持久化的 ping 记录。每次接收 ping 在数据库中创建一条 Ping 记录，记录 kind（success/fail/start/ign/log）、remote_addr、scheme、method、ua、body_raw 或 object_size（指向 S3）。Ping body 超过 100 字节时可存储到 S3 兼容对象存储。Ping 是事件日志，不是调度对象。
- **Flip**：持久化状态变更记录。记录 Check 的状态翻转（old_status → new_status），拥有 created 时间戳、processed 时间戳、reason（timeout/fail）。Flip 既用于异步触发通知（sendalerts 进程拾取未处理的 Flip），也用于停机统计计算。Flip 是状态机日志，不是调度编排。
- **Channel**：持久化通知渠道。拥有 kind（27 种集成类型：email、webhook、slack、discord、telegram、pagerduty、sms、call、shell 等）、value（配置 JSON）、disabled 状态。Channel 与 Check 是多对多关系。
- **Notification**：持久化通知记录。记录每次通知发送的结果和错误信息。
- **Plan**：不存在持久化编排对象。
- **Task（调度意义）**：不存在。Check 是最接近的监控对象，但 Check 之间不存在父子依赖、前置阻塞或 DAG。

对象层级：User → Project → Check。Project 拥有 Channel，Channel 与 Check 多对多关联。这些是监控告警管理对象，不是调度归属。

以上为已确认事实，依据 [models.py 源码](https://github.com/healthchecks/healthchecks/blob/master/hc/api/models.py)（master 分支，1585 行）。

### 任务关系与生命周期以 Check 状态机为核心，不存在 DAG 依赖或调度推进

Healthchecks 的 Check 生命周期管理：

- **Check 状态机**：Check 拥有四个状态——`new`（从未收到 ping）、`up`（按时收到 ping）、`down`（超时未收到 ping 或收到 fail signal）、`paused`（暂停监控）。状态迁移由两种机制驱动：被动接收 ping（用户的外部 cron job 发 HTTP 请求，推动 Check 从 new/up → up 或 up → down）和 `sendalerts` 后台进程轮询数据库（检查 `alert_after` 字段是否过期，推动 Check 从 up → down）。这不是调度状态机——状态迁移由外部事件（ping 到达或未到达）驱动，不是调度器依据依赖或策略主动推进。
- **任务依赖**：不存在。Check 之间没有父子关系、前置依赖、阻塞关系或 DAG。一个 Check 的状态变更不会自动触发或解锁另一个 Check。
- **上游下游**：不存在上游完成后解锁下游的机制。Shell Commands 集成允许在 Check up/down 时执行本地 shell 命令，Webhook 集成允许在 Check up/down 时发送 HTTP 请求——这些是通知副作用，不是调度链。用户可以利用 Webhook 串联两个 Check（Check A down → webhook 触发 → Check B ping），但这是用户自建的外部编排，不是 Healthchecks 内建的调度能力。
- **优先级与计划时间**：Check 拥有 schedule（cron 表达式或 OnCalendar 表达式）和 timeout。这些参数参与"判断 Check 是否应该 down"的计算（`get_grace_start()` 和 `going_down_after()` 方法），但不参与调度决策——没有优先级排序、没有资源约束、没有并发限制。
- **并发限制**：不存在。

以上为已确认事实，依据 [models.py `Check.get_status()` 和 `Check.going_down_after()` 方法](https://github.com/healthchecks/healthchecks/blob/master/hc/api/models.py)。

### Agent 分派不存在，Healthchecks 是被动监控告警系统而非 Agent 调度器

Healthchecks 不选择、不分派、不唤起 Agent。所有监控目标由用户手动创建：

- **Check 创建**：用户通过 Web UI 或 Management API 手动创建 Check，配置 timeout/grace/schedule。系统不自动发现或创建监控目标。
- **Agent 启动**：不存在。Healthchecks 不包含 AI Agent 运行时。`sendalerts` 进程是通知发送器，不是 Agent 执行器。
- **Agent 恢复**：不存在。`sendalerts` 进程崩溃后通过 Docker `attach-daemon` 或 systemd 自动重启，但这是进程守护，不是 Agent 任务恢复。
- **执行进度与检查点**：Check 的 `last_ping`、`last_start`、`n_pings` 是监控状态，不是执行进度。不存在执行检查点或断点续传。

Healthchecks 的 `sendalerts` 后台进程具有以下特征，使其看起来像调度器但实际不是：

- 持续运行（Docker `attach-daemon` 或 `--loop` 模式）
- 轮询数据库寻找待处理工作（`Flip.objects.filter(processed=None)` 和 `Check.objects.filter(alert_after__lt=now())`）
- 多线程处理（ThreadPoolExecutor，默认 10 workers）
- 原子抢占（`UPDATE ... WHERE processed=None` 实现乐观锁）
- 进程重启后状态可恢复（Flip 的 `processed` 字段持久化，未处理的 Flip 在重启后被重新拾取）

以上特征使其成为一个可靠的异步通知处理系统，但不构成 Stateful 调度——它不创建任务、不选择执行者、不编排依赖、不推进任务生命周期。

以上为已确认事实，依据 [sendalerts.py 源码](https://github.com/healthchecks/healthchecks/blob/master/hc/api/management/commands/sendalerts.py)。

### 持久化以 PostgreSQL/MySQL/SQLite 为核心，S3 兼容对象存储为可选扩展

- **数据库**：支持 SQLite（开发默认）、PostgreSQL（生产推荐）和 MySQL。Docker 部署使用 PostgreSQL 16。数据库通过 Django ORM 抽象，可替换。数据库迁移由 uWSGI 启动时自动执行（`hook-pre-app = exec:./manage.py migrate`）。
- **核心表**：`api_check`（Check）、`api_ping`（Ping）、`api_flip`（Flip）、`api_notification`（Notification）、`api_channel`（Channel）、`api_tokenbucket`（TokenBucket 限流）、`auth_user`（用户）、`accounts_profile`（Profile）、`accounts_project`（Project）。
- **对象存储**：可选的 S3 兼容对象存储，用于存储超过 100 字节的 ping body。配置 `S3_BUCKET`、`S3_ACCESS_KEY`、`S3_SECRET_KEY`、`S3_ENDPOINT`、`S3_REGION`。不配置 S3 时，ping body 存储在数据库的 `body_raw` BinaryField 中。S3 是可选优化，不是硬依赖。
- **S3 断路器**：`TokenBucket.s3_is_healthy()` 实现了 S3 断路器——当最近 1 分钟内 S3 GetObject 错误超过 3 次时，停止尝试访问 S3，避免 S3 故障阻塞请求处理。
- **数据清理**：`Check.prune()` 每 100 次 ping 自动清理旧 ping 和 notification。`pruneusers`、`prunetokenbucket`、`pruneobjects` 管理命令提供额外清理。
- **依赖剥离**：S3 可完全关闭（不设置 `S3_BUCKET`），ping body 回退到数据库存储。MySQL 可替换为 PostgreSQL 或 SQLite。SMTP 通知可关闭（不设置 `EMAIL_HOST`）。所有通知集成均可独立开关（`SLACK_ENABLED`、`WEBHOOKS_ENABLED` 等）。

以上为已确认事实，依据 [配置文档](https://healthchecks.io/docs/self_hosted_configuration/)、[docker-compose.yml](https://github.com/healthchecks/healthchecks/blob/master/docker/docker-compose.yml) 和 [models.py](https://github.com/healthchecks/healthchecks/blob/master/hc/api/models.py)。

### 对外接口以 Pinging API 和 Management API 为核心，无 WebSocket 或 gRPC

- **Pinging API**：HTTP GET/HEAD/POST 请求到 `/{uuid}` 或 `/{ping-key}/{slug}` 端点。支持 `/start` 后缀标记任务开始、`/fail` 后缀标记失败、`/exit-{status}` 后缀报告退出码。无需认证（UUID 即为凭证）。支持 email ping（发送邮件到 `{uuid}@{PING_EMAIL_DOMAIN}`，由 `smtpd` 管理命令处理）。Pinging API 是被动接收接口，不是调度指令。
- **Management API v3**：RESTful JSON API，使用 `X-Api-Key` 头认证。支持 List/Get/Create/Update/Pause/Resume/Delete Check、List Pings、Get Ping Body、List Flips、List Channels、List Badges、Check Status。限流 100 请求/分钟。支持 v1/v2/v3 三个版本。Management API 是管理接口，不是调度接口。
- **Web UI**：Django 模板渲染的 Web 界面，支持 Check 管理、Channel 配置、Ping 日志查看、停机统计、Badge 展示。uWSGI 提供静态文件服务（`check-static` 和 `static-gzip-dir`）。
- **Webhook 出站**：Check 状态变更时主动向用户配置的 URL 发送 HTTP POST 请求。这是出站通知，不是入站调度。
- **Prometheus metrics**：`/metrics` 端点暴露 Prometheus 格式指标，支持 Bearer token 认证。
- **Badge SVG**：`/b/{badge_key}.svg` 端点提供状态徽章图片。
- **无 WebSocket**：Healthchecks 不使用 WebSocket。Web UI 通过短连接 HTTP 请求刷新。
- **无 gRPC**：不使用 gRPC。
- **鉴权方式**：Pinging API 使用 UUID 作为凭证（无 header 认证）。Management API 使用 project-specific API key（`X-Api-Key` 头）。Web UI 支持邮件登录链接、密码登录、TOTP 2FA、WebAuthn 2FA、外部认证代理（`REMOTE_USER_HEADER`）。

以上为已确认事实，依据 [Management API 文档](https://healthchecks.io/docs/api/) 和 [views.py ping handler](https://github.com/healthchecks/healthchecks/blob/master/hc/api/views.py)。

### 消息通信以 HTTP 短连接和数据库轮询为核心，无长连接或消息中间件

- **入站通信**：外部 cron job 通过 HTTP 短连接发送 ping（GET/HEAD/POST）。或通过 SMTP 发送 email ping（`smtpd` 管理命令监听 SMTP 端口）。无长连接。
- **内部通信**：Web 进程（uWSGI）接收 ping → 写入数据库（Check 更新 + Ping 创建 + Flip 创建）。`sendalerts` 进程轮询数据库 → 拾取未处理 Flip → 发送通知。`sendreports` 进程轮询数据库 → 发送定期报告。进程间通过数据库共享状态，不使用消息队列或 RPC。
- **出站通信**：通知通过 HTTP 短连接发送到各通知渠道（Slack webhook、Discord webhook、PagerDuty API、Telegram API 等）。使用 libcurl 作为 HTTP 客户端。无长连接或推送。
- **无消息中间件**：不使用 Redis、RabbitMQ、Kafka 或 Redpanda。数据库是唯一的进程间通信中介。
- **断线恢复**：`sendalerts` 进程重启后，未处理的 Flip（`processed=None`）在数据库中保持，进程重启后自动拾取。这是基于数据库持久化的恢复，不是基于会话或长连接的恢复。

以上为已确认事实，依据 [uwsgi.ini](https://github.com/healthchecks/healthchecks/blob/master/docker/uwsgi.ini) 和 [sendalerts.py](https://github.com/healthchecks/healthchecks/blob/master/hc/api/management/commands/sendalerts.py)。

### 任务队列以数据库轮询为核心，使用乐观锁实现并发协调

- **队列实现**：无独立队列组件（无 Redis、RabbitMQ、Celery）。队列逻辑通过数据库索引和条件查询实现。`Flip` 表有 `api_flip_not_processed` 索引（`condition=models.Q(processed=None)`）用于快速查找未处理 Flip。`Check` 表有 `api_check_aa_not_down` 索引（`condition=~models.Q(status="down")`）用于快速查找需要检查超时的 Check。
- **原子抢占**：`sendalerts` 使用乐观锁实现原子抢占——`Flip.objects.filter(id=flip.id, processed=None).update(processed=now())`，如果 `num_updated == 1` 则获得处理权，否则说明另一进程已抢先处理。Check 超时检测使用类似机制——`Check.objects.filter(id=check.id, status=old_status).update(alert_after=None, status="down")`。
- **多进程协调**：支持多 `sendalerts` 进程同时运行（通过 `--num-workers` 控制线程数），乐观锁确保同一 Flip 只被一个进程处理。
- **租约与超时回收**：不存在显式租约机制。Flip 被拾取后立即标记 `processed`，如果处理进程崩溃，Flip 保持已处理状态（不会被重新拾取）。这是 at-most-once 语义，不是 at-least-once。
- **轮询间隔**：`sendalerts` 主循环无工作时 `time.sleep(2)`。`sendreports` 主循环无工作时 `time.sleep(60)`。
- **最小依赖**：单机最小部署只需 PostgreSQL + Healthchecks 容器（uWSGI 内置 sendalerts、sendreports、smtpd 后台进程）。无消息队列、无缓存层、无负载均衡器。

以上为已确认事实，依据 [sendalerts.py `process_one_flip()` 和 `handle_going_down()` 方法](https://github.com/healthchecks/healthchecks/blob/master/hc/api/management/commands/sendalerts.py) 和 [models.py Flip Meta indexes](https://github.com/healthchecks/healthchecks/blob/master/hc/api/models.py)。

### Windows 与 macOS 均通过 Docker 支持，无原生桌面客户端

- **Windows**：通过 Docker Desktop 运行。官方 Docker 镜像支持 amd64 架构，预装 PostgreSQL 和 MySQL 驱动，uWSGI 作为 Web 服务器，启动时自动运行数据库迁移、`sendalerts`、`sendreports` 和条件启动 `smtpd`。不支持原生 Windows 二进制安装。Python 开发环境可通过 WSL 或 Python 3.12+ 在 Windows 上运行 `manage.py runserver`，但这不是生产部署方式。
- **macOS**：通过 Docker Desktop 运行。官方 Docker 镜像支持 amd64 和 arm64 架构（Apple Silicon 原生支持）。Python 开发环境可通过 Homebrew Python 3.12+ + venv 运行。不支持原生 macOS 应用或 .app 包。
- **原生二进制**：不存在。Healthchecks 是 Django Web 应用，需要 Python 运行时和 WSGI 服务器。
- **桌面客户端**：不存在。Healthchecks 是 Web 应用，通过浏览器访问。无 Electron 应用、无原生桌面客户端。
- **CLI 接入**：通过 `curl` 或 HTTP 客户端发送 ping。无专用 CLI 工具。
- **SDK 接入**：无官方 SDK。通过 HTTP Pinging API 和 REST Management API 接入，任何语言均可通过 HTTP 客户端使用。
- **选型缺陷**：Windows 和 macOS 均依赖 Docker Desktop 运行完整服务。无原生桌面客户端意味着 Healthchecks 不适合作为工作机本地工具运行——它是服务器端监控服务，工作机只作为 ping 发送方。

以上为已确认事实，依据 [Docker 文档](https://healthchecks.io/docs/self_hosted_docker/) 和 [Dockerfile](https://github.com/healthchecks/healthchecks/blob/master/docker/Dockerfile)。

### Local 优先适配存在选型缺陷：主体功能为服务器端服务，无工作机本地运行形态

- **运行形态**：Healthchecks 的主体功能运行在服务器端（Docker 容器或 Python 虚拟环境）。工作机只作为 ping 发送方——cron job 在工作机上执行后，通过 HTTP 请求向 Healthchecks 服务器报告。
- **Local 优先适配**：不匹配。Healthchecks 是服务器端监控服务，不是工作机本地工具。工作机上不运行任何 Healthchecks 组件（除非在本地运行 Docker 实例用于开发）。
- **云端依赖**：healthchecks.io 提供 SaaS 托管服务。自托管实例完全独立运行，不依赖 healthchecks.io 云端服务。自托管实例可完全离线运行（除通知集成的出站请求外）。
- **数据边界**：自托管实例的数据完全存储在用户自己的 PostgreSQL/MySQL/SQLite 和可选 S3 中。无数据外流。
- **断网影响**：自托管实例断网后，Web UI 和 Pinging API 在本地仍可用（如果服务器本身可访问）。通知集成（Slack、PagerDuty、Email 等）将无法发送，因为它们需要出站互联网连接。
- **最小部署成本**：Docker Compose 部署最小需要 PostgreSQL 16 容器 + Healthchecks 容器，共 2 个容器。资源需求低——Python + Django + uWSGI 轻量级运行，无需 Elasticsearch、Redpanda 等重型组件。开发环境可使用 SQLite + `manage.py runserver` 单进程运行。
- **选型缺陷**：Healthchecks 不是工作机本地工具，无法直接适配"Agent 在工作机上持续运行"的场景。它是服务器端监控服务，需要独立的服务器资源。但作为 Agent 工作流的"心跳监控"补充组件，部署成本极低且自托管无云端依赖。

以上为已确认事实，依据 [自托管文档](https://healthchecks.io/docs/self_hosted/) 和 [docker-compose.yml](https://github.com/healthchecks/healthchecks/blob/master/docker/docker-compose.yml)。

### 云端形态：healthchecks.io SaaS 与自托管功能等价

- **healthchecks.io SaaS**：提供托管服务，免费版支持 20 checks per project。付费版支持更多 checks、团队功能、SMS/Phone 通知。使用 `USE_PAYMENTS` 环境变量在自托管实例中可开启计费功能（用于自建 SaaS）。
- **自托管**：完全开源，BSD 3-clause 许可证。功能与 SaaS 等价（除计费功能外）。Docker 镜像在 Docker Hub 上提供，支持 amd64、arm/v7、arm64 架构。Docker 镜像预装 apprise 库（统一通知集成库）。
- **无闭源核心**：全部代码开源，无闭源模块。SaaS 版本与自托管版本使用同一代码库，差异仅在配置和托管。
- **版本活跃度**：CHANGELOG 显示从 2024-12（v3.9）到 2026-07（v4.3）持续发布 16 个版本，v4.4-dev 开发中。最新 v4.3 发布于 2026-07-14，包含 Gotify 集成增强、Tom Select 迁移、Argon2 密码哈希、DB 查询优化等。维护活跃。

以上为已确认事实，依据 [CHANGELOG.md](https://github.com/healthchecks/healthchecks/blob/master/CHANGELOG.md) 和 [Docker 文档](https://healthchecks.io/docs/self_hosted_docker/)。

## 未决项与证据边界

- **`sendalerts` 的 `handle_going_down()` 方法**在 Check 超时时主动创建 Flip 并更新 Check 状态为 "down"。这在功能上类似"调度器主动推进状态"，但其语义是"检测超时并记录状态变更"——不是"依据依赖和策略推进任务执行"。此区别不影响"不具备 Stateful 调度能力"的核心结论。
- **Shell Commands 集成**（`SHELL_ENABLED=True`）允许在 Check up/down 时执行本地 shell 命令。理论上可以利用此集成实现有限的任务触发链（Check A down → shell command → 触发 Check B 的 ping）。但这需要用户自行设计外部编排逻辑，不属于 Healthchecks 内建调度能力。
- **v4.4-dev unreleased** 中的 Django 6.1 升级和 flapping notice 改进未纳入本次调研证据窗口。

## 后续验证建议

- 如考虑将 Healthchecks 作为 Agent 工作流的心跳监控组件，可验证 Shell Commands 集成和 Webhook 集成的实际触发延迟和可靠性。
- 如需要 Agent 工作断点续传的监控，可验证 Check 的 `start` signal（`/start` 后缀）和 `rid`（run ID）参数在多 Agent 并发场景下的隔离能力。
- 如需要将 Healthchecks 嵌入现有工作流系统，可验证 Management API v3 的 Check 自动创建和配置能力（`unique` 参数的 upsert 语义）。
