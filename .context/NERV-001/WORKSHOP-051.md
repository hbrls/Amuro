# Moxt 技术产品调研

> updated_by: Qoder - Claude Sonnet 4.5
> updated_at: 2026-08-07 10:30:00
> evidence_window: 调研日期 2026-08-07；目标版本为 2026 年 7 月 31 日 What's New 更新（最新公开版本信息）；官方网站 moxt.ai（截至 2026-08-07）

## 交付结论

### Moxt 是面向企业的 AI 原生工作区平台，主体为云端 SaaS，非工作机本地调度系统

Moxt 定位为「Agent-Native Workspace」——让人类员工和 AI Teammate 在同一工作区协作，AI 团队 24/7 工作、学习并积累经验（[Moxt 官网](https://moxt.ai/)，直接事实）。产品核心概念包括：momo（个人 AI 助手）、AI Teammates（团队级 AI 成员）、Workspace（共享工作空间）、Mini Apps（AI 构建的内部工具）、Task Board（多 Agent 任务板）和 Workflow（工作流）。

对照 Index 判定基准：Moxt 不是工作机本地调度系统。其主体能力——Workspace 管理、AI Teammate 运行时、任务协调、Mini App 执行——运行在 Moxt 云端平台上。用户通过浏览器接入，不存在 Windows 或 macOS 原生桌面应用。产品形态是标准的云端 SaaS，数据存储在 Moxt 云端（官网「Credits-Based Pricing」节，直接事实 + 架构推导）。

### 不具备 Stateful 调度能力：有 Task Board 和 Workflow 但无持久任务对象模型、无 DAG/依赖关系调度、无中心调度器，按任务执行宿主记录

Moxt 的工作对象模型是 Workspace → Team Space → AI Teammate + Task + Workflow + Mini App，不存在 Index 关注的持久 Task 对象作为一等调度实体（官网「Task Board」节 + 「Workflow」节，直接事实）。Task Board 展示任务状态（Todo / In Progress / Done），Workflow 支持任务创建、编辑、分配和优先级设置，但无 DAG、并行分支、资源约束或复杂的依赖关系调度。

任务协调机制是「AI Teammate 自主执行 + 人工干预」：AI Teammate 按预定规则（定时触发、事件触发、@提及）自动执行任务；用户可在 Task Board 上查看进度、编辑任务、调整优先级和负责人（官网「What's New」2026-07-31 更新，直接事实）。这不是调度器依据任务状态、依赖和策略主动选择执行者的调度形态，而是「规则触发 + AI 自主执行」的执行宿主形态。

对照 Index 调度判定基准——Stateful 调度系统必须「持久拥有工作对象、对象关系、任务状态和执行归属，并负责判断任务何时可执行、按何种顺序推进、由谁执行以及失败后如何继续」——Moxt 不满足此条件。Task 和 Workflow 是 Moxt 平台内的对象，但调度逻辑由 AI Teammate 的规则配置驱动，无中心调度进程负责推进；任务间无复杂依赖关系；执行归属由规则预设而非调度器动态分派；失败后无公开的自动重试或转移机制（官网未提及，架构推导）。按**任务执行宿主**记录，不判定为调度工具。

### 工作对象模型：有 Workspace / Team Space / AI Teammate / Task / Workflow / Mini App；无 Issue / Plan 持久对象

可辨识的持久对象（官网 + What's New，直接事实）：

- **Workspace**：顶层组织单元，包含成员、AI Teammate、Team Space、Mini App 和积分。
- **Team Space**：团队级工作空间，可设为 Secret（邀请制），包含文档、聊天、任务和 AI Teammate。
- **AI Teammate**：团队级 AI 成员，有名称、角色、专业领域，可定时或事件触发执行任务。每个 AI Teammate 有独立的记忆、技能和身份。
- **momo**：个人 AI 助手，专属于单个用户，读取个人文档和笔记，提供主动洞察。
- **Task**：工作项，有标题、描述、状态（Todo / In Progress / Done）、优先级、负责人（owner）、执行人（assignee）。支持手动编辑和 AI 引用。
- **Workflow**：工作流，包含多个 Task，支持 Board / List / Workflow / Activity / Settings 视图。
- **Mini App**：AI 构建的内部工具，有独立数据库，可嵌入 Workspace。
- **Skill**：从 Moxt Hub 安装的技能包，扩展 AI Teammate 能力。

**明确缺失**：无 Issue 作为外部系统读取后交给 Agent 的输入；无 Plan 作为持久编排对象——AI 的规划是单次会话内的文本产物，不持久为编排对象。Task 和 Workflow 是平台内对象，但无中心调度系统拥有和推进（官网功能描述 + 架构推导）。

### Agent 分派是「规则触发 + AI 自主执行」而非调度器选人；退出/失败/断线后的任务恢复机制未公开

Agent 执行由三种方式触发（官网「AI Teammates」节 + 「Automations」节，直接事实）：

1. **定时触发**：Scheduled tasks，按预设时间自动执行（如每周一早上 9 点生成周报）。
2. **事件触发**：Webhook、GitHub 集成、Slack @提及等外部事件触发。
3. **手动触发**：用户在聊天中 @提及 AI Teammate 或直接分配任务。

任务分派是「规则预设 + AI 自主执行」的形态。AI Teammate 按预定义规则自动执行，用户可在 Task Board 上查看进度和干预。无公开的调度器动态选择执行者机制（官网未提及，架构推导）。

AI Teammate 退出、失败或断线后的恢复机制未公开：官网未提及任务失败后的自动重试、转移或检查点恢复机制；「24/7 工作」暗示持续运行，但具体容错机制未公开（架构推导 + 证据边界）。

### 运行形态是云端 SaaS；主体能力不在工作机本地，构成 Local 优先选型缺陷

Moxt 是标准的云端 SaaS 产品（官网「Credits-Based Pricing」节，直接事实）：

- **接入方式**：浏览器访问 moxt.ai，无原生桌面应用。
- **数据存储**：云端存储，具体位置和合规性未公开。
- **定价模式**：积分制（$1 = 100 credits），无席位费，无功能门槛。
- **平台支持**：Web 浏览器，支持 Slack、GitHub、Feishu 等集成。

主体功能（Workspace 管理、AI Teammate 运行、任务协调、Mini App 执行）运行在 Moxt 云端。用户通过浏览器接入，无本地服务端形态。据此判断主体能力依赖云端，断网后核心流程不可用——这是 **Local 优先选型缺陷**（直接事实 + 架构推导）。

### Windows 与 macOS：无原生桌面应用，浏览器接入是唯一工作机形态

Moxt 是 Web 应用，用户通过浏览器访问 moxt.ai（官网，直接事实）。不存在 Windows 或 macOS 原生桌面应用、安装包或 CLI 工具。两端安装方式均为打开浏览器访问 URL，运行入口为浏览器，依赖为现代 Web 浏览器和网络连接，权限为 Moxt 账号认证，网络要求为可访问 Moxt 云端，卸载为关闭浏览器/删除账号。

按 Index「必须分别详细说明 Windows 和 macOS 工作机上的安装方式、运行入口、依赖、权限、网络要求和卸载方式」的要求：两端均无原生二进制或安装包，以「无原生桌面应用」形式记录为选型缺陷（直接事实）。

### 存在云端组件且为核心主体：Moxt 云端平台承载全部能力

Moxt 的云端组件是产品主体，非辅助网关。核心组件及职责（官网功能描述 + 架构推导）：

- **Workspace 管理**：用户、权限、Team Space、积分管理。
- **AI Teammate 运行时**：Agent 执行环境，支持多模型（含 DeepSeek V4-Flash）。
- **任务协调**：Task Board、Workflow、Automations。
- **Mini App 平台**：AI 构建的内部工具，含独立数据库。
- **集成层**：Slack、GitHub、Feishu、CRM 等外部系统连接。
- **Moxt Hub**：技能、Mini App、模板市场。

数据边界：用户数据存储在 Moxt 云端，具体数据位置和合规性未公开。集成层连接外部系统时，数据经过 Moxt 云端中转（架构推导）。断网影响：浏览器离线后无法使用（直接事实）。

### 开源与闭源边界：闭源商业产品，无开源组件

Moxt 是闭源商业产品，官网无开源协议、源码仓库或自托管选项（官网 + 公开资料，直接事实）。公司规模 11-50 人，总部位于 Mountain View（LinkedIn 公开信息，社区快照）。

外部依赖包括：Slack、GitHub、Feishu、Google 文档、CSV 等集成（官网「Integrations」节，直接事实）。这些集成通过 Moxt 云端平台连接，非本地依赖。

### 依赖根源：无本地硬依赖；云端平台依赖未公开

影响安装、运行和部署的依赖（官网，直接事实）：

- **必需**：网络连接、现代 Web 浏览器、Moxt 账号。
- **可选**：Slack、GitHub、Feishu 等外部系统账号（用于集成）。
- **无本地数据库依赖**：数据存储在 Moxt 云端。
- **无本地运行时依赖**：无桌面应用或 CLI。

云端平台依赖未公开：具体云服务商、数据库类型、LLM 供应商等未公开（架构推导 + 证据边界）。

### 架构范式判定：云端 SaaS 工作区平台 + 规则触发 AI 执行，非中心化特权调度服务

Moxt 的架构范式是：以云端 Workspace 为组织单元、以 AI Teammate 为执行主体、以规则触发（定时/事件/手动）为协调机制的 SaaS 工作区平台（官网功能描述 + 架构推导）。

核心组件及职责：

| 组件 | 职责 | 运行位置 |
| --- | --- | --- |
| Workspace | 组织单元，管理成员、权限、积分 | Moxt 云端 |
| Team Space | 团队工作空间，包含文档、聊天、任务 | Moxt 云端 |
| AI Teammate | 团队级 AI 成员，执行任务 | Moxt 云端 |
| momo | 个人 AI 助手 | Moxt 云端 |
| Task Board | 任务展示和协调 | Moxt 云端 |
| Workflow | 工作流管理 | Moxt 云端 |
| Mini App | AI 构建的内部工具 | Moxt 云端 |
| 集成层 | 连接外部系统（Slack/GitHub/Feishu） | Moxt 云端 |

通信方式：用户通过浏览器与 Moxt 云端交互；AI Teammate 通过 Moxt 云端平台执行任务；外部系统通过 Webhook/API 与 Moxt 云端集成（架构推导）。

调度逻辑不能下沉为普通 Agent 任务节点——Moxt 的协调机制依赖云端平台的规则引擎和任务状态管理，非独立调度服务（架构推导）。

## 调研目标

- 确认 Moxt 的产品定位、技术架构与运行形态。
- 判定产品是否具备 Stateful 调度能力，还是任务执行宿主或无状态任务消费者。
- 厘清工作对象模型（Workspace/Team Space/AI Teammate/Task/Workflow/Mini App）与 Agent 分派、连续性机制。
- 评估运行形态、Local 优先适配、Windows/macOS 落地形态与云端依赖边界。
- 识别依赖根源、开源/闭源边界与改造可行性。

## 产品调研

### 产品定位与目标用户

- **一句话定位**：Moxt 是 AI 原生工作区平台，让人类员工和 AI Teammate 在同一空间协作，AI 团队 24/7 工作、学习并积累经验。
- **目标用户**：企业团队（初创公司、小型企业、代理机构、产品团队），特别是需要 AI 辅助内容生产、产品交付、客户管理、竞争情报等场景的团队（官网「Solutions」节，直接事实）。
- **开源与许可**：闭源商业产品，无开源协议。
- **版本状态**：活跃开发中，2026 年 7 月 31 日发布最新 What's New（Workflow 任务手动编辑、Secret Team Space、DeepSeek V4-Flash 模型等）（官网「What's New」节，直接事实）。

### 核心流程

1. 用户在浏览器中注册 Moxt 账号，创建 Workspace。
2. 邀请团队成员（免费），创建 Team Space。
3. 创建 AI Teammate：定义名称、角色、专业领域、触发规则（定时/事件/手动）。
4. AI Teammate 自动执行任务：读取文档、生成内容、更新 Mini App、发送消息。
5. 用户在 Task Board 上查看任务进度，编辑任务、调整优先级和负责人。
6. 使用 Mini App 管理结构化数据（CRM、项目跟踪等）。
7. 通过 Slack、GitHub、Feishu 等集成接收通知和触发任务。

### 功能地图与边界

- **AI Teammate**：团队级 AI 成员，有记忆、技能、身份，可定时/事件/手动触发。
- **momo**：个人 AI 助手，专属于单个用户。
- **Workspace**：共享工作空间，包含文档、聊天、任务、Mini App。
- **Task Board**：多 Agent 任务板，展示 Todo / In Progress / Done 状态。
- **Workflow**：工作流管理，支持 Board / List / Workflow / Activity / Settings 视图。
- **Mini App**：AI 构建的内部工具，有独立数据库。
- **Automations**：自动化规则，定时任务、Webhook 触发、GitHub 集成。
- **Moxt Hub**：技能、Mini App、模板市场。
- **Integrations**：Slack、GitHub、Feishu、Google 文档、CSV 等。
- **CLI & MCP**：命令行和 Model Context Protocol 支持（官网导航栏提及，具体功能未公开）。
- **明确不含**：Stateful 任务调度器（无 DAG/依赖/资源约束）、本地桌面应用、自托管选项、开源版本。

### 维护状态与版本演进

- **活跃维护**：2026 年 7 月 31 日发布最新 What's New，持续更新功能（官网「What's New」节，直接事实）。
- **关键版本演进**：
  - 2026 年 7 月 31 日：Workflow 任务手动编辑、Secret Team Space、DeepSeek V4-Flash 模型、附件限制提升。
  - 早期版本：AI Teammate、Mini App、Task Board、Workflow、Moxt Hub。
- **生态入口**：Moxt Hub（技能、Mini App、模板市场）；Slack、GitHub、Feishu 等集成。
- **反馈主题**：公开反馈有限；LinkedIn 上创始人 Pulin Yu 分享产品理念（社区样本，不代表整体）。

## 技术架构调研

### 系统全貌与运行形态

云端 SaaS 工作区平台，全栈闭源（官网 + 架构推导）：

| 组件 | 职责 | 运行位置 |
| --- | --- | --- |
| Workspace | 组织单元，管理成员、权限、积分 | Moxt 云端 |
| Team Space | 团队工作空间 | Moxt 云端 |
| AI Teammate | 团队级 AI 成员 | Moxt 云端 |
| momo | 个人 AI 助手 | Moxt 云端 |
| Task Board | 任务展示和协调 | Moxt 云端 |
| Workflow | 工作流管理 | Moxt 云端 |
| Mini App | AI 构建的内部工具 | Moxt 云端 |
| 集成层 | 连接外部系统 | Moxt 云端 |

- **范式判定**：云端 SaaS 工作区平台 + 规则触发 AI 执行。非中心化特权调度服务，非分布式任务池，非声明式工作流引擎。按 Index 归类为**任务执行宿主**。

### 主要组件与核心链路

**核心链路**：用户注册 Moxt → 创建 Workspace 和 Team Space → 创建 AI Teammate 并配置触发规则 → AI Teammate 按规则自动执行任务（读取文档、生成内容、更新 Mini App）→ 用户在 Task Board 查看进度和干预 → 通过集成接收通知和触发新任务。

跨进程/网络边界：用户浏览器 ↔ Moxt 云端（HTTP/WebSocket）；Moxt 云端 ↔ 外部系统（Slack/GitHub/Feishu API）；AI Teammate ↔ LLM 供应商（模型推理）（架构推导）。

### 主要依赖

- **运行时硬依赖**：网络连接、现代 Web 浏览器、Moxt 账号。
- **可选依赖**：Slack、GitHub、Feishu 等外部系统账号（用于集成）。
- **云端平台依赖**：具体云服务商、数据库、LLM 供应商未公开。
- **不可剥离的硬依赖**：Moxt 云端平台（闭源，不可替换）。

### 接口形态

- **用户接口**：Web 浏览器（HTTP/WebSocket）。
- **AI 接口**：AI Teammate 通过 Moxt 平台执行任务，支持聊天交互。
- **集成接口**：Slack、GitHub、Feishu、Google 文档、CSV 等 API 集成。
- **CLI & MCP**：命令行和 Model Context Protocol 支持（具体功能未公开）。
- **Webhook**：外部系统触发 Workflow。

### 持久化方式

- **Workspace 数据**：Moxt 云端存储，具体数据库类型未公开。
- **Mini App 数据**：每个 Mini App 有独立数据库（官网「Mini Apps」节，直接事实）。
- **Task/Workflow 数据**：Moxt 云端存储。
- **文件存储**：支持 Markdown、HTML、CSV、Google 文档等格式（官网「Integrations」节，直接事实）。

### 通信方式

- **客户端 ↔ 服务端**：HTTP/WebSocket（浏览器与 Moxt 云端）。
- **AI Teammate ↔ 用户**：聊天界面实时交互。
- **AI Teammate ↔ 外部系统**：通过 Moxt 集成层（API/Webhook）。
- **任务触发**：定时触发、事件触发（Webhook/GitHub/Slack）、手动触发。

### 部署形态

#### 工作机安装（Windows / macOS）

- **Windows / macOS**：均无原生桌面应用、安装包或 CLI。唯一工作机接入方式是打开浏览器访问 moxt.ai。
- **依赖、权限与网络**：现代 Web 浏览器；网络可访问 Moxt 云端；Moxt 账号认证。
- **卸载**：关闭浏览器/删除账号。无本地残留。

#### 主体功能运行位置

- 主体功能运行在**云端**（Moxt 云端平台）：Workspace 管理、AI Teammate 运行、任务协调、Mini App 执行。
- **Local 优先适配判断**：满足度低——纯云端 SaaS，无本地形态。主体能力依赖云端，构成 **Local 优先选型缺陷**。

#### 云端形态

- **职责边界**：承载全部主体能力——Workspace 管理、AI Teammate 运行、任务协调、Mini App 执行、集成层。
- **核心组件**：Workspace 管理、AI Teammate 运行时、Task Board、Workflow、Mini App 平台、集成层、Moxt Hub。
- **接口/持久化/通信**：HTTP/WebSocket 入站；云端数据库持久化；API/Webhook 外部集成。
- **部署/托管**：Moxt 官方托管，无自托管选项。
- **数据/权限/网络边界**：用户数据存储在 Moxt 云端，具体位置和合规性未公开；集成层连接外部系统时数据经过 Moxt 云端中转。
- **故障影响**：浏览器离线后无法使用；Moxt 云端故障影响全部功能。

## 未决项与证据边界

- **云端架构细节未公开**：具体云服务商、数据库类型、LLM 供应商、任务队列实现等未公开；当前按「云端 SaaS」记录（直接事实 + 证据边界）。
- **任务失败恢复机制未公开**：AI Teammate 失败后的自动重试、转移或检查点恢复机制未公开；「24/7 工作」暗示持续运行，但具体容错机制未公开（架构推导 + 证据边界）。
- **CLI & MCP 功能未公开**：官网导航栏提及 CLI & MCP，但具体功能和使用方式未公开（证据边界）。
- **数据合规性未公开**：数据存储位置、GDPR/SOC2 等合规认证未公开（证据边界）。
- **快照边界**：调研基于 2026-08-07 的官网信息，产品处于活跃开发阶段，功能可能快速变化。

## 后续验证建议

- 若要评估 Moxt 作为 Agent 工作承载层的调度能力差距，应实测：AI Teammate 失败后的任务状态、Workflow 中任务依赖的实际行为、大规模任务并发时的协调机制。
- 就 Local 优先落地，Moxt 不满足要求；如需 Local 优先，需评估其他支持自托管或本地运行的产品。
- 若需要 Stateful 调度能力，Moxt 不满足要求；但其「AI Teammate + 规则触发 + Task Board」模式可作为轻量级协调机制的参考，调度层需在 Moxt 之上另行构建。
- 定位明确：Moxt 是**云端 AI 原生工作区平台**的产品范本（对「AI 团队协作、任务可视化、Mini App 构建」极具参考价值），而非 Stateful 中心调度器或 Local 优先产品；作为任务执行宿主其 AI 原生协作模式值得关注，但调度能力需补齐。
