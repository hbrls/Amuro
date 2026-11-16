# Conductor 技术产品调研

> updated_by: Codex - GPT-5
> updated_at: 2026-07-21 22:11:38
> evidence_window: 2026-07-21；Conductor 官网、公开文档与 Changelog 0.76.0 快照

## 交付结论

1. **不完全符合本 RUNBOOK 的工作机要求。** Conductor Desktop 是主体运行在工作 PC 上的 macOS 桌面应用，符合“主体功能在本机”要求；但官方明确写明 Windows 尚不可用，因此不能满足 Windows 与 macOS 工作机均可安装的完整要求。
2. **产品定位**：Conductor 是面向软件开发者的本地 Coding Agent 工作台。它把 Claude Code、Codex、Cursor 和 OpenCode 会话放入独立 Git worktree，让用户并行启动任务、查看终端和代码差异，再完成检查、Pull Request、合并与归档。
3. **本地边界清晰但不是安全沙箱。** 工作区、聊天、仓库文件、Agent 和命令都在 Mac 上运行；每个工作区隔离分支、文件和运行上下文，但进程仍继承当前 macOS 用户权限，官方明确说明 worktree 隔离不是安全边界。
4. **macOS 安装路径明确。** 官网提供 Apple silicon 与 Intel 两种 DMG，用户将 Conductor 拖入 Applications 后打开；首次启动检查 GitHub 认证以及至少一个 Agent Provider 的认证。最低 macOS 版本、内存和磁盘要求未在公开安装文档中说明。
5. **Agent 运行依赖由应用与外部账号共同承担。** Conductor 捆绑兼容版本的 Claude Code 和 Codex，并管理 OpenCode 集成；Cursor 通过 Cursor API 工作，不调用本地 Cursor 可执行文件。模型使用量由用户自己的订阅、账号或 API Key 结算。
6. **数据以本地持久化为主。** 聊天和大部分应用状态位于 `~/Library/Application Support/com.conductor.app`，工作区位于 `~/conductor/workspaces/`，用户与仓库配置位于 `~/.conductor/` 和仓库内 `.conductor/`。模型请求仍会直接发往用户选择的模型提供商，因此产品不等同于完全离线。
7. **维护状态活跃。** 证据窗口内最新版为 0.76.0，发布于 2026-07-16；6 月至 7 月连续加入 Cursor、OpenCode、多 Run Script、PR 页面等能力，并持续修复更新、认证、终端、工作区和云会话问题。
8. **Conductor Cloud 是独立可选形态。** 它提供托管工作区，使 Agent 不占用本机；这不改变 Desktop 的本地运行结论，也不能补足 Windows 桌面端缺口。本报告按 RUNBOOK 只简单记录其边界，不展开云端架构。

## 调研目标、范围与边界

### 调研目标

理解 Conductor 是什么、如何组织 Coding Agent 工作，以及它能否在 Windows/macOS 工作机上安装并以 PC 为主体运行。

### 核心问题

- Conductor 的目标用户、核心流程和功能边界是什么？
- 桌面应用、Git worktree、Agent Harness、终端、模型提供商和 GitHub 如何协作？
- Windows 与 macOS 的安装入口、运行依赖、权限、网络和卸载边界是什么？
- 工作区、聊天和设置如何持久化，主体功能位于本地还是云端？
- 当前版本、演进方向和公开反馈证据反映了什么？

### 覆盖范围

- 官网、产品文档、FAQ、故障排查和版本记录中的公开能力。
- Conductor Desktop 的 macOS 安装与本地运行形态。
- 工作区、Agent、脚本、终端、GitHub、模型提供商与本地数据的系统边界。
- Conductor Cloud 只作为可选部署形态简述。

### 明确排除

- 不做竞品比较、选型矩阵或优劣排名。
- 不做源码审计，不猜测未公开的桌面框架、内部 IPC、数据库 schema 或服务端实现。
- 不做遥测、监控、指标采集或运营数据调研。
- 不安装或运行 Conductor，不调用真实 Agent，不验证模型费用，不做性能、安全或可靠性 benchmark。
- 不展开 Conductor Cloud 的服务端架构、扩缩容、SLA 或数据平面实现。

