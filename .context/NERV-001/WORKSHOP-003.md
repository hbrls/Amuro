# WORKSHOP-003 · Paperclip 与同类 AI 调度产品技术调研

> updated_by: Codex - GPT-5
> updated_at: 2026-07-17 17:10:51
> Vision: GLNT-10
> checkpoint_source: Index.md + 31 份过程文件
> evidence_window: 2026-07-16 至 2026-07-17
> status: RUNBOOK 11 个子阶段已完成形态层收束，最终选型与生产验收尚未执行

## §0 交付结论

本文件是本轮 Paperclip 技术调研的唯一保留交付物。它整合了 31 份过程产物中的有效结论、修正、证据边界、方案和未决项；过程调度、重复状态判断和已被后续证据替代的早期结论不再保留。

本轮可以确认：

1. Paperclip 是面向多 Agent 组织、任务、预算、治理和审计的中心化管理产品，不是 Temporal 一类通用持久执行引擎的等价替代品。
2. 当前源码呈现单 Node.js 服务进程、PostgreSQL 持久化、进程内锁与事件总线并用的中心化调度形态；默认没有多调度节点协调机制。
3. Paperclip 的自托管路径较轻，公开仓库使用 MIT 协议，默认外部依赖主要是 PostgreSQL；匿名遥测默认开启但可关闭。
4. Codex 等工具可以通过 REST、WebSocket 和机器凭据绕过本地 adapter 直连服务端，但调用方需要自行承担 API 契约、凭据生命周期和事件订阅。
5. Windows 可通过 Node.js/npm CLI、Docker Desktop/WSL2 或源码构建运行；未发现独立原生 Windows EXE 的证据，不能把 npm CLI 或 Docker 镜像称为“官方 EXE”。
6. Paperclip、Temporal、Inngest、Trigger.dev 的产品抽象和持久化语义不同，只能按目标场景选型，不能仅凭容器数或星级评分得出结论。

RUNBOOK 的 11 个子阶段已完成形态层收束，但这不等于所有结论都达到运行时验证级别。数据库最低兼容版本、生产性能、安全合规、Windows 实机行为、多节点改造成本和最终选型仍未闭合。

## §1 调研目标、范围与边界

### §1.1 Vision 目标

GLNT-10 研究业界如何让 Agent 持续获得工作、推进工作并形成可治理的完成闭环。本轮专项聚焦 Paperclip，并以 Temporal、Inngest、Trigger.dev 作为默认对照，回答以下问题：

- 调度核心如何持久化、抢占、去重和重试；
- 客户端如何接入，Codex 能否直接连接；
- Windows 上有哪些可行部署形态及依赖；
- 哪些依赖属于调度刚需，哪些属于上层产品能力；
- 当前架构是否支持多节点，改造需要解决什么问题；
- 不同产品分别适合哪些场景。

### §1.2 本轮覆盖

- Paperclip 官方仓库：`paperclipai/paperclip`，调研时默认分支为 `master`；
- 开源属性、自托管与云依赖；
- 数据库、接口、通信、队列四类基础设施；
- Windows 原生 Node.js、Docker/WSL2、源码构建三类路径；
- CLI、adapter、plugin SDK、REST、WebSocket 接入；
- 中心化架构、候选多节点改造方向；
- Paperclip、Temporal、Inngest、Trigger.dev 的同口径比较。

### §1.3 本轮不包含

- 为 Glintz 设计最终任务字段、状态机或调度器；
- 实施任何产品集成或 Paperclip 改造；
- 在 Windows 实机上安装、启动或压测；
- 对生产安全、许可证适用性作最终法律或合规签字；
- 对 QPS、并发 WebSocket、内存、启动时间作实测；
- 选择最终产品。

## §2 证据口径与阶段状态

### §2.1 证据分层

| 等级 | 本文件含义 | 使用方式 |
| --- | --- | --- |
| 已核源码事实 | 过程任务记录了仓库 raw 文件、API 元数据或源码路径的直接读取 | 可作为当前快照的技术依据 |
| 源码推导 | 从代码结构和调用关系推导，未运行系统 | 可用于架构判断，不等同运行时验证 |
| 估算或候选方案 | LOC、资源、工期、改造路径或产品适用性推断 | 只能用于规划，实施前必须复核 |
| 未决 | 缺少用户裁决、benchmark、实机验证或法律评审 | 不得包装为已闭合结论 |

