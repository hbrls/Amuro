# Grov 技术产品调研

> updated_by: Qoder - Claude
> updated_at: 2026-07-18
> evidence_window: 2026-07-18；GitHub 仓库 main 分支快照；package.json 版本 0.6.20；最新 Release 标签 0.6.15（2026-01-22）

## 交付结论

1. **Grov 是面向工程团队的"AI 会话记忆共享"工具**，定位为"集体 AI 记忆"。它在本地捕获单个开发者在 AI 编码会话中产生的推理与决策，并按需同步到团队，使队友的 AI 在新会话中可直接获得已验证的上下文，跳过重复探索。
2. **系统由三部分组成**：Grov CLI（npm 包，本地运行）、Grov API 服务器（团队云端后端）、Grov Dashboard（app.grov.dev，Web 控制台）。本地默认使用 SQLite，团队同步使用云端 PostgreSQL + OpenAI 向量嵌入做混合检索。
3. **运行形态是"本地代理 + 可选云端同步"**：CLI 工具（Claude Code、Codex）经 localhost:8080 代理接入；IDE 工具（Cursor、Zed、Antigravity）经原生 MCP 接入，无需代理。云端依赖 Supabase 与 Vercel（二者在安全策略中明确划为第三方、不在范围内）。
4. **项目处于早期活跃迭代阶段**：版本号 0.x，近两个月密集发布（0.5.3 到 0.6.15+），但公开 Issue 极少（仅 3 个，多为作者自建的功能请求），社区反馈样本不足，采用规模无法从公开数据确认。
5. **商业模式为免费起步**：个人与 3 人以下团队免费，更大团队的付费计划"即将推出"，尚未形成稳定商业化。

## 调研目标、范围与边界

### 调研目标

理解 Grov 是什么、为谁解决什么问题、如何在技术上工作，以建立对该产品及其系统的整体认识。

### 核心问题

- 产品：Grov 解决什么问题？目标用户是谁？核心流程与功能边界是什么？维护状态如何？
- 架构：系统以什么形态运行？由哪些主要部分组成？各部分如何协作？关键约束是什么？

### 覆盖范围

- 产品定位、目标用户、核心流程、功能边界、维护状态、版本演进、生态与反馈。
- 技术运行形态、主要组件、核心链路、主要依赖、接口形态、持久化、通信、部署形态。

### 明确排除

- 不做源码审计：不逐文件检查 schema、路由、锁、队列、心跳或并发实现。
- 不做竞品比较：不引入其他记忆类工具进行横向对比或选型矩阵。
- 不做性能 benchmark、不做集成实施。

## 证据口径

| 证据类型 | 使用方式 | 边界说明 |
| --- | --- | --- |
| 官方 README | 定位、功能、流程、运行模型 | 宣传性表述（如"10 分钟降到 1-2 分钟"）仅作参考，未独立验证 |
| package.json | 版本、依赖、入口、构建脚本、Node 引擎、monorepo 结构 | 只能证明当前快照，不外推历史或运行时表现 |
| GitHub Releases | 版本演进、方向性变化、功能上线时点 | 标签版本（0.6.15）低于 package.json 版本（0.6.20），说明存在未发版的持续开发 |
| GitHub Issues | 反馈主题 | 仅 3 个开放 Issue，样本过小，不代表普遍反馈 |
| 安全策略页 | 组件边界、第三方服务 | 明确将 Supabase、Vercel 划为范围外，反证二者被使用 |
| 架构推导 | 组件关系与数据流解释 | 标注为推导，不等同于运行验证 |

## 产品调研

### 产品定位与目标用户

- **一句话定位**：Grov 是工程团队的集体 AI 记忆——当一个开发者的 AI 搞清楚某事后，全队的 AI 都能知道。
- **目标用户**：使用 AI 编码代理（Claude Code、Cursor、Zed、Antigravity、Codex）的工程团队，尤其是多人协作、存在重复探索成本的小型到中型团队。
- **核心痛点**：AI 会话之间相互隔离，同一问题被反复调查，token 与时间被重复消耗，知识随会话结束而消失。

### 核心流程

以 README 图示为依据，端到端流程为：

