# Refly 技术产品调研

> updated_by: Qoder - Claude
> updated_at: 2026-07-30 23:50:00
> evidence_window: 2026-07-30 调研；GitHub 仓库 refly-ai/refly main 分支快照（最后 push 2026-07-29），最新正式 Release v1.1.0（2026-02-02）；官方文档 docs.refly.ai 当日快照

## 交付结论

1. **Refly 是一个开源的 Agent 技能（Skills）构建平台**：用户在可视化画布或自然语言（Vibe Mode）中把业务 SOP 编排为确定性的工作流/技能，再以 REST API、Webhook（Slack / Lark / Feishu）、CLI 或 Claude Code / Cursor 技能等形式对外交付。产品早期定位是 "AI-native creation engine"（AI 创作引擎），自 v1.1.0（2026-02）起已明确转型为 "the first open-source agent skills builder"。
2. **主体功能运行位置取决于部署路径，需区分判定**：
   - **官方托管路径（refly.ai/workspace）**：纯 Web SaaS，主体功能在云端，按本次调研约束**判定为不符合要求**；
   - **自托管路径（官方 Docker Compose）**：全部 7 个容器（API、Web、Postgres、Redis、Qdrant、MinIO、SearXNG）运行在工作 PC 本地，浏览器访问 `http://localhost:5700`，账号为本地邮箱+密码注册，不依赖官方云端账号体系。主体功能在 PC 本地，**该路径符合要求**。
3. **Windows / macOS 工作机安装可行，但形态是"本地 Web 服务"而非桌面应用**：官方唯一自托管方式为 `git clone` + `docker compose up -d`，Windows / macOS 上通过 Docker Desktop 承载；无原生桌面安装包（无 Electron / dmg / exe），使用入口是浏览器。硬件门槛为 2 核 / 4GB（推荐 8GB）/ 20GB 存储。
4. **不可完全离线**：Refly 自身不带模型，用户必须自行配置模型 Provider（OpenAI、Anthropic 等）API Key，推理请求走外部网络；Resend（邮件）、Fal（图/音/视频生成）为可选外部服务。是否支持接入纯本地模型运行时（如 Ollama）当前证据未确认，列为未决。
5. **维护状态活跃、体量中等偏上**：7469 stars / 722 forks，TypeScript 单仓（pnpm + turbo monorepo），main 分支提交持续至 2026-07-29；正式 Release 停在 v1.1.0（2026-02-02），此后转为 main 持续交付 + `latest` 镜像 tag（推导）。近期修复集中在 API 内存占用、Redis/BullMQ 内存泄漏、Bedrock 模型兼容；存在两个未关闭的安全类 issue（SSRF、可执行 artifact 安全发现），采纳前应关注。
6. **许可证非标准 Apache 2.0**：ReflyAI Open Source License，官方描述为 "Apache 2.0 加附加限制"，商用/多租户场景使用前需人工审阅 LICENSE 条款。

## 调研目标、范围与边界

### 调研目标

理解 Refly 是什么产品、为谁解决什么问题、系统如何构成，并重点回答：能否在 Windows / macOS 工作机上安装运行，主体功能是否位于 PC 本地。

### 核心问题

1. 产品定位、目标用户与核心流程是什么？
2. 系统由哪些组件构成，运行形态如何？
3. Windows / macOS 工作机上如何安装、运行、卸载？依赖与权限是什么？
4. 主体功能运行在 PC 本地还是云端？云端承担什么角色？
5. 维护状态、版本演进与社区反馈如何？

### 覆盖范围

产品调研（定位 / 用户 / 流程 / 边界 / 维护状态 / 版本演进 / 生态反馈）+ 技术架构调研（运行形态 / 依赖 / 接口 / 持久化 / 通信 / 部署）。

### 明确排除

不做源码审计、竞品比较、遥测调研、集成实施与性能 benchmark。云端托管版（refly.ai）仅作运行位置判定，不深入其服务端实现。

## 证据口径

- **官方资料**：GitHub README（main 快照）、docs.refly.ai 自部署指南、v1.1.0 Release Notes；
- **仓库元数据**：GitHub API（stars / forks / 时间戳 / license / topics / 顶层目录 / apps 目录）；
- **社区反馈**：GitHub Issues + PR 混合列表抽样（按创建时间倒序 30 条，2026-02 至 2026-07），仅代表公开快照与样本范围；
- **架构推导**：明确标注；未运行验证的事项列入"未决项"。

## 产品调研

### 产品定位与目标用户

