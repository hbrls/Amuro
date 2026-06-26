# TASK-002 · Pilot 收束

> 视角：pilot
> 主题：以 `.context/<Vision Id>/Index.md` 为准

## 背景

当前讨论主题、原始目标、用户约束和已知背景记录在 `.context/<Vision Id>/Index.md`。

执行本任务时，需要基于当前目标以及当前 Vision 目录下已存在的输出文件进行 pilot 视角判断。

## 输入

读取以下文件：
- `.context/<Vision Id>/Index.md`
- `.context/<Vision Id>/C-*.md`

## 判断

1. 已有任务产出是否充分回应了 `.context/<Vision Id>/Index.md` 中的当前目标？
2. 当前讨论是否已经形成足够清晰、可执行、可交付的结论？
3. 是否仍有关键未决问题需要继续澄清？
4. 如果需要继续，下一轮最有价值的 `TASK-*` 应该调用哪个 LENS、围绕什么问题产出增量？

## 约束

- 只读取本任务输入中列出的文件
- 不读取其它 `TASK-*`
- 不读取或写入其他 Vision Id 目录
- 不把当前 LENS 列为输入
- 不执行非本任务要求的代码或业务文件变更
- 除本任务输出、当前 Vision 目录内的下一轮 `TASK-*` 外，不创建、修改或删除其他文件

## 输出

将完整协调分析写入与当前任务编号对应的 `.context/<Vision Id>/C-NNN.md`。

如果判断讨论应该结束，基于 TASK-003 模板创建 `TASK-(NNN+1).md`，该任务指定调用 checkpoint 工作流（`.agents/workflows/checkpoint/WORKFLOW.md`）。不要同时创建 TASK-(NNN+2).md。

如果判断讨论仍需继续，必须同时创建两份 TASK：
- `.context/<Vision Id>/TASK-(NNN+1).md`：选定的 LENS 任务，在其中明确调用的 LENS、输入文件、推进问题、期望增量、输出路径
- `.context/<Vision Id>/TASK-(NNN+2).md`：配套的 pilot 收束任务，用于在该 LENS 完成后进行收束
