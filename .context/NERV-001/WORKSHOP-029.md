# AgentRQ 技术产品调研

> updated_by: Qoder - Claude
> updated_at: 2026-07-31 12:00:00
> evidence_window: 2026-07-30 调研；GitHub 仓库 agentrq/agentrq main 分支快照（最后 push 2026-07-19），版本约 v0.3.15；2026-07-31 补充源码级专项调研（main 分支实时抓取 SETUP.md / Makefile / Dockerfile / go.mod / config.go / base.yaml / main.go / sqlite.go / model.go / api.go 共 10 份一手文件）

## 交付结论

1. **AgentRQ 是一个"人类-AI Agent 协作任务管理平台"**：以 Web 应用形态运行的任务编排服务端，人类在 Web UI 中拆解目标、下发任务，AI Agent（Claude Code / Codex / Gemini CLI 等）通过 MCP 协议连接工作区，自主领取任务、汇报状态、请求敏感操作许可，全程 SSE 实时同步。
2. **主体功能运行位置取决于部署路径，需区分判定**：
   - **官方托管云路径（agentrq.com / *.mcp.agentrq.com）**：AgentRQ 服务端主体在云端，按本次调研约束**判定为不符合要求**；
   - **自托管路径（官方 Docker 镜像）**：服务端可完整运行在工作 PC 本地（`localhost:2026`，单容器 + SQLite 单文件，Docker 是唯一运行时依赖），主体功能在 PC 本地，**该路径符合要求**。执行实际工作的 AI Agent（Claude Code 等 CLI）本来就运行在 PC 本地。
3. **Windows / macOS 工作机安装可行**：自托管仅需 Docker Desktop（Win/Mac 官方均支持）+ 拉取 `agentrq/agentrq:latest` 镜像 + 一份 `.env`；无原生桌面安装包，Web UI 以浏览器/PWA 形态使用。配套网关（`@agentrq/acp-gateway`、`@agentrq/codex-gateway`）为 npm 全局包，跨平台；Windows 下 Codex 网关启动命令存在已知文档对齐问题（有 open issue 与 workaround PR）。
4. **可完全离线运行（2026-07-31 源码级修正，推翻初版结论）**：初版判断"不可完全离线、Google OAuth2 必填"仅是 SETUP.md 的文档口径——源码核验证实 `config.go` 不做任何必填校验，凭据为空照常启动；root login 完全自洽（本地建用户 `root@agentrq.local` + 签发 JWT，零外部网络调用）；另发现 GitHub OAuth 第二通道（同为插拔式，不配则前端不显示入口）。全部出站外联点均有关闭开关，单人纯本地场景可 100% 离线，详见"补充专项调研"章节。
5. **维护状态活跃但项目年轻**：仓库创建于 2026-03（约 4 个月），1057 stars / 76 forks，提交持续至 2026-07-16；无正式 GitHub Release，版本以 commit bump（v0.3.x）+ Docker 镜像 tag 方式演进。近期问题集中在调度器可靠性、事件链路正确性与安全加固（大量自动化 Sentinel 安全 PR 未合并），用于关键工作流前应评估成熟度。
6. **非 Docker 原生部署可行（2026-07-31 补充）**：Dockerfile 明确 `CGO_ENABLED=0` 且使用纯 Go SQLite 驱动（glebarez），Windows/macOS 均可 `go build` 出静态单二进制（Windows 无需 gcc/MinGW）；以"单目录（二进制 + _config + public + _storage）"形态零二开运行——Docker 只是官方分发形态，不是架构依赖。

## 调研目标、范围与边界

### 调研目标

理解 AgentRQ 是什么产品、为谁解决什么问题、系统如何构成，并重点回答：能否在 Windows / macOS 工作机上安装运行，主体功能是否位于 PC 本地。

### 核心问题

1. 产品定位、目标用户与核心流程是什么？
2. 系统由哪些组件构成，运行形态如何？
3. Windows / macOS 工作机上如何安装、运行、卸载？依赖与权限是什么？
4. 主体功能运行在 PC 本地还是云端？云端承担什么角色？
5. 维护状态、版本演进与社区反馈如何？

### 覆盖范围

产品调研（定位 / 用户 / 流程 / 边界 / 维护状态 / 版本演进 / 生态反馈）+ 技术架构调研（运行形态 / 依赖 / 接口 / 持久化 / 通信 / 部署）。