**一句话定位**：开源的 Agent 技能构建平台——把企业 SOP / 业务逻辑用自然语言或可视化画布编译为稳定、原子化、带版本的 Agent 技能，并交付到任意 Agent 运行时（官方口号："Skills are infrastructure, not prompts"）。

**目标用户**：

- **开发者 / Builder**：希望快速把业务逻辑变成可被 Claude Code、Cursor、自研 Agent 调用的可靠工具，而不想手写 LangChain 样板代码或维护 n8n 式脆弱工作流；
- **企业团队**：需要把 Agent 能力作为受治理资产管理——中央技能注册表、版本控制、审计日志、团队工作区。

**解决的问题**（官方叙事）：Agent 生产化的瓶颈不在 LLM，而在缺少标准化、可靠的动作层；"Vibe-coded" 脚本和黑盒工作流不可复用、不可治理。Refly 用精简 DSL + 可介入运行时（intervenable runtime，可暂停 / 审计 / 中途改向）+ 技能注册表填补这一层。

### 核心流程

一条端到端典型流程（自托管用户视角）：

1. Docker Compose 启动 Refly，浏览器打开 `localhost:5700`，邮箱+密码注册本地账号；
2. 在 Settings 中配置模型 Provider（如 OpenAI / Anthropic）与默认 Chat 模型；
3. 新建 Workflow：空白画布拖节点（Web Search → LLM → Output），或 Vibe Mode 用自然语言描述让 Copilot 生成；
4. 点击 Run 测试，实时查看执行日志与节点输出，可单节点独立运行调试，失败可执行中途热修复；
5. 交付：生成 API Key 后经 `POST /api/v1/workflows/{id}/execute` 供外部应用调用；或开启 Webhook Trigger 接入 Lark/Feishu 机器人；或经 CLI（`refly skill publish`）发布为 Claude Code / Cursor 可调用的技能。

### 功能地图与边界

- **构建**：可视化画布、Vibe Mode（自然语言→工作流）、Model-Native DSL、Copilot 引导构建；
- **执行**：有状态运行时、实时执行日志、资源即时预览、单节点运行、执行中热修复、定时调度（含小时级）、多模型路由（随机/加权）；
- **集成（输入）**：官方宣称 3,000+ 原生工具（Stripe / Slack / Salesforce / GitHub 等，见 config/provider-catalog.json）、MCP server 兼容、私有连接器；
- **交付（输出）**：REST API、Webhook（Slack / Lark / Feishu / Teams）、CLI（npm 包 `@powerformer/refly-cli`）、Claude Code / Cursor 技能导出（Cursor 标注 coming soon）、Clawdbot 教程场景；
- **治理**：中央技能注册表（配套仓库 refly-ai/refly-skills）、版本管理、团队工作区、审计日志、积分过期等企业控制项；
- **能力状态区分**：已发布——画布 / Vibe / API / Webhook / CLI / 调度；官方标注开发中——Cursor 原生导出；宣传性表述——"100% reliability" 等需按营销口径看待。

### 维护状态与版本演进

- **活跃度**：仓库创建于 2024-02，main 最后 push 2026-07-29（调研前一日）；2026-07 下旬仍有多个修复 PR 合入（内存、缓存、CI）。判定为**活跃维护**。
- **Release 节奏**：v0.4.x（2025-03）→ v0.10.0（2025-08）→ v1.1.0（2026-02-02）。v1.1.0 后近 6 个月无新正式 Release，但提交持续，推导为转向 main 持续交付 + Docker `latest` tag 发布（未运行验证）。
- **方向性演进**：v1.1.0 是明确的转型节点——从"AI 创作引擎/自由画布"转向"Agent 技能基础设施"：CLI 全面重构（自然语言管理技能）、执行透明化（日志/预览/单节点运行）、企业治理（积分策略、多模型路由）。仓库 topics 亦更新为 agent-skills / skills-builder / vibe-workflow / n8n-alternative。

### 生态与反馈

- **生态入口**：技能注册表仓库 refly-ai/refly-skills（一键运行/导入/fork/发布）、CLI npm 包、API 文档（docs/en/guide/api）、Discord / YouTube / X、DeepWiki。
- **反馈主题**（30 条 issue/PR 抽样，2026-02～2026-07）：
  1. **资源占用与稳定性**：refly-api Node 进程 RSS 增长、Redis/BullMQ 内存泄漏，均已有修复 PR 合入（2026-07-27/29）；
  2. **模型兼容**：AWS Bedrock / Claude 5 的 tool_choice、reasoning block 兼容修复多条；
  3. **安全**：SSRF（misc/scrape weblink 端点，#2280，open）、可执行 artifact 安全发现（#2276，open）——两条安全 issue 截至证据窗口未关闭；
  4. **噪声**：抽样中存在少量加密货币/营销类 spam issue，社区 issue 区治理一般。