本次 checkpoint 重新审计了全部过程产物的一致性，但没有重新抓取远程仓库，也没有运行四个产品。源码路径以调研时的分支快照为准，未锁定 commit SHA，行号可能漂移。

### §2.2 RUNBOOK 状态

| 子阶段 | 交付状态 | 最终证据边界 | 仍未闭合 |
| --- | --- | --- | --- |
| 1 范围锁定 | 已完成 | 主体仓库已锁定；其余边界采用默认基线 | Q-2 至 Q-7 未经人工确认 |
| 2 开源属性 | 已完成 | 仓库元数据、LICENSE、README、子包清单 | 未锁定 HEAD SHA；未来版本需复核 |
| 3.1 数据库 | 形态层完成 | PostgreSQL、embedded/external/Supabase 形态可判 | 外置 PostgreSQL 最低支持版本未证实；迁移扩展未全量验证 |
| 3.2 对外接口 | 源码层完成 | REST 路由模块、CLI、WebSocket、鉴权和 RBAC 已定位 | 完整端点契约、限流阈值和凭据轮换未穷尽 |
| 3.3 消息通信 | 源码层完成 | REST、WebSocket、EventEmitter、心跳路径已定位 | 客户端自动重连、事件回放和生产网络测试未证实 |
| 3.4 任务队列 | 源码层完成 | DB 表、行锁、进程内锁、coalesce 已定位 | 多节点抢占与故障恢复未运行验证 |
| 4 Windows 部署 | 形态层完成 | Node.js、Docker、源码构建及 Windows 依赖已梳理 | Windows 实机、服务化、反代、Defender、WSL2 I/O 未验收 |
| 5 客户端接入 | 源码层完成 | CLI、adapter、plugin SDK、直连路径已定位 | API 稳定性、token 生命周期、性能与安全评审未完成 |
| 6 依赖根源 | 源码推导完成 | 核心文件和上层模块边界已识别 | “最小核心”尚未实际拆分，LOC/体积比例不可靠 |
| 7 架构范式 | 源码推导完成 | 当前单进程单节点结论可靠 | 多节点方案仅为候选设计，未实施 |
| 8 横向对比 | 文档/源码比较完成 | 协议、产品定位、样例拓扑和 SDK 形态已比较 | 无统一 benchmark；部分生产拓扑仅来自样例配置 |

结论：11/11 子阶段已具备收束所需的交付内容，但证据强度不一致，不能统一标为 L4。

## §3 Paperclip 技术画像

### §3.1 开源、自托管与网络出口

| 项目 | 结论 | 证据锚点 | 边界 |
| --- | --- | --- | --- |
| 主仓库 | `paperclipai/paperclip`，调研时默认分支 `master` | GitHub 仓库元数据、根目录文件 | 未锁定 commit SHA |
| 主许可证 | MIT | 根 `LICENSE`、仓库 SPDX、workspace `package.json` | 第三方依赖仍需各自许可证审计 |
| 核心可见性 | server、CLI、DB schema、adapter、plugin SDK 均在公开仓库 | `server/`、`cli/`、`packages/` | 仅代表调研快照，不能保证未来版本 |
| 自托管 | 本地 CLI、源码、Docker 均可运行，不要求 Paperclip 中心账号 | `README.md`、`doc/DOCKER.md`、`doc/DEPLOYMENT-MODES.md` | LLM provider 仍可能需要外网 |
| 遥测 | 默认开启，可通过环境变量或配置关闭 | `packages/shared/src/telemetry/client.ts` | 私有化部署必须显式关闭并做出网验证 |
| 云能力 | AWS Secrets Manager 和 Cloud Sync 为显式启用能力 | `doc/SECRETS-AWS-PROVIDER.md`、CLI Cloud 命令 | 启用后会引入外部服务依赖 |

已识别的遥测关闭开关包括：

- `PAPERCLIP_TELEMETRY_DISABLED=1`
- `DO_NOT_TRACK=1`
- `CI=true`
- 配置项 `telemetry.enabled=false`

调研没有发现在线许可证校验或强制 Paperclip SaaS 登录路径。该结论来自静态扫描，不替代运行时抓包。

### §3.2 数据库与持久化

Paperclip 需要 PostgreSQL 语义的持久化层。已确认的形态为：

