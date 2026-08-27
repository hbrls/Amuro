# Vibe Kanban 技术产品调研

> updated_by: Codex - GPT-5
> updated_at: 2026-08-09 21:36:45
> evidence_window: 2026-08-09，`main@4deb7eca8f381f7cbc1f9d15515a9ab8f8009053`，版本 0.1.44

## 交付结论

1. **Vibe Kanban 的本地主体已经使用 SQLite，不需要把 Agent Workspace 从 PostgreSQL 迁移到 SQLite。** 本地 `DBService` 创建 `db.v2.sqlite`，使用 SQLx migrations 管理版本；本地构建的核心链路是 Local Web 或 Tauri、Axum Server、SQLite、Git worktree 和本机 Agent 进程。
2. **当前本地产品主体是 Agent Workspace 执行工作台，不是本地 Kanban / Issue Manager。** 用户可以创建 Workspace、启动 Agent Session、查看日志和代码变更、使用终端与 Preview；Project、Kanban、Issue、Comment 等产品流程已经退休。
3. **Agent 实际执行的不是 SQLite `Task`。** 当前执行链路是“用户 Prompt -> Workspace -> Session -> ExecutionProcess -> Executor -> Git worktree”。`Workspace.task_id` 是可空的遗留关联，Workspace 可以不绑定 Task 而创建和执行。
4. **SQLite 中存在 `projects` 和 `tasks` 遗留模型，但它们不构成当前可用的本地 Issue 产品。** 当前本地服务没有 Project/Task CRUD 产品路由，Project 页面仍读取远端 Organization Project，最终只显示停运和导出页面。
5. **采用 Vibe Kanban 实现 Local First、Local Only 在技术上可行，但不是数据库配置切换。** 可以复用 SQLite、Axum、WebSocket、Tauri、Workspace、Git、Agent、Terminal 和 Preview；必须新增本地 Project/Issue 领域、API、事件和 Kanban UI，并移除远端认证、Organization、Relay 和同步依赖。
6. **需要区分“控制面 Local Only”和“完全断网”。** Workspace、状态、代码和执行进程可以完全保存在本机；GitHub PR、云端 Coding Agent、远端 MCP 等能力仍会访问外部服务。若要求空气隔离，还必须限定为本地 Git、本地模型和本地 MCP。

## 调研目标、范围与边界

### 调研目标

本次复核回答两个问题：

1. Vibe Kanban 的 Local 部分实际包含哪些可使用功能。
2. 在必须采用 Local First、Local Only 的约束下，能否将其改造为本地 Backlog Manager。

### 覆盖范围

- 当前本地产品入口和核心用户流程。
- 本地服务、SQLite、文件系统、Git 和 Agent 进程之间的边界。
- Local Workspace、Session 和 ExecutionProcess 的职责。
- 遗留 Task 与已退休 Issue 的关系。
- 远端能力及 Local Only 改造边界。
- Windows 与 macOS 工作机运行形态。

### 明确排除

- 不进行逐文件源码审计。
- 不进行性能、安全性或稳定性 benchmark。
- 不进行竞品比较。
- 不把遥测和运营数据采集纳入本次架构判断。
- 不实际安装、构建或运行上游项目。

## 证据口径

- 结论优先采用固定提交的官方源码和官方停运公告。
- 源码只用于验证 Local 数据库、执行链路、前端可达性和远端边界。
- “有数据表或模型”不等于“有可使用的产品功能”；必须同时检查 API 和前端入口。
- 本次未完成安装运行验证，涉及系统权限、安装包内容和离线行为的部分标记为待人工验收。

## 产品调研

### 产品定位与当前边界

Vibe Kanban 当前可以概括为：

> 在本机 Git worktree 中组织多个 Coding Agent Session，并集中查看对话、执行日志、代码变更、终端和开发预览的本地工作台。

其名称仍包含 Kanban，但当前 Project 页面最终只进入 `ProjectSunsetPage`。页面明确说明 Project 已变为仅导出，Kanban、Issue 和关联 Workspace 流程不再可用。

