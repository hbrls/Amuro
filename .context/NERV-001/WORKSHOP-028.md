# HagiCode 技术产品调研

> updated_by: Codex - GPT-5.6
> updated_at: 2026-07-31 18:16:43
> evidence_window: 调研日期 2026-07-30 至 2026-07-31；HagiCode Desktop v0.1.77（2026-07-29）；HagiCode Server Release 0.1.0-beta.72（2026-06-26）；官方组织仓库、公开生成 API 客户端与官方中英文文档快照；Windows 当前公共渠道为 Microsoft Store

## 交付结论

1. **HagiCode 是一个本地优先的 Agentic Coding 工作区**。它把普通对话、OpenSpec 提案、任务拆解、代码执行、多仓库管理、知识库、Git 提交、Agent CLI 管理、并发会话和游戏化反馈整合到同一产品中。其目标不是替代某一个模型或 Agent CLI，而是在多个 CLI 之上提供项目级工作流和管理界面。
2. **主体功能运行在工作 PC，符合本次 RUNBOOK 的核心要求**。桌面版是 Electron 应用，在本机安装、启动和管理 HagiCode Server；Server 使用本地 SQLite，默认监听本机 45000 端口；Desktop 还管理隔离的 Node 22 工具链、Agent CLI 和本地项目目录。容器版也可在工作机 Docker 中运行。远端主要承担模型推理、版本下载、可选模型路由、GitHub 等第三方集成，不承载 HagiCode 的核心工作区与数据库。
3. **Windows 是当前支持最完整的平台**。官方推荐 Windows 10/11 通过 Microsoft Store 安装，更新和包交付由 Store 管理；Store 不可用时可下载 `.exe` 或 `.msix`。但最新 v0.1.77 的 GitHub 手动下载产物均明确标记为 `unsigned`，因此企业环境应优先使用 Store，或固定使用已签名、可验证的版本。
4. **macOS 有 Intel 与 Apple Silicon 安装包，但当前签名体验存在明显风险**。v0.1.77 只提供 `arm64-unsigned.dmg` 和 `x64-unsigned.dmg`；官方文档要求遇到 Gatekeeper 报错时以管理员权限执行 `sudo xattr -dr com.apple.quarantine /Applications/Hagicode.app`。这证明产品能安装，却不等于具备成熟的 Apple 签名与公证交付链路。
5. **产品不是“完全离线 AI”**。本地 Server、SQLite、工作流与代码操作可以留在 PC，但使用 Claude Code、Codex、OpenCode 等 Agent CLI 时，提示词、代码上下文和生成请求可能发送给所配置的模型服务。官网“所有数据均在本地处理、代码绝不上传”的表述只能理解为本地持久化默认值，不能覆盖第三方 AI 提供方的数据流；隐私政策也明确提示云基础设施、跨区域处理和第三方 AI 集成。
6. **开源边界是混合模式，而不是完整开源产品**。Electron Desktop 和官网仓库采用 AGPL-3.0，CLI 的包清单声明 AGPL-3.0-or-later，Hagicode.Libs 为 MIT；但官方公开组织仓库与 GitHub 仓库名搜索均未发现 HagiCode Server 核心源码，发布仓库只说明消费 `repos/hagicode-core` 的构建产物，EULA 对 Desktop 管理的 HagiCode Server 授予有限、可撤销的使用许可。准确表述应是“Server 实现源码当前未公开”，而不是在没有官方确认时断言其永久闭源；公开二进制和生成的 API 客户端也不等于核心实现开源。
7. **维护活跃，但成熟度仍是快速变化的 0.1 阶段**。Desktop 仓库在 2026-07-30 仍有提交，近期连续发布 v0.1.75、v0.1.76、v0.1.77；但 Release 正文均只有“No changes”，正式文档 Release Notes 只同步到 `v0.1.0-beta.71`，且近期存在多次功能替换和 Breaking Changes。当前更适合试用和验证，不宜在未固定版本、备份数据和验证升级前直接作为关键生产基础设施。
8. **HagiCode 的主要工程价值是“多 Agent CLI 的本地控制平面”**：默认只读会话、显式编辑模式、OpenSpec 提案生命周期、多实例并行、隔离工具链、统一模型路由和本地持久化共同降低了直接裸用 Agent CLI 的管理成本。官网宣称的“10x+ 并行”和“300% 效率提升”属于营销指标，本次没有运行 benchmark，不作为已确认结论。
9. **可以复刻同类产品和 API 兼容子集，但不能仅凭当前公开 SPEC 复刻 1:1 可替换的 Server**。公开 CLI 中提交了由后端 OpenAPI 生成的 38 个服务、184 个 HTTP 操作和 441 个数据模型，足以还原相当一部分外部契约；但原始 Swagger、Server 自身的 OpenSpec 变更集、数据库迁移、状态转换规则、SignalR 事件语义、并发恢复和 Agent 子进程编排实现均未公开。可行路径是固定目标版本后进行 clean-room 契约采集与分阶段实现，而不是把生成客户端当作完整实现规格。

