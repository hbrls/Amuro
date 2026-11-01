# OpenWorker（andrewyng/openworker）技术产品调研

> updated_by: Codex - GPT-5
> updated_at: 2026-07-31 16:30:00
> evidence_window: 调研日期 2026-07-31；GitHub 仓库 `andrewyng/openworker` 的 v0.1.7 Release（2026-07-30）与主干提交 e0cb129（2026-07-30）；官方网站与官方下载端点快照

## 交付结论

1. **OpenWorker 是运行在工作 PC 上的开源 AI coworker，而不是云端聊天壳。** 官方 README 将其定义为“lives on your desktop”的 AI coworker，目标是交付完成的文档、表格、报告、网页或已发送的业务回复。Tauri 桌面壳在本机启动 Python `openworker-server` sidecar；Agent loop、工具调用、会话与调度器均在本机进程中运行。
2. **主体功能运行位置判定为 PC 本地，符合本轮 RUNBOOK 的主体位置要求。** 本地 sidecar 通过 FastAPI 提供 REST 与 WebSocket 接口，模型请求只发往用户选择的模型端点；官方支持 BYOK 与 Ollama，本地模型可使模型调用也留在本机。云端只承担可选的登录、OAuth broker 和托管连接器 relay 等辅助功能。
3. **Windows 与 macOS 均有正式桌面安装包，但平台覆盖存在明确边界。** v0.1.7 Release 提供 Windows x64 的 NSIS `.exe` 与 `.msi`，以及 macOS Apple Silicon `.dmg` / 更新包。README 写明 macOS 12+、Windows 10/11 x64；Windows 构建未做 Authenticode 签名，首次启动会触发 SmartScreen 警告。主干 CI 已加入 Intel macOS 构建矩阵，但截至证据窗口，最新稳定 Release 尚未发布 Intel DMG，因此 Intel Mac 仍应视为未决/待发布状态。
4. **产品的核心工作闭环是“请求结果 → 分解步骤 → 本地工具执行 → 关键动作审批 → 交付物/外部回复”。** GUI、OpenAI-compatible API、Slack/GitHub 入站、定时 automation 都可产生工作；长任务通过 WebSocket 事件流推进，审批请求进入前台或 Inbox，调度器按计划运行并记录 run history。
5. **治理模型较完整，默认是人工监督而非无条件自治。** `discuss` / `plan` 为只读；`interactive` 对写入、Shell 与外部副作用请求审批；`auto` 才是全量访问；`custom` 通过配置扩大有限自动许可。写文件必须落在授权根目录，Shell allowlist 会拒绝链式命令、管道、重定向与命令替换。定时 automation 的创建/修改先审批，批准后才产生任务级、目标绑定的 standing rule。
6. **持久化是本地文件 + SQLite 的组合，而非必需中心数据库。** 会话索引、工作区、记忆与审计使用 `coworker.db`；对话正文按 session 写入 `conversations/<id>.jsonl`；定时任务和运行历史使用 `automation.db`；密钥写入用户目录下的受保护 `secrets.json`。Windows 默认使用 `%APPDATA%\\coworker`，macOS 使用 `~/.config/coworker`，均可由 `COWORKER_STATE_DIR` 覆盖。
7. **维护状态“非常活跃但处于早期 Beta”。** 仓库创建于 2026-07-20，调研时已达到 11,084 stars、1,480 forks、313 个开放 Issue；v0.1.4 至 v0.1.7 在 2026-07-22—07-30 连续发布。高增长不能等同成熟度：近期反馈集中在 Windows sidecar 启动、Intel Mac、Shell 安全边界、OAuth、Ollama 兼容性和文档缺口，且 README 明确标注 open beta。
8. **综合判定：符合本轮准入，建议列为重点观察候选。** 它同时满足“主体在 PC 本地”“Windows/macOS 有安装路径”“支持持续调度与人工治理”三个核心条件；主要风险是 Beta 阶段的平台完整性、Windows 未签名安装体验、连接器/模型网络依赖，以及高权限本地工具面带来的安全治理复杂度。

## 调研目标、范围与边界

### 调研目标

理解 OpenWorker 的产品定位、持续工作形态、PC 本地运行架构及 Windows/macOS 安装条件，重点判断其是否适合作为“Agent 持续获得工作并形成可治理完成闭环”的业界样本。