| 形态 | 已确认事实 | 不应扩大的结论 |
| --- | --- | --- |
| embedded | 使用 `embedded-postgres@18.1.0-beta.16`，创建真实 PostgreSQL 进程并写入磁盘目录 | npm 包版本号不能直接当作 PostgreSQL 服务端最低版本 |
| external | 官方 Docker Compose 样例固定 `postgres:17-alpine` | “样例使用 PG 17”不等于“最低支持版本是 PG 17” |
| Supabase | 作为外部 PostgreSQL 服务接入 | 不是第四种数据库引擎 |
| memory | 未在扫描中发现生产内存数据库路径 | “未发现”不等于已对所有测试依赖作双否定证明 |

调研没有在已扫描的 schema 和依赖中发现 pgvector、PostGIS 等必须扩展，但没有完成全部 migration 的独立复核。因此最终结论应为“未发现强制扩展”，而不是“已证明不存在任何扩展”。

### §3.3 队列、抢占与幂等

调度持久化主要落在以下表和服务：

| 组件 | 作用 | 已确认机制 |
| --- | --- | --- |
| `agent_wakeup_requests` | 唤醒请求队列入口 | status、idempotency key、3 个索引 |
| `heartbeat_runs` | 一次执行及其状态 | 状态、重试、活性字段；后续复核为 6 个复合索引，不是早期稿中的 7 个 |
| `agent_task_sessions` | Agent 与任务会话复用 | 业务会话状态 |
| `agent_runtime_state` | 运行时状态和累计信息 | 以 Agent 为粒度持久化 |
| `issue_tree_holds` | 任务树 hold/锁定 | 树形任务控制 |
| `server/src/services/heartbeat.ts` | 入队、定时调度、重试、取消、恢复协调 | `enqueueWakeup`、timer tick、reap、retry 等 |
| `server/src/services/agent-start-lock.ts` | 节点内按 Agent 串行 | `Map` + Promise，30 秒 stale 防护 |

`enqueueWakeup` 在数据库事务内锁定目标 Agent 行，并在应用层执行同 `taskKey` 合并；进程内再通过 per-Agent 锁和 active/live Set 避免同节点重复启动。由此形成三类防线：

1. PostgreSQL 行锁负责事务并发；
2. 进程内 per-Agent 锁负责同节点串行；
3. idempotency key 和 `taskKey` coalesce 负责应用层重复请求合并。

这不是独立消息队列产品。调研时未发现 Redis、BullMQ、RabbitMQ、Kafka、NATS 等作为默认队列依赖，也未发现内置多节点 leader election。

### §3.4 接口、鉴权与多租户

| 层 | 当前形态 | 关键边界 |
| --- | --- | --- |
| REST | Express 5；扫描到 47 个路由模块 | 47 是文件/模块数，不应直接写成 47 个稳定端点 |
| CLI | npm 包 `paperclipai`；快照中约 32 个顶层命令注册 | CLI 同时承担本地部署和远程调用，不是已确认的独立原生 EXE |
| WebSocket | live-events 与 environment terminal 两类 handler | live-events 路径为 `/api/companies/:companyId/events/ws`；terminal 完整路径契约未穷尽 |
| gRPC | server/CLI/UI 扫描未发现实现 | 只能表述为当前快照未发现 |
| Plugin SDK | 9 个主要 surface、50+ capability、JSON-RPC worker/host | 数量会随分支变化 |
| Adapter | 8 个本地 STDIO、Cursor Cloud、Hermes/OpenClaw gateway 等 | `AUTHORING.md` 是文档，不是运行时 adapter |
| MCP | 仓库存在主 MCP、Google Sheets MCP、KV demo MCP | 应归客户端、插件还是独立扩展面尚未裁决 |

`actorMiddleware` 的快照来源包括：

- `local_implicit`
- `cloud_tenant`
- `session`
- `board_key`
- `agent_key`
- `agent_jwt`

其中机器接入主要使用 Board API key、Agent API key、Agent JWT 和 Cloud tenant server token。人类会话由 better-auth 承担。

权限模型不是“3 级角色”。更准确的描述是两个作用域：实例级 `instance_admin`，以及公司级 `owner`、`admin`、`member`、`viewer`、`support`。源码还包含跨租户访问检查和对资源存在性的 404 一致化处理。

已确认存在 hostname allowlist、注册开关、认证限流开关；未完成限流阈值、窗口算法、API key 生成/轮换/吊销全流程的独立审计。

### §3.5 通信、心跳与断线语义

