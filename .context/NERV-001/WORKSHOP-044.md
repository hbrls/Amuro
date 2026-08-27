# Alook（alookai/alook）技术产品调研

> updated_by: Qoder - Claude Sonnet 4.5
> updated_at: 2026-07-31 16:55:00
> evidence_window: 调研日期 2026-07-31；GitHub 仓库 `alookai/alook`（创建于 2026-04-03，主干最近推送 2026-07-31）；最新 Release `v0.0.160`（2026-07-26，源码/版本号发布，无二进制资产）；官网 alook.ai、onboard.md、README.md、AGENTS.md 与 `src/shared/src/db/schema.ts` 主干快照

## 交付结论

1. **Alook 是一个开源、可自托管的「个人 AI 公司」协作编排平台，采用「本地执行 + 云端协调」的混合架构。** 官方定位是把你本机的 AI 编码 Agent（Claude Code、Codex、OpenCode）变成一支有邮箱、有角色、有组织架构、7×24 常驻的协作团队；你是 CEO，定义 org chart，Agent 之间通过邮件协作。

2. **与「纯本地」编排器（如桌面单机型）本质不同：Alook 的协调大脑默认在云端（Cloudflare）。** 架构分两侧——本地「Agent Machine」跑 `@alook/cli` 守护进程与 Agent 工作目录（代码不出本机）；「Hosted Machine」跑 `@alook/app`（Next.js on Cloudflare Workers）+ 邮件 Worker + WebSocket Durable Object + 定时 wake Worker，并持有全部协调状态（Cloudflare **D1（SQLite）+ R2** 文件存储）。本地 daemon 以 **POLL** 方式向云端拉取任务。

3. **主体功能运行位置判定为「混合，且协调主体偏云端」——构成明确的 Local 优先选型缺陷。** 真正在本机运行的是 Agent 执行与代码库；而任务队列、Agent 运行时注册、会话/消息、邮件、日历、看板、调度全部落在云端 D1/R2。虽 Apache-2.0 可自托管，但自托管栈**深度绑定 Cloudflare 平台**（Workers + D1 + R2 + Durable Objects），并非可随意迁移到任意本地/内网基础设施的单机二进制。除代码库外，Agent 的对话、任务、邮件等元数据默认驻留在托管端。

4. **调度范式是「中心化任务队列 + 客户端轮询领单」，直接对应 Index 关注的中心调度问题。** `schema.ts` 中 `agentTaskQueue` 表带完整状态机（`queued → dispatched → running → completed/failed`），配合 `agentRuntime`（含 `lastSeenAt` 心跳）、`machine`、`machineToken`；多个部分索引（partial index）约束「同一 agent 同时仅一个活跃任务」，即防重复领取/原子抢占机制。这是典型的**中心特权调度服务**形态，而非分布式任务池。

5. **Agent 获得工作的入口以「邮件 + 看板 + 日历 + 常驻 daemon」为核心，契合本议题（Agent 持续获得工作并形成可治理闭环）。** 每个 Agent 有独立邮箱（可领取 `@alook.ai` 地址），人对 Agent、Agent 对 Agent 均走邮件；Kanban 分派与状态跟踪；Calendar 管理循环任务/提醒；wake-worker 负责定时唤醒；daemon 保持常驻「ship while you sleep」。

6. **治理主打「可追溯、无黑盒」，但 Agent 侧权限强度仍继承自底层 Agent CLI，且已暴露信任边界问题。** 每条指令/决策/回复都记录在邮箱或本地文件形成审计轨迹。但近期 Issue 显示执行侧存在治理风险：`#417` Alook 让 OpenCode 加载「仓库自带的 `.opencode/plugins`」（供应链/信任面）、`#351` `OPENCODE_PERMISSION` 被用户配置覆盖导致 Agent 权限看起来过宽——表明权限沙箱主要依赖底层 Agent，Alook 层的强约束尚不完备。

