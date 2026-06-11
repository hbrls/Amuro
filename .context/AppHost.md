# Codex App Server 与 App Host

本文记录 Symphony 二次开发中对 Codex 执行层的调研结果，重点说明公开的 `app-server`、Codex App 桌面端的 App Host，以及二者能否用于复用 Codex App 的 Chat 体验。

## 1. 两个层次

```text
外部程序（例如 Symphony Elixir）
        │
        │ 公开 JSON-RPC over stdio
        ▼
独立 codex app-server
        │
        ├── Thread（对话容器）
        └── Turn（一次执行）

Codex App 桌面端
        │
        ├── App UI
        ├── App Host（桌面宿主编排层）
        └── App 自己管理的 app-server / writer
```

### app-server

`app-server` 是 Codex 的 Agent 执行协议。Symphony 当前的调用链是：

```text
Task List
  → Symphony Orchestrator
  → 创建隔离 workspace
  → 启动独立 codex app-server
  → initialize
  → thread/start
  → turn/start
  → 读取事件直到 Turn 完成
```

在本地实现中，`elixir/lib/symphony_elixir/codex/app_server.ex` 通过 stdio 与 `codex app-server` 通信：

1. 启动 app-server 进程，并设置工作目录和沙箱策略。
2. 发送 `initialize`。
3. 发送 `thread/start`，得到 `thread_id`。
4. 发送 `turn/start`，传入 Prompt。
5. 消费流式事件，处理工具调用、审批请求和最终结果。
6. Turn 结束后关闭本次独立 app-server。

公开 app-server 协议主要提供：

- `thread/start`
- `thread/list`
- `thread/read`
- `thread/resume`
- `thread/fork`
- `thread/archive` / `thread/unarchive`
- `thread/name` / `thread/set_name`
- `turn/start`
- `turn/steer`
- `turn/interrupt`

它的核心对象是 Thread 和 Turn，不是 Codex App 的 Project UI。公开协议没有发现 `projectId`、`project/list` 或“在 Codex App 中打开 Task”等接口。

### App Host

“Codex App Host”是对桌面 Codex App 宿主层的称呼，并非当前公开协议中单独定义的产品 API。它位于 App UI 与 App 自己的 app-server 之间，负责把 Task、Project、工作区、执行状态和 UI 连接起来。

在当前 Codex App 对本对话注入的 Host 能力中，实际观察到：

#### Project 与 Task

- `list_projects`：列出本地、远程和 ChatGPT Project，返回 `projectId`、名称、路径、Host 及 `isGitRepository`。
  当前 Host 中实际注册的完整工具名为 `codex_app__list_projects`，已通过真实调用
  `codex_app__list_projects({})` 验证可用；一次实测返回 `schemaVersion: 2` 和项目数组。
  当前注册元数据包含自然语言说明和 TypeScript 签名：

  ```ts
  declare const tools: {
    codex_app__list_projects(args: {}): Promise<unknown>;
  };
  ```

  其中入参 JSON Schema 是严格的空对象：`type: "object"`、
  `additionalProperties: false`、`properties: {}`，不接受筛选参数或其他业务字段。
  返回值没有通过 Host 工具元数据暴露正式的 `outputSchema`，所以对 Agent 展示为
  `Promise<unknown>`。根据当前 App 实现和实测结果，可暂按以下结构理解，但这不是公开
  稳定 API 类型：

  ```ts
  type ListProjectsResult = {
    schemaVersion: 2;
    projects: Array<{
      projectId: string;
      projectKind: "local" | "remote" | "chatgpt";
      label: string;
      path?: string;
      hostId: string | null;
      hostDisplayName: string | null;
      isGitRepository?: boolean;
    }>;
  };
  ```

  对 `local`/`remote` 项目，当前结果包含 `projectId`、`projectKind`、`label`、可选
  `path`、`hostId`、`hostDisplayName` 及计算得到的 `isGitRepository`；`chatgpt` 项目
  的 `hostId` 和 `hostDisplayName` 为 `null`。调用结果中的字段应按向后兼容方式解析，
  不应把这段推导结构当作公开承诺的 SDK 类型。
- `create_thread`：在 Project、projectless 目录或 ChatGPT Work 中创建 Task/Chat。
- `list_threads`：列出 App 中的 Task/Chat。
- `read_thread`：读取指定 Task 的状态和对话摘要。
- `send_message_to_thread`：向已有 Task 追加 Prompt，创建新的 Turn。
- `wait_threads`：等待一个或多个 Task 完成或需要处理。
- `fork_thread`：从已有 Task 派生新的 Task。

#### Task 状态和 UI

- `set_thread_title`：重命名。
- `set_thread_pinned`：置顶或取消置顶。
- `set_thread_archived`：归档或恢复；这是当前可用的可逆清理入口。
- `navigate_to_codex_page`：在 App 中打开指定 Task/Chat。
- `open_in_codex`：在 Codex 面板打开文件、终端、浏览器或 Review。

#### 工作区和宿主协调

- `handoff_thread`：在 checkout、Codex worktree 或其他本地 Host 之间迁移 Task 及其 Git 状态。
- `get_handoff_status`：读取迁移进度。
- `read_thread_terminal`：读取当前 App Task 的终端输出。
- `load_workspace_dependencies`：获取 App 内置的 Node.js、Python 及文档处理运行环境。

这些能力说明 App Host 能够“管理并驱动 App 内的 Task”，但不等于外部普通进程已经获得了同样的调用入口。