| 机制 | 已确认事实 | 不能混淆的概念 |
| --- | --- | --- |
| HTTP | `keepAliveTimeout=185s`，`headersTimeout=186s` | keep-alive 是连接复用，不是业务心跳 |
| live-events WS | 服务端每 30 秒 ping，客户端 pong；事件来自进程内 EventEmitter | EventEmitter 未显示持久缓冲或断线回放 |
| 调度循环 | 默认约 30 秒 tick | 调度 tick 不是网络连接心跳 |
| orphan reap | 运行超过约 5 分钟无活性时由服务端清理/恢复 | 这是运行恢复，不是客户端重连 |
| bounded retry | 服务端任务执行使用 2 分钟、10 分钟、30 分钟、2 小时的退避并带 jitter | 这是任务重试，不是 WebSocket 自动重连策略 |

因此，旧稿中的“客户端无主动重连，服务端 5 分钟 reap + 四级退避接管客户端重连”不准确。准确结论是：服务端具备任务运行恢复和退避；live-events WebSocket 的客户端自动重连、断线补发和事件回放没有在本轮得到完整证据。

### §3.6 当前架构

Paperclip 当前属于中心化特权调度服务：

- 单一 Node.js server 进程运行定时调度循环；
- PostgreSQL 承担持久状态与事务锁；
- `Map`、`Set`、Promise 和 EventEmitter 承担节点内协调；
- REST、WebSocket、STDIO/SDK adapter 承担跨进程或跨机器接入；
- 未发现 server 使用 `cluster`、`worker_threads` 或 `child_process.fork` 形成多调度进程；
- 未发现跨节点事件广播、共享 active-run 状态或内置 leader election。

所谓“调度最小核心”只能作为候选拆分边界：5 张核心表、`heartbeat.ts`、`agent-start-lock.ts` 和 `server/src/index.ts` 的调度入口。过程材料对 heartbeat 文件体积、50/30/20 职责比例、可剥离 90% 和约 190 LOC 改造量均属于估算，且 recovery 与 heartbeat 存在真实耦合，不能作为已验证工程量。

后续复核还修正了 recovery 目录规模：实际为 8 个源文件和 4 个测试文件，不是早期记录的 4 个文件；其中 `service.ts` 约 202KB。

## §4 Windows 与私有化部署基线

### §4.1 可行部署形态

| 方式 | 入口 | 依赖 | 权限与边界 |
| --- | --- | --- | --- |
| Node.js/npm | `npx paperclipai onboard --yes` 或源码内 `pnpm dev` | Node.js >=20、pnpm 9.15.4、按 Agent 类型安装对应 CLI | 普通用户可运行；这是 npm CLI/Node 服务，不是原生 EXE |
| Docker quickstart | 单 Paperclip 容器，内部 embedded PostgreSQL | Docker Desktop/Engine | Docker Desktop、WSL2 和防火墙安装通常需要一次管理员权限 |
| Docker Compose | Paperclip + `postgres:17-alpine` 样例 | Docker Compose v2 | PostgreSQL 数据和 Paperclip 数据需分别持久化 |
| 源码构建 | `pnpm install --frozen-lockfile` 后构建 UI、plugin SDK、server | Node.js、pnpm、TypeScript、Git | Windows native 包优先使用预构建二进制；fallback 工具链仍需实机验证 |

源码快照包含 Windows 预构建包，涉及 embedded-postgres、sharp、oxc-parser 和 Claude Agent SDK；同时依赖树中存在 `node-gyp`。因此只能说“常见 x64 路径提供 prebuilt”，不能保证所有架构和 fallback 情况都不需要 Visual Studio Build Tools。

完整 Docker 镜像以非 root 用户运行；宿主机安装 Docker、创建 Windows Service、修改防火墙或系统级反代仍可能需要管理员权限。

### §4.2 私有化配置清单

以下是严格内网、authenticated/private 基线的配置分类，不包含真实 secret 值：

