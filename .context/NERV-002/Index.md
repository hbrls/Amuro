# Routa 二开调研与 Backlog Manager 适配分析

> updated_by: Qoder - Qoder
> updated_at: 2026-08-22 15:30:00

## 议题

评估 Routa 作为 GLNT-011 Backlog Manager 二开基座的可行性，识别其架构边界、改造范围与收缩路径。

本议题基于 WORKSHOP-079 的调研结论，将 Routa 从「多智能体协同平台」重新定位为潜在的 Backlog Manager 基座候选，重点分析其能否满足 Local-first、Manager-driven、Issue 数据外置的核心约束。

## 调研边界与证据窗口

本报告只研究 Routa 作为 GLNT-011 Backlog Manager 二开基座的工程面：

- 开发语言、框架和构建工具。
- 源码组织、进程模型与可复用边界。
- Local SQLite 的驱动、文件形式、初始化和升级方式。
- 当前桌面交付形态与跨平台支持。
- 从多智能体协同平台收缩为 Backlog Manager 的主要工程负担。

本报告不设计 Rule Engine 规则，不设计 Issue Data/API Service 的字段与 API，不把 Routa 现有 Task 模型视为 GLNT-011 的 Issue 模型，也不运行依赖安装、编译、服务启动或实机安装验证。

调研对象：

| 项目 | 取值 |
| --- | --- |
| 上游仓库 | `routa-dev/routa` |
| 固定快照 | `main` 分支 2026-08-21 快照 |
| 调研日期 | 2026-08-22 |
| 证据来源 | [WORKSHOP-079](../GLNT-10/WORKSHOP-079.md)（已归档至 [Routa.md](./Routa.md)） |

## 开发语言和框架

### 技术栈

| 层次 | 技术 | 当前版本或约束 | 二开意义 |
| --- | --- | --- | --- |
| 桌面壳 | Tauri v2 | Rust 侧锁定 | 使用系统 WebView，可生成 Windows/macOS 安装包 |
| 前端 | Next.js 15 | React 19 | 现有 Web/Desktop UI 主体 |
| 前端语言 | TypeScript | 5.x | 前后端契约和 UI 开发 |
| 后端 | Rust + TypeScript 双后端 | Axum (Rust) / Node.js | 桌面端 Rust Server，Web 端可 Node.js |
| 本地 HTTP Server | Axum | 0.8 | 桌面模式 127.0.0.1:3210 |
| 数据库 | SQLite / Postgres / InMemory | 多后端支持 | Local 桌面默认 SQLite，零配置 |
| 协议层 | ACP / MCP / A2A / AG-UI / A2UI | 开放协议 | Agent 协作与工具暴露 |
| 构建 | pnpm / Cargo | Node 20+ / Rust 稳定版 | 前端与桌面端构建 |

Python 未出现在产品启动链路中，满足 GLNT-011 的硬约束。

### 开发和构建入口

上游开发入口：

```bash
# Web 模式
pnpm install
pnpm run dev

# Desktop 模式
pnpm run tauri:dev
```

正式构建：

```bash
# Web 自托管
pnpm run build
pnpm run start

# Desktop 安装包
pnpm run tauri:build
```

Tauri 构建链路：

```text
开发：pnpm run dev:frontend
         └─ Next.js Dev Server
                    └─ Tauri Dev Host

生产：pnpm run build
         └─ Next.js 静态导出
                    └─ Tauri 打包原生应用
```

上游已发布 Windows x64/arm64、macOS x64/arm64 和 Linux 安装包，说明跨平台桌面构建与交付链路已经存在。

## 当前源码与进程结构

### 当前是 Tauri 桌面应用 + 本地 Rust Server

Routa 桌面模式的运行形态：

