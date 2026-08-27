# PilotDeck 技术产品调研

> updated_by: Codex - GPT-5
> updated_at: 2026-07-31 15:28:48
> evidence_window: 2026-07-19；PilotDeck Desktop v260623；OpenBMB/PilotDeck 仓库快照截至 2026-07-18

## 交付结论

### 产品定位：WorkSpace 优先的开源 AI Agent 平台

PilotDeck 面向需要持续推进多项目工作的知识工作者与工程师。它以 WorkSpace 作为项目级组织单元，而不是以单次聊天会话作为主要组织方式。

每个 WorkSpace 绑定项目文件作用域、项目记忆、反馈记忆和 Skills。平台还提供智能路由、Always-On 自动化和多渠道接入，目标是让 Agent 参与持续性工作，而不仅是回答一次性问题。

PilotDeck 由清华 THUNLP、ModelBest、OpenBMB 与 AI9Stars 联合开发，采用 AGPL-3.0 协议，主要使用 TypeScript 实现。官方仓库为 `OpenBMB/PilotDeck`。

截至证据窗口，仓库有 3,844 Stars 和 406 Forks，于 2026-05-22 建仓，并在 2026-07-18 仍有推送。这些数据只能说明项目公开活跃度，不能直接证明产品质量或实际采用率。

### 运行形态：本地运行主体能力，外部云端提供模型推理

PilotDeck 的主体运行时位于工作 PC。本地运行部分包括 AgentSession、TurnRunner、AgentLoop、记忆、模型路由、工具执行、Cron、Always-On、SessionStore 和 Gateway。

产品提供三类主要本地入口：Electron 桌面应用、`pilotdeck server` 本地服务，以及 CLI/TUI。桌面应用启动时会拉起本地 Gateway；本地服务模式默认提供 18789 端口，Web UI 使用 3001 端口。

PilotDeck 本身未发现自营云后端。Agent 需要调用用户自行配置的 LLM 服务，支持 Anthropic、OpenAI、OpenRouter、MiniMax、DeepSeek 等提供商。模型请求经本地 AI 代理端口 18080 转发到外部服务。

因此，云端承担的是模型推理依赖，而不是 PilotDeck 的任务调度、记忆存储或 Agent 执行主体。

### 平台支持：Windows 与 macOS 均有桌面安装路径

Release v260623 提供 Windows x64 和 macOS Apple Silicon 的桌面安装包：

- `PilotDeck-260623-win-x64.exe`
- `PilotDeck-260623-mac-arm64.dmg`

macOS 安装方式是下载 DMG、将应用拖入 Applications 后启动。若应用从飞书、微信或 QQ 等沙盒应用中接收，macOS Sonoma+ 可能需要清理 `com.apple.provenance` 扩展属性后再启动。

Windows 安装器采用 per-machine 配置，安装过程中可能需要管理员确认。桌面安装完成后，启动方式与 macOS 相同：由 Electron 应用拉起本地 Gateway，并使用 `~/.pilotdeck/pilotdeck.yaml` 保存配置。

当前 Desktop Install 文档主要描述 macOS，Windows 的图文安装步骤仍不完整。Windows 安装器的存在和 per-machine 方式由 Release 资产与发布说明确认，但 Windows 上的实际启动行为仍需运行验证。

### Local 优先判断：主体功能不依赖 PilotDeck 云端

PilotDeck 的 Agent 运行时、项目文件访问、记忆、路由、工具、Cron 和 Always-On 均在工作 PC 本地执行。

桌面客户端不是云端服务的展示壳，也不是仅负责转发请求的薄客户端。核心任务状态和本地历史由用户设备持有，主要数据落盘于 `~/.pilotdeck/`。

运行过程仍需要访问用户配置的 LLM 提供商。启用飞书、QQ、Telegram、Discord 等渠道时，还需要访问相应的外部 IM 平台。

因此，PilotDeck 符合“主体能力本地运行”的 Local 优先要求，但不属于完全离线产品。断网后，本地文件、会话和部分本地状态仍可访问；依赖外部模型或 IM 平台的核心交互将受到影响。

### Gateway 边界：本地消息路由层，不是云端调度中心

PilotDeck 文档中的 Gateway 是本地 WebSocket/HTTP 消息网关，代码位置标注为 `src/gateway/`，独立服务默认监听 18789 端口。