| 分类 | 配置键 | 建议值/动作 |
| --- | --- | --- |
| 鉴权 | `BETTER_AUTH_SECRET` | 运行时生成独立 32 字节随机值 |
| 工具签名 | `PAPERCLIP_TOOL_ACTION_SIGNING_SECRET` | 运行时生成另一份独立 32 字节随机值 |
| 遥测 | `PAPERCLIP_TELEMETRY_DISABLED` | `1` |
| 通用 DNT | `DO_NOT_TRACK` | `1` |
| 部署模式 | `PAPERCLIP_DEPLOYMENT_MODE` | `authenticated` |
| 暴露模式 | `PAPERCLIP_DEPLOYMENT_EXPOSURE` | `private` |
| 绑定策略 | `PAPERCLIP_BIND` | `loopback` |
| 服务端口 | `PORT` | `3100` |
| 主机地址 | `HOST` | `127.0.0.1` |
| Windows 数据目录 | `PAPERCLIP_HOME` | `%USERPROFILE%\.paperclip` |
| 自动迁移 | `PAPERCLIP_MIGRATION_AUTO_APPLY` | 无人值守环境候选值 `true`，生产启用前验证回滚策略 |
| 迁移提示 | `PAPERCLIP_MIGRATION_PROMPT` | 无人值守环境候选值 `never` |

计数应表述为“9 个核心网络/鉴权变量 + 1 个 Windows 路径变量 + 2 个迁移控制变量”，而不是把含 12 个键的模板称为“9 个 env”。

PowerShell 可用以下表达式分别生成两个 secret；每次执行都应生成新值：

```powershell
[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLowerInvariant()
```

生产前还需要人工验证：防火墙、反向代理 WebSocket upgrade、TLS 终结、数据备份恢复、迁移失败回滚、Windows Service 生命周期、Defender/EDR 白名单和 WSL2 磁盘 I/O。

## §5 客户端接入与改造边界

### §5.1 官方接入面

- `paperclipai` npm CLI：可本地 onboard，也可通过 `--api-base`、`--api-key` 调用远端；
- 本地 adapter：Claude、Codex、Cursor、Gemini、Grok、OpenCode、Pi、Hermes 等以 STDIO/本地进程形态接入；
- 远程/gateway adapter：Cursor Cloud、OpenClaw、Hermes gateway 等；
- Plugin SDK：通过 JSON-RPC 暴露能力；
- REST 和 WebSocket：语言无关的服务端协议面。

官方 integration 包主要是 Node.js/TypeScript，但 REST/WS 协议并不限制调用语言。因此“Paperclip 仅支持 Node.js”只适用于官方包生态，不适用于协议可达性。

### §5.2 Codex 直连结论

Codex 可跳过 `codex-local` adapter，直接通过 REST + Bearer credential 调用服务端，并订阅 live-events WebSocket。可行性来自服务端协议和机器鉴权，不依赖 Paperclip 中心账号。

直连方必须自行承担：

1. 端点发现、请求/响应类型和错误处理；
2. Board/Agent key 或 JWT 的签发、保存、轮换和吊销；
3. WebSocket ping/pong、重连、断线后的状态再同步；
4. API 版本漂移和兼容性测试；
5. 审计中的 responsible user、company scope 和 run scope 传递。

本轮没有形成完整 OpenAPI 契约，也没有验证 query token 是否会泄漏到代理日志。实现时应优先使用 Authorization header，并对 URL、代理和审计日志做脱敏。

### §5.3 两类扩展方案

| 方案 | 适用条件 | 优点 | 风险 |
| --- | --- | --- | --- |
| 新增 adapter/bridge 子包 | 外部工具协议可在边缘适配 | 隔离性高，不改核心鉴权和 DB | 多一跳进程/协议；需维护 adapter 生命周期 |
| 扩展 server 协议 | 需要一等公民的 bridge 身份、权限和审计 | 调用链直接 | 会修改 auth、RBAC、WebSocket、schema/migration，安全面更大 |

过程材料给出的“约 500 LOC”与“约 110 LOC + 1 migration”只是类比估算，不是完成设计后的工程量。默认优先 adapter/bridge；只有现有身份模型无法表达所需权限时才扩展 server。

## §6 同口径产品比较

### §6.1 比较原则

四个产品并非完全同类：Paperclip 管理 Agent 组织与工作；Temporal 提供通用持久执行；Inngest 提供事件驱动持久函数；Trigger.dev 面向 TypeScript/AI 长运行任务。比较只用于识别适用场景，不代表功能等价。

### §6.2 事实矩阵