```text
┌─────────────────────────────────────────┐
│           用户工作机                     │
│  ┌─────────────────────────────────┐    │
│  │      Tauri v2 桌面应用           │    │
│  │  ┌─────────┐  ┌─────────────┐   │    │
│  │  │ Next.js │  │  Rust 原生   │   │    │
│  │  │  前端    │  │  窗口/菜单   │   │    │
│  │  └────┬────┘  └─────────────┘   │    │
│  │       │ HTTP/SSE                 │    │
│  │  ┌────▼─────────────────────┐   │    │
│  │  │   Rust Axum Server        │   │    │
│  │  │   (127.0.0.1:3210)        │   │    │
│  │  │   - Workspace APIs        │   │    │
│  │  │   - Kanban/Tasks/Sessions │   │    │
│  │  │   - Harness Console       │   │    │
│  │  │   - Trace APIs            │   │    │
│  │  └──────────────────────────┘   │    │
│  └─────────────────────────────────┘    │
│              ↓ 本地调用                  │
│  ┌─────────────────────────────────┐    │
│  │   SQLite / Postgres             │    │
│  │   本地 Git 仓库 / Worktree       │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
              ↓ 外部调用
┌─────────────────────────────────────────┐
│   Claude Code / OpenCode / Codex        │
│   （通过 ACP/MCP 协议接入）              │
└─────────────────────────────────────────┘
```

与 ORG-2 类似，Routa 是 Tauri 单进程桌面架构，不是 Gitea 式「本地 Web Server + Browser」架构。但 Routa 的 Rust Axum Server 已经托管了完整的 Workspace/Task/Session API，这比 ORG-2 的 IDE Server 更接近 Backlog Manager 的需求。

### 核心组件与职责

| 组件 | 职责 | 技术栈 | 二开判断 |
| --- | --- | --- | --- |
| RoutaSystem | 协调平面中心对象，组合 Stores/EventBus/Tools | TypeScript/Rust | **高价值**，可参考其协调层设计 |
| Stores | 状态持久化（AgentStore/TaskStore/ConversationStore/WorkspaceStore） | SQLite/Postgres | **中高价值**，TaskStore 结构完整，但需评估是否作为 Issue 真相 |
| EventBus | 事件驱动协作，支持 one-shot、priority、after_all 订阅语义 | 内存事件总线 | **中价值**，可参考事件模型，但 Manager Step 语义不同 |
| Tools | 协作动作封装（MCP 工具） | MCP Server | **低价值**，属于 Agent 执行层，第一阶段应隔离 |
| Kanban | 看板工作流管理 | Next.js + Rust | **不采用**，GLNT-011 明确排除 Kanban |
| Harness | 交付 Gate 控制 | Entrix Fitness | **低价值**，属于执行层质量门禁 |

### 已存在的复用价值

| 现有部分 | 复用判断 | 原因 |
| --- | --- | --- |
| Tauri + Next.js 桌面壳 | 高 | 跨平台桌面交付已经跑通，是 Routa 的主要基座价值 |
| Rust Axum Server | 高 | 已托管完整 REST API，比 ORG-2 的 IDE Server 更接近 Manager 需求 |
| SQLite 本地存储 | 高 | 桌面模式默认 SQLite，零配置，满足 Local-first |
| Task 结构化模型 | 中高 | 包含 title/objective/scope/acceptanceCriteria 等完整字段，但需评估是否作为 Issue 真相 |
| 事件驱动架构 | 中 | EventBus 设计成熟，但 Manager Step 语义与 Task 执行语义不同 |
| ACP/MCP 协议层 | 低 | 属于 Agent 执行层，第一阶段应隔离 |
| Kanban 工作流 | 不采用 | GLNT-011 明确排除 Kanban 和 Sprint |
| 多 Agent 角色协同 | 不采用 | 属于 Agent Team 执行层，第一阶段排除 |

### 推荐的二开边界

建议新增独立的 Manager 包和 composition root：

