---
name: workshop
description: 初始化一次澄清：在指定 Vision Id 目录下创建 Index.md、TASK-001.md、TASK-002.md 并停止。
---

# workshop · 初始化澄清工作流

## 目的

本工作流只负责初始化一次全新的文件化澄清。它把用户当前要澄清的目标落到指定 Vision Id 目录的 `Index.md`，并创建固定的首轮任务文件 `TASK-001.md` 和 `TASK-002.md`。

workshop 只负责初始化，不参与澄清过程，不执行任何 `TASK`，也不在 `TASK` 执行后继续处理。

## Vision Id 边界

Vision Id 是 `.context/` 下的一级目录名，例如 `LSTD-48`。当前 Vision 目录为 `.context/<Vision Id>/`。

workshop 是初始化入口，尚未有当前 TASK 可用于推导 Vision Id。因此执行 workshop 前，用户必须明确指定 Vision Id 或目标 Vision 目录，例如 `.context/LSTD-48/`。

所有初始化产物和路径替换都必须限制在当前 Vision 目录内。不得跨 Vision Id 读取或写入，不得向 `.context/` 根目录写入 `TASK`、`C`、`WORKSHOP` 或 `.done`。

## 编号格式

所有 `TASK`、`C`、`WORKSHOP` 序列文件名必须使用三位数字零补齐格式：`TASK-001.md`、`C-001.md`、`WORKSHOP-001.md`。

不得创建 `TASK-1.md`、`C-1.md`、`WORKSHOP-1.md`、`TASK-01.md`、`C-01.md`、`WORKSHOP-01.md` 等非规范文件。

## 固定编号策略

workshop 只初始化全新的讨论目录，固定创建 `TASK-001.md` 和 `TASK-002.md`，不计算续编编号。

- 如果当前 Vision 目录已存在 `Index.md`、`TASK-*`、`C-*`、`WORKSHOP-*` 或 `.done/`，说明这不是全新初始化场景，workshop 必须停止，不得续编、覆盖或合并。
- 后续是否继续讨论、创建新任务或结束，不属于 workshop 职责。

## 固定产物

一次初始化的固定产物是：

- `.context/<Vision Id>/Index.md`
- `.context/<Vision Id>/TASK-001.md`
- `.context/<Vision Id>/TASK-002.md`

workshop 初始化时不创建 `WORKSHOP-*.md`。`WORKSHOP-*.md` 是澄清过程或结束总结产物，由后续 checkpoint 工作流在当前 Vision 目录内生成。

## 固定模板

workshop 必须使用以下固定模板创建任务文件：

- `.agents/workflows/workshop/templates/TASK-001.md`
- `.agents/workflows/workshop/templates/TASK-002.md`

模板定义了任务的内容结构。workshop 不临场生成、改写、补充或解释任务结构，但必须在复制时调整编号与当前 Vision 目录路径。

## Workshop 规则

workshop 的全部可用规则统一维护在：

- `.agents/workflows/workshop/references/rules.md`

规则应保持精简，不拆分到其他文件。默认启用规则必须写入首轮分析任务模板内容中，使初始化后的分析任务可以独立执行，不依赖读取外部规则文件。

规则块只写入 `.agents/workflows/workshop/templates/TASK-001.md`，位置固定在标题元信息之后、`## 背景` 之前。`TASK-002.md` 是 pilot 收束任务，不写入 workshop 规则块。

如果未来调整默认启用规则，必须同步更新：

- `.agents/workflows/workshop/references/rules.md`
- `.agents/workflows/workshop/templates/TASK-001.md`

## 执行步骤

### 步骤 1：准备当前 Vision 目录

确认用户已明确指定 Vision Id 或目标 Vision 目录。确认 `.context/<Vision Id>/` 目录存在；如果不存在，先创建。

### 步骤 2：确认全新初始化状态

检查当前 Vision 目录内是否已经存在 `Index.md`、`TASK-*`、`C-*`、`WORKSHOP-*` 或 `.done/`。

- 若不存在，继续初始化。
- 若存在，立即停止；不得计算新编号，不得续编任务，不得覆盖已有讨论产物。

### 步骤 3：写入 `Index.md`

创建 `.context/<Vision Id>/Index.md`，记录当前讨论主题、原始目标、用户约束和已知背景。

### 步骤 4：创建 `TASK-001.md`（目标澄清）

1. 读取模板 `.agents/workflows/workshop/templates/TASK-001.md`
2. 写入 `.context/<Vision Id>/TASK-001.md`，写入时做以下调整：
   - 输入路径中的 `.context/<Vision Id>/Index.md` → 当前 Vision 目录下的实际 `Index.md`
   - 其余内容保持模板结构不变
3. 模板中的目标澄清结构、Workshop 规则、任务目标、约束等结构不得修改

### 步骤 5：创建 `TASK-002.md`（Pilot 收束）

1. 读取模板 `.agents/workflows/workshop/templates/TASK-002.md`
2. 写入 `.context/<Vision Id>/TASK-002.md`，写入时做以下调整：
   - 输入路径中的 `.context/<Vision Id>/Index.md` → 当前 Vision 目录下的实际 `Index.md`
   - 其余内容保持模板结构不变
3. 模板中 Pilot 的判断逻辑、约束、停止条件、下一轮 TASK 生成规则等结构不得修改

### 步骤 6：停止

创建上述初始化产物后，workshop 必须立即停止。

## 允许的调整

复制模板时，仅允许以下当前 Vision 目录路径相关的替换：

- `.context/<Vision Id>/` → 当前 Vision 目录

**禁止**：
- 增删任务目标条目
- 修改约束条款
- 修改 Workshop 规则条款
- 根据当前目标改写任务结构
- 追加说明性文字

## 禁止事项

- 不执行 `TASK-001.md` 或 `TASK-002.md`。
- 不等待或检查任何任务执行结果。
- 不在聊天中替代文件化任务产物。
- 不参与澄清循环。
- 不创建 `WORKSHOP-*.md`。
- 不创建 `.done/`。
- 不扫描已有 `C-NNN.md` 计算续编编号。
- 不在已有讨论产物的 Vision 目录中续编或覆盖初始化任务。
- 不使用一位或两位数字编号创建 `TASK`、`C` 或 `WORKSHOP` 文件。