7. **持久化是「云端 Cloudflare D1（SQLite）+ R2 文件」为主，本地保留代码库与工作目录。** 服务端要求 STATELESS（AGENTS.md 明确「状态必须落 DB 或本地，绝不放内存」），使用 Drizzle ORM over D1；生产 Web 经 Cloudflare 自有 Git 集成部署。无传统外置 Postgres/Redis，但强依赖 Cloudflare 托管数据面。

8. **维护状态「早期、活跃、高频迭代」。** 仓库 2026-04-03 创建，2026-07-31 仍在推送；1,031 stars / 160 forks / 80 open issues。统一版本号（`pnpm bump`，所有 `src/*` 包共享一版），当前 `v0.0.160`（仍 0.0.x）。npm 分发 `@alook/app`、`@alook/cli`、`@alook/daemon`；桌面端为 Tauri（含 iOS/Android 脚本）。Apache-2.0，主干代码公开，未见闭源核心。

9. **综合判定：作为「邮件协作 + 中心调度 + 客户端领单」范式的业界样本极具代表性，但对 Local 优先场景准入受限，建议列为「范式参考、选型审慎」候选。** 满足「多 Agent 协作、持续获得工作、可治理审计」；主要选型缺陷：① 协调大脑与数据默认在云端，自托管强绑 Cloudflare；② 无 GitHub 二进制安装包，依赖 Node/npx 与 Cloudflare 部署，落地成本与运维复杂度偏高；③ 执行侧权限治理依赖底层 Agent，已有信任面问题；④ 版本极早期（0.0.x）。

## 调研目标、范围与边界

### 调研目标

理解 Alook 的产品定位、持续工作形态、运行架构与 Windows/macOS 工作机适配，重点判断其作为「Agent 持续获得工作并形成可治理完成闭环」的业界样本的成熟度、调度范式与 Local 优先适配程度。

### 核心问题

- Alook 为谁解决什么问题，核心工作闭环如何形成？
- 本地 daemon/runtime、云端协调层（Cloudflare）、邮件/WebSocket、模型端点之间的职责边界是什么？
- Windows 与 macOS 工作机如何安装、运行、依赖与权限是什么？
- Agent 如何接收人工、邮件、看板与周期性工作，并在完成/失败/受阻时反馈与治理？
- 状态如何持久化，云端是否为主体协调所必需？可自托管到何种程度？
- 其调度范式是中心特权调度、分布式任务池，还是其他形态？

### 覆盖范围

- 官网 `alook.ai`、`onboard.md`、`/templates`。
- GitHub 仓库元数据、License、README.md、AGENTS.md、`src/shared/src/db/schema.ts`、目录结构（`src/{app,cli,daemon,desktop,email-worker,wake-worker,web,ws-do,shared}`）、Release 列表、近期开放 Issue 样本。

### 明确排除

- 不进行逐文件源码审计、代码质量审查或性能 benchmark（schema/目录仅用于回答架构与调度问题）。
- 不进行竞品比较、横向排名或选型矩阵（对比由独立流程完成）。
- 不调研遥测实现细节。
- 不安装、不登录、不部署，不把静态证据包装为运行验证。
- Linux 仅作背景记录，不作工作机合格安装路径替代。

## 证据口径

- **直接事实**：官网/onboard 明文、README、AGENTS.md、GitHub API 元数据、License、`schema.ts` 表定义、目录结构。
- **架构推导**：由 README 架构图（client POLL cloud、SQLite/Files 存储）、AGENTS.md（`src/web` = Next.js on Cloudflare Workers D1+R2、`ws-do`、`email-worker`）、`agentTaskQueue`/`agentRuntime` 表结构组合推导出的组件关系与调度流；标注为系统模型，非运行时抓包。
- **社区反馈样本**：近期开放 Issue 标题仅用于归纳主题，样本边界为 2026-07-31 GitHub 公开快照，不代表整体质量或采用率。
- **快照边界**：stars/forks/issue 数、版本与目录持续变化；结论以 `v0.0.160` 与 main 主干为准。

## 产品调研

### 产品定位与目标用户

