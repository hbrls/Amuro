# Hermes Workspace 技术产品调研

> updated_by: Codex - GPT-5
> updated_at: 2026-08-30
> evidence_window: 2026-08-30；仓库 `main` 快照 commit `c631425d8baa933f8c61d8447040f4ec8b5f571c`（最近一次推送 2026-08-22）；`package.json` 版本 2.3.0；最近正式 Release 为 v2.3.0（2026-05-08）

## 交付结论

### Hermes Workspace 是 Hermes Agent 的本地优先工作台与适配层，不是独立的中心调度服务

已确认：Hermes Workspace 的主体是 React/TanStack Web UI、Node.js SSR/API 服务和一组 Hermes Agent/Dashboard 适配器。官方 README 将其定位为把 chat、files、memory、skills、MCP、terminal、dashboard 和 Agent View 放在同一工作台；v2 的核心原则是 **zero-fork**，直接连接 vanilla `NousResearch/hermes-agent`，不维护自有 Agent fork。

Workspace 默认连接本机 Hermes Agent Gateway（`:8642`）和 Dashboard（`:9119`）。Gateway 负责健康检查、模型、OpenAI-compatible chat completions 和流式对话；Dashboard 负责 sessions、skills、config、jobs、MCP、Conductor 和部分 Kanban 能力。Workspace 主要负责 UI、能力探测、鉴权代理和本地辅助状态，不能脱离这些服务而独立提供完整 Agent 能力。

架构判断：基础 Workspace 更接近本地控制台/执行宿主，而不是拥有所有任务真相源的 Stateful 调度中心。会话、记忆、技能、作业和上游 Hermes Kanban 的核心状态由 Hermes Agent/Dashboard 持有。

### Swarm 为 Workspace 增加了局部 Stateful 使命控制，但默认 dispatch 仍不是通用依赖调度器

Workspace 的 Swarm 层会持久化 Mission、Assignment、Checkpoint、事件、Worker runtime 和 handoff，具备本地任务状态、执行归属、失败/阻塞记录与人工 review 语义。`swarm.yaml` 持有角色、Profile、能力、模型和 greenlight 约束；Worker 通常运行在持久 tmux 会话中，Windows 或无 tmux 环境使用原生子进程。

但这套能力不应等同于 Hermes Studio 或通用 DAG 调度器。Assignment 会保存 `dependsOn`，并存在 `readyQueuedAssignments()` 辅助函数；当前 `/api/swarm-dispatch` 的默认路径仍对传入 assignments 使用 `Promise.all` 并行运行，未在 dispatch 入口根据 `dependsOn` 自动形成 ready 队列、前置解锁或失败传播。依赖字段因此是使命记录和后续路由的基础，不是当前默认入口上的完整调度状态机。

### Task、Mission、Run 和 Session 分属不同层次，不能混成一个对象

Workspace 同时存在三种任务面：基础 Tasks 页面使用本地 `tasks.json`；Swarm Kanban 在无上游插件时使用 `~/.hermes/swarm2-kanban.json`；检测到 Hermes Dashboard Kanban 插件时，Workspace 通过 HTTP 代理到上游的单一 SQLite 真相源，或在兼容路径下直接读取 `~/.hermes/kanban.db`。只有上游 Hermes Kanban 的 Dispatcher 才拥有完整的任务领取/运行语义。

Swarm Mission 另存于 canonical repo 的 `.runtime/swarm-missions.json`，记录使命状态、Assignment、Checkpoint 和事件。Chat Run 则由 Workspace 以 JSON 文件保存接受、活动、交接、停滞、完成和错误等 UI 运行态；真正的 Agent Session、Memory、Skills、Jobs 和 Gateway 任务仍由 Hermes Agent/Dashboard 管理。

因此：Task 是工作项，Mission 是 Swarm 编排容器，Run 是一次对话/执行尝试，Session 是 Agent 会话上下文。Workspace 没有证据表明存在独立的一等 Project、Issue 或 Plan 调度对象。

### Worker 分派是显式角色与本地运行时绑定，不是跨机器动态负载均衡

`swarm.yaml` 为每个 Worker 固定 `id`、Profile、模型、技能、能力、任务类型和并发限制。dispatch 会把 Worker ID、任务、角色、能力、启动快照和 checkpoint 契约注入 Hermes prompt，并优先发送到 `swarm-<workerId>` tmux 会话；没有可用会话时才启动 tmux，或退化为一次性 `hermes chat -q` 子进程。

