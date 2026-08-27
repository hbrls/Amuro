# Prime Agent 技术产品调研

> updated_by: Qoder - Claude
> updated_at: 2026-08-07 16:00:00
> evidence_window: 2026-08-07, main 分支, v0.7.0

## 调研目标

- 围绕 Stateful 编排调度、客户端接入、Windows 与 macOS 工作机部署、依赖根源与架构范式，形成可追溯的独立产品调研。
- 判断产品是否持久拥有工作对象、对象关系和任务生命周期，并依据依赖、状态与策略持续推进任务。
- 核验 Windows 与 macOS 工作机支持情况、Local 优先适配程度、云端依赖与最小部署成本。
- 识别调度最小核心职责与非调度增值能力的边界，评估改造范围与风险。

## 交付结论

### Prime Agent 是编码 Agent 运行器，不是 Stateful 调度系统

Prime Agent 是一个以持久 IPython 内核为核心的开源编码与研究 Agent 运行器（harness），不是 Index 定义的 Stateful 调度系统。产品不持久拥有 Workspace、Project、Issue、Plan 或 Task 等调度工作对象，不维护任务间的父子关系、先后顺序、前置依赖或 DAG，不负责判断任务何时可执行、按何种顺序推进、由谁执行以及失败后如何继续。产品拥有的核心持久化对象是 Session（JSONL 会话记录）、Goal（持久目标）、Heartbeat（周期性提示）和 Scheduled Job（定时任务），这些对象服务于单个 Agent 会话内的持续运行，不构成跨会话的中心调度状态。

以上为已确认事实，依据官方[架构文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/architecture.md)、[daemon 文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/daemon.md)和[长时运行文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/long-running-agents.md)。

### 工作对象模型中不存在 Workspace / Project / Issue / Plan / Task

Prime Agent 的持久化对象模型如下：

- **Session**：真实持久化对象，以 JSONL 文件存储于 `~/.prime/agent/sessions/<id>.jsonl`，支持树状分支结构（id/parentId 链接）。Session 是核心工作容器，但不等价于调度系统中的 Workspace 或 Project。
- **Goal**：持久化目标对象，记录目标文本、token 预算、续推计数和状态（active/paused/completed/errored）。Goal 在 Session 内部持续存在并驱动续推，但不支持目标间依赖关系或 DAG。
- **Scheduled Job**：持久化定时任务，以 `session-artifacts/<id>/scheduled-jobs.json` 存储，支持一次性或 cron 周期提示。调度范围限于单个 Session，不存在全局任务队列。
- **RLM Subagent**：由父 Agent 通过 `rlm()` 编程式生成的子 Agent 会话，持久化于 `session-artifacts/<id>/sub-xxxxxxxx/`。子 Agent 有独立会话历史和内核，但父-子关系由父会话注册表维护，不构成中心化任务分派。
- **Continual Harness State**：以 `harness/harness_state.json` 持久化的提示笔记、记忆、技能描述和子 Agent 规格，属于 Agent 自我改进状态，不是调度工作对象。

以上为已确认事实，依据[会话格式文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/session-format.md)和[RLM 运行时文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/rlm-runtime.md)。Index 定义的 Workspace、Project、Issue、Plan、Task 对象在 Prime Agent 中均不存在。

### 任务关系、生命周期与调度决策由 Agent 自主驱动而非中心调度

Prime Agent 不存在任务 DAG、前置依赖、阻塞关系或并行分支等调度关系。Session 内的提示队列（prompt queue）是唯一的执行排队机制，按 FIFO 顺序处理用户提示、心跳、定时任务和自主续推。