- **一句话定位**：Alook 是开源、自托管、本地优先执行的「个人 AI 公司」编排/协作层——给本机 AI Agent 分配角色与邮箱，组成 7×24 常驻、可协作、可审计的团队。
- **目标用户**：solopreneur / one-person-company / indie hacker，以及希望把多个编码 Agent 组织成「团队」自动跑活的人（GitHub topics 明确含 one-person-business、solopreneur、multi-agent）。
- **隐喻**：公司/组织（CEO、org chart、角色 dev/ops/research/sales/biz、邮箱、日历、看板）。

### 核心流程

1. `npx @alook/app onboard`（或 `@alook/cli login` → `daemon start` → `workspace init --json-file`）连接本机、检测 runtime、部署首个「Agent 公司」，本地 `http://localhost:15210` 打开；
2. 定义 org chart（JSON：members，含 role/description/instructions/relationship）；
3. Agent 领取 `@alook.ai` 邮箱，人/Agent 通过邮件与看板下发任务；
4. 本地 daemon 常驻，POLL 云端任务队列，拉起本地 Agent 执行，回写状态；
5. 全流程记录（邮箱 + 本地文件）形成审计轨迹；Calendar/wake-worker 驱动定时/循环任务。

### 功能地图与边界

- **Collaboration**：org chart 定义角色，Agent 自动协调。
- **Email-native**：每个 Agent 独立邮箱，人-Agent、Agent-Agent 通信。
- **Kanban**：任务分派、进度跟踪、自动关闭。
- **Calendar**：Agent 自管日程、循环任务、提醒。
- **Always-on**：daemon 常驻 7×24。
- **Self-learning**：任务沉淀记忆/偏好/上下文。
- **Traceable**：全量审计。
- **Agent-agnostic（BYO Agent）**：Claude Code / Codex / OpenCode 可用；Cursor / Hermes / OpenClaw「Coming Soon」。
- **Templates**：预置公司模板（开源维护者、indie ship crew、devops monitor、日报运营等）。

### 维护状态与版本演进

- **活跃度**：2026-04-03 创建，2026-07-31 仍在推送；1,031 stars / 160 forks / 80 open issues（2026-07-31 快照）。
- **版本**：统一版本号，`v0.0.160`（2026-07-26），近一月密集发版（v0.0.156→160）。仍处 0.0.x 极早期。
- **发布链**：`pnpm bump` 统一升版 → CI（typecheck/lint/test/coverage）→ 自动 Tag & GitHub Release（含 changelog）→ npm 自动发布 `@alook/cli`/`@alook/app`/`@alook/daemon` → Cloudflare Workers 各模块按需重部署；`--desktop`/`--mobile` 触发桌面/移动构建；`--min-cli` 在破坏性变更时抬升 `MIN_CLI_VERSION`（云端强制最低 CLI 版本）。

### 生态与反馈

- **生态入口**：官网、Discord、Templates、npm 包、Cloudflare 部署。
- **反馈主题（近期 Issue 样本，边界有限）**：OpenCode 集成边界（`#417` 加载仓库自带 `.opencode/plugins` 的信任面、`#351` `OPENCODE_PERMISSION` 被覆盖、`#352` OpenCode 工具调用不在任务视图显示）、Agent 团队管理增强（模板/审批/模型/MCP，`#349`）、Web 加载态与测试覆盖等重构项。总体偏「Provider 集成打磨 + 治理/权限细节 + 前端体验」。样本量小，不代表整体。

## 技术架构调研

### 系统全貌与运行形态

两侧 + 存储的混合架构（README 架构图 + AGENTS.md 直接佐证）：

- **Agent Machine（本地）**：`@alook/cli` + `@alook/daemon`（常驻）+ Agent 工作目录（代码库）。运行底层 Agent CLI（Claude Code/Codex/OpenCode）。以 POLL 方式对接云端。
- **Hosted Machine（云端，默认 alook.ai / 可自托管）**：`@alook/app`（Next.js on **Cloudflare Workers**）+ `email-worker`（入站邮件）+ `ws-do`（WebSocket Durable Object）+ `wake-worker`（定时唤醒）。
- **Storage（云端）**：Cloudflare **D1（SQLite）** + **R2（文件）**。
- **范式判定**：中心化特权调度服务（云端持有任务队列与运行时注册）+ 客户端轮询领单 + 邮件协作总线。非分布式任务池、非纯本地。

