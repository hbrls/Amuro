# LoopX 技术产品调研

> updated_by: Codex - GPT-5
> updated_at: 2026-08-09 22:38:35
> evidence_window: 2026-08-09，main@d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b，stable@1a7cc56（v0.4.3），v0.4.4 tag@4531a836

## 调研目标

- 围绕 Stateful 编排调度、客户端接入、Windows 与 macOS 工作机部署、依赖根源与架构范式，形成可追溯的 LoopX 独立产品调研。
- 判断 LoopX 是否持久拥有工作对象、对象关系和任务生命周期，并依据状态与策略持续推进 Agent 工作。
- 核验双平台支持、Local 优先适配、外部服务边界与最小部署成本。
- 识别调度内核、Agent runtime、Host scheduler 和可选集成之间的边界，评估直接接入与改造风险。

## 交付结论

### LoopX 是本地文件驱动的 Stateful 调度控制平面内核，但不是开箱即用的中心调度执行平台

LoopX 将自身定义为面向长周期 Agent 工作的、本地优先且 Provider-neutral 的 state kernel/control plane。它持久保存 Goal、Todo、Claim、Gate、Monitor、Quota、运行证据和 Handoff，并在每次 Agent 执行前输出当前可执行工作、权限边界、配额决定和下一次调度提示。核心状态可跨对话、Agent 和 runner 重启恢复，因此它不是只在已有 Task 到达后临时启动一次 Agent 的 Stateless 消费者。以上为已确认事实，依据固定提交上的 [README](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/README.md)、[Architecture](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/architecture.md) 和 [State Definitions](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/product/core-control-plane/state-definitions.md)。

LoopX 只拥有调度控制事实和决策，不拥有完整执行闭环。自定义 runner 仍负责 wakeup、session/workspace 准备、Agent 调用、实际定时器更新和 Host readback；Codex App、Codex CLI、Claude Code、OpenCode、Pi 或自定义 shell runner 才是 loop driver。LoopX Turn 可以把一次 plan/invoke/validate/writeback 封装成 typed transaction，但官方仍将其标记为 experimental，Direct CLI orchestration 才是兼容基线。以上为已确认事实，依据 [Custom Agent Runner Integration](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/guides/custom-agent-runner-integration.md)。

因此，本轮将 LoopX 归类为 **Stateful 调度控制平面内核**：它满足“持久拥有工作、状态、归属和推进策略”的核心要求，但不等于自带常驻调度 daemon、远程任务 broker 和 Agent 执行池的完整中心调度产品。若选型目标要求安装后自行选择机器、启动 Agent、回收失败执行并分布式协调，LoopX 当前仍需要外部 Host/runner 与适配层。

### 核心对象是 Goal 与 Todo；Workspace、Project、Issue、Plan 均不是同等级的一等调度对象

LoopX 的稳定身份边界是 `goal_id`。一个 Goal 对应 registry entry、active-state workbench、quota lane、run-history stream 和 status projection。Todo 是 Goal 内最小的可执行或等待单元，包含 `todo_id`、角色、优先级、状态、task class、action kind、能力要求、证据引用、claim 与恢复条件。以上为已确认事实，依据 [Architecture 的 Lifetime Goal/Local Server 章节](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/architecture.md) 与 [Todo Contract 源码](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/loopx/control_plane/todos/contract.py)。

对象对应关系如下：

| Index 关注对象 | LoopX 实际对象 | 持久化与所有者 | 调度含义 |
| --- | --- | --- | --- |
| Workspace | Host checkout/worktree 与 workspace guard | Host/项目文件系统；registry 记录路径和边界 | 执行隔离与写范围，不是业务工作对象 |
| Project | Project root 与 project-local registry scope | `.loopx/registry.json` 及共享 registry 投影 | Goal 的容器/路由边界，没有独立 Project 生命周期状态机 |
| Issue | 核心运行时不存在独立 Issue 对象 | 外部 Issue 由 capability/provider 映射为 Todo、证据和 monitor | Issue-Fix 是领域能力，不改变 Kernel 对象模型 |
| Plan | 不存在统一的持久 Plan 编排对象 | Agent vision、planning proposal 和 active state 可保存计划性内容 | 属于路由/建议/工作台内容，不是独立 DAG 所有者 |
| Task | `Todo` | active state、todo/event 投影和运行时记录 | 最小调度与交接单元 |
| Goal | LoopX 的核心一等对象 | registry、active state、run history、quota | 长周期目标与调度边界 |