### 明确排除

不做源码审计、竞品比较、遥测调研、集成实施与性能 benchmark。云端网关仅简单提及，不深入其服务端实现。

## 证据口径

- **官方资料**：GitHub README、SETUP.md（自托管指南）、ARCHITECTURE.md（官方架构文档）、ROADMAP.md，均取自 main 分支 2026-07-30 快照；
- **仓库元数据**：GitHub API（stars / forks / 时间戳 / license / topics）；
- **社区反馈**：GitHub Issues 抽样（全部 21 条真实 issue + 近 30 条 issue/PR 混合列表），仅代表公开快照与样本范围；
- **架构推导**：明确标注；未运行验证的事项列入"未决项"。

## 产品调研

### 产品定位与目标用户

**一句话定位**：Human-in-loop 的实时对话式 AI Agent 任务管理平台——人类与 AI Agent 共享的任务工作区（官方描述："Human-in-loop realtime conversational task manager for AI Agents"）。

**目标用户**：使用 Claude Code、OpenAI Codex、Gemini CLI 等 CLI 型编码 Agent 的开发者/团队，希望以"任务看板 + 实时会话"的方式向 Agent 派工、监督 Agent 执行、审批敏感操作。

**解决的问题**：CLI Agent 缺少统一的任务队列、进度可视化和权限审批入口；AgentRQ 通过 MCP 把"工作区任务系统"暴露给 Agent，使其能自主拉取任务、更新状态、请求许可、回报结果。

### 核心流程

一条端到端典型流程（用户视角）：

1. 用户在 Web UI 创建工作区（含使命描述），获得该工作区专属 MCP URL 与 token；
2. 在本地项目目录放置 `.mcp.json`（指向工作区 MCP URL），启动 Claude Code；
3. 用户在 UI 创建任务并指派给 Agent；Agent 通过 MCP 通知实时收到任务，调用 `getTask` 出队；
4. Agent 执行工作：`updateTaskStatus(ongoing)` → 期间用 `reply` 回报进度、遇敏感操作发起权限请求（人类在 UI 中 allow/deny）→ 完成后 `reply` 最终结果并 `updateTaskStatus(completed)`；
5. 全程通过 SSE 实时同步到 UI，用户可在任务会话线程中随时对话介入。

### 功能地图与边界

- **工作区与任务管理**：工作区隔离、任务队列（notstarted/ongoing/blocked/completed 等状态）、排序、指派（human/agent）、附件；
- **实时会话**：任务级线程会话，human/agent/slack 三方消息，SSE 推送；
- **权限门控**：Agent 敏感工具调用需人类审批，支持 auto-allow 清单与 allow-all 开关；
- **定时任务**：cron 模板（最小小时粒度），调度器每 60s 轮询生成子任务；
- **跨工作区编排**：Supervisor（CoreMCP）全局管理多工作区；命名事件（publishEvent + EventTrigger）实现去中心化多 Agent 流水线与事件链；
- **生态接入**：Claude Code 插件、Gemini CLI 扩展、ACP Gateway（Gemini 等 ACP Agent 桥接）、Codex Gateway、Slack 集成、Web Push / PWA；
- **规划中（ROADMAP）**：AgentRQ CLI（脱离 Web UI 管理工作区/挂载 Agent）、Skills / MCP / Workflow 三类 Marketplace；Agent-to-Agent 协作工作流已标记实现。

### 维护状态与版本演进

- **活跃度**：仓库创建于 2026-03-24，最后提交 2026-07-16、最后 push 2026-07-19（距调研日约 11 天）；判定为**活跃维护中，但项目历史仅约 4 个月**。
- **版本演进**：无 GitHub Release；版本通过 commit 内 bump（近期 v0.3.12 → v0.3.15，2026-07-09/10 密集发布）与 Docker 镜像 `agentrq/agentrq:latest` 分发。近期方向性变化：反向代理子路径与 TLS 终止支持（v0.3.13）、移动端 STT、Web Push 订阅清理、Slack 样式修复——趋势是自托管适配与体验补齐。
- **公开快照**：1057 stars、76 forks、32 open issues、Apache-2.0 许可证；组织 agentrq 名下另有 claude-extension、gemini-extension 等配套仓库。以上数字仅描述快照，不等同采用率。