| 维度 | Paperclip | Temporal | Inngest | Trigger.dev |
| --- | --- | --- | --- | --- |
| 核心定位 | Agent 组织、任务、预算、治理、审计 | Workflow/Activity/Event History 持久执行 | Event/Function/Step 持久函数 | Task/Run/Schedule 长运行任务 |
| 主仓许可证 | MIT | MIT | 调研快照为 SSPL 1.0 + DOSP | Apache 2.0 |
| 服务端主语言 | Node.js/TypeScript | Go | Go | TypeScript/Node.js |
| 持久化核心 | PostgreSQL + 应用调度状态 | Event History + Task Queue + persistence | Queue/State store/Event API | PostgreSQL、Redis 及事件/对象存储组件 |
| 官方 SDK/包 | Node/TS adapter 与 plugin SDK；REST/WS 可跨语言 | 多语言 SDK 最完整 | TypeScript、Python、Go、Kotlin 等 | 主要为 TypeScript/JavaScript |
| 默认扩展能力 | 单节点，不含内置多调度节点协调 | 原生分布式持久执行 | dev 与 production 形态不同 | worker + 多服务持久化执行 |
| 自托管样例 | 1 容器 quickstart 或 2 容器 Compose | 有单二进制 dev server；Compose/生产可拆分多个组件 | dev 可单容器；生产持久化拓扑需另行确认 | Compose 快照有 8 个单元，其中包含 init/migrator job，不能全部称为常驻服务 |
| Windows | Node.js 路径或 Docker/WSL2；未实机验收 | CLI 可跨平台，server 通常通过 Docker/WSL2 | dev binary 可跨平台，生产未实机验收 | Node/TS + Docker/WSL2，未实机验收 |
| 运维特征 | 最轻，但单节点能力有限 | 复杂度随 persistence、visibility 和服务拆分上升 | dev 很轻，production 需重新评估 | 依赖面最宽，Compose 运维最重 |

### §6.3 对旧横向结论的修正

- Temporal 不能简单写成“最少 5 容器”：官方提供 single-binary dev server；生产拓扑取决于 persistence、visibility 和服务部署方式。
- Trigger.dev Compose 中的 8 个单元包含初始化/迁移 job，不能等同 8 个常驻核心服务。
- 容器启动时间、CPU、内存数据均未做统一 benchmark，旧稿中的 `<30s`、`CPU 0.5`、`512MB` 等数字不进入本交付结论。
- 不再使用星级表示私有化优劣；许可证、运维、功能和扩展能力应分别判断。
- Inngest 的 SSPL/DOSP 适用性必须由法律或合规人员按实际版本和使用方式确认。“三年后自动 Apache 2.0”应按具体版本的 DOSP 条款计算，不能理解为整个产品在固定日期统一转 Apache。
- 竞品信息主要来自 LICENSE、README、Docker/Compose 和配置样例，不构成完整生产架构审计。

## §7 场景化选型结论

| 目标场景 | 优先候选 | 选择理由 | 必须接受的代价 |
| --- | --- | --- | --- |
| 内部多 Agent 组织、预算、治理和审计 | Paperclip | 产品抽象直接匹配，单机自托管简单 | 当前调度单节点；官方包生态偏 Node/TS |
| 大规模、跨语言、长周期持久工作流 | Temporal | Event History 和多语言 SDK 成熟 | 学习与运维成本更高，产品抽象不是 Agent 组织管理 |
| 内部事件驱动函数、快速开发 | Inngest | Function/Step/Event 模型直接 | 生产拓扑与 SSPL/DOSP 必须单独评审 |
| TypeScript/AI 长运行任务与实时流 | Trigger.dev | Task/Run、checkpoint/realtime 能力匹配 | 自托管依赖面和运维复杂度高 |
| 同时需要 Agent 治理与强持久执行 | Paperclip + Temporal 等组合 | 分离组织治理与工作流执行职责 | 双系统身份、状态、审计和故障语义更复杂 |

最终选型尚未完成。当前证据只能支持“按场景进入 POC”，不能支持无条件选择 Paperclip。

## §8 后续改造与验证建议

### §8.1 Paperclip 多节点化

若目标要求多个调度节点，至少要解决：

1. 用数据库或专用协调服务实现 leader election；
2. 将 `startLocksByAgent` 和 active/live Set 的节点内语义扩展为跨节点协调；
3. 设计 DB claim 语义，包括锁粒度、`SKIP LOCKED` 是否适用、幂等键和失败接管；
4. 将 EventEmitter 事件扩展为跨节点 fanout 或改为可重建的状态同步；
5. 定义 leader 丢失、数据库连接丢失、重复 tick 和任务执行中的 fencing 行为；
6. 增加并发、故障注入和恢复测试。

PG advisory lock 是优先候选，因为可复用现有 PostgreSQL，但它是连接/事务语义的锁，不应写成“每 30 秒续约、90 秒自动释放”的租约。可行实现需要专用连接、`pg_try_advisory_lock`、连接丢失检测、重新选主和 fencing 设计。Redis/etcd 是替代方案，不是消息队列必选项。

