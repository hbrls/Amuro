---
name: manage-leads
description: "管理 Amuro Lead 生命周期和文件化 Lead 状态"
---

## 适用范围

当任务涉及创建、更新、复盘或跟进 Amuro Lead 时，使用本 skill。

Lead 是 `leads/` 下的一个具体机会或推进对象。

不要用本 skill 处理一般性的 Amuro 哲学、assistant 协作规则，或已经进入交付阶段的 deal tracking。

## 存储约定

Lead 使用数字编号目录存储：

```text
leads/0001/
leads/0002/
leads/0003/
```

规则：

- 通过检查现有 `leads/` 目录来使用下一个数字 ID。
- 不使用 `hicash-tongdun-sdk` 这类语义 slug。
- 不使用 `rooms`。
- 单个交付物不要创建 `artifacts/`。
- 直接有用的文件放在 Lead 根目录。
- 只有当 Lead 进入交付或 deal-tracking 阶段，且额外结构有明确产品理由时，才引入子目录。

## 默认 Lead 文件

一个新的 Lead 通常包含：

```text
leads/NNNN/Index.md
leads/NNNN/events.md
leads/NNNN/followups.md
leads/NNNN/blockers.md
leads/NNNN/<specific-checklist>.md
```

checklist 文件名应该描述具体工作，例如：

```text
integration-checklist.md
implementation-checklist.md
reuse-audit.md
```

## `Index.md`

`Index.md` 是 Lead 当前事实的压缩表示。

把 `Index.md` 作为快速理解和优先级判断时的第一阅读文件。
当任务只是获得全局视图或比较 Leads 时，只读取各 Lead 的 `Index.md`。
只有在进入深入分析、更新 Lead 或设计执行任务时，才读取该 Lead 的全部文件。

它应该包含：

- Current State
- Goal
- Account
- Lead ID
- Source Signal
- Current Objective
- Waiting On
- Required Context
- Next Follow-up
- Exit Conditions

使用具体状态，不使用模糊进度词。

示例：

```text
waiting_for_required_context
investigating_existing_kanban_capability
blocked_waiting_for_existing_system_context
ready_to_plan
in_plan
closed_dead
```

## `events.md`

`events.md` 是 append-only 的历史记录。

记录发生了什么、何时发生、来源是什么、产生了什么状态变化。

不要把历史重写成一份新的分析。

## `followups.md`

`followups.md` 存储真实的 follow-up 动作。

一个 follow-up 必须包含：

- Status
- Target
- Purpose
- Expected Reply
- Message
- No-reply fallback，如果相关

follow-up 不是建议。它是一条可以发送、分派、排期或执行的具体推进动作。

## `blockers.md`

`blockers.md` 存储当前活跃 blocker。

增量更新 blocker：

- 出现新的不确定性时添加 blocker。
- 收到信息后移除对应 blocker。
- 把模糊 blocker 拆成具体缺失事实。
- 不要把已经解决的 blocker 保留为活跃 blocker。

## Checklist 文件

当 checklist 能让 Lead 更可执行时，可以创建 checklist 文件。

checklist 用于具体执行准备，不用于投机式文档。

如果只有一个 checklist，把它放在 Lead 根目录。

## Lead 操作循环

收到一个新的 Lead 时：

1. 检查现有 Lead ID。
2. 创建下一个数字编号 Lead 目录。
3. 在 `events.md` 记录原始信号。
4. 在 `Index.md` 写入当前事实和缺失上下文。
5. 在 `followups.md` 写入下一条具体触达。
6. 在 `blockers.md` 写入当前活跃缺失事实。
7. 只有当 checklist 能让 Lead 更可执行时，才添加具体 checklist。

收到已有 Lead 的新信息时：

1. 追加 event。
2. 更新状态。
3. 解决或新增 blocker。
4. 更新下一条 follow-up。
5. 只有当执行准备度发生变化时，才更新 checklist。

## 优先级选择与任务生成循环

当需要选择最值得跟进的 Lead 时：

