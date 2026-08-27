# Open Relay (oly) 技术产品调研

> updated_by: Qoder - Claude
> updated_at: 2026-07-30 18:30:00
> evidence_window: 2026-07-30；GitHub 仓库 slaveOftime/open-relay main 分支快照；最新 Release v0.3.1（2026-05-31）

## 交付结论

1. **符合"主体工作在 PC"要求**：oly 是纯本地运行的 Rust 单二进制（CLI + 守护进程一体），会话管理、PTY 托管、持久化、Web UI 全部在本机完成，**不存在任何官方云端服务**——连"云端网关"都没有，远程访问由用户自备隧道（Cloudflare Access / Tailscale / SSH 隧道）实现。
2. **符合 Windows / macOS 工作机要求**：官方每个 Release 均发布 `oly-windows-amd64.zip` 和 `oly-macos-arm64.zip` 预编译产物，并支持 npm（`npm i -g @slaveoftime/oly`，包内直接捆绑各平台二进制）、cargo、Homebrew 安装。注意 macOS 仅提供 Apple Silicon（arm64）产物，Intel Mac 用户需 cargo 源码安装（推导）。
3. **产品本质**：面向 AI 编码代理（Copilot CLI、Claude Code、Gemini CLI 等）和长时交互式 CLI 的"会话托管层"——类似 tmux/screen 的守护化 PTY 管理，但增加了输入检查点检测（`--wait-for-prompt`）、免附着注入输入（`oly send`）、Web UI 远程监督和多机联邦（federation）能力。
4. **维护状态活跃但社区规模小**：2026-03 创建，约 5 个月内发布 12+ 个版本（v0.1.x→v0.3.1），最近推送为调研当日（2026-07-30）；但 89 stars / 10 forks / 0 open issues，开发几乎由单一作者（albertwoo）+ GitHub Copilot 代理驱动，属早期单人项目，存在维护延续性风险。
5. **多机场景无需云端**：联邦（federation）为"主守护进程 ↔ 从节点守护进程"的直连 WebSocket + API key 认证，均运行在用户自己的机器上，无第三方中继。

## 调研目标、范围与边界

### 调研目标

评估 open-relay（oly）作为 Agent 基础设施候选，回答其产品定位、能力边界，以及能否以"主体功能在工作 PC 本地"的形态安装运行于 Windows / macOS 工作机。

### 核心问题

1. oly 是什么产品，为谁解决什么问题？
2. 主体功能是否运行在 PC 本地？是否存在云端依赖？
3. Windows / macOS 上如何安装、运行、卸载？依赖与权限要求是什么？
4. 系统架构形态：组件、通信、持久化、接口？
5. 项目维护状态与生态反馈如何？

### 覆盖范围

产品调研（定位/用户/流程/边界/维护/演进/生态）+ 技术架构调研（运行形态/依赖/接口/持久化/通信/部署）。

### 明确排除

不做源码审计、竞品比较、遥测调研、性能 benchmark；未做本机安装运行验证（相关结论标注为文档证据或未决）。

## 证据口径

- **官方资料**：README.md、SPEC.md、ARCHITECTURE.md（main 分支，2026-07-30 快照）。
- **版本记录**：GitHub Releases API（v0.2.2 ~ v0.3.1，2026-03 ~ 2026-05）。
- **仓库元数据**：GitHub Repo API（stars/forks/语言/许可证/时间戳）。
- **定点源码**：仅读取 `src/storage.rs` 一处，用于裁决 README 与 ARCHITECTURE.md 关于状态目录的矛盾。
- **社区反馈**：Issues/PRs 列表最近 20 条抽样，样本量小，仅代表公开快照。
- **已知文档矛盾**：ARCHITECTURE.md §F10/§11 记载的状态目录（`%APPDATA%\oly`）、默认端口（7703）、配置文件（config.toml）与 README/SPEC/源码不一致，判定为滞后内容；本报告以 README + SPEC.md + `storage.rs` 三方一致的口径为准（Windows `%LOCALAPPDATA%\oly`、默认端口 15443、`config.json`）。
- 未运行验证的行为性结论均标注（推导）或（未决）。

## 产品调研

### 产品定位与目标用户

**一句话定位**：oly 让长时运行的交互式 CLI（尤其是 AI 编码代理）像"被托管的服务"一样运行——启动一次、随时脱离、随时回来查看日志、按需注入输入或完全接管。

**目标用户**：
- 运行 GitHub Copilot CLI、Claude Code、Gemini CLI、OpenCode 等编码代理的开发者
- 需要监督"长时间跑但偶尔要人确认"的任务（安装、迁移、审批流）的个人/小团队
- 希望从浏览器或手机远程干预本机终端会话的单人操作者

