---
name: codex-app-tools
description: "显式记录 ChatGPT Desktop 原生 Tools 的已验证调用方式和当前项目规范"
metadata:
  version: 0.0.0
  status: draft
---

# ChatGPT Desktop Tools 手册

## 定位

交流与文档统一使用 **ChatGPT Desktop** 这一名称。说明和描述中可使用官方全名 **ChatGPT desktop app (Codex mode)**。本手册仅讨论当前正在使用的 ChatGPT Desktop 环境。

本手册记录 ChatGPT Desktop 注入当前会话的 `mcp__codex_app__*` Tools，目的是将已有的调用知识、字段语义和项目规范显式化，便于稳定复用。原生工具标识符及接口中的来源名称保持原样；例如 `codex` 与 `chatgpt` 来源仍需区分。

这些 Tools 全部由 ChatGPT Desktop 原生提供。本手册不创建新工具，不包装、替换或修改原生 Tool，也不改变其参数、权限、返回值或运行时行为。文中的代码均为原生 Tool 调用。

## 事实来源与适用范围

ChatGPT Desktop 注入 Tool 时附带的名称、输入定义和注释是调用契约的唯一事实来源。出现不一致时，按以下优先级处理：

1. 当前会话注入的 Tool 名称、输入定义和注释；
2. 本手册明确标注的当前项目规范；
3. `references/` 中的类型和验证记录；
4. 本手册中的其他说明和示例。

本手册只显式记录已有知识，不得据此推断注入定义中不存在的字段或能力。Tool 注释发生变化时，以当前注释为准。

“当前项目”指加载本手册时所在的项目。当前项目规范只约束本项目的调用方式，不重新定义 ChatGPT Desktop 原生 Tool。

如果调用宿主对结果做了序列化或其他传输封装，应按宿主约定处理。传输形式不属于 ChatGPT Desktop Tool 的调用契约。

本文沿用 ChatGPT Desktop 的原生命名：`Project`、`Thread` 和 `Prompt`。不为这些概念引入其他名称。

### 接口核对记录（2026-11-19）

本次仅更新本手册已有六个工具的调用名称、入参和出参说明。入参以当前 ChatGPT Desktop 会话注入定义为依据；返回数据另外标明实测范围。补录当前定义不代表这些字段都是近期新增。

这六个工具当前均声明返回 `Promise<CallToolResult>`。实测 `list_projects`、`list_threads` 和 `read_thread` 返回对象，包含 `content` 和 `isError`，JSON 数据位于 `content` 的 text 块中。不能将整个返回对象作为 JSON 字符串解析。应先检查 `isError`，错误文本不保证是 JSON；`content` 也不应一律假设只有一个 text 块。

当前注入定义没有提供这六个工具各自的完整返回数据 schema。下文的 `schemaVersion` 和返回字段结构来自现场样本或 Tool 注释，不应扩展推断为完整输出契约。

## Project 与 Thread

### `mcp__codex_app__list_projects`

列出 ChatGPT Desktop 中可用于创建 Thread 的 Project。

```ts
// ChatGPT Desktop 原始调用；入参必须是空对象，不支持筛选参数。
const output = await tools.mcp__codex_app__list_projects({});
if (output.isError) {
  throw new Error("list_projects 返回工具错误，请检查 output.content");
}

// 以下是调用方对当前实测传输格式的解析，不是对原生 Tool 的包装或修改。
const textBlocks = output.content.filter((block) => block.type === "text");
if (textBlocks.length !== 1) {
  throw new Error("list_projects 返回格式与当前验证样本不同，请检查 output.content");
}
const result: ListProjectsResult<Project> = JSON.parse(textBlocks[0].text);
// 上面的类型注解不执行运行时 schema 校验。
// 创建 Project Thread 时，使用 result.projects 中目标 Project 的 projectId。
```

现场返回数据仍为 `schemaVersion: 2`。现有 `Project` 类型与本次样本一致，未发现该数据 schema 的变化。

类型见 [`references/types.d.ts`](references/types.d.ts)。

### `mcp__codex_app__create_thread`

在指定的本地 Project 中创建 Thread，并用 `prompt` 启动首次执行。

当前项目强制直接使用 Project 原始目录：`target.environment` 必须传 `{ type: "local" }`，不得使用 worktree。此要求是当前项目规范，不是对 ChatGPT Desktop 原生 Tool 的重新定义。

```ts
const output = await tools.mcp__codex_app__create_thread({
  title,
  prompt,
  target: {
    type: "project",
    projectId,
    environment: { type: "local" },
  },
});
```

当前完整入参定义为 `CreateThreadArgs`，上述项目示例使用其 `CreateLocalProjectThreadArgs` 子集。字段如下：

| 字段 | 当前接口格式 |
| --- | --- |
| `prompt` | 必填，`string` |
| `target` | 必填，为下表中的联合类型 |
| `title` | 可选，`string` |
| `model` | 可选，`string`；仅用户明确指定模型时传入，云端目标省略 |
| `thinking` | 可选，`Thinking` 联合类型；需符合所选模型，云端目标省略 |