1. 开发者 A 在 Claude Code 中提问（如"认证系统如何工作"）。
2. Claude 调查并得出结论；Grov 代理捕获推理过程与决策。
3. 记忆同步到团队 Dashboard（app.grov.dev）。
4. 开发者 B 提出相关问题时，Claude 直接注入已验证的团队记忆，跳过探索阶段，给出"专家级"即时回答。

### 功能地图与边界

**当前可用能力**：

- 团队知识共享：自动捕获、自动同步、自动注入、混合检索（语义 + 关键词）。
- 反漂移检测（Anti-Drift）：监控 Claude 实际动作而非用户提问，按 4 级（nudge → correct → intervene → halt）注入纠正；用 Claude Haiku 打分。
- 扩展缓存（Extended Cache）：在空闲期发送最小保活请求，保持 Anthropic 提示缓存热度（可选开启，需用户同意代为调用 API）。
- 自动压缩（Auto-Compaction）：上下文达 85% 时预计算摘要，保留目标、关键决策、当前状态、下一步，丢弃冗余探索。
- 多工具集成：Claude Code、Cursor、Cursor CLI、Zed、Antigravity、Codex。

**规划/进行中能力**：VS Code 扩展、Gemini CLI 支持、更大团队的付费功能。

**边界**：本地默认不依赖云端（记忆留在 `~/.grov/memory.db`），仅在显式启用团队同步时才上传。无 ANTHROPIC_API_KEY 时退化为"基础抽取"，记忆不会同步。

### 维护状态与版本演进

- **维护状态判断**：活跃。近两个月（2025-12 至 2026-01）密集发布，作者为单一主要维护者（TonyStef），版本仍处 0.x。
- **关键版本演进**（不穷举）：
  - 0.5.3（2025-12-13）Hybrid Search 上线——OpenAI 嵌入（text-embedding-3-small）语义检索 + PostgreSQL 全文检索关键词匹配，注入 Top 5 相关记忆。
  - 0.5.11（2025-12-22）Intelligent Memory Updates——记忆按文件改动或决策冲突选择"更新/跳过/新建"，保留 evolution_steps 历史，Dashboard 增加演化时间线与"Edited"标记。
  - 0.6.12（2026-01-09）Agent expansion——修正 postinstall 同步逻辑为非交互自动同步。
  - 0.6.15（2026-01-22）最新可见发版，仅改动 YouTube 链接位置；package.json 已达 0.6.20，表明存在未发版的持续开发。
- **方向性观察**：从本地捕获 → LLM 抽取 → 反漂移 → 团队同步 → 混合检索 → 自动压缩 → IDE 集成，路线图条目逐步兑现，重心正从"单人本地"向"多人云端协作 + 智能演化"移动。

### 生态与反馈

- **生态入口**：npm 包 `grov`、GitHub 仓库、官网 grov.dev、Dashboard app.grov.dev、X 账号 @tryGrov。
- **反馈样本及其边界**：
  - GitHub：193 Star、12 Fork，仅 3 个开放 Issue（#63 请求企业内部代理 URL 配置；#13、#12 为作者自建的设置功能请求）。样本极小，**不能代表普遍反馈**。
  - 公开提及：曾入选 ProductHunt Daily 通讯（声称 100 万+ 订阅），属宣传性表述，采用规模未独立验证。
- **官方承诺 vs 已发布**：路线图中"VS Code 扩展""Gemini CLI"仍为规划；"Team 付费档"标注"即将推出"。

## 技术架构调研

### 系统全貌与运行形态

Grov 以"本地组件 + 可选云端同步"形态运行，是一个 pnpm monorepo。三类运行单元：

1. **Grov CLI**（npm 包 `grov`，本地进程）：用户在本机安装，承担初始化、代理、记忆捕获、注入、反漂移、压缩、登录与同步等全部本地逻辑。
2. **Grov API 服务器**（云端后端）：在团队同步启用后接收记忆、提供混合检索、支撑 Dashboard。安全策略将其列为独立组件。
3. **Grov Dashboard**（app.grov.dev，Web 控制台）：团队浏览、搜索、管理共享记忆，查看推理链路与演化历史。

