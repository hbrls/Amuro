# OpenAI Symphony 技术产品调研

> updated_by: Qoder
> updated_at: 2026-07-30 18:00:00
> evidence_window: 调研日期 2026-07-30；GitHub openai/symphony main 分支快照；最新 Release v0.0.2（2026-07-24）

## 交付结论

1. **Symphony 是 OpenAI 开源的"Codex 编排层"**：一份语言无关的服务规范（SPEC.md）加一个 Elixir 参考实现。它以 Issue Tracker（Linear / GitHub Issues / Jira Cloud / Asana / GitLab）为控制平面，持续拉取待办 Issue，为每个 Issue 创建隔离工作区并启动一个自主运行的 Codex 代理，直至工作推进到"人工评审"等交接状态。团队由"监督编码代理"转为"管理工作项"。
2. **主体功能运行在 PC 本地，符合"主体在 PC"要求**：编排器（轮询、调度、重试、并发控制）、每 Issue 工作区、Codex 子进程全部运行在本机；无自建云后端、无多租户控制面。但需明示：Codex 代理的**模型推理依赖 OpenAI 云端 API**，Issue Tracker 本身是第三方 SaaS，离线不可用。云端在本产品中承担的是"模型能力 + 任务数据源"角色，Symphony 自身不含云端网关组件。
3. **macOS 工作机：符合要求**。官方发布自包含单文件可执行（macos_arm64 / macos_x86_64，Burrito 打包，内嵌 Erlang/Elixir），下载后 `chmod +x` 即可运行；也可用 mise + Elixir 从源码运行。
4. **Windows 工作机：当前不符合要求**。官方 Release 无任何 Windows 产物（仅 macOS/Linux 四个目标）；SPEC 规定代理子进程以 `bash -lc <codex.command>` 方式启动，隐含 POSIX shell 依赖；其硬依赖 Codex CLI 在 Windows 上原生支持仍属实验性（历史上官方建议 WSL2）。Windows 原生路径无官方支持，WSL 路径本质是 Linux 环境，按本次调研约束不作为可选路径。
5. **成熟度定位：工程预览（engineering preview）**。官方明确警告仅供受信环境测试；参考实现自称 prototype，建议按 SPEC 自行实现加固版本。项目活跃（2026-02 创建，2026-07 仍在发版），社区关注度高（约 26.3k stars / 2.6k forks），但版本号仍为 v0.0.x。

## 调研目标、范围与边界

### 调研目标

理解 OpenAI Symphony 是什么产品、为谁解决什么问题、系统如何构成，并重点判定其能否在 Windows / macOS 工作 PC 上安装运行、主体功能是否在 PC 本地。

### 核心问题

1. 产品定位、目标用户与核心流程是什么？
2. 系统由哪些组件构成，如何协作？
3. Windows / macOS 工作机上如何安装、运行、卸载？
4. 主体功能在 PC 本地还是云端？
5. 维护状态与公开反馈如何？

### 覆盖范围

产品调研（定位 / 用户 / 流程 / 边界 / 维护 / 版本 / 生态反馈）与技术架构调研（运行形态 / 依赖 / 接口 / 持久化 / 通信 / 部署）。

### 明确排除

源码审计、竞品比较、遥测调研、集成实施、性能 benchmark；Linux 不作为工作机路径调研。

## 证据口径

- **官方资料**：GitHub 仓库 README、SPEC.md、elixir/README.md、GitHub API 仓库元数据与 Release 记录（直接证据，均为 2026-07-30 快照）。
- **Codex App Server 协议资料**：官方文档站（developers.openai.com / learn.chatgpt.com）直接抓取受阻，协议细节取自文档镜像站并与官方文档搜索摘要、openai/codex 仓库 README 摘要交叉印证，属间接直接证据。
- **官方博客**（https://openai.com/index/open-source-codex-orchestration-symphony/）：抓取被 403 拦截，其要点经仓库 README 与两篇第三方报道（Tessl 2026-04-29、InfoQ 2026-05）交叉印证。
- **社区反馈**：来自第三方报道中的个别使用者陈述，样本极小，仅作主题提示，不代表普遍情况。
- **架构结论**：主要来自 SPEC.md 的规范性表述，属官方设计契约而非运行验证；本次调研未实际安装运行。
- **未决项**：见文末，均未包装为已确认结论。