- **边界**：以上仅为按创建时间倒序 30 条的样本快照，不代表全部 94 条 open issues 的分布；star 数只描述公开热度，不等同采用率。

## 技术架构调研

### 系统全貌与运行形态

Refly 是**前后端分离的 Web 平台**，官方自托管形态为一组 Docker Compose 容器（7 个），全部运行在同一台宿主机上：

| 容器 | 镜像 | 职责 |
| --- | --- | --- |
| refly_web | reflyai/refly-web:latest | 前端静态站 + 入口（宿主机 5700 → 容器 80），唯一对外端口 |
| refly_api | reflyai/refly-api:latest | 核心后端（工作流引擎、技能运行时、API），容器内 3000 / 5800-5801 |
| refly_db | postgres:16-alpine | 关系型持久化 |
| refly_redis | redis/redis-stack | 缓存 + 队列（BullMQ，据 PR #2285 推导） |
| refly_qdrant | reflyai/qdrant | 向量库（知识检索） |
| refly_minio | minio/minio | 对象存储（文件 / artifact） |
| refly_searxng | searxng/searxng | 内置元搜索引擎（Web Search 节点） |

**系统边界**：浏览器（用户）→ refly_web → refly_api → 本地中间件容器；refly_api 出网访问外部模型 Provider（OpenAI / Anthropic / Bedrock 等）与可选服务（Resend / Fal）。除模型与可选服务外，运行闭环全部在本机。

**无桌面端**：仓库 apps/ 下仅 api 与 web 两个应用，无 Electron / Tauri / 浏览器扩展目录；README 与文档均未提供桌面安装包。

### 主要组件与核心链路

**核心链路 1：构建并运行一个工作流（本地闭环 + 外部推理）**

浏览器画布/Vibe 输入 → refly_web → refly_api（工作流编排、DSL 编译）→ 调用外部模型 Provider API（跨网络边界）→ 中间产物写 MinIO / 向量写 Qdrant / 状态写 Postgres → 队列与异步任务经 Redis（BullMQ，推导）→ 执行日志实时回传浏览器。跨网络边界仅出现在"模型推理与外部工具调用"一处。

**核心链路 2：技能对外交付（系统边界向外）**

外部应用携 API Key → `POST /api/v1/workflows/{id}/execute`（refly_api）→ 返回 execution_id，轮询 `/api/v1/executions/{id}` 取结果；或 Lark/Feishu 事件回调打到 Webhook Trigger URL 触发工作流。注意：Webhook 场景要求 Refly 实例可被外部服务回调，纯 `localhost` 部署需内网穿透或公网部署（推导）。

**关键约束**：可用性依赖外部模型 API 的网络可达与配额；SearXNG 提供开箱即用的搜索但出网抓取存在 SSRF 未修复风险（#2280）。

### 主要依赖

- **运行时硬依赖**：Docker 24.0+、Docker Compose 2.20+（唯一宿主机依赖）；
- **随 Compose 自动拉起**：Postgres 16、Redis Stack、Qdrant、MinIO、SearXNG（用户无需单独安装）；
- **外部必需**：至少一个模型 Provider 的 API Key（用户自备，产品不含模型）；
- **外部可选**：Resend（邮件发送）、Fal（图/音/视频生成）；
- **开发栈**（仅源码构建相关，不影响终端部署）：TypeScript、pnpm workspace、turbo。

### 接口形态

- **Web UI**：浏览器访问 `http://localhost:5700`，主使用界面；
- **REST API**：`/api/v1/*`（workflows execute、executions 查询等），Bearer API Key 鉴权；
- **Webhook**：工作流级触发器 URL，供 Slack / Lark / Feishu 等回调；
- **CLI**：npm 全局包 `@powerformer/refly-cli`（skill install / publish / run，自然语言管理）；
- **技能导出**：导出为 Claude Code / Cursor / MCP 生态可调用的技能（`npx skills add refly-ai/<skill-name>`）。

不穷举具体端点；完整清单见官方 API Reference（docs/en/guide/api）。

### 持久化方式