### §8.2 跨语言接入

优先为现有 REST/WS 建立稳定 OpenAPI/事件 schema 和生成式 SDK。只有在强类型 streaming、双向 RPC 或生态要求明确时再考虑 gRPC。不要为了“跨语言”直接引入 Temporal；Temporal 是执行引擎，不是通用 RPC 适配器。

### §8.3 embedded-postgres patch

当前仓库维护一个约 1.8KB 的 patch，修正 locale 和子进程环境传递。建议：

- 记录上游 issue/release 对应关系；
- 每次升级执行 patch dry-run、initdb、重启和数据目录恢复测试；
- 上游吸收修复后删除 patch；
- 未证明需要长期分叉前，不建立 fork。

### §8.4 生产验证

生产前至少执行：

- QPS、p50/p95/p99、并发运行数、并发 WS、内存和 DB 连接数；
- 进程重启、数据库断连、网络抖动、重复请求、leader 故障注入；
- token 存储、轮换、吊销、日志脱敏、租户越权和审计完整性；
- Windows 安装、升级、备份恢复、Service、反代和 EDR 验收；
- 对候选产品的许可证与 SaaS/再分发场景法律评审。

## §9 未决项与证据边界

| 未决项 | 当前默认基线 | 影响 |
| --- | --- | --- |
| Q-2 中心调度边界 | 调度核心、队列、锁、索引、状态机 | 影响最小核心与改造范围 |
| Q-3 客户端边界 | npm CLI、adapter、plugin SDK、REST/WS；不再假定存在原生 EXE | 影响交付载体与 Windows 安装方式 |
| Q-4 竞品范围 | Temporal、Inngest、Trigger.dev | 影响横向结论的完整性 |
| Q-5 Windows 范围 | 单机 Node.js + Docker Desktop/WSL2 | 是否覆盖 Windows Server、Kubernetes 或原生容器仍未定 |
| Q-6 私有化边界 | 严格内网并关闭遥测 | 是否允许 LLM API、对象存储、Cloud Sync 出口仍未定 |
| Q-7 源码证据颗粒度 | 文件路径 + 关键代码，不承诺稳定行号 | 影响后续审计成本 |
| MCP 归类 | 独立记录，不强行并入客户端或 plugin | 不影响调度结论，影响产品能力目录 |
| 外置 PostgreSQL 最低版本 | 未确定；仅确认官方样例使用 PG 17 | 影响生产数据库选型和兼容测试 |
| patch 维护策略 | 跟踪上游、暂不 fork | 影响升级与供应链维护 |
| 性能与安全基准 | 未执行 | 阻塞生产容量与合规签字 |
| API 稳定契约 | 未形成完整 OpenAPI/事件 schema | 阻塞长期维护的直连客户端 |
| Windows 实机验收 | 未执行 | 阻塞 Windows 生产部署签字 |

## §10 接手 SOP 与 checkpoint 验收

### §10.1 POC 入口

1. 人工选择目标场景、候选产品、Windows 形态和网络边界；
2. 锁定候选产品的 commit/tag、许可证版本和部署文档；
3. 先做单机 POC，验证端到端任务、身份、审计和恢复；
4. 需要多节点时再做故障模型与协调设计，不直接采用过程材料中的 LOC 估算；
5. POC 通过后执行性能、安全、备份恢复和 Windows 实机验收；
6. 将裁决和验收结果回写 `Index.md`，再启动实施 Vision。

### §10.2 停止条件

本轮 checkpoint 在以下条件满足后停止：

- 31 份 C 过程产物的有效内容均已归入“整合、被替代、纯过程”之一；
- 本文件不依赖任何 C 文件才能理解结论或执行接手；
- 数据库版本、重连、EXE、env 计数、RBAC 角色、索引数、recovery 文件数、资源估算和多节点方案等冲突已显式修正；
- 11 个 RUNBOOK 子阶段的状态、证据边界和未决项内部一致；
- USE 只承载进入下一阶段确实需要人工完成的动作；
- `WORKSHOP-003.md` 验收通过后，删除当前 Vision 下全部 `C-NNN.md`；
- 创建 `.context/GLNT-10/.done/` 作为结束标记。

### §10.3 主要证据锚点

Paperclip：