## 产品调研

### 产品定位与目标用户

- **一句话定位**：把项目管理工具中的 Issue 变成一次次隔离、自主的代码实现运行（run），让工程团队"管理工作"而非"监督编码代理"的轻量编排服务。
- **目标用户**：已采用 Codex 且代码库完成"harness engineering"（对代理友好的工程化改造）的软件团队；官方明确该前提是 Symphony 发挥效果的条件。
- **产品哲学**："Software as a spec" —— 产品首先是一份 SPEC.md，可交给任意编码代理物化为任意语言的实现；Elixir 参考实现只是其中一种。这也是 OpenAI 开源它的示范目的：展示 Codex App Server 与规范驱动开发的组合能力。

### 核心流程

用户视角的一条端到端链路：

1. 工程师在 Issue Tracker（如 Linear）上正常创建、排序任务，任务进入 Todo 状态。
2. 本机长驻运行的 Symphony 轮询到该任务，为其创建独立工作区（可经 `after_create` 钩子 clone 仓库），启动一个 Codex App Server 会话并注入 WORKFLOW.md 定义的提示词。
3. 代理自主完成实现，通过 Symphony 托管的 tracker 原生工具（如 `linear_graphql`）更新工单状态、评论，并提交 PR，附带"工作证明"（CI 状态、评审反馈、复杂度分析、演示视频等）。
4. 任务推进到"Human Review"等交接状态，工程师评审；接受后代理安全落地 PR，工单进入终态，Symphony 清理工作区。

### 功能地图与边界

- **当前可用**：五个 tracker 适配器（Linear、GitHub Issues、Jira Cloud、Asana、GitLab）；每 Issue 隔离工作区与生命周期钩子；有界并发与重试退避；工单终态联动停止代理并清理工作区；阻塞（需人工输入/审批）状态暴露；可选 Phoenix LiveView 仪表盘与 JSON API；Burrito 自包含发布产物；tracker 凭据宿主侧托管（不下发给代理子进程）。
- **实验性**：整个产品即"low-key engineering preview"；E2E 测试展示了 SSH 远程 worker 场景，但 README 未将其列为正式使用方式。
- **明确非目标**（SPEC）：富 Web UI / 多租户控制面、通用工作流引擎、分布式任务调度、内置工单业务逻辑、强制统一的沙箱与审批策略。
- **边界**：Symphony 只做"调度/运行 + tracker 读取"；工单写操作由代理经托管工具完成；成功的运行终点是交接状态而非必然 Done。

### 维护状态与版本演进

- 仓库创建于 2026-02-26，最近推送 2026-07-24，**判定为活跃维护中**。
- 版本演进：v0.0.1（2026-07-18）→ v0.0.2（2026-07-24），均发布 macOS/Linux 四目标自包含产物及校验和。方向性变化以 tracker 适配器扩展（从 Linear 到五家）和安全默认值（审批/沙箱策略默认拒绝+workspace-write）为主线。
- 官方口径始终强调 preview / prototype 定位，未承诺生产可用。

### 生态与反馈

- **生态入口**：SPEC.md 本身即扩展点（任意语言重实现）；tracker 适配器契约（SPEC §11）；WORKFLOW.md 仓库内契约；配套 Codex skills（commit/push/pull/land/linear）；GitHub Discussions 开放（Issues 关闭，PR 仅限协作者）。
- **公开反馈主题**（样本：两篇第三方报道引用的个别用户，边界见证据口径）：并行吞吐提升明显（有用户称一周关闭数十个 Issue）；token 消耗大是重复出现的成本顾虑；依赖代码库工程成熟度与任务书写质量。
- **快照数据**：约 26,313 stars、2,664 forks（2026-07-30），仅说明关注度，不等同采用率或质量。

## 技术架构调研

### 系统全貌与运行形态

Symphony 是**单机长驻守护进程**（daemon），以 CLI 启动（`./bin/symphony ./WORKFLOW.md`），无安装器、无系统服务注册、无自建云后端。运行时对外连接两类云端服务：所配置的 Issue Tracker SaaS API 与（经 Codex CLI）OpenAI 模型 API。系统边界：

