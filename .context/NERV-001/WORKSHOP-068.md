# QM 技术产品调研

> updated_by: Qoder - Claude
> updated_at: 2026-08-09 15:45:00
> evidence_window: 2026-08-09 / main 分支 / 无法获取最新 release（GitHub API 超时）

## 交付结论

### QM 不是 Stateful 调度器，而是多租户 Agent 工作平台

QM（Multiplayer agent harness for work）的核心定位是**面向初创公司的多用户 Agent 工作平台**。它不具备 Stateful 调度能力——没有持久化的任务对象模型、没有任务依赖解析、没有跨任务的生命周期管理。QM 的"任务"是**会话内的待办事项**（session-scoped todo），而非独立调度的任务对象。

QM 的核心价值在于**多租户隔离的 Agent 工作空间**：每个员工拥有独立的工作空间（memory、files、keychain、permissions、crons、sandbox），同时可以在 Slack channel 和项目中协作。Agent 通过 harness（Pi、OpenCode、Codex、Claude Code）驱动，支持模型切换。

### 工作对象模型：Session 存在，Task 为会话内待办

- **Organization**：存在，部署边界，对应一个 QM 实例
- **Scope**：存在，个人或共享工作空间（个人 scope / channel scope / project scope）
- **Session**：存在，Agent 与用户的对话会话，持久化于 Postgres
- **Task**：**存在但为会话内待办**——`src/tasks/task-store.ts` 定义 Task 为 `sessionId + originRunId + title + status`，状态机为 `pending → in_progress → completed/skipped/failed`，**无跨会话依赖、无优先级、无调度策略**
- **Cron**：存在，定时触发器，持久化于 Postgres，支持 `everyMs` 间隔和 `cron` 表达式
- **Run**：存在，一次 Agent 执行（turn），状态机 `pending → running → done/failed`，支持 lease、retry、requeue

### Agent 分派：Run 队列 + Worker 执行，非中心调度

QM 的 Agent 执行采用**Run 队列 + Worker 池**模式：

- **RunStore**：持久化 Run 队列（Postgres），支持 `enqueue`、`claim`、`heartbeat`、`complete`、`fail`
- **Worker**：从 RunStore claim Run，执行 Agent turn，返回结果
- **Lease**：Run 有 leaseToken + leaseExpiresAt，防止多 Worker 重复执行
- **Retry**：`maxAttempts` 控制重试次数，`errorAttempts` 计数，`errorParks` 判断是否 park
- **Reaper**：`reapExpired` 处理过期 lease，requeue 或 park

**关键结论**：Run 是**一次 Agent 执行**，不是独立任务。Run 的调度是**FIFO + lease**，无优先级、无依赖解析、无 DAG。

### Windows 与 macOS 支持：无桌面客户端，Web + Slack 接入

QM **没有原生桌面客户端**：

- **Web UI**：可选插件，通过浏览器访问
- **Slack**：可选插件，通过 Slack 工作区接入
- **CLI**：`qm` CLI 用于部署和管理，非终端用户工具

**Windows/macOS 支持**：通过 Web 浏览器或 Slack 客户端间接支持，无平台特定安装包。

### Local 优先适配：云端 SaaS 形态，无本地运行选项

QM 是**云端 SaaS / 自托管混合形态**：

- **核心服务**：运行在云端（Fly.io 或 AWS），需 Postgres、ECS/Fargate、Lambda MicroVM
- **无本地运行选项**：无单机模式，无本地桌面应用
- **数据存储**：全部数据在云端 Postgres，无本地持久化

**Local 优先适配判断**：❌ **不适配**——QM 是云端服务，核心功能依赖云端基础设施，无本地运行形态。

### 开源与闭源：MIT 全开源，核心无闭源

- 许可证：MIT
- 全部代码开源，无闭源核心模块
- 部署通过 npm 包 `@yc-software/qm`，支持私有 fork 定制

## 调研目标

- 判断 QM 是否具备 Stateful 编排调度能力
- 明确 QM 的工作对象模型与任务生命周期
- 评估 Windows 与 macOS 工作机部署形态
- 分析 Local 优先适配程度与私有化改造边界

## 调研范围与边界

### 覆盖范围

