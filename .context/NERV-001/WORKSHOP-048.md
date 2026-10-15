# Bloome（Bloome AI，bloome.im）技术产品调研

> updated_by: Qoder - Claude Sonnet 4.5
> updated_at: 2026-07-31 20:45:00
> evidence_window: 调研日期 2026-07-31；证据来源为官方营销站点 `bloome.im` 页面快照（指南 `/guides/agentic-ai`、`/guides/multi-agent-orchestration`，功能页 `/features/ai-agent-platform`、`/features/multi-agent`、`/features/ai-team-for-work`，站点首页与 `/about`，功能页页脚标注 "Last reviewed June 2026"）；产品为闭源专有 SaaS，无公开源码仓库、无公开技术/架构文档，本轮无源码可下钻，全部结论基于产品对外表述与架构推导

## 交付结论

### 用户提供的链接是 Bloome 的 SEO 概念指南，真正的调研主体是 Bloome AI 产品；本报告的证据边界是营销站点

`bloome.im/guides/agentic-ai` 是一篇面向搜索引擎的「What Is Agentic AI 科普指南」，正文用于解释 agentic AI 概念并把 Bloome 作为落地范例推介（[agentic-ai 指南](https://bloome.im/guides/agentic-ai)，直接事实）。因此本报告的调研主体确定为站点所属产品 **Bloome AI**，指南文本身只作为产品定位线索之一。

必须先声明证据边界：Bloome 是闭源 SaaS，无公开源码仓库、无公开技术文档，本轮全部证据来自官方营销与指南页面。因此涉及持久化、调度引擎、队列与恢复机制的内部实现**无法核验**，相关判断均按「产品对外表述 + 架构推导」标注，不得当作源码级事实（证据边界）。

### Bloome 是「人与 AI Agent 同处一个聊天」的 IM 式多 Agent 协作平台，不是中心调度产品

官方一句话定位为「the instant-messaging platform where people and AI agents work in one chat」，愿景是「Accelerating the world's transition to human-agent teams」（[首页](https://bloome.im/)、[About](https://bloome.im/about)，直接事实）。产品核心隐喻是即时通讯（群聊、DM、线程、@mention），Agent 是聊天里的一等成员。

工作从「人在聊天里 @mention 某个 Agent 并描述目标」进入，Agent 规划并把子任务委派给其他 Agent，多个 Agent 在同一会话里并行推进、互相 review（[AI Agent Platform](https://bloome.im/features/ai-agent-platform)、[Multi-agent](https://bloome.im/features/multi-agent)，直接事实）。这一形态回答了 Index 关注的「工作从哪里产生、如何进入 Agent、如何分派、人审如何衔接」，但其载体是对话而非中心调度器。

### 编排是对话中涌现（chat-native），官方明确声明不是声明式工作流引擎，也不是可视化编排器

官方将自身编排范式与 AutoGen / LangGraph 显式对比：后者是「声明式」——预先用代码/图定义 Agent、hand-off 与控制流再运行；Bloome 则「让流程在对话中涌现」，靠 @mention、回复、线程等聊天原语表达协调，并加入 loop protection 防止 Agent 之间无限互相触发（[Multi-Agent Orchestration 指南](https://bloome.im/guides/multi-agent-orchestration)，直接事实）。官方并明确「Bloome is not a visual no-code workflow builder」（同上，直接事实）。

对照 Index 判定基准：真正的 Stateful 调度须由中心状态「判断任务何时可执行、按何顺序推进、由谁执行、失败后如何继续」。Bloome 的「顺序与由谁执行」由 lead agent 在会话中即时决定、由 @mention 驱动，不存在中心组件依据持久任务状态与依赖关系解算可执行性。**因此 Bloome 不满足 Stateful 中心调度判定**（架构推导 + 官方表述）。

### 工作对象模型：有 Workspace / 群聊 / 线程 / Agent / 交付物，但无持久 Task 依赖、状态机与执行归属

可辨识的持久对象：Workspace（访问控制边界，官方称「access is controlled at the workspace level」「conversations are isolated by default」）、群聊 / DM / 线程 / 消息、Agent（一等成员，含个人 Agent、克隆自 Explore 的公共 Agent、自建 Agent，可设 system prompt 与 tools）、以及交付物（报告、仪表盘、可下载 artifact）（[About](https://bloome.im/about)、[AI Agent Platform](https://bloome.im/features/ai-agent-platform)、[AI Team for Work](https://bloome.im/features/ai-team-for-work)，直接事实）。

存在轻量任务概念：Agent 可「break work into named tasks」供人跟踪，并提供「task follow-up」——汇总未完成工作、指派 owner、询问是否提醒某人（[AI Agent Platform](https://bloome.im/features/ai-agent-platform)、[agentic-ai 指南](https://bloome.im/guides/agentic-ai)，直接事实）。但这是会话内、Agent 辅助的待办可视化与提醒，**没有出现** Index 关注的 Task 父子/前置依赖/DAG、状态机与迁移责任方、以及「调度中心拥有的执行归属」。按 Index 规则，这类对象应记为任务承接/执行辅助，不能据「named task」之名判定为调度（直接事实 + 架构推导）。

无 Project / Issue / Plan 作为一等持久对象的证据；Plan 表现为 Agent 在对话中的规划文本（visible planning），属单次执行参考产物而非持久编排对象（架构推导）。

### Agent 分派靠 @mention 而非调度器选人；退出/失败/断线后的任务恢复与转移在现有证据中未体现

分派语义是「人或 lead agent 通过 @mention 把子任务交给具体 Agent，其回复流入同一会话」（[Multi-agent](https://bloome.im/features/multi-agent)，直接事实），属于「已有成员被点名领活」的会话式委派，而非「调度器依据任务状态与依赖主动选择执行者」。

Agent 与「任务」的持久归属关系、Agent 退出/失败/断线后任务能否由原 Agent 恢复、转交他者或重新排队，以及执行进度/检查点是否属于可恢复的调度状态——这些 Index 明确要求核验的点，在营销证据中**均无表述**，按未决项处理（证据边界）。可确认的是会话本身跨端同步、持久留存，故「对话上下文」可恢复，但这属于 IM 会话持久化，不等于任务调度状态持久化（概念区分）。

### 运行形态是云端 SaaS：登录、credits 计费、跨端同步、云端 Agent 与沙箱执行都在云

产品需注册登录、按 credits 计费，聊天与 Agent 跨 Web / macOS / Windows / iOS / Android 同步；提供常在线的 Cloud Agent（Beta，「runs in the cloud and stays online」）；Agent「run code in a sandbox」执行代码与读写文件（[AI Agent Platform](https://bloome.im/features/ai-agent-platform) FAQ、[agentic-ai 指南](https://bloome.im/guides/agentic-ai)，直接事实）。

这些特征共同表明主体能力（账号、会话存储、Agent 运行、代码沙箱、跨端同步）位于云端，桌面与移动 App 是云服务的客户端外壳。数据边界上，官方称对话默认隔离、按 workspace 控制访问，但未公开数据驻留地域、加密与断网行为（直接事实 + 证据边界）。

### Local 优先适配是明显选型缺陷：无本地自托管或离线核心的任何证据

站点全程围绕注册即用、credits 计费、跨端云同步、云端 Agent 展开，**未出现**自托管、私有化部署、离线运行或本地数据落盘的任何表述。据此判断 Bloome 主体能力依赖云端，断网后核心流程预计不可用——相对本轮其他样本，这是显著的 **Local 优先选型缺陷**（架构推导 + 证据缺失）。若无官方私有化方案，本地化落地需要供应商支持或整体替代，改造边界很大。

### Windows 与 macOS：双平台桌面客户端齐全（另含 iOS/Android/Web），但均为云端客户端而非本地调度服务

官方提供 macOS、Windows 桌面 App，iOS、Android（含 Google Play 与 APK）原生 App，以及 Web，且「everything in sync」（[首页](https://bloome.im/)、各功能页下载区，直接事实）。就客户端覆盖面而言 Windows 与 macOS 均完整，无平台缺失。

但这些客户端是接入云端服务的前端，Index 意义上的「完整中心调度服务在工作机本地运行」并不成立；两平台都不提供本地服务端形态（直接事实 + 概念区分）。

### 闭源专有、外接第三方编码 Agent 经 ACP；无源码与技术文档可核验调度/持久化内核

Bloome 为闭源 SaaS，团队分布深圳 / 美国 / 日本，成员背景含 ByteDance、OnePlus、Ant Group、Moonshot AI（[About](https://bloome.im/about)，直接事实）。可把 Claude Code、Codex、Gemini CLI、OpenCode 经 ACP 接入同一聊天，官方注明这些是用户自行连接的第三方工具而非官方插件（[AI Agent Platform](https://bloome.im/features/ai-agent-platform)、[Multi-agent](https://bloome.im/features/multi-agent) FAQ，直接事实）。

由于无公开仓库与架构文档，数据库类型/版本、任务队列、并发抢占、租约与重试、状态一致性等 Index 中心调度关注点**全部无法核验**，只能记为未决（证据边界）。

### 综合判定：契合「IM 原生人–Agent 协作 + 对话涌现式编排 + 人审闭环」议题；作为 Stateful 中心调度器不成立，作为 Local 优先产品有明显云依赖缺陷

对 GLNT-10「Agent 如何持续获得工作、被分派、推进并形成可治理闭环」议题，Bloome 是一个高价值的**产品形态样本**：它把「工作进入（@mention 派活）、多 Agent 分派与并行、互相 review 与 loop protection、人审最终决策、交付物落到会话」做成了 IM 原生体验，直接回应了 Index 关于工作来源、分派、人机协同治理的关注（架构推导 + 直接事实）。

但需明确三条边界：① 其编排是对话涌现式，官方自陈非声明式工作流引擎，且无中心任务状态机/依赖/执行归属，**不属于 Stateful 中心调度器**，按任务执行宿主 + 会话式多 Agent 编排记录；② 主体能力云端强绑定，无自托管/离线证据，**Local 优先适配为明显选型缺陷**；③ 闭源无源码，调度与持久化内核不可核验，多项 Index 关注点只能列为未决。

## 调研目标

- 确认用户链接主体（Bloome AI 产品）并声明证据仅来自营销站点的边界。
- 判定 Bloome 是否具备 Stateful 调度能力，还是会话式多 Agent 协作/执行宿主。
- 厘清其工作对象模型（Workspace/群聊/Agent/任务/交付物）与分派、连续性机制。
- 评估运行形态、Local 优先适配、Windows/macOS 落地形态与云端依赖边界。
- 定位其对 GLNT-10「Agent 持续获得并推进工作」议题的参考价值与选型缺陷。

## 产品调研

### 产品定位与目标用户

- **一句话定位**：Bloome 是「人与 AI Agent 同处一个聊天」的即时通讯式多 Agent 协作平台，Agent 是群聊/DM 的一等成员，可 @mention 派活、克隆、自建、组队协作。
- **目标用户**：需要产出「必须正确」的交付物（报告、提案、数据看板）的团队与个人；强调「无需工程师即可组建 AI 团队」。
- **商业背景**：产品团队跨深圳、美国、日本，背景含 ByteDance / OnePlus / Ant Group / Moonshot AI；免费起步、按 credits 计费；站点提供英/简中/日/西/葡多语言（[About](https://bloome.im/about)，直接事实）。

### 核心流程

1. 注册后自动获得一个个人 AI Agent（一等成员，带 profile）；
2. 在群聊中 @mention Agent 并描述目标（outcome），可从 Explore 克隆专家 Agent 或经 ACP 接入 Claude Code/Codex 等；
3. lead Agent 规划并把子任务委派到线程，多个 Agent 并行工作、共享同一会话上下文、互相 review 与 push back（含 loop protection）；
4. Agent 可读文件、在沙箱运行代码、汇总为带来源的报告/看板等交付物，回帖到会话；
5. 人阅读会话、审阅并做最终决策（approve/redirect），交付物与决策留存在共享 workspace。

### 功能地图与边界

- **协作载体**：群聊、DM、线程、回复、@mention（人与 Agent 同构）。
- **Agent 能力**：个人 Agent、Explore 公共 Agent 目录与一键克隆、自建 Agent（自定义 system prompt 与 tools）、Cloud Agent（常在线，Beta）。
- **执行能力**：读写文件、沙箱运行代码、生成报告/仪表盘/研究等交付物。
- **外接**：经 ACP 接入 Claude Code、Codex、Gemini CLI、OpenCode（第三方，用户自连）。
- **轻量任务**：named tasks（可视化拆解）、task follow-up（汇总待办、指派 owner、提醒）。
- **端**：Web、macOS、Windows、iOS、Android（Google Play + APK），跨端同步。
- **明确不含（官方自陈或证据缺失）**：声明式工作流引擎 / 可视化 no-code 编排器；中心 Task DAG 与状态机调度；自托管/离线本地形态；媒体（图形/视频）生成。

## 技术架构调研

### 系统全貌与运行形态

闭源云端 SaaS，多端客户端 + 云服务后端（营销表述 + 架构推导，无源码）：

| 组件 | 职责 | 运行位置 |
| --- | --- | --- |
| 多端客户端 | 群聊/DM/线程 UI、@mention 交互、下载交付物 | Web / macOS / Windows / iOS / Android |
| 会话与协作后端 | 消息、线程、workspace 访问控制、跨端同步 | 云端 |
| Agent 运行时 | 个人/克隆/自建 Agent 执行，LLM 调用 | 云端 |
| Cloud Agent | 常在线 Agent（Beta），随时可达 | 云端 |
| 代码/工具沙箱 | 运行代码、读写文件产出交付物 | 云端 |
| ACP 接入层 | 连接 Claude Code/Codex/Gemini CLI/OpenCode | 第三方工具侧 + 云端桥接 |

- **范式判定**：IM 原生的人–Agent 协作平台，多 Agent 编排在对话中涌现；按 Index 归类为任务执行宿主 + 会话式多 Agent 编排，**非 Stateful 中心调度器**，非声明式工作流引擎。

### 主要组件与核心链路

**核心链路**：人在群聊 @mention → lead Agent 读取目标并规划、把子任务委派到线程 → 专家 Agent 并行执行（读文件/沙箱跑代码/调 LLM），@mention 互相触发与 review，loop protection 防死循环 → 交付物与结论回帖到会话 → 人审并最终决策 → 会话/交付物在 workspace 留存并跨端同步。跨进程/网络边界：客户端↔云后端、云后端↔LLM/沙箱、ACP↔第三方编码 Agent（架构推导 + 官方表述）。

### 主要依赖

- **运行时硬依赖（推导）**：云端服务与存储、LLM 供应商、代码/工具沙箱；客户端需网络连接。
- **可选/外接**：经 ACP 接入的第三方编码 Agent（Claude Code/Codex/Gemini CLI/OpenCode）。
- **数据库/队列/一致性**：无公开信息，未决。

### 接口形态

对外主要交互是各端聊天客户端（Web/桌面/移动）；ACP 作为接入外部编码 Agent 的协议。无面向工作机的公开调度接入协议或 SDK 证据（直接事实 + 证据缺失）。

### 持久化方式

会话、消息、线程、Agent 配置、交付物与 workspace 访问控制持久化于云端；对话默认隔离、按 workspace 控制访问。数据库类型、驻留地域、加密与保留策略均未公开（证据边界）。

### 通信方式

即时通讯式：客户端与云后端实时收发消息（推断为长连接/推送以支撑 IM 与 Agent 回复流式）；Agent 之间的「通信」表现为同一会话内的 @mention 与回帖（应用层消息），而非独立消息中间件的对外证据（架构推导）。

### 部署形态

#### 工作机安装（Windows / macOS）

- **Windows / macOS**：均提供原生桌面 App（另有 iOS/Android 原生 App、Web、APK 直装），双平台客户端齐全，跨端同步。
- **依赖、权限与网络**：客户端需登录云账号与网络；核心能力在云端，离线核心运行无证据支持。
- **卸载**：常规应用卸载（未见特殊说明）。

#### 主体功能运行位置

- 主体功能运行在**云端**：账号、会话存储、Agent 运行、沙箱执行、跨端同步均由云承担；桌面/移动 App 是云服务客户端外壳。
- **Local 优先适配判断**：满足度低——无自托管/离线证据，主体能力云依赖，构成明显 Local 优先选型缺陷。

#### 云端/服务端形态

- **职责边界**：承载认证、会话与消息存储、workspace 访问控制、Agent 运行时、Cloud Agent、代码沙箱、跨端同步。
- **接口/持久化/通信**：客户端经网络接入云后端；持久化在云；IM 式实时通信。
- **数据/权限/网络边界**：对话默认隔离、workspace 级访问控制；数据驻留、加密、断网影响未公开，需实测或向官方确认。

## 未决项与证据边界

- **证据来源单一**：全部结论基于 `bloome.im` 营销与指南页面，无源码、无技术/架构文档、无 API 文档；持久化、调度引擎、队列、并发抢占、租约、恢复等内部机制**无法核验**。
- **Stateful 关键点未决**：任务状态由谁持有、执行归属是否持久化、Agent 断线/失败后任务能否恢复或转交、进度/检查点是否为调度状态——营销文本无表述。
- **数据库与依赖未决**：数据库类型/版本、云区域、加密与保留策略、是否存在可关闭/替换的硬依赖，均无公开信息。
- **Local/断网未决**：是否存在自托管或离线模式、断网后可用能力范围，未见任何证据，当前按「无、云依赖」推断，需实测确认。
- **指南 vs 产品**：`/guides/agentic-ai` 为 SEO 概念科普，其对 agentic AI 的通用描述不等于 Bloome 的实现细节，已据产品功能页区分。
- **快照边界**：站点内容与功能（含 Cloud Agent Beta、credits 计费）随时变化，结论以 2026-07-31 快照与功能页 "Last reviewed June 2026" 为准。

## 后续验证建议

- 若要评估 Bloome 作为 Agent 工作承载层，应实测：多 Agent @mention 委派下任务是否有可恢复的持久状态、某 Agent 崩溃后子任务是否重排或转交、会话重启后未完成工作的处理方式，以判定其与 Stateful 调度的真实差距。
- 就 Local 优先落地，应直接向官方确认是否有自托管/私有化/离线方案、数据驻留与加密、断网可用范围；若无，则本地化落地需整体替代或深度定制，改造成本高。
- 明确定位：Bloome 是**IM 原生人–Agent 协作 + 对话涌现式多 Agent 编排 + 人审闭环**的产品范本（对「工作进入、分派、人机治理」极具参考价值），而非中心任务调度器或本地优先产品；其调度与持久化内核因闭源不可核验，任何选型都需以官方技术尽调补齐本报告的未决项。