### 核心问题

- OpenWorker 为谁解决什么问题，核心流程如何形成完成交付？
- 桌面壳、本地 Agent server、模型端点、连接器和可选云端之间的职责边界是什么？
- Windows 与 macOS 工作机如何安装、启动、更新、卸载，依赖与权限是什么？
- Agent 如何接收人工、消息、事件和周期性工作，并在完成、失败或受阻时反馈？
- 数据、密钥、会话和调度状态如何持久化，云端是否为主体执行所必需？

### 覆盖范围

- `openworker.com` 官方产品说明与下载端点。
- GitHub README、LICENSE、v0.1.7 Release、版本标签、主干 Release workflow。
- 为验证系统边界而定点阅读的 `coworker/server`、`surfaces/gui/src-tauri`、`coworker/automation`、`coworker/secrets.py`、`coworker/conversations.py`、`coworker/permissions.py` 与打包脚本。
- GitHub 仓库公开元数据、近期 Release 与近期开放 Issue 标题样本。

### 明确排除

- 不进行逐文件源码审计、代码质量审查或性能 benchmark。
- 不进行竞品比较、横向排名或选型矩阵。
- 不调研遥测实现、监控指标或运营 Dashboard；本报告只在数据边界结论中说明“模型/连接器请求”这一必要网络边界。
- 不深入展开 OpenWorker Cloud 服务端实现；仅说明其作为可选登录、OAuth broker 和 inbound relay 的辅助角色。
- 不安装、不登录、不运行桌面包，不把静态源码证据包装为运行验证。
- Linux 仅作为源码开发背景，不作为工作机合格安装路径。

## 证据口径

- **直接事实**：官方 README、GitHub Release v0.1.7 资产、Tauri 配置、启动代码、FastAPI 路由、持久化模块和打包脚本。
- **架构推导**：由 Tauri 启动 sidecar、注入 loopback 地址/令牌、FastAPI REST/WS 与 `SessionManager` 组合推导出的组件关系；明确标注为系统模型而非运行时抓包结果。
- **社区反馈样本**：近期开放 Issue 标题只用于归纳重复主题，不代表全部用户或产品质量；样本边界为 2026-07-31 GitHub 公开快照。
- **快照边界**：Release、stars、forks、Issue 数和平台资产会持续变化；主干已加入 Intel macOS CI，但稳定 Release 资产以 v0.1.7 为准。

## 产品调研

### 产品定位与目标用户

- **一句话定位**：OpenWorker 是面向日常工作者的本地优先 AI coworker，把自然语言目标转成跨桌面文件、终端和业务连接器的可交付成果。
- **目标用户**：需要处理文档、表格、报告、日历、邮件、Slack、GitHub、Jira、Notion 等日常工作的人；同时面向希望 BYOK、使用 Ollama 或接入 MCP 的开发者。
- **产品承诺**：不是只给建议或待办清单，而是“finished work”；在发送消息、改日历、执行命令等有后果的动作前询问用户。
- **开源属性**：GitHub 仓库公开、MIT License；README 标注为 open beta，欢迎 Issue 和 PR。

### 核心流程（用户视角）

1. 用户安装桌面应用，打开后在设置中填入模型 API Key，或把模型端点指向 Ollama；无需登录 OpenWorker Cloud 也可使用本地工作流。
2. 用户用自然语言描述结果，例如准备客户简报、整理日历、撰写报告、核对 Jira 与 GitHub 发布状态。
3. Agent 在选定工作区内拆分步骤，读取本地文件并调用终端、MCP 或连接器工具；模型请求发往用户选择的提供商。
4. 对写文件、执行 Shell、发送消息、修改日历等 consequential action，权限引擎根据模式、路径根目录、命令 allowlist 和 standing rule 决定允许、拒绝或请求审批。
5. GUI 通过 WebSocket 收到流式事件和审批卡；无人值守/定时任务的审批请求进入本地 Inbox，人工回复后恢复任务。
6. 任务完成后，交付物落在本地文件系统或外部工具，session transcript、审计和 automation run history 留在本机。

### 功能地图与边界