```text
manager-core
  ├─ Continue / Manager Step 状态机
  ├─ Rule Engine Port
  ├─ Issue Data Adapter Port
  └─ 不依赖 RoutaSystem / EventBus / MCP / ACP

manager-store-sqlite
  ├─ Manager 控制状态
  ├─ 版本化 migration
  └─ SQLite Repository

manager-api
  ├─ Continue command
  ├─ Manager state query
  └─ SSE 状态事件

manager-ui
  └─ Next.js Manager 页面（复用 Routa 前端工程壳）

routa-manager-desktop
  ├─ Tauri + Next.js 客户端
  └─ 第一阶段可同时承载 manager-api

issue-adapters
  └─ 对接黑盒 Issue Data/API Service
```

第一阶段可以继续复用同一个 Tauri 应用和 Next.js 工程，不要求立即拆成多个仓库。关键是让新的 Manager Core 不导入 RoutaSystem、EventBus、MCP Tools 和现有 Kanban Controller；这样删除旧功能、未来升级为独立 Service 或更换 Issue Data Service 都不会再次重写 Manager Core。

## Local 数据库形式

### 数据库文件

Routa 桌面模式默认使用 SQLite，具体文件路径未在 WORKSHOP-079 中明确，但确认：

- 桌面模式默认 SQLite，零配置。
- 支持 Postgres 作为自托管 Web 模式的替代。
- 支持 InMemory 用于测试/开发。

对 Backlog Manager 二开而言，不建议继续把控制状态写入 Routa 的现有 Task schema。更合理的目标是：

```text
manager-data/
  ├─ manager.db
  ├─ manager.toml 或 manager.yaml
  └─ logs/
```

Issue、Business Form 和 Relationship 的真相仍位于外部 Issue Data/API Service；`manager.db` 只保存 Manager 自己的推进与控制状态。

### SQLite 链接方式

WORKSHOP-079 未明确 Routa 的 SQLite 驱动细节，但确认：

- 桌面模式默认 SQLite，无需外部数据库服务。
- 支持 Postgres 作为可选替代。

需要进一步验证：

- SQLite 驱动是否为纯 Rust 实现（如 `rusqlite` bundled）或需要 CGO。
- 是否启用 WAL 模式和 busy timeout。
- 是否支持版本化 migration。

### 数据所有权

Routa 的 Local 数据所有权方向符合 GLNT-011 要求：

```text
Local Manager Core
  ├─ manager.db：Manager 控制状态
  ├─ Issue Data Adapter：访问外部 Issue 真相
  └─ 可选 Cloud：未来同步或协作增强
```

Routa 桌面模式完全本地运行，无云端强依赖，仅模型推理需调用外部 LLM API。这满足 Local-first 约束。

## 当前启动与交付形式

### 开发启动

```bash
pnpm install
pnpm run tauri:dev
```

开发时 Next.js 监听本地端口，Tauri 窗口加载该 URL；Rust Backend 与窗口进程一起启动。

### 正式启动

正式构建后，前端静态资源进入 Tauri bundle，由系统 WebView 加载。用户启动 Routa EXE 后，Tauri Event Loop、Rust Backend 和后台资源在同一进程运行。

上游已发布：

- Windows x64/arm64 安装包（.exe）
- macOS x64/arm64 安装包（.dmg）
- Linux 安装包

这说明跨平台桌面构建与交付链路已经存在，是 Routa 相比 AgentRQ 的主要优势。

### 当前可达到的后台运行级别

| 级别 | 当前是否具备 | 说明 |
| --- | --- | --- |
| 窗口打开时运行 | 是 | 标准 Tauri GUI |
| 关闭窗口后托盘常驻 | 待验证 | WORKSHOP-079 未明确说明 |
| Browser 访问 Release GUI | 否 | Tauri WebView 加载内部资源，不通过 HTTP |
| Browser 访问本地 API | 是 | Axum 绑定 127.0.0.1:3210 |
| 用户登录后自动启动 | 未发现 | 没有 autostart 插件或对应入口 |
| 用户注销后继续运行 | 否 | 当前进程属于用户桌面 Session |
| 开机即由 SCM 启动 | 否 | 没有 Windows Service 注册和生命周期实现 |
| 无 WebView / 无桌面会话运行 | 待验证 | 需要确认是否支持 headless 模式 |

