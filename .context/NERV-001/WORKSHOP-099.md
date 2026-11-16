# Multica 技术产品调研

> updated_by: Qoder - Claude
> updated_at: 2026-11-13
> evidence_window: 2026-11-13 调研；仓库 github.com/multica-ai/multica `main` 分支快照，最新 Release v0.8.2（2026-11-10）

## 交付结论

### Multica 具备以 Run 为中心的 Stateful 调度能力，属于"中心调度服务 + 本地执行宿主"组合

已确认：调度状态由服务端持久持有。每次向 agent 分派工作会创建一条 Run，Run 有独立状态机 `deferred → queued → dispatched → running → completed / failed / cancelled`（[Tasks 文档](https://multica.ai/docs/tasks)），由 Go 后端写入 PostgreSQL 17；执行机器上的 daemon 通过持久 WebSocket 认领（claim）Run，认领后在本机执行。服务端负责"何时可执行、由哪个 runtime 执行、失败后是否重试"的判定，daemon 只负责执行与回写。这满足 Index 的 Stateful 调度判定基准：持久拥有工作对象、任务状态与执行归属，并有超时回收（dispatched 状态 5 分钟无人认领即失败）与重试策略（自动重试上限 2 次，网络类 3 次）。它不是任务执行宿主或 Stateless 消费者，也不是"Task 到达后才临时起 Agent"的执行形态。

### 调度以 Issue 分配为唯一入口语义，执行认领为 pull 模型，Run 绑定 runtime 不迁移

已确认：工作通过显式动作进入调度——把 issue 指派给 agent、在评论中 @mention、直接 chat、autopilot 定时触发、外部 channel 消息或 CLI/API（[Triggering agents 文档](https://multica.ai/docs/triggering-agents)）。被指派后由服务端建 Run 入队，**由 daemon 所在 runtime 主动认领**，而非服务端挑选执行者再推送；这是"已有 runtime 领取任务"形态。Run 创建时即绑定目标 runtime，"Runs already queued wait for the runtime to recover; they do not move to another computer"（[Daemon and runtimes 文档](https://multica.ai/docs/daemon-runtimes)）——失败转移语义是"同一 runtime 内重试或失败上报"，不存在跨机重新排队。

### 工作对象模型完整：Workspace / Project / Issue / Run / Agent / Runtime / Squad / Autopilot 均为持久化对象，Plan 对象缺失

已确认：Issue 是服务端持久拥有的工作记录（7 态状态机 backlog / todo / in_progress / in_review / done / blocked / cancelled），agent 可推进 in_progress 与 in_review，关联 PR 合并后置 done（[Issues 文档](https://multica.ai/docs/issues)）。Run 是 Issue 的持久化执行实例，执行日志、时间戳、工具调用记录留在服务端可回放。Workspace 隔离团队，Project 挂接 repo 与文档作为上下文，Squad 由 leader 路由工作，Autopilot 是持久的 cron 触发器。**Plan 不作为产品对象存在**：没有独立于 Issue/Run 的编排计划对象，多步推进靠 sub-issue 机制承载。

### 任务关系仅支持 sub-issue 层级与 blocked 状态，无 DAG / 前置依赖图

已确认：Issue 之间唯一建模的关系是父子（sub-issue）与人工设置的 blocked 状态。Sub-issue 按 stage 分批推进，最早未完成 stage 完成时由系统触发父 issue 唤醒；父子状态相互独立（[Issues 文档](https://multica.ai/docs/issues)）。当前证据未发现兄弟任务间的前置依赖、并行分支或 DAG 编排对象；顺序推进依赖人建 sub-issue 结构或在 prompt 中描述。对需要显式依赖解析的编排场景，这是功能边界。

### 持久化单一依赖 PostgreSQL 17，调度队列由数据库承载，Redis 仅为可选增强

已确认：PostgreSQL 17（`pgcrypto` + `pg_trgm`）是后端唯一主存储，迁移在 backend 启动时自动执行（[SELF_HOSTING.md](https://github.com/multica-ai/multica/blob/main/SELF_HOSTING.md)）；Helm 图表使用 `pgvector/pgvector:pg17` 镜像。Run 队列、认领、心跳判定、autopilot 的 cron 计划都在数据库中——后端内置 DB-backed 调度器（`sys_cron_executions` 表 + advisory lock），多副本通过唯一键抢占 5 分钟计划槽保证不重复执行。Redis 是可选依赖，当前仅用于企业微信机器人多副本 outbound 转发，未设置时单副本部署即可。数据库不可替换、不可关闭，是最小部署的硬依赖。

### 接口形态：REST + WebSocket 为核心，CLI 是一等公民接入面，agent 与人共用同一 CLI

已确认：Go 后端（Chi + gorilla/websocket）暴露 REST API 与 WebSocket；Web/Desktop/Mobile 经 Next.js API proxy 或直连。CLI 覆盖 workspace/issue/run/daemon 管理（[CLI 文档](https://multica.ai/docs/cli)），官方明确"Every surface is scriptable. Agents drive Multica through the same CLI you do"。鉴权为人用 90 天 PAT（`mul_` 前缀）、agent 用受控临时 token（`mat_` 前缀）（[Auth tokens 文档](https://multica.ai/docs/auth-tokens)）。外部通道（Slack、Feishu/Lark、DingTalk、WeCom、Telegram）与 Git 托管（GitHub、GitLab、Gitea、Forgejo，含自托管）均为正式集成面。

### 通信方式：daemon ↔ 服务端为持久 WebSocket + 15 秒心跳，断线由心跳宽限期判定

已确认：daemon 注册后与服务端保持持久连接，每 15 秒心跳；queued run 在 runtime 断线期间原地等待，只有当心跳缺失超过重连宽限期时，running 中的 run 才以 `runtime_offline` 失败（[Daemon and runtimes 文档](https://multica.ai/docs/daemon-runtimes)）。Web 客户端走 HTTPS + WebSocket。重启恢复语义：服务端重启后凭 PostgreSQL 状态恢复调度；daemon 重启后重新注册并继续认领 queued run。

### Windows 与 macOS 均为原生一等平台，安装形态为 Electron 桌面端 + CLI/daemon，自托管需 Docker

已确认（[Desktop App 文档](https://multica.ai/docs/desktop-app)、[CLI_AND_DAEMON.md](https://github.com/multica-ai/multica/blob/main/CLI_AND_DAEMON.md)）：

- **macOS**：Desktop 为 `.dmg`，CLI 经 Homebrew（`brew install multica-ai/tap/multica`）；daemon 开机自启注册为 `~/Library/LaunchAgents/ai.multica.daemon.plist`。
- **Windows**：Desktop 为 `.exe` 安装器，CLI 经 PowerShell 安装脚本（`install.ps1`）；daemon 自启写 `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`。
- 两平台的 daemon 均自动探测本机已装的 31 种 agent CLI（claude、codex、cursor-agent 等），Desktop 会把所在机器自动注册为 runtime。
- 自托管服务端在两个平台上都只能以 Docker（Docker Desktop）+ install 脚本或 `make selfhost` 运行，另有 Helm/Kubernetes 路径；官方未提供 Windows/macOS 原生二进制的服务端形态。
- 卸载：CLI `brew uninstall` 或删除安装产物，daemon `multica daemon autostart disable` + `daemon stop`，Desktop 删除应用，自托管 `make selfhost-stop` 或 `helm uninstall`。
- 无平台缺失，不构成平台类选型缺陷。

### 主体功能为混合形态：调度中心在云端或自托管服务器，执行在工作机本地；Local 优先需自托管达成

已确认：Multica 不在本机内置调度能力。Multica Cloud（multica.ai SaaS）承载 Web、Go 后端与 PostgreSQL，所有 issue、run 记录、评论、执行日志存于云端数据库；工作机上的 daemon 只持有连接凭据，代码与 agent CLI 留在本地，"Their desk is your machine... Code never leaves it"（[README](https://github.com/multica-ai/multica)）。断网影响：本地 daemon 无法认领新 run，已认领的 run 本身继续运行但无法回写。

Local 优先判断：**Cloud 模式不满足 Local 优先**——调度主体（队列、状态机、鉴权、数据）全部在云端，Desktop/Web 只是调度服务的客户端，不能视为完全离线应用。**Self-host 模式可满足**：整套中心服务（backend + web + PostgreSQL）可部署在工作局域网甚至同一台机器（localhost:3000/8080），此时仅 agent CLI 自身的模型 API 调用出网。选型结论：评估 Multica 必须以自托管形态为基准；运行时依赖的 agent CLI（Claude Code 等）本身仍要求各自的外部模型服务。

### 云端组件（Multica Cloud）与自托管服务端同构，云端边界即"整套调度中心"

已确认：官方架构图中云端/自托管承担的是同一套栈——Next.js 16 前端（含 API proxy）、Go 后端（REST + WebSocket）、PostgreSQL 17；不同之处仅在部署方（Index Labs 托管 vs 用户基础设施）与组织级配置。自托管文档（SELF_HOSTING.md）完整披露了这套栈的部署、鉴权（邮箱验证码/Google OAuth/JWT secret）、数据库要求与备份边界，可作为云端形态的可信映射（架构推导：云端为同一栈的托管实例）。故障影响：云端不可达时，本地 daemon 保持已运行任务但无法接收新工作、无法上报结果。

### 许可证为 Apache 2.0 + 附加条件：主干全部可见、无闭源模块，但托管服务与品牌受商业条款约束

已确认（[LICENSE](https://github.com/multica-ai/multica/blob/main/LICENSE)，生产者为 Index Labs (Hong Kong) Limited）：单仓库包含 web/desktop/mobile/server 全部代码，无闭源核心模块。附加条件：1a 禁止未获商业许可时向第三方提供托管服务或将 Multica 嵌入商业产品（组织内部使用、多 workspace 均免费）；1b 不得移除 UI 中的 Logo/名称/版权信息；1c 无界面使用 backend/daemon/CLI 需保留署名并声明基于 Multica。选型影响：自托管自用无障碍；若产品化对外提供服务需商业许可。

### 维护状态高度活跃，但项目极年轻，快速演进是接入的主要风险

已确认：仓库创建于 2026-01-13，10 个月内 56k stars（快照数），官方声明"most weekdays"发布；近 10 个 Release 间隔约 2-4 天，最新 v0.8.2（2026-11-10），v0.8.x 引入 ZCode 协议、企业微信/Lark bot、Skill 版本化、私有 Project 等。社区反馈样本（2026 年公开 Issue，抽样）中重复主题：自托管升级在版本间偶发出错（[#1331](https://github.com/multica-ai/multica/issues/1331)）、daemon 资源占用、集成类 bug。样本小、时间短，仅代表快照期问题。对选型的影响：跟踪升级成本高（接近每工作日一个版本），自托管升级需纳入运维预算。

## 调研目标

- 判断 Multica 是否具备 Stateful 编排调度能力，还是仅为任务承接/执行宿主。
- 核验 Workspace / Project / Issue / Plan / Task（Run）的对象模型、任务关系与生命周期推进方式。
- 核验 Agent 分派与连续性：任务如何进入可执行状态、如何选择执行者、失败断线重启后如何恢复。
- 核验持久化依赖、对外接口、消息通信与任务队列形态。
- 分别核验 Windows 与 macOS 工作机接入，及本地/云端/混合运行形态。
- 输出 Local 优先适配判断、依赖根源与改造边界。

## 产品调研

### 产品定位与目标用户

Multica 的定位是"把 AI 编码 agent 当作团队成员管理"的 source-available 工作区（[README](https://github.com/multica-ai/multica)：assign work the way you'd assign it to a teammate — they pick up the issue, report progress, raise blockers, and hand it back for review）。它不自带模型，驱动用户已安装并登录的 agent CLI（源码支持 31 种）。目标用户是同时使用多个编码 agent、需要统一看板、上下文沉淀与人审门禁的软件团队。生产者 Index Labs (Hong Kong) Limited，官方入口 multica.ai。

### 核心流程

端到端主链路（已确认，[Quickstart](https://multica.ai/docs/cloud-quickstart) / [Assigning issues](https://multica.ai/docs/assigning-issues)）：人连接一台机器为 runtime（Desktop 自动注册或粘贴两条命令）→ 在 Team 中创建 agent（选 provider、runtime、命名）→ 建 issue 并将 agent 设为 assignee → 服务端创建 run 入队 → daemon 在指定 runtime 上认领并启动对应 agent CLI → agent 边做边评论，产物以 PR 形式回挂 → issue 进入 in_review，人审通过后由 PR 合并驱动 done。全过程中 Run 页面可回放每条工具调用与命令。

### 功能地图与边界

功能域（已确认）：工作管理（Issue/Project/Sub-issue/Review gate）、执行（Agent/Runtime/Daemon/Run 日志）、编排入口（Assign/Mention/Chat/Autopilot/Channel/API）、协作辅助（Squad、Skills、Inbox、用量统计）、集成（Git 托管五家、IM 五种、CLI/API）。边界：不发布模型、不打包 agent CLI；无跨 issue 的 DAG 依赖；无独立 Plan 对象；agent 无法自主认领任意未指派 issue（工作进入调度始终需显式动作）；run 以 daemon 宿主 OS 用户全权限执行，无文件系统沙箱，隔离依赖外部容器/VM（[Security model 文档](https://multica.ai/docs/security-model)）。

### 维护状态与版本演进

见交付结论"维护状态"条。补充演进方向：近三个 minor 版本（v0.7→v0.8）集中在 IM 通道（WeCom/Lark）、多 agent 协议（ZCode/ACP 系）、Skill 版本化与私有 Project，方向是扩大可驱动的 agent 生态与组织隔离能力（已确认，[Releases](https://github.com/multica-ai/multica/releases)）。

### 生态与反馈

生态入口（已确认）：31 种 agent CLI 适配、官方 CLI skill 仓库 multica-ai/multica-cli（供 Codex/Claude Code/Cursor 反向操作 Multica）、Railway 一键部署模板、Discord 社区。反馈主题仅收录影响部署与选型的部分：自托管跨版本升级失败（#1331，2026-04）与 daemon 资源占用（#10498）直接影响运维成本评估；其余（webhook 过滤、对象存储上传）属常规功能请求。样本边界：2026 年公开 issue 抽样，个案不代表整体。

## 技术架构调研

### 系统全貌与运行形态

系统由四类部分组成（已确认，README 架构图 + SELF_HOSTING.md）：

1. **中心服务**（必须部署在云端或自托管服务器）：Go 后端（Chi router、sqlc、gorilla/websocket）承载 REST/WS、调度状态机与鉴权；Next.js 16 Web 前端；PostgreSQL 17 主存储。
2. **工作机组件**：`multica` CLI + agent daemon（本地后台进程），daemon 探测本机 agent CLI、注册 runtime、认领 run、spawn 并驱动 CLI 进程。
3. **客户端**：Electron Desktop（macOS/Windows/Linux）、浏览器 Web、Expo iOS（源码构建，未上 App Store）。
4. **外部集成**：Git 托管（PR/issue 联动）、IM 通道。

Desktop 是"调度服务的客户端 + 本机 daemon 管理器"，不是离线应用。服务端与 daemon 可独立运行的前提是彼此可达。

### 主要组件与核心链路

核心链路一：**issue → run → 本地执行 → review**。assign 动作（服务端）→ run 创建并入 DB 队列（状态 queued，绑定 runtime）→ daemon 经 WS 认领（dispatched → running）→ daemon spawn agent CLI 进程，工具调用流实时回写服务端 → 完成后 run 置 completed，issue 转 in_review → 人审/PR 合并驱动 done。关键约束：run 绑定 runtime 不迁移；dispatched 5 分钟超时；失败自动重试 ≤2 次。

核心链路二：**autopilot 定时触发**。cron 计划持久化于 PostgreSQL，由后端 in-process 调度器按 5 分钟计划槽认领执行（多副本经唯一键防重复，advisory lock 4246 兜底）；autopilot 可选择只建 issue 或直接发起 run，错过调度直接跳过（[Autopilots 文档](https://multica.ai/docs/autopilots)）。

核心链路三：**IM 通道消息 → agent 工作**。Slack/Lark 为无状态 HTTP outbound（任意副本可发），WeCom 依赖副本持有的 WS 长连接 + Redis 转发（自托管文档，架构推导自其多副本说明）。

### 主要依赖

影响安装与运行的依赖（已确认）：PostgreSQL 17（硬依赖，含 pgcrypto/pg_trgm，Helm 镜像带 pgvector）；Docker + Compose（自托管路径）；本机 agent CLI 至少一个（Multica 只驱动不发布）；Node.js 22 / pnpm / Go 1.26.9（仅源码构建）。可选：Redis（WeCom 多副本）、S3 兼容对象存储（上传件外置，未配置时用本地 PVC）、Resend（邮件登录码，未配置时用日志验证码）。调度核心不依赖 Redis 或向量检索。

### 接口形态

见交付结论"接口形态"条。补充：CLI 与 daemon 支持自托管升级镜像源（`MULTICA_RELEASE_API_BASE_URL` 等环境变量），daemon 自更新默认关闭、CLI 跟随二进制热重载（`MULTICA_DAEMON_AUTO_RELOAD`），对私有化环境脱离 GitHub 升级是关键能力（已确认，CLI_AND_DAEMON.md）。

### 持久化方式

见交付结论"持久化"条。补充归属：工作对象（workspace/project/issue/sub-issue）、调度状态（run 状态机、runtime 注册、心跳）、执行记录（run transcript、用量 rollup 表 `task_usage_hourly`）、cron 计划（`sys_cron_executions`）均由后端独占写入 PostgreSQL；daemon 本机仅持有配置（`~/.multica/` profile 目录：config、token、daemon.log/pid）与工作产物，不持有调度状态。

### 通信方式

见交付结论"通信方式"条。补充：所有组件交互的总体模式是"中心服务为唯一事实源，daemon/客户端长连接收推 + REST 回写"；无第三方消息中间件参与核心调度（Redis 仅 WeCom outbound 边缘场景）。

### 任务队列

已确认：队列即 PostgreSQL 中的 run 记录，形态为"持久化中心队列 + 执行端 pull 认领"。防重复领取由服务端状态机保证（queued → dispatched 的单次迁移）；无租约文件或外部锁参与。超时回收完全由中心状态驱动：dispatched 5 分钟无人接手判失败、running 依赖 15 秒心跳 + 重连宽限期判 `runtime_offline`、失败重试由服务端按策略重排（上限 2 次/网络类 3 次）。autopilot 的定时触发同样由中心 DB 调度器驱动。多 daemon 多 runtime 场景的最小依赖只是各自一条 WS 连接，无分布式协调组件。

### 部署形态

#### 工作机安装（Windows / macOS）

见交付结论"Windows 与 macOS"条。补充运行要求：工作机 daemon 以宿主 OS 用户全权限运行 run（无沙箱），agent CLI 需已安装并登录，PATH 之外的环境变量需经 `multica config set` 持久化（自启动会话不继承 shell 环境）。网络要求：daemon 必须能直连中心服务（Cloud 模式即公网 multica.ai；自托管即内网地址）。

#### 主体功能运行位置

见交付结论"主体功能为混合形态"条。

#### 云端形态（存在）

见交付结论"云端组件"条。补充数据边界：`custom_env` 中的 secret 会在执行时下发到工作机、离开服务端（how-multica-works 文档）；run 的 prompt、评论、执行日志、用量数据在 Cloud 模式下全部存于云端数据库，自托管模式下留在用户设施内。

## 未决项与证据边界

- **Run 认领的原子性实现**（如数据库层 `SELECT ... FOR UPDATE SKIP LOCKED` 或等价机制）未做源码核验：本次调研期间源码克隆两次因网络中断失败。状态机语义与防重复结论已由 how-multica-works 与 Tasks 两份一致的官方文档确认；底层 SQL 实现为未决，但不改变架构层判断。
- **Sub-issue stage 的完整规则**（stage 如何定义、能否嵌套、唤醒是否级联）仅有 Issues 文档的摘要级说明，未逐条验证。
- **Multica Cloud 的物理架构与租户隔离**：以自托管栈同构为推导，未获官方数据中心/隔离细节。
- **社区反馈样本**限于 2026 年公开 issue 抽样，未覆盖 Discord 等非公开渠道。
- 仓库 56k stars / 7.4k forks 为 2026-11-13 快照，仅描述公开热度。

## 后续验证建议

- 实际完成一次自托管安装并跑通 assign → run → review 全链路，验证：升级路径（两个相邻版本间）、daemon 断电重启后 queued run 的恢复、多 runtime 时 run 的分配行为。
- 源码定点核验 run claim 的 SQL/事务实现与心跳宽限期参数的实际默认值。
- 若考虑改造：评估将 issue 依赖图（DAG）补齐为独立对象的工作量，以及把调度状态从中心服务下沉为 daemon 本地队列的可行性（按 Index 架构范式要求，下沉后将失去中心化持久任务状态与跨机失败转移，不等价于现有调度能力）。