### 生态与反馈

**生态入口**：Claude Code 官方插件（marketplace 安装）、Gemini CLI 扩展、npm 包 `@agentrq/acp-gateway` 与 `@agentrq/codex-gateway`、Slack 集成、Supervisor MCP（`https://mcp.agentrq.com/mcp`，OAuth2）。

**反馈主题归纳**（样本：全部 21 条真实 issue，2026-06 至 2026-07）：

1. **可靠性/正确性类**（占比最高）：调度器 check-then-act 双生成与分钟漂移（open）、事件链无环/深度上限（open）、非原子任务出队与 MCP 状态写入未校验（open）、SQLite 连接池/WAL 与出队索引（closed）、无优雅停机与 goroutine 泄漏（closed）——反映项目仍在打磨工程基础；
2. **平台适配类**：Windows 下 Codex 网关启动命令与文档不一致（open，另有 workaround 文档 PR）；
3. **方向询问类**：公开 roadmap、多 Agent 协作路由、PWA 支持（后两者已落地）。

另观察到大量标题带 "🛡️ Sentinel" 的自动化安全加固 PR（JWT audience、OAuth CSRF、BOLA/IDOR 等）持续产出，其中 Slack OAuth CSRF 修复已合并，多数仍 open。**边界说明**：样本量小、时间窗口约 2 个月，不能外推为整体质量结论。

## 技术架构调研

### 系统全貌与运行形态

AgentRQ 是**单进程 Go 服务端 + 内嵌 Web 前端**的一体化 Web 应用（官方称解耦的面向服务架构，但部署上为单容器单端口）：

- **后端**：Go / Fiber，统一 HTTP 端口同时承载 REST API、MCP 服务（mcp-go，Streamable HTTP/SSE）、SSE 事件流与静态前端；
- **前端**：Vue 3 / Vite / Pinia / Tailwind，SPA + PWA，经 SSE 与后端状态同步；
- **两级 MCP 服务**：CoreMCP（Supervisor，OAuth2 用户级，跨工作区）+ 每工作区一个懒创建的 WorkspaceServer（工作区 token 认证，严格隔离）；
- **数据层**：GORM + SQLite（默认）或 PostgreSQL（生产可选）。

各组成部分打包在同一进程/容器内，不可独立部署（PostgreSQL 除外）。

### 主要组件与核心链路

| 组件 | 职责 | 运行位置 |
| --- | --- | --- |
| REST API（/api/v1） | 人类 UI 的工作区/任务/消息/权限操作 | 服务端进程内 |
| CoreMCP（/mcp） | Supervisor Agent 跨工作区编排入口 | 服务端进程内 |
| Per-Workspace MCP（/mcp/{id} 或 {id}.mcp.{domain}） | Worker Agent 的任务工具面（getTask/reply/updateTaskStatus 等 7 个工具） | 服务端进程内 |
| EventBus（SSE）+ 内部 PubSub + Central Forwarder | 实时事件分发：CRUD 事件 → SSE 推送 UI；MCP 通知推送 Agent | 服务端进程内（内存态） |
| Scheduler / Event Consumer / Cleanup | cron 任务生成、事件扇出建任务、附件清理 | 服务端进程内后台服务 |
| Repository（GORM） | SQLite / PostgreSQL 持久化，控制器不直接触库 | 服务端进程内 |
| AI Agent（Claude Code / Codex / Gemini CLI + 网关） | 实际执行工作，经 MCP 连接工作区 | **用户 PC 本地** |

**核心链路 1 — Agent 任务执行环**：Agent `getTask()` 出队 → `updateTaskStatus(ongoing)` → 工作中多次 `reply` → `updateTaskStatus(completed)`；每步 MCP 服务端持久化消息并发 SSE 事件，人类在 UI 实时跟进。跨越"Agent 进程 ↔ AgentRQ 服务端"一条 HTTP(S) 网络边界。

**核心链路 2 — 权限门控**：Agent 敏感调用 → MCP notification（permission_request）→ 命中 auto-allow 则自动批准，否则落库为消息并 SSE 推给人类 → 人类 REST 提交 allow/deny/allow_always → MCP notification 回送 Agent。该链路是产品 Human-in-loop 价值的技术支点。