## Backlog Manager 适配判断

### 领域概念对应

| GLNT-011 概念 | Routa 现状 | 二开判断 |
| --- | --- | --- |
| Project | Workspace | 不直接映射；Project 真相由外部 Data Service 提供 |
| Backlog | Task 列表（看板泳道） | 不复用为数据真相，通过 Data Adapter 读取 |
| Issue | Task（含 title/objective/scope/acceptanceCriteria） | 结构完整，但需评估是否作为 Issue 真相或仅参考 |
| Business Form | 无对应抽象 | 由外部服务提供，Manager 只消费 |
| Relationship | dependencies / parallelGroup | 语义接近，但面向任务执行，不是 Backlog 业务关系 |
| Continue | 无 | 新增显式单步命令 |
| Manager Step | 无 | 新增原子推进状态机与控制记录 |
| Rule Engine | column automation / contractRules / deliveryRules | 已有规则引擎雏形，但面向看板自动化，不是 Manager 决策 |
| Data Adapter | 无独立 Issue Port | 新增外部 Issue Data/API Service Adapter |
| Manager 状态 | 与 Task、Session、Trace 混合 | 新增独立 Manager Store |
| Desktop UI | 已有 | 复用 Tauri + Next.js 工程壳，重写 Manager 页面 |
| HTTP / SSE | 已有 | 高复用价值 |

### 现有 Kanban 不是 Backlog Manager

Routa 的看板泳道（Backlog/Todo/Dev/Review/Done/Blocked）是面向任务执行的工作流，不是 GLNT-011 的 Backlog 编排：

- Routa Kanban：任务在执行流程中的状态推进。
- GLNT-011 Backlog：Issue 的业务含义梳理和关系编织。

二者不能复用同一模型。可以复用 Next.js 前端工程和 Rust Backend 基础设施，但不能复用 Kanban 业务逻辑。

### 现有 EventBus 不是 Continue

Routa EventBus 支持 one-shot、priority、after_all 等订阅语义，是事件驱动协作的基础设施。但 GLNT-011 Continue 的语义是：

- 用户在 Project 上触发一次推进脉冲。
- 一次只运行一个 Manager Step。
- Manager Step 完成后必须停止。
- Continue 不是审批，不启动 Agent 执行。

EventBus 可以作为 Manager 状态通知的参考，但不能直接充当 Continue 机制。

### 现有 Rule Engine 雏形

Routa 已有 column automation、requiredArtifacts、requiredTaskFields、contractRules、deliveryRules、autoAdvanceOnSuccess 等规则机制，这是三个候选中最接近 Rule Engine 的现有实现。

但这些规则面向看板自动化和任务执行门禁，不是 Manager 的编排决策。GLNT-011 的 Rule Engine 应保持黑盒：Manager 向 Port 请求当前决策，然后只执行一次 Manager Step。Routa 的现有规则可以作为参考，但不应成为 Rule Engine 的实现起点。

### 前端复用范围

现有前端是 Next.js 15 + React 19 + TypeScript，页面围绕：

- Workspace 列表和设置。
- Kanban Board。
- Task Detail。
- Session 和 Trace。
- Harness Console。

因此可高复用的是 Next.js/React/TypeScript 工程、Tauri 集成、基础布局和 REST/SSE 客户端模式；业务页面大概率需要重写。Routa 的前端代码量比 ORG-2 小，技术栈更现代，但不能把「前端技术栈可复用」误判为「现有产品页面可直接改名」。

## 改造工作量判断

以下是基于 WORKSHOP-079 证据窗口的架构级估算，不是实施排期承诺。假设由熟悉 Rust、Tauri、Next.js 和 SQLite 的工程师完成，不计 Rule Engine 规则内容、外部 Issue Service 具体 API 实现和正式视觉设计。

### 路线 A：Tauri Local Backlog Manager 原型

