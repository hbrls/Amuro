# Hermes Studio 技术产品调研

> updated_by: Codex - GPT-5
> updated_at: 2026-07-31 16:29:34
> evidence_window: 调研日期 2026-07-31；Hermes Studio Web UI v0.6.35、最新完整桌面 Release v0.6.34、主干提交 `45ba5d0`（2026-07-31）；桌面 Runtime 固定的 Hermes Agent 0.19.0，对应官方仓库标签 `v2026.7.20`

## 调研目标

- 判断 Hermes Studio 是否持久拥有工作对象、依赖关系、任务状态和执行归属，并据此持续推进任务。
- 明确 Workspace、Project、Issue、Plan、Task 的实际对象模型及任务生命周期。
- 核验 Agent 分派、失败恢复、队列、接口、持久化和依赖根源。
- 分别核验 Windows 与 macOS 工作机部署、客户端接入及本地、云端边界。
- 判断架构范式、Local 优先适配程度、私有化成本和改造边界。

## 交付结论

### Hermes Studio 具备 Stateful 调度能力，但由两套本地调度内核共同构成

Hermes Studio 不是只在 Task 到达后启动 Agent 的无状态执行宿主。主干代码中，Visual Workflow 持久化 Workflow 定义、Run 快照、节点执行、边决策和循环记录，并由本地 Workflow Manager 按图依赖决定节点何时运行；桌面 Runtime 中的 Hermes Agent Kanban 则持久化 Task、父子依赖、Assignee、Run、Claim、Heartbeat 和事件，由 Gateway 内嵌 Dispatcher 推进状态并启动 Profile Worker。两者都在 PC 本地拥有调度状态和推进责任，符合本轮 Stateful 判定基准。

这不是一套统一状态机：Workflow 面向预先绘制的 Agent DAG，Kanban 面向持续工作队列和跨 Profile 协作，Cron 另行负责时间触发。集成或私有化时必须分别适配，不能把看板列、Workflow 画布和 Cron Job 当成同一类 Task。

### Kanban 是持续工作调度核心，Workflow 是一次 Run 内的图编排核心

Hermes Agent 0.19.0 的官方 Kanban 文档将其定义为基于 SQLite 的 durable task board；每个 Task 是数据库行，父子关系是 `task_links` 行，Dispatcher 周期性回收失效 Claim、提升依赖满足的任务、原子领取并启动已分派 Profile。任务可在进程退出后继续存在，也可 Block、Unblock、Reclaim、Reassign 或产生新的 Run，状态真相不属于 Agent 会话。

Visual Workflow 保存图定义和冻结的 Run 快照，支持分支、汇合、条件、循环、失败路由、停止和从节点重跑。它能持久解释 DAG，但服务器重启时不会从执行检查点续跑，而是把遗留的运行中 Run 和节点标记为失败并终止残留 Runner。因此它具备可恢复的状态审计和重新执行能力，不具备透明断点续跑。

### Task、Workflow 和 Run 是真实对象，Issue 与 Plan 不是产品对象

Task 是 Hermes Kanban 的一等持久对象；Workflow、Workflow Run、节点执行、边决策和循环周期是 Hermes Studio 的一等持久对象。Board 也是隔离队列和数据库的真实对象。Workspace 在两套系统中主要是路径及隔离策略，而非具有独立生命周期的调度对象。

Hermes Agent 的 Task schema 含可选 `project_id`，源码注释指向其独立 Project 数据层，但 Hermes Studio 当前没有对应 Project 管理接口。当前证据未发现 Issue 或 Plan 的持久实体；Workflow 是持久编排对象，不能因为功能上类似计划就把它改称 Plan。

### 分派是显式 Profile 或节点配置，不是动态智能匹配

Kanban Task 持久保存一个 Assignee，Dispatcher 在任务 Ready 后原子 Claim，再启动对应 Hermes Profile 的独立 OS 进程。Workflow 节点预先指定 Hermes、Claude Code 或 Codex，以及 Provider、Model、API Mode 和推理配置；调度器按该配置选择已有执行路径。