主要状态全部由本地容器持有：结构化数据（用户、工作流、执行记录）在 Postgres；向量数据在 Qdrant；文件与产物在 MinIO；队列与缓存态在 Redis。自托管场景下数据主权在用户宿主机（Docker volume）；官方托管版数据在 Refly 云端。未逐表盘点 schema（超出范围）。

### 通信方式

- 浏览器 ↔ web/api：HTTP(S)；执行日志"实时"回传，具体为 SSE 还是 WebSocket 未验证（未决，不影响架构结论）；
- api ↔ 中间件：容器内网直连（Postgres/Redis/Qdrant/MinIO/SearXNG 均不映射宿主端口）；
- 异步任务：Redis + BullMQ 队列（据修复 PR #2285 提及 BullMQ 推导）；
- api ↔ 外部模型/工具：HTTPS 出网调用。

### 部署形态

官方支持两条路径：**官方托管云（refly.ai/workspace）**与**Docker Compose 自托管**。源码开发运行（pnpm）仅面向贡献者，不属于终端安装路径。

#### 工作机安装（Windows / macOS）

- **Windows 安装方式与入口**：安装 Docker Desktop for Windows（需 WSL2 后端与虚拟化权限）→ `git clone https://github.com/refly-ai/refly.git` → `cd refly/deploy/docker` → `cp env.example .env` 并按需编辑 → `docker compose up -d` → 浏览器访问 `http://localhost:5700`。官方文档未单独区分 Windows 步骤，命令在 PowerShell/WSL 下通用（推导）。
- **macOS 安装方式与入口**：安装 Docker Desktop for Mac → 其余步骤与上相同。Apple Silicon 下官方镜像（reflyai/refly-api、reflyai/refly-web、reflyai/qdrant）是否提供 arm64 多架构未验证，列为未决（无 arm64 时经 Rosetta 模拟运行，性能受损）。
- **依赖、权限与网络要求**：宿主机仅需 Docker（含管理员权限安装 Docker Desktop）；硬件 2 核 / 4GB（推荐 8GB）/ 20GB+；仅占用宿主机 5700 端口；需出网访问模型 Provider API；本地注册无需连接 Refly 官方云。
- **卸载方式**：`docker compose down -v`（含数据卷）+ 删除克隆目录 + 可选卸载 Docker Desktop。官方未提供专门卸载文档（推导自标准 Compose 操作）。

#### 主体功能运行位置

- **自托管路径**：工作流构建、编译、执行、持久化、搜索全部在 PC 本地容器内完成，仅模型推理调用外部 API——**主体功能在 PC 本地，符合要求**；
- **官方托管路径（refly.ai/workspace）**：浏览器只是入口，全部计算与存储在 Refly 云端——**主体功能在云端，判定为不符合要求**。

#### 云端网关（如存在）

自托管模式下不存在强制的官方云端网关：账号为本地注册，无官方账号/授权回连要求。外部依赖仅为用户自配的第三方模型 API 与可选的 Resend / Fal，属于功能性外部服务而非 Refly 云端网关，按约束不展开。

## 未决项与证据边界

1. **Apple Silicon 兼容性**：reflyai 系列镜像是否发布 arm64 变体未验证，直接影响 M 系列 Mac 的实际体验；
2. **本地模型支持**：能否将 Provider 指向本地推理服务（如 Ollama/OpenAI 兼容端点）实现推理也不出网，官方文档未明确；
3. **实时日志通道**：SSE 或 WebSocket 未验证（不影响部署判定）；
4. **`latest` 镜像与 main 的对应关系**：v1.1.0 后无新 Release，自托管拉到的 `latest` 具体对应哪个提交未验证；
5. **CLI 对自托管实例的完整兼容性**：`@powerformer/refly-cli` 是否支持指向自托管地址未运行验证；
6. **许可证附加限制的具体条款**：官方仅概述"Apache 2.0 + 附加限制"，商用前需人工审阅 LICENSE 原文；
7. **两个未关闭安全 issue**（SSRF #2280、artifact 安全 #2276）的实际影响面未评估。

## 后续验证建议

1. 在目标 Mac（Apple Silicon）与 Windows 工作机上各执行一次完整 Compose 部署，验证镜像架构兼容性、内存占用与 5700 端口访问（**人工验收**）；
2. 尝试将模型 Provider 配置为本地 OpenAI 兼容端点，验证"推理不出网"可行性；
3. 用 CLI 对自托管实例执行 skill install/publish 全流程，验证技能导出到 Claude Code 的实际链路；
4. 商用采纳前由人工审阅 ReflyAI License 附加限制条款，并跟踪 #2280 / #2276 两个安全 issue 的修复进展。
