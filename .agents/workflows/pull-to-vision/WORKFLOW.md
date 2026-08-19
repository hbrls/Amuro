---
name: pull-to-vision
description: 从 Backstage Scrum 领取一个尚未清晰的 Vision 任务，并在任务指定的项目中初始化对应的 Codex Task。
---

首先，阅读并掌握 `find_project_by_name` 和 `project_start_thread` 方法：[HANDBOOK.md](.agents/handbooks/wrapped-codex-app-tools/HANDBOOK.md)

调用命令 `backstage scrum pull-task --vision` 领取一个 Vision 任务。返回值映射：
- `task.workspace` -> project
- `task.name` -> threadTitle
- `task.context` -> originalTaskPrompt

`task.context` 是上游提交的原始 Vision 内容，质量和完整度不保证。Vision 类任务
默认处于尚未清晰、需要深入分析的状态。不能把它直接当作可执行的实现任务，也
不能因为其中出现“实现”“完成”“落地”等措辞就修改代码或收敛到单一方案。

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
你正在处理一个由外部任务系统提交的原始 Vision。Vision 类任务默认尚未清晰，
当前目标不是立即实现，而是通过深入分析，把模糊想法推进为有事实依据、边界
明确、便于继续决策的方向。原始 Vision 的质量和完整度不保证；不要因为其中
出现“实现”“完成”“落地”等词就修改代码或提前承诺方案。

本轮只能进行只读调查、分析和讨论。可以阅读仓库、文档、配置、历史信息及其他
可用的只读资料，也可以执行不会改变状态的检查；不得修改仓库，不得创建实现
文件，不得调用会造成外部状态变化的操作。分析应尽量利用可以自行确认的事实，
不要把本可调查的问题直接抛回给用户，也不要用猜测替代缺失事实或用户决策。

先理解原始 Vision 和所在项目，再围绕以下方面展开深入分析：
- 原始诉求背后的对象、用户、场景、动机和期望结果；
- 当前状态、已有能力、相关模块、历史约束和可复用基础；
- 已确认事实、合理推断、关键假设和未知信息，并清楚区分它们；
- 真正需要解决的问题、问题边界、非目标，以及可能被混在一起的不同问题；
- 候选方向及其收益、代价、风险、依赖、可逆性和适用条件；
- 影响方向选择但必须由用户或任务发起方确认的目标、范围、优先级和取舍；
- 后续进入规划或实现前应满足的就绪条件，以及验证方向是否有效的信号。

不要为了显得完整而虚构上下文，也不要过早把 Vision 压缩成需求列表、技术方案
或实施计划。遇到多个合理解释时，应显式呈现分歧及其影响；可以给出有条件的
倾向或推荐，但必须说明依据，并保留需要用户决定的部分。

最终输出一份结构清晰的 Vision Brief，至少包含：
- Current understanding：当前对目标、用户和场景的理解；
- Evidence：从原始 Vision、仓库或其他只读资料确认的关键事实及来源；
- Problem framing：核心问题、边界、非目标及问题之间的关系；
- Assumptions and unknowns：假设、未知事实及其影响；
- Candidate directions：候选方向、关键取舍和适用条件；
- Recommended focus：当前建议优先深入的方向及理由，不把建议冒充既定决策；
- Decisions needed：需要用户或任务发起方确认的少量关键决策；
- Readiness and next step：当前是否足以进入规划或实现，以及下一步最有效的动作。

输出深度应与 Vision 的复杂度匹配。问题宽泛时先建立结构和优先级，问题具体时
深入关键约束与取舍；不要用泛泛而谈的行业常识代替对当前项目的分析。
```

固定收束规则：

```text
现在已经读完原始 Vision。再次确认：本轮是 Vision 分析，不是实现任务。只做
只读调查并交付 Vision Brief；不要修改仓库、创建实现文件或执行其他状态变更。
凡是证据不足或需要用户取舍的内容，都明确标记为未知、假设或待决策项。
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
