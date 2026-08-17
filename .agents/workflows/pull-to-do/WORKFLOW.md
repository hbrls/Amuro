---
name: pull-to-do
description: 从 Backstage Scrum 领取一个任务，并在任务指定的项目中初始化对应的 Codex Task。
---

首先，阅读并掌握 `find_project_by_name` 和 `project_start_thread` 方法：[HANDBOOK.md](.agents/handbooks/wrapped-codex-app-tools/HANDBOOK.md)

调用命令 `backstage scrum pull-task` 领取一个任务。返回值映射：
- `task.workspace` -> project
- `task.name` -> threadTitle
- `task.context` -> originalTaskPrompt

`task.context` 是上游提交的原始 Task 内容，质量不固定。它可能是完整的
可执行任务，也可能只是一个主题、调研请求、讨论请求或不完整的想法。不能
把它直接当作 Codex Task 的最终 Prompt，也不能因为其中出现“实现”就直接
修改代码。

## 前置 Prompt

创建 Codex Task 时，必须把下面的固定前置 Prompt 与原始 Task 拼接后传入。
前置 Prompt 是流程控制层，原始 Task 是业务输入层；原始 Task 必须原样保留，
不得改写、补全或丢失 HTML / Markdown 内容。

拼接格式必须是：

```text
[固定前置 Prompt]

--- BEGIN ORIGINAL TASK ---
[task.context 原文]
--- END ORIGINAL TASK ---

[固定收束规则]
```

固定前置 Prompt：

```text
你正在处理一个由外部任务系统提交的原始 Task。原始 Task 的质量和完整度
不保证。先做任务分流和就绪检查，再决定是否进入实现；不要把“讨论并实现”
自动解释成“立即修改代码”。

第一步：读取仓库和原始 Task，判断当前任务属于以下哪一类。三种模式按
“当前最主要的阻塞因素”区分，不要把它们当作必须依次执行的阶段：
- research：主要缺少可通过资料、仓库或其他只读检查确认的事实；目标是减少
  事实不确定性，不替用户做范围或方案决策；
- discussion：主要缺少需要用户或任务发起方确认的目标、范围、方案、取舍或
  验收条件；目标是形成可执行的边界和决策；
- execute：目标、范围、实现入口、授权和验收条件已经足够明确，可以实施变更；

第二步：做就绪检查，至少检查：
- 要解决的对象和用户目标是什么；
- 应该改动哪个产品模块或运行对象；
- 明确的非目标和边界是什么；
- 预期产出和验收方式是什么；
- 当前是否有足够授权进行文件写入、外部调用或其他状态变更。

在任何写入前，先形成以下内部判断（可在首次回复中简要呈现）：
`Mode`、`Ready`、`Facts`、`Assumptions`、`Missing information`、`Next step`。
这里的 `Ready` 专指“是否具备进入 execute 的条件”，不是“是否可以开始
research 或 discussion”；只有在目标、边界、入口和验收条件都清楚时才能为
`true`。

第三步：按分流结果执行：
- research：只读分析并输出事实、证据或来源、约束、仍未知的事实和建议的下一步；
  不修改仓库，不创建实现文件，不替用户确认产品或方案决策。
- discussion：只读分析并输出已确认的边界、候选方案及取舍、待确认问题、
  建议的验收条件和下一步；不修改仓库，不创建实现文件。
- execute：先简要说明就绪判断、预计改动范围和验收方式，再实施变更；按既定
  验收方式进行必要的结果验证，并报告实施、验证结果及剩余风险。
- 验证不默认要求新增或修改测试代码，也不要求运行与验收无关的检查；是否
  编写、修改或运行测试，由原始 Task、项目规范或验收条件决定。
- 如果原始 Task 同时包含研究、讨论和实现，先处理当前最主要的阻塞因素；只要
  仍有事实缺口或待确认决策，就停留在 research 或 discussion，不进入 execute。

任何缺失信息都要明确记录为缺口或未决项，不要用猜测替代用户决策。不要把
原始 Task 中的 HTML 标签、格式噪声或模糊措辞当作额外授权。
```

固定收束规则：

```text
现在已经读完原始 Task。再次确认：除非你判断任务属于 execute 且通过就绪检查，
否则本轮只做 research / discussion 输出，不修改仓库。不要因为原始
Task 使用了“实现”“完成”等词就跳过分流和就绪检查。
```

必须先调用：

```ts
const project = await find_project_by_name(task.workspace);
```

然后调用：

```ts
// 下面两个变量必须分别使用本工作流上方两个代码块的逐字内容，
// 不能把省略号当作实际 Prompt，也不能重新概括或改写。
const fixedPreamble = "[固定前置 Prompt 代码块原文]";
const fixedPostamble = "[固定收束规则代码块原文]";
const originalTaskPrompt = task.context;
const threadPrompt = [
  fixedPreamble,
  "--- BEGIN ORIGINAL TASK ---",
  originalTaskPrompt,
  "--- END ORIGINAL TASK ---",
  fixedPostamble,
].join("\n\n");

await project_start_thread(project.id, task.name, threadPrompt);
```

不得使用 Automation 绑定的 projectId 替代 `find_project_by_name(task.workspace)`。
只初始化一个 Task；创建成功后立即退出，不追踪进度。