**核心链路 3 — 跨工作区事件**：Agent `publishEvent(name, payload)` → PubSub → Event Consumer 查询 EventTrigger 订阅 → 在目标工作区模板化建任务（可经 EmitEventID 链式触发下一事件），实现无 Supervisor 的多 Agent 流水线。已知约束：事件链当前无环/深度上限（open issue）。

### 主要依赖

- **自托管运行时**：Docker（官方声明"唯一运行时依赖"）；容器内自带全部组件；
- **认证**：Google OAuth2 凭据（Client ID/Secret，环境变量参考表标记为必填）；JWT secret 与 32 字节工作区 token 加密密钥需自备；
- **源码开发**：Go 1.21+、Node.js 18+；
- **可选**：PostgreSQL（生产库）、SMTP、Slack 凭据、VAPID 密钥（Web Push）、Cloudflare API token（泛域名证书）。

### 接口形态

- **REST API**（/api/v1）：人类 UI 与外部系统操作入口，JWT 会话认证；
- **MCP over HTTP/SSE**：Agent 侧唯一操作面；CoreMCP 17 个全局工具，工作区级 7 个工具；Agent 无任何直接数据库访问；
- **SSE 事件流**（GET /workspaces/{id}/events）：UI 实时订阅；
- **MCP notifications**（notifications/claude/channel）：任务指派与权限裁决实时推送 Agent；非 Claude Agent 经 ACP/Codex Gateway 桥接获得同等能力。

不穷举端点，以上为系统边界上的全部接口类型。

### 持久化方式

- **主数据**：SQLite 单文件（默认，`_storage/agentrq.db`）或外部 PostgreSQL（生产推荐）；schema 启动时自动迁移；
- **附件**：无论选择哪种数据库，均以 base64 文件形式存于 `_storage/` 目录（备份该目录即可）；
- **敏感数据**：工作区 MCP token 以 AES-256-GCM 加密落库，密钥来自环境变量（更换密钥将导致既有 token 全部失效）；
- **数据所有权**：自托管模式下全部数据在本地磁盘挂载卷中，归用户所有。

### 通信方式

- 人类 UI ↔ 服务端：REST（命令）+ SSE 长连接（状态推送），浏览器内实时更新；
- Agent ↔ 服务端：MCP Streamable HTTP（工具调用，同步）+ MCP notification（任务/权限推送，异步）；
- 服务端内部：内存 PubSub（CRUD/MCP/Events 三主题）+ EventBus（工作区/用户维度 SSE 扇出），Central Forwarder 桥接两者；慢消费者直接丢弃（非阻塞发送）；
- 调度类工作：Scheduler 60s 轮询（cron）；遥测批量 5s 落库（存在即述，未展开调研）。

### 部署形态

官方支持的部署方式分三条路径：

1. **官方托管云**（agentrq.com）：注册即用，工作区 MCP URL 形如 `https://{WORKSPACE_ID}.mcp.agentrq.com/`——服务端主体在云端；
2. **Docker 自托管**（SETUP.md，推荐自托管方式）：单容器，本地 `localhost:2026` 或生产域名 + 内置 Let's Encrypt TLS；
3. **源码开发运行**（Makefile：`make install && make dev`，Go + Node）：定位为开发模式，非终端用户安装路径。

#### 工作机安装（Windows / macOS）