失败或超时会把 Assignment 记录为 `BLOCKED`，并写回 Worker `runtime.json`。上下文达到阈值时，生命周期代码要求 Worker 先写 durable handoff，再停止并重新启动；这解决的是上下文续接，不是把失败任务自动改派给另一台机器。Worker 进程表在 Workspace 进程内存中维护，Windows 原生进程路径尤其依赖当前 Workspace 进程，未发现跨进程 Worker 注册、租约、能力发现或多节点选主机制。

### Local 优先成立于单机/自托管形态，但完整功能依赖独立 Agent 服务与外部模型

同机运行时，Workspace、Hermes Gateway、Hermes Dashboard、Profile、Memory 和工作文件可以全部放在工作 PC，默认只监听 loopback。模型推理则取决于配置：可以是本地 Ollama/LM Studio/vLLM，也可以是 OpenAI、OpenRouter、Google 等远端 Provider。首次安装 Hermes Agent、拉取 Docker 镜像、调用远端模型或 Tailscale/VPN 访问时仍需要网络。

远程形态支持 Tailscale、VPN、LAN 和多容器部署：Workspace 可以在一台机器，通过 `HERMES_API_URL` 与 `HERMES_DASHBOARD_URL` 访问另一台机器上的 Agent 服务。官方托管云版本仍标记为 Coming Soon，因此当前不是由官方 SaaS 持有核心状态的产品。

### macOS 路径完整，Windows 目前是 Web/PWA 加源码或开发中 Electron，不能按稳定原生桌面产品计

macOS 有官方一键安装、源码运行、launchd 用户服务、PWA 和 Electron DMG 构建目标，arm64/x64 都有配置。Windows 有 PowerShell/WSL 配对文档、PWA 和 Electron 的 portable/NSIS 构建配置，但 README 仍将 Native Desktop 标为 In Development，未见与 v2.3.0 同步发布的稳定桌面安装包。Windows 还要求额外准备 Node 22+、pnpm、`sqlite3` CLI，以及 Conductor/Claude Tasks 所需的 Claude CLI。

按本 RUNBOOK 的工作机标准，macOS 可视为当前主要支持路径；Windows 的浏览器/PWA 使用可用，但 Windows 原生 Agent 工作机和桌面生命周期仍属于部分支持与运行验证项。

### 主要选型限制是上游服务耦合、单机 Swarm 边界和版本/部署成熟度

Workspace 不要求 PostgreSQL、Redis 或 Kafka；核心依赖是 Node.js 22+、Hermes Agent Gateway/Dashboard、Provider 凭据或 OpenAI-compatible 后端，Swarm 的持久 TUI 体验再依赖 tmux。要把 Workspace 改造成跨机器中心调度器，需要新增网络可达的持久队列、租约/Claim、Worker 注册与能力发现、幂等事件、断线续租、权限隔离和多节点协调，这不是简单增加一个 Adapter。

另一个现实限制是版本线：仓库主干在 2026-08 仍有提交，但正式 Release 停留在 v2.3.0，公开 Issue 也反复涉及发布标签、远端部署、认证、能力探测和功能宣传与实现不一致。生产部署应以固定 commit 和实机验证为准。

## 调研目标

- 判断 Hermes Workspace 是否持久拥有工作对象、依赖关系、任务状态和执行归属，并据此推进任务
- 明确 Workspace、Project、Issue、Plan、Task、Mission、Run、Session 的实际对象模型与生命周期
- 核验 Agent 分派、Swarm 运行时、失败/断线/重启后的连续性和恢复边界
- 分别评估 Windows、macOS 工作机安装、运行、依赖、权限、网络和卸载路径
- 识别本地、远程、云端边界、核心依赖、接口形态和私有化改造范围

## 产品与核心流程

### 定位与目标用户

Hermes Workspace 是 Hermes Agent 的 Web 工作区和本地控制台，服务于已经运行或准备自托管 Hermes Agent 的开发者、自托管用户、家庭实验室/小团队，以及需要从手机或其他设备访问本机 Agent 的用户。其价值是把对话、文件、终端、记忆、技能、MCP、模型使用情况和多 Agent 运营视图集中在一个界面；它不替代底层 Agent runtime。

README 同时把 Swarm 描述为本地 Agent control plane：一个 Orchestrator 将意图拆为任务，角色 Worker 在持久会话中执行，以 proof-bearing checkpoint 回报，再进入 Reports/Inbox 和人工 Greenlight Gate。该描述是已发布 Workspace 功能的产品边界，不代表已有通用分布式调度服务。

### 端到端核心流程