## 调研目标、范围与边界

### 调研目标

理解 HagiCode 是什么产品、如何组织 Agent 工作，并重点回答：

1. 产品的定位、目标用户、核心流程和功能边界是什么？
2. Windows 与 macOS 工作机如何安装、运行和卸载？
3. HagiCode 的主体功能位于 PC 本地还是云端？
4. Desktop、Server、SQLite、Agent CLI 和外部模型之间如何协作？
5. 产品的维护状态、开源边界、版本成熟度和公开反馈如何？

### 覆盖范围

- 产品定位、用户、核心流程、功能边界、维护与生态。
- 桌面版、容器版、本地 Server、Agent CLI 与数据持久化。
- Windows/macOS 安装、依赖、权限、网络和卸载方式。
- 为确认主体位置与安装资格所需的定点仓库证据。

### 明确排除

- 不进行逐文件源码审计、代码质量审计或安全渗透测试。
- 不反编译 HagiCode Server 二进制，不以程序集内部实现作为复刻依据。
- 不进行竞品比较、模型优劣比较或 Agent CLI 选型矩阵。
- 不调研遥测、监控、运营指标或站点分析实现。
- 不实际安装 HagiCode、不运行模型、不执行性能 benchmark。
- Linux 不作为本次工作 PC 的合格安装路径，只在解释容器发布形态时简要提及。

## 证据口径

- **直接事实**：来自 HagiCode 官方网站、官方文档、GitHub Release、公开仓库 README、版本索引和 EULA/隐私政策。
- **公开 API 契约**：来自 `HagiCode-org/cli` 中由后端 OpenAPI 生成的 TypeScript 客户端；用于识别接口、参数和 DTO，不用于推断未公开的业务实现。
- **架构推导**：用于解释 Electron、本地 .NET Server、SQLite、Agent CLI 子进程和模型服务之间的关系；本次未做运行时抓包或实机验证。
- **公开反馈**：GitHub Issues 样本极少，不能形成可靠的用户满意度判断。
- **证据冲突处理**：当营销页“完全本地/离线”与安装文档、API Token 要求和隐私政策存在差异时，以更具体的运行与法律文档限定宣传表述。
- **版本边界**：Desktop 最新包为 v0.1.77；独立 Server 最新 GitHub Release 为 `0.1.0-beta.72`；产品功能 Release Notes 截止 `v0.1.0-beta.71`；公开生成 API 目录最近一次提交更新为 2026-04-19，四套版本信息不同步。

## 产品调研

### 产品定位与目标用户

**一句话定位**：HagiCode 是一个在本机运行的 AI 软件开发工作区，用统一界面管理多个 Agent CLI、项目、会话、提案、知识与 Git 流程，并用游戏化反馈呈现长期进度。

官方将其同时定义为：

- AI 编程工具：理解仓库、规划任务、执行修改和整理提交。
- 综合开发平台：连接多仓库、Skills、Vault、Code Server 和模型路由。
- 游戏化工作区：使用英雄、职业、等级、成就、日报和效率指标呈现 Agent 状态。

目标用户包括：

- 希望先分析、再决定是否让 AI 修改代码的个人开发者。
- 需要同时管理多个 Agent CLI 或同一 CLI 多实例的重度 AI 用户。
- 需要对复杂变更保留范围、任务、验证和归档记录的技术负责人。
- 涉及多个仓库、前后端、文档和脚本联动的团队。
- 希望在本地统一管理模型订阅、工具链与项目知识的用户。

### 核心流程

#### 初始化流程

1. 安装并启动 HagiCode Desktop。
2. Desktop 准备本地 HagiCode Server、运行时和 SQLite 数据路径。
3. 初始化向导选择语言和主题，检测 Node、npm、Git、OpenSpec 等依赖。
4. 用户选择常用 Agent CLI 与模型，创建默认 Agent 身份。
5. 绑定至少一个本地项目目录，进入工作区。

#### 普通对话流程

1. 用户从会话列表创建 Conversation Session。
2. 新会话默认处于**只读模式**，Agent 可以读取目录和文件、分析模块与风险，但不应直接编辑。
3. 用户可选择英雄预设、模型提供方、历史上下文和图片附件。
4. 只有在用户显式切换到编辑模式后，Agent 才进入实际文件修改路径。
5. 会话历史、工具调用和项目上下文留在本地工作区与 Server 数据中。

#### OpenSpec 提案流程

复杂需求使用 Proposal Session：