- **本机内**：编排器、工作区文件系统、Codex 子进程、可选本地仪表盘。
- **本机外**：Issue Tracker API（数据源与控制平面）、OpenAI 云端（模型推理）、Git 远端（代码托管，经钩子/代理使用）。

### 主要组件与核心链路

SPEC §3 定义的组件（参考实现以 Elixir/OTP 监督树承载）：

| 组件 | 职责 |
| --- | --- |
| Workflow Loader | 读取并解析 WORKFLOW.md（YAML front matter + 提示词正文），支持热重载（失败则沿用上一份有效配置） |
| Config Layer | 类型化配置、默认值、`$VAR` 环境变量间接引用、派发前校验 |
| Tracker Adapter | 拉取候选/指定 Issue、归一化为稳定 Issue 模型、提供 provider 原生代理工具 |
| Orchestrator | 轮询节拍、内存运行时状态、派发/重试/停止/释放决策、并发与指标 |
| Workspace Manager | Issue → 工作区路径映射、目录生命周期、钩子执行、终态清理 |
| Agent Runner | 构建提示词、启动 Codex App Server 子进程、流式回传代理事件 |
| Status Surface（可选） | Phoenix LiveView 仪表盘 + JSON API（`--port` 才启用） |
| Logging | 结构化日志（默认 `./log`） |

**核心链路（轮询-派发-执行）**：每 `polling.interval_ms` 一个 tick：对运行中 Issue 做对账（工单被人工移到终态则停止代理、清理工作区）→ 派发前校验 → 按活动状态拉取候选 → 按优先级排序 → 在并发上限（`max_concurrent_agents`）内派发。派发即创建/复用工作区、首建时执行 `after_create` 钩子，然后在工作区内以 `bash -lc <codex.command>` 启动 `codex app-server` 子进程，注入渲染后的提示词，流式处理 turn 更新；正常完成但工单仍活跃时最多连续续跑 `max_turns`（默认 20）轮。

**凭据边界（关键约束）**：tracker 令牌由 Symphony 宿主侧持有并执行工具调用（如 `linear_graphql`、`github_api`），同时从 Codex 子进程环境中剔除令牌变量——代理无需二次登录 tracker，也拿不到原始凭据。

### 主要依赖

只列影响安装与运行的硬依赖：

- **codex**（Codex CLI，需支持目标版本的 App Server 模式）——核心执行引擎，Burrito 产物不内嵌，需目标机自备。
- **git**——工作区填充（钩子中 clone）所需，同样需自备。
- **Issue Tracker 凭据**——按适配器要求的环境变量（如 `LINEAR_API_KEY`、`GITHUB_TOKEN`、`JIRA_API_TOKEN` 等）。
- **Erlang/Elixir 运行时**——仅源码运行路径需要（推荐 mise 管理）；Burrito 产物已内嵌。

### 接口形态

- **CLI**：唯一必选入口，`symphony <WORKFLOW.md 路径>`，可选 `--logs-root`、`--port`。
- **仓库契约**：WORKFLOW.md（YAML 配置 + Markdown 提示词），是团队定制行为的主接口。
- **HTTP（可选）**：启用 `--port` 后提供 LiveView 仪表盘 `/` 与 JSON API `/api/v1/state`、`/api/v1/<issue>`、`/api/v1/refresh`，用于运维观测。
- **子进程协议**：与 Codex App Server 的进程间流式协议（协议规范以目标 Codex 版本为准，SPEC 明确不自定协议）。
- **代理工具**：向 Codex 会话广告的 provider 原生工具（`linear_graphql` / `github_api` / `jira_rest` / `asana_api` / `gitlab_api`），由 Symphony 宿主侧执行。

### 持久化方式

**无数据库**。三类状态、三种归属：

- **调度状态**：编排器内存中，重启即失（SPEC 明确目标：无持久数据库前提下靠 tracker + 文件系统恢复；阻塞名单等内存态重启清空）。
- **工作真相**：Issue Tracker 是唯一权威源，重启后从 tracker 重建可派发集合。
- **本地文件**：每 Issue 工作区（`workspace.root` 下，跨运行复用、成功不自动删除、工单终态才清理）与结构化日志目录。

### 通信方式