1. 用户通过官方 Hermes Agent 安装脚本、已有安装或 Docker Compose 准备 Gateway；需要完整增强能力时，再启动 Dashboard。
2. 用户安装 Workspace 依赖并执行 `pnpm dev`、`pnpm start`、PWA 或 Electron；Workspace 默认监听本机 `:3000`，Electron 开发/打包路径使用本地 Node server。
3. Workspace 探测 Gateway 的 health、chat completions、models 和 streaming，再探测 Dashboard 的 sessions、skills、memory、config、jobs、MCP、Conductor、Kanban 等能力，按结果进入 zero-fork、portable 或 disconnected 模式。
4. 普通对话通过 Workspace API 代理到 Gateway；增强面板通过 Dashboard API 读取或修改上游状态。只提供 OpenAI-compatible chat completions 的后端可以使用基础 Chat，但 Sessions、Memory、Skills、Jobs 等显示为不可用。
5. Swarm 模式从 `swarm.yaml` 和 `~/.hermes/profiles/<workerId>/` 读取 Worker 身份，创建或更新 Mission，向持久 tmux/原生进程发送带 checkpoint 契约的任务，并把 runtime、事件、记忆和报告写回本地。
6. Worker 以 `DONE`、`BLOCKED`、`NEEDS_INPUT`、`HANDOFF` 或 `IN_PROGRESS` checkpoint 回报；Workspace 更新 Mission/Report/Inbox，必要时由 Orchestrator 继续派单、要求 handoff 或升级人工。

### 功能地图与边界

- **Chat/Session**：SSE/流式对话、工具调用渲染、多会话；Session 真相源在 Hermes Agent，Workspace 维护本地 Run UI 状态。
- **Files/Terminal**：工作区浏览、Monaco 预览、跨平台 PTY；这是高权限控制面，不是纯只读聊天壳。
- **Memory/Skills/MCP**：优先使用上游 Dashboard/Gateway API；能力不存在时显示 capability gate，部分 loopback 配置可走本地 fallback。
- **Dashboard/Operations/Agent View**：汇总 Session、模型、成本、Worker 运行态和操作入口。
- **Swarm/Conductor**：Swarm 是 Workspace-native Worker/Mission/Checkpoint 层；Conductor 优先使用 Dashboard mission API，不可用时回退 `native-swarm`。
- **PWA/Tailscale**：把本地 Web UI 安装成近似原生应用，或通过受保护的 LAN/VPN/Tailscale 访问。
- **HermesWorld**：README 中的多人与游戏化入口，不属于本次调度核心，未展开其玩法和资产系统。

## Stateful 调度判定

### 对象模型

| 对象 | 结论 | 持久化与归属 | 调度影响 |
| --- | --- | --- | --- |
| Workspace | 产品容器，不是任务调度对象 | 浏览器/PWA/Electron + Node 服务；工作目录由本地环境和 `HERMES_WORKSPACE_DIR` 决定 | 提供 UI、API 代理和运行环境，不表达依赖图 |
| Project | 当前证据未发现一等 Project 生命周期 | Conductor 的 `projectsDir` 只是输出目录参数；Swarm canonical repo 是 `process.cwd()` | 没有 Project 级状态、配额或 readiness 机制 |
| Issue | 当前证据未发现产品内 Issue 对象 | GitHub Issues 是仓库反馈入口，不是 Workspace 工作记录 | 不参与内部自动调度 |
| Plan | 当前证据未发现持久 Plan 编排对象 | Conductor prompt、拆解结果和 Mission 是运行输入/记录，不等同独立 Plan | 不形成可恢复的通用 DAG |
| Task | 存在多个 Task 层 | 基础 `~/.hermes/tasks.json`；Swarm Kanban 本地 JSON；上游 Hermes Kanban 为 Dashboard/SQLite | 看板和任务字段可持久化，但调度能力取决于使用的后端 |
| Mission | Swarm 的一等持久对象 | `.runtime/swarm-missions.json`，含 Assignment、事件和 checkpoint | 聚合 Worker 派单、完成、阻塞、review 和取消 |
| Run | 一次执行/流式 UI 运行对象 | Workspace `~/.hermes/webui-mvp/runs/<session>/<run>.json`；上游 Agent 另有自己的 Run/Session | 可恢复查看状态，不自动等价于任务重投递 |
| Session | Agent 上下文与聊天历史 | 主要由 Hermes Agent/Dashboard 持有，Workspace 通过 API 读取 | 决定对话连续性和 Worker Profile 上下文 |

### Mission、Assignment 与状态推进

Swarm Mission 状态为 `planning`、`dispatching`、`executing`、`reviewing`、`blocked`、`complete`、`cancelled`；Assignment 状态为 `queued`、`dispatched`、`checkpointed`、`blocked`、`needs_input`、`reviewing`、`done`、`cancelled`。Checkpoint 会更新 Assignment 的结果、阻塞原因、文件、命令和下一步，并追加事件与 Worker 记忆。

