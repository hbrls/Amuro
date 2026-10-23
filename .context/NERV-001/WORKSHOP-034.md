# OpenClaw Mission Control 技术产品调研

> updated_by: Codex - GPT-5
> updated_at: 2026-07-31 00:18:21
> evidence_window: 调研日期 2026-07-31；GitHub `master` 分支 HEAD `75eb8b08`（提交于 2026-04-04）；仓库 API、官方 README、部署文档、配置样例、安装器与公开 Issue 快照

## 交付结论

1. **OpenClaw Mission Control 是自托管的 OpenClaw 运营与治理控制平面，不是 Agent Runtime，也不是原生桌面应用。** 它通过浏览器 UI 和 HTTP API 管理组织、Board、任务、Agent、审批、Gateway、活动记录与 webhook；真正启动、唤醒和承载 Agent 工作的是另行部署的 OpenClaw Gateway。
2. **Mission Control 自身的主体可完整运行在工作 PC 本地。** 官方 Docker Compose 会在本机启动 Next.js 前端、FastAPI 后端、PostgreSQL、Redis 和 RQ worker；默认 `local` 认证不要求 Clerk 或其他云端账号。数据库和控制面状态保存在本地 Docker volume。由此看，它不是“浏览器壳 + 云端主体”的 SaaS。
3. **完整 Agent 工作链路是“本地 Mission Control + 本地或远端 OpenClaw Gateway”。** Mission Control 不捆绑 Gateway，也不直接执行 Agent；没有 Gateway 时，仍可使用控制面对象和 UI，但无法完成 Agent provisioning、wake、heartbeat、session messaging 等核心执行闭环。若 Gateway 同样放在工作 PC，本地化路径成立；若连接远端 Gateway，执行主体相应位于远端。
4. **macOS 有官方稳定安装路径，但推荐 Docker 模式。** 官方支持矩阵将 macOS + Homebrew 标为 Stable；Docker 模式需要 Docker Desktop，启动后使用浏览器访问 `localhost:3000`。产品没有 `.dmg`、`.pkg`、菜单栏应用或原生桌面生命周期，实际形态仍是源码 checkout 加本地 Web 服务。
5. **Windows 当前不符合官方支持要求。** 安装器只接受 Darwin 或 Linux，支持矩阵没有 Windows，仓库也没有 MSI/EXE/PowerShell 安装器。Docker Compose 在 Windows Docker Desktop 上技术上可能运行，但官方没有声明、测试或故障处理路径，不能视为受支持安装。通过 WSL 运行属于 Linux 路径，也不能包装为 Windows 原生支持。
6. **因此，若准入条件要求同时正式支持 Windows 和 macOS，当前应判定为不符合；若工作机固定为 macOS 且团队已有 OpenClaw Gateway，则可进入小范围验证。** 它更适合有 Docker、数据库和网络运维能力的平台/工程团队，不适合寻找开箱即用桌面 Agent 产品的普通终端用户。
7. **macOS 本机源码模式存在明显的完整性缺口。** `install.sh` 的 local 模式只自动启动后端和前端；官方部署文档又明确说明 RQ worker 对 Gateway 生命周期和 webhook 投递是必需的，而后台队列默认还依赖 `redis://localhost:6379/0`。安装器没有在 local 模式启动 Redis 或 worker，因此不能把该模式视为完整的一键生产路径，操作者需自行补齐 Redis、RQ worker 和 launchd 配置。
8. **数据持久化和备份边界清晰，但卸载与升级仍偏源码项目。** Compose 的 PostgreSQL 数据存于 `postgres_data` named volume；普通 `down` 保留数据，`down -v` 会删除数据库。升级依赖拉取 `master` 后重建容器，仓库没有 tag、GitHub Release 或正式版本资产，也没有官方卸载器。
9. **安全基线有积极措施，但默认部署仍需加固。** 容器以非 root 用户运行，后端提供安全响应头、敏感接口限流、webhook HMAC 和载荷上限；另一方面，默认数据库密码是 `postgres`，前后端端口默认绑定所有主机接口，Gateway token 当前会出现在 API 响应中，并允许关闭 Gateway TLS 证书验证。远程访问前必须更换凭据、限制监听范围、启用 TLS 与反向代理，并避免开启自签名证书豁免。
10. **项目热度高但发布成熟度和近期维护连续性不足。** 2026-07-30 快照约有 4,102 Stars、826 Forks、86 个 open issues，但没有 tag 或 Release；`master` 最近提交停在 2026-04-04。公开 Issue 样本涉及前端启动超时、Windows 环境提示不适配、Gateway 消息发送失败、配置版本不兼容和意外批量 provisioning。适合验证，不宜在没有固定 commit、回滚、恢复演练和 Gateway 兼容性测试时直接承载关键生产流程。

