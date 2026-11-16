# ORG-2 技术产品调研

> updated_by: Codex - GPT-5
> updated_at: 2026-07-22 23:40:19
> evidence_window: 2026-07-22；`develop` 分支、稳定版 v1.2.0、GitHub 仓库与公开 Issue 快照

## 交付结论

1. **符合本 RUNBOOK 的核心要求。** ORG-2 当前提供 Windows x64 的 EXE/MSI 和 macOS Apple silicon 的 DMG；Agent runtime、CLI 子进程、工作区文件、Shell/Git/LSP/浏览器工具和会话持久化均位于工作 PC。
2. **产品定位**：ORG-2（仓库和部分文档也写作 ORGII/ORG-II）是开源、local-first 的 Agent IDE。它把内置 Rust Agent、多种外部 coding-agent CLI、完整开发工作区、会话直播/回放、跨会话记忆、AI blame 和团队审查放在一个 Tauri 桌面应用中。
3. **主体架构是“React UI + Tauri IPC + 本地 Rust backend + 本地 Agent/工具”。** 内置 `agent-core` 在本机执行 Agent 循环；外部 CLI 由本地适配器启动并通过标准输入输出管理。模型推理、GitHub/MCP 等集成仍需网络，但云端不承载个人模式的主体工具执行。
4. **v1.2.0 的云协作仍保持 owner-local 执行。** 组织、授权、分享、评论和部分同步状态由 managed backend 管理；官方架构文档明确没有 cloud task/lease/claim plane，Agent follow-up 进入 session owner 的本地队列，使用 owner 本地认证的账号和模型。
5. **本地权限面较大。** 桌面应用可递归读写用户 Home、启动 Shell/CLI、打开任意路径、访问网络并管理 Git/终端/LSP；这是 IDE 和 Agent 工作所需能力，也意味着必须用专用工作区、最小权限凭据和人工审批约束 Agent。
6. **当前平台不是全架构覆盖。** v1.2.0 只有 Apple silicon DMG，没有 Intel Mac 资产；Windows 只有 x64。Computer Use 目前仅支持 macOS，Windows 能运行主体产品但功能不完全对称。
7. **维护非常活跃，但产品仍年轻。** 仓库创建于 2026-06-01，2026-07-22 已发布 v1.2.0；同日仍有提交和 Issue 更新。高频发布说明迭代快，也伴随 Windows 兼容、内存、状态同步和长任务控制等未闭合问题。
8. **采用前需实机验证安装与卸载。** 官方提供预构建安装包和自动更新，但未明确最低 Windows/macOS 版本、签名/公证、管理员权限和完整卸载流程；移除应用后 `~/.orgii`、工作区和外部 CLI 配置是否保留需人工确认。

## 调研目标、范围与边界

### 调研目标

理解 ORG-2 如何把 Agent 当作可观测、可回放和可追责的本地开发同事，并判断它能否在 Windows/macOS 工作机上安装，以本地 PC 为主体运行。

### 核心问题

- ORG-2 的目标用户、核心流程和功能边界是什么？
- Windows/macOS 的当前安装资产、架构、依赖、权限、更新与卸载边界是什么？
- 内置 Rust Agent、外部 CLI、Tauri 桌面应用和开发工作区如何协作？
- Agent 会话、凭据、设置、项目和回放数据保存在哪里？
- managed cloud collaboration 是否把主体 Agent 执行迁移到云端？
- 当前版本演进、维护活跃度和公开反馈反映了什么？

### 覆盖范围

- `develop` 分支的中英文 README、Getting Started、架构说明和安全策略。
- v1.2.0 Release、仓库元数据、近期稳定版本说明和公开 Issue 抽样。
- 为验证运行边界而定点读取 Tauri 配置、权限清单、数据路径与 Rust crate 说明。
- Windows x64 与 macOS Apple silicon 的终端用户安装；源码开发依赖只用于区分开发与正式安装。

### 明确排除

- 不做竞品比较、选型矩阵或优劣排名。
- 不下载、安装、编译或运行 ORG-2，不安装任何依赖。
- 不连接真实模型账号、API Key、GitHub、MCP、Slack 或 ORG2 Cloud。
- 不做源码审计、遥测调查、性能 benchmark 或安全审计。
- 不穷举 CLI、命令、数据库表、Tauri command、权限项或第三方依赖。
- 不调查 managed backend 的服务端实现、扩缩容、高可用或 SLA。