官方停运公告及页面代码能证明 Project/Issue 产品服务已退休，但不能据此直接推导整个开源仓库已经停止维护。当前 `main` 仍存在版本 0.1.44 的构建和 Workspace 执行代码，因此本报告不再使用“整个项目已停止维护”这一旧结论。

### 当前本地核心流程

```text
选择一个或多个本地 Git 仓库
  -> 创建 Workspace 和 worktree/branch
  -> 创建 Session
  -> 输入 Prompt
  -> 本机启动 Coding Agent Executor
  -> ExecutionProcess 记录状态与日志
  -> Agent 修改 worktree
  -> 用户查看对话、diff、文件、终端和 Preview
  -> 可继续 follow-up、review、Git 或 PR 操作
```

本地执行单元不是 Project Task，而是 Workspace 内的 Session 和 ExecutionProcess。

### Local 功能地图

| 功能域 | 当前能力 | 数据与运行位置 | Local Only 判断 |
| --- | --- | --- | --- |
| Local UI 与 API | Local Web、Tauri、Axum HTTP/WebSocket、前端静态资源 | 本机 | 可保留 |
| Workspace | 创建、启动、列表、摘要、重命名、置顶、归档、删除 | SQLite + 本地目录 | 完全本地 |
| 多仓库工作区 | 关联多个 Repo、创建 worktree、选择分支和目标分支 | SQLite + Git 文件系统 | 完全本地 |
| Agent Session | 创建、命名、选择、继续对话、重置、新建 Session | SQLite | 完全本地 |
| Agent Execution | setup、Coding Agent、follow-up、review、停止执行 | 本机子进程 + SQLite | 控制面本地 |
| 执行可观测性 | 原始日志、规范化日志、进程列表、Repo 状态、WebSocket 流 | SQLite + 本机内存流 | 完全本地 |
| Approval | 等待工具审批、审批响应、审批事件流 | 本机服务 | 完全本地 |
| Git 工作区 | diff、文件树、分支、remote、变更面板、仓库搜索和常见 Git 操作 | 本地 Git 仓库 | 本地操作可离线 |
| Repo 管理 | 注册、初始化、更新、删除、最近仓库、配置脚本、编辑器打开 | SQLite + 文件系统 | 完全本地 |
| Terminal | Workspace 目录中的 PTY、输入、输出和 resize | 本机进程 | 完全本地 |
| Dev Server 与 Preview | 启动开发服务、端口代理、HTTP/WebSocket Preview | 本机进程与 loopback | 完全本地 |
| Workspace Notes | Workspace 笔记编辑和展示 | 本地持久化 | 完全本地 |
| Scratch 与 Tag | 草稿状态、标签 CRUD | SQLite | 完全本地 |
| 附件 | Workspace/会话附件上传和访问 | 本地数据目录 | 完全本地 |
| 配置与 Profile | Agent Profile、MCP 配置、Editor/Agent 可用性检查 | 本地配置 | MCP 是否联网取决于配置 |
| PR 工作流 | 查询 PR、从 PR 创建 Workspace、跟踪 PR、关联 Workspace | 本机发起请求 | 依赖 GitHub 和凭据 |
| Coding Agent | Claude、Codex、Gemini、Copilot、Amp、Cursor、OpenCode、Droid、Qwen 等 | CLI 在本机启动 | 模型调用通常依赖外网 |
| Remote Host | Relay、WebRTC、SSH Session、远端 Host | 本机与远端协作 | Local Only 应移除 |
| Organization / Project / Issue | 登录、组织、远端 Project、Issue、Comment | 原远端服务 | 当前本地不可用 |

### Agent 执行、Task 与 Issue

#### Agent 实际执行什么

当前本地执行关系为：

```text
Workspace
  └─ Session
       └─ ExecutionProcess
            ├─ ExecutorAction
            ├─ 状态与退出码
            ├─ 原始/规范化日志
            └─ 执行前后 Repo State
```

用户 Prompt 进入 Session 后，由配置的 Executor 启动本机 Coding Agent CLI。Agent 在 Workspace 对应的 Git worktree 中工作。Setup Script、Review 和 Dev Server 也可以作为不同类型的本地执行进程运行。

