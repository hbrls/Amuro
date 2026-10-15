# Flowise 技术产品调研

> updated_by: Qoder
> updated_at: 2026-07-31 12:10:00
> evidence_window: 调研日期 2026-07-31；官方 [Sunset 公告](https://flowiseai.com/sunset)（2026-07-27 代码冻结 / 2026-08-10 归档 / 2026-08-31 EOL）；GitHub `FlowiseAI/Flowise` 快照（约 49k Stars，仓库最近推送约 2026-02-18）；官方站点、Getting Started 与 Running in Production 文档快照

## 交付结论

1. **【最高优先级 · 项目已官方停运】Flowise 正在被 wind down（sunset），本调研窗口恰处于停运进行中。** 官方公告时间线：**2026-07-27 宣布并代码冻结**（停止功能开发、不再接受 PR）；**2026-08-10 仓库归档**（转 Public Archive，锁定 issue/PR，npm 包与 Docker 镜像标记为 deprecated）；**2026-08-31 EOL**（核心团队退出 Discord/GitHub）。截至调研日已过代码冻结、临近归档。**任何新增采用决策都应以"官方已不再维护、仅剩社区 fork 自担"为前提。**
2. **Flowise 是一个开源的低代码/可视化 LLM 应用与 AI Agent 构建平台（基于 LangChain 生态）。** 用拖拽画布搭建 Chatflow、Agent、多智能体系统、RAG 与聊天机器人，产品形态是浏览器访问的自托管 Web 应用（默认 `http://localhost:3000`），无 `.dmg` / `.exe` 原生安装包。
3. **它是三者中最"轻"、最贴近本地原生运行的：核心是一个 Node.js 进程。** 通过 `npm install -g flowise` 全局安装后 `npx flowise start` 即可启动，**不强制依赖 Docker**；Docker（Compose / 镜像）为可选路径。这与 Dify / Coze Studio 必须拉起多容器栈有本质差异。
4. **自托管核心版满足"主体功能运行在工作 PC"的要求。** 后端、前端、集成组件都在本机 Node 进程内运行，**默认使用本地 SQLite 文件**作为数据库，无需外置数据库即可完整使用。它不是"浏览器壳 + 云端主体"的纯 SaaS。
5. **存在内生的外部依赖：LLM 模型推理。** 作为编排/应用层平台，Flowise 本体不含推理，需接入外部模型 API（OpenAI 等）或本地模型（如 Ollama）。因此"平台主体在本地"成立，"推理是否也在本地"取决于模型选型，属配置决定的外部调用。
6. **Windows 与 macOS 都是天然支持的一等环境，且是三者中最干净的。** Node.js 跨平台原生运行，`npm install -g flowise` + `npx flowise start` 在 Windows / macOS / Linux 上通用，**无需 WSL、无需 Docker**（Docker 仅为可选）。因此不存在"仅 Linux 可用"问题。
7. **综合判定（技术形态）：若仅看安装与运行形态，Flowise 是三者中对 Windows/Mac 工作机最友好、主体最本地化的方案。但因项目已官方停运，除非采用"锁定版本 + 自维护 fork"策略，否则不建议作为新的长期承载平台。**
8. **许可模式为开放核心（Open Core）：核心 Apache 2.0 + 企业版（EE）。** 仓库源码以 Apache 2.0 提供，可 fork 自建；另有需 `LICENSE_URL` / `FLOWISE_EE_LICENSE_KEY` 的企业功能，以及 Flowise Cloud（SaaS）。停运后 Apache 2.0 代码仍可保留使用与二次开发。
9. **停运前热度很高但增长与维护已终止。** 快照约 49k Stars，社区体量在可视化 LLM 构建工具中处于头部；但代码冻结后不再有功能更新与安全修复，npm/Docker 制品即将标记 deprecated。安全与合规风险随时间累积，需自行接管。

## 调研目标、范围与边界

### 调研目标

理解 Flowise 的产品定位、运行边界与部署形态，并重点回答：

1. Flowise 是桌面应用、Agent Runtime，还是 Web 平台？
2. Windows 与 macOS 工作机如何安装、运行、升级与卸载？
3. 主体功能运行在 PC 本地还是云端？
4. 后端、前端、组件与数据库如何协作？
5. 当前维护状态、许可与生态是否支持工作机部署？

### 核心问题

- 产品定位、目标用户、核心流程与功能边界是什么？
- 安装形态（Node 原生 vs Docker）与依赖是什么？
- 主体与数据是否在本地？外部依赖是什么？
- 维护状态如何（尤其停运公告的影响）？
- 许可模式对私有化落地与后续自维护意味着什么？

### 覆盖范围

- 产品定位、目标用户、核心流程与功能地图。
- 官方站点、Sunset 公告、Getting Started、Running in Production 文档。
- 安装形态（npm/npx、Docker）、Node 版本、默认数据库与运行入口。
- Windows / macOS 工作机安装、运行入口、依赖、升级与卸载。
- 仓库元数据、许可模式与停运时间线。

### 明确排除

- 不进行逐文件源码审计、接口枚举或数据库 schema 盘点。
- 不进行竞品比较、选型排名或性能 benchmark。
- 不调研遥测、监控、指标与运营分析实现。
- 不安装依赖、不执行部署命令、不启动进程或容器。
- Linux 不作为本次工作 PC 的合格路径（仅作为背景说明）。

## 证据口径

- **直接事实**：来自 [官方站点](https://flowiseai.com/)、[Sunset 公告](https://flowiseai.com/sunset)、[Getting Started](https://docs.flowiseai.com/getting-started)、[Running in Production](https://docs.flowiseai.com/configuration/running-in-production) 与 [GitHub 仓库](https://github.com/FlowiseAI/Flowise)。
- **停运时间线**：以官方 Sunset 公告为准，含 2026-07-27 / 08-10 / 08-31 三个里程碑，具决定性权重。
- **架构推导**：用于解释 Node 进程与外部模型/数据库的关系；本次未实际安装、未连接模型、未抓取运行流量。
- **维护快照**：Stars 与推送时间会变动，本报告只代表 2026-07-31 快照。
- **"未验证"边界**：本地化推理、升级、卸载、fork 自维护成本等未实测，统一列为未决。

## 产品调研

### 产品定位与目标用户

**一句话定位**：Flowise 是一个开源、低代码/可视化的 LLM 应用与 AI Agent 构建平台，基于 LangChain 生态，用拖拽画布把工作流、Agent、RAG 与聊天机器人快速搭起来，可自托管或用 Flowise Cloud。

目标用户包括：

- 希望零/低代码、可视化快速搭建 LLM 应用与 Agent 的开发者与业务人员。
- 需要 RAG、多智能体编排并暴露为 API 的团队。
- 希望在本机轻量自托管、掌控数据的个人开发者与小团队。
- （停运后）愿意 fork 自维护、承担后续更新与安全的技术团队。

### 核心流程

以自托管核心版为例：

1. 安装 Node.js（v18.15.0 或 v20+）。
2. `npm install -g flowise` 安装。
3. `npx flowise start` 启动，浏览器访问 `http://localhost:3000`。
4. 在拖拽画布上搭建 Chatflow / Agentflow，接入模型、工具、向量库、文档等节点。
5. 调试运行，发布为可嵌入的聊天窗口或 REST API（含 Chat SDK/嵌入）。

### 功能地图与边界

- **可视化编排**：拖拽节点构建 LLM 链、Agent、多智能体系统与 RAG 管线。
- **模型/工具集成组件**：大量集成节点（LLM、向量库、文档加载器、工具等，基于 LangChain 生态）。
- **RAG**：文档加载、切分、嵌入、向量检索节点化组合。
- **对外能力**：REST API、可嵌入聊天组件、SDK。
- **企业功能（EE）**：需授权密钥的增强能力。

**边界**：Flowise 是编排/应用层平台，本身不提供底层模型推理；核心 Apache 2.0，部分能力属企业版；**项目已进入停运，不再新增功能**。

## 维护状态与版本演进

- **维护状态（决定性）**：**官方已停运**。2026-07-27 代码冻结、2026-08-10 仓库归档（npm 包与 Docker 镜像标记 deprecated）、2026-08-31 EOL。官方给出的理由是：随着编码 Agent（如 Claude Code/OpenClaw）能力增强，刚性的低代码工作流在复杂任务上很快触顶，团队决定收束运营。
- **停运后处置**：源码保留在 GitHub（Public Archive），Apache 2.0 代码可继续使用与二次开发，官方鼓励团队 fork 自维护或走社区 fork。
- **热度快照**：约 49k Stars，停运前处于同类头部；仓库最近推送约 2026-02-18。
- **生态入口**：GitHub、Discord、Flowise Cloud、FlowiseSDK；停运后官方渠道将陆续关闭或移交社区。
- **反馈边界**：Star 数只反映历史热度，停运后不再等同活跃度；后续可用性依赖社区 fork 的活跃程度。

## 技术架构调研

### 系统全貌与运行形态

Flowise 是一个 **Node.js 单体 Web 应用**，采用 PNPM 单仓多模块（monorepo），核心 4 模块：

- **Server**：Node 后端，提供 API 逻辑与流程运行。
- **UI**：React 前端（拖拽画布）。
- **Components**：集成组件（LLM、向量库、工具、加载器等）。
- **Api Documentation**：Swagger API 规范。

运行形态是**单进程 Node 服务**（默认 `:3000`），可选用 Docker 容器化。相比 Dify/Coze 的多容器中间件栈，Flowise 默认无外置依赖。

### 主要组件与核心链路

- **UI（React）**：可视化画布，搭建与调试流程。
- **Server（Node）**：承接请求、执行 Chatflow/Agentflow、暴露 REST API。
- **Components**：以节点形式封装 LLM、向量库、工具、文档加载器等集成。
- **数据库**：默认 **SQLite 本地文件**，可切换 PostgreSQL / MySQL。

一条核心链路（RAG 对话）：浏览器 → Node Server 载入已保存的 flow（存于 SQLite）→ 按节点执行：文档检索（向量库节点）→ 调用外部/本地 **LLM 模型 API** 生成回答 → 结果回传前端。**跨网络边界主要是对模型提供商与外部工具的出站调用**。

### 主要依赖

- **运行时硬依赖**：Node.js v18.15.0 或 v20+；核心版默认无需外置数据库（SQLite）。
- **可选依赖**：Docker（容器化部署）；PostgreSQL/MySQL（规模化时推荐）；对象存储（大规模文件）。
- **关键外部依赖**：LLM 模型提供商（外部 API 或自托管模型）。

### 接口形态

- 浏览器 Web UI（拖拽画布，`:3000`）。
- 对外 REST API（每个已发布 flow）。
- 可嵌入聊天组件与 Chat SDK。
- Swagger API 文档。

### 持久化方式

- 默认 **本地 SQLite 文件**（存于用户目录，默认 `~/.flowise`）保存 flow、凭据、日志等。
- 规模化推荐切换 **PostgreSQL**（或 MySQL）。
- 文件/上传可配置本地或外部存储。
- 默认持久化完全在本机，数据归属本地。

### 通信方式

- 前后端 HTTP（同一 Node 服务）。
- 流程执行为进程内调用（节点在同一 Node 运行时内编排）。
- 出站为对模型 API 与外部工具的 HTTP 调用（新版默认开启 HTTP 安全校验以缓解 SSRF）。
- 默认无消息队列/多服务间网络通信（单进程形态）。

### 部署形态

官方支持：npm 全局安装 + `npx flowise start`（推荐、最轻）、Docker Compose / Docker 镜像、PNPM 源码构建；另有 Flowise Cloud（SaaS，随停运需另行确认存续）。以下聚焦工作机安装。

#### 工作机安装（Windows / macOS）

- **macOS 安装方式与入口**：安装 Node.js（v18.15.0 或 v20+）→ `npm install -g flowise` → `npx flowise start` → 浏览器访问 `http://localhost:3000`。无需 Docker。
- **Windows 安装方式与入口**：与 macOS 相同——安装 Node.js → `npm install -g flowise` → `npx flowise start` → `http://localhost:3000`。**无需 WSL、无需 Docker**（Node 原生跨平台）。
- **依赖、权限与网络要求**：仅需 Node.js/npm；全局安装可能需要对 npm 全局目录的写权限（macOS 可能需 `sudo` 或 nvm 环境）。默认监听 `:3000`。可用性前提是能访问所配置的模型提供商网络。
- **卸载方式**：`npm uninstall -g flowise` 卸载，删除数据目录（默认 `~/.flowise`）即清理数据；Docker 路径用 `docker compose down` / 删除镜像。此项未实测，标注为推导。

> 停运影响：2026-08-10 后 npm 包与 Docker 镜像将标记 deprecated，仍可安装历史版本，但不再有官方更新；长期使用需锁定版本并自行接管安全维护。

#### 主体功能运行位置

- **自托管核心版**：平台主体（编排、流程执行、API、SQLite 数据）运行在 **PC 本地** Node 进程中，符合"主体在 PC"要求，且本地化程度高于 Dify/Coze（默认零外置中间件）。
- **模型推理**：默认走外部模型 API（外部调用），可接入本地模型实现完全本地化。
- **Flowise Cloud**：SaaS，主体在云端，不在自托管路径内（且随停运需确认存续）。

#### 云端网关（如存在）

- 自托管核心版不依赖 Flowise 云端网关即可运行；对外云端调用主要是 **LLM 模型提供商 API** 与外部工具，属能力型外部依赖而非平台网关。按本 RUNBOOK 焦点，仅简单提及，不展开。

## 未决项与证据边界

- 未实际安装与运行，`npx flowise start` / Docker 的实际启动结果、端口占用与权限未经本地验证。
- Windows / macOS 上的实际安装体验（npm 全局权限、Node 版本兼容）与常见故障未实测。
- 停运后 Flowise Cloud 是否继续提供服务、企业版授权后续如何处理，未获明确信息。
- 完全本地化推理（接入本地模型后无外部出站）未做端到端验证。
- 社区 fork 的活跃度与可持续性未评估。
- Stars 与最新版本号为快照近似，随停运不再增长。

## 后续验证建议

1. 若考虑采用，先做"停运前提"决策：明确是否接受"官方不维护、需自维护 fork"，否则优先转向仍在维护的替代平台（如已调研的 Dify 自托管）。
2. 若确定使用，锁定一个可用版本（固定 npm 版本/commit），在归档前拉取源码与镜像并本地留存。
3. 在一台 macOS 与一台 Windows 工作机实测 `npm install -g flowise` + `npx flowise start`，记录 Node 版本兼容与全局权限问题。
4. 验证接入本地模型后是否可完全本地化运行，并评估将 SQLite 切换 PostgreSQL 的生产化成本。
5. 建立自维护方案：安全补丁接管、依赖升级与数据备份策略。