- **Windows 安装方式与入口**：安装 Docker Desktop for Windows → `docker pull agentrq/agentrq:latest` → 编写 `.env`（JWT secret、32 字节 token key、Google OAuth2 凭据、SQLite 开关等）→ `docker run -d -p 2026:2026 --env-file .env -v ./_storage:/_storage agentrq/agentrq:latest` → 浏览器打开 `http://localhost:2026`。官方文档未提供 Windows 专属说明，命令为跨平台 Docker CLI；已知摩擦点：Codex 网关在 Windows 的启动命令与文档不一致（open issue #（2026-06-24），另有 workaround 文档 PR 未合并）。
- **macOS 安装方式与入口**：与 Windows 相同（Docker Desktop for Mac + 同一组命令）；SETUP.md 验证步骤明确给出 macOS 命令（`open http://localhost:2026`）。
- **Agent 侧配套安装**：Claude Code 插件（`/plugin marketplace add ...`）、`npm install -g @agentrq/acp-gateway` / `@agentrq/codex-gateway`（Node 18+，跨平台）、项目内 `.mcp.json` / `.claude/settings.local.json` / `.codex/config.toml` 配置文件。
- **依赖、权限与网络要求**：Docker Desktop（Win 侧隐含 WSL2/虚拟化权限）；`_storage` 目录写权限（文档示例 `chmod 0777`）；本地模式无需入站公网端口；出站需可达 Google OAuth2（认证）及可选的 push 服务（Google/Apple/Mozilla）；root login（`AGENTRQ_AUTH_ROOT_LOGIN_ENABLED`）可作初始化直登通道，官方建议首次使用后禁用。
- **卸载方式**：`docker stop agentrq && docker rm agentrq` + 删除镜像与本地 `_storage/`（含数据库与附件）、`.env` 即完全清除；升级为 rm 容器 → pull 新镜像 → 重新 run。
- **无原生桌面应用**：不存在 .exe / .dmg 安装包；"桌面体验"由浏览器 PWA（可安装、Web Push 通知）承担。

#### 主体功能运行位置

- **自托管路径**：AgentRQ 服务端（任务系统、MCP 服务、数据）+ AI Agent（CLI）全部运行在工作 PC 本地，云端不参与业务数据流——**主体在 PC 本地，符合要求**；
- **托管云路径**：服务端主体在 agentrq.com 云端，PC 上仅运行 Agent CLI 与浏览器——按本次调研约束**判定为不符合要求**；
- 结论：**产品是否符合取决于选择自托管部署**；自托管是官方一等公民路径（专门的 SETUP.md、Docker 镜像、反向代理/TLS 支持持续迭代），非社区旁路。

#### 云端网关（如存在）

自托管模式下云端仅承担辅助角色，简述如下（不展开）：Google OAuth2 负责用户认证回调；Web Push 经浏览器厂商 push 服务转发（未配置 VAPID 时静默禁用）；生产 TLS 依赖 Let's Encrypt 签发。均不承载任务数据与业务逻辑。

## 补充专项调研：纯本地 / SQLite / 非 Docker / 打包形态（2026-07-31）

> 证据口径：GitHub main 分支实时抓取的 10 份一手文件（见文头 evidence_window）。标注：【已确认】= 源码/官方文档直接证据；【推导】= 合理推导；【未决】= 需运行验证。

### 纯本地无云端：代码级成立

- 【已确认】`config.go` 只做 YAML 加载 + 环境变量展开，无任何必填校验；`main.go` 仅在 YAML 解析失败时 fatal，OAuth 凭据为空串照常启动——SETUP.md 的 "Required" 是文档口径，不是代码约束。
- 【已确认】`api.go` 的 `rootLogin()` 完全自洽：常数时间比较 `AGENTRQ_AUTH_ROOT_ACCESS_TOKEN` → 本地建用户 `root@agentrq.local` → 签发 24h JWT cookie，全程零外部网络调用。
- 【新发现，已确认】存在 GitHub OAuth 第二通道（`auth/github.go` + `/github/login` 路由），前端按 `clientId != ""` 动态显隐登录按钮——OAuth 为插拔式设计。
- 【已确认】`model.Telemetry` 是本地数据库表（UserID/Action/Actor），本次抓取范围内未发现云端上报代码路径。

全部出站外联点及关闭开关：

| 外联点 | 默认 | 纯本地关闭方式 |
| --- | --- | --- |
| Google/GitHub OAuth | 空凭据 | 不配置，改用 root login【已确认】 |
| SMTP | base.yaml 默认为 `true`（陷阱，host 为空） | 显式 `AGENTRQ_SMTP_ENABLED=false`【已确认】 |
| Slack | false | 保持 false【已确认】 |
| Web Push | 未配 VAPID 时静默禁用 | 不配 VAPID【已确认】 |
| Let's Encrypt / Cloudflare | SSL false | 保持 false，走 http://localhost【已确认】 |

**安全注意**：base.yaml 弱默认值必须更换——root token 默认 `agentrq`、JWT secret 默认 `agentrq-secret-change-me`、workspace token key 默认弱值【已确认】；监听地址仅配 `PORT`，【推导】绑定全接口 `0.0.0.0`，工作机需防火墙拦入站或二开改绑 `127.0.0.1`（是否有隐藏配置【未决】）。