- `LICENSE`、`README.md`、根/server/cli `package.json`
- `Dockerfile`、`docker/docker-compose.yml`、`docker/docker-compose.quickstart.yml`
- `doc/DOCKER.md`、`doc/DEPLOYMENT-MODES.md`、`doc/DATABASE.md`
- `server/src/index.ts`
- `server/src/services/heartbeat.ts`
- `server/src/services/agent-start-lock.ts`
- `server/src/services/live-events.ts`
- `server/src/realtime/live-events-ws.ts`
- `server/src/middleware/auth.ts`
- `server/src/routes/authz.ts`
- `packages/db/src/schema/agent_wakeup_requests.ts`
- `packages/db/src/schema/heartbeat_runs.ts`
- `packages/db/src/schema/agent_task_sessions.ts`
- `packages/db/src/schema/agent_runtime_state.ts`
- `packages/db/src/schema/issue_tree_holds.ts`
- `packages/adapters/*`、`packages/plugins/sdk/*`、`packages/mcp-server/*`

竞品：

- `temporalio/temporal`: `LICENSE`、`README.md`、dev server 与 Docker 配置
- `inngest/inngest`: `LICENSE.md`、`README.md`、Dockerfile、`go.mod`
- `triggerdotdev/trigger.dev`: `LICENSE`、`README.md`、Docker Compose、`.env.example`

---

# USE-003

> Target: 用户 / LENS owner / 安全 owner

进入实施 Vision 前需要完成目标场景与部署边界裁决；进入生产前还需要完成容量和安全验收。

---

## Q-4 / Q-5 / Q-6 / 最终选型 · 实施入口裁决

> Target: 用户 / LENS owner / 安全 owner

### 需要什么人工

由业务 owner 选择目标场景和候选产品，由平台/安全 owner 确认 Windows 部署形态与允许的网络出口。

### 执行请求

在以下场景中选择一个主场景，可附一个备选：

- A：内部多 Agent 组织、预算、治理、审计，候选 Paperclip；
- B：大规模跨语言持久工作流，候选 Temporal；
- C：内部事件驱动持久函数，候选 Inngest，前置法律评审；
- D：TypeScript/AI 长运行任务，候选 Trigger.dev；
- E：Agent 治理与持久执行组合，候选 Paperclip + Temporal 等组合。

同时明确：

- Windows 形态：单机 Node.js、Docker Desktop/WSL2、Windows Server 容器化三选一；
- 网络边界：严格无外网、仅允许 LLM provider API、允许指定 SaaS/对象存储三选一；
- 是否要求多调度节点和跨语言 SDK。

### 完成判据

- 在 `.context/GLNT-10/Index.md` 新增“选型与实施入口裁决”段；
- 写明主场景、候选产品、部署形态、网络边界、多节点要求、跨语言要求和责任 owner；
- 若选择 Inngest，附具体版本许可证评审结论；
- 若选择组合方案，写明两个系统的职责边界和状态主数据归属。

### 影响

- 阻塞主流程：是，阻塞实施 Vision 的架构和 POC 范围；
- 完成后下一步：锁定版本并启动单机 POC；
- 未完成时策略：保留本文件作为调研结论，不启动产品集成。

---

## 6-G-10 / R-9 · 生产容量与安全验收

> Target: 性能 owner / 安全 owner / Windows 运维 owner

### 需要什么人工

由实际环境 owner 在已选产品和目标 Windows 环境中执行 benchmark、故障恢复、安全和运维验收。

### 执行请求

- 测量 QPS、p50/p95/p99、并发运行数、并发 WebSocket、内存、CPU、DB 连接和磁盘增长；
- 验证进程重启、数据库断连、网络抖动、重复请求、备份恢复和升级回滚；
- 审计 token 存储/轮换/吊销、日志脱敏、RBAC、多租户越权和出网；
- 在目标 Windows 版本验证 Service、反代、TLS、防火墙、Defender/EDR 和 WSL2 I/O。

### 完成判据

- 在 `.context/GLNT-10/Index.md` 新增“生产验收结果”段；
- 记录环境版本、负载模型、指标结果、失败用例、风险接受人和是否放行；
- 所有高风险失败项有明确修复或书面风险接受；
- 许可证和网络出口得到安全/法律 owner 签字。

### 影响

- 阻塞主流程：是，仅阻塞生产上线，不阻塞受控 POC；
- 完成后下一步：按验收结果进入生产发布或整改；
- 未完成时策略：仅允许隔离环境 POC，不宣称生产可用。