1. 读取所有 `leads/*/Index.md`，获得全局视图。
2. 基于紧迫性、商业价值、可解锁性、证据和下一步动作清晰度，选出最值得跟进的前三个 Lead。
3. 读取这三个 Lead 的全部文件。
4. 选出唯一一个最值得推进的 Lead。
5. 对该 Lead 再次深入分析。
6. 将详细执行任务写入 `.context/LEAD-NNNN.md`。

永远不要执行该任务。

本 Agent 只负责识别、拆解和跟进 Leads：

- 识别最高价值 Lead 和活跃 blocker
- 把下一条可执行任务拆解到 `.context/LEAD-NNNN.md`
- 根据新进展更新 Lead 文件

另一个 Agent 会读取 `.context/LEAD-NNNN.md` 并执行。

## 任务单格式

`.context/LEAD-NNNN.md` 是任务单，不是选择过程报告。

它应该让被选中的任务可以立即执行：

- 最上面写明执行 Agent 必须遵守的规则
- 写清楚具体要做什么
- 写清楚怎么做
- 写入被选中的 Lead record 路径，例如 `leads/0002/`
- 说明 `.context/LEAD-NNNN.md` 编号不需要和 Lead ID 对应
- 选择理由保持简短；选择只是为了专注一个 Lead
- 告知执行 Agent 把进展、收获、回复、会议记录和 follow-up 结果写回被选中的 Lead record

使用 “Lead record”、“follow-up record”、“event log” 或 “meeting notes”，不要使用 “original text”。

## 异步协作循环

Lead 任务通过异步协作循环推进。

每个执行 Agent 只做一轮有边界的工作循环：

1. 选择最靠前且可处理的 `.context/LEAD-NNNN.md`。
2. 解析其中选中的 Lead record 路径。
3. 如果 `leads/NNNN/.locked/` 已存在，跳过该 Lead 并退出，或选择另一个可处理任务。
4. 创建 `leads/NNNN/.locked/`。
5. 读取 Lead record。
6. 如果可以推进，就推进一个具体步骤。
7. 如果被阻塞，把问题、blocker 或所需反馈写入 Lead record。
8. 删除 `leads/NNNN/.locked/`。
9. 退出。

下一个 Agent、cron 轮次或人工可以从 Lead record 继续。

不要期待单个执行 Agent 在一次运行里完成探索性、创造性或依赖外部互动的 Lead 工作。

## Lead 本地锁

锁是被保护 Lead record 内名为 `.locked/` 的目录：

```text
leads/NNNN/.locked/
```

例如，目标为 `leads/0002/` 的任务必须锁定：

```text
leads/0002/.locked/
```

不要用集中式 `.context/.locks/` 目录来保护 Lead 写入。

理由：

- 被保护的资源是 Lead record，不是 `.context` 任务单。
- 多个 `.context/LEAD-NNNN.md` 可能指向同一个 Lead。
- 把锁放在 Lead record 内，可以让所有权和人工检查保持局部化。

最小锁规则：

- 为了优先级判断读取 `Index.md` 不需要锁。
- 写入 `leads/NNNN/` 下任何文件前，必须先创建 `leads/NNNN/.locked/`。
- `.locked/` 不需要任何 metadata。
- 如果 `.locked/` 已存在，不要写入该 Lead。
- 无论本轮成功还是被阻塞，退出前都要删除 `.locked/`。
- 如果 Agent 无法删除 `.locked/`，停止并暴露问题，不要继续。

`.context/` 下的任务单必须使用以下命名规范：

```text
.context/LEAD-0001.md
.context/LEAD-0002.md
.context/LEAD-0003.md
```

通过检查现有 `.context/LEAD-*.md` 文件，并在最大编号上加一来使用下一个编号。

## 既有能力声明

如果用户说某个既有系统可能已经实现了 Lead 的一部分，不要直接进入实现。

把 Lead 状态设置为调查状态，例如：

```text
investigating_existing_kanban_capability
```

第一条 follow-up 应该定位：

- repository、product area、owner 或 access point
- 已实现能力
- 可复用部分
- 缺口
- 数据模型
- 验收路径

## 响应格式

落地 Lead 变更后，按以下格式响应：

```text
# Landed Lead Change

- Files changed:
- Lead objects updated:
- Current state:
- Next follow-up:
- Remaining blocker:
```