上述“Workspace/Project/Issue/Plan 不是同等级一等对象”是基于公开对象定义的架构判断。它不表示这些概念不能出现在领域能力或 UI 中，而是表示 Kernel 不为它们分别提供独立、统一的生命周期所有权。

### Todo 具备状态、阻塞、恢复、接续和交接关系，但当前不是通用 DAG 调度模型

Todo 的持久状态值为 `open`、`done`、`blocked`、`deferred`；`claimed` 由 `claimed_by` 推导，`running` 由 quota 选择与 run history 推导。Todo 还可携带 `unblocks_todo_id`、`resume_when`、`superseded_by`、`no_followup`、`blocks_agent`、continuation policy、monitor cadence 与 evidence refs。`resume_when` 已定义 `todo_done`、`pr_merged`、`capacity_available` 等恢复条件。完成、阻塞、延期、替代和 successor replan 都有明确的合法出口。以上为已确认事实，依据 [State Machine](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/product/core-control-plane/state-machine.md) 和 [Todo Contract](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/loopx/control_plane/todos/contract.py)。

LoopX 可以把 `depends_on`、`blocks`、`unblocks`、`hands_off_to`、`validates`、`repairs`、`monitors`、`supersedes` 等关系投影为 task graph，但该图是从 Todo、Gate、Lease、run history 和 event refs 派生的只读视图；图边本身不授予执行或写权限，生命周期变化仍必须通过 CLI 等受控写入。以上为已确认事实，依据 [Task Graph Projection v0](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/reference/protocols/task-graph-projection-v0.md)。

当前公开契约没有证明 Kernel 提供任意多前置依赖 join、拓扑排序、关键路径、资源池或通用 DAG executor。它更擅长从优先级、claim、gate、能力、resume/successor 与当前 Agent scope 中选择一个有界 frontier。`failed`、`cancelled` 也不是 Todo 的原生状态；失败通常写成 blocker/evidence、deferred、superseded 或 Turn result，再由后续 Todo/恢复路径承接。这是相对完整工作流引擎的明确能力边界。

### 调度决策由 Kernel 产生，Agent 唤醒和进程生命周期由 Host/runner 执行

每个 tick 的标准顺序是：runner 唤醒并准备 workspace/session，调用 `loopx quota should-run` 获取新鲜决策包，claim 选中的 Todo，执行一个 bounded slice，独立验证，通过 LoopX 写回 Todo/证据/refresh，成功后计费一个 quota slot，最后应用并 ACK scheduler hint。LoopX 决定当前是否可运行、哪条 lane 可运行、门禁是否覆盖、是否需要等待/重排/修复，以及下一次 cadence；runner 决定何时真正唤醒和如何调用 Agent。以上为已确认事实，依据 [Custom Agent Runner Integration](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/guides/custom-agent-runner-integration.md) 和 [Quota Allocation](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/quota-allocation.md)。

注册 Agent 是平级身份，不存在必须持久化的 leader rank。工作归属优先来自显式 `claimed_by` 或 task lease；未认领 Todo 在写入前应先 claim/lease。Kernel 能依据注册身份和开放 Todo 投影 eligible peer lanes 与 coordinator action，但真正创建、恢复或终止 Agent 进程仍由 Host 完成。以上为已确认事实，依据 [Peer Agent Runtime v1](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/reference/protocols/peer-agent-runtime-v1.md) 和 [Task Orchestration 源码](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/loopx/control_plane/quota/task_orchestration.py)。

重启恢复依赖持久 Goal/Todo/run state，而不是重放聊天 transcript。若 runner 重启，下一次 tick 可以重新读取 frontier 并继续；若 Agent 在 durable writeback 前崩溃，LoopX 会保留最后一次已确认状态，但没有独立中心 supervisor 自动判定该进程死亡并立即重新排队。恢复速度和是否重新唤醒取决于 Host scheduler。该限制意味着“状态连续性”已交付，“执行进程连续性”仍是集成责任。

### Claim 默认是软路由；可选 Task Lease 提供 TTL 与冲突语义，但尚未成为全局强制调度前提

