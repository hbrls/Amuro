# Lead 0002 - 数学习题部署与呈现功能 - Index

## Current State

`investigating_existing_kanban_capability`

## Goal

建立一个可以部署和呈现数学习题的功能。

## Account

AKS

## Lead

`0002`

## Source Signal

aks 的 kanban 可能已经实现了部分功能。

## Current Objective

确认 AKS kanban 中已有能力、缺口和可复用部分，把目标推进成可执行功能交付范围。

## Waiting On

能访问或说明 AKS kanban 现有实现的人。

## Required Context

- AKS kanban 的代码仓库、文档或访问入口
- 已实现的部分功能是什么
- 数学习题的数据来源和格式
- “部署”的含义：部署题目内容、部署功能服务、还是发布到某个学习端
- “呈现”的目标端：Web、App、嵌入页、课堂屏幕或管理后台
- 题目类型：选择题、填空题、解答题、公式题、交互题
- 是否需要 LaTeX / MathJax / KaTeX 渲染
- 是否需要答案、解析、评分或批改
- 是否需要学生作答记录
- 是否需要权限、班级、作业或题单
- 验收标准和 deadline

## Next Follow-up

见 `followups.md` 的 `FUP-001`。

## Exit Conditions

### Move to Plan

满足以下条件后转入执行 Plan：

- AKS kanban 现有实现已定位
- 可复用功能和缺口已明确
- 题目数据结构已明确
- 部署目标和呈现目标已明确
- 最小验收路径已明确

### Move to Blocked

如果无法访问 AKS kanban，或没有人能说明既有实现，则进入 `blocked_waiting_for_existing_system_context`。

### Move to Deal Tracking

如果该功能进入对外交付、商业承诺、客户验收或排期承诺，再单独进入后续 deal 跟踪。

## Confidence

**Score**: —
**Trend**: —
**Reasoning**: 正在调查 AKS kanban 现有能力，等待系统上下文。

## Confidence History

| Date | Score | Delta | Trigger |
|------|-------|-------|---------|
| — | — | — | 尚未开始有效评估 |

## Stage History

| Date | From | To | Rationale |
|------|------|----|-----------|
| 2026-05-27 | — | investigating_existing_kanban_capability | lead 创建，开始调查现有能力 |
