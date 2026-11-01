# QwenPaw 技术产品调研

> updated_by: Qoder
> updated_at: 2026-10-23 15:24:55 +08:00
> evidence_window: 2026-10-23；发布形态核验 v2.2.2.post1（2026-10-22）；技术核验 main@fdf7e0243aba247a89c653efea6d8616fc7e932f（2.3.0b1）；官网文档为当日在线快照

## 交付结论

### QwenPaw 是本地优先的执行宿主与自动化运行器；Mission 有持久编排状态，但不是通用 Stateful 调度中心

**已确认：**产品提供对话执行、Cron、Heartbeat、多 Agent、Goal 和 Mission。Mission 不只是文本计划：PRD、story 验收状态和运行配置落盘，后续会话回合能恢复 Mission gate；不能把整个产品归为纯无状态函数。[产品架构](https://qwenpaw.agentscope.io/docs/architecture.en.md)、[Mission 状态文件](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/modes/mission/state.py#L181-L263)、[回合恢复](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/modes/mission/__init__.py#L127-L149)

**已确认：**固定主干的后台 Task 状态与结果登记在进程内存；Cron 持久保存计划和已写入历史，而不恢复运行中的协程。会话断线可重连、计划重载、Mission 状态恢复，都不能等同进程崩溃后续跑或任务转派。[Task 登记](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/app/routers/console.py#L54-L69)、[Cron 启动](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/app/crons/manager.py#L125-L159)

**判定：**它有局部持久编排，但现有证据不满足本轮对持久工作关系、执行归属、依赖就绪判断和故障后继续分派的完整要求，归类为执行宿主与自动化运行器，而非通用 Stateful 工作调度中心。此判断不否认 Mission 的结构化状态和验收循环。

### Workspace、项目目录、Mission 与 Task 不构成统一的项目—问题—任务调度模型

**已确认：**Workspace 是每 Agent 的配置、文件、记忆和会话边界；Project 的核心语义是 Agent 或会话绑定的工作目录。Mission 有 PRD、story 和验收流程；跨 Agent 后台调用另有 task ID。它们解决不同层次的问题，不能合并描述为一个已经统一的工作管理系统。[Workspace 架构](https://qwenpaw.agentscope.io/docs/architecture.en.md)、[项目目录语义](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/services/project_directory.py#L2-L25)、[后台协作](https://qwenpaw.agentscope.io/docs/multi-agent.en.md)

**证据边界：**本次目标范围内未建立一等 Issue 对象、跨 Mission 依赖图、资源驱动的任务认领或跨机器接管机制的证据。不能从这一有限核验外推“仓库绝不存在任何同名结构”。

### Windows 与 macOS 均可原生运行主体能力，但桌面版和 Hub 的能力、权限要求不同

**已确认：**两平台都有 Tauri 桌面包，也可通过 Python 包或安装脚本运行本地服务；桌面包以 Python sidecar 承载后端，并非必须连接云端的界面壳。桌面指南要求 Windows 10+ x64、macOS 14+，macOS 优先 Apple Silicon；Intel 的完整兼容性没有可靠保证。[桌面指南](https://qwenpaw.agentscope.io/docs/desktop.en.md)、[实际发布资产](https://github.com/agentscope-ai/QwenPaw/releases/tag/v2.2.2.post1)

**选型缺陷：**桌面仍标 Beta，且不包含 Hub；Hub 需要非桌面安装。Windows Hub Local 要求管理员权限，macOS Hub Local 要求可用的 `sandbox-exec`。这不是任一平台完全缺失，但意味着桌面安装不能直接替代多用户中心部署。[Hub 支持边界](https://qwenpaw.agentscope.io/docs/hub.en.md)

### 本地运行无需绑定官方云账号；选用云模型、云记忆或托管运行时后，数据边界随之改变

**已确认：**本地服务、Workspace、调度触发和本地模型可以留在工作机；模型可使用本机 llama.cpp 或已运行的本地模型服务。资源预先准备、仅使用本地入口和本地工具时，核心对话推理可离线运行。[模型配置](https://qwenpaw.agentscope.io/docs/models.en.md)

**合理推导：**“所有数据本地”只适用于相应配置，不能覆盖云模型推理、外部通信平台、远程 MCP、远程记忆或整机云部署。使用这些能力时，相应输入、工具结果或记忆会经过所配置服务；断网则影响对应链路。

**选型影响：**本地基础形态适配 Local 优先；将主体放在 ECS、AgentScope Platform 或 ModelScope Studio 的形态不符合“主体在工作 PC”的要求。应保留这些形态的事实调研，不能据此把整个产品判作强制 SaaS。

### Hub 是自托管的多用户运行控制面和可选模型网关，不是分布式任务调度器

**已确认：**Hub 为每用户提供一个本机进程或 Docker 容器，集中管理身份、运行时启停、数据和组织模型访问；它是用户自行部署的软件，不是 QwenPaw 团队替用户运营的必需云服务。官方明确当前不支持多节点容量调度和自动扩缩容，且只面向互相信任的内部团队。[Hub 文档](https://qwenpaw.agentscope.io/docs/hub.en.md)

**选型缺陷：**运行时账户与进程生命周期的持久管理，不等于工作任务依赖与执行归属的持久调度；Hub 也不适合直接作为面向陌生用户的强隔离多租户服务。中心部署后，文件与工具默认属于中心宿主，不会自动落到每个成员的工作 PC。

### 可以跳过官方界面接入执行接口，但不能据此获得远程工作机领取任务的协议

**已确认：**外部程序可通过 HTTP/SSE 与指定 Agent 会话交互，也可使用 `qwenpaw acp` 的 stdio JSON-RPC；QwenPaw 还可启动配置好的外部 ACP runner。三者分别是请求本机/服务端 Agent、将 QwenPaw 作为 ACP Agent、由 QwenPaw 委托子进程，不是同一接入语义。[REST API](https://qwenpaw.agentscope.io/docs/api-tutorial.en.md)、[ACP](https://qwenpaw.agentscope.io/docs/acp-integration.en.md)

**改造判断：**接入已有工作系统的执行入口较直接；建立持久任务关系、就绪队列、执行者租约与失败转移，则是增加调度层，不是仅改接口地址或移除桌面客户端。

### 最小部署不要求外置数据库或消息中间件，但软件包尚不是可独立抽取的轻量调度内核

**已确认：**官方单实例 Compose 只有 QwenPaw 服务和本地持久卷；Hub 使用 Python 自带 SQLite。没有证据表明 PostgreSQL、Redis 或外部消息队列是基础运行必需组件。[部署清单](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/docker-compose.yml#L3-L26)、[Hub 数据库连接](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/hub/database.py#L8-L63)

**已确认：**主干包仍直接依赖 AgentScope、APScheduler、ReMe 及浏览器、频道等能力。关闭功能不等于从安装依赖中剥离。非核心能力插件化仍在路线图中。[包元数据](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/pyproject.toml#L6-L79)、[路线图](https://qwenpaw.agentscope.io/docs/roadmap.en.md)

## 调研目标

- 判断是否持久拥有工作对象、任务关系、执行归属与连续推进机制。
- 识别客户端接入方式及任务分派、执行与恢复的职责边界。
- 核验 Windows、macOS 的安装运行与本地、云端、混合形态。
- 明确持久化、通信、队列及关键依赖的根源。
- 判断架构范式、Local 优先适配程度与改造边界。

## 产品调研

### 产品定位与目标用户

QwenPaw 是由 AgentScope 团队开发的个人 Agent 工作站：用户在自己控制的环境中部署常驻服务，通过 Console、终端或通信平台让 Agent 执行工作，并用定时触发和协作者扩展自动化。个人用户是基础形态的主要对象；可信内部团队可以采用 Hub。[官方仓库](https://github.com/agentscope-ai/QwenPaw)、[产品介绍](https://qwenpaw.agentscope.io/docs/intro.en.md)、[Hub 定位](https://qwenpaw.agentscope.io/docs/hub.en.md)

**已确认：**仓库公开、未归档，GitHub 许可证元数据及 README 标明 Apache-2.0。本轮涉及的执行宿主、调度入口、Hub 和部署配置均有公开材料；未发现必须购买闭源调度核心才能完成本地基础流程的证据。这不等于已经审计全部扩展或第三方云服务的许可证。[许可证](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/LICENSE)

### 核心流程

1. 安装并启动本地服务或桌面 App，初始化工作目录。
2. 配置云模型凭据或本地模型；创建 Agent，设置工作目录、技能、工具及权限。
3. 从 Console/终端/频道发送请求，或创建 Cron、启用 Heartbeat，让工作定时进入 Agent。
4. 宿主定位目标 Workspace，装配本次 Agent，加载会话与记忆，调用模型和工具；必要时委托其他 Agent 或启动 Mission。
5. 用户通过流式回复、后台任务查询、计划执行记录或 Inbox 接收结果；需要审批时人工介入。

这是从输入到执行反馈的完整工作链，但不自动包含来自项目/Issue 系统的持续认领、依赖解锁和故障转派。[入门流程](https://qwenpaw.agentscope.io/docs/quickstart.en.md)、[运行生命周期](https://qwenpaw.agentscope.io/docs/architecture.en.md)、[定时任务](https://qwenpaw.agentscope.io/docs/cron.en.md)

### 功能地图与边界

| 功能域 | 本轮相关能力 | 不能据此推出的能力 |
| --- | --- | --- |
| Workspace / 项目目录 | 每 Agent 独立配置、记忆、技能和会话；绑定一个或多个工作目录 | 工作管理 Project、Issue 状态机或任务依赖图 |
| 对话与工具执行 | 文件、Shell、浏览器、模型、MCP；HTTP 与终端接入 | 工具调用本身具有持久任务认领或自动恢复保证 |
| Cron / Heartbeat | 定时、一次性或周期任务、结果投递、并发与超时配置 | 因上游任务完成自动解锁下游的通用 DAG |
| 多 Agent | 跨 Workspace 通信、后台调用、同 Agent 临时子会话、外部 ACP | 长驻独立 worker 池、跨机器租约或故障迁移 |
| Goal / Mission | 连续循环；计划分解、worker 实施、verifier 验收与重试 | 所有工作统一纳入可恢复的中心调度 |
| Mail | 邮箱事件、准入、自动处理、特定待处理邮件重放 | 通用任务队列的全部消息都有同等恢复语义 |
| Hub | 多用户、每用户运行时、模型访问准入与运行资源配置 | 多节点任务放置、强多租户隔离或自动扩容 |

上述边界分别来自[架构](https://qwenpaw.agentscope.io/docs/architecture.en.md)、[循环工程](https://qwenpaw.agentscope.io/docs/loop-engineering.en.md)、[邮箱](https://qwenpaw.agentscope.io/docs/mailbox.en.md)和[Hub](https://qwenpaw.agentscope.io/docs/hub.en.md)。文档明确临时子 Agent 不可恢复；没有 Git 仓库时，fork 的上下文继承也不提供文件隔离。[子 Agent 特性](https://qwenpaw.agentscope.io/docs/multi-agent.en.md)

### 维护状态与版本演进

**已确认：**最新稳定 Release 是 2026-10-22 发布的 `v2.2.2.post1`，主要修正证书信任链相关依赖/安装构建，并更新打包 Node.js。Windows、macOS 安装资产均存在；调研期间主干仍有提交。[最新 Release](https://github.com/agentscope-ai/QwenPaw/releases/tag/v2.2.2.post1)

对本轮判断有意义的演进为：

- **2026-08-13，v2.1.0：**扩充桌面工作环境、工作区检查点和长会话连续性；这些提升执行体验，不能直接等同任务恢复。
- **2026-09-03，v2.2.0：**加入自托管多用户 Hub、邮箱能力和统一模型路由，使系统从个人宿主扩展到可信团队运行平台。
- **2026-09-10，v2.2.1：**记忆后端接口统一，远程记忆能力插件化，影响依赖剥离边界。
- **2026-10-15，v2.2.2：**加强部署、会话保存与中断场景修复；新增导入能力不代表接管来源系统的执行队列。

日期依据[主干 README 版本记录](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/README.md#L61-L73)，能力依据[2.1.0](https://qwenpaw.agentscope.io/release-notes/v2.1.0.md)、[2.2.0](https://qwenpaw.agentscope.io/release-notes/v2.2.0.md)、[2.2.1](https://qwenpaw.agentscope.io/release-notes/v2.2.1.md)、[2.2.2](https://qwenpaw.agentscope.io/release-notes/v2.2.2.md)官方说明。

**版本边界：**固定核验的主干自报 `2.3.0b1`，与稳定版已分叉，不能把主干行为或官网新增说明全部归到 `v2.2.2.post1`。下文涉及具体源码的结论以固定主干为准，安装资产与发布验证以稳定版为准。[主干版本](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/__version__.py)

### 生态与反馈

扩展载体包括 Skills、Python/前端插件、MCP、ACP、频道和记忆后端；它们能够扩展执行能力，并非已存在统一调度协议的证明。[插件](https://qwenpaw.agentscope.io/docs/plugins.en.md)、[MCP](https://qwenpaw.agentscope.io/docs/mcp.en.md)、[ACP](https://qwenpaw.agentscope.io/docs/acp-integration.en.md)

本轮抽样读取最近更新的公开 Issue，并补充 2026-09-01 以来与 Windows、定时任务或重启有关的反馈，只保留下列部署/接入主题：

- **发布验证存在，但不能视为完整兼容性矩阵。**`#8386` 中 PyPI、Windows/macOS 桌面的安装、启动、模型配置、基础聊天检查已勾选；Docker 聊天检查仍未勾选，汇总表部分状态也未同步，桌面环境字段不完整。Issue 已关闭不等于每个平台的所有检查均已完成。[2026-10-22 发布验证记录](https://github.com/agentscope-ai/QwenPaw/issues/8386)
- **Hub 本地模型需要单独验证网关配置。**用户报告在 `2.2.2/2.2.2.post1` 中直连本地模型可用、经 Hub 报错，随后确认调整单次输出上限到 8192 后解决。这是一个已给出解决反馈的配置样本，不代表 Hub 普遍不可用。[问题](https://github.com/agentscope-ai/QwenPaw/issues/8392)、[2026-10-23 解决反馈](https://github.com/agentscope-ai/QwenPaw/issues/8392#issuecomment-6357378613)
- **跨 Agent 消息归属需要验证。**`#8078` 报告 Windows 上 `2.2.2b4` 的跨会话消息产生同 session、不同 user 的新 chat；其内容由 AI 协助整理，属于待独立复现的用户反馈，不作为已确认根因。[2026-10-02 反馈](https://github.com/agentscope-ai/QwenPaw/issues/8078)

这些样本支持“安装封装、会话归属与网关适配仍需回归”的判断，不支持估算故障率、采用率或总体可靠性。

## 技术架构调研

### 系统全貌与运行形态

**已确认：**主干架构以一个常驻 QwenPaw 服务承载多个 Agent Workspace；AgentScope 2.0 作为进程内库提供 Agent 循环、消息和工具基础，不要求另起一个 AgentScope Runtime 服务。每次请求在目标 Workspace 中装配 Agent，持久资源留在 Workspace。[官方架构](https://qwenpaw.agentscope.io/docs/architecture.en.md)

```text
工作 PC 单用户形态
  Desktop/Tauri ── 本机 Python sidecar ─┐
  浏览器 / TUI / CLI / 自定义 HTTP 客户端 ─┤
                                       ▼
                         QwenPaw 常驻服务
                         ├─ Agent / Workspace
                         ├─ 请求执行、Goal / Mission
                         ├─ Cron / Heartbeat / 邮件事件
                         ├─ 本地文件、会话、记忆、配置
                         └─ 工具与权限层
                               │
              ┌────────────────┼──────────────────┐
              ▼                ▼                  ▼
        本机模型/工具    可选云模型/通信平台   可选远程 MCP/记忆

自托管团队形态
  成员浏览器 ── HTTPS 反向代理 ── Hub 控制面 / 入口代理
                                  ├─ 身份、运行记录、SQLite
                                  ├─ 每用户进程或容器 → QwenPaw
                                  └─ 组织模型网关 → 本地或云模型
```

此图是对文档的**架构归纳**，不是本次搭建并测得的网络拓扑。Hub 可以部署在工作 PC、内网服务器或云主机；“Hub Local”指运行在 **Hub 宿主本地进程**，不指每个成员各自的工作机。[Hub 运行后端](https://qwenpaw.agentscope.io/docs/hub.en.md)

### 主要组件与核心链路

**链路一：人工请求到执行反馈。**Console/频道接收输入，按 Agent ID 定位 Workspace，恢复会话、装配模型和工具，执行 ReAct 循环，经治理/审批处理工具请求，再把增量响应返回原入口。主状态留在宿主；如果调用云模型或远程工具，相关上下文跨网络发送。[请求生命周期](https://qwenpaw.agentscope.io/docs/architecture.en.md)、[HTTP/SSE](https://qwenpaw.agentscope.io/docs/api-tutorial.en.md)

**链路二：定时或事件工作。**Cron 保存计划和投递目标，到时发送固定文本或运行 Agent；Heartbeat 读取所属 Workspace 的 `HEARTBEAT.md`，按间隔/计划触发。邮件自动化则先经过邮件事件与发送者准入，再决定是否唤醒 Agent。结果可回频道或 Inbox；这些入口不是同一条具有统一恢复保证的任务队列。[Cron](https://qwenpaw.agentscope.io/docs/cron.en.md)、[Heartbeat](https://qwenpaw.agentscope.io/docs/heartbeat.en.md)、[邮箱自动化](https://qwenpaw.agentscope.io/docs/mailbox.en.md)

**链路三：计划分解与协作。**用户启动 Mission，Agent 生成 PRD，用户确认后进入执行；master 委派 story，worker 实施，verifier 验收，失败项继续重试直到通过或耗尽预算。普通跨 Agent 通信另外按指定 Agent 路由；同 Workspace 临时子 Agent 是独立会话，不是新建一台长驻 worker。[Mission](https://qwenpaw.agentscope.io/docs/loop-engineering.en.md)、[多 Agent](https://qwenpaw.agentscope.io/docs/multi-agent.en.md)

### 工作对象、关系与生命周期

| 对象 | 已确认的身份、归属与创建来源 | 调度含义与限制 |
| --- | --- | --- |
| Agent / Workspace | 用户通过界面/CLI 创建；Agent ID 对应配置及 Workspace，全局配置维护 Agent 集合 | 持久资源边界；不是 Task 状态机 |
| Project | Agent 默认或会话绑定的目录/标签；可由受信任请求指定，Mission 可固定本次目录 | 目录绑定可持久化，但不是管理任务关系的一等项目对象 |
| Issue | 本轮目标范围内未发现原生工作 Issue 模型证据 | 外部系统读来的事项只是输入，不自动由宿主持有生命周期 |
| Plan / Mission | 用户发起，按项目目录建立 Mission ID；配置记录 session、Workspace 和阶段，PRD 持有 story ID、验收条件与 `passes` | 是真实持久编排对象；master 推进 story，gate 根据落盘状态判断继续或终止，但未证实通用依赖调度 |
| Goal | 用户显式创建目标；`GoalSession` 保存状态、迭代与预算，由 `GoalMode` 的会话字典持有 | 所读实现为进程内状态；持续循环不代表持久任务 |
| Cron Job | 用户/Agent 创建；Workspace 中按 Job ID 保存定义，指定时间、内容、目标；执行历史另存 | 时间驱动调度；运行状态由本进程 manager 持有，不从历史恢复执行 |
| 后台 Task | 调用方指定目标 Agent/会话；宿主生成 task ID，登记运行状态、时间和结果 | task ID 与 chat/session 不同；登记在内存，不能重启后按原 ID 恢复 |

Workspace 与 Project 依据[配置归属](https://qwenpaw.agentscope.io/docs/config.en.md)和[目录定义](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/services/project_directory.py#L2-L25)。为核验“计划是否只是文本、归属是否落盘”，定点读取 Mission 的[状态保存](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/modes/mission/state.py#L181-L263)和[创建配置](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/modes/mission/handler.py#L250-L275)，确认它持久关联项目、session、PRD 与 story，但这些关联不是 worker 租约。Goal 则见[状态持有者](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/modes/goal/goal_mode.py#L60-L124)，Cron 和后台 Task 的存储、执行入口见下两节。

**推进责任：**Mission 先生成 PRD，经用户确认进入执行；gate 每轮重读配置和 PRD，终态停止，全部 story `passes` 为真时完成，否则继续。未通过项被整理成提示，要求 master 派 worker、派 verifier 并更新验收状态。已读入口证明“持久结果约束下的模型驱动推进”，不是按显式前置依赖计算可执行集合的通用 DAG 引擎。[产品流程](https://qwenpaw.agentscope.io/docs/loop-engineering.en.md)、[gate 判定](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/modes/mission/gates.py#L88-L154)、[继续指令](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/modes/mission/gates.py#L244-L272)

**分派与关系：**跨 Agent 调用由调用方指定 `to_agent`，不是未知 worker 从共享任务池认领；临时子 Agent 仍使用同一 Agent 身份。Mission 的 story 归属与 worker—verifier 阶段关系已确认；跨 Mission 依赖、硬性 story 顺序、并行分支汇合、优先级和资源驱动选派，本轮未建立直接证据。配置虽然保存每 story 重试上限，但本次未验证其强制执行语义。[跨 Agent 提交](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/agents/tools/agent_management.py#L486-L530)、[Mission 配置](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/modes/mission/handler.py#L250-L275)

**连续性边界：**临时子 Agent 不可恢复；Mission 保存的 active/phase/目录信息可在下一会话回合恢复 gate，但这不证明宿主启动时自动扫描、重新唤起或转交中断 story。上游失败、取消、超时后，没有已证的通用下游解锁/跳过/转派机制；不能用重新打开会话代替这一能力。[子 Agent 限制](https://qwenpaw.agentscope.io/docs/multi-agent.en.md)、[回合恢复入口](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/modes/mission/__init__.py#L127-L149)、[恢复条件](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/modes/mission/gates.py#L177-L230)

### 主要依赖

| 层次 | 依赖根源 | 可关闭或剥离的实际含义 |
| --- | --- | --- |
| 基础宿主 | Python `>=3.11,<3.14`；主干依赖 AgentScope `2.0.10`、Uvicorn、APScheduler `>=3.11.2,<4` | Agent 执行与定时触发直接使用这些库；不是仅可选插件 |
| 记忆 | 主干直接依赖 `reme-ai`，默认在进程内运行；Embedding 为可选配置 | 可禁用/更换记忆能力，但不能据此声称基础安装包已剥离依赖 |
| 模型 | 至少配置一个可用本地或远端模型 | 云 API Key 非必需；本地模型要另备运行库、权重和硬件 |
| 桌面/工具 | Tauri、Windows WebView2、可选浏览器/MCP/ACP 外部程序 | Python wheel 的预构建 Console 无需现场编译前端；Node.js 是否需要由安装形态和具体工具决定 |
| Hub | Local 用宿主 Python 与 OS 隔离；Docker 额外需要 Docker SDK 与 Linux-container Engine | 不启用 Hub 不需要 Docker；Hub Local 也不要求 Docker |
| 远程记忆 | 可选记忆插件与其 REST 服务 | 不是任务一致性所需数据库，可留用本地记忆或不启用 |

包约束以[固定主干 pyproject](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/pyproject.toml#L6-L79)为准，不能用旧云厂商入门材料中 Python 3.10 的说明覆盖当前要求。Hub 可选依赖见[extras](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/pyproject.toml#L139-L178)。

**数据库判断：**基础部署没有外置关系库、向量库或消息代理的强制要求。Hub 的 `control.db` 是内嵌 SQLite，使用标准库连接及 WAL；公开部署文档未给独立 SQLite 最低版本或专属扩展要求，不能由此推导任意系统 SQLite 都已验证兼容。[Hub 数据库入口](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/hub/database.py#L8-L63)

**剥离影响：**去掉远程记忆和向量检索不会补足或破坏一个本来就未获证实的通用任务租约系统；但抽取 Cron/Mission 形成独立产品，会涉及 Workspace、Agent 装配、会话、结果投递与权限边界，不能等同删除几个依赖声明。此为架构推导，未实施改造。

### 接口形态与客户端接入

- **Console / TUI / CLI：**管理与交互入口，使用同一宿主的 Agent 和 Workspace。裸 `qwenpaw` 是 TUI，`qwenpaw app` 才是本文讨论的 Web/API 常驻入口。[架构入口](https://qwenpaw.agentscope.io/docs/architecture.en.md)
- **HTTP + SSE：**`POST /api/console/chat`，通过 `X-Agent-Id` 指定 Agent，使用 `session_id`、`user_id` 和 channel 维持会话；可跳过官方 UI。流式返回不等于执行任务租约。[API 文档](https://qwenpaw.agentscope.io/docs/api-tutorial.en.md)
- **ACP Server：**外部客户端启动 `qwenpaw acp`，经 stdio JSON-RPC 建立/恢复会话、提交 prompt、接收增量更新并取消执行。这是进程接入，不是远程 PC 的通用任务领取端。[ACP Server](https://qwenpaw.agentscope.io/docs/acp-integration.en.md)
- **ACP 委托：**宿主按配置的 command/args 启动外部 runner，管理 start/message/respond/close。macOS 通常直接使用命令；Windows 文档使用 `cmd` 与 `/c` 包装命令。外部 runner 的安装和认证需要另行满足。[ACP 委托](https://qwenpaw.agentscope.io/docs/acp-integration.en.md)
- **MCP：**向 Agent 提供工具；支持本地 stdio 与远程 HTTP/SSE。它不代表外部 worker 已接入 QwenPaw 的持久调度协议。[MCP](https://qwenpaw.agentscope.io/docs/mcp.en.md)

**鉴权与准入：**单用户服务的 Web 登录默认关闭；启用后为单管理员账户，非本机请求使用签名 token，而 localhost 默认免认证。公开暴露前必须配置网络与认证边界，尤其不能把“已开登录”视为所有来源都受同等校验。Hub 有独立的管理员/成员、邀请/关闭注册及运行时凭据模型，不能与单用户服务混用。[单用户认证](https://qwenpaw.agentscope.io/docs/security.en.md)、[Hub 认证边界](https://qwenpaw.agentscope.io/docs/hub.en.md)

**人工介入：**工具治理可允许、拒绝、要求审批或沙箱执行；Mission 文档另明确 worker/verifier 因后台会话无法响应审批而绕过相应 guard，只适用于可信代码库。不能将架构页的一般审批描述理解为每种执行模式均逐次等待人工批准。[安全机制](https://qwenpaw.agentscope.io/docs/security.en.md)、[Mission 安全说明](https://qwenpaw.agentscope.io/docs/loop-engineering.en.md)

### 持久化方式

| 状态 | 位置与所有者 | 恢复/迁移边界 |
| --- | --- | --- |
| Agent 配置与全局注册 | 默认 `~/.qwenpaw`；每 Agent 的 Workspace 另有配置 | 文件保留后可重新加载；不等于运行中工作继续 |
| Mission | 项目 `.qwenpaw/missions/<mission-id>/` 的配置、PRD、进度与原始需求；会话模式状态关联此目录 | 结构化状态持久；下次回合可恢复 gate，不等于重启自动执行 |
| Goal | `GoalMode._sessions` 中的 `GoalSession` | 所读状态实现未提供持久化/重建路径；不能由聊天记录推导 Goal 自动恢复 |
| Cron 定义与历史 | Workspace 的 `jobs.json`；同级 `jobs_history/` 按 Job ID 保存执行记录 | 重启重新注册计划；已落盘历史保留，但不是执行检查点 |
| 后台 Task | Console 路由的 `_bg_tasks` 内存登记表；执行由 Workspace 的 TaskTracker 持有 | task ID、状态和该接口结果不跨进程重启；另存的聊天和文件可能保留 |
| 会话、记忆与文件 | 宿主上的 Workspace/本地历史存储；长期记忆可为 Markdown | 会话恢复或产物保留不是任务执行恢复 |
| 模型/环境凭据 | 默认独立的 `~/.qwenpaw.secret`；工作区连接器有自身凭据存储 | 备份与卸载不能只处理工作目录 |
| 邮件待处理状态 | 本地准入记录、邮件状态目录及批准邮件重放队列 | 官方明确特定失败处理可重启后重试；邮箱线程索引是可重建缓存，不是邮件备份 |
| Hub 控制状态 | `~/.qwenpaw/hub/control.db` 与 `secrets/` | 账户、设置、runtime 记录由 Hub 持有 |
| Hub 用户数据 | `hub/runtimes/<runtime-id>/` 中的工作、私密与备份目录 | 运行时停止、重建、后端切换保留数据；删除运行记录也不自动删除目录 |

为核验“哪些状态在进程退出后仍存在”，分别读取[Mission 写入](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/modes/mission/state.py#L181-L255)、[Goal 状态](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/modes/goal/goal_mode.py#L60-L124)、[Cron 存储](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/app/crons/repo/json_repo.py#L25-L122)与[Task 登记及查询](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/app/routers/console.py#L1204-L1250)。结论只覆盖这些明确状态，不等于所有关联产物一同丢失。

Cron manager 启动时建立空运行状态并加载任务定义；完成、失败或取消后的历史在执行收尾阶段写入。**源码事实：**正常写入的记录可保留；**架构推导：**硬崩溃可能来不及记录本次结束，历史不能恢复未完成工具步骤。[启动重载](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/app/crons/manager.py#L125-L159)、[执行收尾](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/app/crons/manager.py#L1153-L1263)

其他位置依据[工作目录](https://qwenpaw.agentscope.io/docs/config.en.md)、[邮箱状态](https://qwenpaw.agentscope.io/docs/mailbox.en.md)、[Hub 备份边界](https://qwenpaw.agentscope.io/docs/hub.en.md)。普通 Docker 部署分别挂载工作、秘密和备份卷；Hub 则需要把控制数据库、密钥和用户运行目录作为完整备份集合。Mission 若位于另行绑定的项目目录，备份也应覆盖该目录，不能只复制默认 Workspace。[Compose](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/docker-compose.yml#L3-L26)

### 通信方式

本地入口使用进程间调用或 HTTP；对话接口经 SSE 返回增量消息。频道适配器把平台消息转为统一请求，但接入方式不同：例如飞书使用 WebSocket 长连接接收、Open API 发送，不需要公网 webhook；iMessage 则轮询 macOS 本机 Messages 数据库。[API](https://qwenpaw.agentscope.io/docs/api-tutorial.en.md)、[频道](https://qwenpaw.agentscope.io/docs/channels.en.md)

MCP 的 stdio 是子进程通信，远端 MCP 走 HTTP/SSE；ACP 的 stdio JSON-RPC 则承载 Agent 会话与权限交互。不能把所有扩展都称为同一个跨机器消息总线。[MCP](https://qwenpaw.agentscope.io/docs/mcp.en.md)、[ACP](https://qwenpaw.agentscope.io/docs/acp-integration.en.md)

Hub 对外提供统一 Web 入口，并代理到各用户运行时；反向代理必须支持 WebSocket Upgrade，并允许长连接。组织模型另有专用监听和 runtime 专用凭据，不在控制面端口直接开放模型接口。基础部署没有外部消息中间件；断线后的事件补发和正在执行任务的接管没有统一承诺。[Hub 代理与模型网络](https://qwenpaw.agentscope.io/docs/hub.en.md)

### 任务队列

**已确认：**Cron 的持久计划、后台 Agent Task、Mission PRD、临时子会话与邮件重放是不同机制，不能笼统写成“任务队列已持久化”。

**时间调度：**Cron 支持计划时间、时区、单次/周期、次数或结束时间、并发数、执行超时与 grace period；Heartbeat 定期读取文件形成请求，默认关闭，可限制活动时段。这些是时间/事件触发，不是业务任务依赖就绪判定。[Cron](https://qwenpaw.agentscope.io/docs/cron.en.md)、[Heartbeat](https://qwenpaw.agentscope.io/docs/heartbeat.en.md)

**并发与一致性：**为核验“本地文件是否足以支持多调度进程”，查看 Cron 存储与执行入口，确认 JSON repository 明示单机、无跨进程锁，原子替换解决写入完整性；每 Job 的并发由进程内 semaphore 控制。这不是数据库租约，也不构成多机防重复领取机制。[存储约束](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/app/crons/repo/json_repo.py#L25-L38)、[并发入口](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/app/crons/manager.py#L1153-L1175)

**后台 Task 生命周期：**文档列出 `submitted/pending/running/finished`，但固定主干提交入口直接建立 `running` 状态，经 TaskTracker 启动执行，完成后写 `finished` 及 completed/failed 结果。不能把文档列出的状态推成必经的持久排队阶段。取消和超时由本进程请求停止运行并登记失败，不由中心租约到期后重新分派。[文档状态](https://qwenpaw.agentscope.io/docs/multi-agent.en.md)、[启动及同 chat 冲突](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/app/routers/console.py#L1052-L1089)、[取消、完成和超时](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/app/routers/console.py#L1149-L1228)

**防重复与断线：**为核验“后台提交是否有共享任务池和认领者”，沿实际提交入口确认：同 Workspace 的同 chat 在进程内锁下只新建一个活动 run，重复后台提交返回 409；这不是按业务 Task 内容去重。TaskTracker 中的 queue 是 SSE 事件订阅队列，不是 worker 领取队列；断开客户端可重新附着并重放内存事件，宿主进程退出则不保留该运行登记。[登记、owner 与事件缓冲](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/app/task_tracker.py#L39-L64)、[断线附着](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/app/task_tracker.py#L191-L225)、[进程内串行登记](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/app/task_tracker.py#L262-L359)

**特定恢复例外：**邮件文档明确“批准后的待处理邮件失败重试”可跨重启恢复；Mission 可重载 PRD 与阶段。它们不使一般后台 Task 获得持久重试、跨 Agent 接管或副作用去重。[批准邮件重放](https://qwenpaw.agentscope.io/docs/mailbox.en.md)、[Mission 恢复](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/modes/mission/gates.py#L177-L230)

**架构判断：**单机常驻进程能管理多条运行链路，但共享文件目录或直接增加多个服务进程不能等价扩展为安全的多节点任务池。已核验路径没有持久 claim/lease 或自动故障转派；多节点容量调度本身也仍是 Hub 的非当前能力。[Hub 当前限制](https://qwenpaw.agentscope.io/docs/hub.en.md)

### 部署形态

#### 工作机安装（Windows / macOS）

以下为官方支持方式与发布证据，**本次没有安装或运行 QwenPaw，也没有进行双平台实机验证**。

**Windows：**

- 桌面指南要求 Windows 10+、x64。最新 Release 提供 `QwenPaw-Tauri-2.2.2.post1-Windows-setup.exe`；通过安装向导与快捷方式启动，Python 后端随 App 运行，不需用户先手工装 Python。[桌面指南](https://qwenpaw.agentscope.io/docs/desktop.en.md)、[发布资产](https://github.com/agentscope-ai/QwenPaw/releases/tag/v2.2.2.post1)
- 依赖 WebView2；安装器通常联网下载，离线工作机需预先准备。指南仍提示未做 Microsoft 代码签名；本次没有检验二进制签名，不能由下载可用推导企业准入通过。
- 非桌面可安装 Python `>=3.11,<3.14` 后运行 `pip install qwenpaw`，或使用官方 PowerShell/CMD 安装脚本。脚本通过 uv 管理环境；受限语言模式、PATH 写入和网络出口可能阻碍安装。[当前安装说明](https://qwenpaw.agentscope.io/docs/quickstart.en.md)
- 初始化与启动为 `qwenpaw init --defaults`、`qwenpaw app`；默认访问 `http://127.0.0.1:8088/`。此路径运行完整单用户服务，而不是仅运行一个远程客户端。
- 普通安装是否在全部企业策略下无需提权，未获验证。工具沙箱的 AppContainer 初始 ACL 设置、完整受限账户和网络隔离涉及管理员权限；非管理员路径不能承诺相同网络限制。Hub Local **明确要求管理员运行**。[工具沙箱限制](https://qwenpaw.agentscope.io/docs/security.en.md)、[Hub Local](https://qwenpaw.agentscope.io/docs/hub.en.md)
- 桌面内置更新；脚本方式可重跑安装器升级。桌面从“设置 → 应用 → 已安装的应用”卸载；脚本安装的 `qwenpaw uninstall` 默认保留配置与数据，`--purge` 才执行全面移除。pip 环境的包卸载应与工作/秘密/备份目录清理分开，不能认为卸包等于删除个人数据。[桌面维护](https://qwenpaw.agentscope.io/docs/desktop.en.md)、[脚本卸载语义](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/README.md#L173-L201)

**macOS：**

- 桌面指南最低 macOS 14，推荐 Apple Silicon；Release 提供 `QwenPaw-Tauri-2.2.2.post1-macOS.zip`，解压并放入 Applications 后运行。指南对 Intel 有“可能可用”与 FAQ“可运行”的不同强度表述，本地模型能力尤其不确定；不能给出 Intel 完整支持结论。[桌面指南](https://qwenpaw.agentscope.io/docs/desktop.en.md)、[发布资产](https://github.com/agentscope-ai/QwenPaw/releases/tag/v2.2.2.post1)
- Python sidecar 随桌面启动。文档提示未签名/未公证导致 Gatekeeper 拦截；本次没有实测签名和系统准入，不把解除拦截作为企业安全审核的替代步骤。
- 非桌面支持 Python 包和 `install.sh`；服务启动与 Windows 相同。Hub Local 使用系统 `sandbox-exec`；Docker 形态需另装可运行 Linux 容器的 Engine，不能称作原生二进制运行。
- 本机文件访问受系统授权约束；Computer-use 需要辅助功能和屏幕录制许可。iMessage 仅 macOS 可用，另外需要 `imsg` 及运行 QwenPaw 的程序获得完整磁盘访问权限。这些权限不是普通本地聊天的全部必需条件。[电脑操作](https://qwenpaw.agentscope.io/docs/computer-use.zh.md)、[iMessage](https://qwenpaw.agentscope.io/docs/channels.en.md)
- 桌面使用内置更新；脚本可重跑升级。桌面卸载说明为移除 App 并删除 `~/.qwenpaw`，但秘密和备份目录另外存在，因此完整数据清除范围仍需核验；脚本卸载默认保留数据，显式 purge 与普通卸载有区别。[桌面卸载](https://qwenpaw.agentscope.io/docs/desktop.en.md)、[脚本维护](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/README.md#L173-L201)

**两平台共同的网络与持续运行要求：**安装/升级需要包、运行时及资产下载；本地模型首次还需下载推理运行库和权重。云模型、通信频道与远程工具需要对应网络出口，不是全部要求开放公网入站。官网没有给适用于全部模型与技能的统一最低 RAM/磁盘指标。[模型](https://qwenpaw.agentscope.io/docs/models.en.md)、[频道](https://qwenpaw.agentscope.io/docs/channels.en.md)

常驻服务必须保持运行，工作机睡眠、关机或退出进程会停止本机触发与执行。Windows Service/launchd 安装、注销后存活、关闭桌面窗口的后台保活以及唤醒补跑，本次没有实机验证；不能仅凭“常驻”或“定时任务”承诺无人值守全天在线。源码构建需要额外构建工具，不能与终端用户安装要求混写。

#### 主体功能运行位置

| 形态 | Agent、工具与主要状态所在位置 | Local 优先判断 |
| --- | --- | --- |
| 工作 PC 单用户 + 本地模型 | 工作 PC；预备资源后可保留本地核心链路 | 适配；须验证模型能力、权限和工作机常驻 |
| 工作 PC + 云模型/外部频道 | 执行宿主本地，推理或通信远端 | 混合；相应流程依赖联网并传输内容 |
| 本机 Hub | Hub 与用户运行时都在这台宿主 | 可本地，但权限、资源与可信用户边界更重 |
| 远端 Hub / ECS | 服务器承载主体和数据，PC 只是接入端 | 不满足主体在工作 PC；不是自动远程控制 PC 的方案 |
| AgentScope Platform / ModelScope Studio | 托管环境承载主体，用户浏览器接入 | 不满足 PC Local 优先，且需平台账号与网络 |

该表为官方部署方式的**架构归纳**，不构成各形态功能完全等价的实测承诺。[部署入口](https://qwenpaw.agentscope.io/docs/quickstart.en.md)、[Hub](https://qwenpaw.agentscope.io/docs/hub.en.md)

#### 云端形态与数据边界

**一、自托管 Hub：完整运行控制面，不只是登录页。**

- **职责与组件：**Web 登录/管理入口、运行时注册与 Local/Docker provisioner、到用户运行时的请求代理、组织模型目录与推理网关。每个用户有独立 QwenPaw 进程或容器。
- **依赖与部署：**非桌面 QwenPaw 2.2.0+；Local 使用宿主 Python 和 OS 隔离，Docker 使用可访问的 Linux-container Engine；远程部署要求 HTTPS 反向代理。默认管理入口为回环地址 8000，公网监听需要显式设置，监听选项本身不提供 TLS。
- **持久化：**SQLite 控制数据库拥有账户、设置与 runtime 记录；用户工作文件和凭据分别存放在 runtime 目录。停止/重建运行环境不删除这些目录，备份必须同时包含数据库、密钥与运行目录。
- **通信与鉴权：**浏览器经 Hub 访问个人运行时，反向代理需支持 WebSocket；组织模型走独立内部监听。runtime 专用模型凭据与普通 Hub 登录 token 不通用，上游模型密钥由 Hub 保存，不能直接返给成员。
- **网络边界：**Local 模型网关监听回环地址；Windows/macOS 容器通常经 `host.docker.internal` 到宿主，原生 Linux Docker 使用检测到的桥接私网地址。不能为了容器连接方便直接将模型网关当公网服务暴露。
- **故障与权限：**Hub 故障会影响统一登录/代理和经 Hub 的组织模型调用；已有执行与具体容器存活取决于运行时状态，不能无证据承诺全部任务不中断。管理员可访问服务器、数据库和备份；进程/容器隔离不隔离内核，官方禁止据此运营陌生用户公共多租户服务。

以上由[Hub 文档](https://qwenpaw.agentscope.io/docs/hub.en.md)直接支持；SQLite 类型经[数据库入口](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/src/qwenpaw/hub/database.py#L8-L63)定点确认。资源默认值是每容器配置策略，不是工作任务的优先级或资源预约调度。

**二、ECS / ComputeNest：将完整单实例宿主放到云服务器。**

官方提供 ECS 一键创建入口，用户需要云账号、确认实例配置及费用，部署完成取得访问地址。主体 Agent 和工具运行于所创建服务器，而不是使用者工作 PC；模型可以另连本机服务或云 API。[官方 ECS 入口说明](https://qwenpaw.agentscope.io/docs/quickstart.en.md)

**合理推导：**其最小产品构成为 QwenPaw 服务、Console、持久工作/秘密数据和选用的外部模型/频道；若采用官方 Docker 形态，可使用已公开的三卷部署结构。**未决：**本次未创建 ComputeNest 实例，无法确认当前模板固定 OS/镜像、磁盘映射、默认认证、备份策略及成本；不把博客样例当正式模板保证。开放网络时仍需落实认证与 TLS；频道是否需要入站回调要逐频道判断，不能统一要求公网端口。[单实例部署](https://github.com/agentscope-ai/QwenPaw/blob/fdf7e0243aba247a89c653efea6d8616fc7e932f/docker-compose.yml)、[安全边界](https://qwenpaw.agentscope.io/docs/security.en.md)

**三、AgentScope Platform / ModelScope Studio：账号控制的托管实例。**

官方说明前者登录后可一键部署稳定/Beta 在线运行环境，后者可以 fork QwenPaw Studio；Studio 必须设为非公开，以防别人控制实例。浏览器只承担访问，Agent、工具和工作目录位于托管侧，云模型等外部依赖继续存在。[官方托管部署说明](https://qwenpaw.agentscope.io/docs/quickstart.en.md)

**未决：**公开入口说明没有充分披露托管控制面的内部组件、数据库、租户隔离、磁盘保留期限、休眠/重启策略、可导出范围和服务保证。本次未登录、创建账号或开通资源，不能把自托管 Hub 的 SQLite/进程模型套到这些平台。其账户服务、入口代理或托管实例故障均可能中断相应访问/执行；精确故障语义需平台资料或运行验证。

**四、云模型、远程记忆与工具：可选，但选用后是真实的数据外发边界。**

- **云模型：**宿主通过 provider API 发送请求与执行上下文，凭据来自用户配置或 Hub 网关；模型供应商负责推理。断网、凭据错误、限额或供应商失败会影响 Agent 循环，不代表工作文件自动同步到官方云。[模型](https://qwenpaw.agentscope.io/docs/models.en.md)
- **ADBPG 记忆插件：**通过 REST Base URL/API Key 访问记忆服务，服务端异步提取事实并持久保存、检索；不是 QwenPaw 任务数据库。客户端完成仅表示提交被接受，不表示远端提取已完成。配置可以按 Agent 隔离或共享；远端服务不可用时，官方描述长期记忆暂不可用、Agent 可继续运行。服务端部署内部组件与最低数据库版本不在当前文档中充分披露，记为未决，而非基础安装依赖。[远程记忆](https://qwenpaw.agentscope.io/docs/memory.en.md)
- **PowerContext 记忆插件：**需要自行启动或指定服务，通过可选 Bearer token、scope 和 HTTP 请求传送查询或受限的回合状态；可同机也可远端，QwenPaw 不代为启动服务。自动检索/回合后持久化是配置驱动的网络操作，不等同每次都调用一个需人工批准的 Agent 工具。远端持久存储内部结构及故障时完整行为未由本轮充分验证。[该插件的数据边界](https://qwenpaw.agentscope.io/docs/memory.en.md)
- **频道与远程 MCP：**平台服务器或工具服务会接触相应消息/参数/结果，使用各自账号、token 或连接器凭据；它们是外部通信与执行依赖，不是必需的中央调度网关。[频道](https://qwenpaw.agentscope.io/docs/channels.en.md)、[MCP](https://qwenpaw.agentscope.io/docs/mcp.en.md)

### 架构范式与改造边界

**范式判断：**基础形态是中心化常驻执行宿主，每 Agent 有持久资源；自动化由定时/事件入口、会话循环和 Mission 局部持久编排组成。后台执行的归属与事件队列在进程内，Hub 集中管理账户、运行时和模型，不补足分布式工作任务池。[运行架构](https://qwenpaw.agentscope.io/docs/architecture.en.md)、[Hub 边界](https://qwenpaw.agentscope.io/docs/hub.en.md)

**客户端适配（架构推导）：**已有工作系统可以经 HTTP/ACP 把任务作为请求交给 QwenPaw，由外部系统继续持有 Issue、依赖、验收和重试责任。若要让工作 PC 接收远端调度，还需另外定义 PC 执行端与授权边界；本次不设计该协议，也不实施集成。

**调度下沉（架构推导）：**可以把单次执行或完整 Mission 封装成上层工作流的一个节点，但要保留宿主、Mission 文件和会话模式状态；只把计划文本交给普通 Agent，会丢失 gate 读取持久验收状态的机制。周期触发、执行归属、进程故障后的恢复责任仍不能因节点封装而消失，不属于等价替换调度层。

**改造范围（架构推导）：**若目标是通用 Stateful 调度，需要补齐持久任务依赖、运行实例与执行者归属、可恢复派发及副作用边界，同时保留或适配既有 Mission 状态。它们属于新增中心职责；不是把 Workspace、Cron 或 Hub 运行表直接改名，也不是拆掉向量检索就得到独立调度内核。

## 未决项与证据边界

- **版本：**稳定 Release、固定主干和在线文档是三种窗口。主干为 2.3.0b1，不能把其行为直接当作稳定版承诺；后续验证必须固定安装版本。
- **运行：**本次没有安装产品、执行模型请求、启动 Hub、创建云实例或测试崩溃恢复；全部“已确认”指资料/源码直接支持，不表示实测成功。
- **调度：**后台 Task 的内存登记、Cron 定义/历史与 Mission 结构化落盘已定点确认；仍未验证 Mission 中断后自动唤起、story 硬性顺序与重试上限执行、工具副作用去重及跨 Agent 故障转派。已读 Goal 状态实现未见持久恢复路径，不据此扩大为全仓库不存在任何 Goal 相关保存。
- **平台：**Intel Mac、Windows ARM、企业受限安装、应用签名、注销/睡眠行为、关闭桌面窗口后的常驻和卸载残留没有完整验证。
- **托管云：**公开资料不足以确认内部组件、持久存储保留、隔离及故障恢复，不以本地架构替代。
- **文档冲突：**介绍页仍引用较早的 Runtime 组成，而当前架构明确 AgentScope 2.0 进程内使用；记忆页与架构页对插件不可用时回退/失败的表述也不同。本文不将未核验的默认回退写作可靠性保证。
- **反馈：**Issue 是有限样本；已关闭、勾选通过或 AI 辅助诊断都不等同独立复现或全场景保证。

## 后续验证建议

1. 分别在 Windows x64 和 Apple Silicon macOS 固定版本验证安装、启动、模型配置与基础工具执行；把桌面、pip、Hub Local 的权限与功能边界分开。
2. 对 Cron、后台跨 Agent Task、Goal/Mission 分别测试运行中结束宿主、重启、重连和重复提交，观察定义、状态、结果与副作用是否独立保留；不只检查会话能否打开。
3. 用两个最小 story 验证 Mission 的执行顺序、失败验收、重试、取消和恢复，确认谁决定继续以及是否发生重复实施。
4. 若采用 Hub，验证本地模型经组织网关、模型上限、用户运行重启、数据备份恢复及两个用户的访问隔离；只用互相信任的内部成员试点。
5. 本地优先试点应预备模型/运行库，再断开外网验证 Console、本地工具与计划触发；另列依赖外网的频道、模型、记忆和工具，不能将其失败误算为本地宿主不可用。
6. 对托管形态，在开通前补齐磁盘保留、实例休眠、导出、凭据与故障语义；对卸载分别检查程序、工作数据、秘密目录与备份，避免把卸载成功当数据已清除。