默认 `claimed_by` 由 Todo CLI 在 active-state 文件锁下写入，只允许已注册 Agent 身份；它用于所有权可见性和路由，不是互斥锁。不同 Todo 在写范围和 Gate 允许时可并行推进。以上为已确认事实，依据 [Architecture 的 Local Server/Peer Task Coordination 章节](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/architecture.md)。

可选 `task_lease_v0` 以 `(goal_id, todo_id)` 为竞争键，提供 owner、TTL、write scope、idempotency、conflict、renew、transfer 和 release；但 Host Integration 契约明确说明它是 opt-in，`quota should-run` 当前不强制消费 hard lease。换言之，LoopX 已有解决具体并发写冲突的机制，却还不是“所有调度路径都由中心租约强制仲裁”的分布式任务池。以上为已确认事实，依据 [Host Integration Surface v0](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/reference/protocols/host-integration-surface-v0.md)。

### 持久化是本地文件与投影的混合模型，不依赖数据库或消息中间件

LoopX 的主要持久层包括：

- project-local registry：`.loopx/registry.json`；
- active goal workbench：`.codex/goals/<goal-id>/ACTIVE_GOAL_STATE.md` 或兼容路径；
- shared runtime root：默认位于 `~/.codex/loopx/`，保存 global registry、run JSON/Markdown、compact history/index、quota/scheduler events 与备份；
- status、attention queue、review packet、dashboard 和 task graph：由上述事实重算的 read model/projection。

核心 Python package 运行时只依赖标准库，没有 PostgreSQL、SQLite、Redis、Kafka、RabbitMQ 或外部向量数据库硬依赖。以上为已确认事实，依据 [pyproject.toml](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/pyproject.toml)、[Getting Started](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/guides/getting-started.md) 和 [Architecture](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/architecture.md)。

公开契约定义了 append-only、单调 `append_sequence`、稳定 `event_id`、幂等追加、冲突 fail-closed 和 event-first/projection-second 的目标模型；但同一契约仍包含从 Markdown 解析到 event projection 的 backfill、dual-write 和优先读取迁移步骤。结合 Architecture 仍将 registry、active state、run log/history 分列为多个 durable layer，本轮判断当前是“文件事实源 + append-only 运行事件 + 派生投影”的混合过渡形态，而不是一个已经完全收束的单一事务型 event database。以上事实和推导依据 [Event-sourced State Contract v0](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/reference/protocols/event-sourced-state-contract-v0.md)。

并发写通过 sibling POSIX `flock`、非阻塞超时、holder metadata 和 incident JSONL 处理。进程退出后由内核释放锁，不能通过删除锁文件恢复等待者。该机制适合单机共享文件系统，但不是跨机器分布式一致性协议。以上为已确认事实，依据 [File Lock Acquisition v0](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/reference/protocols/file-lock-acquisition-v0.md)。

### 接口以 CLI 与文件为基线，通信以短生命周期调用和 Host 调度回读为主

LoopX 对外稳定接口是 `loopx` CLI，支持 JSON/Markdown 投影和受控写命令。Host 每次 tick 调 CLI 读取 `doctor`、registry、status、quota、review packet，再调用 Todo、Gate、refresh、spend 和 scheduler ACK 写入。CLI 既是兼容基线，也是 Hook/MCP/server 不可用时的确定性 fallback。以上为已确认事实，依据 [Host Integration Surface v0](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/reference/protocols/host-integration-surface-v0.md)。

当前仓库还提供 loopback status server，供本地 dashboard 读取 `http://127.0.0.1:8766/status.json`；可显式开启 reward dry-run/append API。它面向本地 operator dashboard，不是公开远程控制服务。Hook、MCP 和完整 loopback coordinator 在协议层被定义为 CLI 的 thin facade，但协议文档明确“不证明任何 adapter 已安装”；Architecture 也把集中 locks、leases、quota、heartbeat 的 local daemon 作为后续分层路线。以上为已确认事实，依据 [Integration Guide](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/integration.md) 与 [Architecture](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/architecture.md)。

核心没有公开的远程 REST 调度 API、gRPC、WebSocket 控制通道或消息 broker。Host 与 LoopX 主要通过本地进程调用、文件状态和可选 loopback HTTP 交换控制信息；Host 自己负责 timer/automation。Todo frontier 是工作队列语义，但不是独立持久消息队列。跨机器、多消费者原子领取和远程 lease 需要新 coordinator/database 适配，不能从现有本地文件锁自然推导出来。

