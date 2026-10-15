# Hive 技术产品调研

> updated_by: Codex - GPT-5
> updated_at: 2026-07-20 23:56:03
> evidence_window: 2026-07-20；GitHub 仓库 `tt-a1i/hive` 的 `main` 分支公开快照、npm `@tt-a1i/hive` registry 快照

## 交付结论

1. **符合本次 RUNBOOK 的核心焦点要求。** Hive 是本机优先的浏览器式 Agent 协作工作台：Node.js runtime 在 Windows/macOS 工作机上运行，直接启动真实的 CLI Agent PTY 进程，浏览器 UI 只负责控制和观察。
2. **产品定位**：Hive 不替换 Claude Code、Codex、Gemini、OpenCode、Hermes、Qwen 等 CLI Agent，而是在它们外面增加 Orchestrator、Worker、团队协议、任务图、终端面板和会话恢复能力。它服务于需要在同一 workspace 中并行调度多个 CLI Agent 的个人开发者和小型工程团队。
3. **主体功能在本机**：Hive runtime、SQLite 元数据、PTY 生命周期、Agent 派单、任务图和 Web UI 都在本机；默认只监听 `127.0.0.1`。可选 Remote access 通过网关中转手机访问，但网关不运行 Agent、不保存 workspace 内容。
4. **工作机安装路径清晰**：用户通过 `npm install -g @tt-a1i/hive` 安装，运行 `hive` 后在浏览器打开 `http://127.0.0.1:3000/`；也可以用 Chromium 浏览器将本地 UI 安装为 PWA。Windows 和 macOS 均有公开支持说明，但 Windows 标注为 best-effort。
5. **主要依赖与约束**：Node.js 22+、至少一个已安装并登录的 CLI Agent、`node-pty` 和 `better-sqlite3` 原生依赖；没有预编译二进制时，macOS 需要 Xcode Command Line Tools，Windows 需要 Visual Studio Build Tools。Hive 不替用户安装或登录这些 Agent CLI。
6. **版本与许可证需要分开看**：公开源码 `package.json` 当前为 `1.4.0`，GitHub 最新列出的标签为 `v1.4.0`；npm registry 的 latest 已是 `2.1.18`（2026-07-12）。`0.6.0-alpha.8` 及之后版本采用 Business Source License 1.1，变更日期为 2030-05-16，并对面向第三方的竞争性托管/嵌入产品设置额外限制。
7. **维护状态**：项目创建于 2026-04-19，GitHub 仓库最近一次推送为 2026-06-18，但 npm 包持续发布到 2026-07-12；公开快照为 432 Star、51 Fork、26 个开放 Issue。项目方自称仍处于 alpha，核心流程可用，真实生产成熟度仍需人工验收。

## 调研目标、范围与边界

### 调研目标

理解 `tt-a1i/hive` 是什么、为谁解决什么问题、如何在 Windows/macOS 工作机上安装和运行，并确认 Agent、任务状态、持久化和可选远程访问的边界。

### 核心问题

- Hive 的产品定位、目标用户和端到端使用流程是什么？
- 它如何调度真实 CLI Agent，Orchestrator、Worker、workspace 和任务图如何协作？
- Windows/macOS 工作机需要什么安装入口、运行依赖、权限和卸载步骤？
- 主体功能是否在本机，Remote access 的网关承担什么角色？
- 当前公开源码、npm 用户版本、许可证、维护状态和反馈样本如何？

### 覆盖范围

- 产品定位、用户、核心流程和功能边界。
- GitHub、CHANGELOG、npm registry 的版本与维护快照。
- Node.js runtime、浏览器 UI、PTY、SQLite、WebSocket 和 workspace 文件的系统关系。
- Windows/macOS 安装、依赖、运行入口、数据位置、权限和卸载边界。

### 明确排除

- 不做竞品比较、选型矩阵或优劣排名。
- 不做逐文件源码审计，不枚举所有路由、表、配置或依赖。
- 不做性能、并发、可靠性、安全合规或生产容量 benchmark。
- 不实施安装、构建、运行、真实 Agent 调用或远程配对。

## 证据口径

- **官方产品资料**：中文 README、英文 README、官网和 npm 安装说明用于定位、流程、平台支持和安全边界。
- **版本与发布资料**：CHANGELOG、GitHub 标签/Release、npm registry 版本时间用于区分公开源码基线和用户实际安装版本。
- **仓库配置**：`package.json`、仓库顶层目录和公开文件用于确认 Node.js 版本、CLI 入口、原生依赖、构建脚本和运行组件。
- **社区反馈**：GitHub Issue、Pull Request、Star/Fork 和贡献者接口只描述公开快照；单个 Issue 不代表普遍质量。
- **架构推导**：README 的运行图和数据位置说明与包依赖、CLI 入口相互印证；本次未运行系统，因此不把源码推导包装成运行时验证。
- **许可证边界**：许可证文件只用于记录当前使用限制，不构成法律意见；商业使用、托管或嵌入前仍需由责任人复核具体版本条款。