### 主要组件与核心链路

**主要组件（职责与运行位置）**：

| 组件 | 职责 | 运行位置 |
| --- | --- | --- |
| `@alook/cli` + `@alook/daemon` | 登录、常驻、POLL 任务、拉起本地 Agent、回写状态 | 工作 PC 本地 |
| Agent 工作目录 + Agent CLI | 实际执行与代码操作 | 工作 PC 本地 |
| `@alook/app`（Next.js/CF Workers） | Web UI、编排、API、协调 | 云端 / 自托管 |
| `email-worker` | 入站邮件处理、Agent 邮箱 | Cloudflare Worker |
| `ws-do` | WebSocket 实时（Durable Object） | Cloudflare |
| `wake-worker` | 定时/唤醒调度 | Cloudflare Worker |
| D1 + R2 | 任务队列、会话、邮件、日历、看板、文件 | Cloudflare |
| `@alook/desktop`（Tauri） | 桌面/移动客户端 | 各平台本地 |

**核心链路（任务下发与领取，推导）**：邮件/看板/日历/API 产生任务 → 写入云端 `agentTaskQueue`（status=`queued`）→ 目标 `agentRuntime`（有 `lastSeenAt` 心跳）匹配 → 置 `dispatched` → 本地 daemon POLL 领取、置 `running`、拉起本地 Agent 执行 → 结果回写 `completed/failed`、更新 issue/conversation/邮件 → 审计留痕。跨边界点：本地 daemon ↔ 云端（POLL/HTTP）、云端 ↔ D1/R2、Web ↔ ws-do（WebSocket）、外部邮件 ↔ email-worker。

### 主要依赖

- **本地运行时硬依赖**：Node.js（`npx`）；至少一个已装并认证的 Agent CLI（Claude Code/Codex/OpenCode）——Alook 不含 Agent 运行时。
- **云端平台硬依赖**：Cloudflare Workers + D1 + R2 + Durable Objects（自托管即须具备 Cloudflare 账户与该栈）。
- **技术栈**：TypeScript 单仓（pnpm + turbo），Next.js、Cloudflare Workers、Bun、Drizzle ORM、Tauri（桌面/移动）。
- **可选**：`@alook.ai` 托管邮箱、Discord。

### 接口形态

- **Web UI**：`@alook/app`（本地 `localhost:15210` 或托管域名）。
- **CLI**：`@alook/cli`（login/status/daemon/workspace init 等）。
- **Email**：Agent 邮箱作为主要协作/触发接口（人-Agent、Agent-Agent）。
- **WebSocket**：`ws-do` 提供 Web 实时事件（Durable Object）。
- **HTTP/POLL**：本地 daemon ↔ 云端的任务轮询接口；云端有 OpenAPI/API 类型（`api-types.ts`）。
- **桌面/移动**：Tauri 客户端（含 iOS/Android 构建脚本）。

### 持久化方式

- **云端为主**：Cloudflare D1（SQLite，Drizzle ORM）存 workspace/member/agent/agentRuntime/machine/**agentTaskQueue**/conversation/message/issue/emails/calendarEvent/artifact/agentSkill 等 30+ 表；R2 存文件/工件。
- **本地**：Agent 工作目录与代码库（不出本机）；本地文件承载部分审计。
- **服务端 STATELESS 约束**：状态必须落 DB 或本地，不放内存（AGENTS.md 明确）。
- **无传统外置 DB**：不用 Postgres/MySQL/Redis，但强绑 Cloudflare D1/R2 数据面。

### 通信方式

- **本地 ↔ 云端**：客户端 **POLL**（daemon 轮询任务队列）。
- **Web ↔ 云端**：WebSocket（Durable Object）实时。
- **Agent 协作**：邮件（email-worker 入站 + Agent 邮箱），异步消息式协作。
- **调度/唤醒**：wake-worker 定时触发。
- **模型通信**：由各底层 Agent CLI 自行对接其模型 API（本地进程发起）。