Mission 完成条件是所有 Assignment 均为 `done`、`cancelled` 或不需要 review 的 `checkpointed`。需要 review 的代码/patch/PR 类任务必须经过 reviewer 标记后才进入 `done`。这提供了可审计的本地状态收敛，但推进主要由 dispatch、checkpoint 和 review API 触发，不是常驻的全局调度循环。

Assignment 的 `dependsOn` 会被存储，`readyQueuedAssignments()` 也能根据已完成 Assignment 计算 ready 集合；然而当前 `dispatchSwarmAssignments()` 在创建 Mission 后直接对全部 assignments 调用 `runWorker()`，并行等待结果。未发现默认入口自动调用 ready 集合、等待上游完成后再 dispatch 或将上游失败传播为下游 Blocked。因此当前应判定为“有依赖元数据和局部 helper 的 Stateful 使命记录”，而非完整依赖驱动调度器。

### Agent 分派、连续性与失败边界

分派归属来自显式 `workerId`、Profile 和 `swarm.yaml` 角色；Workspace 不根据机器负载、能力向量或队列成本动态选择任意 Worker。dispatch 首先尝试 `swarm-<workerId>` tmux 会话，Unix/macOS 优先使用 tmux；Windows 或无 tmux 时使用 `spawn('hermes', ['--tui', '--profile', workerId])` 的原生子进程，另有一次性 `hermes chat -q` fallback。

Worker 状态在 Profile 的 `runtime.json` 中记录 `currentTask`、Mission/Assignment、checkpoint、最后输出、阻塞原因、下次动作和 dispatch 结果；聊天历史与 profile `state.db`/sessions 可用于补读。dispatch 超时或启动失败会写入 BLOCKED checkpoint，而不是假装任务完成。

上下文生命周期通过 token 阈值触发 handoff：先向 Worker 要求写入本地和共享 handoff，再停止并重启 Worker，最后发送 resume prompt。该机制可以保留上下文和下一步动作，但没有发现跨机器 Worker 注册、自动 failover、租约续期或负载均衡。Workspace 进程重启后，Windows 原生 Worker 的活动进程 Map 不会自动恢复；Unix tmux 会话能否继续取决于 tmux 和 Profile 仍然存在，需运行验证。

### Kanban 后端与任务队列边界

`resolveKanbanBackend()` 的优先顺序为：显式环境变量；上游 Hermes Dashboard Kanban 插件（HTTP proxy）；本地发现到的 Hermes Kanban SQLite；最后是 Workspace 自己的 `swarm2-kanban.json`。使用 proxy 时，Workspace 明确把上游 SQLite/Dispatcher 作为单一真相源，避免 UI 自己复制领取状态机。

本地 JSON Kanban 只提供 lane、标题、spec、acceptance criteria、Worker、reviewer、Mission、父子 ID 和 latest run 字段，读写是同步文件操作，没有事务 Claim、租约、周期 Dispatcher 或跨进程锁。基础 Tasks 页面也只是 `tasks.json` 的 CRUD 和列移动。若目标是可靠的任务队列，应接入上游 Hermes Kanban，而不是把 Workspace 本地 JSON 当作中心队列。

## 技术架构与运行形态

### 系统全貌

```text
Browser / PWA / Electron
          |
          | REST / SSR / SSE / WebSocket
          v
Workspace Node server (:3000, Electron local server :3847)
          | \
          |  \
          |   +--> local files, run JSON, Swarm mission/memory/runtime
          |
          +---- HTTP/WebSocket ----> Hermes Agent Gateway (:8642)
          |                           chat, models, health, core APIs
          |
          +---- HTTP ----------------> Hermes Dashboard (:9119)
                                      sessions, skills, config, jobs,
                                      Conductor and optional Kanban
                                                |
                                                +--> Hermes Agent profiles,
                                                     SQLite/state, provider CLI
```

这是基于 README、Docker Compose、Gateway capability probe、Swarm 入口和本地存储代码形成的架构推导；本轮没有安装桌面包，也没有抓取运行时网络流量。

### 主要组件与职责