- 产品定位、目标用户、核心流程、功能边界
- 技术架构：运行形态、组件、接口、持久化、通信、部署
- Agent 工作模式：任务分派、执行、状态管理
- Windows 与 macOS 支持
- 开源与服务边界

### 明确排除

- 源码审计（仅定点验证关键结论）
- 竞品比较（独立调研，不横向对比）
- 遥测/监控/运营数据采集
- 性能 benchmark

## 产品调研

### 产品定位与目标用户

**一句话定位**：QM 是面向初创公司的多用户 Agent 工作平台，每个员工拥有独立工作空间，同时可在 Slack 和 Web 中协作。

**目标用户**：
- 初创公司（startups）
- 需要多员工独立使用 Agent 的组织
- 需要 Slack 集成和 Web 访问的团队

**核心场景**：
- 员工个人 Agent 助手（独立 memory、files、permissions）
- Slack channel 中协作（共享 scope）
- 定时任务（cron）和后台工作（watches）
- 内部应用构建和发布（web apps）

### 核心流程

1. 组织部署 QM 到 Fly.io 或 AWS（通过 `qm` CLI）
2. 员工通过 Web 或 Slack 访问 QM
3. 员工在个人 scope 或共享 scope 中与 Agent 交互
4. Agent 通过 harness（Pi/OpenCode/Codex/Claude Code）执行
5. 会话历史、memory、文件持久化于 Postgres
6. Cron 定时触发后台任务

### 功能地图与边界

| 功能域 | 状态 | 说明 |
|--------|------|------|
| 个人/共享 scope | ✅ 可用 | 隔离的 memory、files、permissions |
| Slack 集成 | ✅ 可用 | Bolt 框架，Socket Mode |
| Web UI | ✅ 可用 | Vite + Lit |
| Admin 控制 | ✅ 可用 | org-level 配置、安全策略 |
| Web apps | ✅ 可用 | 自定义内部应用 |
| Shared skills | ✅ 可用 | scope-owned，可共享 |
| Cron/后台工作 | ✅ 可用 | 定时触发器 |
| 多 harness 支持 | ✅ 可用 | Pi、OpenCode、Codex、Claude Code |
| 桌面客户端 | ❌ 不存在 | 无原生桌面应用 |
| 移动客户端 | ❌ 不存在 | 无原生移动应用 |

### 维护状态与版本演进

- **维护状态**：活跃开发中，YC（Y Combinator）相关项目
- **仓库数据**：12.7k stars，1.5k forks，163 open issues（数据为公开快照）
- **创建时间**：2026-07-29（非常新的项目）
- **最近 push**：2026-08-09（活跃开发）
- **版本演进**：无法获取 release 历史（GitHub API 超时），从 commit 频率判断为快速迭代

### 生态与反馈

- **官方集成**：Slack、Web、Pi、OpenCode、Codex、Claude Code
- **扩展点**：自定义 harness、自定义 skills、web apps
- **社区入口**：GitHub Issues、Discussions
- **反馈主题**：作为新项目，反馈密度较低，主要围绕部署和配置

## 技术架构调研

### 系统全貌与运行形态

```
┌─────────────────────────────────────────────────────────┐
│  Surfaces                                               │
│  Slack (Bolt)  Web UI (Vite+Lit)  Admin  Portal        │
│       │              │              │       │           │
│       └──────────────┴──────────────┴───────┘           │
│                      │ HTTP API                         │
└──────────────────────┼──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Core (Fastify)                                         │
│  API · identity · policy · scheduler                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────┐ │
│  │  Auth   │  │  ACL    │  │  Cron   │  │  Session  │ │
│  │  Broker │  │  Policy │  │Scheduler│  │  Store    │ │
│  └─────────┘  └─────────┘  └─────────┘  └───────────┘ │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────┐ │
│  │  Task   │  │  Run    │  │  Memory │  │  Sandbox  │ │
│  │  Store  │  │  Store  │  │  Store  │  │  Manager  │ │
│  └─────────┘  └─────────┘  └─────────┘  └───────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ┌─────────┐   ┌─────────┐   ┌─────────────┐
   │Postgres │   │  Agent  │   │  Sandbox    │
   │(sessions│   │ Harness │   │ (per-scope  │
   │ memory  │   │(Pi/etc) │   │  isolated)  │
   │ queue)  │   └─────────┘   └─────────────┘
   └─────────┘
```