### macOS 可以原生运行 CLI；Windows 缺少官方原生安装与锁实现，是明确选型缺陷

**macOS**：官方 no-clone 路径要求 Python 3.11+、`curl`、`tar` 和 macOS shell，通过 GitHub Pages installer 下载稳定 ref 的 archive，把 release snapshot 写到 `~/.local/share/loopx/releases/`，把 wrapper 写到 `~/.local/bin`，并安装 man page 与可发现的 Agent skills。运行入口是 `loopx` CLI，不是 `.app` 桌面应用。核心安装不要求 root，但需要写用户目录、shell profile、项目 `.loopx/`/goal state 和共享 runtime root。可选 dashboard 需要额外前端依赖；仓库提供 macOS LaunchAgent 脚本用于登录后运行 feed/dashboard。以上为已确认事实，依据 [README Quick Start](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/README.md) 和 [Getting Started](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/guides/getting-started.md)。

macOS 更新使用 `loopx update --check`、`--dry-run`、`--execute` 后再运行 `loopx doctor`。项目级卸载先通过 `loopx uninstall-project` 预览，再用 `--execute`，可选择归档 goal state；完整 CLI/skill 卸载仍是文档列出的手工 shell 删除流程。安装与更新需要访问 GitHub Pages/GitHub archive；安装完成后 Kernel 的本地状态读写不依赖云端，但 Agent provider、GitHub/PR monitor、Lark 等外部能力各自需要网络与凭据。

**Windows**：官方 README 明确把基础要求限定为“macOS or Linux shell”，没有 PowerShell installer、`.exe`/`.msi`、Windows service 或原生桌面客户端。写正确性契约依赖 POSIX `flock`，安装、升级和完整卸载说明也都使用 POSIX shell 与 Unix 用户目录。当前证据未发现官方 Windows 原生运行路径，也不能用“Python 本身支持 Windows”替代产品支持结论。WSL 可被视为 Linux 兼容环境的潜在验证方向，但官方文档没有把它声明为受支持的 Windows 工作机形态，本报告不把它计为已支持。

因此，LoopX 不满足本专项“Windows 与 macOS 工作机均受支持”的硬标准。macOS 是一等 CLI 平台；Windows 原生支持缺失是明确选型缺陷。若目标工具必须在 Windows 原生进程中持续运行，需要至少改造安装器、路径/权限模型、file lock、shell skill 交付、Host scheduler 和卸载流程，并补齐平台验收。

### Local 优先匹配度高，LoopX 自身没有必须在线的云端控制服务

LoopX 的 Goal、Todo、Gate、Quota、run history、scheduler state 和投影均保存在本机或项目本地，公开仓库只保存 schema、通用 CLI、契约和脱敏 fixture。真实任务 ID、私有路径、原始日志、凭据、活动 Goal 和子 Agent trace 应保存在 git ignored local state。以上为已确认事实，依据 [Public/Private Boundary](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/public-private-boundary.md)。

产品没有必须连接的 LoopX SaaS 后端、账号服务或托管数据库。GitHub Pages/GitHub 用于首次安装、更新、源码与文档分发；断网后已安装的本地 Kernel 可以继续读取和写入状态。真正执行工作的 Codex、Claude Code、Cursor 或自定义 Agent runtime 是否依赖云端，不由 LoopX 决定。Lark/Feishu、GitHub Issue/PR、外部 benchmark 和 provider extension 也是可选外部边界，不属于核心离线能力。

因此，LoopX 的 **控制平面**符合 Local 优先标准；但“完整 Agent 工作流是否离线”取决于所接 Host/runtime/provider。不能因为 LoopX 状态在本地，就推导所调用模型、代码托管或通知链路也在本地。

### 目标工具可以跳过官方客户端直接接入 CLI，但必须自己承担 loop driver 职责

LoopX 没有必须使用的图形客户端。一个已有 Agent 工具可在拥有项目 workspace 的机器上安装 CLI，并按以下契约直接接入：