| 组件 | 运行位置 | 职责 |
| --- | --- | --- |
| Workspace Web/SSR | 工作 PC 或 Workspace 容器 | UI、API route、能力探测、鉴权、文件/终端入口、Run UI 状态 |
| Hermes Gateway | 工作 PC、另一台主机或 Agent 容器 | OpenAI-compatible chat、模型、健康检查、Agent 核心接口 |
| Hermes Dashboard | 通常与 Gateway 同机 | Sessions、Skills、Config、Jobs、MCP、Conductor、可选 Kanban |
| Hermes Agent Profile | `~/.hermes/profiles/<id>` 或容器卷 | Worker 身份、记忆、技能、Session/状态文件和 runtime |
| Swarm runtime | Workspace 进程 + tmux/原生子进程 | Worker 启动、prompt 投递、checkpoint、handoff、生命周期控制 |
| Provider | 本地 CLI/本地模型/云 API | 实际推理、工具调用和代码操作；凭据由 Agent 侧配置 |
| AionCore ACP hub（可选） | Electron/本机辅助进程 | Operations 中的 ACP harness/远端 Agent 接入，非基础 Workspace 必需 |

### 核心链路：普通 Chat

浏览器向 Workspace API 发起消息；Workspace 根据已探测能力决定使用 Gateway 的 `/v1/chat/completions` 或增强 Agent API，并通过 SSE/流式事件把文本、thinking 和工具调用传回 UI。Workspace 可把本次 Run 的 accepted/active/handoff/stalled/complete/error 状态写入本地 JSON，以便断线或重新打开页面时显示运行态；Session、消息历史和模型上下文仍由 Hermes Agent/Dashboard 持有。

### 核心链路：Swarm dispatch

Orchestrator/Conductor 将目标转成 Worker assignments → Workspace 创建或更新 `.runtime/swarm-missions.json` → 读取 `swarm.yaml`、Profile 和启动快照 → 查找或启动 `swarm-<workerId>` tmux/原生 Worker → 注入任务与 checkpoint 格式 → Worker 修改文件或运行命令 → runtime/chat reader 读取 checkpoint → Workspace 更新 Mission、Worker `runtime.json`、memory/episodes、Reports/Inbox → 根据 DONE/BLOCKED/NEEDS_INPUT/HANDOFF 决定继续、review、repair 或人工升级。

跨边界点为 Browser↔Workspace、Workspace↔Gateway/Dashboard、Workspace↔tmux/子进程、Worker↔本地 Profile/工作目录。Workspace 负责记录和路由，但没有跨主机队列协调或 exactly-once 外部副作用保证。

### 接口与鉴权

| 边界 | 接口 | 说明 |
| --- | --- | --- |
| Browser ↔ Workspace | TanStack SSR、REST API、SSE、WebSocket | Chat、文件、终端、Sessions、Swarm、Jobs 等均经 Workspace route；API 响应强制 no-store |
| Workspace ↔ Gateway | HTTP、OpenAI-compatible `/v1/chat/completions`、模型/health；部分 Gateway WebSocket | `HERMES_API_TOKEN` 对应 Agent `API_SERVER_KEY`；默认 localhost 可不设 token |
| Workspace ↔ Dashboard | HTTP REST | Dashboard 根 HTML 注入 ephemeral session token，Workspace 自动读取并用于受保护 API；Dashboard 重启会使旧 token 失效 |
| Workspace ↔ Worker | tmux 命令、原生 stdin/stdout、一次性 CLI | Worker prompt、checkpoint、handoff 和终端输出；不是稳定的远程 Worker 协议 |
| Workspace ↔ AionCore | 本机进程/HTTP ACP hub（可选） | 只在启用 Operations harness 时出现 |

Workspace 在非 loopback `HOST` 上默认拒绝启动，除非设置 `HERMES_PASSWORD`；还提供 HttpOnly/SameSite/可选 Secure cookie、CSP、路径穿越检查和限流。把服务暴露到 LAN/Tailscale/公网时，需要同时配置 Workspace password、Gateway token、正确的 `COOKIE_SECURE`/反向代理信任边界；`HERMES_ALLOW_INSECURE_REMOTE=1` 只是显式绕过保护，不应作为正常部署方式。

### 持久化方式