工作内容：

- 保留 Tauri / Next.js / Rust / SQLite。
- 删除或隔离 ACP/MCP Tools、多 Agent 角色、Kanban 工作流、Harness Gate。
- 新增最小 Manager Core、Manager Step 和 Data Adapter。
- 仍由 Tauri Host 直接运行 Manager。

判断：**中等工作量，约 2 至 4 人周形成可调试原型。**

主要不确定性是 Manager 最小编排动作尚未收敛，以及 Routa 现有 Task/Session/Trace 领域的隔离成本。

### 路线 B：由 Tauri EXE 同时提供 Browser Manager

新增工作内容：

- 在 Axum 中挂载 Manager 的 Next.js 构建产物和 SPA fallback。
- 新增只面向 Manager 的 HTTP / SSE API。
- 为 Manager 前端建立 Browser transport，避免直接依赖 Tauri IPC。
- 决定 Tauri WebView 继续使用内部 Bundle，还是也访问同一个 localhost UI。
- 处理 loopback 端口选择、本机认证、启动顺序和错误页。

判断：如果只让新增的 Backlog Manager 页面支持 Browser，并从一开始采用 HTTP-first 契约，属于 **中等增量，约 1 至 3 人周**。

### 路线 C：在混合 Host 基础上增加 Windows Service

新增工作内容：

- 抽取不依赖 Tauri 的 `manager-core` 和 `manager-api`。
- 新增长生命周期 headless Host。
- 接入 Windows SCM 生命周期、停止信号、日志和故障恢复。
- 固化机器级数据目录、账户和 ACL。
- 扩展 MSI / Setup 安装、升级和卸载流程。

判断：**中高工作量。** 在 Manager Core 和 HTTP API 已保持纯净的前提下，额外约 3 至 6 人周形成可安装、可启停的工程原型。

### 工作量的决定因素

| 因素 | 影响 |
| --- | --- |
| Manager 最小编排动作是否明确 | 最大；决定 Manager Core 和 UI 的真实范围 |
| Routa 现有 Task/Session/Trace 领域的隔离成本 | 高；需要确认能否干净剥离 |
| 是否允许 Browser/PWA 作为第一阶段入口 | 允许则优势成立；要求原生桌面则需额外壳 |
| 是否新增独立 composition root | 决定后续能否真正删除 Agent 执行域 |
| Issue Data Adapter 是否保持黑盒边界 | 决定是否再次把外部 Issue 复制进本地 Task schema |
| 是否从第一天使用版本化 migration | 决定 Manager Step 状态能否长期升级 |
| 是否要求单 EXE / App / Service | 显著增加打包、签名、数据目录和生命周期工作 |

## 最终建议

### 是否继续保留 Routa

**继续保留，并把它明确定位为第三正式候选，与 ORG-2 和 AgentRQ 并列。**

选择 Routa 是为了复用：

- Tauri 原生桌面壳和跨平台交付链路。
- Next.js 15 + React 19 + TypeScript 现代前端工程。
- Rust Axum Server 和完整 REST API。
- SQLite 本地存储和零配置桌面模式。
- 结构化 Task 模型和事件驱动架构参考。
- 已有的规则引擎雏形（column automation / contractRules / deliveryRules）。

不应默认复用：

- Workspace / Task / Session 作为 Project / Issue 真相。
- ACP / MCP / A2A 协议层和 Agent 协同机制。
- Kanban 工作流和看板泳道。
- 多 Agent 角色（ROUTA/CRAFTER/GATE/DEVELOPER）。
- Harness Gate 和交付质量门禁。
- Git 仓库管理和 Worktree。

### 推荐实施顺序

