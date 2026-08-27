# Cherry Studio 技术产品调研

> updated_by: Qoder - MiniMax-M3
> updated_at: 2026-08-31
> evidence_window: 2026-08-31 调研日；目标产品 Cherry Studio **v2.0.10**（2026-08-28 发布于 [GitHub Releases](https://github.com/CherryHQ/cherry-studio/releases)），代码快照对应 `CherryHQ/cherry-studio@main` 分支。

## 调研目标

- 识别 Cherry Studio 作为多模型聚合桌面 AI 客户端的整体形态与边界
- 判断 Local 优先选型标准下的适配程度、缺陷与改造边界
- 分别核验 Windows 与 macOS 工作机的安装、运行入口、依赖、权限、网络要求、升级与卸载
- 梳理技术架构与组件关系，覆盖运行形态、依赖、接口、持久化、通信、部署六类
- 评估企业版（私有部署）作为中心服务的形态与社区版的差异
- 明确核心依赖的架构刚需与可剥离性

## 交付结论

### 一句话产品定位

Cherry Studio 是基于 Electron 的桌面 AI 工作台，通过聚合 30+ LLM 服务商、内置 Agent 运行时、本地知识库、MCP 工具生态和 IM 频道派驻，将"多模型对话 + 任务执行 + 工具调用"统一交付在 PC 本地；企业版是同源闭核的私有部署中心服务。

### 主体形态与 Local 优先适配

- **社区版为桌面 AI 工作台**：Electron 41 + React 19 桌面应用，主进程嵌入 SQLite、本地向量库（sqlite-vec）、OpenAI/Anthropic 兼容 HTTP 网关（Elysia）以及 MCP Server；数据全部本地存储，API Key 不出 PC。Local 优先适配成立。
- **LLM 推理不强制本地**：用户可配置 Ollama / LM Studio 实现本地推理，也可接入 OpenAI、Anthropic、DeepSeek 等云端模型；官方"内置模型服务"会经云端中转但不持久化内容。LLM 推理位置由用户配置决定，不是 Local 优先的硬约束。
- **调度能力在桌面内嵌入式存在**：定时任务（持久化 `next runs`）、频道（飞书/Telegram/QQ/微信/Discord/Slack）、心跳、子智能体和工作流均运行于桌面客户端的本地进程，不是独立的中心调度服务。
- **企业版是真正的中心服务**：闭源核心，提供 admin 后台、员工管理、共享知识库、访问控制和数据备份；可独立于客户端私有部署。这是与社区版架构范式不同的产品线。

### Windows 与 macOS 工作机支持

- **Windows**：提供 x64 标准版、ARM64 版、同架构便携版；安装程序自动检测并按需安装 Microsoft Visual C++ 运行库（x64 / ARM64）。从开始菜单启动，UAC 提示需用户确认。架构支持完整。
- **macOS**：提供 Apple Silicon（`.dmg`）与 Intel 两个安装包；拖入 Applications 安装；首次启动若被 Gatekeeper 拦截需在「系统设置 → 隐私与安全性」手动放行。官方未明示 macOS 最低版本，社区安装教程指向 macOS 11 (Big Sur) 或更高（[codersera 教程](https://codersera.com/blog/install-and-run-cherry-studio-on-mac/)，证据边界：第三方文档）。
- **Linux**：x64 与 ARM64 均有 `.deb` / `.rpm` / `AppImage` 三种包格式，但 RUNBOOK 规定 Linux 不能替代工作机平台调研，仅作旁证记录。
- **卸载方式（明确边界）**：官方文档**未提供**专用卸载指南；macOS 标准做法为「退出应用 → 删除 `.app`」，但 SQLite 数据库、Provider 配置（含 API Key）、知识库向量索引等用户数据**不会自动清除**，需手动清理 `~/Library/Application Support/` 下相关目录。Windows 端可走「设置 → 应用 → 卸载」，同样存在数据残留。证据边界：官方未给出官方卸载流程，按 macOS 标准惯例 + 第三方 CSDN 解答推导。

### 核心组件与运行形态

- **主进程（Node 24.11.1+）**：Electron 主进程负责窗口、生命周期、内嵌 HTTP API 网关、SQLite 持久化、定时任务调度、MCP Server 与频道长连接。
- **渲染进程（React 19）**：对话、工作（Agent）、绘画、翻译、知识库、笔记、文件、设置等页面均运行在渲染进程；通过 Electron IPC 调用主进程能力。
- **API 网关（Elysia）**：把已配置模型通过 OpenAI / Anthropic 兼容 HTTP 暴露给本机程序；Agent 运行依赖它；默认监听 `127.0.0.1`，`Bearer Token` 鉴权；不公开到网络。
- **持久化层**：本地 SQLite（`better-sqlite3`）+ `sqlite-vec` 向量扩展 + Drizzle ORM；备份可走本地目录、WebDAV（坚果云/123 盘）、S3 兼容存储、Notion / Obsidian / 思源笔记等第三方。
- **Agent 运行时**：并行集成 Anthropic Claude Agent SDK（v0.3.220）、Pi Coding Agent / pi-ai（v0.80.x）、DeepSeek DSH SDK（v0.1.0-rc.7）；通过 MCP 协议挂载外部工具。
- **生态**：MCP 服务市场（[MCP 与外部工具](https://docs.cherryai.com.cn/advanced-basic/extensions/mcp.md)）、Skill 系统（兼容 GitHub `SKILL.md` 链接）、主题库（[cherrycss.com](https://cherrycss.com)）、第三方主题仓库。

### 维护状态与活跃度

- **维护活跃**：v2.0.0 → v2.0.10 在约一个月内连续发布（最新 v2.0.10 于 2026-08-28，[Release 历史](https://github.com/CherryHQ/cherry-studio/releases)）。
- **生态规模**：GitHub 主仓库 [CherryHQ/cherry-studio](https://github.com/CherryHQ/cherry-studio) 公开快照约 51.3k Star / 4.9k Fork（仅描述公开热度，不等同采用率）。
- **本地化与社区**：18 种界面语言；QQ 群、Telegram、Discord、微信群、小红书、微博、抖音、Bilibili、X 多渠道并行运营。
- **隐私协议**：最近更新于 2026-08-20（[隐私政策](https://docs.cherryai.com.cn/about/privacypolicy.md)），默认收集匿名运行信息与崩溃日志，**不收集 API Key、对话内容、知识库**，可通过「设置 → 数据设置 → 隐私设置」关闭。

### 选型缺陷与改造边界

- **LLM 推理默认强依赖第三方云端**：除非用户主动配置 Ollama / LM Studio，否则对话内容必然离开 PC（虽不经过 Cherry Studio 中转，但属第三方处理范围）。证据：隐私政策第五条 + [README 模型服务商清单](https://github.com/CherryHQ/cherry-studio)。
- **企业版核心闭源**：服务端 admin 后台、调度中心、共享知识库等**未开源**（社区版 README Enterprise Comparison 表中明示 "Partially released to customers"）；私有化改造只能基于社区版进行，企业级 Stateful 调度能力不可直接复用。
- **调度能力是"任务宿主 + 嵌入式调度"，不是中心 Stateful 调度器**：定时任务、频道、心跳都依赖桌面进程运行；客户端关闭则任务停止（除非依赖系统级 cron / IM 平台队列）。这与 Index.md 定义的"Stateful 调度系统"（持久拥有工作对象、对象关系、任务状态和执行归属，进程重启后可恢复）存在明显差距。
- **Electron 资源占用高**：v2.0.10 安装包体积 235–380 MB（[Release 资产](https://github.com/CherryHQ/cherry-studio/releases/tag/v2.0.10)）；better-sqlite3 与 sqlite-vec 等本地原生模块随 Electron 升级需 `electron-rebuild` 重编译。
- **macOS 最低版本未官方明示**：仅由第三方安装教程间接推断为 macOS 11+，证据边界有限。

## 调研目标、范围与边界

### 调研目标

详见本文档「调研目标」与「交付结论」章节。

### 核心问题

- Cherry Studio 是不是 Local 优先的产品？哪些能力强制依赖云端？
- Windows 与 macOS 两个工作机平台的支持完整度如何？
- 主体运行形态是桌面工作台、任务执行宿主，还是 Stateful 调度系统？
- 企业版与社区版的架构差异在哪里，私有化改造的可剥离依赖是什么？

### 覆盖范围

- 产品调研：定位、用户、流程、功能、维护、生态
- 技术架构调研：运行形态、依赖、接口、持久化、通信、部署
- 工作机平台：Windows、macOS（必查）、Linux（仅作旁证）

### 明确排除

- 不做源码审计；不枚举路由、数据库表、端点
- 不做竞品比较、选型矩阵、优劣排名
- 不调研遥测、监控、指标采集、链路追踪、错误上报通道的内部实现
- 不调研企业版 admin 后台的实现细节（闭源部分）

## 产品调研

### 产品定位与目标用户

Cherry Studio 由 [杭州 / 上海公司团队](https://github.com/CherryHQ/cherry-studio)（官方仓库归属 CherryHQ，商业联系邮箱 `bd@cherry-ai.com`）维护，定位"全能 AI 工作站"，目标用户包括开发者、创作者、AI 爱好者和企业团队。社区版定位是**个人 / 小团队统一多模型入口**，企业版定位为**团队级私有化 AI 生产力与治理平台**。

产品宣传包含"开源、免费、且功能强大""数据本地""Windows/macOS/Linux 全平台""300+ 预设助手""AI Agent、AI 对话、AI 绘图、知识库"等关键表述（[官方介绍](https://docs.cherryai.com.cn/cherry-studio/readme.md)）。证据边界：宣传性表述已与 GitHub 51.3k Star、18 种语言、企业版私有部署能力交叉确认。

### 核心流程

用户视角的端到端核心流程为：**安装客户端 → 配置 LLM 服务商与 API Key → 在「对话」中与所选模型多轮对话 / 在「工作」中创建 Agent 触发多步任务 → 在「知识库」中导入资料实现 RAG → 通过 MCP 接入外部工具 / 通过「频道」把 Agent 派驻到 IM → 通过「定时任务」让 Agent 按计划执行 → 数据备份到本地 / WebDAV / S3 / 第三方笔记**。

详见 [官方文档总览](https://docs.cherryai.com.cn/cherry-studio/readme.md) 与 [Agent 工作区](https://docs.cherryai.com.cn/advanced-basic/agent-workspace.md)。

### 功能地图与边界

- **基础对话**：一问多答（多模型同时回复）、自动分组、对话导出（Markdown / Word）、高度自定义参数、300+ 预设助手、Markdown / 公式 / HTML 实时渲染、ECharts 图表。
- **智能体与自动化**：Agent（在工作页面读取文件、运行命令、完成多步任务）、Skill（GitHub `SKILL.md` 兼容的能力包）、MCP（Model Context Protocol 外部工具接入）、Channel（IM 派驻）、Scheduled Task（持久化定时任务）。
- **多服务商管理**：30+ Provider 统一管理（OpenAI、Anthropic、Google Gemini、Azure、DeepSeek、智谱、Mistral、Grok、Perplexity、Groq、OpenRouter、Moonshot、Ollama、LM Studio 等）；多密钥轮询；模型列表自动拉取；自定义服务商支持 OpenAI / Gemini / Anthropic 兼容协议。
- **本地知识库**：PDF / DOCX / PPTX / XLSX / TXT / MD 等多种格式导入；本地文件、网址、站点地图作为数据源；可导出知识库；支持检索测试。
- **AI 绘画、翻译、笔记、文件管理、全局搜索**：作为增值能力存在，不构成产品核心。
- **快捷问答 / 划词助手 / 快捷翻译**：跨应用辅助能力。
- **数据保障**：本地备份、WebDAV 备份、S3 兼容备份、Notion / Obsidian / 思源笔记互通、自动备份间隔可配置（5 分钟 ~ 24 小时）。
- **环境依赖托管**：uv、Bun、fd、ripgrep、RTK、Lark CLI、`gh`、`ntn`、`pi` 等工具由应用统一管理安装，不污染系统环境。
- **API 网关**：内嵌 OpenAI / Anthropic 兼容 HTTP 服务，供本机程序与 Agent 运行时调用。
- **编码搭档（Code CLI）**：托管 Claude Code、OpenAI Codex、Gemini CLI、OpenCode、Qwen Code、Kimi Code、Qoder CLI、GitHub Copilot CLI 的安装、配置与启动。

### 维护状态与版本演进

- **版本号**：v2.0.0（2026 年 7 月底）→ v2.0.10（2026-08-28），跨度约一个月，发布节奏密集。
- **关键技术演进**：V1 → V2 为破坏性数据迁移（数据库结构变更）；V2.0.2 作为唯一指定的 V1→V2 迁移入口（[V1 升级到 V2](https://docs.cherryai.com.cn/cherry-studio/installation/v1-to-v2-migration.md)）。
- **Roadmap 公开**（[README Roadmap](https://github.com/CherryHQ/cherry-studio)）：HarmonyOS Edition（PC）、Android App（Phase 1）、iOS App（Phase 1）、Intel AI PC（Core Ultra）、Notes / Collections / Dynamic Canvas / OCR / TTS、Plugin System、ASR、MCP Marketplace、Deep Research、Selection Assistant。
- **活跃度判断**：基于发布频率、commit 数（v2.0.10 单 release 含 90+ PR）、contributor 数（[v2.0.10 contributors 25 人](https://github.com/CherryHQ/cherry-studio/releases/tag/v2.0.10)）综合判断为活跃维护。证据边界：单 release 数据不代表整体生态健康度。

### 生态与反馈

- **官方生态**：QQ 群（575014769）、Telegram、Discord、微信群、小红书、微博、抖音、Bilibili、X。
- **第三方主题**：[cherrycss.com](https://cherrycss.com) 主题库；社区维护 Aero / PaperMaterial / Claude dynamic-style / Maple Neon 等主题仓库。
- **公开反馈样本**：[Issue #6505](https://github.com/CherryHQ/cherry-studio/issues/6505) 划词助手在 macOS 多机偶发失效（macOS only，固定一台触发）；[Hacker News 讨论](https://news.ycombinator.com/item?id=44739632) 中"Open WebUI 拒绝 MCP、用 MCP→OpenAPI 代理，Cherry Studio 原生支持 MCP"被作为正面差异点提及。证据边界：单个 Issue 与单次讨论不构成普遍反馈。

## 技术架构调研

### 系统全貌与运行形态

社区版是 **Electron 单进程多角色** 桌面应用：

```
┌────────────────────────────────────────────────────────────────────────┐
│                     Cherry Studio 桌面进程（PC 本地）                    │
│  ┌───────────────────────┐  ┌────────────────────────────────────┐   │
│  │  Electron Renderer    │  │  Electron Main（Node 24.11.1+）   │   │
│  │  React 19 + TipTap +  │  │  ┌──────────────┐ ┌──────────────┐│   │
│  │  Radix UI / TanStack  │  │  │ API Gateway  │ │ MCP Server   ││   │
│  │  ECharts / Mermaid    │◄─►│  │ (Elysia)     │ │ (@modelctx/sd││   │
│  │  Shiki / i18next      │  │  └──────────────┘ └──────────────┘│   │
│  └───────────────────────┘  │  ┌──────────────┐ ┌──────────────┐│   │
│                             │  │ SQLite       │ │ Croner       ││   │
│                             │  │ better-sqlite3│ │ job-scheduler││   │
│                             │  │ + sqlite-vec │ │ + scheduled- ││   │
│                             │  │ + Drizzle ORM│ │ tasks        ││   │
│                             │  └──────────────┘ └──────────────┘│   │
│                             │  ┌──────────────┐ ┌──────────────┐│   │
│                             │  │ Channel IM   │ │ Env Mgmt     ││   │
│                             │  │ Telegram/    │ │ uv/Bun/fd/rg ││   │
│                             │  │ 飞书/微信/... │ │ RTK/Lark CLI ││   │
│                             │  └──────────────┘ └──────────────┘│   │
│                             └────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
                                   ▲              ▲
                            LLM Provider   MCP Servers
                          (云端 / 本地 Ollama)   (stdio / SSE)
```

**运行形态已确认**：单一桌面进程承载 UI、本地服务（API 网关 / MCP）、本地数据库（SQLite + 向量）、调度器（croner + 任务调度）、IM 频道长连接。**没有中心服务进程**。

### 主要组件与核心链路

#### 核心链路：用户发起一次 Agent 任务

1. 用户在「工作」页面选择 Agent + 工作目录，发送目标描述。
2. 渲染进程通过 Electron IPC 将请求发到主进程。
3. 主进程调用内嵌 API 网关（Agent 运行依赖此网关，[官方文档说明](https://docs.cherryai.com.cn/advanced-basic/agent-workspace.md)）。
4. Agent 运行时按运行模式选择对应 SDK（Claude Agent SDK / Pi Coding Agent / DeepSeek DSH SDK），由对应 LLM Provider 完成推理。
5. LLM 输出驱动工具调用：本地文件操作、子智能体、工作流、MCP 外部工具、内置工具（搜索 / OCR / 翻译 / 绘画 / 笔记等）。
6. 工具结果回写至 LLM 上下文，循环直至完成；产物写入工作目录。
7. 任务状态、运行记录、调度项持久化到本地 SQLite；通过 Channel 触发时可向 IM 平台回推消息。

证据锚点：[Agent 工作区](https://docs.cherryai.com.cn/advanced-basic/agent-workspace.md)、[权限与后台任务](https://docs.cherryai.com.cn/advanced-basic/agent-workspace/permissions-memory-background.md)、[频道](https://docs.cherryai.com.cn/advanced-basic/automation/channels.md)、[定时任务](https://docs.cherryai.com.cn/advanced-basic/automation/scheduled-heartbeat.md)。

#### 核心链路：定时任务调度

1. 用户在「设置 → 定时任务」创建任务，绑定 Agent、频率（cron 表达式）、接收频道（可选）。
3. Crontab 解析（Croner）+ 任务调度器（`job-scheduler`）计算 `next run` 并写入 SQLite。
4. 触发时由 Agent 运行时复用会话执行，结果写入运行历史。
5. 失败 / 完成通知经频道回推或桌面通知。

证据锚点：`fix(job-scheduler): persist automatic next runs` 与 `feat(scheduled-tasks): show run status on task cards` 等 v2.0.10 PR；[定时任务](https://docs.cherryai.com.cn/advanced-basic/automation/scheduled-heartbeat.md)。

### 主要依赖

#### 架构刚需（不可剥离）

- **Electron 41.8.0**（[package.json](https://github.com/CherryHQ/cherry-studio/blob/main/package.json)）：桌面应用骨架，跨 Windows/macOS/Linux 的统一载体。
- **Node.js 24.11.1 ~ 24.16.0**：主进程运行时；`engines` 字段明示。证据边界：未官方说明最低 Node 版本要求。
- **React 19.2.0**：渲染进程框架。
- **better-sqlite3 12.11.1** + **Drizzle ORM 0.44.5**：本地数据库与持久化。剥离将丢失数据、任务、配置能力。
- **electron-builder 26.15.6**：跨平台安装包构建。

#### 核心能力依赖（难剥离）

- **sqlite-vec**（`@aiany/sqlite-vec`）：向量检索扩展。剥离后知识库 RAG 能力失效，但对话、Agent 等基础能力仍可用。
- **Elysia 1.4.x**：内嵌 HTTP API 网关。Agent 运行依赖（[官方文档](https://docs.cherryai.com.cn/advanced-basic/developer-tools/api-gateway.md)）；若改为外部 HTTP 服务则需重写 Agent 启动链。
- **MCP SDK 1.27.1**：MCP Server 与客户端运行时。可剥离但会失去工具生态。
- **Croner 10.0.1** + **job-scheduler**：定时任务基础设施。
- **p-queue 8.1.0**：任务队列。

#### 上层附加依赖（可剥离）

- **多 LLM Provider SDK**（`@ai-sdk/*`）：用户可选配置，不影响主进程运行。
- **IM Channel SDK**（`grammy` for Telegram、`@larksuiteoapi` for 飞书等）：按平台独立，可剥离不影响核心功能。
- **OCR / 翻译 / 绘画工具链**（`@napi-rs/system-ocr`、`ppu-paddle-ocr`、`tesseract.js`、`@napi-rs/canvas`）：增值能力。
- **OpenTelemetry SDK**：遥测基础设施，按 RUNBOOK 排除项不展开。
- **Notion / Obsidian / 思源笔记 / WebDAV / S3 客户端**：第三方备份与互通。
- **编码搭档（Claude Code / Codex / Gemini CLI 等）**：由「编码搭档」页面托管，可关闭不影响其他功能。

### 接口形态

- **Electron IPC**：主进程 ↔ 渲染进程命令、事件、状态通道。
- **本机 HTTP API 网关**（Elysia）：`/v1/chat/completions`、`/v1/messages` 等 OpenAI / Anthropic 兼容路径；`Authorization: Bearer <API 密钥>`；默认监听 `127.0.0.1`。证据：[API 网关](https://docs.cherryai.com.cn/advanced-basic/developer-tools/api-gateway.md)。
- **MCP Server**：通过 stdio 或 SSE 暴露工具给外部 Agent；也以客户端形式连接外部 MCP Server。
- **IM Webhook / Long Polling**（频道）：飞书（`@larksuiteoapi/node-sdk`）、Telegram（`grammy`）、QQ、微信、Discord、Slack。
- **LLM Provider HTTP**：所有云端 / 本地 LLM 服务商均通过 HTTPS 调用。
- **第三方备份接口**：WebDAV、S3 兼容 API、Notion API、Obsidian 文件系统写入等。

### 持久化方式

- **主数据库**：本地 SQLite（`better-sqlite3`），通过 Drizzle Kit 管理迁移（`migrations/sqlite-drizzle.config.ts`）。证据：[package.json scripts](https://github.com/CherryHQ/cherry-studio/blob/main/package.json)。
- **向量数据库**：sqlite-vec 扩展（按平台 native 模块分发：`@aiany/sqlite-vec-darwin-arm64` 等）。
- **配置存储**：`electron-store` 持久化 Provider / 偏好设置；`API Key` 与 Provider 配置在备份文件内（用户明确承担泄露责任，[数据设置](https://docs.cherryai.com.cn/pre-basic/settings/data-settings.md)）。
- **工作目录文件**：由用户指定本地路径或外置磁盘；Agent 在权限范围内直接读写。
- **知识库源文件**：本地文件、URL 抓取、站点地图；处理后落入 SQLite + sqlite-vec。
- **迁移机制**：V1 → V2 通过「数据迁移向导」单向迁移；V2 内部小版本自动升级。
- **持久化边界**：进程重启后任务 / 配置 / 知识库完整恢复；调度任务的 `next run` 由 SQLite 持久化（`fix(job-scheduler): persist automatic next runs`）。但**调度器本身在桌面进程内**，客户端关闭后定时任务无法执行（除非由 IM 频道事件触发）。

### 通信方式

- **Electron IPC**：同步 / 异步调用，事件总线。
- **本机 HTTP（API 网关）**：长连接 HTTP，本机 `127.0.0.1` 监听。
- **MCP over stdio / SSE**：本地命令管道与远程流式传输。
- **IM 平台**：长连接（Telegram grammy、飞书 WebSocket、Discord Gateway、Slack Socket Mode 等）；频道接收消息后通过 IPC 触发 Agent 执行。
- **LLM 流式响应**：SSE / 流式 HTTP（视 Provider 协议而定）；UI 通过 IPC 流式推送。
- **进程内任务协调**：P-Queue（任务队列）、Emittery（事件）、Croner（定时）。

### 部署形态

#### 工作机安装（Windows / macOS）

##### Windows 安装（[Windows 安装教程](https://docs.cherryai.com.cn/cherry-studio/installation/windows.md)）

- **官方下载入口**：[cherryai.com.cn/download](https://cherryai.com.cn/download/v2)；同步在 [GitHub Releases](https://github.com/CherryHQ/cherry-studio/releases) 与 [GitCode](https://gitcode.com/CherryHQ/cherry-studio) 发布。
- **架构选择**：x64 标准版（Intel/AMD 主流）、ARM64 版（ARM 设备）、同架构便携版（无需安装到系统）。
- **安装流程**：双击 `.exe` → UAC 确认 → 安装向导 → 开始菜单启动。
- **运行库依赖**：安装程序自动检测并按需安装 Microsoft Visual C++ 运行库（x64 / ARM64）；失败时手动从微软官方地址获取。
- **故障排查**：安装包架构与设备不匹配、安全软件拦截时需附带 Windows 版本、架构、安装包名、错误提示提交反馈。
- **权限与网络要求**：仅需标准用户权限（UAC 一次性确认）；网络仅在使用云端 LLM、MCP 远程服务、WebDAV/S3 备份时需要。
- **卸载**：Windows 标准卸载「设置 → 应用 → 卸载」；数据目录（SQLite、向量库、Provider 配置）默认保留在用户目录，需手动清理。证据边界：官方文档**未提供**专用卸载指南。

##### macOS 安装（[macOS 安装教程](https://docs.cherryai.com.cn/cherry-studio/installation/macos.md)）

- **架构选择**：Apple Silicon（ARM64 `.dmg`）与 Intel（`.dmg`）；官网默认显示 Apple 芯片选项。
- **安装流程**：双击 `.dmg` → 拖入「应用程序」文件夹 → 从 Applications 启动。
- **Gatekeeper 处理**：首次启动若被拦截，需到「系统设置 → 隐私与安全性」按提示允许；官方明确建议**不要为来源不明的安装包关闭系统安全保护**。
- **网络与权限**：应用本身无需管理员权限；本地通知、辅助功能（划词助手）、屏幕录制等按需授权；网络同上。
- **macOS 最低版本**：官方文档**未明示**；第三方安装教程指向 macOS 11 (Big Sur) 或更高（[codersera 教程](https://codersera.com/blog/install-and-run-cherry-studio-on-mac/)，证据边界：第三方来源，非官方）。
- **卸载**：Mac 上没有官方卸载器，标准做法为「退出应用 → 删除 `/Applications/Cherry Studio.app`」；用户数据（SQLite 数据库、Provider 配置含 API Key、知识库向量索引、消息记录）保留在 `~/Library/Application Support/CherryStudio/` 等路径（按平台 Electron 默认约定，证据边界：按 macOS 标准惯例推导，官方未明示路径）。

证据锚点：[官方 Windows 安装教程](https://docs.cherryai.com.cn/cherry-studio/installation/windows.md)、[官方 macOS 安装教程](https://docs.cherryai.com.cn/cherry-studio/installation/macos.md)。

##### Linux（仅作旁证）

x64 / ARM64 提供 `.deb` / `.rpm` / `AppImage` 三种包格式（[Release 资产](https://github.com/CherryHQ/cherry-studio/releases/tag/v2.0.10)）。按 RUNBOOK 规定不能替代 Windows / macOS 工作机调研。

#### 主体功能运行位置

- **社区版**：主体功能**全部运行在 PC 本地**——UI、本地服务、SQLite、知识库、定时任务调度、IM 频道长连接、Agent 执行、API 网关均为本地进程；LLM 推理可本地（Ollama / LM Studio）或云端（用户配置的 Provider）。
- **Local 优先适配**：数据本地化（API Key、对话、知识库、配置）、可选本地 LLM、本地备份——三项核心 Local 适配成立。
- **云端依赖**：
  - LLM 推理：默认走用户配置的云端 API（OpenAI / Anthropic / DeepSeek 等），对话内容直接发往对应 Provider（不经 Cherry Studio 中转）。
  - 内置模型服务（CherryAI / CherryIN）：推理走 Cherry Studio 官方云端中转，**不持久化内容**（[隐私政策第四条](https://docs.cherryai.com.cn/about/privacypolicy.md)）。
  - IM 频道：经各 IM 平台官方服务器中转（飞书 / Telegram / 等）。
  - 远程 MCP Server：按服务部署位置，可能涉及第三方云。
- **选型缺陷**：若要求"完全离线运行"，需配置本地 LLM + 关闭所有 IM 频道 + 仅用本地文件知识库 + 关闭内置模型服务 + 关闭匿名使用统计上报——可行但需要严格配置，不属于开箱即用的"完全离线"。

#### 云端形态（如存在）

社区版本身**没有自有云端**——不存在由 Cherry Studio 运营的中心服务、用户云端账户或云端同步。

云端形态仅出现在以下三个场景：

1. **内置模型服务（CherryAI / CherryIN）**：Cherry Studio 官方运营的 LLM 推理中转，仅作"可选内置服务"，不构成用户数据存储或调度中心。
2. **企业版（Cherry Studio Enterprise）**：独立的私有部署产品线，提供：
   - 集中模型管理（统一接入 OpenAI、Anthropic、Gemini 与本地私有模型）
   - 企业级共享知识库
   - 员工账号与基于角色的访问控制
   - 全私有部署（用户内网 / 私有云）
   - 可靠的后端服务与企业级数据备份恢复
   - Admin 后台（集中模型访问、员工管理、共享知识库、访问控制、数据备份）
   - 许可证：**Buyout / Subscription Fee**，核心闭源（"Partially released to customers"）
   - 联系方式：`bd@cherry-ai.com`
3. **第三方云端备份**：WebDAV（坚果云 / 123 盘等）、S3 兼容存储（AWS / 阿里云 OSS 等）由用户配置；凭证仅本地使用（[隐私政策第六条](https://docs.cherryai.com.cn/about/privacypolicy.md)）。

证据锚点：[GitHub README Enterprise Edition 章节](https://github.com/CherryHQ/cherry-studio)、[隐私政策](https://docs.cherryai.com.cn/about/privacypolicy.md)。

## 关键证据链接

- 官网入口：<https://www.cherryai.com.cn/>
- 官方下载：<https://cherryai.com.cn/download>
- 官方文档：<https://docs.cherryai.com.cn/>
- 文档索引（llms.txt）：<https://docs.cherryai.com.cn/llms.txt>
- GitHub 仓库：<https://github.com/CherryHQ/cherry-studio>
- 商业域名：<https://www.cherry-ai.com/>（企业版与商业合作入口）
- package.json（技术栈证据）：<https://github.com/CherryHQ/cherry-studio/blob/main/package.json>
- Release 历史：<https://github.com/CherryHQ/cherry-studio/releases>
- AGPL-3.0 许可：<https://github.com/CherryHQ/cherry-studio/blob/main/LICENSE>

## 未决项与证据边界

- **macOS 最低版本**：官方未明示，仅由第三方安装教程间接推断为 macOS 11+。需运行验证或官方源码 `engines.os` 等字段确认。
- **企业版私有部署具体架构**：admin 后台、调度服务、数据库栈等技术细节因闭源未公开；本文仅基于 README 与官网对比表描述，不深入。
- **官方卸载流程**：macOS 与 Windows 的官方卸载指南均未提供；当前结论按平台惯例 + 第三方资料推导，需运行验证数据残留路径。
- **运行时 CPU / 内存基准**：未做性能 benchmark（按 RUNBOOK 排除项）。
- **IM 频道断线恢复机制**：文档说明心跳与运行历史，但未给出「频道断开 → 重连 → 任务恢复」的完整 SLA；实际表现需运行验证。
- **Cloud 端 LLM Provider 实际调用比例**：无法在不访问生产数据的前提下确认用户实际是否使用本地 / 云端推理的比例。
- **Issue 与 Discussion 抽样边界**：仅抽样近期高赞与高频主题，未穷举所有反馈；不能代表整体满意度。
- **第三方修改版与衍生项目**：cherrystudiocn.app、cherrystudiochina.com 等同源分发渠道未独立核验；GitCode 镜像为官方同步。

## 后续验证建议

- **运行验证**：在 macOS 14+ 与 Windows 11 上分别安装 v2.0.10，记录首次启动时间、内存占用、磁盘占用、SQLite 数据库大小、sqlite-vec 索引构建时间。
- **离线验证**：断网场景下仅配置 Ollama 本地 LLM，验证对话、知识库检索、Agent 工具调用是否仍可用；记录必须联网才能使用的功能边界。
- **升级路径验证**：从 V1.9.13 → V2.0.2 执行一次完整迁移，记录迁移向导耗时、失败回退路径与数据完整性校验结果。
- **企业版私有部署验证**：申请 Demo 或试用许可，记录 admin 后台功能范围、模型接入方式、共享知识库多租户隔离机制、调度能力（与社区版的差异）。
- **卸载残留验证**：在 macOS 与 Windows 上分别执行标准卸载，记录残留路径（`~/Library/Application Support/`、`%APPDATA%` 等），评估手动清理工作量。
- **数据备份恢复验证**：分别测试本地目录、WebDAV（坚果云）、S3 兼容存储三种备份的完整恢复流程，记录 API Key、向量索引、知识库源文件是否完整保留。
- **API 网关安全验证**：在开启网关后扫描本机端口暴露情况、验证 Bearer Token 鉴权有效性、确认关闭网关后端口不可访问。