| 状态 | 默认位置 | 拥有者与特点 |
| --- | --- | --- |
| Gateway/Dashboard Agent 状态 | 上游 Hermes Agent 的 `~/.hermes` 或容器 `hermes-agent-data` 卷 | Config、Sessions、Memory、Skills、Credentials、Jobs 和上游 Kanban；Workspace 不拥有其完整 schema |
| Workspace 连接覆盖 | `getStateDir()` 下的 `workspace-overrides.json`，默认 `~/.hermes/workspace/workspace-overrides.json` | UI 修改 Gateway/Dashboard URL 后持久化并触发能力重探测 |
| Chat Run UI 状态 | `~/.hermes/webui-mvp/runs/<encoded-session>/<runId>.json` | 原子写入，按 Run 串行更新；5 分钟未更新的活动 Run 会被视为 stale |
| 基础 Tasks | `~/.hermes/tasks.json` | 文件 CRUD，字段含列、优先级、Assignee、due date、Session ID；无自动调度器 |
| Swarm Mission | canonical repo `.runtime/swarm-missions.json` | 原子替换写入；Mission/Assignment/Event/Checkpoint 的 Workspace-native 记录 |
| 本地 Swarm Kanban | `~/.hermes/swarm2-kanban.json` | 文件读写 fallback，不提供事务 Claim |
| 上游 Hermes Kanban | 通常 `~/.hermes/kanban.db` 或 Dashboard 管理的 SQLite | 只有在检测到上游能力时才是 dispatcher-aware 的任务真相源 |
| Worker runtime/memory | Profile `runtime.json`、`memory/`、日志和 handoff | Worker 身份、进度、Checkpoint、上下文交接和每日事件 |

Workspace 没有 PostgreSQL/Redis/Kafka 等外置核心依赖。文件持久化适合单机控制台和审计展示；若需要多 Workspace、多调度节点或强一致的远程队列，现有存储形态需要重构。

## 部署与工作机支持

### macOS

| 项目 | 结论 |
| --- | --- |
| 官方入口 | 一键脚本安装 Hermes Agent；Workspace 通过 `git clone` + `pnpm install` + `pnpm dev`，或使用 `pnpm start`/用户 launchd 服务 |
| 桌面形态 | PWA 可用；Electron 配置提供 DMG，目标 arm64 与 x64；README 仍标记 Native Desktop 为 In Development |
| 运行依赖 | Node.js 22+、pnpm、Hermes Agent；本地 Gateway/Dashboard；Swarm 持久 Worker 需要 tmux；模型 Provider 需本地服务或云端凭据 |
| 权限 | 写入用户目录、`~/.hermes`、Workspace 和工作区；launchd 为用户级服务，不要求 root |
| 网络 | 安装脚本、依赖、模型 Provider、Tailscale/VPN 和远端 Gateway 需要网络；本机 loopback 模式可在后续离线工作 |
| 升级/卸载 | Workspace 源码更新或 Electron updater 代码可见；用户服务有 `install-dashboard-service.sh uninstall`；完整数据清理清单和稳定桌面发布回滚仍未验证 |

### Windows

| 项目 | 结论 |
| --- | --- |
| 官方入口 | `docs/windows-setup-guide.md` 记录 Gateway、Workspace Dashboard 和 CLI 的三服务/三配置文件；浏览器访问 `http://127.0.0.1:3000`，可安装 PWA |
| 运行依赖 | Node.js 22+、pnpm；完整 Swarm/Tasks 还需 `sqlite3` CLI；Conductor/Claude Tasks 需要 Claude CLI；Gateway 使用 `%LOCALAPPDATA%\\hermes` 配置，CLI 使用 `~/.hermes` |
| 原生桌面 | `electron-builder` 有 portable/NSIS 目标，Electron 主进程有 Windows `where hermes`、`cmd /c`、`pip install hermes-agent` 分支；但 README 当前仍标为开发中，未把构建配置当作稳定发行支持 |
| 权限与网络 | 需要启动 Python/Node/CLI 子进程、写用户目录和 loopback 端口；首次安装、Provider 和远端访问需要网络；非 loopback 访问仍要求 Workspace password |
| 升级/卸载 | PWA 随 `pnpm dev` 运行；Electron 打包配置允许 `deleteAppDataOnUninstall: false`，因此卸载不应假定会删除 `~/.hermes` 数据；真实安装包升级/回滚尚未运行验证 |

Windows 目前可作为浏览器/PWA 客户端使用，也有源码和开发中的 Electron 路径；不能仅凭这些材料确认它已经达到与 macOS 相同的原生 Agent 工作机支持度。

### Docker 与远程自托管

官方 `docker-compose.yml` 启动两个容器：`nousresearch/hermes-agent:latest`（Gateway `:8642`，同时可启动 Dashboard `:9119`）和 `ghcr.io/outsourc-e/hermes-workspace:latest`（Workspace `:3000`）。默认宿主端口绑定到 `127.0.0.1`；`hermes-agent-data` 保存 Agent config、sessions、skills、memory、credentials，`hermes-workspace-files` 保存文件浏览器产物。Workspace 通过 Docker DNS 使用 `http://hermes-agent:8642` 和 `http://hermes-agent:9119`，不能在容器内使用 `127.0.0.1` 指向 Agent。