系统没有发现“扫描 `Task.status = Todo` 并自动交给 Agent”的本地调度链路。

#### SQLite Task 是否等于 Issue

概念上，遗留 `Task` 是一个很薄的 Issue-like 模型，字段包括：

- `id`
- `project_id`
- `title`
- `description`
- `status`
- `parent_workspace_id`
- 创建和更新时间

但是当前产品层面不能把它等同为可用 Issue：

- 本地总路由没有 Project/Task CRUD 产品入口。
- Workspace 的 `task_id` 为可空字段，Agent 执行不依赖 Task。
- 当前 Project 页面读取远端 Organization 和 Project。
- Project 页面最终只显示停运和数据导出。
- Comment、关系、Sub-issue、Kanban 排序和协作状态属于已退休的远端 Issue 领域。

因此，准确结论是：

> 本地 SQLite 中存在遗留的 Task/Project 数据模型，但没有当前可使用的本地 Issue/Kanban 产品功能。

这些遗留模型可以作为新实现的迁移参考，但不足以直接承担完整 Backlog Manager。

## 技术架构调研

### 系统全貌与运行形态

```text
Local Web / Tauri WebView
          |
          | HTTP + WebSocket
          v
    Axum Local Server
       |      |       |
       |      |       +--> PTY / Dev Server / Preview Proxy
       |      +----------> Git / worktree / local filesystem
       +-----------------> SQLx + SQLite db.v2.sqlite
       |
       +-----------------> Coding Agent CLI
                              |
                              +--> 可选外部模型服务
```

远端协作是另一条边界：

```text
Local Host
  -> Relay / Remote Host / OAuth
  -> Remote Service
  -> PostgreSQL + ElectricSQL
  -> Organization / Project / Issue / Comment
```

根 Rust workspace 将 `crates/remote` 作为独立边界排除，本地主体不需要 PostgreSQL 才能构建和保存 Workspace 状态。

### 持久化方式

#### SQLite

本地 `DBService`：

- 创建 `db.v2.sqlite`。
- 使用 SQLx SQLite 驱动。
- 启动时运行版本化 migrations。
- 保存 Workspace、Session、ExecutionProcess、日志、Repo、WorkspaceRepo、PullRequest、Scratch、Tag 等本地状态。
- 仍保留 Project 和 Task 等遗留表。

#### 文件系统

以下数据不只存在 SQLite：

- Git 仓库和 worktree。
- Agent 实际修改的文件。
- Workspace 附件。
- 本地配置、Profile 和 MCP 配置。
- Agent CLI 自身的认证和配置文件。

SQLite 是控制状态数据库，不是代码内容数据库。

#### 远端持久化

`crates/remote` 使用 PostgreSQL，并配合 ElectricSQL 等组件承担原远端协作和同步能力。它不是当前本地 Workspace 的数据库，也不应进入严格 Local Only 的目标运行形态。

### 接口与通信

- Local Web/Tauri 与 Axum 之间使用 HTTP。
- Workspace、ExecutionProcess、Approval 和日志更新使用 WebSocket 流。
- Terminal 通过 WebSocket 连接本机 PTY。
- Preview 通过本地 HTTP/WebSocket 代理访问 Dev Server。
- Agent 通过本机子进程和标准输入输出运行。
- Git 操作直接作用于本地仓库。
- Relay、WebRTC、OAuth 和 Remote Host 属于远端协作通道。

### 工作机安装

#### Windows

- Tauri 提供 Windows 桌面安装形态。
- Local Web 也可以由本地服务提供 Browser UI。
- 运行 Workspace 需要本机 Git，以及用户选择的 Agent CLI。
- Terminal、worktree 和本地进程执行需要相应文件系统与进程权限。
- 使用 GitHub PR 或云端 Agent 时需要网络和凭据。

#### macOS

- Tauri 提供 macOS App/DMG 形态。
- Local Web、SQLite、Git worktree 和 Agent 进程均运行在本机。
- 首次运行可能受到 Gatekeeper、文件访问和终端工具权限影响。
- 使用 GitHub PR 或云端 Agent 时需要网络和凭据。