- **本地执行面**：Tauri 桌面 GUI、Python Agent server、文件/终端工具、MCP client、模型 provider、语音输入 sidecar。
- **工作接入面**：GUI 对话、OpenAI-compatible `/v1/chat/completions`、Slack/GitHub 入站消息、定时 automations、可恢复的 self-wake 会话。
- **外部工具面**：官方连接器覆盖 Slack、GitHub、Jira、Notion、Linear、HubSpot、Outlook、Gmail、Google Calendar、monday.com 等；MCP 可扩展到其他工具。
- **治理面**：workspace trust、可写根目录、命令 allowlist、交互式审批、Inbox、session/task standing rules、审计记录。
- **云端边界**：登录与一键 OAuth、托管连接器 relay 和少量元数据便利；不是 Agent loop、文件读写或调度器的承载位置。
- **不应外推的能力**：README 的“25+ connectors”说明接入范围，不等于每个连接器都在每个平台、每种凭据模式下具有相同能力；本轮未逐一验证。

### 维护状态、版本演进、生态与反馈

- **版本节奏**：v0.1.4（2026-07-22 00:37 UTC）、v0.1.5（2026-07-22 06:26 UTC）、v0.1.6（2026-07-23 15:59 UTC）、v0.1.7（2026-07-30 21:47 UTC）。v0.1.7 Release Notes 包含自动压缩、更多模型提供商、Token 用量、Anthropic prompt caching、Windows 与跨平台修复及安全加固。
- **平台演进**：v0.1.7 稳定资产提供 macOS arm64 与 Windows x64；主干 Release workflow 已增加 `macos-15-intel` 构建矩阵，但尚未在最新稳定 Release 中看到 `OpenWorker-macos-x64.dmg`。
- **公开快照**：仓库于 2026-07-20 创建，调研时 11,084 stars、1,480 forks、313 open issues；这些数字只描述关注度与问题积累，不直接代表生产成熟度或采用率。
- **近期反馈主题（Issue 样本）**：Windows sidecar 启动失败导致白屏（#355）、Intel Mac 支持（#336）、Shell allowlist 绕过风险（#308/#309）、OAuth device flow（#340）、Ollama vision 兼容性（#337）、MCP/Skills 文档缺口（#68）、会话恢复与附件识别问题（#331/#316）。主题与产品边界高度相关，但样本不能外推为普遍故障率。
- **生态判断**：开源许可、MCP、连接器和快速 Release 有利于扩展；但项目创建时间短、版本仍为 0.x、Windows 尚未代码签名、Intel macOS 尚未随稳定 Release 交付，说明仍处于快速打磨期。

## 技术架构调研

### 系统全貌与运行形态

```text
┌──────────────────────────────────────────────┐
│ Tauri Desktop Shell                          │
│ React/Vite GUI · tray · updater · native I/O │
└──────────────┬───────────────────────────────┘
               │ 127.0.0.1 随机端口 + 每次启动令牌
┌──────────────▼───────────────────────────────┐
│ Python openworker-server (FastAPI/Uvicorn)   │
│ TurnEngine · SessionManager · approvals      │
│ providers · connectors · MCP · scheduler     │
└──────┬───────────────┬───────────────┬───────┘
       │               │               │
 本地文件/终端     模型端点         外部连接器/MCP
       │        OpenAI/Anthropic/   Slack/GitHub/... 
       │        Gemini/Ollama 等    （直连或可选 relay）
       └────────────── 本机状态目录 ────────────┘
```

- **桌面层**：Tauri 2 原生壳 + React SPA。应用启动时绑定随机可用 loopback 端口，生成随机 launch token，将 HTTP/WS 地址与平台信息注入前端。
- **执行层**：Tauri 启动打包的 Python `openworker-server` sidecar；开发模式可直接使用 `.venv` 中的 `openworker-server`。`SessionManager` 为每个 session 管理 `TurnEngine`、provider、连接器、MCP、Inbox 和 scheduler。
- **模型层**：核心依赖 `aisuite`，并配合 OpenAI、Anthropic、Google GenAI/Vertex 等 provider；模型端点由用户配置，Ollama 可完全本地化模型调用。
- **状态层**：本机 SQLite、JSON/JSONL 和用户密钥文件；不要求中心数据库或消息中间件。
- **云端层（辅助）**：默认 `https://api.openworker.com` / Auth0 配置用于登录和 managed OAuth；托管 Slack/GitHub relay 通过一个认证 WebSocket 向桌面推送入站事件。手动凭据模式不需要登录云端。