多主机/LAN/Tailscale 部署需要：Agent 设置 `API_SERVER_HOST=0.0.0.0` 和强 `API_SERVER_KEY`；Workspace 设置匹配的 `HERMES_API_TOKEN` 与可达的两个 URL；Workspace 若绑定 `0.0.0.0`，必须设置 `HERMES_PASSWORD`。纯 HTTP LAN 还需处理 `COOKIE_SECURE=0`，反向代理/TLS 则应正确设置 `COOKIE_SECURE=1` 与可信代理头。

### 本地、云端与混合边界

- **本地核心**：Workspace Node server、Gateway、Dashboard、Profile、Swarm runtime、文件和大部分状态可在同一 PC。
- **远端可选**：Gateway/Dashboard 可以在另一台主机或容器；Workspace 通过 HTTP 连接，手机端通过 PWA/Tailscale 访问。
- **云端外部依赖**：OpenAI/OpenRouter/Google 等 Provider、远端 OpenAI-compatible server、GitHub/Cloudflare 下载和 Tailscale/VPN；这些服务可能接收 prompt、文件片段或工具结果，取决于 Agent/Provider 配置。
- **官方托管云**：README 标记 Coming Soon，跨设备同步、团队共享内存、云托管和 webhook 尚未作为当前正式能力交付。

Local 优先判断：单机自托管形态符合要求，且没有强制官方云控制面；但完整增强功能依赖独立 Gateway/Dashboard，模型使用可能把数据送到第三方 Provider，不能表述为默认完全离线。

## 主要依赖、维护状态与公开反馈

### 关键依赖

- 运行时 Node.js 22+；源码开发使用 pnpm，Docker 镜像基于 `node:22-slim`，终端 PTY 额外需要 Python 3。
- Hermes Agent Gateway 是基础运行依赖；Dashboard 是 Sessions、Skills、Config、Jobs、Conductor 和增强 Kanban 的运行依赖。
- 至少需要一个 OpenAI-compatible backend；可以是 Hermes Agent、Ollama、LM Studio、vLLM、Atomic Chat 或远端 Provider。
- Swarm 持久 TUI 依赖 tmux；Windows 的 Kanban/Tasks 文档额外要求 `sqlite3` CLI；Profile、wrapper 和 Hermes CLI 需在用户环境可发现。
- Workspace 自身不要求 PostgreSQL、Redis、Kafka 或独立消息中间件。

### 维护状态与版本演进

仓库创建于 2026-03-16，GitHub 元数据快照约为 6,539 stars、1,038 forks、144 个开放 Issue，许可证为 MIT。主干最近一次推送为 2026-08-22，最近提交方向包括远端 Agent harness 配对、把 Chat 转为 Agent command center 和 AionCore ACP harness hub；这说明主干仍活跃，但与正式 Release 存在明显时间差。

版本演进的主线是：v1 的 Workspace/UI → v2.0.0 的 zero-fork、直接对接 vanilla Hermes Agent → v2.1.x 的 pairing/session/branding 修复 → v2.2/v2.3 的 HermesWorld、Agent View、Dashboard polish 和 Swarm/Conductor 相关能力。README 将 Swarm、PWA/Tailscale、Multi-provider 和 capability gates 列为 shipped；Conductor native fallback 和 Electron 原生桌面仍分别处于已接入/开发中状态。

### 公开反馈样本及边界

近期 Issue 样本反复触及以下主题：

