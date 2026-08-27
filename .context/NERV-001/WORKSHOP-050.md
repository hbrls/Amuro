# Claude Code Agent Teams 技术产品调研

> updated_by: Qoder - Claude Sonnet 4.5
> updated_at: 2026-08-07 10:00:00
> evidence_window: 调研日期 2026-08-07；目标版本 v2.1.178–v2.1.224（Agent Teams 功能自 v2.1.178 起引入并持续演进）；官方文档 code.claude.com/docs/en/agent-teams；GitHub 仓库 `anthropics/claude-code`（截至 2026-08-07，最新 release v2.1.224）

## 交付结论

### Claude Code Agent Teams 是 Claude Code CLI 的实验性多会话协调功能，主体为本地终端多 Agent 协作，非独立调度产品

Claude Code Agent Teams 是 Anthropic 在其 AI 编码工具 Claude Code 中引入的实验性功能（v2.1.178+，默认禁用，需 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 启用），允许一个主会话（Team Lead）生成多个独立 Claude Code 实例（Teammate）并行工作，通过共享任务列表和消息邮箱协调（[官方文档](https://code.claude.com/docs/en/agent-teams)，直接事实）。产品定位是「协调多个 Claude Code 会话作为团队工作」，而非独立的调度系统或平台。

对照 Index 判定基准：Agent Teams 不是工作机本地调度系统。它是 Claude Code CLI 的会话内协调机制——主会话生成子会话、子会话领取任务、任务状态存储在本地文件中。不存在独立的调度服务、中心调度器或持久任务队列。主体功能（任务创建、分派、执行、状态跟踪）由 Claude Code 会话进程承担，不依赖云端调度服务（官方文档「Architecture」节，直接事实）。

### 不具备 Stateful 调度能力：有共享任务列表但无持久任务对象模型、无 DAG/依赖关系调度、无中心调度器，按任务执行宿主记录

Agent Teams 的工作对象模型是 Team Lead → Teammate + Task List + Mailbox，不存在 Index 关注的持久 Task 对象作为一等调度实体（官方文档「Architecture」节，直接事实）。Task List 是共享文件（`~/.claude/tasks/{team-name}/`），Task 有三种状态（pending / in progress / completed），支持简单依赖关系（前置任务未完成则阻塞），但无 DAG、并行分支、优先级、计划时间或资源约束。

任务协调机制是「文件锁 + 自领取」：Teammate 完成当前任务后自行从 Task List 中领取下一个未分配、未阻塞的任务；文件锁防止多个 Teammate 同时领取同一任务（官方文档「Assign and claim tasks」节，直接事实）。这不是调度器依据任务状态、依赖和策略主动选择执行者的调度形态，而是「任务列表 + 自领取」的执行宿主形态。

对照 Index 调度判定基准——Stateful 调度系统必须「持久拥有工作对象、对象关系、任务状态和执行归属，并负责判断任务何时可执行、按何种顺序推进、由谁执行以及失败后如何继续」——Agent Teams 不满足此条件。Task List 是文件级共享状态，无中心调度进程负责推进；任务依赖是简单的「前置完成则解锁」，无复杂的 DAG 解析；执行归属是「谁领取谁执行」，无调度器分派；失败后无自动重试或转移机制（官方文档「Limitations」节明确说明「Task status can lag」「Teammates stopping on errors」，直接事实）。按**任务执行宿主**记录，不判定为调度工具。

### 工作对象模型：有 Team / Teammate / Task / Message；无 Workspace / Project / Issue / Plan 持久对象

可辨识的持久对象（官方文档「Architecture」节 + Hooks 文档，直接事实）：

- **Team**：会话级概念，一个 Claude Code 会话最多一个 Team，Team 名称由会话 ID 派生（`session-{前8位}`）。Team 配置存储在 `~/.claude/teams/{team-name}/config.json`，会话结束后自动清理。
- **Teammate**：独立 Claude Code 实例，拥有自己的上下文窗口、权限设置和模型配置。Teammate 由 Lead 生成，可以是内置类型或自定义 Subagent 定义。Teammate 不能嵌套生成自己的 Teammate。
- **Task**：共享任务列表中的工作项，有 `task_id`、`task_subject`、`task_description`、状态（pending / in progress / completed）和依赖关系。Task 存储在本地文件系统（`~/.claude/tasks/{team-name}/`），会话结束后保留（受 `cleanupPeriodDays` 控制）。
- **Message**：Agent 间通信消息，通过 Mailbox 机制传递。每个 Agent 的邮箱是 JSON 文件（`~/.claude/teams/{team-name}/inboxes/{agent-name}.json`），Claude Code 读取时验证格式并投递有效消息。

**明确缺失**：无 Workspace 作为工作容器；无 Project 作为项目组织单元；无 Issue 作为外部系统输入；无 Plan 作为持久编排对象——Lead 的规划是单次会话内的文本产物，不持久为编排对象。Task 是文件级共享状态，不是中心调度系统拥有的工作记录（官方文档「Architecture」节，直接事实 + 架构推导）。

### Agent 分派是「Lead 生成 + 自领取」而非调度器选人；退出/失败/断线后的任务恢复机制有限

Agent 执行由两种方式触发（官方文档「How Claude starts agent teams」节，直接事实）：

1. **用户请求**：用户描述任务并要求生成 Teammate，Lead 根据指令生成。
2. **Claude 建议**：Lead 判断任务适合并行工作时建议生成 Teammate，用户确认后执行。

任务分派是「Lead 创建任务 → Teammate 自领取」的形态。Lead 可以显式指定任务分配给特定 Teammate，也可以让 Teammate 自行领取。Teammate 完成当前任务后自动从 Task List 中领取下一个可用任务（官方文档「Assign and claim tasks」节，直接事实）。

Teammate 退出、失败或断线后的恢复机制有限：官方文档明确说明「Teammates stopping on errors」是已知限制，Teammate 遇到错误后可能停止而非恢复；「No session resumption with in-process teammates」表示 `/resume` 和 `/rewind` 不恢复 in-process Teammate；「Shutdown can be slow」表示 Teammate 完成当前请求后才关闭（官方文档「Limitations」节，直接事实）。失败后无自动重试、无任务转移、无检查点恢复机制——用户需手动干预或生成替代 Teammate（官方文档「Troubleshooting」节，直接事实）。

### 运行形态是本地 CLI 多进程 + 可选云端服务；主体能力在工作机本地，但云端服务（Routines / Web / Desktop）提供补充

Claude Code 有多种运行形态（官方文档「Overview」节，直接事实）：

1. **Terminal CLI**（主要形态）：本地终端运行，支持 macOS / Windows / Linux / WSL。Agent Teams 在此形态下运行，Teammate 可以是 in-process（同一终端内）或 split-pane（tmux / iTerm2 分屏）。
2. **VS Code / JetBrains 扩展**：IDE 内运行，功能与 CLI 类似。
3. **Desktop App**：独立桌面应用（macOS / Windows / Linux），支持多会话并行和定时任务。
4. **Web**：浏览器运行（claude.ai/code），支持长任务和云端执行。
5. **Routines**：云端定时任务，按计划或事件触发。

Agent Teams 的主体能力在**本地工作机**：Task List 存储在本地文件系统，Mailbox 是本地 JSON 文件，Teammate 是本地 Claude Code 进程。不依赖云端调度服务。但 Claude Code 整体产品包含云端组件（Routines、Web、Desktop 的云端会话），这些组件与 Agent Teams 无直接关联（官方文档「Architecture」节未提及云端调度，直接事实 + 架构推导）。

Local 优先适配判断：Agent Teams 本身满足 Local 优先——任务协调在本地完成，不依赖云端。但 Claude Code 整体产品需要网络连接（API 调用、模型推理），断网后核心功能不可用。这是产品级限制，非 Agent Teams 特有（官方文档「System requirements」节，直接事实）。

### Windows 与 macOS：均支持 Terminal CLI 和 Desktop App；Agent Teams 的 split-pane 模式在 macOS 上依赖 tmux/iTerm2，Windows 上仅支持 in-process

Claude Code 支持 macOS 13.0+ 和 Windows 10 1809+（官方文档「System requirements」节，直接事实）。安装方式包括：

- **macOS**：`curl -fsSL https://claude.ai/install.sh | bash`（原生安装，推荐）、Homebrew（`brew install --cask claude-code`）、Desktop App（DMG）。
- **Windows**：PowerShell（`irm https://claude.ai/install.ps1 | iex`）、CMD（`curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd`）、WinGet（`winget install Anthropic.ClaudeCode`）、Desktop App（EXE）。

Agent Teams 的显示模式（官方文档「Choose a display mode」节，直接事实）：

- **In-process**（默认）：所有 Teammate 在主终端内运行，跨平台支持（Windows / macOS / Linux）。
- **Split-pane**：每个 Teammate 独立窗格，macOS 上依赖 tmux 或 iTerm2（需 `it2` CLI），Windows 上不支持（官方文档明确说明「Split panes require tmux or iTerm2」「Split-pane mode isn't supported in VS Code's integrated terminal, Windows Terminal, or Ghostty」，直接事实）。

两平台均无原生二进制之外的安装包差异；Agent Teams 功能本身无平台差异，仅显示模式有差异（直接事实）。

### 开源与闭源边界：Claude Code 整体闭源，Agent Teams 无独立开源组件；GitHub 仓库为 Issue 跟踪和文档

Claude Code 是 Anthropic 的闭源商业产品，GitHub 仓库 `anthropics/claude-code` 用于 Issue 跟踪、文档和 Release 发布，不包含核心源代码（GitHub 仓库页面，直接事实）。Agent Teams 作为 Claude Code 的功能模块，同样闭源。

外部依赖包括：ripgrep（搜索）、tmux/iTerm2（可选，split-pane 模式）、Git for Windows（可选，Windows 上的 Bash 工具）。这些依赖均为开源工具，但 Claude Code 核心闭源（官方文档「Additional dependencies」节，直接事实）。

### 依赖根源：无硬依赖；可选依赖为 tmux/iTerm2（split-pane）和 Git for Windows（Windows Bash）

影响安装、运行和部署的依赖（官方文档「System requirements」节 + 「Choose a display mode」节，直接事实）：

- **必需**：网络连接（API 调用）、4GB+ RAM、x64 或 ARM64 处理器。
- **可选**：ripgrep（搜索，通常内置）、tmux 或 iTerm2 + `it2` CLI（split-pane 模式，仅 macOS）、Git for Windows（Windows 上的 Bash 工具）。
- **无数据库依赖**：Task List 和 Mailbox 使用本地文件系统，无外置数据库。
- **无云端调度依赖**：Agent Teams 不依赖云端调度服务。

依赖可替换性评估：tmux/iTerm2 可替换为其他终端复用器（需自行适配）；Git for Windows 可替换为 WSL；ripgrep 可替换为其他搜索工具（需配置）。Claude Code 核心不可替换（闭源产品）。将调度逻辑下沉为普通 Agent 任务节点会失去 Task List 的共享状态和文件锁协调机制（架构推导）。

### 架构范式判定：会话内多进程协调 + 文件系统共享状态，非中心化特权调度服务

Claude Code Agent Teams 的架构范式是：以本地终端会话为边界、以文件系统为共享状态存储、以 Lead-Teammate 为协调模式的多进程协作机制（官方文档「Architecture」节，直接事实）。

核心组件及职责：

| 组件 | 职责 | 运行位置 |
| --- | --- | --- |
| Team Lead | 主会话，生成 Teammate、创建任务、协调工作、综合结果 | 本地终端进程 |
| Teammate | 独立 Claude Code 实例，领取任务、执行工作、发送消息 | 本地终端进程（in-process 或 split-pane） |
| Task List | 共享任务列表，存储任务状态和依赖关系 | 本地文件系统（`~/.claude/tasks/{team-name}/`） |
| Mailbox | 消息邮箱，Agent 间通信 | 本地文件系统（`~/.claude/teams/{team-name}/inboxes/`） |
| Hooks | 质量门禁，在任务创建/完成/Teammate 空闲时触发 | 本地进程 |

通信方式：Teammate 间通过 Mailbox 文件传递消息；Lead 自动接收 Teammate 消息；任务状态通过文件锁协调（官方文档「Architecture」节 + 「Context and communication」节，直接事实）。

调度逻辑不能下沉为普通 Agent 任务节点——Task List 的共享状态和文件锁协调是 Claude Code 进程级机制，非独立调度服务（架构推导）。

## 调研目标

- 确认 Claude Code Agent Teams 的产品定位、技术架构与运行形态。
- 判定产品是否具备 Stateful 调度能力，还是任务执行宿主或无状态任务消费者。
- 厘清工作对象模型（Team/Teammate/Task/Message）与 Agent 分派、连续性机制。
- 评估运行形态、Local 优先适配、Windows/macOS 落地形态与云端依赖边界。
- 识别依赖根源、开源/闭源边界与改造可行性。

## 产品调研

### 产品定位与目标用户

- **一句话定位**：Claude Code Agent Teams 是 Claude Code CLI 的实验性多会话协调功能，让多个独立 Claude Code 实例作为团队并行工作，通过共享任务列表和消息邮箱协调。
- **目标用户**：使用 Claude Code 进行复杂开发任务的开发者，特别是需要并行探索、多视角审查或跨层协调的场景（官方文档「When to use agent teams」节，直接事实）。
- **开源与许可**：闭源商业产品，Anthropic 所有。GitHub 仓库用于 Issue 跟踪和文档。
- **版本状态**：实验性功能，默认禁用，需 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 启用。自 v2.1.178（2026 年 6 月）引入，持续演进至 v2.1.224（2026 年 8 月）（官方文档 + GitHub Releases，直接事实）。

### 核心流程

1. 用户在终端启动 Claude Code 会话，启用 Agent Teams（`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`）。
2. 用户描述任务并要求生成 Teammate（或 Lead 建议生成）。
3. Lead 生成多个 Teammate，每个 Teammate 是独立 Claude Code 实例，拥有自己的上下文窗口。
4. Lead 创建共享任务列表，Task 有状态（pending / in progress / completed）和依赖关系。
5. Teammate 自领取任务执行，完成后标记并领取下一个；Teammate 间可通过 Mailbox 直接通信。
6. Lead 综合结果，用户可直接与任一 Teammate 交互。
7. 会话结束后，Team 配置自动清理，Task List 保留（受 `cleanupPeriodDays` 控制）。

### 功能地图与边界

- **多会话协调**：一个 Lead + 多个 Teammate，共享任务列表和消息邮箱。
- **任务管理**：Task 有三种状态和简单依赖关系，文件锁防止竞争。
- **消息通信**：Teammate 间直接消息，Lead 自动接收。
- **显示模式**：In-process（默认）或 Split-pane（tmux/iTerm2，仅 macOS）。
- **质量门禁**：Hooks（TeammateIdle / TaskCreated / TaskCompleted）在关键节点触发。
- **Plan 审批**：Teammate 可要求 Plan 审批，Lead 自动决策。
- **明确不含**：Stateful 任务调度器（无 DAG/优先级/资源约束）、持久任务队列、中心调度服务、云端调度、跨会话 Team、嵌套 Team、任务自动重试/转移。

### 维护状态与版本演进

- **活跃维护**：Claude Code 保持高频发布，2026 年 4 月至 8 月每周发布多个版本（v2.1.83 至 v2.1.224），Agent Teams 自 v2.1.178 引入后持续改进（GitHub Releases + What's New，直接事实）。
- **关键版本演进**：
  - v2.1.178（2026-06-15）：Agent Teams 引入，需 `TeamCreate`/`TeamDelete` 工具。
  - v2.1.178+：简化 Teammate 生成，移除 `TeamCreate`/`TeamDelete`，自动清理。
  - v2.1.181–v2.1.199：改进空闲 Teammate 显示逻辑。
  - v2.1.198：API 错误时 Teammate 通知 Lead 失败详情；消息唤醒等待重试的 Teammate。
  - v2.1.207：修复邮箱格式错误导致的重复错误。
  - v2.1.224：跨会话 SendMessage（macOS/Linux）。
- **生态入口**：Claude Code 支持 MCP（Model Context Protocol）集成外部工具；Subagent 定义可复用为 Teammate 角色；Hooks 支持自定义质量门禁。
- **反馈主题**：社区反馈集中在 Token 成本高、任务状态滞后、Teammate 错误恢复有限、Split-pane 平台限制（Reddit / Medium / 开发者博客，社区样本，不代表整体）。

## 技术架构调研

### 系统全貌与运行形态

本地 CLI 多进程协调 + 文件系统共享状态，全栈闭源（官方文档「Architecture」节，直接事实）：

| 组件 | 职责 | 运行位置 |
| --- | --- | --- |
| Team Lead | 主会话，生成/协调 Teammate，创建/分配任务 | 本地终端进程 |
| Teammate | 独立 Claude Code 实例，领取/执行任务 | 本地终端进程 |
| Task List | 共享任务状态和依赖 | 本地文件系统 |
| Mailbox | Agent 间消息传递 | 本地文件系统 |
| Hooks | 质量门禁（TeammateIdle/TaskCreated/TaskCompleted） | 本地进程 |

- **范式判定**：会话内多进程协调 + 文件系统共享状态。非中心化特权调度服务，非分布式任务池，非声明式工作流引擎。按 Index 归类为**任务执行宿主**。

### 主要组件与核心链路

**核心链路**：用户启动 Claude Code 会话 → 启用 Agent Teams → Lead 生成 Teammate → Lead 创建 Task List → Teammate 自领取任务执行 → Teammate 间 Mailbox 通信 → Lead 综合结果 → 会话结束清理 Team 配置。

跨进程/网络边界：Teammate 间通过本地文件系统（Mailbox）通信；Lead 与 Teammate 通过共享文件系统（Task List + Mailbox）协调；Claude Code 与 Anthropic API 通过网络通信（模型推理）（官方文档「Architecture」节 + 「Context and communication」节，直接事实 + 架构推导）。

### 主要依赖

- **运行时硬依赖**：网络连接（API 调用）、4GB+ RAM、x64/ARM64 处理器。
- **可选依赖**：ripgrep（搜索）、tmux/iTerm2 + `it2` CLI（split-pane，仅 macOS）、Git for Windows（Windows Bash）。
- **开发依赖**：无（闭源产品，用户无需构建）。
- **不可剥离的硬依赖**：Claude Code 核心闭源，不可替换。

### 接口形态

- **用户接口**：终端 CLI（主要）、VS Code/JetBrains 扩展、Desktop App、Web。
- **Agent 接口**：Teammate 是完整 Claude Code 会话，拥有所有工具（Bash、Edit、Read 等）。
- **Hooks 接口**：TeammateIdle / TaskCreated / TaskCompleted，支持 exit code 2 阻塞或 JSON `continue: false` 停止。
- **MCP 接口**：Model Context Protocol 集成外部工具。

### 持久化方式

- **Task List**：本地文件系统（`~/.claude/tasks/{team-name}/`），会话结束后保留（受 `cleanupPeriodDays` 控制）。
- **Team 配置**：本地文件系统（`~/.claude/teams/{team-name}/config.json`），会话结束后自动清理。
- **Mailbox**：本地文件系统（`~/.claude/teams/{team-name}/inboxes/{agent-name}.json`），JSON 格式。
- **数据库类型**：无数据库，使用本地文件系统。无外置数据库依赖。

### 通信方式

- **Teammate 间**：Mailbox 文件（JSON），Claude Code 读取时验证格式并投递。
- **Lead ↔ Teammate**：共享 Task List + Mailbox；Lead 自动接收 Teammate 消息。
- **任务协调**：文件锁防止多 Teammate 同时领取同一任务。
- **Hooks**：进程内触发，支持阻塞/停止决策。

### 部署形态

#### 工作机安装（Windows / macOS）

- **Windows**：PowerShell（`irm https://claude.ai/install.ps1 | iex`）、CMD、WinGet（`winget install Anthropic.ClaudeCode`）、Desktop App（EXE）。支持原生 Windows 和 WSL。
- **macOS**：`curl -fsSL https://claude.ai/install.sh | bash`（原生安装）、Homebrew（`brew install --cask claude-code`）、Desktop App（DMG）。
- **依赖、权限与网络**：4GB+ RAM；网络连接（API 调用）；Anthropic 账号（Pro/Max/Team/Enterprise/Console）。
- **卸载**：删除二进制文件和配置目录（`~/.local/bin/claude`、`~/.local/share/claude`、`~/.claude`）。

#### 主体功能运行位置

- 主体功能运行在**本地工作机**：Task List、Mailbox、Team 配置均存储在本地文件系统；Teammate 是本地 Claude Code 进程。
- **Local 优先适配判断**：Agent Teams 本身满足 Local 优先——任务协调在本地完成，不依赖云端调度服务。但 Claude Code 整体需要网络连接（API 调用、模型推理），断网后核心功能不可用。这是产品级限制，非 Agent Teams 特有。

#### 云端形态（如存在）

- Agent Teams 本身无云端组件。Claude Code 整体产品包含云端服务（Routines、Web、Desktop 云端会话），但与 Agent Teams 无直接关联。
- **Routines**：云端定时任务，按计划或事件触发，与 Agent Teams 的会话内协调机制独立。
- **Web/Desktop 云端会话**：浏览器或 Desktop App 中的云端执行，与本地 Agent Teams 无直接交互。

## 未决项与证据边界

- **Task List 文件格式未验证**：官方文档说明 Task List 存储在 `~/.claude/tasks/{team-name}/`，但未公开具体文件格式（JSON/SQLite/其他）；当前按「文件级共享状态」推断（架构推导 + 证据边界）。
- **文件锁实现细节未验证**：官方文档说明「Task claiming uses file locking」，但未公开具体实现（flock / 文件存在性检查 / 其他）；当前按「文件锁防止竞争」记录（直接事实 + 证据边界）。
- **Teammate 进程模型未验证**：In-process 模式下 Teammate 是线程还是子进程、Split-pane 模式下 tmux/iTerm2 如何管理进程，未在官方文档中详细说明；当前按「独立 Claude Code 实例」记录（直接事实 + 证据边界）。
- **大规模 Team 性能未验证**：官方建议 3-5 个 Teammate，但未公开大规模 Team（10+）的性能测试数据；Token 成本线性增长是已知限制（官方文档「Token usage」节，直接事实）。
- **快照边界**：调研基于 2026-08-07 的官方文档和 GitHub Release（v2.1.224），Agent Teams 标注为实验性功能，架构和 API 可能快速变化。

## 后续验证建议

- 若要评估 Agent Teams 作为 Agent 工作承载层的调度能力差距，应实测：Teammate 失败后 Task 的实际状态、文件锁在并发领取下的行为、大规模 Team（10+）的协调开销。
- 就 Local 优先落地，Agent Teams 本身满足要求；但需评估 Claude Code 整体的网络依赖是否符合离线场景需求。
- 若需要 Stateful 调度能力，Agent Teams 不满足要求；但其「共享任务列表 + 自领取」模式可作为轻量级协调机制的参考，调度层需在 Claude Code 之上另行构建。
- 定位明确：Claude Code Agent Teams 是**闭源 AI 编码工具的会话内多 Agent 协调功能**的产品范本（对「多会话并行、共享任务列表、消息通信」极具参考价值），而非 Stateful 中心调度器或独立调度产品；作为任务执行宿主其协调机制值得关注，但调度能力需补齐。