1. 在 New Idea 入口选择项目和仓库范围，描述变更。
2. 系统先明确目标、影响范围、任务和验证条件，而不是立即改代码。
3. OpenSpec 工作流依次覆盖审查上下文、搭建提案、规格差异、设计、任务、严格验证、执行和归档。
4. Session Board 同时展示待处理、执行中和已归档提案。
5. 完成后保留执行结果、提交说明和会话历史，供复查与后续继续。

### 功能地图与边界

| 功能域 | 当前能力 | 边界与说明 |
| --- | --- | --- |
| 会话 | 只读分析、编辑模式、图片、快捷提示、历史上下文 | 实际能力取决于所选 Agent CLI |
| 提案 | OpenSpec 范围、任务、验证、执行、归档 | 用于复杂变更，不是简单聊天 |
| 多 Agent | 约 13 类 Agent CLI，多实例并行，英雄/职业映射 | CLI 支持范围变化较快，需按当前版本验证 |
| 项目 | 本地目录、多仓库 MonoSpecs、Git 状态与批量操作 | 项目文件直接位于工作机 |
| 知识 | Vault、Skills、历史提案和长期上下文 | 是否同步或导出需按具体功能确认 |
| 模型 | Agent CLI 自带模型源，或通过 OmniRoute 统一路由 | 外部模型请求通常需要网络和凭据 |
| 本地编辑 | 内嵌/关联 Code Server、文件修改和 Git 提交 | 高权限 Agent 行为仍需人工审查 |
| 游戏化 | 成就、日报、等级、效率、Token 吞吐、主题 | 不影响核心代码执行能力 |
| 商业能力 | 基础功能免费；Store 版可购买 TurboEngine | 免费并发提案上限为 3，TurboEngine 可提升至 32 |

HagiCode 当前不是：

- 完全本地推理引擎；它主要编排外部 Agent CLI 和模型服务。
- 单一 IDE 编辑器；它更接近本地开发控制平面与工作流平台。
- 完整开源的 Server 产品；公开源码和 EULA 组件需要分别判断。
- 已证明能稳定实现“10x+ 并行效率”的生产级调度系统。

### 维护状态与版本演进

#### 当前活跃度

- `HagiCode-org/desktop` 创建于 2026-02-02，2026-07-30 仍有推送，约 1,017 次提交。
- Desktop 最新 Release 为 v0.1.77，发布于 2026-07-29；v0.1.75、v0.1.76、v0.1.77 在数日内连续发布。
- 官网、文档、索引、Windows Store 打包与公共库仓库在 2026-07 下旬持续更新，判定为**活跃开发**。
- 公开关注度仍小：官网仓库约 124 Stars，Desktop 约 4 Stars。该快照不能代表真实使用量。

#### 方向性演进

近期 Release Notes 反映的主要方向包括：

- 从自由对话扩展为 Preset Task、OpenSpec 提案和 Session Board。
- 增加更多 Agent CLI、CLI 重试、流式输出和会话恢复。
- 加入 PWA、SignalR 推送、Code Server 与远程输入。
- 加强多仓库、Git 批量操作、Skills、Vault 和模型目录。
- 将 DLC 授权改为离线签名授权包，适应离线部署。
- 持续替换旧功能并发生 Breaking Changes，例如移除 Quick Idea、旧会话预设和部分推荐功能。

版本成熟度仍有三个明显问题：

1. 产品仍是 `0.1`/beta 语义，功能频繁重构。
2. GitHub Desktop Release v0.1.68 至 v0.1.77 的正文多为“No changes”，无法从发布页追踪真实变化。
3. 文档 Release Notes 截止 beta.71，落后于 Desktop v0.1.77。

综合判断：**维护活跃，但版本治理和变更可追溯性尚未达到成熟企业软件水平。**

### 生态与反馈

- **公开仓库**：Desktop、官网、文档、发布自动化、Docker Compose Builder、CLI、Hagicode.Libs、Skills 工具和多个生态站点。
- **社区入口**：GitHub Issues、Discord、QQ 群、支持邮箱、YouTube/Bilibili 演示。
- **集成生态**：Claude Code、Codex、GitHub Copilot、OpenCode、Gemini、Kimi、Kiro、QoderCLI 等 Agent CLI；OpenSpec、OmniRoute、GitHub 和 Code Server。
- **公开反馈边界**：官网仓库当前没有开放 Issue 结果，Desktop 也没有开放 Issue；GitHub 直接 Release 下载量较低，且不包含官网镜像和 Microsoft Store，因此不能用于推导总采用率。

## 技术架构调研

### 系统全貌与运行形态

HagiCode Desktop 的运行模型可概括为：