### SQLite 专项：默认且加固过

- 【已确认】`AGENTRQ_SQLITE_ENABLED` 默认 `true`，单文件 `_storage/agentrq.db`，schema 启动自动迁移；备份 = 拷贝 `_storage/` 目录（数据库与附件同目录）。
- 【已确认】`sqlite.go` 自动为 DSN 追加 `_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)`（尊重操作者显式配置、跳过内存库）——WAL 读写并发 + 写冲突等待而非报错，对应早期连接池/WAL issue 的修复，SQLite 路径是被认真维护的一等公民。

### 非 Docker 原生方案（Windows / macOS）

**决定性证据**【已确认】：Dockerfile 中 `CGO_ENABLED=0`，注释明言 "Using CGO_ENABLED=0 since we are using the pure Go SQLite driver"；go.mod 直接依赖 `glebarez/sqlite`（纯 Go，底层 modernc.org/sqlite）。Windows 原生构建**不需要 gcc/MinGW**。

构建链（复刻 Dockerfile 多阶段构建，去掉容器）：

1. 前端：`cd frontend && npm install && npm run build` → `dist/`（Node 18+）；
2. 后端：`cd backend/cmd/server && CGO_ENABLED=0 go build -ldflags="-w -s" -o agentrq main.go`（Go 1.25；Win 产出 `.exe`）；
3. 组装单目录（名字与层级不能变）：

```
agentrq/
├── agentrq(.exe)           # go build 产物
├── _config/
│   ├── base.yaml           # 从仓库 backend/cmd/server/_config/ 原样拷来
│   ├── development.yaml    # 空文件，但必须存在
│   └── production.yaml     # 空文件，但必须存在
├── public/                 # ← 前端 dist 拷入后必须改名为 public
└── _storage/               # 建议预先创建
```

三个坑（均有源码依据）：① dist 必须改名 `public/`【已确认，Dockerfile 拷贝目标】；② `config.go` 先读 `_config/base.yaml` 再按 `ENV` 读 `_config/<env>.yaml`，**任一缺失直接 fatal**【已确认】；③ 全部路径相对工作目录，必须 `cd` 进该目录启动（CWD 敏感）【已确认】。

最小启动环境变量（base.yaml 全是带默认值的占位符，纯本地只需覆盖）：

```bash
ENV=production PORT=2026 AGENTRQ_BASE_URL=http://localhost:2026 \
AGENTRQ_AUTH_JWT_SECRET='32位以上随机串' \
AGENTRQ_AUTH_WORKSPACE_TOKEN_KEY='恰好32字节随机串' \
AGENTRQ_AUTH_ROOT_LOGIN_ENABLED=true \
AGENTRQ_AUTH_ROOT_ACCESS_TOKEN='强口令' \
AGENTRQ_SMTP_ENABLED=false \
./agentrq
```

注意：原生运行**不会自动读 `.env`**（那是 Docker `--env-file` 语义）【推导】，需由启动脚本/启动器注入。

平台差异：

| 事项 | macOS | Windows |
| --- | --- | --- |
| 构建工具链 | Go + Node 直接可用 | 同左，无需 C 编译器【已确认】 |
| Makefile | 可用（dev 为前后端分离热更模式） | 不可用——`lsof`/`pkill`/`until` 均为 Unix 命令【已确认】，需等价 PowerShell 脚本 |
| 停机 | SIGINT/SIGTERM 优雅停机【已确认】 | Ctrl+C 可用，服务化停止语义【未决】 |
| MCP 连接 | 【已确认】存在路径式 `/mcp/{id}` 与子域式两种路由，纯本地用路径式即可绕开 `*.mcp.localhost` 子域解析问题（mac 默认不解析 localhost 子域）【推导+未决】 | 同左（Win10+ 可解析 localhost 子域） |
| 升级 | 无 Release/tag，`git pull` + 重建，自行钉 commit【已确认】 | 同左 |

### 打包形态评估

关键澄清：**生产形态是"单进程单入口"，但不是"单文件"**——前端 dist 未编入 Go 二进制，由后端进程运行时从磁盘 `./public` 伺服【已确认，Dockerfile 中二进制与 public 目录分开 COPY】。