- Symphony ↔ Tracker：HTTPS 轮询（拉模式，无 webhook），分页读取 + ID 对账。
- Symphony ↔ Codex：本机子进程流式协议（App Server 模式），turn 静默超时 `turn_timeout_ms` 由每条更新重置。
- Codex ↔ 模型：由 Codex CLI 自行连接 OpenAI 云端（Symphony 不介入）。
- 观测面：本地 HTTP（可选）。
- 总体模式：**单机进程内协调 + 出站轮询**，无消息队列、无集群通信（SSH 远程 worker 仅出现在 E2E 测试场景）。

### 部署形态

区分四种形态：开发运行（`mise exec -- mix ...`）、源码构建（`mix build` 产出 `./bin/symphony`）、正式产物（Burrito 单文件）、终端用户安装（下载 Release 产物直接运行）。以下为核心调研焦点结论。

#### 工作机安装（Windows / macOS）

**macOS —— 官方支持，判定符合**

- 安装方式一（推荐）：从 GitHub Release 下载 `symphony-vX.Y.Z-macos_arm64` 或 `macos_x86_64` 单文件可执行，`chmod +x` 后直接运行。产物内嵌 Erlang/OTP + Elixir + Symphony，无需安装语言运行时。
- 安装方式二：源码运行——`git clone` 后 `mise trust && mise install && mise exec -- mix setup && mix build`，以 `./bin/symphony ./WORKFLOW.md` 启动。
- 运行入口：前台 CLI 进程；无 .app、无 LaunchAgent、无安装器。
- 前置依赖：本机需已安装并登录 `codex`、安装 `git`、导出 tracker 凭据环境变量。
- 权限与网络：工作区根目录文件读写权限；出站 HTTPS（tracker API、OpenAI API、Git 远端）；无需管理员权限、无内核扩展。
- 卸载：删除可执行文件、工作区目录、日志目录即可，无注册表/系统服务残留。

**Windows —— 无官方原生支持，判定不符合**

- Release 产物仅四个目标：macos_arm64 / macos_x86_64 / linux_arm64 / linux_x86_64，**无 Windows 目标**（v0.0.1、v0.0.2 一致）。
- SPEC §10.1 规定代理子进程启动方式为 `bash -lc <codex.command>`，隐含 POSIX shell 依赖；README 与 SPEC 全文无任何 Windows/WSL 表述。
- 硬依赖 Codex CLI 在 Windows 上的原生支持仍处实验阶段（官方历史建议 WSL2；近期出现原生 Windows 沙箱能力但为较新进展）。
- 经 WSL2 运行理论可行，但 WSL 即 Linux 环境，按本次调研约束不作为工作机路径。

#### 主体功能运行位置

- **主体功能在 PC 本地**：编排调度、工作区管理、代理子进程、代码修改、（可选）观测面全部本机运行——判定符合要求。
- 必要澄清：模型推理在 OpenAI 云端（经 Codex CLI 出站调用），Issue Tracker 为第三方 SaaS。产品不能离线工作，但云端不承载 Symphony 自身的任何组件。

#### 云端网关（如存在）

Symphony 自身**无云端网关组件**。与云的关系仅为两类出站 API 消费：tracker SaaS API（数据源）与 OpenAI 模型 API（经 Codex）。按调研约束仅提及，不展开。

## 专题深入（追加核验）

以下专题为报告交付后针对性追问的核验结论，证据来源见证据口径。

### 代理拉起机制与协议边界

**能拉起什么**：`codex.command` 在配置上是任意 shell 命令字符串（默认 `codex app-server`，可替换二进制路径与参数），但契约上锁死——Symphony 启动子进程后即按 Codex App Server 协议发起 `initialize` → `thread/start` → `turn/start` 并解析事件流，因此实际只能拉起 Codex CLI 或任何实现了该协议的进程；Claude Code、Gemini CLI 等其他代理 CLI 不可用。一句话：**配置开放任意命令，协议锁死唯一对象**。

**怎么拉起**（SPEC §10.1 Launch Contract）：