| 组件 | 运行位置 | 主要职责 |
| --- | --- | --- |
| Electron Desktop | Windows/macOS 工作机 | 安装向导、版本管理、Server 启停、依赖管理、状态与托盘界面 |
| HagiCode Server | 工作机本地 .NET 进程 | 工作区 API、会话、提案、Agent CLI 管理、Git/项目操作、业务逻辑 |
| Web 前端 | Electron 窗口或本地浏览器 | 会话、Session Board、Vault、设置、指标和项目界面 |
| SQLite | 工作机本地 | 默认业务数据与配置持久化 |
| Node 22 工具链 | Desktop 隔离目录 | 安装和运行 npm 交付的 Agent CLI、OpenSpec 等工具 |
| Agent CLI | 工作机子进程 | 读取项目、调用模型、执行工具和修改代码 |
| 外部模型服务 | 网络远端或用户配置的本地端点 | 模型推理；可由 CLI 默认通道或 OmniRoute 路由 |
| 版本/生态服务 | 官方站点、镜像、GitHub、Store | 安装包、版本索引、文档、可选 Skills/预设内容 |

Desktop 不是仅显示远端 SaaS 的壳。它明确负责下载和管理本地 Server、准备运行时、启动本地服务和显示本机状态；默认数据位于 SQLite。容器版也把 HagiCode 应用、CLI 基线和本地持久化卷部署在用户控制的机器上。

### 主体功能运行位置判定

**判定：符合。** 以下核心能力位于 PC：

- 项目目录和 Git 工作树。
- HagiCode Server 与工作区 API。
- SQLite 数据库、会话和提案状态。
- Node 22 隔离工具链与已安装 Agent CLI。
- Agent CLI 进程、工具调用和本地文件修改。
- Desktop/Electron UI 与本地 45000 端口界面。

远端依赖包括：

- Claude、OpenAI、Google、智谱等模型或订阅服务。
- OmniRoute 等可选模型路由。
- GitHub、下载镜像、Microsoft Store、版本索引和生态内容。

这些远端服务不会替代本地工作区和数据库，但模型推理是否远端取决于用户选择。没有可用模型服务时，HagiCode 仍可启动并查看本地数据，但大部分 AI 生成和执行能力不可用。因此它是**本地控制平面 + 可替换模型服务**，而不是完全离线 AI。

### 核心技术链路

#### Desktop 启动链路

1. Electron Desktop 启动并定位当前 HagiCode Server 版本。
2. Desktop 检查或准备内嵌 .NET 运行时、Node 22 工具链和必要组件。
3. Desktop 启动本地 HagiCode Server，默认端口为 45000。
4. Server 初始化或打开本地 SQLite 数据路径。
5. Desktop 窗口加载本地 Web 工作区，并持续显示 Server 健康、端口与版本状态。

#### Agent 执行链路

1. 用户在 Conversation 或 Proposal Session 中选择项目、Agent CLI、模型和模式。
2. Server 读取本地项目上下文，构造会话或 OpenSpec 任务。
3. Server 在 Desktop 管理的环境中拉起对应 Agent CLI 子进程。
4. CLI 读取项目并向所配置模型端点发送推理请求。
5. CLI 的流式消息、工具调用和执行结果回传给 Server；近期文档表明前端通过 SignalR 获得实时更新。
6. 只读模式只用于分析；切换编辑模式或进入提案执行阶段后，Agent 才修改本地文件并可生成 Git 提交。
7. 会话、提案、指标和知识状态写入本地持久化。

#### 容器链路

1. Docker Compose 启动 HagiCode 镜像。
2. EntryPoint 准备运行用户、Node/CLI 基线和数据目录。
3. 容器直接用 `dotnet` 启动 HagiCode 应用程序集，当前发布说明将其描述为单应用进程启动模型。
4. `/app/data` 与 `/app/saves` 通过卷持久化，默认保存路径中的应用状态由 SQLite 管理。
5. 用户从工作机浏览器访问 `http://localhost:45000`。

### 主要依赖

#### Desktop 默认路径

- Windows 10/11 64 位，或 macOS 10.15+。
- 约 4 GB 内存，推荐 8 GB；约 2 GB 可用磁盘空间。
- Desktop 内嵌所需 .NET 运行时，不要求用户先安装独立 .NET。
- Desktop 管理固定 Node 22 工具链，不接管系统全局 Node/npm。
- Git、OpenSpec 和至少一个 Agent CLI；向导负责检测，部分组件可由 UI 安装。
- 模型账号、API Token 或可用的模型路由。
- 首次安装、版本检查、组件下载和远端模型调用所需网络。

#### 容器路径

- Windows/macOS 上的 Docker Desktop 与 Docker Compose。
- HagiCode 镜像、持久化卷和本地端口。
- 默认镜像内置 Claude、OpenCode、Codex 三类主要 CLI 基线；其他 CLI 走 UI 管理的安装路径。
- 模型 API Token；官方生成器支持 Anthropic、智谱和自定义 API 等配置。

### 接口形态