## 调研目标、范围与边界

### 调研目标

理解 OpenClaw Mission Control 的产品定位、运行边界和部署成熟度，并重点回答：

1. 它是桌面 Agent 产品、Agent Runtime，还是 Web 控制平面？
2. Windows 与 macOS 工作机如何安装、运行、升级和卸载？
3. 主体功能运行在 PC 本地还是云端？
4. Mission Control、数据库、队列、浏览器与 OpenClaw Gateway 如何协作？
5. 当前维护、版本、许可、安全和公开反馈是否支持工作机部署？

### 覆盖范围

- 产品定位、目标用户、核心流程和功能边界。
- `master` 分支的 README、安装器、Compose、配置样例和部署/运维文档。
- Windows/macOS 工作机安装、运行入口、依赖、权限、升级和卸载。
- 前端、后端、PostgreSQL、Redis/RQ、Gateway 的系统边界和核心链路。
- GitHub 仓库元数据、提交、许可证和近期公开 Issue 样本。

### 明确排除

- 不进行逐文件源码审计、接口枚举或数据库 schema 盘点。
- 不进行竞品比较、选型排名或性能 benchmark。
- 不调研遥测、监控、指标和运营分析实现。
- 不安装依赖，不执行安装器，不启动容器或 OpenClaw Gateway。
- Linux 不作为本次工作 PC 的合格路径。

## 证据口径

