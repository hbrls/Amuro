# Agent Orchestrator 技术产品调研

> updated_by: Qoder - Claude-Sonnet
> updated_at: 2026-08-12 10:30:00
> evidence_window: 2026-08-12；目标版本 v0.12.3（2026-08-11）；分支 `main`；运行时 Go 1.25 daemon + SQLite + Electron 桌面

## 交付结论

### Agent Orchestrator 是 Agent session 编排/监督层（meta-harness），不是 Stateful 任务调度器

已确认：Agent Orchestrator（AO）的核心持久对象是 **Session**（Agent 会话）、Project、PR facts（pr/pr_checks/pr_comment）、git worktree 工作区，**不是 Task**。对 [backend 全树搜索](https://github.com/Untrivial-ai/agent-orchestrator/tree/main/backend) `task`/`depend`/`queue`/`dag`/`schedul` 均 **0 命中**——**没有任务对象、没有任务依赖、没有任务队列、没有 DAG、没有调度器**。

架构判断：AO 持久拥有 Session 对象、生命周期状态、执行连续性（durable facts + 重启可恢复），并负责监督 agent、把外部反馈（CI 失败/review 评论/merge 冲突）路由回正确 session。但它**不拥有 Task、不判断任务何时可执行、不依据依赖/状态/策略推进任务、不选择执行者**（用户/客户端启动 session 并指定 agent）。按本专项 Stateful 调度判定基准，AO 应归类为 **Agent 执行宿主/监督编排层（session 管理 + 反馈循环）**，而非任务调度中心。

这是本批七个产品中**唯一明确面向"Agent 编排"的产品**，也是唯一有持久化 Agent session 状态与反馈循环的产品，但其调度语义停留在 **session 监督**，未上升到 **任务依赖推进**。

### 核心对象是 Session 而非 Task，用户启动 session 并选择 agent，无任务依赖推进

已确认：AO 的 [Session Spawn Flow](https://github.com/Untrivial-ai/agent-orchestrator/blob/main/docs/architecture.md) 是：用户 `POST /sessions`（指定 agent harness 与 interface mode）→ 创建 session 行 → 建 git worktree → 启动 agent（TUI 用 tmux/conpty 跑 agent 终端，或 Chat 用 native protocol controller）→ MarkSpawned。**是用户/客户端主动启动 session 并选择 agent，不是系统从任务队列选择执行者**。

关键判定：
- **无 Task 对象**：工作单元是 Session（一次 agent 会话），其"任务"由用户在 session 内通过 chat/terminal 直接交给 agent，AO 不持久化任务对象。
- **无任务依赖/DAG**：Session 之间无前置依赖、阻塞、并行分支或 DAG；每个 session 独立拥有 worktree 与分支，靠 git/PR 协调而非任务依赖。
- **无任务队列**：没有持久化任务队列、原子抢占、租约或失败转移；session 由用户创建，agent 在 session 内自主工作。

### 持久化 session 状态与生命周期管理，重启可恢复，但这是 session 连续性而非任务调度

已确认：AO 用 **SQLite** 持久化 durable facts（[architecture.md Persistence](https://github.com/Untrivial-ai/agent-orchestrator/blob/main/docs/architecture.md)）：`activity_state`（active/idle/waiting_input/blocked/exited）、`is_terminated`、`session_mode` + runtime/provider handle、PR facts。**Display status（working/needs_input/ci_failed/mergeable）不存储，读时从 durable facts 推导**。所有变更经 **CDC**（change_log 触发器 → poller → broadcaster → SSE）广播。

关键判定：session 状态持久化、daemon 重启后可恢复 session（durable facts + runtime handle + generation），这是 **session 连续性与监督状态恢复**。但它恢复的是"agent 会话还在不在、卡在哪"，不是"任务推进到哪一步、下一个该执行谁"——因为没有任务对象与依赖。曾有 session 自动重唤起机制（[0038_orchestrator_reengagement.sql](https://github.com/Untrivial-ai/agent-orchestrator/blob/main/backend/internal/storage/sqlite/migrations/0038_orchestrator_reengagement.sql)，按 `next_attempt_at` 重试卡住 session），但**已在 [0039 迁移](https://github.com/Untrivial-ai/agent-orchestrator/blob/main/backend/internal/storage/sqlite/migrations/0039_drop_orchestrator_reengagement.sql)中删除**。

### 反馈循环是监督与路由，不是依赖驱动推进

已确认：AO 的 Observation 层（SCM Observer 监视 GitHub、Runtime Reaper 监视活性）把外部事实（PR 状态、CI 检查、review 评论、merge 冲突）观测为 durable facts，再把反馈**路由回正确的 session**。`activitydispatch` 是 agent hook 回调 → activity_state 的映射器（状态观测上报），**不是执行分派**。

架构判断：反馈循环是 AO 的核心价值——自动把 CI 失败/review/冲突送回正确的 agent session 形成闭环。但这是**事件路由与监督**，不是"依据任务依赖/状态/策略推进任务并选择执行者"。它不判断任务可执行性，不维护任务执行归属或失败转移。

### Agent 唤起分 TUI=PTY 与 Chat=stdio NDJSON 两模式，Codex 走专有 app-server 而非 ACP

已确认：AO 唤起 Agent 的底层机制分两种——**TUI 模式用 PTY**（macOS/Linux=tmux、Windows=ConPTY，经 PTY 注入输入/读取屏幕），**Chat 模式不用 PTY**，由 Go daemon `exec.Command` 起 agent 子进程、用 stdin/stdout 跑 NDJSON（类 JSON-RPC）。协议层分开放 **ACP**（Claude/OpenCode/Droid/Kimchi 等）与**厂商专有**——**Codex 不是 ACP**，走自己的 `codex app-server` 子命令（NDJSON、无 `jsonrpc` 版本字段、专有方法名）。详见技术架构"Agent 唤起机制"节。

架构判断：这是"有结构化协议走协议、没有退 PTY"的双模设计，传输层（stdio NDJSON）与协议层（ACP vs 专有）经端口-适配器分层。对接入方的意义：不能假设"原生协议 = ACP"，Codex 需单独适配。

### 原生桌面双平台 + 本地 daemon，无云端强依赖，符合 Local 优先

已确认：AO 提供**原生桌面应用**（macOS Apple silicon/Intel、Windows、Linux AppImage/Deb/RPM，Electron + React），另有 ao CLI 与 Expo + React Native 移动端。桌面应用内嵌并运行本地 Go daemon（HTTP 127.0.0.1 + SSE + Terminal WebSocket），SQLite 持久化在本地。移动端经认证 LAN REST/SSE 连到本地 daemon。

Local 优先判断：**高度适配**——daemon 与 SQLite 全在本地，agent 在用户本机的 git worktree 中运行，无云端强依赖（SCM Observer 连 GitHub 是为 PR/CI 集成，非主体能力依赖）。这是本批产品中**唯一有原生桌面应用（含 Windows 与 macOS）且主体能力完全本地运行**的产品。Apache-2.0 宽松许可证，商用私有化无 copyleft 约束。

## 调研目标

- 判断 AO 是否持久拥有工作对象、执行归属和可恢复的 Stateful 调度状态
- 明确 Session、Project、PR、worktree 的实际对象模型及任务关系与生命周期
- 核验 session 监督、反馈循环、生命周期管理是否构成任务调度或执行分派
- 分别评估 Windows、macOS 工作机接入及本地、云端运行形态
- 识别核心依赖、标准接入面和私有化改造范围

## 产品定位与核心流程

### 定位与用户

AO 是 Apache-2.0 许可的开源 **Agent IDE / meta-harness**，用于并行运行与监督多个 AI coding agent（Claude Code、Codex、Cursor、Kimi、opencode 等 26 种 worker + reviewer）。面向用多个编码 agent 并行开发的开发者/团队，解决并行 agent 工作中分支冲突、终端丢失、CI 跟进、review 回复、merge 冲突归属等协调问题。agent 仍负责编码，AO 提供 harness：隔离工作区、终端访问、session 状态、PR 感知、自动反馈循环。

### 端到端流程

1. 用户添加要管理的项目（git 仓库）。
2. 从桌面应用或 CLI 启动一个或多个 session，选择 agent harness 与 interface mode（Chat 或终端 TUI）。
3. AO 为每个 session 创建独立 git worktree。
4. AO 启动 agent 的终端 UI 或结构化 Chat controller。
5. 本地 daemon 监视 session 状态、controller 活动、PR、CI、review 反馈。
6. 桌面应用/CLI 显示状态（working/waiting/finished/blocked），用户可向正确 session 发送后续指令；AO 自动把 CI 失败、review 评论、merge 冲突路由回对应 session。

## 工作对象与调度模型

### Session、Project、PR、worktree 映射

| 对象 | 结论 | 持久化与归属 | 调度影响 |
| --- | --- | --- | --- |
| Project | 一等持久容器 | SQLite，关联 git 仓库 | 工作边界，非调度对象 |
| Session | 一等持久 Agent 会话 | SQLite durable facts + runtime handle + worktree | 核心管理单元，但非 Task，无依赖推进 |
| git worktree | 持久工作区 | 文件系统，每 session 独立 | 隔离执行环境，非调度 |
| PR facts | 持久 PR 状态 | pr/pr_checks/pr_comment 表 | 反馈来源，非调度 |
| Task / 任务依赖 / DAG / 任务队列 | 当前证据未发现 | 无对应模型（全树搜索 0 命中） | 不构成调度对象模型 |

### 任务关系、可执行性与状态所有者

AO 没有任务对象，因此没有任务间关系、可执行性判定或任务状态机。Session 的 `activity_state`（active/idle/waiting_input/blocked/exited）由 agent hook 上报与观察层推导，Lifecycle Manager 归约为 durable facts。没有"系统把任务从等待推进到可执行"的调度角色——session 由用户创建，agent 在 session 内自主推进编码工作，AO 监督并路由反馈。

### Agent 分派与连续性

AO **不选择执行者**：用户启动 session 时指定 agent harness。AO 负责 spawn、监督、在工作区间隔离、路由反馈。session 连续性靠 durable facts + runtime handle + generation，daemon 重启后可恢复 session 视图。曾有自动重唤起（orchestrator_reengagement）但已删除。这是 **session 连续性**，不是任务执行归属或失败转移。

## 技术架构

### 系统全貌

```text
Electron+React 桌面 / Expo+RN 移动 / ao CLI
      | REST + SSE + Terminal WebSocket (127.0.0.1)
      v
Go Daemon (HTTP Controllers)
      |-- Core Services: Session/Project/PR/Review/Chat Service, Session Manager, Lifecycle Manager
      |-- Observation: SCM Observer (GitHub), Runtime Reaper
      |-- Persistence: SQLite + CDC Poller + Event Broadcaster
      |-- Adapters: Agent (26 harnesses), Runtime (tmux/conpty), ChatDriver (native/ACP), Workspace (git worktree), SCM (GitHub)
      v
SQLite (durable facts) + git worktrees (文件系统) + agent 进程
```

### 持久化与并发

durable facts 持久化于本地 SQLite（sqlc 生成查询，goose 迁移）。所有变更经 change_log 触发器进 CDC 管道广播（SSE）。工作区为文件系统 git worktree。并发靠端口-适配器架构、controller generation fencing（防 TUI/Chat 双活）、SQLite 事务。无业务任务队列。

### 接口与鉴权

| 边界 | 主要接口 | 鉴权/约束 |
| --- | --- | --- |
| 桌面/CLI ↔ daemon | REST + SSE + Terminal WebSocket（127.0.0.1） | 本地回环；移动端经认证 LAN |
| daemon ↔ agent | TUI=PTY（tmux/conpty）；Chat=子进程 stdio 跑 NDJSON（ACP 或厂商专有协议）；agent hooks | 各 harness 适配器 |
| daemon ↔ GitHub | SCM adapter（PR/CI/review 观测与回写） | GitHub token |
| daemon ↔ worktree | git worktree 命令 | 本地文件系统 |

### Agent 唤起机制（TUI=PTY / Chat=stdio NDJSON）

已确认：AO 唤起 Agent 分两种模式，底层机制不同（[architecture.md Terminal Multiplexing](https://github.com/Untrivial-ai/agent-orchestrator/blob/main/docs/architecture.md) 与定点源码）。

**TUI 模式 = PTY（伪终端）方案**。适用于只有交互终端的 agent。运行时按平台选择（[runtimeselect](https://github.com/Untrivial-ai/agent-orchestrator/blob/main/backend/internal/adapters/runtime/runtimeselect/runtimeselect.go)）：macOS/Linux 用 **tmux**（daemon 起 tmux session 执行 agent launch command，经 PTY attach 读写），Windows 用 **ConPTY**（Windows 原生伪控制台，经 loopback dial 连接）。数据通路为 `Browser ⇄ WebSocket ⇄ Terminal Mux ⇄ [tmux PTY | ConPTY] ⇄ agent 进程`，daemon 经 Runtime 接口 `SendInput`/`GetOutput`/`Interrupt` 向 PTY 注入输入、读取终端屏幕输出。agent 以为自己跑在真实终端，AO 在 PTY 另一端观察与注入。另有更底层的 `ptyexec` 适配器（spawn_unix/spawn_windows）作直接 PTY 执行原语。

**Chat 模式 = 子进程 stdio + NDJSON（不是 PTY）**。适用于支持原生结构化协议的 agent。daemon 直接 `exec.Command` 起 agent 子进程，用 stdin/stdout 管道跑换行分隔 JSON（NDJSON，类 JSON-RPC），stderr 单独 drain 防管道撑满（[acp/process.go](https://github.com/Untrivial-ai/agent-orchestrator/blob/main/backend/internal/adapters/chatdriver/acp/process.go)）。`cmd.Dir` 设为该 session 的 git worktree，子进程长驻，可经 `Resume` 在 daemon/子进程重启后重连已存对话。

**关键区分：协议层分 ACP 与厂商专有**。Claude/OpenCode/Droid/Kimchi 等走开放 **ACP**（Agent Client Protocol，共享 `acp/` 传输包 + 各 `*acp` 驱动）；**Codex 不是标准 ACP**，走自己的 `codex app-server` 子命令（[codexappserver/rpc.go](https://github.com/Untrivial-ai/agent-orchestrator/blob/main/backend/internal/adapters/chatdriver/codexappserver/rpc.go)：NDJSON、类 JSON-RPC 但无 `jsonrpc` 版本字段、专有方法名，独立 `codexproto/` 协议包）。AO 用 `exec.Command(bin, "app-server")` 起这个外部子进程（`bin` 由插件解析，最低版本 0.146.0），自己当客户端。

架构判断：AO 的双模设计是"有结构化协议就走协议（stdio NDJSON，可靠可解析），没有就退到 PTY（通用但需屏幕解析）"。传输层（stdio NDJSON）与协议层（ACP vs Codex 专有）经端口-适配器分层，便于接入异构 agent。接入某 agent 时不能假设"支持原生协议 = ACP"——Codex 需单独适配其 app-server 协议。

### 数据边界

session 状态、PR facts、配置存于本地 SQLite；代码在本地 git worktree；agent 在本机进程运行。唯一出机数据是 SCM Observer 与 GitHub 的 PR/CI/review 交互（用户配置的集成）与可选匿名遥测（可关，官方称不含 PII/项目内容）。断网影响 GitHub 集成与 agent（若 agent 本身依赖云端 LLM），不影响本地 daemon 与 session 管理。

## 部署与工作机支持

### macOS

| 项目 | 结论 |
| --- | --- |
| 官方安装 | 原生桌面 .dmg（Apple silicon 与 Intel 分别提供），Electron 应用内嵌 daemon |
| 运行入口 | 打开桌面应用即自动运行本地 daemon，无需 CLI |
| 依赖 | agent CLI（如 claude/codex 等）需单独安装；TUI 模式需 tmux |
| 权限 | 访问用户 git 仓库、起本地 daemon、spawn agent 进程 |
| 网络 | 本地回环；GitHub 集成与云端 LLM agent 需联网 |
| 升级 | 桌面应用启动时及运行中周期性检查更新 |
| 卸载 | 标准 macOS 应用卸载；数据在本地 SQLite 与 worktree（官方未提供一键清除说明） |

macOS 有原生桌面应用，主体能力完全本地。

### Windows

| 项目 | 结论 |
| --- | --- |
| 官方安装 | 原生 Windows 桌面安装包，Electron 应用内嵌 daemon |
| 运行入口 | 打开桌面应用即运行本地 daemon |
| 依赖 | agent CLI 单独安装；TUI 模式用 conpty（Windows 原生控制台）替代 tmux |
| 权限 | 访问 git 仓库、起本地 daemon、spawn 进程 |
| 网络 | 同 macOS |
| 升级 | 桌面应用自动检查更新 |
| 卸载 | 标准 Windows 卸载；本地数据清除官方未详述 |

Windows 有原生桌面应用，TUI 用 conpty（区别于 macOS 的 tmux），是双平台均原生支持的产品。

### 移动端与云端

移动端（Expo + React Native）经认证 LAN REST/SSE 连到用户本机的 daemon，是本地 daemon 的远程视图/控制，非独立云端服务。AO **无官方云端 SaaS**——主体能力（daemon、SQLite、agent 执行、worktree）全在用户工作机本地。npm 旧 CLI（@aoagents/ao）已冻结（0.10.0 最终版），官方推荐桌面下载。

## 接入与改造边界

### 最小接入路径

1. 管理 Project/Session/PR 用本地 daemon 的 REST API + SSE，复用其 session 生命周期与反馈路由。
2. 接入新 agent 用 Agent Adapter 端口（实现 launch command + activity hook deriver）。
3. 若要把 AO 当"Agent 执行宿主"接入外部调度：外部系统经 REST API 创建/监督 session、读取 activity_state 与 PR 反馈，自行维护任务依赖与执行归属；AO 本身不提供任务模型。

### 私有化与依赖剥离

| 组件 | 性质 | 改造判断 |
| --- | --- | --- |
| SQLite | 核心硬依赖 | durable facts + CDC，内嵌无外部服务，不可剥离但零运维 |
| git worktree | 核心硬依赖 | session 隔离执行环境，去除失隔离 |
| Agent Adapters | 可扩展 | 26 种 harness，可增删 |
| SCM (GitHub) | 可选集成 | 反馈循环来源，去除失 PR/CI 感知（可换其他 SCM adapter） |
| Runtime (tmux/conpty) | TUI 模式依赖 | Chat 模式不需要 |
| 遥测 | 可选 | 可关，非核心 |

AO 没有"调度最小核心职责"可剥离——它本就不含任务调度中心。若目标是 Stateful 任务调度，AO 只能作为 **Agent 执行宿主与监督层**（session 生命周期、工作区隔离、反馈路由），任务依赖、执行者选择、失败转移都需外部系统另行实现。其端口-适配器架构与本地 daemon 形态使其成为良好的"Agent 执行底座"，私有化改造友好（Apache-2.0）。

### 扩展约束

AO 的扩展单位是 session（一个 session = 一个 agent + 一个 worktree），靠 git/PR 协调并行工作，不靠任务依赖。多 session 协调靠用户监督与反馈路由，无中心任务调度。其 meta-harness 定位适合作为"并行 agent 执行与监督底座"，但不提供任务编排；若需任务依赖驱动的多 agent 编排，须在其上叠加外部调度层。

## 维护状态、开源与公开反馈

仓库为 [Apache-2.0 许可](https://github.com/Untrivial-ai/agent-orchestrator/blob/main/LICENSE)，主分支 `main`，主语言 Go（backend）+ TypeScript（frontend），2026 年 2 月创建（仅约 6 个月，很新）。截至 2026-08-12：9390 stars、1341 forks、649 open issues，`pushed_at` 2026-08-12（当天活跃），最新 release v0.12.3（2026-08-11），版本节奏极快（含 nightly）。文档完善（architecture/backend-code-structure/cli/development/STATUS/stack）。支持 26 种 agent harness，生态活跃。

公开反馈以 GitHub Issues 为主（649 open，反映快速迭代中的活跃讨论），个案不代表整体，本报告不据此外推稳定性结论。项目年轻（6 个月），API 与功能可能快速变化（如 orchestrator_reengagement 的建了又删）。

## 未决项与证据边界

- 本次未实际部署或运行 AO；session 生命周期、反馈循环、TUI/Chat 切换、移动端行为来自官方架构文档与定点源码证据，未在目标环境复现。
- "无任务对象/依赖/队列/执行分派"是基于 backend 全树关键词搜索与架构文档的定点证据之"未发现"，非对未来版本的永久否定；项目迭代快，后续可能引入任务编排。
- orchestrator_reengagement 被删除的具体原因与是否以他种形式重现未决。
- 各 agent harness 的能力差异、reviewer 的隔离/信任模型（host-trusted vs user-approved）未逐一核验。
- Windows conpty 与 macOS tmux 的实际体验差异、移动端功能完整度未验证。
- 桌面应用自动更新机制、本地数据清除/卸载的完整流程官方未详述。
- 匿名遥测的具体字段与关闭方式未逐项核验（官方称不含 PII/项目内容）。
- 多 session 大规模并行下的资源占用、worktree 管理与 daemon 性能未验证。

## 后续验证建议

1. 在干净 macOS 与 Windows 环境各安装桌面应用，接入真实 git 仓库与一种 agent CLI，验证 session spawn、worktree 隔离、反馈路由（CI 失败/review/冲突）与 daemon 重启后 session 恢复。
2. 验证本地 daemon REST API + SSE 对 Project/Session/PR 的读写覆盖面与鉴权，确认是否足以支撑外部系统创建/监督 session 并读取状态。
3. 若拟以 AO 为 Agent 执行宿主外接调度器，自行设计任务依赖与执行归属的映射（AO 无任务模型），评估在其端口-适配器架构上叠加任务编排层的改动范围。
4. 跟踪项目快速迭代（如 orchestrator_reengagement 的移除），确认任务编排能力是否在未来版本引入。
5. 若需任务依赖驱动的多 agent 编排，明确 AO 无原生能力，须由外部调度层实现；AO 适合作执行与监督底座，不适合作任务调度中心。