- [#774](https://github.com/outsourc-e/hermes-workspace/issues/774)：Workspace selector 已接线但未渲染，不能在不重启的情况下切换 Project，暴露出多工作区体验仍在收敛。
- [#731](https://github.com/outsourc-e/hermes-workspace/issues/731)：VPS backend 不工作，反映远程部署/反向代理路径的实际复杂度。
- [#736](https://github.com/outsourc-e/hermes-workspace/issues/736)：请求已宣传但未实现的 PWA Web Push，说明 roadmap/宣传能力与当前实现存在边界。
- [#711](https://github.com/outsourc-e/hermes-workspace/issues/711)：自 2.1.3 后没有新的 version tags，和当前主干持续提交形成发布管理信号。
- [#599](https://github.com/outsourc-e/hermes-workspace/issues/599)：询问多租户，说明当前部署默认仍是单用户/可信网络模型。

这些是公开 Issue 的定向样本，只能说明对应问题被提出，不能推导整体故障率、采用规模或所有部署都存在同样缺陷。

## 接入与私有化改造边界

### 最小接入路径

1. 若只需要 Chat，接入 Workspace 的 OpenAI-compatible Gateway URL 即可；Sessions、Memory、Skills、Jobs 等会按能力探测结果降级。
2. 若需要完整 Hermes 能力，运行 vanilla Hermes Agent Gateway + Dashboard，并配置 `HERMES_API_URL`、`HERMES_DASHBOARD_URL` 和必要的 bearer token。
3. 若需要 Swarm，多 Worker 应使用 Profile、`swarm.yaml`、tmux/原生 Worker 和 Workspace API；不要直接写 `runtime.json` 或 Mission JSON 作为外部集成协议。
4. 若需要 Kanban 的真实领取与 Dispatcher 语义，优先接入 Hermes Dashboard Kanban API 或 Hermes CLI/工具；Workspace 本地 JSON 只适合 fallback 看板。

### 可替换与硬依赖

| 组件 | 性质 | 改造判断 |
| --- | --- | --- |
| Workspace UI/SSR | 适配层与控制面 | 可替换或复用；需保留 API、鉴权和文件边界 |
| Hermes Gateway/Dashboard | 增强能力的上游运行时 | 可更换为兼容后端，但会丢失 Sessions/Memory/Skills/Jobs/Conductor 等能力；不是纯 UI 依赖 |
| Hermes Agent Profile/CLI | Worker 执行与上下文 | Swarm 直接依赖；替换需重做 Profile、Session、checkpoint 和工具协议 |
| tmux/native child process | 本地 Worker 连续性 | tmux 可替换为其他进程管理器，但需重做 attach、输入、日志、重启和 handoff |
| Workspace JSON stores | 单机辅助状态 | 可迁移到数据库，但需要并发、锁、迁移和故障恢复设计 |
| 上游 Kanban SQLite/Dispatcher | 任务队列核心 | 若依赖可靠 Claim、租约、超时回收和依赖解锁，不能被本地 JSON 等价替代 |
| Provider | 推理后端 | 通过 Hermes Agent/ OpenAI-compatible 接入相对可替换；数据边界和凭据策略随 Provider 改变 |

将 Workspace 直接改成跨机器中心调度服务，需要增加网络持久状态服务、Worker enrollment/heartbeat/lease、任务幂等、跨节点协调、权限/租户隔离和外部副作用重试策略。把现有 Mission JSON、runtime.json 或 tmux session 复制到共享目录不能解决这些问题。

调度逻辑也不能简单下沉成普通 Agent Task：下沉后会失去 Worker 身份、Mission/Assignment 状态、checkpoint 收敛、review gate、handoff 和人工 Greenlight 边界。普通 Agent 可以执行一个 Assignment，但不能替代 Workspace/上游 Dashboard 的状态所有者。

## 未决项与后续验证建议

- 本轮未实际安装 Hermes Agent、Dashboard、Workspace 或 Docker 栈；Gateway/Dashboard 能力探测、Swarm dispatch、tmux attach、Windows native process 和 Tailscale 访问均未在目标环境复现。
- 上游 Hermes Agent 的 SQLite schema、Kanban Dispatcher 最低版本和 Dashboard 插件版本未在本轮展开核验；Workspace 只能确认自身的 proxy/direct-SQLite/fallback 适配边界。
- Swarm `dependsOn` 在默认 `/api/swarm-dispatch` 路径上是否由其他 UI/Orchestrator 调用 `readyQueuedAssignments()` 进行串行推进，尚未通过完整运行链路确认；源码显示的默认 dispatch 本身是并行 Promise fanout。
- Workspace 进程重启、tmux 保活、Windows 原生 Worker 退出后的恢复和重复副作用未做故障演练；当前只能确认有 runtime/handoff 记录，不能承诺 exactly-once 或透明续跑。
- macOS Electron DMG、Windows portable/NSIS 产物的签名、公证、自动更新、升级回滚、安装目录权限和卸载残留未运行验证；README 仍把原生桌面列为 In Development。
- Dashboard ephemeral token 的登录/重启行为、反向代理下的 `COOKIE_SECURE`/`TRUST_PROXY` 配置和远程多用户隔离需要实际部署验证；公开 Issue #599 只说明多租户需求被提出。
- 官方 Cloud/Hosted 版本仍是 Coming Soon；不能把 README 的未来跨设备同步、团队共享内存或 webhook 计划当作当前部署能力。

建议的下一步验证顺序：先在 macOS 上以 vanilla Hermes Agent + Dashboard + Workspace 完成 Chat、Sessions、Memory、Skills 和 Kanban 配对；再分别测试 tmux Worker、dispatch timeout、checkpoint、handoff 和 Workspace 重启；最后在 Windows x64 与 Docker 多主机环境验证 PWA/Electron、API token、password guard、sqlite3、反向代理和数据保留。