主要证据入口：

- [GitHub 仓库](https://github.com/tt-a1i/hive)
- [中文 README](https://github.com/tt-a1i/hive/blob/main/README.zh.md)
- [英文 README](https://github.com/tt-a1i/hive/blob/main/README.md)
- [CHANGELOG](https://github.com/tt-a1i/hive/blob/main/CHANGELOG.md)
- [`package.json`](https://github.com/tt-a1i/hive/blob/main/package.json)
- [LICENSE.BSL](https://github.com/tt-a1i/hive/blob/main/LICENSE.BSL)
- [SECURITY.md](https://github.com/tt-a1i/hive/blob/main/SECURITY.md)
- [npm `@tt-a1i/hive`](https://www.npmjs.com/package/@tt-a1i/hive)
- [Hive 官网](https://hivehq.dev/)

## 产品调研

### 产品定位与目标用户

Hive 是一个运行在本机的浏览器式 Agent 协作工作台。它不提供模型，也不替换用户已经安装的 CLI Agent；它把多个真实 CLI 终端组织成一个团队，由一个 Orchestrator 派发任务，其余 Worker 在各自 PTY 中执行并回报。

目标用户可从公开流程归纳为：

- 已经使用 Claude Code、Codex、Gemini、OpenCode、Hermes、Qwen 或其他 CLI Agent 的开发者。
- 希望并行处理编码、测试、审查、调研、起草和事实核查的个人或小型团队。
- 需要在多个本机项目之间切换 workspace，并保留终端、任务和会话状态的用户。
- 需要以浏览器或 PWA 方式查看本机 Agent 工作台，偶尔从手机查看或操作本机运行任务的用户。

### 核心流程

1. 用户在 Windows 或 macOS 上通过 npm 全局安装 Hive，并确保至少一个支持的 Agent CLI 已安装、登录且在同一 shell 的 `PATH` 中。
2. 用户运行 `hive`；runtime 监听本机地址并输出浏览器访问 URL，默认端口为 3000。
3. 首次进入向导中选择 workspace 和 Orchestrator 预设。Hive 创建 `<workspace>/.hive/tasks.md`，启动 Orchestrator PTY，并向其会话注入 `team` 协议。
4. 用户在 Team Members 面板添加 Worker，或开启实验性自动组队，让 Orchestrator 根据任务需要创建临时 coder/tester/reviewer。
5. Orchestrator 使用 `team send` 派单，Worker 在自己的 PTY 中执行；Worker 使用 `team report` 回报状态和结果，任务图和报告回流到 Orchestrator。
6. 用户在浏览器终端面板中查看多个 PTY、任务、报告和 Workflow；Hive 尽力利用 CLI 自带 session id 恢复长任务。
7. 需要时用户可打开可选 Remote access，将已配对手机接入同一个本机 runtime；关闭 Remote access 时，系统保持纯本地行为。

### 功能地图与边界

**公开资料明确展示的能力：**

- **团队调度**：Orchestrator、Worker、角色模板、自动组队和 Worker 生命周期。
- **真实终端**：每个 Agent 都是本机真实 CLI/PTY 进程，支持终端面板、后台保留、停止、重启和尽力恢复 session。
- **团队协议**：通过注入到 Agent 会话 `PATH` 的包内 `team` 命令完成 `send`、`list`、`report`、`spawn`、`next` 等协作操作。
- **任务与记忆**：`.hive/tasks.md` 任务图、任务依赖、团队记忆、外部文件冲突处理和 Workspace 状态。
- **Workflow**：实验性多阶段 workflow、fan-out/review/test、定时运行、停止和报告回流；默认关闭。
- **浏览器/PWA**：本机 Web UI、Chromium PWA 安装、服务 Worker、桌面窗口和 Workspace 快捷入口。
- **工作区工具**：打开 VS Code、Cursor、Finder/File Explorer、Terminal、Ghostty、Zed 等本机目标；具体目标随平台变化。
- **远程访问**：默认关闭的手机访问和设备配对；网关负责认证后路由和中转，不运行 Agent。

**明确边界：**

- Hive 不自带模型、Agent 订阅、Agent CLI、通用 sandbox 或多用户认证。
- Worker 使用启动 Hive 的用户账户权限，可以在选定 workspace 中运行任意命令；这不是安全隔离边界。
- PWA 只是浏览器 UI 壳，后端 runtime 仍需在终端持续运行。
- Remote access 是可选辅助通道，不把执行和 workspace 数据迁移到网关。
- 自动组队和 Workflow 属于实验性能力，项目方公开状态仍为 alpha。

### 维护状态与版本演进

- **GitHub 源码快照**：仓库创建于 2026-04-19，默认分支为 `main`，最近一次公开推送为 2026-06-18；最新 GitHub 标签为 `v1.4.0`，另有 `v0.6.0-alpha.*` 和 `v1.x` 标签序列。
- **GitHub Release**：当前 API 只列出 `v0.6.0-alpha.0` 这一个无资产预发布，用户安装并不以 GitHub Release 为主。
- **npm 用户通道**：registry 的 latest 为 `2.1.18`，发布时间为 2026-07-12；README 明确要求用户以 npm 包为安装和升级来源。公开源码基线和 npm 用户版本存在版本差距。
- **关键演进**：1.3.0 加入 PWA；1.5.0 加入 Workflow 和自动组队；2.0.0 加入 Remote access 和手机控制；2.0.1 加入团队记忆与发布通道调整；2.0.2 修复 Windows Codex 终端滚动。CHANGELOG 的用户版本已超过仓库 `package.json` 的 1.4.0。
- **项目状态**：README 自称 alpha，核心流程可用；近期用户版本持续发布，说明产品仍活跃演进，但版本来源分裂和大量未关闭问题意味着生产成熟度尚未闭合。

### 生态与反馈

- **安装与生态入口**：npm `@tt-a1i/hive`、GitHub 仓库、Hive 官网和内置双语模板市场。
- **Agent 生态**：内置预设覆盖 `agy`、`claude`、`codex`、`opencode`、`gemini`、`hermes`、`qwen`、Cursor CLI、Grok Build 及自定义可执行命令；用户需自行安装和登录这些 CLI。
- **公开快照**：432 Star、51 Fork、26 个开放 Issue、4 个订阅者；贡献者接口主要显示 `tt-a1i`，但已有外部 Pull Request。
- **反馈主题**：公开 Issue 反复涉及 Codex session 恢复、Windows 终端滚动、Windows 输入/粘贴、全局 npm prefix 路径空格、PTY 状态、Worker 派单排队和 Runtime 停止等实际使用问题。
- **反馈边界**：Issue 样本有明确平台和运行主题，但不能据此推断所有用户都会遇到这些问题；本次未阅读全文讨论，也未复现问题。

### 当前可用、实验性与规划能力

- **当前公开可用**：npm 安装、浏览器 UI、多个 CLI 预设、真实 PTY、任务图、团队协议、Workspace、PWA、SQLite 元数据和会话恢复。
- **实验性**：自动组队、Workflow、Remote access 等功能在 README 或 CHANGELOG 中被标注为实验性或可选。
- **未决/待验证**：不同 CLI 的 session 恢复完整性、Windows 原生 PTY 输入兼容性、远程网关在断线场景的行为、native dependency 在不同 Node/OS 组合下的安装稳定性。

## 技术架构调研

### 系统全貌与运行形态

Hive 采用“本机 Node.js runtime + 浏览器/可选 PWA UI + SQLite + 多个本机 PTY Agent”的组合：

```text
浏览器 / Chromium PWA
        |
        | HTTP + WebSocket，默认 127.0.0.1:3000
        v
Hive Runtime（Node.js）
  SQLite 元数据
  HTTP API / WebSocket
  任务图与团队协议
  PTY 生命周期管理
        |
        +-- Orchestrator PTY
        +-- Worker PTY x N
        +-- Workspace shell PTY
        |
        +-- <workspace>/.hive/tasks.md
        +-- 可选 Remote gateway（仅路由/中转）
```

生产运行时由 npm 包提供，前端静态资源由 runtime 直接服务；开发模式才分开启动 runtime 和 Vite。没有数据库服务器、容器编排或必须的云后端。

### 主要组件与核心链路

**主要组件：**

- **CLI 入口**：npm 包暴露 `hive` 命令，负责启动、升级、端口选择和本机 runtime。
- **Runtime**：Node.js HTTP 服务和 WebSocket 服务，承载 API、任务、团队、workspace、终端和更新逻辑。
- **PTY 管理**：使用 `node-pty` 启动和维持 Orchestrator、Worker、shell 等真实终端进程。
- **SQLite 存储**：使用 `better-sqlite3` 保存 runtime 元数据、workspace、Agent 运行、任务和设置等本机状态。
- **Web UI**：React 19 + Vite/Tailwind 资源，生产构建后由 runtime 服务；PWA service worker 只缓存前端壳，不接管 API/WebSocket。
- **Team 协议**：包内 `team`/`team.cmd` 通过 PTY 的 `PATH` 注入到受 Hive 管理的 Agent 会话中，Agent 以命令方式发送和报告任务。
- **Remote gateway**：Remote access 开启时，网关承担已认证手机与本机 daemon 的路由/中转，不承载 Agent 执行和 workspace 内容。

**核心链路：**

1. `hive` CLI 启动 Node.js runtime，绑定本机回环地址并加载 SQLite 元数据。
2. 浏览器访问本地 Web UI，用户选择 workspace 和 Orchestrator 预设。
3. Runtime 创建 PTY，启动选定 CLI，并将 `team` 命令和 session 级 token 注入进程环境。
4. Orchestrator 通过 `team send`/`team spawn` 创建或派发 Worker；Worker 在相同用户权限下运行自己的 CLI 进程。
5. `team report` 和 PTY 输出写入 runtime 状态，并通过 HTTP/WebSocket 更新浏览器；`.hive/tasks.md` 保持可编辑的任务图。
6. 发生重启时，runtime 从 SQLite、任务图和可用的 CLI session id 恢复；恢复能力取决于对应 CLI 的原生 session 语义。

### 主要依赖

- Node.js 22+。
- npm、pnpm 10.30.3 或其他包管理器；用户安装路径以 npm 全局包为主。
- `node-pty`：本机 PTY 和终端输入输出。
- `better-sqlite3`：本机 SQLite 原生绑定。
- React 19、Vite、Tailwind、xterm 相关包：Web UI 和终端渲染。
- 至少一个用户自行安装并登录的 CLI Agent，且命令在启动 Hive 的 shell `PATH` 中。
- Windows 原生构建失败时需要 Visual Studio Build Tools；macOS 需要 Xcode Command Line Tools；README 还要求准备 Python/编译工具链以支持原生包构建。

这些依赖影响安装和运行，但本次未锁定每个 CLI Agent 的最低版本，也未进行跨平台构建矩阵验证。

### 接口形态

- **CLI**：`hive` 启动/升级/端口控制；包内 `team` 命令用于 Agent 间派单、查询和回报。
- **HTTP API**：浏览器 UI 与本机 runtime 交互，生产 runtime 同时服务静态 Web UI。
- **WebSocket**：任务、终端、Worker 和状态更新通过 WebSocket 推送到浏览器。
- **PTY/进程环境**：runtime 与 CLI Agent 通过 PTY stdin/stdout/stderr 协作，team token 和包内 bin 目录注入到 Agent 环境。
- **文件接口**：workspace 目录和 `<workspace>/.hive/tasks.md` 是任务图和用户文件的持久化边界。
- **Remote tunnel**：开启 Remote access 后，手机通过认证网关中转到本机 daemon；默认关闭。

本报告不枚举全部 HTTP 路由、WebSocket 消息或内部数据库迁移。

### 持久化方式

- **SQLite**：runtime 元数据存放在 Windows `%APPDATA%\hive`，macOS/Linux 默认在 `~/.config/hive`，也可由 `$HIVE_DATA_DIR` 指定。
- **Workspace 文件**：任务图存放在 `<workspace>/.hive/tasks.md`；团队上下文和用户直接编辑的任务内容属于 workspace 文件。
- **Agent session**：Hive 尽力保存并恢复各 CLI 的 session id，但最终恢复语义由 CLI 自身决定。
- **Web UI 资源**：生产构建的静态资源存放在 npm 包内，runtime 直接服务；PWA 缓存只保存 UI 壳和静态资源。
- **Remote gateway**：按 README 说明不保存 workspace 内容，主要中转已认证连接。

### 通信方式

- 浏览器与本机 runtime 使用 HTTP 和 WebSocket。
- Runtime 与 Orchestrator/Worker 使用本机 PTY 输入输出。
- Agent 与 Agent 之间通过 Hive 注入的 `team` 命令和任务图协作，不依赖外部消息队列。
- Runtime 与远程手机在 Remote access 开启时通过出站加密隧道连接网关；不开启时没有远程通路。
- `team` token 是 session 级本机环境变量，用于本地 Agent 到 runtime 的协作，不作为跨网络凭据。

### 部署形态

#### 工作机安装（Windows / macOS）

- **Windows**：安装 Node.js 22+，在 PowerShell 或其他可用 shell 中执行 `npm install -g @tt-a1i/hive`，确认至少一个 CLI Agent 已安装、登录且在 `PATH`；运行 `hive`，浏览器打开输出的本地地址。README 标注 Windows 为 best-effort，并提供 Windows 目录选择器、npm prefix 路径空格、Codex 滚动和原生包构建故障排查。
- **macOS**：安装 Node.js 22+，通过 npm 全局安装并运行 `hive`；默认数据目录为 `~/.config/hive`。原生依赖缺少预编译包时，需要 Xcode Command Line Tools 和本机编译工具链。
- **PWA 安装**：在 Chrome、Edge 或 Brave 打开本机 UI，使用地址栏安装图标添加为独立窗口；Firefox/Safari 当前没有对应 install-prompt。PWA 关闭后不会替代后台 runtime，终端中的 `hive` 仍必须运行。
- **运行入口**：默认 `http://127.0.0.1:3000/`，可用 `hive --port 4010` 等方式更换端口；开发模式 runtime 默认 4010，Vite 默认 5180。
- **权限与网络**：runtime 默认只监听本机回环地址；Worker 继承启动用户的文件和命令权限。安装需要 npm 写入全局包目录，原生依赖可能需要编译器权限；Remote access 开启时本机主动出站连接网关，不需要开放公网端口。
- **卸载**：PWA 可通过 `chrome://apps` 右键移除；全局 npm 包可按同一包管理器惯例执行卸载，runtime 数据目录和 workspace 中的 `.hive` 文件需要单独清理。README 明确说明的是 PWA 移除方式，未提供专用桌面卸载器。

#### 主体功能运行位置

主体功能运行在 Windows/macOS 工作机本地的 Node.js runtime、SQLite、PTY 进程和 workspace 文件中。浏览器是控制 UI；PWA 是可选 UI 壳；Agent CLI 也由本机用户预先安装并在本机执行。

依据 RUNBOOK，Hive **符合“主体功能运行在工作 PC 本地”要求**，但不是完全离线的单一二进制：需要本机 Node.js、原生依赖构建链和至少一个外部 CLI Agent；这些 CLI 可能各自访问其模型服务。

#### 云端网关（如存在）

Remote access 默认关闭。开启后，Hive 通过网关中转手机和本机 daemon 的已认证连接；按官方说明，网关不运行 Agent、不保存 workspace 内容，也不改变本机执行和数据归属。网关属于简单路由/中转边界，本次不展开其服务端实现、扩缩容或 SLA。

## 未决项与证据边界

- **用户包与公开源码不同步**：npm latest 为 2.1.18，仓库 `package.json` 和最新稳定标签仍为 1.4.0；未下载 npm tarball 逐项比对其源码和资产。
- **跨平台安装未实机验证**：未在 Windows/macOS 安装 Node.js、npm 原生包或真实 CLI Agent，无法确认每种 Node.js/架构组合的 prebuilt binary 和构建工具行为。
- **Agent 恢复未验证**：不同 CLI 的 session id、PTY 输入和恢复机制不同；公开 Issue 已出现 Codex 恢复与 Windows 终端相关问题，但本次未复现。
- **Remote access 未验证**：未创建网关账号、配对手机或测试断线、撤销和权限边界；“网关不保存 workspace”采用官方说明。
- **许可证解释未闭合**：BSL-1.1 对竞争性托管/嵌入产品的限制需要法律或合规 owner 按实际版本和商业模式确认。
- **反馈样本边界**：Issue/PR 主要反映早期用户和维护者反馈，不能外推为全部用户体验或生产缺陷率。
- **未做运行验证**：本次没有安装依赖、启动 Hive、连接任何 CLI Agent、运行 workflow、打开 PWA 或做性能/安全测试。

## 后续验证建议

1. 由人工在 Windows 11 和 macOS 上分别安装 Node.js 22+ 与 `@tt-a1i/hive`，配置一个实际 CLI Agent，记录原生依赖构建、首次启动、端口、workspace 选择和数据目录行为；这属于人工验收。
2. 在隔离测试 workspace 中跑通“Orchestrator 派单 → Worker 执行 → `team report` → 浏览器状态回流 → runtime 重启恢复”的最小闭环，并分别记录 Codex/Claude/OpenCode 的差异。
3. 单独验证 Windows 的 PTY 滚动、输入粘贴、Ctrl+C、npm prefix 带空格和 Agent session 恢复；这些是公开 Issue 中重复出现的高风险使用边界。
4. 若计划将 Hive 作为对外 SaaS、托管服务或嵌入竞争性产品，先由法律/合规 owner 审核 BSL-1.1 和商标条款，再决定是否采用 npm 包、源码或商业许可。
