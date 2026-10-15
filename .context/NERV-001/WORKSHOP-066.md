# Buzz 技术产品调研

> updated_by: Qoder - Claude
> updated_at: 2026-08-09 15:30:00
> evidence_window: 2026-08-09 / desktop-v0.5.8 / main 分支

## 交付结论

### Buzz 不是 Stateful 调度器，而是任务执行宿主与自动化运行器

Buzz 的核心定位是**自托管的团队通信平台**（基于 Nostr 协议），人类与 AI Agent 以平等身份共享同一工作空间。它不具备 Stateful 调度能力——没有持久化的任务对象模型、没有任务生命周期管理、没有任务依赖解析、没有执行归属的持久化分配。

Buzz 的 Agent 工作模式属于**任务执行宿主**：当 @mention 事件到达时，buzz-acp 将事件批量分派给 Agent 子进程执行。任务状态仅存在于 buzz-acp 的内存队列中，进程重启后丢失。Workflow 引擎提供 YAML 定义的自动化触发，但属于**自动化运行器**范畴，非通用任务调度。

### 工作对象模型：Workspace 存在，Task 缺失

- **Community/Workspace**：存在，以 URL 为权威边界，单 relay 单社区或 host 多租户
- **Channel**：存在，Stream/Forum/DM/Workflow 四种类型，是事件组织单元
- **Event**：存在，Nostr 签名事件是统一数据格式，持久化于 Postgres
- **Workflow**：存在，YAML 定义的自动化规则，有状态机（Active/Disabled/Archived）
- **Task**：**不存在**——没有独立的任务对象、任务状态机、任务依赖关系
- **Plan**：**不存在**——没有持久化的编排对象

### Agent 分派：事件驱动的内存队列，非持久化调度

buzz-acp 是 Agent 与 relay 之间的桥梁，采用**事件队列 + 子进程池**模式：

- 事件按 channel 分组进入内存队列（VecDeque），容量 500/channel
- flush_next() 选择最旧事件的 channel，批量 drain 最多 50 事件
- 子进程池 1-32 个 Agent，claim/return 生命周期
- 任务状态（in_flight/retry_counts/retry_after）全部在内存中，进程重启即丢失
- 无任务持久化、无跨进程任务恢复、无执行归属持久化

### Windows 与 macOS 支持：桌面端完整，服务端需自托管

- **macOS**：完整支持，Apple Silicon (aarch64) 与 Intel (x64) 均有 DMG 安装包
- **Windows**：完整支持，x64 安装包（alpha-unsigned，未代码签名），需 Git Bash 环境
- **Linux**：支持，AppImage 与 deb 包
- **服务端**：无官方托管服务，需自托管（Docker Compose 或 Railway 一键部署）

### Local 优先适配：混合形态，核心功能依赖自托管服务端

Buzz 是**本地+自托管混合形态**：

- 桌面客户端（Tauri + React）运行在本地
- 核心功能（消息、搜索、工作流、Git 托管）依赖 buzz-relay 服务端
- 服务端可完全私有化部署（Postgres + Redis + MinIO），无云端 SaaS 强制依赖
- 断网后桌面客户端无法使用核心功能（需连接 relay）

### 开源与闭源：Apache 2.0 全开源，无闭源核心

- 许可证：Apache 2.0
- 全部代码开源，无闭源核心模块
- Block 公司内部版本与 OSS 版本分离（内部版本预配置 relay 与 agent provider）

## 调研目标

- 判断 Buzz 是否具备 Stateful 编排调度能力
- 明确 Buzz 的工作对象模型与任务生命周期
- 评估 Windows 与 macOS 工作机部署形态
- 分析 Local 优先适配程度与私有化改造边界

## 调研范围与边界

### 覆盖范围

- 产品定位、目标用户、核心流程、功能边界
- 技术架构：运行形态、组件、接口、持久化、通信、部署
- Agent 工作模式：任务分派、执行、状态管理
- Windows 与 macOS 双平台支持
- 开源与服务边界

### 明确排除

- 源码审计（仅定点验证关键结论）
- 竞品比较（独立调研，不横向对比）
- 遥测/监控/运营数据采集
- 性能 benchmark

## 产品调研

### 产品定位与目标用户