## 证据口径

- **官方产品资料**用于确认定位、平台、功能和核心流程；宣传性表述以安装、安全、FAQ 和概念文档交叉确认。
- **官方 Changelog**用于确认证据窗口内版本、发布时间和方向性变化；修复项只能证明项目方处理过相应问题，不能推导问题发生率。
- **官方技术文档**用于确认工作区、进程权限、配置、数据位置与网络边界；文档未说明的最低系统要求和内部实现保留为未决。
- **下载页面实现**只用于确认官网当前公开的 Apple silicon 与 Intel DMG 入口，不用于推断客户端技术栈。
- **反馈证据**以官方故障排查和已知问题为主。本次没有取得足够可验证的独立 Issue/Discussion 样本，因此不归纳普遍用户口碑。
- **架构推导**只连接已公开的组件关系；本次没有实机运行，不能视为运行时验证。

主要证据入口：

- [Conductor 官网](https://www.conductor.build/)
- [文档索引](https://www.conductor.build/docs)
- [安装文档](https://www.conductor.build/docs/installation)
- [首个工作区](https://www.conductor.build/docs/first-workspace)
- [工作区与分支](https://www.conductor.build/docs/concepts/workspaces-and-branches)
- [Git worktree](https://www.conductor.build/docs/concepts/git-worktrees)
- [工作流程](https://www.conductor.build/docs/concepts/workflow)
- [Provider 配置](https://www.conductor.build/docs/guides/providers)
- [安全与权限](https://www.conductor.build/docs/reference/security-and-permissions)
- [隐私与本地数据](https://www.conductor.build/docs/reference/privacy)
- [FAQ](https://www.conductor.build/docs/faq)
- [故障排查](https://www.conductor.build/docs/troubleshooting/issues)
- [Changelog](https://www.conductor.build/changelog)
- [0.76.0 Release Notes](https://www.conductor.build/changelog/0.76.0-bug-squashathon)
- [Conductor Cloud](https://www.conductor.build/cloud)

## 产品调研

### 产品定位与目标用户

Conductor 是一个运行在 Mac 上的 Coding Agent 工作台。它不提供新的基础模型，而是把已有 Agent Harness、Git worktree、终端、Diff、检查与 PR 流程集中到一个桌面界面中，让多个开发任务可以并行推进并保持各自的代码状态。

目标用户可以从公开流程归纳为：

- 已使用 Claude Code、Codex、Cursor 或 OpenCode，希望统一管理多个会话的软件开发者。
- 需要同时推进多个独立任务，又不希望 Agent 共享同一个 checkout、分支和终端状态的开发者。
- 需要从 issue 到代码修改、测试、Diff Review、PR 和归档形成闭环的个人或工程团队。
- 希望本地保留仓库、工作区和聊天，同时用自己的模型订阅或 API Key 结算的用户。

### 核心流程

1. 用户下载与 Mac CPU 架构匹配的 DMG，将 Conductor 放入 Applications 并启动。
2. Conductor 检查终端中的 GitHub 认证，以及 Claude Code、Codex、Cursor 或 OpenCode 中至少一个 Harness 的认证状态。
3. 用户打开本地仓库、从 GitHub 添加仓库，或创建 Quick Start 仓库。
4. Conductor 为一个任务创建独立 Git worktree、分支、工作目录和运行上下文；新工作区默认从远端基线分支的最新提交开始。
5. Setup Script 准备未被 Git 跟踪的依赖、配置或本地资源，Run Script 在该工作区启动应用、测试或 watcher。
6. 用户在工作区内启动一个或多个 Agent 会话；Agent 读取和修改该 working tree，并在同一 macOS 用户权限下执行终端命令。
7. 用户查看终端、文件、Diff、Todos 和 Checks，向 Agent 回传评论或要求修正。
8. 变更准备好后创建或更新 PR、合并并归档工作区；Archive Script 可清理工作区目录外的项目资源。

### 功能地图与边界

**当前公开能力：**

- **多 Agent Harness**：Claude Code、Codex、Cursor、OpenCode，可按聊天选择模型和认证方式。
- **隔离工作区**：每个任务拥有独立分支、working tree、文件、终端、Run 环境、Diff 与 Review Path。
- **并行执行**：独立任务使用不同工作区；需要共享分支和文件状态的 Agent 可以放在同一工作区。
- **项目运行**：Setup、Run、Archive 和 Spotlight 脚本；每个本地工作区可获得独立端口范围。
- **Review 流程**：Diff Viewer、检查、评论、Todos、PR、合并和归档。
- **配置与上下文**：用户配置、仓库共享配置、本机覆盖、`.context` handoff、Files to copy 和 Agent Prompt。
- **工具扩展**：MCP Server、Slash Command、Deep Link 和打开外部编辑器。

**边界与约束：**

- Worktree 只隔离开发状态，不隔离系统权限；Agent 默认可以访问当前用户可访问的文件、终端和工具。
- Git worktree 初始只包含 Git 跟踪文件；`.env`、本地数据库、依赖目录和缓存需要 Files to copy、Setup Script 或项目自己的准备流程。
- Cursor 会话走 Cursor API，不使用本机 Cursor 可执行文件；模型能力和可用模型仍受外部 Provider 账号约束。
- Conductor 不转售模型用量，模型订阅、额度和 API Key 费用由用户直接向 Provider 承担。
- Windows 和 Linux 仍处于等待名单，不是当前可用平台。
- Conductor Cloud 是可选托管工作区，不属于本地 Desktop 的必要组件。

### 维护状态与版本演进

- **当前版本**：官网和 Changelog 在证据窗口内均显示 0.76.0，发布时间为 2026-07-16。
- **近期发布密度**：0.75.0 发布于 7 月 13 日，0.74.0 与 0.73.3 发布于 7 月 9 日，0.73.0 发布于 7 月 7 日，说明项目仍在高频演进。
- **方向性变化**：0.63.0 加入 Cursor 与 Dispatcher；0.69.0 加入 OpenCode；0.70.0 加入多个 Run Script；0.71.0 加入工作区和聊天链接；0.73.0 重做 PR 页面；0.76.0 重点恢复 Checks、完善 PR 时间线并集中修复稳定性问题。
- **更新机制**：0.76.0 明确修复了新版本检查遗漏、更新下载 429 和应用关闭时后台更新无法安装，说明 Desktop 存在应用内检查、下载与后台安装更新流程。
- **商业状态**：FAQ 表示当前工具免费，团队计划未来围绕协作功能收费；这属于当前官方计划，不是永久价格承诺。

### 生态与反馈

- **Harness 生态**：Claude Code、Codex、OpenCode 和 Cursor；Claude/Codex 可用应用捆绑版本或指定系统可执行文件，OpenCode 可用受管集成或自定义路径，Cursor 使用 API Key。
- **Provider 生态**：除默认 Provider 外，文档还展示了兼容 Provider、Bedrock、Vercel AI Gateway 等环境变量配置。这里只确认可配置边界，不展开网关实现。
- **协作入口**：官方提供支持邮箱、Discord 和 subreddit；官网也提供更新日志与文档。
- **官方已知问题主题**：故障排查页记录了 Agent 认证、命令路径、脚本环境、固定端口/数据库冲突、工作区路径丢失、终端输出乱码和编辑器撤销等问题。
- **近期修复主题**：0.76.0 集中处理应用更新、认证状态、远程终端输入响应、工作区/PR 状态、云会话重连和 UI 交互问题。
- **证据边界**：上述主题来自官方文档和修复记录，不能据此推断影响范围或缺陷率；本次未取得足够独立社区样本，不形成正面或负面的普遍口碑判断。

### 当前可用、规划与独立形态

- **当前可用**：macOS Desktop、本地工作区、四类 Agent Harness、脚本、终端、Diff、Checks、PR 和本地聊天。
- **当前不可用**：Windows 与 Linux Desktop；官方只提供等待名单，没有承诺具体发布日期。
- **独立可选形态**：Conductor Cloud 提供 hosted workspace，使 Agent 可在不占用 Mac 的情况下工作；它不能当作 Windows 本地客户端替代品。

## 技术架构调研

### 系统全貌与运行形态

Conductor Desktop 可概括为“macOS 桌面应用 + 本地 Git worktree/进程 + 外部模型与 GitHub 服务”：

```text
Conductor Desktop（macOS）
  桌面 UI / 工作区管理 / Review 流程
        |
        +-- ~/conductor/workspaces/ 下的 Git worktree
        |     +-- Agent 进程
        |     +-- 终端与项目脚本
        |     +-- 应用、测试、watcher 等本地进程
        |
        +-- 本地聊天、应用状态与设置
        |
        +-- 模型 Provider（网络请求）
        +-- GitHub（认证、fetch、issue、PR、checks）

可选：Conductor Cloud hosted workspace
```

Desktop 不是“浏览器壳加远端 IDE”。官方安全文档明确称其为 Mac app，而非 hosted IDE；工作区、聊天和仓库文件默认留在本机，Agent 和命令也在 Mac 上执行。

### 主要组件与核心链路

**主要组件：**

- **Desktop UI**：创建和管理项目、工作区、聊天、终端、Diff、Checks、PR 与归档。
- **Workspace Manager**：基于 Git worktree 创建独立 working tree 和分支，并维护一工作区对应一分支的约束。
- **Agent Harness**：启动 Claude Code、Codex、OpenCode 或 Cursor 会话，注入 Conductor 的工作区与操作 Prompt。
- **Script/Terminal Runtime**：从工作区目录运行 Setup、Run、Archive Script 和用户终端命令。
- **Local Persistence**：保存应用状态、聊天、工作区目录和分层设置文件。
- **External Services**：模型 Provider 处理模型请求；GitHub 支持仓库认证、远端同步、Issue、PR 和 Checks。

**任务到 PR 的核心链路：**

1. Desktop 从本地仓库或 GitHub 项目建立项目记录。
2. Workspace Manager 获取远端基线并创建新分支与 Git worktree。
3. Setup Script 在新 working tree 中补齐依赖和本地配置。
4. Agent Harness 在该目录内启动会话；模型请求跨网络发往所选 Provider，文件与命令操作发生在本机。
5. 项目 Run Script 与测试在工作区进程中运行，结果回到 Desktop 的终端与检查界面。
6. 用户检查 Diff 和状态后，通过 GitHub 创建/更新 PR，合并后归档工作区并执行可选清理脚本。

### 主要依赖

- **操作系统**：macOS；官方未公布最低系统版本。
- **CPU 架构**：Apple silicon 与 Intel 均有独立 DMG。
- **Git/GitHub**：工作区依赖 Git worktree；首次设置要求终端环境中的 GitHub 认证，文档以 `gh auth status` 作为检查方式。
- **Agent Harness**：至少配置 Claude Code、Codex、Cursor 或 OpenCode 中一个。Conductor 捆绑 Claude Code 与 Codex 的兼容版本，路径位于 `~/Library/Application Support/com.conductor.app/bin`。
- **账号与网络**：需要对应模型订阅、登录状态或 API Key；Cursor 必须使用 Cursor API Key。
- **项目自身依赖**：每个代码库仍需通过 Setup Script 安装自己的包、生成文件、准备数据库或复制本机配置，Conductor 不替代项目工具链。

### 接口形态

- **桌面 GUI**：主要用户入口，覆盖项目、工作区、聊天、终端、Review 和设置。
- **终端与 Shell**：Agent、用户命令和项目脚本在本地工作区目录内执行。
- **文件接口**：Git working tree、`.context`、`.conductor/settings.toml`、`.conductor/settings.local.toml` 和可复制的 gitignored 文件。
- **Git/GitHub 接口**：本地 Git 命令与 GitHub 认证、fetch、Issue、PR、Checks 和 Review 流程。
- **Provider 网络接口**：模型请求直达选定 Provider；Cursor 使用 Cursor API。
- **MCP**：可选工具扩展，审批行为由 Agent 设置决定，不是运行 Desktop 的必要接口。
- **Deep Link**：文档公开 `conductor://` 形式用于打开应用和触发受支持操作。

官方公开文档没有说明 Desktop 内部 IPC 或本地服务协议，本报告不对其进行推断。

### 持久化方式

- **聊天与主要应用数据**：`~/Library/Application Support/com.conductor.app`；官方明确表示聊天不存放在 Conductor 服务器。
- **应用捆绑 Agent**：Claude Code 和 Codex 可执行文件位于上述 Application Support 目录的 `bin` 子目录。
- **工作区**：新版工作区位于 `~/conductor/workspaces/`；FAQ 将 Conductor 依赖的本地目录概括为 Application Support 与 `~/conductor`。
- **仓库代码**：每个工作区是 Git worktree，代码状态由 working tree、分支和 Git 历史共同持有。
- **用户配置**：`~/.conductor/settings.toml`；组织托管配置可位于 `~/.conductor/settings.managed.toml`。
- **仓库配置**：共享配置为 `<repo>/.conductor/settings.toml`，本机覆盖为 `<repo>/.conductor/settings.local.toml`。
- **Agent 自身状态**：Claude Code 与 Codex 还分别使用 `~/.claude` 和 `~/.codex`；迁移机器时官方要求在相关进程停止后按原路径复制。

公开资料没有说明 Conductor 应用状态使用何种数据库或 schema，本报告保留该实现为未决。

### 通信方式

- Desktop 在本机创建和控制 working tree、Agent、Shell、脚本与项目进程。
- Agent 通过本地文件系统和终端修改代码、运行命令；Desktop 汇总聊天、终端和 Review 状态。
- 模型消息跨网络直接发往用户选择的 Provider，不经过 Conductor 代售的模型账户。
- GitHub 通信承担认证、远端 fetch、Issue、PR、Checks 与评论同步。
- Cursor 会话通过 Cursor API 通信，不与本地 Cursor 可执行文件交互。
- 内部进程通信、流式协议和重试策略未公开，本次不做实现层推断。

### 部署形态

#### 工作机安装（Windows / macOS）

**Windows：**

- 官方安装页明确写明 Conductor 尚不支持 Windows，也没有提供 MSI、EXE、Microsoft Store、包管理器或本地运行入口。
- 官网只提供 Windows/Linux 等待名单。Cloud hosted workspace 不能视为 Windows 本地安装。
- 因此 Windows 侧的运行依赖、权限、更新和卸载均不存在当前可执行的官方路径；这是本次“不完全符合 RUNBOOK”的决定性缺口。

**macOS：**

- 官网下载对话框提供 Apple silicon 的 `dmg-aarch64` 与 Intel 的 `dmg-x86_64` 两个当前版本入口。
- 安装步骤为下载 DMG、将 Conductor 拖入 Applications、打开应用。
- 首次启动检查终端环境中的 GitHub 认证，以及计划使用的 Harness 认证；使用 Conductor 必须具备 GitHub 和至少一个 Agent Provider。
- Claude Code/Codex 可以使用现有 CLI 登录、订阅或 API Key；Cursor 使用 Cursor API Key；OpenCode 使用 Provider Key 或自身配置。
- 官方没有说明最低 macOS 版本、最低内存、磁盘空间或是否需要 Rosetta。Apple silicon 与 Intel 有独立构建，因此不应假设二者共享同一个二进制。

**权限与网络：**

- Agent 和命令继承当前 macOS 用户权限，可以读写该用户可访问的文件并运行工具；默认没有额外系统级沙箱。
- 访问 Desktop、Downloads、Reminders 等受保护资源时，macOS 可能显示以 Conductor 命名的权限提示，因为 Conductor 启动了相关 Agent 或 Shell 进程。
- 工作区创建通常需要 GitHub 网络访问；模型请求需要访问对应 Provider；自定义 Provider、MCP 或项目脚本可能引入额外网络边界。
- 用户应只授予当前任务确实需要的受保护目录与工具权限。

**更新：**

- 0.76.0 Release Notes 证明应用具备版本检查、更新下载和后台安装流程。
- 官方安装文档没有说明更新通道、自动更新开关、回滚方式或企业冻结版本策略；这些仍需实机确认。

**卸载：**

- 官方文档未给出完整卸载步骤，也未说明删除 Applications 中的 App 是否会同时删除本地数据。
- 已确认聊天、应用数据、工作区和设置分散在 `~/Library/Application Support/com.conductor.app`、`~/conductor`、`~/.conductor`、`~/.claude` 与 `~/.codex`。因此仅移除应用包不能被视为已经清除全部数据。
- 删除仓库项目时，故障排查文档说明应用内的 Remove 会删除该仓库的工作区和聊天；这不等同于整机卸载。完整清理应先由人工核对保留需求与官方支持建议，避免误删尚未合并的工作区。

#### 主体功能运行位置

Conductor Desktop 的主体功能运行在 macOS 工作机：桌面 UI 管理本地 Git worktree，Agent、终端、脚本和项目进程在本机执行，聊天与工作区也以本地目录持久化。

因此 Desktop **符合“主体功能运行在 PC 本地”要求**。但它不是完全离线产品：模型 Provider、GitHub、Cursor API 和用户配置的外部服务仍需要网络。Worktree 隔离也不是安全隔离。

#### 云端网关与托管形态

Conductor Desktop 的公开资料没有把 Conductor 自有云描述为本地 Agent 的必要网关。模型流量直接前往用户配置的 Provider，账号等辅助服务不承担本地工作区主体执行。

Conductor Cloud 是另一种可选 hosted workspace：Agent 可以在云端工作，用户仍可保留本地 Review 流程。选择该形态时任务主体不再位于工作 PC，因此不能用它证明本 RUNBOOK 的本地安装合规，也不能替代 Windows Desktop。本次不展开其服务端实现。

## 未决项与证据边界

- **Windows 缺失已确认**：官方明确写明尚不可用；等待名单不构成已发布支持，也没有可验证发布日期。
- **最低系统要求未公开**：未确认最低 macOS 版本、内存、磁盘、GPU、Rosetta 或企业设备管理要求。
- **安装与更新未实机验证**：未下载 DMG、检查签名/公证、首次启动 Gatekeeper 行为、自动更新开关、更新回滚或代理网络兼容性。
- **卸载流程未闭合**：官方没有完整卸载与数据清理指南；已知目录只能说明数据位置，不能替代面向实际机器的删除决策。
- **内部架构未公开**：未确认桌面框架、内部 IPC、本地数据库、进程监督、崩溃恢复或更新器实现。
- **权限风险未实测**：官方明确说明 Agent 无额外沙箱，但本次未验证不同 Harness 的审批模式、macOS TCC 提示或企业隐私设置的实际效果。
- **Provider 行为取决于外部服务**：模型可用性、数据策略、费用与限额由用户选择的 Provider 决定，本报告不替其下结论。
- **独立反馈样本不足**：本次主要采用官方已知问题和修复记录，不能外推真实用户采用率、稳定性或总体满意度。
- **Conductor Cloud 未深入**：只确认其是可选 hosted workspace，没有调查服务端组件、持久化、网络或安全实现。

## 后续验证建议

1. **先做准入裁决**：若必须同时支持 Windows 与 macOS，当前应直接排除 Conductor Desktop，等待官方 Windows 版本实际发布后再复审。
2. **macOS 人工验收**：在 Apple silicon 和 Intel 测试机分别下载 DMG，核对签名、公证、最低系统版本、首次启动、GitHub/Provider 认证和 Applications 安装行为。
3. **跑通最小本地闭环**：在隔离测试仓库完成“创建 worktree → 启动 Codex/Claude → 修改文件 → Run/Check → Diff → PR → Archive”，并记录所有网络目标和权限提示。
4. **验证安全边界**：使用无敏感数据的测试账号检查文件访问、Shell/MCP 审批和受保护目录提示；不要把 worktree 当作权限沙箱。
5. **验证更新与回滚**：检查自动更新策略、代理网络下的下载、失败恢复、版本固定和旧版本回滚能力，尤其关注企业工作机管理要求。
6. **制定卸载清单**：在确认工作区均已合并或备份后，再由人工验证移除应用包、聊天、工作区和设置目录的官方推荐步骤；这是人工验收项。