| 目标形态 | 可行性 | 二开量 |
| --- | --- | --- |
| 单目录（二进制 + public + _config + _storage） | ✅ | 零改动，推荐起步形态 |
| Windows 单 exe | ✅ | 轻量二开：`go:embed` 内嵌 `public/` 与 `base.yaml`（改 `config.go` 读取 + 静态伺服两处）；`_storage/` 必须外置 |
| macOS 单 .app | ✅ | 不动 Go 代码：.app 壳内放单二进制 + launcher 脚本（设数据目录 CWD + 起服务 + 开浏览器）；本机自建无需签名公证 |

落地次序建议：先单目录（零二开）人工验证跑通任务环 → 再做 go:embed 单二进制（一次二开服务 Win 单 exe 与 Mac .app 双目标）→ .app 壳最后做（纯打包工序）。注意【推导+未决】：附件目录 `_storage` 路径疑似硬编码相对 CWD，做单文件形态时应顺手改为相对可执行文件目录或可配置。

### 任务关系数据结构（model.go 实测，服务 GLNT-10 核心目标）

- **`Task`** 内置三个关系字段：`ParentID`（cron 父子）、`TriggerID`（本任务由哪个事件触发）、`EventID`（本任务完成时发射哪个事件）；`Status` 枚举含现成的 `blocked` 与 `cron` 态【已确认】。
- **`Event`**（用户域内唯一命名 + PayloadGuidelines）与 **`EventTrigger`**（事件 → 目标工作区模板建任务，`EmitEventID` 链式续接，可带 `CronSchedule`）构成现成的任务间关系机制【已确认】。
- 出队走 `idx_tasks_dequeue(workspace_id, user_id, status)` 复合索引的 `ClaimNextTask`【已确认】——**依赖门控的天然二开落点**：增加 `TaskDependency` 边表，在出队查询处过滤"前置未 completed 则不可领取/置 blocked"，改动集中在 repository 层。

### 人工验证清单（按项目公约由 Human 执行）

1. mac 走通全链路：前端 build → `go build` → 组装单目录 → root login → 建任务 → publishEvent → EventTrigger 生成后继任务（全程断网验证）；
2. Windows 重复同流程（PowerShell 替代 Makefile），并验证 Claude Code 经路径式 `/mcp/{id}` 正常连接；
3. 确认监听地址能否绑 loopback；确认原生进程优雅停机行为；确认 `_storage` 路径硬编码位置；
4. 复核三个工程债 open issue（非原子出队、调度器双生成、事件链无环上限）在当前 main 的状态。

## 未决项与证据边界

1. **未运行验证**：本次调研未实际拉起 Docker 容器或原生二进制验证安装流程与 Windows 兼容性；SETUP.md 命令为官方声明，标记为"官方文档证据 + 未运行验证"。
2. ~~Google OAuth2 是否严格必填~~ **（已解决，2026-07-31）**：源码级证实非必填——`config.go` 无必填校验，root login 自洽零外联；另发现 GitHub OAuth 第二通道。运行验证仍建议（见补充章节"人工验证清单"）。
3. ~~Windows 下 Docker Desktop 之外的运行方式~~ **（已解决，2026-07-31）**：源码级证实原生构建可行且无 CGO 依赖（`CGO_ENABLED=0` + 纯 Go SQLite 驱动），方案见补充章节；实机运行验证仍未做。
4. **代号 v0.3.x 的稳定性承诺**：无正式 Release 与语义化版本保证，`latest` 镜像滚动更新，升级兼容性未决。
5. **开放的可靠性 issue**（调度器双生成、非原子出队、事件链无上限）是否影响生产使用，取决于使用规模，需实测。

## 后续验证建议

1. 在目标 Mac / Windows 工作机上按 SETUP.md 实际部署一次，验证：仅 root login（不配 Google OAuth）能否完成建工作区 → 连接 Claude Code → 跑通任务环；
2. Windows 机器上验证 `@agentrq/codex-gateway` 启动 workaround（参照 open PR 文档）；
3. 若拟团队使用，评估 PostgreSQL 模式与升级策略（固定镜像 digest 替代 latest）；
4. 关注调度器与事件链相关 open issue 的修复进展后再承载关键定时/流水线工作流。