1. 以 `bash -lc <codex.command>` 启动子进程（login shell，`$VAR` 在该层展开）；
2. 工作目录设为该 Issue 的专属工作区（隔离的关键）；
3. stdin/stdout 流式 JSON-RPC 通信，推荐单行缓冲上限 10 MB；
4. 随会话注入审批策略、沙箱策略（默认 `workspace-write` 锚定工作区）、渲染后提示词、tracker 原生工具声明；
5. 从子进程环境剔除 tracker 令牌变量（凭据留在宿主侧）；
6. `turn_timeout_ms` 为流式静默超时（每条更新重置）；工单终态时主动终止子进程。

### Codex App Server 协议要点

Codex CLI 的"无头程序化模式"：运行 `codex app-server` 后 Codex 不再是终端 UI，而是经 **JSON-RPC 2.0**（默认 stdio、换行分隔 JSONL）由宿主程序驱动的代理引擎——与 LSP/MCP 同类，是 Codex VS Code 扩展等富客户端的官方集成接口，实现开源于 openai/codex/codex-rs/app-server。

- **核心原语**：thread（对话，可创建/恢复/fork/归档）→ turn（一轮"输入到完成"）→ item（消息/命令执行/文件变更/工具调用等最小单位）。
- **生命周期**：`initialize` 握手 → `thread/start` → `turn/start` → 流式接收 `item/started`、`item/completed`、`item/agentMessage/delta` 等通知 → `turn/completed`；可 `turn/interrupt` 中断。
- **双向性**：服务端会反向发起审批请求、工具调用（Symphony 借此注入 `linear_graphql` 等宿主侧工具）、MCP elicitation；Symphony 默认策略 reject 并将工单标记 blocked。
- **版本即协议**：schema 可用 `codex app-server generate-json-schema` 从当前 CLI 版本生成、与版本严格对应——这解释了 SPEC 为何声明"以目标 Codex app-server 版本为协议事实来源"而不自定义协议。
- **传输**：默认 stdio；WebSocket / Unix socket 属实验性。Symphony 使用最基本的 stdio 子进程形态。

该协议是"Software as a spec"成立的基础：编排器与代理引擎的边界被协议切开，任何语言重写 Symphony，只要实现这套 JSON-RPC 即可工作。

### 运行时形态：Elixir / BEAM 与单文件产物结构

概念分层（对照 Java 生态理解）：**Elixir** 是语言（编译为 `.beam` 字节码，跨平台）；**BEAM** 是执行字节码的语言虚拟机（地位同 JVM，非系统虚拟机，本身是 C 写的原生程序）；**Erlang/OTP** 是含 BEAM 的运行时发行包（地位同 JDK）。Elixir 之于 Erlang 如同 Kotlin 之于 Java：不同语言、同一字节码、同一虚拟机、生态互通。

OS 层面实际运行的进程是原生的 BEAM 虚拟机（Windows 上为 `erl.exe` 引导器 + `beam.smp.dll` 引擎，类比 `java.exe` + `jvm.dll`），Symphony 的 Elixir 逻辑以字节码形态在其内部被执行（OTP 24+ 含加载时 JIT）。

Burrito 单文件产物的内部结构与启动链：

```
symphony-vX.Y.Z-<平台>（单文件）
├── 原生启动器外壳（Burrito 生成，Zig 编译）
├── 完整 ERTS（含 BEAM，按平台准备的原生机器码）
└── Symphony .beam 字节码（三平台通用）
```

首次运行自解压至本地缓存目录，启动器拼装实际的 erl 启动命令行并拉起内嵌 BEAM 执行字节码。用户视角只面对一个可执行文件与一个 WORKFLOW.md 参数，不接触 erl 层。

### Windows 假设性适配评估

打包层面无障碍：Burrito 官方支持 Windows x86_64 目标，可产出与 macOS 版同构的单文件 `symphony.exe`（字节码层完全复用）。真正的适配成本在运行时假设，按难度排序：

1. `bash -lc` 启动契约需改造（SPEC 层面属参考实现契约、允许替换）；
2. **Codex CLI 的 Windows 原生可用性**——外部硬依赖，不在 Symphony 自己手里；
3. 零散 POSIX 假设（`~` 展开、hook 中的 shell 命令等）。

结论：拦住 Windows 版的不是打包技术，而是运行时依赖链；这解释了官方 Release 为何不含 Windows 目标。

### 进程形态与状态丢失语义

