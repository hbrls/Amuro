---
name: codex-app-tools
description: "显式记录 Codex App 原生 Tools 的已验证调用方式和当前项目规范"
metadata:
  version: 0.0.0
  status: draft
---

# Codex App Tools 手册

## 定位

本手册记录 Codex App 注入当前会话的 `codex_app__*` Tools，目的是将已有的调用知识、字段语义和项目规范显式化，便于稳定复用。

这些 Tools 全部由 Codex 原生提供。本手册不创建新工具，不包装、替换或修改原生 Tool，也不改变其参数、权限、返回值或运行时行为。文中的代码均为原生 Tool 调用。

## 事实来源与适用范围

Codex 注入 Tool 时附带的名称、输入定义和注释是调用契约的唯一事实来源。出现不一致时，按以下优先级处理：

1. 当前会话注入的 Tool 名称、输入定义和注释；
2. 本手册明确标注的当前项目规范；
3. `references/` 中的类型和验证记录；
4. 本手册中的其他说明和示例。

本手册只显式记录已有知识，不得据此推断注入定义中不存在的字段或能力。Tool 注释发生变化时，以当前注释为准。

“当前项目”指加载本手册时所在的项目。当前项目规范只约束本项目的调用方式，不重新定义 Codex 原生 Tool。

如果调用宿主对结果做了序列化或其他传输封装，应按宿主约定处理。传输形式不属于 Codex App Tool 的调用契约。

本文沿用 Codex 的原生命名：`Project`、`Thread` 和 `Prompt`。不为这些概念引入其他名称。

## Project 与 Thread

### `codex_app__list_projects`

列出 Codex App 中可用于创建 Thread 的 Project。

```ts
// Codex 原始调用。
// 入参必须是空对象，不支持筛选参数；出参严格保留注入签名中的 unknown。
const output: unknown = await tools.codex_app__list_projects({});
// 我们对返回值的伪代码解释，不是对 Codex 原生 Tool 的实现或修改。
// 当前实测 output 是 JSON 字符串，因此使用 output as string 解释传输值，
// 并将解析结果确切化为 ListProjectsResult<Project>。
// 如果 Codex 注入 Tool 时提供 outputSchema，该类型必须是对其的类型化确切化；
// 当前注入未提供正式 outputSchema，因此该类型来自实测结果。
// 解析后由调用方处理 result.projects；创建 Project Thread 时，
// 使用目标 Project 返回的 projectId。
const result: ListProjectsResult<Project> = JSON.parse(output as string);
```

类型见 [`references/types.d.ts`](references/types.d.ts)。

### `codex_app__create_thread`

在指定的本地 Project 中创建 Thread，并用 `prompt` 启动首次执行。

当前项目强制直接使用 Project 原始目录：`target.environment` 必须传 `{ type: "local" }`，不得使用 worktree。此要求是当前项目规范，不是对 Codex 原生 Tool 的重新定义。

```ts
const result = await tools.codex_app__create_thread({
  title,
  prompt,
  target: {
    type: "project",
    projectId,
    environment: { type: "local" },
  },
});
```

`prompt`、`target.projectId` 和 `target.environment` 必填；`title` 可选。`environment: { type: "local" }` 表示直接使用 Project 原始目录。

每个供本方法使用的 Project 必须有且只有一个 Git repo。该方法不能选择 Project 内的具体 repo；不同 repo 应分别配置为独立 Project。

创建成功后立即返回 `threadId` 和 `hostId`，不等待 Thread 执行完成。

类型见 [`references/types.d.ts`](references/types.d.ts)。

## Thread 操作

### `codex_app__list_threads`

列出已有 Thread，包括状态、所属 Project 和摘要。

### `codex_app__read_thread`

只读查看指定 Thread 的近期对话、执行状态和工具输出。

### `codex_app__send_message_to_thread`

向已有 Thread 发送新的 Prompt，使其继续执行。

### `codex_app__wait_threads`

等待一个或多个 Thread。任一目标完成或需要处理时返回；超时时返回各目标当时的简要进度，不等待全部目标完成。