- **状态机**：Session 有 active / idle / inactive / archived 状态，由 daemon 管理生命周期。RLM 子 Agent 共享 Running-Idle-Inactive 状态机。这些是进程生命周期状态，不是调度状态机。
- **续推机制**：Goal 和 Autonomous Mode 可以在当前轮次结束后注入后续提示，但这是 Agent 会话内的续推策略，不是跨任务调度。
- **失败恢复**：Worker 崩溃后由 daemon 从 JSONL 和内核快照恢复，重试间隔 250ms / 1s / 5s，三次失败标记为 failed。恢复不重放不确定的副作用。这是进程级恢复，不是任务级调度恢复。
- **优先级与并发约束**：不存在任务优先级。IPython 内核串行执行（一个内核不并发运行两个普通单元格），但 RLM 子 Agent 可以并发运行。最大递归深度默认为 1（根可创建子 Agent，子 Agent 默认不能创建孙 Agent）。

以上为已确认事实，依据[daemon 文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/daemon.md)和[长时运行文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/long-running-agents.md)。

### Agent 分派由编程式调用驱动，不存在中心调度器选择执行者

Prime Agent 的 Agent 分派机制完全由 Agent 自主编程式驱动：

- 父 Agent 通过 `await rlm("subtask", name="...")` 在 IPython 内核中生成子 Agent。调用在任务准入后立即返回句柄，不等待子 Agent 完成。
- 不存在中心调度器选择执行者。Agent 的创建完全由父 Agent 的模型决策驱动。
- 子 Agent 的结果通过 `agent_message.send(..., receiver_role="parent")` 异步返回，作为普通 Agent 消息在后续轮次中到达父 Agent。
- Agent 间通信限于"核心家庭"范围：父、同胞、子。不支持跨树通信。
- Worker 崩溃后，daemon 恢复父会话并从注册表重新加载已完成的 daemon-backed 子 Agent。执行进度存在于 Session JSONL 和内核快照中，不是调度状态。

以上为已确认事实，依据[RLM 运行时文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/rlm-runtime.md)和[长时运行文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/long-running-agents.md)。

### 持久化完全依赖本地文件系统，无外置数据库

Prime Agent 不使用任何外部数据库。所有持久化通过本地文件系统完成：

- **会话记录**：JSONL 文件，位于 `~/.prime/agent/sessions/<id>.jsonl`，append-only，支持树状分支。
- **会话制品**：位于 `~/.prime/agent/session-artifacts/<id>/`，包含内核快照（`kernel-state.dill` / `kernel-state.json`）、定时任务（`scheduled-jobs.json`）、Harness 状态（`harness/harness_state.json`）和子 Agent 目录。
- **全局 Harness 状态**：`~/.prime/agent/harness/`，用于跨会话共享的提示笔记和记忆。
- **Daemon 元数据**：Worker 描述符、认证令牌、活跃会话 ID 和恢复日志，位于 agent 目录下，owner-only 权限。

无强制数据库依赖，无专属数据库扩展。这是 Local 优先架构的正面特征。

以上为已确认事实，依据[会话格式文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/session-format.md)和[RLM 运行时文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/rlm-runtime.md)。

### 接口形态以本地协议和进程间通信为主

Prime Agent 的接口分为客户端接入和程序化集成两类：

- **CLI**：`prime-agent` 命令，支持交互式 TUI、print 模式、JSON 事件流模式、RPC 模式和 ACP 模式。
- **Daemon 本地协议 v4**：JSONL 帧格式，通过本地 socket 通信。支持版本化命令、能力协商、代际感知事件游标和快照流式传输。
- **RPC 模式**：stdin/stdout JSONL 协议，支持 prompt、steer、followUp、abort 等命令，用于 headless 自动化和 IDE 集成。
- **SDK**：Node.js 内嵌方式，通过 `@earendil-works/pi-coding-agent` 包直接使用 `AgentSession`。
- **ACP 模式**：Agent Client Protocol，通过 NDJSON on stdio 驱动，Prime Agent 作为 ACP Agent 运行。
- **IPython 内核通信**：通过 ZeroMQ 的 Jupyter 协议（shell / IOPub / control 三个通道），HMAC-SHA256 签名。
- **Agent 间消息**：通过 daemon 路由的 `agent_message.send()` Python 技能。