Gateway 负责接收 CLI、TUI、Web、桌面应用和外部渠道适配器的消息，并将其路由到本地 SessionRouter 与 Agent 运行时。

飞书等渠道可能通过出站 WSS、Webhook 或其他平台连接与本地 Gateway 交互，但这不意味着 PilotDeck 存在云端 Gateway。当前证据未发现 PilotDeck 自营的账号、同步或云端任务调度服务。

### 维护状态：项目较早，但公开迭代活跃

PilotDeck 项目历史较短。最新桌面 Release 为 v260623，于 2026-06-23 发布，2026-06-29 更新了资产。

相较 v0.1.0，该版本主要改进了桌面启动与打包稳定性、资源占用、飞书和微信等 IM 渠道、流式聊天体验、Agent Timeline、子 Agent 卡片，以及 Cron 和 Always-On 的项目级隔离。

Release 说明还明确提到改善桌面版和 Windows 场景。官方文档站采用 Docusaurus，提供中英双语文档，并包含 Showcase、Research、Team 和 Community 等入口。

当前报告没有系统抽样近期 Issue 或 Discussion，因此不能据此归纳普遍用户反馈。Stars、Forks 和 open issues 只作为公开快照记录。

### 架构范式：分层模块化的本地 Agent 系统

PilotDeck 的主要架构关系可以概括为：

用户交互层  
→ 本地消息网关层  
→ 会话路由层  
→ Agent 运行时层  
→ 模型、记忆、工具和持久化支撑层

用户交互层包括 CLI、TUI、Web UI、Electron Desktop，以及飞书等渠道适配器。

消息网关层由 Gateway 和 SessionRouter 组成，负责消息接入、会话查找、会话创建和路由。

Agent 运行时层包括 AgentSession、TurnRunner 和 AgentLoop，负责单轮执行、多轮工具调用和流式响应。

支撑模块包括 Router、Model、Context、Memory、Tool、SessionStore、MCP、Extension、Permission、Cron 和 Always-On。

一次典型用户轮次是：渠道接收消息后，由 Gateway 找到或创建 Session；AgentSession 准备上下文；Router 选择模型；ModelRuntime 调用外部 LLM；ToolRuntime 执行本地工具；AgentLoop 持续运行，直至模型完成本轮；最终结果再经 Gateway 返回到原渠道。

这是一种以本地中心进程为核心的模块化 Agent 架构。它的主要约束来自本地文件权限、外部 LLM 网络连接、IM 平台连接，以及 WorkSpace、Cron 和并发执行之间的隔离要求。

## 调研目标

- 核验 PilotDeck 的中心调度能力、最小运行依赖与架构约束。
- 核验 Windows 与 macOS 工作机上的部署和客户端接入方式。
- 明确主体能力位于本地、云端还是混合环境，以及 Local 优先适配程度。
- 评估客户端直接接入、依赖剥离和私有化改造边界。

## 产品调研

### 产品定位与目标用户

- **一句话定位**：PilotDeck 是一个 WorkSpace 优先的开源 AI Agent 生产力平台，把"每个项目一个操作甲板"作为组织单元，在甲板内提供白盒记忆、跨甲板智能路由、甲板外 Always-On 自动化，目标是"把 AI Agent 从对话玩具变成真正推动工作的工具"。
- **目标用户**：需要在多项目并行中持续运行 AI Agent 的知识工作者与工程师——用例涵盖知识文档生成（HTML 白皮书）、移动/AR 小游戏开发、AI 工程平台搭建、音视频多语种运营等。官方强调"任务持续增长、Agent 会忘记偏好、关机即停、Token 账单失控"等痛点，面向希望把 Agent 当作长期生产力而非一次性问答的用户。
- **核心痛点**：多任务共享一个上下文导致记忆污染与成本归属不清；教过的偏好下次就忘；关掉电脑工作就停；Token 账单增长失控。
- **商业模式与实体**：联合开发方为清华 THUNLP、ModelBest（面壁智能）、OpenBMB、AI9Stars，AGPL-3.0 开源。用户自带 LLM API Key（Anthropic/OpenAI/OpenRouter/MiniMax/DeepSeek 等），PilotDeck 不卖模型订阅。当前未发现付费层或企业版独立商业产品线。

