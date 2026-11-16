# Solo 技术产品调研

> updated_by: Codex - GPT-5
> updated_at: 2026-08-09 23:13:29
> evidence_window: 2026-08-09；正式发布基线 v1.0.0（commit `413536b99c02765efc9e6973e147ac7346ec30cb`）；同时核对 master 快照 `9a132dfcacb8abbcacf63138f2a3f4d5be4f6b0c`，其仅比 Release 多 1 个预算门禁提交

## 交付结论

### Solo 是 Stateful Agent 协作工作区与持久 Run 调度中心，但不是通用工作流调度器

已确认：Solo 将 Channel、Thread、Task、Agent、Computer、Session、Run、消息和产物作为中心服务拥有的持久状态。远端模式下，[PostgreSQL 中的 `agent_runs` 是持久投递队列和 Run 真相源](https://github.com/solo-agent/solo/blob/413536b99c02765efc9e6973e147ac7346ec30cb/docs/design/remote-runtime-architecture.md)，WSS 只负责唤醒与控制；Run 即使在 Computer 离线时也可排队，默认等待 24 小时。Server 或 Daemon 重启后，系统能从持久 `dispatch_payload`、当前 attempt 和 Daemon 上报的 active attempt 恢复或重新投递。

架构判断：Solo 对“把一次 Agent Run 可靠送到固定 Computer 并恢复执行”具备实质 Stateful 调度能力，包括持久队列、执行归属、原子接受、幂等事件、单 Agent 串行约束、失败改派与终态收敛。它不是 Stateless/Serverless 任务消费者，也不只是 CLI 启动器。

边界同样明确：用户 Task 只有父子层级，没有任意前置依赖、多前置 join、阻塞边、拓扑排序或通用 DAG 解锁。Task 的 `priority`、`due_date` 是工作管理字段，当前证据没有显示它们参与自动可执行性判定。Solo 因而不能按通用“依赖满足后自动推进下游节点”的工作流调度器选型。

### Task 是真实持久工作对象，Run 是独立的执行与投递对象

[Task 服务](https://github.com/solo-agent/solo/blob/413536b99c02765efc9e6973e147ac7346ec30cb/internal/server/service/task.go)定义五态生命周期：

```text
todo -> in_progress -> in_review -> done -> closed
  |          |             |          |
  +----------+-----------> closed     +-> closed
                         in_review -> in_progress（驳回）
                         closed -> todo（重开）
```

`done` 与 `closed` 是终态。Claim 仅允许 `todo` 或 `in_progress`，通过 PostgreSQL `SELECT ... FOR UPDATE` 防止并发抢占；`todo` 被领取后进入 `in_progress`。Unclaim 清空 claimer 并回到 `todo`。只有当前 claimer 能 Submit，且所有直接子任务必须为 `done` 或 `closed`，随后进入 `in_review`；只有 creator 能 Accept 或 Reject，Accept 进入 `done`，Reject 带原因退回 `in_progress`。

Run 则描述一次具体 Agent 执行，其状态包括 `queued`、`thinking`、`running`、`streaming`、`waiting_input`、`waiting_approval`、`completed`、`failed`、`cancelled`、`timeout`。[Run 服务](https://github.com/solo-agent/solo/blob/413536b99c02765efc9e6973e147ac7346ec30cb/internal/server/service/agent_run.go)持久化状态、事件、Session、Task 链接、来源和结果。Task 与 Run 分层使“工作项未完成”和“某次执行失败”不会被混成同一状态。

### 失败恢复是条件化改派，不是同一 Agent 的任意跨机漂移

v1.0.0 已包含[失败 Task Run 自动处理](https://github.com/solo-agent/solo/blob/413536b99c02765efc9e6973e147ac7346ec30cb/internal/server/service/agent_retry.go)：仅针对 `failed`/`timeout` 且被标记为 retryable 的 Daemon 丢失、超时、Provider 瞬时错误或缺失可见结果，系统才会尝试改派。它在事务中锁定 Task，确认失败 Run 仍是最新主 Run、Task 未被人或其他 Agent 推进，再优先选择频道内可用 Agent；最多 3 次，耗尽后解除领取并把 Task 退回 `todo` 等待处理。

每个 Agent 持久绑定一个 Computer，同一 Agent 一次最多执行一个 Run。自动改派可以选择另一个已经绑定其 Computer 的 Agent，因此有机会把后续 Task 尝试送到另一台机器；但这不是把原 Run 或同一 Agent 自动迁移到任意 Computer。[Remote V1 架构](https://github.com/solo-agent/solo/blob/413536b99c02765efc9e6973e147ac7346ec30cb/docs/design/remote-runtime-architecture.md)明确不提供 automatic cross-Computer failover 或多 Server 协调。

### 运行形态同时存在本地全栈与远端混合模式，符合 Local 优先但分发完整度不均

本地源码模式把 Next.js Browser、Go Server、PostgreSQL、Daemon 和 Agent CLI 都放在同一工作机，核心数据不要求经过官方云服务。[README](https://github.com/solo-agent/solo/blob/413536b99c02765efc9e6973e147ac7346ec30cb/README.zh-CN.md)给出的 `make dev` 是开发/源码运行入口，不是桌面应用安装包。

v1.0.0 正式发布的 Remote 模式是混合架构：Web、API、PostgreSQL、Task、消息、Run、附件和产物位于自托管 Server；Daemon、Provider CLI、Provider 凭据、Agent workspace、技能、持久 Session 进程和 transcript 内容保留在用户 Computer。本地 Daemon 只发起出站 HTTPS/WSS 连接，无需暴露本地端口。该形态不等于纯本地，但没有强制依赖闭源官方 SaaS，仓库提供完整自托管 Compose 栈。

Local 优先判断：架构原则适配，macOS/Linux 可以保留代码、凭据与 Agent runtime 在本机，也能以源码方式运行完整栈；选型缺陷是 Windows 无原生 Computer runtime，且完整本地栈只有源码开发流程，没有面向普通用户的一体化桌面分发。

### macOS 可作为官方 Agent 工作机，Windows 只能作为浏览器端

[官方安装脚本](https://github.com/solo-agent/solo/blob/413536b99c02765efc9e6973e147ac7346ec30cb/scripts/install.sh)只接受 Darwin/Linux 的 amd64/arm64，安装 `solo` 与 `solo-daemon` 到默认 `~/.local/bin`；[v1.0.0 Release](https://github.com/solo-agent/solo/releases/tag/v1.0.0)也只承诺 macOS/Linux 校验过的归档。macOS 因此可运行 Daemon、Provider CLI 与本地 workspace。

Windows 没有原生 Daemon/CLI 安装包或官方安装流程。Windows 浏览器可以访问远端 Web UI、创建或管理任务，但不能等价地成为运行本地 Agent 的 Computer。以 Windows 作为目标工作机时，这是明确选型缺陷；WSL 或自行移植不能算作当前官方支持。

### PostgreSQL 是不可轻量剥离的核心一致性依赖，Provider 接入层相对可替换

PostgreSQL 同时承担 Task/Run/消息持久化、行锁、CAS、幂等键、离线队列和恢复真相源。[远端 Compose](https://github.com/solo-agent/solo/blob/413536b99c02765efc9e6973e147ac7346ec30cb/deploy/remote/docker-compose.yml)固定使用 `postgres:16-alpine`；官方没有声明更宽的最低兼容版本。去除或替换 PostgreSQL 会触及领取原子性、Run 接受、事件去重、重启恢复和数据模型，不属于适配器级改造。

Provider runtime 位于 Daemon 一侧，边界较清楚：[Claude Code 使用 stream-json、Codex 使用 JSON-RPC，OpenCode、Hermes 与 OpenClaw 使用 ACP](https://github.com/solo-agent/solo/blob/413536b99c02765efc9e6973e147ac7346ec30cb/README.zh-CN.md)。目标 Agent 工具若能提供 ACP 或现有 Backend 适配接口，优先作为新的 Daemon Provider 接入；绕过 Daemon 直接模拟 machine control、per-Run token、本地反向 RPC、Session 和事件重放协议，改造面与安全风险都显著更大。

### master 的月度 Token 预算门禁是发布后能力，不能视为 v1.0.0

`master` 的唯一 Release 后提交是 [`feat: add monthly token budget gate`](https://github.com/solo-agent/solo/commit/9a132dfcacb8abbcacf63138f2a3f4d5be4f6b0c)。它为 user/agent scope 增加月度 Token 策略、Run 用量账本和 reservation；[预算服务](https://github.com/solo-agent/solo/blob/9a132dfcacb8abbcacf63138f2a3f4d5be4f6b0c/internal/server/service/budget.go)在 `StartRun` 的同一事务中锁定预算键、检查已用量与 active reservation，并在不足时返回 `BudgetStartError`，因此是 fail-closed 的 Run 创建门禁，而不只是展示统计。

该能力说明治理方向正在从协作与可靠投递延伸到成本约束，但本报告不把它计入 v1.0.0 正式能力。

## 调研目标

- 判断 Solo 是否持久拥有工作对象、执行归属和可恢复的 Stateful 调度状态
- 明确 Workspace、Project、Issue、Plan、Task 的实际对象模型及 Task 关系与生命周期
- 核验 Agent 分派、Run 队列、失败改派、断线与重启恢复机制
- 分别评估 Windows、macOS 工作机接入及 Local、远端混合运行边界
- 识别核心依赖、标准接入面和私有化改造范围

## 产品定位与核心流程

### 定位与用户

Solo 是面向同时使用多个编码 Agent CLI 的个人或小团队的协作工作区。它把分散在终端和聊天记录中的 Agent 工作纳入 Channel、DM、Thread、Task、长期记忆、团队关系和可审阅产物。其主要价值不是自动生成任意工作流，而是让长期存在的 Agent 在共享协作面中可被提及、领取工作、执行、汇报并接受人工审核。

目标用户是希望保留本地代码与 Provider 凭据，同时需要多 Agent 协作、任务看板、消息可靠投递和人工 review 的开发者或团队。

### 端到端流程

1. 人在 Web 中创建/选择 Channel，将已绑定 Computer 的 Agent 加入频道；也可以通过团队模板创建角色和 `assigns_to` 关系。
2. 人发送消息、显式 mention Agent，或把工作建立为 Task。Server 先持久化消息、Task 和目标 Agent/Computer 信息。
3. Router 根据显式 mention、唯一 coordinator、小团队 fanout、最近参与者、Thread 参与者和确定性 fallback 选择唤醒对象。Task 也可以由 Agent/人 claim 或直接分配。
4. Server 在 PostgreSQL 创建 `queued` Run 和完整 `dispatch_payload`，通过 WSS 提示目标 Daemon；WSS 丢失不丢 Run。
5. Daemon 接受 Run 后获得 `execution_attempt_id` 和短期 per-Run Agent token，在绑定 workspace 中启动或恢复 Provider CLI；同一 Agent 的 Run 串行执行。
6. Daemon 通过带 source sequence 的事件回传进度与结果。Server 幂等落库、更新 Run/Session、广播浏览器并关联 Task。
7. claimer 提交 Task 后进入 `in_review`；creator 接受进入 `done`，驳回则回到 `in_progress`。满足条件的执行失败会自动改派，耗尽后回到 `todo`。

## 工作对象与调度模型

### Workspace、Project、Issue、Plan、Task 映射

| 对象 | 结论 | 持久化与归属 | 调度影响 |
| --- | --- | --- | --- |
| Workspace | 有产品概念，但不是中心可调度工作对象 | 一层是 Browser 中的整体协作界面；另一层是每个 Agent 在绑定 Computer 上的本地目录，文件由 Daemon 管理，Server 只能在授权且 Computer 在线时做有界反向读取 | 提供执行环境与文件连续性，不表达任务依赖或 readiness |
| Project | 当前证据未发现一等 Project 对象 | README、核心流程和目标版本数据模型以 Channel/Thread/Task 为主 | 缺少 Project 级任务归属、配额或调度策略 |
| Issue | 当前证据未发现一等 Issue 或外部 Issue 镜像对象 | GitHub Issues 是 Solo 仓库反馈入口，不是产品内工作记录 | 不能依赖外部 Issue 状态驱动 Task |
| Plan | 当前证据未发现持久 Plan 编排对象 | Thinking branch 是独立对话上下文，团队模板是 Agent 配置；二者都不是带依赖和生命周期的 Plan | 不能把 Thinking 图或团队图视作执行 DAG |
| Task | 一等持久工作对象 | Server/PostgreSQL 持有 ID、Channel、creator、claimer、状态、优先级、due date、来源消息和 `parent_task_id` | 支持领取、父子拆分、提交、审核、关闭和条件化失败改派 |

此外，Channel/Thread 是协作和上下文范围，Agent/Computer 表达执行身份与机器亲和性，Run/Session 表达一次执行和 Provider 会话连续性。它们共同组成 Solo 的调度上下文，但不应被替换成 Task 依赖关系。

### Task 关系、可执行性与状态所有者

Task 关系只确认了同 Channel 内的单一 `parent_task_id`。创建子任务时会锁定父 Task，父 Task 已在 `in_review` 或终态时禁止再加子任务；父任务 Submit 前检查所有直接子任务均为终态。该机制是“父任务验收门”，不是通用依赖图：没有多个前置、跨父级 join、上游失败传播、自动 skip 或任意拓扑执行。

状态推进由不同角色共同拥有：Server 负责校验和原子写入；claimer 发起 claim/unclaim/submit；creator 发起 accept/reject；失败恢复服务只在严格条件下改派或退回 `todo`。系统没有一个持续扫描任意 Task 依赖并自动从 waiting 推进 ready 的通用 scheduler。

显式 @mention 的 Agent 对 Task 有 30 秒优先 claim window，但[该窗口](https://github.com/solo-agent/solo/blob/413536b99c02765efc9e6973e147ac7346ec30cb/internal/server/service/task_claim_window.go)位于 Server 内存。Server 重启后窗口会丢失，因此它是领取体验优化，不是可恢复的核心调度状态。

### Agent 路由与团队关系

[Agent 唤醒路由](https://github.com/solo-agent/solo/blob/413536b99c02765efc9e6973e147ac7346ec30cb/internal/server/service/agent_wake_routing.go)是确定性的身份选择策略，而不是基于能力向量或资源成本的通用调度。团队的 `assigns_to` 使用 DAG 约束角色委派关系，可帮助 supervisor/coordinator 把工作交给下游 Agent；这张图属于 Agent 路由拓扑，不表达 Task 之间的前置依赖。

优先级、due date、模型和 Computer 选择可以约束或描述工作，但 v1.0.0 没有把它们组合为通用策略引擎。`AgentRunTriggerSchedule` 虽出现在 Run 触发类型中，当前官方产品流程和目标版本证据未确认独立 Schedule/Cron 对象或依赖调度语义，不能据枚举名称扩大结论。

## 技术架构

### 系统全貌

```text
Browser / Next.js
      | HTTPS + WebSocket
      v
Go Server / REST API / Router / Task & Run services
      | SQL
      v
PostgreSQL + attachments/artifacts volumes
      |
      | outbound-authenticated WSS control + HTTPS callbacks/RPC
      v
Local Daemon (one ready connection per Computer)
      | stdio / JSON-RPC / ACP
      v
Provider CLI + local workspace + session + transcript + credentials
```

本地源码模式中这些组件位于一台机器，README 将 Browser、Server、Daemon 和 Agent CLI 的主链路描述为 WebSocket、HTTP/SSE 与 stdin/stdout。Remote v1 中 Server 到 Daemon 改为 Daemon 主动建立的 WSS 控制通道，事件和接受使用受机器凭据保护的 HTTPS 接口，Server 还可通过控制通道发起有界反向 RPC。

### 持久 Run 投递与并发控制

Server 创建 Run 时固化 `computer_id`、`dispatch_payload` 和 `delivery_expires_at`。Daemon 接受前，Server 在 Run 行锁下创建 `execution_attempt_id` 并以 CAS 将状态从 `queued` 推进；重复 accept 返回同一 attempt。Daemon 事件按 `(run_id, attempt_id, source_seq)` 去重，首个终态回调胜出。

每个 Agent 的本地 turn gate 保证同一 Agent 串行执行。系统没有 Redis、Kafka 或第二持久队列；短暂的 WSS/本地事件缓冲不取代 PostgreSQL。一个 Computer 只允许一个 ready control connection，新连接会 fence 旧 Daemon。

恢复语义分层如下：

| 故障 | 恢复行为 |
| --- | --- |
| WSS 暂断 | 已接受 Run 不失败；HTTPS 回调可继续，Daemon 指数退避重连，轮询恢复唤醒 |
| Server 重启 | PostgreSQL 保留 Run/attempt；Daemon 重连上报 active attempt，queued Run 重新 announce |
| Daemon 重启 | reconciliation 清理缺失 attempt，从持久 payload 以新 attempt 重投同一 Run，可能导致 Provider 工作重执行 |
| Computer 离线 | 消息与 Run 仍持久化，未接受 Run 最多等待 24 小时；到期记录可重试投递错误 |
| 凭据 revoke | 立即断开并拒绝后续控制、Run、事件和 RPC；不会伪装为正常完成 |

这保证了“至少可恢复投递 + 幂等中心状态”，但不是任意业务副作用的 exactly-once。Daemon 崩溃后的新 attempt 可能重新执行 Provider 行为，外部工具副作用仍需接入方自行幂等。

### 接口与鉴权

| 边界 | 主要接口 | 鉴权/约束 |
| --- | --- | --- |
| Browser ↔ Server | REST + WebSocket | 用户登录后 JWT；远端注册/找回依赖邮件验证码 |
| Daemon ↔ Server | 出站 WSS 控制 + HTTPS accept/events | `Computer` machine credential；Server 仅保存 hash；一次性 enrollment token 10 分钟过期 |
| Agent CLI ↔ Server | 通过本地 Daemon proxy | Run 接受后签发 24 小时短期 token，并在每次请求确认 Run 仍非终态且属于对应 Agent/Computer |
| Server ↔ Local resources | WSS reverse RPC | workspace、skills、transcript、cancel 等均先做对象权限校验，离线或超时显式失败 |
| Daemon ↔ Provider CLI | stream-json / JSON-RPC / ACP | Provider 登录和密钥留在本机，不进入 Server dispatch payload |

没有发现稳定的官方 SDK。已有 REST/WSS 是可接入协议面，但执行侧最重要的安全与恢复契约集中在 Daemon，而不是一个可随意替换的薄客户端。

### 数据边界

Remote Server 持久化账号、Computer/Agent 元数据、Channel/Thread、Task、消息、Run/attempt/event、附件和产物。Compose 使用 `postgres-data`、`attachments`、`artifacts`、`caddy-data` 与 `caddy-config` volumes。

Provider 凭据、Provider CLI 登录、Agent workspace、技能、记忆文件、Session 进程和 transcript 内容留在 Computer。PostgreSQL 里的 transcript path 只是审计引用；内容读取需要目标 Computer 在线并经反向 RPC。远端故障不会直接泄露本机 Provider 凭据，但 Server 不可用时新的中心协调、Task 状态推进和消息/Run 投递均不可用。

## 部署与工作机支持

### macOS

| 项目 | 结论 |
| --- | --- |
| 官方安装 | `curl` 获取官方脚本，下载匹配 Darwin amd64/arm64 的 Release archive，校验 SHA-256 后把 `solo`、`solo-daemon` 以 `0755` 安装到默认 `~/.local/bin` |
| 运行入口 | `solo daemon connect` 完成配对并后台启动；`status`、`logs`、`restart`、`stop` 管理 Daemon；浏览器访问本地或远端 Web |
| 本地全栈 | 源码运行需 Go 1.22+、Node.js 20+、npm、Docker、至少一个在 `PATH` 中的 Agent CLI；`make dev` 启动 PostgreSQL、迁移、Server 与 Frontend |
| 权限 | 默认写用户目录，不需要 root；machine credential 位于 `~/.solo/daemon/credentials.json` 且 mode `0600`；Provider CLI 自身权限另行管理 |
| 网络 | 安装需要访问 GitHub Release；远端运行需出站 HTTPS/WSS 到 Server；Daemon 本地仅监听 `127.0.0.1:8081` |
| 升级 | 重跑安装脚本覆盖两个二进制并保留 credential |
| 卸载 | 官方只文档化 `solo daemon stop`，未提供一键卸载或数据保留说明。按安装路径手工删除二进制是合理推导；是否删除 `~/.solo` 中凭据、workspace 与 transcript 必须由用户单独决定 |

macOS 是当前最完整的正式工作机路径，但发布物仍是 CLI/Daemon，不是带签名安装器和生命周期管理的桌面应用。

### Windows

| 项目 | 结论 |
| --- | --- |
| 官方安装 | 无 Windows 二进制、安装脚本分支、MSI/EXE 或原生 Daemon 文档 |
| 运行入口 | 只能通过浏览器访问一个已部署 Server；不能在 Windows 原生运行官方 Computer/Agent runtime |
| 依赖与权限 | 官方未定义；不能把 Docker Desktop、WSL 或源码可编译性推断为受支持路径 |
| 网络 | 作为浏览器端只需访问 Server HTTPS/WSS；作为 Agent 工作机的网络与凭据流程不存在官方实现 |
| 升级/卸载 | 因无官方安装，亦无官方升级和卸载流程 |

若必须支持 Windows 本地 Agent，需移植 Daemon/CLI 的进程管理、文件权限、凭据保护、loopback 服务、Provider 检测和后台自启动，并重新验证远端配对与恢复；这属于平台级改造，不是打包补丁。

### 远端自托管 Server

[官方远端部署说明](https://github.com/solo-agent/solo/blob/413536b99c02765efc9e6973e147ac7346ec30cb/docs/remote-server.md)要求 Linux host、Docker Compose、指向主机的 DNS、真实邮件服务，以及入站 TCP 80/443 和 UDP 443。PostgreSQL 与 API `8080` 不应公开。Compose 包含 PostgreSQL 16、migration、Go Server、Next.js Frontend 与 Caddy 2.8；Caddy 自动申请 TLS，Browser WebSocket 与 API 共用公网 origin。

生产账号注册需要 SMTP 或腾讯云 SES；可关闭公开注册或配置 allowlist。升级前官方要求 `pg_dump`，随后 pull/build 并运行 additive migrations；备份应覆盖 PostgreSQL、附件、产物和 Caddy 数据。该拓扑是单机 Compose，未提供多 Server leader election、跨节点 Run consumer 协调或外部消息总线。

国内未备案的 private override 通过远端 loopback proxy 与 SSH tunnel 暂时访问，但 Browser/API/PostgreSQL 仍终止在远端主机，不能据 `127.0.0.1` 把它描述为本地运行。

## 接入与改造边界

### 最小接入路径

1. macOS/Linux 上保留官方 Daemon，目标工具如果已兼容 ACP、JSON-RPC 或可包装为受支持 Provider 协议，则新增/复用 Provider adapter。这能继承 workspace、Session、per-Run token、事件规范和恢复逻辑，改造面最小。
2. 只做任务管理或观测的客户端可以调用 Server REST/WebSocket，但需复用用户认证、Channel 权限和对象状态机，不能绕过 Server 直接写 PostgreSQL。
3. 若要替换 Daemon，必须实现 enrollment、machine credential、WSS hello/heartbeat/fencing、Run accept、attempt/source-sequence 幂等、反向 RPC、本地 token proxy、Provider Session 管理和重连 reconciliation。此路径实质是重写受信运行时，不建议作为首选。

### 私有化与依赖剥离

| 组件 | 性质 | 改造判断 |
| --- | --- | --- |
| PostgreSQL | 核心硬依赖 | 事务、锁、持久队列与恢复共用，替换影响广，不能简单换成文件或内存库 |
| Daemon | 本地受信执行面 | 可重写但协议与安全职责多；保留并扩展 Provider 最经济 |
| WSS | 控制/唤醒通道 | 不是持久队列；可理论替换传输，但需保持 fencing、重连和 reverse RPC 语义 |
| Caddy | 官方远端入口 | 可替换为其他 TLS reverse proxy，只要保持同源 HTTPS/WSS、私网数据库与未公开 8080 |
| 邮件 Provider | 远端账号流程依赖 | SMTP/腾讯云 SES 可替换；关闭 signup 不能自动解决现有账号找回需求 |
| Provider CLI | 可插拔执行后端 | 最适合通过现有协议扩展，凭据继续留本机 |

中心 Server 的行锁、Run 真相源、Task 状态机和执行归属不能等价下沉成一个普通 Agent Task。若把这些职责交给 Agent 会话，Server 重启后的 readiness、并发抢占、失败改派和权限裁决都会丢失；因此调度中心必须保留特权状态服务身份。

### 扩展约束

当前远端设计是一套 Server/数据库和每 Computer 单 ready Daemon。第二 Daemon 连接用于替换/fence 旧连接，不是并行消费同一 Computer 的工作。若扩展到多 Server，需要新增连接归属、Run consumer 协调、leader/lease 或等价机制；若扩展到同一 Agent 多并发，需要重新定义 workspace/Session 隔离和副作用边界。

公开的 [Issue #61](https://github.com/solo-agent/solo/issues/61)也把 task/run-scoped worktree runtime 列为待实现能力，说明当前长期 Agent workspace 可能累积跨任务变更，重试和并发隔离还不是一等运行时对象。此 Issue 是单个提案样本，只能证明该边界被提出且尚未落地，不能代表普遍用户反馈。

## 维护状态、开源与公开反馈

仓库使用 [MIT 许可证](https://github.com/solo-agent/solo/blob/413536b99c02765efc9e6973e147ac7346ec30cb/LICENSE)，Server、Frontend、Daemon、CLI、迁移与远端 Compose 均可见，当前证据未发现必须依赖闭源核心模块。

维护状态为快速活跃演进：v1.0.0 于 2026-08-09 发布 Remote Server、Computer 配对、macOS/Linux 安装、离线投递与重启恢复；调研时 `master` 仅领先 1 个同日预算门禁提交。版本仍很新，应把 Release 标签而非 `master` 当作生产能力口径。

公开反馈样本较少且多为设计提案。截至调研时仍处于开放状态的 [Issue #59](https://github.com/solo-agent/solo/issues/59)提出：Agent 消息和 Task 动作可能缺少稳定的 `origin_run_id` 因果归属，并建议补齐从副作用到具体 Run 的持久边。该样本说明严格因果追溯仍值得运行验证；仅凭 Issue 不能确认 v1.0.0 的所有路径均存在该缺口。两个 Issue 都是个案，不能外推为产品整体稳定性结论。

## 未决项与证据边界

- 本次未实际部署或运行 Solo；重启恢复、24 小时离线过期、自动改派和幂等行为来自固定版本文档与定点实现证据，尚未在目标环境复现。
- 官方 Compose 固定 PostgreSQL 16，但没有给出数据库最低/最高兼容矩阵；不能据镜像标签声称只支持 16。
- 官方没有 macOS 代码签名、公证、登录项生命周期和完整卸载说明；长期后台运行在不同 macOS 安全策略下的体验未决。
- Windows 原生缺失已确认，但移植难度尚未通过构建实验量化；WSL 可行性不属于官方支持事实。
- Remote 文档证明可自托管，不足以确认任何官方托管服务的开放范围、SLA 或数据驻留承诺。
- `assigns_to`、Thinking branch 和 Task 父子关系均已确认，但当前证据没有发现通用 Task DAG；这一表述是限定于 v1.0.0 文档和定点模型的“未发现”，不是对未来版本的永久否定。
- Daemon 崩溃后会以新 attempt 重执行持久 Run；中心事件幂等不自动覆盖 Provider 对文件、Git 或外部 API 的副作用，真实 exactly-once 边界需要按目标工具验证。

## 后续验证建议

1. 在干净 macOS amd64 与 arm64 环境各执行一次 Release 安装、配对、重启、升级、停止和人工卸载，记录 Gatekeeper、后台启动与数据保留行为。
2. 用真实 PostgreSQL 16 和两个绑定不同 Computer 的 Agent 做故障演练：离线排队、Server 重启、Daemon 重启、重复 event、可重试失败改派、3 次耗尽与人工接管。
3. 选择一个目标 Agent 工具制作最小 ACP/Provider adapter，验证 prompt、取消、usage、可见结果、Session 恢复和 per-Run token，不先替换 Daemon。
4. 若 Windows 是硬要求，先做独立平台可行性验证；在原生 Daemon、Provider 子进程管理和凭据保护通过前，不将浏览器可访问视为 Windows 工作机支持。
5. 若需要依赖驱动编排，先定义外置 Task DAG/ready-state 服务与 Solo Task/Run 的映射；不要把 `parent_task_id` 或 Agent `assigns_to` 图直接当作依赖调度。