不存在 REST API 或 gRPC 接口用于调度管理。所有接口均为本地进程间通信。

以上为已确认事实，依据[架构文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/architecture.md)、[RPC 文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/rpc.md)和[Agent 连接文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/agent-connection.md)。

### 通信方式为本地 socket + ZeroMQ，无分布式消息中间件

- **客户端与 daemon**：本地 socket 上的 JSONL 协议，支持 detach/reattach、快照恢复和代际感知事件游标。
- **daemon 与 worker**：私有二进制帧协议（4 字节 JSON 头长度 + 4 字节负载长度 + 路由头 + 不透明负载），per-worker 认证令牌和 supervisor 代际隔离。
- **Worker 与 IPython 内核**：ZeroMQ 上的 Jupyter 协议，三个通道（shell / IOPub / control），HMAC-SHA256 签名。
- **Agent 间消息**：通过 daemon 路由，支持 auto / steer / follow_up 三种投递模式。消息大小、速率和待处理队列有上限。限于"核心家庭"范围。
- **无消息中间件**：不依赖 Redis、RabbitMQ、Kafka 或任何外部消息队列。所有通信在同一台机器的进程间完成。

以上为已确认事实，依据[daemon 文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/daemon.md)和[RLM 运行时文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/rlm-runtime.md)。

### 任务队列是 Session 本地的提示队列，无持久化分布式队列

Prime Agent 的"任务队列"是每个 Session worker 内的提示队列（prompt queue），按 FIFO 顺序处理用户提示、心跳触发、定时任务和自主续推注入的提示。这不是持久化分布式任务队列：

- **定时任务防重复**：due tick 在投递前被 claim 并 advance，崩溃不重放不确定的提示。遗漏的 tick 被合并而非无限积压。
- **Session 租约**：基于 JSONL 路径的进程安全租约，防止 daemon worker 和一次性客户端并发写入同一会话。并发打开返回 `session_already_active`。
- **无全局任务队列**：每个 worker 运行自己的调度器，定时任务按 Session 持久化，不共享全局 cron 文件。
- **无原子抢占或分布式并发协调**：不存在多节点任务抢占或分布式锁。

以上为已确认事实，依据[daemon 文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/daemon.md)。

### macOS 原生支持，Windows 依赖 bash shell 非原生

- **macOS**：通过 `curl -fsSL https://app.primeintellect.ai/prime-agent/install.sh | sh` 安装。安装脚本下载版本化发布包，验证 SHA-256 校验和，通过 npm 全局安装 `prime-agent` 命令。支持 Apple Silicon 和 Intel 架构。这是已确认事实。
- **Windows**：官方[Windows 文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/windows.md)仅 12 行，要求 bash shell，检查 Git Bash、Cygwin、MSYS2 或 WSL。安装脚本（`install.sh`）是 POSIX shell 脚本，不提供原生 Windows 安装包或 MSI。Windows 支持**依赖 POSIX 兼容层**，不是原生支持。这是已确认事实。
- **Linux**：原生支持，安装方式与 macOS 相同。

**选型缺陷**：Windows 工作机支持不完整。产品不提供原生 Windows 二进制或安装包，依赖 Git Bash / WSL / Cygwin 等 POSIX 兼容层。对于需要在纯 Windows 环境中运行的用户，这增加了部署复杂度和潜在兼容性风险。不影响 macOS 和 Linux 上的正常使用。

### 主体功能完全运行在 PC 本地，Local 优先适配良好

Prime Agent 是一个纯本地运行的产品。所有核心能力——daemon、worker、IPython 内核、会话持久化、调度、Agent 间通信——均在用户的工作机上运行。