### 主要组件与核心链路

#### 链路 A：桌面人工任务

1. 用户在 Tauri GUI 提交目标。
2. 前端调用本机 FastAPI REST；session 事件、工具调用和 approval channel 经 `/ws/session/{session_id}` 流式传输。
3. `SessionManager` 创建/恢复 session，`TurnEngine` 通过 provider 进行模型回合，并调用本地文件、Shell、MCP 或连接器工具。
4. 权限引擎对每个 consequential action 返回 allow / deny / needs_user；需要人工时 GUI 展示审批，决策再回到同一 session。
5. 结果写入本地工作区或外部连接器，session transcript 与 audit 留在本机。

#### 链路 B：定时持续工作

1. Agent 通过 `create_scheduled_task` 创建 automation；创建和修改工具标记为需要审批。
2. `TaskStore` 将任务与 run history 写入本地 `automation.db`，用 `next_run` 建索引。
3. 常驻 scheduler 默认每 30 秒 tick；启动首 tick 对停机期间错过的任务执行一次 catch-up，运行中的同一任务 skip-on-overlap。
4. 每次 run 使用独立 session 标识；若遇到需要人的动作，任务可 park 到 Inbox，人工解决后恢复。
5. run 结束后保存状态、错误、触发来源和下一次执行时间，形成可追溯闭环。

#### 链路 C：外部消息接入

1. Slack/GitHub 事件可通过直接连接器或 OpenWorker Cloud managed relay 到达桌面 Gateway。
2. Gateway 做平台授权、路由和 Inbox reply 消费，再将消息交给 session handler。
3. 任务执行仍在本机；回复通常由桌面使用本地保存的连接器凭据直发外部平台。

### 主要依赖

- **终端用户运行时**：发布包内含 Tauri 壳和 PyInstaller sidecar，不要求用户另装 Python、Node 或 Rust；Windows Tauri 配置使用 WebView2 `downloadBootstrapper`，缺失 WebView2 时安装器可能需要联网下载。
- **模型**：OpenAI、Anthropic、Google 等 API 或自托管端点；Ollama 为本地模型选项。默认使用外部模型时，Prompt 与必要上下文会离开 PC 到该模型端点。
- **核心 Python**：FastAPI/Uvicorn、Pydantic、MCP、httpx/websockets、croniter、SQLite 标准库；Windows 额外声明 `tzdata` 以提供命名时区数据库。
- **桌面构建**：Node 20、npm、Rust 1.77+ / Tauri 2；打包脚本使用 PyInstaller 将 Python server 冻结为 onedir sidecar。
- **连接器**：具体 Slack/Gmail/GitHub 等服务需要各自网络和凭据；MCP server 可通过 stdio 或 streamable HTTP 接入。

### 接口形态

- **本机 HTTP REST**：`/v1/health`、sessions、workspaces、providers、connectors、MCP、memory、automations、settings 等资源接口。
- **本机 WebSocket**：`/ws/session/{session_id}` 承载 Agent 事件流、工具进度和审批通道；`/ws/events` 提供应用级事件推送。
- **OpenAI-compatible API**：`POST /v1/chat/completions` 允许 OpenAI 格式客户端把本地 runtime 当作后端。
- **外部 OAuth/relay**：浏览器 OAuth 回调回到本机 loopback；managed relay 与云端保持认证 WebSocket。两者是连接器接入边界，不是主体执行接口。
- **进程间调用**：Tauri 原生命令通过 `window.__TAURI__.core.invoke` 提供文件夹选择、autostart、keep-awake、更新和本地语音输入等能力。

### 持久化方式