官方明确表述"不是要替代你的终端，而是长生命周期交互式负载的监督层"（README，已确认）。

### 核心流程

用户视角的端到端流程（README Quick start，已确认）：

1. `oly daemon start --detach` 启动本机守护进程（默认同时启用密码保护的本地 Web UI/API）。
2. `oly start copilot` 以脱离模式启动一个代理会话；CLI 立即返回，会话由守护进程持有。
3. 关闭终端、下班、换设备——会话继续运行。
4. `oly logs <id> --wait-for-prompt --timeout 1m` 阻塞等待"疑似需要人工输入"的检查点（内置常见确认/密码/token 提示模式匹配）。
5. `oly send <id> "yes" key:enter` 免附着注入输入；或 `oly attach <id>` 完全接管（Ctrl-] 后按 d 脱离）。
6. `oly stop <id>` 优雅终止（SIGTERM/ConPTY 关闭，超时后强杀）。

### 功能地图与边界

| 功能域 | 能力 | 状态 |
| --- | --- | --- |
| 会话托管 | 脱离启动、守护进程持有 PTY、跨终端存活、重附着回放缓冲输出 | 已发布 |
| 检查点检测 | `--wait-for-prompt` 匹配确认/密码/shell 等提示模式 | 已发布 |
| 远程输入 | `oly send` 文本 + 命名键（enter/ctrl+c/方向键/hex 原始字节） | 已发布 |
| Web 控制面 | 本地 `127.0.0.1:15443`，React + xterm.js 浏览器终端，REST/SSE/WS | 已发布 |
| 通知 | 桌面通知、Web Push（VAPID）、自定义 notification hook 命令 | 已发布 |
| 多机联邦 | API key 认证的主/从守护进程直连，跨节点启动/查看/附着会话 | 已发布 |
| 会话回顾 | Session Review、预览缩略图（v0.3.0 引入） | 已发布 |
| Agent 集成 | `oly skill` 输出内置技能 markdown、`oly ls --json` 机器可读输出 | 已发布 |

**边界**（官方明示，已确认）：不做托管身份/认证集成，远程访问安全由用户自备网关（Cloudflare Access、Tailscale、SSH 隧道、反向代理）负责；Web/API 默认只绑 loopback。

### 维护状态与版本演进

- **活跃度**：仓库创建于 2026-03-08，最近推送 2026-07-30（调研当日）；2026-03~05 期间约每周一个 Release（v0.2.2 → v0.3.1 共 10 个版本），此后无新 Release 但 main 分支持续有合并（#104~#106，2026-06~07）。判定：**活跃维护中**（已确认，基于 API 快照）。
- **关键版本方向**：
  - v0.2.x 系列（2026-04）：终端仿真完善（DECCKM/粘贴/键位）、通知 hook、会话重启、联邦通知转发修复——打磨核心体验。
  - v0.3.0（2026-05-21）：Session Review、预览缩略图、PowerShell hook 示例——从"能跑"走向"可回顾监督"。
  - v0.3.1（2026-05-31）：可配置 HTTP bind 地址（响应用户 issue #102）。
- **发布产物**：每个 Release 稳定发布 Linux amd64 / macOS arm64 / Windows amd64 三个 zip（已确认）。
- **风险**：贡献者高度集中（albertwoo + Copilot 代理提交），组织 subscribers 为 0，属单人驱动的早期项目；长期维护延续性未决。

### 生态与反馈

- **分发生态**：npm（@slaveoftime/oly，捆绑平台二进制）、crates.io（cargo install oly）、Homebrew tap、GitHub Releases——覆盖主流开发者安装习惯（已确认）。
- **社区入口**：GitHub Issues（SUPPORT.md 指引），无 Discussions。
- **反馈抽样**（最近 20 条 Issues/PRs，样本小）：绝大多数为作者自己的功能 PR；外部用户反馈仅见 #102（无法绑定 0.0.0.0，已在 v0.3.1 通过 `--bind` 解决）。重复主题：Web UI/终端体验打磨、联邦可靠性。**样本边界**：89 stars、外部 issue 极少，无法据此判断真实采用规模；不存在可观测的规模化用户反馈。

## 技术架构调研

### 系统全貌与运行形态

单一 Rust 二进制 `oly`，两种角色（已确认，ARCHITECTURE.md + SPEC.md）：