1. 锁定 fork 基线和 Manager 产品命名，不在上游 Routa 入口中直接混写。
2. 新增不依赖 RoutaSystem、EventBus、MCP 和 Kanban 的 `manager-core`。
3. 定义 Rule Engine Port 和 Issue Data Adapter Port，保持两者为可替换黑盒。
4. 新增独立 Manager SQLite Store，并从第一版使用版本化 migration。
5. 新增独立 Manager HTTP / SSE Router，只实现 Continue、Manager Step 状态和 Happy Path 所需查询。
6. 在 Next.js 工程中新增 Manager 页面，复用 Tauri 集成、基础布局和 REST/SSE 模式，不复用 Kanban/Task 业务页面。
7. 新增独立 Manager composition root，不装配 ACP/MCP Tools、多 Agent 角色和 Kanban Controller。
8. 默认只绑定 `127.0.0.1`，增加显式 data dir 和端口冲突处理。
9. 第一阶段继续由 Routa EXE 承担进程生命周期，不引入 Windows Service。
10. Manager 闭环成立后，再决定是否做 Browser 入口、Windows Service 和独立安装包。

### Go / No-Go 判断

| 目标 | 判断 |
| --- | --- |
| Local Tauri Backlog Manager 原型 | **Go** |
| Windows/macOS 桌面安装包 | **Go，现有链路可复用** |
| 复用 Next.js 15 + React 19 前端工程 | **Go，技术栈现代** |
| 复用 Rust Axum Server 和 REST API | **Go，比 ORG-2 更接近 Manager 需求** |
| Local SQLite Manager Store | **Go，现有桌面模式已支持** |
| 复用现有 Task 作为外部 Issue | **No-Go，违背 GLNT-011 数据边界** |
| 复用 Kanban 作为 Backlog 编排 | **No-Go，语义不匹配** |
| 复用 EventBus 作为 Continue | **No-Go，触发与停止语义不一致** |
| 复用 ACP/MCP 协议层 | **No-Go，属于 Agent 执行层** |
| 保留完整 Routa 再叠加 Manager | **No-Go，不符合第一阶段收缩目标** |

## 主要风险与待核验项

- 上游项目仍年轻且更新快，实施前应继续锁定 fork commit，不使用滚动 `latest` 作为可复现基线。
- RoutaSystem、EventBus 和 Stores 的依赖装配需要进一步源码审计，确认能否干净剥离。
- 现有 Task/Session/Trace schema 与 Manager 控制状态的边界需要明确，避免数据混淆。
- SQLite 驱动细节、WAL 模式和 migration 机制需要源码验证。
- 现有规则引擎（column automation / contractRules）与 GLNT-011 Rule Engine 的语义差异需要进一步澄清。
- 关闭窗口后是否托盘常驻、是否支持 headless 模式需要实机验证。
- 需要在真实 Windows / macOS 环境验证桌面构建、SQLite 初始化和 Manager 闭环。

## 人工验收建议

如果后续进入 Routa 路线 Phase 收尾，建议由 Human 验证：

1. 在 macOS 和 Windows 分别构建原生 Manager binary，确认无需 Python、Docker、SQLite DLL 和 C toolchain 即可运行。
2. 断网运行，确认 Tauri WebView、Continue、Manager Step、SQLite 和 mock Data Adapter 可以完成完整 Happy Path。
3. 验证默认只监听 `127.0.0.1`，局域网其他机器不可访问。
4. 连续点击 Continue，确认同一 Project 同时最多存在一个 Manager Step，步骤结束后不会自动继续。
5. 关闭窗口后确认 Manager Step 不被中断；关闭进程时确认当前步骤按设计完成或留下可恢复状态。
6. 升级前后验证版本化 migration、失败阻断和备份恢复。
7. 如果进入 Windows Service，验证 install/start/stop/restart、用户注销、Service 账户 ACL、日志、升级和卸载。

## 证据来源

- [WORKSHOP-079: Routa 技术产品调研](../GLNT-10/WORKSHOP-079.md)（已归档至 [Routa.md](./Routa.md)）
- [GLNT-011: Manager 调研与第一阶段原型](../GLNT-011/Index.md)
- [GLNT-012: Task Agent 唤起与单任务生命周期调研](../GLNT-012/Index.md)