## 证据口径

- **README 与用户文档**用于确认定位、功能、安装入口和公开承诺；与 Release 资产冲突时，以证据窗口内实际 Release 为准。
- **Release API**用于确认当前稳定版、发布时间、包格式、CPU 架构和方向性变更。
- **维护中的架构文档**用于确认组件职责、核心链路、云协作和本地/云端边界。
- **定点配置与源码**只回答数据目录、Tauri 权限和更新通道三个关键问题，不扩展为实现审计。
- **GitHub 元数据与 Issue**只描述 2026-07-22 的公开快照；Star、Fork、Issue 数和个案不直接等同质量或采用率。
- **未实机验证项**一律标记为未决，不将文档描述外推为运行表现。

主要证据入口：

- [中文 README（develop）](https://api.github.com/repos/yorgai/ORG2/contents/docs/readmes/README.zh.md?ref=develop)
- [仓库元数据](https://api.github.com/repos/yorgai/ORG2)
- [v1.2.0 Release](https://api.github.com/repos/yorgai/ORG2/releases/tags/v1.2.0)
- [Getting Started](https://api.github.com/repos/yorgai/ORG2/contents/docs/contributing/wiki/Getting-Started.md?ref=develop)
- [Architecture Overview](https://api.github.com/repos/yorgai/ORG2/contents/docs/contributing/wiki/Architecture-Overview.md?ref=develop)
- [Rust Crates Architecture](https://api.github.com/repos/yorgai/ORG2/contents/docs/architecture/rust-crates.md?ref=develop)
- [Managed Cloud Collaboration](https://api.github.com/repos/yorgai/ORG2/contents/docs/architecture/managed-cloud-collaboration.md?ref=develop)
- [Tauri 配置](https://api.github.com/repos/yorgai/ORG2/contents/src-tauri/tauri.conf.json?ref=develop)
- [本地数据路径](https://api.github.com/repos/yorgai/ORG2/contents/src-tauri/crates/app-paths/src/lib.rs?ref=develop)
- [桌面能力与权限](https://api.github.com/repos/yorgai/ORG2/contents/src-tauri/capabilities/default.json?ref=develop)
- [安全策略](https://api.github.com/repos/yorgai/ORG2/contents/SECURITY.md?ref=develop)

## 产品调研

### 产品定位与目标用户

ORG-2 是面向本地开发工作流的 Agent IDE，同时也是“人类/Agent 组织”实验。它关注的不只是更快生成代码，而是让 Agent 的会话、工具调用、文件编辑、命令输出和决策轨迹能够被直播、回放、审查和追责。

目标用户主要包括：

- 同时使用 Codex、Claude Code、Cursor CLI、OpenCode 等多个 Agent 工具，希望统一管理本地会话的开发者。
- 希望审查完整 Agent 轨迹而不仅是最终 diff 的工程团队和技术负责人。
- 需要在同一桌面工作区中完成 Agent 对话、终端、Git、代码查看、浏览器与数据库操作的开发者。
- 希望保留跨会话记忆、任务时间线、Agent provenance 和 AI blame 的团队。
- 需要在设备或成员间分享会话，同时仍让代码执行留在 session owner 工作机的组织。

### 核心流程

1. 用户在 Windows x64 或 Apple silicon Mac 安装 ORG-2 并启动 Tauri 桌面应用。
2. 首次引导进入 Key Vault，用户配置模型 API Key、订阅账号或已有 CLI Agent。
3. 用户选择本地仓库/工作区，创建 CLI Agent session 或内置 Rust Agent session。
4. React 前端通过 Tauri IPC 将消息交给本地 Rust backend。
5. Rust backend 在进程内运行 `agent-core`，或启动外部 CLI 子进程并管理其 stdin/stdout/stderr。
6. Agent 调用本地文件、Shell、Git、LSP、浏览器、数据库、MCP 或可选容器工具；模型请求与外部集成跨网络完成。
7. 工具事件、消息、文件编辑和命令输出被标准化、流式返回 UI 并写入本地事件存储，以支持继续、回放、审查和 AI blame。
8. 用户在 WorkStation 查看代码、终端、diff、Git 历史、浏览器和 PR，并对 Agent 工作进行人工复核。
9. 可选云协作模式把组织、分享、评论、项目/Work Item 同步到 managed backend；真正的后续 Agent 执行仍由 owner 本地 runtime 发起。

### 功能地图与边界

**当前公开能力：**

- **Agent runtime**：内置 Rust Harness/SDE Agent/OS Agent，以及大量外部 coding-agent CLI。
- **会话治理**：会话导入、直播、回放、subagent 查看、跨 Agent provenance、AI blame 与使用/成本视图。
- **开发工作区**：代码查看与编辑、终端、Git、diff、PR、LSP、浏览器、数据库和 Artifact。
- **本地状态**：跨会话记忆、Skill、MCP、自动化、工作区状态、时间线和项目/Work Item。
- **自动执行**：调度、自动启动、通宵任务、资源感知执行与长任务取消。
- **协作**：组织、成员、直接分享、链接分享、评论、presence、Projects、Work Items 和本地优先同步。
- **扩展工具**：GitHub、Slack、Linear、Jira、外部数据库、MCP、浏览器和可选 Computer Use。

**边界与约束：**

- Windows 只有 x64 安装资产；macOS 当前稳定版只有 Apple silicon。
- Computer Use 当前仅支持 macOS；Browser Use 依赖可选 `agent-browser` helper。
- 模型推理并不离线：用户必须配置可用 API Key、订阅账号或本地模型/provider。
- 外部 CLI 的能力、登录、限额和兼容性由各自工具共同决定，ORG-2 负责启动、解析与统一呈现。
- 云协作不是个人本地模式的必需执行层，但组织身份、授权、分享和评论以 managed backend 为权威。
- 应用具备广泛本地文件与进程权限，不能把 local-first 等同于沙箱安全。

### 维护状态与版本演进

- **仓库起点**：仓库创建于 2026-06-01，默认分支为 `develop`，采用 AGPL-3.0-or-later。
- **v1.1.22（2026-07-14）**：扩展外部会话导入、WorkStation/工作树入口、对话状态和更新可靠性。
- **v1.1.23（2026-07-15）**：加入跨 Agent Session Blame/provenance、更多历史来源、secret scanning 和工作区整合。
- **v1.1.24（2026-07-15）**：降低空闲 CPU，加入可配置自动更新及安装/重启确认，修复会话 UI 与凭据异常体验。
- **v1.2.0（2026-07-22）**：发布 managed cloud collaboration、原生 CLI transcript/审批、更多历史来源、使用成本面板、性能与会话状态修复。
- **当前稳定版**：v1.2.0，2026-07-22 发布；同日 `develop` 仍有提交，仓库未归档。
- **安全支持策略**：只有最新发布版本接收安全补丁，旧版本明确不支持。

中文 README 仍写 v1.1.24（2026-07-16），英文 README 已更新到 v1.2.0。版本判断应以 Release 与当前英文 README 为准，这也说明多语言文档存在短暂同步滞后。

### 生态与公开反馈

- **Agent 生态**：内置 Rust runtime，并连接 Codex、Claude Code、Cursor、Copilot、OpenCode、Kiro、Amp 等 GUI/TUI 工具。
- **工具生态**：MCP、Skill、GitHub、Slack、Linear、Jira、外部数据库、LSP、Browser Use 和 Computer Use。
- **社区入口**：GitHub Issues、Discord 和微信入口；安全问题通过私密邮箱上报。
- **公开快照**：2026-07-22 约 2,221 Star、125 Fork、55 个 open issues；这些数字不代表产品质量或实际活跃用户数。
- **近期 Issue 主题**：Windows 命令兼容、WebContent/RAM 与空闲资源、跨 session 状态泄漏或同步、长运行工具取消、模型输出循环和 LSP 新鲜度。
- **证据边界**：样本来自近期公开 Issue，部分标题本身以修复任务形式提交；只能说明维护者正在处理这些方向，不能推断普遍发生率。

## 技术架构调研

### 系统全貌与运行形态

```text
Windows/macOS ORG-2 桌面应用（Tauri v2）
  React / TypeScript UI
        |
        | Tauri IPC + events
        v
  本地 Rust backend
    +-- 内置 agent-core 执行循环
    +-- 外部 CLI Agent 子进程与输出解析
    +-- 文件 / Shell / Git / LSP / Browser / DB / Container
    +-- SQLite / Key Vault / Settings / Replay artifacts
        |
        +-- 模型 Provider / MCP / GitHub / 其他外部服务
        +-- 可选 ORG2 managed cloud（组织、分享、评论、同步）
```

这是桌面原生组合应用，不是浏览器内远程运行 IDE。Tauri 是本地 Shell，Rust backend 负责 Agent 进程、文件 I/O 和系统集成，React 负责交互与可视化。

### 主要组件与职责

- **React Frontend**：Session Creator、Chat、WorkStation、代码/diff、终端、浏览器、数据面板和组织管理 UI。
- **Tauri IPC/Event Boundary**：连接 TypeScript 与 Rust，承载命令调用和执行事件回传。
- **Rust App Backend**：应用生命周期、窗口、深链、托盘、本地服务、Agent session 与工具资源管理。
- **`agent-core`**：内置 Agent 的 provider 抽象、上下文、工具注册、turn loop、记忆、Skill、MCP、自动化和 channel 集成。
- **CLI Adapters**：启动并管理外部 Agent 进程，将各自输出解析成统一消息、工具调用、编辑和状态事件。
- **Local Tooling**：文件、PTY/Shell、Git、搜索、LSP、浏览器、数据库和可选 OCI 容器。
- **Local Persistence**：会话 SQLite、项目 SQLite、设置、凭据、回放、截图、索引、模型和 sidecar。
- **External Services**：模型/provider、GitHub/MCP/协作集成、GitHub Release 更新通道，以及可选 managed cloud。

### 核心技术链路

#### 内置 Rust Agent

1. 用户在 ChatPanel 提交消息。
2. 前端通过 Tauri IPC 调用本地 Agent command。
3. `agent-core` 组合上下文并向已配置 provider 发起模型请求。
4. Agent 在本机调用文件、Shell、Git、搜索、LSP、浏览器等工具。
5. 事件通过 Tauri event stream 回到前端，同时写入本地 SQLite 和回放存储。
6. 用户在 WorkStation 观察、暂停、继续和审查结果。

#### 外部 CLI Agent

1. 用户选择已安装或已配置的 CLI Agent。
2. Rust adapter 在本机工作区启动子进程并管理 stdin/stdout/stderr。
3. 对应 parser 将 CLI 原生 transcript 转换成统一事件。
4. ORG-2 展示实时状态并持久化事件，使不同来源可以统一回放和追责。

#### 云协作

1. Project/Work Item 变更先与本地 SQLite outbox 原子提交。
2. Sync engine 将符合条件的操作推送到 managed backend，并通过 Realtime 接收失效或收敛信号。
3. Backend 对组织成员、角色、策略、授权、邀请、所有权和删除保持权威。
4. `@agent` follow-up 只允许原 cloud session owner 触发，随后进入 owner 的本地 send queue。
5. Owner 本地账号、模型和工作区执行实际 Agent 工作，结果再回写共享会话。

这条链路证明云端承担协作控制面和同步面，而不是主体 Agent 计算面。

### 主要依赖

**终端用户运行依赖：**

- Windows x64 或 Apple silicon Mac；官方未给出最低 OS 版本。
- 安装后的 Tauri/WebView 系统运行环境及网络连接。
- 至少一个可用模型 API Key、订阅账号、CLI Agent 或本地 provider。
- 本地 Git、语言 runtime、构建工具和项目依赖按具体工作区任务提供。
- Browser Use/Computer Use 可能需要额外 sidecar；Computer Use 仅 macOS。

**源码开发依赖，不应混为用户前置：**

- Node.js 20、pnpm 9+、Rust 1.85+、Tauri v2 系统依赖。
- 可选 sidecar 下载脚本需要 Python 3；macOS 源码构建还需要 Xcode Command Line Tools 和 CMake。

预构建 EXE/MSI/DMG 已包含 ORG-2 应用本体，不应要求普通用户安装上述开发工具。

### 接口与通信形态

- **Tauri IPC**：前端调用文件、Agent、session、repo、diff 和原生系统命令。
- **Tauri events**：本地 Agent 状态、消息和工具事件流式回传 UI。
- **进程 stdio**：Rust adapters 与外部 CLI Agent 交换输入、输出和审批。
- **本地 HTTP/REST**：部分 Git/Search 能力通过 Axum router 暴露到共享本地 listener；默认网络暴露范围需实机确认。
- **WebSocket/SSE**：用于 Agent streaming、任务执行、LSP 与 managed cloud Realtime 等场景。
- **文件与 SQLite**：本地工作区、设置、会话、项目、回放和缓存。
- **外部 HTTPS/OAuth**：模型 provider、GitHub、MCP/集成、云协作登录与 GitHub Release 更新。

### 持久化方式

默认本地数据根目录为 `~/.orgii`，主要包含：

- `credentials.json`：本地加密 Key Vault 的 provider key 与账号信息。
- `sessions.db`：会话事件、CLI 状态、inbox、lineage、orchestrator 状态和 Agent session 数据。
- `projects/projects.db`：Project 与 Work Item，本地优先同步时同时承担 durable outbox。
- `settings.jsonc`：可由用户或 Agent 编辑的设置。
- `shell-replays/`：Shell 回放数据。
- `session-provenance/`：外部 Agent hook inbox、状态 endpoint 与缓存。
- `screenshots/`、`semantic_index/`、`models/`、`extensions/`、`bin/` 等工具数据。
- 用户选择的本地 Git 工作区及外部 CLI 自身的历史和配置。

云协作模式还会把组织身份、授权、分享、评论和同步实体保存到 managed backend；本地 alias 和 cache 不取代云端授权权威。因此不能把所有 ORG-2 数据都概括为“只在本机”。

### 权限与安全边界

当前 Tauri capability 允许主应用：

- 递归读取和写入 Home，并创建、删除、重命名和监听文件。
- 启动 Shell/CLI 进程，并执行允许的 `sh`、`curl`、`python3` 命令入口。
- 打开任意路径和 HTTP/HTTPS URL。
- 创建 WebView/窗口、发送通知、进行 OAuth、深链和自动更新。

此外，Agent runtime 本身提供 Shell、Git、浏览器、数据库、MCP 和外部服务工具。配置属于桌面能力上限，不代表每次 Agent 调用都自动执行；但正式使用前必须验证审批、deny 规则、工作目录隔离和敏感路径保护。

Key Vault 文档声明密钥加密保存在本机且不发送到 ORG-2 服务器；模型 provider 或用户主动配置的外部工具仍会按自身协议接收凭据或数据。该结论不等同于独立安全审计。

## 部署形态

### Windows 工作机

- **支持范围**：v1.2.0 提供 Windows x64，没有 arm64 安装资产。
- **安装方式**：可选择约 41 MB 的 `ORG2-latest-windows-x64-setup.exe` 或约 52 MB 的 MSI。
- **运行入口**：安装后启动 ORG-2 桌面应用；首次引导配置 provider/CLI，再选择本地工作区启动 Agent。
- **依赖**：网络、模型/CLI 账号和项目本身工具链；官方没有列出额外终端用户 runtime。
- **权限**：需要本地文件、子进程、终端、Git 和网络访问；安装是否需要管理员权限未公开。
- **更新**：Tauri updater 指向 GitHub Latest 的 `latest.json`；v1.1.24 起提供安装/重启前确认。
- **卸载**：未发现官方完整卸载说明。需人工验证 Windows“已安装的应用”或 MSI 卸载是否移除后台资源，并单独处理需保留或删除的 `~/.orgii` 与工作区数据。

### macOS 工作机

- **支持范围**：v1.2.0 只提供 Apple silicon DMG，没有 Intel DMG。
- **安装方式**：下载约 48 MB 的 `ORG2-latest-mac-apple-silicon.dmg`，按安装器界面安装并启动。
- **文档漂移**：Getting Started 仍列出 Intel DMG，但当前 README 下载区和 v1.2.0 Release 都没有该资产；不能据此声称 Intel Mac 当前受支持。
- **依赖**：网络、模型/CLI 账号、项目工具链；Browser/Computer Use 的可选 helper 可能在运行时进入 `~/.orgii/bin`。
- **权限**：普通 IDE 能力需要本地文件、进程、Git 和网络；Computer Use 涉及 macOS 屏幕自动化，但官方入口没有完整列出 Screen Recording/Accessibility 等首次授权流程。
- **更新**：v1.2.0 同时提供 updater tarball，桌面 updater 从 GitHub Release 通道检查和安装。
- **卸载**：未发现官方完整卸载说明。删除应用通常不会自动证明 `~/.orgii`、sidecar、索引、凭据和会话数据已清理，需人工验收。

### 主体功能运行位置

主体功能运行在 Windows/macOS 工作 PC：

- Tauri 桌面程序和 Rust backend 在本机运行。
- 内置 Agent turn loop 和外部 CLI 子进程在本机运行。
- 文件修改、Shell、Git、LSP、数据库、浏览器工具和可选容器在本机或用户明确连接的外部资源上运行。
- 会话事件、项目数据、设置、凭据和回放默认保存在本地 `~/.orgii`。

模型推理通常需要外部 provider，managed cloud 可提供协作控制面，但这两者都没有把本地工作区的主体工具执行迁移到云端。因此 ORG-2 **符合“主体工作必须在 PC”要求**。

### 云端与外部服务

- **模型层**：Anthropic、OpenAI、Cursor 等 provider 或用户配置的代理/本地模型。
- **开发集成**：GitHub、MCP、Slack、Linear、Jira、外部数据库等。
- **更新通道**：GitHub Releases。
- **managed cloud**：组织身份、角色、分享授权、评论、Projects/Work Items 同步和 Realtime 通知。

managed cloud 超出简单认证网关，但不是 Agent 执行主体。报告只说明客户端边界与数据职责，不调查其服务端部署。

## 未决项与证据边界

- Windows 与 macOS 的最低系统版本未公开。
- 当前没有 Windows arm64 或 Intel Mac 稳定版安装资产。
- EXE/MSI/DMG 的签名、公证、SmartScreen/Gatekeeper 行为和管理员权限未实机验证。
- Windows/macOS 完整卸载、自动启动项、后台进程和数据清理流程未公开。
- Tauri capability 展示应用能力上限，实际 Agent 审批与权限规则的默认行为仍需运行确认。
- Key Vault 加密实现、系统钥匙串使用、密钥轮换和删除传播未做安全验证。
- 本地 HTTP listener 的绑定地址、鉴权和端口冲突行为未实机确认。
- `v1.2.0` 与 managed cloud 在证据窗口当天发布，长期稳定性和跨设备收敛尚缺少时间样本。
- 中文 README 版本号落后，Getting Started 的 Intel Mac 说明与当前 Release 不一致。
- 公开 Issue 是有限样本，不能据此推断缺陷率、采用率或总体口碑。

## 后续验证建议

1. 在 Windows 11 x64 与 Apple silicon macOS 测试机安装 v1.2.0，核对签名、公证、安装目录、进程、端口、首次启动、系统权限和空闲资源；这是人工验收。
2. 使用隔离测试仓库和低权限 provider 账号，分别跑通内置 Rust Agent 与一个外部 CLI 的“读文件 → 修改 → Shell 测试 → Git diff → 回放 → AI blame”闭环。
3. 验证默认审批策略、Home 范围访问、敏感文件保护、Shell/MCP/Browser 工具授权，以及取消长运行任务后的子进程清理。
4. 检查 `~/.orgii` 的实际内容、权限、增长、导出/备份、删除和凭据清理，确认卸载应用后的残留策略。
5. 在断网、provider 限流、桌面重启、自动更新和 CLI 进程异常场景下，验证 session 恢复、SQLite 一致性和回放完整性。
6. 如需团队协作，再单独测试 managed cloud 的登录、直接分享、链接撤销、评论、本地 fork、离线 outbox、冲突和删除传播，确认云端数据范围符合组织要求。