- **Electron GUI**：桌面安装、Server 管理、版本切换、诊断和日常使用入口。
- **本地 Web UI/PWA**：默认从 45000 端口访问，容器版直接使用浏览器。
- **本地 HTTP API**：前端与 HagiCode Server 的业务接口；Release Notes 提及 Git 批量操作等 HTTP 端点。
- **SignalR**：会话流式输出、工具调用和系统健康状态的推送通道。
- **Agent CLI 子进程**：Server 调用 Claude Code、Codex、OpenCode 等 CLI。
- **Git/文件接口**：直接访问本地项目、仓库和工作目录。
- **外部 HTTPS API**：模型服务、GitHub、版本索引、Skills/预设和可选路由服务。

本次不枚举端点或命令注册项，因为它们不会改变整体架构结论。

### 持久化方式

| 数据 | 默认位置/介质 | 说明 |
| --- | --- | --- |
| HagiCode 业务状态 | 本地 SQLite | Desktop 和容器默认路径 |
| 项目代码 | 用户选择的本地目录 | Git 工作树由用户拥有 |
| 会话与提案 | 本地 Server 数据与项目相关文件 | 用于历史、恢复、归档和复查 |
| Vault/Skills/规格 | 本地文件或 HagiCode 管理目录 | 具体位置随功能和配置而异 |
| Desktop Node 工具链 | 应用内不可变工具链目录 | 固定 Node 22 基线 |
| npm 管理包 | Electron userData 下按 Node 主版本隔离的 npmGlobal | 不污染系统全局 Node/npm |
| 容器数据 | `/app/data` 与 `/app/saves` 卷 | 两个持久化根均需备份 |
| 模型数据 | 外部提供方按其政策处理 | 不属于 HagiCode 本地 SQLite 范围 |

### 通信方式

- Electron/Web 前端 ↔ 本地 Server：HTTP + SignalR。
- Server ↔ Agent CLI：本机进程调用和流式标准输入输出或 CLI 自身协议。
- Agent CLI ↔ 模型：由所选 CLI 或 OmniRoute 通过网络访问模型端点。
- Server ↔ Git/项目：本地文件系统与 Git 命令。
- Desktop ↔ 版本服务：HTTPS 获取版本索引、安装包和组件。
- 容器外部访问：工作机浏览器连接映射的本地 45000 端口。

### Server 公开契约与实际职责复核

`HagiCode-org/cli` 提交了由后端 OpenAPI 生成的 TypeScript 客户端。当前快照包含 38 个 Service 类、184 个 HTTP 操作和 441 个模型文件；生成配置指向本机 Server 的 `/swagger/v1/swagger.json`。这批代码证明 Server 承担产品的主要业务逻辑，而不只是 Desktop 的启动器或 SQLite 包装层。

| 领域 | 公开契约反映的 Server 职责 | 代表性能力 |
| --- | --- | --- |
| 会话与 Agent 编排 | 管理 Chat、Proposal、AutoTask 及其异步执行 | 创建/查询会话、消息队列、取消、处理状态、会话工作区和并发限制 |
| OpenSpec 生命周期 | 驱动提案从需求到执行和归档 | 优化、生成、批注、启动/执行/归档校验、执行、归档、完成、读取 OpenSpec 文件 |
| 项目与多仓库 | 管理本地项目、MonoSpecs 和设计资产 | 项目增删改、路径验证、Git 仓库扫描、分支校验、MonoSpecs 初始化、Design.md |
| Git 操作 | 直接操作项目工作树和远端 | status、diff、branch、stage、commit、pull、push、rebase |
| Agent 配置与运行时 | 管理 Agent CLI 的角色、模板和运行状态 | Hero、职业、Chat Profile、Agent Template、CLI 健康、安装向导和组件检测 |
| 本地数据与知识 | 管理本地持久化和知识资产 | SQLite 状态、会话数据、图片、Vault、文件预览、配置迁移和归档清理 |
| Skills 与生态 | 管理技能来源、安装和推荐 | 本地 Skill、Gallery、可信 Provider、推荐生成、安装进度流和市场内容 |
| 状态与反馈 | 聚合实时状态和长期指标 | SignalR 模型、通知、报表、Token 吞吐、Hagipower 和版本信息 |

会话状态枚举至少公开了 `Init`、`Drafting`、`Optimizing`、`Openspecing`、`Reviewing`、`Executing`、`ExecutionCompleted`、`Archiving`、`Archived` 和 `Completed`。但枚举只说明可能状态，不说明允许的转换、失败补偿、幂等规则或崩溃恢复方式。

这份契约存在明确版本限制：公开生成 API 目录最近一次提交更新为 2026-04-19，早于 Server `0.1.0-beta.72` 和 Desktop v0.1.77。公开仓库中也没有原始 `swagger.json`，因此只能把它视为可审计的历史外部契约快照，不能视为当前 Server 的完整 SPEC。

### 开源与许可边界

公开证据显示：