CLI 工具（Claude Code、Codex）通过 localhost:8080 代理接入；IDE 工具（Cursor、Zed、Antigravity）通过原生 MCP 接入，不需要代理。

### 主要组件与核心链路

**主要组件职责**（依据 README "How it works" 图示与 package.json monorepo 结构）：

| 组件 | 运行位置 | 职责 |
| --- | --- | --- |
| Grov Proxy（localhost:8080） | 本机 | 注入团队记忆、转发至 Anthropic API、监控漂移并注入纠正、跟踪上下文用量并自动压缩、任务完成时捕获推理 |
| 本地 SQLite（~/.grov/memory.db） | 本机 | 默认存储记忆，未启用同步时不外传 |
| Grov API 服务器 | 云端 | 团队记忆存储与检索（PostgreSQL + OpenAI 嵌入） |
| Grov Dashboard | 云端 Web | 团队记忆浏览、搜索、可见性与邀请 |
| MCP 集成层 | 各 IDE 内 | 为 Cursor/Zed/Antigravity 提供无代理接入 |

**核心链路**（端到端记忆共享）：

1. Claude Code 发起请求 → 经 Grov Proxy（localhost:8080）。
2. Proxy 注入来自历史会话的相关团队记忆（Top 5，混合检索）→ 转发至 Anthropic API。
3. Proxy 并行监控：用 Claude Haiku 对动作与意图对齐打分，触发 4 级纠正；跟踪上下文，85% 时自动压缩保留关键决策。
4. 任务完成时，Proxy 抽取推理链（CONCLUSION/INSIGHT 对）、关键决策、涉及文件、约束，写入本地 SQLite。
5. 若启用团队同步，记忆上传至 Grov API 服务器（PostgreSQL + 嵌入），Dashboard 可见，供队友新会话注入。

**跨边界点**：CLI 工具经本机 HTTP 代理跨进程；IDE 工具经 MCP 跨进程；团队同步经网络跨至云端后端；Anthropic API 与 OpenAI 嵌入为外部服务边界。

### 主要依赖

只记录影响安装、运行、部署或关键能力的运行时依赖（依据 package.json `dependencies`）：

- `@anthropic-ai/sdk` ^0.32.1：调用 Claude，支撑反漂移打分与推理抽取。
- `@modelcontextprotocol/sdk` ^1.25.1：IDE 原生 MCP 集成。
- `better-sqlite3` ^11.6.0：本地记忆持久化。
- `commander` ^12.1.0：CLI 命令框架。
- `fastify` ^5.6.2：本地代理服务器。
- `openai` ^4.70.0：OpenAI 嵌入（text-embedding-3-small）做语义检索。
- `undici` ^7.16.0：HTTP 客户端。
- `zod` ^4.2.1：校验。
- `pino` / `pino-pretty`：日志。
- `dotenv`、`debug`、`smol-toml`、`open`：配置、调试、TOML 解析、打开浏览器。

开发依赖与构建工具（turbo、husky、vitest、typescript）不计入运行时硬依赖。运行引擎要求 Node.js >=20.0.0，包管理器为 pnpm@9.15.0，monorepo 工作区为 `shared`、`dashboard`、`api`、`landing`。

### 接口形态

系统边界上的接口类型及用途（不穷举端点）：

- **CLI**：用户主入口，`grov init/proxy/sync/login/doctor/drift-test` 等。
- **本地 HTTP 代理**：localhost:8080，CLI 工具（Claude Code、Codex）的接入点，转发并处理 Anthropic API 流量。
- **MCP**：IDE 工具（Cursor、Zed、Antigravity）的原生接入通道，无需代理。
- **云端 API**：团队同步与检索后端（Grov API 服务器），供 CLI 与 Dashboard 调用。
- **Web Dashboard**：app.grov.dev，浏览器访问的团队管理界面。
- **GitHub OAuth**：`grov login` 经 GitHub 认证。

### 持久化方式