1. 注册/连接 Goal 与 Agent identity；
2. 每次 wake 读取新鲜 `quota should-run` packet；
3. claim 一个可执行 Todo；
4. 把 current objective、boundary、selected todo 和 writeback contract 交给 Agent；
5. 独立验证真实产物；
6. 通过 LoopX CLI 完成、阻塞、延期或创建 successor，并写 evidence/refresh；
7. 验证成功后只 spend 一次；
8. 应用 scheduler hint 并把 Host 实际结果 ACK 回 LoopX。

以上为官方推荐的 Direct CLI orchestration，依据 [Custom Agent Runner Integration](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/guides/custom-agent-runner-integration.md)。隔离 worker 还可使用只读 source/runtime mount 与 `PYTHONPATH ... python3 -m loopx.cli` 的 Worker Bridge 契约，但该 Bridge 只声明 worker 可见面，不负责启动模型、运行 benchmark 或上传结果，依据 [Worker Bridge Install Contract](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/integrations/worker-bridge-install-contract.md)。

若目标工具已有可靠 scheduler、session manager 和 workspace manager，接入工作主要是 CLI packet/receipt 适配，改造量中等；若目标工具期望 LoopX 自己远程唤醒 Worker、提供中心 API、完成多机租约和失败回收，改造量高，实质上需要实现 LoopX roadmap 中的 coordinator/server 层。

### 依赖根源是本地状态正确性与 Host 可重入，而不是数据库或云端基础设施

核心硬依赖如下：

- Python 3.11+；package runtime dependencies 为空；
- macOS/Linux POSIX shell、`curl`、`tar`；贡献者路径另需 Git；
- 本地可写用户目录、项目 registry/active state 与共享 runtime root；
- POSIX `flock` 语义，用于文件 read-modify-write 串行化；
- 一个能执行 CLI、准备 workspace/session、唤醒 Agent、执行验证并应用 scheduler hint 的 Host/runner。

可选依赖包括 dashboard 的 Node/npm 前端工具、Lark/Feishu 或其他 provider 凭据、外部代码托管网络、Agent runtime 自身的模型/API 依赖。它们不应被误记为 LoopX Kernel 的数据库硬依赖。

依赖剥离判断：dashboard、Lark、benchmark、Reward Memory provider 和具体 Agent runtime 可分别关闭或替换；CLI、本地持久状态、锁、quota/gate/todo 写回和 Host 重入协议不能在不改变产品本质的情况下剥离。把 `quota should-run` 仅改成 cron timer，或把 Todo 状态只留在 Agent chat 中，会失去 LoopX 的 Stateful 控制价值。

### 架构属于本地特权状态内核加平级 Agent lanes，不是分布式任务池

LoopX 把每轮工作建模为 `model -> effect request -> Kernel interpretation -> observation -> model`。Kernel 持有 Gate、Quota、Claim、Todo、Monitor、Writeback 与调度策略；Agent 做推理和工具调用；Capability 定义领域结果和验证；Provider 对接外部系统；Host/runtime 承载会话、工具和执行。这种职责切分使 Agent runtime 可替换，同时保证长期 Goal 的状态不依附于单个会话。以上为已确认事实，依据 [Architecture 的 Effect Interpreter/Runtime Responsibility 章节](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/architecture.md)。

调度权在逻辑上是中心化的：同一 Goal 的 registry/state/quota/gate 是特权事实源；执行权则分散给平级 Agent lanes。不同 Todo 可并行，但单机文件状态、soft claim 与 opt-in lease 是当前协调基础，不构成跨节点共享任务池。

规划、资料采集或领域判断可以下沉为普通 Agent Todo；Kernel 本身不能等价地下沉为一个普通 Todo。若配额检查、Gate、Claim、事件顺序和 writeback 只在某个 Agent 被唤醒后才存在，就会失去执行前约束、跨重启事实和 Agent 之间的统一归属。可作为普通节点的是 planning/capability；必须留在节点外的是 Stateful control plane。

### 项目维护活跃但仍处于 v0.x early 阶段，稳定通道与公开 Release 证据存在时间差