### 核心流程

依据官方 Introduction、Quick Start 与 WorkSpace 文档，端到端流程为：

1. 用户在 Windows 或 macOS 工作机安装 PilotDeck 桌面应用（或用一键脚本安装本地服务后用浏览器访问 `http://localhost:3001`）。
2. 桌面应用启动时拉起内嵌的本地 PilotDeck Gateway 服务，配置文件位于 `~/.pilotdeck/pilotdeck.yaml`；首次启动引导配置 LLM 提供商（选预设或手填 API Base URL / API Key / Model ID / Protocol Type，测试连接后保存）。
3. 用户以一个项目根目录作为一个 WorkSpace，WorkSpace 拥有独立的文件作用域、Project Memory、Feedback Memory 与 Skills；不同 WorkSpace 之间隔离，可并行。
4. 在 WorkSpace 内发起会话：用户输入 → 本地 Gateway 路由 → AgentSession 启动一个 Turn → Router 决定模型（TokenSaver 分级 + 多提供商 fallback）→ 调用用户自配的云端 LLM（经本地 18080 代理转发）→ AgentLoop 多轮工具调用（bash/read_file/write_file/edit_file/glob/grep/web_fetch/web_search/agent 等）→ 流式返回。
5. 复杂任务用 Plan Mode：Agent 先分解目标为计划，再分步执行，关键检查点由用户确认方向。
6. Always-On：WorkSpace 空闲时按冷却/预算/忙/启用/时间窗等 Gate 触发 Discovery（在 git worktree 或快照副本隔离执行，产出 Plan 与 Report），或用 `pilotdeck cron` 创建定时/周期任务。
7. 可选多渠道：通过本地 Gateway 把飞书/Lark（默认 Stream Mode 出站 WSS，无需公网/内网穿透）、微信（iLink Bot，需白名单）、QQ 官方 Bot、Telegram/Discord/Slack/Matrix 等共 16+ 渠道接入同一 Agent 运行时。

### 与调度和客户端接入相关的功能边界

#### 工作机入口

PilotDeck 提供 Electron 桌面应用、本地服务、CLI、TUI 和 Web UI。桌面应用支持 Windows x64 与 macOS Apple Silicon；`pilotdeck server` 启动本地 Gateway，默认监听 18789 端口，Web UI 使用 3001 端口。

现有资料显示，这些入口共享本地 Agent 运行时。尚未发现“独立中心调度服务 + 轻量工作机客户端”的官方部署形态。

#### WorkSpace 与状态隔离

WorkSpace 是 PilotDeck 的项目级隔离单元。每个 WorkSpace 拥有独立的文件作用域、项目记忆、反馈记忆和 Skills；同一 Git 仓库的不同 worktree 可以归入同一 WorkSpace。

会话记录以 JSONL 形式保存在本地，可用于恢复历史状态。

当前 WorkSpace 级 `pilotdeck.yaml` 仍处于预留或规划状态，运行配置主要由全局 `~/.pilotdeck/pilotdeck.yaml` 管理。因此，文件和记忆按 WorkSpace 隔离，但配置尚未完全实现项目级隔离。

#### 自动推进能力

Always-On 包含 Discovery 和 Cron 两类能力。Discovery 在 WorkSpace 空闲时执行探索任务并生成 Plan 与 Report；Cron 用于执行一次性或周期任务。

这些能力按本地项目组织，状态保存在 `~/.pilotdeck/projects/<project-id>/always-on/` 和 `cron/`。

现有资料只确认了本地后台自动化，尚未证明 PilotDeck 具备跨工作机任务池、持久化任务领取或分布式抢占机制。因此，Always-On 不能直接等同于中心调度系统。

#### 模型路由与任务执行

Smart Router 负责模型选择、TokenSaver 分级和多提供商故障切换。它统一 Anthropic 与 OpenAI 兼容协议，但路由对象是模型请求，不是待分派的工作任务。

Agent 可以调用 Shell、文件操作、搜索、子 Agent 和结构化输出等工具，并可通过 MCP、插件、Skills 和生命周期钩子扩展执行能力。

这些能力说明 PilotDeck 具备本地 Agent 执行与扩展机制，但不能证明其具备独立的任务队列或多客户端调度协议。

#### Gateway 与外部渠道