- **本地**：SQLite，位于 `~/.grov/memory.db`，默认存储所有记忆，不外传。
- **云端（团队同步启用后）**：PostgreSQL（用于全文关键词检索）+ OpenAI 向量嵌入（text-embedding-3-small，用于语义相似度）。记忆按 ~10-15 个语义块切分，匹配到最佳块后返回父记忆。
- **所有权**：本地记忆归本机用户；启用同步后团队记忆归团队，Dashboard 可见。第三方存储由 Supabase 提供（安全策略将其划为范围外第三方）。

### 通信方式

总体模式（不审计锁、队列、心跳、重试实现）：

- **同步转发**：Proxy 同步转发请求至 Anthropic API。
- **异步捕获**：任务完成时异步抽取推理并写入本地。
- **可选保活轮询**：扩展缓存模式在空闲期发送最小请求维持 Anthropic 提示缓存热度。
- **网络同步**：团队记忆经网络上传至云端后端；新会话注入时经网络检索召回。
- **进程间**：CLI 工具经 HTTP 与本地代理通信；IDE 工具经 MCP 与 Grov 通信。

### 部署形态

- **终端用户安装**：`npm install -g grov` 安装 CLI；`grov init` 一次性配置（按工具生成代理或 MCP 配置）；`grov proxy` 启动并保持运行（仅 CLI 工具需要）。
- **开发运行**：clone 仓库 → `npm install` → `npm run build`（`tsc` 编译到 `dist`）→ `node dist/cli.js` 测试；支持 `npm run dev` watch 模式；monorepo 用 turbo 编排 `dashboard`、`api` 等子包。
- **云端部署**：Dashboard 与 API 服务器由官方托管（Vercel 负责 Web 托管，Supabase 提供后端存储），用户无需自部署云端组件。
- **平台**：macOS（zsh）、Linux、Windows（0.5.8 起支持 API Key setx 设置）。
- **必要依赖**：Node.js >=20（package.json engines；README 仍写 18+，以 package.json 为准并标注未决）、一个受支持工具、ANTHROPIC_API_KEY（用于记忆同步与反漂移；缺省时退化为基础抽取、不同步）。
- **网络边界**：本地默认可离线工作（记忆留本机）；团队同步、反漂移打分、OpenAI 嵌入、扩展缓存均需联网调用外部 API。

## 未决项与证据边界

1. **README 写 Node.js 18+，package.json engines 写 >=20.0.0**——二者不一致，最低运行版本未独立验证，按 package.json 推断为 20，标注为未决。
2. **package.json 版本 0.6.20 高于最新发版标签 0.6.15**——说明存在未发版的持续开发，但 0.6.16–0.6.20 的具体内容未公开，无法确认。
3. **本地与云端检索的一致性**——本地为 SQLite，云端为 PostgreSQL + OpenAI 嵌入；纯本地模式下是否具备语义检索能力未由官方明确说明（混合检索的 PostgreSQL 全文与 OpenAI 嵌入似依赖云端），属推导，需运行验证。
4. **采用规模与真实反馈**——公开 Issue 仅 3 个、Star 193，样本不足以判断实际采用规模与用户痛点，宣传性表述（ProductHunt 100 万+）未独立验证。
5. **企业代理配置**——Issue #63 请求配置企业内部代理 URL 而非直连 Anthropic，反映企业场景需求，但当前是否支持未由官方说明。
6. **安全模型边界**——安全策略将 Supabase、Vercel 明确划为范围外第三方，意味着云端组件的底层基础设施安全不在 Grov 自身承诺内，企业评估需单独审视。

## 后续验证建议

1. **运行验证最低 Node 版本**：在本机分别用 Node 18 与 20 安装 `grov`，确认 engines 与 README 哪个为准。
2. **验证本地模式检索能力**：在不启用团队同步的纯本地模式下，测试语义检索是否可用（判断混合检索是否强依赖云端 OpenAI 嵌入与 PostgreSQL）。
3. **核对 0.6.16–0.6.20 变更**：查看 `main` 分支相对 0.6.15 标签的提交历史，确认未发版内容。
4. **收集真实使用反馈**：在独立渠道（非作者自建 Issue）抽样团队使用体验，以校正公开样本过小的问题。
5. **企业适配评估**：针对 Issue #63 的企业内部代理需求，确认当前是否支持自定义上游 URL，以判断企业场景可行性。