系统支持人工 Reassign、Reclaim 和重新排队，但当前证据没有显示基于能力、负载或成本在候选 Agent 之间自动匹配。任务隔离、并发上限、Profile 上限和固定分派可治理，但它不是 Agent 市场或通用资源调度器。

### Windows 与 macOS 都有原生桌面路径，核心调度在 PC 本地

截至证据窗口，最新完整桌面 Release 是 [v0.6.34](https://github.com/EKKOLearnAI/hermes-studio/releases/tag/v0.6.34)：Windows 提供 x64 NSIS `.exe`，macOS 同时提供 Apple Silicon 与 Intel `.dmg`/`.zip`。v0.6.35 只发布 Web UI Runtime 压缩包，不能把它当成更新后的桌面安装包。

Electron 壳、本地 Koa BFF、Workflow Manager、SQLite、Hermes Agent、Gateway Dispatcher、Agent Bridge 和 Worker 都运行在工作 PC。没有中心 SaaS 持有 Task 或 Workflow 状态，因此主体位置符合 Local 优先要求；但首次启动必须从 Cloudflare 或 GitHub 下载数百 MB 的平台 Runtime，执行阶段还可能依赖云端模型和消息平台，不能表述为默认完全离线。

### 直接接入可行，但应使用本地 API、CLI 或工具协议而不是直写 SQLite

Workflow 暴露本地 REST 和 `/workflow` Socket.IO；Kanban 暴露 `hermes kanban` CLI、Agent `kanban_*` 工具及 Studio BFF 路由。目标客户端可以跳过 Studio UI 接入这些本地接口，但仍需要运行 Hermes Studio Server、Hermes Agent Runtime 或 Gateway Dispatcher 中相应的状态所有者。

直接写 `kanban.db` 或 Web UI SQLite 会绕过 CAS Claim、状态迁移、事件、Run 审计和 Profile 权限，不是等价接入。稳妥的桥接层应调用 CLI/BFF/MCP，并把 Board、Task、Run、Workflow、Profile 映射为自身领域对象。

### 主要选型缺陷是单机边界、重启语义和 BSL 商用限制

Kanban 明确采用单机可信用户模型和每 Board SQLite；Dispatcher 通过本机文件锁与 SQLite WAL 协调，不提供跨机器中心队列或多节点高可用。Workflow 服务器重启后失败封口而非续跑。这两点限制了它作为组织级中心调度服务的直接使用。

Hermes Studio 使用 [BSL 1.1](https://github.com/EKKOLearnAI/hermes-studio/blob/45ba5d05e0fdb6d9719e50a9e4f105b14653eabf/LICENSE)，Additional Use Grant 仅允许非商业用途，商业托管或嵌入需要另行授权，至 2029-05-10 才转 Apache 2.0。底层 [Hermes Agent](https://github.com/NousResearch/hermes-agent/tree/v2026.7.20) 为 MIT，但不能消除 Studio 层的商用限制。对商业私有化选型，这是明确缺陷。

## 产品与证据窗口

### 唯一调研主体

唯一调研产品为 [Hermes Studio](https://hermes-studio.ai/#/)，官方源码仓库为 [EKKOLearnAI/hermes-studio](https://github.com/EKKOLearnAI/hermes-studio)。官方将其定义为 Hermes Agent 的桌面应用、本地 Runtime 和 Web Console，提供聊天、Profile、Visual Workflow、Kanban、Cron、文件、终端和 Coding Agent 管理。

Hermes Agent 是 Hermes Studio 桌面 Runtime 的核心运行依赖，不是本轮的第二个候选产品。桌面构建脚本固定安装 `hermes-agent==0.19.0`；该版本对应 [NousResearch/hermes-agent 的 `v2026.7.20`](https://github.com/NousResearch/hermes-agent/tree/v2026.7.20)，`pyproject.toml` 和包内版本均为 0.19.0。

### 版本与维护状态

Hermes Studio 主干在 2026-07-31 仍有提交，仓库快照为约 9.6k Stars、1.18k Forks。最新 Web UI Release [v0.6.35](https://github.com/EKKOLearnAI/hermes-studio/releases/tag/v0.6.35) 发布于 2026-07-28，只含 Web UI 压缩包；最新完整桌面 Release v0.6.34 同日发布并覆盖 Windows x64、macOS arm64/x64。快速发布说明维护活跃，但 0.x 版本和频繁修复也说明接口与运行语义仍在快速收敛。

Studio 主干源码可见但受 BSL 1.1 限制，Hermes Agent 0.19.0 源码使用 MIT。当前证据未发现由闭源中心服务掌握的调度核心；Cloudflare 分发端和第三方模型服务的内部实现不可见，但它们不拥有本地 Task、Workflow 或 Run 状态。

近期 Workflow 相关 Issue 样本集中在模型能力预检（[#2235](https://github.com/EKKOLearnAI/hermes-studio/issues/2235)）、工具调用历史的完整与时序（[#2262](https://github.com/EKKOLearnAI/hermes-studio/issues/2262)）以及 Hermes/Ekko Runtime 定位（[#2251](https://github.com/EKKOLearnAI/hermes-studio/issues/2251)）。这些是 2026-07-31 的定向样本，只说明 Workflow 证据、能力匹配和 Runtime 边界仍在演进，不代表普遍故障率。

## Stateful 调度判定

### 系统模型

```text
Windows / macOS 工作 PC

Electron Desktop
  └─ 本地 Koa BFF + REST / Socket.IO / WebSocket
       ├─ Visual Workflow Manager
       │    └─ Web UI SQLite: Workflow / Run / Node / Edge / Loop
       ├─ Hermes Agent Bridge
       │    └─ Hermes / Claude Code / Codex 执行路径
       └─ Managed Hermes Gateway
            ├─ Kanban Dispatcher
            │    └─ 每 Board SQLite: Task / Link / Run / Event / Claim
            └─ Cron Scheduler

外部网络边界
  ├─ Cloudflare / GitHub: 安装包、Runtime、更新分发
  ├─ 模型 Provider: 由用户配置，本地或云端
  └─ 消息平台: Telegram / Discord / Slack / 其他可选渠道
```

这是根据 [Studio README](https://github.com/EKKOLearnAI/hermes-studio/blob/45ba5d05e0fdb6d9719e50a9e4f105b14653eabf/README.md)、桌面 Runtime 管理代码和两套调度源码形成的架构模型。未执行桌面包、未抓取运行时网络流量，进程关系属于有直接源码支撑的架构推导。

### 工作对象模型

| 对象 | 是否为真实持久对象 | 状态所有者与关系 | 判定 |
| --- | --- | --- | --- |
| Workspace | 部分 | Workflow 保存 `workspace` 路径；Kanban Task 保存 `workspace_kind/path`，可用 scratch、目录或 Git worktree | 是执行隔离与路径配置，不是独立调度实体 |
| Project | 局部存在 | Hermes Agent Task 可保存 `project_id` 并指向独立 Project 数据层；Studio 未暴露完整 Project 生命周期 | 已确认引用存在；身份、状态和转换细节未决 |
| Issue | 未发现 | Studio 与 Kanban schema、路由和官方对象说明中没有 Issue 实体 | 缺失；GitHub Issue 只是外部社区对象 |
| Plan | 未发现 | 没有 Plan 表或产品状态机；Workflow 是独立命名的持久编排定义 | 缺失；不得把 Workflow 文本性改称 Plan |
| Task | 是 | Kanban `tasks` 行，属于 Board；关联父子 Link、Assignee、Run、Comment、Event、Attachment | 核心持续工作对象 |
| Workflow | 是 | Studio `workflows` 行，保存节点、边、视口、Profile、Workspace | 核心图编排对象 |
| Run | 是 | Kanban `task_runs` 与 Studio `workflow_runs` 分别记录任务尝试和图执行 | 两套系统各自拥有，不共享状态机 |

Hermes Studio 的 Workflow schema 直接保存图定义；Run schema 保存状态、冻结节点/边、循环、Deadline 和错误；节点执行还保存 Session、Agent、状态、序号和所消费的边证据，见 [`schemas.ts`](https://github.com/EKKOLearnAI/hermes-studio/blob/45ba5d05e0fdb6d9719e50a9e4f105b14653eabf/packages/server/src/db/hermes/schemas.ts#L175-L281)。

Hermes Agent 0.19.0 的 Kanban schema 保存 Task、父子 Link、Comment、Event、Run、Attachment 和通知订阅；Run 包含 Claim、PID、Heartbeat、时限、结果和错误，见 [`kanban_db.py`](https://github.com/NousResearch/hermes-agent/blob/v2026.7.20/hermes_cli/kanban_db.py#L1096-L1276)。

### Workflow 的依赖、状态与调度

Workflow 定义支持多个起点、分支、汇合、条件路由和显式循环。启动 Run 时，Manager 先编译并校验图，冻结节点和边快照，再创建持久 Run；完成驱动的调度器仅把依赖边决策满足的节点放入 Ready 集合，并并行执行可运行节点。没有 Ready 节点且没有在途执行时，Run 以循环或阻塞依赖失败，见 [`workflow-manager.ts`](https://github.com/EKKOLearnAI/hermes-studio/blob/45ba5d05e0fdb6d9719e50a9e4f105b14653eabf/packages/server/src/services/workflow-manager.ts#L1740-L1905)。

节点状态包括 `queued`、`running`、`pending_approval`、`completed`、`skipped`、`failed`、`approval_rejected` 和 `canceled`。上游输出、边条件及其持久 Evidence 决定下游是否 Ready 或 Skipped；失败路由和循环也记录为单调序列，Run 详情、实时 Socket 和历史回放读取同一持久证据。

服务器重启时，Manager 查询仍处于 queued/running 的 Run，将 Run、节点 Session 和活动循环周期统一标记为 failed，并尝试 Abort 存活 Session，理由明确为无法在重启后安全恢复，见 [`recoverActiveRuns`](https://github.com/EKKOLearnAI/hermes-studio/blob/45ba5d05e0fdb6d9719e50a9e4f105b14653eabf/packages/server/src/services/workflow-manager.ts#L1038-L1087)。因此“重启后状态可解释”已实现，“重启后从检查点继续”未实现。

### Kanban 的依赖、状态与调度

Kanban 的主生命周期为 `triage | todo | scheduled | ready | running | blocked | review | done | archived`。父子 Link 是真实数据库关系；当所有 Parent 完成时，Dispatcher 将 Child 从 todo 提升到 ready。依赖型 Block 回到 todo 等待 Parent，需人工输入或能力缺失的 Block 保持 blocked；相同原因反复 Block 会进入 triage，避免自动 Unblock 循环。

Gateway 默认每 60 秒运行内嵌 Dispatcher。每次 Tick 回收失效 Claim 和死亡 Worker、检查超时、提升依赖满足的 Task、按优先级选择 Ready Task，并通过 SQLite 事务、状态与 Claim Lock 的 CAS 更新原子领取。领取成功后启动 `hermes -p <assignee>` Worker，并注入 Board、Task、DB、Workspace、Run、Claim 和 Profile 标识。官方 [Kanban 文档](https://github.com/NousResearch/hermes-agent/blob/v2026.7.20/website/docs/user-guide/features/kanban.md)明确说明 Task、Link、Dispatcher 和单机边界。

优先级、Scheduled 状态、Dispatcher 周期、全局 `max_spawn`/`max_in_progress`、每 Profile 并发上限、Task 最大运行时和连续失败阈值都会参与调度或故障决策。父任务只有进入 Done 才会解锁下游；Crash、Timeout 或 Spawn Failure 先形成失败 Run，再按 Claim 和断路器规则回到 Ready、被 Reclaim 或进入 Block，而不是把失败当作依赖已满足。

Worker 必须通过 `kanban_complete` 或 `kanban_block` 终结 Run；正常退出但未调用终结工具也按 Crash 处理。Claim 默认 TTL 为 15 分钟，Worker 可 Heartbeat；死亡 PID、过期 Claim、最大运行时和连续失败断路器分别触发 Reclaim、Retry 或 Auto-block。每次尝试形成新的 `task_runs` 行，后续 Worker 可以读取历史、Comment 和上游 Handoff。

### Cron 与工作来源

工作可以来自用户在桌面 UI、CLI 或消息渠道创建的 Kanban Task，也可以由启用 Kanban 工具集的 Agent 创建和链接 Child Task；脚本或 Cron 可使用 Idempotency Key 防止重复创建。Workflow 由 UI、本地 API 或 MCP 启动，Cron Job 则按时间产生新的独立 Agent Session。

Cron Job 按 Profile 保存于本地 `cron/jobs.json`，包含 Schedule、启用状态、上次/下次运行和结果；Gateway 内的 Cron Scheduler 负责触发。它能产生周期工作，但不解释 Kanban 父子依赖或 Workflow DAG，属于第三种独立触发机制。

### Agent 分派与连续性

Kanban 的执行者是 Task 的持久 Assignee。Dispatcher 不在每次 Tick 重新选择最优 Agent，而是解析指定 Profile；Profile 不存在或不可启动时，Task 留在 Ready 或在连续失败后 Block。人工或上层 Agent可以 Reassign，失效 Run 可以 Reclaim 后由相同或新 Assignee 继续。

Workflow 的执行者固化在 Run 快照的节点配置中。Hermes 节点经 Agent Bridge/API 路径运行，Claude Code 和 Codex 节点经 Coding Agent 路径运行；Provider、Model、API Mode 和推理强度在排队和执行间保持一致。进度与结果属于 Workflow Run 和节点 Session，不只存在于聊天上下文。

Kanban Worker 是独立 OS 进程，任务状态能跨 Agent 退出和 Gateway 重启保留。Workflow Runner 退出后只能从持久历史重跑，不能自动转交另一节点 Agent。两者均不提供跨机器 Worker 注册、能力发现、租约服务或自动负载均衡。

## 技术架构与运行形态

### 核心组件与链路

Hermes Studio 桌面层是 Electron Shell。它启动本地 Web UI Runtime 和 Koa BFF；BFF 提供认证、Profile、Workflow、Kanban、Cron、文件、终端和管理接口，并管理 Hermes Agent Bridge 与 Gateway。桌面版不是云端网页壳。

Kanban 核心链路为：Task 写入 Board SQLite → Dispatcher 检查 Parent、状态和资源限制 → CAS Claim → 创建 Task Run → 启动 Assignee Profile Worker → Worker 读取任务与历史 → Heartbeat → Complete/Block/Crash → 写回 Run、Task、Event → 解锁下游或通知人工。

Workflow 核心链路为：保存图定义 → Run 前编译与能力预检 → 冻结快照并持久化 Run → 根据边 Evidence 选择 Ready 节点 → 调用 Hermes/Coding Agent 执行 → 保存节点 Session、输出、边决策和循环 → 推进下游 → 完成、失败、取消或从节点重跑。

### 持久化与数据库依赖

- Hermes Studio Web UI 使用本地 SQLite 和文件目录，保存账户、Session、Workflow 及其 Run 证据，默认根目录为 `~/.hermes-web-ui`。
- Hermes Agent 在 Windows 默认使用 `%LOCALAPPDATA%\hermes`（回退 `%APPDATA%\hermes`），在 macOS 使用 `~/.hermes`。
- Kanban 默认 Board 使用 `~/.hermes/kanban.db`，其他 Board 各自使用独立 SQLite、Workspace、Log 和 Attachment 目录；Board 之间不能建立 Link。
- Cron 使用 Profile 目录下的 `cron/jobs.json` 和执行记录；不是外置队列。
- 核心部署不要求 PostgreSQL、Redis、Kafka 或第三方消息中间件。SQLite WAL、事务 CAS 和本机文件锁承担单机一致性。

官方未声明最低 SQLite 版本或必须启用的专属扩展；桌面版随固定 Python Runtime 提供实际 SQLite 实现，npm/源码部署则继承主机 Runtime。最低兼容版本因此属于未决，不能仅以 schema 语法反推。

Kanban 是持久队列；Workflow 的定义、Run 和执行证据持久化，但活动调度循环在 Server 进程内存中。数据库依赖可通过改造替换，但不是切换连接字符串即可完成：Kanban 的 Claim、Heartbeat、Reclaim、Event Cursor 和单 Dispatcher 约束，以及 Workflow 的 Run Evidence 顺序和终态冲突拒绝，都依赖当前存储语义。

### 接口、通信与权限

官方 [API 说明](https://hermes-studio.ai/#/docs/api)表明 Studio 通过本地 Koa BFF 提供 REST，并用 `/chat-run` Socket.IO 流式传输聊天；Workflow 另有 `/workflow` Socket.IO 状态通道，Web Terminal 使用 WebSocket。Node 与 Agent Bridge 在 Windows 默认使用 `tcp://127.0.0.1:18765`，macOS 默认使用 Unix Socket；Profile Worker 可按平台选择 Loopback TCP 或 IPC。

Kanban 的稳定写入口是 Hermes CLI、Agent `kanban_*` 工具和 Studio BFF。Studio 的 Kanban Controller 调用 Hermes CLI，而非在 JavaScript 层复制状态机；这保持了 CLI、Agent Tool 和 Dashboard 对同一数据库语义的一致解释。

HTTP/Socket 接口需要 Bearer Token 或账户 JWT。默认 `BIND_HOST=0.0.0.0`、端口 8648，虽有认证和同 Host CORS 默认值，但会让服务监听所有网卡；只需本机使用时应收紧到 Loopback。Profile 权限控制可限制普通管理员看到和分派的 Profile，但 Kanban 文档明确采用单机可信用户模型，不是强多租户安全边界。

### Windows 工作机

- **安装与入口**：v0.6.34 提供 `Hermes.Studio-0.6.34-x64.exe`。构建配置使用 NSIS、非 One-click、每用户安装并允许选择目录；安装后从桌面或开始菜单启动 Electron 应用。
- **架构支持**：只有 x64，没有 Windows ARM64 桌面包，这是平台覆盖缺口。
- **首次启动依赖**：安装器包含 Electron 和 Web UI，但不直接包含完整 Hermes Runtime。首次 Bootstrap 要求用户选择 Cloudflare 或 GitHub，下载 Windows x64 Runtime；该 Runtime 包含 Python、Hermes Agent 0.19.0、Node、Git 和浏览器运行组件，因此桌面用户无需另装 Node 23、Python 或 `uv`。
- **权限与网络**：需要写入安装目录、`%LOCALAPPDATA%\hermes`/`%APPDATA%\hermes`、`~/.hermes-web-ui` 和工作区；需要启动 Python、Node、Git、Hermes Worker、终端和浏览器子进程；需要 Loopback 端口，并在首次 Runtime 下载、更新、云端模型或消息平台启用时访问外网。
- **升级**：Electron Updater 使用 Cloudflare Generic Feed；Hermes Runtime 通过独立 Release Tag、平台 Manifest 和缓存目录更新。用户也可从 GitHub Release 手动下载新安装包；自动降级和失败回滚未运行验证。
- **卸载**：NSIS 会提供常规 Windows 应用卸载入口。Hermes 和 Web UI 数据位于安装目录外，推导为卸载应用不会自动删除；官方当前文档未给出数据清理承诺，需人工验证后再制定企业卸载脚本。

### macOS 工作机

- **安装与入口**：v0.6.34 同时提供 arm64 与 x64 DMG/ZIP；DMG 安装后从 Applications 启动。
- **签名与权限**：构建启用 Hardened Runtime 和 Notarization，并声明麦克风权限用于语音与转写。文件、终端、Workspace 和浏览器能力仍受 macOS 隐私权限及用户目录访问限制。
- **首次启动依赖**：与 Windows 相同，首次 Bootstrap 从 Cloudflare 或 GitHub 下载匹配 arm64/x64 的 Runtime，之后从本地缓存启动；分发网络不可用会阻断首次完整启动。
- **通信**：Agent Bridge 默认使用 `/tmp/hermes-agent-bridge.sock`，本地 BFF 默认端口仍为 8648；模型和消息平台的外网需求与 Windows 相同。
- **升级**：应用更新使用同一 Cloudflare Feed，Runtime 按 macOS 架构使用独立 Manifest 与缓存；GitHub Release 提供手动升级资产。自动更新后的数据迁移和回滚行为未运行验证。
- **卸载**：删除 Applications 中的应用是常规路径。`~/.hermes`、`~/.hermes-web-ui` 和已下载 Runtime 位于应用包外，推导为需另行清理；官方没有给出完整卸载清单，属于运行验证项。

当前官方材料未明确 Windows 最低系统版本和 macOS 最低版本。不能从 Electron 版本或安装包可下载推导最低受支持 OS，这一项保持未决。

### 本地、云端与混合边界

主体调度、状态、Agent 进程、文件和终端均在 PC 本地，不需要 EKKOLearnAI 托管控制平面。Cloudflare 和 GitHub 只保存安装包、Runtime Manifest、压缩包与更新资产；首次 Bootstrap 失败时若本地已有完整 Runtime，代码会回退使用缓存，否则无法进入完整应用。

模型边界由用户配置决定。使用云端 Provider 时，Prompt、上下文和模型输入会离开工作机；使用本地兼容模型端点时，模型调用可以留在本地。Telegram、Discord、Slack 等渠道启用后，凭证和消息流会经过对应第三方平台。它们不持有 Kanban/Workflow 状态，但会影响数据边界、网络可用性和故障表现。

因此产品属于 Local 优先的混合系统，而不是完全离线产品。没有发现“桌面仅是云端壳”的证据；反而首次 Runtime 下载依赖、可选云端模型与第三方渠道应作为部署条件明确管理。

### 最小部署与改造边界

最小桌面部署是一个 Electron 安装包、一次平台 Runtime 下载、本地状态目录和至少一个可用模型 Provider。若只使用 Kanban/Workflow 本地调度且模型也在本地，不需要外部数据库或中心服务；若使用消息渠道或云模型，则增加对应网络、凭据和数据合规要求。

将 Hermes Studio 作为 Glintz 的单机调度后端，最小桥接可以调用本地 BFF/MCP 和 `hermes kanban` CLI。将它改造成跨机器中心调度服务则需要把 SQLite/文件锁替换为网络可达的一致性存储与 Lease 服务，增加 Worker 注册、鉴权、能力发现、任务幂等、断线续租、多调度节点选主和租户隔离；这已是架构重构，不是普通 Agent 节点可以等价承担的任务。

Workflow 的调度逻辑也不能简单下沉为一个普通 Agent 节点。下沉后会丢失冻结 Run 快照、边 Evidence、循环周期、终态保护和并行 Ready 集合；普通节点只能执行某一步，不能替代拥有全图状态的 Workflow Manager。

## 未决项与后续验证建议

- **未决：桌面实装**。本轮未安装或运行 v0.6.34。应在 Windows x64、macOS arm64 和 macOS x64 分别验证首启 Runtime 下载、缓存后断网启动、端口/Socket、Gateway Dispatcher、Workflow Run 和卸载残留。
- **未决：最低 OS 版本**。当前官网、Release 和构建配置未给出权威最低 Windows/macOS 版本；需由官方说明或实际兼容矩阵确认。
- **未决：SQLite 最低版本**。两套调度核心都固定使用 SQLite，但官方未声明最低版本或扩展要求；需在支持矩阵中补充桌面内置版本及 npm/源码部署下限。
- **未决：Project 完整模型**。Hermes Agent 0.19.0 Task schema 已确认 `project_id` 和独立 Project 数据层引用，但本轮 GitHub API 在补读该模块时达到匿名速率限制，尚未确认 Project 状态机、Repo 关系及 Studio 暴露面。
- **未决：Workflow 重启体验**。源码明确采用失败封口，不自动续跑；需运行验证 UI 是否清晰呈现失败原因、从节点重跑范围和重复外部副作用风险。
- **未决：Kanban 恢复边界**。应通过杀死 Worker、重启 Gateway、过期 Claim 和 Reassign 场景验证 Task 是否按文档进入 Crash/Reclaim/Ready/Blocked，以及下游是否只在 Parent 真正 Done 后解锁。
- **选型前置：许可证**。商业使用前必须由法务确认 BSL 1.1 Additional Use Grant 与计划中的部署、托管和嵌入方式；不能仅依据源码公开或底层 Hermes Agent 的 MIT 许可通过。
- **接入建议**。先做只读对象映射和本地 API/CLI 适配验证，不直接写数据库；只有单机方案无法满足目标时，再评估中心化状态服务和跨机器 Worker 协议的重构成本。
