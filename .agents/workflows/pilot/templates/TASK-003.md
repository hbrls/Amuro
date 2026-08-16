# TASK-003 · 结束收束任务模板

> WORKFLOW：`.agents/workflows/checkpoint/WORKFLOW.md`
> 主题：`{{TOPIC}}`

## 背景

本任务由 pilot 在确认讨论可以结束后创建，用于标记讨论结束状态。

本模板编号表示相对顺序。落地时，若当前 pilot TASK 编号为 `NNN`，本模板应生成当前 Vision 目录内的 `TASK-(NNN+1).md`。

## 输入

- `{{PILOT_C_OUTPUT}}`

## 目标

结束当前讨论循环。调用 checkpoint 工作流：
1. 先基于本轮产出生成当前 Vision 目录内的 `WORKSHOP-NNN.md` 总结
2. 再创建当前 Vision 目录内的 `.done/` 目录作为讨论结束标记

## 约束

- 不读取额外文件
- 不创建、修改或删除 checkpoint 工作流授权范围以外的任何文件
- 不读取或写入其他 Vision Id 目录
- 不启动新的讨论循环

## 输出

checkpoint 工作流将先后产出：
1. `.context/<Vision Id>/WORKSHOP-NNN.md`：本轮讨论总结
2. `.context/<Vision Id>/.done/`：讨论结束标记