| `target.type` | 对应字段 |
| --- | --- |
| `project` | 必填 `projectId: string` 和 `environment`；`environment.type` 为 `local` 或 `worktree` |
| `projectless` | 可选 `directoryName: string` |
| `chatgptWorkCloud` | 可选 `projectId: string` |

`environment.type: "worktree"` 分支还可传 `startingState`，其完整联合类型见类型文件。`projectId` 和 `environment` 只在 `target.type: "project"` 时必填。`environment: { type: "local" }` 表示直接使用 Project 原始目录；当前项目继续按上面的 local 示例调用。

每个供本方法使用的 Project 必须有且只有一个 Git repo。该方法不能选择 Project 内的具体 repo；不同 repo 应分别配置为独立 Project。

工具调用不等待 Thread 执行完成。按当前 Tool 注释，解读返回数据时需区分：就绪结果返回 `threadId` 和 `hostId`；初始化中的结果可能返回 `clientThreadId`。`clientThreadId` 不能传给要求 `threadId` 的工具。

返回值本身为 `CallToolResult`，不是直接返回上述 ID 对象。本次未执行创建操作，未验证创建结果的传输数据结构，因此类型文件不定义其返回数据 schema，也不将 `threadId` 和 `hostId: "local"` 声明为所有成功结果的固定结构。

类型见 [`references/types.d.ts`](references/types.d.ts)。

## Thread 操作

### `mcp__codex_app__list_threads`

列出已有 Thread，包括状态、所属 Project 和摘要。

入参全部可选，允许传 `{}`：

| 字段 | 类型与适用范围 |
| --- | --- |
| `mode` | `"recent"` 或 `"history"`，默认 `recent` |
| `limit` | `number`，最多 50；recent 模式另外完整返回置顶项 |
| `source` | `"codex"` 或 `"chatgpt"`，仅 history 模式使用，默认 `codex` |
| `hostId` | `string`，仅 history 模式的 Codex 来源使用；ChatGPT 来源省略 |
| `archived` | `boolean`，仅 history 模式使用，默认 `false` |
| `cursor` | `string`，仅 history 模式使用；沿用相同来源、host 和归档条件下返回的 `nextCursor` |

本次实测 `{ limit: 1 }` 的返回数据为 `schemaVersion: 4`，包含 `pinnedThreads`、`threads`、`sidebarPreferences`、`unavailableHosts` 和 `unavailableSources` 等字段；Thread 条目的标识字段是 `id`。history 模式的 Tool 注释另说明会返回 `nextCursor`，本次未验证该模式的数据结构。

### `mcp__codex_app__read_thread`

只读查看指定 Thread 的近期对话、执行状态和工具输出。

| 字段 | 类型与含义 |
| --- | --- |
| `threadId` | 必填，`string` |
| `hostId` | 可选，`string` |
| `cursor` | 可选，`string`，读取更早内容的分页游标 |
| `turnLimit` | 可选，`number`，最多返回的 turn 数 |
| `includeOutputs` | 可选，`boolean`，是否包含截断后的工具或命令输出 |
| `maxOutputCharsPerItem` | 可选，`number`，每项输出、参数预览或消息的字符限制 |

本次实测返回数据为 `schemaVersion: 1`，包含 `thread`、`page`、`turns`；分页信息位于 `page`，包括 `nextCursor` 和 `hasMore`。这与 `list_threads` 的顶层 `nextCursor` 分页说明属于不同数据结构。

### `mcp__codex_app__send_message_to_thread`

向已有 Thread 发送新的 Prompt，使其继续执行。

| 字段 | 类型与含义 |
| --- | --- |
| `threadId` | 必填，`string` |
| `prompt` | 必填，`string` |
| `hostId` | 可选，`string` |
| `model` | 可选，`string`，仅覆盖 Codex Thread 的模型设置 |
| `thinking` | 可选，`Thinking` 联合类型，仅覆盖 Codex Thread 的推理设置 |

省略 `model` 和 `thinking` 时沿用目标 Thread 的设置。本次未调用该工具，未验证其成功返回数据结构。

### `mcp__codex_app__wait_threads`

等待一个或多个 Thread。任一目标完成或需要处理时返回；超时时返回各目标当时的简要进度，不等待全部目标完成。

| 字段 | 类型与含义 |
| --- | --- |
| `targets` | 必填，目标数组，最多 8 个 Codex Thread |
| `targets[].threadId` | 必填，`string` |
| `targets[].hostId` | 可选，`string` |
| `targets[].afterCursor` | 可选，`string`，使用上次等待返回的游标 |
| `timeoutMs` | 可选，`number`，默认 120000；`0` 表示获取即时快照 |

当前 Tool 注释说明各目标的失败信息通过返回数据中的 `errors` 提供。本次没有取得成功返回样本，不定义完整返回数据 schema。

以上四个 Thread 工具的当前入参类型也收录在 [`references/types.d.ts`](references/types.d.ts)；出参统一先按前述 `CallToolResult` 检查和解析。