- `HagiCode-org/desktop`：Electron Desktop，AGPL-3.0。
- `HagiCode-org/site`：官网，AGPL-3.0。
- `HagiCode-org/cli`：源码公开，`package.json` 声明 AGPL-3.0-or-later；仓库当前未提交独立 LICENSE 文件。
- `Hagicode.Libs`：轻量 .NET CLI 集成与适配库，MIT。
- `releases`、`docs`、Docker Compose Builder 等仓库公开，但许可不完全一致。
- `releases` README 明确表示发布流程消费 `repos/hagicode-core` 和 `repos/hagicode-desktop` 的产物；公开组织仓库列表中未发现 `hagicode-core`。
- GitHub 仓库名搜索未发现公开的 `hagicode-core` 或 HagiCode Server 实现仓库，但不能据此排除其他名称、其他托管位置或未来公开的可能性。
- EULA 单独覆盖 Desktop 所管理的 HagiCode Server，并授予可撤销、非独占、不可转让、不可再许可的有限使用权；当前正文没有明确写出“禁止反向工程”，但也没有授予 Server 源码、修改或商业再分发权。
- 独立 Server 的跨平台 ZIP 二进制公开下载；公开二进制、公开 API DTO 和公开客户端均不构成核心实现源码开源。

结论：**可以审查和修改 Desktop 壳及部分生态组件，但 HagiCode Server 实现源码当前未公开，无法仅凭官方公开仓库审查或自行构建完整核心。** 这是当前证据能够支持的准确边界；不应进一步断言其永久闭源。对私有化、长期维护和供应链可控性有硬要求时，仍需官方书面确认。

### 从公开 SPEC 复刻的可行性

这里需要区分“复刻产品能力”“兼容公开 API”和“成为原客户端的 1:1 替代 Server”三个目标：

| 目标 | 可行性 | 判断 |
| --- | --- | --- |
| 同类产品或核心 MVP | 高 | OpenSpec、Git、SQLite、HTTP/SignalR 和公开的 Agent CLI 均有成熟实现；MIT 的 Hagicode.Libs 已公开多种 CLI 的事件解析、会话恢复和 ACP 会话池能力 |
| 固定版本的 API 兼容子集 | 中 | 生成客户端可还原 URL、HTTP 方法、参数、DTO 和部分错误响应，适合先支持 CLI 或自有前端需要的接口 |
| 1:1 可替换完整 Server | 低 | 当前公开材料缺少业务状态机、实时事件语义、数据库迁移、并发恢复、Prompt 组装和版本兼容规则，且 API 快照落后于当前发布版本 |

公开产品文档和 OpenSpec 使用说明属于用户工作流文档，不是 HagiCode Server 自身的实现规格。公开仓库中未发现 Server 自身的 OpenSpec 变更集、原始 Swagger、数据库设计或完整架构决策记录。仅从生成客户端可以搭出类型正确的接口桩，但无法保证行为兼容。

决定兼容度的主要缺口包括：

- Proposal 状态机的合法转换、失败补偿、重试和幂等语义。
- SQLite 表结构、迁移顺序、事务边界、分库策略和升级兼容。
- SignalR Hub、事件名称、载荷、顺序保证、断线重连和前端状态收敛规则。
- Agent CLI 子进程的启动、流式解析、取消、超时、会话恢复、并发调度和崩溃恢复。
- Prompt、上下文裁剪、Hero/Profile 配置合并和不同 CLI 的行为适配。
- API 的认证、授权、错误码、边界校验、副作用和跨版本兼容策略。

可行的 clean-room 路线是：

1. 固定一个 Server/Desktop 目标版本，避免追逐快速变化的主线。
2. 从目标版本运行实例导出原始 Swagger，并记录 SignalR 与 CLI 子进程的公开输入输出，不读取内部实现。
3. 为每个目标工作流建立黑盒契约测试，记录状态转换、错误、事件顺序和文件系统副作用。
4. 优先实现 `Project → Session → Agent CLI → OpenSpec → Git → SQLite` 主链，再补 Vault、Skills、报表和游戏化能力。
5. 让原 CLI 或独立测试套件同时运行在原 Server 与新实现上，以差分结果定义兼容完成度。

许可上应保持实现团队与可能接触非公开实现信息的人员隔离，并对商业发布单独做法律复核。复用或修改 AGPL 的 Desktop/CLI 需要履行相应源码开放义务；MIT 的 Hagicode.Libs 更适合作为新实现的底层 Agent CLI 适配层。

### 隐私与安全边界

#### 本地优势

- 默认项目、SQLite、会话和工作流状态位于本机。
- Desktop 使用隔离 Node 工具链，不修改系统全局 Node/npm。
- Conversation Session 默认只读，用户需要显式切换编辑模式。
- 容器可使用本地卷，便于备份和控制数据目录。