- **无云端组件**：Prime Agent 产品本身不包含任何云端服务、SaaS 后端或中心化调度服务。Prime Intellect 的云端平台（docs.primeintellect.ai 上的 GPU 计算、训练、推理服务）是独立产品，不是 Prime Agent 的运行依赖。
- **模型 Provider 依赖**：Prime Agent 需要调用外部 LLM API（Anthropic、OpenAI、Google 等）进行模型推理。这是 API 调用依赖，不是云端运行依赖。用户可通过 API Key 或订阅方式接入。断网后 Agent 无法调用模型，但本地会话状态、内核状态和已生成内容不受影响。
- **Local 优先判断**：Prime Agent 在 Local 优先维度适配良好。主体功能完全运行在 PC 本地，无云端强绑定依赖，数据不离开工作机（模型 API 调用除外）。这是已确认事实。

### 依赖根源为 Node.js + Python，无不可剥离的硬依赖

Prime Agent 的运行时硬依赖如下：

| 依赖 | 用途 | 是否可替换 |
| --- | --- | --- |
| Node.js ≥ 20.6.0 | 运行 CLI、daemon、worker、AgentSessionRuntime | 不可替换，核心运行时 |
| Python 3.11+ | IPython 内核运行时，由 `uv` 自动引导安装 | 不可替换，模型工具执行依赖 |
| npm | 包安装和分发 | 仅安装时需要 |
| ZeroMQ | IPython 内核 Jupyter 协议传输 | 内嵌于 ipykernel，不单独部署 |

以上为已确认事实，依据[安装脚本](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/install.sh)和[RLM 运行时文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/rlm-runtime.md)。

- **模型 Provider**：运行时依赖外部 LLM API。Provider 凭证由 TypeScript 主机解析，不进入 Python 内核。支持订阅和 API Key 两种方式。这不是可剥离的依赖——没有 LLM API，Agent 无法运行。
- **无数据库依赖**：不依赖 PostgreSQL、MySQL、Redis 或任何外部数据库。所有持久化通过本地文件系统。
- **无消息中间件依赖**：不依赖外部消息队列。
- **改造边界**：要将 Prime Agent 改造为 Stateful 调度系统，需要新增工作对象模型（Workspace/Project/Issue/Plan/Task）、任务关系与状态机、中心任务队列、执行者选择逻辑和跨会话调度状态持久化。当前架构的 Session 级调度器和 JSONL 持久化可以作为底层基础设施，但需要大幅扩展。这是架构推导。

### 架构范式为多进程本地 Agent 运行器，不支持分布式扩展

Prime Agent 的架构范式是**单机多进程 Agent 运行器**：

- **进程拓扑**：客户端（TUI/CLI/RPC）→ daemon supervisor → session worker → IPython kernel + RLM 子 Agent。所有进程在同一台机器上运行，同一 OS 用户权限。
- **隔离模型**：进程隔离用于生命周期和故障隔离，不是安全沙箱。worker 和内核以客户端的 OS 权限运行。
- **无分布式扩展**：不存在多节点协调、分布式锁或集群调度。daemon 是单实例本地进程。如果 supervisor 消失，worker 中的一个会获取原子启动租约并启动替代 supervisor——这是本地故障转移，不是分布式协调。
- **调度逻辑不可下沉**：Prime Agent 的调度能力（Session 级定时任务、心跳、目标续推）不是独立调度逻辑，而是嵌入在 AgentSession 和 worker runtime 中的会话内续推策略。将其下沉为普通 Agent 任务节点后会失去持久任务状态和跨会话恢复能力——但产品本就不具备这些能力，因此不存在"降级"问题。
- **扩展约束**：任务隔离依赖进程隔离（每棵根会话树一个 worker），多调度节点协调不存在。互斥机制仅限于 Session 级租约。

以上为已确认事实和架构推导，依据[架构文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/architecture.md)和[daemon 文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/daemon.md)。

### 客户端接入通过本地 daemon 协议，无法跳过客户端直接接入调度中心

Prime Agent 不存在独立的"调度中心"。客户端接入方式如下：