安装包内容、签名、卸载后的数据目录保留行为和完全断网启动需要在真实 Windows/macOS Release 上人工验收。

## Local First / Local Only 改造判断

### 可以直接复用

- Tauri 和 Local Web 产品壳。
- Axum Local Server 与前端静态资源托管。
- SQLx SQLite 与 migration 基础。
- HTTP/WebSocket transport。
- Workspace、Session、ExecutionProcess 和 Approval。
- Git、worktree、diff、文件树与仓库搜索。
- Terminal、Dev Server 和 Preview。
- Agent Executor、Profile 和 MCP 配置。
- 本地附件、Scratch、Tag 和 Notes。

### 必须新增

- 本地 Project CRUD。
- 本地 Issue CRUD。
- Board/Status 和稳定排序。
- Comment、关系、Parent/Sub-issue。
- Issue 与 Workspace/Session 的显式关联。
- 本地搜索、过滤、事件和变更订阅。
- Kanban UI 和 Issue 详情 UI。
- 从 Issue 创建 Workspace，以及将 Agent 结果回写 Issue 状态的编排规则。
- 完整、可测试的 migration 和导入/导出路径。

### 必须移除或隔离

- 登录成为 Project 入口的前置条件。
- Organization 和远端 Project hooks。
- OAuth、远端同步和 ElectricSQL。
- Remote Host、Relay、WebRTC 和 SSH Session。
- 远端通知和协作状态。
- 对已停运 Project/Issue API 的调用。

### 是否可以直接扩展遗留 Task

可以用于原型，但不建议把当前遗留表原样定义为最终 Issue：

- 它缺少排序、评论、关系和领域事件。
- 当前 Task、Workspace 和远端 Issue 的关联语义并不统一。
- 需要确定稳定 ID、删除策略、状态机和 migration。
- 需要避免继续保留“Task 是 Agent 执行单元”的错误模型。

推荐建立新的本地 Manager 领域边界，再通过 migration 选择性吸收遗留 Project/Task 数据。

### Go / No-Go

| 目标 | 判断 |
| --- | --- |
| 复用为 Local Agent Workspace | **Go，当前已经成立** |
| 复用 SQLite、Axum、Tauri、Git 和 Agent 基础设施 | **Go** |
| 通过配置直接恢复 Local Kanban/Issue | **No-Go** |
| 基于现有底座新增 Local Issue/Kanban | **Go，但属于业务领域重建** |
| 保留 Organization/Remote Sync 同时声称 Local Only | **No-Go** |
| 控制面完全本地，允许模型和 GitHub 作为可选外部工具 | **Go** |
| 完全断网且继续使用云端 Agent/GitHub PR | **No-Go** |
| 完全断网并改用本地模型、本地 Git、本地 MCP | **Go，需单独验证执行器兼容性** |

## 主要风险与未决项

- 当前代码仍混合本地 Workspace 与远端 Organization/Project 导航，Local Only 改造必须先划清前端依赖边界。
- 遗留 Project/Task schema 的历史数据兼容性没有运行验证。
- 不同 Coding Agent 的认证、会话恢复和完全离线能力不同，不能从“本机启动 CLI”推导为“模型在本机运行”。
- PR、remote branch 和 Git hosting 工作流天然可能访问网络，需要作为可选集成明确标识。
- 本次未在 Windows/macOS 安装 Release，也未验证断网启动、升级、卸载和数据迁移。
- 获取完整固定源码快照时 Git 与 codeload 连接持续超时；关键结论已通过固定提交的 GitHub Contents API 定点交叉核验，但仍应在正式 fork 前锁定并保存完整源码快照。

## 后续验证建议

1. 在正式 fork 基线中运行现有 Local Web/Tauri，断网验证 Workspace 创建、Session、Terminal、Git diff 和 Preview。
2. 建立远端模块禁用清单，确认移除 OAuth、Organization、Relay 后本地 Workspace 不回归。
3. 对遗留 Project/Task migration 做真实数据库升级测试。
4. 用最小 Project、Issue、Status、Order schema 实现一个本地 Kanban 垂直切片。
5. 验证“Issue -> Workspace -> Session -> ExecutionProcess -> Issue 状态回写”完整链路。
6. 分别在 Windows 和 macOS Release 上进行人工验收。