## 2. ID 语义：Session、Thread、Turn

对 Codex App 创建的本地 Chat，已确认以下标识相同：

```text
Codex App Task ID
  = app-server threadId
  = ~/.codex/state_5.sqlite 中 threads.id
  = rollout JSONL 中的 session_id / id
```

因此，App 内可见 Chat 的纯 `thread_id` 可以被独立 app-server 识别并执行 `thread/read` 或 `thread/resume`。

但 Symphony 日志中的：

```text
session_id = "#{thread_id}-#{turn_id}"
```

是 Symphony 为一次 Turn 生成的组合标识，不能直接作为 `thread/resume` 的参数。需要单独维护纯 `thread_id`。

本地相关数据通常位于：

```text
~/.codex/sessions/YYYY/MM/DD/rollout-...-<thread_id>.jsonl
~/.codex/state_5.sqlite
~/.codex/thread-writer-locks/<thread_id>.lock
```

## 3. 两种继续已有 Chat 的方式

### A：独立 app-server resume

流程：

```text
Symphony
  → 启动新的独立 app-server
  → thread/resume(thread_id)
  → turn/start
```

实验表明，App 创建的 Thread 可以被独立 app-server 读取和恢复；但是如果该 Chat 仍由 Codex App 打开并持有 writer，会收到类似：

```text
thread <id> already has an active writer
```

这不是 ID 错误，而是 writer lock 冲突。独立 app-server 不能在 App 的 writer 仍活跃时强行接管同一个 Thread。即便释放锁后能够执行，还需要另外验证 App 是否实时刷新该 Turn。

### B：App Host 的跨 Task 通道

流程：

```text
当前 Codex App 内 Agent
  → App Host.send_message_to_thread(threadId, prompt)
  → 目标 Chat 当前 writer
  → 创建新 Turn
  → App UI 显示过程、结果和后续历史
```

实验中，向 Nerv Project 下预先创建的 Chat 发送 Prompt 成功。目标 Chat 的回复、执行过程和一条类似“Sent by ChatGPT from another task”的来源标记都出现在 Codex App 中，完成后仍可继续对话。

B 方案的关键不是绕过锁，而是让目标 Chat 的现有 Host/app-server writer 执行新 Turn。因此它最符合“借用 Codex App UI 和续聊体验”的目标。

## 4. Project、创建和归档

当前 Host 中没有：

```text
list_project()
create_session(project_id)
delete_session(session_id)
end_and_clean_and_delete(session_id)
```

实际名称是：

```text
list_projects()
create_thread(...)
set_thread_archived(thread_id, archived: true | false)
```

需要特别区分 `list_projects` 的两个层次：它是当前 Codex 桌面 App Host 注入的真实
内部工具，不是独立 `codex app-server` 的公开 JSON-RPC 方法。官方 App Server 文档的
API 清单中没有 `list_projects` 或 `project/list`；公开 app-server 仍以 Thread/Turn
为核心。因此外部 Elixir 进程不能仅凭 app-server 协议调用这个 Host 工具，除非获得
受支持的 Host 桥接入口。

创建 Project Task 时，环境需要明确指定：

```json
{
  "type": "project",
  "projectId": "<project-id>",
  "environment": { "type": "local" }
}
```

`local` 直接使用 Project 原始目录；`worktree` 为 Git Project 创建隔离副本。Symphony 的目标场景禁止自动生成 worktree，因此创建 Task 时必须显式使用 `local`。

Host 当前没有物理删除 Chat 的公开入口。清理通常分两步：

1. 用 `git worktree remove` 删除不再需要的本地 worktree（如果曾经创建过）。
2. 用 `set_thread_archived(..., archived: true)` 将 Chat 归档。归档可恢复，不等于删除历史。

## 5. 对 Symphony 的结论

已经证明：

1. 可以通过后台读取准确获得 App Chat 的 `thread_id`。
2. App 内可以按 Thread ID 向已有 Chat 追加 Turn。
3. 原有历史、App UI、公开执行过程和续聊体验都能保留。
4. “预建一批待命 Chat，再按 ID 分配 Task”的产品体验层方案可行。

尚未证明：

1. 外部 Elixir 进程能否直接调用 App Host 的 `send_message_to_thread`。
2. App Host 是否存在可供外部连接的稳定 IPC、Socket 或鉴权协议。
3. 独立 app-server 如何安全接管一个仍被 Codex App 管理的 Thread。
4. 独立 app-server 执行期间，App 是否能实时显示同一 Thread 的新增 Turn。

因此，当前最准确的架构结论是：

```text
app-server = 公开的 Codex 执行协议
App Host   = Codex 桌面 App 的宿主编排与 UI 集成层
```

Symphony 目前直接使用前者；要完整复用 Codex App 的 Task UI 和续聊体验，需要获得后者的受支持外部入口，或在 App 内运行一个具备 Host 权限的桥接 Agent。

## 6. 官方文档

- [Codex app-server](https://learn.chatgpt.com/docs/app-server)
- [Codex SDK](https://learn.chatgpt.com/docs/codex-sdk)
- [Codex Projects](https://learn.chatgpt.com/docs/projects)

以上官方文档描述的是公开 app-server/SDK/Project 能力；“App Host”及其跨 Task 工具是本地 Codex App 会话中观察到的宿主能力，不应当当作稳定公开 API 使用。