### 部署形态

#### 工作机安装（Windows / macOS）

- **通用（本地侧）**：`npx @alook/app onboard` 一键引导；或 `npx @alook/cli login` → `daemon start` → `workspace init`。依赖 Node.js/npx，Windows/macOS/Linux 均可运行（跨平台源于 Node 与 Tauri）。
- **桌面客户端**：`@alook/desktop` 基于 **Tauri**（可出 macOS/Windows/Linux 及 iOS/Android），经 `--desktop`/`--mobile` 单独构建流水线。
- **无 GitHub 二进制安装包**：Releases 仅为源码/版本号（`v0.0.160` 无二进制资产），分发走 npm/npx + Cloudflare 部署 + 独立桌面构建。
- **Windows / macOS 专项差异、签名、卸载**：官方文档未见针对两平台的独立安装/签名/卸载说明（onboard 以 `npx` 为主）——标注为**未决/未充分覆盖**，构成工作机落地证据缺口。
- **依赖与权限**：须已装并认证 Agent CLI；自托管须配置 Cloudflare 栈；邮箱可用托管 `@alook.ai`。

#### 主体功能运行位置

- **本地**：Agent 执行、代码库、工作目录、daemon。
- **云端（默认）**：协调大脑与全部协调数据（任务队列、运行时注册、会话、邮件、日历、看板）。
- **判断**：属**混合形态，协调主体偏云端**。除代码库外的关键状态默认离开工作机 → **Local 优先选型缺陷**（且自托管需 Cloudflare 平台，缓解有限）。

#### 云端形态（主体协调所必需）

- **职责**：编排、任务分发、Agent 运行时注册与心跳、会话/消息、邮件收发、日历、看板、文件、实时推送、定时唤醒。
- **组件**：`@alook/app`（Next.js/CF Workers）、`email-worker`、`ws-do`（Durable Object）、`wake-worker`。
- **持久化**：D1（SQLite）+ R2。
- **接口/通信**：HTTP/POLL、WebSocket、SMTP/邮件入站。
- **部署/托管**：Cloudflare（生产经 Cloudflare Git 集成部署）；自托管即在自有 Cloudflare 账户重建该栈。
- **数据/权限/网络边界**：Agent 元数据（对话/任务/邮件/日历）默认驻留托管端；断开云端则任务分发、邮件协作、Web/实时、调度均不可用（代码库仍在本地但失去编排闭环）。

## 未决项与证据边界

- **Windows/macOS 安装细节**：缺少针对两平台的独立安装/签名/升级/卸载官方说明（onboard 以 `npx` 通用引导为主）——未决。
- **自托管完整度**：Apache-2.0 声明可自托管，但对「脱离 Cloudflare 平台」的可行性与替代数据面官方未明确——推断为强绑 Cloudflare，未运行验证。
- **POLL/心跳/领单具体协议**：由 `agentTaskQueue`/`agentRuntime.lastSeenAt` 与架构图推导，未做运行时抓包验证。
- **邮件/托管邮箱数据边界**：`@alook.ai` 托管邮箱的数据留存与隐私细节官方未详述——未决。
- **社区反馈**：Issue 样本量小（近期约 8 条），仅归纳主题，不代表整体。
- **模型推理边界**：由底层 Agent CLI 决定（多为云端模型 API），未逐一验证；此为 Provider 固有属性。

## 后续验证建议

- 若进入选型深评：在 Windows 与 macOS 各实测 `npx @alook/app onboard` → daemon → workspace → 邮件/看板下发 → 本地 Agent 执行 → 状态回写的端到端闭环，验证架构推导与断云端行为。
- 实测「完全自托管」路径，确认是否必须 Cloudflare（Workers/D1/R2/Durable Objects），评估脱离 Cloudflare 的改造范围与风险。
- 针对治理面，验证 `#417`/`#351` 类信任/权限问题的实际影响，评估 Alook 层是否可强约束底层 Agent 权限。
- 对照 Index 的中心调度关注点，评估该「中心特权调度 + 客户端领单」范式在多调度节点、任务隔离与私有化数据面上的适配缺口。
