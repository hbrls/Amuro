# Factory (factory.ai) 技术产品调研

> updated_by: Qoder
> updated_at: 2026-07-31 13:10:00
> evidence_window: 调研日期 2026-07-31；官方网站 factory.ai 与官方文档站 docs.factory.ai 快照（Changelog 最新 v0.183.0，2026-07-29）；官方定价页、企业数据流文档、BYOK 文档；公开融资报道（2026-04 Series C $150M）

## 交付结论

1. **Factory 是"Agent 原生软件开发平台"，核心产品是名为 Droid 的软件工程 Agent，主体执行在用户 PC 本地，判定为符合本轮准入要求。** 企业数据流文档给出一手承诺："agent loop 与 runtime 完全在 Droid 所运行的机器上执行"、"文件读写保持本地"、"不会将代码库上传或索引到远端数据存储，Factory 云端不保存代码的任何静态副本"。离开本机的数据仅是发往所配置模型端点的 LLM 请求（prompt 与上下文）。
2. **Windows 与 macOS 工作机覆盖完整，且是本轮所有已调研产品中最好的。** Factory App（桌面应用，2026-04-08 发布）提供 macOS（Apple Silicon + Intel）与 Windows（x64 + ARM64）四种官方安装包（.dmg / 安装器）；Droid CLI 支持 macOS/Linux（Homebrew）、Windows 与 npm 安装，可在任意终端与 VS Code / Cursor / JetBrains / Zed 等 IDE 内运行。无 Docker/WSL 强制依赖（Changelog 显示对 WSL 路径亦有适配）。
3. **模型独立性是其核心卖点，云端绑定可按需完全解除。** 平台自管模型之外，BYOK 支持自带 OpenAI/Anthropic 官方 Key、AWS Bedrock/Vertex/Azure 企业端点、OpenRouter 等第三方，以及 **Ollama / LM Studio 本地模型**（API Key 保存在本地，不上传 Factory 服务器）。部署形态四档：SaaS / Hybrid（控制面在云、算力在客户侧）/ On-Prem / **Air-Gapped（完全无外部网络，运行时对 Factory 云零依赖）**。云端在默认 SaaS 模式下承担账号、会话同步、编排与可选分析，属辅助角色，按 RUNBOOK 简单提及不展开。
4. **云端执行是可选项而非默认。** "Droid Computers"提供云端持久计算环境用于远程/后台任务（Plus 档以上），且支持 BYOM（把自己的机器接入作为 Droid Computer）；不用则一切在本机。这与"客户端只是壳、工作在云端"的形态相反。
5. **产品线覆盖从单机 Agent 到 SDLC 自动化。** Droid CLI（终端 TUI，diff 审批制）、Factory App（桌面可视化工作区）、Droid Exec（无头模式，CI/脚本）、Missions（多 Agent 编排）、Software Factory（triage/代码评审/QA/发布/事故响应自动化）、AutoWiki、Agent Readiness 评分；扩展机制齐全（AGENTS.md、MCP、Skills、Hooks、Plugins、自定义 subagent）。
6. **维护极其活跃、商业基础扎实。** Changelog 接近每个工作日发版（7 月内 15+ 个版本，最新 v0.183.0 于 2026-07-29）；公司 2023 年创立（旧金山，创始人 Matan Grinberg 与 Eno Reyes），2026-04 完成 Khosla Ventures 领投的 $150M Series C（估值 $1.5B，Sequoia/Blackstone/Insight 跟投），企业客户含 Blackstone、Wipro、Adyen、You.com、Groq、Chainguard。
7. **需要注意的约束**：(a) 闭源商业产品，无社区版；个人订阅 Pro $20 / Plus $100 / Max $200 每月（另有免费额度的 Droid Core 开源权重模型池与预付费 Extra Usage）；(b) 默认云管理模式下会话记录同步至 Factory 云（代码不同步），完全脱离需企业 Hybrid/Air-Gapped 方案；(c) 产品重心是软件工程（SDLC），不是通用桌面自动化——与 GLNT-10"Agent 自主工作"议题的契合点在其 Software Factory 自动化编排与 Droid Exec/Missions 的任务分派模型。
8. **综合判定：符合准入要求，建议列为重点候选**，并且其"信号→分诊→执行→验证→发布→监控"的 Software Factory 运营模型对本议题（Agent 持续获得工作并形成完成闭环）有直接的参考价值。

## 调研目标、范围与边界

### 调研目标

理解 Factory（factory.ai）的产品定位、运行形态与部署形态，重点回答：

1. Factory/Droid 是什么产品，为谁解决什么问题？
2. 主体功能运行在 PC 本地还是云端？
3. Windows / macOS 工作机如何安装与运行，依赖与权限如何？
4. 模型与云端的绑定程度，可否本地化/私有化？

### 核心问题

- 产品定位、目标用户、核心流程与功能边界。
- Droid CLI / Factory App / 云端各自的职责边界。
- 安装方式、平台覆盖、卸载路径（Windows / macOS）。
- 数据流：代码、Prompt、遥测分别去哪里。
- 维护状态、版本节奏与商业可持续性。