**一句话定位**：Buzz 是一个自托管的团队工作空间，人类与 AI Agent 以平等成员身份在同一房间协作，基于 Nostr 协议实现统一的事件日志与审计追踪。

**目标用户**：
- 开发团队（尤其是 Block 公司内部及外部技术团队）
- 需要 AI Agent 深度参与代码协作的团队
- 重视数据主权与自托管的组织

**核心场景**：
- Agent 辅助代码审查、bug 分类、发布笔记生成
- 功能分支即房间：patch、CI、review、merge 决策同处一室
- 事件记忆：Agent 搜索历史对话回答"这个错误以前见过吗"

### 核心流程

1. 用户通过桌面客户端（或 CLI）连接自托管 relay
2. 在 channel 中发送消息或 @mention Agent
3. buzz-acp 将事件批量分派给 Agent 子进程
4. Agent 执行（调用 LLM + MCP 工具），结果作为签名事件写回 relay
5. 所有事件（消息、reaction、workflow、git 操作）统一持久化，可搜索、可审计

### 功能地图与边界

| 功能域 | 状态 | 说明 |
|--------|------|------|
| Relay/Channel/Thread/DM | ✅ 可用 | 核心通信 |
| Canvas/Media/Search/Audit | ✅ 可用 | 协作与检索 |
| Desktop App (Tauri+React) | ✅ 可用 | macOS/Windows/Linux |
| buzz-cli + ACP harness | ✅ 可用 | Agent 接入 |
| YAML Workflow | ✅ 可用 | 消息/reaction/schedule/webhook 触发 |
| Git 事件 (NIP-34) | ✅ 可用 | patch/repo/status |
| Git 托管后端 | ✅ 可用 | 智能 HTTP |
| Mobile (iOS/Android) | 🚧 开发中 | Flutter |
| Workflow 审批门 | 🚧 开发中 | 基础设施存在，胶水未干 |
| Huddle 生命周期事件 | 🚧 开发中 | 语音房间 |
| Web-of-trust 跨 relay 声誉 | 💭 规划中 | 未实现 |
| 推送通知 | 💭 规划中 | 未实现 |

### 维护状态与版本演进

- **维护状态**：活跃开发中，Block 公司官方项目
- **最新版本**：desktop-v0.5.8（2026-08-08）
- **发布频率**：高频率，近 5 个版本在 2026-08-03 至 2026-08-08 间发布
- **仓库数据**：25.4k stars，3k forks，2.3k open issues（数据为公开快照，反映社区关注度）
- **演进方向**：从 v0.5.4 到 v0.5.8 持续修复桌面端与 Agent 相关问题，功能快速迭代

### 生态与反馈

- **官方集成**：Goose、Codex、Claude Code 通过 ACP 接入
- **扩展点**：MCP 工具服务器、YAML workflow、自定义 Agent
- **社区入口**：GitHub Issues（2.3k open，样本量大，反映早期 adoption 阶段的反馈密度）
- **反馈主题**：桌面端稳定性、Agent 流程统一、Windows 支持完善（从 release notes 归纳）

## 技术架构调研

### 系统全貌与运行形态

```
┌─────────────────────────────────────────────────────────┐
│  Clients                                                │
│  Human (Desktop/Web/Mobile)  Agent (buzz-cli/ACP)      │
│           │                           │                 │
│           └──────── WebSocket ────────┘                 │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  buzz-relay (Axum)                                      │
│  NIP-01 WS + REST bridge + NIP-42 auth + NIP-98 HTTP   │
│  SubscriptionRegistry (DashMap fan-out)                │
└──────┬──────────────┬───────────────────────────────────┘
       │              │
┌──────▼──────┐  ┌────▼──────┐  ┌─────────────┐
│  Postgres   │  │   Redis   │  │  S3/MinIO   │
│  (events,   │  │  (pub/sub │  │  (Blossom   │
│   channels, │  │   presence│  │   media)    │
│   workflows,│  │   typing) │  └─────────────┘
│   audit)    │  └───────────┘
└─────────────┘
```

**运行形态**：
- **buzz-relay**：Rust Axum WebSocket 服务器，单源真相，无 P2P/gossip/replication
- **Desktop App**：Tauri + React，连接 relay
- **buzz-cli**：Agent-first CLI，JSON in/out
- **buzz-acp**：Agent 子进程池，桥接 relay 事件到 AI Agent
- **buzz-agent**：ACP Agent，调用 LLM + MCP 工具