- **CLI 模式**：`oly start/ls/attach/logs/send/stop/...`，通过本地 IPC 与守护进程通信。
- **守护进程模式**：`oly daemon start` 后常驻，拥有全部会话运行时、持久化、HTTP API/Web UI、认证与通知。

Web 前端（React + Vite + xterm.js）在 release 构建时打包进二进制（`build.rs` 触发前端构建），运行时由守护进程直接服务——**无独立前端部署物**（已确认）。

**系统边界**：全部组件运行在用户 PC 上；唯一的跨机器场景是用户自己多台机器间的联邦直连。无官方云端组件、无云端网关（已确认，README 明示远程访问自备隧道）。

### 主要组件与核心链路

组件（ARCHITECTURE.md，已确认）：

| 组件 | 职责 | 运行位置 |
| --- | --- | --- |
| oly CLI | 命令入口，IPC 客户端 | 本机前台进程 |
| oly Daemon | 会话运行时、请求路由、认证、通知 | 本机常驻进程 |
| Session Runtime | PTY 子进程、环形缓冲、广播、持久化 | Daemon 内 |
| Web UI | 浏览器终端与控制面 | Daemon 内嵌服务 |
| Secondary Node | 另一台 PC 上的 oly Daemon，向主节点注册 | 远端 PC |
| SQLite + 日志文件 | 会话元数据、API key、push 订阅；output.log/events.log | 本机状态目录 |

**核心链路 1 —— 会话托管（解释系统的主链路）**：`oly start` → IPC RPC 到 Daemon → SessionStore 生成 SessionRuntime → 用 portable_pty 派生 PTY 子进程 → 输出经转义过滤后进入环形缓冲 + 磁盘 output.log + tokio broadcast → CLI/Web 附着时先回放环形缓冲再实时流式推送 → 输入/resize 反向写入 PTY → 子进程退出后状态落库，会话历史可查。跨进程边界：CLI↔Daemon（本地 socket/命名管道）、Daemon↔浏览器（本地 HTTP/WS）。

**核心链路 2 —— 联邦（跨机器边界）**：从节点 `oly join start --key <api-key> <primary-url>` → 与主节点建立出站 WebSocket → 主节点 registry 跟踪从节点并代理操作 → 主节点上 `oly start --node worker-1` 将会话路由到从节点执行，日志/附着经 WS 跳转代理。关键约束：附着流对本地会话是广播推送，对代理会话退化为轮询（已确认，ARCHITECTURE.md §8）。

### 主要依赖

影响安装/运行的依赖（已确认）：

- **运行时**：无外部运行时依赖——Rust 静态二进制内嵌 Web 资产与 SQLite；不需要 Node、Python 或数据库服务。
- **平台机制**：PTY 依赖 OS 原生能力（Linux/macOS openpty，Windows ConPTY——要求 Windows 10 1809+，推导）；IPC 用 Unix domain socket / Windows 命名管道。
- **安装期**：npm 方式需 Node.js（仅作为包管理器，包内已捆绑二进制）；cargo 方式需 Rust 工具链并本地编译。

### 接口形态

系统边界上的接口（已确认，不穷举端点）：

- **CLI**：人类与 Agent 的主入口；`--json` 输出供脚本/Agent 消费。
- **本地 IPC**：CLI↔Daemon，newline-delimited JSON envelope over Unix socket/命名管道。
- **HTTP REST + SSE**：Web UI 的 CRUD/控制与事件流，Bearer token/登录态认证。
- **WebSocket**：浏览器交互式终端附着（`/api/sessions/:id/ws`）；联邦节点间守护进程互连。
- **Skill/Hook**：`oly skill` 输出 Agent 技能文档；notification hook 以命令行占位符 + `OLY_EVENT_*` 环境变量对接外部脚本。

### 持久化方式

全部状态归守护进程所有，存于本机状态目录（已确认，README + SPEC + storage.rs 源码三方一致）：

- SQLite 数据库：sessions、api_keys、push_subscriptions 三类核心数据。
- 每会话文件：output.log（输出回放/审计）、events.log（生命周期事件）。
- config.json（首启生成默认值）、守护进程日志、从节点 join 配置、可选 wwwroot 静态内容。
- 状态目录在 Unix 上强制 0700 权限（源码已确认）。无任何云端存储。

### 通信方式

- CLI↔Daemon：同步 RPC + 流式帧（attach/log-tail 以 Done/Error 帧收尾）。
- Daemon 内部：PTY 输出经单一 EscapeFilter 进入 ring buffer / 磁盘 / tokio broadcast 三路扇出；多客户端同时附着共享同一广播。
- Daemon↔浏览器：REST（操作）+ SSE（状态事件）+ WS（终端字节流，base64 JSON 帧）。
- 主↔从节点：从节点发起的长连接 WebSocket，API key 认证；代理会话的附着降级为轮询。
- 广播溢出时自动从持久化日志重放并重新同步（已确认，文档描述；未运行验证）。