### 覆盖范围

- 官方网站与官方文档站（产品、定价、企业部署、数据流、BYOK、Changelog）。
- 公开融资与公司背景报道（仅用于维护状态与可持续性判断）。

### 明确排除

- 不进行源码审计（产品闭源）。
- 不进行竞品比较与选型矩阵。
- 不调研遥测实现细节（其 OTEL 导出机制仅作为数据边界证据提及）。
- 不深入调研 Factory 云端控制面架构（按 RUNBOOK 云端辅助角色简单提及）。
- 不安装、不运行、不注册账号实测；不做性能 benchmark（官方 Benchmark 页仅记录存在，不采信为结论）。
- Linux 不作为工作机合格路径（产品支持 Linux，仅作背景记录）。

## 证据口径

- **直接事实**：docs.factory.ai 的 Factory App Quickstart（四平台安装包链接）、Droid CLI Quickstart、Data Flows & Privacy（数据边界承诺）、BYOK 文档（本地模型配置）、Individual Plans 定价页、Full Changelog（版本节奏）；factory.ai 官网（部署四档、客户名单）；官方新闻页（Desktop App 发布、Series C）。
- **架构推导**：默认 SaaS 模式下"会话记录同步云端"由 Changelog 修复项（forked session 云同步）与跨端会话特性推导，官方未见专页逐条说明；标注为推导。
- **快照边界**：版本号、定价、融资信息为 2026-07-31 快照；企业客户名单来自官网展示，未独立核实使用深度；官方数据边界承诺未经运行验证（未抓包实测）。

## 产品调研

### 产品定位与目标用户

- **一句话定位**：Factory 是把软件交付生命周期（SDLC）改造成"软件工厂"的 Agent 平台——以 Droid 为执行单元，从单次结对编码扩展到分诊、代码生成、验证、发布、文档与监控的持续自动化。
- **目标用户**：个人开发者（CLI/App 订阅）→ 工程团队（Business）→ 大型企业（Enterprise，含金融等高合规行业）。官网客户展示以企业为主。
- **公司背景**：Factory（旧金山），2023 年由 Matan Grinberg 与 Eno Reyes 创立；2025-09 Series B $50M，2026-04 Series C $150M（Khosla 领投，估值 $1.5B）。

### 核心流程（用户视角，以 Droid CLI 为例）

1. 安装 CLI（brew / npm / Windows 安装器），在项目目录运行 `droid`，浏览器完成登录。
2. 让 Droid 分析代码库架构 → 下达一个小改动任务。
3. Droid 读取所需文件、给出计划与精确 diff，**等待人工批准后才落盘**；自主度可调（Off/Low/Medium/High），配合 Spec Mode（先写规格再实施）与 Mission Mode（多 Agent 编排）。
4. 通过 `/review`（代码评审）、`/model`（换模型）、`/skills`、`/mcp` 等斜杠命令扩展工作流；Git 操作对话式完成。
5. 规模化：Droid Exec 进 CI/定时任务，Software Factory 把分诊、评审、QA、事故响应做成持续自动化，Factory App/Web/移动端跨端接续会话。

### 功能地图与边界

- **本机执行面**：Droid CLI（终端 TUI）、Factory App（桌面工作区，直连本地文件系统）、IDE 集成、Droid Exec（无头）。
- **平台面（云）**：账号/组织管理、会话同步、Missions 编排、AutoWiki、Agent Readiness 仪表盘、分析 API、审计日志、内部插件市场。
- **可选云算力**：Droid Computers（托管持久环境）与 BYOM；Cloud Templates 已废弃。
- **安全机制**：diff 审批制、OS 级沙箱（内核策略隔离文件系统与网络）、Droid Shield（提交前密钥扫描）、命令允许/拒绝列表、企业级 Managed Settings 与 IP 限制。

### 维护状态、版本演进与生态反馈

- **版本节奏**：统一 Changelog 覆盖 App/CLI，接近每工作日一版（2026-07 共 15+ 版），当前 v0.183.0（2026-07-29）；产品处于 0.x 但迭代密度和企业客户规模表明已生产可用。
- **关键演进**：2026-04-08 发布 Factory Desktop App（本地机器直连的可视化工作区）；近期方向为 Missions 多 Agent 编排、Loop 循环任务、企业审计与管控加强。
- **生态**：MCP、Plugins 市场（含企业内部市场）、Skills（SKILL.md 体系）、公开 API（Sessions/Computers/Wiki/Analytics 等）。社区反馈样本本轮未展开抽样，维护状态判断以官方发版记录为准（边界说明）。

## 技术架构调研

### 系统全貌与运行形态

三层结构：