**运行形态**：
- **Core**：Node.js + Fastify，TypeScript，单进程或多进程
- **Database**：Postgres（RDS on AWS / Fly Postgres）
- **Sandbox**：per-scope 隔离环境（Lambda MicroVM on AWS / Fly Machines）
- **Surfaces**：Slack（in-process plugin）、Web UI（optional plugin）

### 主要组件与核心链路

**源码结构**（`src/`）：
```
acl/          # 访问控制
admin/        # 管理界面
api/          # HTTP API
audit/        # 审计日志
auth/         # 认证
classify/     # 安全分类
connectors/   # 外部连接器
core/         # 核心编排
credentials/  # 凭证管理
cron/         # 定时任务
delivery/     # 消息投递
deploy/       # 部署
deployment/   # 部署层
directory/    # 目录
environments/ # 环境
files/        # 文件
harness/      # Agent harness
idempotency/  # 幂等
identity/     # 身份
insights/     # 洞察
memory/       # 记忆
model/        # 模型
monitors/     # 监控
onboarding/   #  onboarding
persistence/  # 持久化
policy/       # 策略
processes/    # 进程
projects/     # 项目
ratelimit/    # 限流
reach/        # 触达
resolution/   # 解析
runs/         # Run 执行
sandbox/      # 沙箱
security/     # 安全
sessions/     # 会话
skills/       # 技能
slack/        # Slack 集成
surface-cache/# 表面缓存
surfaces/     # 表面
tasks/        # 任务
tools/        # 工具
triggers/     # 触发器
util/         # 工具
wake/         # 唤醒
workspace/    # 工作空间
```

**核心链路：用户消息到 Agent 响应**

1. 用户通过 Slack 或 Web 发送消息
2. Core API 接收请求，解析 scope（个人/channel/project）
3. 创建或恢复 Session，加载 memory 和 history
4. 创建 Run（`enqueue` 到 RunStore）
5. Worker 从 RunStore `claim` Run（lease 机制）
6. Worker 调用 Agent harness（Pi/OpenCode/Codex/Claude Code）
7. Agent 在 scope 的 sandbox 中执行工具调用
8. 结果写回 Session，更新 memory
9. 响应投递到 Slack 或 Web

### 主要依赖

| 依赖 | 类型 | 说明 |
|------|------|------|
| Postgres | 硬依赖 | sessions、memory、queue、tasks、crons |
| Node.js 24 | 运行时 | Core 服务 |
| Docker | 部署依赖 | 本地开发、镜像构建 |
| Fly.io / AWS | 部署目标 | 云端托管 |
| Lambda MicroVM (AWS) | 沙箱 | per-scope 隔离执行环境 |
| Slack API | 可选 | Slack 集成 |
| Resend/SMTP | 可选 | 邮件认证 |

### 接口形态

| 接口 | 类型 | 用途 |
|------|------|------|
| HTTP API | REST | Core 服务接口 |
| Slack Bolt | WebSocket/Socket Mode | Slack 集成 |
| ACP (Agent Client Protocol) | stdio JSON-RPC | Agent harness 通信 |
| MCP (Model Context Protocol) | stdio JSON-RPC | Agent 工具调用 |
| `qm` CLI | 命令行 | 部署和管理 |

### 持久化方式

| 数据 | 存储 | 说明 |
|------|------|------|
| Session | Postgres | 会话历史、状态 |
| Memory | Postgres | scope 级记忆 |
| Task | Postgres | 会话内待办（`src/tasks/`） |
| Run | Postgres | Agent 执行队列（`src/runs/`） |
| Cron | Postgres | 定时任务（`src/cron/`） |
| Audit | Postgres | 审计日志 |
| Files | Sandbox 文件系统 | per-scope 隔离 |
| Secrets | AWS Secrets Manager / Fly secrets | 凭证 |

**关键结论**：Task 是**会话内待办**，非独立调度任务；Run 是**Agent 执行队列**，支持 lease、retry、requeue，但无优先级、无依赖解析。