- **标准接入**：通过 `prime-agent` CLI 启动 TUI，TUI 通过 `DaemonAgentConnection` 与本地 daemon 通信。客户端拥有渲染和键盘输入，不拥有执行。
- **Headless 接入**：print 模式、JSON 事件流模式、RPC 模式（stdin/stdout JSONL），均为客户端行为，通过 daemon 协议与 worker 通信。
- **SDK 内嵌**：Node.js 应用可通过 `@earendil-works/pi-coding-agent` 包直接使用 `AgentSession`，通过 `InProcessAgentConnection` 在进程内运行，绕过 daemon。
- **ACP 接入**：通过 Agent Client Protocol，Prime Agent 作为 ACP Agent 运行。
- **Windows 与 macOS 差异**：macOS 和 Linux 上 daemon 通过本地 socket 通信。Windows 上依赖 bash shell 环境，daemon 协议行为应一致但未在文档中明确验证——这是未决项。

由于产品不提供调度中心，不存在"跳过客户端直接接入调度中心"的场景。如需将 Prime Agent 作为执行节点接入外部调度系统，可通过 RPC 模式或 SDK 嵌入方式实现桥接。改造范围限于在 RPC/SDK 层添加任务接收和状态上报逻辑，不影响核心 Agent 运行时。这是架构推导。

## 产品调研

### 产品定位与目标用户

Prime Agent 是 Prime Intellect 发布的开源编码与研究 Agent 运行器，围绕两个核心抽象设计：Recursive Language Model（RLM）和 Continual Harness。产品定位为"自改进 RLM Agent"，面向需要在长时间运行环境中进行编码、研究和自动化评估工作的开发者和研究人员。产品从 pi-mono 硬分叉而来，但已成为独立产品、CLI、安装源和开发仓库。

