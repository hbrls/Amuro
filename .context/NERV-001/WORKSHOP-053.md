# OpenWork 技术产品调研

> updated_by: Qoder - Claude Sonnet 4.5
> updated_at: 2026-08-07 16:30:00
> evidence_window: 调研日期 2026-08-07；目标版本 v0.18.17（2026-08-06 发布）；官方主页 openworklabs.com；GitHub 仓库 different-ai/openwork（默认分支 dev，截至 2026-08-07）；官方文档 openworklabs.com/docs

## 交付结论

### OpenWork 是基于 OpenCode 的开源桌面 Agent 工作台，定位为 Claude Cowork 的开源替代，核心运行形态为工作机本地

OpenWork 是 Different AI, Inc. 开发的开源桌面应用，官方定位为「open-source alternative to Claude Cowork」——一个让用户在工作机本地用 AI Agent 操作文件的 GUI 层，底层引擎为 [OpenCode](https://opencode.ai)（[openworklabs.com/llms.txt](https://openworklabs.com/llms.txt)，直接事实）。产品支持 macOS、Windows 和 Linux 三平台，用户自带 LLM Provider 密钥（OpenAI、Anthropic、Google、本地模型等 50+ Provider），文件留在本地，Prompt 直接送往用户选择的 LLM Provider（[openworklabs.com](https://openworklabs.com/)，直接事实）。

对照 Index 调度判定基准：OpenWork 的主体能力运行在工作机本地。桌面模式下，Agent 执行、文件操作和会话管理均在本地完成，不依赖云端。云端组件（OpenWork Cloud / Den）是可选的团队协作和管理层，不承担核心 Agent 执行职责。

### 不具备 Stateful 调度能力：无任务对象模型、无 DAG、无任务状态机、无中心调度器，归类为任务执行宿主

OpenWork 的工作对象模型以 Workspace（文件夹）和 Session（会话）为核心，不存在持久化的 Task、Issue 或 Plan 编排对象（[openworklabs.com/docs](https://openworklabs.com/docs) + [crash course](https://agentfactory.panaversity.org/docs/cowork-crash-course)，直接事实 + 证据边界）。用户在 Workspace 中发起对话（Session），Agent 生成计划（Plan）并逐步执行，但 Plan 是会话内的文本产物，不是持久化的编排对象。Session 之间没有依赖关系、先后顺序或 DAG 结构。

第三方教学资料明确指出：「scheduling is one of the bigger divergences (Cowork has it built in, OpenWork does not)」和「OpenWork does not currently ship a built-in scheduler」（[crash course §15](https://agentfactory.panaversity.org/docs/cowork-crash-course)，直接事实）。OpenWork 的循环工作模式是「calendar reminder + manual re-fire」——用户用日历提醒，手动重新粘贴 Prompt 运行。

对照 Index 调度判定基准——Stateful 调度系统必须「持久拥有工作对象、对象关系、任务状态和执行归属，并负责判断任务何时可执行、按何种顺序推进、由谁执行以及失败后如何继续」——OpenWork 不满足任何一条。按**任务执行宿主**归类，不具备调度能力。

### 工作对象模型：有 Workspace / Session / Skill / Plugin / MCP Connector；无 Issue / Plan / Task 持久对象

可辨识的产品对象（[openworklabs.com/docs](https://openworklabs.com/docs) + [crash course](https://agentfactory.panaversity.org/docs/cowork-crash-course)，直接事实）：

- **Workspace**：工作目录文件夹，创建时设定文件访问范围。三种类型：Local workspace（本地文件夹）、Connect custom remote（连接自托管 openwork-server）、Shared workspaces（OpenWork Cloud 托管 Worker）。
- **Session**：Workspace 内的对话会话，包含 Plan、todos timeline 和权限卡。会话状态存在于 OpenCode 引擎的 SQLite 数据中。
- **Skill**：SKILL.md 文件，AgentSkills 兼容格式，包含 frontmatter（name + description 作为「书脊」）和过程正文。从 Hub、聊天内生成或手动导入。
- **Plugin**：OpenCode npm 包，带事件钩子，扩展底层引擎。非角色捆绑包。
- **MCP Connector**：通过 Model Context Protocol 接入外部工具和服务（Gmail、Calendar、Drive、Slack、Notion、Linear 等）。
- **Organization**（Cloud）：团队容器，包含 Members、Teams、RBAC 角色（Owner / Admin / Member / 自定义角色）。

**不存在持久化对象**：Task、Issue、Plan 均不是独立持久对象。Plan 是 Session 内 Agent 生成的文本产物，不跨会话持久化为编排对象。Task 在会话中以 todos timeline 形式呈现，不构成独立的任务实体（架构推导 + 证据边界）。

### Agent 执行是「用户触发 + 单会话执行」；退出/失败/断线后无跨会话恢复或任务转移机制

Agent 执行由用户在 Workspace 中发送 Prompt 触发，Agent 自主规划步骤并在授权范围内执行（[openworklabs.com/llms.txt](https://openworklabs.com/llms.txt)，直接事实）。Session 内有权限模式（allow once / allow always / deny）和 Plan 模式（Approval-gated planning），但这些是会话内机制，不涉及跨会话的任务恢复或转移。

桌面模式下，如果设备休眠或关闭应用，执行暂停在当前位置（[crash course §2](https://agentfactory.panaversity.org/docs/cowork-crash-course)，直接事实）。Cloud Worker（Shared Workspace）支持远程运行，但工作完成后的结果仍需用户查看。Agent 退出、失败或断线后的恢复机制依赖会话内的 OpenCode 状态，没有中心调度器负责重新排队或转交（架构推导 + 证据边界）。

### 运行形态是工作机本地桌面应用 + 可选云端组件；主体能力在本地，Local 优先适配良好

OpenWork 有三种运行形态（[openworklabs.com/docs/start-here/self-host](https://openworklabs.com/docs/start-here/self-host) + [openworklabs.com](https://openworklabs.com/)，直接事实）：

1. **桌面模式（主体）**：Electron 桌面应用运行在用户工作机，通过 openwork-orchestrator 协调本地 OpenCode 引擎、openwork-server 和可选的 opencode-router。文件操作在本地，Prompt 直接送往用户选择的 LLM Provider。
2. **Cloud Worker（Shared Workspace）**：OpenWork Cloud 托管的远程 OpenWork 运行时，桌面应用通过远程连接打开。当前标记为 Alpha。
3. **自托管 Den**：企业在自有基础设施上部署 Den web + Den controller + 可选 Inference service，通过 Helm chart 安装到 Kubernetes。

主体功能（Agent 执行、文件操作、会话管理）运行在**工作机本地**。云端组件（Den）承担认证、团队管理、Worker 调度和 MCP 连接管理，不承担 Agent 执行。Local 优先适配判断：**良好**——桌面模式不依赖云端，文件留本地，Prompt 直接送往用户选择的 LLM Provider（直接事实）。

### Windows 与 macOS：均支持桌面客户端，三平台原生安装包；Windows 安装包当前未签名

OpenWork 桌面端支持 macOS（arm64 / x64）和 Windows（arm64 / x64），同时支持 Linux（AppImage + tar.gz）（[GitHub Releases v0.18.17](https://github.com/different-ai/openwork/releases/tag/v0.18.17)，直接事实）。

安装方式：
- **macOS**：下载 .dmg 文件，拖拽安装。提供 arm64 和 x64 两个架构。
- **Windows**：下载 .exe 安装包。提供 arm64 和 x64 两个架构。v0.18.17 release notes 注明「Windows installer is temporarily unsigned while production code signing is being finalized」。
- **Linux**：AppImage 或 tar.gz，提供 arm64 和 x64 两个架构。

Windows 下载曾一度收费（v0.11.199，2026-04-02），后在 v0.11.207（2026-04-13）恢复免费公开下载（[Changelog](https://openworklabs.com/docs/changelog)，直接事实）。当前三平台均为免费下载。

### 开源与闭源边界：主体 MIT 开源，/ee 目录 Fair Source License；Den 控制面源码可见

OpenWork 采用双许可模式（[GitHub LICENSE](https://github.com/different-ai/openwork/blob/dev/LICENSE)，直接事实）：

- **主代码库（/ee 目录之外）**：MIT License，完全开源。
- **企业版目录（/ee）**：Fair Source License，源码可见但非完全开源，包含 Den API、Den Web、Helm chart、Docker 打包等企业部署组件。
- **第三方组件**：按原始许可证。

GitHub 仓库统计（[GitHub API](https://api.github.com/repos/different-ai/openwork)，截至 2026-08-07）：21,353 Stars，2,089 Forks，297 Open Issues。主语言 TypeScript（18.2M），其次 JavaScript（5.4M）。默认分支 dev。由 Y Combinator 支持。

### 依赖根源：核心依赖 OpenCode 引擎和 Electron；Den 控制面依赖 MySQL 和 Better Auth

影响安装、运行和部署的依赖（[openworklabs.com/docs/start-here/self-host](https://openworklabs.com/docs/start-here/self-host)，直接事实 + 架构推导）：

- **桌面端**：Electron（桌面框架）、OpenCode（Agent 引擎）、openwork-orchestrator（npm 包，协调本地组件）、Node.js 运行时。
- **Den 控制面**：MySQL 兼容数据库（生产使用 PlanetScale）、Better Auth（认证框架）、Hono（Node.js 后端框架）、Next.js（Web 前端）。
- **可选依赖**：Daytona（沙箱 Provider）、Render（托管服务）、Vercel（Web 托管）、PostHog（分析）、Polar（计费）、Loops（邮件）。
- **LLM Provider**：用户自选，支持 OpenAI、Anthropic、Google、OpenRouter、本地模型等 50+ Provider。

核心 Agent 执行依赖 OpenCode 引擎，不可剥离。Den 控制面的 MySQL 依赖可通过自托管替换为标准 MySQL 或兼容数据库。LLM Provider 完全可替换（直接事实）。

### 架构范式判定：本地 Agent 执行宿主 + 可选云端管理层，无中心调度能力

OpenWork 的架构范式是：以 OpenCode 为执行引擎、以 Electron 桌面应用为 UI 层、以 openwork-orchestrator 为本地协调器、以 Den 为可选云端管理层的分层架构（[thegitreporter.com](https://thegitreporter.com/articles/2026-07-06-daily-openwork-turns-opencode-into-a-shareable-agent-host/) + [openworklabs.com/docs/start-here/self-host](https://openworklabs.com/docs/start-here/self-host)，直接事实 + 架构推导）。

核心组件及职责：

| 组件 | 职责 | 运行位置 |
| --- | --- | --- |
| 桌面应用（Electron/React） | GUI 层，会话管理，文件操作，权限卡 | 用户工作机 |
| openwork-orchestrator | CLI-first 本地协调器，管理 sidecar 进程 | 用户工作机 |
| OpenCode 引擎 | Agent 执行，会话状态，工具调用，Skill/Plugin 加载 | 用户工作机（本地）或 Cloud Worker（远程） |
| openwork-server | Worker 运行时，暴露文件操作和会话 API | 用户工作机（本地）或远程服务器 |
| Den web | Web 应用，登录、Worker 启动、连接管理 | OpenWork Cloud 或自托管 |
| Den controller | 控制面，认证、Worker 调度、组织管理 | OpenWork Cloud 或自托管 |
| Inference service | 可选，OpenWork Models 代理和计量 | OpenWork Cloud 或自托管 |

调度逻辑无法下沉为 Agent 任务节点，因为不存在持久化的任务状态、依赖解析或执行归属。OpenWork 的 Worker 调度（Den controller 负责启动和回收 Cloud Worker）是基础设施层面的容器管理，不是任务层面的调度（架构推导）。

## 调研目标

- 确认 OpenWork 的产品定位、技术架构与运行形态。
- 判定产品是否具备 Stateful 调度能力，还是任务执行宿主或无状态任务消费者。
- 厘清工作对象模型与 Agent 分派、连续性机制。
- 评估运行形态、Local 优先适配、Windows/macOS 落地形态与云端依赖边界。
- 识别依赖根源、开源/闭源边界与改造可行性。

## 产品调研

### 产品定位与目标用户

- **一句话定位**：OpenWork 是基于 OpenCode 的开源桌面 Agent 工作台，让用户在工作机本地用 AI Agent 操作文件，是 Claude Cowork 的开源替代（[openworklabs.com/llms.txt](https://openworklabs.com/llms.txt)，直接事实）。
- **目标用户**：个人知识工作者（律师、会计、营销人员、HR、顾问等）、团队（共享 Agent 设置）、企业（SSO/审计/私有化部署）（[crash course](https://agentfactory.panaversity.org/docs/cowork-crash-course)，直接事实）。
- **开源与许可**：主体 MIT 开源，/ee 目录 Fair Source License。
- **版本状态**：v0.18.17（2026-08-06 发布），仓库创建于 2026-01-14，7 个月内快速增长至 21,353 Stars（[GitHub API](https://api.github.com/repos/different-ai/openwork)，直接事实）。

### 核心流程

1. 用户下载安装桌面应用（macOS / Windows / Linux）。
2. 创建 Workspace，选择本地文件夹并设定访问范围。
3. 配置 LLM Provider（自带 API 密钥或使用 ChatGPT 登录）。
4. 可选：安装 Skills、连接 MCP 服务（Gmail、Calendar、Slack 等）。
5. 在 Workspace 中发送 Prompt，Agent 生成 Plan 并在授权范围内执行。
6. Agent 读取/创建/编辑文件、调用 MCP 工具、操作浏览器，逐步完成任务。
7. 结果以文件形式交付到 Workspace 文件夹。
8. 可选：加入 OpenWork Cloud 组织，共享 Skills/MCP/Provider 配置给团队。

### 功能地图与边界

- **本地文件工作**：读取、创建、编辑、转换文件（PDF、Word、Excel、图片等）。
- **多 LLM Provider**：50+ Provider，自带密钥，按任务切换模型。
- **Skills**：AgentSkills 兼容 SKILL.md 格式，从 Hub 安装、聊天内生成或手动导入。
- **Plugins**：OpenCode npm 包，事件钩子扩展引擎。
- **MCP Connectors**：Gmail、Calendar、Drive、Slack、Notion、Linear、Sentry、Stripe 等托管服务连接。
- **浏览器控制**：内置 OpenWork Browser 扩展，可打开页面、点击、填表、截图。
- **团队共享**：OpenWork Cloud 组织、Skills/MCP/Provider 共享、Marketplace。
- **企业治理**：SSO/SAML、SCIM、桌面策略（限制模型/Provider/扩展/版本）、审计日志、私有化部署。
- **明确不含**：内置调度器、持久化任务对象模型、DAG 依赖关系、任务状态机、跨会话任务恢复、任务转交机制。

### 维护状态与版本演进

- **活跃维护**：v0.18.17 发布于 2026-08-06，更新频率约每周一到两次（[GitHub Releases](https://github.com/different-ai/openwork/releases)，直接事实）。
- **关键版本演进**：
  - 2026-01-14：仓库创建。
  - 2026-03-11~14：Den 雏形，Cloud worker 创建，Google/GitHub 登录。
  - 2026-03-17：Cloud 从 Render VM 迁移到 Daytona Sandbox workers。
  - 2026-04-02：Windows 一度收费（paywall）。
  - 2026-04-07：OpenWork Cloud 正式上线，组织、团队、共享 Skills 和 Workers。
  - 2026-04-13：Windows 恢复免费公开下载。
  - 2026-04-20：微沙箱预览模式，不再需要 Docker 创建隔离 Workspace。
  - 2026-05-21：Cloud 桌面策略、Marketplace、扩展管理、企业身份（SCIM/SSO）。
  - 2026-06-21：GLM 5.2 模型支持、任务分组（In progress / Done / Requires attention）、分屏、语音模式。
  - 2026-08-03：Extensions 改为 Library，Skill 共享开放，多 Google Workspace 连接器。
- **生态入口**：GitHub 仓库、官方文档、Skill Hub、Extension Marketplace、OpenCode 插件生态、MCP 生态。
- **反馈主题**：GitHub 21K+ Stars 反映高关注度；社区教学资料和评测已出现（[crash course](https://agentfactory.panaversity.org/docs/cowork-crash-course)、[Reddit r/LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/comments/1sgnppg/)）。产品仅 7 个月，功能快速演进，部分功能标记为 Alpha（Shared Workspaces）（社区样本，不代表整体）。

## 技术架构调研

### 系统全貌与运行形态

工作机本地桌面应用 + 可选云端管理层，主体开源（[openworklabs.com/docs/start-here/self-host](https://openworklabs.com/docs/start-here/self-host)，直接事实 + 架构推导）：

| 组件 | 职责 | 运行位置 |
| --- | --- | --- |
| 桌面应用（Electron/React） | GUI，会话管理，文件操作，权限 | 用户工作机 |
| openwork-orchestrator | 本地协调器，sidecar 管理 | 用户工作机 |
| OpenCode 引擎 | Agent 执行，会话状态，工具调用 | 本地或远程 Worker |
| openwork-server | Worker 运行时，文件操作 API | 本地或远程 |
| Den web | Web 应用，登录，Worker 启动 | Cloud 或自托管 |
| Den controller | 控制面，认证，Worker 调度 | Cloud 或自托管 |
| Inference service | 可选，模型代理和计量 | Cloud 或自托管 |

- **范式判定**：本地 Agent 执行宿主 + 可选云端管理层。openwork-orchestrator 是 CLI-first 本地协调器，负责下载和缓存 sidecar、在 Docker 或 Apple container boundary 内运行 sidecar、创建短期文件会话（[thegitreporter.com](https://thegitreporter.com/articles/2026-07-06-daily-openwork-turns-opencode-into-a-shareable-agent-host/)，直接事实）。Den controller 是基础设施层面的 Worker 容器管理，不是任务层面的调度器。

### 主要组件与核心链路

**核心链路**：用户在桌面应用中创建 Workspace → openwork-orchestrator 启动 OpenCode 引擎和 openwork-server → 用户发送 Prompt → OpenCode 引擎生成 Plan 并执行（读取文件、调用 MCP 工具、操作浏览器）→ 权限卡拦截写操作 → 结果交付到 Workspace 文件夹。

跨进程/网络边界：桌面应用 ↔ openwork-server（本地 HTTP）；openwork-server ↔ OpenCode 引擎（进程内/SDK）；桌面应用 ↔ Den（HTTPS，Cloud 模式）；Agent ↔ LLM Provider（HTTPS，用户密钥直连）；MCP Connector ↔ 外部服务（OAuth）（架构推导）。

### 主要依赖

- **桌面端**：Electron、OpenCode 引擎、openwork-orchestrator（npm）、Node.js 运行时。
- **Den 控制面**：MySQL 兼容数据库（生产 PlanetScale）、Better Auth、Hono（后端）、Next.js（前端）。
- **不可剥离的硬依赖**：OpenCode 引擎（Agent 执行核心）。
- **可替换依赖**：MySQL（可替换为标准 MySQL 或兼容数据库）、LLM Provider（用户自选）、托管平台（可自托管）。

### 接口形态

- **用户接口**：桌面应用（macOS/Windows/Linux）、Web 应用（Den web，Cloud 模式）。
- **Agent 接口**：OpenCode SDK（会话创建、Prompt 发送、SSE 事件订阅、todos 读取、权限请求）。
- **Worker 接口**：openwork-server HTTP API（文件操作、会话管理）。
- **Cloud API**：`<baseUrl>/api/den/v1/...`（组织、成员、连接器、Marketplace 等 REST API）。
- **MCP 接口**：`<baseUrl>/api/den/mcp/...`（Cloud MCP 服务端）。
- **鉴权**：Better Auth（Den），`OPENWORK_TOKEN` / `OPENWORK_HOST_TOKEN`（Worker 直连），OAuth（LLM Provider 和 MCP 服务）。

### 持久化方式

- **Worker 运行时**：文件系统状态 + OpenCode SQLite 数据，存放在 Workspace 挂载路径下（[openworklabs.com/docs/start-here/self-host](https://openworklabs.com/docs/start-here/self-host)，直接事实）。
- **Den 控制面**：MySQL 兼容数据库，存放组织、成员、角色、连接器、API 密钥、Worker 配置等控制面状态。生产使用 PlanetScale（主库 + 至少两副本，三可用区，自动故障转移和备份）。
- **敏感数据加密**：`DEN_DB_ENCRYPTION_KEY`（至少 32 字符）加密数据库中的敏感列。
- **不涉及任务状态持久化**：不存在持久化的任务对象、依赖关系或执行归属（架构推导 + 证据边界）。

### 通信方式

- **桌面应用 ↔ openwork-server**：本地 HTTP。
- **桌面应用 ↔ Den**：HTTPS，Cloud URL 为 `https://app.openworklabs.com`（托管默认）或自托管 baseUrl。
- **OpenCode 引擎 ↔ LLM Provider**：HTTPS，用户 API 密钥直连。
- **MCP Connector ↔ 外部服务**：OAuth 2.0，Den 管理共享凭证或成员个人凭证。
- **Cloud Worker 心跳**：Worker 向 Den controller 发送心跳（[Changelog v0.11.177](https://openworklabs.com/docs/changelog)，直接事实）。

### 部署形态

#### 工作机安装（Windows / macOS）

- **macOS**：下载 .dmg 文件，拖拽安装。支持 arm64（Apple Silicon）和 x64（Intel）。最新版本 v0.18.17（[GitHub Releases](https://github.com/different-ai/openwork/releases/tag/v0.18.17)，直接事实）。
- **Windows**：下载 .exe 安装包。支持 arm64 和 x64。当前安装包未签名（v0.18.17 release notes：「Windows installer is temporarily unsigned while production code signing is being finalized」）。曾一度收费后恢复免费。
- **依赖、权限与网络**：Node.js 运行时（内嵌于 Electron）、本地文件系统访问权限、浏览器权限（OpenWork Browser）、网络连接（LLM Provider API 和可选 Den Cloud）。
- **卸载**：标准应用卸载流程。

#### 主体功能运行位置

- 主体功能运行在**工作机本地**（Agent 执行、文件操作、会话管理）。
- **Local 优先适配判断**：**良好**——桌面模式不依赖云端，文件留本地，Prompt 直接送往用户选择的 LLM Provider。云端组件是可选的团队协作和管理增强，不承担核心 Agent 执行。自托管 Den 可实现完全私有化。

#### 云端形态

- **职责边界**：认证、组织管理、Worker 调度（基础设施层面）、MCP 连接管理、Marketplace、共享 Provider、SSO/SCIM。
- **核心组件**：Den web（Next.js 前端）、Den controller（Hono 后端 + MySQL）、Inference service（可选）。
- **部署/托管**：OpenWork 官方托管（Render + PlanetScale）或自托管（Helm chart for Kubernetes，GHCR 镜像 `openwork-den-api` / `openwork-den-web` / `openwork-inference`）。
- **数据/权限/网络边界**：Den 控制面状态存 MySQL；Worker 运行时状态存文件系统和 SQLite；敏感列加密；桌面策略可限制模型/Provider/扩展/版本；单组织部署模式（single-org deployment）支持企业完全私有化。
- **故障影响**：Den 不可用时，本地桌面模式不受影响（Cloud 功能除外）；Cloud Worker 故障时本地桌面应用可切换到 Local workspace。

## 未决项与证据边界

- **调度能力未决**：Changelog 提及「Keeps scheduled jobs live in-app」（v0.11.194）和「automations」页面，可能存在基本的定时自动化功能，但公开资料未说明其是否构成持久化任务调度。当前按「不具备 Stateful 调度能力」记录，该结论基于公开文档和第三方教学资料的明确表述（直接事实 + 证据边界）。
- **Den Worker 调度细节未公开**：Den controller 如何调度 Cloud Worker 的具体机制（排队、分配、回收、故障转移）未在公开文档中详细说明。当前按「基础设施层面容器管理」记录（架构推导 + 证据边界）。
- **OpenCode 引擎内部状态管理未深入**：OpenCode 的 SQLite 数据结构和会话恢复机制的细节未在本调研中核验，因不影响调度能力判定结论（证据边界）。
- **企业版 /ee 目录功能未完整核验**：Fair Source License 下的企业版组件功能（审计日志、桌面策略执行细节）未逐一核验，因不影响核心调度判定（证据边界）。
- **快照边界**：调研基于 2026-08-07 的公开资料，产品仅 7 个月，功能快速演进（每周一到两次发布），结论可能随版本变化。

## 后续验证建议

- 若要评估 OpenWork 作为 Agent 工作承载层的调度能力，应实测：automations 功能的具体能力（定时触发 vs 持久化任务调度）、Session 断线后的恢复机制、Cloud Worker 的故障转移行为。
- 就 Local 优先落地，OpenWork 适配良好——桌面模式完全本地运行，自托管 Den 可实现完全私有化。如需完全离线，需确认 OpenCode 引擎是否支持本地模型完全离线运行。
- OpenWork 不具备 Stateful 调度能力，如需调度系统需在外部构建。其 Workspace + Session + Skill + MCP 模型适合作为 Agent 执行终端，而非调度中心。
- 定位明确：OpenWork 是**本地 Agent 执行宿主 + 可选云端管理层**的产品范本（对「本地优先、自带密钥、Skill/MCP 可组合、团队可共享」极具参考价值），不具备调度能力，完整的 Stateful 调度需在外部实现。