- **会话与记忆**：`<state-dir>/coworker.db` 保存 session/workspace 索引、记忆和审计；`<state-dir>/conversations/<id>.jsonl` 追加保存消息正文。
- **自动化**：`<state-dir>/automation.db` 保存 `scheduled_tasks` 与 `task_runs`，任务详情按 JSON blob 存储，`next_run`、`enabled` 作为调度索引列。
- **配置与治理**：`config.toml`、`workspace_trust.json`、`inbox.json`、`unattended.json`、`wakes.json`、`personas.json` 等位于同一状态目录；工作区还可放 `.coworker/config.toml` 与 `.coworker/mcp.json` 覆盖全局配置。
- **密钥**：`secrets.json` 通过原子写入和平台权限处理保护。POSIX 使用 0700/0600；Windows 使用 `icacls` 去除继承并授予当前用户。
- **工作产物**：文件、报告、代码和导出结果留在用户授权的 workspace 根目录或外部连接器；系统不要求云端对象存储。

### 通信方式

- **桌面内部**：React SPA ↔ 本机 FastAPI 使用 HTTP；实时事件与审批使用 WebSocket；Tauri ↔ sidecar 是父子进程与 loopback 网络组合。
- **模型调用**：同步/异步 provider 请求依赖用户选择的模型服务；Ollama 时可全部留在本机。
- **连接器**：直接模式由本机 SDK/HTTP/WebSocket 连接 Slack、GitHub 等；managed relay 模式为桌面 ↔ OpenWorker Cloud 的一条认证长连接，云端推送事件，回复仍可由桌面直发平台。
- **调度**：单机 scheduler 使用进程内 asyncio loop + SQLite，不依赖 RabbitMQ、Kafka、NATS 或 Redis；`TaskStore` 锁保护线程并发。
- **重连与恢复**：relay 断线后约 2 秒重连；scheduler 处理停机 catch-up、跳过重叠执行；sidecar 监视父进程并在桌面退出/崩溃时自退。

### 部署形态

#### 工作机安装（Windows / macOS）

| 平台 | 官方安装路径 | 运行入口 | 依赖、权限与网络 | 卸载 |
| --- | --- | --- | --- | --- |
| Windows 10/11 x64 | 官网 `/windows` 重定向到 GitHub Release 的 `OpenWorker-windows-setup.exe`；同时提供 `OpenWorker-windows.msi` | 安装后启动 OpenWorker 桌面应用；Tauri 以当前用户模式安装，启动本机 sidecar | 无需预装 Python/Node/Rust；安装器配置 WebView2 bootstrapper，缺失时可能下载 WebView2；当前 Release 未 Authenticode 签名，SmartScreen 会警告；工作区文件与 Shell 权限由应用审批/信任控制 | 官方未在 README 写出专门卸载步骤；NSIS/MSI 标准卸载入口应由 Windows“已安装的应用/程序和功能”提供，具体清理状态目录未在本轮验证 |
| macOS Apple Silicon，macOS 12+ | 官网 `/mac` 重定向到 `OpenWorker-macos-arm64.dmg`；DMG 内含 `.app`，另有 `.app.tar.gz` 与签名用于更新 | 将 OpenWorker 拖入 Applications 后启动；应用在 tray 中常驻，关闭窗口默认隐藏，Quit 才停止 sidecar | Release 资产为签名/公证 DMG；模型 API、连接器和 OAuth 需网络，Ollama 可本地；语音输入另需麦克风权限，应用提供本地 Whisper 模型下载 | 官方未提供专页；通常从 Applications 删除 `.app`，状态目录（`~/.config/coworker`）需另行清理，未运行验证 |
| macOS Intel | 主干 CI 已有 `macos-15-intel` 构建矩阵；v0.1.7 稳定 Release 无 Intel DMG | 未形成稳定下载入口 | 不能把主干 CI 视作用户可安装发行版 | 未决 |

#### 源码构建（非终端用户默认路径）

- Python 3.10+、Node 20+、Rust toolchain 是 README 规定的开发前置依赖。
- `packaging/setup_dev_env.sh` 创建 `.venv` 并以 editable 方式安装 Python 包；GUI 目录再运行 `npm install` / `npm run dev`，或 `npm run tauri dev`。
- Windows 构建脚本要求 Rust MSVC target 与 C++ build tools、Node/npm、Python venv、PyInstaller、`tzdata` 和 `typer`，然后产出 NSIS 与 MSI。
- macOS 构建脚本以 PyInstaller 生成 onedir sidecar、Tauri 打包 `.app` 和 DMG；签名/公证与 updater 签名密钥存在与否决定发行包是否可直接分发。