本地 Gateway 统一接入桌面应用、Web、CLI/TUI 和外部消息渠道。官方提供飞书、微信、QQ、Telegram、Discord、Slack、Matrix 等渠道适配器。

这些渠道主要承担消息入口和结果返回，不应直接视为通用工作机客户端协议。是否允许目标客户端绕过官方界面直接接入 Gateway，需要继续核验公开接口、鉴权和会话协议。

微信渠道还依赖 ClawBot beta 白名单，默认不可用。

#### 当前未决

- Windows x64 安装器已经发布，但官方 Desktop Install 文档仍以 macOS 为主，Windows 的实际安装、运行和卸载流程需要运行验证。
- WorkSpace 级配置尚未完全落地，项目隔离与全局配置之间存在边界。
- 尚未确认 Gateway 是否提供稳定、公开且适合第三方客户端使用的接入协议。
- 尚未确认 Always-On 是否包含持久化任务领取、并发抢占或跨节点协调能力。

### 维护状态与版本演进

- **维护状态**：活跃。GitHub 3844 Stars / 406 Forks / 117 open issues，建仓 2026-05-22，最近一次推送 2026-07-18（与调研日相隔约 1 天），约 2 个月龄但持续迭代。文档站结构完整（Docusaurus，中英双语），含 Showcase、Research、Team、Community（Discord/飞书/微信）。
- **关键版本演进**：最新桌面 Release 为 **v260623（PilotDeck Desktop 260623，包版本 0.1.260623）**，2026-06-23 发布、2026-06-29 资产更新；相对 `v0.1.0` 聚焦四方向：① 桌面启动/打包稳定性与资源占用；② IM 渠道（Settings 内飞书/微信扫码登录、IM live reply 与长任务反馈）；③ 前端体验（聊天流式、子 Agent 卡片、thinking 预览、Agent Timeline、连接状态提示、toast）；④ Cron/Always-On 按项目隔离，并专门"改善桌面版与 Windows 场景"。
- **生态入口**：GitHub Issues/PRs、Discord、飞书、微信社区；Showcase 含知识文档生成、AR 小游戏、AI 工程平台、播客多语种运营四个公开案例。

### 生态与反馈

- 公开反馈样本当前证据未深入采集（本调研未枚举 Issue/Discussion 主题），仅依据仓库元数据（Stars/Forks/open issues）描述公开快照；Star/Fork 数不直接等同产品质量或采用率。
- 未决：缺少对近期 Issue/讨论主题的归纳，反馈主题留待后续按需补充。

## 技术架构调研

### 系统全貌与运行形态

PilotDeck 以**本地 Node.js 进程**为主体运行时，形态包括：

- **Electron 桌面应用**（macOS arm64 / Windows x64）：用户在 Windows/macOS 工作机安装后启动，桌面进程内嵌本地 Gateway 服务，配置 `~/.pilotdeck/pilotdeck.yaml`。
- **本地服务模式**：`pilotdeck server`（默认 18789，WebSocket + HTTP + Web 静态资源），或一键脚本安装到 `~/.pilotdeck/app/` 后用浏览器访问 `http://localhost:3001`。
- **CLI/TUI 模式**：`pilotdeck "<msg>"` 一次性对话（当前目录起 in-process Gateway）、`pilotdeck tui`（Ink/React 终端 UI，优先连本地 in-process Gateway，失败则探测远程 Gateway）。
- **多渠道适配器**：飞书/Lark（默认 Stream Mode 出站 WSS，无需公网）、微信、QQ、Telegram、Discord、Slack、Matrix 等 16+ 渠道，作为本地 Gateway 的消息出入口。

系统边界：本地侧含 Agent 运行时、记忆、路由、工具、Cron、Always-On、SessionStore、Gateway；外部侧仅用户自配的 LLM 提供商（云端模型推理）与 IM 平台（飞书/微信等云侧事件源）。

### 主要组件与核心链路

依据官方 Architecture Overview 的 System View 与模块表，主要组件（本地进程内模块）：