#### 必须澄清的外部数据流

- Agent CLI 通常会把提示词、代码片段或检索上下文发送给模型提供方。
- OmniRoute、GitHub、语音输入和其他集成可能引入额外网络路径。
- 隐私政策明确允许 Microsoft Azure、Alibaba Cloud 和第三方 AI/基础设施处理相关数据，并可能发生跨区域传输。
- 因此“代码绝不上传”只有在用户选择完全本地模型、禁用外部集成且经过实际网络验证时才可能成立。

#### 执行风险

- 编辑模式与 Proposal 执行会让 Agent CLI 修改文件、运行命令和操作 Git。
- 内嵌 Code Server、远程输入和本地服务端口增加了访问面，应确认绑定地址、访问令牌和防火墙规则。
- 最新 v0.1.77 手动安装包未签名；绕过 macOS quarantine 会降低平台的默认下载保护，应只对校验过来源和 Hash 的产物操作。

## 部署形态

### Desktop 模式

- 面向个人开发者和普通工作机。
- Electron 负责安装、运行时、Server、版本和诊断。
- 本机 SQLite，无需独立数据库。
- 基础能力免费，默认最多 3 个并发提案。

### Microsoft Store 模式

- 当前 Windows 主公共渠道，Steam 主应用入口已退出。
- Store 管理安装和更新，部分运行时/数据路径选项按 MSIX 规则锁定。
- 首次启动仍可能下载或准备本地组件。
- 可购买一次性 TurboEngine DLC，解锁 32 个并发提案与部分定制能力。

### Docker Compose 模式

- 适合本地试用、测试、服务器/NAS 或团队部署。
- 在 Windows/macOS 工作机上需要 Docker Desktop。
- 默认 SQLite，无需额外数据库服务。
- 浏览器访问 `localhost:45000`，持久化依赖数据卷。
- 它仍可运行在工作 PC，但部署和权限复杂度高于 Desktop。

## 工作机安装（Windows / macOS）

### Windows

**判定：官方支持，符合工作机安装要求。**

推荐安装：

1. Windows 10/11 64 位打开 Microsoft Store。
2. 安装 HagiCode，首次启动时保持网络可用。
3. 等待应用准备本地 Server、运行时和工具链。
4. 在向导中完成 Git/OpenSpec/Agent CLI 检测与项目绑定。

手动安装：

- 官方也提供 `.exe` 安装器和 `.msix`。
- v0.1.77 的手动产物全部标记 `unsigned`；若组织策略要求代码签名，应使用 Store 或固定到经过验证的签名版本，而不是关闭安全策略。

权限与网络：

- Store 安装通常由 Windows 应用管理；手动安装故障排查文档建议尝试“以管理员身份运行”。
- 需要本地目录、SQLite、项目文件和工具链写权限。
- 需要允许本地 Server 端口 45000；是否允许局域网访问应由用户明确配置。
- 首次下载、更新和远端模型调用需要网络。

卸载：

1. 先停止 HagiCode Server 并退出 Desktop。
2. 通过 Windows 设置或 Microsoft Store 卸载应用。
3. 卸载应用不会自动等于删除本地项目、SQLite、会话、Node 包和 Vault 数据；官方没有给出完整数据清理表，删除前应从应用诊断中确认 userData 与数据路径并备份。

### macOS

**判定：官方支持，但当前签名交付不成熟。**

安装：

- macOS 10.15+。
- Apple Silicon 使用 arm64 DMG，Intel 使用 x64 DMG。
- 打开 DMG，将 Hagicode 安装到 `/Applications`，再完成首次初始化。

签名与权限：

- v0.1.77 最新 DMG 文件名明确为 `unsigned`。
- 官方建议 Gatekeeper 报错时运行：

```bash
sudo xattr -dr com.apple.quarantine /Applications/Hagicode.app
```

- 该命令需要管理员权限并移除下载隔离属性。执行前必须确认安装包来自官方 Release/镜像并完成校验；当前文档未给出 notarization 或 Hash 验证流程。

运行依赖：

- Desktop 内嵌 .NET 与 Node 22 工具链。
- 本地 Server 使用 45000 端口和 SQLite。
- Git、OpenSpec、Agent CLI 与模型凭据按向导准备。
- 首次组件下载、更新和模型调用需要网络。

卸载：

1. 停止 Server、退出 Desktop。
2. 删除 `/Applications/Hagicode.app`。
3. 项目、SQLite、会话和 Electron userData 可能继续保留；官方未给出完整 macOS 数据目录清单，应先备份并从应用诊断确认实际路径，再决定是否清理。

## 云端网关与外部服务

HagiCode 没有把核心工作区托管到自有 SaaS，云端不是产品主体。需要简要记录的远端服务包括：