## 证据来源

- [固定提交](https://github.com/BloopAI/vibe-kanban/commit/4deb7eca8f381f7cbc1f9d15515a9ab8f8009053)
- [Apache 2.0 License](https://github.com/BloopAI/vibe-kanban/blob/4deb7eca8f381f7cbc1f9d15515a9ab8f8009053/LICENSE)
- [根 Rust workspace 边界](https://github.com/BloopAI/vibe-kanban/blob/4deb7eca8f381f7cbc1f9d15515a9ab8f8009053/Cargo.toml)
- [本地 SQLite DBService](https://github.com/BloopAI/vibe-kanban/blob/4deb7eca8f381f7cbc1f9d15515a9ab8f8009053/crates/db/src/lib.rs)
- [本地 Project 模型](https://github.com/BloopAI/vibe-kanban/blob/4deb7eca8f381f7cbc1f9d15515a9ab8f8009053/crates/db/src/models/project.rs)
- [本地 Task 模型](https://github.com/BloopAI/vibe-kanban/blob/4deb7eca8f381f7cbc1f9d15515a9ab8f8009053/crates/db/src/models/task.rs)
- [本地 Workspace 模型](https://github.com/BloopAI/vibe-kanban/blob/4deb7eca8f381f7cbc1f9d15515a9ab8f8009053/crates/db/src/models/workspace.rs)
- [本地 Session 模型](https://github.com/BloopAI/vibe-kanban/blob/4deb7eca8f381f7cbc1f9d15515a9ab8f8009053/crates/db/src/models/session.rs)
- [本地服务总路由](https://github.com/BloopAI/vibe-kanban/blob/4deb7eca8f381f7cbc1f9d15515a9ab8f8009053/crates/server/src/routes/mod.rs)
- [Workspace 路由](https://github.com/BloopAI/vibe-kanban/blob/4deb7eca8f381f7cbc1f9d15515a9ab8f8009053/crates/server/src/routes/workspaces/mod.rs)
- [Session 路由](https://github.com/BloopAI/vibe-kanban/blob/4deb7eca8f381f7cbc1f9d15515a9ab8f8009053/crates/server/src/routes/sessions/mod.rs)
- [Repo 路由](https://github.com/BloopAI/vibe-kanban/blob/4deb7eca8f381f7cbc1f9d15515a9ab8f8009053/crates/server/src/routes/repo.rs)
- [ExecutionProcess 路由](https://github.com/BloopAI/vibe-kanban/blob/4deb7eca8f381f7cbc1f9d15515a9ab8f8009053/crates/server/src/routes/execution_processes.rs)
- [Terminal 路由](https://github.com/BloopAI/vibe-kanban/blob/4deb7eca8f381f7cbc1f9d15515a9ab8f8009053/crates/server/src/routes/terminal.rs)
- [Preview 路由](https://github.com/BloopAI/vibe-kanban/blob/4deb7eca8f381f7cbc1f9d15515a9ab8f8009053/crates/server/src/routes/preview.rs)
- [Local Project 页面](https://github.com/BloopAI/vibe-kanban/blob/4deb7eca8f381f7cbc1f9d15515a9ab8f8009053/packages/web-core/src/pages/kanban/ProjectKanban.tsx)
- [Project 停运页面](https://github.com/BloopAI/vibe-kanban/blob/4deb7eca8f381f7cbc1f9d15515a9ab8f8009053/packages/web-core/src/pages/kanban/ProjectSunsetPage.tsx)
- [Workspace 主界面](https://github.com/BloopAI/vibe-kanban/blob/4deb7eca8f381f7cbc1f9d15515a9ab8f8009053/packages/web-core/src/pages/workspaces/WorkspacesMainContainer.tsx)
- [Workspace 工具侧栏](https://github.com/BloopAI/vibe-kanban/blob/4deb7eca8f381f7cbc1f9d15515a9ab8f8009053/packages/web-core/src/pages/workspaces/RightSidebar.tsx)
- [官方停运公告](https://www.vibekanban.com/blog/shutdown)
