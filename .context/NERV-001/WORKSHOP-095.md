# OpenAI Codex 平台化能力技术产品调研

> updated_by: Qoder
> updated_at: 2026-10-23 22:06:30 +08:00
> evidence_window: 调研日期 2026-10-23；入口文章发布于 2026-08-19；稳定版 rust-v0.164.0（2026-10-23）；定点源码 main@7d592f6dd9988e349e3164feaa21d0fc14bbac8a（2026-10-23 13:32 UTC）；产品文档为调研日在线快照。

## 交付结论

### Codex 是具有持久状态和自主续跑能力的执行宿主，尚不能认定为完整业务 Stateful 调度器

**已确认：**文章开放的是 Agent harness：会话上下文、模型与工具循环、执行边界、审批和结果事件。文章明确把产品记录、业务规则、业务工具和系统记录源留给宿主应用，而非承诺 Codex 负责其任务依赖与分配。[原文，2026-08-19](https://developers.openai.com/blog/codex-as-a-platform)

**已确认：**调研日版本已经不止“一次请求执行一次”：有持久 Thread、Goal、自动续跑、子代理和 SQLite 用户提交队列。把整个产品称为纯 Stateless 消费者会遗漏实质能力。[Goal 协议](https://developers.openai.com/codex/app-server#manage-a-thread-goal)、[稳定功能配置](https://developers.openai.com/codex/config-file/config-reference)、[本地状态入口](https://github.com/openai/codex/blob/7d592f6dd9988e349e3164feaa21d0fc14bbac8a/codex-rs/state/src/lib.rs#L76-L117)

**架构判断：**这些证据支持“有状态 Agent 执行宿主，附带会话内编排及自动化能力”，尚不足以证明它持久拥有 Issue→Plan→Task 的业务关系、解释任意任务依赖、按资源选择执行者并在故障后自动接管。选型时不能用恢复会话、连续 Goal 或多 Agent 并行代替完整调度证明。

### 平台接入不要求官方桌面客户端，但不同 SDK 的进程边界不同

**已确认：**宿主可以直接启动原生 `codex app-server`，经双向 JSON-RPC 控制 Thread、Turn、事件与审批；不必模拟桌面界面。TypeScript SDK 则启动 `codex exec` 子进程并消费 JSONL；Python SDK 使用本地 App Server。三者不是同一个传输接口的不同名称。[App Server](https://developers.openai.com/codex/app-server)、[TypeScript SDK 入口实现](https://github.com/openai/codex/blob/7d592f6dd9988e349e3164feaa21d0fc14bbac8a/sdk/typescript/src/exec.ts#L91-L95)、[Python SDK](https://developers.openai.com/codex/codex-sdk#python-library)

**接入影响：**接入执行循环是官方支持的产品方向；接入一个通用业务调度中心则不是已经获得的能力。当前命令文档仍把 App Server 命令及部分远程接口标为实验性，不能把“官方客户端正在使用”解释成独立部署协议已有生产稳定性承诺。[命令成熟度](https://developers.openai.com/codex/developer-commands)、[协议限制](https://developers.openai.com/codex/app-server#protocol)

### Windows 和 macOS 均有原生发布物，但运行门槛与沙箱门槛必须分开

**已确认：**`rust-v0.164.0` 提供 Windows、macOS 的 x64／arm64 CLI 和 App Server 发布物；桌面 app 不是它们的安装前提。原生运行不要求 Node.js 或 Rust 编译器，TypeScript SDK 才要求 Node.js 18+。[固定 Release](https://github.com/openai/codex/releases/tag/rust-v0.164.0)、[固定安装 README](https://github.com/openai/codex/blob/rust-v0.164.0/README.md)、[SDK 运行要求](https://developers.openai.com/codex/codex-sdk)

**选型约束：**Windows 11 原生路径、Windows 10 best-effort 路径、WSL2 和 MXC 沙箱不是等价支持。MXC 需要特定 Windows 原生能力；旧 elevated 沙箱需要管理员初始化。最低系统版本存在文档口径差异，本轮没有实机兼容性验证，不能承诺所有工作机开箱即用。[Windows 支持与沙箱](https://developers.openai.com/codex/windows/windows-sandbox)

### Local 优先只在本地执行层成立，默认模型服务与托管能力仍依赖云端

**已确认：**本地 harness 真正读写本机文件、运行命令、保存会话，不只是网页壳。但采用 OpenAI 模型时，模型推理与认证仍经过远端服务；工作上下文和工具输出会按执行需要进入模型请求。模型服务不可用时，本地二进制仍在不等于 Agent 能继续推理。[原文的开源边界](https://developers.openai.com/blog/codex-as-a-platform)、[认证模式](https://developers.openai.com/codex/auth)

**已确认：**官方支持 `--oss` 与本地 provider，可把模型访问改到本地服务；这需要另备模型、服务和算力。它不是把 OpenAI 托管模型及云服务一起私有化，也没有证明工具覆盖、效果与完整离线能力等价。[本地 provider](https://developers.openai.com/codex/config-file/config-advanced)

**选型判断：**本地执行与可替换推理端具有 Local 优先适配价值；默认云推理、云任务、账号服务和远程中继构成不同程度的外部依赖。若要求断网持续工作、完整云端能力私有化或直接获得业务调度中心，当前证据不能满足。

### 本地定时运行、远程访问与云任务是三种不同的连续工作保障

**已确认：**需要本地项目的 Scheduled task 要求电脑开机、桌面 app 运行且项目仍在磁盘上；远程访问也要求执行主机在线。Codex Cloud 的任务则在云 VM 中执行，电脑睡眠后仍可继续。[Scheduled tasks](https://developers.openai.com/codex/automations)、[远程连接](https://developers.openai.com/codex/remote-connections)、[Cloud](https://developers.openai.com/codex/cloud)

**已确认：**新版云环境为每个任务提供独立工作区，并保存未提交修改和已安装工具；默认 saved VM state 可在最后启动轮次或恢复任务后的七天内恢复。它不是无限期持久执行保证，更不是外部命令 exactly-once 保证。[云环境状态与限制](https://developers.openai.com/codex/environments/cloud-environments)

**选型影响：**周期触发、后台运行与结果待审收件箱确实可用；任务依赖图、优先级、重复触发处理、跨节点接管和组织级执行者分派仍须分别证明。不能把本地机器保持唤醒当作故障恢复机制。

### 开源 harness 可改造，完整托管控制面不可按同一方式自托管

**已确认：**`openai/codex` 使用 Apache-2.0；CLI、App Server 和 SDK 开源。官方明确 IDE extension 与 Codex Cloud 不开源，云环境基础项目开源不等于云任务服务开源。模型访问和 managed services 也被原文排除在开放 harness 之外。[官方开源清单](https://developers.openai.com/codex/open-source)、[许可证](https://github.com/openai/codex/blob/rust-v0.164.0/LICENSE)

**改造判断：**可以复用本地执行循环、沙箱、审批协议与会话状态；业务工作对象、依赖判断、派发策略及故障责任若由外部系统承担，属于补充上层系统，不是简单换一套 UI。把持久责任全部放进一次 Agent 调用，不能保持等价的调度能力。

## 调研目标

- 判断是否具备持久工作对象、关系和生命周期驱动的 Stateful 调度能力。
- 核验客户端接入、执行者分派、连续推进与失败恢复边界。
- 分别核验 Windows、macOS 工作机部署与 Local 优先适配程度。
- 明确状态、通信、数据库及本地与云端依赖的归属。
- 判断架构范式、私有化适配和依赖剥离的改造边界。

## 产品调研

### 产品定位与目标用户

调研主体为 **OpenAI Codex 的开放 Agent harness 与平台接入能力**，并覆盖同一产品实际使用到的桌面、本地服务、远程连接与托管云。用户提供的文章不是一个独立调度产品发布，而是说明怎样把 Codex 的执行循环嵌入已有产品。[原文](https://developers.openai.com/blog/codex-as-a-platform)

目标用户是需要在内部应用、工程流程或专门业务界面中加入 Agent 的开发团队。团队保留业务上下文、记录系统和批准流程，Codex 承担模型调用、上下文维护和工具执行。官方源码主仓库是 [openai/codex](https://github.com/openai/codex)，许可证与可公开复用范围以该仓库及开源清单为准。

文章中的 Relay 是使用虚构配送数据的集成示例，不是一个另外可采购的物流调度平台。报告只采用它证明宿主与 harness 的职责分割，不把示例中的业务记录算成 Codex 原生对象。

### 核心流程

以文章中的操作流程为例：用户在业务看板选择一条记录并触发动作；宿主把记录和目标交给 Codex；Codex 通过应用提供的 MCP 工具取数、分析并提出方案；有影响的写操作进入审批；获准后调用业务工具修改记录，宿主刷新看板。[Relay 流程](https://developers.openai.com/blog/codex-as-a-platform)

这里“工作从何而来”由业务界面、外部事件或计划任务决定；“执行中下一步做什么”可以交给 Agent；“业务对象是否完成、是否释放下游工作”仍需要记录系统和业务规则作出判断。模型说已完成、Turn 结束、业务任务完成和代码合并不是同一件事。

### 功能地图与边界

| 能力域 | 已确认能力 | 对调度判断的边界 |
| --- | --- | --- |
| 非交互执行 | `codex exec`、JSONL 事件、结构化最终输出、指定会话恢复 | 外部脚本／CI 提供触发与后续处理，不因此获得 Codex 原生 DAG |
| 应用嵌入 | TS／Python SDK、App Server、Thread／Turn／Item 与审批 | 控制 Agent 运行过程，不等于管理业务 backlog |
| 长期推进 | 持久 Goal、暂停／恢复、自动续跑 | 目标属于会话；未证明跨任务依赖与资源分派 |
| 多 Agent | 启动子代理、路由后续输入、等待与汇总、并发限制 | 存在会话内编排；不能只因有父子线程就认定存在任意工作图 |
| 定时自动化 | 独立轮次或返回已有聊天；本地项目可用 worktree | 依赖具体产品面和运行位置；CLI 不提供 Scheduled 管理界面 |
| 云端执行 | 环境发布、独立任务工作区、状态保存与跨设备继续 | 云内部调度和恢复契约不完全公开 |

上述已发布能力分别见 [非交互模式](https://developers.openai.com/codex/non-interactive-mode)、[SDK](https://developers.openai.com/codex/codex-sdk)、[长任务](https://developers.openai.com/codex/long-running-work)、[子代理](https://developers.openai.com/codex/agent-configuration/subagents)、[计划任务](https://developers.openai.com/codex/automations)。

**自动工作来源：**本地 Scheduled 可独立创建新聊天，也可定期返回已有聊天，支持自定义周期及 RFC 5545 RRULE；同一自动化可面向多个项目，但这不表示项目之间有依赖调度。无人值守沿用权限配置，不能把无人工值守当作自动扩大权限。当前统一文档另列的事件触发限于符合条件的网页／移动产品面，不适用于桌面、CLI 或 IDE，因此不计为开放 harness 已自带业务事件总线。[计划与触发边界](https://developers.openai.com/codex/automations)

**版本边界：**当前文档已有稳定 Python SDK；`codex mcp-server` 与独立同名 binary 已移除。Codex 作为 MCP 客户端使用业务工具仍存在，不能把移除 MCP server 命令解释成移除 MCP 集成。App Server 的动态工具、部分方法和传输仍有实验标记，必须按所用版本生成协议 schema。[SDK 说明](https://developers.openai.com/codex/codex-sdk)、[实验 API](https://developers.openai.com/codex/app-server#experimental-api-opt-in)

### 维护状态与版本演进

**已确认：**仓库调研日仍活跃，最新稳定 Release 为 `rust-v0.164.0`，发布于 2026-10-23 04:48 UTC；本轮源码核验使用当日较晚的固定 main commit，而非把主干全部变更都当作已发布能力。[Release](https://github.com/openai/codex/releases/tag/rust-v0.164.0)、[main 快照](https://github.com/openai/codex/commit/7d592f6dd9988e349e3164feaa21d0fc14bbac8a)

对本轮有意义的演进是：2026-08-19 的文章确立开放执行循环及三个接入层；当前文档进一步呈现 Python SDK、持久 Goal、共享本地服务及新版云环境。当前云文档明确区分新环境和计划弃用的 Legacy，不能沿用早期资料概括全部云产品。[文章](https://developers.openai.com/blog/codex-as-a-platform)、[新版云环境说明](https://developers.openai.com/codex/environments/cloud-environments)

0.164.0 的修复涉及压缩历史后的恢复、恢复线程配置，以及 Windows HTTPS／WebSocket 代理认证；这些会直接影响企业工作机接入和会话连续性。不能据某项修复推定所有类似故障已经消失。[0.164.0 发布说明](https://github.com/openai/codex/releases/tag/rust-v0.164.0)

**维护边界：**官方接受 Issue、复现和根因分析，但当前贡献说明不接受外部代码 PR。Apache-2.0 允许的自行修改，不等于维护者承诺合入定制代码；需要 fork 的改造应承担持续跟版成本。[开源协作规则](https://developers.openai.com/codex/open-source)

### 生态与反馈

有效扩展点包括 MCP 服务、skills、SDK 和公开客户端协议。官方 Codex GitHub Action 把 Agent 放进 workflow runner；触发、依赖关系与后续 PR 阶段由外部 workflow 拥有，不计为 Codex 自有调度。[非交互模式中的 CI 流程](https://developers.openai.com/codex/non-interactive-mode)

公开反馈采用定点小样本，只用于提出验证项：

- **Windows 恢复失败：**2026-10-22 创建的 [#56264](https://github.com/openai/codex/issues/56264) 报告特定桌面版本及内置 alpha CLI 缺少 `SYSTEMROOT`，导致已有聊天无法恢复。报告者仅称疑似升级回归；不能外推稳定 CLI 0.164.0 普遍失败。
- **认证／路由阻断推进：**2026-10-16 创建的 [#54540](https://github.com/openai/codex/issues/54540) 报告 Windows 上 Goal／子代理使用期间出现 workspace routing 超时，但没有建立与这些功能的确定因果关系。它说明本地执行仍可能受远端账户链路影响，不能据此推断内部调度结构。
- **远程连接连续性：**2026-10-23 创建的 [#56435](https://github.com/openai/codex/issues/56435) 报告特定 Linux 主机上 remote-control 连接反复断开后自动重连。它是中继连接样本，不代表工作机平台支持结论，也不证明任务被自动迁移。
- **漏跑与补跑政策：**[关于离线后的计划任务行为的 #24327](https://github.com/openai/codex/issues/24327) 提出补跑政策需求；不同版本评论报告的现象不一致。只据此保留验证项，不归纳为“一律补跑”或“一律丢弃”。

这些样本截至 2026-10-23，不能代表总体故障率、采用率或产品质量。

## 技术架构调研

### 系统全貌与运行形态

以下为**依据官方职责描述形成的逻辑拓扑**，不是对闭源后端物理部署的确认。

```text
宿主业务应用／自有工作记录与规则
  ├─ codex exec 或 TypeScript SDK → 本地 CLI 执行进程
  └─ 自定义客户端或 Python SDK → 本地 App Server
                                      ├─ Thread / Goal / 提交队列 / 历史
                                      ├─ OS 沙箱 → 文件、命令、业务工具
                                      ├─ MCP 服务／宿主动态工具
                                      └─ 模型 provider → OpenAI 云或可配置本地服务

官方桌面／移动／网页／CLI
  ├─ 访问本地或 SSH 主机上的执行服务
  ├─ 经托管远程中继访问已配对主机（可选）
  └─ 提交 Codex Cloud 任务
       → 托管账号、环境与任务服务
       → 从发布环境创建独立 VM 工作区
       → 模型与工具循环 → 保存状态、返回差异与测试结果
       → 人工审阅、继续、提交或 PR
```

本地 App Server 不是 Codex Cloud 控制面。“在远程服务器启动自己的 App Server”属于自托管执行节点；“用 Codex Cloud”属于 OpenAI 托管服务。两者也都不必然表示已经有多工作机任务调度池。[App Server](https://developers.openai.com/codex/app-server)、[云环境](https://developers.openai.com/codex/environments/cloud-environments)

### 工作对象、关系与生命周期

| 对象 | 已确认事实与状态归属 | 调度含义 |
| --- | --- | --- |
| Workspace | 本地工作目录／执行权限范围与 ChatGPT 账号 workspace 分属不同层次；后者管理成员与产品权限 | 不能把账号组织或文件目录视为任务分派中心 |
| Project | 本地 SQLite 中的独立 UUIDv7 对象，保存名称、metadata、roots 与时间；创建可带幂等键。Thread 通过可空的 `project_id` 归属一个 Project；Project 可关联多个 Thread | 是真实持久组织对象，但不是业务 Task 或执行者 owner；删除 Project 清空关联，不自动删除所含 Thread |
| Issue | 文章中的业务记录由宿主拥有；官方外部 issue 集成把工作带入 Codex | 当前证据未建立 Codex 自有 issue 生命周期及 issue 依赖解析器 |
| Plan | `turn/plan/updated` 含步骤文本与 pending／inProgress／completed 状态 | 是执行计划更新，不是已经证明可独立调度、定义前置依赖的 Plan 对象 |
| Task | 本地公开基础对象为 Thread→Turn→Item；云侧有任务 ID、环境和状态；Scheduled task 另有计划及运行记录 | 产品存在多种 task 语义，不能合并为同一业务状态机 |
| Goal | 保存 Goal ID、Thread ID、目标、状态、预算／用量与耗时，可暂停、恢复和清除 | 能驱动同一聊天持续推进，不自动等价为多任务依赖图 |
| 子代理关系 | 可启动子线程；协议存在 session root、fork lineage 和 parent／ancestor 查询 | 会话派生和分工有真实关系，但没有因此证明通用 DAG |

Project 的创建、关联、删除语义来自固定主干的 [projects.rs](https://github.com/openai/codex/blob/7d592f6dd9988e349e3164feaa21d0fc14bbac8a/codex-rs/state/src/runtime/projects.rs#L139-L224) 与 [归属操作](https://github.com/openai/codex/blob/7d592f6dd9988e349e3164feaa21d0fc14bbac8a/codex-rs/state/src/runtime/projects.rs#L340-L429)；Goal 存储见 [goals.rs](https://github.com/openai/codex/blob/7d592f6dd9988e349e3164feaa21d0fc14bbac8a/codex-rs/state/src/runtime/goals.rs#L43-L213)。其余对象依据 [Thread 与 Goal](https://developers.openai.com/codex/app-server#threads)、[计划事件](https://developers.openai.com/codex/app-server#turn-events)、[Cloud CLI](https://developers.openai.com/codex/developer-commands#codex-cloud-list)、[Scheduled](https://developers.openai.com/codex/automations)。这些模型没有建立 Issue 自动转成 Plan、Plan 再转成带依赖 Task 的统一转换关系。

**已确认的执行生命周期：**客户端创建／恢复 Thread，再调用 `turn/start`；Turn 进入 `inProgress`，经工具、审批和模型循环后发出 `turn/completed`，终态可能是 `completed`、`interrupted` 或 `failed`。等待审批是执行过程中的状态，不是另一个业务 Task 自动进入 ready 的证据。[生命周期](https://developers.openai.com/codex/app-server#lifecycle-overview)、[Turn 事件](https://developers.openai.com/codex/app-server#turn-events)

**已确认的连续推进：**固定主干的 GoalExtension／GoalRuntime 在线程 idle 时自动调用续跑逻辑，resume 时恢复 active Goal 的运行记账，thread stop 时注销 runtime。续跑需要活跃 ThreadManager／thread、active Goal 且未被延迟；不可重试或耗尽重试的错误会阻塞 Goal，用量限制也会阻止继续。它不是每一轮都等客户端手动输入“继续”。[Goal 生命周期](https://github.com/openai/codex/blob/7d592f6dd9988e349e3164feaa21d0fc14bbac8a/codex-rs/ext/goal/src/extension.rs#L165-L211)、[续跑准入](https://github.com/openai/codex/blob/7d592f6dd9988e349e3164feaa21d0fc14bbac8a/codex-rs/ext/goal/src/runtime.rs#L412-L515)

**恢复边界：**Goal 的持久记录不自行执行；服务活跃而 UI 断线时可能继续，进程退出后须恢复运行宿主和线程。当前证据未建立“重启自动载入全部 active Goal”或“其他工作机接管 Goal”的保证。子代理跟随会话组织及权限；它们的并发上限不是全局资源调度证明。

**当前未证明：**任意 Task 前置依赖、上游取消／失败导致的下游规则、统一优先级和资源匹配、租约驱动的跨工作机故障接管。对于开源执行层，判定停在已核验的会话机制；对于闭源云端，不能把未公开解释成内部不存在。

### 主要组件与核心链路

#### 链路一：宿主发起工作并完成有审批的业务写入

宿主根据业务规则选择记录与动作 → App Server 接受 Thread／Turn → harness 访问模型及 MCP／动态工具 → 客户端收到带 thread／turn 标识的审批请求 → 人或既定策略作出决定 → 工具修改业务记录 → 宿主刷新业务视图并决定是否完成工作。[原文](https://developers.openai.com/blog/codex-as-a-platform)、[审批协议](https://developers.openai.com/codex/app-server#approvals)

跨边界数据包括业务上下文、工具参数／返回值、模型请求和批准结果。业务完成状态的权威仍在宿主记录系统；Codex 返回结构化结果有助于接入，但不会自动代替该系统的状态迁移。

#### 链路二：已有会话继续、队列提交与多 Agent 推进

调用方按保存的 Thread ID 恢复历史，再提交后续输入或设置 Goal；Agent 继续模型／工具循环，必要时启动子代理；主线程等待并汇总结果。子代理继承父级权限边界，定制角色指令不等于另建安全隔离。[SDK 恢复](https://developers.openai.com/codex/codex-sdk)、[Goal](https://developers.openai.com/codex/long-running-work)、[子代理权限](https://developers.openai.com/codex/agent-configuration/subagents)

客户端退出、服务进程退出和主机关机必须分开。App Server 文档说明最后一个订阅者离开后，线程须连续无订阅且无活动 30 分钟才卸载；不能说断开 UI 就一定立即停止。磁盘历史可恢复也不保证所有执行中的外部副作用可以安全重放。[取消订阅](https://developers.openai.com/codex/app-server#unsubscribe-from-a-loaded-thread)

官方还有显式 host handoff：匹配同一 Git 仓库的已保存项目后，传输聊天和 Git 状态，创建／复用 worktree；正在运行的响应会先被中断，且不支持 handoff 到 Codex Cloud 环境。这是真实迁移能力，但不是调度器检测故障后自动接管。[主机间 handoff](https://developers.openai.com/codex/remote-connections)

#### 链路三：创建云任务并形成审阅闭环

ChatGPT 登录 → 连接 GitHub → 选择仓库并让 Codex 准备依赖与启动流程 → 人工检查后 Publish 环境 → 每个任务创建独立 VM 工作区 → Agent 修改和测试 → 保存工作区状态 → 用户从设备端审阅、继续、提交或开 PR。[Cloud 流程](https://developers.openai.com/codex/cloud)、[环境发布与状态](https://developers.openai.com/codex/environments/cloud-environments)

云任务成功提交后可以在 PC 睡眠期间继续；但提交时断线是否成功、云 VM 故障是否重试、重复提交是否归并，仍应依据接口返回及实际验证，不能从后台执行能力推导。

### 主要依赖

| 形态 | 安装／运行所需 | 非通用硬依赖或限制 |
| --- | --- | --- |
| 原生 CLI／App Server | 对应 OS／架构发布物、可写状态目录、工作文件、实际所用 shell／工具、模型 provider | Node 和 Rust 编译器不是原生发布物运行前提；用户代码需要什么构建工具由项目决定 |
| npm CLI | Node ≥16、npm 与对应平台发布包 | 不等于 TS SDK 的最低 Node 版本 |
| TypeScript SDK | Node ≥18、SDK 及其匹配 CLI runtime | SDK 0.164.0 发布包精确依赖 CLI 0.164.0；全局 CLI 升级不代表 SDK runtime 升级 |
| Python SDK | Python ≥3.10、SDK 自动提供的匹配 Codex runtime | 主动指定另一 binary 后，协议匹配责任需要重新验证 |
| 本地持久状态 | 内嵌 SQLite 与本地历史存储 | 无需另外部署数据库服务器；不能把 SQLite 全部视为可随意丢弃的缓存 |
| 云端任务 | ChatGPT 账号／产品权限、GitHub 仓库授权、发布的云环境、任务所需网络与凭据 | 云 VM 与控制面由 OpenAI 托管；不是用户准备一个容器就可替换 |

证据见 [安装说明](https://github.com/openai/codex/blob/rust-v0.164.0/README.md)、[npm CLI 配置](https://github.com/openai/codex/blob/rust-v0.164.0/codex-cli/package.json)、[SDK 0.164.0 发布元数据](https://registry.npmjs.org/@openai/codex-sdk/0.164.0)、[SDK 文档](https://developers.openai.com/codex/codex-sdk)、[状态库依赖](https://github.com/openai/codex/blob/7d592f6dd9988e349e3164feaa21d0fc14bbac8a/codex-rs/state/Cargo.toml)、[云环境](https://developers.openai.com/codex/environments/cloud-environments)。

**固定源码事实：**状态 crate 编译断言要求 bundled SQLite 至少 3.51.3，以包含特定 WAL 修复。这是构建内嵌库的要求，不是让终端用户另装同版本数据库服务；没有据此发现需要专属外置数据库扩展。[编译约束](https://github.com/openai/codex/blob/7d592f6dd9988e349e3164feaa21d0fc14bbac8a/codex-rs/state/src/lib.rs#L7-L10)

MCP、外部业务系统和应用提供的工具按流程选择，不是所有 Codex 运行都必须存在。若某个 MCP server 被配置为 required，其启动失败会阻止新建／恢复线程，属于使用者选定的强依赖。[Thread 启动约束](https://developers.openai.com/codex/app-server#start-or-resume-a-thread)

### 接口形态与客户端接入

**本地进程接口：**`codex exec` 提供非交互调用和 JSONL；TS SDK 包装该调用。`codex app-server` 使用双向 JSON-RPC 2.0 语义，线上省略 `jsonrpc` 字段，默认 stdio JSONL；另有 WebSocket 和 Unix socket 传输。Python SDK 使用本地 App Server。[非交互模式](https://developers.openai.com/codex/non-interactive-mode)、[协议](https://developers.openai.com/codex/app-server#protocol)、[SDK](https://developers.openai.com/codex/codex-sdk)

**接入语义：**客户端发起或管理 Agent 会话；服务返回进度、审批和工具请求。这不同于“空闲工作机向中心领取业务任务”。公开协议可跳过官方客户端接入执行服务，但没有因此证明存在可直接接入的通用业务调度中心。

**握手与鉴权：**每个连接执行 `initialize`／`initialized`。传输认证、模型账号认证、业务工具授权和 OS 沙箱是不同层次；初始化 metadata 不是跨租户访问控制。OpenAI 模型可使用 ChatGPT OAuth 或 API key；外部托管 token 模式还要求宿主负责刷新。[初始化](https://developers.openai.com/codex/app-server#initialization)、[认证模式](https://developers.openai.com/codex/app-server#authentication-modes)

**信任边界：**当前文档警告非 loopback WebSocket listener 在 rollout 期间默认可能无认证；远程使用须配置 bearer 验证并置于 TLS 或 SSH 隧道后。部分显式进程／shell 接口可在 Agent 沙箱外运行，因此 App Server 客户端应被视为受信任控制方，不能把模型的沙箱当作面向任意远端调用者的安全隔离。[协议安全说明](https://developers.openai.com/codex/app-server#protocol)、[Thread shell command](https://developers.openai.com/codex/app-server#run-a-thread-shell-command)

**云接口：**官方客户端及实验性 `codex cloud` 可提交／查看云任务，`codex cloud exec --env …` 指定环境，`codex cloud list` 返回任务 ID 和状态，`codex apply` 拉取最新 diff。没有把 UI 使用的后端接口当作已有公共 REST 调度 SLA。[云命令](https://developers.openai.com/codex/developer-commands#codex-cloud)

**改造范围：**简单脚本可复用 exec／SDK；富客户端需处理流事件、错误、审批、恢复、版本 schema 和进程生命周期。把同一服务开放给多人或多工作机，还需要明确账号隔离、凭据归属、工作目录隔离与业务任务所有者，不只是增加网络监听。

### 持久化方式

**本地已确认：**TypeScript SDK 说明线程记录保存在 `~/.codex/sessions`，丢失内存中的 Thread 对象后可按 ID 恢复。当前 App Server 另说明新持久本地线程默认使用分页历史；状态层有 SQLite 元数据、Goal、Project 和提交队列。旧 JSONL／rollout 与较新的分页状态要按具体版本区分，不能把一个目录当成全部权威状态。[SDK 固定 README](https://github.com/openai/codex/blob/7d592f6dd9988e349e3164feaa21d0fc14bbac8a/sdk/typescript/README.md#L98-L105)、[历史模式](https://developers.openai.com/codex/app-server#start-or-resume-a-thread)、[状态入口](https://github.com/openai/codex/blob/7d592f6dd9988e349e3164feaa21d0fc14bbac8a/codex-rs/state/src/lib.rs)

**本地边界：**会话历史、进度、文件修改和业务记录并非同一存储。项目修改仍在工作目录／worktree，业务记录仍由宿主系统持有；`--ephemeral` 可不保存会话 rollout，但不能当作“关闭所有 SQLite 后完整功能仍等价”的证据。[ephemeral 语义](https://developers.openai.com/codex/non-interactive-mode)

认证默认可存于 `auth.json` 或 OS credential store，另有内存模式。退出账号和卸载程序不能混同为删除全部工作状态；凭据文件必须按 secret 处理。[凭据存储](https://developers.openai.com/codex/auth#credential-storage)

**云端已确认：**发布环境保存准备后的文件系统；新任务取该基线，旧任务保留自己的修改与工具，不随环境重新发布被直接覆盖。默认 saved VM state 恢复窗口是最后启动轮次或恢复任务后的七天。对话／任务元数据是否具有相同保留期、后端数据库类型、灾备和崩溃检查点没有公开证据，分别保持未决。[云 saved state](https://developers.openai.com/codex/environments/cloud-environments#reuse-and-update-saved-state)、[VM 状态限制](https://developers.openai.com/codex/environments/cloud-environments#vm-specifications)

### 通信方式

- **宿主↔本地执行服务：**双向 stdio／socket，事件推送而非定期读取全部结果；审批由 server 发请求，客户端回决定。TS SDK 的 exec 事件流不等于完整 App Server 请求协议。
- **执行服务↔模型：**按 provider 配置访问模型端点；默认云推理，即使沙箱命令禁止联网，也不表示模型推理转到本地。
- **Agent↔业务工具：**MCP 或宿主动态工具，工具的数据和授权边界取决于实际部署；动态工具协议仍有实验标记。
- **远程客户端↔执行主机：**可通过 SSH 启动远端 App Server；官方配对设备还可经托管安全中继访问主机。
- **客户端↔云任务：**通过 OpenAI 托管产品访问状态和结果；服务内部消息中间件、worker 协议和重试协同未公开。

证据见 [协议与审批](https://developers.openai.com/codex/app-server)、[provider](https://developers.openai.com/codex/config-file/config-advanced)、[远程连接](https://developers.openai.com/codex/remote-connections)、[Cloud](https://developers.openai.com/codex/cloud)。

**断线边界：**网络连接恢复、线程重新载入、Goal 继续和未完成外部动作恢复是不同层次。官方已有部分重连／恢复能力，但没有在本轮建立一套跨这些层次的事务性完成保证。

### 任务队列

**已确认的区别：**App Server 的 WebSocket 入口使用有界请求队列，满载时返回 `-32001`；这解决入口背压，不等于持久业务任务队列。源码中另外存在 `SqliteQueueStore`、`QueuedUserSubmissionRecord` 和每线程待提交数量上限，不能据传输层队列就断言所有队列都在内存。[协议背压](https://developers.openai.com/codex/app-server#protocol)、[SQLite 队列入口](https://github.com/openai/codex/blob/7d592f6dd9988e349e3164feaa21d0fc14bbac8a/codex-rs/state/src/lib.rs#L98-L117)

**队列对象已确认：**固定主干的队列服务把记录定义为“等待在所属 thread 启动的一条用户消息”，拒绝非用户输入；它不是一条具有业务依赖、worker owner 和运行租约的 Task。`codex queue` 可向已有会话提交文本，但这仍是向执行会话投递工作，不是工作机从中心领取业务 Task。[对象定义](https://github.com/openai/codex/blob/7d592f6dd9988e349e3164feaa21d0fc14bbac8a/codex-rs/ext/queue/src/service.rs#L40-L43)、[CLI 命令](https://developers.openai.com/codex/developer-commands)

**持久化与并发已确认：**SQLite 按 thread 保存顺序，入队用单条 SQL 处理容量和排序，重排采用 `BEGIN IMMEDIATE`；派发服务用进程内按 thread 的 Mutex 串行化。这里有真实的数据库一致性与并发机制，但不是持久 worker claim。[队列存储](https://github.com/openai/codex/blob/7d592f6dd9988e349e3164feaa21d0fc14bbac8a/codex-rs/state/src/runtime/queued_items.rs#L79-L202)、[派发锁](https://github.com/openai/codex/blob/7d592f6dd9988e349e3164feaa21d0fc14bbac8a/codex-rs/ext/queue/src/service.rs#L247-L263)

**完成边界已确认：**服务调用 `start_turn_if_idle`；得到 `Started` 后删除队列记录，不是等 Turn 成功完成才 ACK。Core 明确说明接纳返回不等待 rollout 持久化或模型执行。因此这条出队链路不能证明“队列出队＋执行检查点”在一个原子事务中，也不能独立承担进行中任务的租约回收。[接纳后删除](https://github.com/openai/codex/blob/7d592f6dd9988e349e3164feaa21d0fc14bbac8a/codex-rs/ext/queue/src/service.rs#L391-L401)、[Core 接纳说明](https://github.com/openai/codex/blob/7d592f6dd9988e349e3164feaa21d0fc14bbac8a/codex-rs/core/src/session/turn_input.rs#L1-L11)

**恢复与去重边界：**未删除的记录可以留在磁盘；观察器每十秒检查数据库变化，针对发生变化或恢复加载的 thread 再派发，因此不是仅有单次进程内队列。队列项携带 `client_id`，但本次核验的入队／接纳链路没有据此建立 exactly-once 去重。已出队的进行中工作是否由别处的恢复机制覆盖，需要另证，不能根据本队列宣称自动重排或断言整个产品必然丢失任务。[队列观察器](https://github.com/openai/codex/blob/7d592f6dd9988e349e3164feaa21d0fc14bbac8a/codex-rs/ext/queue/src/service.rs#L89-L245)、[输入标识传递](https://github.com/openai/codex/blob/7d592f6dd9988e349e3164feaa21d0fc14bbac8a/codex-rs/core/src/session/turn_input.rs#L967-L986)

**部署判断：**单机使用内嵌状态库与宿主服务即可提供这种队列。外部进程能够写入、服务能够发现变化，不等于多个服务器已实现原子竞争领取；不能把共享状态目录当作分布式队列部署方案。

**产品队列边界：**Scheduled 的收件箱承载待审结果；它不能证明执行任务如何抢占。云端能接受和并行运行任务，但持久队列技术、租约、超时回收、重试和跨 worker 失败转移仍属闭源未决。

### 部署形态

#### Windows 工作机安装、运行、升级与卸载

**原生安装：**可按固定 README 使用 Windows PowerShell 安装器、`npm install -g @openai/codex`，或下载匹配 x64／arm64 的 CLI／App Server 发布物。普通交互入口为 `codex`，脚本入口为 `codex exec`，产品接入入口为 `codex app-server`；不用先安装桌面 app。[固定 README](https://github.com/openai/codex/blob/rust-v0.164.0/README.md)、[发布物](https://github.com/openai/codex/releases/tag/rust-v0.164.0)

**系统与依赖：**固定版安装文档列 Windows 11／WSL2；当前 Windows 专页把近期完整更新的 Windows 10 视为 best effort，并说明实际需要 1809+ 的 ConPTY。建议以 Windows 11 为验证基线，不能把最低终端能力当作全部功能支持保证。专页还要求准备 Windows Package Manager；项目需要的 Git、shell、构建器需按实际任务提供。[固定安装要求](https://github.com/openai/codex/blob/rust-v0.164.0/docs/install.md)、[当前 Windows 矩阵](https://developers.openai.com/codex/windows/windows-sandbox)

**权限与沙箱：**兼容设备优先采用 MXC，不需创建附加用户或管理员批准的初始化；官方注明 Windows 11 24H2 build 26100.9278／25H2 build 26200.9278 引入所需能力，仍要看设备与策略。旧 elevated 模式需管理员初始化，但沙箱命令不以管理员运行；unelevated 是网络隔离较弱的回退方案。WSL2 使用 Linux 运行环境与沙箱，不应描述为同一原生二进制模式。[MXC 与 fallback](https://developers.openai.com/codex/windows/windows-sandbox)

**网络：**安装器／npm／发布物下载需要相应下载服务；默认推理需要模型与认证服务可达。企业代理、内部 CA、MCP 和仓库访问是不同要求。Windows 原生用户目录与 WSL Linux home 不自动共享配置与状态；需明确实际运行在哪一侧。[Windows app／WSL](https://developers.openai.com/codex/windows/windows-app)、[认证与 CA](https://developers.openai.com/codex/auth)

**桌面程序：**当前 Codex 桌面入口已跳转到 ChatGPT desktop app，并明确支持 Windows。它是可选管理界面，不是完整业务中心服务。帮助页检索片段列 Windows 10 build 17763.0+ 与 x64／arm64，但本轮正文抓取受阻，桌面最低版本暂列待确认；不可替代上面的 CLI／沙箱支持矩阵。[当前桌面入口](https://developers.openai.com/codex/app)、[Windows 帮助页](https://help.openai.com/en/articles/9982051-using-the-chatgpt-windows-app)

**升级：**支持的安装方式可使用 `codex update`，npm 路径由包管理器更新；SDK 应更新自身依赖，常驻 server 要按实际分发路径重启，桌面更新另行管理。服务更新可能打断活跃工作，不是无损滚动接管承诺。[更新命令](https://developers.openai.com/codex/developer-commands)、[固定更新映射](https://github.com/openai/codex/blob/rust-v0.164.0/codex-rs/tui/src/update_action.rs)

**卸载：**npm 安装可用 `npm uninstall -g @openai/codex`；桌面走系统应用卸载；手工发布物清理由安装目录决定——这些是依据分发机制的操作推导，并非已验证的统一清理器。原生安装器的完整卸载、后台服务残留和状态清理清单未决。`codex sandbox uninstall` 只清理旧 Windows 沙箱机器级账号／规则，需要管理员，明确不是整个 Codex 的卸载，也不删除全部本地状态。[旧沙箱卸载定义](https://github.com/openai/codex/blob/rust-v0.164.0/codex-rs/cli/src/sandbox_uninstall.rs)

#### macOS 工作机安装、运行、升级与卸载

**原生安装：**可按 README 使用 shell 安装器、`brew install --cask codex`、`npm install -g @openai/codex`，或下载 Darwin arm64／x64 发布物。`codex`、`codex exec`、`codex app-server` 的角色与 Windows 相同。独立原生 App Server 不依赖桌面 app 或 Node。[固定 README](https://github.com/openai/codex/blob/rust-v0.164.0/README.md)、[发布物](https://github.com/openai/codex/releases/tag/rust-v0.164.0)

**系统与依赖：**固定安装说明给出 macOS 12+、至少 4GB RAM，Git 2.23+ 为推荐项；这些不能直接当作完整桌面 app 要求，独立 App Server 也没有在本轮找到单独完整的最低 OS 矩阵。源代码编译才另需 Rust 等构建工具，项目编译器不是 Codex 通用硬依赖。[固定安装／构建说明](https://github.com/openai/codex/blob/rust-v0.164.0/docs/install.md)

**权限：**本地命令使用 macOS Seatbelt 沙箱及配置的文件／网络边界。审批不能代替 OS 权限；需要桌面操作、浏览器或其他应用访问的额外授权只与启用那些功能有关，不能列作纯 CLI／App Server 的一律前提。[沙箱说明](https://developers.openai.com/codex/sandboxing)

**网络与本地状态：**安装和默认模型访问仍需要对应服务；默认状态位于用户 Codex home，可与同机使用相同目录的客户端关联。采用本地模型不自动允许业务工具出网，也不自动把远端模型与云任务功能带到本机。[认证](https://developers.openai.com/codex/auth)、[provider 配置](https://developers.openai.com/codex/config-file/config-advanced)

**桌面程序：**当前页面提供 macOS 下载并在本机展示 Apple Silicon 入口；帮助页检索片段提示 macOS 14+ 以及扩展的 CPU 支持，但正文未能取得，Intel 桌面支持与最低 OS 暂列未决。CLI／App Server 的 Darwin x64 发布物已经确认，不能因桌面证据不足而说整个产品不支持 Intel Mac。[桌面入口](https://developers.openai.com/codex/app)、[macOS 帮助页](https://help.openai.com/en/articles/9275200-downloading-the-chatgpt-macos-app)、[原生发布物](https://github.com/openai/codex/releases/tag/rust-v0.164.0)

**升级：**按安装路径使用 `codex update`、`brew upgrade --cask codex` 或 npm 更新；SDK 与后台服务各自核对版本。官方 `/daemon` 界面说明确认更新会退出 CLI，可能中断活跃工作。[后台服务更新](https://developers.openai.com/codex/developer-commands#manage-the-background-server-with-daemon)

**卸载推导：**Homebrew 安装使用 `brew uninstall --cask codex`；npm 安装使用 `npm uninstall -g @openai/codex`；桌面使用系统应用移除。原生安装器和手工包应依其安装位置处理，后台服务注销与凭据／状态保留政策需另核验。不得默认连项目、worktree、共享 Codex home 或钥匙串凭据一起删除，也不能声称移除 app 即已清空状态。

#### 主体功能运行位置与最小部署成本

| 运行选择 | 核心执行与状态位置 | 最小部署与 Local 优先判断 |
| --- | --- | --- |
| 本地原生 harness＋OpenAI provider | 文件／工具循环／会话在 PC，模型推理和账号服务在云 | 无需外置数据库或消息服务；需可用账号或 API 凭据与网络，属于混合形态 |
| 本地 harness＋本地 provider | 执行与推理可在 PC 或自管网络 | 需另备兼容模型服务、权重和算力；完整离线和能力等价未验证 |
| 自有远端 App Server | 执行和状态在所选主机，PC 是控制端 | 需维护服务、凭据、权限与安全连接；是执行节点，不是开箱即用业务中心 |
| 本地 Scheduled task | 本地 app 与项目所在机器 | 要保持开机、app 运行、项目存在；硬件可用性属于运行前提 |
| Codex Cloud | OpenAI 托管 VM、任务服务和存储 | 无需自管执行机器，但依赖账号、仓库连接与云权限；不能完整私有化 |

这些部署判断分别依据 [安装入口](https://github.com/openai/codex/blob/rust-v0.164.0/README.md)、[App Server](https://developers.openai.com/codex/app-server)、[本地 provider](https://developers.openai.com/codex/config-file/config-advanced)、[Scheduled](https://developers.openai.com/codex/automations)、[Cloud](https://developers.openai.com/codex/cloud)。本轮未运行 benchmark，不把硬件说明换算为可承载 Agent 数或性能保证。

#### 云端形态：模型服务、任务托管与远程中继分别承担什么

**模型与账号服务。**本地 harness 的 OpenAI 模型访问依赖远端推理；ChatGPT OAuth／API key 的权限与数据政策不同。Codex Cloud 要求 ChatGPT 登录，普通 API key 不能被当作完整云任务通行证。认证不可用可能阻断新会话或刷新，模型不可用阻断新的推理；这不意味着本地已写入的文件自动消失。[认证文档](https://developers.openai.com/codex/auth)

**新版任务托管。**可确认的逻辑组件是账号／workspace 权限、环境配置与发布、独立任务 VM、保存的环境与任务文件系统、模型／工具调用、结果访问及 GitHub 连接。官方给出的默认 VM 规格按方案从 2 vCPU／8 GiB 内存／8 GiB 磁盘到 4 vCPU／16 GiB／32 GiB 不等；这是托管资源规格，不是自托管安装要求。[云环境](https://developers.openai.com/codex/environments/cloud-environments#vm-specifications)

**接口与持久化。**网页、移动和桌面访问同一云任务；官方 CLI 可提交、列出并应用结果。发布环境形成新任务基线，旧任务保留自身 saved state。底层数据库、对象存储产品、worker 队列与内部通信协议未公开；本轮不把逻辑组件画成已确认的微服务或数据库拓扑。

**数据、网络与凭据。**代码检出、构建依赖、未提交修改和任务工具输出会在云 VM 中处理。直传环境变量可以被任务进程读取；network secret 则把占位值交给程序，由代理仅向允许的 HTTPS 443 目的地替换真实凭据。网络域名放行不等于业务系统授权，共享环境也不自动共享个人凭据。[network secrets](https://developers.openai.com/codex/environments/cloud-environments#configure-environment-variables-and-network-secrets)

**组织权限。**共享已发布环境不等于允许查看别人任务或修改环境；使用云任务与管理 workspace 环境是不同权限。GitHub 权限与个人连接取决于实际执行账号；共享 VPN 或云身份可能赋予额外业务系统访问，必须按它们的权限审查。[环境共享](https://developers.openai.com/codex/environments/cloud-environments#share-within-an-enterprise-workspace)

**私网接入并非私有化。**官方支持可选 VPN 和 OIDC 访问内网及云资源，仍是托管 VM 访问用户资源，不是控制面搬回本地。当前新版环境明确不支持 GitLab、自托管 GitHub Enterprise Server，以及 computer／browser use；本机个人 skills 不自动同步。上述限制会影响企业代码接入和与本地流程的功能等价。[服务接入与当前限制](https://developers.openai.com/codex/environments/cloud-environments)

**Legacy 必须单列。**当前官方仍将 Code Review、Linear 和 GitHub 集成列在 Codex Cloud Legacy，且说明计划弃用。Legacy 的 setup 网络／secret 规则不可直接套到新版环境；也不能假设新环境的 saved state、私网能力和所有集成已经全部迁移。[新旧边界](https://developers.openai.com/codex/environments/cloud-environments)、[Legacy 环境](https://developers.openai.com/codex/environments/cloud-environment)

**远程中继。**官方远程连接使用安全 relay 让已配对设备访问执行主机，无需把主机直接暴露公网；同一账号／workspace、配对和组织 Remote Control 权限构成接入边界。命令与工具仍在主机或 SSH 环境执行。主机睡眠、断网、关闭 app 或中继不可达会影响访问；中继内的路由／配对数据持久化、具体协议和消息保留策略未公开，不能声称端到端加密或不经过云。[远程连接](https://developers.openai.com/codex/remote-connections)

**故障影响。**云控制面不可用时无法按正常产品流程发起／查看／继续任务；已提交任务是否仍运行取决于故障所在组件，当前公开资料不足以保证。模型或业务凭据失效会阻断相关步骤；七天 saved state 窗口不构成 SLA、备份或崩溃恢复承诺。

### 依赖根源与改造边界

**可复用执行核心：**harness、原生平台沙箱、Thread／Goal、事件／审批和 SDK 接入。TS SDK 与直接 App Server 可按交互需求选择，但从一个切换到另一个需要改变生命周期和协议处理，不是换 URL 即完成。

**不能当作附加功能剥离的状态：**Goal、待提交输入和部分本地对象已经进入 SQLite。去掉数据库或只备份旧 JSONL，会损失多少运行状态必须按当前存储职责核验；不能因早期状态库说明有“元数据镜像”就把全部 SQLite 当缓存。

**可以配置但非等价替换的依赖：**模型 provider、MCP 和业务工具可改变；替换模型不补出云任务服务，关闭某个外部工具也可能让所选业务流程失效。官方没有提供完整 Codex Cloud 的自托管清单。

**扩展边界：**多线程／子代理并发是同一执行系统内的能力；多个独立 App Server 共享一份状态目录不是已经证明可用的高可用方案。业务任务依赖、全局去重、资源分配、接管策略和业务完成判定若需要外置，应明确其持久所有者；不在本轮实施这些改造。

## 未决项与证据边界

- **主干与发布版不同。**安装发布物及部分包装器证据固定在 0.164.0；深层状态核验固定在当日 main。主干发现不能未经核对直接保证某个桌面内置版本或已发布 SDK 具有相同语义。
- **当前在线文档会跳转到 ChatGPT Learn。**页面同时呈现多种产品面，只采用明确适用于 Codex 的部分；通用 Team Tasks、Work Cloud 的存在，不证明开放 Codex harness 已附带同等团队调度能力。
- **业务调度契约未建立。**公开资料没有在本轮回答任意 DAG、资源调度、队列公平性、跨执行者租约接管与 exactly-once 外部副作用。云内部实现保持未决，而非断言不存在。
- **本地状态恢复仍需版本化验证。**线程历史、Goal、提交队列、工作区文件与外部动作是不同恢复对象；本轮未实际杀进程、重启或制造断线。
- **双平台要求存在缺口。**Windows 运行矩阵与旧安装页口径不同；独立 App Server 最低 OS 没有完整承诺；桌面帮助页正文受访问限制，CPU 和最低版本应在正式部署前再确认。
- **完整离线及本地模型等价性未验证。**仅确认配置入口，不保证某个模型／服务版本具有所需工具、协议和推理能力。
- **卸载不等于数据清理。**原生安装器、daemon、OS 凭据及用户状态的完整清单未取得；包管理器卸载步骤已标为机制推导，未执行。
- **云状态保留不能扩大解释。**七天是默认 saved VM state 恢复窗口，不代表所有聊天、配置和结果的统一保留期；云端灾备和故障接管未决。

## 后续验证建议

1. 固定 CLI／App Server／SDK 版本，在 Windows 11 与 macOS 分别跑最小 Thread→Turn→审批→完成流程，核验原生沙箱、企业代理和后台服务生命周期；单独覆盖 Windows legacy fallback，不以 WSL 结果替代原生结果。
2. 分别验证 UI 断线、执行服务退出、机器重启、审批待决和模型中断，记录历史、Goal、待提交输入、文件修改与业务副作用哪些恢复、由谁恢复；特别检查重复执行而非只检查“聊天还在”。
3. 用本地项目 Scheduled task 验证睡眠、关闭 app、重新打开和错过多个周期后的处理；确认 worktree 清理与权限，不把收件箱记录当作每次任务都已执行成功。
4. 用固定云环境验证环境重新发布、旧任务继续、跨设备访问、凭据失效和 saved state 过期；向官方确认 Legacy 集成迁移、保留期限以及提交／取消／崩溃恢复契约。
5. 如仍需要 Index 定义的 Stateful 调度，要求提供持久任务依赖、ready 判定、执行者归属、失败转移的直接证据；若职责必须由宿主补充，应作为新增上层系统范围评估，而不是认定 Codex 已完整满足。
