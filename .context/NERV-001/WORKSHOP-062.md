# CloudCLI（aka Claude Code UI）技术产品调研

> updated_by: Qoder - Claude
> updated_at: 2026-08-08 00:00:00
> evidence_window: 2026-08-07, main 分支, v1.37.0, npm @cloudcli-ai/cloudcli@1.37.0

## 调研目标

- 围绕 Stateful 编排调度、客户端接入、Windows 与 macOS 工作机部署、依赖根源与架构范式，形成可追溯的独立产品调研。
- 判断产品是否持久拥有工作对象、对象关系和任务生命周期，并依据依赖、状态与策略持续推进任务。
- 核验 Windows 与 macOS 工作机支持情况、Local 优先适配程度、云端依赖与最小部署成本。
- 识别调度最小核心职责与非调度增值能力的边界，评估改造范围与风险。

## 交付结论

### CloudCLI 是 CLI Agent 的 Web UI 层，不持久拥有工作对象、对象关系或任务生命周期，属于任务执行宿主而非 Stateful 调度器

CloudCLI（原名 Claude Code UI，npm 包名 `@cloudcli-ai/cloudcli`）是 siteboon 开发的开源 Web UI/GUI，定位为 Claude Code、Cursor CLI、Codex、Gemini CLI 和 OpenCode 的桌面与移动端界面。产品本身不包含 AI 运行时——它通过 `@anthropic-ai/claude-agent-sdk`、`@openai/codex-sdk` 等 Provider SDK 或 CLI 进程包装已有 Agent，为用户提供浏览器端的聊天、文件浏览、Git 操作、Shell 终端和会话管理。

CloudCLI 不持久拥有调度意义上的工作对象。其核心持久化对象为：用户、API Key、项目（Project）、会话（Session）、设置、通知和扫描状态，均存储在本地 SQLite 数据库中。Project 是文件系统路径的索引容器，聚合来自 `~/.claude` 等 Provider 原生目录的会话记录，不包含任务依赖、DAG 或状态机。Session 是 Provider 原生会话（JSONL 文件）在 CloudCLI 数据库中的归一化索引行，拥有 `session_id`（CloudCLI 稳定 ID）和 `provider_session_id`（Provider 原生 ID），但 Session 之间不存在父子关系、先后顺序或阻塞依赖。不存在持久化的 Plan 或 Task 调度对象。

产品存在的"调度"相关能力均来自第三方插件（grostim/cloudcli-cron 和 TadMSTR/cloudcli-plugin-task-queue），不属于 CloudCLI 核心代码。这些插件本身也不构成 Stateful 调度——cloudcli-cron 是 cron 式定时器，在到点时启动全新 CLI 进程执行 prompt；task-queue 插件是 `~/.claude/task-queue/` 目录下 YAML 文件的查看器和启动器，依赖外部 task-queue-mcp 服务。两者均不持久化任务依赖关系，不做调度决策，不负责失败后的状态恢复。