- **直接事实**：来自 [仓库](https://github.com/abhi1693/openclaw-mission-control)、[README](https://github.com/abhi1693/openclaw-mission-control/blob/master/README.md)、[安装支持矩阵](https://github.com/abhi1693/openclaw-mission-control/blob/master/docs/installer-support.md)、[Compose](https://github.com/abhi1693/openclaw-mission-control/blob/master/compose.yml) 和官方文档。
- **定点源码证据**：只读取安装器、Dockerfile、运行依赖元数据和配置样例，以验证平台判断、进程组成、权限和队列依赖，不评价通用代码质量。
- **架构推导**：用于解释控制面与 Gateway 执行面的关系；本次没有实际连接 Gateway 或抓取运行流量。
- **公开反馈**：只把少量 Issue 当作风险主题样本，不从 Issue 数量或个案推导整体故障率。
- **维护快照**：Stars、Forks、open issues 和更新时间会持续变化；本报告只代表 2026-07-31 快照。
- **“未发现”边界**：未发现 Windows 支持、安装包、tag、Release 和卸载器，不等于未来不会提供，只说明当前公开证据不足。

## 产品调研

### 产品定位与目标用户

**一句话定位**：OpenClaw Mission Control 是一个自托管、API-first 的 OpenClaw 多团队运营与治理控制平面，把任务编排、Agent 生命周期、审批、Gateway 管理和活动审计放到同一套 Web 系统中。

目标用户包括：

- 在内部或自托管环境运行多个 OpenClaw Gateway 的平台团队。
- 需要用 Board、任务、标签和组织层级管理多 Agent 工作的工程团队。
- 需要人工审批、活动历史和责任边界的运营或治理人员。
- 希望用 HTTP API 和 webhook 将内部流程接入 Agent 编排的自动化团队。
- 能够自行管理 Docker、PostgreSQL、Redis、反向代理和凭据的技术操作者。

它不是：

- 捆绑模型和 Agent Runtime 的一体化桌面应用。
- 安装后即可在本机直接执行 Agent 的单机工具。
- 由官方托管主体能力的纯云端 SaaS。
- 已提供稳定版本、桌面安装包和自动更新的终端产品。

### 核心流程

#### 安装与进入控制台

1. 操作者克隆仓库或执行官方 `install.sh`。
2. 选择 Docker 或 local 模式，并配置前端/后端端口、公开地址和认证 token。
3. Docker 模式构建并启动数据库、Redis、后端、前端和 worker。
4. 浏览器打开 `http://localhost:3000`，使用共享 bearer token 登录。
5. 后端通过 `http://localhost:8000/api/v1/*` 提供统一业务 API。

#### 组织工作与接入 Gateway

1. 用户建立组织、Board Group、Board、任务和标签。
2. 在 Settings 中登记 Gateway WebSocket URL、token、Workspace Root 和 TLS 策略。
3. Mission Control 通过 `ws://` 或 `wss://` 调用 Gateway，进行 Agent provisioning、配置同步、wake 和 session messaging。
4. Gateway 中的 Agent 使用 `X-Agent-Token` 回调 Mission Control API，发送 heartbeat、状态和工作结果。
5. Redis/RQ worker 异步处理生命周期 reconcile、延迟检查和 webhook 投递。
6. 用户在 UI 中观察 Agent、任务、审批和活动记录，并对敏感动作作出审批。

#### 失败与恢复

1. Agent 被唤醒后需要在 30 秒内 heartbeat。
2. Mission Control 最多进行三次 wake 尝试。
3. 仍未 check-in 时，Agent 标记为 offline，并记录 provisioning error。
4. 操作者检查 Gateway、worker、Redis、token、`BASE_URL` 和网络可达性，再同步模板或重新 provisioning。

### 功能地图与边界

| 功能域 | 当前能力 | 主要边界 |
| --- | --- | --- |
| 工作管理 | 组织、Board Group、Board、任务、标签 | 是控制面对象，不直接完成 Agent 推理或工具执行 |
| Agent 运维 | 创建、查看、provision、wake、状态和 heartbeat | 执行依赖外部 OpenClaw Gateway |
| 治理 | 审批流、认证模式、活动历史 | 公开材料未提供完整企业合规认证或审计保留承诺 |
| Gateway | 多 Gateway 配置、WebSocket、token、Workspace Root | Gateway 不在本仓库内，版本和配置兼容需单独管理 |
| 自动化 | HTTP API、agent token、webhook、RQ worker | Redis/worker 停止会影响异步生命周期和投递 |
| 访问入口 | 响应式 Web UI 与 API | 没有原生桌面安装包、托盘、系统通知或自动更新 |
| 认证 | 本地共享 bearer token或 Clerk JWT | local 模式更简单，但共享 token 不等同于细粒度个人身份 |
| 数据 | PostgreSQL + named volume | 备份、恢复、保留和迁移需要操作者负责 |

### 维护状态与版本演进

#### 仓库快照

- 创建于 2026-02-01，默认分支为受保护的 `master`。
- 主要语言为 TypeScript，后端为 Python/FastAPI。
- 许可证为 MIT，版权主体写作 “OpenClaw Mission Control”。
- 2026-07-30 API 快照约 4,102 Stars、826 Forks、86 个 open issues，仓库未归档。
- 没有 Git tag、GitHub Release 或启用的 Discussions。
- `master` HEAD 为 `75eb8b08`，提交日期 2026-04-04；仓库 `pushed_at` 为 2026-04-06。

#### 方向性演进

- 2026 年 2 月建立 Mission Control 的 Board、Agent、Gateway 和 API 基础。
- 2026 年 3 月集中加入安全加固、Redis 限流、webhook HMAC、非 root 容器、移动端布局和部署文档。
- 2026-03-10 合并 macOS 支持，并补充 launchd 与 token re-sync 说明。
- 2026 年 3 月后半继续修复 onboarding、任务分配与 Agent wake 行为。
- 最新 `master` 修复集中在 Gateway offline 和主机操作系统参数，说明 Gateway 兼容与生命周期仍在迭代。

仓库 README 将项目标为 “under active development”，并明确提示功能和 API 可能跨版本变化。由于没有正式版本锚点，部署者只能自行固定 commit 或镜像摘要。

### 生态与公开反馈

官方生态入口主要是：

- GitHub Issues 与 Pull Requests。
- README 中的 Slack 邀请。
- HTTP API、webhook 和 Gateway WebSocket 接入面。
- OpenClaw Gateway 及其 Agent workspace/template 机制。

近期 Issue 样本反映的主题包括：

- [#329 Frontend times out](https://github.com/abhi1693/openclaw-mission-control/issues/329)：报告 Docker 和 local 模式均出现前端启动等待超时。
- [#330 Mission Control messaging error OpenClaw](https://github.com/abhi1693/openclaw-mission-control/issues/330)：Windows 用户遇到 `gateway_send_failed`，同时界面给出 `chmod 600` 这类 Unix 权限提示，显示 Windows 使用路径缺少适配。
- [#333 broadcast 自动批量 provisioning](https://github.com/abhi1693/openclaw-mission-control/issues/333)：报告一次广播在多个 Board 上产生非预期 Agent 创建和后续 401 重试，提示操作副作用需要谨慎验证。
- [#334 Gateway provisioning 配置校验失败](https://github.com/abhi1693/openclaw-mission-control/issues/334)：报告 OpenClaw 配置 schema 变化后 Agent 卡在 PROVISION，另有用户确认同类现象。

这些样本只证明公开用户遇到过安装和 Gateway 兼容问题，不能据此计算普遍故障率。样本在本次快照中仍为 open，未观察到足够的正式版本修复闭环。

## 技术架构调研

### 系统全貌与运行形态

| 组件 | 默认运行位置 | 主要职责 |
| --- | --- | --- |
| 浏览器 | Windows/macOS 工作机 | 显示 Mission Control UI，向后端发起 API 请求 |
| Next.js 前端 | 工作机 Docker 或本地 Node 进程 | 控制台、Board、任务、Agent、审批和配置界面 |
| FastAPI 后端 | 工作机 Docker 或本地 Python 进程 | 业务 API、认证、Gateway 协调、状态与活动管理 |
| PostgreSQL 16 | 工作机 Docker 或外部数据库 | 持久化组织、Board、任务、Agent、Gateway、审批等控制面状态 |
| Redis 7 | 工作机 Docker 或外部 Redis | RQ 队列和可选共享限流状态 |
| RQ worker | 工作机 Docker 或本地独立进程 | Gateway 生命周期 reconcile、wake/check-in 延迟任务与 webhook 投递 |
| OpenClaw Gateway | 同一工作机、局域网或远端主机 | 承载 OpenClaw Agent、workspace、session 和真实执行环境 |
| 可选 Clerk | 云端 | 多用户 JWT 身份认证；local 模式不需要 |

Mission Control 的仓库只包含控制面，不包含 Gateway 或模型推理服务。外部模型如何调用由 OpenClaw Gateway 负责，不属于本系统的本地服务栈。

### 主体功能运行位置判定

**判定：Mission Control 控制面符合 PC 本地运行要求；完整 Agent 执行能力有条件符合。**

在 Docker Compose 模式下，以下部分位于工作 PC：

- 前端与后端服务。
- PostgreSQL 数据库和 Redis 队列。
- RQ worker、认证配置和业务状态。
- 浏览器 UI 与本地 API。

不由 Mission Control 自身提供的部分：

- OpenClaw Gateway 和 Agent 进程。
- Agent workspace 中的文件和工具执行。
- 模型推理及模型 Provider。

若 Gateway 也运行在本机，控制面和执行面都可落在工作 PC；若 Gateway 是局域网或远端服务，Agent 主体工作就不在当前 PC。官方不要求必选云端 Gateway，也没有证据显示 local auth 模式必须连接 Mission Control 云服务。

### 主要组件与核心链路

#### 用户操作链路

1. 浏览器加载本地 Next.js UI。
2. UI 使用 bearer token 或 Clerk JWT 调用 FastAPI。
3. FastAPI 读取/更新 PostgreSQL 中的控制面状态。
4. 状态和活动返回 UI；涉及异步动作时任务进入 Redis/RQ。

#### Agent provisioning 与状态链路

1. 操作者在 UI/API 创建或更新 Gateway/Agent。
2. 后端通过 WebSocket 连接 Gateway，并发送配置、模板、provision 或 wake 指令。
3. worker 安排延迟 reconcile，检查 Agent 是否在期限内 heartbeat。
4. Agent 使用独立 token 调用 Mission Control API check-in。
5. 后端更新 `last_seen_at`、状态和错误信息，UI 展示结果。

#### Webhook 链路

1. 外部系统调用 Mission Control webhook ingest API。
2. 后端校验可选 HMAC、请求大小和限流。
3. 任务进入 Redis/RQ，由 worker 投递或触发相关 Agent 工作。
4. worker 不运行时，异步投递与 Gateway 生命周期不会完整执行。

### 主要依赖

#### Docker 模式

- Docker Engine / Docker Desktop。
- Docker Compose v2；watch 模式要求 Compose 2.22.0+。
- 可访问 Docker Hub 和构建依赖源的网络。
- 主机端口默认 3000、8000、5432、6379。
- 至少 50 字符的 `LOCAL_AUTH_TOKEN`，或 Clerk 配置。
- 要使用 Agent 能力，还需可达且版本兼容的 OpenClaw Gateway；后端样例声明最低 Gateway 版本 `2026.02.9`。

#### macOS local 模式

- Homebrew。
- curl、Git、Make、OpenSSL。
- `uv` 和由其管理的 Python 3.12。
- Node.js 22+ 与 npm。
- Docker PostgreSQL 或外部 PostgreSQL。
- Redis 和持续运行的 RQ worker，需要操作者自行补齐。

### 接口形态

- **Web UI**：浏览器访问默认 3000 端口。
- **HTTP API**：FastAPI 的 `/api/v1/*`，默认 8000 端口。
- **健康检查**：`/healthz` 和 `/readyz`。
- **Gateway WebSocket**：支持 `ws://` 与 `wss://`，用于控制 Gateway session 和生命周期。
- **Agent HTTP 回调**：Agent 通过 `X-Agent-Token` 或 bearer fallback 向 Mission Control heartbeat 和提交状态。
- **Webhook**：接收外部事件并通过 RQ 异步处理。
- **PostgreSQL/Redis 协议**：后端与本地或外部状态服务通信。

### 持久化方式

| 数据 | 默认介质 | 运维含义 |
| --- | --- | --- |
| 控制面业务状态 | PostgreSQL | Compose 使用 `postgres_data` named volume |
| 队列任务 | Redis | 主要用于异步处理，不应把它当作业务事实的唯一长期存储 |
| 环境与凭据 | 根目录、backend、frontend 的 `.env` | 需要限制文件权限并纳入密钥管理 |
| 本地构建产物 | Docker image 或源码目录中的 `.venv`、`node_modules`、`.next` | 升级和卸载需人工清理 |
| local 模式日志/PID | `~/.local/state/openclaw-mission-control-install` | 安装器只记录前后端 PID 和日志 |
| Agent workspace | Gateway 配置的 Workspace Root | 不属于 Mission Control 数据库，由 Gateway 所在主机拥有 |

[部署文档](https://github.com/abhi1693/openclaw-mission-control/blob/master/docs/deployment/README.md)明确：

- `docker compose down` 保留数据库 volume。
- `docker compose down -v` 删除数据库 volume，属于破坏性操作。
- 默认启动时自动执行 Alembic migration。

[运维文档](https://github.com/abhi1693/openclaw-mission-control/blob/master/docs/operations/README.md)提供 `pg_dump` 逻辑备份示例，但没有自动保留策略、托管备份或一键恢复流程。

### 通信方式

- 浏览器到后端：HTTP/JSON。
- 后端到 Gateway：WebSocket 长连接或请求/响应式 RPC。
- Gateway Agent 到后端：HTTP heartbeat 和业务 API。
- 后端到 worker：Redis/RQ 异步队列。
- 后端到 PostgreSQL：异步 SQLAlchemy/psycopg。
- 外部系统到后端：HTTP webhook，可选 HMAC-SHA256。

主要网络约束：

- `NEXT_PUBLIC_API_URL` 必须从浏览器所在网络可达，不能使用仅 Docker 内部可解析的主机名。
- `BASE_URL` 必须从 Gateway/Agent 所在网络可达，否则 provisioning 指令中的回调地址不可用。
- 跨主机连接应使用 `wss://` 和有效 CA 证书。
- Compose 默认只把 PostgreSQL/Redis 绑定到 `127.0.0.1`，但前端和后端端口默认绑定全部主机接口。

## 部署形态

### Docker Compose 模式

这是当前最完整、最接近正式部署的官方路径：

- 一次启动前端、后端、PostgreSQL、Redis 和 webhook worker。
- 服务和依赖版本由 Dockerfile/Compose 固定。
- 数据通过 named volume 持久化。
- 适合 macOS Docker Desktop，也适合独立自托管主机。

限制是没有预构建签名应用或稳定镜像版本；默认执行本地源码构建，升级依赖 Git commit。

### local 模式

后端和前端直接运行在宿主机，PostgreSQL 可使用 Docker 或外部实例。该模式更接近开发/源码部署：

- 安装器会安装或更新工具链与项目依赖。
- 前端先构建再用 `npm run start` 运行。
- 后端使用 `uvicorn` 运行。
- 没有自动安装 macOS launchd；官方只给手工 plist 示例。
- 安装器不启动 Redis 和 RQ worker，Gateway 生命周期与 webhook 路径需人工补齐。

### 远端自托管模式

同一 Compose 栈可放在局域网或服务器，再由 Windows/macOS 浏览器访问。此时 Mission Control 主体不在工作 PC，因而不满足本 RUNBOOK 对主体本地运行的要求；本报告只把它视为部署扩展，不作为合格工作机路径。

## 工作机安装（Windows / macOS）

### Windows

**判定：不符合官方支持要求。**

#### 官方状态

- `install.sh` 只支持 `Darwin` 和 `Linux`，其他 `uname` 结果会直接报 unsupported。
- `docs/installer-support.md` 没有 Windows 条目。
- 没有 PowerShell 安装器、MSI、EXE、桌面应用或 Windows 服务配置。
- 公开 Issue 已出现 Windows 用户收到 Unix `chmod` 修复提示的适配问题。

#### Docker Desktop 候选路径

从 Compose 内容推导，在 Windows Docker Desktop 的 Linux containers 模式下，手工克隆仓库、复制 `.env` 并执行 `docker compose up -d --build` 可能可行。但这只是**待实机验证的架构推导**：

- 官方没有把 Windows 列入支持矩阵。
- README 的 `cp`、`bash` 和 installer 流程不是原生 PowerShell 指令。
- 未确认路径、换行、文件权限、端口、防火墙和 Gateway workspace 行为。
- WSL 路径本质是 Linux 用户空间，不应算作 Windows 原生安装。

因此不能把该推导作为生产安装说明或采购承诺。

#### 权限、升级与卸载

- 需要 Docker Desktop 的安装与虚拟化权限。
- 需要允许 3000/8000 本地端口，远程访问还涉及 Windows Firewall。
- 升级只能手工固定/拉取 commit 后重建镜像。
- 卸载需要手工停止 Compose、决定是否删除 volume、删除源码目录，并按需卸载 Docker Desktop。

### macOS

**判定：官方支持，Docker 模式有条件符合。**

#### 推荐：Docker 模式

1. 安装并启动 Docker Desktop。
2. 手工克隆仓库并固定已评估的 commit；不建议直接执行未固定版本的 `curl | bash`。
3. 从 `.env.example` 创建 `.env`。
4. 生成至少 50 字符的 `LOCAL_AUTH_TOKEN`，并更换默认 PostgreSQL 密码。
5. 执行 `docker compose -f compose.yml --env-file .env up -d --build`。
6. 打开 `http://localhost:3000`，检查 `http://localhost:8000/healthz`。
7. 登记本机或远端 OpenClaw Gateway，并验证 WebSocket、wake 和 heartbeat。

官方一键安装器在 macOS 上还要求 Homebrew，即使最终选择 Docker 模式；采用手工 Compose 可避免让安装脚本自动管理部分宿主工具。

#### 备选：local 模式

local 模式需要 Homebrew、Node.js 22+、npm、`uv`、Python 3.12、PostgreSQL、Redis 和多个常驻进程。安装器可完成依赖同步、migration 和前端构建，但需操作者额外：

1. 启动 Redis。
2. 持续运行 `make rq-worker` 或等价 worker 命令。
3. 为 backend、frontend、worker 分别编写和加载 launchd LaunchAgent。
4. 确认 `BASE_URL` 可由 Gateway 访问。

由于服务完整性和开机启动都需要人工补齐，local 模式不应优先于 Docker 模式。

#### 权限与网络

- Docker 模式需要 Docker Desktop 权限和网络下载权限。
- local 模式会通过 Homebrew、uv 和 npm 安装工具/依赖，并在用户目录写入环境、构建和日志文件。
- 默认 UI/API 端口为 3000/8000；数据库/Redis 主机端口为 5432/6379。
- 如果 Gateway 不在同一台 Mac，需让 8000 端口在受控网络中可达，并正确设置 CORS、`BASE_URL`、TLS 和防火墙。

#### 升级

- 官方建议拉取新变更后使用 `docker compose ... up -d --build --force-recreate`。
- 零缓存重建需要 `build --no-cache --pull`。
- 数据库默认在启动时自动 migration，回滚旧代码可能同时要求恢复数据库。
- 没有 tag/Release 时，应在组织内固定 commit，先备份数据库再升级。

#### 卸载

仓库没有官方卸载器。Docker 模式可按以下边界处理：

1. `docker compose ... down`：停止并移除容器/网络，保留数据库。
2. 先完成 `pg_dump` 并验证备份。
3. 只有明确不再需要数据时才执行 `down -v` 删除 named volume。
4. 删除源码目录和 `.env`；Docker Desktop 是否卸载由用户自行决定。

local 模式还需先停止 PID 文件记录的前后端、手工停止 worker/Redis、卸载 LaunchAgents，并清理源码目录、虚拟环境、Node 依赖和 `~/.local/state/openclaw-mission-control-install`。Homebrew、Node、uv、Python、PostgreSQL 或 Redis 可能被其他项目共享，不应由项目卸载流程直接删除。

## 认证、安全与权限边界

### 已提供的安全措施

- local shared bearer token 最少 50 字符。
- 可选 Clerk JWT 模式。
- Agent 使用独立 `X-Agent-Token`。
- 后端敏感接口提供 per-IP 限流。
- webhook 支持 HMAC-SHA256 与 1 MiB 默认载荷上限。
- 后端和前端容器以非 root `appuser` 运行。
- 默认设置 `nosniff`、`DENY` frame policy 和严格 referrer policy。
- Gateway 生产连接建议使用 `wss://` 与有效证书。

### 需要加固的风险

1. **远程脚本供应链**：README 推荐从可变 `master` 下载 `install.sh` 并直接交给 bash，未提供 checksum、签名或 commit pin。工作机部署应先审阅并固定 commit。
2. **默认数据库凭据**：`.env.example` 默认用户/密码均为 `postgres`，只适合本地初始化。
3. **监听范围**：Compose 的前端/后端端口默认映射到全部主机接口；不能仅凭 URL 写着 localhost 推断服务只监听 loopback。
4. **Gateway token 暴露**：官方安全文档说明 Gateway token 当前仍会在 API 响应中返回，应把管理员 API 响应和浏览器会话视为敏感数据。
5. **TLS 豁免**：允许自签名证书开关会跳过 Gateway TLS 验证，只应在受控测试网络短期使用。
6. **共享 token 身份边界**：local 模式是共享 bearer token，操作归因能力弱于个人账户认证。
7. **高影响生命周期操作**：公开 Issue 显示 broadcast/provisioning 可能产生超出用户预期的 Agent 创建和状态变化，生产使用前应做审批和最小权限验证。

## 许可证与交付形态

- 仓库使用 MIT License，允许使用、复制、修改、分发和商业化，但软件按“AS IS”提供，不附带担保。
- 交付物是源码、Dockerfile、Compose 和 shell installer，不是签名桌面二进制。
- 没有 SBOM、安装包签名、正式 Release checksum 或长期支持版本证据。
- OpenClaw Gateway、模型 Provider、Clerk 和其他集成各自的许可与服务条款不由本仓库 MIT License 覆盖。

## 未决项与证据边界

1. **Windows Docker Desktop 可运行性未决**：需要 Windows 11 + Docker Desktop 实机验证，当前不能升级为官方支持结论。
2. **macOS 架构未决**：Docker Desktop 路径理论上覆盖 Apple Silicon/Intel，但官方文档没有给出逐架构测试矩阵。
3. **Gateway 兼容性未决**：配置样例声明最低版本 `2026.02.9`，但没有正式兼容矩阵或版本协商承诺。
4. **local 模式完整性未决**：安装器未启动 Redis/worker，需验证在仅前后端运行时哪些功能静默失败或延迟失败。
5. **升级/回滚未决**：没有 tag 和 Release，数据库 migration 与旧 commit 的兼容需逐次演练。
6. **恢复能力未决**：文档有 `pg_dump` 示例，但没有执行备份、恢复或灾难恢复演练的证据。
7. **多用户治理未决**：local shared token 与 Clerk 模式的角色、审计和租户隔离需要运行验证。
8. **Gateway token 改进未决**：文档称未来版本会从读取接口隐藏 token，但当前没有对应 Release 时间。

## 后续验证建议

### macOS 小范围验证

1. 固定 `75eb8b08` 或后续经过评审的 commit，不执行浮动 `master` 的远程脚本。
2. 在隔离的 macOS 工作机使用 Docker Desktop 部署，修改数据库密码和 local auth token。
3. 将前端/后端显式限制到 loopback，除非确有局域网访问需求。
4. 连接同机 OpenClaw Gateway，验证 create → provision → wake → heartbeat → task → approval → activity 的完整链路。
5. 停止 Redis 或 worker，确认 UI 告警、任务积压和恢复行为。
6. 执行一次 `pg_dump`、销毁测试栈、重新创建并恢复数据库。
7. 从旧 commit 升级到目标 commit，再进行一次数据库与 Gateway 回滚演练。

### Windows 准入验证

1. 只有在业务确实需要 Windows 时，建立独立的 Docker Desktop 实验，不沿用 Linux/WSL 成功结果。
2. 验证 PowerShell 下的环境文件、路径、换行、Docker build、端口和防火墙。
3. 验证 Windows OpenClaw Gateway 的 workspace、权限提示、WebSocket、session messaging 和 Agent heartbeat。
4. 在官方补充 Windows 支持矩阵、安装说明和持续测试前，保持“实验性、不受支持”标记。

### 准入门槛

满足以下条件后再考虑生产使用：

- 固定可回滚版本，而不是跟踪浮动 `master`。
- Windows/macOS 目标平台均完成实机验证；若 Windows 是强制平台，需等待或自行承担非官方支持成本。
- Gateway 版本、配置 schema 和 provisioning 流程通过兼容性测试。
- 数据库备份、恢复、migration 与回滚完成演练。
- 端口、TLS、token、数据库密码和管理员 API 响应完成安全加固。
- worker/Redis 停止、Gateway 离线和 Agent 无 heartbeat 时有明确运维处置流程。