| 层 | 组件 | 职责 |
| --- | --- | --- |
| 用户交互层 | CLI / TUI / Web UI / Desktop Electron / Feishu 等 Channel 适配器（`src/adapters/`） | 渠道接入与 Web 静态挂载 |
| 消息网关层 | Gateway（`src/gateway/`，WS/HTTP）+ SessionRouter | 创建/查找/管理会话，路由消息到 Agent |
| 会话路由层 | Session（`src/session/`） | transcript 持久化、metadata、listing、恢复 |
| Agent 运行时层 | AgentSession / TurnRunner / AgentLoop（`src/agent/`） | 会话容器、单轮管理、多轮工具调用循环 |
| 支撑层 | Router（`src/router/`，TokenSaver/fallback）、Model（`src/model/`，Canonical Protocol + 提供商适配）、Context（`src/context/`，PromptAssembler/MessageProjector/MemoryResolver/TokenBudget/Compaction）、Memory（`src/` + PilotDeck Memory Core）、Tool（`src/tool/`，注册表+运行时+built-ins+scheduler）、MCP（`src/mcp/`）、Extension、Lifecycle、Permission、Task、Cron、Always-On、Pilot（路径与配置加载） |

**核心链路（一次用户轮次）**：

1. 渠道（如 Web/Desktop/飞书）收到用户消息 → Gateway/SessionRouter 找到或创建 Session。
2. AgentSession 启动 TurnRunner：Prepare context（PromptAssembler 装配 System Prompt = 核心指令 + 项目指令 + Skills + Memory + 工具描述；MessageProjector 投影历史；MemoryResolver 检索长期记忆注入；TokenBudgetManager 管预算；CompactionEngine 压缩旧消息）。
3. Router.decide() 选模型 → Router.execute() → ModelRuntime.stream()（经本地 18080 AI 代理转发到用户自配的云端 LLM）。
4. ToolRuntime.execute() 运行工具（Concurrent/Sequential scheduler，含 bash/read_file/write_file/edit_file/glob/grep/web_fetch/web_search/agent 等，可触发子 Agent）。
5. AgentLoop 多轮工具调用直至模型停止 → 流式响应经 Gateway → Channel 回传给用户。
6. Turn 完成后 Memory 的 captureTurn 提取知识存入 `~/.pilotdeck/memory`。

**关键边界与约束**：

- 跨网络边界：本地 → 云端 LLM 提供商（用户自配 API Key，经本地 18080 代理）；本地 ↔ IM 平台云侧（飞书 Stream Mode 出站 WSS、QQ WSS、Webhook 等）。
- 隔离边界：WorkSpace 之间文件作用域、记忆、Skills 隔离；Always-On Discovery 在 git worktree 或快照副本内隔离执行；Cron 按项目隔离。
- 并发约束：同一 chat 在一轮运行中丢弃新消息以避免乱序回复；Cron `maxConcurrent` 可配。

### 主要依赖

- **Node.js 22**：一键安装脚本在缺失时通过 fnm（Fast Node Manager）安装 Node.js 22（Web Install 文档明示）。
- **Git**：安装脚本检查；Always-On Discovery 的 git-worktree 隔离策略依赖 Git；WorkSpace ID 对 git worktree 归并依赖 Git。
- **Electron**：桌面应用基于 Electron（Desktop Install 文档明示 "native macOS desktop app based on Electron"，当前构建支持 Apple Silicon arm64；Windows x64 安装器为 per-machine 配置）。
- **LLM API Key（外部，用户自配）**：Anthropic / OpenAI / OpenRouter / MiniMax / DeepSeek 等，OpenAI 兼容提供商通常用 `openai-chat` 协议。
- **IM 平台凭证（外部，可选）**：飞书 App ID/Secret、QQ Bot AppID/Secret、Telegram/Discord/Slack/Matrix token 等。
- 不展开完整依赖树；不区分开发依赖与运行时硬依赖以外的项。

### 接口形态

- **CLI**：`pilotdeck`（一次性）、`pilotdeck server [--port]`、`pilotdeck tui`、`pilotdeck cron list/create/delete/stop`。
- **HTTP/WebSocket**：本地 Gateway（默认 `http://127.0.0.1:18789`，`ws://127.0.0.1:18789/ws`），Web UI 静态服务在 3001，AI 代理在 18080；Gateway API（如 `listProjects`、`describeProject`、`resumeSession`）。
- **渠道适配器**：飞书 Stream Mode（出站 WSS）/ Webhook、微信 QR 登录、QQ WSS、Telegram/Discord/Slack/Matrix 等 token 或 webhook。
- **MCP**：Model Context Protocol 客户端集成（扩展系统接入外部 MCP server）。
- 不穷举端点或 handler 注册项。