### 通信方式

| 场景 | 模式 | 说明 |
|------|------|------|
| Client ↔ Core | HTTP / WebSocket | Slack Socket Mode、Web UI |
| Core ↔ Postgres | TCP | 连接池 |
| Core ↔ Sandbox | 进程内 / RPC | per-scope 隔离 |
| Worker ↔ Agent | stdio JSON-RPC | ACP 协议 |
| Agent ↔ MCP | stdio JSON-RPC | MCP 协议 |
| Cron 触发 | 内部调度 | `src/cron/scheduler.ts`，支持 lease、job queue |

### 部署形态

#### 工作机安装（Windows / macOS）

QM **无桌面客户端**，工作机通过以下方式接入：

| 平台 | 接入方式 | 说明 |
|------|----------|------|
| Windows | Web 浏览器 / Slack 客户端 | 无原生应用 |
| macOS | Web 浏览器 / Slack 客户端 | 无原生应用 |
| Linux | Web 浏览器 / Slack 客户端 | 无原生应用 |

**无平台特定安装包、无本地依赖、无本地运行形态。**

#### 主体功能运行位置

- **Core 服务**：云端（Fly.io 或 AWS）
- **Database**：云端 Postgres（RDS / Fly Postgres）
- **Sandbox**：云端（Lambda MicroVM / Fly Machines）
- **Web UI / Slack**：云端托管，客户端通过浏览器/Slack 访问

**Local 优先适配判断**：❌ **不适配**——QM 是云端 SaaS 形态，核心功能依赖云端基础设施，无本地运行选项。

#### 云端形态

- **Fly.io**：Fly Apps + Fly Machines + Fly Postgres
- **AWS**：ECS Fargate + Lambda MicroVM + RDS + Secrets Manager + Cloud Map + ALB + CloudFront

**数据边界**：所有数据存储在部署者自己的云账户中，无数据发送至 YC 或第三方。

## 未决项与证据边界

### 已确认事实

- QM 是多用户 Agent 工作平台，非任务调度器（README）
- Task 是会话内待办，无跨会话依赖（`src/tasks/task-store.ts`）
- Run 是 Agent 执行队列，支持 lease、retry（`src/runs/run-store.ts`）
- 无桌面客户端，Web + Slack 接入（README）
- 云端 SaaS 形态，无本地运行选项（README、deploy-directory.md）
- MIT 全开源（LICENSE）

### 架构推导

- QM 的 Run 队列属于**任务执行宿主**模式：任务到达后启动 Agent 执行，无中心调度
- Cron 调度属于**自动化运行器**：定时触发，非通用任务编排
- 若需 Stateful 调度，需在外部系统与 QM 之间建立桥接

### 社区反馈样本边界

- GitHub 数据为公开快照：12.7k stars，1.5k forks，163 open issues
- 项目创建于 2026-07-29，非常新，反馈密度低
- 样本时间：2026-08-09

### 未决项

- 最新 release 版本号无法获取（GitHub API 超时）
- 具体版本演进历史未确认
- 移动端支持计划未确认
- 私有化部署的最低资源要求未确认

## 后续验证建议

1. **运行验证**：实际部署 QM 到 Fly.io 或 AWS，验证 Web 和 Slack 接入
2. **Agent 流程验证**：配置 harness（Pi/OpenCode/Codex/Claude Code），验证 Run 队列执行
3. **Cron 验证**：创建定时任务，验证 scheduler 触发和 lease 机制
4. **多租户验证**：创建多个 scope，验证隔离和协作

## 选型缺陷标注

| 缺陷 | 说明 | 影响 |
|------|------|------|
| 非 Stateful 调度器 | Task 为会话内待办，无跨任务调度 | 无法用于复杂任务编排场景 |
| 无桌面客户端 | 仅 Web + Slack | 离线场景不可用 |
| 云端 SaaS 形态 | 无本地运行选项 | 数据必须上云，Local 优先不适配 |
| 项目极新 | 2026-07-29 创建 | 生态不成熟，生产风险高 |
| 无移动端 | 无 iOS/Android 应用 | 移动场景不可用 |

---

*本报告仅针对 QM 单一产品，不包含竞品比较或选型矩阵。*