### 主要组件与核心链路

**Crate 依赖层次**：
```
buzz-core (零 I/O 类型/验证)
├── buzz-db (Postgres: events/channels/tokens/workflows/audit)
├── buzz-auth (NIP-42/98, API tokens, scopes)
├── buzz-pubsub (Redis pub/sub, presence, typing)
├── buzz-search (Postgres FTS)
├── buzz-audit (hash-chain log)
└── buzz-workflow (YAML automation)
    └── buzz-relay (服务器，编排所有子系统)

buzz-acp (Agent harness — relay @mentions → AI agents via ACP/JSON-RPC)
buzz-sdk (typed event builders)
buzz-media (Blossom/S3)
buzz-cli (agent-first CLI)
buzz-admin (operator CLI)
```

**核心链路：Agent 处理 @mention**

1. 用户在 channel 发送消息 @mention Agent
2. buzz-relay 验证签名、检查 channel 成员、写入 Postgres
3. buzz-relay 通过 Redis pub/sub fan-out 到订阅者
4. buzz-acp 接收到事件，按 channel 分组进入内存队列
5. buzz-acp flush_next() 选择最旧 channel，批量 drain 事件
6. buzz-acp 从子进程池 claim 一个 Agent，发送 ACP session/prompt
7. Agent 调用 LLM + MCP 工具执行，生成响应
8. 响应作为签名事件通过 buzz-cli 写回 relay
9. relay 持久化并 fan-out 到 channel 成员

### 主要依赖

| 依赖 | 类型 | 说明 |
|------|------|------|
| Postgres 17 | 硬依赖 | 事件存储、channel、workflow、audit、FTS |
| Redis 7 | 硬依赖 | pub/sub fan-out、presence、typing |
| S3/MinIO | 硬依赖 | 媒体存储（Blossom） |
| Docker | 部署依赖 | 本地开发栈 |
| Rust 1.88+ | 构建依赖 | 源码构建 |
| Node 24+ / pnpm 10+ | 构建依赖 | Desktop 前端构建 |
| Git Bash (Windows) | 运行时依赖 | Agent shell 工具 |

### 接口形态

| 接口 | 类型 | 用途 |
|------|------|------|
| WebSocket (NIP-01) | 主接口 | 客户端与 relay 实时通信 |
| REST bridge | HTTP | /events, /query, /count, /hooks, /media, /git |
| NIP-42 | WebSocket auth | Schnorr 签名挑战/响应 |
| NIP-98 | HTTP auth | Schnorr 签名 kind:27235 事件 |
| ACP (Agent Client Protocol) | stdio JSON-RPC | buzz-acp 与 Agent 通信 |
| MCP (Model Context Protocol) | stdio JSON-RPC | Agent 与工具服务器通信 |
| buzz-cli | CLI JSON | Agent-first 命令行 |

### 持久化方式

| 数据 | 存储 | 说明 |
|------|------|------|
| Nostr 事件 | Postgres | 按月分区，ON CONFLICT DO NOTHING 幂等 |
| Channel/成员 | Postgres | 事务性角色 enforcement |
| Workflow 定义/运行 | Postgres | 状态机 Active/Disabled/Archived |
| Audit 日志 | Postgres | hash-chain，pg_advisory_lock 单写者 |
| 搜索索引 | Postgres FTS | search_tsv generated column + GIN |
| Presence/Typing | Redis | SET EX 180s / ZADD 5s window |
| 媒体文件 | S3/MinIO | Blossom 协议 |

**关键结论**：任务状态（buzz-acp 队列）**不持久化**，仅在内存中。

### 通信方式

| 场景 | 模式 | 说明 |
|------|------|------|
| Client ↔ Relay | WebSocket 长连接 | NIP-01 协议，30s ping/3 missed pong 断开 |
| Relay 内部 fan-out | 进程内 + Redis pub/sub | 单进程 DashMap，多节点 Redis PSUBSCRIBE |
| buzz-acp ↔ Agent | stdio JSON-RPC | ACP 协议，1-32 子进程池 |
| Agent ↔ MCP 工具 | stdio JSON-RPC | MCP 协议，每 session 独立 MCP 实例 |
| Workflow 触发 | 事件驱动 + 60s cron tick | 事件触发即时，schedule 触发 60s 轮询 |