### 持久化方式

- **本地文件系统**为主，统一根目录 `~/.pilotdeck/`（可用 `PILOT_HOME` 覆盖）：
  - `~/.pilotdeck/pilotdeck.yaml`：全局配置（LLM 提供商、adapters、router、memory、alwaysOn、cron 等）。
  - `~/.pilotdeck/app/`：一键脚本安装的应用本体。
  - `~/.pilotdeck/projects/<project-id>/chats/<channel>:s_<id>/`：每会话 `transcript.jsonl` + `metadata.json`（WorkSpace 级会话持久化）。
  - `~/.pilotdeck/projects/<project-id>/always-on/`：discovery-state.json、plans/、reports/、run-events/。
  - `~/.pilotdeck/projects/<project-id>/cron/`：tasks.json、history/。
  - `~/.pilotdeck/memory/`：跨 WorkSpace 的长期记忆。
  - `~/.pilotdeck/server-token`：本地服务令牌。
  - `~/.pilotdeck/weixin-credentials.json`：微信登录缓存（按需）。
- **WorkSpace 级**：`<project-root>/.pilotdeck/`（plugins/、skills/ 已可用；pilotdeck.yaml 为 planned）。
- 状态所有权归本地用户，无 PilotDeck 云端存储；不盘点全部 schema。

### 通信方式

- **同步/异步混合**：用户轮次内同步执行 Turn（Prepare → Route → Execute → Tools → Stream）；Always-On Discovery 与 Cron 为后台异步（需长跑 `pilotdeck server`）。
- **长连接/出站连接**：飞书 Stream Mode 出站 WSS（无需公网/内网穿透）、QQ 官方 Bot WSS、Matrix 等；Web/Desktop 经本地 WebSocket 与 Gateway 通信。
- **进程内通信**：Channel → Gateway → SessionRouter → AgentSession（同一 Node.js 进程内调用）；TUI 优先 in-process Gateway，失败探测远程 Gateway。
- **工具调度**：ConcurrentToolScheduler（独立操作并发）/ SequentialToolScheduler（依赖或写操作顺序）。
- 不审计每一种心跳、锁、重试、退避、幂等实现。

### 部署形态

#### 工作机安装（Windows / macOS）

**macOS 安装方式与入口**（依据 Desktop Install 文档 + Release v260623）：

- 从 GitHub Latest Release 下载 `PilotDeck-260623-mac-arm64.dmg`（Apple Silicon arm64，约 175MB），拖入 Applications 后启动；首页"Download for macOS"按钮即指向 GitHub Releases API 解析的最新安装包 URL。
- 若 DMG 经飞书/微信/QQ 等沙盒 IM 应用接收，macOS Sonoma+ 可能因 `com.apple.provenance` 扩展属性拒绝启动（即使签名与公证有效）；提供修复脚本 `install-pilotdeck.sh` 或手动 `xattr -cr /Applications/PilotDeck.app && open /Applications/PilotDeck.app`。官方说明 Apple 公证票据存于 `Contents/CodeResources` 而非扩展属性，`xattr -cr` 安全。
- 启动后桌面应用拉起内嵌本地 Gateway 服务，配置 `~/.pilotdeck/pilotdeck.yaml`，首次启动引导配置 API Key。

**Windows 安装方式与入口**（依据 Release v260623 资产与发布说明，文档站尚未补图文步骤）：

- 从 GitHub Latest Release 下载 `PilotDeck-260623-win-x64.exe`（Windows x64，约 160MB，下载计数 573，高于 macOS 的 181），per-machine 安装，安装时可能需要管理员确认（发布说明明示 "Windows installer may request administrator approval because the installer is configured for per-machine installation"）。
- 安装后启动桌面应用，同样拉起内嵌本地 Gateway，配置路径与 macOS 一致（`~/.pilotdeck/pilotdeck.yaml`）。
- 注意：Web Install 文档对"一键脚本"写明"macOS/Linux for the one-line install script. Windows is currently supported for developer mode only"——此限制仅针对一键安装脚本（源码/Node.js 模式），**不适用于桌面应用**；桌面应用在 Windows 上是受支持的正式安装路径。