以上为已确认事实，依据 [GitHub README](https://github.com/siteboon/claudecodeui)、[Architecture Overview](https://cloudcli.ai/docs/cloudcli-development-resources/architecture) 和 [package.json](https://github.com/siteboon/claudecodeui/blob/main/package.json)。

### 工作对象模型以 Project 和 Session 为核心，不存在 Plan 或 Task 调度对象

CloudCLI 的持久化对象模型如下：

- **Workspace**：不存在独立 Workspace 对象。Project 充当工作空间容器，通过文件系统路径关联工作目录。Project 拥有 clone、delete、star、archive 等操作，但不包含嵌套子任务或调度状态。
- **Project**：持久化数据库记录，拥有路径、名称、会话计数、star 状态、archive 状态。自动发现 `~/.claude/projects/` 等 Provider 原生目录中的会话并聚合。Project 是文件系统路径的索引容器，不是调度单元。
- **Session**：持久化数据库记录，Schema 包含 `session_id`（CloudCLI 稳定 ID）、`provider`（claude/codex/cursor/gemini/opencode）、`provider_session_id`（Provider 原生 ID）、`project_path`、`jsonl_path`、`archive` 和时间戳。Session 同步器扫描 Provider 原生 JSONL 产物并写入归一化行。Session 之间不存在父子关系或依赖链。
- **Issue**：不存在。
- **Plan**：不存在持久化编排对象。Chat 中的 Plan Mode 仅为单次 Agent 执行参考的文本产物。
- **Task**：核心代码中不存在持久化 Task 调度对象。Task Queue 插件中的"task"是 `~/.claude/task-queue/` 目录下外部 YAML 文件的映射，不由 CloudCLI 拥有或解释。

对象之间不存在调度意义上的层级转换。Project 组织 Session，Session 归属于 Project，但这是索引聚合关系，不是调度关系。

以上为已确认事实，依据 [Architecture Overview](https://cloudcli.ai/docs/cloudcli-development-resources/architecture) 中 Sessions and Persistence 章节和 Backend Modules 章节。

### 任务关系与生命周期不存在，Session 生命周期由 Provider 原生管理而非 CloudCLI 调度

CloudCLI 不管理任务之间的关系，不维护任务状态机：

- **Session 生命周期**：由 Provider（Claude Code、Codex 等）原生管理。Session 可以被创建、恢复（resume）、归档（archive）和删除。Session 的执行状态（running、idle、completed）存在于 Provider 进程中，CloudCLI 通过 WebSocket 流式接收事件帧并在前端展示。CloudCLI 不决定 Session 何时执行、按何顺序推进或由谁执行——这些由用户在 UI 中手动发起或由 Provider SDK 决定。
- **任务依赖**：不存在。Session 之间没有 `needs`、前置依赖、阻塞关系或 DAG。
- **状态迁移**：Session 的 archive/unarchive 是简单的布尔标记切换，不是调度状态机迁移。不存在 waiting → ready → running → completed → failed 的调度状态链。
- **上游下游**：不存在上游完成后解锁下游的机制。每次 Chat 交互是独立的 Provider 调用。
- **优先级、计划时间、并发限制**：核心 CloudCLI 不参与调度决策。cloudcli-cron 插件支持按时间触发（daily、weekly、monthly），但不支持优先级、并发限制或资源约束。

以上为已确认事实，依据 [Architecture Overview](https://cloudcli.ai/docs/cloudcli-development-resources/architecture) 和 [Network Architecture Guide](https://cloudcli.ai/docs/cloudcli-development-resources/network-architecture)。

### Agent 分派不存在，CloudCLI 是用户手动驱动的交互式执行宿主

CloudCLI 不选择、不分派、不唤起 Agent。Agent 的启动完全由用户在 UI 中手动发起：

- **启动模式**：用户在 Chat 界面输入消息或点击 Shell 按钮，CloudCLI 后端通过 Provider SDK 或 CLI 进程 spawn 一个 Agent 运行实例。这是一次性启动 Agent，不是调度器选择执行者。
- **Agent 与 Task 归属**：不存在持久化的 Agent-Task 归属关系。Session 归属于 Project，但 Agent 进程在交互结束后退出，不持久化执行归属。
- **失败恢复**：Agent 退出、失败或断线后，CloudCLI 不自动转交其他 Agent 或重新排队。用户需手动恢复（resume）之前的 Session。Provider SDK 的 resume 能力依赖 `provider_session_id`，但恢复由用户发起，不是调度器决策。
- **执行进度**：执行进度存在于 Provider 原生会话（JSONL 文件）和 CloudCLI 的 WebSocket replay buffer 中。replay buffer 是内存态的运行时缓冲，不是持久化调度状态。进程重启后 replay buffer 丢失，但 Provider 原生 JSONL 仍可用于重新索引 Session。
- **连续性**：cloudcli-cron 插件明确声明"No direct reuse of the live host chat session"——定时执行的 prompt 启动全新 CLI 进程，不继承当前交互式会话上下文。这进一步证明不存在 Agent 连续性调度。

以上为已确认事实，依据 [Architecture Overview](https://cloudcli.ai/docs/cloudcli-development-resources/architecture) 和 [cloudcli-cron README](https://github.com/grostim/cloudcli-cron)。

### 持久化基于 SQLite，存储用户/会话/设置元数据，不存储调度状态

CloudCLI 使用内嵌 SQLite 作为唯一持久化存储：

- **数据库**：`better-sqlite3`（v12.6.2），内嵌式 SQLite，零配置启动。无需外置数据库服务。
- **Schema**：`server/modules/database/schema.ts` 定义表结构，包含 users、api_keys、credentials、projects、sessions、app_config、notification_preferences、vapid_keys、push_subscriptions 和 scan_state。
- **调度状态**：以上表中均不包含调度状态——没有任务依赖表、没有执行归属表、没有任务状态机表、没有优先级或计划时间字段。scan_state 表仅跟踪 Provider 会话扫描进度（增量索引），不是调度状态。
- **Provider 原生存储**：Provider 原生会话存储在 `~/.claude` 目录下的 JSONL 文件中。CloudCLI 读取这些文件进行索引，但不拥有或管理其内容。MCP 配置同步到 `~/.claude` 中的 Provider 原生配置文件（Claude `.mcp.json`、Codex TOML、Cursor/Gemini JSON 等）。
- **插件存储**：cloudcli-cron 插件使用 `~/.cloudcli-workspace-scheduled-prompts/` 下的 JSON ledger 文件存储调度计划和运行历史。task-queue 插件读取 `~/.claude/task-queue/` 下的 YAML 文件。这些是插件本地文件存储，不由 CloudCLI 数据库管理。
- **依赖剥离**：SQLite 是唯一数据库依赖，内嵌在 Node.js 进程中。可替换为其他存储，但当前不支持外置数据库。better-sqlite3 是 native 模块，需要 node-gyp 编译。

以上为已确认事实，依据 [Architecture Overview](https://cloudcli.ai/docs/cloudcli-development-resources/architecture) 和 [package.json](https://github.com/siteboon/claudecodeui/blob/main/package.json) 中的 `better-sqlite3` 依赖。

### 对外接口以 REST API 和 WebSocket 为主，不包含调度接口

CloudCLI 的对外接口形态：

- **REST API**：Express 后端暴露 `/api/*` 路由，受 API Key 和 JWT 双重认证保护。公开路由包括 `/health` 和 `/api/auth`。CloudCLI Cloud 提供 REST API（`https://cloudcli.ai/api/v1`），认证方式为 `X-API-KEY` header，支持 environments 管理、agent 执行等操作。自托管版本同样暴露 REST API，用于项目管理、会话管理、文件操作、Git 操作、Provider 模型查询等。
- **WebSocket**：单一 WebSocket 服务器，按路径路由：`/ws`（聊天流和运行订阅协议）、`/shell`（交互式 PTY 终端会话）、`/plugin-ws/:pluginName`（插件后端代理）、`/api/browser-use/sessions/:sessionId/viewer/websockify`（Browser Use 查看器代理）。
- **Chat 协议**：使用归一化的 server-to-client 帧，带 `kind` 字段。运行时由 `chat-run-registry.service.ts` 跟踪，分配序列号、维护 replay buffer、映射 Provider ID 到 App Session ID。
- **CLI**：`cloudcli` 命令支持 `start`、`status`、`update`、`help`、`version`、`--port`、`--database-path` 等选项。
- **Provider SDK 接口**：后端通过 `@anthropic-ai/claude-agent-sdk`（v0.3.165）和 `@openai/codex-sdk`（v0.144.0）等 SDK 与 Provider 交互。
- **调度接口**：不存在。没有任务提交、任务领取、任务状态查询、任务依赖管理等调度意义上的接口。CloudCLI Cloud 的 Agent API 允许通过 REST 触发 Agent 执行，但这是任务发起，不是调度决策。

以上为已确认事实，依据 [Network Architecture Guide](https://cloudcli.ai/docs/cloudcli-development-resources/network-architecture)、[Architecture Overview](https://cloudcli.ai/docs/cloudcli-development-resources/architecture) 和 [CloudCLI API Documentation](https://developer.cloudcli.ai)。

### 消息通信以 WebSocket 长连接为主，支持断线重连和 replay buffer

- **用户与 CloudCLI**：HTTP/HTTPS（REST API 和静态资源）+ WebSocket（聊天流和终端）。前端 API 调用通过 `src/utils/api.js`，实时聊天和终端流使用 WebSocket context/hook 而非轮询。
- **Chat WebSocket**：`/ws` 路径，服务端推送归一化帧。支持 replay buffer——客户端断线重连后可接收错过的帧。`chat-run-registry.service.ts` 跟踪活跃运行、分配序列号、抑制重复完成事件。
- **Shell WebSocket**：`/shell` 路径，使用 node-pty 提供交互式终端。支持重连、replay 缓冲输出、终端 resize、检测 Provider 登录流程中的认证 URL。
- **插件 WebSocket**：`/plugin-ws/:pluginName` 路径，代理到运行中的插件后端 WebSocket 服务器，预认证。
- **CloudCLI 与 Provider**：进程内通信。Provider SDK 或 CLI 进程作为子进程 spawn，通过 stdio 或 SDK 回调接收事件流，再通过 WebSocket 转发到前端。
- **断线恢复**：Chat 和 Shell 均支持断线重连和 replay。但 replay buffer 是内存态，进程重启后丢失。Session 的持久化恢复依赖 Provider 原生 JSONL 文件重新索引，不是从 replay buffer 恢复。
- **保活机制**：WebSocket 保持长连接。无明确的保活心跳协议文档说明，但 `ws` 库支持 ping/pong 帧。

以上为已确认事实，依据 [Network Architecture Guide](https://cloudcli.ai/docs/cloudcli-development-resources/network-architecture) 和 [Architecture Overview](https://cloudcli.ai/docs/cloudcli-development-resources/architecture)。

### 任务队列不存在于核心代码，插件级队列依赖外部文件和 MCP 服务

CloudCLI 核心代码不包含持久化任务队列或内存任务队列。调度意义上的任务队列——防重复领取、原子抢占、租约超时回收、重试和失败转移——均不存在。

- **cloudcli-cron 插件**：使用 `~/.cloudcli-workspace-scheduled-prompts/` 下的 JSON ledger 文件存储调度计划。自动执行仅在 scheduler grace window 内的到期任务才会触发；超时未执行的任务标记为 missed，不补执行。支持手动 Retry。这是简单的 cron 式定时器，不是持久化任务队列——不存在原子抢占（单进程内执行）、不存在并发协调（无并发控制）、不存在租约机制。
- **task-queue 插件**：读取 `~/.claude/task-queue/` 下的 YAML 文件作为任务源，代理到 `localhost:8485` 的 task-queue-mcp 服务。提供 `GET /tasks`、`POST /tasks/:id/start`（mode: review | auto）、`POST /tasks/:id/approve` 等 HTTP 接口和 WebSocket 实时更新。任务状态存储在 YAML 文件中，不由 CloudCLI 数据库管理。task-queue-mcp 是独立的外部服务，不在 CloudCLI 仓库中。
- **Provider 会话队列**：不存在。Provider SDK 的会话执行是用户发起的即时交互，不是队列消费。

以上为已确认事实，依据 [cloudcli-cron README](https://github.com/grostim/cloudcli-cron) 和 [cloudcli-plugin-task-queue](https://github.com/TadMSTR/cloudcli-plugin-task-queue)。

### Windows 与 macOS 均通过 npm 或 Electron 支持，macOS 原生支持更完整

CloudCLI 支持 Windows、macOS 和 Linux 三个平台：

- **npm 自托管方式（Windows / macOS 共通）**：通过 `npx @cloudcli-ai/cloudcli` 或 `npm install -g @cloudcli-ai/cloudcli` 安装。要求 Node.js v22+。启动后通过浏览器访问 `http://localhost:3001`。两个平台安装方式一致，无平台差异。
- **Desktop Companion App**：Electron 桌面应用，从 GitHub Releases 分发。支持 macOS（dmg）和 Windows（nsis）。提供菜单栏/系统托盘常驻，可打开 CloudCLI Cloud 环境或启动本地 CloudCLI 服务器。Linux 不支持 Desktop App。
- **macOS 安装方式与入口**：`npx @cloudcli-ai/cloudcli` 或下载 CloudCLI Desktop dmg。Node.js v22+ 或 Desktop App 自动安装 Local Server Runtime。通过浏览器或 Desktop App 访问 `http://localhost:3001`。无需 sudo（除非绑定 80 端口）。node-pty 的 native 编译依赖 Xcode Command Line Tools。
- **Windows 安装方式与入口**：`npx @cloudcli-ai/cloudcli` 或下载 CloudCLI Desktop nsis 安装包。Node.js v22+ 或 Desktop App 自动安装 Local Server Runtime。通过浏览器或 Desktop App 访问 `http://localhost:3001`。node-pty 的 native 编译依赖 Visual Studio Build Tools。better-sqlite3 是 native 模块，Windows 上需要 node-gyp 编译环境。
- **Docker Sandbox（实验性）**：`npx @cloudcli-ai/cloudcli@latest sandbox ~/my-project`，通过 sbx CLI 提供 hypervisor 级隔离。支持 Claude Code 和 Codex。要求 sbx CLI 已安装。
- **CloudCLI Cloud**：完全托管，无需本地安装。从任何设备的浏览器、IDE、REST API 或 n8n 访问。起价 €7/月。

两个平台均支持完整核心功能，不存在功能阉割。但 node-pty 和 better-sqlite3 是 native 模块，首次安装需要编译环境——macOS 需 Xcode CLT，Windows 需 VS Build Tools。这是 npm 自托管方式的摩擦点，Desktop App 通过预编译 Runtime 消除了这一摩擦。

以上为已确认事实，依据 [GitHub README](https://github.com/siteboon/claudecodeui)、[Releases](https://github.com/siteboon/claudecodeui/releases) 和 [package.json](https://github.com/siteboon/claudecodeui/blob/main/package.json) 中的 electron-builder 配置。

### Local 优先适配判断：自托管完整匹配，CloudCLI Cloud 为可选增值而非硬性依赖

CloudCLI 的全部主体功能运行在用户本地 Node.js 进程中。自托管方式（npm 或 Docker Sandbox）不依赖 CloudCLI 运营的云端服务——没有 SaaS 强制绑定、没有云端认证要求、没有云端调度。数据存储在本地 SQLite 数据库和 `~/.claude` 目录中。Provider SDK 调用直接从本地发向 Anthropic/OpenAI 等 Provider 端点。MCP 配置同步到本地 `~/.claude` 目录。

CloudCLI Cloud 是可选的托管增值服务，提供完全隔离的云端环境（containerized workspace）、SSH 访问、REST API 和团队共享。使用 CloudCLI Cloud 时数据离开工作机，存储在云端容器中。但自托管方式不使用 CloudCLI Cloud，数据不离开工作机。

Desktop Companion App 是可选的本地增强，不引入云端依赖。它启动本地 CloudCLI 服务器或打开 CloudCLI Cloud 环境，由用户选择。

选型结论：CloudCLI 在 Local 优先维度上不存在云端强依赖的选型缺陷。自托管方式提供完整功能，数据存储在本地。CloudCLI Cloud 是可选增值，不是核心功能的前提。最小部署成本为 `npx @cloudcli-ai/cloudcli` + Node.js v22+，零额外依赖。

以上为已确认事实，依据 [GitHub README](https://github.com/siteboon/claudecodeui) 中的 Self-Hosted 章节和 Comparison Table。

### CloudCLI Cloud 作为托管增值服务存在，但自托管不依赖其任何云端组件

CloudCLI Cloud 是 CloudCLI 运营的完全托管服务，提供隔离的容器化开发环境：

- **职责**：提供云端 containerized workspace（隔离环境）、SSH 访问、预装 Claude Code UI 和开发工具、REST API 和 n8n 集成、团队共享。
- **核心组件**：每个 environment 是隔离的容器化 workspace，拥有独立 subdomain（如 `myproject-abc123.cloudcli.ai`）、SSH 访问、`/workspace/` 目录和预装 IDE。
- **REST API**：Base URL `https://cloudcli.ai/api/v1`，认证方式为 `X-API-KEY` header。支持 environments 管理（创建、列表）和 Agent 执行（指定 project name 和 prompt）。
- **数据边界**：使用 CloudCLI Cloud 时，代码和会话数据存储在云端容器中，离开用户工作机。自托管方式不经过 CloudCLI Cloud，数据不离开工作机。
- **费用**：起价 €7/月，使用用户自有的 AI 订阅（Claude、Cursor、Codex 等）。CloudCLI 提供环境，不提供 AI。
- **断网影响**：自托管方式断网后，核心功能（Chat、文件浏览、Git、Shell）仍可用，但 Provider API 调用需要网络连接到 Anthropic/OpenAI 端点。CloudCLI Cloud 断网后完全不可用。

自托管方式不存在云端组件依赖。CloudCLI Cloud 是独立的托管服务，自托管的 CloudCLI UI 不调用任何 `cloudcli.ai` 域名的 API。

以上为已确认事实，依据 [CloudCLI API Documentation](https://developer.cloudcli.ai) 和 [GitHub README](https://github.com/siteboon/claudecodeui) 中的 Comparison Table。

## 技术架构调研

### 系统全貌与运行形态

CloudCLI 以 Node.js 进程为部署单元，运行 Web UI 服务：

1. **npm CLI 包**：`@cloudcli-ai/cloudcli`，bin 指向 `dist-server/server/modules/cli/cli.js`。通过 `npx` 或全局安装运行，启动 Express 后端服务。
2. **Express 后端**：`server/index.js` 为组合根，初始化 HTTP 服务器、SQLite 数据库、WebSocket 服务器、Provider hooks、认证中间件，注册路由，服务静态文件和构建产物。
3. **React 前端**：`src/` 目录，按功能切片组织（chat、sidebar、file-tree、git-panel、mcp、plugins、skills、settings、browser-use）。构建产物在 `dist/`，由后端服务。
4. **Provider 运行时**：Claude、Codex、Cursor、Gemini、OpenCode 五个 Provider，通过 Provider Registry 管理各自的 auth、MCP、skills、models、sessions facets。
5. **WebSocket 服务器**：单一 `ws` 服务器，路由 `/ws`（chat）、`/shell`（PTY）、`/plugin-ws/:name`（插件代理）、`/api/browser-use/.../viewer/websockify`（Browser Use 查看器）。
6. **Electron Desktop App**：可选的桌面伴侣应用，macOS dmg 和 Windows nsis。从 GitHub Releases 分发，Local Server Runtime 自动下载。
7. **Docker Sandbox（实验性）**：通过 sbx CLI 提供 hypervisor 级隔离，在 microVM 中运行 Agent。

系统边界：自托管方式下，CloudCLI 后端进程是自包含的 Web 服务。外部网络依赖仅为 Provider API 调用（Anthropic/OpenAI 端点）。CloudCLI Cloud 是独立的托管服务，不构成自托管的网络依赖。

### 主要组件与核心链路

CloudCLI 的组件结构按功能模块组织：

- **database 模块**：SQLite 连接、Schema、迁移和 repositories（users、api_keys、credentials、projects、sessions、app_config、notification_preferences、vapid_keys、push_subscriptions、scan_state）。
- **projects 模块**：Project 发现、CRUD、clone/delete/star/archive、TaskMaster 检测、project/session 聚合。
- **providers 模块**：Provider Registry 和 Provider facets（auth、MCP config、skills、models、session history、session synchronization）。
- **websocket 模块**：统一 WebSocket gateway，处理 chat streaming、shell PTY、plugin proxy、auth、run registry、replay buffers、writer adapters。
- **browser-use 模块**：Browser Use 设置、session lifecycle、viewer token 验证、viewer/WebSocket 代理、MCP bridge。
- **middleware**：JWT/API-key/auth 中间件。
- **services**：共享后端服务，如 web push/VAPID 编排。
- **routes（legacy）**：Git、commands、settings、auth、plugins、TaskMaster、Gemini 兼容、user 操作和 agent API 路由。

核心链路：一次用户 Chat 交互的完整流程。

1. 用户在浏览器中打开 CloudCLI UI，选择 Project 和 Provider（Claude/Codex/Cursor/Gemini/OpenCode）。
2. 用户在 Chat 界面输入消息，前端通过 `src/utils/api.js` 发送 HTTP 请求或通过 WebSocket `/ws` 发送消息帧。
3. 后端通过 Provider SDK（如 `@anthropic-ai/claude-agent-sdk`）或 CLI 进程 spawn Agent 运行实例。
4. Agent 运行事件通过 SDK 回调或 stdio 流式返回后端。
5. 后端通过 WebSocket `/ws` 将归一化帧推送到前端，`chat-run-registry.service.ts` 分配序列号、维护 replay buffer、映射 Provider ID 到 App Session ID。
6. Agent 执行结束后，会话记录由 Provider 原生写入 JSONL 文件（如 `~/.claude/projects/` 下）。
7. Session 同步器扫描 Provider 原生产物，写入归一化行到 SQLite sessions 表，scan_state 跟踪增量扫描进度。

### 主要依赖

- **Node.js v22+**：硬性运行时依赖。npm 包的 `engines` 字段和 README 均要求 v22+。
- **better-sqlite3（v12.6.2）**：持久化依赖。内嵌 SQLite，native 模块，需 node-gyp 编译。不可替换为其他数据库（当前不支持外置数据库配置）。
- **express（v4.18.2）**：HTTP 后端框架。
- **ws（v8.14.2）**：WebSocket 服务器。
- **node-pty（v1.2.0-beta.12）**：交互式终端。native 模块，需编译环境。
- **@anthropic-ai/claude-agent-sdk（v0.3.165）**：Claude Code Provider SDK。Agent 运行时依赖，用户需自行安装和认证 Claude Code。
- **@openai/codex-sdk（v0.144.0）**：Codex Provider SDK。Agent 运行时依赖，用户需自行安装和认证 Codex。
- **Provider CLI**：Claude Code CLI、Cursor CLI、Codex CLI 等需用户自行安装和认证。CloudCLI 不包含这些 CLI。
- **React 18 / Vite / Tailwind CSS / CodeMirror / xterm.js**：前端构建和 UI 依赖。
- **Electron（v38.0.0）**：可选的 Desktop App 依赖。仅在构建桌面应用时需要。

影响安装和运行的关键依赖为 Node.js v22+、better-sqlite3（native 编译）和 node-pty（native 编译）。Provider SDK 和 CLI 是 Agent 运行时依赖，非 CloudCLI 自身构建依赖。Desktop App 通过预编译 Local Server Runtime 消除 native 编译摩擦。

### 接口形态

- **Web UI（HTTP）**：主要用户界面，浏览器访问 `http://localhost:3001`（默认端口）。支持聊天、文件浏览、Git、Shell、MCP 管理、插件管理、设置。
- **REST API（自托管）**：`/api/*` 路由，受 API Key 和 JWT 认证。支持项目管理、会话管理、文件操作、Git 操作、Provider 模型查询（`GET /api/providers/:provider/models`）等。
- **REST API（CloudCLI Cloud）**：`https://cloudcli.ai/api/v1`，`X-API-KEY` 认证。支持 environments 管理、Agent 执行等。
- **WebSocket**：`/ws`（chat）、`/shell`（PTY）、`/plugin-ws/:name`（插件代理）、Browser Use viewer 代理。
- **CLI**：`cloudcli` 命令，支持 `start`、`status`、`update`、`help`、`version`、`--port`、`--database-path`。
- **Plugin RPC**：插件前端通过 `api.rpc(method, path, body?)` 调用插件后端 HTTP 端点，由 CloudCLI 代理并注入认证。
- **Plugin WebSocket**：`/plugin-ws/:name` 代理到插件后端 WebSocket 服务器。
- **调度接口**：不存在。没有任务提交、领取、状态查询或依赖管理接口。

### 持久化方式

- **SQLite（better-sqlite3）**：内嵌式关系型数据库，零配置。存储 users、api_keys、credentials、projects、sessions、app_config、notification_preferences、vapid_keys、push_subscriptions、scan_state。所有表均为元数据索引，不包含调度状态。
- **Provider 原生文件**：`~/.claude` 目录下的 JSONL 会话文件、`.mcp.json`（Claude）、TOML（Codex）、JSON（Cursor/Gemini）、JSON/JSONC（OpenCode）等 Provider 原生配置。CloudCLI 读取和写入这些文件，但不拥有其内容。
- **插件本地文件**：cloudcli-cron 使用 `~/.cloudcli-workspace-scheduled-prompts/` 下的 JSON ledger。task-queue 读取 `~/.claude/task-queue/` 下的 YAML。这些是插件独立存储，不由 CloudCLI 数据库管理。
- **构建产物**：`dist/`（前端构建）和 `dist-server/`（后端编译）。由 `npm run build` 生成。

状态所有权：CloudCLI 数据库拥有用户、API Key、Project 索引、Session 索引、设置等元数据。Provider 原生文件由 Provider CLI/SDK 拥有和管理。插件存储由各自插件拥有。不存在调度状态的持久化所有权问题——因为不存在调度状态。

### 通信方式

- **用户与 CloudCLI**：HTTP/HTTPS（REST API 和 Web UI）+ WebSocket（chat 和 shell）。
- **CloudCLI 与 Provider**：进程内通信。Provider SDK 或 CLI 作为子进程 spawn，通过 SDK 回调或 stdio 接收事件流。
- **CloudCLI 与插件后端**：HTTP（RPC 代理）+ WebSocket（`/plugin-ws/:name` 代理）。插件后端作为受管理的 Node.js 子进程运行，通过 stdout JSON ready signal 报告就绪状态和端口。Secrets 以 per-request HTTP header 注入，不作为环境变量持久化。
- **CloudCLI Cloud**：用户通过 HTTPS 访问 `cloudcli.ai` 域名。SSH 访问云端 environment。REST API 通过 `X-API-KEY` 认证。
- **WebSocket 断线恢复**：chat 和 shell 支持 replay buffer 重连。进程重启后 replay buffer 丢失，Session 从 Provider 原生 JSONL 重新索引。

### 部署形态

#### 工作机安装（Windows / macOS）

**macOS 安装方式与入口**：

- 方式一：`npx @cloudcli-ai/cloudcli` 或 `npm install -g @cloudcli-ai/cloudcli && cloudcli`。要求 Node.js v22+、Xcode Command Line Tools（native 模块编译）。
- 方式二：下载 CloudCLI Desktop dmg 安装包。Desktop App 自动下载匹配的 Local Server Runtime，无需手动安装 Node.js。
- 运行后通过浏览器访问 `http://localhost:3001` 或 Desktop App 界面。
- 权限：无需 sudo（除非绑定 80 端口）。node-pty 和 better-sqlite3 需要 native 编译。
- 网络：出站 HTTPS 到 Provider API 端点（Anthropic/OpenAI）。入站端口 3001（默认）。
- 卸载：`npm uninstall -g @cloudcli-ai/cloudcli` 或删除 Desktop App。

**Windows 安装方式与入口**：

- 方式一：`npx @cloudcli-ai/cloudcli` 或 `npm install -g @cloudcli-ai/cloudcli && cloudcli`。要求 Node.js v22+、Visual Studio Build Tools（native 模块编译）。
- 方式二：下载 CloudCLI Desktop nsis 安装包。Desktop App 自动下载匹配的 Local Server Runtime。
- 运行后通过浏览器访问 `http://localhost:3001` 或 Desktop App 界面。
- 权限：无需管理员权限（除非绑定 80 端口）。
- 网络：同 macOS。
- 卸载：同 macOS。

两个平台安装方式一致，无功能差异。npm 自托管方式存在 native 模块编译摩擦（better-sqlite3 和 node-pty），Desktop App 通过预编译 Runtime 消除这一摩擦。

#### 主体功能运行位置

- 自托管方式下，全部主体功能运行在用户本地 Node.js 进程中。Express 后端、SQLite 数据库、WebSocket 服务器、Provider SDK 调用均在本地执行。
- CloudCLI Cloud 是独立的托管服务，自托管方式不调用其任何 API。
- Desktop Companion App 是本地增强，可启动本地 CloudCLI 服务器或打开 CloudCLI Cloud 环境。
- Local 优先适配判断：**自托管完整匹配，无云端强依赖选型缺陷**。最小部署成本为 `npx @cloudcli-ai/cloudcli` + Node.js v22+。

#### 云端形态

CloudCLI Cloud 是可选的托管增值服务：

- **职责**：提供隔离的容器化开发环境，关闭笔记本后 Agent 继续运行。
- **核心组件**：每个 environment 是隔离的容器化 workspace，拥有独立 subdomain、SSH 访问、`/workspace/` 目录和预装 IDE。
- **REST API**：`https://cloudcli.ai/api/v1`，`X-API-KEY` 认证。支持 environments 管理和 Agent 执行。
- **数据边界**：使用 CloudCLI Cloud 时，代码和会话数据存储在云端容器中，离开用户工作机。
- **费用**：起价 €7/月，使用用户自有 AI 订阅。
- **自托管与 Cloud 关系**：自托管的 CloudCLI UI 是 CloudCLI Cloud 的开源 UI 层。自托管不依赖 CloudCLI Cloud 的任何 API 或服务。

## 未决项与证据边界

### cloudcli-cron 插件的调度能力边界为已确认的非 Stateful 定时器

cloudcli-cron（grostim/cloudcli-cron）是第三方 CloudCLI 插件，提供 workspace 级定时 prompt 执行。其已知限制明确声明：不支持 cron 语法、不支持外部通知、不支持与宿主 chat 会话集成、定时执行启动全新 CLI 进程不继承当前会话上下文。自动执行仅在 scheduler grace window 内的到期任务才触发；超时未执行标记为 missed，不补执行。这是 cron 式定时器，不是 Stateful 调度——不存在持久化任务队列、不存在原子抢占（单进程串行）、不存在租约超时回收、不存在失败转交。

合理推导：即使 cloudcli-cron 未来增加 cron 语法和通知能力，其架构范式仍是定时器+CLI 进程启动模式，不会演变为 Stateful 调度，因为它不持久化任务依赖关系、不做调度决策、不负责 Agent 连续性。

### task-queue 插件依赖外部 task-queue-mcp 服务，其调度能力取决于该外部服务

task-queue（TadMSTR/cloudcli-plugin-task-queue）是第三方插件，提供 `~/.claude/task-queue/` 目录下 YAML 任务文件的查看和启动界面。插件后端代理到 `localhost:8485` 的 task-queue-mcp 服务。task-queue-mcp 是独立的外部 MCP 服务，不在 CloudCLI 仓库中，其任务模型、状态机和调度能力未被本调研覆盖。插件本身是查看器和启动器，不拥有调度状态。

合理推导：task-queue-mcp 可能具备一定的任务管理能力（YAML 任务文件、agent 映射、review/auto 启动模式），但即使如此，其调度状态存储在 YAML 文件和外部 MCP 服务中，不由 CloudCLI 拥有或管理。CloudCLI 在此仅充当 UI 壳。

### TaskMaster AI 集成为第三方独立工具，其调度能力不属于 CloudCLI

CloudCLI 支持可选的 TaskMaster AI（eyaltoledano/claude-task-master）集成。TaskMaster AI 是独立的任务管理 CLI 工具，拥有自己的 tasks.json 存储、CLI 命令、MCP server 和 VS Code 扩展。CloudCLI 在 Settings 中提供启用入口和 legacy TaskMaster 路由，但 TaskMaster 的任务模型、依赖管理、AI 任务分解和 PRD 解析能力均属于 TaskMaster 自身，不属于 CloudCLI。TaskMaster 的调度能力需作为独立产品单独调研。

### 历史安全漏洞已修复但需关注供应链风险

@siteboon/claude-code-ui（旧包名）曾存在 CVE-2026-31862 安全漏洞，已在 v1.25.0 修复。当前包名 `@cloudcli-ai/cloudcli`（v1.37.0）为最新版本。历史漏洞表明供应链安全需持续关注，但不影响当前版本的调度能力判断（因不存在调度能力）。

## 后续验证建议

1. **确认 cloudcli-cron 插件的 grace window 和 missed 处理机制**：阅读 cloudcli-cron 源码，验证 scheduler grace window 的具体时长、missed 标记的条件和 Retry 的实现方式。这不影响"非 Stateful 调度"的结论，但有助于评估定时执行的可靠性边界。

2. **调研 task-queue-mcp 外部服务**：定位 task-queue-mcp 的源码或文档，确认其任务模型、状态机、YAML schema 和调度能力。这是判断 CloudCLI 生态是否间接提供 Stateful 调度的必要步骤。当前证据指向 task-queue-mcp 是独立外部服务，其调度能力不属于 CloudCLI。

3. **独立调研 TaskMaster AI**：TaskMaster AI（eyaltoledano/claude-task-master）作为 CloudCLI 的可选集成，是独立的任务管理工具。其是否具备 Stateful 调度能力需作为独立产品单独调研，不属于本 WORKSHOP 范围。

4. **追踪 CloudCLI 插件生态演进**：CloudCLI 的插件系统允许第三方扩展添加自定义 tab 和后端服务。追踪是否有新的调度相关插件出现（如 DAG 编排、持久化任务队列、Agent 连续性管理等），评估生态是否向调度方向演进。

5. **验证 CloudCLI Cloud Agent API 的执行语义**：CloudCLI Cloud REST API 允许通过 `POST` 触发 Agent 执行。验证其是否支持任务排队、状态追踪、失败重试或并发控制——如果支持，可能暗示云端具备一定的任务管理能力，但这是 CloudCLI Cloud 的托管服务能力，不属于自托管 CloudCLI UI。