### 部署形态

#### 工作机安装（Windows / macOS）

| 平台 | 安装方式 | 入口 | 依赖 | 权限 | 网络要求 | 卸载 |
|------|----------|------|------|------|----------|------|
| macOS (Apple Silicon) | DMG | Buzz.app | 无 | 标准用户 | 需连接 relay | 删除 .app |
| macOS (Intel) | DMG | Buzz.app | 无 | 标准用户 | 需连接 relay | 删除 .app |
| Windows (x64) | EXE (alpha-unsigned) | Buzz.exe | Git Bash | 标准用户（SmartScreen 警告） | 需连接 relay | 卸载程序 |
| Linux | AppImage/deb | Buzz | 无 | 标准用户 | 需连接 relay | 删除/包管理 |

**默认连接**：ws://localhost:3000，可通过 BUZZ_RELAY_URL 环境变量或应用内切换。

#### 主体功能运行位置

- **桌面客户端**：本地运行（Tauri + React）
- **核心功能**：依赖 buzz-relay 服务端
- **服务端**：可完全私有化部署（Docker Compose: Postgres + Redis + MinIO + relay）
- **云端依赖**：无强制云端 SaaS 依赖；Railway 一键部署为可选便利

**Local 优先适配判断**：✅ **适配**——服务端可完全私有化，无数据离开工作机边界（除自托管 relay）。

#### 云端形态（如存在）

Buzz 无官方云端 SaaS 服务。可选部署方式：
- **自托管**：Docker Compose（开发/生产）
- **Railway**：一键部署（第三方平台，非 Block 官方运营）

**数据边界**：所有数据（事件、媒体、workflow）存储在自托管 Postgres/Redis/S3 中，无数据发送至 Block 或第三方。

## 未决项与证据边界

### 已确认事实

- Buzz 是通信平台，非任务调度器（README、ARCHITECTURE.md）
- 无 Task 对象模型，无任务生命周期持久化（源码验证）
- buzz-acp 任务队列在内存中，进程重启丢失（queue.rs 源码）
- Windows/macOS/Linux 桌面端完整支持（release assets）
- Apache 2.0 全开源（LICENSE）

### 架构推导

- Buzz 的 Agent 模式属于"任务执行宿主"：事件到达后启动 Agent 执行，无任务调度能力
- Workflow 引擎属于"自动化运行器"：YAML 定义触发规则，非通用任务编排
- 若需 Stateful 调度，需在外部系统（如 Temporal、Cadence）与 Buzz 之间建立桥接

### 社区反馈样本边界

- GitHub Issues 2.3k open 为公开快照，反映早期 adoption 阶段的高反馈密度
- Release notes 显示桌面端稳定性与 Windows 支持为近期重点
- 样本时间：2026-08-03 至 2026-08-09

### 未决项

- 移动端（iOS/Android）具体发布时间未确认
- Workflow 审批门（approval gates）完整实现时间未确认
- 多 relay 联邦（web-of-trust）为长期愿景，无实现时间表

## 后续验证建议

1. **运行验证**：实际部署 buzz-relay + desktop app，验证 Windows 与 macOS 双平台安装与连接
2. **Agent 流程验证**：通过 buzz-acp 接入自定义 Agent，验证事件队列与批量处理行为
3. **持久化验证**：重启 buzz-acp 进程，确认任务队列状态丢失（预期行为）
4. **私有化验证**：离线环境部署 Docker Compose 栈，确认无外部依赖

## 选型缺陷标注

| 缺陷 | 说明 | 影响 |
|------|------|------|
| 非 Stateful 调度器 | 无任务对象、无生命周期、无依赖解析 | 无法直接用于需要持久任务编排的场景 |
| 任务状态内存化 | buzz-acp 队列进程重启丢失 | 需外部系统补充任务持久化与恢复 |
| Windows 未代码签名 | SmartScreen 警告 | 企业部署需额外安全评估 |
| 移动端未发布 | iOS/Android 开发中 | 移动场景暂不可用 |

---

*本报告仅针对 Buzz 单一产品，不包含竞品比较或选型矩阵。*