**依赖、权限与网络要求**：

- 桌面应用自带运行时，无需用户预装 Node.js；本地服务/CLI 模式需 Node.js 22（一键脚本用 fnm 自动安装）。
- 权限：macOS 需处理 Gatekeeper/公证属性；Windows 需管理员确认（per-machine 安装）；工具 `bash` 在 Windows 上执行需相应 shell 环境（推导，未运行验证）。
- 网络：需访问用户自配的 LLM 提供商（出站 HTTPS，经本地 18080 代理）；启用 IM 渠道时需出站连飞书/Lark/QQ 等云侧（飞书 Stream Mode 无需公网入站）。

**卸载方式**：

- 桌面应用：macOS 删除 `/Applications/PilotDeck.app`；Windows 在"添加/删除程序"卸载 per-machine 安装。
- 本地服务/CLI：`rm -rf ~/.pilotdeck/app`、`rm -f /usr/local/bin/pilotdeck ~/.local/bin/pilotdeck`；如需清配置 `rm -f ~/.pilotdeck/pilotdeck.yaml`；清数据需删整个 `~/.pilotdeck/`（官方警告会删除配置、数据与历史）。

#### 主体功能运行位置

- **主体功能运行在 PC 本地**：Agent 运行时（AgentSession/TurnRunner/AgentLoop）、记忆捕获与检索（PilotDeck Memory Core，存本地 `~/.pilotdeck/memory`）、智能路由、工具执行（bash/read_file/write_file/edit_file/glob/grep/web_fetch/web_search/agent）、Cron、Always-On Discovery、SessionStore、本地 Gateway 全部在工作 PC 本地进程内运行。
- 云端仅承担**用户自配的 LLM 推理**（外部依赖，非 PilotDeck 云后端）与 IM 平台事件源。不存在"客户端只是壳、真正工作在云端"的形态。**判定：符合本调研核心焦点要求。**

#### 云端网关（如存在）

- PilotDeck 文档中的"Gateway"是**本地进程内**的 WebSocket/HTTP 消息网关（`src/gateway/`，监听 18789 或桌面内嵌），负责渠道到 Agent 的消息路由，不是云侧网关；本节按 RUNBOOK 约定仅简单提及，不展开。
- 唯一云侧外部依赖为用户自配的 LLM 提供商（经本地 18080 AI 代理转发）与 IM 平台云侧连接；未发现 PilotDeck 自营的云后端、账号系统或同步服务（当前证据未发现）。

## 未决项与证据边界

- **Windows 桌面安装图文步骤**：Release 资产与发布说明证实 Windows x64 安装器存在并受支持，但 Desktop Install 文档页当前仅描述 macOS 步骤，未给 Windows 图文；Windows 上的实际启动行为、`bash` 工具在 Windows 的 shell 依赖、per-machine 安装的卸载入口，均需运行验证。
- **PilotDeck Memory Core 的捕获/检索实现**：文档描述"调用 captureTurn / retrieveContext in PilotDeck Memory"与 `memory_provider_error` 诊断，数据存本地 `~/.pilotdeck/memory`；推断其捕获/检索依赖用户自配的 LLM（而非独立云服务），但未由官方明示，标注为推导。
- **反馈主题**：未对近期 Issue/Discussion 做主题归纳，反馈样本边界未建立。
- **WorkSpace 级 YAML 配置**为 planned/reserved，当前运行时配置仍全局化，未来演进未决。
- **AGPL-3.0 协议**对企业内部部署与衍生分发有合规约束，本调研不展开法务结论。

## 后续验证建议

1. 在 Windows 11 x64 工作机上实跑 `PilotDeck-260623-win-x64.exe`，验证 per-machine 安装、首启 API Key 引导、`bash` 工具的 shell 依赖与 Always-On 在 Windows 场景的实际行为。
2. 在 macOS Apple Silicon 工作机上验证 DMG 安装、`com.apple.provenance` 修复脚本有效性、桌面内嵌 Gateway 端口占用与 18080 代理转发。
3. 按需抽样近期 GitHub Issue/Discussion，建立反馈主题与样本边界（单独调研流程，不纳入本 RUNBOOK）。
4. 若需评估 AGPL-3.0 对企业集成或衍生分发的合规影响，走独立法务调研流程。