**进程形态**：不注册为 OS 服务（无 Windows Service / systemd / LaunchAgent，无安装器、无自启、无管理员权限要求），但必须持续运行才有用——是**用户手动托管的前台长驻进程**（终端挂起运行，Ctrl+C 停止），非"跑完即退"的工具型 CLI。长期生产使用需自行补 OS 托管层，与 engineering preview 定位一致。

**关闭丢内存态是官方设计契约**（非缺陷）：

- SPEC §2.1 目标明确："支持 tracker/文件系统驱动的重启恢复，无需持久数据库；精确的内存调度状态不做恢复。"
- 真相双源：工作状态在 tracker（重启后活动工单重新成为派发候选，已交接/终态工单不重跑）；工作成果在文件系统（工作区按 Issue 确定性命名、跨运行保留，重启后同工单回到同一工作区续作）。
- SPEC §8.6 启动自清理：启动时查询终态工单并删除对应陈旧工作区。
- 关闭的实际代价：运行中 turn 作废（token 白费）、blocked 名单清空（会重试并可能再次 block）、重试队列与指标清零；不会重复提交已完成工作（PR/工单状态在外部系统）。

### 观测界面与控制面

**界面**：默认无界面（终端输出 + 日志）；`--port` 启用可选 Web 仪表盘。技术栈为最小 Phoenix 栈：Phoenix + **LiveView**（服务端渲染、WebSocket 推送 DOM 差量，前端近零 JS，无 React/Vue、无独立前端工程）+ Bandit HTTP 服务器，与编排器同进程内嵌运行。

**仪表盘近乎只读**：文档证据中唯一可触发的操作是 `POST /api/v1/refresh`（催一次轮询，运维动作而非编排决策）；未发现停代理/重派/调优先级等操作入口（未运行验证，但 SPEC 将富 Web UI 列为非目标，方向一致）。

**编排动作全部经由控制面三入口表达**，其中 tracker 是主控制台——工单状态即指令集：

| 编排动作 | 操作方式 |
| --- | --- |
| 派发任务 | 工单拖入 Todo（active state） |
| 停止运行中代理 | 工单拖入终态 → 对账 tick 杀 worker、清工作区 |
| 暂停派发 | 移出 active states / 摘 required label / 加 blocker |
| 调执行顺序 | 改工单 priority |
| 策略调整（并发、提示词、沙箱） | 编辑 WORKFLOW.md（热重载，免重启） |
| 进程起停 | 终端 |

设计逻辑闭环：真相源唯一（tracker）、Symphony 无状态无数据库，故仪表盘不提供写操作——否则出现第二真相源。"管理工作而非监督代理"的产品定位由此落地。

## 未决项与证据边界

1. **官方博客原文未直接读取**（openai.com 抓取 403），其内容经 README 与第三方报道交叉印证；不排除博客含本报告未覆盖的官方表述。
2. **Windows 支持的官方明确口径未发现**：当前证据（无产物、bash 依赖）支持"不支持原生 Windows"的推导，但官方未发布明示声明；属"当前证据未发现支持"而非"官方声明不支持"。
3. **未做运行验证**：安装步骤、资源占用、实际 token 消耗、并发稳定性均基于官方文档表述，未在本机实测。
4. **token 消耗大、需工程成熟度**等反馈来自极小样本的第三方转述，不代表普遍体验。
5. Codex CLI 原生 Windows 能力演进较快，本报告结论以 2026-07-30 证据窗口为限。
6. **仪表盘"近乎只读"结论基于文档证据**：未发现写操作入口不等于确证不存在，需运行验证；Codex App Server 协议细节经镜像站获取，虽已交叉印证，仍以官方文档现行版本为准。

## 后续验证建议

1. 在 macOS 工作机实测：下载 v0.0.2 macos_arm64 产物，配一个一次性 Linear/GitHub 项目跑通"Todo → Human Review"链路，验证安装步骤与凭据边界行为。
2. 若 Windows 是硬性要求：跟踪 openai/codex 的原生 Windows 支持进展，并评估按 SPEC.md 自行物化一个 Windows 原生实现（规范本身语言无关，`bash -lc` 为参考实现契约，可替换）的成本。
3. 试运行期间量化 token 消耗与并发上限（`max_concurrent_agents` / `max_turns`）的成本曲线，验证社区"高 token 消耗"反馈。
