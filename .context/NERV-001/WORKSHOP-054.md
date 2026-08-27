# Gas Town 技术产品调研

> updated_by: Qoder - Claude Sonnet 4.5
> updated_at: 2026-08-07 17:30:00
> evidence_window: 调研日期 2026-08-07；目标版本 v1.2.1（2026-06-06 发布）；GitHub 仓库 gastownhall/gastown（默认分支 main，截至 2026-08-07）；官方文档 docs/ 目录内嵌于仓库

## 交付结论

### Gas Town 是基于 Git 和 Beads 的多 Agent 编排系统，定位为 AI 编码 Agent 工作空间管理器，核心运行形态为工作机本地 CLI + tmux

Gas Town 是 Steve Yegge 创建的开源多 Agent 编排系统，官方定位为「multi-agent workspace manager」——让用户协调多个 AI 编码 Agent（Claude Code、GitHub Copilot、Codex、Gemini 等）在不同任务上并行工作（[GitHub README](https://github.com/gastownhall/gastown)，直接事实）。产品通过 git worktree 实现持久化工作状态存储，解决 Agent 重启后丢失上下文的问题。核心能力包括：Mayor（AI 协调器）、Polecats（Worker Agent）、Hooks（git worktree 持久存储）、Convoys（工作跟踪单元）、Beads（git-backed issue 追踪）、Scheduler（容量控制调度器）、Refinery（Bors-style 合并队列）、Witness/Deacon（三层看门狗监控）。

对照 Index 调度判定基准：Gas Town 的主体能力运行在工作机本地。所有组件（Daemon、Dolt SQL Server、Mayor、Polecats、Witness、Refinery）均为本地进程，不依赖云端。Wasteland 联邦网络通过 DoltHub 连接多个 Gas Town 实例，但这是可选的跨实例协作功能，不影响核心运行（[README](https://github.com/gastownhall/gastown)，直接事实）。

### 具备 Stateful 调度能力：持久拥有工作对象、对象关系、任务状态和执行归属，负责判断何时可执行、按何种顺序推进、由谁执行以及失败后如何继续

Gas Town 满足 Index 定义的 Stateful 调度系统全部判定基准（[docs/design/scheduler.md](https://github.com/gastownhall/gastown/blob/main/docs/design/scheduler.md) + [docs/design/architecture.md](https://github.com/gastownhall/gastown/blob/main/docs/design/architecture.md) + [docs/design/convoy/convoy-lifecycle.md](https://github.com/gastownhall/gastown/blob/main/docs/design/convoy/convoy-lifecycle.md)，直接事实）：

1. **持久拥有工作对象**：Beads 是 git-backed 持久化工作项，有唯一 ID（如 gt-abc12），存储在 Dolt SQL Server 中。Sling contexts 是独立的临时 bead，存储调度参数。Convoy 是工作跟踪单元，聚合多个 beads。
2. **持久拥有对象关系**：Molecules/Formulas 的 steps 支持 `needs` 数组定义步骤间依赖（DAG）。Beads 通过 `tracks` 依赖关联。Convoy 通过 `dep add --type=tracks` 跟踪多个 beads。
3. **持久拥有任务状态**：Beads 有 open / in_progress / closed 状态。Sling contexts 有 SCHEDULED / DISPATCHED / CIRCUIT-BROKEN / CLEARED 状态机。Hook 有 Created → Active → Suspended → Completed → Archived 生命周期。Convoy 有创建 → 跟踪 → 分派 → 执行 → 完成检测 → 关闭生命周期。
4. **持久拥有执行归属**：Agent beads（hq-mayor、hq-deacon、prefix-rig-polecat-name 等）记录 Agent 身份和生命周期状态。Hook beads 记录工作归属。`hook_bead` 字段在 Agent bead 上跨会话持久化。
5. **判断何时可执行**：`bd ready` 通过依赖解析判断哪些 beads 已解锁。Scheduler 的 DispatchCycle 在 daemon heartbeat（每 3 分钟）中查询 ready beads 并分派。
6. **判断顺序推进**：Molecule steps 按 `needs` 数组顺序执行。Convoy 在一个 issue 完成后自动 feed 下一个 ready issue 给可用 polecat。
7. **判断由谁执行**：`gt sling` 将 bead 分派给 polecat。Mayor 分析任务并生成 convoy + agents。Scheduler 在容量限制内增量分派。
8. **失败后如何继续**：Circuit breaker（3 次连续失败后 circuit-broken）。Witness 检测 stuck agents 并触发 nudge 或 handoff。Escalation 按严重级别路由（P0/P1/P2 通过 Deacon → Mayor → Overseer）。Seance 发现前驱会话以恢复上下文。Session-per-step 模型：sandbox（branch + worktree）跨会话持久化。

### 工作对象模型：有 Town / Rig / Bead / Convoy / Molecule / Hook / Agent Bead；Issue 和 Plan 以 Bead 和 Molecule 形式持久化

可辨识的持久对象（[docs/design/architecture.md](https://github.com/gastownhall/gastown/blob/main/docs/design/architecture.md) + [README](https://github.com/gastownhall/gastown)，直接事实）：

- **Town**：工作空间根目录（~/gt/），包含所有项目、Agent 和配置。
- **Rig**：项目容器，包裹一个 git 仓库。每个 rig 有独立的 beads 数据库。
- **Bead / Issue**：git-backed 持久化工作项，ID 格式为 prefix+5 字符（如 gt-abc12）。存储在 Dolt SQL Server 中。Bead 和 issue 可互换使用。
- **Convoy**：工作跟踪单元，聚合多个 beads。有完整生命周期（创建 → 跟踪 → 分派 → 执行 → 完成检测 → 关闭）。支持 auto-convoy 创建。
- **Molecule**：工作流模板实例。Formula（TOML 定义）实例化为 molecule，有 tracked steps。两种模式：root-only wisps（步骤运行时内联渲染）和 poured wisps（步骤实体化为 sub-wisps，带 checkpoint recovery）。
- **Hook**：git worktree-based 持久存储。有 Created → Active → Suspended → Completed → Archived 生命周期。
- **Agent Bead**：Agent 身份和生命周期状态 bead。分 Town-level（Mayor、Deacon、Boot、Dogs）和 Rig-level（Witness、Refinery、Polecats、Crew）。Agent bead 通过 `role_bead` 字段引用角色定义 bead。
- **Sling Context**：独立的临时 bead，存储调度参数。有 SCHEDULED → DISPATCHED / CIRCUIT-BROKEN / CLEARED 状态机。Work bead 不被 scheduler 修改。
- **Wasteland**：联邦工作协调网络，通过 DoltHub 连接多个 Gas Town 实例。

**Plan 作为持久对象**：Molecule 是持久化的编排对象，不是仅供单次 Agent 执行参考的文本产物。Steps 有 `needs` 依赖关系，poured wisps 支持 checkpoint recovery（会话死亡后从最后一个 checkpoint 恢复）（直接事实）。

**Issue / Task 作为持久对象**：Beads 是调度中心拥有的工作记录，不是从外部系统读取后交给 Agent 的输入。`gt sling` 将 bead 分派给 polecat，调度状态存储在 sling context bead 上（直接事实）。

### Agent 分派是「Mayor 分析 + Scheduler 容量控制分派 + Polecat 持久身份 + 跨会话恢复」的完整闭环

Agent 执行由 Mayor 分析用户意图并生成 convoy + agents 触发，或由用户直接 `gt sling` 触发（[README](https://github.com/gastownhall/gastown) + [docs/design/scheduler.md](https://github.com/gastownhall/gastown/blob/main/docs/design/scheduler.md)，直接事实）。Polecats 有持久身份但临时会话——spawned for tasks，sessions end on completion，but identity and work history persist。

Scheduler 是 config-driven capacity governor：`scheduler.max_polecats` 控制并发上限。默认 `-1` 为直接分派（`gt sling` 立即分派）；`N > 0` 为延迟分派（创建 sling context bead，daemon 在 heartbeat step 14 中增量分派）。Circuit breaker 防止永久失败 bead 无限重试。

Agent 退出、失败或断线后的恢复机制：
- **Witness** 检测 stuck agents（GUPP Violation、Stalled、Zombie），触发 nudge（刷新上下文）或 handoff。
- **Seance** 发现前驱会话（via .events.jsonl logs），Agent 可查询前驱获取上下文和决策。
- **Session-per-step 模型**：sandbox（branch + worktree）跨会话持久化。新会话通过 `gt prime --hook` + `bd mol current` 发现位置。Beads state IS the handoff。
- **Step Cleanup**：step 完成后 session 终止，sandbox 存活；**Molecule Cleanup**：最终 step 完成后 polecat idle，sandbox 保留。
- **Escalation**：Agent 遇到 blocker 时通过 `gt escalate` 创建 tracked beads，按严重级别路由。

### 运行形态是工作机本地 CLI + tmux + Dolt SQL Server；完全本地，无云端依赖

Gas Town 有两种运行形态（[README](https://github.com/gastownhall/gastown) + [docs/design/architecture.md](https://github.com/gastownhall/gastown/blob/main/docs/design/architecture.md)，直接事实）：

1. **原生安装（主体）**：`gt` CLI 二进制 + 本地 Dolt SQL Server + tmux 会话管理 + git worktrees。`gt up` 启动 Dolt、daemon、Deacon、Mayor 和 per-rig Witnesses 和 Refineries。
2. **Docker Compose**：在沙箱容器中运行 Gas Town，HQ 挂载到宿主机目录。包含 Go、Dolt、bd、tmux 和 CLI 工具。

所有组件均为本地进程。无云端组件（Wasteland 联邦通过 DoltHub 连接远程实例，但这是可选的跨实例协作功能）。主体功能运行在**工作机本地**。Local 优先适配判断：**完全满足**——零云端依赖，所有状态存储在本地 Dolt SQL Server 和 git worktrees 中（直接事实）。

### Windows 与 macOS：macOS 有 Homebrew 原生支持；Windows 需 go install，tmux 工作流需 WSL

Gas Town 桌面端支持 macOS、Windows 和 Linux（[README](https://github.com/gastownhall/gastown)，直接事实）：

- **macOS**：`brew install gastown` 一键安装 gt、bd 和 dolt。也支持源码构建（需 `brew install dolt icu4c` + `go install bd` + `make install`）。注意 `go install` 产生的未签名二进制会被 Gatekeeper 杀死。
- **Windows**：需先安装 Dolt，然后 `go install` 安装 gt 和 bd。二进制位于 `%USERPROFILE%\go\bin`。源码构建需要 MSYS2 UCRT64/MinGW64 shell 和 ICU 包。**tmux-backed 工作流（Mayor、Witnesses、Refineries、polecats）需要 WSL 或 Linux 环境**。原生 Windows shell 最好视为 minimal CLI-only 环境。
- **Linux**：安装 Dolt 后 `go install` 安装 gt 和 bd。
- **Docker Compose**：跨平台，沙箱容器内包含所有依赖。

Windows 平台存在明显能力缺失：tmux-backed 工作流不可用，这意味着 Mayor Workflow（推荐的主要工作模式）无法在原生 Windows 上运行。这是一个选型缺陷（直接事实）。

### 开源与闭源边界：MIT 开源，完全开源无闭源核心

Gas Town 采用 MIT License，完全开源，无闭源核心模块或企业版目录（[GitHub LICENSE](https://github.com/gastownhall/gastown/blob/main/LICENSE)，直接事实）。Beads（bd）也是独立开源项目（github.com/steveyegge/beads），MIT License。

GitHub 仓库统计（[GitHub API](https://api.github.com/repos/gastownhall/gastown)，截至 2026-08-07）：17,486 Stars，1,603 Forks，337 Open Issues。主语言 Go（14.6M），其次 Shell（259K）、JavaScript（152K）。默认分支 main。由 Steve Yegge 创建。

### 依赖根源：核心依赖 Dolt SQL Server、Beads（bd）和 tmux；Agent 运行时依赖 Claude Code CLI 或替代品

影响安装、运行和部署的依赖（[README](https://github.com/gastownhall/gastown)，直接事实 + 架构推导）：

- **Go**：1.26.2+（见 go.mod），Linux/Windows 和 macOS 源码构建必需。Homebrew 和 Docker 安装不需要。
- **Beads（bd）**：0.57.0+，git-backed issue 追踪系统。Homebrew 和 Docker 供应；源码/native Go 路径通过 `go install` 安装。
- **Dolt**：git-backed 数据库，作为 SQL Server 运行（端口 3307），存储所有 beads 数据。无嵌入式 fallback——服务器宕机时 `bd` 直接失败。
- **sqlite3**：用于 convoy 数据库查询。macOS 和 Linux 通常预装。
- **ICU4C dev headers**：源码构建必需（编译 ICU-backed 查询层）。
- **tmux**：3.0+，`gt up` 和 tmux-backed 角色必需（Mayor、Witnesses、Refineries、polecats）。仅在 minimal-mode 工作流中可选。
- **Claude Code CLI**：默认 Agent 运行时。可替换为 Codex、Copilot、Gemini、Cursor 等（通过 `settings/config.json` 配置）。

不可剥离的硬依赖：Dolt SQL Server（存储层）、Beads/bd（工作项管理）、tmux（会话管理）。tmux 依赖可通过 minimal-mode 部分绕过，但失去 Mayor Workflow 能力。Agent 运行时可替换（架构推导）。

### 架构范式判定：Stateful 调度器 + Git-based 持久化 + 容量控制分派 + Bors-style 合并队列

Gas Town 的架构范式是：以 Dolt SQL Server 为持久化存储层、以 Beads 为工作对象模型、以 git worktrees 为 Agent 隔离和持久存储、以 Daemon heartbeat 为调度驱动、以 tmux 为会话管理的 Stateful 多 Agent 调度系统（[docs/design/architecture.md](https://github.com/gastownhall/gastown/blob/main/docs/design/architecture.md) + [docs/design/scheduler.md](https://github.com/gastownhall/gastown/blob/main/docs/design/scheduler.md)，直接事实 + 架构推导）。

核心组件及职责：

| 组件 | 职责 | 运行位置 |
| --- | --- | --- |
| gt CLI | 主命令行接口，所有操作的入口 | 用户工作机 |
| Daemon | Go 进程，heartbeat 每 3 分钟，调度分派、健康检查、生命周期处理 | 用户工作机 |
| Dolt SQL Server | 存储层，MySQL 协议端口 3307，存储所有 beads 数据 | 用户工作机 |
| Mayor | AI 协调器，Claude Code 实例，全工作空间上下文 | 用户工作机（tmux） |
| Polecats | Worker agents，持久身份临时会话，git worktree 隔离 | 用户工作机（tmux） |
| Witness | Per-rig 生命周期管理器，监控 polecats，检测 stuck agents | 用户工作机（tmux） |
| Deacon | 跨 rig 后台监督器，连续巡逻循环 | 用户工作机（tmux） |
| Refinery | Per-rig 合并队列处理器，Bors-style bisecting queue | 用户工作机（tmux） |
| Hooks | Git worktree-based 持久存储 | 用户工作机（文件系统） |
| Dashboard | Web 仪表板，监控工作空间 | 用户工作机（HTTP） |

调度逻辑已经下沉为 Agent 任务节点（Polecats 执行 molecule steps，调度状态由 Daemon + Scheduler 持有）。下沉后不会失去持久任务状态、依赖解析或执行归属——这些由 Dolt SQL Server 中的 beads 数据持久化（直接事实）。

**但需注意**：Scheduler 的核心设计目标是**back-pressure 和 capacity control**（防止 API rate limit exhaustion），不是通用任务依赖调度。依赖解析通过 `bd ready` 实现，molecule steps 的 `needs` 数组提供 DAG 能力，但整体调度模型以容量控制为主轴（架构推导 + 证据边界）。

## 调研目标

- 确认 Gas Town 的产品定位、技术架构与运行形态。
- 判定产品是否具备 Stateful 调度能力，还是任务执行宿主或无状态任务消费者。
- 厘清工作对象模型与 Agent 分派、连续性机制。
- 评估运行形态、Local 优先适配、Windows/macOS 落地形态与云端依赖边界。
- 识别依赖根源、开源/闭源边界与改造可行性。

## 产品调研

### 产品定位与目标用户

- **一句话定位**：Gas Town 是基于 Git 和 Beads 的多 Agent 编排系统，让用户协调多个 AI 编码 Agent 在不同任务上并行工作，通过 git worktree 实现持久化工作状态存储（[GitHub README](https://github.com/gastownhall/gastown)，直接事实）。
- **目标用户**：需要大规模并行化 AI 编码 Agent 的开发者和团队（运行 20-30 个 Claude Code 实例）（[README](https://github.com/gastownhall/gastown)，直接事实）。Steve Yegge 在公开文章中描述的场景是大规模代码库上的自动化 issue 分诊、规划和实现。
- **开源与许可**：MIT License，完全开源。
- **版本状态**：v1.2.1（2026-06-06 发布），仓库创建于 2025-12-16，8 个月内增长至 17,486 Stars（[GitHub API](https://api.github.com/repos/gastownhall/gastown)，直接事实）。

### 核心流程

1. 用户安装 `gt` CLI，运行 `gt install ~/gt --shell --git` 创建工作空间。
2. 运行 `gt up` 启动 Dolt SQL Server、daemon、Deacon、Mayor 和 per-rig Witnesses/Refineries。
3. 通过 `gt rig add` 将 git 仓库克隆为 rig。
4. 启动 Mayor（`gt mayor attach`），告诉 Mayor 要构建什么。
5. Mayor 分析任务，创建 convoy 和 beads，分派给 polecats。
6. 每个 polecat 在独立 git worktree 中工作，通过 hook 持久化工作状态。
7. Polecat 完成后运行 `gt done`，提交 MR 到 Refinery 合并队列。
8. Refinery 批量处理 MR，运行验证 gates，Bors-style bisecting merge 到 main。
9. Convoy 完成检测：所有 tracked issues 关闭后，convoy 关闭并发送通知。
10. 可选：通过 Wasteland 联邦网络跨 Gas Town 实例协作。

### 功能地图与边界

- **多 Agent 编排**：Mayor 协调、Polecats 并行执行、Witness/Deacon 监控、Refinery 合并队列。
- **持久化工作状态**：Beads（git-backed issue tracking）+ Hooks（git worktree-based storage），Agent 重启后工作不丢失。
- **工作跟踪**：Convoys 聚合多个 beads，事件驱动完成检测，自动 feed 下一个 ready issue。
- **工作流模板**：Molecules/Formulas（TOML 定义），支持 step 依赖（needs）、checkpoint recovery、root-only 和 poured 两种模式。
- **容量控制调度**：Scheduler 防止 API rate limit exhaustion，circuit breaker，pause/resume。
- **三层看门狗**：Witness（per-rig）→ Deacon（cross-rig）→ Dogs（infrastructure workers）。
- **合并队列**：Refinery，Bors-style batch-then-bisect，verification gates。
- **升级路由**：CRITICAL（P0）/ HIGH（P1）/ MEDIUM（P2），通过 Deacon → Mayor → Overseer。
- **会话发现**：Seance 发现前驱会话，支持上下文恢复。
- **联邦网络**：Wasteland 通过 DoltHub 连接多个 Gas Town 实例。
- **可观测性**：OpenTelemetry，结构化日志和指标到 OTLP-compatible backend。
- **明确不含**：Windows 原生 tmux-backed 工作流、云端托管形态、GUI 桌面应用、非编码场景的通用任务调度。

### 维护状态与版本演进

- **活跃维护**：v1.2.1 发布于 2026-06-06，仓库最近 push 于 2026-08-05（[GitHub API](https://api.github.com/repos/gastownhall/gastown)，直接事实）。
- **关键版本演进**：
  - 2025-12-16：仓库创建。
  - 2026-01：Steve Yegge 公开发布 Gas Town，迅速获得关注（[paddo.dev](https://paddo.dev/blog/gastown-two-kinds-of-multi-agent/)，直接事实）。
  - 2026-06-06：v1.2.1 发布，包含 per-bead cargo target clean hook、Witness 启动时检测 stuck polecats 等功能。
- **生态入口**：GitHub 仓库、Homebrew（`brew install gastown`）、npm（`npx @gastown/gt`）、Beads 生态、DoltHub（Wasteland 联邦）。
- **反馈主题**：
  - 社区评价为「架构正确但执行早期」——「The architecture is sound. External memory, parallel execution, Git-based coordination. These are the right primitives for orchestrated agent swarms. But don't mistake "different architecture" for "ready for production."」（[paddo.dev](https://paddo.dev/blog/gastown-two-kinds-of-multi-agent/)，直接事实）。
  - 实际使用反馈包含：$100/小时 token 消耗、自动合并不通过的测试到 main、「murderous rampaging Deacon」删除代码、5 次 force push to main 恢复损坏状态（DoltHub 博客，社区样本，不代表整体）。
  - 需要持续人工干预，不是 hands-off 系统（Justin Abrahms 博客，社区样本）。
  - 这些反馈来自 2026 年 1 月的早期版本，产品可能已改进（证据边界）。

## 技术架构调研

### 系统全貌与运行形态

工作机本地 CLI + tmux + Dolt SQL Server，完全开源（[docs/design/architecture.md](https://github.com/gastownhall/gastown/blob/main/docs/design/architecture.md)，直接事实 + 架构推导）：

| 组件 | 职责 | 运行位置 |
| --- | --- | --- |
| gt CLI | 主接口，所有操作入口 | 用户工作机 |
| Daemon | Go 进程，heartbeat 每 3 分钟 | 用户工作机 |
| Dolt SQL Server | 存储层，MySQL 协议端口 3307 | 用户工作机 |
| Mayor | AI 协调器 | 用户工作机（tmux） |
| Polecats | Worker agents，git worktree 隔离 | 用户工作机（tmux） |
| Witness | Per-rig 监控 | 用户工作机（tmux） |
| Deacon | 跨 rig 监督 | 用户工作机（tmux） |
| Refinery | 合并队列 | 用户工作机（tmux） |
| Hooks | Git worktree 持久存储 | 用户工作机（文件系统） |

- **范式判定**：Stateful 调度器 + Git-based 持久化 + 容量控制分派 + Bors-style 合并队列。具备完整的 Stateful 调度能力。

### 主要组件与核心链路

**核心链路（MEOW — Mayor-Enhanced Orchestration Workflow）**：用户告诉 Mayor 要构建什么 → Mayor 分析并拆解为任务 → 创建 convoy 和 beads → Mayor 分派 beads 给 polecats（通过 `gt sling`，受 scheduler 容量控制）→ Polecats 在独立 git worktree 中执行 → 通过 hook 持久化工作状态 → Polecat 完成后 `gt done` 提交 MR → Refinery 批量合并 → Convoy 完成检测 → 通知用户。

跨进程/网络边界：CLI ↔ Dolt SQL Server（MySQL 协议，本地 3307 端口）；CLI ↔ tmux（进程管理）；Agent ↔ git remote（HTTPS/SSH，代码推送和 MR 提交）；Wasteland ↔ DoltHub（HTTPS，联邦协作）（架构推导）。

### 主要依赖

- **Go**：1.26.2+，构建 gt 和 bd 二进制。
- **Beads（bd）**：0.57.0+，git-backed issue 追踪。
- **Dolt**：git-backed 数据库，SQL Server 模式。
- **sqlite3**：convoy 数据库查询。
- **ICU4C**：源码构建的查询层编译。
- **tmux**：3.0+，会话管理。
- **Claude Code CLI**：默认 Agent 运行时，可替换。
- **不可剥离的硬依赖**：Dolt SQL Server、Beads/bd、tmux（Mayor Workflow 必需）。

### 接口形态

- **用户接口**：`gt` CLI（所有操作的入口）、Web Dashboard（`gt dashboard`，HTTP，htmx 自动刷新）、TUI Activity Feed（`gt feed`，三面板终端仪表板）。
- **Agent 接口**：Claude Code hooks（`.claude/settings.json` managed sections）、Codex fallback（`gt prime` + `gt mail check --inject`）、GitHub Copilot executable lifecycle hooks（`.github/hooks/gastown.json`）。
- **存储接口**：Dolt SQL Server（MySQL 协议，端口 3307），所有 beads 操作通过 `bd` CLI。
- **联邦接口**：Wasteland CLI（`gt wl join` / `gt wl browse` / `gt wl claim` / `gt wl done`），通过 DoltHub。
- **可观测性接口**：OpenTelemetry（OTLP endpoints，结构化日志和指标）。
- **鉴权**：无中心鉴权（本地工具），Wasteland 联邦通过 DoltHub 认证。

### 持久化方式

- **Dolt SQL Server**：存储所有 beads 数据。每 Town 一个 Dolt SQL Server 进程，每 rig 一个数据库子目录。所有 Agent 直接写 main，使用事务纪律（`BEGIN` / `DOLT_COMMIT` / `COMMIT` atomically）（[docs/design/architecture.md](https://github.com/gastownhall/gastown/blob/main/docs/design/architecture.md)，直接事实）。
- **Git worktrees**：Polecats 和 refinery 使用 git worktree（非完整 clone），实现快速 spawning 和共享 object storage。Crew workspaces 是完整 git clone。
- **Beads routing**：`routes.jsonl` 文件映射 issue ID prefix 到 rig 位置。Worktrees 使用 `.beads/redirect` 文件指向 canonical beads 位置。
- **本地形态**：所有持久化在用户工作机本地，无云端存储。

### 通信方式

- **CLI ↔ Dolt**：MySQL 协议（本地 3307 端口）。
- **Daemon ↔ 子进程**：exec.CommandContext，5 分钟超时，`GT_DAEMON=1` 环境变量标识。
- **Daemon heartbeat**：每 3 分钟，steps 0-13 健康检查 + step 14 scheduler dispatch。
- **ConvoyManager**：Event poll（每 5 秒）+ Stranded scan（每 30 秒）。
- **Agent ↔ git remote**：HTTPS/SSH，代码推送和 MR 提交。
- **Wasteland 联邦**：通过 DoltHub HTTPS。
- **OpenTelemetry**：OTLP HTTP endpoints，结构化日志和指标。

### 部署形态

#### 工作机安装（Windows / macOS）

- **macOS**：`brew install gastown` 一键安装 gt、bd 和 dolt。源码构建需 `brew install dolt icu4c` + `go install bd` + `make install`。注意 `go install` 产生的未签名二进制会被 Gatekeeper 杀死，应避免（[README](https://github.com/gastownhall/gastown)，直接事实）。
- **Windows**：需先安装 Dolt，然后 `go install` 安装 gt 和 bd。二进制位于 `%USERPROFILE%\go\bin`。源码构建需 MSYS2 UCRT64/MinGW64 shell 和 ICU 包。**tmux-backed 工作流（Mayor、Witnesses、Refineries、polecats）需要 WSL 或 Linux 环境**——原生 Windows shell 视为 minimal CLI-only 环境（直接事实）。
- **Linux**：安装 Dolt 后 `go install` 安装 gt 和 bd。
- **Docker Compose**：跨平台沙箱容器，包含所有依赖。
- **依赖、权限与网络**：本地文件系统、git、tmux、Dolt SQL Server（本地端口 3307）、网络连接（git remote 和可选 Wasteland 联邦）。
- **卸载**：删除 `~/gt` 目录、卸载 Homebrew 包或删除 Go 二进制。

#### 主体功能运行位置

- 主体功能运行在**工作机本地**（CLI + Dolt + tmux + git worktrees）。
- **Local 优先适配判断**：**完全满足**——零云端依赖，所有状态存储在本地 Dolt SQL Server 和 git worktrees 中。Wasteland 联邦是可选的跨实例协作功能。

#### 云端形态

- **无云端组件**。Gas Town 是完全本地化的工具。Wasteland 联邦网络通过 DoltHub 连接多个 Gas Town 实例，但 DoltHub 是外部联邦协调服务，不是 Gas Town 自身的云端组件。
- 无 Local 优先选型缺陷。

## 未决项与证据边界

- **Scheduler 设计目标边界**：Scheduler 的核心设计目标是 back-pressure 和 capacity control（防止 API rate limit exhaustion），不是通用任务依赖调度。依赖解析通过 `bd ready` 实现且 molecule steps 支持 `needs` 数组，但整体调度模型以容量控制为主轴。是否满足完整的 Stateful 调度取决于对「调度」的定义边界——Gas Town 在工作对象持久化、状态机、恢复机制方面满足条件，在通用依赖调度方面能力有限（直接事实 + 证据边界）。
- **生产成熟度未决**：社区反馈（2026 年 1 月早期版本）报告 $100/小时 token 消耗、自动合并不通过测试、「murderous rampaging Deacon」、5 次 force push to main。这些来自早期版本，产品至 v1.2.1 可能已改进，但公开资料不足以确认当前生产成熟度（社区样本，证据边界）。
- **Windows 能力缺失影响**：Windows 原生不支持 tmux-backed 工作流，这意味着 Mayor Workflow（推荐的主要工作模式）无法在原生 Windows 上运行。需 WSL 或 Linux 环境。这是明确的选型缺陷（直接事实）。
- **调度状态恢复细节**：Daemon heartbeat（每 3 分钟）负责调度分派，但 daemon 自身崩溃后的恢复机制（是否自动重启、调度状态是否持久化在 sling context beads 中）在公开文档中部分说明——sling context beads 确实持久化调度状态，daemon 由外部监控重启（架构推导 + 证据边界）。
- **快照边界**：调研基于 2026-08-07 的公开资料和仓库文档。产品 8 个月，活跃开发中，功能快速演进。

## 后续验证建议

- 若要评估 Gas Town 作为 Agent 工作承载层的调度能力，应实测：scheduler 在高并发下的容量控制行为、circuit breaker 的实际故障恢复效果、Witness 的 stuck agent 检测准确率、Refinery 合并队列在失败 MR 时的 bisect 行为、Seance 的前驱会话发现和查询能力。
- 就 Local 优先落地，Gas Town 完全满足——零云端依赖，所有状态本地持久化。但 Windows 平台存在能力缺失（tmux-backed 工作流需 WSL），需评估 Windows 工作机的实际可用性。
- Gas Town 具备 Stateful 调度能力，但其设计目标是编码 Agent 的容量控制调度，不是通用任务调度系统。如需通用调度，需评估其 molecule/formula 的 DAG 能力和 `bd ready` 的依赖解析是否满足具体需求。
- 定位明确：Gas Town 是**Stateful 多 Agent 调度系统 + Git-based 持久化**的产品范本（对「持久化工作对象、容量控制分派、三层看门狗监控、Bors-style 合并队列、会话发现与恢复」极具参考价值），具备完整调度能力，但生产成熟度和 Windows 支持需进一步验证。