以上为已确认事实，依据[官方博客](https://www.primeintellect.ai/blog/prime-agent)和[GitHub README](https://github.com/PrimeIntellect-ai/prime-agent)。

### 核心流程

用户通过 CLI 启动 Prime Agent，在项目目录中运行。首次启动通过 `/login` 选择订阅或 API Key Provider。Agent 在当前目录工作，可执行命令和修改文件。用户通过 TUI 输入提示，Agent 通过持久 IPython 内核执行 Python 代码、文件操作、shell 命令和子 Agent 调用。会话以 JSONL 持久化，支持分支和恢复。关闭终端后会话在 daemon worker 中继续运行，可随时重新接入。

以上为已确认事实，依据[GitHub README](https://github.com/PrimeIntellect-ai/prime-agent)和[快速入门文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/quickstart.md)。

### 功能地图与边界

- **当前可用**：交互式 TUI、RLM 子 Agent、Agent 间消息、持久会话、daemon 后台运行、心跳、定时任务、持久目标、自主模式、上下文压缩、Continual Harness 自改进（`/refine`）、技能系统、MCP 集成、RPC/JSON/ACP 模式、SDK 嵌入。
- **实验性/规划中**：官方博客提到"模型-运行器协同学习"是未来方向，但当前没有模型围绕 Prime Agent 训练。
- **不支持**：Workspace/Project/Issue/Plan/Task 调度对象模型、任务 DAG、分布式调度、多节点协调、原生 Windows 支持、云端托管形态。

以上为已确认事实，依据官方文档和[GitHub Releases](https://github.com/PrimeIntellect-ai/prime-agent/releases)。

### 维护状态与版本演进

- **创建时间**：仓库创建于 2026-05-08，截至调研日（2026-08-07）约 3 个月。
- **最新版本**：v0.7.0（2026-08-05），另有 beta 通道（v0.7.0-beta.460.1）。
- **版本密度**：v0.3.1 至 v0.7.0 共 9 个正式版本，约 3 个月内发布，迭代速度高。
- **方向性变化**：v0.6.0 是重大版本，引入 RLM 返回句柄而非等待子 Agent 完成（breaking change）、角色寻址的 Agent 消息、核心家庭通信范围、ACP 模式、RLM 递归深度控制和空闲驱逐策略。v0.5.0 将会话输入调度重构为统一会话动作生命周期。v0.7.0 将 Agent 消息改为始终使用 steering 投递。
- **仓库热度**：4,925 stars，396 forks，206 个 open issues。对于 3 个月新仓库，热度较高。
- **提交活跃度**：最后 push 日期为 2026-08-07（调研当天），表明项目处于活跃维护状态。

以上为已确认事实，依据 [GitHub API](https://api.github.com/repos/PrimeIntellect-ai/prime-agent) 和 [Releases 页面](https://github.com/PrimeIntellect-ai/prime-agent/releases)。

### 生态与反馈

- **依赖关系**：基于 pi（pi-mono）构建，官方致谢 pi 作者。
- **文档体系**：完整的文档目录位于 `packages/coding-agent/docs/`，覆盖架构、daemon、RLM、长时运行、RPC、SDK、技能、扩展、会话格式等。
- **社区入口**：Discord、Twitter。GitHub Discussions 未启用。
- **Prime Intellect 平台**：Prime Intellect 有独立的云端平台（Lab），提供 GPU 计算、训练环境、推理 API 和沙箱。Prime Agent 与该平台是独立产品，但可通过 Prime Inference API 接入模型。
- **Issue 反馈样本**：v0.6.1 修复了多个社区报告的问题（#617-#623），包括 daemon 启动崩溃、ACP 模式问题和子 Agent 通知归属问题。样本量有限，不能代表普遍反馈。

以上为已确认事实，依据[GitHub 仓库](https://github.com/PrimeIntellect-ai/prime-agent)和[文档索引](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/index.md)。反馈样本边界：3 个月新仓库，Issue 数量和社区规模仍在增长中。

## 技术架构调研

### 系统全貌与运行形态

Prime Agent 以**单机多进程本地运行器**形态运行。系统由以下进程角色组成：

| 角色 | 职责 | 运行位置 |
| --- | --- | --- |
| Client（TUI / CLI / RPC） | 终端渲染、键盘输入、本地 UI 偏好 | 用户终端进程 |
| Daemon Supervisor | 公共 socket、客户端接入、路由、worker 健康、跨 Agent 消息投递、命令日志、协调更新 | 独立后台进程 |
| Catalog | 已保存会话扫描、非活跃会话文件操作 | supervisor 子进程 |
| Session Worker | 一个根 AgentSessionRuntime、根 AgentSession、调度器、IPython 内核和 RLM 子后代 | 独立进程组 |
| IPython Kernel | 模型面向的 Python 控制环境 | 独立进程（ZeroMQ 连接） |
| Model Provider | LLM 推理 API | 外部云端服务（Anthropic / OpenAI / Google 等） |

系统边界完全在单台工作机内。唯一的网络出口是对 LLM Provider 的 API 调用。

以上为已确认事实，依据[架构文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/architecture.md)和[daemon 文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/daemon.md)。

### 主要组件与核心链路

**核心链路：用户提示 → Agent 执行 → 结果返回**

1. 用户在 TUI 中输入提示，`AgentConnection` 将版本化命令发送到 daemon supervisor。
2. Supervisor 路由到活跃 Session worker。
3. Worker 将提示入队 Session 的 prompt queue。
4. `AgentSession` 向 Model Provider 发起流式请求。
5. Provider 返回文本或 IPython 工具调用。
6. 如有 IPython 工具调用，`AgentSession` 通过 ZeroMQ 在 IPython 内核中执行 Python。
7. 如模型代码调用 `rlm()`，通过 Jupyter comm 的 `host.request` 目标回到 TypeScript 主机，由 `AgentSession` 创建子 Agent。
8. 结果和制品写入 JSONL 会话文件和 session-artifacts 目录。
9. Worker 向 supervisor 发送代际感知事件，supervisor 转发给客户端渲染。

心跳、定时任务、目标续推和自主模式使用相同的执行和持久化路径，只是提示来源不同。

以上为已确认事实，依据[架构文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/architecture.md)中的 Prompt Execution Flow 时序图。

### 主要依赖

见"依赖根源"结论。核心运行时依赖为 Node.js ≥ 20.6.0 和 Python 3.11+。无外部数据库、消息中间件或云服务依赖。

### 接口形态

见"接口形态"结论。本地 CLI + daemon 协议 + RPC + SDK + ACP，无 REST/gRPC。

### 持久化方式

见"持久化"结论。JSONL 文件 + 文件系统制品目录，无数据库。

### 通信方式

见"通信方式"结论。本地 socket + ZeroMQ，无分布式中间件。

### 部署形态

#### 工作机安装

**macOS**：
- 安装方式：`curl -fsSL https://app.primeintellect.ai/prime-agent/install.sh | sh`
- 运行入口：`prime-agent` CLI 命令
- 依赖：Node.js ≥ 20.6.0（安装脚本可自动安装 standalone Node.js）、Python 3.11+（首次使用 IPython 时由 `uv` 自动引导）
- 权限：当前用户权限，无 root 要求
- 网络要求：安装时需要下载 npm 包；运行时需要访问 LLM Provider API
- 卸载方式：`npm uninstall -g prime-agent`，删除 `~/.prime/agent/` 目录

**Windows**：
- 安装方式：需先安装 bash shell（Git for Windows / Cygwin / MSYS2 / WSL），然后在 bash 中运行安装脚本
- 运行入口：在 bash 环境中运行 `prime-agent`
- 依赖：与 macOS 相同的 Node.js 和 Python 依赖，加上 bash 兼容层
- 权限：当前用户权限
- 网络要求：与 macOS 相同
- 卸载方式：与 macOS 相同
- **选型缺陷**：非原生 Windows 支持，依赖 POSIX 兼容层

以上为已确认事实，依据[安装脚本](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/install.sh)和[Windows 文档](https://github.com/PrimeIntellect-ai/prime-agent/blob/main/packages/coding-agent/docs/windows.md)。

#### 主体功能运行位置

主体功能完全运行在 PC 本地。Local 优先适配良好，无云端强绑定依赖。

#### 云端形态

Prime Agent 产品本身不存在云端组件。Prime Intellect 的 Lab 平台是独立产品，提供 GPU 计算、训练和推理服务，但不构成 Prime Agent 的运行依赖。用户可选择通过 Prime Inference API 接入模型，也可使用 Anthropic / OpenAI / Google 等第三方 Provider。

## 未决项与证据边界

- **Windows 上 daemon 协议行为**：文档未明确验证 Windows 上 daemon 本地 socket 的行为一致性。Windows 上 POSIX 兼容层的 IPC 行为可能与 Unix domain socket 存在差异。需要实际运行验证。
- **大规模会话恢复性能**：文档提到"大型快照以 512 KiB 为目标分块大小"和"4 MiB 以上的文件后备快照缓存"，但未提供大规模会话（数百 MB JSONL）恢复性能的基准数据。
- **多用户共享机器行为**：文档描述了 per-worker 认证令牌和 owner-only 权限，但未明确多用户共享同一台机器时的隔离行为。
- **ACP 模式在 Windows 上的兼容性**：ACP 文档提到 NDJSON on stdio，但 Windows 上 stdio 行为可能与 Unix 存在差异。

## 后续验证建议

- 在 Windows + Git Bash 环境中实际安装和运行 Prime Agent，验证 daemon 协议、IPC 和会话恢复行为。
- 测试长时运行场景：启动多个 RLM 子 Agent，验证 daemon 恢复、空闲驱逐和内核快照恢复的实际行为。
- 评估将 Prime Agent 的 RPC 模式或 SDK 作为外部调度系统的执行节点接入的可行性和改造范围。
- 如需 Stateful 调度能力，评估在 Prime Agent 的 Session 级调度器之上构建工作对象模型和中心任务队列的架构影响。