#### 主体功能运行位置

- **判定：PC 本地。** Tauri `run()` 选择本机 `127.0.0.1` 随机端口并启动 `openworker-server` 子进程；前端只连接该 loopback server。
- Python `SessionManager`、`TurnEngine`、本地文件/终端工具、MCP client、连接器 Gateway 和 scheduler 均在 sidecar 所在机器上。
- 云端不承载 Agent loop、工作区文件、对话主存储或调度队列；只有用户选择的模型提供商和连接器服务会接收相应请求/数据。

#### 云端网关（如存在）

- `api.openworker.com` + Auth0：可选账号登录、PKCE token exchange 和 managed OAuth broker。
- Managed relay：为 Slack/GitHub 入站事件提供一条认证 WebSocket；桌面仍执行任务并使用本地连接器凭据回发。
- 手动粘贴 API token / connector token 时，应用可完全不登录 OpenWorker Cloud；因此云端是辅助网关，不是主体计算平台。

## 未决项与证据边界

1. **Intel Mac 稳定发行时间**：主干已有构建矩阵，但 v0.1.7 Release 未提供 Intel DMG；需等待新 Release 或官方下载端点实际出现。
2. **Windows 首次安装体验**：README 明确 SmartScreen 警告；本轮未在干净 Windows 机器上实测 WebView2 bootstrapper、SmartScreen 处理和安装后启动。
3. **卸载清理范围**：官方未说明卸载是否清理 `%APPDATA%\\coworker` / `~/.config/coworker`，也未运行安装器验证。
4. **网络最小依赖**：源码证明 Ollama 可承担本地模型，但未做断网运行验证；连接器、OAuth、远程模型和 managed relay 的断网行为仍需按场景实测。
5. **权限边界运行效果**：源码显示 workspace trust、路径根目录和 approval engine 具备约束，但本轮未执行恶意 Shell、跨根目录写入或 MCP 工具的动态验证。
6. **项目成熟度**：公开指标增长很快但项目只有约 11 天历史；Issue 样本可说明问题主题，不能推导故障率、用户规模或生产 SLA。

## 后续验证建议

1. 在一台 Windows 10/11 x64 工作机上安装 v0.1.7，记录 WebView2、SmartScreen、当前用户安装和 sidecar 启动日志；确认普通用户是否可完成全流程。
2. 在 Apple Silicon Mac 上安装 DMG，验证签名/公证、自动更新、tray 常驻、Quit 后 sidecar 是否确实退出；同时记录 Intel Mac 新 Release 是否出现。
3. 用 Ollama 与一个远程模型各跑一条相同任务，抓取请求边界，区分“本地 Agent runtime”与“模型/连接器网络依赖”。
4. 建立一个需要审批的定时 automation，验证停机 catch-up、skip-on-overlap、Inbox park/resume、run history 和 standing rule 的完整闭环。
5. 在隔离工作区验证 workspace trust、路径越界写入、Shell allowlist 对链式命令的拒绝，以及 managed relay 断线重连；只做受控测试，不扩大为源码审计。

## 证据锚点

- [OpenWorker 官方网站](https://openworker.com/)
- [GitHub 仓库 README（v0.1.7）](https://github.com/andrewyng/openworker/blob/v0.1.7/README.md)
- [v0.1.7 Release](https://github.com/andrewyng/openworker/releases/tag/v0.1.7)
- [Windows 下载端点](https://download.openworker.com/windows)
- [macOS 下载端点](https://download.openworker.com/mac)
- [Tauri 桌面配置](https://github.com/andrewyng/openworker/blob/v0.1.7/surfaces/gui/src-tauri/tauri.conf.json)
- [Python server 启动入口](https://github.com/andrewyng/openworker/blob/v0.1.7/coworker/server/run.py)
- [Tauri sidecar 启动与退出管理](https://github.com/andrewyng/openworker/blob/v0.1.7/surfaces/gui/src-tauri/src/lib.rs)
- [权限引擎](https://github.com/andrewyng/openworker/blob/v0.1.7/coworker/permissions.py)
- [自动化存储与调度器](https://github.com/andrewyng/openworker/blob/v0.1.7/coworker/automation/store.py)