### 部署形态

#### 工作机安装（Windows / macOS）

**Windows（x86_64）**（已确认，README + Releases）：
- 安装方式：① `npm i -g @slaveoftime/oly`（推荐，二进制已捆绑，无需下载 Release 资产）；② GitHub Releases 下载 `oly-windows-amd64.zip` 解压入 PATH；③ `cargo install oly`（需 Rust 工具链）。
- 运行入口：`oly daemon start --detach` 启动守护进程（用户态进程，非 Windows 服务；开机自启需自行配置，推导/未决）。
- 依赖与权限：普通用户权限即可；PTY 走 ConPTY（Windows 10 1809+，推导）；默认只监听 `127.0.0.1:15443`，不触发对外防火墙暴露。
- 状态目录：`%LOCALAPPDATA%\oly`（源码已确认）。
- 卸载：`npm uninstall -g @slaveoftime/oly`（或删除二进制），并删除状态目录；官方未提供专门卸载文档（未决：残留清理是否完整）。

**macOS（Apple Silicon arm64）**（已确认，README + Releases）：
- 安装方式：① `brew tap slaveOftime/open-relay https://github.com/slaveOftime/open-relay && brew install slaveOftime/open-relay/oly`；② npm 全局安装；③ Releases 下载 `oly-macos-arm64.zip`；④ cargo。
- **注意**：预编译产物仅有 arm64；Intel Mac 需 cargo 源码编译（推导，官方未说明 Intel 支持状态）。
- 运行入口：同 `oly daemon start --detach`；非 launchd 服务，开机自启需自行配置（推导/未决）。
- 依赖与权限：普通用户权限；直接下载的未签名二进制可能触发 Gatekeeper 拦截（未决，官方未说明签名/公证状态；Homebrew/npm 路径通常可规避）。
- 状态目录：`~/Library/Application Support/oly`（源码已确认）。
- 卸载：`brew uninstall` / `npm uninstall -g`，删除状态目录。

**网络要求**：默认全部流量在 loopback；仅联邦或用户主动 `--bind 0.0.0.0` 时才有跨机流量。安装期需访问 npm/GitHub/crates.io。

#### 主体功能运行位置

**主体功能 100% 运行在 PC 本地**（已确认）：会话执行、PTY 托管、持久化、Web UI、认证全部由本机守护进程完成。断网状态下核心功能可用（推导，基于架构无云端依赖；未运行验证）。**判定：符合要求。**

#### 云端网关（如存在）

**不存在官方云端网关**。远程访问模式为"浏览器/手机 → 用户自备认证网关 → 用户自备隧道（Cloudflare Access / Tailscale / SSH）→ 本地 oly HTTP 服务"，隧道方案由用户自选自建，不属于产品组件（已确认，README 明示）。按 RUNBOOK 要求仅简述，不展开。

## 未决项与证据边界

1. **未做运行验证**：安装流程、断网可用性、`--wait-for-prompt` 检测准确率、广播溢出重放等行为性结论均基于文档/源码，未实机验证。
2. **macOS Intel 支持**：无 x86_64 预编译产物，cargo 编译可行性未验证；官方未声明。
3. **macOS 签名/公证**：直接下载二进制的 Gatekeeper 表现未决。
4. **开机自启/服务化**：官方未提供 Windows 服务或 launchd 集成，守护进程崩溃后的自动恢复方式未决。
5. **卸载完整性**：无官方卸载文档，状态目录残留需手动清理。
6. **维护延续性**：单人驱动项目，v0.3.1 后近两月无新 Release（但 main 有提交），长期风险无法从当前证据判断。
7. **文档滞后**：ARCHITECTURE.md 部分章节（端口/状态目录/配置文件名）与实现不一致，使用时应以 README/SPEC 为准。

## 后续验证建议

1. 在一台 Windows 工作机、一台 Apple Silicon Mac 上分别执行 npm 与 brew 安装，验证安装、daemon 启动、Web UI 访问、卸载全流程（人工验收）。
2. 实测 `oly start <agent>` + `--wait-for-prompt` + `oly send` 对目标编码代理（如 Claude Code）的检查点检测有效性。
3. 若需要多机场景，在两台工作机间验证联邦 join/代理附着的延迟与稳定性。
4. 若纳入选型，建立对 upstream Release 的跟踪机制以监控单人项目的维护风险。