1. **本机执行层**（主体）：Droid 运行于开发者工作站/CI/容器，agent loop、工具调用、文件读写全部本地；CLI 与 App 是同一执行层的两种界面。
2. **模型层**（可插拔）：Factory 自管模型（含免费 Droid Core 开源权重池）或 BYOK——官方 API、云平台（Bedrock/Vertex/Azure）、LLM 网关、自托管/本地模型（Ollama、LM Studio）。
3. **云控制面**（辅助，可降级至零依赖）：账号、会话同步、编排、可选分析与审计；Hybrid 模式控制面数据最小化，Air-Gapped 模式运行时完全不接触 Factory 云。

### 核心链路（本机编码任务）

1. 用户在 CLI/App 对本地仓库下达任务。
2. Droid 本地读取所需文件，将 prompt+上下文发送至**所配置的模型端点**（跨网络边界；若配 Ollama 则全程本机）。
3. 模型返回计划/补丁 → Droid 展示 diff → 人工批准 → 本地落盘，按需本地运行测试/验证器。
4. 会话元数据同步云端（默认 SaaS 模式）供跨端接续；遥测按配置发往客户自有 OTEL collector。

关键约束：数据边界由所选模型端点与部署模式决定；默认模式下需网络与 Factory 账号；代码本体不进 Factory 云。

### 主要依赖

- CLI：无强制外部依赖（Linux 需 xdg-utils；npm 安装路径需 Node）；App 为独立安装包。
- 运行时硬依赖仅为模型端点可达性（本地模型时无外网依赖）。

### 接口形态

- 用户侧：终端 TUI、桌面 GUI、Web、移动端、IDE 终端。
- 自动化侧：Droid Exec CLI、REST API（Sessions/Computers/Automations/Analytics 等）、MCP（接入外部工具）、Slack/Linear 集成。

### 持久化方式

- 代码与产物：用户本地文件系统 + Git。
- 配置：`~/.factory/settings.json`（含 BYOK，本地保存）。
- 云端：会话记录、组织配置、审计日志（Hybrid/Air-Gapped 下留在客户侧）。

### 通信方式

- Droid ↔ 模型端点：HTTPS API（直连所配供应商，不经第三方代理）。
- Droid ↔ Factory 云：会话同步与编排通道（协议未公开，未决；判定不依赖此项）。

### 部署形态

#### 工作机安装（Windows / macOS）

- **macOS**：Factory App 提供 Apple Silicon 与 **Intel** 两种 `.dmg`，拖入 Applications；CLI 走 Homebrew。卸载：删除应用 / brew uninstall。
- **Windows**：Factory App 提供 **x64 与 ARM64** 安装器；CLI 有 Windows 安装方式与 npm 通道；对 WSL 环境有专门适配（Changelog 证据）。卸载走系统标准流程。
- 权限：无特殊系统权限要求（不做屏幕控制类操作）；沙箱为自带的 OS 级策略，无需 Docker/WSL 前置。
- 登录：浏览器 OAuth 回跳。

#### 主体功能运行位置

- **主体功能（Agent 执行、文件读写、验证）在 PC 本地，符合要求。**
- 云端执行（Droid Computers）为可选增值能力，不构成默认形态。

#### 云端网关（简单提及，不展开）

- 默认 SaaS 模式下云端承担：账号与授权、会话/组织数据同步、Missions 编排辅助、可选分析与审计。企业可通过 Hybrid/On-Prem/Air-Gapped 将其收缩至零。按 RUNBOOK 不深入其服务端实现。

## 未决项与证据边界

1. **"代码不上云"承诺未经运行验证**：官方文档表述明确，但本轮未实测抓包；高合规场景落地前应实测验证数据上行范围。
2. **默认模式下会话数据的具体内容与保留策略**：会话记录含多少上下文片段、保留多久，需查 Trust Center 或实测（本轮标注为推导）。
3. **CLI 在 Windows 原生（非 WSL）下的完整度**：文档提供 Windows 安装项且 Changelog 有 WSL 适配记录，但原生 Windows 终端体验未实测。
4. **BYOK 免费额度的具体限额**："BYOK 在个人计划免费至一定额度，超出按计划计费"，额度数值官方页未给出。
5. **社区口碑未抽样**：本轮以官方资料为主，未系统抽样第三方用户反馈；产品可靠性结论以试用验证为准。

## 后续验证建议

1. 试用验证（Pro $20 或免费 Droid Core）：在 Windows 与 macOS 工作机各装一套 Factory App + Droid CLI，跑一个真实仓库任务，验证 diff 审批流、沙箱行为与稳定性。
2. 数据边界实测：配置 BYOK 指向自有端点（或本地 Ollama），抓包确认除模型请求与会话同步外无代码上行。
3. 若用于 GLNT-10 议题研究：重点拆解其 Software Factory 的"信号→分诊→自动化"运营模型、Missions 的编排/检查点机制与 Droid Exec 的无头任务分派——这是业界"Agent 持续获得工作并形成闭环"的成型样本，建议另开专项任务深读其文档（无需源码）。
4. 企业化路径确认：如需私有化，向官方确认 Hybrid/On-Prem 的最低规模与商务条件（文档未公开报价）。