- 模型提供方：实际推理和计费。
- OmniRoute：可选统一模型路由与目录。
- GitHub：仓库、Release 和集成。
- Microsoft Store、官方镜像和 Index：安装与更新。
- 可选语音、Skills、预设和生态内容服务。

本报告不展开这些服务的后端架构、高可用、SLA 或扩缩容。

## 未决项与证据边界

1. **HagiCode Server 源码**：公开组织中未发现核心仓库，但不能排除存在其他公开位置；需要官方明确回答核心 Server 是否开放源码、采用何种许可证以及是否允许自行构建。
2. **当前 API 契约**：公开生成 API 目录最近一次提交更新为 2026-04-19；需要从固定目标版本导出原始 Swagger，并采集 SignalR Hub 与事件契约。
3. **实现规格**：未发现 Server 自身的 OpenSpec、数据库迁移或架构决策记录；公开 DTO 无法说明状态转换、并发恢复和副作用。
4. **安装包签名**：v0.1.77 手动产物均为 unsigned；需要确认这是临时发布异常还是后续长期策略。
5. **macOS 公证**：未发现 Apple notarization 证据，官方当前使用移除 quarantine 的绕过方案。
6. **离线能力**：未实测断网后可使用哪些界面、会话和本地模型能力；外部 Agent CLI/模型通常不能离线工作。
7. **端口安全**：未运行验证 45000 的默认绑定地址、认证方式和局域网暴露行为。
8. **数据路径与卸载**：文档只说明 SQLite、本地卷和 Electron userData 结构，未提供完整的 Windows/macOS 数据删除清单。
9. **并发可靠性**：免费 3、TurboEngine 32 是产品限制，不等同于已验证的稳定并发能力。
10. **用户反馈**：公开 Issue 和直接下载样本过少，无法判断真实采用规模和长期稳定性。

## 后续验证建议

如果 HagiCode 将进入候选验证或兼容实现评估，建议做六项小范围实测：

1. **Windows Store 安装**：验证普通用户安装、首次组件准备、45000 绑定、项目导入和完整卸载残留。
2. **macOS 签名验证**：检查 DMG Hash、代码签名、Gatekeeper 行为，避免直接把 `xattr` 绕过作为标准企业安装步骤。
3. **网络边界**：分别执行只读会话、编辑会话和 Proposal，记录代码/提示词实际发送到哪些模型或路由端点。
4. **契约冻结**：固定一个 Server/Desktop 版本，导出 Swagger，记录 SignalR 事件和 CLI 子进程输入输出，形成可回放的契约测试。
5. **最小兼容原型**：只实现 Project、Session、消息、单一 Agent CLI、OpenSpec、Git 和 SQLite 主链，验证公开 CLI 能否无修改运行。
6. **核心可维护性**：向官方确认 HagiCode Server 源码、许可证、离线升级包、固定版本支持政策以及兼容实现的许可边界。

## 主要证据锚点

- [HagiCode 官网](https://hagicode.com/en-US/)
- [产品概览](https://docs.hagicode.com/en-US/product-overview/)
- [Desktop 安装指南](https://docs.hagicode.com/en-US/installation/desktop/)
- [Microsoft Store 安装指南](https://docs.hagicode.com/en-US/installation/windows-store/)
- [Docker Compose 部署指南](https://docs.hagicode.com/en-US/installation/docker-compose/)
- [Desktop Node 环境](https://docs.hagicode.com/en-US/faq/desktop-node-environment/)
- [Conversation Session](https://docs.hagicode.com/en-US/quick-start/conversation-session/)
- [Proposal Session](https://docs.hagicode.com/en-US/quick-start/proposal-session/)
- [Release Notes](https://docs.hagicode.com/en-US/release-notes/)
- [隐私政策](https://docs.hagicode.com/en-US/legal/privacy-policy/)
- [最终用户许可协议](https://docs.hagicode.com/en-US/legal/eula/)
- [Desktop 版本历史](https://index.hagicode.com/desktop/history/)
- [HagiCode Desktop 源码仓库](https://github.com/HagiCode-org/desktop)
- [HagiCode Release 发布仓库](https://github.com/HagiCode-org/releases)
- [HagiCode CLI 源码仓库](https://github.com/HagiCode-org/cli)
- [CLI 生成 API 客户端](https://github.com/HagiCode-org/cli/tree/main/src/generated/api)
- [生成 API 目录最近一次更新提交](https://github.com/HagiCode-org/cli/commit/357e5d21a58b25079386138ceda9747e50265e1d)
- [Hagicode.Libs 源码仓库](https://github.com/HagiCode-org/Hagicode.Libs)
- [HagiCode Server 0.1.0-beta.72 Release](https://github.com/HagiCode-org/releases/releases/tag/0.1.0-beta.72)
- [Desktop v0.1.77 Release](https://github.com/HagiCode-org/desktop/releases/tag/v0.1.77)