仓库采用 MIT License，创建于 2026-05-31；本次窗口内 `main` 在 2026-08-09 仍有提交，GitHub API 快照为 3,671 stars、301 forks，说明公开关注度和提交活跃度较高，但这些数量不能证明生产成熟度。README 明确标注 “Loop Agents early”，Release Readiness 也将当前状态定义为 “v0.x maintainer contract”。以上为已确认事实，依据 [仓库首页](https://github.com/huangruiteng/loopx) 与 [Release Readiness](https://github.com/huangruiteng/loopx/blob/d66dbe3413b36dbd6b2a70f66cd1d7baefadcc8b/docs/product/release-readiness.md)。

本次证据窗口发现三个不同版本面：

- `main@d66dbe3` 的 package version 是 0.4.4；
- `v0.4.4` tag 指向 2026-08-09 的 release preparation commit；
- 公共 `stable` ref 仍指向 `v0.4.3` commit，stable 分支的 package version 是 0.4.3。

官方 installer 默认消费 `stable`，因此普通用户当前应按 0.4.3 稳定快照理解，不能把 main 上的新契约直接当成已激活运行时。GitHub Releases API 在调研时返回空列表，尽管 tags 和 release workflow 文档存在；这表示可见 tag、stable promotion 与 GitHub Release assets 不能视为同一事实。对生产选型而言，需要在安装验收时读取 `loopx doctor` 和 release manifest，而不能只看 README badge 或最新 tag。

README 展示了多个长周期案例、公开 PR 轨迹和可复现 KNN demo，但也明确区分 elapsed wall-clock time、用户报告、owner-run showcase 与独立复现。当前公开案例足以证明产品正在真实试用，不足以证明无人值守生产自治、跨平台稳定性或大规模分布式调度。社区入口包括 GitHub Issues/Discussions、Discord 和飞书手册；公开反馈样本仍应按个案处理。

## 未决项与证据边界

- **Stable promotion 时间差**：`v0.4.4` tag 已存在但 `stable` 仍在 v0.4.3，GitHub Releases API 没有公开条目。需要观察后续 stable fast-forward 与 release assets，才能判断这是正常发布窗口还是分发流程缺口。
- **Event store 收束程度**：公开契约同时描述 append-only canonical events 与 Markdown/event dual-write 迁移。报告按混合过渡形态处理；若选型依赖严格 event sourcing，需要对实际 v0.4.3 安装快照做运行级写入、重放与冲突测试。
- **Hard lease 覆盖率**：`task_lease_v0` 已有 CLI 契约，但 quota 不强制消费。公开证据没有证明所有 write path 都已接入 lease；不能据此宣称 exactly-once 分布式执行。
- **故障自动回收**：持久状态支持 runner 重启恢复，但 Host 在 durable writeback 前崩溃后的探测、重启延迟和重复执行上界由外部 runner 决定，缺少统一产品 SLA。
- **Windows**：未发现原生支持。WSL 是否可作为可接受工作机形态需要单独运行验证，不能替代 Windows 原生选型缺陷。
- **云端 Host**：LoopX 自身无强制 SaaS，但不同 Agent provider、Ark/Lark/GitHub 能力的数据出机、鉴权和故障边界属于具体集成，不能由 Kernel 的 Local-first 声明统一覆盖。
- **性能与规模**：本轮按 RUNBOOK 不做 benchmark。单机文件锁、history/index 重算和大量 Goal/Todo 下的延迟、文件增长、备份恢复时间仍未决。

## 后续验证建议

- 在 macOS 使用官方 stable installer 建立隔离测试 Goal，验证 install/update/doctor/uninstall-project、断网状态读写和备份恢复，并确认实际 manifest 为 v0.4.3。
- 运行一个可控的 custom runner：创建两个有依赖的 Todo、两个 registered peers，覆盖 claim、scoped gate、handoff、runner 重启、writeback 前崩溃和 scheduler ACK，确认恢复与重复执行边界。
- 单独验证 `task_lease_v0` 的 TTL、renew、冲突、transfer、进程退出和 stale owner 场景，并确认哪些写命令实际检查 lease。
- 对 event store 做 append、同 event id 幂等重放、冲突 event id、projection stale 与 active-state dual-write 一致性测试，确认 v0.4.3 的真实 source-of-truth 顺序。
- 若 Windows 是硬要求，先做一轮 WSL 可行性验证；若必须原生 Windows，则在进入选型前估算 `flock` 替换、PowerShell installer、路径/权限、Host scheduler 与回归矩阵的改造成本。
- 若目标是跨机器中心调度，先实现最小 coordinator spike：关系型/event store、远程身份、per-Todo lease、原子领取、heartbeat/失联回收和 CLI fallback；不要把现有 loopback status server误判为该能力已经交付。
