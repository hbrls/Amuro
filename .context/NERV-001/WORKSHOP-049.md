# Cloudflare OS（os.cloudflare.app）技术产品调研

> updated_by: Qoder - Claude Sonnet 4.5
> updated_at: 2026-08-06 10:30:00
> evidence_window: 调研日期 2026-08-06；目标版本为 2026 年 8 月 5 日公开发布的 v2 重写版本（README 标注 "version 2, a complete rewrite"）；GitHub 仓库 `cloudflare/cloudflare-os` main 分支快照（commit 截至 2026-08-06）

## 交付结论

### Cloudflare OS 是面向企业内部 AI 生产力的开源 Agent 工作区平台，主体在 Cloudflare 边缘运行，非工作机本地调度系统

Cloudflare OS 于 2026 年 8 月 5 日开源发布（Apache-2.0），定位为「企业 AI 生产力操作系统」——让非工程师在浏览器中与 Agent 对话，研究主题、制作文档/幻灯片、搭建连接内部系统的全栈小应用（官方博客 [Cloudflare OS 发布公告](https://blog.cloudflare.com/cloudflare-os)，直接事实；[GitHub README](https://github.com/cloudflare/cloudflare-os)，直接事实）。产品构建在 Cloudflare Workers 之上，每个 Workspace 是一个 Durable Object，每个 Gadget 运行为 Dynamic Worker Facet（官方博客 + Durable Object Facets 技术博客 [Durable Object Facets 公告](https://blog.cloudflare.com/durable-object-facets-dynamic-workers/)，直接事实）。

对照 Index 判定基准：Cloudflare OS 不是工作机本地调度系统。其主体能力——Workspace 管理、Agent 运行时、Gadget 沙箱执行、Gatekeeper 外部服务接入——运行在 Cloudflare 边缘网络上。用户通过浏览器接入，不存在 Windows 或 macOS 原生桌面应用（GitHub README「Run locally」节，直接事实）。虽然底层运行时 workerd 是开源的，可自托管，但自托管生产部署文档和工具链标注为「COMING SOON」（GitHub README「Deploy to your own server using workerd」节，直接事实）。

### 不具备 Stateful 调度能力：无持久任务对象、无依赖关系、无任务状态机与执行归属，按任务执行宿主记录

Cloudflare OS 的工作对象模型是 Workspace → Workpiece（Gadget / Gatekeeper）+ Agent Chat Session，不存在 Index 关注的持久 Task 对象（`workshop-shared/src/api.ts` 第 138–143 行，`WorkpieceId` 定义及注释，直接事实）。Workpiece 是工作区内编号的事物——当前为 Gadget 和 Gatekeeper，共享同一 per-workspace 顺序 ID 命名空间；无 Task、Issue、Plan 作为一等持久对象的证据（源码枚举确认 + 架构推导）。

官方博客提到 Workspace 可将已知步骤序列转为「deterministic workflows」，可按需、按计划或事件触发运行（官方博客「Run deterministic workflows」节，直接事实）。源码核验指向 `gatekeeper-scheduler` 包——它是一个 **基于时间的回调调度器**（cron-like），支持间隔触发 `every()`、日历触发 `calendarAt()` 和一次性触发 `runAt()`（[gatekeeper-scheduler README](https://github.com/cloudflare/cloudflare-os/blob/main/packages/gatekeeper-scheduler/README.md)，直接事实；`scheduler-core.ts` 源码确认）。它持久拥有 Schedule 对象、状态机（active → pending → retrying → dead/completed/expired）和重试逻辑（8 次指数退避，`driver-state.ts` 第 6–10 行、第 26–80 行，直接事实）。

但这个调度器管理的是**时间触发回调**，不管理任务间父子关系、前置依赖、DAG 或并行分支。回调交付到 Workspace 代码后，由 Workspace 内的 Agent 或 Gadget 自行执行，调度器不跟踪执行进度、不选择执行者、不处理 Agent 退出后的任务转移。对照 Index 调度判定基准——Stateful 调度系统必须「持久拥有工作对象、对象关系、任务状态和执行归属，并负责判断任务何时可执行、按何顺序推进、由谁执行以及失败后如何继续」——Cloudflare OS 不满足此条件，按**任务执行宿主 + 时间触发调度辅助**记录，不判定为调度工具（架构推导 + 官方表述）。

### 工作对象模型：有 Workspace / Workpiece / Chat / Gadget / Gatekeeper / Schedule；无 Task / Issue / Plan 持久对象

可辨识的持久对象（`workshop-shared/src/api.ts` 源码 + GitHub README，直接事实）：

- **Workspace**：Durable Object（`OverseerDurableObject`），每个 Workspace 独立持久化，含 Agent 会话、状态、产出物、资源访问、隔离运行时。访问由 Cloudflare Access 控制。
- **Workpiece**：Workspace 内编号对象，当前为 Gadget 和 Gatekeeper，共享顺序 ID 命名空间（`WorkpieceId = number`，第 143 行）。
- **Gadget**：全栈应用（客户端 + 服务端），运行为 Dynamic Worker Facet，拥有独立 SQLite 数据库。私有默认，可分享、可实时协作。
- **Gatekeeper**：服务特定的 Worker，中介 Agent/Gadget 与外部服务之间的访问。能力驱动，含 OAuth、日志、人在环路审批。
- **Agent Chat Session**：Workspace 内对话，Agent 为 Code Mode——编写并立即执行代码片段。
- **AgentSpawner**：Gadget 可注册 Spawner 创建新 Agent Chat，Spawner 配置含 modelId 和 env bindings 映射，快照到新 Chat 的种子绑定层（`AgentSpawnerConfig` 第 1270–1288 行，直接事实）。这是 Gadget 主动创建子 Agent 的机制，但不是持久任务分派。
- **Schedule**：由 `gatekeeper-scheduler` 管理的持久时间回调对象，有 scheduleId、runId、spec、状态机。但这是时间调度对象，不是工作流任务对象。

**明确缺失**：无 Task 作为中心调度的持久工作记录；无 Issue 作为外部系统读取后交给 Agent 的输入；无 Plan 作为持久编排对象——Agent 在对话中的规划是 visible planning 文本产物，不持久为编排对象。AgentSpawner 创建的是新 Chat 线程而非被调度的 Task（源码确认 + 架构推导）。

### Agent 分派是会话式启动而非调度器选人；退出/失败/断线后的任务恢复机制不成立

Agent 执行由用户在浏览器中发起对话触发，或由 Gadget 通过 AgentSpawner 创建子 Chat 线程触发（`workshop-shared/src/api.ts` 第 1260–1288 行注释，直接事实）。这是「已有 Chat 线程被启动并运行 Agent」的执行宿主形态，不是「调度器依据任务状态与依赖主动选择执行者」的调度形态。

Agent 与 Chat 的归属是持久的（Chat 存储在 Workspace 的 Durable Object SQLite 中），但 Agent 退出、失败或断线后，不存在原 Agent 恢复、转交其他 Agent 或任务重新排队的机制证据。Chat 会话上下文可跨请求恢复（Yjs 文档 + SQLite），但这属于会话持久化，不等于任务调度状态持久化。Scheduler 的回调在失败后重试 8 次，但重试的是同一回调交付，不是 Agent 执行进度的检查点恢复（`gatekeeper-scheduler/README.md`「Persistent callbacks and retries」节，直接事实）。

### 运行形态是云端边缘 + 可自托管（workerd）；主体能力不在工作机本地，构成 Local 优先选型缺陷

Cloudflare OS 有三种运行形态（GitHub README，直接事实）：

1. **Cloudflare 账户部署**（生产）：部署到自己的 Cloudflare 账户，数据存于自己的账户内，使用自己的 Access 策略和 AI Gateway 配置。Durable Objects、Dynamic Workers 和 Facets 需要 Workers Paid 计划（Durable Object Facets 博客，直接事实）。
2. **本地开发运行**（非生产）：`pnpm run-local` 使用 wrangler/workerd 本地运行，数据存于 `.wrangler` 子目录，README 明确标注「not meant for production use」。
3. **workerd 自托管**（未来）：README 标注「COMING SOON」，文档和工具链尚未完成；workerd 本身开源，OS 可完全运行其上，但目前缺少平滑部署方案。

主体功能（Workspace 管理、Agent 运行、Gadget 沙箱、Gatekeeper 外部服务接入）运行在 Cloudflare 边缘网络。用户通过浏览器接入，无原生桌面客户端。自托管生产形态尚未就绪。据此判断主体能力依赖云端，断网后核心流程不可用——这是 **Local 优先选型缺陷**，同时需注意 workerd 自托管的技术可行性已存在，只是产品化工具链未完成（架构推导 + 直接事实）。

### Windows 与 macOS：无原生桌面应用，浏览器接入是唯一工作机形态；两平台均无本地服务端形态

Cloudflare OS 是 Web 应用，用户通过浏览器访问 `os.cloudflare.app` 或自部署实例（GitHub README「Quick Start」节，直接事实）。不存在 Windows 或 macOS 原生桌面应用、安装包或 CLI 工具。两端均无本地服务端形态——本地开发运行模式（`pnpm run-local`）使用 workerd，但明确为开发用途而非生产。

按 Index「必须分别详细说明 Windows 和 macOS 工作机上的安装方式、运行入口、依赖、权限、网络要求和卸载方式」的要求：两端安装方式均为打开浏览器访问 URL，运行入口为浏览器，依赖为现代 Web 浏览器和网络连接，权限为 Cloudflare Access 认证，网络要求为可访问 Cloudflare 边缘或自托管 workerd 实例，卸载为关闭浏览器/取消部署。两端均无原生二进制或安装包（直接事实）。Linux 容器不替代工作机原生支持，但本产品本身不是工作机原生应用，因此此约束以「无原生桌面应用」形式记录为选型缺陷（直接事实 + 架构推导）。

### 存在云端组件且为核心主体：Durable Objects + Dynamic Workers + AI Gateway 构成完整云端运行时

Cloudflare OS 的云端组件不是辅助网关，而是产品主体。核心组件及职责（官方博客 + GitHub README + wrangler.jsonc + 源码，直接事实）：

- **Durable Objects**：`OverseerDurableObject`（Workspace 内核，`workshop-backend/wrangler.jsonc` 第 48 行）、`UserDurableObject`（用户级状态）、`AdminSettings`（管理配置）、`PendingLogin`（登录桥接）。每个 Workspace 是一个 Durable Object，拥有独立 SQLite。
- **Dynamic Workers + Facets**：Gadget 服务端代码按需加载为 Dynamic Worker，实例化为 Durable Object Facet，拥有独立 SQLite 数据库（官方博客 + `Durable Object Facets` 技术博客，直接事实）。Dynamic Worker 的全局出站网络默认禁用，仅通过 Workers Bindings 访问指定外部资源。
- **Gatekeepers**：服务特定 Worker（`gatekeeper-github`、`gatekeeper-google`、`gatekeeper-slack` 等），各自独立部署，中介外部服务访问。
- **AI Gateway**：所有模型调用经 AI Gateway 路由，客户选择模型、追踪成本、设预算和速率限制。
- **Router**：`packages/router`，开发环境路由器，转发前端请求到后端。

数据边界：Workspace 数据存于客户的 Cloudflare 账户内；Gatekeeper 持有外部服务凭证，不暴露给 Agent；观察日志记录 Agent 读取的所有资源，跨 Workspace 共享时验证访问权限（官方博客「Policy follows what the agent has seen」节，直接事实）。断网影响：浏览器离线后无法新建或操作 Workspace；自托管 workerd 实例理论上可离线运行，但工具链未就绪（架构推导）。

### 开源（Apache-2.0）、代码主干可见、无闭源核心模块；Gatekeeper 与核心均在同一仓库

Cloudflare OS 以 Apache-2.0 许可证开源，仓库 `cloudflare/cloudflare-os` 包含完整核心代码（GitHub README，直接事实）。`packages/` 目录含 26 个包：`workshop-backend`（内核）、`workshop-frontend`（Shell）、`workshop-shared`（共享 API 类型）、`router`、`typed-storage`、`backend-utils`、`configurator-ui`、`error-reporting`、`mcp-shared`，以及 16 个 `gatekeeper-*` 包（含 `gatekeeper-scheduler`、`gatekeeper-mcp`、`gatekeeper-mcp-portal` 等）。

未发现闭源核心模块或专有功能依赖。所有 Durable Object 类、Agent harness、调度器、Gatekeeper 实现均在仓库中。外部依赖包括：`@earendil-works/pi-agent-core`（多模型支持）、`pi-ai`（LLM 供应商统一 API）、Yjs（协作同步）、Monaco（代码编辑器）、Vite（开发构建）、Cap'n Web（RPC）（GitHub README「Credits」节，直接事实）。另有 `cloudflare-os-starter` 作为部署示例仓库（官方博客，直接事实）。

### 依赖根源：Workers 运行时（workerd）是唯一硬依赖；Durable Objects / Dynamic Workers / Facets 需要 Paid 计划

影响安装、运行和部署的硬依赖（wrangler.jsonc + README + 博客，直接事实）：

- **Cloudflare Workers 运行时（workerd）**：开源，是唯一运行时依赖。生产部署到 Cloudflare 边缘，或自托管 workerd（未就绪）。
- **Durable Objects**：需要 Workers Paid 计划。SQLite 存储、WebSocket Hibernation、Alarm API 均依赖 DO。
- **Dynamic Workers + Facets**：需要 Workers Paid 计划。Gadget 服务端代码加载依赖此特性。
- **pnpm + Node.js**：仅开发依赖，不影响运行时。
- **AI Gateway**：运行时依赖，所有模型调用经此路由。
- **Cloudflare Access**：身份认证依赖。
- **KV / R2**：Blueprint 元数据和内容存储。

依赖可替换性评估：Workers 运行时不可替换（产品深度依赖 DO、Facets、Dynamic Worker Loader API 等 Workers 特有特性）；AI Gateway 理论上可替换（模型调用路由），但替换需改动 `ai-gateway.ts` 及相关绑定；Gatekeeper 可自定义新增或替换（每个 Gatekeeper 是独立 Worker 包）。将调度逻辑下沉为普通 Agent 任务节点会失去 Scheduler 的持久状态、Alarm 触发和重试机制（架构推导）。

### 架构范式判定：Capability-based 安全沙箱平台 + 时间触发回调调度，非中心化特权调度服务

Cloudflare OS 的架构范式是：以 Durable Object 为 Workspace 单元、以 Dynamic Worker Facet 为应用沙箱、以 Gatekeeper 为外部服务代理、以能力驱动安全（capability-based security）为隔离边界的工作区平台（官方博客「Capability-based access control」节 + GitHub README「Gatekeepers」节，直接事实）。

调度器（`gatekeeper-scheduler`）是此平台上的一个 Ambient Gatekeeper——每个账户拥有一个 SQLite-backed `ScheduleDriver` Durable Object 和一个 Alarm，管理该账户所有 Workspace 的时间回调（`gatekeeper-scheduler/README.md`「Architecture and security」节，直接事实）。它是单账户范围内的集中时间调度，不是跨账户的分布式任务池。调度逻辑不能下沉为普通 Agent 任务节点而不失去持久状态和 Alarm 触发——但这个调度器本身只管时间触发，不管任务依赖和 Agent 分派（源码确认 + 架构推导）。

官方已规划方向：将 Cloudflare OS 带入 Cloudflare Dashboard 作为全托管产品、为开发工作流添加容器、将 Workspace 带入 Slack 和其他聊天工具（官方博客「Get started」节末段，直接事实）。

## 调研目标

- 确认 Cloudflare OS 的产品定位、技术架构与运行形态。
- 判定产品是否具备 Stateful 调度能力，还是任务执行宿主或无状态任务消费者。
- 厘清工作对象模型（Workspace/Workpiece/Gadget/Gatekeeper/Schedule）与 Agent 分派、连续性机制。
- 评估运行形态、Local 优先适配、Windows/macOS 落地形态与云端依赖边界。
- 识别依赖根源、开源/闭源边界与改造可行性。

## 产品调研

### 产品定位与目标用户

- **一句话定位**：Cloudflare OS 是开源的企业 AI 生产力工作区平台，让非工程师在浏览器中与 Agent 对话，研究主题、制作文档和搭建连接内部系统的全栈小应用，所有运行在客户自己的 Cloudflare 账户内。
- **目标用户**：企业平台团队和 IT 部门，为全组织员工（从工程到销售）提供 AI 工作区。Cloudflare 内部数千人每日使用，覆盖工程以外的各职能（官方博客，直接事实）。
- **开源与许可**：Apache-2.0，仓库 `cloudflare/cloudflare-os`，另有 `cloudflare-os-starter` 部署示例仓库。合作伙伴 Presidio 和 Happy Cog 提供企业定制（官方博客，直接事实）。
- **版本状态**：v2 为完整重写，2026 年 8 月发布，标注「heavy development」和「early access」，仍有粗糙之处（GitHub README「WARNING: Early access」节，直接事实）。

### 核心流程

1. 用户在浏览器中打开 Workspace，输入目标（如「为我即将到来的客户会议制作幻灯片」）。
2. Workspace 内的 Agent（Code Mode）理解上下文，编写并执行代码片段完成任务——可研究主题、创建文档/幻灯片/电子表格，或搭建全栈 Gadget 应用。
3. Agent 通过 Gatekeeper 能力绑定接入外部系统（GitHub、Google、Slack 等），能力绑定是类型化的 `env.NAME`，凭证对 Agent 不可见。
4. 产出的 Gadget 运行为 Dynamic Worker Facet，拥有独立 SQLite，默认私有，可像文档一样分享给团队实时协作。
5. 用户可将 Gadget 的代码分享为 Blueprint，他人可从 Blueprint 创建自己的副本（不含数据、会话历史或凭证）。
6. Workspace 可注册时间回调（`every` / `calendarAt` / `runAt`），到时间时由 Scheduler Alarm 触发回调交付到 Workspace 代码。

### 功能地图与边界

- **Agent 工作区**：对话式 AI，预载企业上下文和技能，隔离运行时可编写执行代码。
- **Gadget 应用平台**：全栈应用（客户端 + 服务端 + API + 持久状态），沙箱化，实时多人协作。
- **Blueprint 模板**：分享 Gadget 代码而非数据，每个用户运行自己的副本，可用 AI 修改。
- **Gatekeeper 安全框架**：能力驱动访问控制，观察日志，人在环路审批（含模拟结果异步审批）。
- **时间调度器**：间隔、日历、一次性时间回调，持久状态机，重试，管理只读 UI。
- **AI Gateway**：模型选择、成本控制、预算和速率限制。
- **MCP Portal**：接入现有 MCP Server。
- **格式 Blueprint**：内置文档、幻灯片、电子表格模板（`workshop-backend/format-blueprints/`，直接事实）。
- **明确不含**：Stateful 任务调度器（无 Task DAG/依赖/状态机/执行归属）、声明式工作流引擎、原生桌面应用、离线本地运行（生产形态）、外部贡献（README 标注暂不接受外部代码贡献）。

### 维护状态与版本演进

- 2026 年 5 月：v1 内部上线，Cloudflare 全员使用（官方博客「What we learned from the first version」节，直接事实）。
- 2026 年 8 月 5 日：v2 开源发布，完整重写。v1 的问题——App 是静态而非连接内部系统的活软件、确定性任务仍需消耗模型 token、协作暴露数据安全挑战——在 v2 中通过 Gatekeeper 安全框架、Dynamic Worker Facet 和观察日志解决。
- 2026 年 4 月 13 日：Durable Object Facets 和 Dynamic Workers 发布（先于 OS 开源），是 OS 的技术基础（Durable Object Facets 博客发布日期，直接事实）。
- 仓库约 1,283 stars（截至 2026-08-06 `ai-tldr.dev` 摘要，社区快照，不直接等同采用率）。
- 活跃开发中，官方规划方向含 Dashboard 全托管、容器支持、Slack/聊天工具集成（官方博客，直接事实）。

### 生态与反馈

- 官方集成 Gatekeeper：GitHub、Google、Cloudflare API、Supabase、Notion、Confluence、Email Workers、Home Assistant、Slack、Spotify、ZoomInfo、Linear、MCP Portal、MCP、Context（`packages/gatekeeper-*` 目录枚举，直接事实）。
- 合作伙伴：Presidio 和 Happy Cog 提供企业定制（官方博客，直接事实）。
- 社区反馈样本边界：仓库标注暂不接受外部贡献（GitHub README「Contributing」节），故 Issue/Discussion 反馈有限；`ai-tldr.dev` 摘要为产品发布新闻，非用户使用反馈。

## 技术架构调研

### 系统全貌与运行形态

开源（Apache-2.0）云端边缘平台 + 本地开发运行 + workerd 自托管（未就绪），全栈 TypeScript（官方博客 + GitHub README + wrangler.jsonc + 源码，直接事实）：

| 组件 | 职责 | 运行位置 |
| --- | --- | --- |
| Overseer Durable Object | Workspace 内核：Agent 会话、Workpiece 注册、代码同步（Yjs）、Chat、Actions/Hooks、分享、Blueprint | Cloudflare 边缘（DO） |
| Dynamic Worker Facet | Gadget 服务端代码按需加载，独立 SQLite，沙箱化 | Cloudflare 边缘（Dynamic Worker） |
| Gatekeeper Workers | 外部服务代理：OAuth、策略、日志、审批 | Cloudflare 边缘（独立 Worker） |
| ScheduleDriver DO | 时间回调调度：Alarm、状态机、重试 | Cloudflare 边缘（DO） |
| AI Gateway | 模型路由、成本追踪、预算限制 | Cloudflare 边缘 |
| Cloudflare Access | 身份认证、入站控制 | Cloudflare 边缘 |
| Router Worker | 开发环境请求路由 | Cloudflare 边缘（或本地 workerd） |
| 浏览器前端 | Workspace UI、Gadget 客户端 iframe、Cap'n Web RPC | 用户浏览器 |
| workerd | Workers 开源运行时（自托管基础） | 自有服务器（未就绪） |

- **范式判定**：Capability-based 安全沙箱平台 + 时间触发回调调度。非中心化特权调度服务，非分布式任务池，非声明式工作流引擎。按 Index 归类为**任务执行宿主 + 时间触发调度辅助**。

### 主要组件与核心链路

**核心链路**：用户在浏览器打开 Workspace → Overseer DO 加载 Workspace 上下文和 Yjs 文档 → 用户输入目标 → Agent（Code Mode）编写并执行代码片段，通过 Gatekeeper 能力绑定访问外部系统 → 产出 Gadget 或文档 → Gadget 服务端作为 Dynamic Worker Facet 加载，获得独立 SQLite → 客户端经 Cap'n Web RPC 与 Gadget 服务端通信 → 用户分享 Gadget 或 Blueprint → 可选注册时间回调到 Scheduler → 到时间时 Scheduler Alarm 触发回调交付到 Workspace。

跨进程/网络边界：浏览器 ↔ Cloudflare 边缘（HTTP/WebSocket）、Overseer DO ↔ Gadget Facet（DO 内 RPC）、Gatekeeper ↔ 外部服务（OAuth + 原生 API）、AI Gateway ↔ LLM 供应商（官方表述 + 架构推导）。

### 主要依赖

- **运行时硬依赖**：Cloudflare Workers 运行时（workerd）、Durable Objects（SQLite + Alarm + WebSocket Hibernation）、Dynamic Workers + Facets（Gadget 沙箱）、Workers Paid 计划。
- **平台依赖**：AI Gateway（模型路由）、Cloudflare Access（认证）、KV（Blueprint 元数据/头像）、R2（Blueprint 内容）。
- **开发依赖**：pnpm、Node.js、wrangler、Vite、oxlint。
- **第三方库**：`@earendil-works/pi-agent-core`（Agent 循环）、`pi-ai`（多模型 API）、Yjs（协作同步）、Cap'n Web（RPC）、Monaco（编辑器）（GitHub README「Credits」节，直接事实）。
- **不可剥离的硬依赖**：Workers 运行时及 DO/Facets/Dynamic Worker Loader API 是产品深度依赖的平台特性，不可关闭或替换而不失去核心架构。

### 接口形态

- **用户接口**：Web 浏览器（HTTP/WebSocket），唯一工作机接入形态。
- **Agent 接口**：Code Mode——Agent 编写并执行代码片段，通过 `env.NAME` 能力绑定调用 Gadget API 和 Gatekeeper API（Cap'n Web RPC）。
- **Gatekeeper 接口**：服务特定 Worker，对外暴露 TypeScript API（`env.PROJECT.listIssues()` 样式），内部处理 OAuth 和原生 API。
- **Gadget 接口**：客户端和服务端经 Cap'n Web RPC 通信；Agent 可直接调用 Gadget 服务端方法。
- **Scheduler 接口**：`ScheduleSession` RPC 接口，暴露 `every()` / `calendarAt()` / `runAt()` / `list()` 方法（`gatekeeper-scheduler/src/types.d.ts`，直接事实）。
- **MCP Portal**：接入现有 MCP Server 的桥接接口。

### 持久化方式

- **Durable Object SQLite**：每个 Workspace（Overseer DO）有独立 SQLite，存储 Chat 历史、Workpiece 注册、代码（Yjs）、绑定关系、分享状态。每个 Gadget Facet 有独立 SQLite。ScheduleDriver DO 有独立 SQLite 存储 Schedule 状态。UserDurableObject 存储用户级状态和模型配置。
- **KV**：Blueprint 元数据（`BLUEPRINTS`）和用户头像（`AVATARS`）。
- **R2**：Blueprint 内容和截图（`BLUEPRINT_CONTENT`）。
- **数据库类型**：嵌入式 SQLite（via Durable Objects），无外置数据库依赖。不可替换为外部 Postgres 或 D1 而不失去 DO 的零延迟本地存储特性（架构推导）。

### 通信方式

- **客户端 ↔ 服务端**：HTTP + WebSocket（Workspace UI 实时更新、Agent 流式回复）。
- **Gadget 客户端 ↔ 服务端**：Cap'n Web RPC（postMessage 到父帧 → DO RPC 到 Facet）。
- **Overseer ↔ Gadget Facet**：Durable Object 内部 `ctx.facets.get()` + DO RPC。
- **Overseer ↔ Gatekeeper**：Workers Bindings（`ctx.exports`）+ Cap'n Web RPC。
- **Scheduler**：DO Alarm 触发调度 → RPC 交付回调到 Workspace Overseer。每批最多 20 个 due schedule，4 个并发交付（`gatekeeper-scheduler/README.md`，直接事实）。
- **Agent ↔ LLM**：经 AI Gateway HTTP 路由到 LLM 供应商。

### 部署形态

#### 工作机安装（Windows / macOS）

- **Windows / macOS**：均无原生桌面应用、安装包或 CLI。唯一工作机接入方式是打开浏览器访问部署 URL（`os.cloudflare.app` 或自部署实例）。
- **依赖、权限与网络**：现代 Web 浏览器；网络可访问部署实例；Cloudflare Access 认证。
- **卸载**：关闭浏览器/取消部署。无本地残留。

#### 主体功能运行位置

- 主体功能运行在**云端**（Cloudflare 边缘网络）：Workspace 管理、Agent 运行、Gadget 沙箱执行、Gatekeeper 外部服务接入、Scheduler 调度。
- **Local 优先适配判断**：满足度低——生产部署目标为 Cloudflare 边缘；本地开发运行模式明确非生产；workerd 自托管技术可行但产品化未就绪。主体能力依赖云端，构成 **Local 优先选型缺陷**。但需注意：部署到客户自己的 Cloudflare 账户意味着数据在客户账户内、客户控制模型和成本，且 workerd 开源使自托管在技术路径上可行（直接事实 + 架构推导）。

#### 云端形态

- **职责边界**：承载全部主体能力——Workspace 管理（Overseer DO）、Gadget 执行（Dynamic Worker Facet）、外部服务代理（Gatekeeper Workers）、时间调度（ScheduleDriver DO）、模型路由（AI Gateway）、认证（Cloudflare Access）。
- **核心组件**：OverseerDurableObject、UserDurableObject、AdminSettings、PendingLogin、ScheduleDriver、SchedulerGatekeeper、16+ Gatekeeper Workers、Router Worker。
- **接口/持久化/通信**：HTTP/WebSocket 入站；DO SQLite 持久化；Cap'n Web RPC 内部通信；Workers Bindings 跨 Worker 通信。
- **部署/托管**：部署到客户 Cloudflare 账户，使用 Workers Paid 计划。数据在客户账户内，凭证由 Gatekeeper 持有。
- **数据/权限/网络边界**：能力驱动安全——Agent 和 Gadget 默认无访问，需显式引入资源。观察日志记录 Agent 读取的所有资源。跨 Workspace 共享时验证观察资源的访问权限。Gadget 服务端全局出站网络禁用，仅通过 Bindings 访问指定资源。客户端 iframe 沙箱化，仅经 Cap'n Web postMessage 与服务端通信。
- **故障影响**：浏览器离线后无法操作；Cloudflare 边缘故障影响全部功能；单 Workspace DO 故障影响该 Workspace（直接事实 + 架构推导）。

## 未决项与证据边界

- **Scheduler 深层行为未完全验证**：Alarm 触发到回调交付的完整跨 RPC 路径、租约超时回收的具体实现细节未做逐行源码审计；但状态机、重试策略和批量限制已由 README 和 `driver-state.ts` 源码交叉确认。
- **Agent 断线恢复机制未决**：Agent 执行中断或失败后，Chat 上下文可恢复（Yjs + SQLite），但是否存在自动续执行或检查点恢复至 Agent 运行中状态的机制，未在源码中定点核验；当前按「会话可恢复但任务不自动续执行」推断（架构推导 + 证据边界）。
- **workerd 自托管生产形态未决**：README 标注「COMING SOON」，自托管的技术可行性（workerd 开源、`run-local` 已在 workerd 上运行）已确认，但生产部署的配置、持久化、迁移和运维工具链未公开，无法评估自托管的实际成熟度。
- **调度器扩展性未决**：单账户单 Driver DO 是共享故障域——一个不结算的回调可延迟同账户其他 Schedule（README 明确说明）。多账户/分布式协调机制未见；当前规模下可能不是问题但扩展性边界未验证。
- **AgentSpawner 的实际使用场景未决**：源码显示 Gadget 可注册 Spawner 创建子 Agent Chat，但实际企业使用中 Spawner 被用于哪些场景、子 Agent 的生命周期管理如何，未在公开资料中体现。
- **快照边界**：仓库为 2026-08-06 快照，产品标注「heavy development」和「early access」，架构和 API 可能快速变化。官方规划方向（Dashboard 全托管、容器、Slack 集成）尚未落地。

## 后续验证建议

- 若要评估 Cloudflare OS 作为 Agent 工作承载层的调度能力差距，应实测：Agent 执行中断后 Chat 是否能从 Yjs 检查点续执行、Scheduler 回调交付失败 8 次后 Workspace 的实际行为、AgentSpawner 创建的子 Agent 失败后是否有恢复路径。
- 就 Local 优先落地，应跟进 workerd 自托管生产工具链的发布进度；在工具链就绪前，自托管需自行阅读 workerd 低层文档配置（README 原文建议「point your agent at it and have a go」），改造成本和运维复杂度待评估。
- 若需要 Stateful 调度能力，Cloudflare OS 不满足要求；但其 Capability-based 安全模型、Gadget 沙箱、时间调度器和 Gatekeeper 架构可作为安全执行宿主的参考，调度层需在 OS 之上另行构建。
- 定位明确：Cloudflare OS 是**开源 Capability-based Agent 工作区平台 + 时间触发回调调度**的产品范本（对「Workspace 隔离、安全沙箱、Agent 接入外部系统」极具参考价值），而非 Stateful 中心调度器或 Local 优先产品；作为任务执行宿主其安全架构值得关注，但调度能力需补齐。
